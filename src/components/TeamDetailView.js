import React, { useState, useEffect, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import teamsService from "../services/teamsService";
import TeamPlayerStats from "./TeamPlayerStats";
import TeamStats from "./TeamStats";
import TeamRoster from "./TeamRoster"; 
import TeamOverview from "./TeamOverview";
import RosterMap from "./RosterMap"; // Import the new RosterMap component

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
  FaChartBar,
  FaExclamationTriangle,
  FaStar,
  FaChevronDown,
  FaChevronUp,
  FaBuilding,    // Replaced FaStadiumAlt with FaBuilding
  FaClock
} from "react-icons/fa";
import RatingsComponent from "./RatingsComponent";
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

// Modern Win indicator
const WinIndicator = () => (
  <div className="win-indicator">
    <span className="result-letter win">W</span>
  </div>
);

// Modern Loss indicator
const LossIndicator = () => (
  <div className="loss-indicator">
    <span className="result-letter loss">L</span>
  </div>
);

// Helper function to lighten a color - MOVED TO TOP LEVEL
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

// Helper function to darken a color - MOVED TO TOP LEVEL
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

const TeamDetail = () => {
  const { teamId } = useParams();
  const navigate = useNavigate();
  const [allTeams, setAllTeams] = useState([]);
  const [team, setTeam] = useState(null);
  const [ratings, setRatings] = useState({});
  const [schedule, setSchedule] = useState([]);
  const [expandedGames, setExpandedGames] = useState({});
  const [gameStats, setGameStats] = useState({});
  const [isLoading, setIsLoading] = useState({
    team: false,
    ratings: false,
    schedule: false,
    teamStats: false,
    playerStats: false,
    rosterMap: false // Added loading state for rosterMap
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
    
    // Set loading state for the respective tab if needed
    if (tab === 'teamStats') {
      setIsLoading(prev => ({ ...prev, teamStats: true }));
      // You would fetch team stats data here if needed
      setTimeout(() => setIsLoading(prev => ({ ...prev, teamStats: false })), 1000);
    } else if (tab === 'playerStats') {
      setIsLoading(prev => ({ ...prev, playerStats: true }));
      // You would fetch player stats data here if needed
      setTimeout(() => setIsLoading(prev => ({ ...prev, playerStats: false })), 1000);
    } else if (tab === 'rosterMap') {
      setIsLoading(prev => ({ ...prev, rosterMap: true }));
      // Set loading briefly for smooth transition
      setTimeout(() => setIsLoading(prev => ({ ...prev, rosterMap: false })), 500);
    }
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
  
  // Set CSS variables for team color
  useEffect(() => {
    if (teamColor) {
      // Convert hex to RGB for opacity values
      const hexToRgb = (hex) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? 
          `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : 
          null;
      };
      
      document.documentElement.style.setProperty('--team-color', teamColor);
      document.documentElement.style.setProperty('--team-color-light', lightenColor(teamColor, 20));
      document.documentElement.style.setProperty('--team-color-rgb', hexToRgb(teamColor));
      
      // Add new CSS variables specifically for stats components
      document.documentElement.style.setProperty('--stats-header-bg', '#ffffff');
      document.documentElement.style.setProperty('--stats-header-border', teamColor);
      document.documentElement.style.setProperty('--stats-highlight', lightenColor(teamColor, 90));
      document.documentElement.style.setProperty('--stats-accent', teamColor);
    }
    
    return () => {
      // Clean up when component unmounts
      document.documentElement.style.removeProperty('--team-color');
      document.documentElement.style.removeProperty('--team-color-light');
      document.documentElement.style.removeProperty('--team-color-rgb');
      document.documentElement.style.removeProperty('--stats-header-bg');
      document.documentElement.style.removeProperty('--stats-header-border');
      document.documentElement.style.removeProperty('--stats-highlight');
      document.documentElement.style.removeProperty('--stats-accent');
    };
  }, [teamColor]);

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
  
  // Generate team color metallic effect
  const getTeamMetallicStyle = (hexColor) => {
    if (!hexColor) return "#333333";
    // We'll use the solid color and add a shine effect with CSS
    return hexColor;
  };

  // Top bar style using team color with metallic effect
  const topBarStyle = {
    background: getTeamMetallicStyle(teamColor),
    color: getContrastColor(teamColor),
    boxShadow: `0 4px 20px ${teamColor}50`,
    position: 'relative',
    overflow: 'hidden' // For the shine effect
  };

  // Style for card headers
  const cardHeaderStyle = {
    background: '#ffffff',
    borderBottom: `2px solid ${teamColor}`,
    color: darkenColor(teamColor, 20)
  };

  // Style for active tabs
  const activeTabStyle = {
    background: '#ffffff',
    color: darkenColor(teamColor, 20),
    borderColor: teamColor,
    boxShadow: `0 2px 8px rgba(0, 0, 0, 0.15)`,
    borderBottom: `3px solid ${teamColor}`
  };

  // Style for tab icons
  const tabIconStyle = {
    color: darkenColor(teamColor, 10)
  };

  // Style for active tab icons
  const activeTabIconStyle = {
    color: teamColor
  };

  // Helper function to format date for schedule
  const formatGameDate = (dateString) => {
    if (!dateString) return "TBD";
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    }).format(date);
  };

  // Helper to determine if a game is in the future
  const isGameInFuture = (dateString) => {
    if (!dateString) return true;
    const gameDate = new Date(dateString);
    return gameDate > new Date();
  };

  // Render the active tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        // Render the imported TeamOverview component
        return <TeamOverview team={team} teamColor={teamColor} year={2024} />;
      
      case 'schedule':
        return (
          <div className="dashboard-card full-width-card">
            <div className="card-header modern-header" style={{
              background: 'white',
              borderBottom: `2px solid ${teamColor}`,
              color: darkenColor(teamColor, 20),
              display: 'flex',
              alignItems: 'center',
              padding: '16px 20px',
              borderTopLeftRadius: '10px',
              borderTopRightRadius: '10px'
            }}>
              <FaCalendarAlt style={{ marginRight: "12px", color: teamColor }} />
              <span style={{ fontSize: '18px', fontWeight: '600' }}>Team Schedule</span>
            </div>
            <div className="card-body" style={{ padding: '0' }}>
              {isLoading.schedule ? (
                <div className="loading-indicator" style={{ 
                  display: 'flex', 
                  justifyContent: 'center', 
                  alignItems: 'center', 
                  padding: '40px',
                  flexDirection: 'column' 
                }}>
                  <LoadingSpinner color={teamColor} />
                  <p style={{ marginTop: '15px', color: '#666' }}>Loading schedule...</p>
                </div>
              ) : (
                <div className="modern-schedule-container" style={{ 
                  padding: '10px'
                }}>
                  {schedule.length > 0 ? (
                    <div className="modern-schedule-list">
                      {schedule.map((game, index) => {
                        const isCompleted = game.homePoints !== null && game.homePoints !== undefined && 
                                          game.awayPoints !== null && game.awayPoints !== undefined;
                        const isFuture = isGameInFuture(game.date);
                        const isHomeWinner = isCompleted && game.homePoints > game.awayPoints;
                        const isAwayWinner = isCompleted && game.homePoints < game.awayPoints;
                        const isExpanded = expandedGames[game.id] || false;
                        const gameData = gameStats[game.id];
                        const formattedDate = formatGameDate(game.date);
                        
                        // Check if the team we're viewing is home or away
                        const isHomeTeam = game.homeTeam === team.school;
                        
                        // Determine opponent and if team won
                        const opponent = isHomeTeam ? game.awayTeam : game.homeTeam;
                        const didTeamWin = isCompleted && ((isHomeTeam && isHomeWinner) || (!isHomeTeam && isAwayWinner));
                        const opponentLogo = isHomeTeam ? 
                          (game.awayLogo || getTeamLogo(game.awayTeam)) : 
                          (game.homeLogo || getTeamLogo(game.homeTeam));
                        
                        return (
                          <div 
                            key={index} 
                            className="modern-game-card" 
                            style={{ 
                              marginBottom: '12px',
                              borderRadius: '12px',
                              boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
                              border: `1px solid ${isExpanded ? lightenColor(teamColor, 80) : '#f0f0f0'}`,
                              overflow: 'hidden',
                              backgroundColor: 'white',
                              transition: 'all 0.3s ease'
                            }}
                          >
                            {/* Game Header */}
                            <div 
                              className="modern-game-header" 
                              onClick={() => toggleGameExpanded(game.id)}
                              style={{ 
                                padding: '16px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                cursor: 'pointer',
                                borderLeft: isExpanded ? `4px solid ${teamColor}` : '4px solid transparent',
                                transition: 'all 0.2s ease',
                                backgroundColor: isExpanded ? lightenColor(teamColor, 97) : 'white'
                              }}
                            >
                              {/* Left Column: Date and Game number */}
                              <div className="game-meta" style={{ 
                                display: 'flex', 
                                flexDirection: 'column',
                                justifyContent: 'center',
                                width: '120px'
                              }}>
                                <div style={{ 
                                  fontSize: '14px', 
                                  fontWeight: '600',
                                  color: teamColor,
                                  marginBottom: '4px'
                                }}>
                                  Game {index + 1}
                                </div>
                                <div style={{ 
                                  fontSize: '13px', 
                                  color: '#666',
                                  display: 'flex',
                                  alignItems: 'center'
                                }}>
                                  {formattedDate}
                                </div>
                              </div>
                              
                              {/* Middle: Teams and Score */}
                              <div className="modern-matchup" style={{ 
                                display: 'flex',
                                alignItems: 'center',
                                flex: 1
                              }}>
                                {/* Opponent Logo and Name */}
                                <div style={{ 
                                  display: 'flex',
                                  alignItems: 'center',
                                  marginRight: '16px'
                                }}>
                                  <div className="team-logo-container" style={{ 
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '50%',
                                    overflow: 'hidden',
                                    backgroundColor: '#f8f8f8',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    marginRight: '12px',
                                    flexShrink: 0,
                                    border: '1px solid #eee'
                                  }}>
                                    <img 
                                      src={opponentLogo} 
                                      alt={opponent}
                                      style={{ 
                                        width: '32px',
                                        height: '32px',
                                        objectFit: 'contain'
                                      }}
                                      onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.src = "/photos/default_team.png";
                                      }}
                                    />
                                  </div>
                                  <div style={{ 
                                    fontWeight: '600',
                                    fontSize: '15px'
                                  }}>
                                    {opponent}
                                  </div>
                                </div>
                                
                                {/* Game Score or Status */}
                                <div style={{ 
                                  marginLeft: 'auto',
                                  marginRight: isFuture ? '16px' : '0',
                                  display: 'flex',
                                  alignItems: 'center'
                                }}>
                                  {isCompleted ? (
                                    <div style={{ 
                                      display: 'flex',
                                      alignItems: 'center'
                                    }}>
                                      <div style={{ 
                                        fontWeight: '700',
                                        fontSize: '18px',
                                        color: didTeamWin ? '#00C853' : '#E53935'
                                      }}>
                                        {isHomeTeam ? game.homePoints : game.awayPoints}
                                      </div>
                                      <div style={{ 
                                        margin: '0 8px',
                                        color: '#999'
                                      }}>-</div>
                                      <div style={{ 
                                        fontWeight: '600',
                                        fontSize: '18px',
                                        color: '#666'
                                      }}>
                                        {isHomeTeam ? game.awayPoints : game.homePoints}
                                      </div>
                                      
                                      <div style={{ marginLeft: '12px' }}>
                                        {didTeamWin ? (
                                          <div style={{ 
                                            backgroundColor: '#00C853',
                                            color: 'white',
                                            width: '28px',
                                            height: '28px',
                                            borderRadius: '50%',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontWeight: '700',
                                            fontSize: '14px',
                                            boxShadow: '0 2px 5px rgba(0, 200, 83, 0.4)'
                                          }}>W</div>
                                        ) : (
                                          <div style={{ 
                                            backgroundColor: '#E53935',
                                            color: 'white',
                                            width: '28px',
                                            height: '28px',
                                            borderRadius: '50%',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontWeight: '700',
                                            fontSize: '14px',
                                            boxShadow: '0 2px 5px rgba(229, 57, 53, 0.4)'
                                          }}>L</div>
                                        )}
                                      </div>
                                    </div>
                                  ) : (
                                    <div style={{ 
                                      display: 'flex',
                                      alignItems: 'center'
                                    }}>
                                      <FaClock style={{ 
                                        color: teamColor,
                                        marginRight: '8px',
                                        fontSize: '14px'
                                      }} />
                                      <div style={{ 
                                        fontSize: '14px',
                                        fontWeight: '500',
                                        color: '#666'
                                      }}>
                                        {game.time || "TBD"}
                                      </div>
                                    </div>
                                  )}
                                </div>
                                
                                {/* Location Info */}
                                {isFuture ? (
                                  <div style={{ 
                                    display: 'flex',
                                    alignItems: 'center',
                                    fontSize: '13px',
                                    color: '#777',
                                    minWidth: '100px'
                                  }}>
                                    <div style={{ 
                                      display: 'flex',
                                      alignItems: 'center'
                                    }}>
                                      <FaMapMarkerAlt style={{ 
                                        marginRight: '6px',
                                        fontSize: '12px',
                                        color: teamColor
                                      }} />
                                      <span style={{ 
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        maxWidth: '140px'
                                      }}>
                                        {isHomeTeam ? 'Home' : 'Away'}
                                      </span>
                                    </div>
                                  </div>
                                ) : null}
                              </div>
                              
                              {/* Toggle Indicator */}
                              <div style={{ 
                                width: '24px',
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center'
                              }}>
                                {isExpanded ? 
                                  <FaChevronUp size={14} color={teamColor} /> : 
                                  <FaChevronDown size={14} color="#999" />
                                }
                              </div>
                            </div>
                            
                            {/* Game Details (Expanded) */}
                            {isExpanded && (
                              <div 
                                className="modern-game-details" 
                                style={{ 
                                  padding: '0 20px 20px 20px',
                                  borderTop: '1px solid #f0f0f0',
                                  backgroundColor: lightenColor(teamColor, 98),
                                  animation: 'fadeIn 0.3s ease-in-out'
                                }}
                              >
                                {/* Game Info */}
                                <div style={{ 
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  padding: '15px 0',
                                  borderBottom: '1px solid #f0f0f0'
                                }}>
                                  {/* Venue */}
                                  <div style={{ 
                                    display: 'flex',
                                    alignItems: 'center'
                                  }}>
                                    <FaMapMarkerAlt style={{ 
                                      color: teamColor,
                                      marginRight: '8px',
                                      fontSize: '14px'
                                    }} />
                                    <div>
                                      <div style={{ 
                                        fontSize: '12px',
                                        color: '#777',
                                        marginBottom: '2px'
                                      }}>
                                        Venue
                                      </div>
                                      <div style={{ 
                                        fontSize: '14px',
                                        fontWeight: '500'
                                      }}>
                                        {game.venue || "TBD"}
                                      </div>
                                    </div>
                                  </div>
                                  
                                  {/* Location */}
                                  <div style={{ 
                                    display: 'flex',
                                    alignItems: 'center'
                                  }}>
                                    <FaBuilding style={{ 
                                      color: teamColor,
                                      marginRight: '8px',
                                      fontSize: '14px'
                                    }} />
                                    <div>
                                      <div style={{ 
                                        fontSize: '12px',
                                        color: '#777',
                                        marginBottom: '2px'
                                      }}>
                                        Location
                                      </div>
                                      <div style={{ 
                                        fontSize: '14px',
                                        fontWeight: '500'
                                      }}>
                                        {isHomeTeam ? 'Home Game' : 'Away Game'}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                
                                {/* Impact Players Section */}
                                {isCompleted && (
                                  <div className="impact-players-section" style={{ 
                                    marginTop: '15px'
                                  }}>
                                    <div style={{ 
                                      fontSize: '16px',
                                      fontWeight: '600',
                                      display: 'flex',
                                      alignItems: 'center',
                                      marginBottom: '12px',
                                      color: darkenColor(teamColor, 15)
                                    }}>
                                      <FaStar style={{ 
                                        color: teamColor,
                                        marginRight: '8px',
                                        fontSize: '14px'
                                      }} />
                                      Game Impact Players
                                    </div>
                                    
                                    {gameData ? (
                                      <div className="players-grid" style={{ 
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                                        gap: '16px'
                                      }}>
                                        {/* Home team impact players */}
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
                                              <div key={i} style={{ 
                                                backgroundColor: 'white',
                                                borderRadius: '10px',
                                                padding: '12px',
                                                boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                                                border: '1px solid #f0f0f0'
                                              }}>
                                                <div style={{ 
                                                  display: 'flex',
                                                  alignItems: 'center',
                                                  marginBottom: '8px'
                                                }}>
                                                  <div className="team-badge" style={{ 
                                                    width: '20px',
                                                    height: '20px',
                                                    borderRadius: '50%',
                                                    overflow: 'hidden',
                                                    marginRight: '8px'
                                                  }}>
                                                    <img 
                                                      src={game.homeLogo || getTeamLogo(game.homeTeam)} 
                                                      alt={game.homeTeam}
                                                      style={{ 
                                                        width: '100%',
                                                        height: '100%',
                                                        objectFit: 'contain'
                                                      }}
                                                    />
                                                  </div>
                                                  <div style={{ 
                                                    fontSize: '12px',
                                                    color: '#777'
                                                  }}>
                                                    {game.homeTeam}
                                                  </div>
                                                </div>
                                                
                                                <div style={{ 
                                                  fontSize: '16px',
                                                  fontWeight: '600',
                                                  marginBottom: '4px'
                                                }}>
                                                  {player.player}
                                                </div>
                                                
                                                <div style={{ 
                                                  display: 'flex',
                                                  justifyContent: 'space-between',
                                                  alignItems: 'center'
                                                }}>
                                                  <div style={{ 
                                                    fontSize: '13px',
                                                    color: '#777',
                                                    backgroundColor: '#f5f5f5',
                                                    padding: '3px 8px',
                                                    borderRadius: '12px'
                                                  }}>
                                                    {player.position}
                                                  </div>
                                                  
                                                  <div style={{ 
                                                    fontSize: '13px',
                                                    fontWeight: '500',
                                                    color: darkenColor(teamColor, 20)
                                                  }}>
                                                    {stat}
                                                  </div>
                                                </div>
                                              </div>
                                            );
                                          })}
                                          
                                        {/* Away team impact players */}
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
                                              <div key={i} style={{ 
                                                backgroundColor: 'white',
                                                borderRadius: '10px',
                                                padding: '12px',
                                                boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                                                border: '1px solid #f0f0f0'
                                              }}>
                                                <div style={{ 
                                                  display: 'flex',
                                                  alignItems: 'center',
                                                  marginBottom: '8px'
                                                }}>
                                                  <div className="team-badge" style={{ 
                                                    width: '20px',
                                                    height: '20px',
                                                    borderRadius: '50%',
                                                    overflow: 'hidden',
                                                    marginRight: '8px'
                                                  }}>
                                                    <img 
                                                      src={game.awayLogo || getTeamLogo(game.awayTeam)} 
                                                      alt={game.awayTeam}
                                                      style={{ 
                                                        width: '100%',
                                                        height: '100%',
                                                        objectFit: 'contain'
                                                      }}
                                                    />
                                                  </div>
                                                  <div style={{ 
                                                    fontSize: '12px',
                                                    color: '#777'
                                                  }}>
                                                    {game.awayTeam}
                                                  </div>
                                                </div>
                                                
                                                <div style={{ 
                                                  fontSize: '16px',
                                                  fontWeight: '600',
                                                  marginBottom: '4px'
                                                }}>
                                                  {player.player}
                                                </div>
                                                
                                                <div style={{ 
                                                  display: 'flex',
                                                  justifyContent: 'space-between',
                                                  alignItems: 'center'
                                                }}>
                                                  <div style={{ 
                                                    fontSize: '13px',
                                                    color: '#777',
                                                    backgroundColor: '#f5f5f5',
                                                    padding: '3px 8px',
                                                    borderRadius: '12px'
                                                  }}>
                                                    {player.position}
                                                  </div>
                                                  
                                                  <div style={{ 
                                                    fontSize: '13px',
                                                    fontWeight: '500',
                                                    color: darkenColor(teamColor, 20)
                                                  }}>
                                                    {stat}
                                                  </div>
                                                </div>
                                              </div>
                                            );
                                          })}
                                      </div>
                                    ) : (
                                      <div style={{ 
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        padding: '20px'
                                      }}>
                                        <LoadingSpinner color={teamColor} />
                                        <span style={{ marginLeft: '15px' }}>Loading player stats...</span>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div style={{ 
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '40px 20px',
                      backgroundColor: '#fafafa',
                      borderRadius: '8px',
                      margin: '10px'
                    }}>
                      <FaCalendarAlt style={{ 
                        fontSize: '32px', 
                        color: '#ccc',
                        marginBottom: '15px'
                      }} />
                      <div style={{ 
                        fontSize: '16px',
                        color: '#666',
                        marginBottom: '5px',
                        fontWeight: '500'
                      }}>
                        No schedule information available
                      </div>
                      <div style={{ 
                        fontSize: '14px',
                        color: '#999'
                      }}>
                        Check back later for schedule updates
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      
      case 'roster':
        // Render the imported TeamRoster component
        return <TeamRoster teamName={team.school} teamColor={teamColor} year={2024} />;
      
      case 'rosterMap':
        // Now render the new RosterMap component instead of ComingSoon
        return (
          isLoading.rosterMap ? (
            <div className="dashboard-card full-width-card">
              <div className="card-header" style={cardHeaderStyle}>
                <FaMapMarkerAlt style={{ marginRight: "12px", color: teamColor }} />
                Roster Map
              </div>
              <div className="card-body" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '40px' }}>
                <LoadingSpinner color={teamColor} />
                <p style={{ marginLeft: '20px' }}>Loading roster map...</p>
              </div>
            </div>
          ) : (
            <RosterMap teamName={team.school} teamColor={teamColor} year={2024} />
          )
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
          <div className="dashboard-card full-width-card stats-card">
            <div className="card-header" style={cardHeaderStyle}>
              <FaChartBar style={{ marginRight: "12px", color: teamColor }} />
              Team Statistics
            </div>
            <div className="card-body">
              {isLoading.teamStats ? (
                <div className="loading-indicator">
                  <LoadingSpinner color={teamColor} />
                  <p>Loading team statistics...</p>
                </div>
              ) : (
                <TeamStats 
                  teamName={team.school} 
                  year={2024} 
                  teamColor={teamColor}
                />
              )}
            </div>
          </div>
        );
        
      case 'playerStats':
        return (
          <div className="dashboard-card full-width-card stats-card">
            <div className="card-header" style={cardHeaderStyle}>
              <FaFootballBall style={{ marginRight: "12px", color: teamColor }} />
              Player Statistics
            </div>
            <div className="card-body">
              {isLoading.playerStats ? (
                <div className="loading-indicator">
                  <LoadingSpinner color={teamColor} />
                  <p>Loading player statistics...</p>
                </div>
              ) : (
                <TeamPlayerStats 
                  teamName={team.school} 
                  year={2024} 
                  teamColor={teamColor}
                />
              )}
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
        <div className="team-detail-logo-container">
          <img
            src={getTeamLogo(team.school)}
            alt={team.school}
            className="team-detail-logo-large"
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

      {/* Dashboard Navigation Tabs */}
      <div className="dashboard-tabs" style={{ borderBottom: `2px solid ${teamColor}30` }}>
        {[
          { id: 'overview', label: 'Overview', icon: <FaInfoCircle /> },
          { id: 'schedule', label: 'Schedule', icon: <FaCalendarAlt /> },
          { id: 'roster', label: 'Roster', icon: <FaUserFriends /> },
          { id: 'rosterMap', label: 'Roster Map', icon: <FaMapMarkerAlt /> },
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
              '--hover-color': teamColor,
            }}
          >
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

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;700&display=swap');
        
        .dashboard-content {
          flex: 1;
          min-width: 0; /* Ensures content can shrink below min-content width */
        }
        
        .color-swatch {
          width: 24px;
          height: 24px;
          border-radius: 4px;
          border: 1px solid rgba(0,0,0,0.1);
        }

        /* Animation for expanding game details */
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        /* Responsive adjustments */
        @media (max-width: 1024px) {
          .dashboard-layout {
            flex-direction: column;
          }
          
          .team-sidebar {
            width: 100%;
            margin-top: 20px;
          }
          
          .modern-matchup {
            flex-direction: column;
            align-items: flex-start;
          }
          
          .modern-game-header {
            flex-wrap: wrap;
          }
        }
        
        /* Basic styles */
        .tab-item:hover {
          background-color: ${teamColor}15 !important; 
          color: ${teamColor} !important;
          border-color: ${teamColor}50 !important;
        }
        .dashboard-card {
          box-shadow: 0 2px 8px ${teamColor}10 !important;
          border: 1px solid ${teamColor}15 !important;
        }
        
        /* Result letters */
        .result-letter {
          font-family: 'Orbitron', sans-serif;
          font-weight: 700;
          display: inline-block;
          width: 24px;
          height: 24px;
          line-height: 24px;
          text-align: center;
          border-radius: 50%;
          margin-left: 6px;
          font-size: 14px;
        }
        
        .result-letter.win {
          color: white;
          background-color: #00C853;
          position: relative;
          overflow: hidden;
          box-shadow: 0 0 5px rgba(0, 200, 83, 0.6);
        }
        
        .result-letter.win:after {
          content: '';
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: linear-gradient(
            45deg, 
            rgba(255,255,255,0) 0%, 
            rgba(255,255,255,0.1) 50%, 
            rgba(255,255,255,0) 100%
          );
          transform: rotate(45deg);
          animation: shine 2s infinite;
        }
        
        @keyframes shine {
          0% {
            left: -100%;
            top: -100%;
          }
          100% {
            left: 100%;
            top: 100%;
          }
        }
        
        .result-letter.loss {
          color: white;
          background-color: #F44336;
          animation: pulse 2s infinite;
          box-shadow: 0 0 5px rgba(244, 67, 54, 0.6);
        }
        
        @keyframes pulse {
          0% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.1);
            opacity: 0.8;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
        
        .player-icon {
          background-color: ${teamColor}10 !important;
          color: ${teamColor} !important;
        }
        
        .tab-item.active {
          background-color: #ffffff !important;
          color: ${darkenColor(teamColor, 20)} !important;
          border-color: ${teamColor} !important;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15) !important;
          border-bottom: 3px solid ${teamColor} !important;
        }
        
        .tab-item.active .tab-icon {
          color: ${teamColor} !important;
        }
        
        .home-team, .away-team {
          display: flex;
          align-items: center;
        }
        
        .win-indicator, .loss-indicator {
          margin-left: 8px;
        }
        
        /* Stats specific styling */
        .stats-card .stat-header {
          background-color: #ffffff !important;
          border-bottom: 2px solid ${teamColor} !important;
          color: ${darkenColor(teamColor, 20)} !important;
        }
        
        .stats-card .stat-row:hover {
          background-color: ${lightenColor(teamColor, 92)} !important;
        }
        
        .stats-card .stat-highlight {
          color: ${teamColor} !important;
          font-weight: bold;
        }
        
        .stats-card .stat-value-high {
          color: ${teamColor} !important;
        }
        
        .stats-card .stat-category-header {
          background: ${lightenColor(teamColor, 90)} !important;
          border-left: 4px solid ${teamColor} !important;
        }
        
        /* Team Stats specific styling */
        .team-stats-table th {
          background-color: #ffffff !important;
          color: ${darkenColor(teamColor, 20)} !important;
        }
        
        .team-stats-table tr:nth-child(odd) {
          background-color: ${lightenColor(teamColor, 98)} !important;
        }
        
        .team-stats-table tr:hover {
          background-color: ${lightenColor(teamColor, 85)} !important;
        }
        
        .team-stats-ranking {
          color: ${teamColor} !important;
          font-weight: bold;
        }
        
        /* Player Stats specific styling */
        .player-stats-table th {
          background-color: #ffffff !important;
          color: ${darkenColor(teamColor, 15)} !important;
          border-bottom: 2px solid ${teamColor} !important;
        }
        
        .player-stats-table tr:hover {
          background-color: ${lightenColor(teamColor, 95)} !important;
        }
        
        .player-stats-table .player-highlighted {
          background-color: ${lightenColor(teamColor, 95)} !important;
          font-weight: bold;
        }
        
        .player-stat-leader {
          position: relative;
        }
        
        .player-stat-leader::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          width: 100%;
          height: 2px;
          background-color: ${teamColor} !important;
        }
        
        .stat-filter-button {
          background-color: white;
          border: 1px solid ${teamColor}30 !important;
          color: ${teamColor} !important;
        }
        
        .stat-filter-button.active {
          background-color: ${teamColor} !important;
          color: white !important;
        }
        
        /* Chart styling for both team and player stats */
        .stats-chart .recharts-default-tooltip {
          border-color: ${teamColor} !important;
        }
        
        .stats-chart .recharts-line {
          stroke: ${teamColor} !important;
        }
        
        .stats-chart .recharts-area {
          fill: ${teamColor}30 !important;
        }
        
        .stats-chart .recharts-dot {
          fill: ${teamColor} !important;
        }
        
        /* Metallic top bar effect */
        .team-top-bar::before {
          content: '';
          position: absolute;
          top: 0;
          left: -150%;
          width: 100%;
          height: 100%;
          background: linear-gradient(
            to right,
            rgba(255, 255, 255, 0) 0%,
            rgba(255, 255, 255, 0.15) 50%,
            rgba(255, 255, 255, 0) 100%
          );
          transform: skewX(-25deg);
          animation: shine 4s infinite;
          z-index: 1;
        }
        
        .team-top-bar::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(
            to bottom,
            rgba(255, 255, 255, 0.1) 0%,
            rgba(255, 255, 255, 0) 40%,
            rgba(0, 0, 0, 0.05) 100%
          );
          z-index: 0;
        }
        
        .team-top-bar * {
          position: relative;
          z-index: 2;
        }
        
        @keyframes shine {
          0% { left: -150%; }
          40% { left: -150%; }
          60% { left: 150%; }
          100% { left: 150%; }
        }
      `}</style>
    </div>
  );
};

export default TeamDetail;