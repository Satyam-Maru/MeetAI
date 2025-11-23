import express from 'express';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import { verifyToken } from '../middleware/verifyToken.js';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import nodemailer from 'nodemailer';

const router = express.Router();
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Nodemailer transporter setup
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const createVerificationEmailHTML = (code) => {
  return `
    <div style="font-family: Arial, sans-serif; text-align: center; color: #333; padding: 20px;">
      <div style="max-width: 600px; margin: auto; border: 1px solid #e0e0e0; border-radius: 10px; padding: 40px; background-color: #ffffff; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
        <h2 style="color: #1e1e1e; font-size: 24px;">MeetAI Email Verification</h2>
        <p style="color: #555; font-size: 16px;">
          Welcome to MeetAI! Please use the following code to complete your registration.
        </p>
        <div style="margin: 30px 0;">
          <span style="display: inline-block; font-size: 36px; font-weight: bold; letter-spacing: 10px; color: #fff; background-color: #2a2a2a; padding: 15px 30px; border-radius: 8px;">
            ${code}
          </span>
        </div>
        <p style="color: #777; font-size: 14px;">
          This code will expire in 10 minutes. If you did not request this, please ignore this email.
        </p>
      </div>
    </div>
  `;
};

const createPasswordResetEmailHTML = (code) => {
  return `
    <div style="font-family: Arial, sans-serif; text-align: center; color: #333; padding: 20px;">
      <div style="max-width: 600px; margin: auto; border: 1px solid #e0e0e0; border-radius: 10px; padding: 40px; background-color: #ffffff; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
        <h2 style="color: #1e1e1e; font-size: 24px;">MeetAI Password Reset</h2>
        <p style="color: #555; font-size: 16px;">
          You requested a password reset. Use the following code to reset your password.
        </p>
        <div style="margin: 30px 0;">
          <span style="display: inline-block; font-size: 36px; font-weight: bold; letter-spacing: 10px; color: #fff; background-color: #2a2a2a; padding: 15px 30px; border-radius: 8px;">
            ${code}
          </span>
        </div>
        <p style="color: #777; font-size: 14px;">
          This code will expire in 10 minutes. If you did not request this, please ignore this email.
        </p>
      </div>
    </div>
  `;
};

router.get('/profile', verifyToken, (req, res) => {
  res.json({ user: req.user, success: true });
});

/**
 * Handles Google OAuth login.
 * Caches essential, non-sensitive user data in Redis upon successful authentication.
 */
router.post('/login', async (req, res) => {
  try {
    const { token } = req.body;
    const redis = req.app.get('redis');

    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();

    if (!payload || !payload.email) {
      console.error('Google auth error: Invalid payload from token');
      return res.status(401).json({ error: 'Authentication failed: Invalid token payload' });
    }

    const userData = {
      name: payload.name,
      email: payload.email,
      isGoogleUser: true,
      photoURL: payload.picture,
    };

    await User.findOneAndUpdate(
      { email: userData.email },
      { ...userData, password: "" },
      { upsert: true, new: true }
    );


    await redis.set(`user:${userData.email}`, JSON.stringify(userData), 'EX', 60 * 60 * 12 * 7);

    const authToken = jwt.sign(userData, process.env.JWT_SECRET, {
      expiresIn: '3d',
    });

    res.json({ user: userData, token: authToken });
  } catch (error) {
    console.error('Google auth error:', error);
    res.status(401).json({ error: 'Authentication failed' });
  }
});

/**
 * Handles new user sign-up with email and password.
 * Sends a verification code to the user's email.
 */
