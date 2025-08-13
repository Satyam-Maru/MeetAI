import React, { useState, useRef } from 'react';
import Modal from 'react-modal';
import '../styles/ShareModal.css';

const ShareModal = ({ isOpen, onRequestClose, roomUrl }) => {
  const [isCopied, setIsCopied] = useState(false);
  const textInputRef = useRef(null);

  const copyToClipboard = () => {
    if (textInputRef.current) {
      textInputRef.current.select();
      navigator.clipboard.writeText(roomUrl).then(() => {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000); // Reset after 2 seconds
      });
    }
  };

  const shareOnWhatsApp = () => {
    const message = `Join my MeetAI room: ${roomUrl}`;
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onRequestClose}
      className="share-modal"
      overlayClassName="share-modal-overlay"
      ariaHideApp={false}
    >
      <div className="share-modal-header">
        <h2>Room Created!</h2>
        <button onClick={onRequestClose} className="close-button">&times;</button>
      </div>
      <div className="share-modal-body">
        <p>Share this link with others to join:</p>
        <div className="share-link-container">
          <input type="text" value={roomUrl} readOnly ref={textInputRef} />
          <button onClick={copyToClipboard}>
            {isCopied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </div>
      <div className="share-modal-footer">
        <button onClick={shareOnWhatsApp} className="whatsapp-button">
          Share on WhatsApp
        </button>
      </div>
    </Modal>
  );
};

export default ShareModal;