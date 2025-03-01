import React, { useState, useEffect } from "react";
import teamsService from "../services/teamsService";
import "../styles/Stats.css"; // Updated CSS file

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
            // Fetch stats for each team.
            // It is assumed that getTeamStats now returns an object with the following keys:
            // net_pass_yds, rush_yds, total_yds, opponentTotalYards, opponentPoints, sacks
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

  // Fetch player season stats for multiple categories
  useEffect(() => {
    const fetchPlayerStats = async () => {
      try {
        setLoadingPlayerStats(true);
        // Define the categories to fetch. Adjust these based on the API’s valid category names.
        const categories = [
          "passing",
          "rushing",
          "receiving",
          "tackles",
          "sacks",
          "interceptions",
        ];
        // Fetch stats for each category in parallel
        const statsResults = await Promise.all(
          categories.map((category) =>
            teamsService.getPlayerSeasonStats(2024, category)
          )
        );
        const statsObj = {};
        categories.forEach((cat, index) => {
          statsObj[cat] = statsResults[index];
        });
        setPlayerStats(statsObj);
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

  // Render player stats for a given category
  const renderPlayerStats = (category) => {
    if (loadingPlayerStats)
      return <p className="stat-placeholder">Loading...</p>;
    if (errorPlayerStats)
      return <p className="stat-placeholder">{errorPlayerStats}</p>;

    const players = playerStats[category] || [];
    if (players.length === 0)
      return <p className="stat-placeholder">No data available</p>;

    // Assume each player object includes: playerName, team, statValue, and optionally playerPhoto
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
            {renderTeamStats("net_pass_yds")}
          </div>
          <div className="stat-card">
            <h3 className="stat-title">Rushing Yards</h3>
            {renderTeamStats("rush_yds")}
          </div>
          <div className="stat-card">
            <h3 className="stat-title">Total Yards</h3>
            {renderTeamStats("total_yds")}
          </div>
        </div>
      </div>

      {/* Team Defense Section */}
      <div className="stats-section">
        <h2 className="section-title">Team Defense</h2>
        <div className="stats-grid">
          <div className="stat-card">
            <h3 className="stat-title">Yards Allowed</h3>
            {renderTeamStats("opponentTotalYards")}
          </div>
          <div className="stat-card">
            <h3 className="stat-title">Points Allowed</h3>
            {renderTeamStats("opponentPoints")}
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