router.post('/signup', async (req, res) => {
  try {
    const { email, password } = req.body;
    const redis = req.app.get('redis');

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Account already exists, try signing in.' });
    }

    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedPassword = await bcrypt.hash(password, 10);

    const tempUserData = {
      email,
      password: hashedPassword,
      verificationCode,
    };

    await redis.set(`temp_user:${email}`, JSON.stringify(tempUserData), 'EX', 600); // Expires in 10 minutes

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'MeetAI Email Verification',
      html: createVerificationEmailHTML(verificationCode),
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: 'Verification code sent to your email.' });
  } catch (err) {
    console.error('Error during signup:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * Verifies the 6-digit code and completes user registration.
 */
router.post('/verify', async (req, res) => {
  try {
    const { email, verificationCode } = req.body;
    const redis = req.app.get('redis');

    const tempUserDataJSON = await redis.get(`temp_user:${email}`);
    if (!tempUserDataJSON) {
      return res.status(400).json({ error: 'Verification code has expired. Please sign up again.' });
    }

    const tempUserData = JSON.parse(tempUserDataJSON);

    if (tempUserData.verificationCode !== verificationCode) {
      return res.status(400).json({ error: 'Invalid verification code.' });
    }

    const assignInitialPFP = (username) => `${process.env.CLOUDINARY_URL}/${username[0].toUpperCase()}.png`;
    const photoURL = assignInitialPFP(email.split('@')[0]);

    const newUser = new User({
      name: email.split('@')[0],
      email,
      password: tempUserData.password,
      isGoogleUser: false,
      photoURL,
    });

    await newUser.save();
    await redis.del(`temp_user:${email}`);

    const userPayload = {
      name: newUser.name,
      email: newUser.email,
      isGoogleUser: newUser.isGoogleUser,
      photoURL: newUser.photoURL,
    };

    await redis.set(`user:${email}`, JSON.stringify(userPayload), 'EX', 60 * 60 * 12 * 7 );

    const authToken = jwt.sign(userPayload, process.env.JWT_SECRET, { expiresIn: '3d' });

    res.json({ user: userPayload, token: authToken });
  } catch (err) {
    console.error('Error during verification:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/resend-verification', async (req, res) => {
  try {
    const { email } = req.body;
    const redis = req.app.get('redis');

    const tempUserDataJSON = await redis.get(`temp_user:${email}`);
    if (!tempUserDataJSON) {
      return res.status(400).json({ error: 'No pending verification for this email. Please sign up again.' });
    }

    const tempUserData = JSON.parse(tempUserDataJSON);
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    tempUserData.verificationCode = verificationCode;

    await redis.set(`temp_user:${email}`, JSON.stringify(tempUserData), 'EX', 600);

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'MeetAI Email Verification',
      html: createVerificationEmailHTML(verificationCode),
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: 'A new verification code has been sent to your email.' });
  } catch (err) {
    console.error('Error resending verification code:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const redis = req.app.get('redis');

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: 'No account found with that email address.' });
    }
    if (user.isGoogleUser) {
      return res.status(400).json({ error: 'This account uses Google Sign-In. Please log in with Google.' });
    }

    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();

    await redis.set(`reset_code:${email}`, resetCode, 'EX', 600); // Expires in 10 minutes

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'MeetAI Password Reset',
      html: createPasswordResetEmailHTML(resetCode),
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: 'Password reset code sent to your email.' });
  } catch (err) {
    console.error('Error during forgot password:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/reset-password', async (req, res) => {
  try {
    const { email, verificationCode, newPassword } = req.body;
    const redis = req.app.get('redis');

    const storedCode = await redis.get(`reset_code:${email}`);
    if (!storedCode) {
      return res.status(400).json({ error: 'Reset code has expired. Please try again.' });
    }
    if (storedCode !== verificationCode) {
      return res.status(400).json({ error: 'Invalid reset code.' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const user = await User.findOneAndUpdate({ email }, { password: hashedPassword }, { new: true });

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    await redis.del(`reset_code:${email}`);

    const userPayload = {
      name: user.name,
      email: user.email,
      isGoogleUser: user.isGoogleUser,
      photoURL: user.photoURL,
    };

    await redis.set(`user:${email}`, JSON.stringify(userPayload), 'EX', 60 * 60 * 12 * 7);

    const authToken = jwt.sign(userPayload, process.env.JWT_SECRET, { expiresIn: '3d' });

    res.json({ user: userPayload, token: authToken });
  } catch (err) {
    console.error('Error during password reset:', err);
    res.status(500).json({ error: 'Server error' });
  }
});


/**
 * Handles user sign-in with email and password, using a Redis-first approach.
 */
router.post('/signin', async (req, res) => {
  const { email, password } = req.body;

  try {
    const redis = req.app.get('redis');

    // first check if user profile is available in cache
    const cachedUserData = await redis.get(`user:${email}`);

    // handled signin with redis cache
    if (cachedUserData) {
      const userPayload = JSON.parse(cachedUserData);

      if (userPayload.isGoogleUser) {
        return res.status(400).json({ error: 'This account is registered with Google. Please use "Continue with Google".' });
      }

      const authToken = jwt.sign(userPayload, process.env.JWT_SECRET, { expiresIn: '3d' });
      console.log("********* Logged in using redis cache. **************");
      res.json({ user: userPayload, token: authToken });
    }
    else {
      // if user profile is not in cache -> check in mongodb (source of truth)
      const userFromDB = await User.findOne({ email });
      if (!userFromDB) {
        return res.status(400).json({ error: 'Invalid credentials' });
      }

      const isMatch = await userFromDB.comparePassword(password);
      if (!isMatch) {
        return res.status(400).json({ error: 'Invalid credentials' });
      }

      const userPayload = {
        name: userFromDB.name,
        email: userFromDB.email,
        isGoogleUser: userFromDB.isGoogleUser,
        photoUrl: userFromDB.photoURL
      }

      // store in redis cache 
      await redis.set(`user:${email}`, JSON.stringify(userPayload), 'EX', 60);
      
      const authToken = jwt.sign(userPayload, process.env.JWT_SECRET, { expiresIn: '3d' });
      res.json({ user: userPayload, token: authToken });
    }
  } catch (err) {
    console.error('Error during signin:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * Handles user logout by clearing the authentication cookie.
 */
router.post('/logout', (req, res) => {
  res.json({ message: 'Logged out' });
});

export default router;