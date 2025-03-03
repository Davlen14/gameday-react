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

// Aggregate and filter only FBS conferences
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

  aggregated.sort((a, b) => b.statValue - a.statValue);
  console.log(`aggregatePlayerStats - aggregated for ${desiredStatType}:`, aggregated);
  return aggregated;
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
      setPlayerStats((prev) => ({ ...prev, [key]: aggregated.slice(0, 10) }));
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

  // Renders a single "stat card"
  // topOne = data[0] (bigger highlight)
  // nextFour = data.slice(1,5)
  const renderStatCard = (title, data, loading) => {
    if (loading) {
      return (
        <div className="stat-card">
          <h3>{title}</h3>
          <p className="loading-text">Loading...</p>
        </div>
      );
    }
    if (!data.length) {
      return (
        <div className="stat-card">
          <h3>{title}</h3>
          <p className="loading-text">No data found.</p>
        </div>
      );
    }
    const topOne = data[0];
    const nextFour = data.slice(1, 5);

    return (
      <div className="stat-card">
        <h3>{title}</h3>
        {/* Highlight the top player */}
        <div className="top-player-row">
          <div className="top-player-name">
            <img
              src={getTeamLogo(topOne.team)}
              alt={topOne.team}
              className="logo-img"
            />
            <span className="top-player">{topOne.playerName}</span>
          </div>
          <div className="top-player-stat">{topOne.statValue}</div>
        </div>

        {/* Next four in smaller rows */}
        <div className="small-rows">
          {nextFour.map((p, idx) => (
            <div className="small-row" key={idx}>
              <span className="small-rank">{idx + 2}.</span>
              <img
                src={getTeamLogo(p.team)}
                alt={p.team}
                className="logo-img small-logo"
              />
              <span className="small-name">{p.playerName}</span>
              <span className="small-stat">{p.statValue}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Renders the "Player Leaders" page with 3 cards on top row, 1 card on bottom row
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

        /* Stat card styling */
        .stat-card {
          background: var(--card-background);
          border: 1px solid var(--border-color);
          box-shadow: 0 4px 8px var(--shadow-color);
          padding: 1rem;
          transition: transform 0.2s ease;
          border-radius: 0; /* sharp corners */
        }
        .stat-card:hover {
          transform: translateY(-2px);
        }
        .stat-card h3 {
          margin: 0 0 1rem 0;
          font-size: 1.1rem;
          text-transform: uppercase;
          color: var(--primary-color);
          border-bottom: 1px solid var(--border-color);
          padding-bottom: 0.5rem;
        }

        /* Top player row */
        .top-player-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1rem;
        }
        .top-player-name {
          display: flex;
          align-items: center;
        }
        .top-player {
          font-size: 1.1rem;
          font-weight: bold;
        }
        .top-player-stat {
          font-size: 1.4rem;
          font-weight: bold;
          color: var(--primary-color);
        }

        /* Next four in smaller rows */
        .small-rows {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }
        .small-row {
          display: flex;
          align-items: center;
          font-size: 0.9rem;
        }
        .small-rank {
          margin-right: 0.25rem;
          color: var(--primary-color);
          font-weight: bold;
        }
        .small-logo {
          width: 20px;
          height: 20px;
        }
        .small-name {
          margin-right: auto;
        }
        .small-stat {
          margin-left: 0.5rem;
          font-weight: bold;
        }

        /* Basic loading text */
        .loading-text {
          font-style: italic;
          color: #777;
        }

        /* Coming soon page */
        .coming-soon {
          text-align: center;
          margin-top: 2rem;
          font-size: 1.3rem;
          color: var(--primary-color);
        }
      `}</style>

      {/* Page Title with NCAAF logo and italic text */}
      <div className="page-title">
        <img
          src="/photos/ncaaf.png"
          alt="NCAAF Logo"
        />
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

      {error && <p style={{ color: "red", textAlign: "center" }}>{error}</p>}

      {/* Main Content */}
      {activeTab === "playerLeaders" ? (
        <>{/* Player Leaders Layout */}</>
      ) : (
        <div className="coming-soon">
          <h2>Coming Soon...</h2>
        </div>
      )}

      {/* If "playerLeaders", show the card layout */}
      {activeTab === "playerLeaders" && (
        <div className="cards-layout">
          <div className="top-row">
            {/* Passing, Rushing, Receiving Cards */}
            {/* Passing */}
            {(() => {
              const data = playerStats.passing;
              if (loadingPassing) {
                return (
                  <div className="stat-card">
                    <h3>Passing Yards</h3>
                    <p className="loading-text">Loading...</p>
                  </div>
                );
              }
              if (!data.length) {
                return (
                  <div className="stat-card">
                    <h3>Passing Yards</h3>
                    <p className="loading-text">No data found.</p>
                  </div>
                );
              }
              const topOne = data[0];
              const nextFour = data.slice(1, 5);

              return (
                <div className="stat-card">
                  <h3>Passing Yards</h3>
                  <div className="top-player-row">
                    <div className="top-player-name">
                      <img
                        src={getTeamLogo(topOne.team)}
                        alt={topOne.team}
                        className="logo-img"
                      />
                      <span className="top-player">{topOne.playerName}</span>
                    </div>
                    <div className="top-player-stat">{topOne.statValue}</div>
                  </div>
                  <div className="small-rows">
                    {nextFour.map((p, idx) => (
                      <div className="small-row" key={idx}>
                        <span className="small-rank">{idx + 2}.</span>
                        <img
                          src={getTeamLogo(p.team)}
                          alt={p.team}
                          className="logo-img small-logo"
                        />
                        <span className="small-name">{p.playerName}</span>
                        <span className="small-stat">{p.statValue}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Rushing */}
            {(() => {
              const data = playerStats.rushing;
              if (loadingRushing) {
                return (
                  <div className="stat-card">
                    <h3>Rushing Yards</h3>
                    <p className="loading-text">Loading...</p>
                  </div>
                );
              }
              if (!data.length) {
                return (
                  <div className="stat-card">
                    <h3>Rushing Yards</h3>
                    <p className="loading-text">No data found.</p>
                  </div>
                );
              }
              const topOne = data[0];
              const nextFour = data.slice(1, 5);

              return (
                <div className="stat-card">
                  <h3>Rushing Yards</h3>
                  <div className="top-player-row">
                    <div className="top-player-name">
                      <img
                        src={getTeamLogo(topOne.team)}
                        alt={topOne.team}
                        className="logo-img"
                      />
                      <span className="top-player">{topOne.playerName}</span>
                    </div>
                    <div className="top-player-stat">{topOne.statValue}</div>
                  </div>
                  <div className="small-rows">
                    {nextFour.map((p, idx) => (
                      <div className="small-row" key={idx}>
                        <span className="small-rank">{idx + 2}.</span>
                        <img
                          src={getTeamLogo(p.team)}
                          alt={p.team}
                          className="logo-img small-logo"
                        />
                        <span className="small-name">{p.playerName}</span>
                        <span className="small-stat">{p.statValue}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Receiving */}
            {(() => {
              const data = playerStats.receiving;
              if (loadingReceiving) {
                return (
                  <div className="stat-card">
                    <h3>Receiving Yards</h3>
                    <p className="loading-text">Loading...</p>
                  </div>
                );
              }
              if (!data.length) {
                return (
                  <div className="stat-card">
                    <h3>Receiving Yards</h3>
                    <p className="loading-text">No data found.</p>
                  </div>
                );
              }
              const topOne = data[0];
              const nextFour = data.slice(1, 5);

              return (
                <div className="stat-card">
                  <h3>Receiving Yards</h3>
                  <div className="top-player-row">
                    <div className="top-player-name">
                      <img
                        src={getTeamLogo(topOne.team)}
                        alt={topOne.team}
                        className="logo-img"
                      />
                      <span className="top-player">{topOne.playerName}</span>
                    </div>
                    <div className="top-player-stat">{topOne.statValue}</div>
                  </div>
                  <div className="small-rows">
                    {nextFour.map((p, idx) => (
                      <div className="small-row" key={idx}>
                        <span className="small-rank">{idx + 2}.</span>
                        <img
                          src={getTeamLogo(p.team)}
                          alt={p.team}
                          className="logo-img small-logo"
                        />
                        <span className="small-name">{p.playerName}</span>
                        <span className="small-stat">{p.statValue}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Bottom row: Interceptions */}
          <div className="bottom-row">
            {(() => {
              const data = playerStats.interceptions;
              if (loadingInterceptions) {
                return (
                  <div className="stat-card">
                    <h3>Interceptions</h3>
                    <p className="loading-text">Loading...</p>
                  </div>
                );
              }
              if (!data.length) {
                return (
                  <div className="stat-card">
                    <h3>Interceptions</h3>
                    <p className="loading-text">No data found.</p>
                  </div>
                );
              }
              const topOne = data[0];
              const nextFour = data.slice(1, 5);

              return (
                <div className="stat-card">
                  <h3>Interceptions</h3>
                  <div className="top-player-row">
                    <div className="top-player-name">
                      <img
                        src={getTeamLogo(topOne.team)}
                        alt={topOne.team}
                        className="logo-img"
                      />
                      <span className="top-player">{topOne.playerName}</span>
                    </div>
                    <div className="top-player-stat">{topOne.statValue}</div>
                  </div>
                  <div className="small-rows">
                    {nextFour.map((p, idx) => (
                      <div className="small-row" key={idx}>
                        <span className="small-rank">{idx + 2}.</span>
                        <img
                          src={getTeamLogo(p.team)}
                          alt={p.team}
                          className="logo-img small-logo"
                        />
                        <span className="small-name">{p.playerName}</span>
                        <span className="small-stat">{p.statValue}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
};

export default Stats;