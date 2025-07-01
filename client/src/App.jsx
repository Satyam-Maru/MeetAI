import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Room from "./pages/Room";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/room" element={<Room />} />
        {/* other routes */}
      </Routes>
    </Router>
  );
}