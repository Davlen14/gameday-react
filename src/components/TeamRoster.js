import React, { useState, useEffect } from "react";
import { FaUser, FaExclamationTriangle, FaInfoCircle, FaMapPin, FaWeight, FaRulerVertical, FaFlag, FaListUl, FaTh, FaSort, FaSearch, FaFilter } from "react-icons/fa";
import teamsService from "../services/teamsService";
import TeamPlayerModal from "./TeamPlayerModal";

// Loading animation component with subtle pulsing effect
const LoadingSpinner = ({ color = "#9e9e9e" }) => (
  <div className="loading-spinner">
    <svg width="50" height="50" viewBox="0 0 50 50">
      <circle
        cx="25"
        cy="25"
        r="20"
        fill="none"
        stroke={color}
        strokeWidth="5"
        strokeDasharray="31.4 31.4"
        strokeLinecap="round"
      >
        <animateTransform
          attributeName="transform"
          type="rotate"
          from="0 25 25"
          to="360 25 25"
          dur="1s"
          repeatCount="indefinite"
        />
      </circle>
      <circle
        cx="25"
        cy="25"
        r="10"
        fill="none"
        stroke={color}
        strokeWidth="3"
        strokeDasharray="15.7 15.7"
        strokeOpacity="0.6"
        strokeLinecap="round"
      >
        <animateTransform
          attributeName="transform"
          type="rotate"
          from="360 25 25"
          to="0 25 25"
          dur="1.5s"
          repeatCount="indefinite"
        />
      </circle>
    </svg>
  </div>
);

// Format height from inches to feet and inches
const formatHeight = (heightInInches) => {
  if (!heightInInches) return "N/A";

  // Try to handle cases where height might be given as "6'2" or similar
  if (typeof heightInInches === "string" && heightInInches.includes("'")) {
    return heightInInches;
  }

  const inches = parseInt(heightInInches, 10);
  if (isNaN(inches)) return "N/A";

  const feet = Math.floor(inches / 12);
  const remainingInches = inches % 12;

  return `${feet}'${remainingInches}"`;
};

// Helper function to lighten a color
const lightenColor = (color, percent) => {
  if (!color || !color.startsWith('#')) return "#e0e0e0"; // Fallback color
  
  const num = parseInt(color.replace("#", ""), 16),
    amt = Math.round(2.55 * percent),
    R = (num >> 16) + amt,
    G = (num >> 8 & 0x00FF) + amt,
    B = (num & 0x0000FF) + amt;
  return (
    "#" +
    (0x1000000 +
      (R < 255 ? R : 255) * 0x10000 +
      (G < 255 ? G : 255) * 0x100 +
      (B < 255 ? B : 255)
    )
      .toString(16)
      .slice(1)
  );
};

// Helper function to darken a color
const darkenColor = (color, percent) => {
  if (!color || !color.startsWith('#')) return "#333333"; // Fallback color
  
  const num = parseInt(color.replace("#", ""), 16),
    amt = Math.round(2.55 * percent),
    R = (num >> 16) - amt,
    G = (num >> 8 & 0x00FF) - amt,
    B = (num & 0x0000FF) - amt;
  return (
    "#" +
    (0x1000000 +
      (R > 0 ? R : 0) * 0x10000 +
      (G > 0 ? G : 0) * 0x100 +
      (B > 0 ? B : 0)
    )
      .toString(16)
      .slice(1)
  );
};

// Helper to determine contrasting text color
const getContrastColor = (hexColor) => {
  if (!hexColor || !hexColor.startsWith('#')) return "#ffffff";
  
  // Convert hex to RGB
  const r = parseInt(hexColor.substr(1, 2), 16);
  const g = parseInt(hexColor.substr(3, 2), 16);
  const b = parseInt(hexColor.substr(5, 2), 16);
  
  // Calculate luminance - modern formula
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  // Return black or white depending on luminance
  return luminance > 0.5 ? '#000000' : '#ffffff';
};

// Calculate experience label from year
const getExperienceLabel = (year) => {
  if (!year) return "Unknown";
  
  switch (parseInt(year)) {
    case 1: return "Freshman";
    case 2: return "Sophomore";
    case 3: return "Junior";
    case 4: return "Senior";
    case 5: return "5th Year";
    default: return `Year ${year}`;
  }
};

