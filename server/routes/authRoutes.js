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

router.post('/login', async (req, res) => {
  try {
    const { token } = req.body;

    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    const userData = {
      name: payload.name,
      email: payload.email,
      password: "", // Not used for Google users
      isGoogleUser: true,
      photoURL: payload.picture,
    };

    // Use findOneAndUpdate with upsert to create or update the user
    const user = await User.findOneAndUpdate(
      { email: payload.email }, // find a document with this filter
      { $set: userData }, // document to insert when nothing is found
      { new: true, upsert: true, setDefaultsOnInsert: true } // options
    );

    const authToken = jwt.sign(
      {
        _id: user._id, // It's good practice to use the user's ID
        name: user.name,
        email: user.email,
        photoURL: user.photoURL,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: '3d',
      }
    );

    res.cookie('authToken', authToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'None',
      maxAge: 3 * 24 * 60 * 60 * 1000,
    });

    res.json({ user });
  } catch (error) {
    console.error('Google auth error:', error);
    res.status(401).json({ error: 'Authentication failed' });
  }
});

router.post('/signup', async (req, res) => {
  try {
    const { email, password } = req.body;

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' })
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const assignInitialPFP = (username) => {
      const initial = username[0].toUpperCase();
      return `${process.env.CLOUDINARY_URL}/${initial}.png`;
    };

    const photoURL = assignInitialPFP(email.split('@')[0]); 

    const user = new User({
      name: email.split('@')[0],
      email,
      password: hashedPassword,
      isGoogleUser: false,
      photoURL
    });

    await user.save(); // saved to MongoDB

    const authToken = jwt.sign(
      {
        name: email.split('@')[0],
        email, photoURL
      },
      process.env.JWT_SECRET, { expiresIn: '3d' });

    res.cookie('authToken', authToken, { httpOnly: true, secure: true, sameSite: 'None', maxAge: 3 * 24 * 60 * 60 * 1000 });

    res.json({ user });
  }
  catch (err) {
    console.log('err while auth/signup: ', err);
  }
})

router.post('/signin', async (req, res) => {
  const { email, password } = req.body;

  try {
    const redis = req.app.get('redis');

    // Check Redis cache first
    const cachedUser = await redis.get(`user:${email}`);
    if (cachedUser) {
      const user = JSON.parse(cachedUser);
      const isMatch = await bcrypt.compare(password, user.password);
      if (isMatch) {
        const authToken = jwt.sign(user, process.env.JWT_SECRET, { expiresIn: '3d' });
        res.cookie('authToken', authToken, { httpOnly: true, secure: true, sameSite: 'None', maxAge: 3 * 24 * 60 * 60 * 1000 });
        return res.json({ user });
      }
    }

    // If not in cache, check the database MongoDB
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Cache the user data in Redis
    await redis.set(`user:${email}`, JSON.stringify(user), 'EX', 3 * 24 * 60 * 60);

    const authToken = jwt.sign({
      name: email.split('@')[0],
      email, photoURL: user.photoURL
    },
      process.env.JWT_SECRET, { expiresIn: '3d' }
    );
    
    res.cookie('authToken', authToken, { httpOnly: true, secure: true, sameSite: 'None', maxAge: 3 * 24 * 60 * 60 * 1000 });
    res.json({ user });

  } catch (err) {
    console.error('Error during signin:', err);
    res.status(500).json({ error: 'Server error' });
  }
})

router.post('/logout', (req, res) => {

  res.clearCookie('authToken', {
    httpOnly: true,
    secure: true,
    sameSite: 'None'
  });

  res.json({ message: 'Logged out' });
});


export default router;