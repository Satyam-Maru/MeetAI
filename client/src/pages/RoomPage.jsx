// client/src/pages/RoomPage.jsx

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import {
  LiveKitRoom,
  VideoConference,
  useParticipants,
} from "@livekit/components-react";
import "@livekit/components-styles/index.css";
import { DisconnectReason } from "livekit-client";
import { useAuth } from "../context/AuthContext";
import "../styles/RoomPage.css";
import "../styles/Loading.css";
import ShareModal from "../components/ShareModal";
import WaitingRoomModal from "../components/WaitingRoomModal";
import MenuModal from "../components/MenuModal";
import JoinedUsersModal from "../components/JoinedUsersModal";
import notificationSound from "../assets/notification.mp3";
import LiveCaptions from "../components/LiveCaptions";

// Hamburger Icon SVG
const HamburgerIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="3" y1="12" x2="21" y2="12"></line>
    <line x1="3" y1="6" x2="21" y2="6"></line>
    <line x1="3" y1="18" x2="21" y2="18"></line>
  </svg>
);

const RoomPageContent = () => {
  const participants = useParticipants();
  const { roomName } = useParams();
  const { user } = useAuth();
  const [showShareModal, setShowShareModal] = useState(false);
  const [roomUrl, setRoomUrl] = useState("");
  const [isHost, setIsHost] = useState(false);
  const [showWaitingRoom, setShowWaitingRoom] = useState(false);
  const [showMenuModal, setShowMenuModal] = useState(false);
  const [showJoinedUsersModal, setShowJoinedUsersModal] = useState(false);
  const [pendingParticipants, setPendingParticipants] = useState([]);
  const audioRef = useRef(null);
  const [position, setPosition] = useState({ x: 20, y: 20 });
  const [dragging, setDragging] = useState(false);
  const buttonRef = useRef(null);
  const offset = useRef({ x: 0, y: 0 });
  const dragged = useRef(false);
  const [showCaptions, setShowCaptions] = useState(false);

  const url =
    import.meta.env.VITE_PLATFORM === "dev"
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
      const previousCount = parseInt(
        sessionStorage.getItem(`pendingCount_${roomName}`) || "0",
        10
      );
      if (pendingParticipants.length > previousCount) {
        if (audioRef.current) {
          audioRef.current
            .play()
            .catch((e) => console.error("Error playing sound:", e));
        }
      }
      sessionStorage.setItem(
        `pendingCount_${roomName}`,
        pendingParticipants.length.toString()
      );
    }
  }, [pendingParticipants, isHost, roomName]);

  useEffect(() => {
    const host = window.location.search.includes("host=true");
    setIsHost(host);

    if (host) {
      const currentUrl = window.location.href;
      setRoomUrl(currentUrl.split("?", 1)[0]);
      setShowShareModal(true);
    }
  }, []);

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

  const handleRemoveParticipant = async (identity) => {
    try {
      await axios.post(`${url}/room/remove-participant`, {
        roomName,
        identity,
      });
    } catch (error) {
      console.error("Failed to remove participant:", error);
    }
  };

  const handleMenuButtonClick = () => {
    if (!dragged.current) {
      setShowMenuModal(true);
    }
  };

  const openWaitingRoom = () => {
    setShowMenuModal(false);
    setShowWaitingRoom(true);
  };

  const openJoinedUsers = () => {
    setShowMenuModal(false);
    setShowJoinedUsersModal(true);
  };

  const backToMenu = () => {
    setShowWaitingRoom(false);
    setShowJoinedUsersModal(false);
    setShowMenuModal(true);
  };

  const toggleCaptions = () => {
    setShowCaptions(!showCaptions);
    setShowMenuModal(false);
  };

  return (
    <>
      <audio ref={audioRef} src={notificationSound} preload="auto" />
      <ShareModal
        isOpen={showShareModal}
        onRequestClose={() => setShowShareModal(false)}
        roomUrl={roomUrl}
      />
      {isHost && (
        <>
          <button
            ref={buttonRef}
            className="floating-menu-button"
            style={{ top: `${position.y}px`, left: `${position.x}px` }}
            onMouseDown={handleDragStart}
            onTouchStart={handleDragStart}
            onClick={handleMenuButtonClick}
          >
            <HamburgerIcon />
            {pendingParticipants.length > 0 && (
              <span className="notification-badge menu-badge">
                {pendingParticipants.length}
              </span>
            )}
          </button>
          <MenuModal
            isOpen={showMenuModal}
            onRequestClose={() => setShowMenuModal(false)}
            onWaitingRoomClick={openWaitingRoom}
            onJoinedUsersClick={openJoinedUsers}
            waitingRoomCount={pendingParticipants.length}
            onToggleCaptions={toggleCaptions}
            isCaptionsEnabled={showCaptions}
          />
          <WaitingRoomModal
            isOpen={showWaitingRoom}
            onRequestClose={() => setShowWaitingRoom(false)}
            pendingParticipants={pendingParticipants}
            onApprove={handleApproveParticipant}
            onReject={handleRejectParticipant}
            onBack={backToMenu}
          />
          <JoinedUsersModal
            isOpen={showJoinedUsersModal}
            onRequestClose={() => setShowJoinedUsersModal(false)}
            participants={participants}
            onRemoveParticipant={handleRemoveParticipant}
            onBack={backToMenu}
            hostIdentity={user.name}
          />
        </>
      )}
      <div data-lk-theme="default" className="room-page-container">
        <VideoConference />
        {showCaptions && <LiveCaptions />}
      </div>
    </>
  );
};

