import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import {
  LiveKitRoom,
  VideoConference,
} from "@livekit/components-react";
import "@livekit/components-styles/index.css";
import { useAuth } from "../context/AuthContext";
import "../styles/RoomPage.css";
import '../styles/Loading.css';
import ShareModal from '../components/ShareModal';

const RoomPage = () => {
  const { roomName } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [token, setToken] = useState(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [roomUrl, setRoomUrl] = useState('');

  const url = import.meta.env.VITE_PLATFORM === 'dev'
    ? import.meta.env.VITE_LOCALHOST_URL
    : import.meta.env.VITE_BACKEND_URL;

  useEffect(() => {
    const fetchToken = async () => {
      if (!user) return;
      const identity = user.name || "Guest";
      const isHost = searchParams.get("host") === "true";
      try {
        const res = await axios.post(`${url}/get-token`, { roomName, identity, isHost });
        setToken(res.data.token);
        if (isHost) {
          const currentUrl = window.location.href;
          setRoomUrl(currentUrl.split('?', 1));
          setShowShareModal(true);
        }
      } catch (error) {
        console.error("Failed to fetch token:", error);
        navigate("/");
      }
    };
    fetchToken();
  }, [roomName, navigate, url, user, searchParams]);

  const handleEndCall = () => {
    navigate("/");
  };

  if (!token) {
    return <div className="loading-container"><p className="loading-text">Loading...</p></div>;
  }

  return (
    <>
      <ShareModal
        isOpen={showShareModal}
        onRequestClose={() => setShowShareModal(false)}
        roomUrl={roomUrl}
      />
      <div data-lk-theme="default" className="room-page-container">
        <LiveKitRoom
          token={token}
          serverUrl={import.meta.env.VITE_LIVEKIT_URL}
          connectOptions={{ autoSubscribe: true }}
          audio={searchParams.get("mic") !== "false"}
          video={searchParams.get("video") !== "false"}
          onDisconnected={handleEndCall}
        >
          <VideoConference />
        </LiveKitRoom>
      </div>
    </>
  );
};

export default RoomPage;