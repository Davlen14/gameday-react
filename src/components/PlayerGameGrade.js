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
  Legend 
} from 'recharts';

const PlayerGameGrade = ({ gameId }) => {
  // State management
  const [gameData, setGameData] = useState(null);
  const [playerGrades, setPlayerGrades] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState('all');
  const [selectedPosition, setSelectedPosition] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Comprehensive data fetching
  useEffect(() => {
    const fetchGameData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch multiple data sources
        const [
          playByPlayData, 
          advancedBoxScore, 
          playerGameStats, 
          gamePPA
        ] = await Promise.all([
          teamsService.getPlayByPlay(gameId),
          teamsService.getAdvancedBoxScore(gameId),
          teamsService.getGamePlayers(gameId),
          teamsService.getGamePPA(gameId)
        ]);

        // Combine and process data
        const processedGrades = calculatePlayerGrades({
          playByPlay: playByPlayData,
          boxScore: advancedBoxScore,
          playerStats: playerGameStats,
          ppadata: gamePPA
        });

        setGameData({
          playByPlay: playByPlayData,
          advancedBoxScore,
          playerGameStats,
          gamePPA
        });
        setPlayerGrades(processedGrades);
      } catch (err) {
        console.error("Error fetching game data:", err);
        setError("Failed to load game data.");
      } finally {
        setIsLoading(false);
      }
    };

    if (gameId) {
      fetchGameData();
    }
  }, [gameId]);

  // Enhanced grade calculation function
  const calculatePlayerGrades = (gameData) => {
    const players = new Map();
    const teams = new Set();

    // Extract teams from box score
    if (gameData.boxScore?.teams) {
      gameData.boxScore.teams.forEach(team => {
        teams.add(team.team);
      });
    }

    // Comprehensive player grade calculation
    const processPlayers = (data, source) => {
      data.forEach(play => {
        // Skip non-relevant play types
        if (["Timeout", "End Period", "Kickoff"].includes(play.playType)) return;

        // Advanced play parsing logic
        const parsePlayers = () => {
          const playerMatches = [];
          const playText = play.playText || '';
          const playerRegexes = [
            { 
              regex: /([A-Za-z'\-\s]+) pass complete to ([A-Za-z'\-\s]+) for/,
              roles: [
                { name: 1, position: 'QB', role: 'passer' },
                { name: 2, position: 'WR', role: 'receiver' }
              ]
            },
            { 
              regex: /([A-Za-z'\-\s]+) run for/,
              roles: [
                { name: 1, position: 'RB', role: 'rusher' }
              ]
            },
            { 
              regex: /([A-Za-z'\-\s]+) sacked by ([A-Za-z'\-\s]+)/,
              roles: [
                { name: 1, position: 'QB', role: 'sacked' },
                { name: 2, position: 'DL', role: 'defender' }
              ]
            }
          ];

          playerRegexes.forEach(({ regex, roles }) => {
            const match = playText.match(regex);
            if (match) {
              roles.forEach(role => {
                playerMatches.push({
                  name: match[role.name].trim(),
                  position: role.position,
                  role: role.role,
                  team: play.team
                });
              });
            }
          });

          return playerMatches;
        };

        const playersInvolved = parsePlayers();

        // Grade calculation logic
        playersInvolved.forEach(playerInfo => {
          const { name, position, role, team } = playerInfo;
          
          // Skip invalid names
          if (!name || name.length < 2) return;

          // Initialize player if not exists
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
          
          // Performance tracking
          player.performanceMetrics.totalPlays++;
          
          // EPA tracking (if available)
          if (play.epa) {
            player.performanceMetrics.epaContributions.push(play.epa);
            
            // Positive/negative contribution tracking
            if (play.epa > 0) {
              player.performanceMetrics.positiveContributions++;
            } else {
              player.performanceMetrics.negativeContributions++;
            }
          }

          // Play details
          player.playDetails.push({
            playType: play.playType,
            role,
            epa: play.epa,
            yardsGained: play.yardsGained
          });

          players.set(name, player);
        });
      });
    };

    // Process different data sources
    if (gameData.playByPlay?.plays) processPlayers(gameData.playByPlay.plays, 'playByPlay');
    if (gameData.playerStats) processPlayers(gameData.playerStats, 'playerStats');

    // Final grade calculation
    const finalGrades = [];
    players.forEach((playerData, name) => {
      const { performanceMetrics } = playerData;
      
      // Advanced grading calculation
      const calculateGrade = () => {
        const { 
          totalPlays, 
          positiveContributions, 
          negativeContributions, 
          epaContributions 
        } = performanceMetrics;

        // EPA average
        const avgEPA = epaContributions.length > 0 
          ? epaContributions.reduce((a, b) => a + b, 0) / epaContributions.length 
          : 0;

        // Contribution ratio
        const contributionRatio = totalPlays > 0 
          ? (positiveContributions / totalPlays) 
          : 0;

        // Base grade calculation
        let baseGrade = 60; // Average grade
        baseGrade += avgEPA * 10; // Scale EPA impact
        baseGrade += contributionRatio * 20; // Reward positive play ratio

        // Position-specific adjustments
        const positionMultipliers = {
          'QB': 1.2,
          'RB': 1.1,
          'WR': 1.1,
          'DL': 1.0,
          'LB': 1.0,
          'DB': 1.0
        };
        const positionMultiplier = positionMultipliers[playerData.position] || 1;
        baseGrade *= positionMultiplier;

        // Clamp grade between 0-100
        return Math.max(0, Math.min(100, Math.round(baseGrade)));
      };

      finalGrades.push({
        ...playerData,
        overallGrade: calculateGrade(),
        playCount: performanceMetrics.totalPlays
      });
    });

    // Sort by grade
    return finalGrades.sort((a, b) => b.overallGrade - a.overallGrade);
  };

  // Filter and memoize grades
  const filteredGrades = useMemo(() => {
    return playerGrades.filter(player => {
      const teamMatch = selectedTeam === 'all' || player.team === selectedTeam;
      const positionMatch = selectedPosition === 'all' || player.position === selectedPosition;
      return teamMatch && positionMatch;
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

  // Render loading and error states
  if (isLoading) return <div>Loading game analysis...</div>;
  if (error) return <div className="text-red-600">{error}</div>;

  return (
    <div className="bg-white shadow-lg rounded-lg p-6">
      <h2 className="text-2xl font-bold mb-4">Player Game Performance</h2>
      
      {/* Filters */}
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

      {/* Player Grades Table */}
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
                <td className="p-3 text-center">
                  {getGradeDescription(player.overallGrade)}
                </td>
                <td className="p-3 text-center">{player.playCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Visualization */}
      <div className="mt-8" style={{height: '400px'}}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart 
            data={filteredGrades.slice(0, 15)}
            margin={{top: 20, right: 30, left: 20, bottom: 70}}
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

      {/* Methodology Section */}
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

      {/* Detailed Game Context */}
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
                {gameData.boxScore?.teams?.map(team => team.team).join(' vs ') || 'N/A'}
              </p>
            </div>
            <div>
              <h4 className="font-semibold">Game Dynamics</h4>
              <p>
                Total Players Graded: {playerGrades.length}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Advanced Insights */}
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