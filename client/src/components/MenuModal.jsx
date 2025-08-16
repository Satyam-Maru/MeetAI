// client/src/components/MenuModal.jsx
import React from "react";
import Modal from "react-modal";
import "../styles/MenuModal.css";

const MenuModal = ({
  isOpen,
  onRequestClose,
  onWaitingRoomClick,
  onJoinedUsersClick,
  waitingRoomCount,
  onToggleCaptions,
  isCaptionsEnabled,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onRequestClose}
      className="menu-modal"
      overlayClassName="menu-modal-overlay"
      ariaHideApp={false}
    >
      <div className="menu-modal-header">
        <h2>Host Menu</h2>
        <button onClick={onRequestClose} className="close-button">
          &times;
        </button>
      </div>
      <div className="menu-modal-body">
        <div className="menu-grid">
          <button className="menu-item" onClick={onWaitingRoomClick}>
            <span className="menu-item-text">Waiting Room</span>
            {waitingRoomCount > 0 && (
              <span className="notification-badge">{waitingRoomCount}</span>
            )}
          </button>
          <button className="menu-item" onClick={onJoinedUsersClick}>
            <span className="menu-item-text">Joined Users</span>
          </button>
          <button className="menu-item" onClick={onToggleCaptions}>
            <span className="menu-item-text">
              {isCaptionsEnabled ? "Disable" : "Enable"} Live Captions
            </span>
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default MenuModal;