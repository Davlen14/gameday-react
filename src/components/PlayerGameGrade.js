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
        
        console.log("Fetching play-by-play data for game ID:", gameId);
        const playByPlayData = await teamsService.getPlayByPlay(gameId)
          .catch(err => {
            console.error("Error fetching play-by-play:", err);
            throw new Error("Failed to fetch play-by-play data");
          });
          
        console.log("Fetching advanced box score for game ID:", gameId);
        const advancedBoxScore = await teamsService.getAdvancedBoxScore(gameId)
          .catch(err => {
            console.error("Error fetching advanced box score:", err);
            throw new Error("Failed to fetch advanced box score");
          });

        // Generate game analysis with enhanced data
        console.log("Generating comprehensive game analysis");
        const gameAnalysisData = generateGameAnalysis({
          playByPlay: playByPlayData,
          boxScore: advancedBoxScore
        });
        
        // Process player grades with improved algorithm
        console.log("Calculating detailed player grades");
        const processedGrades = calculatePlayerGrades({
          playByPlay: playByPlayData,
          boxScore: advancedBoxScore
        });

        // Update state with all data
        setGameData({
          playByPlay: playByPlayData,
          advancedBoxScore
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

  // Enhanced game analysis generator that produces detailed insights
  const generateGameAnalysis = (data) => {
    try {
      // Ensure we have the basic game info
      if (!data?.boxScore?.gameInfo) {
        throw new Error("Missing game info data");
      }

      // Extract game info with proper error handling
      const gameInfo = {
        homeTeam: data.boxScore.gameInfo.homeTeam || "Home Team",
        awayTeam: data.boxScore.gameInfo.awayTeam || "Away Team",
        homePoints: data.boxScore.gameInfo.homePoints || 0,
        awayPoints: data.boxScore.gameInfo.awayPoints || 0,
        excitement: data.boxScore.gameInfo.excitement || "N/A",
        homeWinProb: data.boxScore.gameInfo.homeWinProb ? 
          parseFloat(data.boxScore.gameInfo.homeWinProb) * 100 : 50,
        awayWinProb: data.boxScore.gameInfo.awayWinProb ? 
          parseFloat(data.boxScore.gameInfo.awayWinProb) * 100 : 50
      };
      
      // Determine game outcome metrics
      const homeWin = gameInfo.homePoints > gameInfo.awayPoints;
      const winner = homeWin ? gameInfo.homeTeam : gameInfo.awayTeam;
      const loser = homeWin ? gameInfo.awayTeam : gameInfo.homeTeam;
      const winnerPoints = homeWin ? gameInfo.homePoints : gameInfo.awayPoints;
      const loserPoints = homeWin ? gameInfo.awayPoints : gameInfo.homePoints;
      const scoreDifference = Math.abs(gameInfo.homePoints - gameInfo.awayPoints);
      const isCloseGame = scoreDifference <= 7;
      const isBlowout = scoreDifference >= 21;
      
      // Extract team data with error handling
      const teams = Array.isArray(data.boxScore?.teams?.ppa) ? data.boxScore.teams.ppa : [];
      const homeTeamData = teams.find(t => t?.team === gameInfo.homeTeam) || {};
      const awayTeamData = teams.find(t => t?.team === gameInfo.awayTeam) || {};
      
      // Get team success rates
      const successRates = Array.isArray(data.boxScore?.teams?.successRates) ? 
        data.boxScore.teams.successRates : [];
      const homeSuccessRate = successRates.find(t => t?.team === gameInfo.homeTeam) || {};
      const awaySuccessRate = successRates.find(t => t?.team === gameInfo.awayTeam) || {};
      
      // Get explosiveness data
      const explosiveness = Array.isArray(data.boxScore?.teams?.explosiveness) ? 
        data.boxScore.teams.explosiveness : [];
      const homeExplosiveness = explosiveness.find(t => t?.team === gameInfo.homeTeam) || {};
      const awayExplosiveness = explosiveness.find(t => t?.team === gameInfo.awayTeam) || {};
      
      // Process scoring opportunities
      const scoringOpps = Array.isArray(data.boxScore?.teams?.scoringOpportunities) ? 
        data.boxScore.teams.scoringOpportunities : [];
      const homeScoringOpps = scoringOpps.find(t => t?.team === gameInfo.homeTeam) || {};
      const awayScoringOpps = scoringOpps.find(t => t?.team === gameInfo.awayTeam) || {};
      
      // Get field position data
      const fieldPosition = Array.isArray(data.boxScore?.teams?.fieldPosition) ? 
        data.boxScore.teams.fieldPosition : [];
      const homeFieldPos = fieldPosition.find(t => t?.team === gameInfo.homeTeam) || {};
      const awayFieldPos = fieldPosition.find(t => t?.team === gameInfo.awayTeam) || {};
      
      // Extract plays by period (quarters in college football)
      // Note: box score data uses 'quarter1', 'quarter2', etc. while play-by-play uses 'period' field
      const plays = Array.isArray(data.playByPlay?.plays) ? data.playByPlay.plays : [];
      const playsByQuarter = {};
      for (let i = 1; i <= 4; i++) {
        // Filter plays by period number to match with box score quarter data
        playsByQuarter[i] = plays.filter(p => p.period === i);
        console.log(`Period ${i} has ${playsByQuarter[i].length} plays`);
      }
      
      // Calculate scoring by period (quarter)
      const scoringByQuarter = {};
      for (let i = 1; i <= 4; i++) {
        const quarterPlays = playsByQuarter[i] || [];
        const homeScoring = quarterPlays
          .filter(p => p.scoring && (p.offense === gameInfo.homeTeam || p.team === gameInfo.homeTeam))
          .reduce((sum, p) => {
            // Handle different scoring play types
            if (p.playType?.includes('Touchdown')) return sum + 7;
            if (p.playType?.includes('Field Goal')) return sum + 3;
            if (p.playType?.includes('Safety')) return sum + 2;
            return sum + (p.pointsScored || 0);
          }, 0);
        
        const awayScoring = quarterPlays
          .filter(p => p.scoring && (p.offense === gameInfo.awayTeam || p.team === gameInfo.awayTeam))
          .reduce((sum, p) => {
            if (p.playType?.includes('Touchdown')) return sum + 7;
            if (p.playType?.includes('Field Goal')) return sum + 3;
            if (p.playType?.includes('Safety')) return sum + 2;
            return sum + (p.pointsScored || 0);
          }, 0);
        
        scoringByQuarter[i] = {
          [gameInfo.homeTeam]: homeScoring,
          [gameInfo.awayTeam]: awayScoring
        };
      }
      
      // Extract period-by-period (quarter) PPA performance
      const quarters = ['quarter1', 'quarter2', 'quarter3', 'quarter4'];
      
      // Fix for the PPA values - use total PPA from the homeTeamData and awayTeamData
      // This ensures the Team Efficiency chart uses the correct values
      const homeTotalPPA = homeTeamData?.overall?.total || 0;
      const awayTotalPPA = awayTeamData?.overall?.total || 0;
      
      // These values are stored directly in the teamEfficiency object later
      
      const quarterAnalysis = quarters.map((quarter, index) => {
        // Get PPA values or default to 0
        // Note: box score data might have null for some quarters even when play-by-play has data
        const homeQuarterPPA = homeTeamData?.overall?.[quarter] !== null ? homeTeamData?.overall?.[quarter] || 0 : 0;
        const awayQuarterPPA = awayTeamData?.overall?.[quarter] !== null ? awayTeamData?.overall?.[quarter] || 0 : 0;
        
        // Get scoring from the calculated values
        const homeScoring = scoringByQuarter[index + 1]?.[gameInfo.homeTeam] || 0;
        const awayScoring = scoringByQuarter[index + 1]?.[gameInfo.awayTeam] || 0;
        
        return {
          quarter: index + 1,
          homePPA: homeQuarterPPA,
          awayPPA: awayQuarterPPA,
          homeAdvantage: homeQuarterPPA > awayQuarterPPA,
          significance: Math.abs(homeQuarterPPA - awayQuarterPPA) > 0.3 ? 'significant' : 'moderate',
          homeScoring: homeScoring,
          awayScoring: awayScoring,
          scoringDiff: homeScoring - awayScoring
        };
      });
      
      // Extract offensive and defensive efficiency by play type
      const passingEfficiency = {
        [gameInfo.homeTeam]: homeTeamData?.passing?.total || 0,
        [gameInfo.awayTeam]: awayTeamData?.passing?.total || 0,
      };
      
      const rushingEfficiency = {
        [gameInfo.homeTeam]: homeTeamData?.rushing?.total || 0,
        [gameInfo.awayTeam]: awayTeamData?.rushing?.total || 0,
      };
      
      // Analyze team strengths based on efficiency metrics
      const teamStrengths = {
        [gameInfo.homeTeam]: [],
        [gameInfo.awayTeam]: []
      };
      
      // Determine passing strength
      if (passingEfficiency[gameInfo.homeTeam] > 0.3) {
        teamStrengths[gameInfo.homeTeam].push('Efficient passing attack');
      }
      if (passingEfficiency[gameInfo.awayTeam] > 0.3) {
        teamStrengths[gameInfo.awayTeam].push('Efficient passing attack');
      }
      
      // Determine rushing strength
      if (rushingEfficiency[gameInfo.homeTeam] > 0.3) {
        teamStrengths[gameInfo.homeTeam].push('Strong rushing game');
      }
      if (rushingEfficiency[gameInfo.awayTeam] > 0.3) {
        teamStrengths[gameInfo.awayTeam].push('Strong rushing game');
      }
      
      // Determine explosiveness as a strength
      if (homeExplosiveness?.overall?.total > 1.5) {
        teamStrengths[gameInfo.homeTeam].push('Explosive play capability');
      }
      if (awayExplosiveness?.overall?.total > 1.5) {
        teamStrengths[gameInfo.awayTeam].push('Explosive play capability');
      }
      
      // Evaluate red zone efficiency
      if (homeScoringOpps?.pointsPerOpportunity > 5) {
        teamStrengths[gameInfo.homeTeam].push('Excellent red zone efficiency');
      }
      if (awayScoringOpps?.pointsPerOpportunity > 5) {
        teamStrengths[gameInfo.awayTeam].push('Excellent red zone efficiency');
      }
      
      // Find key plays based on EPA/PPA and context
      const keyPlays = [];
      plays.forEach(play => {
        // Skip non-meaningful plays
        if (play.playType === "Timeout" || play.playType === "End Period" || play.playType === "Kickoff") {
          return;
        }
        
        // Try to determine EPA or use PPA as fallback
        const playImpact = play.epa || play.ppa || 0;
        
        // High impact plays
        if (Math.abs(playImpact) > 2) {
          keyPlays.push({
            period: play.period || 1,
            clock: play.clock || { minutes: 0, seconds: 0 },
            playText: play.playText || "Play description unavailable",
            team: play.offense || play.team || "Unknown",
            epa: playImpact,
            scoringPlay: play.scoring || false,
            playType: play.playType || "Unknown Play Type",
            yardsGained: play.yardsGained || 0,
            down: play.down || 1,
            distance: play.distance || 10,
            importance: 'high'
          });
        }
        // Scoring plays that aren't already captured
        else if (play.scoring && Math.abs(playImpact) > 0.5) {
          keyPlays.push({
            period: play.period || 1,
            clock: play.clock || { minutes: 0, seconds: 0 },
            playText: play.playText || "Play description unavailable",
            team: play.offense || play.team || "Unknown",
            epa: playImpact,
            scoringPlay: true,
            playType: play.playType || "Unknown Play Type",
            yardsGained: play.yardsGained || 0,
            down: play.down || 1,
            distance: play.distance || 10,
            importance: 'medium'
          });
        }
        // Third/fourth down conversions in important game situations
        else if ((play.down === 3 || play.down === 4) && 
                play.yardsGained >= play.distance &&
                play.period >= 3 &&
                Math.abs(playImpact) > 0.8) {
          keyPlays.push({
            period: play.period || 1,
            clock: play.clock || { minutes: 0, seconds: 0 },
            playText: play.playText || "Play description unavailable",
            team: play.offense || play.team || "Unknown",
            epa: playImpact,
            scoringPlay: play.scoring || false,
            playType: play.playType || "Unknown Play Type",
            yardsGained: play.yardsGained || 0,
            down: play.down || 1,
            distance: play.distance || 10,
            importance: 'medium'
          });
        }
        // Explosive plays
        else if (
          (play.playType === "Rush" && play.yardsGained >= 20) ||
          (play.playType === "Pass Reception" && play.yardsGained >= 30)
        ) {
          keyPlays.push({
            period: play.period || 1,
            clock: play.clock || { minutes: 0, seconds: 0 },
            playText: play.playText || "Play description unavailable",
            team: play.offense || play.team || "Unknown",
            epa: playImpact,
            scoringPlay: play.scoring || false,
            playType: play.playType || "Unknown Play Type",
            yardsGained: play.yardsGained || 0,
            down: play.down || 1,
            distance: play.distance || 10,
            importance: play.period >= 3 ? 'medium' : 'standard'
          });
        }
        // Turnovers
        else if (play.playType?.includes("Interception") || play.playText?.includes("fumble")) {
          keyPlays.push({
            period: play.period || 1,
            clock: play.clock || { minutes: 0, seconds: 0 },
            playText: play.playText || "Play description unavailable",
            team: play.offense || play.team || "Unknown",
            epa: playImpact,
            scoringPlay: play.scoring || false,
            playType: play.playType || "Unknown Play Type",
            yardsGained: play.yardsGained || 0,
            down: play.down || 1,
            distance: play.distance || 10,
            importance: play.period >= 3 ? 'high' : 'medium'
          });
        }
      });
      
      // Sort by importance first, then by absolute EPA value
      keyPlays.sort((a, b) => {
        const importanceValues = { 'high': 3, 'medium': 2, 'standard': 1 };
        const importanceDiff = importanceValues[b.importance] - importanceValues[a.importance];
        if (importanceDiff !== 0) return importanceDiff;
        return Math.abs(b.epa) - Math.abs(a.epa);
      });
      
      // Cap the number of key plays to show
      const maxKeyPlays = 12;
      const selectedKeyPlays = keyPlays.slice(0, maxKeyPlays);
      
      // Enhanced team efficiency analysis
      const teamEfficiency = {
        // Include the total PPA values
        homeTotalPPA,
        awayTotalPPA,
        passingComparison: {
          [gameInfo.homeTeam]: passingEfficiency[gameInfo.homeTeam],
          [gameInfo.awayTeam]: passingEfficiency[gameInfo.awayTeam],
          advantage: passingEfficiency[gameInfo.homeTeam] > passingEfficiency[gameInfo.awayTeam] 
            ? gameInfo.homeTeam : gameInfo.awayTeam,
          margin: Math.abs(passingEfficiency[gameInfo.homeTeam] - passingEfficiency[gameInfo.awayTeam])
        },
        rushingComparison: {
          [gameInfo.homeTeam]: rushingEfficiency[gameInfo.homeTeam],
          [gameInfo.awayTeam]: rushingEfficiency[gameInfo.awayTeam],
          advantage: rushingEfficiency[gameInfo.homeTeam] > rushingEfficiency[gameInfo.awayTeam] 
            ? gameInfo.homeTeam : gameInfo.awayTeam,
          margin: Math.abs(rushingEfficiency[gameInfo.homeTeam] - rushingEfficiency[gameInfo.awayTeam])
        },
        successRates: {
          [gameInfo.homeTeam]: homeSuccessRate?.overall?.total || 0,
          [gameInfo.awayTeam]: awaySuccessRate?.overall?.total || 0,
          advantage: (homeSuccessRate?.overall?.total || 0) > (awaySuccessRate?.overall?.total || 0)
            ? gameInfo.homeTeam : gameInfo.awayTeam
        },
        explosiveness: {
          [gameInfo.homeTeam]: homeExplosiveness?.overall?.total || 0,
          [gameInfo.awayTeam]: awayExplosiveness?.overall?.total || 0,
          advantage: (homeExplosiveness?.overall?.total || 0) > (awayExplosiveness?.overall?.total || 0)
            ? gameInfo.homeTeam : gameInfo.awayTeam
        },
        scoringOpportunities: {
          [gameInfo.homeTeam]: {
            count: homeScoringOpps?.opportunities || 0,
            points: homeScoringOpps?.points || 0,
            perOpportunity: homeScoringOpps?.pointsPerOpportunity || 0
          },
          [gameInfo.awayTeam]: {
            count: awayScoringOpps?.opportunities || 0,
            points: awayScoringOpps?.points || 0,
            perOpportunity: awayScoringOpps?.pointsPerOpportunity || 0
          }
        },
        fieldPosition: {
          [gameInfo.homeTeam]: homeFieldPos?.averageStart || 0,
          [gameInfo.awayTeam]: awayFieldPos?.averageStart || 0,
          advantage: (homeFieldPos?.averageStart || 0) < (awayFieldPos?.averageStart || 0)
            ? gameInfo.homeTeam : gameInfo.awayTeam
        }
      };
      
      // Get standout player performances
      const players = data.boxScore.players?.ppa || [];
      
      // Define qualifying plays threshold
      const MIN_PLAYS_THRESHOLD = 3;
      
      // Filter and enhance player data
      const starPlayers = players
        .filter(player => {
          // Make sure we have valid player data
          if (!player.player || !player.team) return false;
          
          // Check if player had significant impact (PPA > 0.6 and multiple plays)
          const cumulativePPA = player.cumulative?.total || 0;
          const totalPlays = player.plays || 0;
          return cumulativePPA > 0.6 && totalPlays >= MIN_PLAYS_THRESHOLD;
        })
        .map(player => {
          // Get position-specific stats
          const isQB = player.position === 'QB';
          const isRB = player.position === 'RB';
          const isWR = player.position === 'WR' || player.position === 'TE';
          
          // Get position-specific plays
          const passPlays = isQB ? player.plays : 0;
          const rushPlays = isRB ? player.plays : 0;
          const receivingPlays = isWR ? player.plays : 0;
          
          // Get PPA by play type
          const passingPPA = isQB ? (player.average?.passing?.total || 0) : 0;
          const rushingPPA = player.average?.rushing?.total || 0;
          
          // Determine player role and effectiveness
          let playerRole = player.position;
          let effectiveness = 'solid';
          
          if (player.average?.total > 1.0) effectiveness = 'elite';
          else if (player.average?.total > 0.7) effectiveness = 'excellent';
          
          // Create a strength description
          let strengthDescription = '';
          
          if (isQB) {
            if (passingPPA > 0.7) strengthDescription = 'Efficient passer';
            else if (rushingPPA > 0.7) strengthDescription = 'Dual-threat capability';
          } else if (isRB) {
            if (rushingPPA > 0.7) strengthDescription = 'Explosive runner';
          } else if (isWR) {
            strengthDescription = 'Reliable target';
          } else {
            // For defensive or other players
            strengthDescription = 'Impact player';
          }
          
          return {
            name: player.player,
            team: player.team,
            position: player.position || "Unknown",
            ppaAverage: player.average?.total || 0,
            ppaCumulative: player.cumulative?.total || 0,
            plays: player.plays || 0,
            playType: {
              passing: passingPPA,
              rushing: rushingPPA
            },
            effectiveness,
            strengthDescription
          };
        })
        .sort((a, b) => b.ppaCumulative - a.ppaCumulative);
      
      // Cap the number of star players to show
      const topPlayerCount = Math.min(8, starPlayers.length);
      const topPlayers = starPlayers.slice(0, topPlayerCount);
      
      // Generate key matchup insights
      const teamComparisonInsights = [];
      
      // Passing offense comparison
      if (Math.abs(passingEfficiency[gameInfo.homeTeam] - passingEfficiency[gameInfo.awayTeam]) > 0.3) {
        const betterPassingTeam = passingEfficiency[gameInfo.homeTeam] > passingEfficiency[gameInfo.awayTeam] 
          ? gameInfo.homeTeam : gameInfo.awayTeam;
        teamComparisonInsights.push({
          aspect: 'Passing Game',
          advantage: betterPassingTeam,
          description: `${betterPassingTeam} had the superior passing attack (${passingEfficiency[betterPassingTeam].toFixed(2)} PPA vs ${passingEfficiency[betterPassingTeam === gameInfo.homeTeam ? gameInfo.awayTeam : gameInfo.homeTeam].toFixed(2)})`
        });
      }
      
      // Rushing offense comparison
      if (Math.abs(rushingEfficiency[gameInfo.homeTeam] - rushingEfficiency[gameInfo.awayTeam]) > 0.2) {
        const betterRushingTeam = rushingEfficiency[gameInfo.homeTeam] > rushingEfficiency[gameInfo.awayTeam] 
          ? gameInfo.homeTeam : gameInfo.awayTeam;
        teamComparisonInsights.push({
          aspect: 'Ground Game',
          advantage: betterRushingTeam,
          description: `${betterRushingTeam} controlled the ground game (${rushingEfficiency[betterRushingTeam].toFixed(2)} rushing PPA)`
        });
      }
      
      // Field position advantage
      const homeFP = parseFloat(teamEfficiency.fieldPosition[gameInfo.homeTeam]) || 0;
      const awayFP = parseFloat(teamEfficiency.fieldPosition[gameInfo.awayTeam]) || 0;
      
      if (Math.abs(homeFP - awayFP) > 5) {
        const betterFieldPosTeam = homeFP < awayFP ? gameInfo.homeTeam : gameInfo.awayTeam;
        teamComparisonInsights.push({
          aspect: 'Field Position',
          advantage: betterFieldPosTeam,
          description: `${betterFieldPosTeam} enjoyed better starting field position (own ${betterFieldPosTeam === gameInfo.homeTeam ? homeFP : awayFP} yard line)`
        });
      }
      
      // Explosiveness advantage
      if (Math.abs(teamEfficiency.explosiveness[gameInfo.homeTeam] - teamEfficiency.explosiveness[gameInfo.awayTeam]) > 0.3) {
        const moreExplosiveTeam = teamEfficiency.explosiveness.advantage;
        teamComparisonInsights.push({
          aspect: 'Explosiveness',
          advantage: moreExplosiveTeam,
          description: `${moreExplosiveTeam} generated more explosive plays (${teamEfficiency.explosiveness[moreExplosiveTeam].toFixed(2)} vs ${teamEfficiency.explosiveness[moreExplosiveTeam === gameInfo.homeTeam ? gameInfo.awayTeam : gameInfo.homeTeam].toFixed(2)})`
        });
      }
      
      // Red zone efficiency
      const homeRedZone = teamEfficiency.scoringOpportunities[gameInfo.homeTeam].perOpportunity;
      const awayRedZone = teamEfficiency.scoringOpportunities[gameInfo.awayTeam].perOpportunity;
      
      if (Math.abs(homeRedZone - awayRedZone) > 1) {
        const betterRedZoneTeam = homeRedZone > awayRedZone ? gameInfo.homeTeam : gameInfo.awayTeam;
        teamComparisonInsights.push({
          aspect: 'Red Zone',
          advantage: betterRedZoneTeam,
          description: `${betterRedZoneTeam} was more efficient in scoring opportunities (${betterRedZoneTeam === gameInfo.homeTeam ? homeRedZone : awayRedZone} pts/opp)`
        });
      }
      
      // Generate narrative overview
      const starPlayerInfo = topPlayers.length > 0 ? 
        `${topPlayers[0].name} (${topPlayers[0].position}, ${topPlayers[0].team}) was the standout performer with a cumulative PPA of ${topPlayers[0].ppaCumulative.toFixed(1)}.` : 
        '';
      
      // Create a game description based on the scoring pattern
      const gameFlow = determineGameFlow(quarterAnalysis, gameInfo);
      
      // Generate detailed quarter summaries
      const quarterSummaries = quarterAnalysis.map((q, index) => {
        let quarterDescription = '';
        const homePts = q.homeScoring;
        const awayPts = q.awayScoring;
        const scoringDiff = homePts - awayPts;
        const quarterNum = index + 1;
        
        if (Math.abs(scoringDiff) === 0) {
          quarterDescription = `Q${quarterNum}: Both teams scored ${homePts} points in an even quarter.`;
        } else {
          const dominantTeam = scoringDiff > 0 ? gameInfo.homeTeam : gameInfo.awayTeam;
          const scoringMargin = Math.abs(scoringDiff);
          quarterDescription = `Q${quarterNum}: ${dominantTeam} outscored their opponent ${scoringDiff > 0 ? homePts : awayPts}-${scoringDiff > 0 ? awayPts : homePts}`;
          
          if (q.homeAdvantage !== (scoringDiff > 0)) {
            // Team with PPA advantage didn't outscore opponent
            quarterDescription += ` despite ${scoringDiff > 0 ? gameInfo.awayTeam : gameInfo.homeTeam} having a slight efficiency advantage.`;
          } else {
            quarterDescription += `.`;
          }
        }
        
        return quarterDescription;
      });
      
      // Generate a statistical keys to victory
      const keysToVictory = generateKeysToVictory(gameInfo, teamEfficiency, winner);
      
      // Complete game overview with enhanced narrative
      const overview = `${winner} defeated ${loser} ${winnerPoints}-${loserPoints} in ${gameDescription(scoreDifference)}. ${starPlayerInfo} ${gameFlow}`;
      
      // Game story with more tactical insights
      const gameStory = `${winner} ${winnerPoints > loserPoints + 14 ? 'dominated' : 'edged'} ${loser} in ${keysToVictory.map(k => k.toLowerCase()).join(', ')}. ${teamComparisonInsights.length > 1 ? teamComparisonInsights[0].description + ' while ' + teamComparisonInsights[1].description + '.' : ''}`;
      
      // Generate turning point of the game
      const turningPoint = identifyTurningPoint(keyPlays, gameInfo);
      
      return {
        gameId,
        gameInfo,
        homeWin,
        winner,
        loser,
        scoreDifference,
        isCloseGame,
        overview,
        quarterAnalysis,
        keyPlays: selectedKeyPlays,
        teamEfficiency,
        starPlayers: topPlayers,
        gameStory,
        quarterSummaries,
        teamStrengths,
        teamComparisonInsights,
        turningPoint,
        keysToVictory
      };
    } catch (err) {
      console.error("Error generating game analysis:", err);
      throw new Error("Failed to generate comprehensive game analysis");
    }
  };

  // Helper function to determine game flow based on quarter analysis
  const determineGameFlow = (quarterAnalysis, gameInfo) => {
    // Check if any quarter data is available
    if (!quarterAnalysis || quarterAnalysis.length === 0) {
      return "Game flow details unavailable.";
    }
    
    // Analyze scoring patterns
    const firstHalfHomeScore = (quarterAnalysis[0]?.homeScoring || 0) + (quarterAnalysis[1]?.homeScoring || 0);
    const firstHalfAwayScore = (quarterAnalysis[0]?.awayScoring || 0) + (quarterAnalysis[1]?.awayScoring || 0);
    const secondHalfHomeScore = (quarterAnalysis[2]?.homeScoring || 0) + (quarterAnalysis[3]?.homeScoring || 0);
    const secondHalfAwayScore = (quarterAnalysis[2]?.awayScoring || 0) + (quarterAnalysis[3]?.awayScoring || 0);
    
    const firstHalfDominant = firstHalfHomeScore > firstHalfAwayScore ? gameInfo.homeTeam : gameInfo.awayTeam;
    const secondHalfDominant = secondHalfHomeScore > secondHalfAwayScore ? gameInfo.homeTeam : gameInfo.awayTeam;
    
    const firstHalfMargin = Math.abs(firstHalfHomeScore - firstHalfAwayScore);
    const secondHalfMargin = Math.abs(secondHalfHomeScore - secondHalfAwayScore);
    
    // Check for comeback scenarios
    if (firstHalfDominant !== secondHalfDominant && secondHalfMargin > 7) {
      return `${secondHalfDominant} mounted a second half comeback, outscoring their opponent ${secondHalfDominant === gameInfo.homeTeam ? secondHalfHomeScore : secondHalfAwayScore}-${secondHalfDominant === gameInfo.homeTeam ? secondHalfAwayScore : secondHalfHomeScore} after halftime.`;
    }
    
    // Check for wire-to-wire dominance
    if (firstHalfDominant === secondHalfDominant && firstHalfMargin > 7 && secondHalfMargin > 7) {
      return `${firstHalfDominant} controlled the game from start to finish, dominating both halves.`;
    }
    
    // Check for early dominance holding on
    if (firstHalfMargin > 14 && secondHalfMargin < 7) {
      return `${firstHalfDominant} built a substantial early lead and held on for the victory.`;
    }
    
    // Late game surge
    if (firstHalfMargin < 7 && secondHalfMargin > 14) {
      return `After a close first half, ${secondHalfDominant} pulled away in the second half to secure the win.`;
    }
    
    // Back and forth game
    const leadChanges = countLeadChanges(quarterAnalysis);
    if (leadChanges >= 2) {
      return `The lead changed hands ${leadChanges} times in this back-and-forth contest.`;
    }
    
    // Default description for close games
    return `The game remained competitive throughout with neither team able to build a commanding lead.`;
  };
  
  // Helper to count approximate lead changes based on quarter-by-quarter scoring
  const countLeadChanges = (quarterAnalysis) => {
    let leadChanges = 0;
    let homeTeamLeading = false;
    let homeScore = 0;
    let awayScore = 0;
    
    // Process each quarter
    quarterAnalysis.forEach(quarter => {
      homeScore += quarter.homeScoring;
      awayScore += quarter.awayScoring;
      
      const currentHomeLeading = homeScore > awayScore;
      if (currentHomeLeading !== homeTeamLeading && quarter.quarter > 1) {
        leadChanges++;
      }
      homeTeamLeading = currentHomeLeading;
    });
    
    return leadChanges;
  };
  
  // Helper function to describe game based on margin
  const gameDescription = (margin) => {
    if (margin >= 28) return 'a dominant blowout';
    if (margin >= 21) return 'a decisive victory';
    if (margin >= 14) return 'a comfortable win';
    if (margin >= 8) return 'a solid victory';
    if (margin >= 4) return 'a competitive game';
    if (margin >= 1) return 'a nail-biter';
    return 'a closely contested battle';
  };
  
  // Generate keys to victory
  const generateKeysToVictory = (gameInfo, teamEfficiency, winner) => {
    const keys = [];
    
    // Determine if passing or rushing was key
    const winnerPassingPPA = teamEfficiency.passingComparison[winner];
    const winnerRushingPPA = teamEfficiency.rushingComparison[winner];
    
    if (winnerPassingPPA > 0.3 && winnerPassingPPA > winnerRushingPPA) {
      keys.push('Passing Efficiency');
    }
    
    if (winnerRushingPPA > 0.3) {
      keys.push('Running Game Control');
    }
    
    // Check for field position advantage
    if (teamEfficiency.fieldPosition.advantage === winner) {
      keys.push('Field Position');
    }
    
    // Check for red zone efficiency
    const winnerRedZone = teamEfficiency.scoringOpportunities[winner].perOpportunity;
    if (winnerRedZone > 5) {
      keys.push('Red Zone Efficiency');
    }
    
    // Check for explosiveness
    if (teamEfficiency.explosiveness.advantage === winner && 
        teamEfficiency.explosiveness[winner] > 1.3) {
      keys.push('Explosive Play Generation');
    }
    
    // If we don't have enough keys, add a generic one
    if (keys.length < 2) {
      keys.push('Overall Execution');
    }
    
    return keys;
  };
  
  // Identify the turning point of the game
  const identifyTurningPoint = (keyPlays, gameInfo) => {
    if (!keyPlays || keyPlays.length === 0) {
      return {
        exists: false,
        description: "No clear turning point identified."
      };
    }
    
    // Look for high-impact plays in the second half
    const secondHalfPlays = keyPlays.filter(play => play.period > 2);
    if (secondHalfPlays.length === 0) {
      // Fall back to first half if necessary
      const biggestPlay = keyPlays[0];
      return {
        exists: true,
        play: biggestPlay,
        description: `${biggestPlay.team}'s ${biggestPlay.playType.toLowerCase()} for ${biggestPlay.yardsGained} yards in the ${getOrdinalNum(biggestPlay.period)} quarter was a key momentum changer.`,
        period: biggestPlay.period,
        team: biggestPlay.team
      };
    }
    
    // Find the highest impact play in the second half
    const turningPoint = secondHalfPlays[0];
    
    return {
      exists: true,
      play: turningPoint,
      description: `${turningPoint.scoringPlay ? "A scoring play by " : ""}${turningPoint.team} in the ${getOrdinalNum(turningPoint.period)} quarter (${turningPoint.clock.minutes}:${turningPoint.clock.seconds < 10 ? '0' : ''}${turningPoint.clock.seconds}) shifted momentum decisively.`,
      period: turningPoint.period,
      team: turningPoint.team
    };
  };
  
  // Helper for ordinal numbers
  const getOrdinalNum = (n) => {
    const suffixes = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return n + (suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0]);
  };

  // Enhanced player grade calculation with better error handling
  const calculatePlayerGrades = (gameData) => {
    try {
      const players = new Map();
      const teams = new Set();

      // Track teams
      if (gameData.boxScore?.gameInfo) {
        const { homeTeam, awayTeam } = gameData.boxScore.gameInfo;
        if (homeTeam) teams.add(homeTeam);
        if (awayTeam) teams.add(awayTeam);
      }

      // Import player data from PPA
      if (gameData.boxScore?.players?.ppa && Array.isArray(gameData.boxScore.players.ppa)) {
        gameData.boxScore.players.ppa.forEach(playerData => {
          if (!playerData.player || !playerData.team) return;
          
          // Set a default position if missing
          const position = playerData.position || determinePositionFromRole(playerData.player, playerData.team, gameData);
          
          players.set(playerData.player, {
            name: playerData.player,
            position: position,
            team: playerData.team,
            playDetails: [],
            performanceMetrics: {
              totalPlays: playerData.plays || 0,
              positiveContributions: 0,
              negativeContributions: 0,
              epaContributions: [],
              ppaData: {
                average: playerData.average || {},
                cumulative: playerData.cumulative || {}
              }
            }
          });
        });
      }

      // Process plays to extract player information
      const processPlays = (plays) => {
        if (!plays || !Array.isArray(plays)) return;
        
        plays.forEach(play => {
          if (["Timeout", "End Period", "Kickoff"].includes(play.playType)) return;
          
          const parsePlayers = () => {
            const playerMatches = [];
            const playText = play.playText || '';
            if (!playText) return playerMatches;
            
            // Enhanced regex patterns for better player detection
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
              },
              {
                regex: /interception by ([A-Za-z'\-\.\s]+)/i,
                roles: [
                  { name: 1, position: 'DB', role: 'defender' }
                ]
              },
              {
                regex: /tackle by ([A-Za-z'\-\.\s]+)/i,
                roles: [
                  { name: 1, position: 'DEF', role: 'tackler' }
                ]
              }
            ];
            
            playerRegexes.forEach(({ regex, roles }) => {
              const match = playText.match(regex);
              if (match) {
                roles.forEach(role => {
                  if (match[role.name] && match[role.name].trim().length > 2) {
                    // Clean the player name to avoid common issues
                    const playerName = cleanPlayerName(match[role.name].trim());
                    
                    playerMatches.push({
                      name: playerName,
                      position: role.position,
                      role: role.role,
                      team: determinePlayerTeam(playerName, role.role, play)
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
            if (!name || name.length < 2 || !team) return;
            
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
            
            // Track EPA contribution
            if (play.epa !== undefined && play.epa !== null) {
              // Adjust EPA based on role (e.g., negative for defense on positive offensive play)
              let adjustedEpa = play.epa;
              if ((role === 'defender' || role === 'tackler') && 
                  player.team !== play.offense) {
                adjustedEpa = -adjustedEpa;
              }
              
              player.performanceMetrics.epaContributions.push(adjustedEpa);
              
              if (adjustedEpa > 0) {
                player.performanceMetrics.positiveContributions++;
              } else {
                player.performanceMetrics.negativeContributions++;
              }
            }
            
            // Record play details
            player.playDetails.push({
              playType: play.playType,
              role,
              epa: play.epa,
              yardsGained: play.yardsGained,
              scoring: play.scoring || false,
              period: play.period,
              down: play.down,
              distance: play.distance
            });
            
            players.set(name, player);
          });
        });
      };

      // Process all plays to extract player information
      if (gameData.playByPlay?.plays && Array.isArray(gameData.playByPlay.plays)) {
        processPlays(gameData.playByPlay.plays);
      }

      // Calculate final grades with an improved algorithm
      const finalGrades = [];
      players.forEach((playerData, name) => {
        const { performanceMetrics } = playerData;
        
        // Improved grade calculation with better weighting
        const calculateGrade = () => {
          try {
            const { totalPlays, positiveContributions, epaContributions, ppaData } = performanceMetrics;
            
            // If player didn't participate enough, assign a baseline grade
            if (totalPlays < 2) {
              return 60;
            }
            
            // Use PPA data if available, otherwise EPA
            let averagePPA = 0;
            if (ppaData && ppaData.average && ppaData.average.total !== undefined) {
              averagePPA = ppaData.average.total;
            } else if (epaContributions.length > 0) {
              averagePPA = epaContributions.reduce((a, b) => a + b, 0) / epaContributions.length;
            }
            
            // Calculate contribution ratio (positive plays / total plays)
            const contributionRatio = totalPlays > 0 ? (positiveContributions / totalPlays) : 0;
            
            // Count scoring plays for bonus points
            const scoringPlayCount = playerData.playDetails.filter(p => p.scoring).length;
            const scoringBonus = scoringPlayCount * 3; // 3 points per scoring play
            
            // Count critical situation plays (3rd/4th down conversions)
            const criticalSituationPlays = playerData.playDetails.filter(p => 
              (p.down === 3 || p.down === 4) && 
              p.yardsGained >= p.distance &&
              p.epa > 0
            ).length;
            const criticalSituationBonus = criticalSituationPlays * 1.5;
            
            // Count big plays
            const bigPlays = playerData.playDetails.filter(p => 
              (p.playType === 'Rush' && p.yardsGained >= 15) ||
              (p.playType === 'Pass Reception' && p.yardsGained >= 25)
            ).length;
            const bigPlayBonus = bigPlays * 1.5;
            
            // Calculate base grade
            let baseGrade = 60; // Starting point
            
            // Add weighted components
            baseGrade += averagePPA * 15; // PPA/EPA component
            baseGrade += contributionRatio * 20; // Play success component
            baseGrade += scoringBonus; // Scoring bonus
            baseGrade += criticalSituationBonus; // Critical situation bonus
            baseGrade += bigPlayBonus; // Big play bonus
            
            // Position-specific adjustments
            const positionMultipliers = {
              'QB': 1.05, // QBs touch the ball on every play, slightly less variance
              'RB': 1.1,
              'WR': 1.1,
              'TE': 1.1,
              'OL': 0.95, // OL has less direct statistical impact
              'DL': 1.0,
              'LB': 1.0,
              'DB': 1.05,
              'CB': 1.05,
              'S': 1.05
            };
            
            const positionMultiplier = positionMultipliers[playerData.position] || 1;
            baseGrade *= positionMultiplier;
            
            // Cap the grade range
            return Math.max(0, Math.min(100, Math.round(baseGrade)));
          } catch (err) {
            console.error(`Error calculating grade for ${name}:`, err);
            return 60; // Default to average grade on error
          }
        };

        // Generate player insights based on performance
        const getPlayerInsights = () => {
          const insights = [];
          
          // Scoring contribution insights
          const scoringPlays = playerData.playDetails.filter(p => p.scoring).length;
          if (scoringPlays > 0) {
            insights.push(`Contributed to ${scoringPlays} scoring ${scoringPlays === 1 ? 'play' : 'plays'}`);
          }
          
          // Late game performance
          const lateGamePlays = playerData.playDetails.filter(p => p.period >= 3);
          const goodLateGamePlays = lateGamePlays.filter(p => p.epa && p.epa > 0);
          if (goodLateGamePlays.length > 2) {
            insights.push('Strong late-game performance');
          }
          
          // Position-specific insights
          if (playerData.position === 'QB') {
            const passPlays = playerData.playDetails.filter(p => p.role === 'passer');
            const completionRatio = passPlays.filter(p => !p.playType?.includes('Incompletion')).length / (passPlays.length || 1);
            if (completionRatio > 0.65 && passPlays.length >= 5) {
              insights.push('Efficient passer');
            }
            
            // Mobile QB insight
            const rushingPlays = playerData.playDetails.filter(p => p.role === 'rusher');
            if (rushingPlays.length >= 3) {
              const goodRushes = rushingPlays.filter(p => p.epa > 0);
              if (goodRushes.length >= 2) {
                insights.push('Effective dual-threat ability');
              }
            }
          }
          
          if (playerData.position === 'RB') {
            const rushPlays = playerData.playDetails.filter(p => p.role === 'rusher');
            const bigPlays = rushPlays.filter(p => p.yardsGained && p.yardsGained > 10).length;
            if (bigPlays > 1) {
              insights.push(`${bigPlays} explosive runs`);
            }
            
            // Check for all-purpose contribution
            const receivingPlays = playerData.playDetails.filter(p => p.role === 'receiver');
            if (receivingPlays.length >= 2) {
              insights.push('Valuable in passing game');
            }
          }
          
          if (playerData.position === 'WR' || playerData.position === 'TE') {
            const receivingPlays = playerData.playDetails.filter(p => p.role === 'receiver' || p.role === 'target');
            const catchRate = receivingPlays.filter(p => p.role === 'receiver').length / (receivingPlays.length || 1);
            
            if (catchRate > 0.7 && receivingPlays.length >= 3) {
              insights.push('Reliable hands');
            }
            
            const bigPlays = playerData.playDetails.filter(p => p.yardsGained && p.yardsGained > 20).length;
            if (bigPlays >= 2) {
              insights.push('Big-play threat');
            }
          }
          
          if (['DL', 'LB', 'DB', 'CB', 'S'].includes(playerData.position)) {
            const defensivePlays = playerData.playDetails.filter(p => 
              p.role === 'defender' || p.role === 'tackler'
            );
            
            if (defensivePlays.length >= 3) {
              const impactPlays = defensivePlays.filter(p => p.epa < -0.5);
              if (impactPlays.length >= 2) {
                insights.push('Disruptive defender');
              }
            }
            
            // Check for turnovers forced
            const turnoverPlays = playerData.playDetails.filter(p => 
              p.playType?.includes('Interception') || 
              p.playType?.includes('Fumble Recovery')
            );
            
            if (turnoverPlays.length > 0) {
              insights.push('Generated takeaway');
            }
          }
          
          return insights;
        };

        // Add the player with calculated grades and insights
        finalGrades.push({
          ...playerData,
          overallGrade: calculateGrade(),
          playCount: performanceMetrics.totalPlays,
          insights: getPlayerInsights(),
          averagePPA: performanceMetrics.ppaData?.average?.total || 
            (performanceMetrics.epaContributions.length ? 
              performanceMetrics.epaContributions.reduce((a, b) => a + b, 0) / 
              performanceMetrics.epaContributions.length : 0)
        });
      });

      // Sort by overall grade
      return finalGrades.sort((a, b) => b.overallGrade - a.overallGrade);
    } catch (err) {
      console.error("Error in player grade calculation:", err);
      return [];
    }
  };

  // Helper functions for player grade calculation
  const cleanPlayerName = (name) => {
    // Remove common suffixes that cause duplicate entries
    return name.replace(/\s+(Jr\.|Sr\.|III|IV|II|V)$/, '').trim();
  };
  
  const determinePlayerTeam = (playerName, role, play) => {
    // For offensive roles, use the offense team
    if (['passer', 'rusher', 'receiver', 'target'].includes(role)) {
      return play.offense || play.team;
    }
    
    // For defensive roles, use the defense team
    if (['defender', 'tackler'].includes(role)) {
      return play.defense || (play.offense ? (play.offense === play.homeTeam ? play.awayTeam : play.homeTeam) : null);
    }
    
    // Default to the play's team if we can't determine
    return play.team;
  };
  
  const determinePositionFromRole = (playerName, team, gameData) => {
    // Check if player appears in play-by-play data
    const plays = gameData.playByPlay?.plays || [];
    
    // Check for quarterback patterns
    const qbPlays = plays.filter(p => 
      p.playText && p.playText.includes(`${playerName} pass`)
    );
    if (qbPlays.length > 0) return 'QB';
    
    // Check for running back patterns
    const rbPlays = plays.filter(p => 
      p.playText && p.playText.includes(`${playerName} run for`)
    );
    if (rbPlays.length > 0) return 'RB';
    
    // Check for receiver patterns
    const wrPlays = plays.filter(p => 
      p.playText && p.playText.includes(`pass complete to ${playerName}`)
    );
    if (wrPlays.length > 0) return 'WR';
    
    // Default to generic position
    return 'PLAYER';
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
                  {gameAnalysis.quarterSummaries?.map((summary, i) => (
                    <div key={i} className="tppg-overview-text">{summary}</div>
                  ))}
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