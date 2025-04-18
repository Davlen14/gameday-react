import React, { useState, useEffect } from "react";
import { FaChartLine, FaInfoCircle, FaFutbol, FaTrophy, FaUserTie, FaClipboardList } from "react-icons/fa";
import GaugeComponent from "./GaugeComponent";
import teamsService from "../services/teamsService";

// Conference logo mapping for FBS
const conferenceLogos = {
  ACC: "/photos/ACC.png",
  "American Athletic": "/photos/American Athletic.png",
  "Big 12": "/photos/Big 12.png",
  "Big Ten": "/photos/Big Ten.png",
  "Conference USA": "/photos/Conference USA.png",
  "FBS Independents": "/photos/FBS Independents.png",
  "Mid-American": "/photos/Mid-American.png",
  "Mountain West": "/photos/Mountain West.png",
  "Pac-12": "/photos/Pac-12.png",
  SEC: "/photos/SEC.png",
  Independent: "/photos/FBS Independents.png"
};

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
  // Added state for coach's career record at the school
  const [coachCareerRecord, setCoachCareerRecord] = useState({
    wins: 0,
    losses: 0,
    ties: 0
  });

  // Fetch coach data, record data, and talent data
  useEffect(() => {
    const fetchCoachData = async () => {
      try {
        setLoading(prev => ({ ...prev, coach: true }));
        const data = await teamsService.getCoaches();
        const teamCoach = data.find(coach =>
          coach.seasons.some(season =>
            season.school === team.school &&
            season.year === year &&
            season.wins !== undefined &&
            season.losses !== undefined
          )
        );

        if (teamCoach) {
          setCoachData(teamCoach);
          
          // Calculate career record at this school
          const schoolSeasons = teamCoach.seasons.filter(season => 
            season.school === team.school && 
            season.wins !== undefined && 
            season.losses !== undefined
          );
          
          // Aggregate all seasons at this school
          const careerRecord = schoolSeasons.reduce((acc, season) => {
            acc.wins += season.wins || 0;
            acc.losses += season.losses || 0;
            acc.ties += season.ties || 0;
            return acc;
          }, { wins: 0, losses: 0, ties: 0 });
          
          setCoachCareerRecord(careerRecord);
        }
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
        
        // Add safety check for getTalentRankings function
        if (typeof teamsService.getTalentRankings === 'function') {
          const data = await teamsService.getTalentRankings(year);
          const teamTalent = data.find(talent => talent.team === team.school);
          setTalentData(teamTalent);
        } else {
          console.warn('getTalentRankings function not available in teamsService');
          // Try alternative method - if there's talent info in the team object
          if (team && team.talent) {
            setTalentData({ team: team.school, talent: team.talent });
          }
        }
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

  // Find coach's hire year
  const getCoachHireYear = () => {
    if (!coachData || !coachData.hireDate) return null;
    return new Date(coachData.hireDate).getFullYear();
  };

  // Get coach tenure text
  const getCoachTenureText = () => {
    const hireYear = getCoachHireYear();
    if (!hireYear) return "";
    
    return `Since ${hireYear}`;
  };

  // Find the latest season for the coach
  const getLatestSeason = () => {
    if (!coachData || !coachData.seasons || coachData.seasons.length === 0) return null;
    
    return [...coachData.seasons]
      .filter(season => season.school === team.school)
      .sort((a, b) => b.year - a.year)[0];
  };

  // Get preseason and postseason ranks
  const getSeasonRanks = () => {
    const latestSeason = getLatestSeason();
    if (!latestSeason) return { preseason: null, postseason: null };
    
    return {
      preseason: latestSeason.preseasonRank,
      postseason: latestSeason.postseasonRank
    };
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

  // Get conference logo if available
  const conferenceLogoSrc = conferenceLogos[teamConference] || conferenceLogos["Independent"];

  // Get ranks for display
  const ranks = getSeasonRanks();

  return (
    <>
      {/* SP+ Ratings Card */}
      <div className="dashboard-card team-ratings-card">
        <div className="card-header" style={cardHeaderStyle}>
          <FaChartLine style={{ marginRight: "12px", color: teamColor || '#cccccc' }} />
          SP+ Ratings
        </div>
        <div className="card-body">
          {/* Using the GaugeComponent */}
          <GaugeComponent
            teamName={team.school}
            year={year}
            teamColor={teamColor}
          />
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
                  <div className="team-spirit-items">
                    {/* Team Logo Block */}
                    <div className="spirit-item logo-block">
                      <div className="logo-container" style={{ backgroundColor: team.alt_color || '#ffffff' }}>
                        <img
                          src={team.logos ? team.logos[0] : '/photos/default_team.png'}
                          alt={team.mascot ? `${team.mascot} Logo` : 'Team Logo'}
                          className="team-logo-stick"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = "/photos/default_team.png";
                          }}
                        />
                      </div>
                    </div>

                    {/* Modern Foam Finger */}
                    <div className="spirit-item modern-finger">
                      <div className="finger-container" style={{
                           background: `linear-gradient(145deg, ${lightenColor(teamColor || '#cccccc', 10)}, ${darkenColor(teamColor || '#999999', 10)})`,
                           }}>
                        <div className="finger-text" style={{ color: contrastColor }}>
                          #1
                        </div>
                      </div>
                    </div>

                    {/* Team Pennant */}
                    <div className="spirit-item modern-pennant">
                      <div className="pennant-container" style={{
                           background: `linear-gradient(to right, ${teamColor || '#cccccc'}, ${darkenColor(teamColor || '#999999', 15)})`,
                           }}>
                        <span style={{ color: contrastColor }}>
                          {team.mascot || 'Team'}
                        </span>
                      </div>
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
                <td>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <img
                      src={conferenceLogoSrc}
                      alt={teamConference}
                      style={{ height: "1em", width: "auto", verticalAlign: "middle" }}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "/photos/default_conference.png";
                      }}
                    />
                    <strong style={{ fontSize: "1em", verticalAlign: "middle" }}>{teamConference}</strong>
                  </div>
                </td>
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
                      {getCoachHireYear() && (
                        <span className="coach-tenure">
                          {getCoachTenureText()}
                        </span>
                      )}
                    </strong>
                    <div className="coach-record">
                      <span className="record-detail">
                        Career at {team.school}: {coachCareerRecord.wins}-{coachCareerRecord.losses}
                        {coachCareerRecord.ties > 0 ? `-${coachCareerRecord.ties}` : ''}
                      </span>
                      {(ranks.preseason || ranks.postseason) && (
                        <span className="rank-detail">
                          {ranks.preseason && (
                            <span className="preseason-rank" style={{ backgroundColor: lightenColor(teamColor || '#dddddd', 95), border: `1px solid ${lightenColor(teamColor || '#cccccc', 85)}` }}>
                              Preseason: #{ranks.preseason}
                            </span>
                          )}
                          {ranks.preseason && ranks.postseason && ' • '}
                          {ranks.postseason && (
                            <span className="postseason-rank" style={{ backgroundColor: lightenColor(teamColor || '#dddddd', 95), border: `1px solid ${lightenColor(teamColor || '#cccccc', 85)}` }}>
                              Final: #{ranks.postseason}
                            </span>
                          )}
                        </span>
                      )}
                    </div>
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
              {(talentData || team.talent) && (
                <tr>
                  <td>
                    <div className="flex-align-center">
                      <FaTrophy size={14} style={{ marginRight: "6px", color: teamColor || '#cccccc' }} />
                      Talent Rating:
                    </div>
                  </td>
                  <td>
                    <strong>
                      {talentData ? 
                        (talentData.talent ? talentData.talent.toFixed(2) : 'N/A') : 
                        (team.talent ? team.talent.toFixed(2) : 'N/A')}
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
                      background: teamColor || '#cccccc',
                      border: '1px solid rgba(0,0,0,0.1)'
                    }}></div>
                    <strong>{teamColor || 'N/A'}</strong>
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

          <style jsx>{`
            .dashboard-card {
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
            }
            .card-body {
              padding: 16px;
            }
            .info-table {
              width: 100%;
              border-collapse: separate;
              border-spacing: 0;
              margin-top: 10px;
            }
            .info-table tr:hover {
              background-color: ${teamColor ? teamColor + '0D' : '#f0f0f0'};
            }
            .info-table td {
              padding: 10px 12px;
              border-bottom: 1px solid #f0f0f0;
              vertical-align: middle;
              font-size: 0.95rem;
            }
            .info-table tr:last-child td {
              border-bottom: none;
            }
            .info-table td:first-child {
              width: 150px;
              color: #555;
              font-weight: 500;
              vertical-align: top;
              padding-top: 15px;
            }
            strong {
              font-weight: 600;
              color: #333;
            }
            .team-spirit-items {
              display: flex;
              justify-content: flex-start;
              align-items: center;
              gap: 35px;
              padding: 15px 0 15px;
              margin-top: 5px;
              min-height: 80px;
              flex-wrap: wrap;
            }
            .spirit-item {
              position: relative;
              cursor: pointer;
              transition: transform 0.3s ease-out, filter 0.3s ease-out;
              filter: drop-shadow(3px 5px 5px rgba(0,0,0,0.2));
              animation: subtle-float 4s ease-in-out infinite alternate;
            }
            .spirit-item:hover {
              transform: translateY(-6px) scale(1.05);
              filter: drop-shadow(4px 7px 8px rgba(0,0,0,0.3));
              animation-play-state: paused;
            }
            @keyframes subtle-float {
              from { transform: translateY(0px); }
              to { transform: translateY(-5px); }
            }
            .logo-block {
              width: 65px;
              height: 65px;
              display: flex;
              justify-content: center;
              align-items: center;
            }
            .logo-container {
              width: 100%;
              height: 100%;
              border-radius: 12px;
              padding: 8px;
              display: flex;
              justify-content: center;
              align-items: center;
              background: ${team.alt_color ? `linear-gradient(145deg, ${lightenColor(team.alt_color, 5)}, ${darkenColor(team.alt_color, 5)})` : '#f0f0f0'};
              box-shadow: inset 0 1px 3px rgba(0,0,0,0.1), 0 2px 4px rgba(0,0,0,0.1);
              overflow: hidden;
              border: 1px solid rgba(0,0,0,0.05);
            }
            .team-logo-stick {
              max-width: 90%;
              max-height: 90%;
              object-fit: contain;
            }
            .modern-finger {
              width: 60px;
              height: 75px;
              display: flex;
              justify-content: center;
              align-items: center;
            }
            .finger-container {
              width: 100%;
              height: 100%;
              border-radius: 15px 15px 10px 10px;
              display: flex;
              justify-content: center;
              align-items: center;
              box-shadow: inset 0 -2px 4px rgba(0,0,0,0.15), inset 0 1px 2px rgba(255,255,255,0.2);
              position: relative;
              border: 1px solid rgba(0,0,0,0.1);
              overflow: hidden;
            }
            .finger-text {
              font-weight: 700;
              font-size: 24px;
              text-shadow: 1px 1px 3px rgba(0,0,0,0.4);
              font-family: 'Arial Black', Gadget, sans-serif;
              -webkit-font-smoothing: antialiased;
              -moz-osx-font-smoothing: grayscale;
            }
            .modern-pennant {
              width: 130px;
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
              clip-path: polygon(0 0, 100% 0, 85% 50%, 100% 100%, 0 100%);
              box-shadow: inset -2px 0px 4px rgba(0,0,0,0.15), 1px 1px 3px rgba(0,0,0,0.1);
              position: relative;
              border: 1px solid rgba(0,0,0,0.05);
              overflow: hidden;
            }
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
              font-size: 16px;
              font-weight: 600;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
              padding-left: 15px;
              padding-right: 25px;
              text-shadow: 1px 1px 3px rgba(0,0,0,0.4);
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              -webkit-font-smoothing: antialiased;
              -moz-osx-font-smoothing: grayscale;
            }
            .flex-align-center {
              display: flex;
              align-items: center;
              gap: 6px;
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
              font-size: 0.9rem;
            }
            .record-detail {
              font-size: 0.85rem;
              opacity: 0.8;
              font-weight: normal;
              display: inline-block;
              margin-left: 8px;
              color: #666;
            }
            .record-display {
              font-weight: 600;
            }
            .rank-detail {
              display: flex;
              flex-wrap: wrap;
              gap: 10px;
              font-size: 0.8rem;
              color: #555;
              margin-top: 4px;
            }
            .preseason-rank, .postseason-rank {
              border-radius: 3px;
              padding: 2px 6px;
              font-size: 0.75rem;
              font-weight: 500;
              color: #333;
              white-space: nowrap;
            }
          `}</style>
        </div>
      </div>
    </>
  );
};

export default TeamOverview;