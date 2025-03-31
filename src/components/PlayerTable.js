import React, { useState, useEffect } from "react";
import "../styles/PlayerTable.css"; // We'll create this CSS file next

const PlayerTable = ({ 
  playerGrades, 
  positionOptions, 
  teams, 
  handlePlayerSelect,
  positionFilter,
  handlePositionChange,
  teamId,
  handleTeamChange,
  year,
  handleYearChange
}) => {
  // Local state for search and filters
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredPlayers, setFilteredPlayers] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: "grade", direction: "desc" });

  // Apply filters and search whenever dependencies change
  useEffect(() => {
    if (!playerGrades) return;
    
    let result = [...playerGrades];
    
    // Apply search filter
    if (searchTerm.trim() !== "") {
      const search = searchTerm.toLowerCase().trim();
      result = result.filter(player => 
        player.fullName?.toLowerCase().includes(search) ||
        player.position?.toLowerCase().includes(search)
      );
    }
    
    // Sort results
    result.sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === "asc" ? -1 : 1;
      }
      if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === "asc" ? 1 : -1;
      }
      return 0;
    });
    
    setFilteredPlayers(result);
  }, [playerGrades, searchTerm, sortConfig]);

  // Handle sort click
  const handleSort = (key) => {
    let direction = "desc";
    if (sortConfig.key === key && sortConfig.direction === "desc") {
      direction = "asc";
    }
    setSortConfig({ key, direction });
  };

  // Helper to get grade color class
  const getGradeColorClass = (grade) => {
    if (grade >= 90) return "grade-a-plus";
    if (grade >= 85) return "grade-a";
    if (grade >= 80) return "grade-a-minus";
    if (grade >= 77) return "grade-b-plus";
    if (grade >= 73) return "grade-b";
    if (grade >= 70) return "grade-b-minus";
    if (grade >= 67) return "grade-c-plus";
    if (grade >= 63) return "grade-c";
    if (grade >= 60) return "grade-c-minus";
    if (grade >= 57) return "grade-d-plus";
    if (grade >= 53) return "grade-d";
    if (grade >= 50) return "grade-d-minus";
    return "grade-f";
  };

  // Helper to get letter grade
  const getLetterGrade = (grade) => {
    if (grade >= 90) return "A+";
    if (grade >= 85) return "A";
    if (grade >= 80) return "A-";
    if (grade >= 77) return "B+";
    if (grade >= 73) return "B";
    if (grade >= 70) return "B-";
    if (grade >= 67) return "C+";
    if (grade >= 63) return "C";
    if (grade >= 60) return "C-";
    if (grade >= 57) return "D+";
    if (grade >= 53) return "D";
    if (grade >= 50) return "D-";
    return "F";
  };

  // Group players by position for summary at the top
  const getPositionGroups = () => {
    const groups = {};
    playerGrades.forEach(player => {
      if (!groups[player.position]) {
        groups[player.position] = [];
      }
      groups[player.position].push(player);
    });
    
    return Object.entries(groups)
      .map(([position, players]) => ({
        position,
        count: players.length,
        avgGrade: players.reduce((sum, p) => sum + p.grade, 0) / players.length
      }))
      .sort((a, b) => b.avgGrade - a.avgGrade)
      .slice(0, 5); // Top 5 positions
  };

  const positionGroups = getPositionGroups();

  return (
    <div className="player-table-container">
      {/* Filters and search section */}
      <div className="player-filters">
        <div className="filter-group">
          <input
            type="text"
            className="search-input"
            placeholder="Search players..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="filter-group">
          <label>Position:</label>
          <select
            value={positionFilter}
            onChange={(e) => handlePositionChange(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Positions</option>
            {positionOptions.map(pos => (
              <option key={pos} value={pos}>{pos}</option>
            ))}
          </select>
        </div>
        
        <div className="filter-group">
          <label>Team:</label>
          <select
            value={teamId}
            onChange={(e) => handleTeamChange(e.target.value)}
            className="filter-select"
          >
            {teams.map(t => (
              <option key={t.id} value={t.id}>{t.school}</option>
            ))}
          </select>
        </div>
        
        <div className="filter-group">
          <label>Year:</label>
          <select
            value={year}
            onChange={(e) => handleYearChange(e.target.value)}
            className="filter-select"
          >
            <option value="2024">2024</option>
            <option value="2023">2023</option>
            <option value="2022">2022</option>
            <option value="2021">2021</option>
          </select>
        </div>
      </div>
      
      {/* Position summary cards */}
      <div className="position-summary">
        {positionGroups.map((group) => (
          <div 
            key={group.position} 
            className="position-card"
            onClick={() => handlePositionChange(group.position)}
          >
            <div className="position-name">{group.position}</div>
            <div className={`position-grade ${getGradeColorClass(group.avgGrade)}`}>
              {group.avgGrade.toFixed(1)}
            </div>
            <div className="position-count">{group.count} players</div>
          </div>
        ))}
      </div>
      
      {/* Player table */}
      <div className="player-grades-table">
        <table>
          <thead>
            <tr>
              <th onClick={() => handleSort("rank")}>RANK</th>
              <th onClick={() => handleSort("fullName")}>NAME</th>
              <th>TEAM</th>
              <th onClick={() => handleSort("position")}>POS</th>
              <th>YEAR</th>
              <th onClick={() => handleSort("grade")}>
                GRADE
                {sortConfig.key === "grade" && (
                  <span className="sort-indicator">
                    {sortConfig.direction === "asc" ? " ▲" : " ▼"}
                  </span>
                )}
              </th>
              <th>PASS</th>
              <th>RUN</th>
              <th>STATUS</th>
            </tr>
          </thead>
          <tbody>
            {filteredPlayers.length > 0 ? (
              filteredPlayers.map((player, index) => (
                <tr key={player.id || index} onClick={() => handlePlayerSelect(player)}>
                  <td>{index + 1}</td>
                  <td className="player-name">{player.fullName}</td>
                  <td>{player.team || "—"}</td>
                  <td>{player.position}</td>
                  <td>{player.year || "—"}</td>
                  <td className={`player-grade ${getGradeColorClass(player.grade)}`}>
                    {player.grade.toFixed(1)}
                  </td>
                  <td className={getGradeColorClass(player.grade - 2)}>
                    {(player.grade - 2).toFixed(1)}
                  </td>
                  <td className={getGradeColorClass(player.grade - 7)}>
                    {(player.grade - 7).toFixed(1)}
                  </td>
                  <td className="player-status">
                    {getLetterGrade(player.grade)}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="9" className="no-results">
                  No players found matching your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="table-info">
        <p>
          Showing {filteredPlayers.length} of {playerGrades.length} players
        </p>
        <p className="click-info">
          Click on any player to view detailed analytics
        </p>
      </div>
    </div>
  );
};

export default PlayerTable;