import React, { useState, useEffect } from "react";
import teamsService from "../services/teamsService";
import "../styles/Stats.css";

/**
 * Modified aggregatePlayerStats:
 * - Groups the raw data by playerId, and picks the object where statType exactly equals the desired value (e.g. "YDS").
 * - Returns an array of objects containing the player's name, team, conference, and the parsed statValue.
 */
const aggregatePlayerStats = (data, desiredStatType) => {
  const rawData = Array.isArray(data) ? data : data?.data || [];
  console.log(`aggregatePlayerStats - raw data for ${desiredStatType}:`, rawData);

  // Group by playerId and select only the record with statType equal to desiredStatType
  const playerMap = {};
  rawData.forEach(item => {
    if (
      item.statType &&
      item.statType.trim().toUpperCase() === desiredStatType.toUpperCase()
    ) {
      // Use playerId as key (ensure each player appears only once)
      playerMap[item.playerId] = {
        playerName: item.player,
        team: item.team,
        conference: item.conference,
        statValue: parseFloat(item.stat)
      };
    }
  });

  const aggregated = Object.values(playerMap);
  console.log(`aggregatePlayerStats - aggregated for ${desiredStatType}:`, aggregated);
  return aggregated;
};

const Stats = () => {
  // Toggle view mode (player or team)
  const [viewMode, setViewMode] = useState("player");

  // State for team stats (unchanged)
  const [allTeamStats, setAllTeamStats] = useState([]);
  const [loadingTeamStats, setLoadingTeamStats] = useState(true);
  const [errorTeamStats, setErrorTeamStats] = useState(null);

  // State for player season stats (for now, only passing stats)
  const [playerStats, setPlayerStats] = useState({
    passing: []
  });
  const [loadingPlayerStats, setLoadingPlayerStats] = useState(true);
  const [errorPlayerStats, setErrorPlayerStats] = useState(null);

  // ------------------------
  // Fetch team stats (unchanged)
  // ------------------------
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

  // ------------------------
  // Fetch player season stats for passing only
  // ------------------------
  useEffect(() => {
    const fetchPlayerPassingStats = async () => {
      try {
        setLoadingPlayerStats(true);
        // Request the top 100 records for passing stats
        const passingData = await teamsService.getPlayerSeasonStats(2024, "passing", "regular", 100);
        console.log("Raw passing data:", passingData);
        // Aggregate only the "YDS" statType for each player
        const aggregatedPassing = aggregatePlayerStats(passingData, "YDS");
        // Sort in descending order by passing yards
        aggregatedPassing.sort((a, b) => b.statValue - a.statValue);
        // Take the top 100 players
        const top100 = aggregatedPassing.slice(0, 100);
        console.log("Top 100 passing stats:", top100);
        setPlayerStats({ passing: top100 });
      } catch (error) {
        console.error("Error fetching player season passing stats:", error);
        setErrorPlayerStats("Failed to load player season stats.");
      } finally {
        setLoadingPlayerStats(false);
      }
    };
    fetchPlayerPassingStats();
  }, []);

  // ------------------------
  // Helper: Render player leaders as a table
  // ------------------------
  const renderPlayerTable = () => {
    if (loadingPlayerStats) return <p className="stat-placeholder">Loading...</p>;
    if (errorPlayerStats) return <p className="stat-placeholder">{errorPlayerStats}</p>;

    const players = playerStats.passing;
    if (!players.length) return <p className="stat-placeholder">No data available</p>;

    return (
      <table className="player-stats-table">
        <thead>
          <tr>
            <th>Rank</th>
            <th>Player</th>
            <th>Team</th>
            <th>Conference</th>
            <th>Passing Yards</th>
          </tr>
        </thead>
        <tbody>
          {players.map((player, idx) => (
            <tr key={player.playerName + idx}>
              <td>{idx + 1}</td>
              <td>{player.playerName}</td>
              <td>{player.team}</td>
              <td>{player.conference}</td>
              <td>{player.statValue}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  // ------------------------
  // For team stats, we keep your existing UI (unchanged)
  // ------------------------
  const sortByTeamStat = (statKey) => {
    return [...allTeamStats]
      .filter(({ stats }) => stats && stats[statKey] !== undefined)
      .sort((a, b) => b.stats[statKey] - a.stats[statKey]);
  };

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

  // ------------------------
  // UI Render functions
  // ------------------------
  const renderPlayerView = () => {
    return (
      <div className="leaders-wrapper">
        <h2 className="leaders-header">Top 100 Passing Leaders</h2>
        {renderPlayerTable()}
      </div>
    );
  };

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