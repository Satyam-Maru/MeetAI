import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const App = () => {
  const navigate = useNavigate();
  const [roomName, setRoomName] = useState("");
  const [identity, setIdentity] = useState("");
  const [roomName1, setRoomName1] = useState("");
  const [identity1, setIdentity1] = useState("");

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
        <button
          onClick={() =>
            navigate(`/room/${roomName}?host=true&identity=${identity}`)
          }
          disabled={!roomName || !identity}
        >
          Create Room
        </button>
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
        <button
          onClick={() =>
            navigate(`/room/${roomName1}?identity=${identity1}`)
          }
          disabled={!roomName1 || !identity1}
        >
          Join Room
        </button>
      </div>
    </>
  );
};

export default App;