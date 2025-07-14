import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

const AuthContext = createContext();

axios.defaults.withCredentials = true;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authMode, setAuthMode] = useState("signin"); // 'signin' or 'signup'
  const [showAuthModal, setShowAuthModal] = useState(false);

  const url = import.meta.env.VITE_PLATFORM == 'dev' ? import.meta.env.VITE_LOCALHOST_URL : import.meta.env.VITE_BACKEND_URL;

  useEffect(() => {
    axios
      .get(`${url}/api/auth/status`, { withCredentials: true })
      .then((res) => {
        if (res.data.user) { 
          setUser(JSON.parse(res.data.user));
          setIsLoggedIn(true);
        }
      })
      .catch(() => {
        setUser(null);
        setIsLoggedIn(false);
      });
  }, []);

  const handleLoginSuccess = async ({ token }) => {
    try {
      const res = await axios.post(`${url}/api/auth/login`, { token });
      setUser(res.data.user);
      setIsLoggedIn(true);
      setShowAuthModal(false);
    } catch (err) {
      console.error("Google login failed:", err);
    }
  };

  const handleEmailLogin = async (isSignUp) => {
    try {
      const endpoint = isSignUp ? "/api/auth/signup" : "/api/auth/login";
      const res = await axios.post(`${url}${endpoint}`, { email, password });
      setUser(res.data.user);
      setIsLoggedIn(true);
      setShowAuthModal(false);
    } catch (err) {
      console.error(`${isSignUp ? "Signup" : "Login"} failed:`, err);
    }
  };

  const handleLogout = async () => {
    await axios.post(`${url}/api/auth/logout`);
    setUser(null);
    setIsLoggedIn(false);
    window.location.href = "/";
  };

  return (
    <AuthContext.Provider
      value={{
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
