import { RoomServiceClient } from 'livekit-server-sdk';
import dotenv from 'dotenv';
dotenv.config();

const apiKey = process.env.LIVEKIT_API_KEY;
const apiSecret = process.env.LIVEKIT_API_SECRET;
const host = process.env.LIVEKIT_HOST;

const roomService = new RoomServiceClient(host, apiKey, apiSecret);

async function closeRoom(roomName) {
  try {
    await roomService.deleteRoom(roomName);
    console.log(`Room '${roomName}' closed successfully.`);
  } catch (error) {
    console.error('Error closing room:', error);
  }
}

export { closeRoom };