import React, { useState, useEffect } from "react";
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
import AdvancedGameDetailView from "./components/AdvancedGameDetailView"; // Import the new AdvancedGameDetailView component

// New ArbitrageEV Component Import
import ArbitrageEV from "./components/ArbitrageEV";

// NEW: Import CoachOverview Component
import CoachOverview from "./components/CoachOverview";

// NEW: Import VisualizeTrends Component (for Visualize Trends route)
import VisualizeTrends from "./components/VisualizeTrends";

// NEW: Import GetStarted Component for the Get Started page
import GetStarted from "./components/GetStarted";

// Conference Components
import SEC from "./conferences/SEC";
import BigTen from "./conferences/BigTen";
import ACC from "./conferences/ACC";
import Pac12 from "./conferences/Pac12";
import Big12 from "./conferences/Big12";
import AmericanAthletic from "./conferences/AmericanAthletic";
import MountainWest from "./conferences/MountainWest";
import ConferenceUSA from "./conferences/ConferenceUSA";
import MidAmerican from "./conferences/MidAmerican";
import FBSIndependents from "./conferences/FBSIndependents";

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
  "Big Ten": "B1G",
  "ACC": "ACC",
  "Pac-12": "Pac-12",
  "Big 12": "B12",
  "American Athletic Conference": "AAC",
  "Mountain West": "MWC",
  "Conference USA": "C-USA",
  "Mid-American": "MAC",
  "FBS Independents": "FBS Independents",
};

