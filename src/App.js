import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import Home from "./components/Home";
import Teams from "./components/Teams";
import Games from "./components/Games";
import Stats from "./components/Stats";
import More from "./components/More";
import "./App.css";

function App() {
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  return (
    <Router>
      <div className="app">
        {/* Header */}
        <header className="app-header">
          <div className="header-content">
            <h1 className="header-logo">Gameday+</h1>
            <button className="hamburger-menu" onClick={toggleMenu}>
              &#9776;
            </button>
            <div className={`header-links ${menuOpen ? "active" : ""}`}>
              <div className="header-link">
                Conferences
                <div className="dropdown-menu">
                  <Link to="/conferences/sec">SEC</Link>
                  <Link to="/conferences/bigten">Big Ten</Link>
                  <Link to="/conferences/acc">ACC</Link>
                  <Link to="/conferences/pac12">Pac-12</Link>
                  <Link to="/conferences/big12">Big 12</Link>
                  <Link to="/conferences/others">Others</Link>
                </div>
              </div>
              <div className="header-link">
                Lines
                <div className="dropdown-menu">
                  <Link to="/lines/current">Current Game Lines</Link>
                  <Link to="/lines/spread">Spread Analysis</Link>
                  <Link to="/lines/moneyline">Moneyline Comparisons</Link>
                  <Link to="/lines/overunder">Over/Under Metrics</Link>
                </div>
              </div>
              <div className="header-link">
                Metrics
                <div className="dropdown-menu">
                  <Link to="/metrics/team">Team Comparisons</Link>
                  <Link to="/metrics/advanced">Advanced Box Scores</Link>
                  <Link to="/metrics/player">Player Analytics</Link>
                  <Link to="/metrics/rankings">Power Rankings</Link>
                </div>
              </div>
              <div className="header-link">
                GamedayGPT
                <div className="dropdown-menu">
                  <Link to="/gamedaygpt/predict">Predict Outcomes</Link>
                  <Link to="/gamedaygpt/questions">Ask Questions</Link>
                  <Link to="/gamedaygpt/suggestions">Betting Suggestions</Link>
                </div>
              </div>
              <div className="header-link">
                Tools
                <div className="dropdown-menu">
                  <Link to="/tools/playbyplay">Play-by-Play Analysis</Link>
                  <Link to="/tools/simulations">Game Simulations</Link>
                  <Link to="/tools/updates">Live Updates</Link>
                </div>
              </div>
              <div className="header-link">
                Resources
                <div className="dropdown-menu">
                  <Link to="/resources/howto">How to Use Gameday</Link>
                  <Link to="/resources/tutorials">Tutorials</Link>
                  <Link to="/resources/faq">FAQ</Link>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Navigation Bar */}
        <nav className={`app-nav ${menuOpen ? "active" : ""}`}>
          <Link to="/" className="nav-item" onClick={toggleMenu}>
            Home
          </Link>
          <Link to="/teams" className="nav-item" onClick={toggleMenu}>
            Teams
          </Link>
          <Link to="/games" className="nav-item" onClick={toggleMenu}>
            Games
          </Link>
          <Link to="/stats" className="nav-item" onClick={toggleMenu}>
            Stats
          </Link>
          <Link to="/more" className="nav-item" onClick={toggleMenu}>
            More
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

