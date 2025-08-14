// client/src/components/WaitingRoomModal.jsx

import React from 'react';
import Modal from 'react-modal';
import '../styles/WaitingRoomModal.css';

// SVG Icons for buttons
const AdmitIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
);
const RejectIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
);

const WaitingRoomModal = ({ isOpen, onRequestClose, pendingParticipants = [], onApprove, onReject, onBack }) => {
  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onRequestClose}
      className="waiting-room-modal"
      overlayClassName="waiting-room-overlay"
      ariaHideApp={false}
    >
      <div className="modal-header">
        <button onClick={onBack} className="back-button">&larr;</button>
        <h2>Waiting Room</h2>
        <button onClick={onRequestClose} className="close-button">&times;</button>
      </div>
      <div className="modal-body">
        {pendingParticipants.length > 0 ? (
          <ul className="participant-list">
            {pendingParticipants.map((participant) => (
              <li key={participant.email} className="participant-item">
                <div className="participant-info">
                  <img src={participant.photoURL} alt={participant.name} className="avatar" />
                  <div className="participant-name">{participant.name}</div>
                </div>
                <div className="action-buttons">
                  <button onClick={() => onApprove(participant.name)} className="action-button approve">
                    <AdmitIcon />
                  </button>
                  <button onClick={() => onReject(participant.name)} className="action-button reject">
                    <RejectIcon />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="empty-message">No one is waiting to join.</p>
        )}
      </div>
    </Modal>
  );
};

export default WaitingRoomModal;