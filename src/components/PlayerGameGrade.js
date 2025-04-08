import React, { useState, useEffect, useMemo } from 'react';
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

const PlayerGameGrade = ({ gameId }) => {
  // State management
  const [gameData, setGameData] = useState(null);
  const [playerGrades, setPlayerGrades] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState('all');
  const [selectedPosition, setSelectedPosition] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [gameAnalysis, setGameAnalysis] = useState(null);
  const [activeAnalysisTab, setActiveAnalysisTab] = useState('overview');

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
        const playByPlayData = await teamsService.getPlayByPlay(gameId)
          .catch(err => {
            console.error("Error fetching play-by-play:", err);
            return { plays: [] };
          });
          
        const advancedBoxScore = await teamsService.getAdvancedBoxScore(gameId)
          .catch(err => {
            console.error("Error fetching advanced box score:", err);
            return { teams: [], players: { usage: [], ppa: [] } };
          });
          
        // Only proceed if we have minimum required data
        if ((!playByPlayData.plays && !advancedBoxScore.teams) || 
            (playByPlayData.plays && playByPlayData.plays.length === 0 && 
             (!advancedBoxScore.teams || advancedBoxScore.teams.length === 0))) {
          throw new Error("Missing critical game data");
        }

        // Generate game analysis
        const gameAnalysisData = generateGameAnalysis({
          playByPlay: playByPlayData,
          boxScore: advancedBoxScore
        });
        
        // Process player grades
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

        // Set default selected team if we have valid teams
        if (advancedBoxScore.gameInfo?.homeTeam) {
          setSelectedTeam(advancedBoxScore.gameInfo.homeTeam);
        }
        
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
    if (!data.boxScore?.gameInfo) {
      return null;
    }

    const { homeTeam, awayTeam, homePoints, awayPoints } = data.boxScore.gameInfo;
    
    // Extract key data points
    const homeWin = homePoints > awayPoints;
    const winner = homeWin ? homeTeam : awayTeam;
    const loser = homeWin ? awayTeam : homeTeam;
    const scoreDifference = Math.abs(homePoints - awayPoints);
    const isCloseGame = scoreDifference <= 7;
    
    // Extract team data safely
    const teams = data.boxScore.teams || [];
    const homeTeamData = teams.find(t => t.team === homeTeam) || {};
    const awayTeamData = teams.find(t => t.team === awayTeam) || {};
    
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
    
    // Key plays analysis - look for high EPA plays
    const keyPlays = [];
    const plays = data.playByPlay?.plays || [];
    plays.forEach(play => {
      if (play.epa && Math.abs(play.epa) > 2) {
        keyPlays.push({
          period: play.period,
          clock: play.clock,
          playText: play.playText,
          team: play.offense,
          epa: play.epa,
          scoringPlay: play.scoring
        });
      }
    });
    keyPlays.sort((a, b) => Math.abs(b.epa) - Math.abs(a.epa));
    
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
    
    // Star player analysis (with error checks)
    const topPlayers = data.boxScore.players?.ppa || [];
    const starPlayers = topPlayers
      .filter(player => player.average && player.average.total > 0.7)
      .map(player => ({
        name: player.player,
        team: player.team,
        position: player.position,
        ppaAverage: player.average.total,
        ppaCumulative: player.cumulative.total
      }))
      .sort((a, b) => b.ppaCumulative - a.ppaCumulative)
      .slice(0, 5);
    
    // Generate narrative
    const overview = `${winner} defeated ${loser} ${homeWin ? homePoints + '-' + awayPoints : awayPoints + '-' + homePoints} in ${isCloseGame ? 'a close battle' : 'a commanding victory'}. ${starPlayers[0]?.name || 'The leading player'} made the biggest impact with a cumulative PPA of ${starPlayers[0]?.ppaCumulative?.toFixed(1) || 'N/A'}.`;
    
    const quarterSummaries = quarterAnalysis.map(q => {
      return `Q${q.quarter}: ${q.homeAdvantage ? homeTeam : awayTeam} had the advantage (${Math.abs(q.homePPA - q.awayPPA).toFixed(2)} PPA difference).`;
    });

    const gameStory = `The game ${isCloseGame ? 'came down to the wire' : 'showed a clear difference in performance'} with ${teamEfficiency.passingComparison.advantage} dominating through the air (${teamEfficiency.passingComparison[teamEfficiency.passingComparison.advantage].toFixed(2)} passing PPA) and ${teamEfficiency.rushingComparison.advantage} controlling the ground game (${teamEfficiency.rushingComparison[teamEfficiency.rushingComparison.advantage].toFixed(2)} rushing PPA).`;
    
    return {
      gameInfo: data.boxScore.gameInfo,
      overview,
      quarterAnalysis,
      keyPlays: keyPlays.slice(0, 8),
      teamEfficiency,
      starPlayers,
      gameStory,
      quarterSummaries
    };
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
            const playerRegexes = [
              { 
                regex: /([A-Za-z'\-\.\s]+) pass complete to ([A-Za-z'\-\.\s]+) for/,
                roles: [
                  { name: 1, position: 'QB', role: 'passer' },
                  { name: 2, position: 'WR', role: 'receiver' }
                ]
              },
              {
                regex: /([A-Za-z'\-\.\s]+) pass incomplete to ([A-Za-z'\-\.\s]+)/,
                roles: [
                  { name: 1, position: 'QB', role: 'passer' },
                  { name: 2, position: 'WR', role: 'target' }
                ]
              },
              { 
                regex: /([A-Za-z'\-\.\s]+) run for/,
                roles: [
                  { name: 1, position: 'RB', role: 'rusher' }
                ]
              },
              {
                regex: /([A-Za-z'\-\.\s]+) sacked by ([A-Za-z'\-\.\s]+)/,
                roles: [
                  { name: 1, position: 'QB', role: 'sacked' },
                  { name: 2, position: 'DL', role: 'defender' }
                ]
              },
              {
                regex: /([A-Za-z'\-\.\s]+) pass intercepted/,
                roles: [
                  { name: 1, position: 'QB', role: 'intercepted' }
                ]
              },
              {
                regex: /([A-Za-z'\-\.\s]+) fumbled/,
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

  // Grade color and description helpers
  const getGradeColor = (grade) => {
    if (grade >= 90) return 'text-emerald-600';
    if (grade >= 80) return 'text-green-500';
    if (grade >= 70) return 'text-yellow-500';
    if (grade >= 60) return 'text-orange-500';
    return 'text-red-600';
  };

  const getGradeDescription = (grade) => {
    if (grade >= 90) return 'Elite Performance';
    if (grade >= 80) return 'Exceptional';
    if (grade >= 70) return 'Very Good';
    if (grade >= 60) return 'Average';
    return 'Below Average';
  };

  if (isLoading) return <div className="p-6 text-center font-bold text-blue-600">Loading comprehensive game analysis...</div>;
  if (error) return <div className="p-6 text-center text-red-600">{error}</div>;

  return (
    <div className="bg-white shadow-lg rounded-lg p-6">
      {gameAnalysis && (
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Game Analysis</h1>
          <h2 className="text-xl mb-6">
            {gameAnalysis.gameInfo.homeTeam} {gameAnalysis.gameInfo.homePoints} - {gameAnalysis.gameInfo.awayTeam} {gameAnalysis.gameInfo.awayPoints}
          </h2>
          <div className="mb-6 border-b">
            <div className="flex flex-wrap -mb-px">
              {['overview', 'quarterBreakdown', 'keyPlays', 'starPlayers'].map(tab => (
                <button
                  key={tab}
                  className={`mr-2 inline-block p-4 rounded-t-lg ${
                    activeAnalysisTab === tab 
                      ? 'text-blue-600 border-b-2 border-blue-600 font-bold' 
                      : 'hover:text-gray-600 hover:border-gray-300'
                  }`}
                  onClick={() => setActiveAnalysisTab(tab)}
                >
                  {tab === 'overview'
                    ? 'Overview'
                    : tab === 'quarterBreakdown'
                      ? 'Quarter Analysis'
                      : tab === 'keyPlays'
                        ? 'Key Plays'
                        : 'Star Players'}
                </button>
              ))}
            </div>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            {activeAnalysisTab === 'overview' && (
              <div>
                <h3 className="text-xl font-bold mb-4">Game Overview</h3>
                <p className="text-lg mb-4">{gameAnalysis.overview}</p>
                <p className="mb-4">{gameAnalysis.gameStory}</p>
                <div className="grid md:grid-cols-2 gap-4 mt-6">
                  <div className="bg-white p-4 rounded shadow">
                    <h4 className="font-bold mb-2">Game Flow</h4>
                    <p>
                      {gameAnalysis.quarterSummaries.map((summary, i) => (
                        <span key={i} className="block mb-1">{summary}</span>
                      ))}
                    </p>
                  </div>
                  <div className="bg-white p-4 rounded shadow">
                    <h4 className="font-bold mb-2">Key Statistics</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="font-semibold block">Success Rate</span>
                        <span className="block">
                          {gameAnalysis.gameInfo.homeTeam}: {(gameAnalysis.teamEfficiency.successRates[gameAnalysis.gameInfo.homeTeam] * 100).toFixed(1)}%
                        </span>
                        <span className="block">
                          {gameAnalysis.gameInfo.awayTeam}: {(gameAnalysis.teamEfficiency.successRates[gameAnalysis.gameInfo.awayTeam] * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div>
                        <span className="font-semibold block">Explosiveness</span>
                        <span className="block">
                          {gameAnalysis.gameInfo.homeTeam}: {gameAnalysis.teamEfficiency.explosiveness[gameAnalysis.gameInfo.homeTeam].toFixed(2)}
                        </span>
                        <span className="block">
                          {gameAnalysis.gameInfo.awayTeam}: {gameAnalysis.teamEfficiency.explosiveness[gameAnalysis.gameInfo.awayTeam].toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {activeAnalysisTab === 'quarterBreakdown' && (
              <div>
                <h3 className="text-xl font-bold mb-4">Quarter-by-Quarter Analysis</h3>
                <div className="mb-6" style={{ height: '300px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={gameAnalysis.quarterAnalysis}
                      margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="quarter" label={{ value: 'Quarter', position: 'insideBottom', offset: -10 }} />
                      <YAxis label={{ value: 'Team PPA', angle: -90, position: 'insideLeft' }} />
                      <Tooltip />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="homePPA" 
                        name={gameAnalysis.gameInfo.homeTeam} 
                        stroke="#3b82f6" 
                        activeDot={{ r: 8 }} 
                      />
                      <Line 
                        type="monotone" 
                        dataKey="awayPPA" 
                        name={gameAnalysis.gameInfo.awayTeam} 
                        stroke="#ef4444" 
                        activeDot={{ r: 8 }} 
                      />
                      <ReferenceLine y={0} stroke="#666" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  {gameAnalysis.quarterAnalysis.map((quarter, index) => (
                    <div key={index} className="bg-white rounded shadow p-4">
                      <h4 className="font-bold">Quarter {quarter.quarter}</h4>
                      <div className="flex justify-between items-center mt-2">
                        <div>
                          <span className="block text-blue-600 font-bold">{gameAnalysis.gameInfo.homeTeam}</span>
                          <span className="block text-lg">{quarter.homePPA.toFixed(2)} PPA</span>
                        </div>
                        <div className="text-center">
                          <span className={`text-sm ${quarter.homeAdvantage ? 'text-blue-600' : 'text-red-600'}`}>
                            {quarter.homeAdvantage ? '↑' : '↓'} {Math.abs(quarter.homePPA - quarter.awayPPA).toFixed(2)}
                          </span>
                        </div>
                        <div>
                          <span className="block text-red-600 font-bold">{gameAnalysis.gameInfo.awayTeam}</span>
                          <span className="block text-lg">{quarter.awayPPA.toFixed(2)} PPA</span>
                        </div>
                      </div>
                      <p className="mt-3 text-sm text-gray-600">
                        {quarter.significance === 'significant' 
                          ? 'Significant advantage for ' 
                          : 'Slight edge for '}
                        {quarter.homeAdvantage ? gameAnalysis.gameInfo.homeTeam : gameAnalysis.gameInfo.awayTeam}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {activeAnalysisTab === 'keyPlays' && (
              <div>
                <h3 className="text-xl font-bold mb-4">Key Game-Changing Plays</h3>
                <div className="space-y-4">
                  {gameAnalysis.keyPlays.map((play, index) => (
                    <div key={index} className="bg-white p-4 rounded shadow">
                      <div className="flex justify-between items-center">
                        <span className="font-bold">
                          Q{play.period} - {play.clock.minutes}:{play.clock.seconds < 10 ? '0' : ''}{play.clock.seconds}
                        </span>
                        <span className={`font-bold ${play.epa > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {play.epa > 0 ? '+' : ''}{play.epa.toFixed(2)} EPA
                        </span>
                      </div>
                      <p className="mt-2">{play.playText}</p>
                      <div className="mt-1 flex justify-between items-center">
                        <span className="text-sm text-gray-600">{play.team}</span>
                        {play.scoringPlay && <span className="text-sm bg-yellow-100 px-2 py-1 rounded">Scoring Play</span>}
                      </div>
                    </div>
                  ))}
                  {gameAnalysis.keyPlays.length === 0 && (
                    <p className="text-center text-gray-600 italic">No significant game-changing plays detected</p>
                  )}
                </div>
              </div>
            )}
            {activeAnalysisTab === 'starPlayers' && (
              <div>
                <h3 className="text-xl font-bold mb-4">Star Performers</h3>
                {gameAnalysis.starPlayers.length > 0 ? (
                  <div className="grid md:grid-cols-2 gap-4">
                    {gameAnalysis.starPlayers.map((player, index) => (
                      <div key={index} className={`bg-white rounded shadow p-4 border-l-4 ${player.team === gameAnalysis.gameInfo.homeTeam ? 'border-blue-500' : 'border-red-500'}`}>
                        <div className="flex justify-between items-center">
                          <h4 className="font-bold text-lg">{player.name}</h4>
                          <span className={`text-sm ${player.team === gameAnalysis.gameInfo.homeTeam ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'} px-2 py-1 rounded`}>
                            {player.team}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{player.position}</p>
                        <div className="grid grid-cols-2 gap-2 mt-3">
                          <div>
                            <span className="block text-sm text-gray-500">Average PPA</span>
                            <span className="block font-bold text-lg">{player.ppaAverage.toFixed(2)}</span>
                          </div>
                          <div>
                            <span className="block text-sm text-gray-500">Total Impact</span>
                            <span className="block font-bold text-lg">{player.ppaCumulative.toFixed(1)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-gray-600 italic">No standout performers detected</p>
                )}
                <div className="mt-6 bg-white rounded shadow p-4">
                  <h4 className="font-bold mb-2">Understanding PPA (Predicted Points Added)</h4>
                  <p className="text-sm text-gray-700">
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
      <h2 className="text-2xl font-bold mb-4">Player Performance Grades</h2>
      <div className="flex space-x-4 mb-6">
        <select 
          value={selectedTeam} 
          onChange={(e) => setSelectedTeam(e.target.value)}
          className="border rounded p-2"
        >
          <option value="all">All Teams</option>
          {Array.from(new Set(playerGrades.map(g => g.team))).map(team => (
            <option key={team} value={team}>{team}</option>
          ))}
        </select>
        <select 
          value={selectedPosition} 
          onChange={(e) => setSelectedPosition(e.target.value)}
          className="border rounded p-2"
        >
          <option value="all">All Positions</option>
          {Array.from(new Set(playerGrades.map(g => g.position))).map(pos => (
            <option key={pos} value={pos}>{pos}</option>
          ))}
        </select>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-3 text-left">Player</th>
              <th className="p-3">Team</th>
              <th className="p-3">Position</th>
              <th className="p-3">Grade</th>
              <th className="p-3">Description</th>
              <th className="p-3">Plays</th>
              <th className="p-3">Key Insights</th>
            </tr>
          </thead>
          <tbody>
            {filteredGrades.slice(0, 20).map((player, index) => (
              <tr key={index} className="border-b hover:bg-gray-50">
                <td className="p-3 font-bold">{player.name}</td>
                <td className="p-3 text-center">{player.team}</td>
                <td className="p-3 text-center">{player.position}</td>
                <td className={`p-3 text-center font-bold ${getGradeColor(player.overallGrade)}`}>
                  {player.overallGrade.toFixed(1)}
                </td>
                <td className="p-3 text-center">{getGradeDescription(player.overallGrade)}</td>
                <td className="p-3 text-center">{player.playCount}</td>
                <td className="p-3 text-sm">
                  {player.insights && player.insights.length > 0 ? (
                    <ul className="list-disc pl-4">
                      {player.insights.map((insight, i) => (
                        <li key={i}>{insight}</li>
                      ))}
                    </ul>
                  ) : (
                    <span className="text-gray-500 italic">No special insights</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-8" style={{ height: '400px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart 
            data={filteredGrades.slice(0, 15)}
            margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
          >
            <XAxis 
              dataKey="name" 
              angle={-45} 
              textAnchor="end" 
              interval={0}
            />
            <YAxis domain={[0, 100]} />
            <Tooltip 
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const player = payload[0].payload;
                  return (
                    <div className="bg-white p-4 shadow-lg rounded-lg">
                      <h3 className="font-bold">{player.name}</h3>
                      <p>Position: {player.position}</p>
                      <p>Team: {player.team}</p>
                      <p>Grade: {player.overallGrade.toFixed(1)}</p>
                      <p>Performance: {getGradeDescription(player.overallGrade)}</p>
                      <p>Total Plays: {player.playCount}</p>
                      {player.insights && player.insights.length > 0 && (
                        <div className="mt-2">
                          <p className="font-semibold">Insights:</p>
                          <ul className="list-disc pl-4">
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
            <Bar dataKey="overallGrade">
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
      <div className="mt-8 bg-gray-50 p-6 rounded-lg">
        <h3 className="text-xl font-bold mb-4">Grading Methodology</h3>
        <p className="text-gray-700">
          Our advanced grading system evaluates player performance beyond traditional 
          statistics. Each play is analyzed for its Expected Points Added (EPA), considering 
          the player's role, contribution, and impact on the game. Grades are calculated 
          on a 0-100 scale, with 60 representing an average performance.
        </p>
        <div className="mt-4 grid md:grid-cols-3 gap-4">
          <div>
            <h4 className="font-semibold">🏆 Grading Scale</h4>
            <ul className="list-disc pl-5">
              <li>90-100: Elite Performance</li>
              <li>80-89: Exceptional</li>
              <li>70-79: Very Good</li>
              <li>60-69: Average</li>
              <li>Below 60: Poor Performance</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold">📊 Key Performance Indicators</h4>
            <ul className="list-disc pl-5">
              <li>Expected Points Added (EPA)</li>
              <li>Positive Play Contributions</li>
              <li>Role-Specific Impact</li>
              <li>Consistency</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold">🔍 Position Weightings</h4>
            <ul className="list-disc pl-5">
              <li>QB: Highest scrutiny</li>
              <li>RB/WR: Explosive play potential</li>
              <li>Defensive Positions: Disruptive impact</li>
            </ul>
          </div>
        </div>
      </div>
      {gameData && (
        <div className="mt-8 bg-blue-50 p-6 rounded-lg">
          <h3 className="text-xl font-bold mb-4">Game Context</h3>
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <h4 className="font-semibold">Total Plays Analyzed</h4>
              <p>{gameData.playByPlay?.plays?.length || 'N/A'}</p>
            </div>
            <div>
              <h4 className="font-semibold">Teams Involved</h4>
              <p>
                {gameData.advancedBoxScore?.gameInfo?.homeTeam} vs {gameData.advancedBoxScore?.gameInfo?.awayTeam}
              </p>
            </div>
            <div>
              <h4 className="font-semibold">Game Dynamics</h4>
              <p>Total Players Graded: {playerGrades.length}</p>
            </div>
          </div>
        </div>
      )}
      <div className="mt-8">
        <h3 className="text-xl font-bold mb-4">Position Group Insights</h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {['QB', 'RB', 'WR', 'Defense'].map(posGroup => {
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
              <div key={posGroup} className="bg-white shadow rounded-lg p-4">
                <h4 className="font-bold mb-2">{posGroup} Performance</h4>
                <div className={`text-2xl font-bold ${getGradeColor(avgGrade)}`}>
                  {avgGrade.toFixed(1)}
                </div>
                <p className="text-sm text-gray-600">
                  Average Grade ({positionGrades.length} players)
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default PlayerGameGrade;