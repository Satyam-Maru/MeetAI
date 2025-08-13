// server/routes/waitingRoomRoutes.js

import express from 'express';
import { AccessToken } from 'livekit-server-sdk';
import { verifyToken } from '../middleware/verifyToken.js';

const router = express.Router();

export default (redis) => {
  // Get pending participants
  router.get('/pending/:roomName', verifyToken, async (req, res) => {
    const { roomName } = req.params;
    const pendingList = await redis.lrange(`pending:participants:${roomName}`, 0, -1);
    const pendingParticipants = pendingList.map(p => JSON.parse(p));
    res.json(pendingParticipants);
  });

  // Approve a participant
  router.post('/approve', verifyToken, async (req, res) => {
    const { roomName, identity } = req.body;
    
    const pendingList = await redis.lrange(`pending:participants:${roomName}`, 0, -1);
    const participantToApprove = pendingList.find(p => JSON.parse(p).name === identity);

    if (participantToApprove) {
      await redis.lrem(`pending:participants:${roomName}`, 1, participantToApprove);
    } else {
      return res.status(404).json({ message: 'Participant not found in waiting list.' });
    }

    const token = new AccessToken(
      process.env.LIVEKIT_API_KEY,
      process.env.LIVEKIT_API_SECRET,
      { identity, name: identity }
    );
    token.addGrant({
      room: roomName,
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
    });
    
    await redis.set(`approved:token:${identity}:${roomName}`, await token.toJwt(), 'EX', 300);

    res.json({ message: 'Participant approved' });
  });

  // Add a new route to reject a participant
  router.post('/reject', verifyToken, async (req, res) => {
    const { roomName, identity } = req.body;

    const pendingList = await redis.lrange(`pending:participants:${roomName}`, 0, -1);
    const participantToReject = pendingList.find(p => JSON.parse(p).name === identity);

    if (participantToReject) {
        await redis.lrem(`pending:participants:${roomName}`, 1, participantToReject);
    }

    res.json({ message: 'Participant rejected' });
  });

  // Get approved token
  router.get('/token/:roomName/:identity', async (req, res) => {
      const { roomName, identity } = req.params;
      const token = await redis.get(`approved:token:${identity}:${roomName}`);
      if (token) {
          await redis.del(`approved:token:${identity}:${roomName}`);
          res.json({ token });
      } else {
          res.status(404).json({ error: 'Token not found or expired.' });
      }
  });

  return router;
};