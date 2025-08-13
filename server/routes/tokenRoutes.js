// server/routes/tokenRoutes.js

import express from 'express';
import { AccessToken } from 'livekit-server-sdk';
import { saveFilter } from '../micro_services/bloom-filter.js';
import { verifyToken } from '../middleware/verifyToken.js';

const router = express.Router();

export default (redis, bloomFilter) => {
  router.post('/', verifyToken, async (req, res) => {
    const { roomName, identity, isHost } = req.body;

    if (!roomName || !identity) {
      return res.status(400).json({ error: 'Missing roomName or identity' });
    }

    try {
      if (isHost) {
        // Host token generation logic remains the same...
        const token = new AccessToken(
          process.env.LIVEKIT_API_KEY,
          process.env.LIVEKIT_API_SECRET,
          { identity, name: identity }
        );
        token.addGrant({
          room: roomName,
          roomCreate: true,
          roomJoin: true,
          canPublish: true,
          canSubscribe: true,
        });
        await redis.set(`livekit:host:${roomName}`, identity);
        await redis.sadd('livekit:room_set', roomName);
        bloomFilter.add(roomName);
        await saveFilter('livekit:room_bloom', bloomFilter);
        const url = process.env.PLATFORM == 'dev'? process.env.VITE_LOCALHOST : process.env.VERCEL_URL;
        return res.json({
          token: await token.toJwt(),
          roomName,
          url: `${url}/${roomName}?host=true`,
        });
      } else {
        // Participant requests to join
        if (!bloomFilter.has(roomName) || !(await redis.sismember('livekit:room_set', roomName))) {
          return res.status(404).json({ error: 'Room not found or not active' });
        }
        
        // Store the user's full details in the pending list
        const userToWait = {
          name: req.user.name,
          email: req.user.email,
          photoURL: req.user.photoURL,
        };
        await redis.rpush(`pending:participants:${roomName}`, JSON.stringify(userToWait));
        
        return res.status(202).json({ message: 'Request to join sent. Waiting for host approval.' });
      }
    } catch (error) {
      console.error('Token generation error:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  return router;
};