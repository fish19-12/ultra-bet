import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Admin from "./pages/Admin";
import UltraBet from "./pages/UltraBet";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/admin/*" element={<Admin />} />
        <Route path="*" element={<UltraBet />} />
      </Routes>
    </Router>
  );
}

export default App;
