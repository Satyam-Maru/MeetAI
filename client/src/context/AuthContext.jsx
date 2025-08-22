import { createContext, useContext, useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import "../styles/Loading.css";
import "../styles/RoomControls.css"

const AuthContext = createContext();

axios.defaults.withCredentials = true;

const Notification = ({ message, type, onDismiss }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss();
    }, 4000); 

    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div className={`notification-container ${type}`}>
      <p className="notification-message">{message}</p>
      <button className="notification-dismiss-btn" onClick={onDismiss}>
        &times;
      </button>
    </div>
  );
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [authMode, setAuthMode] = useState("signin");
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState("");
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [verificationCode, setVerificationCode] = useState(Array(6).fill(""));
  const [resendCooldown, setResendCooldown] = useState(0);
  const location = useLocation();
  const navigate = useNavigate();
  const [notification, setNotification] = useState({ visible: false, message: "", type: "error" });

  const showNotification = useCallback((message, type = 'error') => {
    setNotification({ visible: true, message, type });
  }, []);

  const dismissNotification = useCallback(() => {
    setNotification({ visible: false, message: "", type: "error" });
  }, []);

  const url =
    import.meta.env.VITE_PLATFORM === "dev"
      ? import.meta.env.VITE_LOCALHOST_URL
      : import.meta.env.VITE_BACKEND_URL;

  const fetchUser = async () => {
    try {
      const res = await axios.get(`${url}/api/auth/profile`);
      console.log("auth success");
      setUser(res.data.user);
      setIsLoggedIn(true);
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.log("No auth cookie set — user not logged in");
      } else {
        console.error("Some other error occurred:", error);
      }
      setUser(null);
      setIsLoggedIn(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchUser();
    } else {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCooldown]);
  
  const startResendCooldown = () => {
    setResendCooldown(60);
  };

  const handleLoginSuccess = async ({ token: googleToken }) => {
    try {
      setAuthError("");
      const response = await axios.post(`${url}/api/auth/login`, {
        token: googleToken,
      });
      const { user, token } = response.data;

      localStorage.setItem("authToken", token);
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

      setUser(user);
      setIsLoggedIn(true);
      setShowAuthModal(false);
      const from = location.state?.from?.pathname || "/";
      navigate(from, { replace: true });
    } catch (err) {
      console.log(err.message)
      if (err.code === "ERR_NETWORK") {
        showNotification("Server is starting up. Please try again in a moment.", "info");
      }else{
        setAuthError("Google login failed. Please try again.");
      }
    }
  };

  const handleEmailLogin = (isSignUp) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
    if (!email || !password) {
      setAuthError("Email and password are required.");
      return;
    }
  
    if (!emailRegex.test(email)) {
      setAuthError("Please enter a valid email address.");
      return;
    }
  
    setAuthError("");
  
    if (isSignUp) {
      // Show verification modal immediately for a better user experience
      setShowAuthModal(false);
      setShowVerificationModal(true);
      startResendCooldown();
  
      // Send the request in the background
      axios.post(`${url}/api/auth/signup`, { email, password })
        .catch(err => {
          // Handle errors in the background
          setShowVerificationModal(false); // Close verification modal on error
          setShowAuthModal(true); // Re-open auth modal
          if (err.response && err.response.data && err.response.data.error) {
            setAuthError(err.response.data.error);
          } else {
            setAuthError("An unexpected error occurred. Please try again.");
          }
        });
    } else {
      // Handle sign-in
      axios.post(`${url}/api/auth/signin`, { email, password })
        .then(response => {
          const { user, token } = response.data;
          localStorage.setItem("authToken", token);
          axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
          setUser(user);
          setIsLoggedIn(true);
          setShowAuthModal(false);
          const from = location.state?.from?.pathname || "/";
          navigate(from, { replace: true });
        })
        .catch(err => {
          if (err.code === "ERR_NETWORK") {
            showNotification("Server is starting up. Please wait a moment.", "info");
          } else if (err.response && err.response.data && err.response.data.error) {
            setAuthError(err.response.data.error);
          } else {
            setAuthError("An unexpected error occurred. Please try again.");
          }
        });
    }
  };

  const handleVerification = async (code) => {
    try {
      setAuthError("");
      const response = await axios.post(`${url}/api/auth/verify`, {
        email,
        verificationCode: code,
      });
      const { user, token } = response.data;

      localStorage.setItem("authToken", token);
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

      setUser(user);
      setIsLoggedIn(true);
      setShowVerificationModal(false);
      const from = location.state?.from?.pathname || "/";
      navigate(from, { replace: true });
    } catch (err) {
      if (err.response && err.response.data && err.response.data.error) {
        setAuthError(err.response.data.error);
      } else {
        setAuthError("An unexpected error occurred. Please try again.");
      }
    }
  };

  const resendVerificationCode = async () => {
    if (resendCooldown > 0) return;
    try {
      setAuthError("");
      setVerificationCode(Array(6).fill("")); // Clear old code
      await axios.post(`${url}/api/auth/resend-verification`, { email });
      showNotification("A new verification code has been sent.", "info");
      startResendCooldown();
    } catch (err) {
      if (err.response && err.response.data && err.response.data.error) {
        setAuthError(err.response.data.error);
      } else {
        setAuthError("Failed to resend verification code. Please try again.");
      }
    }
  };

  const handleForgotPassword = () => {
    setAuthError("");
    setAuthMode('resetPassword');
    startResendCooldown();
  
    axios.post(`${url}/api/auth/forgot-password`, { email })
      .catch(err => {
        setAuthMode('forgotPassword'); // Revert UI on error
        if (err.response && err.response.data && err.response.data.error) {
          setAuthError(err.response.data.error);
        } else {
          setAuthError("An unexpected error occurred. Please try again.");
        }
      });
  };

  const handleResetPassword = async (code) => {
    try {
      setAuthError("");
      const response = await axios.post(`${url}/api/auth/reset-password`, {
        email,
        verificationCode: code,
        newPassword,
      });
      const { user, token } = response.data;
      localStorage.setItem("authToken", token);
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      setUser(user);
      setIsLoggedIn(true);
      setShowAuthModal(false);
      const from = location.state?.from?.pathname || "/";
      navigate(from, { replace: true });
    } catch (err) {
      if (err.response && err.response.data && err.response.data.error) {
        setAuthError(err.response.data.error);
      } else {
        setAuthError("An unexpected error occurred. Please try again.");
      }
    }
  };

  const handleLogout = async () => {
    try {
      await axios.post(`${url}/api/auth/logout`);
    } catch (err) {
      console.error("Logout failed:", err);
    } finally {
      setUser(null);
      setIsLoggedIn(false);
      localStorage.removeItem("authToken");
      delete axios.defaults.headers.common["Authorization"];
    }
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <p className="loading-text">Loading...</p>
      </div>
    );
  }

  return (
    <AuthContext.Provider
      value={{
        loading,
        user,
        isLoggedIn,
        email,
        password,
        newPassword,
        authMode,
        showAuthModal,
        authError,
        setEmail,
        setPassword,
        setNewPassword,
        setAuthMode,
        setShowAuthModal,
        setAuthError,
        handleEmailLogin,
        handleLoginSuccess,
        handleLogout,
        showNotification,
        showVerificationModal,
        setShowVerificationModal,
        verificationCode,
        setVerificationCode,
        handleVerification,
        resendVerificationCode,
        resendCooldown,
        handleForgotPassword,
        handleResetPassword,
      }}
    >
      {notification.visible && (
        <Notification
          message={notification.message}
          type={notification.type}
          onDismiss={dismissNotification}
        />
      )}
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);