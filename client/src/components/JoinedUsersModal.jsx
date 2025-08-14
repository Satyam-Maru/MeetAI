import React from 'react';
import Modal from 'react-modal';
import '../styles/JoinedUsersModal.css';

const JoinedUsersModal = ({ isOpen, onRequestClose, participants, onRemoveParticipant, onBack, hostIdentity }) => {
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
                {participant.identity !== hostIdentity && (
                  <div className="action-buttons">
                    <button onClick={() => onRemoveParticipant(participant.identity)} className="action-button remove">
                      Remove
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