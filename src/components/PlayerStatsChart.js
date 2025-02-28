import React, { useState, useEffect } from "react";
import teamsService from "../services/teamsService";
import "../styles/PlayerStatsChart.css";

const PlayerStatsChart = () => {
  const [players, setPlayers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Whenever searchTerm changes, call /player/search?searchTerm=...
  useEffect(() => {
    const fetchPlayersBySearch = async () => {
      try {
        // If no search term, clear the list and skip fetch
        if (!searchTerm) {
          setPlayers([]);
          return;
        }

        setIsLoading(true);
        setError(null);

        // Call the service to search players by name
        const results = await teamsService.getPlayerSearch(searchTerm);

        // Build a fullName if needed
        const withFullName = results.map((p) => {
          let fullName = p.fullName;
          if (!fullName) {
            if (p.name) {
              fullName = p.name;
            } else {
              fullName = `${p.firstName || ""} ${p.lastName || ""}`.trim();
            }
          }
          return { ...p, fullName };
        });

        setPlayers(withFullName);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlayersBySearch();
  }, [searchTerm]);

  if (isLoading) return <div>Loading players...</div>;
  if (error) return <div style={{ color: "red" }}>Error: {error}</div>;

  return (
    <div className="player-stats-chart">
      <h2>Search Players by Name</h2>

      <div className="filters">
        <input
          type="text"
          placeholder="Type a player's name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="stats-table-container">
        <table className="stats-table">
          <thead>
            <tr>
              <th>Player Name</th>
              <th>Team</th>
              <th>Position</th>
            </tr>
          </thead>
          <tbody>
            {players.length ? (
              players.map((player) => (
                <tr key={player.id}>
                  <td>{player.fullName}</td>
                  <td>{player.team}</td>
                  <td>{player.position}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="3">No matching players found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PlayerStatsChart;