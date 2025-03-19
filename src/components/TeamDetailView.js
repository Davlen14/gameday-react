import React, { useState, useEffect, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import teamsService from "../services/teamsService";
import TeamPlayerStats from "./TeamPlayerStats"; // Import the Player Stats component
import TeamStats from "./TeamStats"; // Import the Team Stats component

import { 
  FaMapMarkerAlt, 
  FaTrophy, 
  FaUsers, 
  FaArrowLeft, 
  FaCalendarAlt, 
  FaInfoCircle,
  FaChartLine,
  FaUserFriends,
  FaFootballBall,
  FaClipboardList,
  FaChartBar,
  FaExclamationTriangle,
  FaUser,
  FaMapMarkerAlt as FaVenue,
  FaClock,
  FaStar,
  FaChevronDown,
  FaChevronUp
} from "react-icons/fa";
import GaugeComponent from "./GaugeComponent"; // Import the separated gauge component
import RatingsComponent from "./RatingsComponent"; // Import the RatingsComponent
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

// Coming Soon Component
const ComingSoon = ({ title, color = "#9e9e9e" }) => (
  <div className="coming-soon-container" style={{ borderColor: color + "30" }}>
    <FaExclamationTriangle size={40} className="coming-soon-icon" style={{ color }} />
    <h3>{title} Feature</h3>
    <p>We're currently working on this exciting new feature!</p>
    <div className="coming-soon-label" style={{ background: color }}>Coming Soon</div>
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

// Get initials from player name
const getInitials = (name) => {
  if (!name) return "?";
  
  const names = name.split(' ');
  if (names.length >= 2) {
    return `${names[0][0]}${names[names.length - 1][0]}`;
  }
  
  return name.substring(0, 2);
};

const TeamDetail = () => {
  const { teamId } = useParams();
  const navigate = useNavigate();
  const [allTeams, setAllTeams] = useState([]);
  const [team, setTeam] = useState(null);
  const [ratings, setRatings] = useState({});
  const [roster, setRoster] = useState([]);
  const [schedule, setSchedule] = useState([]);
  const [expandedGames, setExpandedGames] = useState({});
  const [gameStats, setGameStats] = useState({});
  const [isLoading, setIsLoading] = useState({
    team: false,
    ratings: false,
    roster: false,
    schedule: false,
  });
  const [error, setError] = useState(null);
  
  // State for active tab
  const [activeTab, setActiveTab] = useState("overview");
  
  // Refs for animation
  const headerRef = useRef(null);
  const contentRef = useRef(null);
  
  // Animation timing
  useEffect(() => {
    if (headerRef.current && contentRef.current) {
      headerRef.current.style.opacity = "0";
      contentRef.current.style.opacity = "0";
      
      setTimeout(() => {
        headerRef.current.style.opacity = "1";
        headerRef.current.style.transition = "opacity 0.5s ease-in-out";
      }, 100);
      
      setTimeout(() => {
        contentRef.current.style.opacity = "1";
        contentRef.current.style.transition = "opacity 0.5s ease-in-out";
      }, 300);
    }
  }, [team]);

  const getTeamLogo = (teamName) => {
    const foundTeam = allTeams.find(
      (t) => t.school.toLowerCase() === teamName?.toLowerCase()
    );
    return foundTeam?.logos?.[0] || "/photos/default_team.png";
  };

  const handleTeamChange = (e) => {
    const newTeamId = e.target.value;
    if (newTeamId) {
      navigate(`/teams/${newTeamId}`);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  // Function to fetch game stats for expanded rows
  const fetchGameStats = async (gameId) => {
    try {
      const data = await teamsService.getAdvancedBoxScore(gameId);
      setGameStats(prev => ({
        ...prev,
        [gameId]: data
      }));
    } catch (err) {
      console.error("Error fetching game stats:", err.message);
    }
  };

  // Function to toggle expanded game rows
  const toggleGameExpanded = (gameId) => {
    // Fetch stats if we haven't already
    if (!gameStats[gameId]) {
      fetchGameStats(gameId);
    }
    
    setExpandedGames(prev => ({
      ...prev,
      [gameId]: !prev[gameId]
    }));
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading((prev) => ({ ...prev, team: true }));
        const teamsData = await teamsService.getTeams();
        setAllTeams(teamsData);

        const foundTeam = teamsData.find(
          (t) => t.id === parseInt(teamId, 10)
        );
        if (!foundTeam) throw new Error("Team not found");
        setTeam(foundTeam);

        await Promise.all([
          fetchRatings(foundTeam.school),
          fetchRoster(foundTeam.school),
          fetchSchedule(foundTeam.school),
        ]);
      } catch (err) {
        setError(`Error: ${err.message}`);
      } finally {
        setIsLoading((prev) => ({ ...prev, team: false }));
      }
    };

    const fetchRatings = async (teamName) => {
      try {
        setIsLoading((prev) => ({ ...prev, ratings: true }));
        const data = await teamsService.getTeamRatings(teamName, 2024);
        setRatings(data);
      } catch (err) {
        console.error("Error fetching ratings:", err.message);
      } finally {
        setIsLoading((prev) => ({ ...prev, ratings: false }));
      }
    };

    const fetchRoster = async (teamName) => {
      try {
        setIsLoading((prev) => ({ ...prev, roster: true }));
        const data = await teamsService.getTeamRoster(teamName, 2024);
        setRoster(data);
      } catch (err) {
        console.error("Error fetching roster:", err.message);
      } finally {
        setIsLoading((prev) => ({ ...prev, roster: false }));
      }
    };

    const fetchSchedule = async (teamName) => {
      try {
        setIsLoading((prev) => ({ ...prev, schedule: true }));
        const data = await teamsService.getTeamSchedule(teamName, 2024);
        setSchedule(data);
      } catch (err) {
        console.error("Error fetching schedule:", err.message);
      } finally {
        setIsLoading((prev) => ({ ...prev, schedule: false }));
      }
    };

    fetchData();
  }, [teamId]);

  // Default color if team color is not available
  const defaultColor = "#9e9e9e";
  const teamColor = team?.color || defaultColor;

  if (isLoading.team) return (
    <div className="loading-screen">
      <LoadingSpinner color={teamColor} />
      <div>Loading team information...</div>
    </div>
  );
  
  if (error) return (
    <div className="error-screen">
      <FaInfoCircle size={40} style={{ color: teamColor }} />
      <div>{error}</div>
    </div>
  );
  
  if (!team) return (
    <div className="not-found-screen">
      <svg width="100" height="100" viewBox="0 0 24 24" fill="none" stroke={teamColor} strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <line x1="8" y1="12" x2="16" y2="12" />
      </svg>
      <div>Team not found</div>
    </div>
  );

  // Get team conference
  const teamConference = team.conference || "Independent";

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
  
  // Generate team color gradient for metallic effect
  const getTeamColorGradient = (hexColor) => {
    if (!hexColor) return "linear-gradient(145deg, #1a1a1a, #333333)";
    const lighterColor = lightenColor(hexColor, 20);
    return `linear-gradient(145deg, ${hexColor}, ${lighterColor})`;
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

  // Top bar style using team color with glass effect
  const topBarStyle = {
    background: getTeamColorGradient(teamColor),
    color: getContrastColor(teamColor),
    boxShadow: `0 4px 20px ${teamColor}50`
  };

  // Style for card headers
  const cardHeaderStyle = {
    background: lightenColor(teamColor, 90),
    borderBottom: `2px solid ${teamColor}`,
    color: darkenColor(teamColor, 20)
  };

  // UPDATED: Style for active tabs - white background with team-colored elements and subtle gray shadow
  const activeTabStyle = {
    background: '#ffffff',
    color: darkenColor(teamColor, 20),
    borderColor: teamColor,
    boxShadow: `0 2px 8px rgba(0, 0, 0, 0.15)`,
    borderBottom: `3px solid ${teamColor}`
  };

  // UPDATED: Style for active tab icons
  const activeTabIconStyle = {
    color: teamColor
  };

  // Style for tab icons
  const tabIconStyle = {
    color: darkenColor(teamColor, 10)
  };

  // UPDATED: Style for player icons in roster - using team color
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

  // Render the active tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <>
            {/* SP+ Ratings Card */}
            <div className="dashboard-card team-ratings-card">
              <div className="card-header" style={cardHeaderStyle}>
                <FaChartLine style={{ marginRight: "12px", color: teamColor }} /> 
                SP+ Ratings
              </div>
              <div className="card-body">
                <div className="gauges-container">
                  <GaugeComponent 
                    label="Overall" 
                    metricType="overall" 
                    teamName={team.school}
                    year={2024}
                    teamColor={teamColor}
                  />
                  <GaugeComponent 
                    label="Offense" 
                    metricType="offense" 
                    teamName={team.school}
                    year={2024}
                    teamColor={teamColor}
                  />
                  <GaugeComponent 
                    label="Defense" 
                    metricType="defense" 
                    teamName={team.school}
                    year={2024}
                    teamColor={teamColor}
                  />
                </div>
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
              </div>
            </div>
          </>
        );
      
      case 'schedule':
        return (
          <div className="dashboard-card full-width-card">
            <div className="card-header" style={cardHeaderStyle}>
              <FaCalendarAlt style={{ marginRight: "12px", color: teamColor }} />
              Team Schedule
            </div>
            <div className="card-body">
              {isLoading.schedule ? (
                <div className="loading-indicator">
                  <LoadingSpinner color={teamColor} />
                  <p>Loading schedule...</p>
                </div>
              ) : (
                <div className="schedule-container">
                  <div className="schedule-table-header">
                    <div className="header-date">Date</div>
                    <div className="header-home">Home</div>
                    <div className="header-score">Score</div>
                    <div className="header-away">Away</div>
                    <div className="header-venue">Venue</div>
                    <div className="header-toggle"></div>
                  </div>
                  
                  {schedule.map((game, index) => {
                    const isCompleted = game.homePoints !== null && game.homePoints !== undefined && 
                                        game.awayPoints !== null && game.awayPoints !== undefined;
                    
                    let homeWinner = false;
                    let awayWinner = false;
                    
                    if (isCompleted) {
                      homeWinner = game.homePoints > game.awayPoints;
                      awayWinner = game.homePoints < game.awayPoints;
                    }
                    
                    const gameDate = game.date ? new Date(game.date).toLocaleDateString(undefined, {
                      month: 'numeric',
                      day: 'numeric'
                    }) : "TBD";

                    const isExpanded = expandedGames[game.id] || false;
                    const gameData = gameStats[game.id];
                    
                    return (
                      <div key={index} className="schedule-item">
                        <div className="schedule-row" onClick={() => toggleGameExpanded(game.id)}>
                          {/* Game date/index */}
                          <div className="game-date">
                            <div className="label-text">Game {index + 1}</div>
                            <div className="date-value">{gameDate}</div>
                          </div>
                          
                          {/* Home team */}
                          <div className="team home-team">
                            <div className="schedule-team-logo-container">
                              <img 
                                src={game.homeLogo || getTeamLogo(game.homeTeam)} 
                                alt={game.homeTeam}
                                className="schedule-team-logo"
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = "/photos/default_team.png";
                                }}
                              />
                            </div>
                            <div className="schedule-team-name">{game.homeTeam}</div>
                          </div>
                          
                          {/* Score */}
                          <div className="game-score">
                            {isCompleted ? (
                              <>
                                <div className={`team-score ${homeWinner ? 'schedule-winner' : ''}`} style={homeWinner ? { color: teamColor } : {}}>
                                  {game.homePoints}
                                </div>
                                <div className="score-divider">-</div>
                                <div className={`team-score ${awayWinner ? 'schedule-winner' : ''}`} style={awayWinner ? { color: teamColor } : {}}>
                                  {game.awayPoints}
                                </div>
                              </>
                            ) : (
                              <div className="game-time">{game.time || "TBD"}</div>
                            )}
                          </div>
                          
                          {/* Away team */}
                          <div className="team away-team">
                            <div className="schedule-team-logo-container">
                              <img 
                                src={game.awayLogo || getTeamLogo(game.awayTeam)} 
                                alt={game.awayTeam}
                                className="schedule-team-logo"
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = "/photos/default_team.png";
                                }}
                              />
                            </div>
                            <div className="schedule-team-name">{game.awayTeam}</div>
                          </div>
                          
                          {/* Venue */}
                          <div className="game-venue">
                            <div className="label-text">Venue</div>
                            <div>{game.venue || "TBD"}</div>
                          </div>
                          
                          {/* Toggle button */}
                          <div className="game-toggle">
                            {isExpanded ? <FaChevronUp color={teamColor} /> : <FaChevronDown color="#999" />}
                          </div>
                        </div>
                        
                        {/* Expandable section with impact players */}
                        {isExpanded && (
                          <div className="game-details">
                            <div className="impact-players">
                              <div className="section-title">
                                <FaStar style={{ color: teamColor, marginRight: '6px' }} />
                                <span>Impact Players</span>
                              </div>
                              
                              {gameData ? (
                                <div className="impact-container">
                                  <div className="impact-team">
                                    <div className="impact-team-header" style={{ color: teamColor }}>
                                      <div className="mini-logo">
                                        <img 
                                          src={game.homeLogo || getTeamLogo(game.homeTeam)} 
                                          alt={game.homeTeam}
                                        />
                                      </div>
                                      <span>{game.homeTeam}</span>
                                    </div>
                                    <div className="impact-players-list">
                                      {gameData.players?.usage
                                        ?.filter(p => p.team === game.homeTeam)
                                        ?.sort((a, b) => b.total - a.total)
                                        ?.slice(0, 2)
                                        ?.map((player, i) => {
                                          const playerPPA = gameData.players.ppa.find(p => p.player === player.player);
                                          const stat = playerPPA ? 
                                            `${Math.round(playerPPA.cumulative.total)} PPA, ${Math.round(player.total * 100)}% usage` : 
                                            `${Math.round(player.total * 100)}% usage`;
                                          
                                          return (
                                            <div key={i} className="impact-player">
                                              <div className="player-name">{player.player}</div>
                                              <div className="player-position">{player.position}</div>
                                              <div className="player-stat">{stat}</div>
                                            </div>
                                          );
                                        })}
                                    </div>
                                  </div>
                                  
                                  <div className="impact-team">
                                    <div className="impact-team-header" style={{ color: teamColor }}>
                                      <div className="mini-logo">
                                        <img 
                                          src={game.awayLogo || getTeamLogo(game.awayTeam)} 
                                          alt={game.awayTeam}
                                        />
                                      </div>
                                      <span>{game.awayTeam}</span>
                                    </div>
                                    <div className="impact-players-list">
                                      {gameData.players?.usage
                                        ?.filter(p => p.team === game.awayTeam)
                                        ?.sort((a, b) => b.total - a.total)
                                        ?.slice(0, 2)
                                        ?.map((player, i) => {
                                          const playerPPA = gameData.players.ppa.find(p => p.player === player.player);
                                          const stat = playerPPA ? 
                                            `${Math.round(playerPPA.cumulative.total)} PPA, ${Math.round(player.total * 100)}% usage` : 
                                            `${Math.round(player.total * 100)}% usage`;
                                          
                                          return (
                                            <div key={i} className="impact-player">
                                              <div className="player-name">{player.player}</div>
                                              <div className="player-position">{player.position}</div>
                                              <div className="player-stat">{stat}</div>
                                            </div>
                                          );
                                        })}
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <div className="loading-indicator">
                                  <LoadingSpinner color={teamColor} />
                                  <p>Loading player stats...</p>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {schedule.length === 0 && !isLoading.schedule && (
                    <div className="no-data-message">
                      No schedule information available
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      
      case 'roster':
        return (
          <div className="dashboard-card full-width-card">
            <div className="card-header" style={cardHeaderStyle}>
              <FaUserFriends style={{ marginRight: "12px", color: teamColor }} />
              Team Roster
            </div>
            <div className="card-body">
              {isLoading.roster ? (
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
                            {/* UPDATED: Fixed player icon to use team color instead of red */}
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
                    {roster.length === 0 && !isLoading.roster && (
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
          </div>
        );
      
      case 'ratings':
        return (
          <div className="dashboard-card full-width-card">
            <div className="card-header" style={cardHeaderStyle}>
              <FaChartLine style={{ marginRight: "12px", color: teamColor }} />
              Detailed Team Ratings
            </div>
            <div className="card-body">
              {isLoading.ratings ? (
                <div className="loading-indicator">
                  <LoadingSpinner color={teamColor} />
                  <p>Loading detailed ratings...</p>
                </div>
              ) : (
                <RatingsComponent teamName={team.school} year={2024} teamColor={teamColor} />
              )}
            </div>
          </div>
        );
        
        case 'teamStats':
          return (
            <div className="dashboard-card full-width-card">
              <div className="card-header" style={cardHeaderStyle}>
                <FaChartBar style={{ marginRight: "12px", color: teamColor }} />
                Team Statistics
              </div>
              <div className="card-body">
                <TeamStats 
                  teamName={team.school} 
                  year={2024} 
                  teamColor={teamColor}
                />
              </div>
            </div>
          );
        
        case 'playerStats':
          return (
            <div className="dashboard-card full-width-card">
              <div className="card-header" style={cardHeaderStyle}>
                <FaFootballBall style={{ marginRight: "12px", color: teamColor }} />
                Player Statistics
              </div>
              <div className="card-body">
                {/* Render the TeamPlayerStats component with team color */}
                <TeamPlayerStats 
                  teamName={team.school} 
                  year={2024} 
                  teamColor={teamColor}
                />
              </div>
            </div>
          );
        
      default:
        return <div>Select a tab to view content</div>;
    }
  };

  return (
    <div className="team-dashboard">
      {/* Top Bar */}
      <div className="team-top-bar" style={topBarStyle}>
        <Link to="/teams" className="back-button" style={{ color: getContrastColor(teamColor) }}>
          <FaArrowLeft style={{ marginRight: "8px" }} /> Back
        </Link>
        <div className="team-selector">
          <div className="team-selector-label">Team Select:</div>
          <select 
            className="team-select" 
            value={teamId} 
            onChange={handleTeamChange}
            style={{ borderColor: `${teamColor}50` }}
          >
            {allTeams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.school}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Team Header with animation */}
      <div className="team-header" ref={headerRef} style={{ borderBottom: `1px solid ${teamColor}20` }}>
        <div className="team-logo-container">
          <img
            src={getTeamLogo(team.school)}
            alt={team.school}
            className="team-logo-large"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = "/photos/default_team.png";
            }}
          />
        </div>
        <div className="team-info">
          <h1 className="team-name">{team.school} {team.mascot}</h1>
          <div className="team-meta">
            <div className="meta-item">
              <FaMapMarkerAlt size={18} style={{ color: teamColor }} />
              <span>{team.location?.city}, {team.location?.state}</span>
            </div>
            <div className="meta-item">
              <FaTrophy size={18} style={{ color: teamColor }} />
              <span>{teamConference}</span>
            </div>
            <div className="meta-item">
              <FaUsers size={18} style={{ color: teamColor }} />
              <span>Division I ({team.classification})</span>
            </div>
          </div>
        </div>
      </div>

      {/* UPDATED: Dashboard Navigation Tabs with white background for active tabs */}
      <div className="dashboard-tabs" style={{ borderBottom: `2px solid ${teamColor}30` }}>
        {[
          { id: 'overview', label: 'Overview', icon: <FaInfoCircle /> },
          { id: 'schedule', label: 'Schedule', icon: <FaCalendarAlt /> },
          { id: 'roster', label: 'Roster', icon: <FaUserFriends /> },
          { id: 'ratings', label: 'Ratings', icon: <FaChartLine /> },
          { id: 'teamStats', label: 'Team Stats', icon: <FaChartBar /> },
          { id: 'playerStats', label: 'Player Stats', icon: <FaFootballBall /> }
        ].map(tab => (
          <div 
            key={tab.id}
            className={`tab-item ${activeTab === tab.id ? 'active' : ''}`} 
            onClick={() => handleTabChange(tab.id)}
            style={{
              ...activeTab === tab.id ? activeTabStyle : {},
              '--hover-color': teamColor, // CSS variable for hover effects in stylesheets
            }}
          >
            {/* UPDATED: Team-colored icons in active tabs */}
            <span className="tab-icon" style={activeTab === tab.id ? activeTabIconStyle : tabIconStyle}>
              {tab.icon}
            </span>
            <span className="tab-label">{tab.label}</span>
          </div>
        ))}
      </div>

      {/* Dashboard Content with animation */}
      <div className="dashboard-content" ref={contentRef}>
        {renderTabContent()}
      </div>

      {/* UPDATED: Custom CSS to override default hover styles */}
      <style>{`
        .tab-item:hover {
          background-color: ${teamColor}15 !important; 
          color: ${teamColor} !important;
          border-color: ${teamColor}50 !important;
        }
        .dashboard-card {
          box-shadow: 0 2px 8px ${teamColor}10 !important;
          border: 1px solid ${teamColor}15 !important;
        }
        
        .schedule-winner {
          color: ${teamColor} !important;
          font-weight: bold;
        }
        
        /* UPDATED: Make player icons use team colors */
        .player-icon {
          background-color: ${teamColor}10 !important;
          color: ${teamColor} !important;
        }
        
        /* UPDATED: Style active tab */
        .tab-item.active {
          background-color: #ffffff !important;
          color: ${darkenColor(teamColor, 20)} !important;
          border-color: ${teamColor} !important;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15) !important;
          border-bottom: 3px solid ${teamColor} !important;
        }
        
        /* UPDATED: Style active tab icon */
        .tab-item.active .tab-icon {
          color: ${teamColor} !important;
        }
      `}</style>
    </div>
  );
};

export default TeamDetail;