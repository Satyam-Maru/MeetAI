import React, { useState, useRef, useEffect } from "react";
import Modal from "react-modal";
import { useNavigate } from "react-router-dom";
import MediaSetupModal from "./MediaSetupModal";
import Dice from "../assets/dice-svg.svg";
import "../styles/RoomControls.css";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

Modal.setAppElement("#root");

const RoomControls = ({ onLogout, user }) => {
  const navigate = useNavigate();
  const [inputValue, setInputValue] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [roomName, setRoomName] = useState("");
  const [error, setError] = useState("");
  const { showNotification } = useAuth(); // <-- Get showNotification from context
  const [isRoomValid, setIsRoomValid] = useState(false);
  const bridgeRef = useRef(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showMediaSetup, setShowMediaSetup] = useState(false);
  const validationTimeoutRef = useRef(null);

  const predefinedNames = [
    "Cosmic", "Galaxy", "Quantum", "Nebula", "Stellar",
    "Orbit", "Pulsar", "Vortex", "Celestial", "Infinity",
  ];

  const url = import.meta.env.VITE_PLATFORM === 'dev'
    ? import.meta.env.VITE_LOCALHOST_URL
    : import.meta.env.VITE_BACKEND_URL;

  const extractRoomNameFromUrl = (value) => {
    try {
      const url = new URL(value);
      const pathParts = url.pathname.split('/').filter(part => part);
      if (pathParts[0] === 'room' && pathParts[1]) {
        return pathParts[1];
      }
    } catch (error) {
      // Not a valid URL, so treat it as a room name
      return value;
    }
    return value;
  };

  const validateRoom = async (name) => {
    if (!name) {
      setIsRoomValid(false);
      bridgeRef.current?.classList.remove("joined", "error", "active-flow");
      return;
    }

    bridgeRef.current?.classList.add("active-flow");
    bridgeRef.current?.classList.remove("joined", "error");

    try {
      const res = await axios.post(`${url}/check-room`, { room_name: name });
      if (res.data.msg === 'failure') { // Room exists and is joinable
        setIsRoomValid(true);
        bridgeRef.current?.classList.add("joined");
        bridgeRef.current?.classList.remove("error", "active-flow");
      } else { // Room does not exist
        showNotification("This room does not exist. Please check the name or link.", "error");
        setIsRoomValid(false);
        bridgeRef.current?.classList.add("error");
        bridgeRef.current?.classList.remove("joined", "active-flow");
      }
    } catch (error) {
      console.error("Error checking room:", error);
      showNotification("Could not validate the room. Please try again.", "error");
      setIsRoomValid(false);
      bridgeRef.current?.classList.add("error");
      bridgeRef.current?.classList.remove("joined", "active-flow");
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setInputValue(value);
    setIsRoomValid(false); // Reset validation on new input

    if (bridgeRef.current) {
        bridgeRef.current.classList.remove("joined", "error", "active-flow");
    }

    clearTimeout(validationTimeoutRef.current);
    if (value.trim()) {
        const roomToValidate = extractRoomNameFromUrl(value.trim());
        validationTimeoutRef.current = setTimeout(() => {
            validateRoom(roomToValidate);
        }, 700); // 700ms delay
    }
  };


  const handleRoomNameChange = (e) => {
    setRoomName(e.target.value);
    setError("");
  };

  const generateRandomName = () => {
    const randomIndex = Math.floor(Math.random() * predefinedNames.length);
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    const randomName = `${predefinedNames[randomIndex]}${randomSuffix}`;
    setRoomName(randomName);
    setError("");
  };

  const handleCreateRoom = async () => {
    if (!roomName.trim()) {
      setError("Room name cannot be empty");
      return;
    }
    try {
      const roomData = await axios.post(`${url}/check-room`, { room_name: roomName });
      if (roomData.data.msg === 'failure') {
        setError('Room already exists');
      } else {
        setError('');
        setShowCreateModal(false);
        setShowMediaSetup(true);
      }
    } catch (err) {
      setError(err.message);
      console.log(`err in handleCreateRoom: ${err.message}`);
    }
  };

  const handleJoinClick = () => {
    if(isRoomValid) {
        setShowMediaSetup(true);
    }
  };

  const handleJoin = (mediaSettings) => {
    const roomToJoin = roomName.trim() || extractRoomNameFromUrl(inputValue.trim());

    if (roomToJoin) {
      const params = new URLSearchParams({
        identity: user.name,
        mic: mediaSettings.micOn,
        video: mediaSettings.cameraOn,
      });
      if (roomName.trim() && !inputValue.trim()) {
        params.set("host", "true");
      }
      navigate(`/room/${roomToJoin}?${params.toString()}`);
    }
  };

  return (
    <>
      <div className="user-profile-container">
        <button
          className="user-profile-btn"
          onClick={() => setShowUserModal(!showUserModal)}
        >
          <div className="user-avatar">
            {user?.photoURL ? (
              <img src={user.photoURL} alt={user.name || "User"} />
            ) : (
              <span>{user?.name?.charAt(0) || "U"}</span>
            )}
          </div>
          <span className="user-name">{user?.name || "User"}</span>
        </button>
      </div>
      <Modal
        isOpen={showUserModal}
        onRequestClose={() => setShowUserModal(false)}
        className="user-profile-modal"
        overlayClassName="user-modal-overlay"
      >
        <div className="user-modal-header">
          <div className="modal-user-avatar">
            {user?.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.name || "User"}
                referrerPolicy="no-referrer"
              />
            ) : (
              <span>{user?.name?.charAt(0) || "U"}</span>
            )}
          </div>
          <h3>{user?.name || "User"}</h3>
        </div>
        <div className="user-modal-footer">
          <button className="logout-btn" onClick={onLogout}>
            Logout
          </button>
        </div>
      </Modal>

      <div className="responsive-wrapper">
        <div className="controls-container">
          <div className="create-room-wrapper">
            <button
              className="button primary-button create-room-btn"
              onClick={() => setShowCreateModal(true)}
            >
              Create Room
            </button>
          </div>

          <div className="room-input-wrapper">
            <input
              className="room-input"
              type="text"
              placeholder="Enter room name or invite link"
              value={inputValue}
              onChange={handleInputChange}
            />
            <div className="connection-bridge" ref={bridgeRef}></div>
          </div>

          <button
            className="button secondary-button"
            onClick={handleJoinClick}
            disabled={!isRoomValid}
          >
            Join Room
          </button>
        </div>
      </div>
      <MediaSetupModal
        isOpen={showMediaSetup}
        onRequestClose={() => setShowMediaSetup(false)}
        onJoin={handleJoin}
      />

      {showCreateModal && (
        <div className="modal-overlay">
          <div className="create-room-modal">
            <div className="modal-header">
              <h2>Create Room</h2>
              <button
                className="close-btn"
                onClick={() => {
                  setShowCreateModal(false);
                  setRoomName("");
                  setError("");
                }}
              >
                 <svg
                  width="14"
                  height="14"
                  viewBox="0 0 14 14"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M13 1L1 13M1 1L13 13"
                    stroke="#777"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>

            <div className="modal-body">
              <div className="input-group">
                <div className="input-wrapper">
                  <input
                    type="text"
                    id="roomName"
                    value={roomName}
                    onChange={handleRoomNameChange}
                    className={roomName ? "has-value" : ""}
                  />
                  <label htmlFor="roomName">Room Name</label>
                  <button className="random-btn" onClick={generateRandomName}>
                    <img src={Dice} alt="random name" width="25" height="25" />
                    Random
                  </button>
                </div>
                {error && <p className="error-message">{error}</p>}
              </div>
            </div>

            <div className="modal-footer">
              <button className="create-btn" onClick={handleCreateRoom}>
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default RoomControls;