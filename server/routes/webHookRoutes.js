import express from 'express';
import { WebhookReceiver, RoomServiceClient } from 'livekit-server-sdk';
import bodyParser from 'body-parser';

const router = express.Router();
const receiver = new WebhookReceiver(
  process.env.LIVEKIT_API_KEY,
  process.env.LIVEKIT_API_SECRET
);

const roomService = new RoomServiceClient(
    process.env.LIVEKIT_HOST,
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
        
        res.sendStatus(200); // Acknowledge the webhook quickly

        const { event: eventType, room, participant } = event;
        const roomName = room?.name;
        if (!roomName) return;

        const hostIdentity = await redis.get(`livekit:host:${roomName}`);

        console.log('************************');
        console.log(`Room: ${roomName}`)
        console.log(`EventType: ${eventType}`);
        console.log(`Identity: ${participant?.identity}, Type: ${typeof participant?.identity}`);
        console.log(`Host Identity: ${hostIdentity}, Type: ${typeof hostIdentity}`);
        console.log('************************\n\n');

        if (eventType === 'participant_left' && participant?.identity === hostIdentity) {
            console.log(`Host ${hostIdentity} left room ${roomName}. Ending meeting for all participants.`);
            
            const participants = await roomService.listParticipants(roomName);
            
            // Remove each remaining participant
            for (const p of participants) {
                await roomService.removeParticipant(roomName, p.identity);
            }
            
            // Delete the room from LiveKit servers
            await roomService.deleteRoom(roomName);
            
            // Clean up Redis
            await redis.srem('livekit:room_set', roomName);
            await redis.del(`livekit:host:${roomName}`);
            console.log(`🧹 Room "${roomName}" and its data completely removed (host left).`);

        } else if (eventType === 'room_finished') {
            await redis.srem('livekit:room_set', room?.name);
            await redis.del(`livekit:host:${room?.name}`);
            console.log(`🧹 Room "${room?.name}" removed from Redis (room finished)`);
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