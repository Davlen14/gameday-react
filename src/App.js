import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import { WeekProvider } from "./context/WeekContext"; // ✅ Import WeekProvider
import Home from "./components/Home";
import Teams from "./components/Teams";
import Games from "./components/Games";
import Stats from "./components/Stats";
import More from "./components/More";
import Chatbot from "./components/Chatbot";
import GameDetailView from "./components/GameDetailView";
import TeamDetail from "./components/TeamDetailView";
import Scoreboard from "./components/Scoreboard"; // Import the Scoreboard component
import LatestUpdates from "./components/LatestUpdates"; // ✅ Import the Latest Updates page
import FanHub from "./components/FanHub"; // ✅ Import FanHub for the Fan Hub UI
import TeamAnalytics from "./components/TeamAnalytics"; // ✅ Import the new Team Analytics component
import TeamAnalyticsDetail from "./components/TeamAnalyticsDetail"; // ✅ Import the Team Analytics Detail component
import Lines from "./components/Lines"; // ✅ Import Lines for Spread + Analysis

// New ArbitrageEV Component Import
import ArbitrageEV from "./components/ArbitrageEV";

// NEW: Import CoachOverview Component
import CoachOverview from "./components/CoachOverview";

import "./App.css";
import "./Navbar.css";
import "./Header.css";
import "./styles/Scoreboard.css"; // Import the Scoreboard CSS

// Recruiting Imports (excluding the Recruiting component)
import TopProspects from "./components/TopProspects";
import Commitments from "./components/Commitments";
import TransferPortal from "./components/TransferPortal";

// ------------------------
// Conference Logos, Full Names & Abbreviations
// ------------------------
const conferenceLogos = {
  "ACC": "ACC.png",
  "American Athletic": "American Athletic.png",
  "Big 12": "Big 12.png",
  "Big Ten": "Big Ten.png",
  "Conference USA": "Conference USA.png",
  "FBS Independents": "FBS Independents.png",
  "Mid-American": "Mid-American.png",
  "Mountain West": "Mountain West.png",
  "Pac-12": "Pac-12.png",
  "SEC": "SEC.png",
};

const conferenceList = [
  "SEC",
  "Big Ten",
  "ACC",
  "Pac-12",
  "Big 12",
  "American Athletic",
  "Mountain West",
  "Conference USA",
  "Mid-American",
  "FBS Independents",
];

// Abbreviations for conferences
const conferenceAbbr = {
  "SEC": "SEC",
  "Big Ten": "BT",
  "ACC": "ACC",
  "Pac-12": "Pac-12",
  "Big 12": "B12",
  "American Athletic": "AA",
  "Mountain West": "MW",
  "Conference USA": "C-USA",
  "Mid-American": "MAC",
  "FBS Independents": "FBS",
};

