// server/index.js
import express from 'express';
import { AccessToken, VideoGrant } from 'livekit-server-sdk';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();

const app = express();
app.use(cors(), express.json());

app.post('/get-token', async (req, res) => {
  const { room, username } = req.body;
  if (!room || !username) return res.status(400).json({ error: 'Missing room or username' });

  const at = new AccessToken(process.env.LIVEKIT_API_KEY, process.env.LIVEKIT_API_SECRET, {
    identity: username,
  });
  at.addGrant(new VideoGrant({ room, roomJoin: true, canPublish: true, canSubscribe: true }));

  res.json({ token: await at.toJwt() });
});

app.listen(process.env.PORT || 3001, () => console.log('Token server running'));
