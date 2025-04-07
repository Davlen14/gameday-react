import React, { useState, useEffect, useMemo } from "react";
import Arbitrage from "./Arbitrage";
import EVBetting from "./EVBetting";
import teamsService from "../services/teamsService";
import "../styles/ArbitrageEV.css";
import { 
  FaChartLine, 
  FaMoneyBillWave, 
  FaFilter, 
  FaCog, 
  FaCalendarAlt,
  FaSearch,
  FaSpinner
} from "react-icons/fa";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const ArbitrageEV = () => {
  // Main tab state
  const [activeTab, setActiveTab] = useState("arbitrage");
  const [oddsData, setOddsData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter states
  const [week, setWeek] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSportsbooks, setSelectedSportsbooks] = useState([
    "DraftKings", "ESPN Bet", "Bovada"
  ]);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  
  // Additional Settings
  const [refreshInterval, setRefreshInterval] = useState(0); // 0 means no auto-refresh
  const [darkMode, setDarkMode] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // State for teams (used for logos)
  const [teams, setTeams] = useState([]);

  // Auto-refresh timer
  useEffect(() => {
    let timer;
    if (refreshInterval > 0) {
      timer = setInterval(() => {
        fetchOdds();
        toast.info(`Odds refreshed automatically`, {
          autoClose: 2000,
          position: "bottom-right",
        });
      }, refreshInterval * 60 * 1000);
    }
    
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [refreshInterval]);
  
  // Dark mode handling
  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }, [darkMode]);

  // Fetch teams once to get logos
  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const teamsData = await teamsService.getTeams();
        setTeams(teamsData);
      } catch (err) {
        console.error("Error fetching teams:", err);
        toast.error("Failed to load team data");
      }
    };
    fetchTeams();
  }, []);

  // Helper function to get team logos
  const getTeamLogo = (teamName) => {
    const team = teams.find(
      (t) => t.school?.toLowerCase() === teamName?.toLowerCase()
    );
    return team?.logos ? team.logos[0] : "/photos/default_team.png";
  };

  // Helper function to get sportsbook logos
  const getSportsbookLogo = (provider) => {
    const logos = {
      DraftKings: "/photos/draftkings.png",
      "ESPN Bet": "/photos/espnbet.png",
      Bovada: "/photos/bovada.jpg",
    };
    return logos[provider] || "/photos/default_sportsbook.png";
  };

  // Fetch betting odds data
  const fetchOdds = async () => {
    try {
      setIsLoading(true);

      const response = await teamsService.getGameLines(2024, null, "regular");

      // Filter by week
      const weekFiltered = response.filter((game) => game.week === week);

      // Filter for selected sportsbooks
      const filteredLines = weekFiltered.map((game) => ({
        id: game.id,
        week: game.week,
        homeTeam: game.homeTeam,
        awayTeam: game.awayTeam,
        homeScore: game.homeScore,
        awayScore: game.awayScore,
        lines: game.lines.filter((line) =>
          selectedSportsbooks.includes(line.provider)
        ),
      }));

      // Sort by week for better readability
      const sortedLines = filteredLines.sort((a, b) => a.week - b.week);

      setOddsData(sortedLines);
      setError(null);
    } catch (err) {
      setError(err.message);
      toast.error(`Error fetching odds data: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial fetch and when filters change
  useEffect(() => {
    fetchOdds();
  }, [week, selectedSportsbooks]);

  // Filter by search term
  const filteredOddsData = useMemo(() => {
    if (!searchTerm.trim()) return oddsData;
    
    return oddsData.filter(game => 
      game.homeTeam.toLowerCase().includes(searchTerm.toLowerCase()) ||
      game.awayTeam.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [oddsData, searchTerm]);

  // Handle tab switching
  const handleTabClick = (tab) => {
    setActiveTab(tab);
  };

  // Handle week filter changes
  const handleWeekChange = (e) => {
    setWeek(Number(e.target.value));
  };
  
  // Toggle sportsbook selection
  const toggleSportsbook = (sportsbook) => {
    if (selectedSportsbooks.includes(sportsbook)) {
      if (selectedSportsbooks.length > 1) { // Prevent removing all sportsbooks
        setSelectedSportsbooks(selectedSportsbooks.filter(s => s !== sportsbook));
      } else {
        toast.warning("At least one sportsbook must be selected");
      }
    } else {
      setSelectedSportsbooks([...selectedSportsbooks, sportsbook]);
    }
  };
  
  // Manual refresh handler
  const handleManualRefresh = () => {
    fetchOdds();
    toast.success("Odds data refreshed successfully");
  };

  return (
    <div className={`ev-arbitrage-container ${darkMode ? 'dark-mode' : ''}`}>
      <ToastContainer />
      
      {/* Header and Main Controls */}
      <div className="main-header">
        <h1 className="app-title">
          <FaMoneyBillWave className="title-icon" />
          Sports Arbitrage Finder
        </h1>
        
        <div className="main-controls">
          <div className="search-container">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search teams..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          
          <button 
            className="filter-button"
            onClick={() => setShowFilterPanel(!showFilterPanel)}
          >
            <FaFilter />
            Filters
          </button>
          
          <button 
            className="settings-button"
            onClick={() => setShowSettings(!showSettings)}
          >
            <FaCog />
            Settings
          </button>
          
          <button 
            className="refresh-button"
            onClick={handleManualRefresh}
            disabled={isLoading}
          >
            {isLoading ? <FaSpinner className="spinner" /> : "Refresh Odds"}
          </button>
        </div>
      </div>
      
      {/* Filter Panel (expandable) */}
      {showFilterPanel && (
        <div className="filter-panel">
          <div className="filter-section">
            <h3><FaCalendarAlt /> Week Selection</h3>
            <div className="week-filter">
              <label htmlFor="week-select">Week: </label>
              <select id="week-select" value={week} onChange={handleWeekChange}>
                {Array.from({ length: 20 }, (_, i) => i + 1).map((w) => (
                  <option key={w} value={w}>
                    Week {w}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="filter-section">
            <h3>Sportsbooks</h3>
            <div className="sportsbook-selector">
              {["DraftKings", "ESPN Bet", "Bovada"].map(book => (
                <div 
                  key={book} 
                  className={`sportsbook-option ${selectedSportsbooks.includes(book) ? 'selected' : ''}`}
                  onClick={() => toggleSportsbook(book)}
                >
                  <img 
                    src={getSportsbookLogo(book)} 
                    alt={book} 
                    className="sportsbook-filter-logo" 
                  />
                  <span>{book}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      
      {/* Settings Panel (expandable) */}
      {showSettings && (
        <div className="settings-panel">
          <h3>Display Settings</h3>
          <div className="setting-option">
            <label htmlFor="dark-mode">Dark Mode</label>
            <input
              id="dark-mode"
              type="checkbox"
              checked={darkMode}
              onChange={() => setDarkMode(!darkMode)}
            />
          </div>
          
          <h3>Data Refresh</h3>
          <div className="setting-option">
            <label htmlFor="refresh-interval">Auto-refresh interval (minutes):</label>
            <select
              id="refresh-interval"
              value={refreshInterval}
              onChange={(e) => setRefreshInterval(Number(e.target.value))}
            >
              <option value="0">Off</option>
              <option value="5">5 minutes</option>
              <option value="10">10 minutes</option>
              <option value="15">15 minutes</option>
              <option value="30">30 minutes</option>
            </select>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="tab-nav">
        <button
          className={activeTab === "arbitrage" ? "active" : ""}
          onClick={() => handleTabClick("arbitrage")}
        >
          <FaChartLine className="tab-icon" />
          Arbitrage Opportunities
        </button>
        <button
          className={activeTab === "ev" ? "active" : ""}
          onClick={() => handleTabClick("ev")}
        >
          <FaMoneyBillWave className="tab-icon" />
          Positive EV Bets
        </button>
      </div>

      {/* Data Status */}
      <div className="data-status">
        <span>Showing {filteredOddsData.length} games for Week {week}</span>
        {refreshInterval > 0 && (
          <span className="auto-refresh-indicator">
            Auto-refreshing every {refreshInterval} minutes
          </span>
        )}
      </div>

      {/* Main Content */}
      <div className="tab-content">
        {isLoading ? (
          <div className="loading-container">
            <FaSpinner className="loading-spinner" />
            <p>Loading betting lines...</p>
          </div>
        ) : error ? (
          <div className="error-container">
            <p className="error-message">Error: {error}</p>
            <button onClick={fetchOdds} className="retry-button">
              Retry
            </button>
          </div>
        ) : activeTab === "arbitrage" ? (
          <Arbitrage
            oddsData={filteredOddsData}
            getSportsbookLogo={getSportsbookLogo}
            getTeamLogo={getTeamLogo}
          />
        ) : (
          <EVBetting
            oddsData={filteredOddsData}
            getSportsbookLogo={getSportsbookLogo}
            getTeamLogo={getTeamLogo}
          />
        )}
      </div>
    </div>
  );
};

export default ArbitrageEV;