function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(null);
  const [scoreboardVisible, setScoreboardVisible] = useState(true);
  // Add state for mobile navigation
  const [mobileNavActive, setMobileNavActive] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Check if screen is mobile size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    // Initial check
    checkMobile();
    
    // Add event listener for resize
    window.addEventListener('resize', checkMobile);
    
    // Clean up
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  const toggleDropdown = (menu) => {
    if (isMobile) return; // Don't toggle dropdowns on hover for mobile
    setDropdownOpen((prev) => (prev === menu ? null : menu));
  };

  // Toggle mobile navigation
  const toggleMobileNav = () => {
    setMobileNavActive(!mobileNavActive);
    if (!mobileNavActive) {
      // When opening mobile nav, close any open dropdowns
      setDropdownOpen(null);
    }
    // Toggle body scroll
    document.body.style.overflow = !mobileNavActive ? 'hidden' : '';
  };

  // Close mobile navigation when a link is clicked
  const closeMobileNav = () => {
    setMobileNavActive(false);
    document.body.style.overflow = '';
  };

  // Toggle mobile dropdown menus
  const toggleMobileDropdown = (menu) => {
    setDropdownOpen((prev) => (prev === menu ? null : menu));
  };

  return (
    <WeekProvider>
      <Router>
        <div className={`app ${dropdownOpen ? 'dropdown-active' : ''} ${mobileNavActive ? 'mobile-nav-active' : ''}`}>
          {/* TOP SCOREBOARD BAR */}
          <Scoreboard setScoreboardVisible={setScoreboardVisible} />

          {/* TOP NAVBAR */}
          <header className="top-bar">
            <div className="top-bar-container">
              {/* Logo on the Left */}
              <Link to="/" className="top-bar-logo">GAMEDAY+</Link>

              {/* Hamburger Menu for Mobile */}
              <div 
                className={`hamburger-menu ${mobileNavActive ? 'active' : ''}`} 
                onClick={toggleMobileNav}
              >
                <span className="hamburger-line"></span>
                <span className="hamburger-line"></span>
                <span className="hamburger-line"></span>
              </div>

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
                              fontSize: "0.8rem",
                            }}
                          >
                            <img
                              src={`/photos/${conferenceLogos[conf]}`}
                              alt={conf}
                              style={{
                                width: "30px",
                                height: "30px",
                                objectFit: "contain",
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
                        {/* NEW: Added Visualize Trends link */}
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
                <Link to="/get-started" className="top-bar-button get-started">
                  Get Started
                </Link>
                <a href="/upgrade" className="top-bar-button upgrade">
                  Upgrade
                </a>
                <a href="/signin" className="top-bar-button login">
                  Login
                </a>
              </div>
            </div>
          </header>

          {/* Mobile Navigation Overlay */}
          <div 
            className={`mobile-nav-overlay ${mobileNavActive ? 'active' : ''}`}
            onClick={closeMobileNav}
          ></div>

          {/* Mobile Navigation Menu */}
          <div className={`mobile-nav ${mobileNavActive ? 'active' : ''}`}>
            <div className="mobile-nav-header">
              <h2 className="mobile-nav-title">GAMEDAY+</h2>
            </div>
            
            {/* Main Navigation Section */}
            <div className="mobile-nav-section">
              <h3 className="mobile-nav-section-title">Navigation</h3>
              <Link to="/" className="mobile-nav-link" onClick={closeMobileNav}>Home</Link>
              <Link to="/teams" className="mobile-nav-link" onClick={closeMobileNav}>Teams</Link>
              <Link to="/games" className="mobile-nav-link" onClick={closeMobileNav}>Games</Link>
              <Link to="/stats" className="mobile-nav-link" onClick={closeMobileNav}>Stats</Link>
              <Link to="/pickem-predictions" className="mobile-nav-link" onClick={closeMobileNav}>Pick'em &amp; Predictions</Link>
              <Link to="/fan-hub" className="mobile-nav-link" onClick={closeMobileNav}>Fan Hub</Link>
              
              {/* Conferences */}
              <div className="mobile-nav-link" onClick={() => toggleMobileDropdown("mobile-conferences")}>
                Conferences <span style={{ marginLeft: 'auto' }}>▼</span>
              </div>
              {dropdownOpen === "mobile-conferences" && (
                <>
                  {conferenceList.map((conf) => (
                    <Link 
                      to={`/${conf.toLowerCase().replace(/ /g, "")}`}
                      key={conf}
                      className="mobile-nav-link"
                      style={{ paddingLeft: '25px', fontSize: '14px' }}
                      onClick={closeMobileNav}
                    >
                      {conferenceAbbr[conf] || conf}
                    </Link>
                  ))}
                </>
              )}
              
              {/* Lines */}
              <div className="mobile-nav-link" onClick={() => toggleMobileDropdown("mobile-lines")}>
                Lines <span style={{ marginLeft: 'auto' }}>▼</span>
              </div>
              {dropdownOpen === "mobile-lines" && (
                <>
                  <Link to="/current-lines" className="mobile-nav-link" style={{ paddingLeft: '25px', fontSize: '14px' }} onClick={closeMobileNav}>Current Game Lines</Link>
                  <Link to="/spread-analysis" className="mobile-nav-link" style={{ paddingLeft: '25px', fontSize: '14px' }} onClick={closeMobileNav}>Spread + Analysis</Link>
                  <Link to="/arbitrage-ev" className="mobile-nav-link" style={{ paddingLeft: '25px', fontSize: '14px' }} onClick={closeMobileNav}>Arbitrage + EV</Link>
                  <Link to="/over-under-metrics" className="mobile-nav-link" style={{ paddingLeft: '25px', fontSize: '14px' }} onClick={closeMobileNav}>Over/Under Metrics</Link>
                </>
              )}
              
              {/* GamedayGPT */}
              <div className="mobile-nav-link" onClick={() => toggleMobileDropdown("mobile-gamedaygpt")}>
                GamedayGPT <span style={{ marginLeft: 'auto' }}>▼</span>
              </div>
              {dropdownOpen === "mobile-gamedaygpt" && (
                <>
                  <Link to="/predict-outcomes" className="mobile-nav-link" style={{ paddingLeft: '25px', fontSize: '14px' }} onClick={closeMobileNav}>Predict Outcomes</Link>
                  <Link to="/ask-questions" className="mobile-nav-link" style={{ paddingLeft: '25px', fontSize: '14px' }} onClick={closeMobileNav}>Ask Questions</Link>
                  <Link to="/betting-suggestions" className="mobile-nav-link" style={{ paddingLeft: '25px', fontSize: '14px' }} onClick={closeMobileNav}>Betting Suggestions</Link>
                </>
              )}
              
              {/* News */}
              <div className="mobile-nav-link" onClick={() => toggleMobileDropdown("mobile-news")}>
                News <span style={{ marginLeft: 'auto' }}>▼</span>
              </div>
              {dropdownOpen === "mobile-news" && (
                <>
                  <Link to="/latest-news" className="mobile-nav-link" style={{ paddingLeft: '25px', fontSize: '14px' }} onClick={closeMobileNav}>Latest Updates</Link>
                  <Link to="/injury-reports" className="mobile-nav-link" style={{ paddingLeft: '25px', fontSize: '14px' }} onClick={closeMobileNav}>Injury Report</Link>
                  <Link to="/rankings" className="mobile-nav-link" style={{ paddingLeft: '25px', fontSize: '14px' }} onClick={closeMobileNav}>Rankings</Link>
                  <Link to="/coaching-changes" className="mobile-nav-link" style={{ paddingLeft: '25px', fontSize: '14px' }} onClick={closeMobileNav}>Coaching Changes</Link>
                </>
              )}
              
              {/* Metrics */}
              <div className="mobile-nav-link" onClick={() => toggleMobileDropdown("mobile-metrics")}>
                Metrics <span style={{ marginLeft: 'auto' }}>▼</span>
              </div>
              {dropdownOpen === "mobile-metrics" && (
                <>
                  <Link to="/team-metrics" className="mobile-nav-link" style={{ paddingLeft: '25px', fontSize: '14px' }} onClick={closeMobileNav}>Team Analytics</Link>
                  <Link to="/player-metrics" className="mobile-nav-link" style={{ paddingLeft: '25px', fontSize: '14px' }} onClick={closeMobileNav}>Player Stats</Link>
                  <Link to="/betting-models" className="mobile-nav-link" style={{ paddingLeft: '25px', fontSize: '14px' }} onClick={closeMobileNav}>Visualize Trends</Link>
                </>
              )}
              
              {/* Videos */}
              <div className="mobile-nav-link" onClick={() => toggleMobileDropdown("mobile-videos")}>
                Videos <span style={{ marginLeft: 'auto' }}>▼</span>
              </div>
              {dropdownOpen === "mobile-videos" && (
                <>
                  <Link to="/highlights" className="mobile-nav-link" style={{ paddingLeft: '25px', fontSize: '14px' }} onClick={closeMobileNav}>Game Highlights</Link>
                  <Link to="/analysis" className="mobile-nav-link" style={{ paddingLeft: '25px', fontSize: '14px' }} onClick={closeMobileNav}>Game Analysis</Link>
                  <Link to="/press-conferences" className="mobile-nav-link" style={{ paddingLeft: '25px', fontSize: '14px' }} onClick={closeMobileNav}>Press Conferences</Link>
                </>
              )}
              
              {/* Recruiting */}
              <div className="mobile-nav-link" onClick={() => toggleMobileDropdown("mobile-recruiting")}>
                Recruiting <span style={{ marginLeft: 'auto' }}>▼</span>
              </div>
              {dropdownOpen === "mobile-recruiting" && (
                <>
                  <Link to="/top-prospects" className="mobile-nav-link" style={{ paddingLeft: '25px', fontSize: '14px' }} onClick={closeMobileNav}>Top Prospects</Link>
                  <Link to="/commitments" className="mobile-nav-link" style={{ paddingLeft: '25px', fontSize: '14px' }} onClick={closeMobileNav}>Commitments</Link>
                  <Link to="/transfer-portal" className="mobile-nav-link" style={{ paddingLeft: '25px', fontSize: '14px' }} onClick={closeMobileNav}>Transfer Portal</Link>
                  <Link to="/coach-overview" className="mobile-nav-link" style={{ paddingLeft: '25px', fontSize: '14px' }} onClick={closeMobileNav}>Coach Overview</Link>
                </>
              )}
            </div>
            
            {/* Action Buttons Section */}
            <div className="mobile-nav-actions">
              <Link to="/get-started" className="mobile-nav-button" onClick={closeMobileNav}>Get Started</Link>
              <a href="/upgrade" className="mobile-nav-button" onClick={closeMobileNav}>Upgrade</a>
              <a href="/signin" className="mobile-nav-button" onClick={closeMobileNav}>Login</a>
            </div>
          </div>

          {/* SECONDARY NAVBAR (Home, Teams, Games, etc.) */}
          <nav className={`secondary-bar ${menuOpen ? "active" : ""}`}>
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
              <Route path="/game/:id" element={<AdvancedGameDetailView />} />
              <Route path="/latest-news" element={<LatestUpdates />} />
              <Route path="/fan-hub" element={<FanHub scoreboardVisible={scoreboardVisible} />} />

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

              {/* NEW: Get Started Route */}
              <Route path="/get-started" element={<GetStarted />} />

              {/* Conference Routes */}
              <Route path="/sec" element={<SEC />} />
              <Route path="/bigten" element={<BigTen />} />
              <Route path="/acc" element={<ACC />} />
              <Route path="/pac12" element={<Pac12 />} />
              <Route path="/big12" element={<Big12 />} />
              <Route path="/americanathletic" element={<AmericanAthletic />} />
              <Route path="/mountainwest" element={<MountainWest />} />
              <Route path="/conferenceusa" element={<ConferenceUSA />} />
              <Route path="/mid-american" element={<MidAmerican />} />
              <Route path="/fbsindependents" element={<FBSIndependents />} />

              {/* NEW: Visualize Trends Route */}
              <Route path="/betting-models" element={<VisualizeTrends />} />
            </Routes>
          </main>
        </div>
      </Router>
    </WeekProvider>
  );
}

export default App;