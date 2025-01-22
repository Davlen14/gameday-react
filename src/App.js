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
            <h1 className="header-logo">GameDay+</h1>
            <button className="hamburger-menu" onClick={toggleMenu}>
              &#9776;
            </button>
            <div className={`header-links ${menuOpen ? "active" : ""}`}>
              <a href="/signin" className="header-link">
                Sign In
              </a>
              <a href="/subscribe" className="header-link">
                Subscribe
              </a>
            </div>
          </div>
        </header>

        {/* Navigation Bar */}
        <nav className={`app-nav ${menuOpen ? "active" : ""}`}>
          <div className="nav-item">
            <Link to="/">Home</Link>
          </div>
          <div className="nav-item">
            <Link to="/teams">Teams</Link>
            <div className="dropdown-menu">
              <Link to="/teams/sec">SEC</Link>
              <Link to="/teams/bigten">Big Ten</Link>
              <Link to="/teams/acc">ACC</Link>
            </div>
          </div>
          <div className="nav-item">
            <Link to="/games">Games</Link>
            <div className="dropdown-menu">
              <Link to="/games/live">Live Games</Link>
              <Link to="/games/upcoming">Upcoming Games</Link>
            </div>
          </div>
          <div className="nav-item">
            <Link to="/stats">Metrics</Link>
            <div className="dropdown-menu">
              <Link to="/stats/advanced">Advanced Stats</Link>
              <Link to="/stats/player">Player Stats</Link>
            </div>
          </div>
          <div className="nav-item">
            <Link to="/gamedaygpt">GamedayGPT</Link>
            <div className="dropdown-menu">
              <Link to="/gamedaygpt/predictions">Predictions</Link>
              <Link to="/gamedaygpt/questions">Ask GPT</Link>
            </div>
          </div>
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
