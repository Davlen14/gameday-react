// PlayerStatsChart.jsx
import React, { useState, useEffect } from "react";
import teamsService from "../services/teamsService";
import "../styles/PlayerStatsChart.css"; // Renamed for clarity

const PlayerStatsChart = () => {
  // State for fetched player stats
  const [players, setPlayers] = useState([]);
  // States for filters
  const [searchTerm, setSearchTerm] = useState("");
  const [teamFilter, setTeamFilter] = useState("All Teams");
  const [positionFilter, setPositionFilter] = useState("All Positions");
  // Loading and error state
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch offensive player stats on mount
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoading(true);
        // Use the getPlayerSeasonStats function from your service
        const data = await teamsService.getPlayerSeasonStats(2024, "offense", "regular", 10000);
        setPlayers(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  // Filter players based on search term, team, and position filters
  const filteredPlayers = players.filter((player) => {
    const matchesSearch =
      player.fullName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTeam =
      teamFilter === "All Teams" ||
      (player.team && player.team.toLowerCase() === teamFilter.toLowerCase());
    const matchesPosition =
      positionFilter === "All Positions" ||
      (player.position && player.position.toLowerCase() === positionFilter.toLowerCase());

    return matchesSearch && matchesTeam && matchesPosition;
  });

  if (isLoading) return <div>Loading offensive stats...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="player-stats-chart">
      <h2>Offensive Player Stats - 2024</h2>

      {/* Filters */}
      <div className="filters">
        <input
          type="text"
          placeholder="Search by player name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <select value={teamFilter} onChange={(e) => setTeamFilter(e.target.value)}>
          <option value="All Teams">All Teams</option>
          <option value="Alabama">Alabama</option>
          <option value="Ohio State">Ohio State</option>
          <option value="Michigan">Michigan</option>
          {/* Add more teams as needed */}
        </select>
        <select value={positionFilter} onChange={(e) => setPositionFilter(e.target.value)}>
          <option value="All Positions">All Positions</option>
          <option value="QB">QB</option>
          <option value="RB">RB</option>
          <option value="WR">WR</option>
          <option value="TE">TE</option>
          {/* Add more positions as needed */}
        </select>
      </div>

      {/* Table */}
      <div className="stats-table-container">
        <table className="stats-table">
          <thead>
            <tr>
              <th>Player Name</th>
              <th>Team</th>
              <th>Position</th>
              <th>Passing Yards</th>
              <th>Rushing Yards</th>
              <th>Receiving Yards</th>
              <th>Touchdowns</th>
            </tr>
          </thead>
          <tbody>
            {filteredPlayers.length ? (
              filteredPlayers.map((player) => (
                <tr key={player.id}>
                  <td>{player.fullName}</td>
                  <td>{player.team}</td>
                  <td>{player.position}</td>
                  <td>{player.passingYards || 0}</td>
                  <td>{player.rushingYards || 0}</td>
                  <td>{player.receivingYards || 0}</td>
                  <td>{player.touchdowns || 0}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7">No matching players found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PlayerStatsChart;