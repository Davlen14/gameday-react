import React from "react";
import { FaChartLine, FaInfoCircle, FaFutbol } from "react-icons/fa";
import GaugeComponent from "./GaugeComponent";

const TeamOverview = ({ team, teamColor, year = 2024 }) => {
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

  // Get contrast color for text based on background color
  const getContrastColor = (hexColor) => {
    if (!hexColor) return "#ffffff";
    hexColor = hexColor.replace('#', '');
    const r = parseInt(hexColor.substr(0, 2), 16);
    const g = parseInt(hexColor.substr(2, 2), 16);
    const b = parseInt(hexColor.substr(4, 2), 16);
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return (yiq >= 128) ? '#000000' : '#ffffff';
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
  
  // Get team initial letter(s) - handles special cases like "USC", "UCLA", etc.
  const getTeamInitial = (schoolName) => {
    if (!schoolName) return "T";
    
    // Check for common abbreviations/special cases
    const specialCases = {
      "Southern California": "USC",
      "UCLA": "UCLA",
      "North Carolina": "NC",
      "Louisiana State": "LSU",
      "Texas Christian": "TCU",
      "Central Florida": "UCF",
      "Miami": "UM",
      "Mississippi": "Ole Miss",
      "Mississippi State": "MSU",
      "Southern Methodist": "SMU",
      "Brigham Young": "BYU"
    };
    
    // Handle special cases
    for (const [fullName, abbr] of Object.entries(specialCases)) {
      if (schoolName.includes(fullName)) {
        // Return first letter if abbreviation is too long
        return abbr.length <= 2 ? abbr : abbr.charAt(0);
      }
    }
    
    // Check if the name itself is an abbreviation (all caps)
    if (schoolName === schoolName.toUpperCase() && schoolName.length <= 4) {
      return schoolName.charAt(0);
    }
    
    // For schools with "University of X" format
    if (schoolName.startsWith("University of ")) {
      return schoolName.replace("University of ", "").charAt(0);
    }
    
    // Default to first letter
    return schoolName.charAt(0);
  };

  // Style for card headers
  const cardHeaderStyle = {
    background: lightenColor(teamColor, 90),
    borderBottom: `2px solid ${teamColor}`,
    color: darkenColor(teamColor, 20)
  };

  // Get team conference
  const teamConference = team.conference || "Independent";

  return (
    <>
      {/* SP+ Ratings Card */}
      <div className="dashboard-card team-ratings-card">
        <div className="card-header" style={cardHeaderStyle}>
          <FaChartLine style={{ marginRight: "12px", color: teamColor }} /> 
          SP+ Ratings
        </div>
        <div className="card-body">
          {/* Using the modernized GaugeComponent */}
          <GaugeComponent 
            teamName={team.school}
            year={year}
            teamColor={teamColor}
          />
          
          {/* Ratings explanation with team color gradient */}
          <div className="ratings-explanation-container">
            <div className="ratings-explanation">
              <h3 style={{ color: teamColor }}>How SP+ Ratings Work</h3>
              <p>
                The SP+ ratings combine multiple aspects of team performance into a single composite metric.
                <br />
                <strong>Overall:</strong> Combines offense, defense, and special teams.
                <br />
                <strong>Offense:</strong> Measures scoring efficiency and ball movement. Higher values indicate better offense.
                <br />
                <strong>Defense:</strong> Measures defensive efficiency. Lower values indicate a stronger defense.
              </p>
              <p>
                <strong>Color zones indicate performance relative to national average:</strong><br />
                <span style={{ color: "#ff4d4d" }}><strong>Below Average</strong></span> | 
                <span style={{ color: "#ffc700" }}><strong>Average</strong></span> | 
                <span style={{ color: "#04aa6d" }}><strong>Above Average</strong></span>
              </p>
              <p>
                <strong>National Averages (2024):</strong><br />
                Overall: 0.55 | Offense: 27.14 | Defense: 26.61
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Team Info Card */}
      <div className="dashboard-card team-info-card">
        <div className="card-header" style={cardHeaderStyle}>
          <FaInfoCircle style={{ marginRight: "12px", color: teamColor }} />
          About {team.school} {team.mascot}
        </div>
        <div className="card-body">
          <table className="info-table">
            <tbody>
              <tr>
                <td>Location:</td>
                <td><strong>{team.location?.city}, {team.location?.state}</strong></td>
              </tr>
              <tr>
                <td>Team Spirit:</td>
                <td>
                  <div className="team-spirit-items">
                    {/* Team Logo Block */}
                    <div className="spirit-item logo-block" style={{ backgroundColor: "#ffffff", padding: "2px" }}>
                      <img 
                        src={team.logos ? team.logos[team.logos.length > 1 ? 1 : 0] : ''} 
                        alt={team.mascot || 'Team Logo'}
                        className="team-logo-stick"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = "/photos/default_team.png";
                        }}
                      />
                    </div>
                    
                    {/* Modern Foam Finger */}
                    <div className="spirit-item modern-finger" style={{ backgroundColor: teamColor }}>
                      <div className="finger-hand" style={{ backgroundColor: teamColor }}>
                        <div className="finger-thumb" style={{ backgroundColor: teamColor }}></div>
                      </div>
                      <div className="finger-text" style={{ color: getContrastColor(teamColor) }}>
                        #1
                      </div>
                    </div>
                    
                    {/* Team Pennant */}
                    <div className="spirit-item modern-pennant" style={{ background: teamColor }}>
                      <span style={{ color: getContrastColor(teamColor) }}>
                        {team.mascot}
                      </span>
                    </div>
                  </div>
                </td>
              </tr>
              <tr>
                <td>Conference:</td>
                <td><strong>{teamConference}</strong></td>
              </tr>
              <tr>
                <td>Division:</td>
                <td><strong>Division I ({team.classification})</strong></td>
              </tr>
              <tr>
                <td>Team Colors:</td>
                <td>
                  <div style={{
                    display: 'flex',
                    gap: '8px',
                    alignItems: 'center'
                  }}>
                    <div style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      background: teamColor,
                      border: '1px solid rgba(0,0,0,0.1)'
                    }}></div>
                    <strong>{teamColor}</strong>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          <style jsx>{`
            .info-table {
              width: 100%;
              border-collapse: separate;
              border-spacing: 0;
            }

            .info-table tr:hover {
              background-color: ${teamColor}08;
            }

            .info-table td {
              padding: 12px;
              border-bottom: 1px solid #f0f0f0;
            }

            .info-table tr:last-child td {
              border-bottom: none;
            }

            .info-table td:first-child {
              width: 120px;
              color: #555;
              font-weight: 500;
            }
            
            .ratings-explanation-container {
              position: relative;
              margin-top: 1.5rem;
              width: 100%;
            }
            
            .ratings-explanation-container::before {
              content: '';
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              height: 4px;
              background: linear-gradient(to right, ${teamColor}, ${lightenColor(teamColor, 30)}, ${teamColor});
              border-radius: 2px 2px 0 0;
            }
            
            .ratings-explanation {
              background-color: #f9f9f9;
              border-radius: 8px;
              padding: 1rem;
              font-size: 14px;
              line-height: 1.5;
              color: #555;
              width: 100%;
            }
            
            .ratings-explanation h3 {
              margin-top: 0;
              margin-bottom: 0.75rem;
              color: ${teamColor};
            }
            
            /* Team Spirit Items Styling */
            .team-spirit-items {
              display: flex;
              justify-content: flex-start;
              align-items: center;
              gap: 20px;
              padding: 10px 0;
            }
            
            .spirit-item {
              position: relative;
              cursor: pointer;
              transition: transform 0.3s ease;
              filter: drop-shadow(2px 4px 6px rgba(0,0,0,0.2));
              animation: subtle-sway 3s ease-in-out infinite;
            }
            
            .spirit-item:hover {
              transform: translateY(-5px) rotate(5deg);
              filter: drop-shadow(3px 6px 10px rgba(0,0,0,0.25));
              animation-play-state: paused;
            }
            
            @keyframes subtle-sway {
              0%, 100% { transform: rotate(0deg); }
              25% { transform: rotate(2deg); }
              75% { transform: rotate(-2deg); }
            }
            
            /* Logo Block */
            .logo-block {
              width: 40px;
              height: 40px;
              display: flex;
              justify-content: center;
              align-items: center;
              border-radius: 4px;
              position: relative;
              transform-origin: bottom center;
              border: 1px solid rgba(0,0,0,0.1);
              overflow: hidden;
              animation-delay: 0.2s;
            }
            
            .team-logo-stick {
              width: 100%;
              height: 100%;
              object-fit: contain;
            }
            
            .logo-block:after {
              content: '';
              width: 6px;
              height: 25px;
              background-color: #8b4513; /* Wood color */
              position: absolute;
              bottom: -24px;
              border-radius: 3px;
            }
            
            /* Modern Foam Finger */
            .modern-finger {
              position: relative;
              width: 42px;
              height: 46px;
              border-radius: 8px 8px 14px 14px;
              display: flex;
              justify-content: center;
              align-items: center;
              transform-origin: bottom center;
              box-shadow: inset 0 -4px 0 rgba(0,0,0,0.2);
              animation-delay: 0.5s;
            }
            
            .finger-hand {
              position: absolute;
              bottom: 0;
              width: 100%;
              height: 65%;
              border-radius: 8px 8px 14px 14px;
            }
            
            .finger-thumb {
              position: absolute;
              left: -8px;
              top: 50%;
              width: 12px;
              height: 18px;
              border-radius: 6px;
              transform: translateY(-50%);
              box-shadow: inset -2px 0 0 rgba(0,0,0,0.2);
            }
            
            .finger-text {
              font-weight: bold;
              font-size: 18px;
              text-align: center;
              margin-top: -10px;
              text-shadow: 1px 1px 1px rgba(0,0,0,0.3);
              position: relative;
              z-index: 2;
            }
            
            .modern-finger:after {
              content: '';
              width: 6px;
              height: 25px;
              background-color: #8b4513; /* Wood color */
              position: absolute;
              bottom: -24px;
              border-radius: 3px;
            }
            
            /* Modern Pennant */
            .modern-pennant {
              position: relative;
              width: 100px;
              height: 40px;
              display: flex;
              justify-content: center;
              align-items: center;
              transform-origin: left center;
              clip-path: polygon(0 0, 100% 0, 80% 50%, 100% 100%, 0 100%);
              animation-delay: 0.8s;
            }
            
            .modern-pennant span {
              font-size: 12px;
              font-weight: bold;
              white-space: nowrap;
              margin-left: -10px;
              text-shadow: 1px 1px 1px rgba(0,0,0,0.3);
            }
            
            .modern-pennant:after {
              content: '';
              width: 6px;
              height: 60px;
              background-color: #8b4513; /* Wood color */
              position: absolute;
              left: -5px;
              top: -10px;
              border-radius: 3px;
              z-index: -1;
            }
          `}</style>
        </div>
      </div>
    </>
  );
};

export default TeamOverview;