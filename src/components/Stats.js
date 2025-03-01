import React, { useState, useEffect } from "react";
import teamsService from "../services/teamsService";
import "../styles/Stats.css";

// Updated aggregatePlayerStats using a looser match condition with includes()
const aggregatePlayerStats = (data, desiredStatType) => {
  // Support both raw arrays and responses wrapped in a data property
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
  // For now we only fetch "passing" stats; the others show "Coming Soon"
  const [playerStats, setPlayerStats] = useState({
    passing: [],
    rushing: null,
    receiving: null,
    tackles: null,
    sacks: null,
    interceptions: null,
  });
  const [loadingPlayerStats, setLoadingPlayerStats] = useState(true);
  const [errorPlayerStats, setErrorPlayerStats] = useState(null);

  // Fetch team stats (unchanged)
  useEffect(() => {
    const fetchTeamStats = async () => {
      try {
        setLoadingTeamStats(true);
        console.log("Fetching list of teams...");
        const teams = await teamsService.getTeams();
        console.log("Teams fetched:", teams);

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
        console.log("All Team Stats:", allStats);
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

  // Fetch player season stats for passing only, with cancellation
  useEffect(() => {
    const abortController = new AbortController();

    const fetchPlayerPassingStats = async () => {
      try {
        setLoadingPlayerStats(true);
        // If your teamsService.getPlayerSeasonStats is modified to accept a signal parameter, pass it here:
        const passingData = await teamsService.getPlayerSeasonStats(
          2024,
          "passing",
          "regular",
          100,
          abortController.signal
        );
        console.log("Raw passing data:", passingData);
        const aggregatedPassing = aggregatePlayerStats(passingData, "YDS");
        console.log("Aggregated passing stats:", aggregatedPassing);
        setPlayerStats({
          passing: aggregatedPassing,
          rushing: null,
          receiving: null,
          tackles: null,
          sacks: null,
          interceptions: null,
        });
      } catch (error) {
        if (!abortController.signal.aborted) {
          console.error("Error fetching player season passing stats:", error);
          setErrorPlayerStats("Failed to load player season stats.");
        }
      } finally {
        setLoadingPlayerStats(false);
      }
    };

    fetchPlayerPassingStats();

    // Clean up (cancel the request if the component unmounts)
    return () => abortController.abort();
  }, []);

  // Helper: Sort team stats by a given key (highest to lowest)
  const sortByTeamStat = (statKey) => {
    return [...allTeamStats]
      .filter(({ stats }) => stats && stats[statKey] !== undefined)
      .sort((a, b) => b.stats[statKey] - a.stats[statKey]);
  };

  // Render top 5 teams for a given stat (unchanged)
  const renderTeamLeaders = (statName) => {
    if (loadingTeamStats) return <p className="stat-placeholder">Loading...</p>;
    if (errorTeamStats) return <p className="stat-placeholder">{errorTeamStats}</p>;

    const sortedTeams = sortByTeamStat(statName).slice(0, 5);
    if (sortedTeams.length === 0)
      return <p className="stat-placeholder">No data available</p>;

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
  // For now, only passing is fetched; others display "Coming Soon"
  const renderPlayerLeaders = (category) => {
    if (loadingPlayerStats)
      return <p className="stat-placeholder">Loading...</p>;
    if (errorPlayerStats)
      return <p className="stat-placeholder">{errorPlayerStats}</p>;

    if (category !== "passing") {
      return <p className="stat-placeholder">Coming Soon</p>;
    }

    const players = playerStats[category] || [];
    if (players.length === 0)
      return <p className="stat-placeholder">No data available</p>;

    const topPlayers = players.slice(0, 5);
    return topPlayers.map((player, idx) => (
      <div key={`${player.playerName}-${idx}`} className="leader-row">
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

  // UI for the Player view: Only Passing stats are live; others show "Coming Soon"
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
            <p className="stat-placeholder">Coming Soon</p>
          </div>
          <div className="leaders-card">
            <h3>Receiving</h3>
            <p className="stat-placeholder">Coming Soon</p>
          </div>
        </div>
        <div className="leaders-column">
          <h2 className="leaders-header">Defensive Leaders</h2>
          <div className="leaders-card">
            <h3>Tackles</h3>
            <p className="stat-placeholder">Coming Soon</p>
          </div>
          <div className="leaders-card">
            <h3>Sacks</h3>
            <p className="stat-placeholder">Coming Soon</p>
          </div>
          <div className="leaders-card">
            <h3>Interceptions</h3>
            <p className="stat-placeholder">Coming Soon</p>
          </div>
        </div>
      </div>
    );
  };

  // UI for the Team view remains unchanged
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