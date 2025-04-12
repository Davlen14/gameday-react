import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import teamsService from '../services/teamsService';
import graphqlTeamsService from '../services/graphqlTeamsService';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Cell, 
  ReferenceLine, 
  Legend,
  LineChart,
  Line,
  CartesianGrid,
  AreaChart,
  Area,
  ScatterChart,
  Scatter,
  ZAxis,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';
import { 
  FaTrophy, 
  FaChartBar, 
  FaFootballBall, 
  FaChartLine, 
  FaRegLightbulb, 
  FaStar,
  FaArrowUp, 
  FaArrowDown, 
  FaUserAlt, 
  FaUsers, 
  FaRunning, 
  FaShieldAlt,
  FaFilter,
  FaAngleDown,
  FaRegChartBar,
  FaRegListAlt,
  FaFireAlt,
  FaInfoCircle,
  FaMedal,
  FaClipboardList,
  FaBullseye,
  FaExclamationTriangle,
  FaThumbsUp,
  FaBalanceScale,
  FaHistory,
  FaMountain,
  FaSearchPlus
} from 'react-icons/fa';

// Import utility functions from utils folder
import { 
  generateGameAnalysis, 
  getOrdinalNum 
} from '../utils/gameAnalysis';

import { calculatePlayerGrades } from '../utils/playerGrading';

// Import CSS styles
import "../styles/PlayerGameGrade.css";

// Add this function at the top of your file for safely parsing colors
const safeColorParse = (color, fallback = '#cccccc') => {
  if (!color || color === 'null' || color === '#null') return fallback;
  return color.startsWith('#') ? color : `#${color}`;
};

