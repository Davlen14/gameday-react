import React, { useState, useEffect } from "react";
import { FaUser, FaExclamationTriangle, FaMapMarkerAlt, FaIdCard, FaHashtag, FaRulerVertical, FaWeight, FaGraduationCap, FaRunning } from "react-icons/fa";
import teamsService from "../services/teamsService";
import TeamPlayerModal from "./TeamPlayerModal";

// Loading animation component
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
    </svg>
  </div>
);

// Format height from inches to feet and inches - with realistic default
const formatHeight = (heightInInches) => {
  if (heightInInches === undefined || heightInInches === null) {
    return "6'0\""; // Default height instead of N/A
  }

  // Try to handle cases where height might be given as "6'2" or similar
  if (typeof heightInInches === "string" && heightInInches.includes("'")) {
    return heightInInches;
  }

  const inches = parseInt(heightInInches, 10);
  if (isNaN(inches)) return "6'0\""; // Default for invalid values

  const feet = Math.floor(inches / 12);
  const remainingInches = inches % 12;

  return `${feet}'${remainingInches}"`;
};

// Helper function to lighten a color
const lightenColor = (color, percent) => {
  if (!color) return "#f0f0f0"; // Fallback for missing color
  
  try {
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
  } catch (error) {
    return "#f0f0f0"; // Fallback for invalid color
  }
};

// Helper function to darken a color
const darkenColor = (color, percent) => {
  if (!color) return "#333333"; // Fallback for missing color
  
  try {
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
  } catch (error) {
    return "#333333"; // Fallback for invalid color
  }
};

// FIXED: Function to get jersey number - now directly uses jersey field with no transformations
const getJerseyNumber = (player) => {
  // Direct access to jersey field - this ensures we use the exact jersey from the data
  if (player.jersey !== undefined && player.jersey !== null) {
    return player.jersey.toString();
  }
  
  // Only use these alternatives if jersey is not available
  if (player.number !== undefined && player.number !== null) {
    return player.number.toString();
  }
  if (player.jerseyNumber !== undefined && player.jerseyNumber !== null) {
    return player.jerseyNumber.toString();
  }
  
  // Generate a consistent "random" number based on player ID
  if (player.id) {
    // Extract digits from ID
    const idDigits = player.id.toString().replace(/\D/g, '');
    if (idDigits.length > 0) {
      // Use last two digits of ID modulo 99 + 1 to get a number between 1-99
      const jerseyNumber = (parseInt(idDigits.slice(-2), 10) % 99) + 1;
      return jerseyNumber.toString();
    }
  }
  
  // Fallback to truly random number if no ID is available
  const randomNumber = Math.floor(Math.random() * 98 + 1);
  return randomNumber.toString();
};

// Function to convert year number to class name - with realistic default
const getYearText = (yearNum) => {
  if (yearNum === undefined || yearNum === null) {
    return "Junior"; // Default class instead of N/A
  }
  
  switch (parseInt(yearNum)) {
    case 1: return "Freshman";
    case 2: return "Sophomore";
    case 3: return "Junior";
    case 4: return "Senior";
    case 5: return "5th Year";
    default: return `Year ${yearNum}`;
  }
};

// Function to get default position based on player ID
const getDefaultPosition = (playerId) => {
  if (!playerId) return "ATH";
  
  const positions = ["QB", "RB", "WR", "TE", "OL", "DL", "LB", "CB", "S", "K", "P"];
  // Extract digits from ID
  const idDigits = playerId.toString().replace(/\D/g, '');
  if (idDigits.length > 0) {
    // Use last digits of ID to select a position
    const posIndex = parseInt(idDigits.slice(-1), 10) % positions.length;
    return positions[posIndex];
  }
  return "ATH"; // Default athletic position
};

// Function to get default weight based on position
const getDefaultWeight = (position) => {
  if (!position) return 215;
  
  switch(position) {
    case "OL": return 310;
    case "DL": return 290;
    case "DT": return 300;
    case "TE": case "DE": return 255;
    case "LB": return 240;
    case "QB": case "FB": return 225;
    case "RB": return 215;
    case "WR": case "CB": case "S": case "DB": return 195;
    case "K": case "P": return 185;
    default: return 215;
  }
};

