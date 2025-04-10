import React, { useState, useEffect } from "react";
import { FaUser, FaExclamationTriangle } from "react-icons/fa";
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

// Helper function to lighten a color - MOVED BEFORE USAGE
const lightenColor = (color, percent) => {
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

// Helper function to darken a color - MOVED BEFORE USAGE
const darkenColor = (color, percent) => {
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

// Function to safely get jersey number (handles 0 as valid)
const getJerseyNumber = (player) => {
  // Check each possible field, treating 0 as valid
  if (player.jersey !== undefined && player.jersey !== null) {
    return player.jersey.toString();
  }
  if (player.number !== undefined && player.number !== null) {
    return player.number.toString();
  }
  if (player.jerseyNumber !== undefined && player.jerseyNumber !== null) {
    return player.jerseyNumber.toString();
  }
  return "N/A";
};

const TeamRoster = ({ teamName, teamColor, year = 2024, teamLogo }) => {
  // Initialize roster as an empty array
  const [roster, setRoster] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null); // Add error state

  // NEW: State for handling modal display and selected player
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
        const processedData = data.map(player => ({
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
          weightDisplay: player.weight ? `${player.weight} lbs` : "N/A"
        }));
        
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

  // Style for card headers
  const cardHeaderStyle = {
    background: lightenColor(teamColor, 90),
    borderBottom: `2px solid ${teamColor}`,
    color: darkenColor(teamColor, 20)
  };

  // Style for player icons in roster - using team color
  const playerIconStyle = {
    color: teamColor,
    backgroundColor: `${teamColor}10`,
    padding: "8px",
    borderRadius: "50%",
    width: "32px",
    height: "32px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  };

  // NEW: Handler to open the modal with the selected player info
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
        ) : error ? ( // Display error message if fetching fails
          <div className="error-message">
            <FaExclamationTriangle color="red" style={{ marginRight: "8px" }} />
            {error}
          </div>
        ) : (
          <table className="roster-table">
            <thead>
              <tr style={{ borderBottom: `2px solid ${teamColor}30` }}>
                <th>Player</th>
                <th>Position</th>
                <th>Jersey #</th>
                <th>Height</th>
                <th>Weight</th>
                <th>Year</th>
                <th>Hometown</th>
              </tr>
            </thead>
            <tbody>
              {roster.map((player, index) => (
                <tr
                  key={index}
                  style={{ borderBottom: `1px solid ${teamColor}10`, cursor: "pointer" }}
                  onClick={() => handlePlayerClick(player)} // NEW: Open modal on row click
                >
                  <td>
                    <div className="player-info">
                      <div className="player-icon" style={playerIconStyle}>
                        <FaUser />
                      </div>
                      <div className="player-name">{player.fullName || "N/A"}</div>
                    </div>
                  </td>
                  <td>
                    <span className="player-position">{player.position || "N/A"}</span>
                  </td>
                  <td>
                    <span className="player-jersey">{player.jerseyDisplay}</span>
                  </td>
                  <td>
                    <span className="player-height">{formatHeight(player.height) || "N/A"}</span>
                  </td>
                  <td>
                    <span className="player-weight">{player.weightDisplay}</span>
                  </td>
                  <td>
                    <span className="player-year">{player.year || "N/A"}</span>
                  </td>
                  <td>
                    <span className="player-hometown">{player.formattedHometown}</span>
                  </td>
                </tr>
              ))}
              {roster.length === 0 && !isLoading && !error && (
                <tr>
                  <td colSpan="7" style={{ textAlign: "center" }}>
                    No roster information available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
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
          transform: translateY(-5px);
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
          background: var(--team-color);
          margin-right: 12px;
          border-radius: 4px;
        }
        
        .card-body {
          padding: 1.5rem;
        }

        /* UPDATED: Roster Table - More modern and enhanced */
        .roster-table {
          width: 100%;
          border-collapse: separate;
          border-spacing: 0 8px;
        }
        
        .roster-table th {
          text-align: left;
          padding: 0.75rem 1rem;
          background: rgba(0, 0, 0, 0.03);
          color: #666;
          font-weight: 600;
          text-transform: uppercase;
          font-size: 0.8rem;
          letter-spacing: 0.05em;
          position: sticky;
          top: 0;
          z-index: 10;
        }
        
        .roster-table th:first-child {
          border-top-left-radius: 10px;
          border-bottom-left-radius: 10px;
        }
        
        .roster-table th:last-child {
          border-top-right-radius: 10px;
          border-bottom-right-radius: 10px;
        }
        
        .roster-table tbody tr {
          background: white;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
          border-radius: 10px;
          transition: all 0.2s ease;
        }
        
        .roster-table tbody tr:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          background: rgba(255, 255, 255, 0.95);
        }
        
        .roster-table td {
          padding: 1rem;
          border: none;
          position: relative;
        }
        
        .roster-table td:first-child {
          border-top-left-radius: 10px;
          border-bottom-left-radius: 10px;
        }
        
        .roster-table td:last-child {
          border-top-right-radius: 10px;
          border-bottom-right-radius: 10px;
        }
        
        .player-info {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        
        .player-icon {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 1rem;
        }
        
        .player-name {
          font-weight: 600;
          color: #333;
        }
        
        .player-position {
          display: inline-block;
          background: rgba(0, 0, 0, 0.03);
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 0.85rem;
          font-weight: 600;
          color: #333;
        }
        
        .player-jersey {
          display: inline-block;
          background: rgba(0, 0, 0, 0.05);
          padding: 5px 12px;
          border-radius: 50%;
          font-weight: 700;
          font-size: 0.9rem;
          color: #444;
        }
        
        .player-height {
          font-family: sans-serif;
          font-weight: 500;
        }
        
        .player-year {
          font-weight: 500;
          padding: 3px 10px;
          border-radius: 20px;
          background: rgba(0, 0, 0, 0.05);
          display: inline-block;
        }
        
        .player-weight {
          font-family: sans-serif;
          font-weight: 500;
          color: #555;
        }
        
        .player-hometown {
          font-weight: 500;
          color: #555;
          font-size: 0.9rem;
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