function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(null);
  const [scoreboardVisible, setScoreboardVisible] = useState(true);

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  const toggleDropdown = (menu) => {
    setDropdownOpen((prev) => (prev === menu ? null : menu));
  };

  return (
    <WeekProvider>
      <Router>
        <div className="app">
          {/* TOP SCOREBOARD BAR */}
          <Scoreboard setScoreboardVisible={setScoreboardVisible} />

          {/* TOP NAVBAR */}
          <header className="top-bar">
            <div className="top-bar-container">
              {/* Logo on the Left */}
              <h1 className="top-bar-logo">GAMEDAY+</h1>

              {/* Navigation with Multiple Dropdowns */}
              <nav className="top-bar-nav">
                <div className="dropdown-group">
                  {/* Conferences Dropdown */}
                  <div
                    className="dropdown"
                    onMouseEnter={() => toggleDropdown("conferences")}
                    onMouseLeave={() => toggleDropdown(null)}
                  >
                    <button className="dropdown-button">Conferences</button>
                    {dropdownOpen === "conferences" && (
                      <div className="dropdown-menu">
                        {conferenceList.map((conf) => (
                          <Link
                            to={`/${conf.toLowerCase().replace(/ /g, "")}`} // e.g., '/sec'
                            key={conf}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "6px",
                              fontSize: "0.8rem"
                            }}
                          >
                            <img
                              src={`/photos/${conferenceLogos[conf]}`}
                              alt={conf}
                              style={{
                                width: "30px",
                                height: "30px",
                                objectFit: "contain"
                              }}
                            />
                            {conferenceAbbr[conf] || conf}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Lines Dropdown */}
                  <div
                    className="dropdown"
                    onMouseEnter={() => toggleDropdown("lines")}
                    onMouseLeave={() => toggleDropdown(null)}
                  >
                    <button className="dropdown-button">Lines</button>
                    {dropdownOpen === "lines" && (
                      <div className="dropdown-menu">
                        <Link to="/current-lines">Current Game Lines</Link>
                        <Link to="/spread-analysis">Spread + Analysis</Link>
                        <Link to="/arbitrage-ev">Arbitrage + EV</Link>
                        <Link to="/over-under-metrics">Over/Under Metrics</Link>
                      </div>
                    )}
                  </div>

                  {/* GamedayGPT Dropdown */}
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

                  {/* News Dropdown */}
                  <div
                    className="dropdown"
                    onMouseEnter={() => toggleDropdown("news")}
                    onMouseLeave={() => toggleDropdown(null)}
                  >
                    <button className="dropdown-button">News</button>
                    {dropdownOpen === "news" && (
                      <div className="dropdown-menu">
                        <Link to="/latest-news">Latest Updates</Link>
                        <Link to="/injury-reports">Injury Report</Link>
                        <Link to="/rankings">Rankings</Link>
                        <Link to="/coaching-changes">Coaching Changes</Link>
                      </div>
                    )}
                  </div>

                  {/* Metrics Dropdown */}
                  <div
                    className="dropdown"
                    onMouseEnter={() => toggleDropdown("metrics")}
                    onMouseLeave={() => toggleDropdown(null)}
                  >
                    <button className="dropdown-button">Metrics</button>
                    {dropdownOpen === "metrics" && (
                      <div className="dropdown-menu">
                        <Link to="/team-metrics">Team Analytics</Link>
                        <Link to="/player-metrics">Player Stats</Link>
                        <Link to="/betting-models">Visualize Trends</Link>
                      </div>
                    )}
                  </div>

                  {/* Videos Dropdown */}
                  <div
                    className="dropdown"
                    onMouseEnter={() => toggleDropdown("videos")}
                    onMouseLeave={() => toggleDropdown(null)}
                  >
                    <button className="dropdown-button">Videos</button>
                    {dropdownOpen === "videos" && (
                      <div className="dropdown-menu">
                        <Link to="/highlights">Game Highlights</Link>
                        <Link to="/analysis">Game Analysis</Link>
                        <Link to="/press-conferences">Press Conferences</Link>
                      </div>
                    )}
                  </div>

                  {/* Recruiting Dropdown */}
                  <div
                    className="dropdown"
                    onMouseEnter={() => toggleDropdown("recruiting")}
                    onMouseLeave={() => toggleDropdown(null)}
                  >
                    <button className="dropdown-button">Recruiting</button>
                    {dropdownOpen === "recruiting" && (
                      <div className="dropdown-menu">
                        <Link to="/top-prospects">Top Prospects</Link>
                        <Link to="/commitments">Commitments</Link>
                        <Link to="/transfer-portal">Transfer Portal</Link>
                        {/* NEW: Coach Overview link */}
                        <Link to="/coach-overview">Coach Overview</Link>
                      </div>
                    )}
                  </div>
                </div>
              </nav>

              {/* Right Side Buttons */}
              <div className="top-bar-actions">
                <a href="/get-started" className="top-bar-button get-started">
                  Get Started
                </a>
                <a href="/upgrade" className="top-bar-button upgrade">
                  Upgrade
                </a>
                <a href="/signin" className="top-bar-button login">
                  Login
                </a>
              </div>
            </div>
          </header>

          {/* SECONDARY NAVBAR (Home, Teams, Games, etc.) */}
          <nav
            className={`secondary-bar ${menuOpen ? "active" : ""}`}
            style={{
              transition: "transform 0.3s ease",
              transform: scoreboardVisible ? "translateY(0)" : "translateY(-50px)",
            }}
          >
            <div className="secondary-bar-container">
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
              <Link to="/pickem-predictions" className="nav-item">
                Pick'em &amp; Predictions
              </Link>
              <Link to="/fan-hub" className="nav-item">
                Fan Hub
              </Link>
            </div>
          </nav>

          {/* MAIN CONTENT */}
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
              <Route path="/game/:gameId" element={<GameDetailView />} />
              <Route path="/latest-news" element={<LatestUpdates />} />
              <Route
                path="/fan-hub"
                element={<FanHub scoreboardVisible={scoreboardVisible} />}
              />

              {/* New Recruiting Routes */}
              <Route path="/top-prospects" element={<TopProspects />} />
              <Route path="/commitments" element={<Commitments />} />
              <Route path="/transfer-portal" element={<TransferPortal />} />

              {/* NEW: Coach Overview Route */}
              <Route path="/coach-overview" element={<CoachOverview />} />

              {/* New Team Analytics Routes */}
              <Route path="/team-metrics" element={<TeamAnalytics />} />
              <Route path="/team-metrics/:teamId" element={<TeamAnalyticsDetail />} />

              {/* New Lines Route for Spread + Analysis */}
              <Route path="/spread-analysis" element={<Lines />} />

              {/* New Route for Arbitrage + EV */}
              <Route path="/arbitrage-ev" element={<ArbitrageEV />} />
            </Routes>
          </main>
        </div>
      </Router>
    </WeekProvider>
  );
}

export default App;