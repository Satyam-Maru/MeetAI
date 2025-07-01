import React, { useEffect, useState } from "react";
import { connect, Room, RemoteParticipant, RoomEvent } from "livekit-client";

const LIVEKIT_URL = import.meta.env.LIVEKIT_URL 
const BACKEND_URL = import.meta.env.BACKEND_URL // Replace with actual domain

const Room = () => {
  const [room, setRoom] = useState(null);

  useEffect(() => {
    const joinRoom = async () => {
      const userName = prompt("Enter your name");
      const roomName = "my-room"; // You can extract from URL if dynamic

      // Get token from backend
      const res = await fetch(`${BACKEND_URL}/get-token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomName, userName }),
      });
      const { token } = await res.json();

      const room = new Room();
      await connect(room, LIVEKIT_URL, token);

      room.localParticipant.setCameraEnabled(true);
      room.localParticipant.setMicrophoneEnabled(true);

      setRoom(room);
    };

    joinRoom();

    return () => {
      room?.disconnect();
    };
  }, []);

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold">LiveKit Video Room</h2>
      <div id="video-container" className="flex flex-wrap gap-4 mt-4" />
    </div>
  );
};

export default Room;