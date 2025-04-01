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
    if (!color) return '#ffffff'; // Add a check for valid color
    const num = parseInt(color.replace('#', ''), 16),
          amt = Math.round(2.55 * percent),
          R = (num >> 16) + amt,
          G = (num >> 8 & 0x00FF) + amt,
          B = (num & 0x0000FF) + amt;
    // Ensure R,G,B stay within 0-255 range
    const R_clamped = Math.max(0, Math.min(255, R));
    const G_clamped = Math.max(0, Math.min(255, G));
    const B_clamped = Math.max(0, Math.min(255, B));
    return '#' + (0x1000000 + R_clamped * 0x10000 + G_clamped * 0x100 + B_clamped).toString(16).slice(1);
  };


  // Get contrast color for text based on background color
  const getContrastColor = (hexColor) => {
    if (!hexColor) return "#ffffff"; // Default contrast
    hexColor = hexColor.replace('#', '');
    if (hexColor.length === 3) { // Handle shorthand hex
        hexColor = hexColor.split('').map(char => char + char).join('');
    }
    if (hexColor.length !== 6) return "#ffffff"; // Invalid hex length

    const r = parseInt(hexColor.substr(0, 2), 16);
    const g = parseInt(hexColor.substr(2, 2), 16);
    const b = parseInt(hexColor.substr(4, 2), 16);
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return (yiq >= 128) ? '#000000' : '#ffffff';
  };

  // Helper function to darken a color
  const darkenColor = (color, percent) => {
    if (!color) return '#000000'; // Add a check for valid color
    const num = parseInt(color.replace('#', ''), 16),
          amt = Math.round(2.55 * percent),
          R = (num >> 16) - amt,
          G = (num >> 8 & 0x00FF) - amt,
          B = (num & 0x0000FF) - amt;
    // Ensure R,G,B stay within 0-255 range
    const R_clamped = Math.max(0, Math.min(255, R));
    const G_clamped = Math.max(0, Math.min(255, G));
    const B_clamped = Math.max(0, Math.min(255, B));
    return '#' + (0x1000000 + R_clamped * 0x10000 + G_clamped * 0x100 + B_clamped).toString(16).slice(1);
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
      "Miami": "UM", // Assuming 'UM' for Miami, adjust if needed
      "Mississippi": "Ole Miss", // Special case name, initial 'O' might be better?
      "Mississippi State": "MSU",
      "Southern Methodist": "SMU",
      "Brigham Young": "BYU"
    };

    // Handle special cases
    for (const [fullName, abbr] of Object.entries(specialCases)) {
      if (schoolName.includes(fullName)) {
        // Return first letter if abbreviation is too long or is a name like Ole Miss
        return abbr.length <= 2 && abbr !== "Ole Miss" ? abbr : abbr.charAt(0);
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
    borderBottom: `2px solid ${teamColor || '#cccccc'}`, // Added fallback color
    color: darkenColor(teamColor || '#cccccc', 20)      // Added fallback color
  };

  // Calculate contrasting text color once
  const contrastColor = getContrastColor(teamColor);
  const altContrastColor = getContrastColor(team.alt_color); // Contrast for alt color if needed

  // Get team conference
  const teamConference = team.conference || "Independent";

  return (
    <>
      {/* SP+ Ratings Card */}
      <div className="dashboard-card team-ratings-card">
        <div className="card-header" style={cardHeaderStyle}>
          <FaChartLine style={{ marginRight: "12px", color: teamColor || '#cccccc' }} />
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
              <h3 style={{ color: teamColor || '#333333' }}>How SP+ Ratings Work</h3>
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
          <FaInfoCircle style={{ marginRight: "12px", color: teamColor || '#cccccc' }} />
          About {team.school || 'Team'} {team.mascot || ''}
        </div>
        <div className="card-body">
          <table className="info-table">
            <tbody>
              <tr>
                <td>Team Spirit:</td>
                <td>
                  {/* MODIFIED: Removed sticks, enhanced styles below */}
                  <div className="team-spirit-items">
                    {/* Team Logo Block (Stick removed) */}
                    <div className="spirit-item logo-block">
                      <div className="logo-container" style={{ backgroundColor: team.alt_color || '#ffffff' }}> {/* Added fallback */}
                        <img
                          src={team.logos ? team.logos[0] : '/photos/default_team.png'} // Added default placeholder path
                          alt={team.mascot ? `${team.mascot} Logo` : 'Team Logo'} // Improved alt text
                          className="team-logo-stick"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = "/photos/default_team.png"; // Ensure fallback path is correct
                          }}
                        />
                      </div>
                      {/* <div className="wood-stick"></div> REMOVED STICK */}
                    </div>

                    {/* Modern Foam Finger (Stick removed, styles enhanced) */}
                    <div className="spirit-item modern-finger">
                      <div className="finger-container" style={{
                           // Gradient background using helpers, with fallback
                           background: `linear-gradient(145deg, ${lightenColor(teamColor || '#cccccc', 10)}, ${darkenColor(teamColor || '#999999', 10)})`,
                           }}>
                        <div className="finger-text" style={{ color: contrastColor }}>
                          #1
                        </div>
                      </div>
                      {/* <div className="wood-stick"></div> REMOVED STICK */}
                    </div>

                    {/* Team Pennant (Stick removed, styles enhanced) */}
                    <div className="spirit-item modern-pennant">
                      <div className="pennant-container" style={{
                            // Gradient background using helpers, with fallback
                           background: `linear-gradient(to right, ${teamColor || '#cccccc'}, ${darkenColor(teamColor || '#999999', 15)})`,
                           }}>
                        <span style={{ color: contrastColor }}>
                          {team.mascot || 'Team'} {/* Added fallback */}
                        </span>
                      </div>
                      {/* <div className="wood-stick pennant-stick"></div> REMOVED STICK */}
                    </div>
                  </div>
                </td>
              </tr>
              <tr>
                <td>Location:</td>
                <td><strong>{team.location?.city || 'N/A'}, {team.location?.state || 'N/A'}</strong></td>
              </tr>
              <tr>
                <td>Conference:</td>
                <td><strong>{teamConference}</strong></td>
              </tr>
              <tr>
                <td>Division:</td>
                <td><strong>Division I ({team.classification || 'FBS/FCS'})</strong></td>
              </tr>
              {coachData && (
                <tr>
                  <td>
                    <div className="flex-align-center">
                      <FaUserTie size={14} style={{ marginRight: "6px", color: teamColor || '#cccccc' }} />
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
                              <span className="preseason-rank" style={{ backgroundColor: lightenColor(teamColor || '#dddddd', 95), border: `1px solid ${lightenColor(teamColor || '#cccccc', 85)}` }}>Preseason: #{coachData.seasons[0].preseasonRank}</span>
                            )}
                            {coachData.seasons[0].preseasonRank && coachData.seasons[0].postseasonRank && ' • '}
                            {coachData.seasons[0].postseasonRank && (
                              <span className="postseason-rank" style={{ backgroundColor: lightenColor(teamColor || '#dddddd', 95), border: `1px solid ${lightenColor(teamColor || '#cccccc', 85)}` }}>Final: #{coachData.seasons[0].postseasonRank}</span>
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
                      <FaClipboardList size={14} style={{ marginRight: "6px", color: teamColor || '#cccccc' }} />
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
                      <FaTrophy size={14} style={{ marginRight: "6px", color: teamColor || '#cccccc' }} />
                      Talent Rating:
                    </div>
                  </td>
                  <td>
                    <strong>
                      {talentData.talent ? talentData.talent.toFixed(2) : 'N/A'}
                    </strong>
                  </td>
                </tr>
              )}
              <tr>
                <td>Team Colors:</td>
                <td>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <div style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      background: teamColor || '#cccccc', // Fallback color
                      border: '1px solid rgba(0,0,0,0.1)'
                    }}></div>
                    <strong>{teamColor || 'N/A'}</strong>
                    {/* Optionally display alt_color if available */}
                    {team.alt_color && (
                       <div style={{
                         width: '20px',
                         height: '20px',
                         borderRadius: '50%',
                         background: team.alt_color,
                         border: '1px solid rgba(0,0,0,0.1)',
                         marginLeft: '10px'
                       }}></div>
                    )}
                     {team.alt_color && (<strong>{team.alt_color}</strong>)}
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          {/* MODIFIED: Updated styles for spirit items */}
          <style jsx>{`
            .dashboard-card { /* Basic card styling example */
              background-color: #fff;
              border-radius: 8px;
              box-shadow: 0 2px 10px rgba(0,0,0,0.05);
              margin-bottom: 20px;
              overflow: hidden; /* Ensure header border radius works */
            }
            .card-header {
              padding: 12px 16px;
              font-weight: 600;
              font-size: 1.1rem;
              display: flex;
              align-items: center;
               /* Style set dynamically */
            }
            .card-body {
              padding: 16px;
            }

            .info-table {
              width: 100%;
              border-collapse: separate;
              border-spacing: 0;
              margin-top: 10px; /* Add some space above table */
            }

            /* Add hover effect to table rows */
            .info-table tr:hover {
               /* Using rgba for hover effect - 08 is approx 5% opacity */
              background-color: ${teamColor ? teamColor + '0D' : '#f0f0f0'};
            }

            .info-table td {
              padding: 10px 12px; /* Adjust padding */
              border-bottom: 1px solid #f0f0f0;
              vertical-align: middle; /* Default align middle */
              font-size: 0.95rem; /* Standardize font size */
            }

             .info-table tr:last-child td {
              border-bottom: none; /* Remove border for last row */
            }

            .info-table td:first-child {
              width: 150px; /* Slightly wider for "Team Spirit:" */
              color: #555;
              font-weight: 500;
              vertical-align: top; /* Align label to top */
              padding-top: 15px; /* Adjust padding for top alignment */
            }

            strong { /* Style for bolded text in table */
              font-weight: 600;
              color: #333;
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
               /* Use dynamic colors with fallbacks */
              background: linear-gradient(to right, ${teamColor || '#ccc'}, ${lightenColor(teamColor || '#ccc', 30)}, ${teamColor || '#ccc'});
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
              border: 1px solid #eee; /* Add subtle border */
            }

            .ratings-explanation h3 {
              margin-top: 0;
              margin-bottom: 0.75rem;
              color: ${teamColor || '#333333'}; /* Fallback color */
              font-weight: 600;
            }

            .ratings-explanation p {
              margin-bottom: 0.5rem; /* Adjust paragraph spacing */
            }
             .ratings-explanation strong {
              font-weight: 600;
              color: #444;
            }

            /* === Team Spirit Items Styling Updates === */
            .team-spirit-items {
              display: flex;
              justify-content: flex-start;
              align-items: center; /* Align items center vertically now */
              gap: 35px; /* Slightly increased gap */
              padding: 15px 0 15px; /* Adjusted padding as sticks are removed */
              margin-top: 5px;
              min-height: 80px; /* Ensure enough height */
              flex-wrap: wrap; /* Allow wrapping on smaller screens */
            }

            .spirit-item {
              position: relative;
              cursor: pointer;
              transition: transform 0.3s ease-out, filter 0.3s ease-out;
              /* Enhanced drop shadow for more depth */
              filter: drop-shadow(3px 5px 5px rgba(0,0,0,0.2));
              animation: subtle-float 4s ease-in-out infinite alternate; /* Slower, smoother float */
            }

            .spirit-item:hover {
              transform: translateY(-6px) scale(1.05); /* Add slight scale on hover */
              filter: drop-shadow(4px 7px 8px rgba(0,0,0,0.3)); /* Enhance shadow on hover */
              animation-play-state: paused;
            }

            @keyframes subtle-float {
              from { transform: translateY(0px); }
              to { transform: translateY(-5px); } /* Adjust float distance */
            }

            /* Wooden sticks styling REMOVED */
            /* .wood-stick { ... } */

            /* Logo Block - Styles adjusted slightly */
            .logo-block {
              width: 65px; /* Slightly larger */
              height: 65px;
              display: flex;
              justify-content: center;
              align-items: center;
            }

            .logo-container {
              width: 100%;
              height: 100%;
              border-radius: 12px; /* More rounded */
              padding: 8px;
              display: flex;
              justify-content: center;
              align-items: center;
              /* Use a subtle gradient or keep alt_color */
              background: ${team.alt_color ? `linear-gradient(145deg, ${lightenColor(team.alt_color, 5)}, ${darkenColor(team.alt_color, 5)})` : '#f0f0f0'};
              box-shadow: inset 0 1px 3px rgba(0,0,0,0.1), 0 2px 4px rgba(0,0,0,0.1); /* Inner and outer shadow */
              overflow: hidden;
              border: 1px solid rgba(0,0,0,0.05); /* Subtle border */
            }

            .team-logo-stick {
              max-width: 90%; /* Ensure logo fits well */
              max-height: 90%;
              object-fit: contain;
              /* Removed filter: drop-shadow - handled by spirit-item */
            }

            /* Modern Foam Finger - Enhanced Styles */
            .modern-finger {
              width: 60px; /* Slightly wider */
              height: 75px; /* Slightly taller */
              display: flex;
              justify-content: center;
              align-items: center;
            }

            .finger-container {
              width: 100%;
              height: 100%;
              border-radius: 15px 15px 10px 10px; /* More pronounced rounding */
              display: flex;
              justify-content: center;
              align-items: center;
              box-shadow: inset 0 -2px 4px rgba(0,0,0,0.15), /* Inner shadow bottom */
                          inset 0 1px 2px rgba(255,255,255,0.2); /* Inner highlight top */
              position: relative;
              /* Gradient set via inline style for dynamic color */
              border: 1px solid rgba(0,0,0,0.1); /* Subtle border */
              overflow: hidden; /* Ensure gradient doesn't bleed */
            }

            .finger-text {
              font-weight: 700; /* Bolder */
              font-size: 24px;
              /* Softer text shadow */
              text-shadow: 1px 1px 3px rgba(0,0,0,0.4);
              /* Color set via inline style */
              font-family: 'Arial Black', Gadget, sans-serif; /* Example sporty font */
               -webkit-font-smoothing: antialiased; /* Smoother text */
              -moz-osx-font-smoothing: grayscale;
            }

            /* Modern Pennant - Enhanced Styles */
            .modern-pennant {
              width: 130px; /* Slightly wider */
              height: 60px;
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
              /* Kept clip-path */
              clip-path: polygon(0 0, 100% 0, 85% 50%, 100% 100%, 0 100%);
              /* Gradient set via inline style */
               box-shadow: inset -2px 0px 4px rgba(0,0,0,0.15), /* Inner shadow left */
                           1px 1px 3px rgba(0,0,0,0.1); /* Subtle outer shadow */
              position: relative;
               border: 1px solid rgba(0,0,0,0.05); /* Very subtle border */
               overflow: hidden; /* Ensure gradient doesn't bleed */
            }

            /* Add a pseudo element for the 'pole sleeve' effect */
            .pennant-container::before {
              content: '';
              position: absolute;
              left: 0;
              top: 5%;
              bottom: 5%;
              width: 5px;
              background-color: rgba(0,0,0,0.1);
              border-radius: 3px;
              box-shadow: inset 1px 0px 2px rgba(0,0,0,0.1);
            }

            .modern-pennant span {
              font-size: 16px; /* Adjusted size */
              font-weight: 600; /* Slightly bolder */
              white-space: nowrap;
              overflow: hidden; /* Prevent overflow */
              text-overflow: ellipsis; /* Add ellipsis if too long */
              padding-left: 15px; /* Space for pseudo element */
              padding-right: 25px; /* Ensure text doesn't hit the point */
              /* Softer text shadow */
              text-shadow: 1px 1px 3px rgba(0,0,0,0.4);
              /* Color set via inline style */
               font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; /* Example clean font */
               -webkit-font-smoothing: antialiased; /* Smoother text */
              -moz-osx-font-smoothing: grayscale;
            }

            /* === Additional Helper Styles === */
            .flex-align-center {
              display: flex;
              align-items: center;
              gap: 6px; /* Add gap for icon and text */
            }

            .coach-tenure {
              font-size: 0.8rem;
              opacity: 0.8;
              margin-left: 8px;
              font-weight: normal;
              color: #666;
            }

            .coach-record {
              margin-top: 5px;
              display: flex;
              flex-direction: column;
              gap: 4px;
              font-size: 0.9rem; /* Slightly smaller */
            }

            .record-detail {
              font-size: 0.85rem;
              opacity: 0.8;
              font-weight: normal;
              display: inline-block;
              margin-left: 8px; /* Space out details */
              color: #666;
            }

            .record-display { /* Style for main W-L record */
               font-weight: 600;
            }

            .rank-detail {
              display: flex;
              flex-wrap: wrap; /* Allow wrapping */
              gap: 10px;
              font-size: 0.8rem;
              color: #555;
              margin-top: 4px; /* Space from record */
            }

            .preseason-rank, .postseason-rank {
              /* Background and border set dynamically */
              border-radius: 3px;
              padding: 2px 6px;
              font-size: 0.75rem;
              font-weight: 500;
              color: #333; /* Darker text for readability */
              white-space: nowrap; /* Prevent rank text wrapping */
            }

          `}</style>
        </div>
      </div>
    </>
  );
};

export default TeamOverview;