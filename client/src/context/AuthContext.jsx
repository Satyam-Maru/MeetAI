import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";

const AuthContext = createContext();

axios.defaults.withCredentials = true;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authMode, setAuthMode] = useState("signin");
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState("");
  const location = useLocation();
  const navigate = useNavigate();

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
      // If a token exists, set it as the default auth header for axios
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchUser(); // fetchUser will now use the token from the header
    } else {
      setLoading(false);
    }
  }, []);

  const handleLoginSuccess = async ({ token: googleToken }) => {
    try {
      setAuthError("");
      // The server now sends back a JWT for our API
      const response = await axios.post(`${url}/api/auth/login`, { token: googleToken });
      const { user, token } = response.data; // Destructure the user and our API token

      localStorage.setItem('authToken', token); // Store the token
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`; // Set for subsequent requests

      setUser(user);
      setIsLoggedIn(true);
      setShowAuthModal(false);
      const from = location.state?.from?.pathname || "/";
      navigate(from, { replace: true });
    } catch (err) {
      console.error("Google login failed:", err);
      setAuthError("Google login failed. Please try again.");
    }
  };

  const handleEmailLogin = async (isSignUp) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email || !password) {
      setAuthError("Email and password are required.");
      return;
    }

    if (!emailRegex.test(email)) {
      setAuthError("Please enter a valid email address.");
      return;
    }

    try {
      setAuthError("");
      const endpoint = isSignUp ? "/api/auth/signup" : "/api/auth/signin";
      const response = await axios.post(`${url}${endpoint}`, { email, password });
      const { user, token } = response.data; // Destructure the user and our API token

      localStorage.setItem('authToken', token); // Store the token
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`; // Set for subsequent requests

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
      console.error(`${isSignUp ? "Signup" : "Login"} failed:`, err);
    }
  };

  const handleLogout = async () => {
    try {
      await axios.post(`${url}/api/auth/logout`);
    } catch (err) {
      console.error("Logout failed:", err);
    } finally {
      // Clear user state and remove the token from storage
      setUser(null);
      setIsLoggedIn(false);
      localStorage.removeItem('authToken');
      delete axios.defaults.headers.common['Authorization'];
    }
  };

  if (loading) {
    return <div className="loading-screen">Loading...</div>;
  }

  return (
    <AuthContext.Provider
      value={{
        loading,
        user,
        isLoggedIn,
        email,
        password,
        authMode,
        showAuthModal,
        authError,
        setEmail,
        setPassword,
        setAuthMode,
        setShowAuthModal,
        setAuthError,
        handleEmailLogin,
        handleLoginSuccess,
        handleLogout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
