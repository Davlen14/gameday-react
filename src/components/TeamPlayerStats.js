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
    if (value < low) return "tps-low-value";
    if (value < medium) return "tps-medium-value";
    return "tps-high-value";
  };

  // Get appropriate icon for position
  const getPositionIcon = (position) => {
    const positionMap = {
      'QB': <MdSportsFootball className="tps-position-icon" />,
      'RB': <BiRun className="tps-position-icon" />,
      'WR': <BiFootball className="tps-position-icon" />,
      'TE': <GiAmericanFootballPlayer className="tps-position-icon" />,
      'OL': <GiAmericanFootballPlayer className="tps-position-icon" />,
      'DL': <GiAmericanFootballPlayer className="tps-position-icon" />,
      'LB': <GiAmericanFootballPlayer className="tps-position-icon" />,
      'DB': <GiAmericanFootballPlayer className="tps-position-icon" />,
      'K': <FaFootballBall className="tps-position-icon" />
    };
    
    return positionMap[position] || <GiAmericanFootballHelmet className="tps-position-icon" />;
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
      <div className="tps-team-player-stats">
        <div className="tps-loading-container">
          <div className="tps-loading-spinner">
            <AiOutlineLoading3Quarters className="tps-spinner-icon" />
          </div>
          <div className="tps-loading-text">Loading player statistics...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="tps-team-player-stats">
        <div className="tps-error-container">
          <div className="tps-error-icon">
            <AiOutlineWarning />
          </div>
          <div className="tps-error-message">Error: {error}</div>
          <button className="tps-retry-button" onClick={() => window.location.reload()}>
            <BsArrowRepeat className="tps-button-icon" /> Retry
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
    if (value > 0.5) return <FaArrowUp className="tps-trend-icon tps-positive" />;
    if (value < 0) return <FaArrowDown className="tps-trend-icon tps-negative" />;
    return null;
  };

  return (
    <div className="tps-team-player-stats">
      <div className="tps-stats-header">
      <h1 className="tps-main-heading">
        <GiAmericanFootballHelmet className="tps-team-icon" />
        <span style={{ color: "#000000" }}>{teamName} Player Stats</span>
        <span className="tps-year-badge">{year}</span>
        </h1>
        <button 
          className="tps-info-button" 
          onClick={() => setShowInfoCard(!showInfoCard)}
        >
          <FaInfoCircle className="tps-button-icon" />
          {showInfoCard ? "Hide Stat Definitions" : "What Do These Stats Mean?"}
        </button>
      </div>

      {showInfoCard && (
        <div className="tps-info-card">
          <div className="tps-info-card-header">
            <h3 className="tps-info-heading">
              <IoMdInformationCircleOutline className="tps-card-header-icon" />
              Understanding PPA (Predicted Points Added) Statistics
            </h3>
            <button className="tps-close-button" onClick={() => setShowInfoCard(false)}>×</button>
          </div>
          <div className="tps-info-card-content">
            <p className="tps-info-text">PPA measures the expected points added on each play, based on down, distance, and field position. Higher values indicate more positive contributions.</p>
            
            <div className="tps-stat-definitions">
              <div className="tps-stat-definition">
                <h4 className="tps-stat-definition-title">
                  <IoMdStats className="tps-stat-icon" /> Average PPA
                </h4>
                <p className="tps-stat-definition-text">The average points contribution per play type. Higher is better.</p>
              </div>
              <div className="tps-stat-definition">
                <h4 className="tps-stat-definition-title">
                  <MdLeaderboard className="tps-stat-icon" /> Total PPA
                </h4>
                <p className="tps-stat-definition-text">The cumulative sum of all PPA values. Represents overall season impact.</p>
              </div>
              <div className="tps-legend">
                <div className="tps-legend-item">
                  <span className="tps-legend-color tps-high-legend"></span>
                  <span>High Impact</span>
                </div>
                <div className="tps-legend-item">
                  <span className="tps-legend-color tps-medium-legend"></span>
                  <span>Medium Impact</span>
                </div>
                <div className="tps-legend-item">
                  <span className="tps-legend-color tps-low-legend"></span>
                  <span>Low Impact</span>
                </div>
              </div>
            </div>
            
            {selectedStat && (
              <div className="tps-selected-stat-info">
                <h4 className="tps-selected-stat-title">
                  <MdQueryStats className="tps-stat-icon" /> {selectedStat}
                </h4>
                <p className="tps-selected-stat-text">{getStatInfo(selectedStat)}</p>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="tps-impact-players-section">
        <h2 className="tps-section-title">
          <FaTrophy className="tps-section-icon" /> Top Impact Players
        </h2>
        <div className="tps-impact-players-container">
          {impactPlayers.map((player, index) => (
            <div className="tps-impact-player-card" key={player.id}>
              <div className="tps-player-card-inner">
                <div className="tps-player-image-container">
                  <div className="tps-player-avatar">
                    {player.name.split(" ").map(name => name[0]).join("")}
                  </div>
                  <div className="tps-player-position">
                    {getPositionIcon(player.position)} {player.position}
                  </div>
                </div>
                <div className="tps-player-info">
                  <h3 className="tps-player-name">{player.name}</h3>
                  <div className="tps-player-rank">
                    <span className="tps-rank-number">#{index + 1}</span> Impact Player
                  </div>
                  <div className="tps-player-stats">
                    <div className="tps-stat-box">
                      <div className="tps-stat-value">
                        {player.totalPPA.all.toFixed(2)}
                        {getStatTrendIcon(player.totalPPA.all)}
                      </div>
                      <div className="tps-stat-label">
                        <MdLeaderboard className="tps-stat-label-icon" /> Total PPA
                      </div>
                    </div>
                    <div className="tps-stat-box">
                      <div className="tps-stat-value">
                        {player.averagePPA.all.toFixed(2)}
                        {getStatTrendIcon(player.averagePPA.all)}
                      </div>
                      <div className="tps-stat-label">
                        <IoMdStats className="tps-stat-label-icon" /> Avg PPA
                      </div>
                    </div>
                    <div className="tps-stat-box">
                      <div className="tps-stat-value">
                        {Math.max(player.averagePPA.pass, player.averagePPA.rush).toFixed(2)}
                        {getStatTrendIcon(Math.max(player.averagePPA.pass, player.averagePPA.rush))}
                      </div>
                      <div className="tps-stat-label">
                        {player.averagePPA.pass > player.averagePPA.rush ? (
                          <><MdSportsFootball className="tps-stat-label-icon" /> Pass</>
                        ) : (
                          <><BiRun className="tps-stat-label-icon" /> Rush</>
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

      <div className="tps-regular-players-section">
        <h2 className="tps-section-title">
          <MdCategory className="tps-section-icon" /> All Players Statistics
        </h2>
        <div className="tps-table-container">
          <table className="tps-stats-table">
            <thead>
              <tr>
                <th rowSpan="2" className="tps-sticky-col">Player</th>
                <th colSpan="4">
                  <IoMdStats className="tps-header-icon" /> Average PPA
                </th>
                <th colSpan="4">
                  <MdLeaderboard className="tps-header-icon" /> Total PPA
                </th>
              </tr>
              <tr>
                <th 
                  onClick={() => setSelectedStat("all")}
                  className={selectedStat === "all" ? "tps-selected-header" : ""}
                >All</th>
                <th 
                  onClick={() => setSelectedStat("pass")}
                  className={selectedStat === "pass" ? "tps-selected-header" : ""}
                >
                  <MdSportsFootball className="tps-stat-type-icon" /> Pass
                </th>
                <th 
                  onClick={() => setSelectedStat("rush")}
                  className={selectedStat === "rush" ? "tps-selected-header" : ""}
                >
                  <BiRun className="tps-stat-type-icon" /> Rush
                </th>
                <th 
                  onClick={() => setSelectedStat("thirdDown")}
                  className={selectedStat === "thirdDown" ? "tps-selected-header" : ""}
                >3rd Down</th>
                <th 
                  onClick={() => setSelectedStat("totalAll")}
                  className={selectedStat === "totalAll" ? "tps-selected-header" : ""}
                >All</th>
                <th 
                  onClick={() => setSelectedStat("totalPass")}
                  className={selectedStat === "totalPass" ? "tps-selected-header" : ""}
                >
                  <MdSportsFootball className="tps-stat-type-icon" /> Pass
                </th>
                <th 
                  onClick={() => setSelectedStat("totalRush")}
                  className={selectedStat === "totalRush" ? "tps-selected-header" : ""}
                >
                  <BiRun className="tps-stat-type-icon" /> Rush
                </th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {remainingPlayers.map((player) => (
                <tr key={player.id}>
                  <td className="tps-player-cell tps-sticky-col">
                    <div className="tps-table-player-info">
                      <div className="tps-table-player-avatar">
                        {player.name.split(" ").map(name => name[0]).join("")}
                      </div>
                      <div className="tps-table-player-details">
                        <div className="tps-table-player-name">{player.name}</div>
                        <div className="tps-table-player-position">
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
                    <button className="tps-view-details-button">
                      <BsSearch className="tps-button-icon" /> View
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
    --tps-accent-color: ${accentColor};
    --tps-accent-color-light: ${accentColorLight};
    --tps-accent-color-dark: ${accentColorDark};
    --tps-contrast-text: ${contrastColor};
    --tps-primary-color: #ffffff;
    --tps-text-color: #333333;
    --tps-secondary-text-color: #666666;
    --tps-background-color: #f5f5f5;
    --tps-border-color: #ffffff;
  }

  .tps-team-player-stats {
    font-family: 'Inter', 'Helvetica Neue', Helvetica, Arial, sans-serif;
    padding: 30px;
    background: var(--tps-background-color);
    color: var(--tps-text-color);
    line-height: 1.6;
    max-width: 95%;
    margin: 0 auto;
    border-radius: 12px;
    box-shadow: 0 4px 10px rgba(0,0,0,0.08);
  }

  /* Header Styles */
  .tps-stats-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 30px;
    padding-bottom: 15px;
    border-bottom: 2px solid var(--tps-border-color);
  }

  .tps-main-heading {
    font-size: 2.2rem;
    font-weight: 700;
    margin: 0;
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .tps-team-icon {
    font-size: 2.2rem;
    color: var(--tps-accent-color);
  }

  .tps-year-badge {
    background: linear-gradient(135deg, var(--tps-accent-color), var(--tps-accent-color-light));
    color: var(--tps-contrast-text);
    padding: 6px 14px;
    border-radius: 20px;
    font-size: 0.9rem;
    font-weight: 600;
    box-shadow: 0 3px 6px ${accentColor}50;
  }

  .tps-section-title {
    font-size: 1.6rem;
    font-weight: 700;
    margin: 40px 0 25px;
    position: relative;
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .tps-section-icon {
    color: var(--tps-accent-color);
    font-size: 1.5rem;
  }

  /* Change this part to use a solid color instead of gradient */
  .tps-section-title:after {
    content: '';
    position: absolute;
    bottom: -8px;
    left: 0;
    width: 80px;
    height: 4px;
    background: var(--tps-accent-color); /* Changed from gradient to solid color */
    border-radius: 2px;
  }

  /* Button Icons */
  .tps-button-icon {
    margin-right: 6px;
    vertical-align: -0.125em;
  }

  /* Impact Players Cards */
  .tps-impact-players-container {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: 25px;
    margin-bottom: 50px;
  }

  .tps-impact-player-card {
    background: var(--tps-primary-color);
    border-radius: 16px;
    overflow: hidden;
    transition: transform 0.4s, box-shadow 0.4s;
    perspective: 1000px;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.12);
    position: relative;
  }

  .tps-impact-player-card:hover {
    transform: translateY(-15px) scale(1.02);
    box-shadow: 0 20px 35px ${accentColor}30;
  }

  .tps-impact-player-card:before {
    content: '';
    position: absolute;
    top: -5px;
    left: -5px;
    right: -5px;
    bottom: -5px;
    background: linear-gradient(135deg, var(--tps-accent-color), transparent 60%);
    z-index: -1;
    border-radius: 20px;
    opacity: 0;
    transition: opacity 0.4s;
  }

  .tps-impact-player-card:hover:before {
    opacity: 0.8;
  }

  .tps-player-card-inner {
    background: linear-gradient(180deg, #ffffff 0%, #f9f9f9 100%);
    border-radius: 16px;
    overflow: hidden;
    height: 100%;
    transform-style: preserve-3d;
    transition: all 0.5s ease;
  }

  .tps-player-image-container {
    background: linear-gradient(135deg, var(--tps-accent-color), var(--tps-accent-color-light));
    padding: 30px 20px;
    display: flex;
    flex-direction: column;
    align-items: center;
    position: relative;
  }

  .tps-player-avatar {
    width: 90px;
    height: 90px;
    border-radius: 50%;
    background: var(--tps-primary-color);
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'Orbitron', sans-serif;
    font-size: 2rem;
    font-weight: 700;
    color: var(--tps-accent-color);
    box-shadow: 0 8px 15px rgba(0,0,0,0.2);
    z-index: 2;
    position: relative;
    transform: translateZ(20px);
    letter-spacing: -1px;
  }

  .tps-player-position {
    background: rgba(255, 255, 255, 0.95);
    color: var(--tps-accent-color);
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

  .tps-position-icon {
    font-size: 1.1em;
  }

  .tps-player-info {
    padding: 35px 20px 25px;
    text-align: center;
  }

  .tps-player-name {
    margin: 0 0 8px;
    font-family: 'Orbitron', sans-serif;
    font-size: 1.3rem;
    font-weight: 700;
    color: var(--tps-text-color);
    letter-spacing: 0.5px;
  }

  .tps-player-rank {
    color: var(--tps-secondary-text-color);
    font-family: 'Orbitron', sans-serif;
    font-size: 0.9rem;
    margin-bottom: 20px;
    font-weight: 500;
  }

  .tps-rank-number {
    display: inline-block;
    background: var(--tps-accent-color);
    color: var(--tps-contrast-text);
    padding: 3px 8px;
    border-radius: 6px;
    font-family: 'Orbitron', sans-serif;
    font-weight: 600;
    margin-right: 4px;
  }

  .tps-player-stats {
    display: flex;
    justify-content: space-between;
    margin-top: 20px;
    padding-top: 20px;
    border-top: 1px solid rgba(0,0,0,0.08);
  }

  .tps-stat-box {
    flex: 1;
    text-align: center;
    position: relative;
    padding: 0 5px;
  }

  .tps-stat-box:not(:last-child):after {
    content: '';
    position: absolute;
    right: 0;
    top: 10%;
    height: 80%;
    width: 1px;
    background: rgba(0,0,0,0.08);
  }

  .tps-stat-value {
    font-size: 1.3rem;
    font-family: 'Orbitron', sans-serif;
    font-weight: 700;
    color: var(--tps-accent-color);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
  }

  .tps-trend-icon {
    font-size: 0.8em;
  }

  .tps-trend-icon.tps-positive {
    color: #16a34a;
  }

  .tps-trend-icon.tps-negative {
    color: #dc2626;
  }

  .tps-stat-label {
    font-size: 0.75rem;
    font-family: 'Orbitron', sans-serif;
    color: var(--tps-secondary-text-color);
    margin-top: 5px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
  }

 .tps-stat-label-icon {
    font-size: 1.1em;
  }

  /* Regular Players Table */
  .tps-table-container {
    overflow-x: auto;
    border-radius: 10px;
    box-shadow: 0 8px 20px rgba(0,0,0,0.1);
    background: var(--tps-primary-color);
  }

  .tps-stats-table {
    width: 100%;
    border-collapse: collapse;
    white-space: nowrap;
  }

  .tps-stats-table th, .tps-stats-table td {
    padding: 14px 16px;
    text-align: center;
    border-bottom: 1px solid rgba(0,0,0,0.06);
    font-size: 0.9rem;
  }

  .tps-stats-table th {
    background-color: rgba(0,0,0,0.03);
    font-weight: 600;
    color: var(--tps-text-color);
    position: sticky;
    top: 0;
    z-index: 10;
    cursor: pointer;
    transition: background-color 0.2s;
  }

  .tps-header-icon {
    margin-right: 6px;
    vertical-align: -0.125em;
    font-size: 1.1em;
    color: var(--tps-accent-color);
  }

  .tps-stat-type-icon {
    vertical-align: -0.125em;
    margin-right: 3px;
    font-size: 1em;
    color: var(--tps-accent-color);
  }

  .tps-stats-table th:hover {
    background-color: ${accentColor}10;
  }

  .tps-stats-table th.tps-selected-header {
    background-color: ${accentColor}20;
    color: var(--tps-accent-color);
    box-shadow: inset 0 -2px 0 var(--tps-accent-color);
  }

  .tps-sticky-col {
    position: sticky;
    left: 0;
    background-color: var(--tps-background-color);
    z-index: 9;
    border-right: 1px solid rgba(0,0,0,0.06);
  }

  .tps-stats-table tr:hover td {
    background-color: ${accentColor}05;
  }

  .tps-table-player-info {
    display: flex;
    align-items: center;
    gap: 12px;
    min-width: 180px;
    padding: 5px 0;
  }

  .tps-table-player-avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: linear-gradient(135deg, var(--tps-accent-color), var(--tps-accent-color-light));
    color: var(--tps-contrast-text);
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
    font-size: 0.9rem;
    flex-shrink: 0;
    box-shadow: 0 3px 6px rgba(0,0,0,0.1);
  }

  .tps-table-player-details {
    text-align: left;
  }

  .tps-table-player-name {
    font-weight: 600;
    font-size: 0.95rem;
    color: var(--tps-text-color);
  }

  .tps-table-player-position {
    font-size: 0.75rem;
    color: var(--tps-secondary-text-color);
    margin-top: 3px;
    display: flex;
    align-items: center;
    gap: 3px;
  }

  .tps-low-value {
    background-color: rgba(239, 68, 68, 0.08);
    color: #dc2626;
    font-weight: 600;
  }

  .tps-medium-value {
    background-color: rgba(245, 158, 11, 0.08);
    color: #d97706;
    font-weight: 600;
  }

  .tps-high-value {
    background-color: rgba(34, 197, 94, 0.08);
    color: #16a34a;
    font-weight: 600;
  }

  .tps-view-details-button {
    background: transparent;
    color: var(--tps-accent-color);
    border: 1px solid var(--tps-accent-color);
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

  .tps-view-details-button:hover {
    background: var(--tps-accent-color);
    color: var(--tps-contrast-text);
    transform: translateY(-2px);
    box-shadow: 0 4px 8px ${accentColor}40;
  }

  /* Info Button & Card */
  .tps-info-button {
    background: linear-gradient(135deg, var(--tps-accent-color), var(--tps-accent-color-light));
    color: var(--tps-contrast-text);
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

  .tps-info-button:hover {
    transform: translateY(-3px);
    box-shadow: 0 6px 15px ${accentColor}50;
  }

  .tps-info-card {
    background: var(--tps-primary-color);
    border-radius: 16px;
    box-shadow: 0 15px 35px rgba(0,0,0,0.15);
    margin-bottom: 35px;
    overflow: hidden;
    animation: tps-slideDown 0.4s ease-out;
    border: 1px solid ${accentColor}20;
  }

  .tps-info-card-header {
    background: linear-gradient(135deg, var(--tps-accent-color), var(--tps-accent-color-light));
    color: var(--tps-contrast-text);
    padding: 18px 22px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .tps-card-header-icon {
    margin-right: 10px;
    font-size: 1.5em;
    vertical-align: -0.2em;
  }

  .tps-info-heading {
    margin: 0;
    font-size: 1.3rem;
    font-weight: 600;
    display: flex;
    align-items: center;
  }

  .tps-close-button {
    background: none;
    border: none;
    color: var(--tps-contrast-text);
    font-size: 1.8rem;
    cursor: pointer;
    opacity: 0.8;
    transition: opacity 0.2s;
  }

  .tps-close-button:hover {
    opacity: 1;
  }

  .tps-info-card-content {
    padding: 25px;
  }

  .tps-info-text {
    margin-bottom: 20px;
    line-height: 1.6;
  }

  .tps-stat-definitions {
    display: flex;
    flex-wrap: wrap;
    gap: 25px;
    margin-top: 20px;
  }

  .tps-stat-definition {
    flex: 1;
    min-width: 250px;
    background: rgba(0,0,0,0.02);
    padding: 20px;
    border-radius: 10px;
    border-left: 4px solid var(--tps-accent-color);
    box-shadow: 0 4px 10px rgba(0,0,0,0.05);
  }

  .tps-stat-definition-title {
    margin: 0 0 12px;
    color: var(--tps-accent-color);
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .tps-stat-icon {
    font-size: 1.2em;
  }

  .tps-stat-definition-text {
    margin: 0;
    font-size: 0.95rem;
    color: var(--tps-secondary-text-color);
    line-height: 1.5;
  }

  .tps-selected-stat-info {
    margin-top: 25px;
    padding: 20px;
    background: ${accentColor}08;
    border-radius: 10px;
    animation: tps-fadeIn 0.4s;
  }

  .tps-selected-stat-title {
    margin: 0 0 12px;
    color: var(--tps-accent-color);
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 1.1rem;
  }

  .tps-selected-stat-text {
    margin: 0;
    color: var(--tps-text-color);
    line-height: 1.6;
  }

  .tps-legend {
    display: flex;
    gap: 20px;
    margin-top: 25px;
    justify-content: center;
    flex-wrap: wrap;
    padding: 15px;
    background: rgba(0,0,0,0.02);
    border-radius: 10px;
  }

  .tps-legend-item {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.9rem;
    color: var(--tps-secondary-text-color);
  }

  .tps-legend-color {
    width: 24px;
    height: 14px;
    border-radius: 4px;
  }

  .tps-high-legend {
    background-color: rgba(34, 197, 94, 0.2);
    border: 1px solid #16a34a;
  }

  .tps-medium-legend {
    background-color: rgba(245, 158, 11, 0.2);
    border: 1px solid #d97706;
  }

  .tps-low-legend {
    background-color: rgba(239, 68, 68, 0.2);
    border: 1px solid #dc2626;
  }

  /* Loading and Error States */
  .tps-loading-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 80px 0;
    gap: 25px;
  }

  .tps-loading-spinner {
    position: relative;
    width: 60px;
    height: 60px;
  }

  .tps-spinner-icon {
    font-size: 3rem;
    color: var(--tps-accent-color);
    animation: tps-spin 1.2s linear infinite;
  }

  .tps-loading-text {
    font-size: 1.1rem;
    color: var(--tps-secondary-text-color);
    font-weight: 500;
  }

  .tps-error-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 60px 30px;
    gap: 20px;
    text-align: center;
  }

  .tps-error-icon {
    font-size: 4rem;
    margin-bottom: 15px;
    color: var(--tps-accent-color);
  }

  .tps-error-message {
    font-size: 1.2rem;
    color: var(--tps-accent-color);
    margin-bottom: 25px;
  }

  .tps-retry-button {
    background: var(--tps-accent-color);
    color: var(--tps-contrast-text);
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

  .tps-retry-button:hover {
    transform: translateY(-3px);
    box-shadow: 0 8px 15px ${accentColor}50;
    background: var(--tps-accent-color-light);
  }

  /* Animations */
  @keyframes tps-spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  @keyframes tps-slideDown {
    from { opacity: 0; transform: translateY(-30px); }
    to { opacity: 1; transform: translateY(0); }
  }

  @keyframes tps-fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  /* Add Orbitron font for impact players */
  @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;600;700&display=swap');

  /* Media Queries */
  @media (max-width: 768px) {
    .tps-team-player-stats {
      padding: 25px 15px;
      max-width: 98%;
    }

    .tps-stats-header {
      flex-direction: column;
      align-items: flex-start;
      gap: 15px;
    }

    .tps-main-heading {
      font-size: 1.8rem;
    }

    .tps-team-icon {
      font-size: 1.8rem;
    }

    .tps-info-button {
      width: 100%;
    }

    .tps-impact-players-container {
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 20px;
    }

    .tps-player-stats {
      flex-direction: column;
      gap: 15px;
    }

    .tps-stat-box {
      padding: 10px 0;
      border-bottom: 1px solid rgba(0,0,0,0.08);
    }

    .tps-stat-box:after {
      display: none;
    }

    .tps-stat-box:last-child {
      border-bottom: none;
    }

    .tps-stat-definitions {
      flex-direction: column;
      gap: 15px;
    }
  }
`}</style>
    </div>
  );
};

export default TeamPlayerStats;