import express from 'express';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';

const router = express.Router();
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

router.get('/status', (req, res) => {
  if (req.cookies.authToken) {
    return res.json({ user: req.cookies.user || null });
  }
  res.status(401).json({ error: 'Unauthorized' });
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
      expiresIn: '7d',
    });

    res.cookie('authToken', authToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.cookie('user', JSON.stringify({
      name: user.name,
      email: user.email,
      photoURL: user.photoURL
    }), {
      maxAge: 7 * 24 * 60 * 60 * 1000,
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
      expiresIn: '7d',
    })

    res.cookie('authToken', authToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.cookie('user', JSON.stringify({
      name: user.name,
      email: user.email,
      photoURL: user.photoURL
    }), {
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });  
    
    res.json({user});
  }
  catch(err){
    alert('err while auth/signup: ', err);
  }
})

router.post('/logout', (req, res) => {
  res.clearCookie('authToken');
  res.clearCookie('user')
  res.json({ message: 'Logged out' });
});

export default router;
