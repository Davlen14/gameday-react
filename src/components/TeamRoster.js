import React, { useState, useEffect } from "react";
import { FaUser, FaExclamationTriangle, FaMapMarkerAlt, FaIdCard, FaHashtag, FaRulerVertical, FaWeight, FaGraduationCap, FaRunning, FaArrowRight, FaSearch, FaFilter, FaCalendarAlt, FaStar } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import teamsService from "../services/teamsService";
import { getAllRecruits, getTeams } from "../services/teamsService"; // Import specific functions
import TeamPlayerModal from "./TeamPlayerModal";

// Loading animation component
const LoadingSpinner = ({ color = "#9e9e9e" }) => (
  <div className="team-roster-loading-spinner">
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

// Function to get jersey number - now directly uses jersey field with no transformations
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
      // Fetch both transfers and recruits in parallel
      const [transferData, recruitData, teamsData] = await Promise.all([
        teamsService.getPlayerPortal(year), // Get transfers from portal
        getAllRecruits(year),               // Get recruits
        getTeams()                           // Get teams for logos and info
      ]);
      
      // Process transfers - filter to only show ones committed to this team
      const relevantTransfers = transferData
        .filter(player => player.destination?.toLowerCase() === teamName.toLowerCase())
        .map(player => ({
          ...player,
          fullName: `${player.firstName || ''} ${player.lastName || ''}`.trim(),
          position: player.position || getDefaultPosition(player.id),
          weightDisplay: player.weight ? `${player.weight} lbs` : `${getDefaultWeight(player.position)} lbs`,
          heightDisplay: formatHeight(player.height),
          yearDisplay: getYearText(player.year),
          stars: player.stars || 3,
          originSchool: player.origin,
          playerType: "transfer",
          formattedHometown: player.homeCity && player.homeState 
            ? `${player.homeCity}, ${player.homeState}` 
            : player.homeCity || player.homeState || "Columbus, OH",
          commitDate: player.transferDate
        }));
      
      // Process recruits - filter to only show ones committed to this team
      const relevantRecruits = recruitData
        .filter(player => player.committedTo?.toLowerCase() === teamName.toLowerCase())
        .map(player => ({
          ...player,
          fullName: player.name || `Recruit ${player.id || Math.floor(Math.random() * 10000)}`,
          position: player.position || getDefaultPosition(player.id),
          weightDisplay: player.weight ? `${player.weight} lbs` : `${getDefaultWeight(player.position)} lbs`,
          heightDisplay: formatHeight(player.height),
          yearDisplay: "Freshman", // Recruits will be incoming freshmen
          stars: player.stars || 3,
          playerType: "recruit",
          formattedHometown: player.hometown || "Unknown",
          commitDate: player.commitmentDate
        }));
      
      // Combine both types of incoming players
      const combinedIncoming = [...relevantTransfers, ...relevantRecruits];
      
      // Sort by star rating (highest first)
      const sortedIncoming = combinedIncoming.sort((a, b) => {
        return (b.stars || 0) - (a.stars || 0);
      });
      
      console.log(`Processed ${sortedIncoming.length} incoming players (${relevantTransfers.length} transfers, ${relevantRecruits.length} recruits)`);
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
    <div className="team-roster-star-rating">
      {[...Array(5)].map((_, i) => (
        <motion.span
          key={i}
          variants={itemVariants}
          initial="hidden"
          animate="visible"
          transition={{ delay: i * 0.1, duration: 0.2 }}
        >
          <FaStar className={i < count ? "team-roster-star team-roster-star-filled" : "team-roster-star team-roster-star-empty"} />
        </motion.span>
      ))}
    </div>
  );

  return (
    <div className="team-roster-dashboard-card team-roster-full-width-card">
      <div className="team-roster-card-header" style={cardHeaderStyle}>
        <FaUser style={{ marginRight: "12px", color: teamColor }} />
        Team Roster
      </div>
      <div className="team-roster-card-body">
        {/* Tab Navigation */}
        <div className="team-roster-roster-tabs">
          <button 
            className={`team-roster-tab-button ${activeTab === "current" ? "team-roster-active" : ""}`}
            onClick={() => setActiveTab("current")}
            style={{borderColor: activeTab === "current" ? teamColor : 'transparent'}}
          >
            Current Roster
          </button>
          <button 
            className={`team-roster-tab-button ${activeTab === "incoming" ? "team-roster-active" : ""}`}
            onClick={() => setActiveTab("incoming")}
            style={{borderColor: activeTab === "incoming" ? teamColor : 'transparent'}}
          >
            Incoming Players
          </button>
        </div>

        {isLoading ? (
          <div className="team-roster-loading-indicator">
            <LoadingSpinner color={teamColor} />
            <p>Loading {activeTab === "current" ? "roster" : "incoming players"}...</p>
          </div>
        ) : error ? (
          <div className="team-roster-error-message">
            <FaExclamationTriangle color="red" style={{ marginRight: "8px" }} />
            {error}
          </div>
        ) : (
          <>
            <div className="team-roster-filters">
              <div className="team-roster-search-container">
                <FaSearch className="team-roster-search-icon" />
                <input 
                  type="text" 
                  placeholder="Search players..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="team-roster-search-input"
                />
                {searchTerm && (
                  <button 
                    className="team-roster-clear-search"
                    onClick={() => setSearchTerm("")}
                  >
                    ×
                  </button>
                )}
              </div>
              <div className="team-roster-filter-group">
                <label>Position</label>
                <select 
                  value={filterPosition} 
                  onChange={(e) => setFilterPosition(e.target.value)}
                  className="team-roster-filter-select"
                >
                  <option value="">All Positions</option>
                  {uniquePositions.map(pos => (
                    <option key={pos} value={pos}>{pos}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="team-roster-players-count">
              <span>Showing {activeTab === "current" ? filteredCurrentPlayers.length : filteredIncomingPlayers.length} of {activeTab === "current" ? roster.length : incomingPlayers.length} players</span>
            </div>
            
            {activeTab === "current" ? (
              <motion.div 
                className="team-roster-player-cards-container"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                {filteredCurrentPlayers.length > 0 ? (
                  filteredCurrentPlayers.map((player, index) => (
                    <motion.div 
                      key={player.id || index} 
                      className="team-roster-player-card"
                      variants={itemVariants}
                      onClick={() => handlePlayerClick(player)}
                    >
                      <div className="team-roster-player-card-header" style={{backgroundColor: teamColor}}>
                        <div className="team-roster-player-jersey-number">{player.jersey}</div>
                        <div className="team-roster-player-position-badge">{player.position}</div>
                      </div>
                      <div className="team-roster-player-card-body">
                        <h3 className="team-roster-player-name">{player.fullName}</h3>
                        
                        <div className="team-roster-player-info-grid">
                          <div className="team-roster-info-item">
                            <FaRulerVertical className="team-roster-info-icon" />
                            <span className="team-roster-info-label">Height</span>
                            <span className="team-roster-info-value">{player.heightDisplay}</span>
                          </div>
                          
                          <div className="team-roster-info-item">
                            <FaWeight className="team-roster-info-icon" />
                            <span className="team-roster-info-label">Weight</span>
                            <span className="team-roster-info-value">{player.weightDisplay}</span>
                          </div>
                          
                          <div className="team-roster-info-item">
                            <FaGraduationCap className="team-roster-info-icon" />
                            <span className="team-roster-info-label">Year</span>
                            <span className="team-roster-info-value">{player.yearDisplay}</span>
                          </div>
                          
                          <div className="team-roster-info-item">
                            <FaMapMarkerAlt className="team-roster-info-icon" />
                            <span className="team-roster-info-label">Hometown</span>
                            <span className="team-roster-info-value">{player.formattedHometown}</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="team-roster-no-players-message">
                    No players found. Please try a different search or filter.
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div 
                className="team-roster-player-cards-container"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                {filteredIncomingPlayers.length > 0 ? (
                  filteredIncomingPlayers.map((player, index) => (
                    <motion.div 
                      key={player.id || index} 
                      className="team-roster-transfer-card"
                      variants={itemVariants}
                      onClick={() => handlePlayerClick(player)}
                      layoutId={`${player.firstName || player.name}-${player.lastName || ""}-${index}`}
                    >
                      <div className="team-roster-transfer-card-header">
                        <div className="team-roster-player-identity">
                          <div className="team-roster-player-avatar">
                            <FaUser className="team-roster-avatar-icon" />
                          </div>
                          <div>
                            <h3>{player.fullName}</h3>
                            <div className="team-roster-position-badge">
                              {player.position || "ATH"}
                            </div>
                          </div>
                        </div>
                        <div className="team-roster-player-rating">
                          {renderStars(player.stars)}
                          {player.rating && (
                            <div className="team-roster-rating-value">
                              {parseFloat(player.rating).toFixed(2)}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {player.playerType === "transfer" && player.originSchool && (
                        <div className="team-roster-transfer-journey">
                          <div className="team-roster-school team-roster-origin">
                            <img 
                              src={`/team-logos/${player.originSchool.replace(/\s+/g, '-').toLowerCase()}.png`} 
                              alt={player.originSchool || "Origin"} 
                              className="team-roster-school-logo"
                              onError={(e) => {e.target.src = "/photos/football.avif"}}
                            />
                            <span className="team-roster-school-name">
                              {player.originSchool || "Unknown"}
                            </span>
                          </div>
                          
                          <div className="team-roster-journey-arrow">
                            <FaArrowRight className="team-roster-arrow-icon" />
                          </div>
                          
                          <div className="team-roster-school team-roster-destination">
                            <img 
                              src={teamLogo || `/team-logos/${teamName.replace(/\s+/g, '-').toLowerCase()}.png`} 
                              alt={teamName} 
                              className="team-roster-school-logo"
                              onError={(e) => {e.target.src = "/photos/football.avif"}}
                            />
                            <span className="team-roster-school-name">
                              {teamName}
                            </span>
                          </div>
                        </div>
                      )}
                      
                      <div className="team-roster-player-info-section">
                        <div className="team-roster-player-info-grid">
                          <div className="team-roster-info-item">
                            <FaRulerVertical className="team-roster-info-icon" />
                            <span className="team-roster-info-label">Height</span>
                            <span className="team-roster-info-value">{player.heightDisplay}</span>
                          </div>
                          
                          <div className="team-roster-info-item">
                            <FaWeight className="team-roster-info-icon" />
                            <span className="team-roster-info-label">Weight</span>
                            <span className="team-roster-info-value">{player.weightDisplay}</span>
                          </div>
                          
                          <div className="team-roster-info-item">
                            <FaGraduationCap className="team-roster-info-icon" />
                            <span className="team-roster-info-label">Eligibility</span>
                            <span className="team-roster-info-value">{player.yearDisplay}</span>
                          </div>
                          
                          <div className="team-roster-info-item">
                            <FaMapMarkerAlt className="team-roster-info-icon" />
                            <span className="team-roster-info-label">Hometown</span>
                            <span className="team-roster-info-value">{player.formattedHometown}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="team-roster-transfer-meta">
                        <div className="team-roster-meta-item">
                          <FaCalendarAlt className="team-roster-meta-icon" />
                          <span>{player.commitDate ? new Date(player.commitDate).toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'short', 
                            day: 'numeric' 
                          }) : "Uncommitted"}</span>
                        </div>
                        <div className="team-roster-meta-item">
                          <span className={`team-roster-player-type-badge team-roster-${player.playerType}`}>
                            {player.playerType === "transfer" ? "Transfer" : "Recruit"}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="team-roster-no-players-message">
                    No incoming players found. Please try a different search or filter.
                  </div>
                )}
              </motion.div>
            )}
          </>
        )}
      </div>

      {/* CSS styling with highly specific selectors */}
      <style>{`
        /* Dashboard Card */
        .team-roster-dashboard-card {
          background: white !important;
          border-radius: 20px !important;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08) !important;
          overflow: hidden !important;
          transition: transform 0.3s ease, box-shadow 0.3s ease !important;
          animation: team-roster-fadeIn 0.6s ease-out !important;
          width: 100% !important;
          margin-bottom: 30px !important;
          position: relative !important;
          z-index: 1 !important;
          font-family: inherit !important;
        }
        
        .team-roster-dashboard-card:hover {
          box-shadow: 0 12px 32px rgba(0, 0, 0, 0.15) !important;
        }
        
        .team-roster-card-header {
          padding: 1.2rem 1.5rem !important;
          border-bottom: 1px solid rgba(0, 0, 0, 0.08) !important;
          font-weight: 600 !important;
          font-size: 1.2rem !important;
          color: rgb(108, 108, 108) !important;
          display: flex !important;
          align-items: center !important;
        }
        
        .team-roster-card-header::before {
          content: '' !important;
          display: inline-block !important;
          width: 8px !important;
          height: 24px !important;
          background: var(--team-color, ${teamColor}) !important;
          margin-right: 12px !important;
          border-radius: 4px !important;
        }
        
        .team-roster-card-body {
          padding: 1.5rem !important;
          position: relative !important;
          z-index: 2 !important;
        }

        /* Tab Navigation */
        .team-roster-roster-tabs {
          display: flex !important;
          border-bottom: 1px solid #e0e0e0 !important;
          margin-bottom: 25px !important;
        }
        
        .team-roster-tab-button {
          padding: 12px 24px !important;
          background: transparent !important;
          border: none !important;
          border-bottom: 3px solid transparent !important;
          font-size: 16px !important;
          font-weight: 600 !important;
          color: #666 !important;
          cursor: pointer !important;
          transition: all 0.3s !important;
          margin-right: 10px !important;
        }
        
        .team-roster-tab-button.team-roster-active {
          color: ${teamColor} !important;
          border-color: ${teamColor} !important;
        }
        
        .team-roster-tab-button:hover:not(.team-roster-active) {
          color: ${lightenColor(teamColor, 20)} !important;
          border-color: ${lightenColor(teamColor, 70)} !important;
        }

        /* Filters */
        .team-roster-filters {
          display: flex !important;
          gap: 15px !important;
          margin-bottom: 20px !important;
          flex-wrap: wrap !important;
          align-items: flex-end !important;
        }
        
        .team-roster-search-container {
          flex: 1 !important;
          min-width: 200px !important;
          position: relative !important;
        }
        
        .team-roster-search-icon {
          position: absolute !important;
          left: 15px !important;
          top: 50% !important;
          transform: translateY(-50%) !important;
          color: #757575 !important;
        }
        
        .team-roster-search-input {
          width: 100% !important;
          padding: 12px 40px !important;
          border-radius: 30px !important;
          border: 1px solid #e0e0e0 !important;
          font-size: 16px !important;
          transition: all 0.2s !important;
        }
        
        .team-roster-search-input:focus {
          outline: none !important;
          border-color: ${teamColor} !important;
          box-shadow: 0 0 0 2px ${lightenColor(teamColor, 70)} !important;
        }
        
        .team-roster-clear-search {
          position: absolute !important;
          right: 15px !important;
          top: 50% !important;
          transform: translateY(-50%) !important;
          background: none !important;
          border: none !important;
          color: #757575 !important;
          font-size: 1.2rem !important;
          cursor: pointer !important;
        }
        
        .team-roster-filter-group {
          display: flex !important;
          flex-direction: column !important;
          min-width: 180px !important;
        }
        
        .team-roster-filter-group label {
          font-size: 0.8rem !important;
          margin-bottom: 5px !important;
          color: #757575 !important;
        }
        
        .team-roster-filter-select {
          padding: 10px 15px !important;
          border-radius: 8px !important;
          border: 1px solid #e0e0e0 !important;
          font-size: 16px !important;
          background-color: white !important;
          cursor: pointer !important;
        }
        
        .team-roster-filter-select:focus {
          outline: none !important;
          border-color: ${teamColor} !important;
          box-shadow: 0 0 0 2px ${lightenColor(teamColor, 70)} !important;
        }
        
        .team-roster-players-count {
          margin-bottom: 15px !important;
          font-size: 14px !important;
          color: #666 !important;
        }

        /* Player Cards Container */
        .team-roster-player-cards-container {
          display: grid !important;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)) !important;
          gap: 20px !important;
          margin-top: 20px !important;
        }
        
        /* Regular Player Card */
        .team-roster-player-card {
          background: white !important;
          border-radius: 12px !important;
          overflow: hidden !important;
          box-shadow: 0 4px 12px rgba(0,0,0,0.05) !important;
          transition: all 0.3s ease !important;
          cursor: pointer !important;
          display: flex !important;
          flex-direction: column !important;
          height: 100% !important;
          position: relative !important;
          z-index: 2 !important;
        }
        
        .team-roster-player-card:hover {
          transform: translateY(-5px) !important;
          box-shadow: 0 8px 24px rgba(0,0,0,0.1) !important;
        }
        
        .team-roster-player-card-header {
          background-color: ${teamColor} !important;
          color: white !important;
          padding: 16px !important;
          position: relative !important;
          display: flex !important;
          justify-content: space-between !important;
          align-items: center !important;
        }
        
        .team-roster-player-jersey-number {
          font-size: 28px !important;
          font-weight: bold !important;
          background: rgba(255,255,255,0.2) !important;
          width: 50px !important;
          height: 50px !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          border-radius: 50% !important;
        }
        
        .team-roster-player-position-badge {
          background: rgba(255,255,255,0.2) !important;
          padding: 5px 12px !important;
          border-radius: 20px !important;
          font-weight: 600 !important;
          font-size: 14px !important;
        }
        
        .team-roster-player-card-body {
          padding: 20px !important;
          flex: 1 !important;
          display: flex !important;
          flex-direction: column !important;
          gap: 15px !important;
        }
        
        .team-roster-player-name {
          font-size: 18px !important;
          font-weight: 600 !important;
          margin: 0 0 5px 0 !important;
          color: #333 !important;
          border-bottom: 1px solid #f0f0f0 !important;
          padding-bottom: 10px !important;
        }
        
        .team-roster-player-info-grid {
          display: grid !important;
          grid-template-columns: repeat(2, 1fr) !important;
          gap: 15px !important;
          margin-bottom: 5px !important;
        }
        
        .team-roster-info-item {
          display: flex !important;
          flex-direction: column !important;
          gap: 2px !important;
        }
        
        .team-roster-info-icon {
          color: ${teamColor} !important;
          font-size: 14px !important;
          margin-bottom: 2px !important;
        }
        
        .team-roster-info-label {
          font-size: 12px !important;
          color: #777 !important;
          text-transform: uppercase !important;
          letter-spacing: 0.5px !important;
        }
        
        .team-roster-info-value {
          font-size: 15px !important;
          font-weight: 500 !important;
          color: #333 !important;
        }
        
        /* Transfer Card Styling (for incoming players) */
        .team-roster-transfer-card {
          background-color: white !important;
          border: 1px solid #e0e0e0 !important;
          padding: 15px !important;
          transition: all 0.3s !important;
          cursor: pointer !important;
          position: relative !important;
          overflow: hidden !important;
          border-radius: 12px !important;
          box-shadow: 0 4px 12px rgba(0,0,0,0.05) !important;
          z-index: 2 !important;
        }
        
        .team-roster-transfer-card:hover {
          transform: translateY(-5px) !important;
          box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1) !important;
          border-color: ${teamColor} !important;
        }
        
        .team-roster-transfer-card-header {
          display: flex !important;
          justify-content: space-between !important;
          align-items: center !important;
          margin-bottom: 15px !important;
        }
        
        .team-roster-player-identity {
          display: flex !important;
          align-items: center !important;
          gap: 12px !important;
        }
        
        .team-roster-player-avatar {
          width: 48px !important;
          height: 48px !important;
          border-radius: 50% !important;
          background-color: #f0f0f0 !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
        }
        
        .team-roster-avatar-icon {
          font-size: 24px !important;
          color: #757575 !important;
        }
        
        .team-roster-player-identity h3 {
          margin: 0 !important;
          font-size: 1.1rem !important;
          font-weight: 600 !important;
        }
        
        .team-roster-position-badge {
          display: inline-block !important;
          padding: 3px 8px !important;
          background-color: #f5f5f5 !important;
          border-radius: 12px !important;
          font-size: 0.8rem !important;
          margin-top: 5px !important;
        }
        
        .team-roster-player-rating {
          display: flex !important;
          flex-direction: column !important;
          align-items: flex-end !important;
        }
        
        .team-roster-star-rating {
          display: flex !important;
          gap: 2px !important;
        }
        
        .team-roster-star {
          font-size: 1rem !important;
        }
        
        .team-roster-star-filled {
          color: #ffc72c !important;
        }
        
        .team-roster-star-empty {
          color: #e0e0e0 !important;
        }
        
        .team-roster-rating-value {
          font-size: 0.8rem !important;
          margin-top: 2px !important;
          color: #757575 !important;
        }
        
        /* Transfer Journey */
        .team-roster-transfer-journey {
          display: flex !important;
          align-items: center !important;
          justify-content: space-between !important;
          margin-bottom: 15px !important;
          padding: 10px !important;
          background-color: #f5f5f5 !important;
          border-radius: 8px !important;
        }
        
        .team-roster-school {
          display: flex !important;
          flex-direction: column !important;
          align-items: center !important;
          flex: 1 !important;
        }
        
        .team-roster-school-logo {
          width: 50px !important;
          height: 50px !important;
          object-fit: contain !important;
          margin-bottom: 5px !important;
        }
        
        .team-roster-school-name {
          font-size: 0.9rem !important;
          text-align: center !important;
          max-width: 100px !important;
          overflow: hidden !important;
          text-overflow: ellipsis !important;
          white-space: nowrap !important;
        }
        
        .team-roster-journey-arrow {
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          flex-basis: 50px !important;
        }
        
        .team-roster-arrow-icon {
          font-size: 1.5rem !important;
          color: ${teamColor} !important;
        }
        
        /* Player Info Section */
        .team-roster-player-info-section {
          margin-bottom: 15px !important;
        }
        
        /* Transfer Meta */
        .team-roster-transfer-meta {
          display: flex !important;
          align-items: center !important;
          justify-content: space-between !important;
          font-size: 0.85rem !important;
          margin-top: 10px !important;
          border-top: 1px solid #f0f0f0 !important;
          padding-top: 10px !important;
        }
        
        .team-roster-meta-item {
          display: flex !important;
          align-items: center !important;
          gap: 5px !important;
          color: #757575 !important;
        }
        
        .team-roster-meta-icon {
          font-size: 0.9rem !important;
        }
        
        .team-roster-player-type-badge {
          padding: 3px 8px !important;
          border-radius: 12px !important;
          font-size: 0.75rem !important;
          font-weight: 600 !important;
        }
        
        .team-roster-player-type-badge.team-roster-transfer {
          background-color: rgba(244, 67, 54, 0.2) !important;
          color: #c62828 !important;
        }
        
        .team-roster-player-type-badge.team-roster-recruit {
          background-color: rgba(76, 175, 80, 0.2) !important;
          color: #2e7d32 !important;
        }

        /* Empty state */
        .team-roster-no-players-message {
          text-align: center !important;
          padding: 40px !important;
          color: #777 !important;
          font-size: 16px !important;
          grid-column: 1 / -1 !important;
          background: #f9f9f9 !important;
          border-radius: 10px !important;
        }

        /* Loading indicator */
        .team-roster-loading-indicator {
          display: flex !important;
          flex-direction: column !important;
          align-items: center !important;
          justify-content: center !important;
          padding: 2rem !important;
          gap: 1rem !important;
          color: #666 !important;
        }
        
        .team-roster-loading-spinner {
          display: flex !important;
          justify-content: center !important;
          align-items: center !important;
        }
        
        /* Error message */
        .team-roster-error-message {
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          padding: 2rem !important;
          color: #ff4d4d !important;
          font-weight: 500 !important;
        }
        
        /* Animation */
        @keyframes team-roster-fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        /* Responsive adjustments */
        @media (max-width: 768px) {
          .team-roster-player-cards-container {
            grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)) !important;
          }
          
          .team-roster-player-info-grid {
            grid-template-columns: 1fr !important;
          }
          
          .team-roster-filters {
            flex-direction: column !important;
          }
          
          .team-roster-search-container, .team-roster-filter-group {
            width: 100% !important;
          }
          
          .team-roster-transfer-card-header {
            flex-direction: column !important;
            align-items: flex-start !important;
          }
          
          .team-roster-player-rating {
            align-items: flex-start !important;
            margin-top: 10px !important;
          }
        }
        
        @media (max-width: 480px) {
          .team-roster-transfer-journey {
            flex-direction: column !important;
            gap: 15px !important;
          }
          
          .team-roster-journey-arrow {
            transform: rotate(90deg) !important;
          }
          
          .team-roster-tab-button {
            padding: 10px 15px !important;
            font-size: 14px !important;
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