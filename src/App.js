import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import Home from "./components/Home";
import Teams from "./components/Teams";
import Games from "./components/Games";
import Stats from "./components/Stats";
import More from "./components/More";
import Chatbot from "./components/Chatbot";
import GameDetailView from "./components/GameDetailView";
import TeamDetail from "./components/TeamDetailView"; // Added TeamDetail import
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
        {/* Adding Google Font Link */}
        <link
          href="https://fonts.googleapis.com/css2?family=Titillium+Web:wght@200;300;400;600;700;900&display=swap"
          rel="stylesheet"
        />

        {/* Header */}
        <header className="app-header">
          <div className="header-content">
            <h1 className="header-logo">Gameday</h1>
            <nav className="header-nav">
              {/* Conferences */}
              <div
                className="dropdown"
                onMouseEnter={() => toggleDropdown("conferences")}
                onMouseLeave={() => toggleDropdown(null)}
              >
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

              {/* Lines */}
              <div
                className="dropdown"
                onMouseEnter={() => toggleDropdown("lines")}
                onMouseLeave={() => toggleDropdown(null)}
              >
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

              {/* Metrics */}
              <div
                className="dropdown"
                onMouseEnter={() => toggleDropdown("metrics")}
                onMouseLeave={() => toggleDropdown(null)}
              >
                <button className="dropdown-button">Metrics</button>
                {dropdownOpen === "metrics" && (
                  <div className="dropdown-menu">
                    <Link to="/team-comparisons">Team Comparisons</Link>
                    <Link to="/advanced-box-scores">Advanced Box Scores</Link>
                    <Link to="/player-analytics">Player Analytics</Link>
                    <Link to="/power-rankings">Power Rankings</Link>
                  </div>
                )}
              </div>

              {/* GamedayGPT */}
              <div
                className="dropdown"
                onMouseEnter={() => toggleDropdown("gamedaygpt")}
                onMouseLeave={() => toggleDropdown(null)}
              >
                <button className="dropdown-button">GamedayGPT</button>
                {dropdownOpen === "gamedaygpt" && (
                  <div className="dropdown-menu">
                    <Link to="/predict-outcomes">Predict Outcomes</Link>
                    <Link to="/ask-questions">Ask Questions</Link>
                    <Link to="/betting-suggestions">Betting Suggestions</Link>
                  </div>
                )}
              </div>

              {/* Tools */}
              <div
                className="dropdown"
                onMouseEnter={() => toggleDropdown("tools")}
                onMouseLeave={() => toggleDropdown(null)}
              >
                <button className="dropdown-button">Tools</button>
                {dropdownOpen === "tools" && (
                  <div className="dropdown-menu">
                    <Link to="/play-by-play">Play-by-Play Analysis</Link>
                    <Link to="/game-simulations">Game Simulations</Link>
                    <Link to="/live-updates">Live Updates</Link>
                  </div>
                )}
              </div>

              {/* Resources */}
              <div
                className="dropdown"
                onMouseEnter={() => toggleDropdown("resources")}
                onMouseLeave={() => toggleDropdown(null)}
              >
                <button className="dropdown-button">Resources</button>
                {dropdownOpen === "resources" && (
                  <div className="dropdown-menu">
                    <Link to="/how-to-use">How to Use Gameday</Link>
                    <Link to="/tutorials">Tutorials</Link>
                    <Link to="/faq">FAQ</Link>
                  </div>
                )}
              </div>
            </nav>
            <div className="header-buttons">
              <a href="/signin" className="header-link">
                Sign In
              </a>
              <a href="/subscribe" className="header-link subscribe-button">
                Subscribe
              </a>
            </div>
          </div>
        </header>

        {/* Navigation Bar */}
        <nav className={`app-nav ${menuOpen ? "active" : ""}`}>
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
            <Route path="/teams/:teamId" element={<TeamDetail />} /> {/* Added team detail route */}
            <Route path="/games" element={<Games />} />
            <Route path="/stats" element={<Stats />} />
            <Route path="/more" element={<More />} />
            <Route path="/ask-questions" element={<Chatbot />} />
            <Route path="/games/:gameId" element={<GameDetailView />} />

            {/* Conference Placeholders */}
            <Route path="/sec" element={<div>SEC Conference Page</div>} />
            <Route path="/bigten" element={<div>Big Ten Conference Page</div>} />
            <Route path="/acc" element={<div>ACC Conference Page</div>} />
            <Route path="/pac12" element={<div>Pac-12 Conference Page</div>} />
            <Route path="/big12" element={<div>Big 12 Conference Page</div>} />
            <Route path="/others" element={<div>Other Conferences Page</div>} />

            {/* Lines Placeholders */}
            <Route path="/current-lines" element={<div>Current Lines Page</div>} />
            <Route path="/spread-analysis" element={<div>Spread Analysis Page</div>} />
            <Route path="/moneyline-comparisons" element={<div>Moneyline Comparisons Page</div>} />
            <Route path="/over-under-metrics" element={<div>Over/Under Metrics Page</div>} />

            {/* Metrics Placeholders */}
            <Route path="/team-comparisons" element={<div>Team Comparisons Page</div>} />
            <Route path="/advanced-box-scores" element={<div>Advanced Box Scores Page</div>} />
            <Route path="/player-analytics" element={<div>Player Analytics Page</div>} />
            <Route path="/power-rankings" element={<div>Power Rankings Page</div>} />

            {/* GamedayGPT Placeholders */}
            <Route path="/predict-outcomes" element={<div>Predict Outcomes Page</div>} />
            <Route path="/betting-suggestions" element={<div>Betting Suggestions Page</div>} />

            {/* Tools Placeholders */}
            <Route path="/play-by-play" element={<div>Play-by-Play Analysis Page</div>} />
            <Route path="/game-simulations" element={<div>Game Simulations Page</div>} />
            <Route path="/live-updates" element={<div>Live Updates Page</div>} />

            {/* Resources Placeholders */}
            <Route path="/how-to-use" element={<div>How to Use Page</div>} />
            <Route path="/tutorials" element={<div>Tutorials Page</div>} />
            <Route path="/faq" element={<div>FAQ Page</div>} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
