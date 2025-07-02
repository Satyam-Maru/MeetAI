// App.js
import React, { useState } from 'react';
import axios from 'axios';
import {
  Room,
  RoomEvent,
  createLocalVideoTrack,
  createLocalAudioTrack,
  setLogLevel,
  LogLevel,
} from 'livekit-client';

setLogLevel(LogLevel.debug); // Optional for debugging

const App = () => {
  const [roomName, setRoomName] = useState('');
  const [identity, setIdentity] = useState('');
  const [room, setRoom] = useState(null);
  
  const joinRoom = async () => {
    try {
      const res = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/get-token`, {
        identity,
        roomName,
      });

      const token = res.data.token;
      const room = new Room();

      room.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
        if (track.kind === 'video') {
          const videoEl = track.attach();
          document.getElementById('video-container').appendChild(videoEl);
        }
      });

      room.on(RoomEvent.ParticipantDisconnected, (participant) => {
        console.log(`${participant.identity} left`);
      });


      await room.connect(
        import.meta.env.VITE_LIVEKIT_URL, // <- Update this
        token
      );

      // Try to publish local video
      try {
        const videoTrack = await createLocalVideoTrack();
        await room.localParticipant.publishTrack(videoTrack);
        const el = videoTrack.attach();
        document.getElementById('video-container').appendChild(el);
      } catch (err) {
        console.warn('No camera found or permission denied');
      }

      // Try to publish local audio
      try {
        const audioTrack = await createLocalAudioTrack();
        await room.localParticipant.publishTrack(audioTrack);
      } catch (err) {
        console.warn('No mic found or permission denied');
      }

      setRoom(room);
    } catch (err) {
      console.error('Join room error:', err);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>Join LiveKit Room</h2>
      <input
        placeholder="Room name"
        value={roomName}
        onChange={(e) => setRoomName(e.target.value)}
      />
      <input
        placeholder="Your name"
        value={identity}
        onChange={(e) => setIdentity(e.target.value)}
      />
      <button onClick={joinRoom}>Join</button>

      <div id="video-container" style={{ marginTop: '20px' }}></div>
    </div>
  );
};

export default App;
