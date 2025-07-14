import express from 'express';
import { AccessToken } from 'livekit-server-sdk';
import { saveFilter } from '../micro_services/bloom-filter.js';

const router = express.Router();

export default (redis, bloomFilter) => {
  router.post('/', async (req, res) => {
    const { roomName, identity, isHost } = req.body;

    if (!roomName || !identity) {
      return res.status(400).json({ error: 'Missing roomName or identity' });
    }

    try {
      const token = new AccessToken(
        process.env.LIVEKIT_API_KEY,
        process.env.LIVEKIT_API_SECRET,
        { identity }
      );

      token.addGrant({
        room: roomName,
        roomCreate: isHost,
        roomJoin: true,
        canPublish: true,
        canSubscribe: true,
      });

      if (isHost) {
        const exists = await redis.sismember('livekit:room_set', roomName);
        if (exists) {
          return res.status(409).json({ error: 'Room already exists' });
        }

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
        if (!bloomFilter.has(roomName)) {
          return res.status(404).json({ error: 'Room does not exist' });
        }

        const confirmed = await redis.sismember('livekit:room_set', roomName);
        if (!confirmed) {
          return res.status(404).json({ error: 'Room not active' });
        }

        return res.json({ token: await token.toJwt() });
      }
    } catch (error) {
      console.error('Token generation error:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  return router;
};
