import React, { useState, useEffect } from "react";
import teamsService from "../services/teamsService";
import "../styles/Stat.css";

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