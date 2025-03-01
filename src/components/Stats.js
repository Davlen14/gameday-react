import React, { useState, useEffect } from "react";
import teamsService from "../services/teamsService";
import "../styles/Stats.css";

// Updated aggregatePlayerStats: filters raw data and maps over it
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

  // Fetch player season stats using Promise.allSettled so that one failure doesn't break all calls
  useEffect(() => {
    const fetchPlayerStats = async () => {
      try {
        setLoadingPlayerStats(true);
        // Define the categories to fetch: offensive and defensive
        const categories = ["passing", "rushing", "receiving", "defensive"];
        const results = await Promise.allSettled(
          categories.map((cat) => teamsService.getPlayerSeasonStats(2024, cat))
        );

        // Log raw responses for debugging
        results.forEach((result, idx) => {
          if (result.status === "fulfilled") {
            console.log(`Raw data for ${categories[idx]}:`, result.value);
          } else {
            console.error(`Failed to load ${categories[idx]} stats:`, result.reason);
          }
        });

        // Build an object mapping category to its data (or empty array on failure)
        const statsObj = {};
        categories.forEach((cat, index) => {
          statsObj[cat] = results[index].status === "fulfilled" ? results[index].value : [];
        });
        console.log("Combined stats object:", statsObj);

        // Aggregate offensive stats (filter by statType "YDS")
        const aggregatedPassing = aggregatePlayerStats(statsObj["passing"], "YDS");
        const aggregatedRushing = aggregatePlayerStats(statsObj["rushing"], "YDS");
        const aggregatedReceiving = aggregatePlayerStats(statsObj["receiving"], "YDS");

        // Aggregate defensive stats for specific measures:
        const aggregatedDefTackles = aggregatePlayerStats(statsObj["defensive"], "TOT"); // total tackles
        const aggregatedDefSacks = aggregatePlayerStats(statsObj["defensive"], "SACKS");
        const aggregatedDefInts = aggregatePlayerStats(statsObj["defensive"], "INT"); // interceptions

        setPlayerStats({
          passing: aggregatedPassing,
          rushing: aggregatedRushing,
          receiving: aggregatedReceiving,
          tackles: aggregatedDefTackles,
          sacks: aggregatedDefSacks,
          interceptions: aggregatedDefInts,
        });
        console.log("Final aggregated player stats:", {
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