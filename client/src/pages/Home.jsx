import React, { useEffect, useState } from "react";
import Modal from "react-modal";
import AuthButtons from "../components/AuthButtons";
import RoomControls from "../components/RoomControls";
import VideoPlaceholder from "../components/VideoPlaceholder";
import { useAuth } from "../context/AuthContext";
import { useLocation } from "react-router-dom";
import "../styles/Home.css";

Modal.setAppElement("#root");

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
    authError,
    setAuthError,
    handleEmailLogin,
    handleLoginSuccess,
    handleLogout,
  } = useAuth();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const from = location.state?.from?.pathname;
    if (!isLoggedIn && from && from !== "/") {
      setShowAuthModal(true);
    }
  }, [location.state, isLoggedIn]);

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
                setAuthMode('signup');
                setShowAuthModal(true);
              }}
            >
              Sign Up
            </button>
            <button
              className="auth-button"
              onClick={() => {
                setAuthMode('signin');
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
        onRequestClose={() => {
          setShowAuthModal(false);
          setShowPassword(false);
          setEmail('');
          setPassword('');
        }}
        className={{
          base: "auth-modal",
          afterOpen: "auth-modal--after-open",
          beforeClose: "auth-modal--before-close",
        }}
        overlayClassName={{
          base: "auth-modal-overlay",
          afterOpen: "auth-modal-overlay--after-open",
          beforeClose: "auth-modal-overlay--before-close",
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
            onClick={() => {
              setShowAuthModal(false);
              setEmail('');
              setPassword('');
              setShowPassword(false);
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

        <div className="auth-form">
          {authError && <p className="auth-error">{authError}</p>}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setAuthError(""); // Clear error on change
            }}
            required
          />
          <div className="password-wrapper">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setAuthError(""); // Clear error on change
              }}
              required
            />
            <button
              type="button"
              className="password-toggle-btn"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                  <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                  <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                  <line x1="2" x2="22" y1="2" y2="22" />
                </svg>
              )}
            </button>
          </div>
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