import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import Redis from 'ioredis';
import { AccessToken } from 'livekit-server-sdk';
import bodyParser from 'body-parser';
import { WebhookReceiver } from 'livekit-server-sdk';

import { loadFilter, saveFilter } from './micro_services/bloom-filter.js';

dotenv.config();

const app = express();
const redis = new Redis(process.env.REDIS_URL, { tls: {} });

let bloomFilter = null;

async function initializeBloom() {
  bloomFilter = await loadFilter('livekit:room_bloom');
  console.log('✅ Bloom filter loaded from MongoDB Atlas');
}
await initializeBloom();

app.use(cors());
app.use(express.json());
app.use('/get-token', express.json());

app.post('/get-token', async (req, res) => {
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
        console.log(`error 409: room already exists`)
        return res.status(409).json({ error: 'Room already exists' });
      }
      
      // will be used to end the room
      await redis.set(`livekit:host:${roomName}`, identity);

      // used to check the availability of the room
      await redis.sadd('livekit:room_set', roomName);
      bloomFilter.add(roomName);

      // saved in mongo atlas
      await saveFilter('livekit:room_bloom', bloomFilter);

      return res.json({
        token: await token.toJwt(),
        roomName,
        url: `${process.env.VERCEL_URL}/room/${roomName}?host=true`
      });

    } else {
      if (!bloomFilter.has(roomName)) {
        console.log('error 404: room does not exist');
        return res.status(404).json({ error: 'Room does not exist' });
      }
  
      const confirmed = await redis.sismember('livekit:room_set', roomName);
      if (!confirmed) {
        console.log('error 404: room not active');
        return res.status(404).json({ error: 'Room not active' });
      }

      return res.json({
        token: await token.toJwt(),
      });
    }
  } catch (error) {
    console.log('error: ', error)
    }
});

// LiveKit WebhookReceiver
const receiver = new WebhookReceiver(
  process.env.LIVEKIT_API_KEY,
  process.env.LIVEKIT_API_SECRET
);

app.post(
  '/livekit-webhook',
  bodyParser.raw({ type: 'application/webhook+json' }),
  async (req, res) => {
    try {
      // Verify and parse the webhook using LiveKit's receiver
      const authHeader = req.get('Authorization');
      const event = await receiver.receive(req.body, authHeader);

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

      res.sendStatus(200);
    } catch (err) {
      console.error('❌ Webhook validation failed:', err.message);
      console.log('Authorization Header:', req.get('Authorization'));
      console.log('Raw Payload:', req.body.toString('utf8'));
      res.sendStatus(403);
    }
  }
);

app.post('/test', (req, res) => {
  console.log('✅ Test webhook hit!');
  res.sendStatus(200);
});


app.get('/', (req, res) => {
  res.send('✅ LiveKit + Bloom Filter + MongoDB Atlas working');
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
}); 