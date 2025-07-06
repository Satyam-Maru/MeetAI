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

// ✅ Token route
app.post('/get-token', async (req, res) => {
  const { roomName, identity, isHost } = req.body;

  if (!roomName || !identity) {
    return res.status(400).json({ error: 'Missing roomName or identity' });
  }
  try {
    if (isHost) {
      const exists = await redis.sismember('livekit:room_set', roomName);
      if (exists) {
        console.log(`error 409: room already exists`)
        return res.status(409).json({ error: 'Room already exists' });
      }
  
      await redis.sadd('livekit:room_set', roomName);
      bloomFilter.add(roomName);
      await saveFilter('livekit:room_bloom', bloomFilter);
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
    }
  } catch (error) {
    console.log('error: ', error)
  }

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

  res.json({ token: await token.toJwt() });
});

// LiveKit WebhookReceiver
const receiver = new WebhookReceiver(
  process.env.LIVEKIT_API_KEY,
  process.env.LIVEKIT_API_SECRET
);

// 🧠 Raw body middleware *just for* this webhook route
app.post(
  '/livekit-webhook',
  bodyParser.raw({ type: 'application/webhook+json' }),
  async (req, res) => {
    try {
      // Verify and parse the webhook using LiveKit's receiver
      const event = await receiver.receive(req.body, req.get('Authorization'));

      console.log('✅ Verified Webhook Event:', event);

      const { event: eventType, room, participant } = event;

      if (
        (eventType === 'participant_left' && participant?.identity === 'host') ||
        eventType === 'room_finished'
      ) {
        await redis.srem('livekit:room_set', room);
        console.log(`🧹 Room "${room}" removed from Redis`);
      }

      res.sendStatus(200);
    } catch (err) {
      console.error('❌ Webhook validation failed:', err.message);
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