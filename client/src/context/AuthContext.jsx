import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";
import { useLocation } from "react-router-dom";

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
  const location = useLocation();

  const url = import.meta.env.VITE_PLATFORM === "dev"
    ? import.meta.env.VITE_LOCALHOST_URL
    : import.meta.env.VITE_BACKEND_URL;

  const fetchUser = async () => {
    try {
      const res = await axios.get(`${url}/api/auth/profile`);
      console.log(`user authenticated`)
      setUser(res.data.user);
      setIsLoggedIn(true);
    } catch {
      console.log('not auth')
      setUser(null);
      setIsLoggedIn(false);
    } finally {
      setLoading(false);
    }
  };

  // Run once on mount
  useEffect(() => {
    fetchUser();
  }, []);

  const handleLoginSuccess = async ({ token }) => {
    try {
      await axios.post(`${url}/api/auth/login`, { token });
      await fetchUser();
      setShowAuthModal(false);
    } catch (err) {
      console.error("Google login failed:", err);
    }
  };

  const handleEmailLogin = async (isSignUp) => {
    try {
      const endpoint = isSignUp ? "/api/auth/signup" : "/api/auth/login";
      await axios.post(`${url}${endpoint}`, { email, password });
      await fetchUser();
      setShowAuthModal(false);
    } catch (err) {
      console.error(`${isSignUp ? "Signup" : "Login"} failed:`, err);
    }
  };

  const handleLogout = async () => {
    try {
      const res = await axios.post(`${url}/api/auth/logout`);
      console.log(`logout message: ${res.data.message}`);
    } catch (err) {
      console.error("Logout failed:", err);
    } finally {
      setUser(null);
      setIsLoggedIn(false);
    }
  };

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
        setEmail,
        setPassword,
        setAuthMode,
        setShowAuthModal,
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