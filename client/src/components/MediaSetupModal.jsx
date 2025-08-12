import React, { useState, useEffect, useRef } from "react";
import Modal from "react-modal";
import "../styles/MediaSetupModal.css";

Modal.setAppElement("#root");

// --- SVG Icons ---
const MicOnIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
        <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
        <line x1="12" y1="19" x2="12" y2="23"></line>
        <line x1="8" y1="23" x2="16" y2="23"></line>
    </svg>
);

const MicOffIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="1" y1="1" x2="23" y2="23"></line>
        <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"></path>
        <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"></path>
        <line x1="12" y1="19" x2="12" y2="23"></line>
        <line x1="8" y1="23" x2="16" y2="23"></line>
    </svg>
);

const VideoOnIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="23 7 16 12 23 17 23 7"></polygon>
        <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
    </svg>
);

const VideoOffIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2m5.66 0H14a2 2 0 0 1 2 2v3.34l1 1L23 7v10"></path>
        <line x1="1" y1="1" x2="23" y2="23"></line>
    </svg>
);

const CloseIcon = () => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
);

const VideoDisabledIcon = () => (
    <svg width="96" height="96" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2m5.66 0H14a2 2 0 0 1 2 2v3.34l1 1L23 7v10"></path>
        <line x1="1" y1="1" x2="23" y2="23"></line>
    </svg>
);


const MediaSetupModal = ({ isOpen, onRequestClose, onJoin }) => {
  const [micOn, setMicOn] = useState(true);
  const [cameraOn, setCameraOn] = useState(true);
  const [error, setError] = useState("");
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      const getMedia = async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true,
          });
          streamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
          setError("");
        } catch (err) {
          if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
            setError(
              "Camera and microphone access denied. Please allow access in your browser settings to continue."
            );
          } else {
            setError("Could not access your camera or microphone.");
          }
          console.error("Error accessing media devices:", err);
        }
      };
      getMedia();
    } else {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    }
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isOpen]);

  const toggleMic = () => {
    if (streamRef.current) {
      streamRef.current
        .getAudioTracks()
        .forEach((track) => (track.enabled = !micOn));
      setMicOn(!micOn);
    }
  };

  const toggleCamera = async () => {
    setCameraOn(prevCameraOn => {
      const newCameraState = !prevCameraOn;
      if (streamRef.current) {
        if (newCameraState) {
          // Turning camera ON
          navigator.mediaDevices.getUserMedia({ video: true })
            .then(videoStream => {
              const videoTrack = videoStream.getVideoTracks()[0];
              const audioTracks = streamRef.current.getAudioTracks();
              streamRef.current.getVideoTracks().forEach(track => track.stop()); // Stop existing video tracks
              const newStream = new MediaStream([...audioTracks, videoTrack]);
              streamRef.current = newStream;
              if (videoRef.current) {
                videoRef.current.srcObject = newStream;
              }
            })
            .catch(err => {
              console.error("Failed to get video track", err);
              setError("Could not access your camera.");
              setCameraOn(false); // Revert state on error
            });
        } else {
          // Turning camera OFF
          streamRef.current.getVideoTracks().forEach(track => {
            track.stop();
            streamRef.current.removeTrack(track);
          });
        }
      }
      return newCameraState;
    });
  };

  const handleJoin = () => {
    onJoin({ micOn, cameraOn });
    onRequestClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onRequestClose}
      className={{
        base: "media-setup-modal",
        afterOpen: "media-setup-modal--after-open",
        beforeClose: "media-setup-modal--before-close"
      }}
      overlayClassName={{
        base: "media-setup-overlay",
        afterOpen: "media-setup-overlay--after-open",
        beforeClose: "media-setup-overlay--before-close"
      }}
      shouldCloseOnOverlayClick={false}
      closeTimeoutMS={200}
    >
      <div className="modal-header">
        <h2 className="modal-title">Ready to join?</h2>
        <button className="close-button" onClick={onRequestClose} aria-label="Close">
            <CloseIcon />
        </button>
      </div>
      <div className="modal-body">
        <div className="video-preview-container">
            {error ? (
            <div className="error-message-container">
                <p className="error-message">{error}</p>
            </div>
            ) : (
              <>
                <video ref={videoRef} autoPlay playsInline muted style={{ display: cameraOn ? 'block' : 'none' }} />
                {!cameraOn && (
                    <div className="video-disabled-container">
                        <VideoDisabledIcon />
                    </div>
                )}
              </>
            )}
        </div>
      </div>
      <div className="modal-footer">
        <div className="control-button-group">
            <button
                className={`control-button ${micOn ? "" : "off"}`}
                onClick={toggleMic}
                aria-label={micOn ? "Mute microphone" : "Unmute microphone"}
            >
                {micOn ? <MicOnIcon /> : <MicOffIcon />}
            </button>
            <button
                className={`control-button ${cameraOn ? "" : "off"}`}
                onClick={toggleCamera}
                aria-label={cameraOn ? "Turn off camera" : "Turn on camera"}
            >
                {cameraOn ? <VideoOnIcon /> : <VideoOffIcon />}
            </button>
        </div>
        <button className="join-button" onClick={handleJoin} disabled={!!error}>
            Join Room
        </button>
      </div>
    </Modal>
  );
};

export default MediaSetupModal;