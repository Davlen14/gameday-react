import React, { useState, useEffect, useMemo } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faSearch, faFilter, faSort, faSortUp, faSortDown, 
  faChevronLeft, faChevronRight, faShield, faFootballBall, 
  faUserFriends, faUniversity, faCalendarAlt
} from '@fortawesome/free-solid-svg-icons';
import "../styles/PlayerTable.css"; // Assuming you have a CSS file for styles

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
  handleYearChange,
  totalPages,
  currentPage,
  onPageChange,
  getLetterGrade,
  getGradeColorClass
}) => {
  // Local state for search and filters
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredPlayers, setFilteredPlayers] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: "grade", direction: "desc" });
  const [showFilters, setShowFilters] = useState(true);

  // Apply filters and search whenever dependencies change
  useEffect(() => {
    if (!playerGrades) return;
    
    let result = [...playerGrades];
    
    // Apply search filter
    if (searchTerm.trim() !== "") {
      const search = searchTerm.toLowerCase().trim();
      result = result.filter(player => 
        player.fullName?.toLowerCase().includes(search) ||
        player.position?.toLowerCase().includes(search) ||
        player.year?.toLowerCase().includes(search)
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

  // Get sort icon for column headers
  const getSortIcon = (columnKey) => {
    if (sortConfig.key !== columnKey) {
      return <FontAwesomeIcon icon={faSort} className="pt-sort-icon" />;
    }
    
    return sortConfig.direction === 'asc' 
      ? <FontAwesomeIcon icon={faSortUp} className="pt-sort-icon active" />
      : <FontAwesomeIcon icon={faSortDown} className="pt-sort-icon active" />;
  };

  // Position group categorization
  const positionCategories = useMemo(() => ({
    "QB": "Quarterback",
    "RB": "Running Back",
    "FB": "Fullback",
    "WR": "Wide Receiver",
    "TE": "Tight End",
    "OL": "Offensive Line",
    "OT": "Offensive Tackle",
    "OG": "Offensive Guard",
    "C": "Center",
    "DL": "Defensive Line",
    "DE": "Defensive End",
    "DT": "Defensive Tackle",
    "NT": "Nose Tackle",
    "EDGE": "Edge Rusher",
    "LB": "Linebacker",
    "ILB": "Inside Linebacker",
    "OLB": "Outside Linebacker",
    "MLB": "Middle Linebacker", 
    "DB": "Defensive Back",
    "CB": "Cornerback",
    "S": "Safety",
    "FS": "Free Safety",
    "SS": "Strong Safety",
    "K": "Kicker",
    "P": "Punter",
    "LS": "Long Snapper"
  }), []);

  // Get full position name for tooltip
  const getPositionFullName = (positionCode) => {
    return positionCategories[positionCode] || positionCode;
  };

  // Calculate stats for current view
  const tableStats = useMemo(() => {
    if (!filteredPlayers.length) return null;
    
    const totalGrade = filteredPlayers.reduce((sum, p) => sum + p.grade, 0);
    const avgGrade = totalGrade / filteredPlayers.length;
    
    const positions = {};
    filteredPlayers.forEach(player => {
      if (!positions[player.position]) positions[player.position] = 0;
      positions[player.position]++;
    });
    
    const topPosition = Object.entries(positions)
      .sort((a, b) => b[1] - a[1])[0];
    
    return {
      total: filteredPlayers.length,
      avgGrade: avgGrade.toFixed(1),
      avgLetterGrade: getLetterGrade(avgGrade),
      topPosition: topPosition ? topPosition[0] : 'N/A',
      topPositionCount: topPosition ? topPosition[1] : 0
    };
  }, [filteredPlayers, getLetterGrade]);

  // Generate pagination buttons
  const paginationControls = useMemo(() => {
    if (totalPages <= 1) return null;
    
    const pages = [];
    const maxVisible = 5; // Max number of page buttons to show
    
    // Always show first page
    pages.push(1);
    
    // Calculate range of pages to show
    let start = Math.max(2, currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages - 1, start + maxVisible - 3);
    
    // Adjust start if we're near the end
    if (end === totalPages - 1) {
      start = Math.max(2, end - (maxVisible - 3));
    }
    
    // Add ellipsis if needed
    if (start > 2) {
      pages.push('...');
    }
    
    // Add middle pages
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    
    // Add ellipsis if needed
    if (end < totalPages - 1) {
      pages.push('...');
    }
    
    // Always show last page if more than 1 page
    if (totalPages > 1) {
      pages.push(totalPages);
    }
    
    return (
      <div className="pt-pagination">
        <button 
          className="pt-page-btn"
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
        >
          <FontAwesomeIcon icon={faChevronLeft} />
        </button>
        
        {pages.map((page, index) => (
          <button 
            key={index}
            className={`pt-page-btn ${page === currentPage ? 'active' : ''} ${page === '...' ? 'ellipsis' : ''}`}
            onClick={() => page !== '...' && onPageChange(page)}
            disabled={page === '...'}
          >
            {page}
          </button>
        ))}
        
        <button 
          className="pt-page-btn"
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(currentPage + 1)}
        >
          <FontAwesomeIcon icon={faChevronRight} />
        </button>
      </div>
    );
  }, [currentPage, totalPages, onPageChange]);

  return (
    <div className="pt-container">
      {/* Search and Filter Controls */}
      <div className="pt-controls">
        <div className="pt-search-bar">
          <FontAwesomeIcon icon={faSearch} className="pt-search-icon" />
          <input
            type="text"
            className="pt-search-input"
            placeholder="Search players by name, position..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <button 
          className="pt-filter-toggle"
          onClick={() => setShowFilters(!showFilters)}
        >
          <FontAwesomeIcon icon={faFilter} />
          {showFilters ? 'Hide Filters' : 'Show Filters'}
        </button>
      </div>
      
      {/* Filters Section */}
      {showFilters && (
        <div className="pt-filters">
          <div className="pt-filter-group">
            <div className="pt-filter-icon">
              <FontAwesomeIcon icon={faShield} />
            </div>
            <label>Position:</label>
            <select
              value={positionFilter}
              onChange={(e) => handlePositionChange(e.target.value)}
              className="pt-filter-select"
            >
              <option value="all">All Positions</option>
              {positionOptions.map(pos => (
                <option key={pos} value={pos}>{pos} - {getPositionFullName(pos)}</option>
              ))}
            </select>
          </div>
          
          <div className="pt-filter-group">
            <div className="pt-filter-icon">
              <FontAwesomeIcon icon={faUniversity} />
            </div>
            <label>Team:</label>
            <select
              value={teamId}
              onChange={(e) => handleTeamChange(e.target.value)}
              className="pt-filter-select"
            >
              {teams.map(t => (
                <option key={t.id} value={t.id}>{t.school}</option>
              ))}
            </select>
          </div>
          
          <div className="pt-filter-group">
            <div className="pt-filter-icon">
              <FontAwesomeIcon icon={faCalendarAlt} />
            </div>
            <label>Year:</label>
            <select
              value={year}
              onChange={(e) => handleYearChange(e.target.value)}
              className="pt-filter-select"
            >
              <option value="2024">2024</option>
              <option value="2023">2023</option>
              <option value="2022">2022</option>
              <option value="2021">2021</option>
            </select>
          </div>
        </div>
      )}
      
      {/* Table Stats Summary */}
      {tableStats && (
        <div className="pt-table-stats">
          <div className="pt-stat-item">
            <span className="pt-stat-label">Players</span>
            <span className="pt-stat-value">{tableStats.total}</span>
          </div>
          <div className="pt-stat-item">
            <span className="pt-stat-label">Avg Grade</span>
            <span className={`pt-stat-value ${getGradeColorClass(parseFloat(tableStats.avgGrade))}`}>
              {tableStats.avgGrade} ({tableStats.avgLetterGrade})
            </span>
          </div>
          <div className="pt-stat-item">
            <span className="pt-stat-label">Most Common</span>
            <span className="pt-stat-value">
              {tableStats.topPosition} ({tableStats.topPositionCount})
            </span>
          </div>
        </div>
      )}
      
      {/* Player Table */}
      <div className="pt-table-wrapper">
        <table className="pt-table">
          <thead>
            <tr>
              <th onClick={() => handleSort("rank")} className="pt-rank-col">
                <span className="pt-th-content">
                  RANK {getSortIcon("rank")}
                </span>
              </th>
              <th onClick={() => handleSort("fullName")} className="pt-name-col">
                <span className="pt-th-content">
                  NAME {getSortIcon("fullName")}
                </span>
              </th>
              <th className="pt-team-col">
                <span className="pt-th-content">TEAM</span>
              </th>
              <th onClick={() => handleSort("position")} className="pt-pos-col">
                <span className="pt-th-content">
                  POS {getSortIcon("position")}
                </span>
              </th>
              <th onClick={() => handleSort("year")} className="pt-year-col">
                <span className="pt-th-content">
                  YEAR {getSortIcon("year")}
                </span>
              </th>
              <th onClick={() => handleSort("grade")} className="pt-grade-col">
                <span className="pt-th-content">
                  GRADE {getSortIcon("grade")}
                </span>
              </th>
              <th className="pt-offense-col">
                <span className="pt-th-content">OFF</span>
              </th>
              <th className="pt-defense-col">
                <span className="pt-th-content">DEF</span>
              </th>
              <th className="pt-status-col">
                <span className="pt-th-content">STATUS</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredPlayers.length > 0 ? (
              filteredPlayers.map((player, index) => (
                <tr 
                  key={player.id || index} 
                  onClick={() => handlePlayerSelect(player)}
                  className="pt-player-row"
                >
                  <td className="pt-rank-col">{index + 1}</td>
                  <td className="pt-name-col">
                    <div className="pt-player-name-cell">
                      <span className="pt-player-name">{player.fullName}</span>
                      <span className="pt-player-jersey">#{player.jersey || '--'}</span>
                    </div>
                  </td>
                  <td className="pt-team-col">{player.team || "—"}</td>
                  <td className="pt-pos-col">
                    <div className="pt-position-badge" title={getPositionFullName(player.position)}>
                      {player.position}
                    </div>
                  </td>
                  <td className="pt-year-col">{player.year || "—"}</td>
                  <td className="pt-grade-col">
                    <div className={`pt-grade-badge ${getGradeColorClass(player.grade)}`}>
                      {player.grade.toFixed(1)}
                    </div>
                  </td>
                  <td className="pt-offense-col">
                    <div className={`pt-small-grade ${getGradeColorClass(Math.max(0, player.grade - 3))}`}>
                      {Math.max(0, (player.grade - 3)).toFixed(1)}
                    </div>
                  </td>
                  <td className="pt-defense-col">
                    <div className={`pt-small-grade ${getGradeColorClass(Math.max(0, player.grade - 7))}`}>
                      {Math.max(0, (player.grade - 7)).toFixed(1)}
                    </div>
                  </td>
                  <td className="pt-status-col">
                    <div className="pt-letter-grade">
                      {getLetterGrade(player.grade)}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="9" className="pt-no-results">
                  <div className="pt-empty-state">
                    <FontAwesomeIcon icon={faFootballBall} size="2x" />
                    <p>No players found matching your filters.</p>
                    <button 
                      className="pt-reset-btn"
                      onClick={() => {
                        setSearchTerm("");
                        handlePositionChange("all");
                      }}
                    >
                      Reset Filters
                    </button>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {paginationControls}

      <div className="pt-table-footer">
        <p className="pt-result-count">
          Showing {filteredPlayers.length} of {playerGrades.length} players
        </p>
        <p className="pt-click-info">
          <FontAwesomeIcon icon={faUserFriends} /> Click on any player to view detailed analytics
        </p>
      </div>
    </div>
  );
};

export default PlayerTable;