import React, { useState, useEffect } from "react";
import { FaUser, FaExclamationTriangle, FaMapMarkerAlt, FaIdCard, FaHashtag, FaRulerVertical, FaWeight, FaGraduationCap, FaRunning } from "react-icons/fa";
import teamsService from "../services/teamsService";
import TeamPlayerModal from "./TeamPlayerModal";

// Loading animation component
const LoadingSpinner = ({ color = "#9e9e9e" }) => (
  <div className="tr-loading-spinner">
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

// Format height from inches to feet and inches
const formatHeight = (heightInInches) => {
  if (heightInInches === undefined || heightInInches === null) return "N/A";

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

// Function to safely get jersey number (handles 0 as valid)
const getJerseyNumber = (player) => {
  // FIXED: Added additional checks for more possible jersey number fields
  // Also directly access the property without method syntax
  if (player.jerseyDisplay !== undefined && player.jerseyDisplay !== null) {
    return player.jerseyDisplay.toString();
  }
  if (player.jersey !== undefined && player.jersey !== null) {
    return player.jersey.toString();
  }
  if (player.number !== undefined && player.number !== null) {
    return player.number.toString();
  }
  if (player.jerseyNumber !== undefined && player.jerseyNumber !== null) {
    return player.jerseyNumber.toString();
  }
  // Add more possible field names for jersey number
  if (player.uniform !== undefined && player.uniform !== null) {
    return player.uniform.toString();
  }
  if (player.jerseyNum !== undefined && player.jerseyNum !== null) {
    return player.jerseyNum.toString();
  }
  if (player.uniformNumber !== undefined && player.uniformNumber !== null) {
    return player.uniformNumber.toString();
  }
  
  // Check if there's a statType field with value "jersey" or similar
  if (player.statType === "jersey" && player.stat) {
    return player.stat.toString();
  }
  
  // Log the player object to debug
  console.log("Player with missing jersey number:", player);
  
  return "N/A";
};

// Function to convert year number to class name
const getYearText = (yearNum) => {
  if (yearNum === undefined || yearNum === null) return "N/A";
  
  switch (parseInt(yearNum)) {
    case 1: return "Freshman";
    case 2: return "Sophomore";
    case 3: return "Junior";
    case 4: return "Senior";
    case 5: return "5th Year";
    default: return `Year ${yearNum}`;
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
        const data = await teamsService.getTeamRoster(teamName, year);
        
        // Log the first player to help debug field names
        if (data && data.length > 0) {
          console.log("Sample player data:", data[0]);
        }
        
        // Process the data to ensure jersey numbers are properly handled
        const processedData = data.map(player => {
          // FIXED: Log each player to help debug jersey number issues
          console.log("Processing player:", player);
          
          return {
            ...player,
            // Create a fullName if it doesn't exist
            fullName: player.fullName || `${player.firstName || ''} ${player.lastName || ''}`.trim(),
            // Properly format the jersey number (handle 0 as valid)
            jerseyDisplay: getJerseyNumber(player),
            // Format hometown
            formattedHometown: player.homeCity && player.homeState 
              ? `${player.homeCity}, ${player.homeState}` 
              : player.homeCity || player.homeState || "N/A",
            // Format weight
            weightDisplay: player.weight ? `${player.weight} lbs` : "N/A",
            // Format height
            heightDisplay: formatHeight(player.height),
            // Format year/class
            yearDisplay: getYearText(player.year)
          };
        });
        
        setRoster(processedData);
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
    <div className="tr-dashboard-card tr-full-width-card">
      <div className="tr-card-header" style={cardHeaderStyle}>
        <FaUser style={{ marginRight: "12px", color: teamColor }} />
        Team Roster
      </div>
      <div className="tr-card-body">
        {isLoading ? (
          <div className="tr-loading-indicator">
            <LoadingSpinner color={teamColor} />
            <p>Loading roster...</p>
          </div>
        ) : error ? (
          <div className="tr-error-message">
            <FaExclamationTriangle color="red" style={{ marginRight: "8px" }} />
            {error}
          </div>
        ) : (
          <>
            <div className="tr-roster-filters">
              <div className="tr-search-box">
                <input 
                  type="text" 
                  placeholder="Search players..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="tr-search-input"
                />
              </div>
              <div className="tr-position-filter">
                <select 
                  value={filterPosition} 
                  onChange={(e) => setFilterPosition(e.target.value)}
                  className="tr-position-select"
                >
                  <option value="">All Positions</option>
                  {uniquePositions.map(pos => (
                    <option key={pos} value={pos}>{pos}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="tr-players-count">
              <span>Showing {filteredPlayers.length} of {roster.length} players</span>
            </div>
            
            <div className="tr-player-cards-container">
              {filteredPlayers.length > 0 ? (
                filteredPlayers.map((player, index) => (
                  <div 
                    key={player.id || index} 
                    className="tr-player-card"
                    onClick={() => handlePlayerClick(player)}
                  >
                    <div className="tr-player-card-header" style={{backgroundColor: teamColor}}>
                      {/* FIXED: Added debugging output for jersey number */}
                      <div className="tr-player-jersey-number">
                        {player.jerseyDisplay}
                      </div>
                      <div className="tr-player-position-badge">{player.position || "N/A"}</div>
                    </div>
                    <div className="tr-player-card-body">
                      <h3 className="tr-player-name">{player.fullName}</h3>
                      
                      <div className="tr-player-info-grid">
                        <div className="tr-info-item">
                          <FaRulerVertical className="tr-info-icon" />
                          <span className="tr-info-label">Height</span>
                          <span className="tr-info-value">{player.heightDisplay}</span>
                        </div>
                        
                        <div className="tr-info-item">
                          <FaWeight className="tr-info-icon" />
                          <span className="tr-info-label">Weight</span>
                          <span className="tr-info-value">{player.weightDisplay}</span>
                        </div>
                        
                        <div className="tr-info-item">
                          <FaGraduationCap className="tr-info-icon" />
                          <span className="tr-info-label">Year</span>
                          <span className="tr-info-value">{player.yearDisplay}</span>
                        </div>
                        
                        <div className="tr-info-item">
                          <FaRunning className="tr-info-icon" />
                          <span className="tr-info-label">Team</span>
                          <span className="tr-info-value">{player.team || teamName}</span>
                        </div>
                      </div>

                      <div className="tr-player-location">
                        <FaMapMarkerAlt className="tr-location-icon" />
                        <span>{player.formattedHometown}</span>
                        {player.homeCountry && player.homeCountry !== "USA" && (
                          <span>, {player.homeCountry}</span>
                        )}
                      </div>
                      
                      {(player.homeLatitude || player.homeLongitude) && (
                        <div className="tr-player-coordinates">
                          Lat: {player.homeLatitude}, Long: {player.homeLongitude}
                        </div>
                      )}
                      
                      {player.homeCountyFIPS && (
                        <div className="tr-player-fips">
                          County FIPS: {player.homeCountyFIPS}
                        </div>
                      )}
                      
                      <div className="tr-player-id-section">
                        <div className="tr-player-id">
                          <FaIdCard className="tr-id-icon" />
                          <span>ID: {player.id || "N/A"}</span>
                        </div>
                        
                        {player.recruitIds && player.recruitIds.length > 0 && (
                          <div className="tr-recruit-ids">
                            <FaHashtag className="tr-id-icon" />
                            <span>Recruit IDs: {player.recruitIds.join(", ")}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="tr-no-players-message">
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
        .tr-dashboard-card {
          background: white;
          border-radius: 20px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
          overflow: hidden;
          transition: transform 0.3s ease, box-shadow 0.3s ease;
          animation: trFadeIn 0.6s ease-out;
          width: 100%;
        }
        
        .tr-dashboard-card:hover {
          box-shadow: 0 12px 32px rgba(0, 0, 0, 0.15);
        }
        
        .tr-card-header {
          padding: 1.2rem 1.5rem;
          border-bottom: 1px solid rgba(0, 0, 0, 0.08);
          font-weight: 600;
          font-size: 1.2rem;
          color: rgb(108, 108, 108);
          display: flex;
          align-items: center;
        }
        
        .tr-card-header::before {
          content: '';
          display: inline-block;
          width: 8px;
          height: 24px;
          background: var(--team-color, ${teamColor});
          margin-right: 12px;
          border-radius: 4px;
        }
        
        .tr-card-body {
          padding: 1.5rem;
        }

        /* Filters */
        .tr-roster-filters {
          display: flex;
          gap: 15px;
          margin-bottom: 20px;
          flex-wrap: wrap;
        }
        
        .tr-search-box {
          flex: 1;
          min-width: 200px;
        }
        
        .tr-search-input {
          width: 100%;
          padding: 10px 15px;
          border-radius: 8px;
          border: 1px solid #e0e0e0;
          font-size: 16px;
          transition: all 0.2s;
        }
        
        .tr-search-input:focus {
          outline: none;
          border-color: ${teamColor};
          box-shadow: 0 0 0 2px ${lightenColor(teamColor, 70)};
        }
        
        .tr-position-filter {
          width: 200px;
        }
        
        .tr-position-select {
          width: 100%;
          padding: 10px 15px;
          border-radius: 8px;
          border: 1px solid #e0e0e0;
          font-size: 16px;
          background-color: white;
          cursor: pointer;
        }
        
        .tr-position-select:focus {
          outline: none;
          border-color: ${teamColor};
          box-shadow: 0 0 0 2px ${lightenColor(teamColor, 70)};
        }
        
        .tr-players-count {
          margin-bottom: 15px;
          font-size: 14px;
          color: #666;
        }

        /* Player Cards Container */
        .tr-player-cards-container {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 20px;
          margin-top: 20px;
        }
        
        /* Player Card */
        .tr-player-card {
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
        
        .tr-player-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 8px 24px rgba(0,0,0,0.1);
        }
        
        .tr-player-card-header {
          background-color: ${teamColor};
          color: white;
          padding: 16px;
          position: relative;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .tr-player-jersey-number {
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
        
        .tr-player-position-badge {
          background: rgba(255,255,255,0.2);
          padding: 5px 12px;
          border-radius: 20px;
          font-weight: 600;
          font-size: 14px;
        }
        
        .tr-player-card-body {
          padding: 20px;
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 15px;
        }
        
        .tr-player-name {
          font-size: 18px;
          font-weight: 600;
          margin: 0 0 5px 0;
          color: #333;
          border-bottom: 1px solid #f0f0f0;
          padding-bottom: 10px;
        }
        
        .tr-player-info-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 15px;
          margin-bottom: 5px;
        }
        
        .tr-info-item {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        
        .tr-info-icon {
          color: ${teamColor};
          font-size: 14px;
          margin-bottom: 2px;
        }
        
        .tr-info-label {
          font-size: 12px;
          color: #777;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .tr-info-value {
          font-size: 15px;
          font-weight: 500;
          color: #333;
        }
        
        .tr-player-location {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 14px;
          color: #555;
          margin-top: 5px;
        }
        
        .tr-location-icon {
          color: ${teamColor};
        }
        
        .tr-player-coordinates {
          font-size: 12px;
          color: #999;
          margin-top: -10px;
          margin-left: 20px;
        }
        
        .tr-player-fips {
          font-size: 12px;
          color: #999;
          margin-top: -10px;
          margin-left: 20px;
        }
        
        .tr-player-id-section {
          margin-top: 10px;
          border-top: 1px solid #f0f0f0;
          padding-top: 10px;
          font-size: 12px;
          color: #777;
        }
        
        .tr-player-id, .tr-recruit-ids {
          display: flex;
          align-items: center;
          gap: 5px;
          margin-top: 3px;
        }
        
        .tr-id-icon {
          color: #aaa;
        }

        /* Empty state */
        .tr-no-players-message {
          text-align: center;
          padding: 40px;
          color: #777;
          font-size: 16px;
          grid-column: 1 / -1;
          background: #f9f9f9;
          border-radius: 10px;
        }

        /* Loading indicator */
        .tr-loading-indicator {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 2rem;
          gap: 1rem;
          color: #666;
        }
        
        .tr-loading-spinner {
          display: flex;
          justify-content: center;
          align-items: center;
        }
        
        /* Error message */
        .tr-error-message {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
          color: #ff4d4d;
          font-weight: 500;
        }
        
        /* Animation */
        @keyframes trFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        /* Responsive adjustments */
        @media (max-width: 768px) {
          .tr-player-cards-container {
            grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
          }
          
          .tr-player-info-grid {
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