import React, { useState, useEffect } from "react";
import teamsService from "../services/teamsService";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, ReferenceLine } from "recharts";

// PlayerGameGrade Component - PFF-Style Player Grading
const PlayerGameGrade = ({ gameId }) => {
  const [playByPlayData, setPlayByPlayData] = useState(null);
  const [playerGrades, setPlayerGrades] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState('all');
  const [selectedPosition, setSelectedPosition] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch play-by-play data for the game
  useEffect(() => {
    const fetchPlayByPlayData = async () => {
      try {
        setIsLoading(true);
        const data = await teamsService.getPlayByPlay(gameId);
        setPlayByPlayData(data);
        
        // Process play data to calculate player grades
        if (data && data.plays) {
          const grades = calculatePlayerGrades(data);
          setPlayerGrades(grades);
        }
      } catch (err) {
        console.error("Error fetching play-by-play data:", err);
        setError("Failed to load player grades.");
      } finally {
        setIsLoading(false);
      }
    };

    if (gameId) {
      fetchPlayByPlayData();
    }
  }, [gameId]);

  // PFF-Style grade calculation (based on our previous analysis)
  const calculatePlayerGrades = (gameData) => {
    // Extract all unique players mentioned in the plays
    const players = new Map();
    
    // Teams for filtering
    const teams = new Set();
    if (gameData.teams && gameData.teams.length) {
      gameData.teams.forEach(team => {
        teams.add(team.team);
      });
    }
    
    // Process all plays to identify players and their performances
    gameData.plays?.forEach(play => {
      // Skip non-relevant play types
      if (["Timeout", "End Period", "End of Half", "End of Game", "Kickoff"].includes(play.playType)) {
        return;
      }
      
      // Extract player name from play text
      const extractPlayerFromText = (text) => {
        // This is a simplified version - in reality, you'd need a more robust parser
        const passCompletionRegex = /([A-Za-z'\-\s]+) pass complete to ([A-Za-z'\-\s]+) for/;
        const passIncompleteRegex = /([A-Za-z'\-\s]+) pass incomplete to ([A-Za-z'\-\s]+)/;
        const rushRegex = /([A-Za-z'\-\s]+) run for/;
        const sackRegex = /([A-Za-z'\-\s]+) sacked by ([A-Za-z'\-\s]+)/;
        const interceptionRegex = /([A-Za-z'\-\s]+) pass intercepted ([A-Za-z'\-\s]+)/;
        
        let players = [];
        let match;
        
        if (match = text.match(passCompletionRegex)) {
          players.push({ name: match[1].trim(), position: "QB", role: "passer", team: play.team });
          players.push({ name: match[2].trim(), position: "WR", role: "receiver", team: play.team });
        } 
        else if (match = text.match(passIncompleteRegex)) {
          players.push({ name: match[1].trim(), position: "QB", role: "passer", team: play.team });
          if (match[2] && match[2] !== "")
            players.push({ name: match[2].trim(), position: "WR", role: "receiver", team: play.team });
        }
        else if (match = text.match(rushRegex)) {
          players.push({ name: match[1].trim(), position: "RB", role: "rusher", team: play.team });
        }
        else if (match = text.match(sackRegex)) {
          players.push({ name: match[1].trim(), position: "QB", role: "passer", team: play.team });
          players.push({ name: match[2].trim(), position: "DL", role: "defender", team: getOpposingTeam(play.team, teams) });
        }
        else if (match = text.match(interceptionRegex)) {
          players.push({ name: match[1].trim(), position: "QB", role: "passer", team: play.team });
          if (match[2])
            players.push({ name: match[2].trim(), position: "DB", role: "defender", team: getOpposingTeam(play.team, teams) });
        }
        
        return players;
      };
      
      // Determine play grade based on EPA and success
      const determinePlayGrade = (play) => {
        // Base on EPA (Expected Points Added)
        if (!play.epa && play.epa !== 0) return 0; // No EPA data
        
        // PFF-style -2 to +2 scale
        if (play.epa > 2) return 2;
        if (play.epa > 1) return 1.5;
        if (play.epa > 0.5) return 1;
        if (play.epa > 0.1) return 0.5;
        if (play.epa > -0.1) return 0;
        if (play.epa > -0.5) return -0.5;
        if (play.epa > -1) return -1;
        if (play.epa > -2) return -1.5;
        return -2;
      };
      
      // Get opposing team
      const getOpposingTeam = (team, allTeams) => {
        for (const t of allTeams) {
          if (t !== team) return t;
        }
        return "Unknown";
      };
      
      // Extract players from this play
      const playersInvolved = extractPlayerFromText(play.playText);
      
      // Assign appropriate grades to players based on their role in the play
      playersInvolved.forEach(playerInfo => {
        const { name, position, role, team } = playerInfo;
        
        // Skip if name is not a valid player name (e.g., empty string)
        if (!name || name.length < 2) return;
        
        // Create new player entry if not exists
        if (!players.has(name)) {
          players.set(name, {
            name,
            position,
            team,
            playGrades: [],
            offensiveGrade: null,
            defensiveGrade: null,
            overallGrade: null,
            playCount: 0
          });
        }
        
        const player = players.get(name);
        const playGrade = determinePlayGrade(play);
        
        // Adjust grade based on player's role in the play
        let adjustedGrade = playGrade;
        
        // Adjust grade based on role and outcome
        if (role === "passer") {
          // Quarterbacks get credit for good plays and blame for bad ones
          if (play.playType === "Pass Incompletion") adjustedGrade -= 0.5;
          if (play.playType === "Pass Interception Return") adjustedGrade -= 1;
          if (play.playType === "Sack") adjustedGrade -= 0.5;
          if (play.playType === "Passing Touchdown") adjustedGrade = Math.max(adjustedGrade, 1.5);
        } 
        else if (role === "receiver") {
          // Receivers get extra credit for receptions
          if (play.playType === "Pass Reception") adjustedGrade += 0.5;
          if (play.yardsGained > 20) adjustedGrade += 0.5;
          if (play.playType === "Passing Touchdown") adjustedGrade = Math.max(adjustedGrade, 1.5);
        }
        else if (role === "rusher") {
          // Rushers get credit for good runs
          if (play.yardsGained > 10) adjustedGrade += 0.5;
          if (play.playType === "Rushing Touchdown") adjustedGrade = Math.max(adjustedGrade, 1.5);
        }
        else if (role === "defender") {
          // Defenders get reverse of the offensive grade
          adjustedGrade = -playGrade;
          
          // Extra credit for turnovers and sacks
          if (play.playType === "Pass Interception Return") adjustedGrade += 1;
          if (play.playType === "Sack") adjustedGrade += 1;
        }
        
        // Cap grades at -2 to +2 range
        adjustedGrade = Math.max(-2, Math.min(2, adjustedGrade));
        
        // Add this play grade to player's record
        player.playGrades.push(adjustedGrade);
        player.playCount++;
        
        // Update player in map
        players.set(name, player);
      });
    });
    
    // Convert raw play grades to PFF's 0-100 scale (60 = average)
    // Calculate final grades for each player
    const finalGrades = [];
    players.forEach(player => {
      if (player.playGrades.length === 0) return;
      
      // Calculate raw average grade (-2 to +2 scale)
      const rawAvg = player.playGrades.reduce((sum, grade) => sum + grade, 0) / player.playGrades.length;
      
      // Apply consistency factor (reward consistent positive performance)
      const positivePlayCount = player.playGrades.filter(g => g > 0).length;
      const positivePlayRatio = positivePlayCount / player.playGrades.length;
      
      // Calculate standard deviation
      const mean = rawAvg;
      const squareDiffs = player.playGrades.map(g => Math.pow(g - mean, 2));
      const avgSquareDiff = squareDiffs.reduce((sum, diff) => sum + diff, 0) / squareDiffs.length;
      const stdDev = Math.sqrt(avgSquareDiff);
      
      // Consistency bonus (reward consistent good performance)
      let consistencyFactor = 0;
      if (mean > 0) {
        // Reward consistent above-average performance
        consistencyFactor = (5 - stdDev) * positivePlayRatio * 1.5;
      } else if (mean < 0) {
        // Slightly punish consistent below-average performance
        consistencyFactor = mean * (1 - stdDev / 2);
      }
      
      // Convert to PFF's 0-100 scale
      // 0 PFF grade = 60
      // +2 raw grade ≈ 95 PFF grade
      // -2 raw grade ≈ 30 PFF grade
      const scaledGrade = 60 + (rawAvg * 17.5) + consistencyFactor;
      
      // Ensure it's within bounds
      const finalGrade = Math.max(0, Math.min(100, Math.round(scaledGrade * 10) / 10));
      
      // Determine offensive/defensive grade based on position
      const isDefensivePlayer = ["DL", "LB", "DB", "DE", "CB", "S", "NT", "EDGE"].includes(player.position);
      
      // Set appropriate grades
      if (isDefensivePlayer) {
        player.defensiveGrade = finalGrade;
        player.overallGrade = finalGrade;
      } else {
        player.offensiveGrade = finalGrade;
        player.overallGrade = finalGrade;
      }
      
      // Add to final results array
      finalGrades.push({
        ...player,
        overallGrade: player.overallGrade,
        offensiveGrade: player.offensiveGrade,
        defensiveGrade: player.defensiveGrade
      });
    });
    
    // Sort by overall grade
    return finalGrades.sort((a, b) => b.overallGrade - a.overallGrade);
  };
  
  // Helper function to get opposing team
  const getOpposingTeam = (team, allTeams) => {
    for (const t of allTeams) {
      if (t !== team) return t;
    }
    return "Unknown";
  };

  // Get letter grade
  const getLetterGrade = (grade) => {
    if (grade >= 90) return "A+";
    if (grade >= 85) return "A";
    if (grade >= 80) return "A-";
    if (grade >= 77) return "B+";
    if (grade >= 73) return "B";
    if (grade >= 70) return "B-";
    if (grade >= 67) return "C+";
    if (grade >= 63) return "C";
    if (grade >= 60) return "C-";
    if (grade >= 57) return "D+";
    if (grade >= 53) return "D";
    if (grade >= 50) return "D-";
    return "F";
  };
  
  // Get grade color class
  const getGradeColorClass = (grade) => {
    if (grade >= 90) return "pgg-grade-a-plus";
    if (grade >= 85) return "pgg-grade-a";
    if (grade >= 80) return "pgg-grade-a-minus";
    if (grade >= 77) return "pgg-grade-b-plus";
    if (grade >= 73) return "pgg-grade-b";
    if (grade >= 70) return "pgg-grade-b-minus";
    if (grade >= 67) return "pgg-grade-c-plus";
    if (grade >= 63) return "pgg-grade-c";
    if (grade >= 60) return "pgg-grade-c-minus";
    if (grade >= 57) return "pgg-grade-d-plus";
    if (grade >= 53) return "pgg-grade-d";
    if (grade >= 50) return "pgg-grade-d-minus";
    return "pgg-grade-f";
  };
  
  // Get description for grade
  const getGradeDescription = (grade) => {
    if (grade >= 90) return "Elite";
    if (grade >= 80) return "High Quality";
    if (grade >= 70) return "Above Average";
    if (grade >= 60) return "Average";
    if (grade >= 50) return "Below Average";
    return "Poor";
  };
  
  // Get all available teams from player grades
  const getAvailableTeams = () => {
    const teams = new Set();
    playerGrades.forEach(player => {
      if (player.team) teams.add(player.team);
    });
    return ['all', ...Array.from(teams)];
  };
  
  // Get all available positions from player grades
  const getAvailablePositions = () => {
    const positions = new Set();
    playerGrades.forEach(player => {
      if (player.position) positions.add(player.position);
    });
    return ['all', ...Array.from(positions)];
  };
  
  // Get filtered player grades
  const getFilteredGrades = () => {
    return playerGrades.filter(player => {
      const teamMatch = selectedTeam === 'all' || player.team === selectedTeam;
      const positionMatch = selectedPosition === 'all' || player.position === selectedPosition;
      return teamMatch && positionMatch;
    });
  };
  
  // Custom tooltip for the chart
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const player = payload[0].payload;
      return (
        <div className="pgg-custom-tooltip">
          <h3>{player.name}</h3>
          <p>Team: {player.team}</p>
          <p>Position: {player.position}</p>
          <p>Overall Grade: <span className={getGradeColorClass(player.overallGrade)}>{player.overallGrade.toFixed(1)}</span> ({getLetterGrade(player.overallGrade)})</p>
          <p>Plays Graded: {player.playCount}</p>
          <p>Performance: {getGradeDescription(player.overallGrade)}</p>
        </div>
      );
    }
    return null;
  };

  if (isLoading) {
    return <div className="pgg-loading">Loading player grades...</div>;
  }

  if (error) {
    return <div className="pgg-error">{error}</div>;
  }

  const filteredGrades = getFilteredGrades();
  
  return (
    <div className="pgg-container">
      <style>
        {`
          /* PlayerGameGrade Component Styles */
          .pgg-container {
            background-color: #ffffff;
            border-radius: 12px;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
            padding: 24px;
            margin-top: 24px;
            margin-bottom: 24px;
          }
          
          .pgg-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 24px;
            border-bottom: 2px solid #f0f0f0;
            padding-bottom: 12px;
          }
          
          .pgg-title {
            font-size: 24px;
            font-weight: 700;
            margin: 0;
            color: #1a1a1a;
          }
          
          .pgg-filters {
            display: flex;
            gap: 16px;
            flex-wrap: wrap;
            margin-bottom: 20px;
          }
          
          .pgg-filter-group {
            display: flex;
            flex-direction: column;
            gap: 6px;
          }
          
          .pgg-filter-label {
            font-size: 13px;
            font-weight: 600;
            color: #666666;
          }
          
          .pgg-filter-select {
            padding: 8px 12px;
            border: 1px solid #dddddd;
            border-radius: 6px;
            font-size: 14px;
            color: #1a1a1a;
            background-color: #f8f9fa;
            min-width: 150px;
          }
          
          .pgg-filter-select:focus {
            outline: none;
            border-color: #0d79b3;
            box-shadow: 0 0 0 2px rgba(13, 121, 179, 0.2);
          }
          
          .pgg-table-container {
            overflow-x: auto;
            margin-bottom: 24px;
          }
          
          .pgg-table {
            width: 100%;
            border-collapse: separate;
            border-spacing: 0;
          }
          
          .pgg-table th {
            padding: 12px 16px;
            font-size: 13px;
            font-weight: 700;
            color: #666666;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            text-align: left;
            border-bottom: 2px solid #e5e5e5;
            position: sticky;
            top: 0;
            background-color: #ffffff;
          }
          
          .pgg-table td {
            padding: 14px 16px;
            font-size: 14px;
            border-bottom: 1px solid #e5e5e5;
            vertical-align: middle;
          }
          
          .pgg-table tr:hover {
            background-color: rgba(0, 38, 76, 0.03);
          }
          
          .pgg-player-name {
            font-weight: 700;
            color: #1a1a1a;
          }
          
          .pgg-team-position {
            display: flex;
            align-items: center;
            gap: 8px;
          }
          
          .pgg-position-badge {
            background-color: #00264c;
            color: white;
            padding: 3px 8px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: 600;
          }
          
          .pgg-team {
            font-size: 13px;
            color: #666666;
          }
          
          .pgg-grade-cell {
            font-weight: 700;
            font-size: 16px;
            text-align: center;
          }
          
          .pgg-letter-grade {
            font-weight: 800;
            font-size: 18px;
            text-align: center;
          }
          
          .pgg-plays-count {
            font-size: 14px;
            color: #666666;
            text-align: center;
          }
          
          .pgg-performance {
            font-size: 14px;
            font-weight: 600;
            text-align: center;
          }
          
          /* Grade color classes */
          .pgg-grade-a-plus, .pgg-grade-a, .pgg-grade-a-minus {
            color: #00c281;
          }
          
          .pgg-grade-b-plus, .pgg-grade-b, .pgg-grade-b-minus {
            color: #43cf9c;
          }
          
          .pgg-grade-c-plus, .pgg-grade-c, .pgg-grade-c-minus {
            color: #f7cb4d;
          }
          
          .pgg-grade-d-plus, .pgg-grade-d, .pgg-grade-d-minus {
            color: #ed9370;
          }
          
          .pgg-grade-f {
            color: #d63031;
          }
          
          /* Chart sections */
          .pgg-chart-container {
            height: 400px;
            margin-top: 32px;
            margin-bottom: 24px;
          }
          
          .pgg-legend {
            display: flex;
            justify-content: space-between;
            padding: 20px;
            background-color: #f8f9fa;
            border-radius: 8px;
            margin-bottom: 24px;
          }
          
          .pgg-legend-item {
            display: flex;
            flex-direction: column;
            align-items: center;
          }
          
          .pgg-legend-color {
            width: 40px;
            height: 8px;
            margin-bottom: 8px;
            border-radius: 4px;
          }
          
          .pgg-legend-label {
            font-size: 13px;
            font-weight: 600;
            color: #666666;
          }
          
          .pgg-custom-tooltip {
            background-color: white;
            padding: 16px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            border: 1px solid #dddddd;
          }
          
          .pgg-custom-tooltip h3 {
            margin-top: 0;
            margin-bottom: 8px;
            font-size: 16px;
            color: #1a1a1a;
          }
          
          .pgg-custom-tooltip p {
            margin: 4px 0;
            font-size: 14px;
            color: #666666;
          }
          
          .pgg-loading, .pgg-error {
            text-align: center;
            padding: 40px;
            color: #666666;
            font-size: 16px;
          }
          
          .pgg-error {
            color: #d63031;
          }
          
          /* Responsive adjustments */
          @media (max-width: 768px) {
            .pgg-header {
              flex-direction: column;
              align-items: flex-start;
              gap: 16px;
            }
            
            .pgg-filters {
              flex-direction: column;
              width: 100%;
            }
            
            .pgg-filter-group {
              width: 100%;
            }
            
            .pgg-filter-select {
              width: 100%;
            }
            
            .pgg-legend {
              flex-wrap: wrap;
              gap: 16px;
            }
          }
        `}
      </style>
      
      <div className="pgg-header">
        <h2 className="pgg-title">PFF-Style Player Grades</h2>
        <div className="pgg-subtitle">Performance grades calculated using play-by-play data {playByPlayData && `(${playByPlayData.plays?.length || 0} plays analyzed)`}</div>
      </div>
      
      <div className="pgg-filters">
        <div className="pgg-filter-group">
          <label className="pgg-filter-label">Team</label>
          <select 
            className="pgg-filter-select"
            value={selectedTeam}
            onChange={(e) => setSelectedTeam(e.target.value)}
          >
            {getAvailableTeams().map(team => (
              <option key={team} value={team}>{team === 'all' ? 'All Teams' : team}</option>
            ))}
          </select>
        </div>
        
        <div className="pgg-filter-group">
          <label className="pgg-filter-label">Position</label>
          <select 
            className="pgg-filter-select"
            value={selectedPosition}
            onChange={(e) => setSelectedPosition(e.target.value)}
          >
            {getAvailablePositions().map(position => (
              <option key={position} value={position}>{position === 'all' ? 'All Positions' : position}</option>
            ))}
          </select>
        </div>
      </div>
      
      <div className="pgg-legend">
        <div className="pgg-legend-item">
          <div className="pgg-legend-color" style={{ backgroundColor: '#00c281' }}></div>
          <div className="pgg-legend-label">90+ (A+): Elite</div>
        </div>
        <div className="pgg-legend-item">
          <div className="pgg-legend-color" style={{ backgroundColor: '#43cf9c' }}></div>
          <div className="pgg-legend-label">80-89 (A/B+): High Quality</div>
        </div>
        <div className="pgg-legend-item">
          <div className="pgg-legend-color" style={{ backgroundColor: '#f7cb4d' }}></div>
          <div className="pgg-legend-label">70-79 (B/C+): Above Average</div>
        </div>
        <div className="pgg-legend-item">
          <div className="pgg-legend-color" style={{ backgroundColor: '#ed9370' }}></div>
          <div className="pgg-legend-label">50-69 (C/D): Average/Below</div>
        </div>
        <div className="pgg-legend-item">
          <div className="pgg-legend-color" style={{ backgroundColor: '#d63031' }}></div>
          <div className="pgg-legend-label">&lt;50 (F): Poor</div>
        </div>
      </div>
      
      <div className="pgg-table-container">
        <table className="pgg-table">
          <thead>
            <tr>
              <th>Player</th>
              <th>Team/Position</th>
              <th>Overall Grade</th>
              <th>Letter Grade</th>
              <th>Plays Graded</th>
              <th>Performance</th>
            </tr>
          </thead>
          <tbody>
            {filteredGrades.slice(0, 20).map((player, index) => (
              <tr key={index}>
                <td className="pgg-player-name">{player.name}</td>
                <td>
                  <div className="pgg-team-position">
                    <span className="pgg-position-badge">{player.position}</span>
                    <span className="pgg-team">{player.team}</span>
                  </div>
                </td>
                <td className={`pgg-grade-cell ${getGradeColorClass(player.overallGrade)}`}>
                  {player.overallGrade.toFixed(1)}
                </td>
                <td className={`pgg-letter-grade ${getGradeColorClass(player.overallGrade)}`}>
                  {getLetterGrade(player.overallGrade)}
                </td>
                <td className="pgg-plays-count">{player.playCount}</td>
                <td className="pgg-performance">{getGradeDescription(player.overallGrade)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="pgg-chart-container">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={filteredGrades.slice(0, 15)}
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 70,
            }}
          >
            <XAxis 
              dataKey="name" 
              angle={-45}
              textAnchor="end"
              height={80}
              interval={0}
            />
            <YAxis domain={[0, 100]} />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine y={90} stroke="#00c281" strokeDasharray="3 3" />
            <ReferenceLine y={80} stroke="#43cf9c" strokeDasharray="3 3" />
            <ReferenceLine y={70} stroke="#f7cb4d" strokeDasharray="3 3" />
            <ReferenceLine y={60} stroke="#ed9370" strokeDasharray="3 3" />
            <Bar dataKey="overallGrade" name="Grade">
              {filteredGrades.slice(0, 15).map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={
                    entry.overallGrade >= 90 ? '#00c281' :
                    entry.overallGrade >= 80 ? '#43cf9c' :
                    entry.overallGrade >= 70 ? '#f7cb4d' :
                    entry.overallGrade >= 50 ? '#ed9370' : '#d63031'
                  } 
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      {playerGrades.length > 0 && (
        <div className="pgg-methodology">
          <h3>Grading Methodology</h3>
          <p>
            This PFF-style grading system evaluates players on a play-by-play basis, assigning scores from -2 to +2 on each play.
            Grades are based on a player's contribution rather than just the play result. For example, a quarterback throwing a 
            perfect pass that's dropped still receives a positive grade, while a routine screen pass that goes for a long 
            touchdown due to YAC might receive just an average grade.
          </p>
        <p>
            These raw play grades are then converted to a 0-100 scale where 60 is considered average. Grades above 90 are elite, 
            while grades below 50 indicate poor performance. The system rewards consistent excellence with a "consistency factor" 
            that boosts players who maintain high-quality play throughout the game.
          </p>
          <p>
            Grading considers position-specific responsibilities and contributions. For example, quarterbacks are evaluated on 
            accuracy and decision-making rather than just completion percentage, while defensive players are graded on play 
            disruption and tackling form rather than just counting stats.
          </p>
        </div>
      )}
      
      <div className="pgg-top-performers">
        <h3>Position Group Leaders</h3>
        <div className="pgg-position-leaders">
          {/* QB Leaders */}
          <div className="pgg-position-group">
            <h4>Quarterback</h4>
            {playerGrades.filter(p => p.position === "QB").slice(0, 3).map((player, index) => (
              <div key={index} className="pgg-leader-card">
                <div className="pgg-leader-name">{player.name}</div>
                <div className="pgg-leader-team">{player.team}</div>
                <div className={`pgg-leader-grade ${getGradeColorClass(player.overallGrade)}`}>
                  {player.overallGrade.toFixed(1)}
                </div>
              </div>
            ))}
            {playerGrades.filter(p => p.position === "QB").length === 0 && 
              <div className="pgg-no-data">No quarterback data available</div>
            }
          </div>
          
          {/* RB Leaders */}
          <div className="pgg-position-group">
            <h4>Running Back</h4>
            {playerGrades.filter(p => p.position === "RB").slice(0, 3).map((player, index) => (
              <div key={index} className="pgg-leader-card">
                <div className="pgg-leader-name">{player.name}</div>
                <div className="pgg-leader-team">{player.team}</div>
                <div className={`pgg-leader-grade ${getGradeColorClass(player.overallGrade)}`}>
                  {player.overallGrade.toFixed(1)}
                </div>
              </div>
            ))}
            {playerGrades.filter(p => p.position === "RB").length === 0 && 
              <div className="pgg-no-data">No running back data available</div>
            }
          </div>
          
          {/* WR Leaders */}
          <div className="pgg-position-group">
            <h4>Wide Receiver</h4>
            {playerGrades.filter(p => p.position === "WR").slice(0, 3).map((player, index) => (
              <div key={index} className="pgg-leader-card">
                <div className="pgg-leader-name">{player.name}</div>
                <div className="pgg-leader-team">{player.team}</div>
                <div className={`pgg-leader-grade ${getGradeColorClass(player.overallGrade)}`}>
                  {player.overallGrade.toFixed(1)}
                </div>
              </div>
            ))}
            {playerGrades.filter(p => p.position === "WR").length === 0 && 
              <div className="pgg-no-data">No wide receiver data available</div>
            }
          </div>
          
          {/* Defensive Leaders */}
          <div className="pgg-position-group">
            <h4>Defense</h4>
            {playerGrades.filter(p => ["DL", "LB", "DB", "DE", "CB", "S"].includes(p.position)).slice(0, 3).map((player, index) => (
              <div key={index} className="pgg-leader-card">
                <div className="pgg-leader-name">{player.name}</div>
                <div className="pgg-leader-team">{player.team}</div>
                <div className="pgg-leader-position">{player.position}</div>
                <div className={`pgg-leader-grade ${getGradeColorClass(player.overallGrade)}`}>
                  {player.overallGrade.toFixed(1)}
                </div>
              </div>
            ))}
            {playerGrades.filter(p => ["DL", "LB", "DB", "DE", "CB", "S"].includes(p.position)).length === 0 && 
              <div className="pgg-no-data">No defensive player data available</div>
            }
          </div>
        </div>
      </div>
      
      <style jsx>{`
        .pgg-methodology {
          background-color: #f8f9fa;
          border-radius: 8px;
          padding: 20px;
          margin-top: 24px;
          margin-bottom: 24px;
        }
        
        .pgg-methodology h3 {
          font-size: 18px;
          color: #1a1a1a;
          margin-top: 0;
          margin-bottom: 12px;
        }
        
        .pgg-methodology p {
          font-size: 14px;
          line-height: 1.6;
          color: #666666;
          margin-bottom: 12px;
        }
        
        .pgg-top-performers {
          margin-top: 32px;
        }
        
        .pgg-top-performers h3 {
          font-size: 18px;
          color: #1a1a1a;
          margin-bottom: 16px;
        }
        
        .pgg-position-leaders {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
          gap: 20px;
        }
        
        .pgg-position-group {
          background-color: #ffffff;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
          padding: 16px;
        }
        
        .pgg-position-group h4 {
          font-size: 16px;
          color: #1a1a1a;
          margin-top: 0;
          margin-bottom: 12px;
          padding-bottom: 8px;
          border-bottom: 1px solid #e5e5e5;
        }
        
        .pgg-leader-card {
          display: flex;
          align-items: center;
          padding: 8px 0;
          border-bottom: 1px solid #f0f0f0;
        }
        
        .pgg-leader-card:last-child {
          border-bottom: none;
        }
        
        .pgg-leader-name {
          font-weight: 600;
          font-size: 14px;
          color: #1a1a1a;
          flex: 1;
        }
        
        .pgg-leader-team {
          font-size: 12px;
          color: #666666;
          margin-right: 8px;
        }
        
        .pgg-leader-position {
          font-size: 12px;
          background-color: #00264c;
          color: white;
          padding: 2px 6px;
          border-radius: 4px;
          margin-right: 8px;
        }
        
        .pgg-leader-grade {
          font-size: 16px;
          font-weight: 700;
          width: 40px;
          text-align: center;
        }
        
        .pgg-no-data {
          font-size: 13px;
          color: #999999;
          font-style: italic;
          padding: 8px 0;
        }
        
        .pgg-subtitle {
          font-size: 14px;
          color: #666666;
        }
        
        @media (max-width: 768px) {
          .pgg-position-leaders {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default PlayerGameGrade;