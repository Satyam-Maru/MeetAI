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

  // Run once on mount
  useEffect(() => {
    fetchUser();
  }, []);

  const handleLoginSuccess = async ({ token }) => {
    try {
      await axios.post(`${url}/api/auth/login`, { token });
      await fetchUser();
      setShowAuthModal(false);
      const from = location.state?.from?.pathname || "/";
      navigate(from, { replace: true });
    } catch (err) {
      console.error("Google login failed:", err);
    }
  };

  const handleEmailLogin = async (isSignUp) => {
    try {
      const endpoint = isSignUp ? "/api/auth/signup" : "/api/auth/signin";
      await axios.post(`${url}${endpoint}`, { email, password });
      await fetchUser();
      setShowAuthModal(false);
      const from = location.state?.from?.pathname || "/";
      navigate(from, { replace: true });
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