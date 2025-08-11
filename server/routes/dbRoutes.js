import express from 'express';
import { verifyToken } from '../middleware/verifyToken.js';
import Room from '../models/Room.js';

const router = express.Router();

router.post('/', verifyToken, async (req, res) => {

    const { room_name } = req.body;
    const redis = req.app.get('redis');

    console.log(`room name: ${room_name}`);

    const cache = await redis.sismember('livekit:room_set', room_name)
    console.log(`redis: ${cache? 'yes': 'no'}`)

    if (!cache) return res.json({ msg: 'success'})
    else return res.json({msg: 'failure'})
});

export default router;