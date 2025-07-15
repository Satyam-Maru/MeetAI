import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import Redis from 'ioredis';
import cookieParser from 'cookie-parser';

import { loadFilter } from './micro_services/bloom-filter.js';
import authRoutes from './routes/authRoutes.js';
import tokenRoutes from './routes/tokenRoutes.js';
import webhookRoutes from './routes/webHookRoutes.js';
import { verifyToken } from './middleware/verifyToken.js';

dotenv.config();

const app = express();
const redis = new Redis(process.env.REDIS_URL, { tls: {} });

let bloomFilter = null;
async function initializeBloom() {
  bloomFilter = await loadFilter('livekit:room_bloom');
  console.log('✅ Bloom filter loaded from MongoDB Atlas');
}
await initializeBloom();

app.use(cookieParser());
const origin = process.env.PLATFORM == 'dev' ? process.env.VITE_LOCALHOST : process.env.VERCEL_URL;
app.use(cors({ credentials: true, origin: origin }));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/get-token', tokenRoutes(redis, bloomFilter));
app.use('/livekit-webhook', webhookRoutes(redis));

// middleware for stale ui controlling
app.use((req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  next();
});


app.get('/', (req, res) => {
  res.send('✅ LiveKit + Bloom Filter + MongoDB Atlas working');
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
