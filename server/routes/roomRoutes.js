import express from 'express';
import { RoomServiceClient } from 'livekit-server-sdk';
import { verifyToken } from '../middleware/verifyToken.js';

const roomService = new RoomServiceClient(
    process.env.LIVEKIT_HOST,
    process.env.LIVEKIT_API_KEY,
    process.env.LIVEKIT_API_SECRET
);

export default (bloomFilter) => {
    const router = express.Router();

    router.post('/check-room', verifyToken, async (req, res) => {
        const { room_name } = req.body;
        const redis = req.app.get('redis');

        if (!bloomFilter.has(room_name)) {
            return res.json({ msg: 'success' });
        }

        const cache = await redis.sismember('livekit:room_set', room_name);

        if (!cache) {
            return res.json({ msg: 'success' });
        } else {
            return res.json({ msg: 'failure' });
        }
    });

    router.post('/remove-participant', verifyToken, async (req, res) => {
        const { roomName, identity } = req.body;
        try {
            await roomService.removeParticipant(roomName, identity);
            res.json({ success: true, message: 'Participant removed successfully.' });
        } catch (error) {
            console.error('Error removing participant:', error);
            res.status(500).json({ success: false, error: 'Failed to remove participant.' });
        }
    });

    return router;
};