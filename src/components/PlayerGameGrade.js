import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import teamsService from '../services/teamsService';
import graphqlTeamsService from '../services/graphqlTeamsService'; // Add this import
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

const PlayerGameGrade = ({ gameId: propGameId }) => {
  const { gameId: urlGameId } = useParams();
  
  // Use the prop gameId if provided, otherwise use the URL parameter
  const gameId = propGameId || urlGameId;
  
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

  // Comprehensive data fetching with better error handling
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
          // Play-by-play data
          teamsService.getPlayByPlay(gameId)
            .catch(err => {
              console.error("Error fetching play-by-play:", err);
              console.log("Continuing without play-by-play data");
              return null;
            }),
            
          // Advanced box score
          teamsService.getAdvancedBoxScore(gameId)
            .catch(err => {
              console.error("Error fetching advanced box score:", err);
              throw new Error("Failed to fetch advanced box score - this data is required");
            }),
          
          // Scoreboard data (contains quarter scores)
          graphqlTeamsService.getGameScoreboard(gameId)
            .catch(err => {
              console.error("Error fetching scoreboard data:", err);
              console.log("Continuing without scoreboard data");
              return null;
            }),
          
          // Game info for additional details
          graphqlTeamsService.getGameInfo(gameId)
            .catch(err => {
              console.error("Error fetching game info:", err);
              console.log("Continuing without game info data");
              return null;
            })
        ]);
        
        console.log("Data fetching complete, generating analysis");
        
        // Log what data sources we have to help with debugging
        console.log("Available data sources:");
        console.log("- Play-by-play:", playByPlayData ? "Yes" : "No");
        console.log("- Advanced box score:", advancedBoxScore ? "Yes" : "No");
        console.log("- Scoreboard:", scoreboardData ? "Yes" : "No");
        console.log("- Game info:", gameInfoData ? "Yes" : "No");
        
        // Check for required box score data
        if (!advancedBoxScore) {
          throw new Error("No box score data available for this game");
        }
        
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

  // Data availability checks for each tab
  const hasOverviewData = () => {
    return gameAnalysis && gameAnalysis.overview;
  };

  const hasQuarterData = () => {
    return gameAnalysis && gameAnalysis.quarterAnalysis && gameAnalysis.quarterAnalysis.length > 0;
  };

  const hasKeyPlaysData = () => {
    return gameAnalysis && gameAnalysis.keyPlays && gameAnalysis.keyPlays.length > 0;
  };

  const hasStarPlayersData = () => {
    return gameAnalysis && gameAnalysis.starPlayers && gameAnalysis.starPlayers.length > 0;
  };

  // Handle tab changes
  const handleTabClick = (tabId) => {
    setActiveAnalysisTab(tabId);
  };

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

  return (
    <div className="tppg-container">
      <div className="tppg-analysis">
        <h1 className="tppg-analysis-heading">
          <FaFootballBall /> Game Analysis
        </h1>
        
        <div className="tppg-game-score">
          <div className={`tppg-team-container ${gameAnalysis.homeWin ? 'tppg-winner' : ''}`}>
            <span className="tppg-team-name">{gameAnalysis.gameInfo?.homeTeam}</span>
            <span className="tppg-team-score">{gameAnalysis.gameInfo?.homePoints}</span>
            {gameAnalysis.homeWin && <FaTrophy className="tppg-winner-icon" />}
          </div>
          <span className="tppg-vs">vs</span>
          <div className={`tppg-team-container ${!gameAnalysis.homeWin ? 'tppg-winner' : ''}`}>
            <span className="tppg-team-score">{gameAnalysis.gameInfo?.awayPoints}</span>
            <span className="tppg-team-name">{gameAnalysis.gameInfo?.awayTeam}</span>
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
                <div className="tppg-turning-point">
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
                        <strong>Q{quarter.quarter}:</strong> {homeTeam} {homePts}, {awayTeam} {awayPts}
                        {homePts === awayPts ? " (Even quarter)" : 
                          homePts > awayPts ? ` (${homeTeam} +${homePts-awayPts})` : 
                          ` (${awayTeam} +${awayPts-homePts})`
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
                        <span className="tppg-key-bullet">•</span> {key}
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
                  <div className="tppg-comparison-card">
                    <h5>{gameAnalysis.gameInfo?.homeTeam} Strengths</h5>
                    <ul className="tppg-strengths-list">
                      {gameAnalysis.teamStrengths[gameAnalysis.gameInfo?.homeTeam]?.map((strength, i) => (
                        <li key={i}>{strength}</li>
                      ))}
                      {gameAnalysis.teamStrengths[gameAnalysis.gameInfo?.homeTeam]?.length === 0 && (
                        <li>No notable strengths identified</li>
                      )}
                    </ul>
                  </div>
                  <div className="tppg-comparison-card">
                    <h5>{gameAnalysis.gameInfo?.awayTeam} Strengths</h5>
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
                    <div>{gameAnalysis.gameInfo?.homeTeam}</div>
                    <div>Statistic</div>
                    <div>{gameAnalysis.gameInfo?.awayTeam}</div>
                  </div>
                  
                  <div className="tppg-comparison-row">
                    <div className={gameAnalysis.teamEfficiency.passingComparison[gameAnalysis.gameInfo?.homeTeam] > gameAnalysis.teamEfficiency.passingComparison[gameAnalysis.gameInfo?.awayTeam] ? 'tppg-advantage' : ''}>
                      {gameAnalysis.teamEfficiency.passingComparison[gameAnalysis.gameInfo?.homeTeam].toFixed(3)}
                    </div>
                    <div>Passing PPA</div>
                    <div className={gameAnalysis.teamEfficiency.passingComparison[gameAnalysis.gameInfo?.awayTeam] > gameAnalysis.teamEfficiency.passingComparison[gameAnalysis.gameInfo?.homeTeam] ? 'tppg-advantage' : ''}>
                      {gameAnalysis.teamEfficiency.passingComparison[gameAnalysis.gameInfo?.awayTeam].toFixed(3)}
                    </div>
                  </div>
                  
                  <div className="tppg-comparison-row">
                    <div className={gameAnalysis.teamEfficiency.rushingComparison[gameAnalysis.gameInfo?.homeTeam] > gameAnalysis.teamEfficiency.rushingComparison[gameAnalysis.gameInfo?.awayTeam] ? 'tppg-advantage' : ''}>
                      {gameAnalysis.teamEfficiency.rushingComparison[gameAnalysis.gameInfo?.homeTeam].toFixed(3)}
                    </div>
                    <div>Rushing PPA</div>
                    <div className={gameAnalysis.teamEfficiency.rushingComparison[gameAnalysis.gameInfo?.awayTeam] > gameAnalysis.teamEfficiency.rushingComparison[gameAnalysis.gameInfo?.homeTeam] ? 'tppg-advantage' : ''}>
                      {gameAnalysis.teamEfficiency.rushingComparison[gameAnalysis.gameInfo?.awayTeam].toFixed(3)}
                    </div>
                  </div>
                  
                  <div className="tppg-comparison-row">
                    <div className={gameAnalysis.teamEfficiency.successRates[gameAnalysis.gameInfo?.homeTeam] > gameAnalysis.teamEfficiency.successRates[gameAnalysis.gameInfo?.awayTeam] ? 'tppg-advantage' : ''}>
                      {(gameAnalysis.teamEfficiency.successRates[gameAnalysis.gameInfo?.homeTeam] * 100).toFixed(1)}%
                    </div>
                    <div>Success Rate</div>
                    <div className={gameAnalysis.teamEfficiency.successRates[gameAnalysis.gameInfo?.awayTeam] > gameAnalysis.teamEfficiency.successRates[gameAnalysis.gameInfo?.homeTeam] ? 'tppg-advantage' : ''}>
                      {(gameAnalysis.teamEfficiency.successRates[gameAnalysis.gameInfo?.awayTeam] * 100).toFixed(1)}%
                    </div>
                  </div>
                  
                  <div className="tppg-comparison-row">
                    <div className={gameAnalysis.teamEfficiency.explosiveness[gameAnalysis.gameInfo?.homeTeam] > gameAnalysis.teamEfficiency.explosiveness[gameAnalysis.gameInfo?.awayTeam] ? 'tppg-advantage' : ''}>
                      {gameAnalysis.teamEfficiency.explosiveness[gameAnalysis.gameInfo?.homeTeam].toFixed(2)}
                    </div>
                    <div>Explosiveness</div>
                    <div className={gameAnalysis.teamEfficiency.explosiveness[gameAnalysis.gameInfo?.awayTeam] > gameAnalysis.teamEfficiency.explosiveness[gameAnalysis.gameInfo?.homeTeam] ? 'tppg-advantage' : ''}>
                      {gameAnalysis.teamEfficiency.explosiveness[gameAnalysis.gameInfo?.awayTeam].toFixed(2)}
                    </div>
                  </div>
                  
                  <div className="tppg-comparison-row">
                    <div className={gameAnalysis.teamEfficiency.scoringOpportunities[gameAnalysis.gameInfo?.homeTeam].perOpportunity > gameAnalysis.teamEfficiency.scoringOpportunities[gameAnalysis.gameInfo?.awayTeam].perOpportunity ? 'tppg-advantage' : ''}>
                      {gameAnalysis.teamEfficiency.scoringOpportunities[gameAnalysis.gameInfo?.homeTeam].perOpportunity.toFixed(1)}
                    </div>
                    <div>Points/Opportunity</div>
                    <div className={gameAnalysis.teamEfficiency.scoringOpportunities[gameAnalysis.gameInfo?.awayTeam].perOpportunity > gameAnalysis.teamEfficiency.scoringOpportunities[gameAnalysis.gameInfo?.homeTeam].perOpportunity ? 'tppg-advantage' : ''}>
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
                      />
                      <Legend />
                      <Bar 
                        dataKey="homeScoring" 
                        name={`${gameAnalysis.gameInfo?.homeTeam} Points`} 
                        fill="#3b82f6" 
                        barSize={30}
                      />
                      <Bar 
                        dataKey="awayScoring" 
                        name={`${gameAnalysis.gameInfo?.awayTeam} Points`} 
                        fill="#ef4444" 
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
                          // Format the PPA value to 3 decimal places
                          return [value.toFixed(3), name];
                        }}
                      />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="homePPA" 
                        name={`${gameAnalysis.gameInfo?.homeTeam} (PPA: ${gameAnalysis.teamEfficiency?.homeTotalPPA?.toFixed(3) || '0.000'})`} 
                        stroke="#3b82f6" 
                        strokeWidth={3}
                        dot={{ r: 6, fill: '#3b82f6' }}
                        activeDot={{ r: 8, fill: '#3b82f6', stroke: 'white', strokeWidth: 2 }} 
                      />
                      <Line 
                        type="monotone" 
                        dataKey="awayPPA" 
                        name={`${gameAnalysis.gameInfo?.awayTeam} (PPA: ${gameAnalysis.teamEfficiency?.awayTotalPPA?.toFixed(3) || '0.000'})`} 
                        stroke="#ef4444" 
                        strokeWidth={3}
                        dot={{ r: 6, fill: '#ef4444' }}
                        activeDot={{ r: 8, fill: '#ef4444', stroke: 'white', strokeWidth: 2 }} 
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
                        <span className="tppg-team-name">{gameAnalysis.gameInfo?.homeTeam}</span>
                        <span className="tppg-team-points">{quarter.homeScoring}</span>
                      </div>
                      <div className="tppg-team-score">
                        <span className="tppg-team-name">{gameAnalysis.gameInfo?.awayTeam}</span>
                        <span className="tppg-team-points">{quarter.awayScoring}</span>
                      </div>
                    </div>
                    <div className="tppg-team-comparison">
                      <div>
                        <span style={{ display: 'block', color: '#3b82f6', fontWeight: 600 }}>
                          {gameAnalysis.gameInfo?.homeTeam}
                        </span>
                        <span className="tppg-team-ppa">{quarter.homePPA.toFixed(3)} PPA</span>
                      </div>
                      <div className="tppg-advantage-indicator">
                        {quarter.homeAdvantage ? (
                          <FaArrowUp style={{ color: '#3b82f6' }} />
                        ) : (
                          <FaArrowDown style={{ color: '#ef4444' }} />
                        )}
                        <span>{Math.abs(quarter.homePPA - quarter.awayPPA).toFixed(3)}</span>
                      </div>
                      <div>
                        <span style={{ display: 'block', color: '#ef4444', fontWeight: 600 }}>
                          {gameAnalysis.gameInfo?.awayTeam}
                        </span>
                        <span className="tppg-team-ppa">{quarter.awayPPA.toFixed(3)} PPA</span>
                      </div>
                    </div>
                    <p className="tppg-quarter-description">
                      {quarter.significance === 'significant' 
                        ? 'Significant advantage for ' 
                        : 'Slight edge for '}
                      <span className="tppg-team-advantage">
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
                {gameAnalysis.keyPlays.map((play, index) => (
                  <div 
                    key={index} 
                    className={`tppg-key-play ${play.scoringPlay ? 'tppg-scoring-play' : ''} ${play.importance === 'high' ? 'tppg-high-importance' : play.importance === 'medium' ? 'tppg-medium-importance' : ''}`}
                  >
                    <div className="tppg-play-header">
                      <span className="tppg-play-time">
                        Q{play.period} - {play.clock.minutes}:{play.clock.seconds < 10 ? '0' : ''}{play.clock.seconds}
                      </span>
                      <span className={`tppg-play-epa ${play.epa > 0 ? 'tppg-positive' : 'tppg-negative'}`}>
                        {play.epa > 0 ? (
                          <><FaArrowUp style={{ marginRight: '4px' }} /> +{play.epa.toFixed(2)} EPA</>
                        ) : (
                          <><FaArrowDown style={{ marginRight: '4px' }} /> {play.epa.toFixed(2)} EPA</>
                        )}
                      </span>
                    </div>
                    
                    <p className="tppg-play-text">{play.playText}</p>
                    
                    <div className="tppg-play-footer">
                      <span className="tppg-play-team">
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
                          <span className="tppg-scoring-badge">
                            <FaFootballBall /> Scoring Play
                          </span>
                        )}
                      </span>
                    </div>
                    
                    <div className="tppg-play-importance">
                      {play.importance === 'high' && (
                        <span className="tppg-high-importance-tag">GAME CHANGER</span>
                      )}
                      {play.importance === 'medium' && (
                        <span className="tppg-medium-importance-tag">KEY PLAY</span>
                      )}
                    </div>
                  </div>
                ))}
                
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
                        <p><strong>Team:</strong> {gameAnalysis.turningPoint.team}</p>
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
                  {gameAnalysis.starPlayers.map((player, index) => (
                    <div 
                      key={index} 
                      className="tppg-player-card"
                      style={{ 
                        borderLeft: `4px solid ${player.team === gameAnalysis.gameInfo?.homeTeam ? '#3b82f6' : '#ef4444'}`
                      }}
                    >
                      <div className="tppg-player-header">
                        <h4 className="tppg-player-name">{player.name}</h4>
                        <span 
                          className="tppg-team-badge"
                          style={{ 
                            backgroundColor: player.team === gameAnalysis.gameInfo?.homeTeam ? 
                              'rgba(59, 130, 246, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                            color: player.team === gameAnalysis.gameInfo?.homeTeam ? 
                              '#1e40af' : '#b91c1c'
                          }}
                        >
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
                          <span className="tppg-stat-value">{player.ppaAverage.toFixed(2)}</span>
                        </div>
                        <div className="tppg-player-stat-item">
                          <span className="tppg-stat-label">Total Impact</span>
                          <span className="tppg-stat-value">{player.ppaCumulative.toFixed(1)}</span>
                        </div>
                        <div className="tppg-player-stat-item">
                          <span className="tppg-stat-label">Plays</span>
                          <span className="tppg-stat-value">{player.plays}</span>
                        </div>
                      </div>
                      
                      <div className="tppg-player-description">
                        <p className="tppg-player-strength">
                          <FaThumbsUp className="tppg-strength-icon" />
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
                                  backgroundColor: player.playType.passing > 0 ? '#3b82f6' : '#ef4444'
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
                                  backgroundColor: player.playType.rushing > 0 ? '#3b82f6' : '#ef4444'
                                }}
                              ></div>
                            </div>
                            <div className="tppg-stat-value">{player.playType.rushing.toFixed(2)}</div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
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
                <div className="tppg-ppa-scale">
                    <div className="tppg-ppa-scale-item tppg-ppa-elite">
                      <span className="tppg-scale-value">1.0+</span>
                      <span className="tppg-scale-label">Elite</span>
                    </div>
                    <div className="tppg-ppa-scale-item tppg-ppa-excellent">
                      <span className="tppg-scale-value">0.7-1.0</span>
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
                    <div className="tppg-ppa-scale-item tppg-ppa-poor">
                      <span className="tppg-scale-value">0.0</span>
                      <span className="tppg-scale-label">Negative Impact</span>
                    </div>
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
            >
              <option value="all">All Teams</option>
              {gameAnalysis?.gameInfo?.homeTeam && <option value={gameAnalysis.gameInfo.homeTeam}>{gameAnalysis.gameInfo.homeTeam}</option>}
              {gameAnalysis?.gameInfo?.awayTeam && <option value={gameAnalysis.gameInfo.awayTeam}>{gameAnalysis.gameInfo.awayTeam}</option>}
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
                filteredGrades.slice(0, 20).map((player, index) => (
                  <tr key={index}>
                    <td className="tppg-player-name-cell">
                      <FaUserAlt style={{ color: '#666' }} /> {player.name}
                    </td>
                    <td style={{ textAlign: 'center' }}>{player.team}</td>
                    <td style={{ textAlign: 'center' }}>{player.position}</td>
                    <td style={{ textAlign: 'center' }}>
                      <span className={`tppg-grade ${getGradeClass(player.overallGrade)}`}>
                        {getGradeIcon(player.overallGrade)} {player.overallGrade.toFixed(1)}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>{getGradeDescription(player.overallGrade)}</td>
                    <td style={{ textAlign: 'center' }}>{player.playCount}</td>
                    {showAdvancedStats && (
                      <td style={{ textAlign: 'center' }}>
                        <div className={`tppg-ppa-value ${player.averagePPA > 0.7 ? 'tppg-ppa-high' : player.averagePPA > 0.3 ? 'tppg-ppa-med' : player.averagePPA > 0 ? 'tppg-ppa-low' : 'tppg-ppa-neg'}`}>
                          {player.averagePPA.toFixed(2)}
                        </div>
                      </td>
                    )}
                    <td>
                      {player.insights && player.insights.length > 0 ? (
                        <ul className="tppg-insights-list">
                          {player.insights.map((insight, i) => (
                            <li key={i} className="tppg-insights-item">{insight}</li>
                          ))}
                        </ul>
                      ) : (
                        <span style={{ color: '#777', fontStyle: 'italic' }}>No special insights</span>
                      )}
                    </td>
                  </tr>
                ))
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
                      return (
                        <div className="tppg-chart-tooltip">
                          <h3 className="tppg-tooltip-title">{player.name}</h3>
                          <div className="tppg-tooltip-details">
                            <div><span className="tppg-tooltip-label">Position:</span> {player.position}</div>
                            <div><span className="tppg-tooltip-label">Team:</span> {player.team}</div>
                            <div>
                              <span className="tppg-tooltip-label">Grade:</span> 
                              <span className={getGradeClass(player.overallGrade)} style={{ 
                                paddingLeft: '5px',
                                fontWeight: '700'
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
                  {filteredGrades.slice(0, 15).map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={
                        entry.overallGrade >= 90 ? '#10b981' :
                        entry.overallGrade >= 80 ? '#22c55e' :
                        entry.overallGrade >= 70 ? '#eab308' :
                        entry.overallGrade >= 60 ? '#f97316' : '#ef4444'
                      }
                    />
                  ))}
                </Bar>
                <ReferenceLine y={60} stroke="#888" strokeDasharray="3 3" label={{ value: 'Average', position: 'insideBottomRight', fill: '#888' }} />
                <ReferenceLine y={80} stroke="#22c55e" strokeDasharray="3 3" label={{ value: 'Exceptional', position: 'insideBottomRight', fill: '#22c55e' }} />
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
                        return (
                          <div className="tppg-chart-tooltip">
                            <h3 className="tppg-tooltip-title">{player.name}</h3>
                            <div className="tppg-tooltip-details">
                              <div><span className="tppg-tooltip-label">Position:</span> {player.position}</div>
                              <div><span className="tppg-tooltip-label">Team:</span> {player.team}</div>
                              <div><span className="tppg-tooltip-label">Grade:</span> {player.overallGrade.toFixed(1)}</div>
                              <div><span className="tppg-tooltip-label">Plays:</span> {player.playCount}</div>
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
                      
                      // Determine color based on team
                      const color = player.team === gameAnalysis?.gameInfo?.homeTeam 
                        ? '#3b82f6' : '#ef4444';
                      
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
                  <ReferenceLine y={80} stroke="#22c55e" strokeDasharray="3 3" label={{ value: 'Exceptional', position: 'insideBottomRight', fill: '#22c55e' }} />
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
                    stroke="#3b82f6"
                    fill="#3b82f6"
                    fillOpacity={0.5}
                  />
                  <Radar
                    name={gameAnalysis?.gameInfo?.awayTeam}
                    dataKey={gameAnalysis?.gameInfo?.awayTeam}
                    stroke="#ef4444"
                    fill="#ef4444"
                    fillOpacity={0.5}
                  />
                  <Legend />
                  <Tooltip />
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
                <li><span className="tppg-scale-badge tppg-grade-elite">90-100</span> Elite Performance</li>
                <li><span className="tppg-scale-badge tppg-grade-exceptional">80-89</span> Exceptional</li>
                <li><span className="tppg-scale-badge tppg-grade-good">70-79</span> Very Good</li>
                <li><span className="tppg-scale-badge tppg-grade-average">60-69</span> Average</li>
                <li><span className="tppg-scale-badge tppg-grade-poor">60</span> Below Average</li>
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
                
              return (
                <div key={posGroup} className="tppg-position-card">
                  <h4>{icon} {label}</h4>
                  <div className={`tppg-position-grade ${getGradeClass(avgGrade)}`}>
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
                          {topPerformer.team}
                        </span>
                      </div>
                      <div className="tppg-top-performer-grade">
                        <span className={getGradeClass(topPerformer.overallGrade)}>
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