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

  // Render card
  const renderStatCard = (title, data, loading) => {
    if (loading) {
      return (
        <div className="stat-card">
          <h3 className="card-title">{title}</h3>
          <div className="loading-text">Loading...</div>
        </div>
      );
    }
    if (!data.length) {
      return (
        <div className="stat-card">
          <h3 className="card-title">{title}</h3>
          <div className="loading-text">No data found.</div>
        </div>
      );
    }
    const top = data[0];
    const rest = data.slice(1);

    return (
      <div className="stat-card">
        <h3 className="card-title">{title}</h3>

        {/* Top player row */}
        <div className="top-row-section">
          <span className="top-rank">1</span>
          <img
            src={getTeamLogo(top.team)}
            alt={getTeamAbbreviation(top.team)}
            className="top-logo"
          />
          <div className="top-info">
            <div className="top-player-name">{top.playerName}</div>
            <div className="top-sub">
              {getTeamAbbreviation(top.team)}
            </div>
          </div>
          <div className="top-yds">{top.statValue}</div>
        </div>

        {/* Next 9 in table format */}
        <div className="table-header">
          <span className="col-rank">RANK</span>
          <span className="col-team">TEAM</span>
          <span className="col-player">PLAYER</span>
          <span className="col-yds">YDS</span>
        </div>
        <div className="table-body">
          {rest.map((p, idx) => {
            const rank = idx + 2; // since top is #1
            return (
              <div className="table-row" key={idx}>
                <span className="col-rank">{rank}</span>
                <span className="col-team">
                  <img
                    src={getTeamLogo(p.team)}
                    alt={getTeamAbbreviation(p.team)}
                    className="table-logo"
                  />
                  {getTeamAbbreviation(p.team)}
                </span>
                <span className="col-player">{p.playerName}</span>
                <span className="col-yds">{p.statValue}</span>
              </div>
            );
          })}
        </div>

        <div className="complete-link">
          Complete {title} Leaders
        </div>
      </div>
    );
  };

  // Render 3 on top row, 1 on bottom row
  const renderPlayerLeaders = () => {
    return (
      <div className="cards-container">
        <div className="row top-row">
          {renderStatCard("Passing Yards", playerStats.passing, loadingPassing)}
          {renderStatCard("Rushing Yards", playerStats.rushing, loadingRushing)}
          {renderStatCard("Receiving Yards", playerStats.receiving, loadingReceiving)}
        </div>
        <div className="row bottom-row">
          {renderStatCard("Interceptions", playerStats.interceptions, loadingInterceptions)}
        </div>
      </div>
    );
  };

  // Content
  const renderContent = () => {
    if (activeTab === "playerLeaders") {
      return renderPlayerLeaders();
    } else {
      return (
        <div className="coming-soon">
          <h2>Coming Soon...</h2>
        </div>
      );
    }
  };

  return (
    <div className="stats-container">
      <style>{`
        /* Import new fonts for specific selectors */
        @import url('https://fonts.googleapis.com/css2?family=Orbitron&family=Titillium+Web&display=swap');
        /* Existing font import for rest of page (if needed) */
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

        :root {
          --bg-color: #ffffff;
          --text-color: #222222;
          --highlight-color: #333333; /* Subtle highlight instead of red */
          --border-color: #ddd;
          --shadow-color: rgba(0, 0, 0, 0.08);
          --card-bg: #f9f9f9;
          --primary-font: 'Inter', sans-serif;
          --heading-font-size: 1rem;
          --sub-font-size: 0.85rem;
        }

        .stats-container {
          background: var(--bg-color);
          color: var(--text-color);
          font-family: var(--primary-font);
          margin: 2rem;
        }

        /* Page Title */
        .page-title {
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 1rem;
        }
        .page-title img {
          width: 50px;
          height: 50px;
          margin-right: 1rem;
        }
        .page-title h1 {
          font-style: italic;
          font-size: 2rem;
          margin: 0;
          color: var(--highlight-color);
          /* Use new fonts for the title */
          font-family: "Orbitron", "Titillium Web", sans-serif;
        }

        /* Tabs */
        .tabs {
          display: flex;
          justify-content: center;
          margin-bottom: 2rem;
        }
        .tab-button {
          border: none;
          background: none;
          font-size: 1rem;
          padding: 0.75rem 1.5rem;
          margin: 0 0.5rem;
          cursor: pointer;
          border-bottom: 2px solid transparent;
          transition: color 0.3s ease, border-bottom 0.3s ease;
          /* Use new fonts for tab buttons */
          font-family: "Orbitron", "Titillium Web", sans-serif;
        }
        .tab-button:hover {
          color: var(--highlight-color);
        }
        .tab-button.active {
          border-bottom: 2px solid var(--highlight-color);
          color: var(--highlight-color);
          font-weight: 600;
        }

        .coming-soon {
          text-align: center;
          margin-top: 2rem;
          font-size: 1.3rem;
          color: var(--highlight-color);
        }

        /* Cards Layout */
        .cards-container {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }
        .row {
          display: grid;
          gap: 1.5rem;
        }
        .top-row {
          grid-template-columns: repeat(3, 1fr);
        }
        .bottom-row {
          grid-template-columns: 1fr;
        }

        /* Stat Card */
        .stat-card {
          background: var(--card-bg);
          border: 1px solid var(--border-color);
          box-shadow: 0 2px 4px var(--shadow-color);
          border-radius: 6px;
          padding: 1rem;
          transition: transform 0.2s ease;
          display: flex;
          flex-direction: column;
        }
        .stat-card:hover {
          transform: translateY(-2px);
        }
        .card-title {
          font-size: 1rem;
          font-weight: 600;
          color: var(--highlight-color);
          margin-bottom: 1rem;
          border-bottom: 1px solid var(--border-color);
          padding-bottom: 0.5rem;
          /* Use new fonts for card titles */
          font-family: "Orbitron", "Titillium Web", sans-serif;
        }
        .loading-text {
          font-style: italic;
          color: #666;
        }

        /* Top Row Section (Rank #1) */
        .top-row-section {
          display: flex;
          align-items: center;
          margin-bottom: 1rem;
          gap: 0.75rem;
        }
        .top-rank {
          font-size: 1.2rem;
          font-weight: 600;
          color: var(--highlight-color);
        }
        .top-logo {
          width: 40px;
          height: 40px;
          object-fit: contain;
        }
        .top-info {
          display: flex;
          flex-direction: column;
          margin-right: auto;
        }
        .top-player-name {
          font-size: 1rem;
          font-weight: 500;
          margin-bottom: 0.25rem;
        }
        .top-sub {
          font-size: var(--sub-font-size);
          color: #777;
        }
        .top-yds {
          font-size: 1.2rem;
          font-weight: 600;
          color: var(--text-color);
        }

        /* Table for next 9 */
        .table-header {
          display: grid;
          grid-template-columns: 40px 80px 1fr 60px;
          font-size: 0.8rem;
          color: #888;
          font-weight: 600;
          padding: 0.5rem 0;
          border-top: 1px solid var(--border-color);
          border-bottom: 1px solid var(--border-color);
          /* Use new fonts for table headers */
          font-family: "Orbitron", "Titillium Web", sans-serif;
        }
        .table-body {
          display: flex;
          flex-direction: column;
        }
        .table-row {
          display: grid;
          grid-template-columns: 40px 80px 1fr 60px;
          align-items: center;
          font-size: 0.85rem;
          padding: 0.5rem 0;
          border-bottom: 1px solid var(--border-color);
        }
        .table-row:last-child {
          border-bottom: none;
        }
        .col-rank {
          color: var(--highlight-color);
          font-weight: 600;
        }
        .table-logo {
          width: 18px;
          height: 18px;
          object-fit: contain;
          margin-right: 4px;
          vertical-align: middle;
        }
        .col-team {
          display: flex;
          align-items: center;
          gap: 4px;
          font-weight: 500;
        }
        .col-player {
          font-weight: 400;
        }
        .col-yds {
          text-align: right;
          font-weight: 600;
        }

        .complete-link {
          text-align: center;
          margin-top: 0.75rem;
          font-size: 0.8rem;
          color: #666;
          cursor: pointer;
        }
        .complete-link:hover {
          text-decoration: underline;
        }
      `}</style>

      {/* Title */}
      <div className="page-title">
        <img src="/photos/ncaaf.png" alt="NCAAF Logo" />
        <h1>COLLEGE FOOTBALL STATISTICS</h1>
      </div>

      {/* Tabs */}
      <div className="tabs">
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

      {error && <p style={{ color: "red", textAlign: "center" }}>{error}</p>}

      {/* Content */}
      {activeTab === "playerLeaders" ? (
        <div className="cards-container">
          <div className="row top-row">
            {renderStatCard("Passing Yards", playerStats.passing, loadingPassing)}
            {renderStatCard("Rushing Yards", playerStats.rushing, loadingRushing)}
            {renderStatCard("Receiving Yards", playerStats.receiving, loadingReceiving)}
          </div>
          <div className="row bottom-row">
            {renderStatCard("Interceptions", playerStats.interceptions, loadingInterceptions)}
          </div>
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