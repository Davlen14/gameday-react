import React, { useState, useEffect } from "react";
import teamsService from "../services/teamsService";

// Define the list of allowed FBS conferences (all uppercase for comparison)
const allowedConferences = [
  "SEC",
  "ACC",
  "BIG 12",
  "BIG TEN",
  "PAC-12",
  "AMERICAN ATHLETIC",
  "MOUNTAIN WEST",
  "SUN BELT",
  "FBS INDEPENDENTS"
];

// Aggregate and filter only FBS conferences, then return top 10
const aggregatePlayerStats = (data, desiredStatType) => {
  const rawData = Array.isArray(data) ? data : data?.data || [];
  console.log(`aggregatePlayerStats - raw data for ${desiredStatType}:`, rawData);

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

  // Sort in descending order
  aggregated.sort((a, b) => b.statValue - a.statValue);
  console.log(`aggregatePlayerStats - aggregated for ${desiredStatType}:`, aggregated);

  // Only return the top 10
  return aggregated.slice(0, 10);
};

const Stats = () => {
  // Data state
  const [playerStats, setPlayerStats] = useState({
    passing: [],
    rushing: [],
    receiving: [],
    interceptions: [],
  });

  // Teams for logo lookups
  const [teams, setTeams] = useState([]);

  // Loading states
  const [loadingPassing, setLoadingPassing] = useState(true);
  const [loadingRushing, setLoadingRushing] = useState(true);
  const [loadingReceiving, setLoadingReceiving] = useState(true);
  const [loadingInterceptions, setLoadingInterceptions] = useState(true);

  // Simple error state
  const [error, setError] = useState(null);

  // Tab state: "playerLeaders", "teamLeaders", "playerStats", "teamStats"
  const [activeTab, setActiveTab] = useState("playerLeaders");

  // Fetch FBS teams for logos
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

  // Helper: get team logo
  const getTeamLogo = (teamName) => {
    const foundTeam = teams.find(
      (t) => t.school?.toLowerCase() === teamName?.toLowerCase()
    );
    return foundTeam?.logos?.[0] || "/photos/default_team.png";
  };

  // Helper: fetch & set data
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

  // Fetch Passing, Rushing, Receiving, Interceptions
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

  // Renders a single "stat card" for top 10
  // topOne = data[0], nextNine = data.slice(1)
  const renderStatCard = (title, data, loading) => {
    if (loading) {
      return (
        <div className="stat-card">
          <div className="card-title">{title}</div>
          <div className="card-loading">Loading...</div>
        </div>
      );
    }
    if (!data.length) {
      return (
        <div className="stat-card">
          <div className="card-title">{title}</div>
          <div className="card-loading">No data found.</div>
        </div>
      );
    }
    const topOne = data[0];
    const nextNine = data.slice(1);

    return (
      <div className="stat-card">
        <div className="card-title">{title}</div>

        {/* Top player row */}
        <div className="top-player-row">
          <img
            src={getTeamLogo(topOne.team)}
            alt={topOne.team}
            className="top-logo"
          />
          <div className="top-player-name">{topOne.playerName}</div>
          <div className="top-player-stat">{topOne.statValue}</div>
        </div>

        {/* Next nine in smaller rows */}
        <div className="divider" />
        <div className="small-rows">
          {nextNine.map((p, idx) => (
            <div className="small-row" key={idx}>
              <span className="small-rank">{idx + 2}.</span>
              <span className="small-name">{p.playerName}</span>
              <span className="small-stat">{p.statValue}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Renders the "Player Leaders" page with 3 cards on top row, 1 on bottom row
  const renderPlayerLeaders = () => {
    return (
      <div className="cards-layout">
        <div className="top-row">
          {renderStatCard("Passing Yards", playerStats.passing, loadingPassing)}
          {renderStatCard("Rushing Yards", playerStats.rushing, loadingRushing)}
          {renderStatCard("Receiving Yards", playerStats.receiving, loadingReceiving)}
        </div>
        <div className="bottom-row">
          {renderStatCard("Interceptions", playerStats.interceptions, loadingInterceptions)}
        </div>
      </div>
    );
  };

  // Main content based on activeTab
  const renderContent = () => {
    if (activeTab === "playerLeaders") {
      return renderPlayerLeaders();
    } else {
      // "teamLeaders", "playerStats", "teamStats" => coming soon
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
        :root {
          --background-color: #ffffff;
          --text-color: #000000;
          --primary-color: #d4001c; /* Red theme */
          --card-background: #f9f9f9;
          --border-color: #ddd;
          --shadow-color: rgba(0, 0, 0, 0.08);
          --primary-font: 'Roboto', sans-serif;
        }

        .stats-container {
          font-family: var(--primary-font);
          margin: 2rem;
          background: var(--background-color);
          color: var(--text-color);
        }

        /* Title with logo and italics */
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
          font-size: 1.1rem;
          padding: 0.75rem 1.5rem;
          margin: 0 0.5rem;
          cursor: pointer;
          border-bottom: 3px solid transparent;
          transition: color 0.3s ease, border-bottom 0.3s ease;
        }
        .tab-button:hover {
          color: var(--primary-color);
        }
        .tab-button.active {
          border-bottom: 3px solid var(--primary-color);
          color: var(--primary-color);
          font-weight: bold;
        }

        .coming-soon {
          text-align: center;
          margin-top: 2rem;
          font-size: 1.3rem;
          color: var(--primary-color);
        }

        /* Cards layout: top row (3 cards), bottom row (1 card) */
        .cards-layout {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }
        .top-row {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.5rem;
        }
        .bottom-row {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1.5rem;
        }

        /* Stat card */
        .stat-card {
          background: var(--card-background);
          border: 1px solid var(--border-color);
          box-shadow: 0 4px 8px var(--shadow-color);
          transition: transform 0.2s ease;
          border-radius: 0; /* sharp corners */
          padding: 1rem;
          display: flex;
          flex-direction: column;
        }
        .stat-card:hover {
          transform: translateY(-2px);
        }

        .card-title {
          font-size: 1.1rem;
          text-transform: uppercase;
          color: var(--primary-color);
          font-weight: bold;
          margin-bottom: 1rem;
          border-bottom: 1px solid var(--border-color);
          padding-bottom: 0.5rem;
        }
        .card-loading {
          font-style: italic;
          color: #777;
        }

        /* Top player row (logo, name, stat) */
        .top-player-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 0.75rem;
        }
        .top-logo {
          width: 40px;
          height: 40px;
          margin-right: 0.5rem;
          object-fit: contain;
        }
        .top-player-name {
          font-size: 1rem;
          font-weight: bold;
          margin-right: auto;
          margin-left: 0.5rem;
        }
        .top-player-stat {
          font-size: 1rem;
          font-weight: bold;
          color: var(--text-color);
        }

        .divider {
          height: 1px;
          background: var(--border-color);
          margin: 0.5rem 0;
        }

        /* Next nine in smaller rows */
        .small-rows {
          display: flex;
          flex-direction: column;
          gap: 0.3rem;
        }
        .small-row {
          display: flex;
          align-items: center;
          font-size: 0.9rem;
          justify-content: space-between;
        }
        .small-rank {
          color: var(--primary-color);
          font-weight: bold;
          margin-right: 0.5rem;
        }
        .small-name {
          flex: 1;
        }
        .small-stat {
          font-weight: bold;
          margin-left: 0.5rem;
        }
      `}</style>

      {/* Page Title */}
      <div className="page-title">
        <img src="/photos/ncaaf.png" alt="NCAAF Logo" />
        <h1>COLLEGE FOOTBALL statistics</h1>
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

      {/* Error */}
      {error && <p style={{ color: "red", textAlign: "center" }}>{error}</p>}

      {/* Main Content */}
      {activeTab === "playerLeaders" ? (
        <div className="cards-layout">
          <div className="top-row">
            {/* Passing */}
            {renderStatCard("Passing Yards", playerStats.passing, loadingPassing)}
            {/* Rushing */}
            {renderStatCard("Rushing Yards", playerStats.rushing, loadingRushing)}
            {/* Receiving */}
            {renderStatCard("Receiving Yards", playerStats.receiving, loadingReceiving)}
          </div>
          <div className="bottom-row">
            {/* Interceptions */}
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