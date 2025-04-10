import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import teamsService from '../services/teamsService';
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
  Area
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
  FaBullseye
} from 'react-icons/fa';

// Import CSS styles
import "../styles/PlayerGameGrade.css"; // Adjust the path as necessary

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

  // Debug logging - Add this to help diagnose the issue
  useEffect(() => {
    console.log('Current active tab:', activeAnalysisTab);
    console.log('Game Analysis data:', gameAnalysis);
  }, [activeAnalysisTab, gameAnalysis]);

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
        
        // Fetch data sequentially to better handle errors
        console.log("Fetching play-by-play data for game ID:", gameId);
        const playByPlayData = await teamsService.getPlayByPlay(gameId)
          .catch(err => {
            console.error("Error fetching play-by-play:", err);
            return { plays: [] };
          });
        console.log("Received play-by-play data:", playByPlayData);
          
        console.log("Fetching advanced box score for game ID:", gameId);
        const advancedBoxScore = await teamsService.getAdvancedBoxScore(gameId)
          .catch(err => {
            console.error("Error fetching advanced box score:", err);
            return { teams: [], players: { usage: [], ppa: [] } };
          });
        console.log("Received advanced box score:", advancedBoxScore);
          
        // Only proceed if we have minimum required data
        if ((!playByPlayData.plays && !advancedBoxScore.teams) || 
            (playByPlayData.plays && playByPlayData.plays.length === 0 && 
             (!advancedBoxScore.teams || advancedBoxScore.teams.length === 0))) {
          throw new Error("Missing critical game data");
        }

        // Generate game analysis
        console.log("Generating game analysis");
        const gameAnalysisData = generateGameAnalysis({
          playByPlay: playByPlayData,
          boxScore: advancedBoxScore
        });
        console.log("Generated game analysis:", gameAnalysisData);
        
        // Process player grades
        console.log("Calculating player grades");
        const processedGrades = calculatePlayerGrades({
          playByPlay: playByPlayData,
          boxScore: advancedBoxScore
        });
        console.log("Calculated player grades:", processedGrades);

        // Update state with all data
        setGameData({
          playByPlay: playByPlayData,
          advancedBoxScore
        });
        setPlayerGrades(processedGrades);
        setGameAnalysis(gameAnalysisData);

        // Set default selected team if we have valid teams
        if (advancedBoxScore.gameInfo?.homeTeam) {
          setSelectedTeam(advancedBoxScore.gameInfo.homeTeam);
        }
        
        // Ensure we start with the overview tab
        setActiveAnalysisTab('overview');
        
      } catch (err) {
        console.error("Error processing game data:", err);
        setError("Failed to load or process game data. Please check the game ID and try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchGameData();
  }, [gameId]);

  // Generate comprehensive game analysis
  const generateGameAnalysis = (data) => {
    console.log("Inside generateGameAnalysis with data:", data);
    if (!data.boxScore?.gameInfo) {
      console.warn("Missing game info in box score data");
      return null;
    }

    const { homeTeam, awayTeam, homePoints, awayPoints } = data.boxScore.gameInfo;
    console.log(`Game between ${homeTeam} (${homePoints}) and ${awayTeam} (${awayPoints})`);
    
    // Extract key data points
    const homeWin = homePoints > awayPoints;
    const winner = homeWin ? homeTeam : awayTeam;
    const loser = homeWin ? awayTeam : homeTeam;
    const scoreDifference = Math.abs(homePoints - awayPoints);
    const isCloseGame = scoreDifference <= 7;
    
    // Extract team data safely
    const teams = Array.isArray(data.boxScore?.teams) ? data.boxScore.teams : [];
    console.log("Teams data array length:", teams.length);
    
    const homeTeamData = teams.find(t => t?.team === homeTeam) || {};
    const awayTeamData = teams.find(t => t?.team === awayTeam) || {};
    
    console.log("Home team data found:", Object.keys(homeTeamData).length > 0);
    console.log("Away team data found:", Object.keys(awayTeamData).length > 0);
    
    // Quarter-by-quarter performance
    const quarters = ['quarter1', 'quarter2', 'quarter3', 'quarter4'];
    const quarterAnalysis = quarters.map((quarter, index) => {
      const homeQuarterPPA = homeTeamData?.ppa?.[0]?.overall?.[quarter] || 0;
      const awayQuarterPPA = awayTeamData?.ppa?.[0]?.overall?.[quarter] || 0;
      return {
        quarter: index + 1,
        homePPA: homeQuarterPPA,
        awayPPA: awayQuarterPPA,
        homeAdvantage: homeQuarterPPA > awayQuarterPPA,
        significance: Math.abs(homeQuarterPPA - awayQuarterPPA) > 0.3 ? 'significant' : 'moderate'
      };
    });
    
    console.log("Quarter analysis generated:", quarterAnalysis);
    
    // Key plays analysis - look for high EPA plays
    const keyPlays = [];
    const plays = data.playByPlay?.plays || [];
    console.log("Total plays to analyze:", plays.length);
    
    plays.forEach(play => {
      if (play.epa && Math.abs(play.epa) > 2) {
        keyPlays.push({
          period: play.period,
          clock: play.clock || { minutes: 0, seconds: 0 },
          playText: play.playText || "Play description unavailable",
          team: play.offense || play.team || "Unknown",
          epa: play.epa,
          scoringPlay: play.scoring || false
        });
      }
    });
    keyPlays.sort((a, b) => Math.abs(b.epa) - Math.abs(a.epa));
    console.log("Key plays identified:", keyPlays.length);
    
    // Team efficiency analysis (with error checks)
    const teamEfficiency = {
      passingComparison: {
        [homeTeam]: homeTeamData?.ppa?.[0]?.passing?.total || 0,
        [awayTeam]: awayTeamData?.ppa?.[0]?.passing?.total || 0,
        advantage: (homeTeamData?.ppa?.[0]?.passing?.total || 0) > (awayTeamData?.ppa?.[0]?.passing?.total || 0) ? homeTeam : awayTeam
      },
      rushingComparison: {
        [homeTeam]: homeTeamData?.ppa?.[0]?.rushing?.total || 0,
        [awayTeam]: awayTeamData?.ppa?.[0]?.rushing?.total || 0,
        advantage: (homeTeamData?.ppa?.[0]?.rushing?.total || 0) > (awayTeamData?.ppa?.[0]?.rushing?.total || 0) ? homeTeam : awayTeam
      },
      successRates: {
        [homeTeam]: homeTeamData?.successRates?.[0]?.overall?.total || 0,
        [awayTeam]: awayTeamData?.successRates?.[0]?.overall?.total || 0
      },
      explosiveness: {
        [homeTeam]: homeTeamData?.explosiveness?.[0]?.overall?.total || 0,
        [awayTeam]: awayTeamData?.explosiveness?.[0]?.overall?.total || 0
      }
    };
    
    console.log("Team efficiency data calculated");
    
    // Star player analysis (with error checks)
    const topPlayers = data.boxScore.players?.ppa || [];
    console.log("Top players data count:", topPlayers.length);
    
    const starPlayers = topPlayers
      .filter(player => player.average && player.average.total > 0.7)
      .map(player => ({
        name: player.player || "Unknown Player",
        team: player.team || "Unknown Team",
        position: player.position || "Unknown Pos",
        ppaAverage: player.average?.total || 0,
        ppaCumulative: player.cumulative?.total || 0
      }))
      .sort((a, b) => b.ppaCumulative - a.ppaCumulative)
      .slice(0, 5);
    
    console.log("Star players identified:", starPlayers.length);
    
    // Generate narrative
    const overview = `${winner} defeated ${loser} ${homeWin ? homePoints + '-' + awayPoints : awayPoints + '-' + homePoints} in ${isCloseGame ? 'a close battle' : 'a commanding victory'}. ${starPlayers[0]?.name || 'The leading player'} made the biggest impact with a cumulative PPA of ${starPlayers[0]?.ppaCumulative?.toFixed(1) || 'N/A'}.`;
    
    const quarterSummaries = quarterAnalysis.map(q => {
      return `Q${q.quarter}: ${q.homeAdvantage ? homeTeam : awayTeam} had the advantage (${Math.abs(q.homePPA - q.awayPPA).toFixed(2)} PPA difference).`;
    });

    const gameStory = `The game ${isCloseGame ? 'came down to the wire' : 'showed a clear difference in performance'} with ${teamEfficiency.passingComparison.advantage} dominating through the air (${teamEfficiency.passingComparison[teamEfficiency.passingComparison.advantage].toFixed(2)} passing PPA) and ${teamEfficiency.rushingComparison.advantage} controlling the ground game (${teamEfficiency.rushingComparison[teamEfficiency.rushingComparison.advantage].toFixed(2)} rushing PPA).`;
    
    const result = {
      gameInfo: data.boxScore.gameInfo,
      overview,
      quarterAnalysis,
      keyPlays: keyPlays.slice(0, 8),
      teamEfficiency,
      starPlayers,
      gameStory,
      quarterSummaries
    };
    
    console.log("Game analysis result generated");
    return result;
  };

  // Enhanced grade calculation function with better error handling
  const calculatePlayerGrades = (gameData) => {
    try {
      const players = new Map();
      const teams = new Set();

      // Extract teams safely
      if (gameData.boxScore?.teams && Array.isArray(gameData.boxScore.teams)) {
        gameData.boxScore.teams.forEach(team => {
          if (team?.team) {
            teams.add(team.team);
          }
        });
      }
      if (gameData.boxScore?.gameInfo) {
        const { homeTeam, awayTeam } = gameData.boxScore.gameInfo;
        if (homeTeam) teams.add(homeTeam);
        if (awayTeam) teams.add(awayTeam);
      }

      // Import player data from PPA if available
      if (gameData.boxScore?.players?.ppa && Array.isArray(gameData.boxScore.players.ppa)) {
        gameData.boxScore.players.ppa.forEach(playerData => {
          if (!playerData.player || !playerData.team || !playerData.position) return;
          players.set(playerData.player, {
            name: playerData.player,
            position: playerData.position,
            team: playerData.team,
            playDetails: [],
            performanceMetrics: {
              totalPlays: 0,
              positiveContributions: 0,
              negativeContributions: 0,
              epaContributions: [],
              ppaData: {
                average: playerData.average,
                cumulative: playerData.cumulative
              }
            }
          });
        });
      }

      const processPlayers = (plays) => {
        if (!plays || !Array.isArray(plays)) return;
        plays.forEach(play => {
          if (["Timeout", "End Period", "Kickoff"].includes(play.playType)) return;
          
          const parsePlayers = () => {
            const playerMatches = [];
            const playText = play.playText || '';
            if (!playText) return playerMatches;
            // Updated regex patterns with 'i' flag for case-insensitive matching
            const playerRegexes = [
              { 
                regex: /([A-Za-z'\-\.\s]+) pass complete to ([A-Za-z'\-\.\s]+) for/i,
                roles: [
                  { name: 1, position: 'QB', role: 'passer' },
                  { name: 2, position: 'WR', role: 'receiver' }
                ]
              },
              {
                regex: /([A-Za-z'\-\.\s]+) pass incomplete to ([A-Za-z'\-\.\s]+)/i,
                roles: [
                  { name: 1, position: 'QB', role: 'passer' },
                  { name: 2, position: 'WR', role: 'target' }
                ]
              },
              { 
                regex: /([A-Za-z'\-\.\s]+) run for/i,
                roles: [
                  { name: 1, position: 'RB', role: 'rusher' }
                ]
              },
              {
                regex: /([A-Za-z'\-\.\s]+) sacked by ([A-Za-z'\-\.\s]+)/i,
                roles: [
                  { name: 1, position: 'QB', role: 'sacked' },
                  { name: 2, position: 'DL', role: 'defender' }
                ]
              },
              {
                regex: /([A-Za-z'\-\.\s]+) pass intercepted/i,
                roles: [
                  { name: 1, position: 'QB', role: 'intercepted' }
                ]
              },
              {
                regex: /([A-Za-z'\-\.\s]+) fumbled/i,
                roles: [
                  { name: 1, position: 'SKILL', role: 'fumble' }
                ]
              }
            ];
            playerRegexes.forEach(({ regex, roles }) => {
              const match = playText.match(regex);
              if (match) {
                roles.forEach(role => {
                  if (match[role.name] && match[role.name].trim().length > 2) {
                    playerMatches.push({
                      name: match[role.name].trim(),
                      position: role.position,
                      role: role.role,
                      team: play.offense || play.team
                    });
                  }
                });
              }
            });
            return playerMatches;
          };

          const playersInvolved = parsePlayers();
          playersInvolved.forEach(playerInfo => {
            const { name, position, role, team } = playerInfo;
            if (!name || name.length < 2) return;
            if (!players.has(name)) {
              players.set(name, {
                name,
                position,
                team,
                playDetails: [],
                performanceMetrics: {
                  totalPlays: 0,
                  positiveContributions: 0,
                  negativeContributions: 0,
                  epaContributions: []
                }
              });
            }
            const player = players.get(name);
            player.performanceMetrics.totalPlays++;
            if (play.epa !== undefined && play.epa !== null) {
              player.performanceMetrics.epaContributions.push(play.epa);
              if (play.epa > 0) {
                player.performanceMetrics.positiveContributions++;
              } else {
                player.performanceMetrics.negativeContributions++;
              }
            }
            player.playDetails.push({
              playType: play.playType,
              role,
              epa: play.epa,
              yardsGained: play.yardsGained,
              scoring: play.scoring || false,
              period: play.period
            });
            players.set(name, player);
          });
        });
      };

      if (gameData.playByPlay?.plays && Array.isArray(gameData.playByPlay.plays)) {
        processPlayers(gameData.playByPlay.plays);
      }

      const finalGrades = [];
      players.forEach((playerData, name) => {
        const { performanceMetrics } = playerData;
        const calculateGrade = () => {
          try {
            const { totalPlays, positiveContributions, epaContributions, ppaData } = performanceMetrics;
            if (totalPlays < 2) {
              return 60;
            }
            let averagePPA = 0;
            if (ppaData && ppaData.average && ppaData.average.total) {
              averagePPA = ppaData.average.total;
            } else {
              averagePPA = epaContributions.length > 0 
                ? epaContributions.reduce((a, b) => a + b, 0) / epaContributions.length 
                : 0;
            }
            const contributionRatio = totalPlays > 0 ? (positiveContributions / totalPlays) : 0;
            const scoringPlayCount = playerData.playDetails.filter(p => p.scoring).length;
            const scoringBonus = scoringPlayCount * 2; // 2 points per play
            let baseGrade = 60;
            baseGrade += averagePPA * 12;
            baseGrade += contributionRatio * 25;
            baseGrade += scoringBonus;
            const positionMultipliers = {
              'QB': 1.1,
              'RB': 1.1,
              'WR': 1.1,
              'TE': 1.1,
              'OL': 1.0,
              'DL': 1.0,
              'LB': 1.0,
              'DB': 1.0,
              'CB': 1.0,
              'S': 1.0
            };
            const positionMultiplier = positionMultipliers[playerData.position] || 1;
            baseGrade *= positionMultiplier;
            return Math.max(0, Math.min(100, Math.round(baseGrade)));
          } catch (err) {
            console.error(`Error calculating grade for ${name}:`, err);
            return 60;
          }
        };

        const getPlayerInsights = () => {
          const insights = [];
          const scoringPlays = playerData.playDetails.filter(p => p.scoring).length;
          if (scoringPlays > 0) {
            insights.push(`Contributed to ${scoringPlays} scoring ${scoringPlays === 1 ? 'play' : 'plays'}`);
          }
          const lateGamePlays = playerData.playDetails.filter(p => p.period >= 3);
          const goodLateGamePlays = lateGamePlays.filter(p => p.epa && p.epa > 0);
          if (goodLateGamePlays.length > 2) {
            insights.push('Strong late-game performance');
          }
          if (playerData.position === 'QB') {
            const passPlays = playerData.playDetails.filter(p => p.role === 'passer');
            const completionRatio = passPlays.filter(p => !p.playType.includes('Incompletion')).length / (passPlays.length || 1);
            if (completionRatio > 0.65) {
              insights.push('Efficient passer');
            }
          }
          if (playerData.position === 'RB') {
            const rushPlays = playerData.playDetails.filter(p => p.role === 'rusher');
            const bigPlays = rushPlays.filter(p => p.yardsGained && p.yardsGained > 10).length;
            if (bigPlays > 1) {
              insights.push(`${bigPlays} explosive runs`);
            }
          }
          return insights;
        };

        finalGrades.push({
          ...playerData,
          overallGrade: calculateGrade(),
          playCount: performanceMetrics.totalPlays,
          insights: getPlayerInsights()
        });
      });

      return finalGrades.sort((a, b) => b.overallGrade - a.overallGrade);
    } catch (err) {
      console.error("Error in player grade calculation:", err);
      return [];
    }
  };

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

  // Check if we have all required data for a tab before showing it
  const hasOverviewData = () => {
    return gameAnalysis && gameAnalysis.overview && gameAnalysis.gameStory;
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

  // Debugging function to check tab content
  const handleTabClick = (tabId) => {
    console.log(`Tab clicked: ${tabId}`);
    console.log(`Has data for this tab:`, 
      tabId === 'overview' ? hasOverviewData() : 
      tabId === 'quarterBreakdown' ? hasQuarterData() : 
      tabId === 'keyPlays' ? hasKeyPlaysData() : 
      tabId === 'starPlayers' ? hasStarPlayersData() : false
    );
    setActiveAnalysisTab(tabId);
  };

  if (isLoading) return <div className="tppg-loading"><FaFootballBall /> Loading comprehensive game analysis...</div>;
  if (error) return <div className="tppg-error">{error}</div>;

  // Add a debug message if gameAnalysis is null
  if (!gameAnalysis) {
    console.error("gameAnalysis is null when it should be populated");
    return <div className="tppg-error">Error: Game analysis data could not be generated. Check console for details.</div>;
  }

  return (
    <div className="tppg-container">
      {gameAnalysis && (
        <div className="tppg-analysis">
          <h1 className="tppg-analysis-heading">
            <FaFootballBall /> Game Analysis
          </h1>
          
          <div className="tppg-game-score">
            <span className="tppg-team-name">{gameAnalysis.gameInfo?.homeTeam || 'Home'}</span>
            <span className="tppg-team-score">{gameAnalysis.gameInfo?.homePoints || '0'}</span>
            <span className="tppg-vs">vs</span>
            <span className="tppg-team-score">{gameAnalysis.gameInfo?.awayPoints || '0'}</span>
            <span className="tppg-team-name">{gameAnalysis.gameInfo?.awayTeam || 'Away'}</span>
          </div>
          
          <div className="tppg-tabs">
            {[
              { id: 'overview', label: 'Overview', icon: <FaRegListAlt />, hasData: hasOverviewData() },
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
                {!tab.hasData && <span className="tppg-no-data"> (No Data)</span>}
              </button>
            ))}
          </div>
          
          <div className="tppg-tab-content">
            {activeAnalysisTab === 'overview' && hasOverviewData() && (
              <div className="tppg-overview">
                <h3 className="tppg-overview-title">Game Overview</h3>
                <p className="tppg-overview-text">{gameAnalysis.overview}</p>
                <p className="tppg-overview-text">{gameAnalysis.gameStory}</p>
                
                <div className="tppg-stats-grid">
                  <div className="tppg-stat-card">
                    <h4 className="tppg-stat-card-title">
                      <FaChartLine /> Game Flow
                    </h4>
                    {gameAnalysis.quarterSummaries && gameAnalysis.quarterSummaries.map((summary, i) => (
                      <div key={i} className="tppg-overview-text">{summary}</div>
                    ))}
                  </div>
                  
                  <div className="tppg-stat-card">
                    <h4 className="tppg-stat-card-title">
                      <FaChartBar /> Key Statistics
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div>
                        <span style={{ fontWeight: 600, display: 'block', marginBottom: '8px' }}>Success Rate</span>
                        <div>
                          {gameAnalysis.gameInfo?.homeTeam}: {(gameAnalysis.teamEfficiency?.successRates?.[gameAnalysis.gameInfo?.homeTeam] * 100)?.toFixed(1) || '0.0'}%
                        </div>
                        <div>
                          {gameAnalysis.gameInfo?.awayTeam}: {(gameAnalysis.teamEfficiency?.successRates?.[gameAnalysis.gameInfo?.awayTeam] * 100)?.toFixed(1) || '0.0'}%
                        </div>
                      </div>
                      <div>
                        <span style={{ fontWeight: 600, display: 'block', marginBottom: '8px' }}>Explosiveness</span>
                        <div>
                          {gameAnalysis.gameInfo?.homeTeam}: {gameAnalysis.teamEfficiency?.explosiveness?.[gameAnalysis.gameInfo?.homeTeam]?.toFixed(2) || '0.00'}
                        </div>
                        <div>
                          {gameAnalysis.gameInfo?.awayTeam}: {gameAnalysis.teamEfficiency?.explosiveness?.[gameAnalysis.gameInfo?.awayTeam]?.toFixed(2) || '0.00'}
                        </div>
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
                <div style={{ height: '300px', marginBottom: '24px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={gameAnalysis.quarterAnalysis}
                      margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                      <XAxis 
                        dataKey="quarter" 
                        label={{ value: 'Quarter', position: 'insideBottom', offset: -10 }}
                        tick={{ fill: '#555' }} 
                      />
                      <YAxis 
                        label={{ value: 'Team PPA', angle: -90, position: 'insideLeft' }}
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
                      <Line 
                        type="monotone" 
                        dataKey="homePPA" 
                        name={gameAnalysis.gameInfo?.homeTeam} 
                        stroke="#3b82f6" 
                        strokeWidth={3}
                        dot={{ r: 6, fill: '#3b82f6' }}
                        activeDot={{ r: 8, fill: '#3b82f6', stroke: 'white', strokeWidth: 2 }} 
                      />
                      <Line 
                        type="monotone" 
                        dataKey="awayPPA" 
                        name={gameAnalysis.gameInfo?.awayTeam} 
                        stroke="#ef4444" 
                        strokeWidth={3}
                        dot={{ r: 6, fill: '#ef4444' }}
                        activeDot={{ r: 8, fill: '#ef4444', stroke: 'white', strokeWidth: 2 }} 
                      />
                      <ReferenceLine y={0} stroke="#666" strokeDasharray="3 3" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                
                <div className="tppg-quarter-grid">
                  {gameAnalysis.quarterAnalysis.map((quarter, index) => (
                    <div key={index} className="tppg-quarter-card">
                      <h4 className="tppg-quarter-title">Quarter {quarter.quarter}</h4>
                      <div className="tppg-team-comparison">
                        <div>
                          <span style={{ display: 'block', color: '#3b82f6', fontWeight: 600 }}>{gameAnalysis.gameInfo?.homeTeam}</span>
                          <span className="tppg-team-ppa">{quarter.homePPA.toFixed(2)}</span>
                        </div>
                        <div className="tppg-advantage-indicator">
                          {quarter.homeAdvantage ? (
                            <FaArrowUp style={{ color: '#3b82f6' }} />
                          ) : (
                            <FaArrowDown style={{ color: '#ef4444' }} />
                          )}
                          <span>{Math.abs(quarter.homePPA - quarter.awayPPA).toFixed(2)}</span>
                        </div>
                        <div>
                          <span style={{ display: 'block', color: '#ef4444', fontWeight: 600 }}>{gameAnalysis.gameInfo?.awayTeam}</span>
                          <span className="tppg-team-ppa">{quarter.awayPPA.toFixed(2)}</span>
                        </div>
                      </div>
                      <p style={{ marginTop: '12px', fontSize: '0.9rem', color: '#666' }}>
                        {quarter.significance === 'significant' 
                          ? 'Significant advantage for ' 
                          : 'Slight edge for '}
                        <span style={{ fontWeight: 600 }}>
                          {quarter.homeAdvantage ? gameAnalysis.gameInfo?.homeTeam : gameAnalysis.gameInfo?.awayTeam}
                        </span>
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {activeAnalysisTab === 'keyPlays' && hasKeyPlaysData() && (
              <div>
                <h3 className="tppg-overview-title">
                  <FaFireAlt /> Key Game-Changing Plays
                </h3>
                <div>
                  {gameAnalysis.keyPlays.map((play, index) => (
                    <div key={index} className="tppg-key-play">
                      <div className="tppg-play-header">
                        <span>
                          Q{play.period} - {play.clock?.minutes || '0'}:{(play.clock?.seconds || 0) < 10 ? '0' : ''}{play.clock?.seconds || '00'}
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
                        <span>{play.team}</span>
                        {play.scoringPlay && (
                          <span className="tppg-scoring-badge">
                            <FaFootballBall /> Scoring Play
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                  {gameAnalysis.keyPlays.length === 0 && (
                    <p style={{ textAlign: 'center', color: '#666', fontStyle: 'italic', padding: '20px' }}>
                      No significant game-changing plays detected
                    </p>
                  )}
                </div>
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
                        <p className="tppg-player-position">{player.position}</p>
                        <div className="tppg-player-stats">
                          <div className="tppg-player-stat-item">
                            <span className="tppg-stat-label">Average PPA</span>
                            <span className="tppg-stat-value">{player.ppaAverage.toFixed(2)}</span>
                          </div>
                          <div className="tppg-player-stat-item">
                            <span className="tppg-stat-label">Total Impact</span>
                            <span className="tppg-stat-value">{player.ppaCumulative.toFixed(1)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ textAlign: 'center', color: '#666', fontStyle: 'italic', padding: '20px' }}>
                    No standout performers detected
                  </p>
                )}
                <div style={{ marginTop: '24px', backgroundColor: 'white', borderRadius: '10px', padding: '16px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)' }}>
                  <h4 style={{ fontWeight: 600, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FaInfoCircle /> Understanding PPA (Predicted Points Added)
                  </h4>
                  <p style={{ fontSize: '0.9rem', color: '#555', lineHeight: '1.5' }}>
                    PPA measures a player's contribution to scoring. A high average PPA indicates efficiency, 
                    while cumulative PPA shows overall game impact. Values above 0.8 are considered exceptional,
                    with elite players consistently averaging over 1.0 PPA per play.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      
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
              {Array.from(new Set(playerGrades.map(g => g.team))).map(team => (
                <option key={team} value={team}>{team}</option>
              ))}
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
        </div>
        
        <div className="tppg-table-container">
          <table className="tppg-table">
            <thead>
              <tr>
                <th>Player</th>
                <th>Team</th>
                <th>Position</th>
                <th>Grade</th>
                <th>Description</th>
                <th>Plays</th>
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
                  <td colSpan="7" style={{ textAlign: 'center', padding: '20px', color: '#666', fontStyle: 'italic' }}>
                    No player data available with the current filters
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {filteredGrades.length > 0 && (
          <div className="tppg-chart-container">
            <ResponsiveContainer width="100%" height="100%">
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
                />
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const player = payload[0].payload;
                      return (
                        <div style={{ 
                          backgroundColor: 'white', 
                          padding: '16px', 
                          borderRadius: '8px',
                          boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                          border: '1px solid #e0e0e0'
                        }}>
                          <h3 style={{ fontWeight: '700', marginBottom: '8px', borderBottom: '1px solid #eee', paddingBottom: '8px' }}>
                            {player.name}
                          </h3>
                          <div style={{ marginBottom: '2px' }}><span style={{ fontWeight: '600' }}>Position:</span> {player.position}</div>
                          <div style={{ marginBottom: '2px' }}><span style={{ fontWeight: '600' }}>Team:</span> {player.team}</div>
                          <div style={{ marginBottom: '8px' }}>
                            <span style={{ fontWeight: '600' }}>Grade:</span> 
                            <span className={getGradeClass(player.overallGrade)} style={{ 
                              paddingLeft: '5px',
                              fontWeight: '700'
                            }}>
                              {player.overallGrade.toFixed(1)}
                            </span>
                          </div>
                          <div style={{ marginBottom: '2px' }}><span style={{ fontWeight: '600' }}>Performance:</span> {getGradeDescription(player.overallGrade)}</div>
                          <div style={{ marginBottom: '8px' }}><span style={{ fontWeight: '600' }}>Total Plays:</span> {player.playCount}</div>
                          
                          {player.insights && player.insights.length > 0 && (
                            <div>
                              <p style={{ fontWeight: '600', marginBottom: '4px', marginTop: '8px' }}>Insights:</p>
                              <ul style={{ paddingLeft: '20px', margin: 0 }}>
                                {player.insights.map((insight, i) => (
                                  <li key={i} style={{ marginBottom: '4px' }}>{insight}</li>
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
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
        
        <div className="tppg-methodology">
          <h3 className="tppg-methodology-title">
            <FaBullseye /> Grading Methodology
          </h3>
          <p className="tppg-methodology-content">
            Our advanced grading system evaluates player performance beyond traditional 
            statistics. Each play is analyzed for its Expected Points Added (EPA), considering 
            the player's role, contribution, and impact on the game. Grades are calculated 
            on a 0-100 scale, with 60 representing an average performance.
          </p>
          <div className="tppg-methodology-grid">
            <div className="tppg-methodology-card">
              <h4 className="tppg-methodology-subtitle">
                <FaTrophy /> Grading Scale
              </h4>
              <ul className="tppg-scale-list">
                <li>90-100: Elite Performance</li>
                <li>80-89: Exceptional</li>
                <li>70-79: Very Good</li>
                <li>60-69: Average</li>
                <li>Below 60: Poor Performance</li>
              </ul>
            </div>
            <div className="tppg-methodology-card">
              <h4 className="tppg-methodology-subtitle">
                <FaChartBar /> Key Performance Indicators
              </h4>
              <ul className="tppg-kpi-list">
                <li>Expected Points Added (EPA)</li>
                <li>Positive Play Contributions</li>
                <li>Role-Specific Impact</li>
                <li>Consistency</li>
              </ul>
            </div>
            <div className="tppg-methodology-card">
              <h4 className="tppg-methodology-subtitle">
                <FaUserAlt /> Position Weightings
              </h4>
              <ul className="tppg-position-list">
                <li>QB: Highest scrutiny</li>
                <li>RB/WR: Explosive play potential</li>
                <li>Defensive Positions: Disruptive impact</li>
              </ul>
            </div>
          </div>
        </div>
        
        {gameData && (
          <div className="tppg-game-context">
            <h3 className="tppg-context-title">
              <FaFootballBall /> Game Context
            </h3>
            <div className="tppg-context-grid">
              <div className="tppg-context-item">
                <h4>Total Plays Analyzed</h4>
                <p>{gameData.playByPlay?.plays?.length || 'N/A'}</p>
              </div>
              <div className="tppg-context-item">
                <h4>Teams Involved</h4>
                <p>
                  {gameData.advancedBoxScore?.gameInfo?.homeTeam || 'Home'} vs {gameData.advancedBoxScore?.gameInfo?.awayTeam || 'Away'}
                </p>
              </div>
              <div className="tppg-context-item">
                <h4>Game Dynamics</h4>
                <p>Total Players Graded: {playerGrades.length}</p>
              </div>
            </div>
          </div>
        )}
        
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
                posGroup === 'WR' ? p.position === 'WR' :
                ['DL', 'LB', 'DB', 'S', 'CB'].includes(p.position)
              );
              const avgGrade = positionGrades.length > 0 
                ? positionGrades.reduce((sum, p) => sum + p.overallGrade, 0) / positionGrades.length 
                : 0;
              return (
                <div key={posGroup} className="tppg-position-card">
                  <h4>{icon} {label}</h4>
                  <div className={`tppg-position-grade ${getGradeClass(avgGrade)}`}>
                    {avgGrade.toFixed(1)}
                  </div>
                  <p className="tppg-position-info">
                    Average Grade ({positionGrades.length} players)
                  </p>
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