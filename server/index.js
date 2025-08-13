import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import Redis from 'ioredis';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';

import { loadFilter } from './micro_services/bloom-filter.js';
import authRoutes from './routes/authRoutes.js';
import tokenRoutes from './routes/tokenRoutes.js';
import webhookRoutes from './routes/webHookRoutes.js';
import dbRoutes from './routes/dbRoutes.js';
import waitingRoomRoutes from './routes/waitingRoomRoutes.js';

dotenv.config();

const app = express();
const redis = new Redis(process.env.REDIS_URL, { tls: {} });

// MongoDB Connection
mongoose.connect(process.env.MONGO_ATLAS_URI, {dbName: process.env.MONGO_DB_NAME})
.then(() => console.log('✅ MongoDB connected'))
.catch(err => console.error('❌ MongoDB connection error:', err));

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

// Pass Redis client to routes
app.set('redis', redis);

// Routes
app.use('/api/auth', authRoutes);
app.use('/get-token', tokenRoutes(redis, bloomFilter));
app.use('/livekit-webhook', webhookRoutes(redis));
app.use('/check-room', dbRoutes);
app.use('/waiting-room', waitingRoomRoutes(redis));

app.get('/', (req, res) => {
  res.send('✅ LiveKit + Bloom Filter + MongoDB Atlas working');
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});