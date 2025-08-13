// client/src/pages/RoomPage.jsx

import React, { useState, useEffect, useCallback } from "react";
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
import WaitingRoomModal from '../components/WaitingRoomModal';

const RoomPage = () => {
  const { roomName } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [token, setToken] = useState(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [roomUrl, setRoomUrl] = useState('');
  const [isHost, setIsHost] = useState(false);
  const [showWaitingRoom, setShowWaitingRoom] = useState(false);
  const [pendingParticipants, setPendingParticipants] = useState([]);

  const url = import.meta.env.VITE_PLATFORM === 'dev'
    ? import.meta.env.VITE_LOCALHOST_URL
    : import.meta.env.VITE_BACKEND_URL;

  const fetchPendingParticipants = useCallback(async () => {
    if (isHost) {
      try {
        const res = await axios.get(`${url}/waiting-room/pending/${roomName}`);
        setPendingParticipants(res.data);
      } catch (error) {
        console.error("Failed to fetch pending participants:", error);
      }
    }
  }, [isHost, roomName, url]);

  useEffect(() => {
    const host = searchParams.get("host") === "true";
    setIsHost(host);

    const fetchToken = async () => {
      if (!user) return;
      const identity = user.name || "Guest";
      
      try {
        const res = await axios.post(`${url}/get-token`, { roomName, identity, isHost: host });
        if (host) {
            setToken(res.data.token);
            const currentUrl = window.location.href;
            setRoomUrl(currentUrl.split('?', 1));
            setShowShareModal(true);
        } else {
            const interval = setInterval(async () => {
                try {
                    const tokenRes = await axios.get(`${url}/waiting-room/token/${roomName}/${identity}`);
                    if (tokenRes.data.token) {
                        setToken(tokenRes.data.token);
                        clearInterval(interval);
                    }
                } catch (err) { /* Still waiting */ }
            }, 3000);
        }
      } catch (error) {
        if (error.response?.status !== 202) {
          console.error("Failed to fetch token:", error);
          navigate("/");
        }
      }
    };
    fetchToken();
  }, [roomName, navigate, url, user, searchParams]);

  useEffect(() => {
    if (isHost) {
      fetchPendingParticipants(); // Fetch immediately on load for host
      const interval = setInterval(fetchPendingParticipants, 5000);
      return () => clearInterval(interval);
    }
  }, [isHost, fetchPendingParticipants]);

  const handleApproveParticipant = async (identity) => {
    try {
      await axios.post(`${url}/waiting-room/approve`, { roomName, identity });
      fetchPendingParticipants(); // Refresh the list
    } catch (error) {
      console.error("Failed to approve participant:", error);
    }
  };

  const handleRejectParticipant = async (identity) => {
    try {
        await axios.post(`${url}/waiting-room/reject`, { roomName, identity });
        fetchPendingParticipants(); // Refresh list
    } catch (error) {
        console.error("Failed to reject participant:", error);
    }
  };


  const handleEndCall = () => {
    navigate("/");
  };

  if (!token && !isHost) {
    return <div className="loading-screen"><p className="loading-text">Waiting for host to approve...</p></div>;
  }
  
  if(!token && isHost) {
      return <div className="loading-screen"><p className="loading-text">Loading...</p></div>;
  }

  return (
    <>
      <ShareModal
        isOpen={showShareModal}
        onRequestClose={() => setShowShareModal(false)}
        roomUrl={roomUrl}
      />
      {isHost && (
        <>
            <button className="floating-button" onClick={() => setShowWaitingRoom(true)}>
                Waitlist ({pendingParticipants.length})
            </button>
            <WaitingRoomModal
                isOpen={showWaitingRoom}
                onRequestClose={() => setShowWaitingRoom(false)}
                pendingParticipants={pendingParticipants}
                onApprove={handleApproveParticipant}
                onReject={handleRejectParticipant}
            />
        </>
      )}
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