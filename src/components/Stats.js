import React, { useState, useEffect } from "react";
import teamsService from "../services/teamsService";

// Allowed FBS conferences
const allowedConferences = [
  "SEC",
  "ACC",
  "BIG 12",
  "BIG TEN",
  "PAC-12",
  "AMERICAN ATHLETIC",
  "MOUNTAIN WEST",
  "SUN BELT",
  "FBS INDEPENDENTS",
];

// Filter to top 10 FBS players
const aggregatePlayerStats = (data, desiredStatType) => {
  const rawData = Array.isArray(data) ? data : data?.data || [];
  const aggregated = rawData
    .filter(
      (item) =>
        item.statType &&
        item.statType.trim().toUpperCase() === desiredStatType.toUpperCase() &&
        item.conference &&
        allowedConferences.includes(item.conference.trim().toUpperCase())
    )
    .map((item) => ({
      playerName: item.player,
      team: item.team,
      conference: item.conference,
      statValue: parseFloat(item.stat),
      playerPhoto: item.playerPhoto || null,
    }));

  aggregated.sort((a, b) => b.statValue - a.statValue);
  return aggregated.slice(0, 10);
};

const Stats = () => {
  const [playerStats, setPlayerStats] = useState({
    passing: [],
    rushing: [],
    receiving: [],
    interceptions: [],
  });

  // For fetching team logos and abbreviations
  const [teams, setTeams] = useState([]);

  // Loading states
  const [loadingPassing, setLoadingPassing] = useState(true);
  const [loadingRushing, setLoadingRushing] = useState(true);
  const [loadingReceiving, setLoadingReceiving] = useState(true);
  const [loadingInterceptions, setLoadingInterceptions] = useState(true);

  // Error
  const [error, setError] = useState(null);

  // Tabs
  const [activeTab, setActiveTab] = useState("playerLeaders");

  // Fetch teams for logos and abbreviations
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

  // Helper for logos
  const getTeamLogo = (teamName) => {
    const foundTeam = teams.find(
      (t) => t.school?.toLowerCase() === teamName?.toLowerCase()
    );
    return foundTeam?.logos?.[0] || "/photos/default_team.png";
  };

  // Helper for team abbreviation
  const getTeamAbbreviation = (teamName) => {
    const foundTeam = teams.find(
      (t) => t.school?.toLowerCase() === teamName?.toLowerCase()
    );
    return foundTeam?.abbreviation
      ? foundTeam.abbreviation.toUpperCase()
      : teamName?.toUpperCase() || "";
  };

  // Helper for fetch
  const fetchCategory = async (year, category, statType, setLoading, key) => {
    const controller = new AbortController();
    try {
      setLoading(true);
      const rawData = await teamsService.getPlayerSeasonStats(
        year,
        category,
        "regular",
        100,
        controller.signal
      );
      const aggregated = aggregatePlayerStats(rawData, statType);
      setPlayerStats((prev) => ({ ...prev, [key]: aggregated }));
    } catch (error) {
      if (!controller.signal.aborted) {
        console.error(`Error fetching ${category} stats:`, error);
        setError("Failed to load player season stats.");
      }
    } finally {
      setLoading(false);
    }
    return () => controller.abort();
  };

  // Fetch data
  useEffect(() => {
    fetchCategory(2024, "passing", "YDS", setLoadingPassing, "passing");
  }, []);
  useEffect(() => {
    fetchCategory(2024, "rushing", "YDS", setLoadingRushing, "rushing");
  }, []);
  useEffect(() => {
    fetchCategory(2024, "receiving", "YDS", setLoadingReceiving, "receiving");
  }, []);
  useEffect(() => {
    fetchCategory(2024, "interceptions", "INT", setLoadingInterceptions, "interceptions");
  }, []);

  // Render leader card
  const renderStatCard = (title, data, loading, statAbbr = "YDS") => {
    if (loading) {
      return (
        <div className="leaders-card">
          <h3>{title}</h3>
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <div className="loading-text">Loading stats...</div>
          </div>
        </div>
      );
    }
    
    if (!data.length) {
      return (
        <div className="leaders-card">
          <h3>{title}</h3>
          <div className="stat-placeholder">No data available</div>
        </div>
      );
    }
    
    const top = data[0];
    const rest = data.slice(1);

    return (
      <div className="leaders-card">
        <h3>{title}</h3>

        {/* Featured player (top ranked) */}
        <div className="featured-player">
          <div className="featured-rank">1</div>
          <div className="featured-logo-container">
            <img
              src={getTeamLogo(top.team)}
              alt={getTeamAbbreviation(top.team)}
              className="featured-logo"
            />
            <div className="shine-effect"></div>
          </div>
          <div className="featured-info">
            <div className="featured-name">{top.playerName}</div>
            <div className="featured-team">{getTeamAbbreviation(top.team)}</div>
          </div>
          <div className="featured-stat">
            <span className="stat-value">{top.statValue}</span>
            <span className="stat-label">{statAbbr}</span>
          </div>
        </div>

        {/* Rest of the leaders */}
        <div className="leaders-list">
          {rest.map((player, idx) => (
            <div className="leader-row" key={idx}>
              <div className="leader-rank">{idx + 2}</div>
              <img
                src={getTeamLogo(player.team)}
                alt={getTeamAbbreviation(player.team)}
                className="leader-logo"
              />
              <div className="leader-info">
                <div className="leader-name">{player.playerName}</div>
                <div className="leader-team">{getTeamAbbreviation(player.team)}</div>
              </div>
              <div className="leader-stat">{player.statValue}</div>
            </div>
          ))}
        </div>

        <div className="view-all">
          <button className="view-all-btn">
            View Complete {title} Leaders
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 5L16 12L9 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="stats-container">
      <style>{`
        /* Import fonts */
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Orbitron:wght@400;500;600;700&display=swap');
        
        :root {
          /* Modern color scheme with subtle variations */
          --primary-color: #ffffff;
          --accent-color: #555555; /* Changed from red to gray */
          --accent-hover: #777777;
          --accent-soft: rgba(85, 85, 85, 0.08); /* Changed from red to gray */
          --accent-gradient: linear-gradient(135deg, #333333, #666666); /* Changed from red to gray */
          --text-color: #333333;
          --text-secondary: #666666;
          --text-muted: #888888;
          --background-color: #ffffff;
          --card-bg: #ffffff;
          --card-hover-bg: #fafafa;
          --border-color: #f0f0f0;
          
          /* Shadows and effects */
          --shadow-sm: 0 2px 10px rgba(0, 0, 0, 0.05);
          --shadow-md: 0 8px 20px rgba(0, 0, 0, 0.07);
          --shadow-lg: 0 12px 30px rgba(0, 0, 0, 0.1);
          
          /* Animations */
          --transition-speed: 0.25s;
          --transition-function: cubic-bezier(0.4, 0, 0.2, 1);
          
          /* Radiuses */
          --radius-sm: 8px;
          --radius-md: 12px;
          --radius-lg: 16px;
          --radius-full: 9999px;
          
          /* Typography */
          --font-family-sans: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          --font-family-display: 'Orbitron', sans-serif;
          
          /* Tab Colors - Keep this red for tabs only */
          --tab-color: #D4001C;
          --tab-hover: #F5001F;
          --tab-soft: rgba(255, 255, 255, 0.08);
        }

        /* Base styles and animations */
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes pulse {
          0% { transform: scale(0.95); opacity: 0.7; }
          50% { transform: scale(1.05); opacity: 1; }
          100% { transform: scale(0.95); opacity: 0.7; }
        }
        
        @keyframes rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        @keyframes shine {
          0% { transform: translateX(-100%) rotate(25deg); }
          100% { transform: translateX(100%) rotate(25deg); }
        }

        /* Stats Container - Full Width */
        .stats-container {
          padding: 2rem;
          width: 100%;
          margin: 0;
          font-family: var(--font-family-sans);
          color: var(--text-color);
          background: var(--background-color);
          animation: fadeIn 0.5s var(--transition-function);
          box-sizing: border-box;
        }

        /* Page Header */
        .stats-header {
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 2.5rem;
          position: relative;
        }
        
        .stats-header img {
          width: 60px;
          height: 60px;
          margin-right: 1.5rem;
          filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
          animation: pulse 3s infinite var(--transition-function);
        }
        
        .stats-header h1 {
          font-family: var(--font-family-display);
          font-size: 2.4rem;
          font-weight: 700;
          margin: 0;
          color: #333333; /* Black text for title */
          text-shadow: 0 1px 1px rgba(0, 0, 0, 0.1);
          position: relative;
        }
        
        .stats-header h1::after {
          content: '';
          position: absolute;
          bottom: -10px;
          left: 0;
          width: 100%;
          height: 3px;
          background: var(--accent-gradient);
          border-radius: var(--radius-full);
        }

        /* Tabs Navigation - Keep red for tabs */
        .view-toggle {
          display: flex;
          justify-content: center;
          margin-bottom: 2.5rem;
          gap: 1rem;
          position: relative;
          z-index: 1;
          flex-wrap: wrap;
        }
        
        .tab-button {
          background: transparent;
          border: 2px solid var(--tab-color);
          color: var(--tab-color);
          font-family: var(--font-family-display);
          font-size: 1rem;
          font-weight: 600;
          padding: 0.75rem 1.75rem;
          border-radius: var(--radius-full);
          transition: all var(--transition-speed) var(--transition-function);
          cursor: pointer;
          position: relative;
          overflow: hidden;
        }
        
        .tab-button::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
          transition: all 0.7s var(--transition-function);
        }
        
        .tab-button:hover::before {
          left: 100%;
        }
        
        .tab-button:hover {
          background: var(--tab-soft);
          transform: translateY(-2px);
          box-shadow: var(--shadow-md);
        }
        
        .tab-button.active {
          background: var(--tab-color); /* Already using tab-color */
          color: white;
          transform: translateY(0);
          box-shadow: var(--shadow-sm);
          font-weight: 700;
        }

        /* Cards Layout - Full Width Row */
        .cards-container {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1.5rem;
          animation: fadeIn 0.5s var(--transition-function);
          width: 100%;
        }

        /* Leader Card */
        .leaders-card {
          background: var(--card-bg);
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-md);
          overflow: hidden;
          transition: all var(--transition-speed) var(--transition-function);
          position: relative;
          border: 1px solid var(--border-color);
          height: 100%;
          display: flex;
          flex-direction: column;
        }
        
        .leaders-card:hover {
          transform: translateY(-5px);
          box-shadow: var(--shadow-lg);
        }
        
        .leaders-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: #D4001C; /* Solid red instead of gray gradient */
        }
        
        .leaders-card h3 {
          font-family: var(--font-family-display);
          font-size: 1.2rem;
          font-weight: 700;
          margin: 0;
          padding: 1.25rem;
          color: var(--text-color);
          border-bottom: 1px solid var(--border-color);
          background: rgba(0, 0, 0, 0.01);
        }

        /* Featured Player (Rank #1) */
        .featured-player {
          display: flex;
          align-items: center;
          padding: 1.5rem;
          gap: 1rem;
          background: var(--card-hover-bg);
          position: relative;
          border-bottom: 1px solid var(--border-color);
        }
        
        .featured-rank {
          font-size: 1.8rem;
          font-weight: 800;
          color: var(--accent-color); /* Gray instead of red */
          width: 30px;
          text-align: center;
          text-shadow: 0 1px 1px rgba(0, 0, 0, 0.1);
          font-family: var(--font-family-display);
        }
        
        /* Enhanced glassy logo container with shine effect */
        .featured-logo-container {
          width: 60px;
          height: 60px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%; /* Made circular */
          background: rgba(255, 255, 255, 0.7);
          box-shadow: 
            0 8px 20px rgba(0, 0, 0, 0.1),
            inset 0 0 0 1px rgba(255, 255, 255, 0.5);
          position: relative;
          overflow: hidden;
          backdrop-filter: blur(5px);
          transform-style: preserve-3d;
          perspective: 800px;
          transition: transform var(--transition-speed) var(--transition-function);
        }
        
        /* Shine effect for logo */
        .shine-effect {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(
            135deg,
            rgba(255, 255, 255, 0) 0%,
            rgba(255, 255, 255, 0.1) 30%,
            rgba(255, 255, 255, 0.8) 50%,
            rgba(255, 255, 255, 0.1) 70%,
            rgba(255, 255, 255, 0) 100%
          );
          pointer-events: none;
          z-index: 2;
          transform: translateX(-100%) rotate(25deg);
          animation: shine 3s infinite;
        }
        
        .featured-player:hover .featured-logo-container {
          transform: perspective(800px) rotateY(10deg);
        }
        
        .featured-logo {
          width: 75%;
          height: 75%;
          object-fit: contain;
          filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
          z-index: 1;
        }
        
        .featured-info {
          flex: 1;
        }
        
        .featured-name {
          font-size: 1.1rem;
          font-weight: 700;
          margin-bottom: 0.25rem;
          transition: color var(--transition-speed) var(--transition-function);
        }
        
        .featured-player:hover .featured-name {
          color: var(--accent-color);
        }
        
        .featured-team {
          font-size: 0.85rem;
          color: var(--text-secondary);
          font-weight: 500;
        }
        
        .featured-stat {
          display: flex;
          flex-direction: column;
          align-items: center;
          background: rgba(0, 0, 0, 0.05); /* Gray background */
          padding: 0.5rem 1rem;
          border-radius: var(--radius-md);
          transition: all var(--transition-speed) var(--transition-function);
        }
        
        .featured-player:hover .featured-stat {
          background: var(--accent-color);
          transform: scale(1.05);
          box-shadow: var(--shadow-sm);
        }
        
        .stat-value {
          font-size: 1.4rem;
          font-weight: 800;
          color: var(--accent-color); /* Gray instead of red */
          line-height: 1.2;
          transition: color var(--transition-speed) var(--transition-function);
        }
        
        .featured-player:hover .stat-value {
          color: white;
        }
        
        .stat-label {
          font-size: 0.7rem;
          font-weight: 600;
          color: var(--text-secondary);
          text-transform: uppercase;
          transition: color var(--transition-speed) var(--transition-function);
        }
        
        .featured-player:hover .stat-label {
          color: rgba(255, 255, 255, 0.8);
        }

        /* Leaders List */
        .leaders-list {
          padding: 0.75rem 1rem;
          flex: 1;
          overflow-y: auto;
        }
        
        .leader-row {
          display: flex;
          align-items: center;
          padding: 0.75rem;
          border-radius: var(--radius-md);
          margin-bottom: 0.5rem;
          transition: all var(--transition-speed) var(--transition-function);
          gap: 0.75rem;
        }
        
        .leader-row:hover {
          background: var(--accent-soft);
          transform: translateX(5px);
        }
        
        .leader-rank {
          font-size: 1rem;
          font-weight: 700;
          color: var(--accent-color); /* Gray instead of red */
          width: 20px;
          text-align: center;
        }
        
        .leader-logo {
          width: 32px;
          height: 32px;
          object-fit: contain;
          transition: transform var(--transition-speed) var(--transition-function);
          border-radius: 50%;
          background: white;
          padding: 2px;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
        }
        
        .leader-row:hover .leader-logo {
          transform: scale(1.1) rotate(5deg);
        }
        
        .leader-info {
          flex: 1;
        }
        
        .leader-name {
          font-size: 0.9rem;
          font-weight: 600;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 140px;
          transition: color var(--transition-speed) var(--transition-function);
        }
        
        .leader-row:hover .leader-name {
          color: var(--accent-color);
        }
        
        .leader-team {
          font-size: 0.75rem;
          color: var(--text-secondary);
        }
        
        .leader-stat {
          font-size: 1rem;
          font-weight: 700;
          color: var(--text-color);
          min-width: 40px;
          text-align: right;
          transition: all var(--transition-speed) var(--transition-function);
        }
        
        .leader-row:hover .leader-stat {
          color: var(--accent-color);
          transform: scale(1.05);
        }

        /* View All Button */
        .view-all {
          padding: 1rem;
          text-align: center;
          border-top: 1px solid var(--border-color);
          margin-top: auto;
        }
        
        .view-all-btn {
          font-family: var(--font-family-sans);
          background: transparent;
          border: none;
          color: var(--text-secondary);
          font-size: 0.85rem;
          font-weight: 500;
          padding: 0.5rem 1rem;
          cursor: pointer;
          border-radius: var(--radius-full);
          transition: all var(--transition-speed) var(--transition-function);
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin: 0 auto;
        }
        
        .view-all-btn:hover {
          color: var(--tab-color); /* Keep red for button hover */
          background: var(--tab-soft);
        }
        
        .view-all-btn svg {
          transition: transform var(--transition-speed) var(--transition-function);
        }
        
        .view-all-btn:hover svg {
          transform: translateX(3px);
        }

        /* Loading States */
        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 3rem 0;
          gap: 1rem;
          flex: 1;
        }
        
        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 3px solid rgba(85, 85, 85, 0.1); /* Gray instead of red */
          border-radius: 50%;
          border-top-color: var(--accent-color);
          animation: rotate 1s linear infinite;
        }
        
        .loading-text {
          font-size: 0.9rem;
          color: var(--text-secondary);
        }

        /* Placeholder Styles */
        .stat-placeholder {
          text-align: center;
          padding: 3rem 1.5rem;
          color: var(--text-muted);
          font-style: italic;
          background: rgba(0, 0, 0, 0.02);
          border-radius: var(--radius-md);
          margin: 1rem;
          border: 1px dashed var(--border-color);
          flex: 1;
        }
        
        .coming-soon {
          text-align: center;
          padding: 5rem 2rem;
          animation: fadeIn 0.5s var(--transition-function);
        }
        
        .coming-soon h2 {
          font-family: var(--font-family-display);
          font-size: 2rem;
          color: var(--text-color);
          display: inline-block;
          position: relative;
        }
        
        .coming-soon h2::after {
          content: '';
          position: absolute;
          bottom: -8px;
          left: 25%;
          width: 50%;
          height: 3px;
          background: var(--accent-gradient);
          border-radius: var(--radius-full);
        }

        /* Error Message */
        .error-message {
          background: rgba(212, 0, 28, 0.08);
          border-left: 4px solid var(--tab-color); /* Keep red for error */
          padding: 1rem 1.5rem;
          margin-bottom: 2rem;
          border-radius: var(--radius-sm);
          color: var(--tab-color);
          font-weight: 500;
          animation: fadeIn 0.5s var(--transition-function);
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        
        .error-message svg {
          flex-shrink: 0;
        }

        /* Responsive Styles */
        @media (max-width: 1400px) {
          .cards-container {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        
        @media (max-width: 992px) {
          .stats-container {
            padding: 1.5rem;
          }
          
          .stats-header h1 {
            font-size: 2rem;
          }
          
          .cards-container {
            grid-template-columns: repeat(2, 1fr);
            gap: 1.5rem;
          }
        }
        
        @media (max-width: 768px) {
          .view-toggle {
            gap: 0.5rem;
          }
          
          .tab-button {
            padding: 0.6rem 1.25rem;
            font-size: 0.9rem;
          }
          
          .stats-header img {
            width: 50px;
            height: 50px;
          }
          
          .cards-container {
            grid-template-columns: 1fr;
          }
        }
        
        @media (max-width: 480px) {
          .stats-container {
            padding: 1rem;
          }
          
          .stats-header {
            flex-direction: column;
            gap: 1rem;
          }
          
          .stats-header img {
            margin-right: 0;
          }
          
          .stats-header h1 {
            font-size: 1.6rem;
            text-align: center;
          }
          
          .view-toggle {
            flex-direction: column;
            width: 100%;
          }
          
          .tab-button {
            width: 100%;
          }
          
          .featured-player {
            flex-wrap: wrap;
            justify-content: center;
            text-align: center;
            gap: 0.75rem;
          }
          
          .featured-rank {
            width: 100%;
          }
          
          .featured-info {
            text-align: center;
            width: 100%;
            order: 3;
          }
          
          .featured-stat {
            order: 4;
            width: 100%;
          }
          
          .leader-name {
            max-width: 120px;
          }
        }
      `}</style>

      {/* Title */}
      <div className="stats-header">
        <img src="/photos/ncaaf.png" alt="NCAAF Logo" />
        <h1>COLLEGE FOOTBALL STATISTICS</h1>
      </div>

      {/* Tabs */}
      <div className="view-toggle">
        <button
          className={`tab-button ${activeTab === "playerLeaders" ? "active" : ""}`}
          onClick={() => setActiveTab("playerLeaders")}
        >
          Player Leaders
        </button>
        <button
          className={`tab-button ${activeTab === "teamLeaders" ? "active" : ""}`}
          onClick={() => setActiveTab("teamLeaders")}
        >
          Team Leaders
        </button>
        <button
          className={`tab-button ${activeTab === "playerStats" ? "active" : ""}`}
          onClick={() => setActiveTab("playerStats")}
        >
          Player Stats
        </button>
        <button
          className={`tab-button ${activeTab === "teamStats" ? "active" : ""}`}
          onClick={() => setActiveTab("teamStats")}
        >
          Team Stats
        </button>
      </div>

      {error && (
        <div className="error-message">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M12 8V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M12 16H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          {error}
        </div>
      )}

      {/* Content */}
      {activeTab === "playerLeaders" ? (
        <div className="cards-container">
          {renderStatCard("Passing Yards", playerStats.passing, loadingPassing, "YDS")}
          {renderStatCard("Rushing Yards", playerStats.rushing, loadingRushing, "YDS")}
          {renderStatCard("Receiving Yards", playerStats.receiving, loadingReceiving, "YDS")}
          {renderStatCard("Interceptions", playerStats.interceptions, loadingInterceptions, "INT")}
        </div>
      ) : (
        <div className="coming-soon">
          <h2>Coming Soon...</h2>
        </div>
      )}
    </div>
  );
};

export default Stats;