const TeamRoster = ({ teamName, teamColor = "#0a4c92", year = 2024, teamLogo }) => {
  // Initialize roster as an empty array
  const [roster, setRoster] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: 'jersey', direction: 'ascending' });
  const [filterText, setFilterText] = useState('');
  const [positionFilter, setPositionFilter] = useState('All');

  // State for handling modal display and selected player
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [viewMode, setViewMode] = useState('cards'); // 'cards' or 'table'

  useEffect(() => {
    const fetchRoster = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await teamsService.getTeamRoster(teamName, year);
        
        // Enhance player data with computed values
        const enhancedData = data.map(player => ({
          ...player,
          fullName: `${player.firstName} ${player.lastName}`,
          experienceLabel: getExperienceLabel(player.year),
          heightFormatted: formatHeight(player.height),
          weightFormatted: player.weight ? `${player.weight} lbs` : 'N/A',
          homeTown: player.homeCity && player.homeState ? 
            `${player.homeCity}, ${player.homeState}` : 
            (player.homeCity || player.homeState || 'N/A')
        }));
        
        setRoster(enhancedData);
      } catch (err) {
        console.error("Error fetching roster:", err.message);
        setError("Failed to load roster information.");
        setRoster([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRoster();
  }, [teamName, year]);

  // Get unique positions for filter
  const positions = React.useMemo(() => {
    const posSet = new Set(roster.map(player => player.position).filter(Boolean));
    return ['All', ...Array.from(posSet).sort()];
  }, [roster]);

  // Sorting function
  const sortedRoster = React.useMemo(() => {
    let sortableRoster = [...roster];
    if (sortConfig.key) {
      sortableRoster.sort((a, b) => {
        // Handle numeric values
        if (['jersey', 'weight', 'height', 'year'].includes(sortConfig.key)) {
          return sortConfig.direction === 'ascending' 
            ? (Number(a[sortConfig.key] || 0) - Number(b[sortConfig.key] || 0))
            : (Number(b[sortConfig.key] || 0) - Number(a[sortConfig.key] || 0));
        }
        
        // Handle string values
        const aValue = a[sortConfig.key] || '';
        const bValue = b[sortConfig.key] || '';
        
        return sortConfig.direction === 'ascending'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      });
    }
    return sortableRoster;
  }, [roster, sortConfig]);

  // Filtered roster
  const filteredRoster = React.useMemo(() => {
    let filtered = sortedRoster;
    
    // Text filter
    if (filterText) {
      filtered = filtered.filter(player => 
        (player.firstName?.toLowerCase() || '').includes(filterText.toLowerCase()) ||
        (player.lastName?.toLowerCase() || '').includes(filterText.toLowerCase()) ||
        (player.position?.toLowerCase() || '').includes(filterText.toLowerCase()) ||
        (player.homeTown?.toLowerCase() || '').includes(filterText.toLowerCase())
      );
    }
    
    // Position filter
    if (positionFilter !== 'All') {
      filtered = filtered.filter(player => player.position === positionFilter);
    }
    
    return filtered;
  }, [sortedRoster, filterText, positionFilter]);

  // Function to request sort
  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  // Handler to open the modal with the selected player info
  const handlePlayerClick = (player) => {
    setSelectedPlayer(player);
    setIsModalOpen(true);
  };

  // Style for card headers
  const cardHeaderStyle = {
    background: lightenColor(teamColor, 90),
    borderBottom: `2px solid ${teamColor}`,
    color: darkenColor(teamColor, 20)
  };
  
  // Style for jersey number
  const jerseyStyle = (player) => ({
    backgroundColor: teamColor,
    color: getContrastColor(teamColor),
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold',
    fontSize: '1.1rem',
    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)'
  });

  // Position badge style
  const positionBadgeStyle = {
    display: 'inline-block',
    padding: '4px 10px',
    borderRadius: '20px',
    fontSize: '0.75rem',
    fontWeight: '600',
    backgroundColor: `${teamColor}20`,
    color: teamColor
  };

  return (
    <div className="dashboard-card full-width-card roster-component">
      <div className="card-header" style={cardHeaderStyle}>
        <FaUser style={{ marginRight: "12px", color: teamColor }} />
        Team Roster
        
        <div className="header-actions">
          <div className="search-container">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search players..."
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              className="search-input"
            />
          </div>
          
          <div className="filter-container">
            <FaFilter className="filter-icon" />
            <select 
              value={positionFilter} 
              onChange={(e) => setPositionFilter(e.target.value)}
              className="position-filter"
            >
              {positions.map(pos => (
                <option key={pos} value={pos}>{pos}</option>
              ))}
            </select>
          </div>
          
          <div className="view-toggle">
            <button 
              className={`view-button ${viewMode === 'cards' ? 'active' : ''}`}
              onClick={() => setViewMode('cards')}
            >
              <FaTh />
            </button>
            <button 
              className={`view-button ${viewMode === 'table' ? 'active' : ''}`}
              onClick={() => setViewMode('table')}
            >
              <FaListUl />
            </button>
          </div>
        </div>
      </div>
      
      <div className="card-body">
        {isLoading ? (
          <div className="loading-indicator">
            <LoadingSpinner color={teamColor} />
            <p>Loading roster...</p>
          </div>
        ) : error ? (
          <div className="error-message">
            <FaExclamationTriangle color="red" style={{ marginRight: "8px" }} />
            {error}
          </div>
        ) : filteredRoster.length === 0 ? (
          <div className="empty-state">
            <FaUser size={40} opacity={0.3} />
            <p>No players match your search criteria</p>
            {filterText || positionFilter !== 'All' ? (
              <button 
                onClick={() => {
                  setFilterText('');
                  setPositionFilter('All');
                }}
                className="reset-button"
              >
                Reset Filters
              </button>
            ) : null}
          </div>
        ) : viewMode === 'cards' ? (
          <div className="player-cards-grid">
            {filteredRoster.map((player) => (
              <div 
                key={player.id || `${player.firstName}-${player.lastName}-${player.jersey}`} 
                className="player-card"
                onClick={() => handlePlayerClick(player)}
              >
                <div className="player-card-header">
                  <div className="jersey-number" style={jerseyStyle(player)}>
                    {player.jersey || "?"}
                  </div>
                  <h3 className="player-name">{player.fullName}</h3>
                  <span className="position-badge" style={positionBadgeStyle}>
                    {player.position || "N/A"}
                  </span>
                </div>
                
                <div className="player-card-body">
                  <div className="player-stat">
                    <FaRulerVertical className="stat-icon" />
                    <span>{player.heightFormatted}</span>
                  </div>
                  
                  <div className="player-stat">
                    <FaWeight className="stat-icon" />
                    <span>{player.weightFormatted}</span>
                  </div>
                  
                  <div className="player-stat">
                    <FaUser className="stat-icon" />
                    <span>{player.experienceLabel}</span>
                  </div>
                  
                  <div className="player-stat">
                    <FaMapPin className="stat-icon" />
                    <span>{player.homeTown}</span>
                  </div>
                </div>
                
                <div className="player-card-footer" style={{ backgroundColor: `${teamColor}10` }}>
                  <span className="view-details">View Details</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="table-container">
            <table className="roster-table">
              <thead>
                <tr style={{ borderBottom: `2px solid ${teamColor}30` }}>
                  <th className="sortable" onClick={() => requestSort('jersey')}>
                    # {sortConfig.key === 'jersey' && (
                      <FaSort className={`sort-icon ${sortConfig.direction}`} />
                    )}
                  </th>
                  <th className="sortable" onClick={() => requestSort('lastName')}>
                    Name {sortConfig.key === 'lastName' && (
                      <FaSort className={`sort-icon ${sortConfig.direction}`} />
                    )}
                  </th>
                  <th className="sortable" onClick={() => requestSort('position')}>
                    Pos {sortConfig.key === 'position' && (
                      <FaSort className={`sort-icon ${sortConfig.direction}`} />
                    )}
                  </th>
                  <th className="sortable" onClick={() => requestSort('height')}>
                    Height {sortConfig.key === 'height' && (
                      <FaSort className={`sort-icon ${sortConfig.direction}`} />
                    )}
                  </th>
                  <th className="sortable" onClick={() => requestSort('weight')}>
                    Weight {sortConfig.key === 'weight' && (
                      <FaSort className={`sort-icon ${sortConfig.direction}`} />
                    )}
                  </th>
                  <th className="sortable" onClick={() => requestSort('year')}>
                    Year {sortConfig.key === 'year' && (
                      <FaSort className={`sort-icon ${sortConfig.direction}`} />
                    )}
                  </th>
                  <th>Hometown</th>
                </tr>
              </thead>
              <tbody>
                {filteredRoster.map((player) => (
                  <tr
                    key={player.id || `${player.firstName}-${player.lastName}-${player.jersey}`}
                    style={{ borderBottom: `1px solid ${teamColor}10`, cursor: "pointer" }}
                    onClick={() => handlePlayerClick(player)}
                  >
                    <td className="jersey-cell">
                      <div className="table-jersey" style={jerseyStyle(player)}>
                        {player.jersey || "?"}
                      </div>
                    </td>
                    <td>
                      <div className="player-name-cell">
                        {player.fullName || "N/A"}
                      </div>
                    </td>
                    <td>
                      <span className="position-tag" style={positionBadgeStyle}>
                        {player.position || "N/A"}
                      </span>
                    </td>
                    <td>{player.heightFormatted}</td>
                    <td>{player.weightFormatted}</td>
                    <td>{player.experienceLabel}</td>
                    <td>{player.homeTown}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Component-specific styles */}
      <style>{`
        /* Dashboard Card */
        .roster-component {
          background: white;
          border-radius: 16px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.06);
          overflow: hidden;
          transition: all 0.3s ease;
          width: 100%;
          animation: fadeIn 0.6s ease-out;
        }
        
        .card-header {
          padding: 1.25rem 1.5rem;
          font-weight: 600;
          font-size: 1.25rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        
        .header-actions {
          display: flex;
          gap: 12px;
          align-items: center;
        }
        
        .search-container {
          position: relative;
          width: 220px;
        }
        
        .search-icon {
          position: absolute;
          left: 10px;
          top: 50%;
          transform: translateY(-50%);
          color: #999;
          font-size: 0.9rem;
        }
        
        .search-input {
          width: 100%;
          padding: 8px 8px 8px 32px;
          border-radius: 20px;
          border: 1px solid #eaeaea;
          font-size: 0.9rem;
          transition: all 0.2s ease;
        }
        
        .search-input:focus {
          outline: none;
          border-color: ${teamColor};
          box-shadow: 0 0 0 3px ${teamColor}20;
        }
        
        .filter-container {
          position: relative;
          min-width: 140px;
        }
        
        .filter-icon {
          position: absolute;
          left: 10px;
          top: 50%;
          transform: translateY(-50%);
          color: #999;
          font-size: 0.9rem;
        }
        
        .position-filter {
          width: 100%;
          padding: 8px 8px 8px 32px;
          border-radius: 20px;
          border: 1px solid #eaeaea;
          font-size: 0.9rem;
          appearance: none;
          background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23999' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
          background-repeat: no-repeat;
          background-position: right 10px center;
          background-size: 0.8em;
          cursor: pointer;
        }
        
        .position-filter:focus {
          outline: none;
          border-color: ${teamColor};
          box-shadow: 0 0 0 3px ${teamColor}20;
        }
        
        .view-toggle {
          display: flex;
          border-radius: 20px;
          overflow: hidden;
          border: 1px solid #eaeaea;
          height: 36px;
        }
        
        .view-button {
          padding: 0 12px;
          background: transparent;
          border: none;
          cursor: pointer;
          color: #999;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.9rem;
          transition: all 0.2s ease;
        }
        
        .view-button.active {
          background-color: ${teamColor};
          color: white;
        }
        
        .view-button:hover:not(.active) {
          background-color: #f5f5f5;
        }
        
        .card-body {
          padding: 1.5rem;
        }
        
        /* Player Cards Grid */
        .player-cards-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 16px;
          width: 100%;
        }
        
        .player-card {
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
          overflow: hidden;
          transition: all 0.2s ease;
          cursor: pointer;
          height: 100%;
          display: flex;
          flex-direction: column;
        }
        
        .player-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 30px rgba(0, 0, 0, 0.1);
        }
        
        .player-card-header {
          padding: 16px;
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 10px;
          border-bottom: 1px solid #f0f0f0;
        }
        
        .jersey-number {
          min-width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: 1.2rem;
        }
        
        .player-name {
          margin: 0;
          font-size: 1.1rem;
          font-weight: 600;
          flex: 1;
        }
        
        .position-badge {
          padding: 3px 10px;
          border-radius: 20px;
          font-size: 0.8rem;
          font-weight: 600;
        }
        
        .player-card-body {
          padding: 16px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          flex: 1;
        }
        
        .player-stat {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.9rem;
        }
        
        .stat-icon {
          color: #777;
          opacity: 0.8;
        }
        
        .player-card-footer {
          padding: 10px;
          text-align: center;
          font-size: 0.85rem;
          font-weight: 500;
          border-top: 1px solid #f0f0f0;
        }
        
        .view-details {
          display: inline-block;
          padding: 4px 0;
          transition: all 0.2s ease;
          position: relative;
        }
        
        .view-details:after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 50%;
          width: 0;
          height: 2px;
          background: ${teamColor};
          transition: all 0.2s ease;
          transform: translateX(-50%);
        }
        
        .player-card:hover .view-details:after {
          width: 100%;
        }
        
        /* Table View */
        .table-container {
          overflow-x: auto;
          border-radius: 12px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03);
        }
        
        .roster-table {
          width: 100%;
          border-collapse: separate;
          border-spacing: 0;
        }
        
        .roster-table th {
          padding: 12px 16px;
          text-align: left;
          font-size: 0.8rem;
          font-weight: 600;
          color: #555;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          white-space: nowrap;
        }
        
        .sortable {
          cursor: pointer;
          user-select: none;
          position: relative;
          padding-right: 24px !important;
        }
        
        .sort-icon {
          position: absolute;
          right: 8px;
          top: 50%;
          transform: translateY(-50%);
          font-size: 0.7rem;
          opacity: 0.7;
        }
        
        .sort-icon.descending {
          transform: translateY(-50%) rotate(180deg);
        }
        
        .roster-table td {
          padding: 12px 16px;
          font-size: 0.95rem;
          vertical-align: middle;
        }
        
        .roster-table tbody tr {
          transition: all 0.2s ease;
        }
        
        .roster-table tbody tr:hover {
          background-color: ${teamColor}05;
        }
        
        .jersey-cell {
          width: 60px;
        }
        
        .table-jersey {
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: 1rem;
          margin: 0 auto;
        }
        
        .player-name-cell {
          font-weight: 500;
        }
        
        .position-tag {
          font-size: 0.75rem;
          white-space: nowrap;
        }
        
        /* Loading indicator */
        .loading-indicator {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 3rem 2rem;
          gap: 1rem;
          color: #666;
        }
        
        /* Error and Empty states */
        .error-message, .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 3rem 2rem;
          text-align: center;
          gap: 1rem;
        }
        
        .error-message {
          color: #e53935;
        }
        
        .empty-state {
          color: #999;
        }
        
        .reset-button {
          margin-top: 10px;
          padding: 8px 16px;
          background-color: ${teamColor};
          color: white;
          border: none;
          border-radius: 20px;
          cursor: pointer;
          font-size: 0.85rem;
          font-weight: 500;
          transition: all 0.2s ease;
        }
        
        .reset-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px ${teamColor}40;
        }
        
        /* Animation */
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        /* Responsive adjustments */
        @media (max-width: 900px) {
          .header-actions {
            flex-wrap: wrap;
          }
          
          .search-container {
            width: 100%;
            order: 3;
            margin-top: 10px;
          }
          
          .card-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 12px;
          }
          
          .header-actions {
            width: 100%;
          }
        }
        
        @media (max-width: 600px) {
          .player-cards-grid {
            grid-template-columns: 1fr;
          }
          
          .player-card-body {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      {/* Integrate the TeamPlayerModal component */}
      <TeamPlayerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        player={selectedPlayer}
        teamColor={teamColor}
        teamName={teamName}
        teamLogo={teamLogo}
      />
    </div>
  );
};

export default TeamRoster;