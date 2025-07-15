import express from 'express';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import { verifyToken } from '../middleware/verifyToken.js';

const router = express.Router();
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

router.get('/profile', verifyToken, (req, res) => {
  res.json({ user: req.user });
});

router.post('/login', async (req, res) => {
  try {
    const { token } = req.body;

    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    const user = {
      name: payload.name,
      email: payload.email,
      photoURL: payload.picture,
    };

    const authToken = jwt.sign(user, process.env.JWT_SECRET, {
      expiresIn: '1d',
    });

    res.cookie('authToken', authToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'None',
      maxAge: 24 * 60 * 60 * 1000,
    });

    res.cookie('user', JSON.stringify({
      name: user.name,
      email: user.email,
      photoURL: user.photoURL
    }), {
      secure: true,
      sameSite: 'None',
      maxAge: 24 * 60 * 60 * 1000,
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

    const user = {
      name: email.split('@')[0],
      password: password,
      photoURL: 'https://th.bing.com/th/id/OIP.MDsL3053XQlxGpo6y5UTEQAAAA?w=188&h=180&c=7&r=0&o=5&dpr=1.3&pid=1.7'
    }

    const authToken = jwt.sign(user, process.env.JWT_SECRET, {
      expiresIn: '1d',
    })

    res.cookie('authToken', authToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'None',
      maxAge: 24 * 60 * 60 * 1000,
    });

    res.cookie('user', JSON.stringify({
      name: user.name,
      email: user.email,
      photoURL: user.photoURL
    }), {
      secure: true,
      sameSite: 'None',
      maxAge: 24 * 60 * 60 * 1000,
    });

    res.json({ user });
  }
  catch (err) {
    alert('err while auth/signup: ', err);
  }
})

router.post('/logout', (req, res) => {

  res.clearCookie('authToken', {
    httpOnly: true,
    secure: true,
    sameSite: 'None'
  });

  res.clearCookie('user', {
    secure: true,
    sameSite: 'None'
  });
  res.json({ message: 'Logged out' });
});

export default router;