const RoomPage = () => {
  const { roomName } = useParams();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [token, setToken] = useState(null);
  const navigate = useNavigate();
  const joinRequestSent = useRef(false);

  const url =
    import.meta.env.VITE_PLATFORM === "dev"
      ? import.meta.env.VITE_LOCALHOST_URL
      : import.meta.env.VITE_BACKEND_URL;

  const handleDisconnected = useCallback(
    (reason) => {
      const isHost = searchParams.get("host") === "true";

      if (isHost && reason === DisconnectReason.CLIENT_INITIATED) {
        navigate("/");
        return;
      }

      let message = "You have been disconnected from the room.";
      switch (reason) {
        case DisconnectReason.CLIENT_INITIATED:
          message = "You left the room.";
          break;
        case DisconnectReason.PARTICIPANT_REMOVED:
          message = "The host removed you from the room.";
          break;
        case DisconnectReason.ROOM_DELETED:
          message = "The host ended the room.";
          break;
        default:
          break;
      }

      navigate("/", {
        state: {
          message,
          type: "info",
        },
      });
    },
    [navigate, searchParams]
  );

  useEffect(() => {
    const isHost = searchParams.get("host") === "true";
    const identity = user?.name || "Guest";

    const fetchToken = async () => {
      try {
        if (isHost) {
          const res = await axios.post(`${url}/get-token`, {
            roomName,
            identity,
            isHost,
          });
          setToken(res.data.token);
        } else {
          if (!joinRequestSent.current) {
            await axios.post(`${url}/get-token`, {
              roomName,
              identity,
              isHost,
            });
            joinRequestSent.current = true;
          }

          const interval = setInterval(async () => {
            try {
              const tokenRes = await axios.get(
                `${url}/waiting-room/token/${roomName}/${identity}`
              );
              if (tokenRes.data.token) {
                setToken(tokenRes.data.token);
                clearInterval(interval);
              }
            } catch (err) {
              /* Still waiting for approval */
            }
          }, 3000);

          return () => clearInterval(interval);
        }
      } catch (error) {
        if (error.response?.status !== 202) {
          console.error("Failed to get token:", error);
          navigate("/");
        }
      }
    };

    if (user) {
      fetchToken();
    }
  }, [roomName, navigate, url, user, searchParams]);

  if (!token) {
    const isHost = searchParams.get("host") === "true";
    return (
      <div className="loading-screen">
        <p className="loading-text">
          {isHost ? "Loading..." : "Waiting for host to approve..."}
        </p>
      </div>
    );
  }

  return (
    <LiveKitRoom
      token={token}
      serverUrl={import.meta.env.VITE_LIVEKIT_URL}
      options={{
        audioCaptureDefaults: {
          noiseSuppression: true,
        },
      }}
      connectOptions={{ autoSubscribe: true }}
      audio={searchParams.get("mic") !== "false"}
      video={searchParams.get("video") !== "false"}
      onDisconnected={handleDisconnected}
    >
      <RoomPageContent />
    </LiveKitRoom>
  );
};

export default RoomPage;