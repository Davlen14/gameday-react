import React, { useState, useEffect } from "react";
import { FaUser, FaExclamationTriangle, FaMapMarkerAlt, FaIdCard, FaHashtag, FaRulerVertical, FaWeight, FaGraduationCap, FaRunning, FaArrowRight, FaSearch, FaFilter, FaCalendarAlt, FaStar } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
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

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { 
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { 
    y: 0, 
    opacity: 1,
    transition: { duration: 0.5 }
  }
};

const TeamRoster = ({ teamName, teamColor, year = 2024, teamLogo }) => {
  // Initialize roster as an empty array
  const [roster, setRoster] = useState([]);
  const [incomingPlayers, setIncomingPlayers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterPosition, setFilterPosition] = useState("");
  const [activeTab, setActiveTab] = useState("current"); // "current" or "incoming"

  // State for handling modal display and selected player
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  
  // Function to fetch current roster
  const fetchRoster = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Get team roster data
      const data = await teamsService.getTeamRoster(teamName, year);
      
      console.log(`Fetched ${data?.length || 0} players for ${teamName}`);
      
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
      setError("Failed to load roster information.");
      setRoster([]);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Function to fetch incoming players (transfers and recruits)
  const fetchIncomingPlayers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Get team roster data - we assume teamsService has a method for incoming players
      // This might combine transfers and recruits
      const data = await teamsService.getIncomingPlayers(teamName, year);
      
      console.log(`Fetched ${data?.length || 0} incoming players for ${teamName}`);
      
      // Process the data to ensure all fields have values
      const processedData = data.map(player => {
        // Determine position (either from data or generate a default)
        const position = player.position || getDefaultPosition(player.id);
        
        // Generate default weight based on position
        const defaultWeight = getDefaultWeight(position);
        
        // Create the processed player object
        const processedPlayer = {
          ...player,
          // Create a fullName if it doesn't exist
          fullName: player.fullName || 
                    `${player.firstName || ''} ${player.lastName || ''}`.trim() || 
                    `Player ${player.id ? player.id.toString().slice(-5) : Math.floor(Math.random() * 10000)}`,
          
          position: position,
          
          // Format hometown with default
          formattedHometown: player.homeCity && player.homeState 
            ? `${player.homeCity}, ${player.homeState}` 
            : player.homeCity || player.homeState || "Columbus, OH",
          
          // Format weight with position-appropriate default
          weightDisplay: player.weight ? `${player.weight} lbs` : `${defaultWeight} lbs`,
          
          // Format height with default
          heightDisplay: formatHeight(player.height),
          
          // Format year/class with default
          yearDisplay: getYearText(player.year),
          
          // Add stars rating if available, or default
          stars: player.stars || 3,
          
          // Add origin school if it's a transfer
          originSchool: player.origin || player.previousSchool,
          
          // Add transfer or recruit type
          playerType: player.origin ? "transfer" : "recruit"
        };
        
        return processedPlayer;
      });
      
      // Sort incoming players by star rating (highest first)
      const sortedIncoming = [...processedData].sort((a, b) => {
        return (b.stars || 0) - (a.stars || 0);
      });
      
      console.log(`Processed ${sortedIncoming.length} incoming players for display`);
      setIncomingPlayers(sortedIncoming);
    } catch (err) {
      console.error("Error fetching incoming players:", err.message);
      setError("Failed to load incoming players information.");
      setIncomingPlayers([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "current") {
      fetchRoster();
    } else {
      fetchIncomingPlayers();
    }
  }, [teamName, year, activeTab]);

  // Get all unique positions for filtering from both current and incoming players
  const currentPositions = [...new Set(roster.map(player => player.position))].filter(Boolean);
  const incomingPositions = [...new Set(incomingPlayers.map(player => player.position))].filter(Boolean);
  const uniquePositions = [...new Set([...currentPositions, ...incomingPositions])].sort();

  // Filter players based on search and position
  const filteredCurrentPlayers = roster.filter(player => {
    const nameMatch = player.fullName.toLowerCase().includes(searchTerm.toLowerCase());
    const positionMatch = filterPosition ? player.position === filterPosition : true;
    return nameMatch && positionMatch;
  });

  const filteredIncomingPlayers = incomingPlayers.filter(player => {
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

  // Star rendering
  const renderStars = (count) => (
    <div className="star-rating">
      {[...Array(5)].map((_, i) => (
        <motion.span
          key={i}
          variants={itemVariants}
          initial="hidden"
          animate="visible"
          transition={{ delay: i * 0.1, duration: 0.2 }}
        >
          <FaStar className={i < count ? "star filled" : "star empty"} />
        </motion.span>
      ))}
    </div>
  );

  return (
    <div className="dashboard-card full-width-card">
      <div className="card-header" style={cardHeaderStyle}>
        <FaUser style={{ marginRight: "12px", color: teamColor }} />
        Team Roster
      </div>
      <div className="card-body">
        {/* Tab Navigation */}
        <div className="roster-tabs">
          <button 
            className={`tab-button ${activeTab === "current" ? "active" : ""}`}
            onClick={() => setActiveTab("current")}
            style={{borderColor: activeTab === "current" ? teamColor : 'transparent'}}
          >
            Current Roster
          </button>
          <button 
            className={`tab-button ${activeTab === "incoming" ? "active" : ""}`}
            onClick={() => setActiveTab("incoming")}
            style={{borderColor: activeTab === "incoming" ? teamColor : 'transparent'}}
          >
            Incoming Players
          </button>
        </div>

        {isLoading ? (
          <div className="loading-indicator">
            <LoadingSpinner color={teamColor} />
            <p>Loading {activeTab === "current" ? "roster" : "incoming players"}...</p>
          </div>
        ) : error ? (
          <div className="error-message">
            <FaExclamationTriangle color="red" style={{ marginRight: "8px" }} />
            {error}
          </div>
        ) : (
          <>
            <div className="roster-filters">
              <div className="search-container">
                <FaSearch className="search-icon" />
                <input 
                  type="text" 
                  placeholder="Search players..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                />
                {searchTerm && (
                  <button 
                    className="clear-search"
                    onClick={() => setSearchTerm("")}
                  >
                    ×
                  </button>
                )}
              </div>
              <div className="filter-group">
                <label>Position</label>
                <select 
                  value={filterPosition} 
                  onChange={(e) => setFilterPosition(e.target.value)}
                  className="filter-select"
                >
                  <option value="">All Positions</option>
                  {uniquePositions.map(pos => (
                    <option key={pos} value={pos}>{pos}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="players-count">
              <span>Showing {activeTab === "current" ? filteredCurrentPlayers.length : filteredIncomingPlayers.length} of {activeTab === "current" ? roster.length : incomingPlayers.length} players</span>
            </div>
            
            {activeTab === "current" ? (
              <motion.div 
                className="player-cards-container"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                {filteredCurrentPlayers.length > 0 ? (
                  filteredCurrentPlayers.map((player, index) => (
                    <motion.div 
                      key={player.id || index} 
                      className="player-card"
                      variants={itemVariants}
                      onClick={() => handlePlayerClick(player)}
                    >
                      <div className="player-card-header" style={{backgroundColor: teamColor}}>
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
                            <FaMapMarkerAlt className="info-icon" />
                            <span className="info-label">Hometown</span>
                            <span className="info-value">{player.formattedHometown}</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="no-players-message">
                    No players found. Please try a different search or filter.
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div 
                className="player-cards-container"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                {filteredIncomingPlayers.length > 0 ? (
                  filteredIncomingPlayers.map((player, index) => (
                    <motion.div 
                      key={player.id || index} 
                      className="transfer-card"
                      variants={itemVariants}
                      onClick={() => handlePlayerClick(player)}
                      layoutId={`${player.firstName}-${player.lastName}-${index}`}
                    >
                      <div className="transfer-card-header">
                        <div className="player-identity">
                          <div className="player-avatar">
                            <FaUser className="avatar-icon" />
                          </div>
                          <div>
                            <h3>{player.fullName}</h3>
                            <div className="position-badge">
                              {player.position || "ATH"}
                            </div>
                          </div>
                        </div>
                        <div className="player-rating">
                          {renderStars(player.stars)}
                          {player.rating && (
                            <div className="rating-value">
                              {parseFloat(player.rating).toFixed(2)}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {player.playerType === "transfer" && player.originSchool && (
                        <div className="transfer-journey">
                          <div className="school origin">
                            <img 
                              src={`/team-logos/${player.originSchool.replace(/\s+/g, '-').toLowerCase()}.png`} 
                              alt={player.originSchool || "Origin"} 
                              className="school-logo"
                              onError={(e) => {e.target.src = "/photos/football.avif"}}
                            />
                            <span className="school-name">
                              {player.originSchool || "Unknown"}
                            </span>
                          </div>
                          
                          <div className="journey-arrow">
                            <FaArrowRight className="arrow-icon" />
                          </div>
                          
                          <div className="school destination">
                            <img 
                              src={teamLogo || `/team-logos/${teamName.replace(/\s+/g, '-').toLowerCase()}.png`} 
                              alt={teamName} 
                              className="school-logo"
                              onError={(e) => {e.target.src = "/photos/football.avif"}}
                            />
                            <span className="school-name">
                              {teamName}
                            </span>
                          </div>
                        </div>
                      )}
                      
                      <div className="player-info-section">
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
                            <span className="info-label">Eligibility</span>
                            <span className="info-value">{player.yearDisplay}</span>
                          </div>
                          
                          <div className="info-item">
                            <FaMapMarkerAlt className="info-icon" />
                            <span className="info-label">Hometown</span>
                            <span className="info-value">{player.formattedHometown}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="transfer-meta">
                        <div className="meta-item">
                          <FaCalendarAlt className="meta-icon" />
                          <span>{player.commitDate ? new Date(player.commitDate).toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'short', 
                            day: 'numeric' 
                          }) : "Uncommitted"}</span>
                        </div>
                        <div className="meta-item">
                          <span className={`player-type-badge ${player.playerType}`}>
                            {player.playerType === "transfer" ? "Transfer" : "Recruit"}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="no-players-message">
                    No incoming players found. Please try a different search or filter.
                  </div>
                )}
              </motion.div>
            )}
          </>
        )}
      </div>

      {/* CSS styling */}
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
          margin-bottom: 30px;
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

        /* Tab Navigation */
        .roster-tabs {
          display: flex;
          border-bottom: 1px solid #e0e0e0;
          margin-bottom: 25px;
        }
        
        .tab-button {
          padding: 12px 24px;
          background: transparent;
          border: none;
          border-bottom: 3px solid transparent;
          font-size: 16px;
          font-weight: 600;
          color: #666;
          cursor: pointer;
          transition: all 0.3s;
          margin-right: 10px;
        }
        
        .tab-button.active {
          color: ${teamColor};
          border-color: ${teamColor};
        }
        
        .tab-button:hover:not(.active) {
          color: ${lightenColor(teamColor, 20)};
          border-color: ${lightenColor(teamColor, 70)};
        }

        /* Filters */
        .roster-filters {
          display: flex;
          gap: 15px;
          margin-bottom: 20px;
          flex-wrap: wrap;
          align-items: flex-end;
        }
        
        .search-container {
          flex: 1;
          min-width: 200px;
          position: relative;
        }
        
        .search-icon {
          position: absolute;
          left: 15px;
          top: 50%;
          transform: translateY(-50%);
          color: #757575;
        }
        
        .search-input {
          width: 100%;
          padding: 12px 40px;
          border-radius: 30px;
          border: 1px solid #e0e0e0;
          font-size: 16px;
          transition: all 0.2s;
        }
        
        .search-input:focus {
          outline: none;
          border-color: ${teamColor};
          box-shadow: 0 0 0 2px ${lightenColor(teamColor, 70)};
        }
        
        .clear-search {
          position: absolute;
          right: 15px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: #757575;
          font-size: 1.2rem;
          cursor: pointer;
        }
        
        .filter-group {
          display: flex;
          flex-direction: column;
          min-width: 180px;
        }
        
        .filter-group label {
          font-size: 0.8rem;
          margin-bottom: 5px;
          color: #757575;
        }
        
        .filter-select {
          padding: 10px 15px;
          border-radius: 8px;
          border: 1px solid #e0e0e0;
          font-size: 16px;
          background-color: white;
          cursor: pointer;
        }
        
        .filter-select:focus {
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
        
        /* Regular Player Card */
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
        
        /* Transfer Card Styling (for incoming players) */
        .transfer-card {
          background-color: white;
          border: 1px solid #e0e0e0;
          padding: 15px;
          transition: all 0.3s;
          cursor: pointer;
          position: relative;
          overflow: hidden;
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.05);
        }
        
        .transfer-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
          border-color: ${teamColor};
        }
        
        .transfer-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 15px;
        }
        
        .player-identity {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        
        .player-avatar {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background-color: #f0f0f0;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .avatar-icon {
          font-size: 24px;
          color: #757575;
        }
        
        .player-identity h3 {
          margin: 0;
          font-size: 1.1rem;
          font-weight: 600;
        }
        
        .position-badge {
          display: inline-block;
          padding: 3px 8px;
          background-color: #f5f5f5;
          border-radius: 12px;
          font-size: 0.8rem;
          margin-top: 5px;
        }
        
        .player-rating {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
        }
        
        .star-rating {
          display: flex;
          gap: 2px;
        }
        
        .star {
          font-size: 1rem;
        }
        
        .star.filled {
          color: #ffc72c;
        }
        
        .star.empty {
          color: #e0e0e0;
        }
        
        .rating-value {
          font-size: 0.8rem;
          margin-top: 2px;
          color: #757575;
        }
        
        /* Transfer Journey */
        .transfer-journey {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 15px;
          padding: 10px;
          background-color: #f5f5f5;
          border-radius: 8px;
        }
        
        .school {
          display: flex;
          flex-direction: column;
          align-items: center;
          flex: 1;
        }
        
        .school-logo {
          width: 50px;
          height: 50px;
          object-fit: contain;
          margin-bottom: 5px;
        }
        
        .school-name {
          font-size: 0.9rem;
          text-align: center;
          max-width: 100px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        
        .journey-arrow {
          display: flex;
          align-items: center;
          justify-content: center;
          flex-basis: 50px;
        }
        
        .arrow-icon {
          font-size: 1.5rem;
          color: ${teamColor};
        }
        
        /* Player Info Section */
        .player-info-section {
          margin-bottom: 15px;
        }
        
        /* Transfer Meta */
        .transfer-meta {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 0.85rem;
          margin-top: 10px;
          border-top: 1px solid #f0f0f0;
          padding-top: 10px;
        }
        
        .meta-item {
          display: flex;
          align-items: center;
          gap: 5px;
          color: #757575;
        }
        
        .meta-icon {
          font-size: 0.9rem;
        }
        
        .player-type-badge {
          padding: 3px 8px;
          border-radius: 12px;
          font-size: 0.75rem;
          font-weight: 600;
        }
        
        .player-type-badge.transfer {
          background-color: rgba(244, 67, 54, 0.2);
          color: #c62828;
        }
        
        .player-type-badge.recruit {
          background-color: rgba(76, 175, 80, 0.2);
          color: #2e7d32;
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
          
          .roster-filters {
            flex-direction: column;
          }
          
          .search-container, .filter-group {
            width: 100%;
          }
          
          .transfer-card-header {
            flex-direction: column;
            align-items: flex-start;
          }
          
          .player-rating {
            align-items: flex-start;
            margin-top: 10px;
          }
        }
        
        @media (max-width: 480px) {
          .transfer-journey {
            flex-direction: column;
            gap: 15px;
          }
          
          .journey-arrow {
            transform: rotate(90deg);
          }
          
          .tab-button {
            padding: 10px 15px;
            font-size: 14px;
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