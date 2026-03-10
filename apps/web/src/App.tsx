import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import ZoomCallback from "./pages/ZoomCallback";
import Meetings from "./pages/Meetings";
import "./App.css";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/zoom/callback" element={<ZoomCallback />} />
        <Route path="/meetings" element={<Meetings />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
