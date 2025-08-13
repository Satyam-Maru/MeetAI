import express from 'express';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import { verifyToken } from '../middleware/verifyToken.js';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';

const router = express.Router();
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

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

    // --- FIX STARTS HERE ---
    // Add a check to ensure the payload from Google is valid
    if (!payload || !payload.email) {
      console.error('Google auth error: Invalid payload from token');
      return res.status(401).json({ error: 'Authentication failed: Invalid token payload' });
    }
    // --- FIX ENDS HERE ---

    const userData = {
      name: payload.name,
      email: payload.email,
      isGoogleUser: true,
      photoURL: payload.picture,
    };

    // Upsert user in MongoDB to ensure they are in the main database
    await User.findOneAndUpdate(
        { email: userData.email },
        { ...userData, password: "" }, // Ensure password is not stored for Google users
        { upsert: true, new: true }
    );


    // Cache the non-sensitive user data with the isGoogleUser flag
    await redis.set(`user:${userData.email}`, JSON.stringify(userData));

    const authToken = jwt.sign(userData, process.env.JWT_SECRET, {
      expiresIn: '3d',
    });

    // res.cookie('authToken', authToken, {
    //   httpOnly: true,
    //   secure: true,
    //   sameSite: 'None',
    //   maxAge: 3 * 24 * 60 * 60 * 1000,
    // });

    res.json({ user: userData, token: authToken });
  } catch (error) {
    console.error('Google auth error:', error);
    res.status(401).json({ error: 'Authentication failed' });
  }
});

/**
 * Handles new user sign-up with email and password.
 * Caches essential, non-sensitive user data in Redis.
 */
router.post('/signup', async (req, res) => {
  try {
    const { email, password } = req.body;
    const redis = req.app.get('redis');

    // 1. Check Redis cache first.
    const cachedUserData = await redis.get(`user:${email}`);

    // 2. Handle cache hit: User found.
    if (cachedUserData) {
      return res.status(400).json({ error: 'Account already exists, try signing in.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const assignInitialPFP = (username) => `${process.env.CLOUDINARY_URL}/${username[0].toUpperCase()}.png`;
    const photoURL = assignInitialPFP(email.split('@')[0]);

    const newUser = new User({
      name: email.split('@')[0],
      email,
      password: hashedPassword,
      isGoogleUser: false,
      photoURL,
    });

    await newUser.save();

    const userPayload = {
      name: newUser.name,
      email: newUser.email,
      isGoogleUser: newUser.isGoogleUser,
      photoURL: newUser.photoURL,
    };

    // Cache the new user's data
    await redis.set(`user:${email}`, JSON.stringify(userPayload));

    const authToken = jwt.sign(userPayload, process.env.JWT_SECRET, { expiresIn: '3d' });
    
    // res.cookie('authToken', authToken, { httpOnly: true, secure: true, sameSite: 'None', maxAge: 3 * 24 * 60 * 60 * 1000 });
    
    res.json({ user: userPayload, token: authToken });
  } catch (err) {
    console.error('Error during signup:', err);
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

    // 1. Check Redis cache first.
    const cachedUserData = await redis.get(`user:${email}`);

    // 2. Handle cache miss: User not found.
    if (!cachedUserData) {
      return res.status(404).json({ error: 'Account not found. Please sign up.' });
    }

    const userPayload = JSON.parse(cachedUserData);

    // 3. Handle cache hit: Check if it's a Google user.
    if (userPayload.isGoogleUser) {
      return res.status(400).json({ error: 'This account is registered with Google. Please use "Continue with Google".' });
    }

    // 4. For non-Google users, fetch from DB for password verification.
    const userFromDB = await User.findOne({ email });
    if (!userFromDB) {
      // Safeguard for cache/DB inconsistency
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const isMatch = await userFromDB.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // 5. Successful login, sign JWT and set cookie.
    const authToken = jwt.sign(userPayload, process.env.JWT_SECRET, { expiresIn: '3d' });
    
    // res.cookie('authToken', authToken, { httpOnly: true, secure: true, sameSite: 'None', maxAge: 3 * 24 * 60 * 60 * 1000 });
    
    res.json({ user: userPayload, token: authToken  });

  } catch (err) {
    console.error('Error during signin:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * Handles user logout by clearing the authentication cookie.
 */
router.post('/logout', (req, res) => {
  // res.clearCookie('authToken', {
  //   httpOnly: true,
  //   secure: true,
  //   sameSite: 'None',
  // });
  res.json({ message: 'Logged out' });
});

export default router;