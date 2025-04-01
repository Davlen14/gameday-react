import React, { useState, useEffect } from "react";
import { FaChartLine, FaInfoCircle, FaFutbol, FaTrophy, FaUserTie, FaClipboardList } from "react-icons/fa";
import GaugeComponent from "./GaugeComponent";
import teamsService from "../services/teamsService";

const TeamOverview = ({ team, teamColor, year = 2024 }) => {
  // State for coach and record data
  const [coachData, setCoachData] = useState(null);
  const [recordData, setRecordData] = useState(null);
  const [talentData, setTalentData] = useState(null);
  const [loading, setLoading] = useState({
    coach: false,
    record: false,
    talent: false
  });
  
  // Fetch coach data, record data, and talent data
  useEffect(() => {
    const fetchCoachData = async () => {
      try {
        setLoading(prev => ({ ...prev, coach: true }));
        const data = await teamsService.getCoaches();
        const teamCoach = data.find(coach => 
          coach.seasons.some(season => 
            season.school === team.school && season.year === year
          )
        );
        setCoachData(teamCoach);
      } catch (err) {
        console.error("Error fetching coach data:", err.message);
      } finally {
        setLoading(prev => ({ ...prev, coach: false }));
      }
    };

    const fetchRecordData = async () => {
      try {
        setLoading(prev => ({ ...prev, record: true }));
        const data = await teamsService.getTeamRecords(year);
        const teamRecord = data.find(record => record.team === team.school);
        setRecordData(teamRecord);
      } catch (err) {
        console.error("Error fetching record data:", err.message);
      } finally {
        setLoading(prev => ({ ...prev, record: false }));
      }
    };

    const fetchTalentData = async () => {
      try {
        setLoading(prev => ({ ...prev, talent: true }));
        const data = await teamsService.getTalentRankings(year);
        const teamTalent = data.find(talent => talent.team === team.school);
        setTalentData(teamTalent);
      } catch (err) {
        console.error("Error fetching talent data:", err.message);
      } finally {
        setLoading(prev => ({ ...prev, talent: false }));
      }
    };

    if (team?.school) {
      fetchCoachData();
      fetchRecordData();
      fetchTalentData();
    }
  }, [team?.school, year]);
  
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
    background: '#ffffff',
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
                <td>Team Spirit:</td>
                <td>
                  <div className="team-spirit-items">
                    {/* Team Logo Block */}
                    <div className="spirit-item logo-block">
                      <div className="logo-container" style={{ backgroundColor: team.alt_color || lightenColor(teamColor, 20) }}>
                        <img 
                          src={team.logos ? team.logos[0] : ''} 
                          alt={team.mascot || 'Team Logo'}
                          className="team-logo-stick"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = "/photos/default_team.png";
                          }}
                        />
                      </div>
                      <div className="wood-stick"></div>
                    </div>
                    
                    {/* Modern Foam Finger */}
                    <div className="spirit-item modern-finger">
                      <div className="finger-container" style={{ backgroundColor: teamColor }}>
                        <div className="finger-text" style={{ color: getContrastColor(teamColor) }}>
                          #1
                        </div>
                      </div>
                      <div className="wood-stick"></div>
                    </div>
                    
                    {/* Team Pennant */}
                    <div className="spirit-item modern-pennant">
                      <div className="pennant-container" style={{ background: teamColor }}>
                        <span style={{ color: getContrastColor(teamColor) }}>
                          {team.mascot}
                        </span>
                      </div>
                      <div className="wood-stick pennant-stick"></div>
                    </div>
                  </div>
                </td>
              </tr>
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
              {coachData && (
                <tr>
                  <td>
                    <div className="flex-align-center">
                      <FaUserTie size={14} style={{ marginRight: "6px", color: teamColor }} />
                      Coach:
                    </div>
                  </td>
                  <td>
                    <strong>
                      {coachData.firstName} {coachData.lastName}
                      {coachData.hireDate && (
                        <span className="coach-tenure">
                          Since {new Date(coachData.hireDate).getFullYear()}
                        </span>
                      )}
                    </strong>
                    {coachData.seasons && coachData.seasons.length > 0 && (
                      <div className="coach-record">
                        <span className="record-detail">
                          Record: {coachData.seasons[0].wins}-{coachData.seasons[0].losses}
                        </span>
                        {(coachData.seasons[0].preseasonRank || coachData.seasons[0].postseasonRank) && (
                          <span className="rank-detail">
                            {coachData.seasons[0].preseasonRank && (
                              <span className="preseason-rank">Preseason: #{coachData.seasons[0].preseasonRank}</span>
                            )}
                            {coachData.seasons[0].preseasonRank && coachData.seasons[0].postseasonRank && ' • '}
                            {coachData.seasons[0].postseasonRank && (
                              <span className="postseason-rank">Final: #{coachData.seasons[0].postseasonRank}</span>
                            )}
                          </span>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              )}
              {recordData && (
                <tr>
                  <td>
                    <div className="flex-align-center">
                      <FaClipboardList size={14} style={{ marginRight: "6px", color: teamColor }} />
                      Record ({year}):
                    </div>
                  </td>
                  <td>
                    <strong className="record-display">
                      {recordData.total.wins}-{recordData.total.losses}
                      <span className="record-detail">
                        (Conf: {recordData.conferenceGames.wins}-{recordData.conferenceGames.losses})
                      </span>
                    </strong>
                  </td>
                </tr>
              )}
              {talentData && (
                <tr>
                  <td>
                    <div className="flex-align-center">
                      <FaTrophy size={14} style={{ marginRight: "6px", color: teamColor }} />
                      Talent Rating:
                    </div>
                  </td>
                  <td>
                    <strong>
                      {talentData.talent.toFixed(2)}
                    </strong>
                  </td>
                </tr>
              )}
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
              align-items: flex-end;
              gap: 30px;
              padding: 20px 0 60px;
              margin-top: 10px;
            }
            
            .spirit-item {
              position: relative;
              cursor: pointer;
              transition: transform 0.3s ease-out;
              filter: drop-shadow(2px 4px 8px rgba(0,0,0,0.25));
              animation: subtle-float 3s ease-in-out infinite;
            }
            
            .spirit-item:hover {
              transform: translateY(-8px);
              animation-play-state: paused;
            }

            @keyframes subtle-float {
              0%, 100% { transform: translateY(0px); }
              50% { transform: translateY(-4px); }
            }

            /* Wooden sticks styling */
            .wood-stick {
              position: absolute;
              width: 8px;
              height: 60px;
              background-color: #8b4513; /* Wood color */
              bottom: -60px;
              left: calc(50% - 4px);
              border-radius: 2px;
              box-shadow: 1px 2px 3px rgba(0,0,0,0.2);
            }

            .pennant-stick {
              left: 0;
              bottom: -58px;
            }
            
            
            /* Logo Block */
            .logo-block {
              width: 60px;
              height: 60px;
              display: flex;
              justify-content: center;
              align-items: center;
            }

            .logo-container {
              width: 100%;
              height: 100%;
              border-radius: 10px;
              padding: 6px;
              display: flex;
              justify-content: center;
              align-items: center;
              box-shadow: 0 2px 4px rgba(0,0,0,0.2);
              background-color: white;
              overflow: hidden;
            }

            .team-logo-stick {
              width: 85%;
              height: 85%;
              object-fit: contain;
              filter: drop-shadow(0 1px 2px rgba(0,0,0,0.1));
            }
            
            /* Modern Foam Finger */
            .modern-finger {
              width: 55px;
              height: 70px;
              display: flex;
              justify-content: center;
              align-items: center;
            }

            .finger-container {
              width: 100%;
              height: 100%;
              border-radius: 12px 12px 8px 8px;
              display: flex;
              justify-content: center;
              align-items: center;
              box-shadow: 0 2px 4px rgba(0,0,0,0.2);
              position: relative;
            }
            
            .finger-text {
              font-weight: bold;
              font-size: 22px;
              text-shadow: 1px 1px 2px rgba(0,0,0,0.3);
            }
            
            /* Modern Pennant */
            .modern-pennant {
              width: 120px;
              height: 55px;
              display: flex;
              justify-content: center;
              align-items: center;
            }

            .pennant-container {
              width: 100%;
              height: 100%;
              display: flex;
              justify-content: center;
              align-items: center;
              clip-path: polygon(0 0, 100% 0, 85% 50%, 100% 100%, 0 100%);
              box-shadow: 0 2px 4px rgba(0,0,0,0.2);
            }
            
            .modern-pennant span {
              font-size: 16px;
              font-weight: bold;
              white-space: nowrap;
              text-shadow: 1px 1px 2px rgba(0,0,0,0.3);
            }
            
            /* Additional styling for new elements */
            .flex-align-center {
              display: flex;
              align-items: center;
            }

            .coach-tenure {
              font-size: 0.8rem;
              opacity: 0.8;
              margin-left: 8px;
              font-weight: normal;
            }

            .coach-record {
              margin-top: 5px;
              display: flex;
              flex-direction: column;
              gap: 4px;
            }

            .record-detail {
              font-size: 0.85rem;
              opacity: 0.8;
              font-weight: normal;
              display: inline-block;
            }

            .rank-detail {
              display: flex;
              gap: 10px;
              font-size: 0.8rem;
              color: #555;
              margin-top: 2px;
            }

            .preseason-rank, .postseason-rank {
              background-color: ${lightenColor(teamColor, 95)};
              border: 1px solid ${lightenColor(teamColor, 85)};
              border-radius: 3px;
              padding: 2px 5px;
              font-size: 0.75rem;
            }
          `}</style>
        </div>
      </div>
    </>
  );
};

export default TeamOverview;