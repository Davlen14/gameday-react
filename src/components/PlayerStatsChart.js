import React, { useState, useEffect } from "react";
import teamsService from "../services/teamsService";
import "../styles/PlayerStatsChart.css";

const PlayerStatsChart = () => {
  // State for fetched player stats
  const [players, setPlayers] = useState([]);
  // State for search term only
  const [searchTerm, setSearchTerm] = useState("");
  // Loading and error states
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch offensive player stats on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        // Fetch offensive player stats
        const rawPlayers = await teamsService.getPlayerSeasonStats(
          2024,       // year
          "offense",  // category (assuming your API merges passing/rushing/receiving)
          "regular",  // seasonType
          10000       // limit
        );

        // Build a fullName field if missing
        const playersWithFullName = rawPlayers.map((p) => {
          let fullName = p.fullName;
          if (!fullName) {
            if (p.name) {
              fullName = p.name;
            } else {
              fullName = `${p.firstName || ""} ${p.lastName || ""}`.trim();
            }
          }
          return {
            ...p,
            fullName,
          };
        });

        setPlayers(playersWithFullName);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter players based solely on the search term.
  const filteredPlayers = players.filter((player) => {
    const name = player.fullName ? player.fullName.toLowerCase() : "";
    return name.includes(searchTerm.toLowerCase());
  });

  if (isLoading) return <div>Loading offensive stats...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="player-stats-chart">
      <h2>Offensive Player Stats - 2024</h2>

      {/* Search Filter */}
      <div className="filters">
        <input
          type="text"
          placeholder="Search by player name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Results Table */}
      <div className="stats-table-container">
        <table className="stats-table">
          <thead>
            <tr>
              <th>Player Name</th>
            </tr>
          </thead>
          <tbody>
            {filteredPlayers.length ? (
              filteredPlayers.map((player) => (
                <tr key={player.id}>
                  <td>{player.fullName}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td>No matching players found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PlayerStatsChart;