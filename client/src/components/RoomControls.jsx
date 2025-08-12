import React, { useState, useRef, use } from "react";
import "../styles/RoomControls.css";
import Dice from "../assets/dice-svg.svg";
import Modal from "react-modal";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import MediaSetupModal from "./MediaSetupModal"; // Import the new component

Modal.setAppElement("#root");

const RoomControls = ({ onLogout, user }) => {
  const navigate = useNavigate();
  const [inputValue, setInputValue] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [roomName, setRoomName] = useState("");
  const [error, setError] = useState("");
  const bridgeRef = useRef(null);
  const [isJoined, setIsJoined] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showMediaSetup, setShowMediaSetup] = useState(false);

  const predefinedNames = [
    "Cosmic",
    "Galaxy",
    "Quantum",
    "Nebula",
    "Stellar",
    "Orbit",
    "Pulsar",
    "Vortex",
    "Celestial",
    "Infinity",
  ];

  const url = import.meta.env.VITE_PLATFORM == 'dev' ? import.meta.env.VITE_LOCALHOST_URL : import.meta.env.VITE_BACKEND_URL;

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
    if (bridgeRef.current) {
      bridgeRef.current.classList.remove("joined");
      setIsJoined(false);
      bridgeRef.current.classList.toggle("active-flow", e.target.value.trim());
    }
  };

  const handleRoomNameChange = (e) => {
    setRoomName(e.target.value);
    setError("");
  };

  const generateRandomName = () => {
    const randomIndex = Math.floor(Math.random() * predefinedNames.length);
    const randomSuffix = Math.floor(100 + Math.random() * 900); // 3-digit number
    const randomName = `${predefinedNames[randomIndex]}${randomSuffix}`;
    setRoomName(randomName);
    setError("");
  };

  const handleCreateRoom = async () => {
    if (!roomName.trim()) {
      setError("Room name cannot be empty");
      return;
    }
    // Here you would typically call an API to create the room
    console.log("Creating room:", roomName);
    // navigate(`/room/${roomName}?host=true&identity=${user.name}`);
    try{
      const roomData = await axios.post(`${url}/check-room`, {room_name: roomName})
      console.log(`data from server: ${roomData.data.msg}`)
      if(roomData.data.msg == 'failure') {
        setError('Room already exists')
      }else{
        setError('')
        setShowMediaSetup(true);
      }
    }
    catch (err){
      setError(err.message)
      console.log(`err in handleCreateRoom: ${err.message}`)
    }
    // setShowCreateModal(false);
  };

  const joinRoom = () => {
    setIsJoined(true);
    setShowMediaSetup(true);
  };
  
  const handleJoin = (mediaSettings) => {
    console.log("Joining room with settings:", mediaSettings);
    if (inputValue.trim()) {
      navigate(`/room/${inputValue.trim()}?identity=${user.name}&mic=${mediaSettings.micOn}&video=${mediaSettings.cameraOn}`);
    } else if (roomName.trim()) {
      navigate(`/room/${roomName}?host=true&identity=${user.name}&mic=${mediaSettings.micOn}&video=${mediaSettings.cameraOn}`);
    }
  };

  return (
    <>
      {/* User Profile Floating Button */}
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
      {/* User Profile Modal */}
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
              <div className="gear-container">
                <svg
                  className="gear gear-1"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                >
                  <path
                    fill="currentColor"
                    d="M12,15.5A3.5,3.5 0 0,1 8.5,12A3.5,3.5 0 0,1 12,8.5A3.5,3.5 0 0,1 15.5,12A3.5,3.5 0 0,1 12,15.5M19.43,12.97C19.47,12.65 19.5,12.33 19.5,12C19.5,11.67 19.47,11.34 19.43,11L21.54,9.37C21.73,9.22 21.78,8.95 21.66,8.73L19.66,5.27C19.54,5.05 19.27,4.96 19.05,5.05L16.56,6.05C16.04,5.66 15.5,5.32 14.87,5.07L14.5,2.42C14.46,2.18 14.25,2 14,2H10C9.75,2 9.54,2.18 9.5,2.42L9.13,5.07C8.5,5.32 7.96,5.66 7.44,6.05L4.95,5.05C4.73,4.96 4.46,5.05 4.34,5.27L2.34,8.73C2.21,8.95 2.27,9.22 2.46,9.37L4.57,11C4.53,11.34 4.5,11.67 4.5,12C4.5,12.33 4.53,12.65 4.57,12.97L2.46,14.63C2.27,14.78 2.21,15.05 2.34,15.27L4.34,18.73C4.46,18.95 4.73,19.03 4.95,18.95L7.44,17.94C7.96,18.34 8.5,18.68 9.13,18.93L9.5,21.58C9.54,21.82 9.75,22 10,22H14C14.25,22 14.46,21.82 14.5,21.58L14.87,18.93C15.5,18.67 16.04,18.34 16.56,17.94L19.05,18.95C19.27,19.03 19.54,18.95 19.66,18.73L21.66,15.27C21.78,15.05 21.73,14.78 21.54,14.63L19.43,12.97Z"
                  />
                </svg>
                <svg
                  className="gear gear-2"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                >
                  <path
                    fill="currentColor"
                    d="M12,15.5A3.5,3.5 0 0,1 8.5,12A3.5,3.5 0 0,1 12,8.5A3.5,3.5 0 0,1 15.5,12A3.5,3.5 0 0,1 12,15.5M19.43,12.97C19.47,12.65 19.5,12.33 19.5,12C19.5,11.67 19.47,11.34 19.43,11L21.54,9.37C21.73,9.22 21.78,8.95 21.66,8.73L19.66,5.27C19.54,5.05 19.27,4.96 19.05,5.05L16.56,6.05C16.04,5.66 15.5,5.32 14.87,5.07L14.5,2.42C14.46,2.18 14.25,2 14,2H10C9.75,2 9.54,2.18 9.5,2.42L9.13,5.07C8.5,5.32 7.96,5.66 7.44,6.05L4.95,5.05C4.73,4.96 4.46,5.05 4.34,5.27L2.34,8.73C2.21,8.95 2.27,9.22 2.46,9.37L4.57,11C4.53,11.34 4.5,11.67 4.5,12C4.5,12.33 4.53,12.65 4.57,12.97L2.46,14.63C2.27,14.78 2.21,15.05 2.34,15.27L4.34,18.73C4.46,18.95 4.73,19.03 4.95,18.95L7.44,17.94C7.96,18.34 8.5,18.68 9.13,18.93L9.5,21.58C9.54,21.82 9.75,22 10,22H14C14.25,22 14.46,21.82 14.5,21.58L14.87,18.93C15.5,18.67 16.04,18.34 16.56,17.94L19.05,18.95C19.27,19.03 19.54,18.95 19.66,18.73L21.66,15.27C21.78,15.05 21.73,14.78 21.54,14.63L19.43,12.97Z"
                  />
                </svg>
              </div>
            </button>
          </div>

          <div className="room-input-wrapper">
            <input
              className="room-input"
              type="text"
              placeholder="Have an invite link?"
              value={inputValue}
              onChange={handleInputChange}
            />
            <div
              className={`connection-bridge ${isJoined ? "joined" : ""}`}
              ref={bridgeRef}
            ></div>
          </div>

          <button
            className="button secondary-button"
            onClick={joinRoom}
            disabled={!inputValue.trim()}
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

      {/* Create Room Modal */}
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
                    <img src={Dice} alt="" width="25" height="25" />
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