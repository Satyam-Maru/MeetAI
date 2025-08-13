import express from 'express';
import { verifyToken } from '../middleware/verifyToken.js';
import Room from '../models/Room.js';

export default (bloomFilter) => {
    const router = express.Router();

    router.post('/', verifyToken, async (req, res) => {
        const { room_name } = req.body;
        const redis = req.app.get('redis');

        // 1. Check Bloom Filter first
        if (!bloomFilter.has(room_name)) {
            return res.json({ msg: 'success' }); // Room does not exist
        }

        // 2. If Bloom filter is positive, check Redis
        const cache = await redis.sismember('livekit:room_set', room_name);

        if (!cache) {
            return res.json({ msg: 'success' }); // Room does not exist
        } else {
            return res.json({ msg: 'failure' }); // Room exists
        }
    });

    return router;
};