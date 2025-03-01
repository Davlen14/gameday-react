import React, { useState, useEffect } from "react";
import teamsService from "../services/teamsService";
import "../styles/Stats.css"; // Updated CSS file

// Helper to aggregate raw stat responses by player and desired statType
const aggregatePlayerStats = (data, desiredStatType) => {
  const map = {};
  data.forEach(item => {
    // Use playerId as the unique key
    const id = item.playerId;
    // Compare statType (case-insensitive)
    if (item.statType && item.statType.toUpperCase() === desiredStatType.toUpperCase()) {
      // Only record the first matching entry per player
      if (!map[id]) {
        map[id] = {
          playerName: item.player,
          statValue: parseFloat(item.stat),
          playerPhoto: item.playerPhoto || null,
        };
      }
    }
  });
  return Object.values(map);
};

const Stats = () => {
  // State for team stats
  const [allTeamStats, setAllTeamStats] = useState([]);
  const [loadingTeamStats, setLoadingTeamStats] = useState(true);
  const [errorTeamStats, setErrorTeamStats] = useState(null);

  // State for player season stats
  const [playerStats, setPlayerStats] = useState({});
  const [loadingPlayerStats, setLoadingPlayerStats] = useState(true);
  const [errorPlayerStats, setErrorPlayerStats] = useState(null);

  // Fetch team stats for all teams
  useEffect(() => {
    const fetchTeamStats = async () => {
      try {
        setLoadingTeamStats(true);
        console.log("Fetching list of teams...");
        const teams = await teamsService.getTeams(); // Fetch all FBS teams
        console.log("Teams fetched:", teams);

        const statsPromises = teams.map(async (team) => {
          try {
            // getTeamStats should return an object with keys:
            // netPassingYards, rushingYards, totalYards, yardsAllowed, pointsAllowed, sacks
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

  // Fetch player season stats for offensive and defensive categories separately
  useEffect(() => {
    const fetchPlayerStats = async () => {
      try {
        setLoadingPlayerStats(true);
        // Fetch offensive categories individually
        const passingData = await teamsService.getPlayerSeasonStats(2024, "passing");
        const rushingData = await teamsService.getPlayerSeasonStats(2024, "rushing");
        const receivingData = await teamsService.getPlayerSeasonStats(2024, "receiving");
        // Fetch defensive data once (which includes multiple stat types)
        const defensiveData = await teamsService.getPlayerSeasonStats(2024, "defensive");

        // Aggregate offensive stats:
        // For passing, we choose desired statType "YDS" (adjust if your API returns something else)
        const aggregatedPassing = aggregatePlayerStats(passingData, "YDS");
        // For rushing, use "YDS"
        const aggregatedRushing = aggregatePlayerStats(rushingData, "YDS");
        // For receiving, use "YDS"
        const aggregatedReceiving = aggregatePlayerStats(receivingData, "YDS");

        // Aggregate defensive stats for different measures:
        const aggregatedDefTackles = aggregatePlayerStats(defensiveData, "TOT"); // total tackles
        const aggregatedDefSacks = aggregatePlayerStats(defensiveData, "SACKS");
        const aggregatedDefInts = aggregatePlayerStats(defensiveData, "INT"); // interceptions

        setPlayerStats({
          passing: aggregatedPassing,
          rushing: aggregatedRushing,
          receiving: aggregatedReceiving,
          tackles: aggregatedDefTackles,
          sacks: aggregatedDefSacks,
          interceptions: aggregatedDefInts,
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

  // Render team stats for a given stat key
  const renderTeamStats = (statName) => {
    if (loadingTeamStats) return <p className="stat-placeholder">Loading...</p>;
    if (errorTeamStats) return <p className="stat-placeholder">{errorTeamStats}</p>;

    const sortedTeams = sortByTeamStat(statName).slice(0, 5);
    if (sortedTeams.length === 0)
      return <p className="stat-placeholder">No data available</p>;

    return sortedTeams.map(({ team, stats, logo }) => (
      <div key={team} className="team-row">
        <img src={logo} alt={team} className="team-logo" />
        <span className="team-name">{team}</span>
        <span className="team-stat">{stats[statName] || 0}</span>
      </div>
    ));
  };

  // Render player stats for a given category using aggregated data
  const renderPlayerStats = (category) => {
    if (loadingPlayerStats)
      return <p className="stat-placeholder">Loading...</p>;
    if (errorPlayerStats)
      return <p className="stat-placeholder">{errorPlayerStats}</p>;

    const players = playerStats[category] || [];
    if (players.length === 0)
      return <p className="stat-placeholder">No data available</p>;

    const topPlayers = players.slice(0, 5);
    return topPlayers.map((player) => (
      <div key={player.playerName} className="player-row">
        {player.playerPhoto && (
          <img
            src={player.playerPhoto}
            alt={player.playerName}
            className="player-photo"
          />
        )}
        <span className="player-name">{player.playerName}</span>
        <span className="player-stat">{player.statValue || 0}</span>
      </div>
    ));
  };

  return (
    <div className="stats-container">
      <h1 className="stats-header">College Football Stats (2024)</h1>

      {/* Team Offense Section */}
      <div className="stats-section">
        <h2 className="section-title">Team Offense</h2>
        <div className="stats-grid">
          <div className="stat-card">
            <h3 className="stat-title">Passing Yards</h3>
            {renderTeamStats("netPassingYards")}
          </div>
          <div className="stat-card">
            <h3 className="stat-title">Rushing Yards</h3>
            {renderTeamStats("rushingYards")}
          </div>
          <div className="stat-card">
            <h3 className="stat-title">Total Yards</h3>
            {renderTeamStats("totalYards")}
          </div>
        </div>
      </div>

      {/* Team Defense Section */}
      <div className="stats-section">
        <h2 className="section-title">Team Defense</h2>
        <div className="stats-grid">
          <div className="stat-card">
            <h3 className="stat-title">Yards Allowed</h3>
            {renderTeamStats("yardsAllowed")}
          </div>
          <div className="stat-card">
            <h3 className="stat-title">Points Allowed</h3>
            {renderTeamStats("pointsAllowed")}
          </div>
          <div className="stat-card">
            <h3 className="stat-title">Sacks</h3>
            {renderTeamStats("sacks")}
          </div>
        </div>
      </div>

      {/* Player Statistics Section */}
      <div className="stats-section">
        <h2 className="section-title">Player Statistics</h2>
        <div className="stats-grid">
          <div className="stat-card">
            <h3 className="stat-title">Passing</h3>
            {renderPlayerStats("passing")}
          </div>
          <div className="stat-card">
            <h3 className="stat-title">Rushing</h3>
            {renderPlayerStats("rushing")}
          </div>
          <div className="stat-card">
            <h3 className="stat-title">Receiving</h3>
            {renderPlayerStats("receiving")}
          </div>
          <div className="stat-card">
            <h3 className="stat-title">Tackles</h3>
            {renderPlayerStats("tackles")}
          </div>
          <div className="stat-card">
            <h3 className="stat-title">Sacks</h3>
            {renderPlayerStats("sacks")}
          </div>
          <div className="stat-card">
            <h3 className="stat-title">Interceptions</h3>
            {renderPlayerStats("interceptions")}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Stats;