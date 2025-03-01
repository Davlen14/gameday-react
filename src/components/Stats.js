import React, { useState, useEffect } from "react";
import teamsService from "../services/teamsService";
import "../styles/Stats.css"; // Updated CSS file

const Stats = () => {
  const [allTeamStats, setAllTeamStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAllStats = async () => {
      try {
        setLoading(true);

        console.log("Fetching list of teams...");
        const teams = await teamsService.getTeams(); // Fetch all FBS teams

        console.log("Teams fetched:", teams);

        const statsPromises = teams.map(async (team) => {
          try {
            const stats = await teamsService.getTeamStats(team.school, 2024);
            return { team: team.school, stats, logo: team.logos[0] }; // Include team logo
          } catch (err) {
            console.error(`Error fetching stats for ${team.school}:`, err);
            return { team: team.school, stats: null, logo: team.logos[0] };
          }
        });

        const allStats = await Promise.all(statsPromises);

        console.log("All Team Stats:", allStats);
        setAllTeamStats(allStats);
      } catch (error) {
        console.error("Error fetching team stats:", error);
        setError("Failed to load team stats.");
      } finally {
        setLoading(false);
      }
    };

    fetchAllStats();
  }, []);

  // Helper function to sort teams by stat value (highest to lowest)
  const sortByStat = (statKey) => {
    return [...allTeamStats]
      .filter(({ stats }) => stats && stats[statKey] !== undefined)
      .sort((a, b) => b.stats[statKey] - a.stats[statKey]);
  };

  // Render team stats (top 5 teams only for display)
  const renderTeamStats = (statName) => {
    if (loading) return <p className="stat-placeholder">Loading...</p>;
    if (error) return <p className="stat-placeholder">{error}</p>;

    const sortedTeams = sortByStat(statName).slice(0, 5);

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
            <p className="stat-placeholder">Coming Soon</p>
          </div>
          <div className="stat-card">
            <h3 className="stat-title">Points Allowed</h3>
            <p className="stat-placeholder">Coming Soon</p>
          </div>
          <div className="stat-card">
            <h3 className="stat-title">Sacks</h3>
            <p className="stat-placeholder">Coming Soon</p>
          </div>
        </div>
      </div>

      {/* Player Statistics Section */}
      <div className="stats-section">
        <h2 className="section-title">Player Statistics</h2>
        <div className="stats-grid">
          <div className="stat-card">
            <h3 className="stat-title">Passing Yards</h3>
            <p className="stat-placeholder">Coming Soon</p>
          </div>
          <div className="stat-card">
            <h3 className="stat-title">Rushing Yards</h3>
            <p className="stat-placeholder">Coming Soon</p>
          </div>
          <div className="stat-card">
            <h3 className="stat-title">Receiving Yards</h3>
            <p className="stat-placeholder">Coming Soon</p>
          </div>
          <div className="stat-card">
            <h3 className="stat-title">Tackles</h3>
            <p className="stat-placeholder">Coming Soon</p>
          </div>
          <div className="stat-card">
            <h3 className="stat-title">Sacks</h3>
            <p className="stat-placeholder">Coming Soon</p>
          </div>
          <div className="stat-card">
            <h3 className="stat-title">Interceptions</h3>
            <p className="stat-placeholder">Coming Soon</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Stats;