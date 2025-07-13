import express from 'express';
import { WebhookReceiver } from 'livekit-server-sdk';
import bodyParser from 'body-parser';

const router = express.Router();
const receiver = new WebhookReceiver(
  process.env.LIVEKIT_API_KEY,
  process.env.LIVEKIT_API_SECRET
);

export default (redis) => {
  router.post(
    '/',
    bodyParser.raw({ type: 'application/webhook+json' }),
    async (req, res) => {
      try {
        const authHeader = req.get('Authorization');
        const event = await receiver.receive(req.body, authHeader);

        const { event: eventType, room, participant } = event;
        const hostIdentity = await redis.get(`livekit:host:${room?.name}`);

        if (
          (eventType === 'participant_left' && participant?.identity === hostIdentity) ||
          eventType === 'room_finished'
        ) {
          await redis.srem('livekit:room_set', room?.name);
          await redis.del(`livekit:host:${room?.name}`);
          console.log(`🧹 Room "${room?.name}" removed from Redis (host left)`);
        }

        res.sendStatus(200);
      } catch (err) {
        console.error('❌ Webhook validation failed:', err.message);
        console.log('Authorization Header:', req.get('Authorization'));
        console.log('Raw Payload:', req.body.toString('utf8'));
        res.sendStatus(403);
      }
    }
  );

  return router;
};
