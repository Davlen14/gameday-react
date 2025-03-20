import React, { useState, useEffect } from "react";
import { FaUser } from "react-icons/fa";
import teamsService from "../services/teamsService";
import "../styles/TeamDetail.css";

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
          repeatCount="indefinite" />
      </circle>
    </svg>
  </div>
);

// Format height from inches to feet and inches
const formatHeight = (heightInInches) => {
  if (!heightInInches) return "N/A";
  
  // Try to handle cases where height might be given as "6'2" or similar
  if (typeof heightInInches === 'string' && heightInInches.includes("'")) {
    return heightInInches;
  }
  
  const inches = parseInt(heightInInches, 10);
  if (isNaN(inches)) return "N/A";
  
  const feet = Math.floor(inches / 12);
  const remainingInches = inches % 12;
  
  return `${feet}'${remainingInches}"`;
};

const TeamRoster = ({ teamName, teamColor, year = 2024 }) => {
  const [roster, setRoster] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchRoster = async () => {
      try {
        setIsLoading(true);
        const data = await teamsService.getTeamRoster(teamName, year);
        setRoster(data);
      } catch (err) {
        console.error("Error fetching roster:", err.message);
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
    padding: '8px',
    borderRadius: '50%',
    width: '32px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  };

  // Helper function to lighten a color
  const lightenColor = (color, percent) => {
    const num = parseInt(color.replace('#', ''), 16),
          amt = Math.round(2.55 * percent),
          R = (num >> 16) + amt,
          G = (num >> 8 & 0x00FF) + amt,
          B = (num & 0x0000FF) + amt;
    return '#' + (0x1000000 + (R < 255 ? R : 255) * 0x10000 +
                  (G < 255 ? G : 255) * 0x100 +
                  (B < 255 ? B : 255)).toString(16).slice(1);
  };

  // Helper function to darken a color
  const darkenColor = (color, percent) => {
    const num = parseInt(color.replace('#', ''), 16),
          amt = Math.round(2.55 * percent),
          R = (num >> 16) - amt,
          G = (num >> 8 & 0x00FF) - amt,
          B = (num & 0x0000FF) - amt;
    return '#' + (0x1000000 + (R > 0 ? R : 0) * 0x10000 +
                  (G > 0 ? G : 0) * 0x100 +
                  (B > 0 ? B : 0)).toString(16).slice(1);
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
        ) : (
          <table className="roster-table">
            <thead>
              <tr style={{ borderBottom: `2px solid ${teamColor}30` }}>
                <th>Player</th>
                <th>Position</th>
                <th>Height</th>
                <th>Year</th>
              </tr>
            </thead>
            <tbody>
              {roster.map((player, index) => (
                <tr key={index} style={{ borderBottom: `1px solid ${teamColor}10` }}>
                  <td>
                    <div className="player-info">
                      <div className="player-icon" style={playerIconStyle}>
                        <FaUser />
                      </div>
                      <div className="player-name">{player.fullName}</div>
                    </div>
                  </td>
                  <td>
                    <span className="player-position">{player.position || "N/A"}</span>
                  </td>
                  <td>
                    <span className="player-height">{formatHeight(player.height) || "N/A"}</span>
                  </td>
                  <td>
                    <span className="player-year">{player.year || "N/A"}</span>
                  </td>
                </tr>
              ))}
              {roster.length === 0 && !isLoading && (
                <tr>
                  <td colSpan="4" style={{ textAlign: "center" }}>
                    No roster information available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
      
      {/* Custom CSS for team-specific styling */}
      <style>{`
        /* Player icon using team colors */
        .player-icon {
          background-color: ${teamColor}10 !important;
          color: ${teamColor} !important;
        }
      `}</style>
    </div>
  );
};

export default TeamRoster;