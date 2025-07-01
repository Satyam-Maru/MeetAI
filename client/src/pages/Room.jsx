import React, { useEffect, useState } from 'react';
import {
  LiveKitRoom,
  RoomAudioRenderer,
  ControlBar,
  GridLayout,
} from '@livekit/components-react';
import '@livekit/components-styles';
import { Room } from 'livekit-client';

const BACKEND_URL = import.meta.env.BACKEND_URL; // your Express backend
const LIVEKIT_URL = import.meta.env.LIVEKIT_URL;  // LiveKit WSS endpoint

export default function RoomPage() {
  const [token, setToken] = useState('');
  const [username, setUsername] = useState('');

  useEffect(() => {
    const u = prompt('Enter your name') || `user${Date.now()}`;
    setUsername(u);
    const roomName = new URLSearchParams(window.location.search).get('room') || 'gallery-room';

    fetch(`${BACKEND_URL}/get-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ room: roomName, username: u }),
    })
      .then(res => res.json())
      .then(data => setToken(data.token))
      .catch(console.error);
  }, []);

  if (!token) return <div>Loading...</div>;

  return (
    <div>
      Hello room
    </div>
  );
}
