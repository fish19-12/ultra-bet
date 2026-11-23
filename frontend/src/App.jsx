import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import UltraBet from "./pages/UltraBet";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="*" element={<UltraBet />} />
      </Routes>
    </Router>
  );
}

export default App;
