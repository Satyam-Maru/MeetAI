import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { GoogleOAuthProvider } from "@react-oauth/google";
import Home from "./pages/Home";
import Room from "./pages/Room";
import "./App.css";
import RoomPage from "./pages/RoomPage";
import PageNotFound from './pages/PageNotFound';

const App = () => {
  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/room/:roomName" element={<RoomPage />} />
            <Route path="/roompage" element={<Room />} />
            <Route path="*" element={<PageNotFound />} />
          </Routes>
        </Router>
      </AuthProvider>
    </GoogleOAuthProvider>
  );
};

export default App;
