import React, { useState, useEffect } from "react";
import teamsService from "../services/teamsService";
import "../styles/PlayerStatsChart.css";

const PlayerStatsChart = () => {
  // State for fetched player stats
  const [players, setPlayers] = useState([]);
  // State for all FBS teams (to match logos, colors, etc.)
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
        const teamsData = await teamsService.getTeams(); // Assuming this hits /teams/fbs
        setTeams(teamsData);

        // 2. Fetch offensive player stats
        const rawPlayers = await teamsService.getPlayerSeasonStats(
          2024,       // year
          "offense",  // category (assuming your API merges passing/rushing/receiving)
          "regular",  // seasonType
          10000       // limit
        );

        // Build a fullName field if missing
        const playersWithFullName = rawPlayers.map((p) => {
          // Use p.fullName if it exists; otherwise try p.name or combine firstName and lastName
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

  // Helper: find a team's info by name (using team.school)
  const getTeamByName = (teamName) => {
    if (!teamName) return null;
    return teams.find(
      (t) => t.school.toLowerCase() === teamName.toLowerCase()
    );
  };

  // Filter players based on search term, team, and position filters.
  const filteredPlayers = players.filter((player) => {
    const name = player.fullName ? player.fullName.toLowerCase() : "";
    const matchesSearch = name.includes(searchTerm.toLowerCase());

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
          {/* Build the team dropdown from the fetched teams */}
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
                // Get the team info for the player's team
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