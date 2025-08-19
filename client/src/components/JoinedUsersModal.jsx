import React, { useState } from 'react';
import Modal from 'react-modal';
import '../styles/JoinedUsersModal.css';

const JoinedUsersModal = ({ isOpen, onRequestClose, participants, onRemoveParticipant, onBack, hostIdentity, isHost }) => {
  const [removingId, setRemovingId] = useState(null);

  const handleRemoveClick = async (identity) => {
    setRemovingId(identity);
    try {
      await onRemoveParticipant(identity);
      // The participant will be removed from the list on the next render,
      // so we don't need to manually set removingId back to null here.
    } catch (error) {
      console.error("Failed to remove participant on client:", error);
      setRemovingId(null); // Reset spinner on failure
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onRequestClose}
      className="joined-users-modal"
      overlayClassName="joined-users-overlay"
      ariaHideApp={false}
    >
      <div className="modal-header">
        <button onClick={onBack} className="back-button">&larr;</button>
        <h2>Joined Users</h2>
        <button onClick={onRequestClose} className="close-button">&times;</button>
      </div>
      <div className="modal-body">
        {participants.length > 0 ? (
          <ul className="participant-list">
            {participants.map((participant) => (
              <li key={participant.sid} className="participant-item">
                <div className="participant-info">
                  <div className="avatar">{participant.identity.charAt(0).toUpperCase()}</div>
                  <div className="participant-name">
                    {participant.identity}
                    {participant.identity === hostIdentity && <span className="host-tag"> (Host)</span>}
                  </div>
                </div>
                {isHost && participant.identity !== hostIdentity && (
                  <div className="action-buttons">
                    <button 
                      onClick={() => handleRemoveClick(participant.identity)} 
                      className="action-button remove"
                      disabled={removingId === participant.identity}
                    >
                      {removingId === participant.identity ? <div className="spinner"></div> : 'Remove'}
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="empty-message">No other participants have joined.</p>
        )}
      </div>
    </Modal>
  );
};

export default JoinedUsersModal;