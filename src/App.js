import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import Home from "./components/Home";
import Teams from "./components/Teams";
import Games from "./components/Games";
import Stats from "./components/Stats";
import More from "./components/More";
import "./App.css";
import { FaHome, FaChartBar, FaUsers, FaFootballBall, FaEllipsisH } from "react-icons/fa";

function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  const toggleMenu = () => setMenuOpen(!menuOpen);
  const toggleDarkMode = () => setDarkMode(!darkMode);

  return (
    <Router>
      <div className={`app ${darkMode ? "dark" : ""}`}>
        {/* Header */}
        <header className={`app-header ${darkMode ? "dark" : ""}`}>
          <div className="header-content">
            <h1 className="header-logo">Gameday</h1>
            <button className="hamburger-menu" onClick={toggleMenu}>
              &#9776;
            </button>
            <div className={`header-links ${menuOpen ? "active" : ""} ${darkMode ? "dark" : ""}`}>
              <a href="/signin" className="header-link">
                Sign In
              </a>
              <a href="/subscribe" className="header-link">
                Subscribe
              </a>
              <button onClick={toggleDarkMode} className="header-link">
                {darkMode ? "Light Mode" : "Dark Mode"}
              </button>
            </div>
          </div>
        </header>

        {/* Navigation Bar */}
        <nav className={`app-nav ${menuOpen ? "active" : ""} ${darkMode ? "dark" : ""}`}>
          <Link to="/" className="nav-item" onClick={toggleMenu}>
            <FaHome /> Home
          </Link>
          <Link to="/teams" className="nav-item" onClick={toggleMenu}>
            <FaUsers /> Teams
          </Link>
          <Link to="/games" className="nav-item" onClick={toggleMenu}>
            <FaFootballBall /> Games
          </Link>
          <Link to="/stats" className="nav-item" onClick={toggleMenu}>
            <FaChartBar /> Stats
          </Link>
          <Link to="/more" className="nav-item" onClick={toggleMenu}>
            <FaEllipsisH /> More
          </Link>
        </nav>

        {/* Main Content */}
        <main className="app-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/teams" element={<Teams />} />
            <Route path="/games" element={<Games />} />
            <Route path="/stats" element={<Stats />} />
            <Route path="/more" element={<More />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;

