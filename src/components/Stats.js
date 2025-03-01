import React, { useState, useEffect } from "react";
import teamsService from "../services/teamsService";
import "../styles/Stats.css";

// Updated aggregation function (same logic, reorganized for clarity)
const aggregatePlayerStats = (data, desiredStatType) => {
  const rawData = Array.isArray(data) ? data : data?.data || [];
  console.log(`aggregatePlayerStats - raw data for ${desiredStatType}:`, rawData);

  const aggregated = rawData
    .filter(item =>
      item.statType &&
      item.statType.trim().toUpperCase().includes(desiredStatType.toUpperCase())
    )
    .map(item => ({
      playerName: item.player,
      statValue: parseFloat(item.stat),
      playerPhoto: item.playerPhoto || null,
    }));

  console.log(`aggregatePlayerStats - aggregated for ${desiredStatType}:`, aggregated);
  return aggregated;
};

const Stats = () => {
  // Toggle between Player view and Team view
  const [viewMode, setViewMode] = useState("player"); // "player" or "team"

  // State for team stats
  const [allTeamStats, setAllTeamStats] = useState([]);
  const [loadingTeamStats, setLoadingTeamStats] = useState(true);
  const [errorTeamStats, setErrorTeamStats] = useState(null);

  // State for player season stats
  const [playerStats, setPlayerStats] = useState({});
  const [loadingPlayerStats, setLoadingPlayerStats] = useState(true);
  const [errorPlayerStats, setErrorPlayerStats] = useState(null);

  // Fetch team stats
  useEffect(() => {
    const fetchTeamStats = async () => {
      try {
        setLoadingTeamStats(true);
        const teams = await teamsService.getTeams(); // All FBS teams
        const statsPromises = teams.map(async (team) => {
          try {
            const stats = await teamsService.getTeamStats(team.school, 2024);
            return { team: team.school, stats, logo: team.logos[0] };
          } catch (err) {
            console.error(`Error fetching stats for ${team.school}:`, err);
            return { team: team.school, stats: {}, logo: team.logos[0] };
          }
        });

        const allStats = await Promise.all(statsPromises);
        setAllTeamStats(allStats);
      } catch (error) {
        console.error("Error fetching team stats:", error);
        setErrorTeamStats("Failed to load team stats.");
      } finally {
        setLoadingTeamStats(false);
      }
    };
    fetchTeamStats();
  }, []);

  // Fetch player season stats
  useEffect(() => {
    const fetchPlayerStats = async () => {
      try {
        setLoadingPlayerStats(true);
        const categories = ["passing", "rushing", "receiving", "defensive"];
        const results = await Promise.allSettled(
          categories.map(cat => teamsService.getPlayerSeasonStats(2024, cat))
        );

        const statsObj = {};
        categories.forEach((cat, index) => {
          statsObj[cat] =
            results[index].status === "fulfilled" ? results[index].value : [];
        });

        // Offensive
        const passing = aggregatePlayerStats(statsObj["passing"], "YDS");
        const rushing = aggregatePlayerStats(statsObj["rushing"], "YDS");
        const receiving = aggregatePlayerStats(statsObj["receiving"], "YDS");
        // Defensive
        const tackles = aggregatePlayerStats(statsObj["defensive"], "TOT");
        const sacks = aggregatePlayerStats(statsObj["defensive"], "SACKS");
        const interceptions = aggregatePlayerStats(statsObj["defensive"], "INT");

        setPlayerStats({
          passing,
          rushing,
          receiving,
          tackles,
          sacks,
          interceptions,
        });
      } catch (error) {
        console.error("Error fetching player season stats:", error);
        setErrorPlayerStats("Failed to load player season stats.");
      } finally {
        setLoadingPlayerStats(false);
      }
    };
    fetchPlayerStats();
  }, []);

  // Helper: Sort team stats by a given key (highest to lowest)
  const sortByTeamStat = (statKey) => {
    return [...allTeamStats]
      .filter(({ stats }) => stats && stats[statKey] !== undefined)
      .sort((a, b) => b.stats[statKey] - a.stats[statKey]);
  };

  // Render top 5 teams for a given stat
  const renderTeamLeaders = (statName) => {
    if (loadingTeamStats) return <p className="stat-placeholder">Loading...</p>;
    if (errorTeamStats) return <p className="stat-placeholder">{errorTeamStats}</p>;

    const sortedTeams = sortByTeamStat(statName).slice(0, 5);
    if (sortedTeams.length === 0) return <p className="stat-placeholder">No data available</p>;

    return sortedTeams.map(({ team, stats, logo }) => (
      <div key={team} className="leader-row">
        <img
          src={logo}
          alt={team}
          className="team-stat-logo"
          onError={(e) => (e.currentTarget.style.display = "none")}
        />
        <span className="leader-name">{team}</span>
        <span className="leader-stat">{stats[statName] || 0}</span>
      </div>
    ));
  };

  // Render top 5 players for a given category
  const renderPlayerLeaders = (category) => {
    if (loadingPlayerStats)
      return <p className="stat-placeholder">Loading...</p>;
    if (errorPlayerStats)
      return <p className="stat-placeholder">{errorPlayerStats}</p>;

    const players = playerStats[category] || [];
    if (players.length === 0) return <p className="stat-placeholder">No data available</p>;

    const topPlayers = players.slice(0, 5);
    return topPlayers.map((player, idx) => (
      <div key={`${player.playerName}-${idx}`} className="leader-row">
        {/* If you had a player logo or photo, it would go here */}
        <img
          src={player.playerPhoto || ""}
          alt={player.playerName}
          className="stats-player-logo"
          onError={(e) => (e.currentTarget.style.display = "none")}
        />
        <span className="leader-name">{player.playerName}</span>
        <span className="leader-stat">{player.statValue || 0}</span>
      </div>
    ));
  };

  // UI for the Player tab
  const renderPlayerView = () => {
    return (
      <div className="leaders-wrapper">
        <div className="leaders-column">
          <h2 className="leaders-header">Offensive Leaders</h2>
          <div className="leaders-card">
            <h3>Passing</h3>
            {renderPlayerLeaders("passing")}
          </div>
          <div className="leaders-card">
            <h3>Rushing</h3>
            {renderPlayerLeaders("rushing")}
          </div>
          <div className="leaders-card">
            <h3>Receiving</h3>
            {renderPlayerLeaders("receiving")}
          </div>
        </div>
        <div className="leaders-column">
          <h2 className="leaders-header">Defensive Leaders</h2>
          <div className="leaders-card">
            <h3>Tackles</h3>
            {renderPlayerLeaders("tackles")}
          </div>
          <div className="leaders-card">
            <h3>Sacks</h3>
            {renderPlayerLeaders("sacks")}
          </div>
          <div className="leaders-card">
            <h3>Interceptions</h3>
            {renderPlayerLeaders("interceptions")}
          </div>
        </div>
      </div>
    );
  };

  // UI for the Team tab
  const renderTeamView = () => {
    return (
      <div className="leaders-wrapper">
        <div className="leaders-column">
          <h2 className="leaders-header">Offensive Leaders</h2>
          <div className="leaders-card">
            <h3>Total Yards</h3>
            {renderTeamLeaders("totalYards")}
          </div>
          <div className="leaders-card">
            <h3>Passing Yards</h3>
            {renderTeamLeaders("netPassingYards")}
          </div>
          <div className="leaders-card">
            <h3>Rushing Yards</h3>
            {renderTeamLeaders("rushingYards")}
          </div>
        </div>
        <div className="leaders-column">
          <h2 className="leaders-header">Defensive Leaders</h2>
          <div className="leaders-card">
            <h3>Yards Allowed</h3>
            {renderTeamLeaders("yardsAllowed")}
          </div>
          <div className="leaders-card">
            <h3>Points Allowed</h3>
            {renderTeamLeaders("pointsAllowed")}
          </div>
          <div className="leaders-card">
            <h3>Sacks</h3>
            {renderTeamLeaders("sacks")}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="stats-container">
      <h1 className="stats-header">College Football Stat Leaders 2024</h1>

      {/* Toggle between Player / Team */}
      <div className="view-toggle">
        <button
          className={viewMode === "player" ? "toggle-btn active" : "toggle-btn"}
          onClick={() => setViewMode("player")}
        >
          Player
        </button>
        <button
          className={viewMode === "team" ? "toggle-btn active" : "toggle-btn"}
          onClick={() => setViewMode("team")}
        >
          Team
        </button>
      </div>

      {viewMode === "player" ? renderPlayerView() : renderTeamView()}
    </div>
  );
};

export default Stats;