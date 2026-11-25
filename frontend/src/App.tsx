
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";

import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Profile from "./pages/Profile";
import ApplicationDetails from "./pages/ApplicationDetails";
import CoverLetter from "./pages/CoverLetter";
import AIAssistant from "./pages/AIAssistant";
import ResumeAnalyzer from "./pages/ResumeAnalyzer";
import ResumeOptimizer from "./pages/ResumeOptimizer";
import CareerDevelopment from "./pages/CareerDevelopment";
import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import InterviewPreparation from "./pages/InterviewPreparation";
import FollowUpAssistant from "./pages/FollowUpAssistant";
import FollowUpHistory from "./pages/FollowUpHistory";

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "instant",
    });
  }, [pathname]);

  return null;
}

function App() {
  return (
    <Router>
      <Navbar />
      <ScrollToTop />
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/applications/:id" element={<ApplicationDetails />} />
          <Route path="/cover-letter" element={<CoverLetter />} />
          <Route path="/ai-assistant" element={<AIAssistant />} />
          <Route path="/resume-analyzer" element={<ResumeAnalyzer />} />
          <Route path="/resume-optimizer" element={<ResumeOptimizer />} />
          <Route path="/career-development" element={<CareerDevelopment />} />
          <Route path="/interview-preparation" element={<InterviewPreparation />} />
          <Route path="/follow-up-assistant" element={<FollowUpAssistant />} />
          <Route path="/follow-up-history"element={<FollowUpHistory />}/>
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
