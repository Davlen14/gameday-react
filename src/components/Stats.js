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
            // Fetch stats for each team (must include both offense & defense)
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

  // Fetch player season stats for offensive categories and one defensive category
  useEffect(() => {
    const fetchPlayerStats = async () => {
      try {
        setLoadingPlayerStats(true);
        // For player stats, fetch offensive stats individually and defensive stats once.
        const categories = ["passing", "rushing", "receiving", "defensive"];
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
  // For "passing", "rushing", and "receiving", we use the respective arrays.
  // For defensive stats, we derive "tackles", "sacks", and "interceptions" from the "defensive" array.
  const renderPlayerStats = (category) => {
    if (loadingPlayerStats)
      return <p className="stat-placeholder">Loading...</p>;
    if (errorPlayerStats)
      return <p className="stat-placeholder">{errorPlayerStats}</p>;

    let players = [];
    if (["passing", "rushing", "receiving"].includes(category)) {
      players = playerStats[category] || [];
    } else if (category === "tackles") {
      players = playerStats["defensive"] || [];
      players = [...players].sort((a, b) => (b.totalTackles || 0) - (a.totalTackles || 0));
    } else if (category === "sacks") {
      players = playerStats["defensive"] || [];
      players = [...players].sort((a, b) => (b.sacks || 0) - (a.sacks || 0));
    } else if (category === "interceptions") {
      players = playerStats["defensive"] || [];
      players = [...players].sort((a, b) => (b.interceptions || 0) - (a.interceptions || 0));
    }

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
        <span className="player-stat">
          {(() => {
            // For offensive categories, use statValue.
            if (["passing", "rushing", "receiving"].includes(category)) {
              return player.statValue || 0;
            }
            // For defensive categories, choose based on requested category.
            if (category === "tackles") return player.totalTackles || 0;
            if (category === "sacks") return player.sacks || 0;
            if (category === "interceptions") return player.interceptions || 0;
            return 0;
          })()}
        </span>
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