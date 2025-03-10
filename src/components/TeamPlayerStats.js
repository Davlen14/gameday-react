import React, { useState, useEffect } from "react";
import teamsService from "../services/teamsService";
// Import react-icons
import { FaTrophy, FaFootballBall, FaInfoCircle, FaArrowUp, FaArrowDown, FaChartBar } from "react-icons/fa";
import { BiRun, BiFootball } from "react-icons/bi";
import { GiAmericanFootballHelmet, GiAmericanFootballPlayer } from "react-icons/gi";
import { MdSportsFootball, MdQueryStats, MdCategory, MdLeaderboard } from "react-icons/md";
import { IoMdStats, IoMdInformationCircleOutline } from "react-icons/io";
import { BsArrowRepeat, BsSearch, BsChevronRight } from "react-icons/bs";
import { AiOutlineLoading3Quarters, AiOutlineWarning } from "react-icons/ai";

const TeamPlayerStats = ({ teamName, year = 2024, teamColor }) => {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showInfoCard, setShowInfoCard] = useState(false);
  const [selectedStat, setSelectedStat] = useState(null);

  // Default to red if no team color is provided
  const accentColor = teamColor || "#D4001C";
  
  // Generate a lighter variation of the team color for gradients
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
  
  // Generate a darker variation of the team color
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
  
  // Color for gradient effects
  const accentColorLight = lightenColor(accentColor, 20);
  const accentColorDark = darkenColor(accentColor, 20);
  
  // Get contrast color for text
  const getContrastColor = (hexColor) => {
    hexColor = hexColor.replace('#', '');
    const r = parseInt(hexColor.substr(0, 2), 16);
    const g = parseInt(hexColor.substr(2, 2), 16);
    const b = parseInt(hexColor.substr(4, 2), 16);
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return (yiq >= 128) ? '#000000' : '#ffffff';
  };
  
  // Determine text color to use against team color background
  const contrastColor = getContrastColor(accentColor);

  useEffect(() => {
    const fetchPlayerStats = async () => {
      try {
        setLoading(true);
        // Fetch PPA player data for the given team and year
        const data = await teamsService.getPPAPlayers(teamName, year);
        setPlayers(data);
      } catch (err) {
        setError(err.message || "Error fetching player stats.");
      } finally {
        setLoading(false);
      }
    };

    if (teamName) {
      fetchPlayerStats();
    }
  }, [teamName, year]);

  // Helper function to determine color based on value
  const getValueColor = (value, category) => {
    // Customized thresholds based on the stat category
    const thresholds = {
      default: { low: 0, medium: 0.5 },
      all: { low: 0.2, medium: 0.5 },
      pass: { low: 0.3, medium: 0.6 },
      rush: { low: 0.2, medium: 0.4 },
    };
    
    const { low, medium } = thresholds[category] || thresholds.default;
    
    if (value === null || value === undefined || isNaN(value)) return "";
    if (value < low) return "low-value";
    if (value < medium) return "medium-value";
    return "high-value";
  };

  // Get appropriate icon for position
  const getPositionIcon = (position) => {
    const positionMap = {
      'QB': <MdSportsFootball className="position-icon" />,
      'RB': <BiRun className="position-icon" />,
      'WR': <BiFootball className="position-icon" />,
      'TE': <GiAmericanFootballPlayer className="position-icon" />,
      'OL': <GiAmericanFootballPlayer className="position-icon" />,
      'DL': <GiAmericanFootballPlayer className="position-icon" />,
      'LB': <GiAmericanFootballPlayer className="position-icon" />,
      'DB': <GiAmericanFootballPlayer className="position-icon" />,
      'K': <FaFootballBall className="position-icon" />
    };
    
    return positionMap[position] || <GiAmericanFootballHelmet className="position-icon" />;
  };

  // Helper function to get info for stats
  const getStatInfo = (stat) => {
    const statInfoMap = {
      all: "Overall average PPA (Predicted Points Added) across all plays. This measures a player's total contribution.",
      pass: "Average PPA on passing plays. Higher values indicate more effective passing contributions.",
      rush: "Average PPA on rushing plays. Higher values indicate more effective rushing contributions.",
      firstDown: "Average PPA on first down plays. Shows effectiveness at starting drives.",
      secondDown: "Average PPA on second down plays. Indicates ability to create manageable third downs.",
      thirdDown: "Average PPA on third down plays. Measures ability to convert crucial downs.",
      standardDowns: "Average PPA on standard downs (likely to gain enough yardage). Shows baseline effectiveness.",
      passingDowns: "Average PPA on obvious passing downs. Indicates performance under pressure situations.",
      totalAll: "Total cumulative PPA across all plays. This measures overall impact on the season.",
      totalPass: "Total cumulative PPA on passing plays for the season.",
      totalRush: "Total cumulative PPA on rushing plays for the season.",
    };
    
    return statInfoMap[stat] || "Statistical measurement of player performance";
  };

  if (loading) {
    return (
      <div className="team-player-stats">
        <div className="loading-container">
          <div className="loading-spinner">
            <AiOutlineLoading3Quarters className="spinner-icon" />
          </div>
          <div className="loading-text">Loading player statistics...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="team-player-stats">
        <div className="error-container">
          <div className="error-icon">
            <AiOutlineWarning />
          </div>
          <div className="error-message">Error: {error}</div>
          <button className="retry-button" onClick={() => window.location.reload()}>
            <BsArrowRepeat className="button-icon" /> Retry
          </button>
        </div>
      </div>
    );
  }

  // Sort players by overall impact (totalPPA.all) in descending order
  const sortedPlayers = [...players].sort(
    (a, b) => b.totalPPA.all - a.totalPPA.all
  );
  
  // Identify the top 5 impact players
  const impactPlayers = sortedPlayers.slice(0, 5);
  
  // Remaining players for the table
  const remainingPlayers = sortedPlayers.slice(5);

  // Helper function to get stat trend icon
  const getStatTrendIcon = (value) => {
    if (value > 0.5) return <FaArrowUp className="trend-icon positive" />;
    if (value < 0) return <FaArrowDown className="trend-icon negative" />;
    return null;
  };

  return (
    <div className="team-player-stats">
      <div className="stats-header">
      <h1>
        <GiAmericanFootballHelmet className="team-icon" />
        <span style={{ color: "#000000" }}>{teamName} Player Stats</span>
        <span className="year-badge">{year}</span>
        </h1>
        <button 
          className="info-button" 
          onClick={() => setShowInfoCard(!showInfoCard)}
        >
          <FaInfoCircle className="button-icon" />
          {showInfoCard ? "Hide Stat Definitions" : "What Do These Stats Mean?"}
        </button>
      </div>

      {showInfoCard && (
        <div className="info-card">
          <div className="info-card-header">
            <h3>
              <IoMdInformationCircleOutline className="card-header-icon" />
              Understanding PPA (Predicted Points Added) Statistics
            </h3>
            <button className="close-button" onClick={() => setShowInfoCard(false)}>×</button>
          </div>
          <div className="info-card-content">
            <p>PPA measures the expected points added on each play, based on down, distance, and field position. Higher values indicate more positive contributions.</p>
            
            <div className="stat-definitions">
              <div className="stat-definition">
                <h4>
                  <IoMdStats className="stat-icon" /> Average PPA
                </h4>
                <p>The average points contribution per play type. Higher is better.</p>
              </div>
              <div className="stat-definition">
                <h4>
                  <MdLeaderboard className="stat-icon" /> Total PPA
                </h4>
                <p>The cumulative sum of all PPA values. Represents overall season impact.</p>
              </div>
              <div className="legend">
                <div className="legend-item">
                  <span className="legend-color high-legend"></span>
                  <span>High Impact</span>
                </div>
                <div className="legend-item">
                  <span className="legend-color medium-legend"></span>
                  <span>Medium Impact</span>
                </div>
                <div className="legend-item">
                  <span className="legend-color low-legend"></span>
                  <span>Low Impact</span>
                </div>
              </div>
            </div>
            
            {selectedStat && (
              <div className="selected-stat-info">
                <h4>
                  <MdQueryStats className="stat-icon" /> {selectedStat}
                </h4>
                <p>{getStatInfo(selectedStat)}</p>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="impact-players-section">
        <h2 className="section-title">
          <FaTrophy className="section-icon" /> Top Impact Players
        </h2>
        <div className="impact-players-container">
          {impactPlayers.map((player, index) => (
            <div className="impact-player-card" key={player.id}>
              <div className="player-card-inner">
                <div className="player-image-container">
                  <div className="player-avatar">
                    {player.name.split(" ").map(name => name[0]).join("")}
                  </div>
                  <div className="player-position">
                    {getPositionIcon(player.position)} {player.position}
                  </div>
                </div>
                <div className="player-info">
                  <h3 className="player-name">{player.name}</h3>
                  <div className="player-rank">
                    <span className="rank-number">#{index + 1}</span> Impact Player
                  </div>
                  <div className="player-stats">
                    <div className="stat-box">
                      <div className="stat-value">
                        {player.totalPPA.all.toFixed(2)}
                        {getStatTrendIcon(player.totalPPA.all)}
                      </div>
                      <div className="stat-label">
                        <MdLeaderboard className="stat-label-icon" /> Total PPA
                      </div>
                    </div>
                    <div className="stat-box">
                      <div className="stat-value">
                        {player.averagePPA.all.toFixed(2)}
                        {getStatTrendIcon(player.averagePPA.all)}
                      </div>
                      <div className="stat-label">
                        <IoMdStats className="stat-label-icon" /> Avg PPA
                      </div>
                    </div>
                    <div className="stat-box">
                      <div className="stat-value">
                        {Math.max(player.averagePPA.pass, player.averagePPA.rush).toFixed(2)}
                        {getStatTrendIcon(Math.max(player.averagePPA.pass, player.averagePPA.rush))}
                      </div>
                      <div className="stat-label">
                        {player.averagePPA.pass > player.averagePPA.rush ? (
                          <><MdSportsFootball className="stat-label-icon" /> Pass</>
                        ) : (
                          <><BiRun className="stat-label-icon" /> Rush</>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="regular-players-section">
        <h2 className="section-title">
          <MdCategory className="section-icon" /> All Players Statistics
        </h2>
        <div className="table-container">
          <table className="stats-table">
            <thead>
              <tr>
                <th rowSpan="2" className="sticky-col">Player</th>
                <th colSpan="4">
                  <IoMdStats className="header-icon" /> Average PPA
                </th>
                <th colSpan="4">
                  <MdLeaderboard className="header-icon" /> Total PPA
                </th>
              </tr>
              <tr>
                <th 
                  onClick={() => setSelectedStat("all")}
                  className={selectedStat === "all" ? "selected-header" : ""}
                >All</th>
                <th 
                  onClick={() => setSelectedStat("pass")}
                  className={selectedStat === "pass" ? "selected-header" : ""}
                >
                  <MdSportsFootball className="stat-type-icon" /> Pass
                </th>
                <th 
                  onClick={() => setSelectedStat("rush")}
                  className={selectedStat === "rush" ? "selected-header" : ""}
                >
                  <BiRun className="stat-type-icon" /> Rush
                </th>
                <th 
                  onClick={() => setSelectedStat("thirdDown")}
                  className={selectedStat === "thirdDown" ? "selected-header" : ""}
                >3rd Down</th>
                <th 
                  onClick={() => setSelectedStat("totalAll")}
                  className={selectedStat === "totalAll" ? "selected-header" : ""}
                >All</th>
                <th 
                  onClick={() => setSelectedStat("totalPass")}
                  className={selectedStat === "totalPass" ? "selected-header" : ""}
                >
                  <MdSportsFootball className="stat-type-icon" /> Pass
                </th>
                <th 
                  onClick={() => setSelectedStat("totalRush")}
                  className={selectedStat === "totalRush" ? "selected-header" : ""}
                >
                  <BiRun className="stat-type-icon" /> Rush
                </th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {remainingPlayers.map((player) => (
                <tr key={player.id}>
                  <td className="player-cell sticky-col">
                    <div className="table-player-info">
                      <div className="table-player-avatar">
                        {player.name.split(" ").map(name => name[0]).join("")}
                      </div>
                      <div className="table-player-details">
                        <div className="table-player-name">{player.name}</div>
                        <div className="table-player-position">
                          {getPositionIcon(player.position)} {player.position}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className={getValueColor(player.averagePPA.all, "all")}>
                    {player.averagePPA.all.toFixed(2)}
                    {getStatTrendIcon(player.averagePPA.all)}
                  </td>
                  <td className={getValueColor(player.averagePPA.pass, "pass")}>
                    {player.averagePPA.pass.toFixed(2)}
                    {getStatTrendIcon(player.averagePPA.pass)}
                  </td>
                  <td className={getValueColor(player.averagePPA.rush, "rush")}>
                    {player.averagePPA.rush.toFixed(2)}
                    {getStatTrendIcon(player.averagePPA.rush)}
                  </td>
                  <td className={getValueColor(player.averagePPA.thirdDown, "thirdDown")}>
                    {player.averagePPA.thirdDown.toFixed(2)}
                    {getStatTrendIcon(player.averagePPA.thirdDown)}
                  </td>
                  <td className={getValueColor(player.totalPPA.all, "all")}>
                    {player.totalPPA.all.toFixed(2)}
                    {getStatTrendIcon(player.totalPPA.all)}
                  </td>
                  <td className={getValueColor(player.totalPPA.pass, "pass")}>
                    {player.totalPPA.pass.toFixed(2)}
                    {getStatTrendIcon(player.totalPPA.pass)}
                  </td>
                  <td className={getValueColor(player.totalPPA.rush, "rush")}>
                    {player.totalPPA.rush.toFixed(2)}
                    {getStatTrendIcon(player.totalPPA.rush)}
                  </td>
                  <td>
                    <button className="view-details-button">
                      <BsSearch className="button-icon" /> View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

{/* Embedded CSS for modern styling */}
<style>{`
  /* CSS Variable setup using team color */
  :root {
    --accent-color: ${accentColor};
    --accent-color-light: ${accentColorLight};
    --accent-color-dark: ${accentColorDark};
    --contrast-text: ${contrastColor};
    --primary-color: #ffffff;
    --text-color: #333333;
    --secondary-text-color: #666666;
    --background-color: #f5f5f5;
    --border-color: #ffffff;
  }

  .team-player-stats {
    font-family: 'Inter', 'Helvetica Neue', Helvetica, Arial, sans-serif;
    padding: 30px;
    background: var(--background-color);
    color: var(--text-color);
    line-height: 1.6;
    max-width: 95%;
    margin: 0 auto;
    border-radius: 12px;
    box-shadow: 0 4px 10px rgba(0,0,0,0.08);
  }

  /* Header Styles */
  .stats-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 30px;
    padding-bottom: 15px;
    border-bottom: 2px solid var(--border-color);
  }

  h1 {
    font-size: 2.2rem;
    font-weight: 700;
    margin: 0;
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .team-icon {
    font-size: 2.2rem;
    color: var(--accent-color);
  }

  .year-badge {
    background: linear-gradient(135deg, var(--accent-color), var(--accent-color-light));
    color: var(--contrast-text);
    padding: 6px 14px;
    border-radius: 20px;
    font-size: 0.9rem;
    font-weight: 600;
    box-shadow: 0 3px 6px ${accentColor}50;
  }

.section-title {
  font-size: 1.6rem;
  font-weight: 700;
  margin: 40px 0 25px;
  position: relative;
  display: flex;
  align-items: center;
  gap: 10px;
}

.section-icon {
  color: var(--accent-color);
  font-size: 1.5rem;
}

/* Change this part to use a solid color instead of gradient */
.section-title:after {
  content: '';
  position: absolute;
  bottom: -8px;
  left: 0;
  width: 80px;
  height: 4px;
  background: var(--accent-color); /* Changed from gradient to solid color */
  border-radius: 2px;
}

  /* Button Icons */
  .button-icon {
    margin-right: 6px;
    vertical-align: -0.125em;
  }

  /* Impact Players Cards */
  .impact-players-container {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: 25px;
    margin-bottom: 50px;
  }

  .impact-player-card {
    background: var(--primary-color);
    border-radius: 16px;
    overflow: hidden;
    transition: transform 0.4s, box-shadow 0.4s;
    perspective: 1000px;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.12);
    position: relative;
  }

  .impact-player-card:hover {
    transform: translateY(-15px) scale(1.02);
    box-shadow: 0 20px 35px ${accentColor}30;
  }

  .impact-player-card:before {
    content: '';
    position: absolute;
    top: -5px;
    left: -5px;
    right: -5px;
    bottom: -5px;
    background: linear-gradient(135deg, var(--accent-color), transparent 60%);
    z-index: -1;
    border-radius: 20px;
    opacity: 0;
    transition: opacity 0.4s;
  }

  .impact-player-card:hover:before {
    opacity: 0.8;
  }

  .player-card-inner {
    background: linear-gradient(180deg, #ffffff 0%, #f9f9f9 100%);
    border-radius: 16px;
    overflow: hidden;
    height: 100%;
    transform-style: preserve-3d;
    transition: all 0.5s ease;
  }

  .player-image-container {
    background: linear-gradient(135deg, var(--accent-color), var(--accent-color-light));
    padding: 30px 20px;
    display: flex;
    flex-direction: column;
    align-items: center;
    position: relative;
  }

  .player-avatar {
    width: 90px;
    height: 90px;
    border-radius: 50%;
    background: var(--primary-color);
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'Orbitron', sans-serif;
    font-size: 2rem;
    font-weight: 700;
    color: var(--accent-color);
    box-shadow: 0 8px 15px rgba(0,0,0,0.2);
    z-index: 2;
    position: relative;
    transform: translateZ(20px);
    letter-spacing: -1px;
  }

  .player-position {
    background: rgba(255, 255, 255, 0.95);
    color: var(--accent-color);
    padding: 6px 14px;
    border-radius: 20px;
    font-family: 'Orbitron', sans-serif;
    font-weight: 600;
    font-size: 0.8rem;
    position: absolute;
    bottom: -12px;
    z-index: 3;
    box-shadow: 0 4px 10px rgba(0,0,0,0.15);
    display: flex;
    align-items: center;
    gap: 5px;
  }

  .position-icon {
    font-size: 1.1em;
  }

  .player-info {
    padding: 35px 20px 25px;
    text-align: center;
  }

  .player-name {
    margin: 0 0 8px;
    font-family: 'Orbitron', sans-serif;
    font-size: 1.3rem;
    font-weight: 700;
    color: var(--text-color);
    letter-spacing: 0.5px;
  }

  .player-rank {
    color: var(--secondary-text-color);
    font-family: 'Orbitron', sans-serif;
    font-size: 0.9rem;
    margin-bottom: 20px;
    font-weight: 500;
  }

  .rank-number {
    display: inline-block;
    background: var(--accent-color);
    color: var(--contrast-text);
    padding: 3px 8px;
    border-radius: 6px;
    font-family: 'Orbitron', sans-serif;
    font-weight: 600;
    margin-right: 4px;
  }

  .player-stats {
    display: flex;
    justify-content: space-between;
    margin-top: 20px;
    padding-top: 20px;
    border-top: 1px solid rgba(0,0,0,0.08);
  }

  .stat-box {
    flex: 1;
    text-align: center;
    position: relative;
    padding: 0 5px;
  }

  .stat-box:not(:last-child):after {
    content: '';
    position: absolute;
    right: 0;
    top: 10%;
    height: 80%;
    width: 1px;
    background: rgba(0,0,0,0.08);
  }

  .stat-value {
    font-size: 1.3rem;
    font-family: 'Orbitron', sans-serif;
    font-weight: 700;
    color: var(--accent-color);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
  }

  .trend-icon {
    font-size: 0.8em;
  }

  .trend-icon.positive {
    color: #16a34a;
  }

  .trend-icon.negative {
    color: #dc2626;
  }

  .stat-label {
    font-size: 0.75rem;
    font-family: 'Orbitron', sans-serif;
    color: var(--secondary-text-color);
    margin-top: 5px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
  }

  .stat-label-icon {
    font-size: 1.1em;
  }

  /* Regular Players Table */
  .table-container {
    overflow-x: auto;
    border-radius: 10px;
    box-shadow: 0 8px 20px rgba(0,0,0,0.1);
    background: var(--primary-color);
  }

  .stats-table {
    width: 100%;
    border-collapse: collapse;
    white-space: nowrap;
  }

  .stats-table th, .stats-table td {
    padding: 14px 16px;
    text-align: center;
    border-bottom: 1px solid rgba(0,0,0,0.06);
    font-size: 0.9rem;
  }

  .stats-table th {
    background-color: rgba(0,0,0,0.03);
    font-weight: 600;
    color: var(--text-color);
    position: sticky;
    top: 0;
    z-index: 10;
    cursor: pointer;
    transition: background-color 0.2s;
  }

  .header-icon {
    margin-right: 6px;
    vertical-align: -0.125em;
    font-size: 1.1em;
    color: var(--accent-color);
  }

  .stat-type-icon {
    vertical-align: -0.125em;
    margin-right: 3px;
    font-size: 1em;
    color: var(--accent-color);
  }

  .stats-table th:hover {
    background-color: ${accentColor}10;
  }

  .stats-table th.selected-header {
    background-color: ${accentColor}20;
    color: var(--accent-color);
    box-shadow: inset 0 -2px 0 var(--accent-color);
  }

  .sticky-col {
    position: sticky;
    left: 0;
    background-color: var(--background-color);
    z-index: 9;
    border-right: 1px solid rgba(0,0,0,0.06);
  }

  .stats-table tr:hover td {
    background-color: ${accentColor}05;
  }

  .table-player-info {
    display: flex;
    align-items: center;
    gap: 12px;
    min-width: 180px;
    padding: 5px 0;
  }

  .table-player-avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: linear-gradient(135deg, var(--accent-color), var(--accent-color-light));
    color: var(--contrast-text);
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
    font-size: 0.9rem;
    flex-shrink: 0;
    box-shadow: 0 3px 6px rgba(0,0,0,0.1);
  }

  .table-player-details {
    text-align: left;
  }

  .table-player-name {
    font-weight: 600;
    font-size: 0.95rem;
    color: var(--text-color);
  }

  .table-player-position {
    font-size: 0.75rem;
    color: var(--secondary-text-color);
    margin-top: 3px;
    display: flex;
    align-items: center;
    gap: 3px;
  }

  .low-value {
    background-color: rgba(239, 68, 68, 0.08);
    color: #dc2626;
    font-weight: 600;
  }

  .medium-value {
    background-color: rgba(245, 158, 11, 0.08);
    color: #d97706;
    font-weight: 600;
  }

  .high-value {
    background-color: rgba(34, 197, 94, 0.08);
    color: #16a34a;
    font-weight: 600;
  }

  .view-details-button {
    background: transparent;
    color: var(--accent-color);
    border: 1px solid var(--accent-color);
    border-radius: 6px;
    padding: 6px 12px;
    font-size: 0.8rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto;
    gap: 4px;
  }

  .view-details-button:hover {
    background: var(--accent-color);
    color: var(--contrast-text);
    transform: translateY(-2px);
    box-shadow: 0 4px 8px ${accentColor}40;
  }

  /* Info Button & Card */
  .info-button {
    background: linear-gradient(135deg, var(--accent-color), var(--accent-color-light));
    color: var(--contrast-text);
    border: none;
    border-radius: 8px;
    padding: 10px 18px;
    font-size: 0.9rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s;
    box-shadow: 0 4px 10px ${accentColor}40;
    display: flex;
    align-items: center;
  }

  .info-button:hover {
    transform: translateY(-3px);
    box-shadow: 0 6px 15px ${accentColor}50;
  }

  .info-card {
    background: var(--primary-color);
    border-radius: 16px;
    box-shadow: 0 15px 35px rgba(0,0,0,0.15);
    margin-bottom: 35px;
    overflow: hidden;
    animation: slideDown 0.4s ease-out;
    border: 1px solid ${accentColor}20;
  }

  .info-card-header {
    background: linear-gradient(135deg, var(--accent-color), var(--accent-color-light));
    color: var(--contrast-text);
    padding: 18px 22px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .card-header-icon {
    margin-right: 10px;
    font-size: 1.5em;
    vertical-align: -0.2em;
  }

  .info-card-header h3 {
    margin: 0;
    font-size: 1.3rem;
    font-weight: 600;
    display: flex;
    align-items: center;
  }

  .close-button {
    background: none;
    border: none;
    color: var(--contrast-text);
    font-size: 1.8rem;
    cursor: pointer;
    opacity: 0.8;
    transition: opacity 0.2s;
  }

  .close-button:hover {
    opacity: 1;
  }

  .info-card-content {
    padding: 25px;
  }

  .stat-definitions {
    display: flex;
    flex-wrap: wrap;
    gap: 25px;
    margin-top: 20px;
  }

  .stat-definition {
    flex: 1;
    min-width: 250px;
    background: rgba(0,0,0,0.02);
    padding: 20px;
    border-radius: 10px;
    border-left: 4px solid var(--accent-color);
    box-shadow: 0 4px 10px rgba(0,0,0,0.05);
  }

  .stat-definition h4 {
    margin: 0 0 12px;
    color: var(--accent-color);
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .stat-icon {
    font-size: 1.2em;
  }

  .stat-definition p {
    margin: 0;
    font-size: 0.95rem;
    color: var(--secondary-text-color);
    line-height: 1.5;
  }

  .selected-stat-info {
    margin-top: 25px;
    padding: 20px;
    background: ${accentColor}08;
    border-radius: 10px;
    animation: fadeIn 0.4s;
  }

  .selected-stat-info h4 {
    margin: 0 0 12px;
    color: var(--accent-color);
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 1.1rem;
  }

  .selected-stat-info p {
    margin: 0;
    color: var(--text-color);
    line-height: 1.6;
  }

  .legend {
    display: flex;
    gap: 20px;
    margin-top: 25px;
    justify-content: center;
    flex-wrap: wrap;
    padding: 15px;
    background: rgba(0,0,0,0.02);
    border-radius: 10px;
  }

  .legend-item {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.9rem;
    color: var(--secondary-text-color);
  }

  .legend-color {
    width: 24px;
    height: 14px;
    border-radius: 4px;
  }

  .high-legend {
    background-color: rgba(34, 197, 94, 0.2);
    border: 1px solid #16a34a;
  }

  .medium-legend {
    background-color: rgba(245, 158, 11, 0.2);
    border: 1px solid #d97706;
  }

  .low-legend {
    background-color: rgba(239, 68, 68, 0.2);
    border: 1px solid #dc2626;
  }

  /* Loading and Error States */
  .loading-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 80px 0;
    gap: 25px;
  }

  .loading-spinner {
    position: relative;
    width: 60px;
    height: 60px;
  }

  .spinner-icon {
    font-size: 3rem;
    color: var(--accent-color);
    animation: spin 1.2s linear infinite;
  }

  .loading-text {
    font-size: 1.1rem;
    color: var(--secondary-text-color);
    font-weight: 500;
  }

  .error-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 60px 30px;
    gap: 20px;
    text-align: center;
  }

  .error-icon {
    font-size: 4rem;
    margin-bottom: 15px;
    color: var(--accent-color);
  }

  .error-message {
    font-size: 1.2rem;
    color: var(--accent-color);
    margin-bottom: 25px;
  }

  .retry-button {
    background: var(--accent-color);
    color: var(--contrast-text);
    border: none;
    border-radius: 8px;
    padding: 12px 25px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s;
    display: flex;
    align-items: center;
    gap: 8px;
    box-shadow: 0 4px 10px ${accentColor}40;
  }

  .retry-button:hover {
    transform: translateY(-3px);
    box-shadow: 0 8px 15px ${accentColor}50;
    background: var(--accent-color-light);
  }

  /* Animations */
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  @keyframes slideDown {
    from { opacity: 0; transform: translateY(-30px); }
    to { opacity: 1; transform: translateY(0); }
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  /* Add Orbitron font for impact players */
  @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;600;700&display=swap');

  /* Media Queries */
  @media (max-width: 768px) {
    .team-player-stats {
      padding: 25px 15px;
      max-width: 98%;
    }

    .stats-header {
      flex-direction: column;
      align-items: flex-start;
      gap: 15px;
    }

    h1 {
      font-size: 1.8rem;
    }

    .team-icon {
      font-size: 1.8rem;
    }

    .info-button {
      width: 100%;
    }

    .impact-players-container {
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 20px;
    }

    .player-stats {
      flex-direction: column;
      gap: 15px;
    }

    .stat-box {
      padding: 10px 0;
      border-bottom: 1px solid rgba(0,0,0,0.08);
    }

    .stat-box:after {
      display: none;
    }

    .stat-box:last-child {
      border-bottom: none;
    }

    .stat-definitions {
      flex-direction: column;
      gap: 15px;
    }
  }
`}</style>
    </div>
  );
};

export default TeamPlayerStats;

