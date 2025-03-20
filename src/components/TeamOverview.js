import React from "react";
import { FaChartLine, FaInfoCircle } from "react-icons/fa";
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
          `}</style>
        </div>
      </div>
    </>
  );
};

export default TeamOverview;