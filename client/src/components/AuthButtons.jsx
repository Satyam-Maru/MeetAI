import React, { useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import '../styles/AuthButtons.css';
import GoogleLogo from '../assets/google_svg.svg';

const AuthButtons = ({ onSuccess }) => {
  const [googleReady, setGoogleReady] = useState(false);
  const [showCustomButton, setShowCustomButton] = useState(true);

  useEffect(() => {
    const loadGoogleScript = () => {
      if (window.google) {
        initializeGoogle();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => initializeGoogle();
      document.body.appendChild(script);

      return () => {
        document.body.removeChild(script);
      };
    };

    const initializeGoogle = () => {
      window.google.accounts.id.initialize({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
        callback: handleCredentialResponse,
        auto_select: false,
        cancel_on_tap_outside: true,
        itp_support: true
      });
      setGoogleReady(true);
      setShowCustomButton(true);
    };

    loadGoogleScript();
  }, []);

  const handleGoogleLogin = () => {
    if (!googleReady) return;

    window.google.accounts.id.cancel();
    localStorage.setItem('google_one_tap_initiated', Date.now());

    window.google.accounts.id.prompt(notification => {
      if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
        console.log('Prompt not shown due to:', notification.getNotDisplayedReason());
        setShowCustomButton(false);
        renderButtonFallback();
      }
    });
  };

  const renderButtonFallback = () => {
    const container = document.getElementById('google-button-container');
    if (container && window.google) {
      window.google.accounts.id.renderButton(container, {
        type: 'standard',
        theme: 'outline',
        size: 'medium',
        text: 'continue_with',
        shape: 'rectangular'
      });
    }
  };

  const handleCredentialResponse = (response) => {
    localStorage.removeItem('google_one_tap_initiated');
    
    const userData = jwtDecode(response.credential);
    onSuccess({
      token: response.credential,
      user: {
        name: userData.name,
        email: userData.email,
        picture: userData.picture
      }
    });
    setShowCustomButton(true);
  };

  useEffect(() => {
    if (!showCustomButton) {
      renderButtonFallback();
    }
  }, [showCustomButton]);

  return (
    <div className="button-container">
      {showCustomButton ? (
        <button onClick={handleGoogleLogin} className="google-signin-button">
          <img src={GoogleLogo} alt="Google logo" width="20" height="20" />
          Continue with Google
        </button>
      ) : (
        <div id="google-button-container"></div>
      )}
    </div>
  );
};

export default AuthButtons;