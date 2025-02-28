import React, { useState, useEffect } from "react";
import teamsService from "../services/teamsService";
import "../styles/PlayerStatsChart.css";

const PlayerStatsChart = () => {
  // State for fetched player stats
  const [players, setPlayers] = useState([]);
  // State for all FBS teams (to match logos, etc.)
  const [teams, setTeams] = useState([]);

  // States for filters
  const [searchTerm, setSearchTerm] = useState("");
  const [teamFilter, setTeamFilter] = useState("All Teams");
  const [positionFilter, setPositionFilter] = useState("All Positions");

  // Loading and error states
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch teams & offensive player stats on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);

        // 1. Fetch all FBS teams for logos, colors, etc.
        const teamsData = await teamsService.getTeams(); // /teams/fbs
        setTeams(teamsData);

        // 2. Fetch offensive player stats
        const playerData = await teamsService.getPlayerSeasonStats(
          2024,       // year
          "offense",  // category (assuming your API merges passing/rushing/receiving)
          "regular",  // seasonType
          10000       // limit
        );
        setPlayers(playerData);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Helper: find a team's info by name
  const getTeamByName = (teamName) => {
    if (!teamName) return null;
    return teams.find(
      (t) => t.school.toLowerCase() === teamName.toLowerCase()
    );
  };

  // Filter players based on search term, team, and position
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
        <select
          value={teamFilter}
          onChange={(e) => setTeamFilter(e.target.value)}
        >
          <option value="All Teams">All Teams</option>
          {/* Build the team dropdown from the teams you fetched */}
          {teams.map((t) => (
            <option key={t.id} value={t.school}>
              {t.school}
            </option>
          ))}
        </select>
        <select
          value={positionFilter}
          onChange={(e) => setPositionFilter(e.target.value)}
        >
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
              <th>Logo</th>
              <th>Passing Yards</th>
              <th>Rushing Yards</th>
              <th>Receiving Yards</th>
              <th>Touchdowns</th>
            </tr>
          </thead>
          <tbody>
            {filteredPlayers.length ? (
              filteredPlayers.map((player) => {
                // Attempt to find the team object for this player's team
                const teamObj = getTeamByName(player.team);
                const logo = teamObj?.logos?.[0] || "/photos/default-team.png";

                return (
                  <tr key={player.id}>
                    <td>{player.fullName}</td>
                    <td>{player.team}</td>
                    <td>{player.position}</td>
                    <td>
                      <img
                        src={logo}
                        alt={player.team}
                        style={{ width: 30, height: 30, objectFit: "contain" }}
                      />
                    </td>
                    <td>{player.passingYards || 0}</td>
                    <td>{player.rushingYards || 0}</td>
                    <td>{player.receivingYards || 0}</td>
                    <td>{player.touchdowns || 0}</td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="8">No matching players found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PlayerStatsChart;