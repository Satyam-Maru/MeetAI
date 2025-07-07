import React, { useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import axios from "axios";
import {
  Room,
  RoomEvent,
  createLocalAudioTrack,
  createLocalVideoTrack,
} from "livekit-client";


const RoomPage = () => {
  const [searchParams] = useSearchParams();
  const isHost = searchParams.get("host") === "true";
  const { roomName } = useParams();
  const [identity, setIdentity] = useState("");
  const [joined, setJoined] = useState(false);
  const [showModal, setShowModal] = useState(!isHost); // modal is shown initially

  const joinRoom = async () => {
    const res = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/get-token`, {
      roomName,
      identity,
      isHost: false,
    });

    const token = res.data.token;
    const room = new Room();
    
    room.on(RoomEvent.TrackSubscribed, (track) => {
      const el = track.attach();
      document.getElementById("video-container").appendChild(el);
    });

    await room.connect(import.meta.env.VITE_LIVEKIT_URL, token);

    try {
      const videoTrack = await createLocalVideoTrack();
      await room.localParticipant.publishTrack(videoTrack);
      document.getElementById("video-container").appendChild(videoTrack.attach());
    } catch {}

    try {
      const audioTrack = await createLocalAudioTrack();
      await room.localParticipant.publishTrack(audioTrack);
    } catch {}

    setShowModal(false);
    setJoined(true);
  };

  return (
    <div style={{ padding: 20, position: "relative" }}>
      <h2>Live Room: {roomName}</h2>
      <div id="video-container" style={{ marginTop: 20 }}></div>

      {/* Name Input Modal */}
      {showModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <h3>Enter your name to join</h3>
            <input
              style={styles.input}
              placeholder="Your name"
              value={identity}
              onChange={(e) => setIdentity(e.target.value)}
            />
            <button style={styles.button} onClick={joinRoom} disabled={!identity.trim()}>
              Join Room
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100vw",
    height: "100vh",
    background: "rgba(8, 8, 8, 0.5)",
    zIndex: 999,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  modalContent: {
    background: "#1e1e1e",
    padding: "50px",
    borderRadius: "8px",
    textAlign: "center",
    width: "300px",
    boxShadow: "0 0 10px rgba(0,0,0,0.2)",
  },
  input: {
    width: "100%",
    padding: "10px",
    marginTop: "10px",
    marginBottom: "20px",
    fontSize: "16px",
  },
  button: {
    padding: "10px 20px",
    fontSize: "16px",
    backgroundColor: "#007bff",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
  },
};

export default RoomPage;