// client/src/pages/RoomPage.jsx

import React, { useState, useEffect, useCallback, useRef } from "react";
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
import notificationSound from '../assets/notification.mp3'; // Import the sound file

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
  const audioRef = useRef(new Audio(notificationSound));
  const [position, setPosition] = useState({ x: 20, y: 20 });
  const [dragging, setDragging] = useState(false);
  const buttonRef = useRef(null);
  const offset = useRef({ x: 0, y: 0 });
  const dragged = useRef(false);


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

  // Effect to play sound on new participant
  useEffect(() => {
    if (isHost) {
        const previousCount = sessionStorage.getItem(`pendingCount_${roomName}`) || 0;
        if (pendingParticipants.length > previousCount) {
            audioRef.current.play().catch(e => console.error("Error playing sound:", e));
        }
        sessionStorage.setItem(`pendingCount_${roomName}`, pendingParticipants.length);
    }
  }, [pendingParticipants, isHost, roomName]);


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
      fetchPendingParticipants();
      const interval = setInterval(fetchPendingParticipants, 5000);
      return () => clearInterval(interval);
    }
  }, [isHost, fetchPendingParticipants]);

   const handleDragStart = (e) => {
    dragged.current = false;
    setDragging(true);

    const clientX = e.clientX || e.touches[0].clientX;
    const clientY = e.clientY || e.touches[0].clientY;

    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      offset.current = {
        x: clientX - rect.left,
        y: clientY - rect.top,
      };
    }
  };

  const handleDragMove = useCallback(
    (e) => {
      if (dragging) {
        dragged.current = true;
        const clientX = e.clientX || e.touches[0].clientX;
        const clientY = e.clientY || e.touches[0].clientY;

        setPosition({
          x: clientX - offset.current.x,
          y: clientY - offset.current.y,
        });
      }
    },
    [dragging]
  );

  const handleDragEnd = () => {
    setDragging(false);
  };

  useEffect(() => {
    const currentRef = buttonRef.current;
  
    if (dragging) {
      document.addEventListener("mousemove", handleDragMove);
      document.addEventListener("mouseup", handleDragEnd);
      document.addEventListener("touchmove", handleDragMove);
      document.addEventListener("touchend", handleDragEnd);
    } else {
      document.removeEventListener("mousemove", handleDragMove);
      document.removeEventListener("mouseup", handleDragEnd);
      document.removeEventListener("touchmove", handleDragMove);
      document.removeEventListener("touchend", handleDragEnd);
    }
  
    return () => {
      document.removeEventListener("mousemove", handleDragMove);
      document.removeEventListener("mouseup", handleDragEnd);
      document.removeEventListener("touchmove", handleDragMove);
      document.removeEventListener("touchend", handleDragEnd);
    };
  }, [dragging, handleDragMove]);


  const handleApproveParticipant = async (identity) => {
    try {
      await axios.post(`${url}/waiting-room/approve`, { roomName, identity });
      fetchPendingParticipants();
    } catch (error) {
      console.error("Failed to approve participant:", error);
    }
  };

  const handleRejectParticipant = async (identity) => {
    try {
        await axios.post(`${url}/waiting-room/reject`, { roomName, identity });
        fetchPendingParticipants();
    } catch (error) {
        console.error("Failed to reject participant:", error);
    }
  };

  const handleEndCall = () => {
    if (!isHost) {
        // Participant was disconnected, likely by the host ending the meeting.
        navigate("/", { 
            state: { 
                message: "The meeting has been ended by the host.", 
                type: "info" 
            } 
        });
    } else {
        // Host is leaving voluntarily.
        navigate("/");
    }
  };

  const handleButtonClick = () => {
      if (!dragged.current) {
          setShowWaitingRoom(true);
      }
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
            <button
                ref={buttonRef}
                className="floating-button"
                style={{ top: `${position.y}px`, left: `${position.x}px` }}
                onMouseDown={handleDragStart}
                onTouchStart={handleDragStart}
                onClick={handleButtonClick}
            >
                Waiting Room ({pendingParticipants.length})
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