// Add a function to generate contrasting text color for background colors
const getContrastColor = (hexColor) => {
  if (!hexColor || hexColor.length < 7) return '#ffffff';
  
  // Remove the hash if it exists
  hexColor = hexColor.replace(/^#/, '');
  
  // Parse the hex values to RGB
  const r = parseInt(hexColor.substring(0, 2), 16);
  const g = parseInt(hexColor.substring(2, 4), 16);
  const b = parseInt(hexColor.substring(4, 6), 16);
  
  // Calculate brightness (YIQ formula)
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  
  // Return black for bright colors, white for dark colors
  return brightness > 128 ? '#000000' : '#ffffff';
};

const PlayerGameGrade = ({ gameId: propGameId }) => {
  const { gameId: urlGameId } = useParams();
  const navigate = useNavigate();
  
  // Use the prop gameId if provided, otherwise use the URL parameter
  const gameId = propGameId || urlGameId;
  
  // Add team data state
  const [teamData, setTeamData] = useState({
    home: { color: '#3b82f6', alternateColor: '#1e40af', logo: null },
    away: { color: '#ef4444', alternateColor: '#b91c1c', logo: null }
  });
  
  // State management
  const [gameData, setGameData] = useState(null);
  const [playerGrades, setPlayerGrades] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState('all');
  const [selectedPosition, setSelectedPosition] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [gameAnalysis, setGameAnalysis] = useState(null);
  const [activeAnalysisTab, setActiveAnalysisTab] = useState('overview');
  const [showAdvancedStats, setShowAdvancedStats] = useState(false);

  // Enhanced data fetching with team colors and logos
  useEffect(() => {
    const fetchGameData = async () => {
      if (!gameId) {
        setError("No game ID provided");
        setIsLoading(false);
        return;
      }
    
      try {
        setIsLoading(true);
        setError(null);
        
        // First, fetch all data sources in parallel for efficiency
        console.log("Fetching data for game ID:", gameId);
        
        const [playByPlayData, advancedBoxScore, scoreboardData, gameInfoData] = await Promise.all([
          teamsService.getPlayByPlay(gameId)
            .catch(err => {
              console.error("Error fetching play-by-play:", err);
              console.log("Continuing without play-by-play data");
              return null;
            }),
            
          teamsService.getAdvancedBoxScore(gameId)
            .catch(err => {
              console.error("Error fetching advanced box score:", err);
              throw new Error("Failed to fetch advanced box score - this data is required");
            }),
          
          graphqlTeamsService.getGameScoreboard(gameId)
            .catch(err => {
              console.error("Error fetching scoreboard data:", err);
              console.log("Continuing without scoreboard data");
              return null;
            }),
          
          graphqlTeamsService.getGameInfo(gameId)
            .catch(err => {
              console.error("Error fetching game info:", err);
              console.log("Continuing without game info data");
              return null;
            })
        ]);
        
        // Check for required box score data
        if (!advancedBoxScore) {
          throw new Error("No box score data available for this game");
        }
        
        // Get the team names from box score data
        const homeTeamName = advancedBoxScore.gameInfo?.homeTeam;
        const awayTeamName = advancedBoxScore.gameInfo?.awayTeam;
        
        // Fetch team information to get colors and logos
        let homeTeamData = { color: '#3b82f6', alternateColor: '#1e40af', logo: null };
        let awayTeamData = { color: '#ef4444', alternateColor: '#b91c1c', logo: null };
        
        try {
          if (homeTeamName) {
            const allTeams = await teamsService.getTeams();
            const homeTeam = allTeams.find(t => t.school === homeTeamName);
            const awayTeam = allTeams.find(t => t.school === awayTeamName);
            
            if (homeTeam) {
              homeTeamData = {
                color: safeColorParse(homeTeam.color, '#3b82f6'),
                alternateColor: safeColorParse(homeTeam.alt_color, '#1e40af'),
                logo: homeTeam.logos && homeTeam.logos.length > 0 ? homeTeam.logos[0] : null
              };
            }
            
            if (awayTeam) {
              awayTeamData = {
                color: safeColorParse(awayTeam.color, '#ef4444'),
                alternateColor: safeColorParse(awayTeam.alt_color, '#b91c1c'),
                logo: awayTeam.logos && awayTeam.logos.length > 0 ? awayTeam.logos[0] : null
              };
            }
            
            setTeamData({
              home: homeTeamData,
              away: awayTeamData
            });
          }
        } catch (err) {
          console.error("Error fetching team data:", err);
          console.log("Using default team colors");
        }
        
        // Log what data sources we have to help with debugging
        console.log("Available data sources:");
        console.log("- Play-by-play:", playByPlayData ? "Yes" : "No");
        console.log("- Advanced box score:", advancedBoxScore ? "Yes" : "No");
        console.log("- Scoreboard:", scoreboardData ? "Yes" : "No");
        console.log("- Game info:", gameInfoData ? "Yes" : "No");
        
        // Generate game analysis with all available data sources
        const gameAnalysisData = generateGameAnalysis({
          playByPlay: playByPlayData,
          boxScore: advancedBoxScore,
          scoreboard: scoreboardData,
          gameInfo: gameInfoData
        });
        
        // Process player grades
        console.log("Calculating detailed player grades");
        const processedGrades = calculatePlayerGrades({
          playByPlay: playByPlayData,
          boxScore: advancedBoxScore
        });
    
        // Update state with all data
        setGameData({
          playByPlay: playByPlayData,
          advancedBoxScore,
          scoreboard: scoreboardData,
          gameInfo: gameInfoData
        });
        
        setPlayerGrades(processedGrades);
        setGameAnalysis(gameAnalysisData);
    
        // Set default selected team to home team
        if (advancedBoxScore.gameInfo?.homeTeam) {
          setSelectedTeam(advancedBoxScore.gameInfo.homeTeam);
        }
        
        // Always start with the overview tab
        setActiveAnalysisTab('overview');
        
      } catch (err) {
        console.error("Error processing game data:", err);
        setError(err.message || "Failed to load or process game data. Please check the game ID and try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchGameData();
  }, [gameId]);

  // Filter and memoize grades
  const filteredGrades = useMemo(() => {
    return playerGrades.filter(player => {
      const teamMatch = selectedTeam === 'all' || player.team === selectedTeam;
      const positionMatch = selectedPosition === 'all' || player.position === selectedPosition;
      return teamMatch && positionMatch && player.playCount >= 2;
    });
  }, [playerGrades, selectedTeam, selectedPosition]);

  // Grade class and description helpers
  const getGradeClass = (grade) => {
    if (grade >= 90) return 'tppg-grade-elite';
    if (grade >= 80) return 'tppg-grade-exceptional';
    if (grade >= 70) return 'tppg-grade-good';
    if (grade >= 60) return 'tppg-grade-average';
    return 'tppg-grade-poor';
  };

  const getGradeDescription = (grade) => {
    if (grade >= 90) return 'Elite Performance';
    if (grade >= 80) return 'Exceptional';
    if (grade >= 70) return 'Very Good';
    if (grade >= 60) return 'Average';
    return 'Below Average';
  };

  // Get the grade icon based on performance
  const getGradeIcon = (grade) => {
    if (grade >= 90) return <FaTrophy />;
    if (grade >= 80) return <FaMedal />;
    if (grade >= 70) return <FaStar />;
    if (grade >= 60) return <FaRegLightbulb />;
    return <FaRegChartBar />;
  };

  // Create a helper function for team logos
  const TeamLogo = ({ team, size = 24 }) => {
    const teamObj = team === gameAnalysis?.gameInfo?.homeTeam ? teamData.home : teamData.away;
    
    if (!teamObj.logo) {
      return <span className="tppg-team-text">{team}</span>;
    }
    
    return (
      <div className="tppg-team-logo-wrapper">
        <img 
          src={teamObj.logo} 
          alt={`${team} logo`} 
          className="tppg-team-logo" 
          style={{ width: size, height: size }}
        />
        <span className="tppg-team-text">{team}</span>
      </div>
    );
  };

  // Data availability checks for each tab
  const hasOverviewData = useCallback(() => {
    return gameAnalysis && gameAnalysis.overview;
  }, [gameAnalysis]);

  const hasQuarterData = useCallback(() => {
    return gameAnalysis && gameAnalysis.quarterAnalysis && gameAnalysis.quarterAnalysis.length > 0;
  }, [gameAnalysis]);

  const hasKeyPlaysData = useCallback(() => {
    return gameAnalysis && gameAnalysis.keyPlays && gameAnalysis.keyPlays.length > 0;
  }, [gameAnalysis]);

  const hasStarPlayersData = useCallback(() => {
    return gameAnalysis && gameAnalysis.starPlayers && gameAnalysis.starPlayers.length > 0;
  }, [gameAnalysis]);

  // Handle tab changes
  const handleTabClick = useCallback((tabId) => {
    setActiveAnalysisTab(tabId);
  }, []);

  if (isLoading) return (
    <div className="tppg-loading">
      <FaFootballBall className="tppg-loading-icon" /> 
      <span>Loading comprehensive game analysis...</span>
    </div>
  );
  
  if (error) return (
    <div className="tppg-error">
      <FaExclamationTriangle className="tppg-error-icon" />
      <h3>Error Loading Game Data</h3>
      <p>{error}</p>
      <p className="tppg-try-again">Please check the game ID and try again</p>
    </div>
  );

  if (!gameAnalysis) {
    return (
      <div className="tppg-error">
        <FaExclamationTriangle className="tppg-error-icon" />
        <h3>Analysis Not Available</h3>
        <p>Unable to generate game analysis. The required data may be incomplete.</p>
        <p className="tppg-try-again">Please try another game or contact support if this problem persists.</p>
      </div>
    );
  }

  const homeColor = teamData.home.color;
  const awayColor = teamData.away.color;
  const homeAltColor = teamData.home.alternateColor;
  const awayAltColor = teamData.away.alternateColor;

  // Set dynamic styles based on team colors
  const dynamicStyles = {
    homeTeamColor: homeColor,
    awayTeamColor: awayColor,
    homeTeamLight: `${homeColor}20`, // 20% opacity
    awayTeamLight: `${awayColor}20`, // 20% opacity
    homeTextColor: getContrastColor(homeColor),
    awayTextColor: getContrastColor(awayColor)
  };

  const handleBackClick = () => {
    navigate('/games');
  };

  return (
    <div 
      className="tppg-container"
      style={{
        // Set CSS variables for team colors that can be used throughout the component
        '--home-team-color': dynamicStyles.homeTeamColor,
        '--away-team-color': dynamicStyles.awayTeamColor,
        '--home-team-alt-color': homeAltColor,
        '--away-team-alt-color': awayAltColor,
        '--home-team-light': dynamicStyles.homeTeamLight,
        '--away-team-light': dynamicStyles.awayTeamLight,
        '--home-text-color': dynamicStyles.homeTextColor,
        '--away-text-color': dynamicStyles.awayTextColor,
      }}
    >
      <div className="tppg-analysis">
        <div className="tppg-header-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h1 className="tppg-analysis-heading">
            <FaFootballBall /> Game Analysis
          </h1>
          <button 
            onClick={handleBackClick}
            className="tppg-back-button"
            style={{
              padding: '8px 16px',
              background: homeColor,
              color: dynamicStyles.homeTextColor,
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '14px',
              fontWeight: '600',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
              <path fillRule="evenodd" d="M15 8a.5.5 0 0 0-.5-.5H2.707l3.147-3.146a.5.5 0 1 0-.708-.708l-4 4a.5.5 0 0 0 0 .708l4 4a.5.5 0 0 0 .708-.708L2.707 8.5H14.5A.5.5 0 0 0 15 8z"/>
            </svg>
            Back to Games
          </button>
        </div>
        
        <div className="tppg-game-score">
          <div className={`tppg-team-container ${gameAnalysis.homeWin ? 'tppg-winner' : ''}`}
               style={{ borderColor: homeColor }}>
            <span className="tppg-team-name">
              {teamData.home.logo && (
                <img 
                  src={teamData.home.logo} 
                  alt={`${gameAnalysis.gameInfo?.homeTeam} logo`} 
                  className="tppg-team-logo" 
                />
              )}
              {gameAnalysis.gameInfo?.homeTeam}
            </span>
            <span className="tppg-team-score" style={{ backgroundColor: homeColor, color: dynamicStyles.homeTextColor }}>
              {gameAnalysis.gameInfo?.homePoints}
            </span>
            {gameAnalysis.homeWin && <FaTrophy className="tppg-winner-icon" />}
          </div>
          <span className="tppg-vs">vs</span>
          <div className={`tppg-team-container ${!gameAnalysis.homeWin ? 'tppg-winner' : ''}`}
               style={{ borderColor: awayColor }}>
            <span className="tppg-team-score" style={{ backgroundColor: awayColor, color: dynamicStyles.awayTextColor }}>
              {gameAnalysis.gameInfo?.awayPoints}
            </span>
            <span className="tppg-team-name">
              {gameAnalysis.gameInfo?.awayTeam}
              {teamData.away.logo && (
                <img 
                  src={teamData.away.logo} 
                  alt={`${gameAnalysis.gameInfo?.awayTeam} logo`} 
                  className="tppg-team-logo" 
                />
              )}
            </span>
            {!gameAnalysis.homeWin && <FaTrophy className="tppg-winner-icon" />}
          </div>
        </div>
        
        <div className="tppg-tabs">
          {[
            { id: 'overview', label: 'Game Overview', icon: <FaRegListAlt />, hasData: hasOverviewData() },
            { id: 'quarterBreakdown', label: 'Quarter Analysis', icon: <FaChartLine />, hasData: hasQuarterData() },
            { id: 'keyPlays', label: 'Key Plays', icon: <FaFireAlt />, hasData: hasKeyPlaysData() },
            { id: 'starPlayers', label: 'Star Players', icon: <FaStar />, hasData: hasStarPlayersData() }
          ].map(tab => (
            <button
              key={tab.id}
              className={`tppg-tab ${activeAnalysisTab === tab.id ? 'tppg-active' : ''} ${!tab.hasData ? 'tppg-disabled' : ''}`}
              onClick={() => tab.hasData && handleTabClick(tab.id)}
              disabled={!tab.hasData}
              style={activeAnalysisTab === tab.id ? { borderBottomColor: homeColor, color: homeColor } : {}}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
        
        <div className="tppg-tab-content">
          {activeAnalysisTab === 'overview' && hasOverviewData() && (
            <div className="tppg-overview">
              <h3 className="tppg-overview-title">Game Summary</h3>
              <p className="tppg-overview-text">{gameAnalysis.overview}</p>
              <p className="tppg-overview-text">{gameAnalysis.gameStory}</p>
              
              {gameAnalysis.turningPoint?.exists && (
                <div className="tppg-turning-point" style={{ borderLeftColor: homeColor, backgroundColor: dynamicStyles.homeTeamLight }}>
                  <h4><FaHistory /> Turning Point</h4>
                  <p>{gameAnalysis.turningPoint.description}</p>
                </div>
              )}
              
              <div className="tppg-stats-grid">
                <div className="tppg-stat-card">
                  <h4 className="tppg-stat-card-title">
                    <FaChartLine /> Game Flow
                  </h4>
                  {gameAnalysis.quarterAnalysis?.map((quarter, i) => {
                    const homePts = quarter.homeScoring;
                    const awayPts = quarter.awayScoring;
                    const homeTeam = gameAnalysis.gameInfo?.homeTeam;
                    const awayTeam = gameAnalysis.gameInfo?.awayTeam;
                    
                    return (
                      <div key={i} className="tppg-overview-text">
                        <strong>Q{quarter.quarter}:</strong>{' '}
                        <span style={{ color: homeColor }}>
                          {teamData.home.logo && (
                            <img 
                              src={teamData.home.logo} 
                              alt={`${homeTeam} logo`}
                              className="tppg-inline-logo"
                              style={{ width: 16, height: 16, verticalAlign: 'middle', marginRight: 4 }}
                            />
                          )}
                          {homeTeam} {homePts}
                        </span>, {' '}
                        <span style={{ color: awayColor }}>
                          {teamData.away.logo && (
                            <img 
                              src={teamData.away.logo} 
                              alt={`${awayTeam} logo`}
                              className="tppg-inline-logo"
                              style={{ width: 16, height: 16, verticalAlign: 'middle', marginRight: 4 }}
                            />
                          )}
                          {awayTeam} {awayPts}
                        </span>
                        {homePts === awayPts ? " (Even quarter)" : 
                          homePts > awayPts ? (
                            <span style={{ color: homeColor }}>
                              {` (${homeTeam} +${homePts-awayPts})`}
                            </span>
                          ) : (
                            <span style={{ color: awayColor }}>
                              {` (${awayTeam} +${awayPts-homePts})`}
                            </span>
                          )
                        }
                      </div>
                    );
                  })}                    
                </div>
                
                <div className="tppg-stat-card">
                  <h4 className="tppg-stat-card-title">
                    <FaBullseye /> Keys to Victory
                  </h4>
                  <div className="tppg-keys-list">
                    {gameAnalysis.keysToVictory?.map((key, i) => (
                      <div key={i} className="tppg-key-item">
                        <span className="tppg-key-bullet" style={{ color: homeColor }}>•</span> {key}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="tppg-team-comparison">
                <h4 className="tppg-comparison-title">
                  <FaBalanceScale /> Team Comparison
                </h4>
                <div className="tppg-comparison-grid">
                  <div className="tppg-comparison-card" style={{ borderLeft: `4px solid ${homeColor}` }}>
                    <h5>
                      {teamData.home.logo && (
                        <img 
                          src={teamData.home.logo} 
                          alt={`${gameAnalysis.gameInfo?.homeTeam} logo`}
                          className="tppg-inline-logo"
                          style={{ width: 20, height: 20, verticalAlign: 'middle', marginRight: 6 }}
                        />
                      )}
                      {gameAnalysis.gameInfo?.homeTeam} Strengths
                    </h5>
                    <ul className="tppg-strengths-list">
                      {gameAnalysis.teamStrengths[gameAnalysis.gameInfo?.homeTeam]?.map((strength, i) => (
                        <li key={i}>{strength}</li>
                      ))}
                      {gameAnalysis.teamStrengths[gameAnalysis.gameInfo?.homeTeam]?.length === 0 && (
                        <li>No notable strengths identified</li>
                      )}
                    </ul>
                  </div>
                  <div className="tppg-comparison-card" style={{ borderLeft: `4px solid ${awayColor}` }}>
                    <h5>
                      {teamData.away.logo && (
                        <img 
                          src={teamData.away.logo} 
                          alt={`${gameAnalysis.gameInfo?.awayTeam} logo`}
                          className="tppg-inline-logo"
                          style={{ width: 20, height: 20, verticalAlign: 'middle', marginRight: 6 }}
                        />
                      )}
                      {gameAnalysis.gameInfo?.awayTeam} Strengths
                    </h5>
                    <ul className="tppg-strengths-list">
                      {gameAnalysis.teamStrengths[gameAnalysis.gameInfo?.awayTeam]?.map((strength, i) => (
                        <li key={i}>{strength}</li>
                      ))}
                      {gameAnalysis.teamStrengths[gameAnalysis.gameInfo?.awayTeam]?.length === 0 && (
                        <li>No notable strengths identified</li>
                      )}
                    </ul>
                  </div>
                </div>
                
                <div className="tppg-team-stats-comparison">
                  <div className="tppg-comparison-row tppg-comparison-header">
                    <div>
                      {teamData.home.logo && (
                        <img 
                          src={teamData.home.logo} 
                          alt={`${gameAnalysis.gameInfo?.homeTeam} logo`}
                          className="tppg-inline-logo"
                          style={{ width: 20, height: 20, verticalAlign: 'middle', marginRight: 6 }}
                        />
                      )}
                      {gameAnalysis.gameInfo?.homeTeam}
                    </div>
                    <div>Statistic</div>
                    <div>
                      {gameAnalysis.gameInfo?.awayTeam}
                      {teamData.away.logo && (
                        <img 
                          src={teamData.away.logo} 
                          alt={`${gameAnalysis.gameInfo?.awayTeam} logo`}
                          className="tppg-inline-logo"
                          style={{ width: 20, height: 20, verticalAlign: 'middle', marginLeft: 6 }}
                        />
                      )}
                    </div>
                  </div>
                  
                  <div className="tppg-comparison-row">
                    <div className={gameAnalysis.teamEfficiency.passingComparison[gameAnalysis.gameInfo?.homeTeam] > gameAnalysis.teamEfficiency.passingComparison[gameAnalysis.gameInfo?.awayTeam] ? 'tppg-advantage' : ''}
                         style={gameAnalysis.teamEfficiency.passingComparison[gameAnalysis.gameInfo?.homeTeam] > gameAnalysis.teamEfficiency.passingComparison[gameAnalysis.gameInfo?.awayTeam] ? 
                           { color: homeColor, fontWeight: 700 } : {}}>
                      {gameAnalysis.teamEfficiency.passingComparison[gameAnalysis.gameInfo?.homeTeam].toFixed(3)}
                    </div>
                    <div>Passing PPA</div>
                    <div className={gameAnalysis.teamEfficiency.passingComparison[gameAnalysis.gameInfo?.awayTeam] > gameAnalysis.teamEfficiency.passingComparison[gameAnalysis.gameInfo?.homeTeam] ? 'tppg-advantage' : ''}
                         style={gameAnalysis.teamEfficiency.passingComparison[gameAnalysis.gameInfo?.awayTeam] > gameAnalysis.teamEfficiency.passingComparison[gameAnalysis.gameInfo?.homeTeam] ? 
                           { color: awayColor, fontWeight: 700 } : {}}>
                      {gameAnalysis.teamEfficiency.passingComparison[gameAnalysis.gameInfo?.awayTeam].toFixed(3)}
                    </div>
                  </div>
                  
                  <div className="tppg-comparison-row">
                    <div className={gameAnalysis.teamEfficiency.rushingComparison[gameAnalysis.gameInfo?.homeTeam] > gameAnalysis.teamEfficiency.rushingComparison[gameAnalysis.gameInfo?.awayTeam] ? 'tppg-advantage' : ''}
                         style={gameAnalysis.teamEfficiency.rushingComparison[gameAnalysis.gameInfo?.homeTeam] > gameAnalysis.teamEfficiency.rushingComparison[gameAnalysis.gameInfo?.awayTeam] ? 
                           { color: homeColor, fontWeight: 700 } : {}}>
                      {gameAnalysis.teamEfficiency.rushingComparison[gameAnalysis.gameInfo?.homeTeam].toFixed(3)}
                    </div>
                    <div>Rushing PPA</div>
                    <div className={gameAnalysis.teamEfficiency.rushingComparison[gameAnalysis.gameInfo?.awayTeam] > gameAnalysis.teamEfficiency.rushingComparison[gameAnalysis.gameInfo?.homeTeam] ? 'tppg-advantage' : ''}
                         style={gameAnalysis.teamEfficiency.rushingComparison[gameAnalysis.gameInfo?.awayTeam] > gameAnalysis.teamEfficiency.rushingComparison[gameAnalysis.gameInfo?.homeTeam] ? 
                           { color: awayColor, fontWeight: 700 } : {}}>
                      {gameAnalysis.teamEfficiency.rushingComparison[gameAnalysis.gameInfo?.awayTeam].toFixed(3)}
                    </div>
                  </div>
                  
                  <div className="tppg-comparison-row">
                    <div className={gameAnalysis.teamEfficiency.successRates[gameAnalysis.gameInfo?.homeTeam] > gameAnalysis.teamEfficiency.successRates[gameAnalysis.gameInfo?.awayTeam] ? 'tppg-advantage' : ''}
                         style={gameAnalysis.teamEfficiency.successRates[gameAnalysis.gameInfo?.homeTeam] > gameAnalysis.teamEfficiency.successRates[gameAnalysis.gameInfo?.awayTeam] ? 
                           { color: homeColor, fontWeight: 700 } : {}}>
                      {(gameAnalysis.teamEfficiency.successRates[gameAnalysis.gameInfo?.homeTeam] * 100).toFixed(1)}%
                    </div>
                    <div>Success Rate</div>
                    <div className={gameAnalysis.teamEfficiency.successRates[gameAnalysis.gameInfo?.awayTeam] > gameAnalysis.teamEfficiency.successRates[gameAnalysis.gameInfo?.homeTeam] ? 'tppg-advantage' : ''}
                         style={gameAnalysis.teamEfficiency.successRates[gameAnalysis.gameInfo?.awayTeam] > gameAnalysis.teamEfficiency.successRates[gameAnalysis.gameInfo?.homeTeam] ? 
                           { color: awayColor, fontWeight: 700 } : {}}>
                      {(gameAnalysis.teamEfficiency.successRates[gameAnalysis.gameInfo?.awayTeam] * 100).toFixed(1)}%
                    </div>
                  </div>
                  
                  <div className="tppg-comparison-row">
                    <div className={gameAnalysis.teamEfficiency.explosiveness[gameAnalysis.gameInfo?.homeTeam] > gameAnalysis.teamEfficiency.explosiveness[gameAnalysis.gameInfo?.awayTeam] ? 'tppg-advantage' : ''}
                         style={gameAnalysis.teamEfficiency.explosiveness[gameAnalysis.gameInfo?.homeTeam] > gameAnalysis.teamEfficiency.explosiveness[gameAnalysis.gameInfo?.awayTeam] ? 
                           { color: homeColor, fontWeight: 700 } : {}}>
                      {gameAnalysis.teamEfficiency.explosiveness[gameAnalysis.gameInfo?.homeTeam].toFixed(2)}
                    </div>
                    <div>Explosiveness</div>
                    <div className={gameAnalysis.teamEfficiency.explosiveness[gameAnalysis.gameInfo?.awayTeam] > gameAnalysis.teamEfficiency.explosiveness[gameAnalysis.gameInfo?.homeTeam] ? 'tppg-advantage' : ''}
                         style={gameAnalysis.teamEfficiency.explosiveness[gameAnalysis.gameInfo?.awayTeam] > gameAnalysis.teamEfficiency.explosiveness[gameAnalysis.gameInfo?.homeTeam] ? 
                           { color: awayColor, fontWeight: 700 } : {}}>
                      {gameAnalysis.teamEfficiency.explosiveness[gameAnalysis.gameInfo?.awayTeam].toFixed(2)}
                    </div>
                  </div>
                  
                  <div className="tppg-comparison-row">
                    <div className={gameAnalysis.teamEfficiency.scoringOpportunities[gameAnalysis.gameInfo?.homeTeam].perOpportunity > gameAnalysis.teamEfficiency.scoringOpportunities[gameAnalysis.gameInfo?.awayTeam].perOpportunity ? 'tppg-advantage' : ''}
                         style={gameAnalysis.teamEfficiency.scoringOpportunities[gameAnalysis.gameInfo?.homeTeam].perOpportunity > gameAnalysis.teamEfficiency.scoringOpportunities[gameAnalysis.gameInfo?.awayTeam].perOpportunity ? 
                           { color: homeColor, fontWeight: 700 } : {}}>
                      {gameAnalysis.teamEfficiency.scoringOpportunities[gameAnalysis.gameInfo?.homeTeam].perOpportunity.toFixed(1)}
                    </div>
                    <div>Points/Opportunity</div>
                    <div className={gameAnalysis.teamEfficiency.scoringOpportunities[gameAnalysis.gameInfo?.awayTeam].perOpportunity > gameAnalysis.teamEfficiency.scoringOpportunities[gameAnalysis.gameInfo?.homeTeam].perOpportunity ? 'tppg-advantage' : ''}
                         style={gameAnalysis.teamEfficiency.scoringOpportunities[gameAnalysis.gameInfo?.awayTeam].perOpportunity > gameAnalysis.teamEfficiency.scoringOpportunities[gameAnalysis.gameInfo?.homeTeam].perOpportunity ? 
                           { color: awayColor, fontWeight: 700 } : {}}>
                      {gameAnalysis.teamEfficiency.scoringOpportunities[gameAnalysis.gameInfo?.awayTeam].perOpportunity.toFixed(1)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {activeAnalysisTab === 'quarterBreakdown' && hasQuarterData() && (
            <div>
              <h3 className="tppg-overview-title">
                <FaChartLine /> Quarter-by-Quarter Analysis
              </h3>
              
              <div className="tppg-quarter-charts">
                <div className="tppg-chart-container">
                  <h4 className="tppg-chart-title">Scoring by Period</h4>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart
                      data={gameAnalysis.quarterAnalysis}
                      margin={{ top: 20, right: 30, left: 10, bottom: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                      <XAxis 
                        dataKey="quarter" 
                        label={{ value: 'Period', position: 'insideBottom', offset: -15 }}
                        tick={{ fill: '#555' }} 
                      />
                      <YAxis 
                        label={{ value: 'Points', angle: -90, position: 'insideLeft', offset: -5 }}
                        tick={{ fill: '#555' }} 
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'white', 
                          border: '1px solid #e0e0e0',
                          borderRadius: '8px',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                        }} 
                        formatter={(value, name) => {
                          const teamName = name.includes(gameAnalysis.gameInfo?.homeTeam) ? 
                            gameAnalysis.gameInfo?.homeTeam : gameAnalysis.gameInfo?.awayTeam;
                          const logo = name.includes(gameAnalysis.gameInfo?.homeTeam) ? 
                            teamData.home.logo : teamData.away.logo;
                          return [
                            value,
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              {logo && (
                                <img 
                                  src={logo} 
                                  alt={`${teamName} logo`} 
                                  style={{ width: 16, height: 16, marginRight: 6 }}
                                />
                              )}
                              {name}
                            </div>
                          ];
                        }}
                      />
                      <Legend 
                        formatter={(value) => {
                          const teamName = value.includes(gameAnalysis.gameInfo?.homeTeam) ? 
                            gameAnalysis.gameInfo?.homeTeam : gameAnalysis.gameInfo?.awayTeam;
                          const logo = value.includes(gameAnalysis.gameInfo?.homeTeam) ? 
                            teamData.home.logo : teamData.away.logo;
                          return (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              {logo && (
                                <img 
                                  src={logo} 
                                  alt={`${teamName} logo`} 
                                  style={{ width: 16, height: 16, marginRight: 6 }}
                                />
                              )}
                              {value}
                            </div>
                          );
                        }}
                      />
                      <Bar 
                        dataKey="homeScoring" 
                        name={`${gameAnalysis.gameInfo?.homeTeam} Points`} 
                        fill={homeColor} 
                        barSize={30}
                      />
                      <Bar 
                        dataKey="awayScoring" 
                        name={`${gameAnalysis.gameInfo?.awayTeam} Points`} 
                        fill={awayColor} 
                        barSize={30}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                
                <div className="tppg-chart-container">
                  <h4 className="tppg-chart-title">
                    Team Efficiency (PPA)
                    <span className="tppg-info-tooltip" title="Overall PPA values shown in parentheses in legend">
                      <FaInfoCircle style={{ marginLeft: '8px', fontSize: '14px', cursor: 'help' }} />
                    </span>
                  </h4>
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart
                      data={gameAnalysis.quarterAnalysis}
                      margin={{ top: 20, right: 30, left: 10, bottom: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                      <XAxis 
                        dataKey="quarter" 
                        label={{ value: 'Period', position: 'insideBottom', offset: -15 }}
                        tick={{ fill: '#555' }} 
                      />
                      <YAxis 
                        label={{ value: 'Team PPA', angle: -90, position: 'insideLeft', offset: -5 }}
                        tick={{ fill: '#555' }} 
                        domain={['auto', 'auto']}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'white', 
                          border: '1px solid #e0e0e0',
                          borderRadius: '8px',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                        }}
                        formatter={(value, name) => {
                          const teamName = name.includes(gameAnalysis.gameInfo?.homeTeam) ? 
                            gameAnalysis.gameInfo?.homeTeam : gameAnalysis.gameInfo?.awayTeam;
                          const logo = name.includes(gameAnalysis.gameInfo?.homeTeam) ? 
                            teamData.home.logo : teamData.away.logo;
                          return [
                            value.toFixed(3),
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              {logo && (
                                <img 
                                  src={logo} 
                                  alt={`${teamName} logo`} 
                                  style={{ width: 16, height: 16, marginRight: 6 }}
                                />
                              )}
                              {name}
                            </div>
                          ];
                        }}
                      />
                      <Legend 
                        formatter={(value) => {
                          const teamName = value.includes(gameAnalysis.gameInfo?.homeTeam) ? 
                            gameAnalysis.gameInfo?.homeTeam : gameAnalysis.gameInfo?.awayTeam;
                          const logo = value.includes(gameAnalysis.gameInfo?.homeTeam) ? 
                            teamData.home.logo : teamData.away.logo;
                          return (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              {logo && (
                                <img 
                                  src={logo} 
                                  alt={`${teamName} logo`} 
                                  style={{ width: 16, height: 16, marginRight: 6 }}
                                />
                              )}
                              {value}
                            </div>
                          );
                        }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="homePPA" 
                        name={`${gameAnalysis.gameInfo?.homeTeam} (PPA: ${gameAnalysis.teamEfficiency?.homeTotalPPA?.toFixed(3) || '0.000'})`} 
                        stroke={homeColor} 
                        strokeWidth={3}
                        dot={{ r: 6, fill: homeColor }}
                        activeDot={{ r: 8, fill: homeColor, stroke: 'white', strokeWidth: 2 }} 
                      />
                      <Line 
                        type="monotone" 
                        dataKey="awayPPA" 
                        name={`${gameAnalysis.gameInfo?.awayTeam} (PPA: ${gameAnalysis.teamEfficiency?.awayTotalPPA?.toFixed(3) || '0.000'})`} 
                        stroke={awayColor} 
                        strokeWidth={3}
                        dot={{ r: 6, fill: awayColor }}
                        activeDot={{ r: 8, fill: awayColor, stroke: 'white', strokeWidth: 2 }} 
                      />
                      <ReferenceLine y={0} stroke="#666" strokeDasharray="3 3" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
              
              <div className="tppg-quarter-grid">
                {gameAnalysis.quarterAnalysis.map((quarter, index) => (
                  <div key={index} className="tppg-quarter-card">
                    <h4 className="tppg-quarter-title">Quarter {quarter.quarter}</h4>
                    <div className="tppg-quarter-score">
                      <div className="tppg-team-score">
                        <span className="tppg-team-name">
                          {teamData.home.logo && (
                            <img 
                              src={teamData.home.logo} 
                              alt={`${gameAnalysis.gameInfo?.homeTeam} logo`}
                              className="tppg-inline-logo"
                              style={{ width: 16, height: 16, verticalAlign: 'middle', marginRight: 4 }}
                            />
                          )}
                          {gameAnalysis.gameInfo?.homeTeam}
                        </span>
                        <span className="tppg-team-points" style={{ color: homeColor }}>{quarter.homeScoring}</span>
                      </div>
                      <div className="tppg-team-score">
                        <span className="tppg-team-name">
                          {teamData.away.logo && (
                            <img 
                              src={teamData.away.logo} 
                              alt={`${gameAnalysis.gameInfo?.awayTeam} logo`}
                              className="tppg-inline-logo"
                              style={{ width: 16, height: 16, verticalAlign: 'middle', marginRight: 4 }}
                            />
                          )}
                          {gameAnalysis.gameInfo?.awayTeam}
                        </span>
                        <span className="tppg-team-points" style={{ color: awayColor }}>{quarter.awayScoring}</span>
                      </div>
                    </div>
                    <div className="tppg-team-comparison">
                      <div>
                        <span style={{ display: 'block', color: homeColor, fontWeight: 600 }}>
                          {gameAnalysis.gameInfo?.homeTeam}
                        </span>
                        <span className="tppg-team-ppa">{quarter.homePPA.toFixed(3)} PPA</span>
                      </div>
                      <div className="tppg-advantage-indicator">
                        {quarter.homeAdvantage ? (
                          <FaArrowUp style={{ color: homeColor }} />
                        ) : (
                          <FaArrowDown style={{ color: awayColor }} />
                        )}
                        <span>{Math.abs(quarter.homePPA - quarter.awayPPA).toFixed(3)}</span>
                      </div>
                      <div>
                        <span style={{ display: 'block', color: awayColor, fontWeight: 600 }}>
                          {gameAnalysis.gameInfo?.awayTeam}
                        </span>
                        <span className="tppg-team-ppa">{quarter.awayPPA.toFixed(3)} PPA</span>
                      </div>
                    </div>
                    <p className="tppg-quarter-description">
                      {quarter.significance === 'significant' 
                        ? 'Significant advantage for ' 
                        : 'Slight edge for '}
                      <span className="tppg-team-advantage" style={{ 
                        color: quarter.homeAdvantage ? homeColor : awayColor 
                      }}>
                        {quarter.homeAdvantage ? gameAnalysis.gameInfo?.homeTeam : gameAnalysis.gameInfo?.awayTeam}
                      </span>
                      <br />
                      {gameAnalysis.quarterSummaries[index]}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {activeAnalysisTab === 'keyPlays' && hasKeyPlaysData() && (
            <div>
              <h3 className="tppg-overview-title">
                <FaFireAlt /> Game-Changing Plays
              </h3>
              
              <div className="tppg-key-plays-container">
                {gameAnalysis.keyPlays.map((play, index) => {
                  const isHomeTeam = play.team === gameAnalysis.gameInfo?.homeTeam;
                  const teamColor = isHomeTeam ? homeColor : awayColor;
                  const teamLogo = isHomeTeam ? teamData.home.logo : teamData.away.logo;
                  
                  return (
                    <div 
                      key={index} 
                      className={`tppg-key-play ${play.scoringPlay ? 'tppg-scoring-play' : ''} ${play.importance === 'high' ? 'tppg-high-importance' : play.importance === 'medium' ? 'tppg-medium-importance' : ''}`}
                      style={{ borderLeftColor: teamColor }}
                    >
                      <div className="tppg-play-header">
                        <span className="tppg-play-time">
                          Q{play.period} - {play.clock.minutes}:{play.clock.seconds < 10 ? '0' : ''}{play.clock.seconds}
                        </span>
                        <span className={`tppg-play-epa ${play.epa > 0 ? 'tppg-positive' : 'tppg-negative'}`}
                              style={{ 
                                backgroundColor: play.epa > 0 ? `${homeColor}20` : `${awayColor}20`,
                                color: play.epa > 0 ? homeColor : awayColor
                              }}>
                          {play.epa > 0 ? (
                            <><FaArrowUp style={{ marginRight: '4px' }} /> +{play.epa.toFixed(2)} EPA</>
                          ) : (
                            <><FaArrowDown style={{ marginRight: '4px' }} /> {play.epa.toFixed(2)} EPA</>
                          )}
                        </span>
                      </div>
                      
                      <p className="tppg-play-text">{play.playText}</p>
                      
                      <div className="tppg-play-footer">
                        <span className="tppg-play-team" style={{ color: teamColor }}>
                          {teamLogo && (
                            <img 
                              src={teamLogo} 
                              alt={`${play.team} logo`}
                              className="tppg-inline-logo"
                              style={{ width: 16, height: 16, verticalAlign: 'middle', marginRight: 4 }}
                            />
                          )}
                          {play.team}
                        </span>
                        <span className="tppg-play-details">
                          {play.down && play.distance && (
                            <span className="tppg-play-situation">
                              {getOrdinalNum(play.down)} & {play.distance}
                            </span>
                          )}
                          {play.yardsGained !== undefined && (
                            <span className="tppg-play-yards">
                              {play.yardsGained > 0 ? '+' : ''}{play.yardsGained} yds
                            </span>
                          )}
                          {play.scoringPlay && (
                            <span className="tppg-scoring-badge" style={{ backgroundColor: `${teamColor}20`, color: teamColor }}>
                              <FaFootballBall /> Scoring Play
                            </span>
                          )}
                        </span>
                      </div>
                      
                      <div className="tppg-play-importance">
                        {play.importance === 'high' && (
                          <span className="tppg-high-importance-tag" style={{ backgroundColor: teamColor }}>GAME CHANGER</span>
                        )}
                        {play.importance === 'medium' && (
                          <span className="tppg-medium-importance-tag" style={{ backgroundColor: teamColor, color: getContrastColor(teamColor) }}>KEY PLAY</span>
                        )}
                      </div>
                    </div>
                  );
                })}
                
                {gameAnalysis.keyPlays.length === 0 && (
                  <div className="tppg-no-data-message">
                    <FaInfoCircle className="tppg-info-icon" />
                    <p>No significant game-changing plays detected</p>
                  </div>
                )}
              </div>
              
              {gameAnalysis.turningPoint?.exists && (
                <div className="tppg-turning-point-analysis">
                  <h4 className="tppg-turning-point-title">
                    <FaMountain /> Game Turning Point
                  </h4>
                  <div className="tppg-turning-point-content">
                    <p className="tppg-turning-point-description">
                      {gameAnalysis.turningPoint.description}
                    </p>
                    {gameAnalysis.turningPoint.play && (
                      <div className="tppg-turning-point-details">
                        <p><strong>Quarter:</strong> {gameAnalysis.turningPoint.period}</p>
                        <p>
                          <strong>Team:</strong>{' '}
                          {gameAnalysis.turningPoint.team === gameAnalysis.gameInfo?.homeTeam ? (
                            <span style={{ color: homeColor }}>
                              {teamData.home.logo && (
                                <img 
                                  src={teamData.home.logo} 
                                  alt={`${gameAnalysis.turningPoint.team} logo`}
                                  className="tppg-inline-logo"
                                  style={{ width: 16, height: 16, verticalAlign: 'middle', marginRight: 4 }}
                                />
                              )}
                              {gameAnalysis.turningPoint.team}
                            </span>
                          ) : (
                            <span style={{ color: awayColor }}>
                              {teamData.away.logo && (
                                <img 
                                  src={teamData.away.logo} 
                                  alt={`${gameAnalysis.turningPoint.team} logo`}
                                  className="tppg-inline-logo"
                                  style={{ width: 16, height: 16, verticalAlign: 'middle', marginRight: 4 }}
                                />
                              )}
                              {gameAnalysis.turningPoint.team}
                            </span>
                          )}
                        </p>
                        <p><strong>Impact:</strong> This play significantly shifted momentum in the game.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
          
          {activeAnalysisTab === 'starPlayers' && hasStarPlayersData() && (
            <div>
              <h3 className="tppg-overview-title">
                <FaStar /> Star Performers
              </h3>
              
              {gameAnalysis.starPlayers.length > 0 ? (
                <div className="tppg-star-players-grid">
                  {gameAnalysis.starPlayers.map((player, index) => {
                    const isHomeTeam = player.team === gameAnalysis.gameInfo?.homeTeam;
                    const teamColor = isHomeTeam ? homeColor : awayColor;
                    const teamLogo = isHomeTeam ? teamData.home.logo : teamData.away.logo;
                    
                    return (
                      <div 
                        key={index} 
                        className="tppg-player-card"
                        style={{ 
                          borderLeft: `4px solid ${teamColor}`
                        }}
                      >
                        <div className="tppg-player-header">
                          <h4 className="tppg-player-name">{player.name}</h4>
                          <span 
                            className="tppg-team-badge"
                            style={{ 
                              backgroundColor: isHomeTeam ? 
                                `${homeColor}20` : `${awayColor}20`,
                              color: isHomeTeam ? 
                                homeColor : awayColor
                            }}
                          >
                            {teamLogo && (
                              <img 
                                src={teamLogo} 
                                alt={`${player.team} logo`}
                                style={{ width: 14, height: 14, marginRight: 4, verticalAlign: 'middle' }}
                              />
                            )}
                            {player.team}
                          </span>
                        </div>
                        
                        <div className="tppg-player-role">
                          <span className="tppg-player-position">{player.position}</span>
                          <span className="tppg-player-effectiveness">{player.effectiveness}</span>
                        </div>
                        
                        <div className="tppg-player-stats">
                          <div className="tppg-player-stat-item">
                            <span className="tppg-stat-label">Average PPA</span>
                            <span className="tppg-stat-value" style={{ color: player.ppaAverage > 0.7 ? teamColor : 'inherit' }}>
                              {player.ppaAverage.toFixed(2)}
                            </span>
                          </div>
                          <div className="tppg-player-stat-item">
                            <span className="tppg-stat-label">Total Impact</span>
                            <span className="tppg-stat-value" style={{ color: player.ppaCumulative > 5 ? teamColor : 'inherit' }}>
                              {player.ppaCumulative.toFixed(1)}
                            </span>
                          </div>
                          <div className="tppg-player-stat-item">
                            <span className="tppg-stat-label">Plays</span>
                            <span className="tppg-stat-value">{player.plays}</span>
                          </div>
                        </div>
                        
                        <div className="tppg-player-description">
                          <p className="tppg-player-strength">
                            <FaThumbsUp className="tppg-strength-icon" style={{ color: teamColor }} />
                            {player.strengthDescription}
                          </p>
                        </div>
                        
                        {player.position === 'QB' && player.playType && (
                          <div className="tppg-player-advanced-stats">
                            <div className="tppg-stat-bar">
                              <div className="tppg-stat-label">Passing</div>
                              <div className="tppg-stat-bar-container">
                                <div 
                                  className="tppg-stat-bar-fill" 
                                  style={{ 
                                    width: `${Math.min(100, Math.max(0, player.playType.passing * 50 + 50))}%`,
                                    backgroundColor: player.playType.passing > 0 ? teamColor : '#ef4444'
                                  }}
                                ></div>
                              </div>
                              <div className="tppg-stat-value">{player.playType.passing.toFixed(2)}</div>
                            </div>
                            <div className="tppg-stat-bar">
                              <div className="tppg-stat-label">Rushing</div>
                              <div className="tppg-stat-bar-container">
                                <div 
                                  className="tppg-stat-bar-fill" 
                                  style={{ 
                                    width: `${Math.min(100, Math.max(0, player.playType.rushing * 50 + 50))}%`,
                                    backgroundColor: player.playType.rushing > 0 ? teamColor : '#ef4444'
                                  }}
                                ></div>
                              </div>
                              <div className="tppg-stat-value">{player.playType.rushing.toFixed(2)}</div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="tppg-no-data-message">
                  <FaInfoCircle className="tppg-info-icon" />
                  <p>No standout performers detected</p>
                </div>
              )}
              
              <div className="tppg-ppa-explanation">
                <h4 className="tppg-explanation-title">
                  <FaInfoCircle /> Understanding PPA (Predicted Points Added)
                </h4>
                <p className="tppg-explanation-text">
                  PPA measures a player's contribution to scoring. A high average PPA indicates efficiency, 
                  while cumulative PPA shows overall game impact. Values above 0.8 are considered exceptional,
                  with elite players consistently averaging over 1.0 PPA per play.
                </p>
                <div className="tppg-ppa-scale">
                  <div className="tppg-ppa-scale-item tppg-ppa-elite" style={{ backgroundColor: `${homeColor}10` }}>
                    <span className="tppg-scale-value" style={{ color: homeColor }}>1.0+</span>
                    <span className="tppg-scale-label">Elite</span>
                  </div>
                  <div className="tppg-ppa-scale-item tppg-ppa-excellent" style={{ backgroundColor: `${homeColor}08` }}>
                    <span className="tppg-scale-value" style={{ color: homeColor }}>0.7-1.0</span>
                    <span className="tppg-scale-label">Excellent</span>
                  </div>
                  <div className="tppg-ppa-scale-item tppg-ppa-good">
                    <span className="tppg-scale-value">0.3-0.7</span>
                    <span className="tppg-scale-label">Good</span>
                  </div>
                  <div className="tppg-ppa-scale-item tppg-ppa-average">
                    <span className="tppg-scale-value">0.0-0.3</span>
                    <span className="tppg-scale-label">Average</span>
                  </div>
                  <div className="tppg-ppa-scale-item tppg-ppa-poor" style={{ backgroundColor: `${awayColor}10` }}>
                    <span className="tppg-scale-value" style={{ color: awayColor }}>0.0</span>
                    <span className="tppg-scale-label">Negative Impact</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      <div className="tppg-grades-container">
        <h2 className="tppg-grades-heading">
          <FaClipboardList /> Player Performance Grades
        </h2>
        
        <div className="tppg-filters">
          <div className="tppg-select-container">
            <select 
              value={selectedTeam} 
              onChange={(e) => setSelectedTeam(e.target.value)}
              className="tppg-select"
              style={{ borderColor: selectedTeam === gameAnalysis.gameInfo?.homeTeam ? homeColor : 
                selectedTeam === gameAnalysis.gameInfo?.awayTeam ? awayColor : 
                '#d1d5db' }}
     >
       <option value="all">All Teams</option>
       {gameAnalysis?.gameInfo?.homeTeam && (
         <option value={gameAnalysis.gameInfo.homeTeam}>
           {gameAnalysis.gameInfo.homeTeam}
         </option>
       )}
       {gameAnalysis?.gameInfo?.awayTeam && (
         <option value={gameAnalysis.gameInfo.awayTeam}>
           {gameAnalysis.gameInfo.awayTeam}
         </option>
       )}
     </select>
     <FaAngleDown className="tppg-select-arrow" />
   </div>
   
   <div className="tppg-select-container">
     <select 
       value={selectedPosition} 
       onChange={(e) => setSelectedPosition(e.target.value)}
       className="tppg-select"
     >
       <option value="all">All Positions</option>
       {Array.from(new Set(playerGrades.map(g => g.position))).map(pos => (
         <option key={pos} value={pos}>{pos}</option>
       ))}
     </select>
     <FaAngleDown className="tppg-select-arrow" />
   </div>
   
   <button 
     className={`tppg-advanced-stats-toggle ${showAdvancedStats ? 'tppg-active' : ''}`}
     onClick={() => setShowAdvancedStats(!showAdvancedStats)}
     style={{ 
       backgroundColor: showAdvancedStats ? homeColor : 'white',
       borderColor: homeColor,
       color: showAdvancedStats ? dynamicStyles.homeTextColor : homeColor
     }}
   >
     <FaSearchPlus /> {showAdvancedStats ? 'Hide Advanced Stats' : 'Show Advanced Stats'}
   </button>
 </div>
 
 <div className="tppg-table-container">
   <table className="tppg-table">
     <thead>
       <tr>
         <th>Player</th>
         <th>Team</th>
         <th>Position</th>
         <th>Grade</th>
         <th>Performance</th>
         <th>Plays</th>
         {showAdvancedStats && <th>PPA</th>}
         <th>Key Insights</th>
       </tr>
     </thead>
     <tbody>
       {filteredGrades.length > 0 ? (
         filteredGrades.slice(0, 20).map((player, index) => {
           const isHomeTeam = player.team === gameAnalysis.gameInfo?.homeTeam;
           const teamColor = isHomeTeam ? homeColor : awayColor;
           const teamLogo = isHomeTeam ? teamData.home.logo : teamData.away.logo;
           
           return (
             <tr key={index}>
               <td className="tppg-player-name-cell">
                 <FaUserAlt style={{ color: '#666' }} /> {player.name}
               </td>
               <td style={{ textAlign: 'center' }}>
                 <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                   {teamLogo && (
                     <img 
                       src={teamLogo} 
                       alt={`${player.team} logo`}
                       style={{ width: 20, height: 20 }}
                     />
                   )}
                   <span style={{ color: teamColor }}>{player.team}</span>
                 </div>
               </td>
               <td style={{ textAlign: 'center' }}>{player.position}</td>
               <td style={{ textAlign: 'center' }}>
                 <span className={`tppg-grade ${getGradeClass(player.overallGrade)}`}
                       style={{ backgroundColor: player.overallGrade >= 80 ? `${teamColor}20` : undefined,
                                color: player.overallGrade >= 80 ? teamColor : undefined }}>
                   {getGradeIcon(player.overallGrade)} {player.overallGrade.toFixed(1)}
                 </span>
               </td>
               <td style={{ textAlign: 'center' }}>{getGradeDescription(player.overallGrade)}</td>
               <td style={{ textAlign: 'center' }}>{player.playCount}</td>
               {showAdvancedStats && (
                 <td style={{ textAlign: 'center' }}>
                   <div className={`tppg-ppa-value ${player.averagePPA > 0.7 ? 'tppg-ppa-high' : player.averagePPA > 0.3 ? 'tppg-ppa-med' : player.averagePPA > 0 ? 'tppg-ppa-low' : 'tppg-ppa-neg'}`}
                        style={{ 
                          backgroundColor: player.averagePPA > 0.7 ? `${teamColor}20` : undefined,
                          color: player.averagePPA > 0.7 ? teamColor : undefined
                        }}>
                     {player.averagePPA.toFixed(2)}
                   </div>
                 </td>
               )}
               <td>
                 {player.insights && player.insights.length > 0 ? (
                   <ul className="tppg-insights-list">
                     {player.insights.map((insight, i) => (
                       <li key={i} className="tppg-insights-item" style={{ color: '#555' }}>
                         <span style={{ color: teamColor }}>•</span> {insight}
                       </li>
                     ))}
                   </ul>
                 ) : (
                   <span style={{ color: '#777', fontStyle: 'italic' }}>No special insights</span>
                 )}
               </td>
             </tr>
           );
         })
       ) : (
         <tr>
           <td colSpan={showAdvancedStats ? "8" : "7"} style={{ textAlign: 'center', padding: '20px', color: '#666', fontStyle: 'italic' }}>
             No player data available with the current filters
           </td>
         </tr>
       )}
     </tbody>
   </table>
 </div>
 
 {filteredGrades.length > 0 ? (
   <div className="tppg-chart-container">
     <h3 className="tppg-chart-title">Top Player Performances</h3>
     <ResponsiveContainer width="100%" height={400}>
       <BarChart 
         data={filteredGrades.slice(0, 15)}
         margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
       >
         <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
         <XAxis 
           dataKey="name" 
           angle={-45} 
           textAnchor="end" 
           interval={0}
           tick={{ fill: '#555', fontSize: 12 }}
           tickMargin={10}
         />
         <YAxis 
           domain={[0, 100]}
           tick={{ fill: '#555' }}
           label={{ value: 'Performance Grade', angle: -90, position: 'insideLeft', offset: -5 }}
         />
         <Tooltip 
           content={({ active, payload }) => {
             if (active && payload && payload.length) {
               const player = payload[0].payload;
               const isHomeTeam = player.team === gameAnalysis.gameInfo?.homeTeam;
               const teamColor = isHomeTeam ? homeColor : awayColor;
               const teamLogo = isHomeTeam ? teamData.home.logo : teamData.away.logo;
               
               return (
                 <div className="tppg-chart-tooltip">
                   <h3 className="tppg-tooltip-title">{player.name}</h3>
                   <div className="tppg-tooltip-details">
                     <div><span className="tppg-tooltip-label">Position:</span> {player.position}</div>
                     <div>
                       <span className="tppg-tooltip-label">Team:</span> 
                       <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: teamColor }}>
                         {teamLogo && (
                           <img 
                             src={teamLogo} 
                             alt={`${player.team} logo`}
                             style={{ width: 16, height: 16, marginLeft: 4, marginRight: 4 }}
                           />
                         )}
                         {player.team}
                       </span>
                     </div>
                     <div>
                       <span className="tppg-tooltip-label">Grade:</span> 
                       <span className={getGradeClass(player.overallGrade)} style={{ 
                         paddingLeft: '5px',
                         fontWeight: '700',
                         color: player.overallGrade >= 80 ? teamColor : undefined
                       }}>
                         {player.overallGrade.toFixed(1)}
                       </span>
                     </div>
                     <div><span className="tppg-tooltip-label">Performance:</span> {getGradeDescription(player.overallGrade)}</div>
                     <div><span className="tppg-tooltip-label">Total Plays:</span> {player.playCount}</div>
                     {showAdvancedStats && (
                       <div><span className="tppg-tooltip-label">Average PPA:</span> {player.averagePPA.toFixed(2)}</div>
                     )}
                   </div>
                   
                   {player.insights && player.insights.length > 0 && (
                     <div className="tppg-tooltip-insights">
                       <p className="tppg-tooltip-insights-title">Insights:</p>
                       <ul className="tppg-tooltip-insights-list">
                         {player.insights.map((insight, i) => (
                           <li key={i}>{insight}</li>
                         ))}
                       </ul>
                     </div>
                   )}
                 </div>
               );
             }
             return null;
           }}
         />
         <Bar 
           dataKey="overallGrade"
           animationDuration={1500}
         >
           {filteredGrades.slice(0, 15).map((entry, index) => {
             const isHomeTeam = entry.team === gameAnalysis.gameInfo?.homeTeam;
             const teamColor = isHomeTeam ? homeColor : awayColor;
             let barColor;
             
             if (entry.overallGrade >= 90) {
               barColor = teamColor;
             } else if (entry.overallGrade >= 80) {
               // Lighter shade of team color
               barColor = isHomeTeam ? homeAltColor : awayAltColor;
             } else if (entry.overallGrade >= 70) {
               barColor = '#eab308';
             } else if (entry.overallGrade >= 60) {
               barColor = '#f97316';
             } else {
               barColor = '#ef4444';
             }
             
             return (
               <Cell 
                 key={`cell-${index}`} 
                 fill={barColor}
               />
             );
           })}
         </Bar>
         <ReferenceLine y={60} stroke="#888" strokeDasharray="3 3" label={{ value: 'Average', position: 'insideBottomRight', fill: '#888' }} />
         <ReferenceLine y={80} stroke={homeColor} strokeDasharray="3 3" label={{ value: 'Exceptional', position: 'insideBottomRight', fill: homeColor }} />
       </BarChart>
     </ResponsiveContainer>
   </div>
 ) : (
   <div className="tppg-no-data-message">
     <FaInfoCircle className="tppg-info-icon" />
     <p>No player data available with the current filters</p>
   </div>
 )}
 
 {showAdvancedStats && filteredGrades.length > 0 && (
   <div className="tppg-advanced-charts">
     <div className="tppg-chart-container">
       <h3 className="tppg-chart-title">Performance vs. Play Count</h3>
       <ResponsiveContainer width="100%" height={350}>
         <ScatterChart
           margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
         >
           <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
           <XAxis 
             type="number" 
             dataKey="playCount" 
             name="Plays" 
             label={{ value: 'Play Count', position: 'insideBottom', offset: -10 }}
             domain={[0, 'dataMax + 2']}
           />
           <YAxis 
             type="number" 
             dataKey="overallGrade" 
             name="Grade" 
             domain={[40, 100]}
             label={{ value: 'Performance Grade', angle: -90, position: 'insideLeft', offset: -10 }}
           />
           <ZAxis type="number" range={[60, 400]} />
           <Tooltip 
             cursor={{ strokeDasharray: '3 3' }}
             content={({ active, payload }) => {
               if (active && payload && payload.length) {
                 const player = payload[0].payload;
                 const isHomeTeam = player.team === gameAnalysis.gameInfo?.homeTeam;
                 const teamColor = isHomeTeam ? homeColor : awayColor;
                 const teamLogo = isHomeTeam ? teamData.home.logo : teamData.away.logo;
                 
                 return (
                   <div className="tppg-chart-tooltip">
                     <h3 className="tppg-tooltip-title">{player.name}</h3>
                     <div className="tppg-tooltip-details">
                       <div><span className="tppg-tooltip-label">Position:</span> {player.position}</div>
                       <div>
                         <span className="tppg-tooltip-label">Team:</span> 
                         <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: teamColor }}>
                           {teamLogo && (
                             <img 
                               src={teamLogo} 
                               alt={`${player.team} logo`}
                               style={{ width: 16, height: 16, marginLeft: 4, marginRight: 4 }}
                             />
                           )}
                           {player.team}
                         </span>
                       </div>
                       <div><span className="tppg-tooltip-label">Grade:</span> {player.overallGrade.toFixed(1)}</div>
                       <div><span className="tppg-tooltip-label">Plays:</span> {player.playCount}</div>
                       <div><span className="tppg-tooltip-label">Average PPA:</span> {player.averagePPA.toFixed(2)}</div>
                     </div>
                   </div>
                 );
               }
               return null;
             }}
           />
           <Scatter 
             name="Players" 
             data={filteredGrades} 
             fill="#8884d8"
             shape={(props) => {
               const { cx, cy, fill } = props;
               const player = props.payload;
               const isHomeTeam = player.team === gameAnalysis?.gameInfo?.homeTeam;
               
               // Determine color based on team
               const color = isHomeTeam ? homeColor : awayColor;
               
               return (
                 <circle 
                   cx={cx} 
                   cy={cy} 
                   r={Math.min(30, Math.max(10, player.playCount * 1.5))} 
                   fill={color}
                   opacity={0.7}
                   stroke="#fff"
                   strokeWidth={1}
                 />
               );
             }}
           />
           <ReferenceLine y={60} stroke="#888" strokeDasharray="3 3" label={{ value: 'Average', position: 'insideBottomRight', fill: '#888' }} />
           <ReferenceLine y={80} stroke={homeColor} strokeDasharray="3 3" label={{ value: 'Exceptional', position: 'insideBottomRight', fill: homeColor }} />
         </ScatterChart>
       </ResponsiveContainer>
     </div>
     
     <div className="tppg-chart-container">
       <h3 className="tppg-chart-title">Team Performance Comparison</h3>
       <ResponsiveContainer width="100%" height={350}>
         <RadarChart 
           outerRadius={150} 
           width={500} 
           height={350}
           data={[
             {
               subject: 'Passing',
               [gameAnalysis?.gameInfo?.homeTeam]: gameAnalysis?.teamEfficiency?.passingComparison[gameAnalysis?.gameInfo?.homeTeam] || 0,
               [gameAnalysis?.gameInfo?.awayTeam]: gameAnalysis?.teamEfficiency?.passingComparison[gameAnalysis?.gameInfo?.awayTeam] || 0,
               fullMark: 1.5,
             },
             {
               subject: 'Rushing',
               [gameAnalysis?.gameInfo?.homeTeam]: gameAnalysis?.teamEfficiency?.rushingComparison[gameAnalysis?.gameInfo?.homeTeam] || 0,
               [gameAnalysis?.gameInfo?.awayTeam]: gameAnalysis?.teamEfficiency?.rushingComparison[gameAnalysis?.gameInfo?.awayTeam] || 0,
               fullMark: 1.5,
             },
             {
               subject: 'Success Rate',
               [gameAnalysis?.gameInfo?.homeTeam]: gameAnalysis?.teamEfficiency?.successRates[gameAnalysis?.gameInfo?.homeTeam] || 0,
               [gameAnalysis?.gameInfo?.awayTeam]: gameAnalysis?.teamEfficiency?.successRates[gameAnalysis?.gameInfo?.awayTeam] || 0,
               fullMark: 0.6,
             },
             {
               subject: 'Explosiveness',
               [gameAnalysis?.gameInfo?.homeTeam]: gameAnalysis?.teamEfficiency?.explosiveness[gameAnalysis?.gameInfo?.homeTeam] || 0,
               [gameAnalysis?.gameInfo?.awayTeam]: gameAnalysis?.teamEfficiency?.explosiveness[gameAnalysis?.gameInfo?.awayTeam] || 0,
               fullMark: 2,
             },
             {
               subject: 'Red Zone',
               [gameAnalysis?.gameInfo?.homeTeam]: gameAnalysis?.teamEfficiency?.scoringOpportunities[gameAnalysis?.gameInfo?.homeTeam]?.perOpportunity / 7 || 0,
               [gameAnalysis?.gameInfo?.awayTeam]: gameAnalysis?.teamEfficiency?.scoringOpportunities[gameAnalysis?.gameInfo?.awayTeam]?.perOpportunity / 7 || 0,
               fullMark: 1,
             }
           ]}
         >
           <PolarGrid stroke="#e0e0e0" />
           <PolarAngleAxis dataKey="subject" tick={{ fill: '#555' }} />
           <PolarRadiusAxis angle={90} domain={[0, 'auto']} />
           <Radar
             name={gameAnalysis?.gameInfo?.homeTeam}
             dataKey={gameAnalysis?.gameInfo?.homeTeam}
             stroke={homeColor}
             fill={homeColor}
             fillOpacity={0.5}
           />
           <Radar
             name={gameAnalysis?.gameInfo?.awayTeam}
             dataKey={gameAnalysis?.gameInfo?.awayTeam}
             stroke={awayColor}
             fill={awayColor}
             fillOpacity={0.5}
           />
           <Legend 
             formatter={(value) => {
               const teamName = value;
               const isHomeTeam = value === gameAnalysis?.gameInfo?.homeTeam;
               const teamLogo = isHomeTeam ? teamData.home.logo : teamData.away.logo;
               
               return (
                 <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                   {teamLogo && (
                     <img 
                       src={teamLogo} 
                       alt={`${teamName} logo`} 
                       style={{ width: 16, height: 16, marginRight: 6 }}
                     />
                   )}
                   {value}
                 </div>
               );
             }}
           />
           <Tooltip 
             formatter={(value, name) => {
               const teamName = name;
               const isHomeTeam = name === gameAnalysis?.gameInfo?.homeTeam;
               const teamLogo = isHomeTeam ? teamData.home.logo : teamData.away.logo;
               
               return [
                 value.toFixed(3),
                 <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                   {teamLogo && (
                     <img 
                       src={teamLogo} 
                       alt={`${teamName} logo`} 
                       style={{ width: 16, height: 16, marginRight: 6 }}
                     />
                   )}
                   {name}
                 </div>
               ];
             }}
           />
         </RadarChart>
       </ResponsiveContainer>
     </div>
   </div>
 )}
 
 <div className="tppg-methodology">
   <h3 className="tppg-methodology-title">
     <FaBullseye /> Grading Methodology
   </h3>
   <p className="tppg-methodology-content">
     Our advanced grading system evaluates player performance using Predicted Points Added (PPA) and 
     play-by-play contribution analysis. Each player's impact is measured through their efficiency, 
     explosiveness, and contribution to scoring opportunities. Grades are calculated on a 0-100 scale, 
     with context-based adjustments for different positions and game situations.
   </p>
   <div className="tppg-methodology-grid">
     <div className="tppg-methodology-card">
       <h4 className="tppg-methodology-subtitle">
         <FaTrophy /> Grading Scale
       </h4>
       <ul className="tppg-scale-list">
         <li><span className="tppg-scale-badge tppg-grade-elite" style={{ backgroundColor: `${homeColor}20`, color: homeColor }}>90-100</span> Elite Performance</li>
         <li><span className="tppg-scale-badge tppg-grade-exceptional" style={{ backgroundColor: `${homeColor}15`, color: homeColor }}>80-89</span> Exceptional</li>
         <li><span className="tppg-scale-badge tppg-grade-good">70-79</span> Very Good</li>
         <li><span className="tppg-scale-badge tppg-grade-average">60-69</span> Average</li>
         <li><span className="tppg-scale-badge tppg-grade-poor" style={{ backgroundColor: `${awayColor}15`, color: awayColor }}>60</span> Below Average</li>
       </ul>
     </div>
     <div className="tppg-methodology-card">
       <h4 className="tppg-methodology-subtitle">
         <FaChartBar /> Key Performance Indicators
       </h4>
       <ul className="tppg-kpi-list">
         <li>Predicted Points Added (PPA)</li>
         <li>Play Success Rate</li>
         <li>Big Play Generation</li>
         <li>Scoring Contribution</li>
         <li>Critical Situation Performance</li>
       </ul>
     </div>
     <div className="tppg-methodology-card">
       <h4 className="tppg-methodology-subtitle">
         <FaUserAlt /> Position Adjustments
       </h4>
       <ul className="tppg-position-list">
         <li><strong>QB:</strong> Passing efficiency, scrambling ability</li>
         <li><strong>RB:</strong> Rushing success, explosive runs</li>
         <li><strong>WR/TE:</strong> Reception success, yards after catch</li>
         <li><strong>Defensive:</strong> Disruption, turnover creation</li>
       </ul>
     </div>
   </div>
 </div>
 
 <div className="tppg-position-insights">
   <h3 className="tppg-position-title">
     <FaUsers /> Position Group Insights
   </h3>
   <div className="tppg-position-grid">
     {[
       { posGroup: 'QB', icon: <FaFootballBall />, label: 'QB Performance' },
       { posGroup: 'RB', icon: <FaRunning />, label: 'RB Performance' },
       { posGroup: 'WR', icon: <FaRegLightbulb />, label: 'WR Performance' },
       { posGroup: 'Defense', icon: <FaShieldAlt />, label: 'Defense Performance' }
     ].map(({ posGroup, icon, label }) => {
       const positionGrades = playerGrades.filter(p => 
         posGroup === 'QB' ? p.position === 'QB' :
         posGroup === 'RB' ? p.position === 'RB' :
         posGroup === 'WR' ? (p.position === 'WR' || p.position === 'TE') :
         ['DL', 'LB', 'DB', 'S', 'CB'].includes(p.position)
       );
       const avgGrade = positionGrades.length > 0 
         ? positionGrades.reduce((sum, p) => sum + p.overallGrade, 0) / positionGrades.length 
         : 0;
       
       // Get top performer for this position group
       const topPerformer = positionGrades.length > 0 
         ? positionGrades.reduce((best, current) => current.overallGrade > best.overallGrade ? current : best, positionGrades[0])
         : null;
         
       // Determine card color based on top performer's team
       const cardColor = topPerformer?.team === gameAnalysis?.gameInfo?.homeTeam ? 
         homeColor : topPerformer?.team === gameAnalysis?.gameInfo?.awayTeam ? 
         awayColor : '#666';
       
       // Get team logo for top performer
       const topPerformerLogo = topPerformer?.team === gameAnalysis?.gameInfo?.homeTeam ? 
         teamData.home.logo : topPerformer?.team === gameAnalysis?.gameInfo?.awayTeam ? 
         teamData.away.logo : null;
       
       return (
         <div key={posGroup} className="tppg-position-card" style={{ borderTop: `3px solid ${cardColor}` }}>
           <h4>{icon} {label}</h4>
           <div className={`tppg-position-grade ${getGradeClass(avgGrade)}`} 
                style={{ backgroundColor: avgGrade >= 80 ? `${cardColor}15` : undefined, 
                         color: avgGrade >= 80 ? cardColor : undefined }}>
             {avgGrade.toFixed(1)}
           </div>
           <p className="tppg-position-info">
             Average Grade ({positionGrades.length} players)
           </p>
           {topPerformer && (
             <div className="tppg-top-performer">
               <span className="tppg-top-performer-label">Top Performer</span>
               <div className="tppg-top-performer-name">
                 {topPerformer.name}
                 <span className="tppg-top-performer-team">
                   {topPerformerLogo && (
                     <img 
                       src={topPerformerLogo} 
                       alt={`${topPerformer.team} logo`}
                       style={{ width: 16, height: 16, marginRight: 4, verticalAlign: 'middle' }}
                     />
                   )}
                   {topPerformer.team}
                 </span>
               </div>
               <div className="tppg-top-performer-grade">
                 <span className={getGradeClass(topPerformer.overallGrade)} 
                       style={{ color: cardColor }}>
                   {getGradeIcon(topPerformer.overallGrade)} {topPerformer.overallGrade.toFixed(1)}
                 </span>
               </div>
             </div>
           )}
         </div>
       );
     })}
   </div>
 </div>
</div>
</div>
);
};

export default PlayerGameGrade;