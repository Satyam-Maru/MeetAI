import React, { useState } from "react";
import axios from "axios";
import {
  Room,
  RoomEvent,
  createLocalVideoTrack,
  createLocalAudioTrack,
  setLogLevel,
  LogLevel,
} from "livekit-client";
import { useNavigate } from 'react-router-dom';

//setLogLevel(LogLevel.debug); // Optional for debugging

const App = () => {

  const navigate = useNavigate();

  const [roomName, setRoomName] = useState("");
  const [identity, setIdentity] = useState("");
  const [roomName1, setRoomName1] = useState("");
  const [identity1, setIdentity1] = useState("");
  const [room, setRoom] = useState(null);

  const createRoom = async (isHost) => {
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/get-token`,
        {
          identity:isHost?identity:identity1,
          roomName:isHost?roomName:roomName1,
          isHost: isHost,
        }
      );

      const token = res.data.token;
      const room = new Room();

      if(res.data.error){
        console.warn('error from backend: ', error);
      }

      if (isHost) {
        navigate(`/room/${res.data.roomName}?host=true`); // 🎯 Redirect host to shareable URL
      } else {
        // Join logic will go here for guests later
      }

      room.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
        if (track.kind === "video") {
          const videoEl = track.attach();
          document.getElementById("video-container").appendChild(videoEl);
        } else if (track.kind === "audio") {
          const audioEl = track.attach();
          audioEl.autoplay = true;
          audioEl.muted = false;
          audioEl.play().catch(console.error);
          document.body.appendChild(audioEl);
        }
      });

      room.on(RoomEvent.ParticipantDisconnected, (participant) => {
        console.log(`${participant.identity} left`);
      });

      await room.connect(
        import.meta.env.VITE_LIVEKIT_URL,
        token
      );

      // Try to publish local video
      try {
        const videoTrack = await createLocalVideoTrack();
        await room.localParticipant.publishTrack(videoTrack);
        const el = videoTrack.attach();
        document.getElementById("video-container").appendChild(el);
      } catch (err) {
        console.warn("No camera found or permission denied");
      }

      // Try to publish local audio
      try {
        const audioTrack = await createLocalAudioTrack();
        await room.localParticipant.publishTrack(audioTrack);
      } catch (err) {
        console.warn("No mic found or permission denied");
      }

      setRoom(room);
    } catch (err) {
      console.error("Join room error:", err);
    }
  };

  return (
    <>
      <div style={{ padding: "20px" }}>
        <h2>Create LiveKit Room</h2>
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
        <button onClick={() => createRoom(true)}>Create Room</button>

        <div id="video-container" style={{ marginTop: "20px" }}></div>
      </div>

      <div style={{ padding: "20px" }}>
        <h2>Join LiveKit Room</h2>
        <input
          placeholder="Room name"
          value={roomName1}
          onChange={(e) => setRoomName1(e.target.value)}
        />
        <input
          placeholder="Your name"
          value={identity1}
          onChange={(e) => setIdentity1(e.target.value)}
        />
        <button onClick={() => createRoom(false)}>Join Room</button>
      </div>
    </>
  );
};

export default App;
