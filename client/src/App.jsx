import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import RoomPage from "./pages/Room";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/room" element={<RoomPage />} />
        {/* other routes */}
      </Routes>
    </Router>
  );
}
