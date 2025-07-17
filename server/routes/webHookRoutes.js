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
        
        res.sendStatus(200); // to quickly notify the server, so it can process the req

        const { event: eventType, room, participant } = event;
        const hostIdentity = await redis.get(`livekit:host:${room?.name}`);

        console.log('************************');
        console.log(`Room: ${room?.name}`)
        console.log(`EventType: ${eventType}`);
        console.log(`Identity: ${participant?.identity}, Type: ${typeof participant?.identity}`);
        console.log(`Host Identity: ${hostIdentity}, Type: ${typeof hostIdentity}`);
        console.log('************************\n\n');

        if (
          (eventType === 'participant_left' && participant?.identity === hostIdentity) ||
          eventType === 'room_finished'
        ) {
          await redis.srem('livekit:room_set', room?.name);
          await redis.del(`livekit:host:${room?.name}`);
          console.log(`🧹 Room "${room?.name}" removed from Redis (host left)`);
        }

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
