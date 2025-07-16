import React, { useEffect } from "react";
import Modal from "react-modal";
import AuthButtons from "../components/AuthButtons";
import RoomControls from "../components/RoomControls";
import VideoPlaceholder from "../components/VideoPlaceholder";
import { useAuth } from "../context/AuthContext";
import { useLocation } from "react-router-dom";
import '../styles/Home.css';

Modal.setAppElement('#root');

const Home = () => {
  const {
    isLoggedIn,
    user,
    email,
    password,
    setEmail,
    setPassword,
    showAuthModal,
    setShowAuthModal,
    authMode,
    setAuthMode,
    handleEmailLogin,
    handleLoginSuccess,
    handleLogout,
  } = useAuth();
  const location = useLocation();

  useEffect(() => {
    const from = location.state?.from?.pathname;
    if (!isLoggedIn && from && from !== "/") {
      setAuthMode("signup");
      setShowAuthModal(true);
    }
  }, [location.state, setAuthMode, setShowAuthModal, isLoggedIn]);


  return (
    <div className="app-container">
      <div className="content">
        <h1 className="title">MeetAI</h1>
        <VideoPlaceholder />
        {isLoggedIn ? (
          <RoomControls user={user} onLogout={handleLogout} />
        ) : (
          <div className="auth-options">
            <button
              className="auth-button"
              onClick={() => {
                setAuthMode("signup");
                setShowAuthModal(true);
              }}
            >
              Sign Up
            </button>
            <button
              className="auth-button"
              onClick={() => {
                setAuthMode("signin");
                setShowAuthModal(true);
              }}
            >
              Sign In
            </button>
          </div>
        )}
      </div>

      <Modal
        isOpen={showAuthModal}
        onRequestClose={() => setShowAuthModal(false)}
        className={{
          base: 'auth-modal',
          afterOpen: 'auth-modal--after-open',
          beforeClose: 'auth-modal--before-close'
        }}
        overlayClassName={{
          base: 'auth-modal-overlay',
          afterOpen: 'auth-modal-overlay--after-open',
          beforeClose: 'auth-modal-overlay--before-close'
        }}
        closeTimeoutMS={300}
      >
        <div className="auth-modal-header">
          <h2>
            {authMode === "signup"
              ? "Create your account"
              : "Sign in to your account"}
          </h2>
          <button
            className="close-button"
            onClick={() => setShowAuthModal(false)}
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

        <div className="auth-form">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button onClick={() => handleEmailLogin(authMode === "signup")}>
            Continue
          </button>
          <div className="divider">or</div>
          <AuthButtons onSuccess={handleLoginSuccess} />
        </div>
      </Modal>
    </div>
  );
};

export default Home;