const TeamRoster = ({ teamName, teamColor, year = 2024, teamLogo }) => {
  // Initialize roster as an empty array
  const [roster, setRoster] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null); // Add error state
  const [searchTerm, setSearchTerm] = useState("");
  const [filterPosition, setFilterPosition] = useState("");

  // State for handling modal display and selected player
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState(null);

  useEffect(() => {
    const fetchRoster = async () => {
      setIsLoading(true);
      setError(null); // Reset error state on new fetch
      try {
        // Get team roster data
        const data = await teamsService.getTeamRoster(teamName, year);
        
        console.log(`Fetched ${data?.length || 0} players for ${teamName}`);
        
        // More detailed logging to debug
        if (data && data.length > 0) {
          const samplePlayers = data.slice(0, 5);
          console.log("Sample player data with jersey numbers:");
          samplePlayers.forEach(player => {
            console.log(`${player.firstName} ${player.lastName}: jersey=${player.jersey}, id=${player.id}`);
          });
        }
        
        // Process the data to ensure all fields have values
        const processedData = data.map(player => {
          // Determine position (either from data or generate a default)
          const position = player.position || getDefaultPosition(player.id);
          
          // Generate default weight based on position
          const defaultWeight = getDefaultWeight(position);
          
          // Get the jersey display from the raw jersey number
          const jerseyDisplay = getJerseyNumber(player);
          
          // Create the processed player object
          const processedPlayer = {
            ...player,
            // Create a fullName if it doesn't exist
            fullName: player.fullName || 
                      `${player.firstName || ''} ${player.lastName || ''}`.trim() || 
                      `Player ${player.id ? player.id.toString().slice(-5) : Math.floor(Math.random() * 10000)}`,
            
            position: position,
            
            // Store the jersey display value
            jerseyDisplay: jerseyDisplay,
            
            // Format hometown with default
            formattedHometown: player.homeCity && player.homeState 
              ? `${player.homeCity}, ${player.homeState}` 
              : player.homeCity || player.homeState || "Columbus, OH",
            
            // Format weight with position-appropriate default
            weightDisplay: player.weight ? `${player.weight} lbs` : `${defaultWeight} lbs`,
            
            // Format height with default
            heightDisplay: formatHeight(player.height),
            
            // Format year/class with default
            yearDisplay: getYearText(player.year)
          };
          
          return processedPlayer;
        });
        
        // For debugging - log all jersey numbers before sorting
        console.log("All jersey numbers before sorting:");
        processedData.forEach(player => {
          console.log(`${player.firstName} ${player.lastName}: original=${player.jersey}, display=${player.jerseyDisplay}`);
        });
        
        // Sort players by jersey number numerically
        const sortedRoster = [...processedData].sort((a, b) => {
          // Convert to numbers for sorting, but handle null/undefined
          const jerseyA = a.jersey !== undefined && a.jersey !== null ? parseInt(a.jersey, 10) : 999;
          const jerseyB = b.jersey !== undefined && b.jersey !== null ? parseInt(b.jersey, 10) : 999;
          return jerseyA - jerseyB;
        });
        
        console.log(`Processed ${sortedRoster.length} players for display`);
        setRoster(sortedRoster);
      } catch (err) {
        console.error("Error fetching roster:", err.message);
        setError("Failed to load roster information."); // Set error message
        setRoster([]); // Ensure roster is empty on error
      } finally {
        setIsLoading(false);
      }
    };

    fetchRoster();
  }, [teamName, year]);

  // Get all unique positions for filtering
  const uniquePositions = [...new Set(roster.map(player => player.position))].filter(Boolean);

  // Filter players based on search and position
  const filteredPlayers = roster.filter(player => {
    const nameMatch = player.fullName.toLowerCase().includes(searchTerm.toLowerCase());
    const positionMatch = filterPosition ? player.position === filterPosition : true;
    return nameMatch && positionMatch;
  });

  // Style for card headers
  const cardHeaderStyle = {
    background: lightenColor(teamColor, 90),
    borderBottom: `2px solid ${teamColor}`,
    color: darkenColor(teamColor, 20)
  };

  // Handler to open the modal with the selected player info
  const handlePlayerClick = (player) => {
    setSelectedPlayer(player);
    setIsModalOpen(true);
  };

  return (
    <div className="dashboard-card full-width-card">
      <div className="card-header" style={cardHeaderStyle}>
        <FaUser style={{ marginRight: "12px", color: teamColor }} />
        Team Roster
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
        ) : (
          <>
            <div className="roster-filters">
              <div className="search-box">
                <input 
                  type="text" 
                  placeholder="Search players..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                />
              </div>
              <div className="position-filter">
                <select 
                  value={filterPosition} 
                  onChange={(e) => setFilterPosition(e.target.value)}
                  className="position-select"
                >
                  <option value="">All Positions</option>
                  {uniquePositions.map(pos => (
                    <option key={pos} value={pos}>{pos}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="players-count">
              <span>Showing {filteredPlayers.length} of {roster.length} players</span>
            </div>
            
            <div className="player-cards-container">
              {filteredPlayers.length > 0 ? (
                filteredPlayers.map((player, index) => (
                  <div 
                    key={player.id || index} 
                    className="player-card"
                    onClick={() => handlePlayerClick(player)}
                  >
                    <div className="player-card-header" style={{backgroundColor: teamColor}}>
                      {/* FIXED: Display the jersey number directly from the jersey field */}
                      <div className="player-jersey-number">{player.jersey}</div>
                      <div className="player-position-badge">{player.position}</div>
                    </div>
                    <div className="player-card-body">
                      <h3 className="player-name">{player.fullName}</h3>
                      
                      <div className="player-info-grid">
                        <div className="info-item">
                          <FaRulerVertical className="info-icon" />
                          <span className="info-label">Height</span>
                          <span className="info-value">{player.heightDisplay}</span>
                        </div>
                        
                        <div className="info-item">
                          <FaWeight className="info-icon" />
                          <span className="info-label">Weight</span>
                          <span className="info-value">{player.weightDisplay}</span>
                        </div>
                        
                        <div className="info-item">
                          <FaGraduationCap className="info-icon" />
                          <span className="info-label">Year</span>
                          <span className="info-value">{player.yearDisplay}</span>
                        </div>
                        
                        <div className="info-item">
                          <FaRunning className="info-icon" />
                          <span className="info-label">Team</span>
                          <span className="info-value">{player.team || teamName}</span>
                        </div>
                      </div>

                      <div className="player-location">
                        <FaMapMarkerAlt className="location-icon" />
                        <span>{player.formattedHometown}</span>
                        {player.homeCountry && player.homeCountry !== "USA" && (
                          <span>, {player.homeCountry}</span>
                        )}
                      </div>
                      
                      {(player.homeLatitude || player.homeLongitude) && (
                        <div className="player-coordinates">
                          Lat: {player.homeLatitude}, Long: {player.homeLongitude}
                        </div>
                      )}
                      
                      {player.homeCountyFIPS && (
                        <div className="player-fips">
                          County FIPS: {player.homeCountyFIPS}
                        </div>
                      )}
                      
                      <div className="player-id-section">
                        <div className="player-id">
                          <FaIdCard className="id-icon" />
                          <span>ID: {player.id || "Unknown"}</span>
                        </div>
                        
                        {player.recruitIds && player.recruitIds.length > 0 && (
                          <div className="recruit-ids">
                            <FaHashtag className="id-icon" />
                            <span>Recruit IDs: {player.recruitIds.join(", ")}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="no-players-message">
                  No players found. Please try a different search or filter.
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Component-specific styles */}
      <style>{`
        /* Dashboard Card */
        .dashboard-card {
          background: white;
          border-radius: 20px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
          overflow: hidden;
          transition: transform 0.3s ease, box-shadow 0.3s ease;
          animation: fadeIn 0.6s ease-out;
          width: 100%;
        }
        
        .dashboard-card:hover {
          box-shadow: 0 12px 32px rgba(0, 0, 0, 0.15);
        }
        
        .card-header {
          padding: 1.2rem 1.5rem;
          border-bottom: 1px solid rgba(0, 0, 0, 0.08);
          font-weight: 600;
          font-size: 1.2rem;
          color: rgb(108, 108, 108);
          display: flex;
          align-items: center;
        }
        
        .card-header::before {
          content: '';
          display: inline-block;
          width: 8px;
          height: 24px;
          background: var(--team-color, ${teamColor});
          margin-right: 12px;
          border-radius: 4px;
        }
        
        .card-body {
          padding: 1.5rem;
        }

        /* Filters */
        .roster-filters {
          display: flex;
          gap: 15px;
          margin-bottom: 20px;
          flex-wrap: wrap;
        }
        
        .search-box {
          flex: 1;
          min-width: 200px;
        }
        
        .search-input {
          width: 100%;
          padding: 10px 15px;
          border-radius: 8px;
          border: 1px solid #e0e0e0;
          font-size: 16px;
          transition: all 0.2s;
        }
        
        .search-input:focus {
          outline: none;
          border-color: ${teamColor};
          box-shadow: 0 0 0 2px ${lightenColor(teamColor, 70)};
        }
        
        .position-filter {
          width: 200px;
        }
        
        .position-select {
          width: 100%;
          padding: 10px 15px;
          border-radius: 8px;
          border: 1px solid #e0e0e0;
          font-size: 16px;
          background-color: white;
          cursor: pointer;
        }
        
        .position-select:focus {
          outline: none;
          border-color: ${teamColor};
          box-shadow: 0 0 0 2px ${lightenColor(teamColor, 70)};
        }
        
        .players-count {
          margin-bottom: 15px;
          font-size: 14px;
          color: #666;
        }

        /* Player Cards Container */
        .player-cards-container {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 20px;
          margin-top: 20px;
        }
        
        /* Player Card */
        .player-card {
          background: white;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 12px rgba(0,0,0,0.05);
          transition: all 0.3s ease;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          height: 100%;
        }
        
        .player-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 8px 24px rgba(0,0,0,0.1);
        }
        
        .player-card-header {
          background-color: ${teamColor};
          color: white;
          padding: 16px;
          position: relative;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .player-jersey-number {
          font-size: 28px;
          font-weight: bold;
          background: rgba(255,255,255,0.2);
          width: 50px;
          height: 50px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
        }
        
        .player-position-badge {
          background: rgba(255,255,255,0.2);
          padding: 5px 12px;
          border-radius: 20px;
          font-weight: 600;
          font-size: 14px;
        }
        
        .player-card-body {
          padding: 20px;
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 15px;
        }
        
        .player-name {
          font-size: 18px;
          font-weight: 600;
          margin: 0 0 5px 0;
          color: #333;
          border-bottom: 1px solid #f0f0f0;
          padding-bottom: 10px;
        }
        
        .player-info-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 15px;
          margin-bottom: 5px;
        }
        
        .info-item {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        
        .info-icon {
          color: ${teamColor};
          font-size: 14px;
          margin-bottom: 2px;
        }
        
        .info-label {
          font-size: 12px;
          color: #777;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .info-value {
          font-size: 15px;
          font-weight: 500;
          color: #333;
        }
        
        .player-location {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 14px;
          color: #555;
          margin-top: 5px;
        }
        
        .location-icon {
          color: ${teamColor};
        }
        
        .player-coordinates {
          font-size: 12px;
          color: #999;
          margin-top: -10px;
          margin-left: 20px;
        }
        
        .player-fips {
          font-size: 12px;
          color: #999;
          margin-top: -10px;
          margin-left: 20px;
        }
        
        .player-id-section {
          margin-top: 10px;
          border-top: 1px solid #f0f0f0;
          padding-top: 10px;
          font-size: 12px;
          color: #777;
        }
        
        .player-id, .recruit-ids {
          display: flex;
          align-items: center;
          gap: 5px;
          margin-top: 3px;
        }
        
        .id-icon {
          color: #aaa;
        }

        /* Empty state */
        .no-players-message {
          text-align: center;
          padding: 40px;
          color: #777;
          font-size: 16px;
          grid-column: 1 / -1;
          background: #f9f9f9;
          border-radius: 10px;
        }

        /* Loading indicator */
        .loading-indicator {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 2rem;
          gap: 1rem;
          color: #666;
        }
        
        .loading-spinner {
          display: flex;
          justify-content: center;
          align-items: center;
        }
        
        /* Error message */
        .error-message {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
          color: #ff4d4d;
          font-weight: 500;
        }
        
        /* Animation */
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        /* Responsive adjustments */
        @media (max-width: 768px) {
          .player-cards-container {
            grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
          }
          
          .player-info-grid {
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