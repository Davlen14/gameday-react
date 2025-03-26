import React, { useState, useEffect } from "react";
import Arbitrage from "./Arbitrage";
import EVBetting from "./EVBetting";
import teamsService from "../services/teamsService";
import "../styles/ArbitrageEV.css"; // Keep the original CSS import for fallback

const ArbitrageEV = () => {
  const [activeTab, setActiveTab] = useState("arbitrage");
  const [oddsData, setOddsData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // State for teams (used for logos)
  const [teams, setTeams] = useState([]);

  // State for week filter
  const [week, setWeek] = useState(1);

  // Fetch teams once to get logos
  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const teamsData = await teamsService.getTeams();
        setTeams(teamsData);
      } catch (err) {
        console.error("Error fetching teams:", err);
      }
    };
    fetchTeams();
  }, []);

  // Helper function to get team logos
  const getTeamLogo = (teamName) => {
    const team = teams.find(
      (t) => t.school.toLowerCase() === teamName.toLowerCase()
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

  // Fetch betting odds data (always get all lines, then filter locally by week)
  useEffect(() => {
    const fetchOdds = async () => {
      try {
        setIsLoading(true);

        // Use your original logic that WORKS: pass `null` for the second argument
        // so that your backend returns all the lines. 
        const response = await teamsService.getGameLines(2024, null, "regular");

        // Now filter those lines locally based on the selected `week`.
        // If your API does return a `week` field, we can match it here:
        const weekFiltered = response.filter((game) => game.week === week);

        // Filter for relevant sportsbooks
        const filteredLines = weekFiltered.map((game) => ({
          id: game.id,
          week: game.week,
          homeTeam: game.homeTeam,
          awayTeam: game.awayTeam,
          homeScore: game.homeScore,
          awayScore: game.awayScore,
          lines: game.lines.filter((line) =>
            ["DraftKings", "ESPN Bet", "Bovada"].includes(line.provider)
          ),
        }));

        // Sort by week for better readability
        const sortedLines = filteredLines.sort((a, b) => a.week - b.week);

        setOddsData(sortedLines);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOdds();
  }, [week]);

  // Handle tab switching
  const handleTabClick = (tab) => {
    setActiveTab(tab);
  };

  // Handle week filter changes
  const handleWeekChange = (e) => {
    setWeek(Number(e.target.value));
  };

  return (
    <div className="arbitrage-ev-container">
      <style jsx="true">{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400..900&family=Titillium+Web:ital,wght@0,200;0,300;0,400;0,600;0,700;0,900;1,200;1,300;1,400;1,600;1,700&display=swap');
        
        /* Redefining the variables to ensure styling consistency */
        :root {
          /* Primary color scheme - Red */
          --accent-color: #D4001C;
          --accent-light: #FF3F58;
          --accent-dark: #990014;
          --accent-glow: rgba(212, 0, 28, 0.5);
          
          /* Dark theme colors (default) */
          --dark: #0C0F16;
          --darker: #060910;
          --text: #ffffff;
          --text-muted: rgba(255, 255, 255, 0.8);
          --text-subtle: rgba(255, 255, 255, 0.6);
          --text-faint: rgba(255, 255, 255, 0.4);
          --card-bg: rgba(12, 15, 22, 0.5);
          --section-bg: rgba(12, 15, 22, 0.4);
          --header-bg: rgba(12, 15, 22, 0.8);
          --footer-bg: rgba(6, 9, 16, 0.8);
          --circle-border: rgba(212, 0, 28, 0.2);
          --circle-opacity: 0.7;
          --card-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
          --hover-shadow: 0 15px 45px rgba(0, 0, 0, 0.4);
        }
        
        /* Light theme */
        [data-theme="light"] {
          --dark: #f0f3f8;
          --darker: #e0e5ee;
          --text: #232730;
          --text-muted: rgba(35, 39, 48, 0.8);
          --text-subtle: rgba(35, 39, 48, 0.6);
          --text-faint: rgba(35, 39, 48, 0.4);
          --card-bg: rgba(255, 255, 255, 0.7);
          --section-bg: rgba(255, 255, 255, 0.5);
          --header-bg: rgba(255, 255, 255, 0.9);
          --footer-bg: rgba(240, 243, 248, 0.9);
          --accent-dark: #B80017;
          --circle-border: rgba(212, 0, 28, 0.3);
          --circle-opacity: 0.5;
          --card-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
          --hover-shadow: 0 15px 45px rgba(0, 0, 0, 0.15);
        }

        .arbitrage-ev-container {
          width: 100%;
          min-height: 100vh;
          font-family: "Titillium Web", sans-serif;
          color: var(--text);
          padding: 2rem;
          background: linear-gradient(135deg, var(--darker) 0%, var(--dark) 100%);
          display: flex;
          flex-direction: column;
          margin: 0;
        }
        
        .arbitrage-ev-container::before {
          content: '';
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-image: 
              radial-gradient(circle at 20% 30%, var(--accent-color), transparent 20%),
              radial-gradient(circle at 80% 70%, var(--accent-color), transparent 20%);
          opacity: 0.05;
          z-index: -1;
        }
        
        .week-filter {
          display: flex;
          align-items: center;
          margin-bottom: 2rem;
          padding: 1.5rem;
          background: var(--card-bg);
          backdrop-filter: blur(10px);
          border-radius: 15px;
          border: 1px solid rgba(212, 0, 28, 0.2);
          box-shadow: var(--card-shadow);
          width: fit-content;
          max-width: 100%;
        }
        
        .week-filter label {
          font-family: "Orbitron", sans-serif;
          color: var(--text);
          margin-right: 1rem;
          font-weight: 600;
          font-size: 1rem;
          letter-spacing: 0.05rem;
        }
        
        .week-filter select {
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid var(--accent-color);
          color: var(--text);
          padding: 0.5rem 1rem;
          border-radius: 30px;
          font-family: "Orbitron", sans-serif;
          font-size: 0.9rem;
          outline: none;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        
        [data-theme="light"] .week-filter select {
          background: rgba(255, 255, 255, 0.2);
        }
        
        .week-filter select:hover, 
        .week-filter select:focus {
          border-color: var(--accent-light);
          box-shadow: 0 0 15px rgba(212, 0, 28, 0.4);
        }
        
        .tab-nav {
          display: flex;
          margin-bottom: 2rem;
          border-radius: 50px;
          overflow: hidden;
          background: var(--card-bg);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(212, 0, 28, 0.2);
          box-shadow: var(--card-shadow);
          width: fit-content;
        }
        
        .tab-nav button {
          background: none;
          border: none;
          color: var(--text);
          padding: 1rem 2rem;
          font-family: "Orbitron", sans-serif;
          font-size: 1rem;
          font-weight: 600;
          letter-spacing: 0.1rem;
          cursor: pointer;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
          text-transform: uppercase;
        }
        
        .tab-nav button:hover {
          color: var(--accent-light);
        }
        
        .tab-nav button.active {
          background: var(--accent-color);
          color: white;
        }
        
        .tab-nav button.active::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          width: 100%;
          height: 3px;
          background: var(--accent-light);
        }
        
        .tab-content {
          background: var(--section-bg);
          backdrop-filter: blur(10px);
          border-radius: 20px;
          padding: 2rem;
          border: 1px solid rgba(212, 0, 28, 0.2);
          box-shadow: var(--card-shadow);
          flex: 1;
          width: 100%;
          transition: all 0.3s ease;
        }
        
        .loading-container {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 300px;
          width: 100%;
        }
        
        .loading-container p {
          font-family: "Orbitron", sans-serif;
          font-size: 1.2rem;
          color: var(--text-muted);
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        
        .loading-container p::before {
          content: '';
          width: 20px;
          height: 20px;
          border: 3px solid var(--accent-color);
          border-top: 3px solid transparent;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          display: inline-block;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .error-message {
          background: rgba(212, 0, 28, 0.1);
          border-left: 4px solid var(--accent-color);
          padding: 1rem;
          border-radius: 5px;
          color: var(--accent-light);
          font-family: "Titillium Web", sans-serif;
          margin: 1rem 0;
        }
        
        /* Responsive adjustments */
        @media (max-width: 768px) {
          .arbitrage-ev-container {
            padding: 1.5rem;
          }
          
          .week-filter, 
          .tab-nav, 
          .tab-content {
            width: 100%;
          }
          
          .tab-nav button {
            padding: 0.8rem 1.5rem;
            font-size: 0.9rem;
          }
        }
        
        @media (max-width: 480px) {
          .arbitrage-ev-container {
            padding: 1rem;
          }
          
          .tab-nav {
            flex-direction: column;
            border-radius: 15px;
          }
          
          .tab-nav button {
            width: 100%;
            padding: 0.7rem 1rem;
            font-size: 0.8rem;
          }
          
          .week-filter {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.5rem;
          }
          
          .week-filter select {
            width: 100%;
          }
        }
      `}</style>
      
      {/* Week Filter */}
      <div className="week-filter">
        <label htmlFor="week-select">Select Week: </label>
        <select id="week-select" value={week} onChange={handleWeekChange}>
          {Array.from({ length: 20 }, (_, i) => i + 1).map((w) => (
            <option key={w} value={w}>
              Week {w}
            </option>
          ))}
        </select>
      </div>

      {/* Tab Navigation */}
      <div className="tab-nav">
        <button
          className={activeTab === "arbitrage" ? "active" : ""}
          onClick={() => handleTabClick("arbitrage")}
        >
          Arbitrage Finder
        </button>
        <button
          className={activeTab === "ev" ? "active" : ""}
          onClick={() => handleTabClick("ev")}
        >
          Positive EV Bets
        </button>
      </div>

      {/* Main Content */}
      <div className="tab-content">
        {isLoading ? (
          <div className="loading-container">
            <p>Loading betting lines...</p>
          </div>
        ) : error ? (
          <p className="error-message">Error: {error}</p>
        ) : activeTab === "arbitrage" ? (
          <Arbitrage
            oddsData={oddsData}
            getSportsbookLogo={getSportsbookLogo}
            getTeamLogo={getTeamLogo}
          />
        ) : (
          <EVBetting
            oddsData={oddsData}
            getSportsbookLogo={getSportsbookLogo}
            getTeamLogo={getTeamLogo}
          />
        )}
      </div>
    </div>
  );
};

export default ArbitrageEV;