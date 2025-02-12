import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import Home from "./components/Home";
import Teams from "./components/Teams";
import Games from "./components/Games";
import Stats from "./components/Stats";
import More from "./components/More";
import Chatbot from "./components/Chatbot";
import GameDetailView from "./components/GameDetailView";
import TeamDetail from "./components/TeamDetailView";
import "./App.css";
import "./Navbar.css";
import { FaHome, FaChartBar, FaUsers, FaFootballBall, FaEllipsisH } from "react-icons/fa";

function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(null);

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  const toggleDropdown = (menu) => {
    setDropdownOpen((prev) => (prev === menu ? null : menu));
  };

  return (
    <Router>
      <div className="app">
        <header className="app-header">
          <div className="header-content">
            <h1 className="header-logo">Gameday</h1>
            <nav className="header-nav">
              <div className="dropdown" onMouseEnter={() => toggleDropdown("conferences")} onMouseLeave={() => toggleDropdown(null)}>
                <button className="dropdown-button">Conferences</button>
                {dropdownOpen === "conferences" && (
                  <div className="dropdown-menu">
                    <Link to="/sec">SEC</Link>
                    <Link to="/bigten">Big Ten</Link>
                    <Link to="/acc">ACC</Link>
                    <Link to="/pac12">Pac-12</Link>
                    <Link to="/big12">Big 12</Link>
                    <Link to="/others">Others</Link>
                  </div>
                )}
              </div>
              
              <div className="dropdown" onMouseEnter={() => toggleDropdown("lines")} onMouseLeave={() => toggleDropdown(null)}>
                <button className="dropdown-button">Lines</button>
                {dropdownOpen === "lines" && (
                  <div className="dropdown-menu">
                    <Link to="/current-lines">Current Game Lines</Link>
                    <Link to="/spread-analysis">Spread Analysis</Link>
                    <Link to="/moneyline-comparisons">Moneyline Comparisons</Link>
                    <Link to="/over-under-metrics">Over/Under Metrics</Link>
                  </div>
                )}
              </div>
              
              <div className="dropdown" onMouseEnter={() => toggleDropdown("gamedaygpt")} onMouseLeave={() => toggleDropdown(null)}>
                <button className="dropdown-button">GamedayGPT</button>
                {dropdownOpen === "gamedaygpt" && (
                  <div className="dropdown-menu">
                    <Link to="/predict-outcomes">Predict Outcomes</Link>
                    <Link to="/ask-questions">Ask Questions</Link>
                    <Link to="/betting-suggestions">Betting Suggestions</Link>
                  </div>
                )}
              </div>
            </nav>
            
            <div className="header-buttons">
              <a href="/signin" className="header-link">Sign In</a>
              <a href="/subscribe" className="header-link subscribe-button">Subscribe</a>
            </div>
          </div>
        </header>

        <nav className={`app-nav ${menuOpen ? "active" : ""}`}>
          <Link to="/" className="nav-item" onClick={toggleMenu}><FaHome /> Home</Link>
          <Link to="/teams" className="nav-item" onClick={toggleMenu}><FaUsers /> Teams</Link>
          <Link to="/games" className="nav-item" onClick={toggleMenu}><FaFootballBall /> Games</Link>
          <Link to="/stats" className="nav-item" onClick={toggleMenu}><FaChartBar /> Stats</Link>
          <Link to="/more" className="nav-item" onClick={toggleMenu}><FaEllipsisH /> More</Link>
        </nav>

        <main className="app-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/teams" element={<Teams />} />
            <Route path="/teams/:teamId" element={<TeamDetail />} />
            <Route path="/games" element={<Games />} />
            <Route path="/stats" element={<Stats />} />
            <Route path="/more" element={<More />} />
            <Route path="/ask-questions" element={<Chatbot />} />
            <Route path="/games/:gameId" element={<GameDetailView />} />
            <Route path="/predict-outcomes" element={<div>Predict Outcomes Page</div>} />
            <Route path="/betting-suggestions" element={<div>Betting Suggestions Page</div>} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;

