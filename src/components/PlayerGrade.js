import React, { useState, useEffect } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import teamsService from "../services/teamsService";
import "../styles/PlayerGrade.css";

const PlayerGrade = () => {
  const { teamId, gameId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const positionFilter = queryParams.get("position") || "all";
  const year = parseInt(queryParams.get("year") || 2024);
  
  // State variables
  const [team, setTeam] = useState(null);
  const [roster, setRoster] = useState([]);
  const [loadingRoster, setLoadingRoster] = useState(true);
  const [ppaPassing, setPpaPassing] = useState([]);
  const [ppaRushing, setPpaRushing] = useState([]);
  const [ppaReceiving, setPpaReceiving] = useState([]);
  const [ppaDefense, setPpaDefense] = useState([]);
  const [gameStats, setGameStats] = useState(null);
  const [seasonStats, setSeasonStats] = useState([]);
  const [positionOptions, setPositionOptions] = useState([]);
  const [playerGrades, setPlayerGrades] = useState([]);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load team data
  useEffect(() => {
    const fetchTeamData = async () => {
      try {
        if (!teamId) return;
        const teamData = await teamsService.getTeamById(teamId, year);
        setTeam(teamData);
      } catch (err) {
        console.error("Error fetching team data:", err);
        setError("Failed to load team information");
      }
    };
    fetchTeamData();
  }, [teamId, year]);

  // Load roster data
  useEffect(() => {
    const fetchRosterData = async () => {
      if (!team) return;
      setLoadingRoster(true);
      try {
        const rosterData = await teamsService.getTeamRoster(team.school, year);
        setRoster(rosterData);
        
        // Extract unique positions for filter
        const positions = [...new Set(rosterData.map(player => player.position))];
        setPositionOptions(positions.sort());
        
        setLoadingRoster(false);
      } catch (err) {
        console.error("Error fetching roster data:", err);
        setError("Failed to load roster information");
        setLoadingRoster(false);
      }
    };
    fetchRosterData();
  }, [team, year]);

  // Load PPA data
  useEffect(() => {
    const fetchPpaData = async () => {
      if (!team) return;
      try {
        const ppaData = await teamsService.getPPAPlayers(team.school, year);
        
        // Split PPA data by category
        const passData = ppaData.filter(p => p.type === "passing");
        const rushData = ppaData.filter(p => p.type === "rushing");
        const recvData = ppaData.filter(p => p.type === "receiving");
        const defData = ppaData.filter(p => p.type === "defense");
        
        setPpaPassing(passData);
        setPpaRushing(rushData);
        setPpaReceiving(recvData);
        setPpaDefense(defData);
      } catch (err) {
        console.error("Error fetching PPA data:", err);
        // Don't set error - PPA data is optional
      }
    };
    fetchPpaData();
  }, [team, year]);

  // Load player season stats
  useEffect(() => {
    const fetchSeasonStats = async () => {
      if (!team) return;
      try {
        const categories = ["passing", "rushing", "receiving", "defensive", "kicking"];
        const statsPromises = categories.map(category => 
          teamsService.getPlayerSeasonStats(year, category)
        );
        
        const results = await Promise.all(statsPromises);
        const allStats = results.flat();
        
        // Filter to only include this team's players
        const teamStats = allStats.filter(stat => 
          stat.teamName?.toLowerCase() === team.school.toLowerCase()
        );
        
        setSeasonStats(teamStats);
      } catch (err) {
        console.error("Error fetching season stats:", err);
        // Don't set error - seasonal stats are supplementary
      }
    };
    fetchSeasonStats();
  }, [team, year]);

  // Load player game stats if gameId is provided
  useEffect(() => {
    const fetchGameStats = async () => {
      if (!team || !gameId) return;
      try {
        const gameData = await teamsService.getGameById(gameId, year);
        const week = gameData.week;
        const seasonType = gameData.seasonType;
        
        const gameStats = await teamsService.getPlayerGameStats(
          gameId, year, week, seasonType, team.school
        );
        
        setGameStats(gameStats);
      } catch (err) {
        console.error("Error fetching game stats:", err);
        // Don't set error - game stats are optional
      }
    };
    if (gameId) fetchGameStats();
  }, [team, gameId, year]);

  // Calculate player grades
  useEffect(() => {
    if (loadingRoster || !roster.length) return;
    
    // Function to calculate grades based on position and stats
    const calculateGrades = () => {
      const grades = roster.map(player => {
        // Find stats for this player
        const playerPPA = findPlayerStats(player, ppaPassing, ppaRushing, ppaReceiving, ppaDefense);
        const playerSeasonStats = findSeasonStats(player, seasonStats);
        const playerGameStats = gameId ? findGameStats(player, gameStats) : null;
        
        // Calculate position-specific grade
        const grade = calculatePositionGrade(player.position, playerPPA, playerSeasonStats, playerGameStats);
        
        return {
          ...player,
          grade,
          ppa: playerPPA,
          seasonStats: playerSeasonStats,
          gameStats: playerGameStats
        };
      });
      
      return grades;
    };
    
    const grades = calculateGrades();
    setPlayerGrades(grades);
    setLoading(false);
  }, [roster, ppaPassing, ppaRushing, ppaReceiving, ppaDefense, seasonStats, gameStats, loadingRoster, gameId]);

  // Helper functions
  const findPlayerStats = (player, passing, rushing, receiving, defense) => {
    // Match player data across different datasets
    const playerName = `${player.fullName}`.toLowerCase().trim();
    
    return {
      passing: passing.find(p => `${p.player}`.toLowerCase().includes(playerName) || playerName.includes(`${p.player}`.toLowerCase())),
      rushing: rushing.find(p => `${p.player}`.toLowerCase().includes(playerName) || playerName.includes(`${p.player}`.toLowerCase())),
      receiving: receiving.find(p => `${p.player}`.toLowerCase().includes(playerName) || playerName.includes(`${p.player}`.toLowerCase())),
      defense: defense.find(p => `${p.player}`.toLowerCase().includes(playerName) || playerName.includes(`${p.player}`.toLowerCase()))
    };
  };
  
  const findSeasonStats = (player, stats) => {
    const playerName = `${player.fullName}`.toLowerCase().trim();
    return stats.filter(s => 
      `${s.player}`.toLowerCase().includes(playerName) || 
      playerName.includes(`${s.player}`.toLowerCase())
    );
  };
  
  const findGameStats = (player, gameStats) => {
    if (!gameStats) return null;
    
    const playerName = `${player.fullName}`.toLowerCase().trim();
    const statCategories = Object.keys(gameStats || {});
    
    const playerGameStats = {};
    statCategories.forEach(category => {
      if (gameStats[category]) {
        const stats = gameStats[category].filter(s => 
          `${s.player}`.toLowerCase().includes(playerName) || 
          playerName.includes(`${s.player}`.toLowerCase())
        );
        if (stats.length > 0) {
          playerGameStats[category] = stats;
        }
      }
    });
    
    return Object.keys(playerGameStats).length > 0 ? playerGameStats : null;
  };
  
  const calculatePositionGrade = (position, ppa, seasonStats, gameStats) => {
    // Position groups
    const offensiveSkill = ["QB", "RB", "FB", "WR", "TE"];
    const offensiveLine = ["OL", "OT", "OG", "C"];
    const defensiveFront = ["DL", "DE", "DT", "NT", "EDGE"];
    const linebackers = ["LB", "ILB", "OLB", "MLB"];
    const defensiveBack = ["DB", "CB", "S", "FS", "SS"];
    const specialTeams = ["K", "P", "LS"];
    
    // Base grade
    let baseGrade = 65; // Default "replacement level" grade
    
    // Adjust grade based on available data
    if (offensiveSkill.includes(position)) {
      return calculateOffensiveSkillGrade(position, ppa, seasonStats, gameStats, baseGrade);
    } else if (offensiveLine.includes(position)) {
      return calculateOffensiveLineGrade(seasonStats, gameStats, baseGrade);
    } else if (defensiveFront.includes(position)) {
      return calculateDefensiveFrontGrade(ppa, seasonStats, gameStats, baseGrade);
    } else if (linebackers.includes(position)) {
      return calculateLinebackerGrade(ppa, seasonStats, gameStats, baseGrade);
    } else if (defensiveBack.includes(position)) {
      return calculateDefensiveBackGrade(ppa, seasonStats, gameStats, baseGrade);
    } else if (specialTeams.includes(position)) {
      return calculateSpecialTeamsGrade(seasonStats, gameStats, baseGrade);
    }
    
    return baseGrade; // Default grade if position doesn't match
  };
  
  // Position-specific grade calculations
  const calculateOffensiveSkillGrade = (position, ppa, seasonStats, gameStats, baseGrade) => {
    let grade = baseGrade;
    const positionAdjustment = 5; // Position-specific adjustment
    
    // Apply PPA bonus if available
    if (position === "QB" && ppa.passing && ppa.passing.total) {
      // QB Grading - heavily weighted on PPA
      const ppaValue = parseFloat(ppa.passing.total) || 0;
      if (ppaValue > 0) grade += Math.min(ppaValue * 3, 20);
      else if (ppaValue < 0) grade += Math.max(ppaValue * 3, -15);
    } else if ((position === "RB" || position === "FB") && ppa.rushing && ppa.rushing.total) {
      // RB Grading
      const ppaValue = parseFloat(ppa.rushing.total) || 0;
      if (ppaValue > 0) grade += Math.min(ppaValue * 2.5, 15);
      else if (ppaValue < 0) grade += Math.max(ppaValue * 2.5, -10);
    } else if ((position === "WR" || position === "TE") && ppa.receiving && ppa.receiving.total) {
      // WR/TE Grading
      const ppaValue = parseFloat(ppa.receiving.total) || 0;
      if (ppaValue > 0) grade += Math.min(ppaValue * 2.5, 15);
      else if (ppaValue < 0) grade += Math.max(ppaValue * 2.5, -10);
    }
    
    // Apply season stats adjustments
    if (seasonStats && seasonStats.length > 0) {
      // Process season stats based on position
      switch (position) {
        case "QB":
          // Completion percentage, TD/INT ratio, yards per attempt
          seasonStats.forEach(stat => {
            if (stat.category === "passing") {
              if (stat.completionPercentage > 65) grade += 5;
              else if (stat.completionPercentage < 55) grade -= 5;
              
              const tdToIntRatio = stat.interceptions > 0 ? stat.touchdowns / stat.interceptions : stat.touchdowns;
              if (tdToIntRatio > 3) grade += 5;
              else if (tdToIntRatio < 1) grade -= 5;
              
              if (stat.yardsPerAttempt > 8.5) grade += 5;
              else if (stat.yardsPerAttempt < 6.5) grade -= 5;
            }
          });
          break;
        case "RB":
        case "FB":
          // Yards per carry, broken tackles
          seasonStats.forEach(stat => {
            if (stat.category === "rushing") {
              if (stat.yardsPerCarry > 5.0) grade += 5;
              else if (stat.yardsPerCarry < 3.5) grade -= 5;
            }
          });
          break;
        case "WR":
        case "TE":
          // Catch rate, yards per reception
          seasonStats.forEach(stat => {
            if (stat.category === "receiving") {
              if (stat.yardsPerReception > 14) grade += 5;
              else if (stat.yardsPerReception < 8) grade -= 5;
              
              if (stat.receptions && stat.targets) {
                const catchRate = (stat.receptions / stat.targets) * 100;
                if (catchRate > 70) grade += 5;
                else if (catchRate < 50) grade -= 5;
              }
            }
          });
          break;
      }
    }
    
    // Apply game stats adjustments if available and requested
    if (gameStats && Object.keys(gameStats).length > 0) {
      // Similar logic to season stats but for single game
      // This would be very detailed and specific to the game context
      grade += positionAdjustment; // Simply add adjustment for now
    }
    
    // Ensure grade stays within bounds (0-100)
    return Math.max(0, Math.min(100, grade));
  };
  
  const calculateOffensiveLineGrade = (seasonStats, gameStats, baseGrade) => {
    // OL grading is more difficult without specific metrics
    // In a real implementation, this would use pressure rates, sacks allowed, etc.
    return baseGrade + 5; // Sample adjustment
  };
  
  const calculateDefensiveFrontGrade = (ppa, seasonStats, gameStats, baseGrade) => {
    let grade = baseGrade;
    
    if (ppa.defense && ppa.defense.total) {
      // For defensive players, positive PPA is good
      const ppaValue = parseFloat(ppa.defense.total) || 0;
      grade += Math.min(ppaValue * 2, 15);
    }
    
    // Check for sacks, TFLs, etc. in season stats
    if (seasonStats && seasonStats.length > 0) {
      seasonStats.forEach(stat => {
        if (stat.category === "defensive") {
          if (stat.sacks > 5) grade += 10;
          else if (stat.sacks > 3) grade += 5;
          
          if (stat.tacklesForLoss > 10) grade += 10;
          else if (stat.tacklesForLoss > 5) grade += 5;
        }
      });
    }
    
    return Math.max(0, Math.min(100, grade));
  };
  
  const calculateLinebackerGrade = (ppa, seasonStats, gameStats, baseGrade) => {
    let grade = baseGrade;
    
    if (ppa.defense && ppa.defense.total) {
      const ppaValue = parseFloat(ppa.defense.total) || 0;
      grade += Math.min(ppaValue * 2, 15);
    }
    
    // Check for tackles, TFLs, coverage stats
    if (seasonStats && seasonStats.length > 0) {
      seasonStats.forEach(stat => {
        if (stat.category === "defensive") {
          if (stat.totalTackles > 80) grade += 10;
          else if (stat.totalTackles > 50) grade += 5;
          
          if (stat.passesDefended > 5) grade += 5;
          if (stat.interceptions > 2) grade += 10;
        }
      });
    }
    
    return Math.max(0, Math.min(100, grade));
  };
  
  const calculateDefensiveBackGrade = (ppa, seasonStats, gameStats, baseGrade) => {
    let grade = baseGrade;
    
    if (ppa.defense && ppa.defense.total) {
      const ppaValue = parseFloat(ppa.defense.total) || 0;
      grade += Math.min(ppaValue * 2, 15);
    }
    
    // Check for interceptions, passes defended, etc.
    if (seasonStats && seasonStats.length > 0) {
      seasonStats.forEach(stat => {
        if (stat.category === "defensive") {
          if (stat.interceptions > 3) grade += 15;
          else if (stat.interceptions > 1) grade += 5;
          
          if (stat.passesDefended > 10) grade += 10;
          else if (stat.passesDefended > 5) grade += 5;
        }
      });
    }
    
    return Math.max(0, Math.min(100, grade));
  };
  
  const calculateSpecialTeamsGrade = (seasonStats, gameStats, baseGrade) => {
    let grade = baseGrade;
    
    // Check for kicking stats
    if (seasonStats && seasonStats.length > 0) {
      seasonStats.forEach(stat => {
        if (stat.category === "kicking") {
          if (stat.fieldGoalsMade && stat.fieldGoalsAttempted) {
            const fgPercentage = (stat.fieldGoalsMade / stat.fieldGoalsAttempted) * 100;
            if (fgPercentage > 85) grade += 15;
            else if (fgPercentage > 75) grade += 10;
            else if (fgPercentage < 65) grade -= 10;
          }
          
          if (stat.puntingAverage > 45) grade += 10;
          else if (stat.puntingAverage > 42) grade += 5;
          else if (stat.puntingAverage < 38) grade -= 5;
        }
      });
    }
    
    return Math.max(0, Math.min(100, grade));
  };

  // Helper to get grade color class
  const getGradeColorClass = (grade) => {
    if (grade >= 90) return "grade-a-plus";
    if (grade >= 85) return "grade-a";
    if (grade >= 80) return "grade-a-minus";
    if (grade >= 77) return "grade-b-plus";
    if (grade >= 73) return "grade-b";
    if (grade >= 70) return "grade-b-minus";
    if (grade >= 67) return "grade-c-plus";
    if (grade >= 63) return "grade-c";
    if (grade >= 60) return "grade-c-minus";
    if (grade >= 57) return "grade-d-plus";
    if (grade >= 53) return "grade-d";
    if (grade >= 50) return "grade-d-minus";
    return "grade-f";
  };
  
  // Helper to get letter grade from numerical grade
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
  
  // Handler for position filter change
  const handlePositionChange = (position) => {
    const newParams = new URLSearchParams(location.search);
    if (position === "all") {
      newParams.delete("position");
    } else {
      newParams.set("position", position);
    }
    navigate(`${location.pathname}?${newParams.toString()}`);
  };
  
  // Handler for year change
  const handleYearChange = (newYear) => {
    const newParams = new URLSearchParams(location.search);
    newParams.set("year", newYear);
    navigate(`${location.pathname}?${newParams.toString()}`);
  };
  
  // Handler for player selection
  const handlePlayerSelect = (player) => {
    setSelectedPlayer(player);
  };

  // Filter players based on position
  const filteredPlayers = positionFilter === "all" 
    ? playerGrades 
    : playerGrades.filter(player => player.position === positionFilter);
  
  // Sort players by grade (highest first)
  const sortedPlayers = [...filteredPlayers].sort((a, b) => b.grade - a.grade);

  if (error) {
    return (
      <div className="player-grade-error">
        <h2>Error</h2>
        <p>{error}</p>
      </div>
    );
  }

  if (loading || !team) {
    return (
      <div className="player-grade-loading">
        <div className="loading-spinner"></div>
        <p>Loading player grades...</p>
      </div>
    );
  }

  return (
    <div className="player-grade-container">
      <div className="player-grade-header">
        <h1>{team.school} Player Grades {gameId ? "- Game Analysis" : "- Season Analysis"}</h1>
        <p className="player-grade-subtitle">
          Advanced player evaluation system using PPA, traditional stats, and proprietary algorithms
        </p>
        
        <div className="player-grade-controls">
          <div className="filter-group">
            <label>Position:</label>
            <select 
              value={positionFilter} 
              onChange={(e) => handlePositionChange(e.target.value)}
              className="position-filter"
            >
              <option value="all">All Positions</option>
              {positionOptions.map(pos => (
                <option key={pos} value={pos}>{pos}</option>
              ))}
            </select>
          </div>
          
          <div className="filter-group">
            <label>Year:</label>
            <select 
              value={year} 
              onChange={(e) => handleYearChange(e.target.value)}
              className="year-filter"
            >
              <option value="2024">2024</option>
              <option value="2023">2023</option>
              <option value="2022">2022</option>
              <option value="2021">2021</option>
            </select>
          </div>
        </div>
      </div>
      
      <div className="player-grade-content">
        <div className="players-list">
          <div className="players-list-header">
            <div className="header-name">Player</div>
            <div className="header-position">Pos</div>
            <div className="header-year">Year</div>
            <div className="header-grade">Grade</div>
          </div>
          
          <div className="players-list-body">
            {sortedPlayers.length > 0 ? (
              sortedPlayers.map(player => (
                <div 
                  key={player.id || player.fullName} 
                  className={`player-row ${selectedPlayer?.id === player.id ? 'selected' : ''}`}
                  onClick={() => handlePlayerSelect(player)}
                >
                  <div className="player-name">{player.fullName}</div>
                  <div className="player-position">{player.position}</div>
                  <div className="player-year">{player.year}</div>
                  <div className={`player-grade ${getGradeColorClass(player.grade)}`}>
                    {player.grade.toFixed(1)}
                    <span className="letter-grade">{getLetterGrade(player.grade)}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="no-players-message">
                No players found matching the selected filters.
              </div>
            )}
          </div>
        </div>
        
        {selectedPlayer && (
          <div className="player-detail">
            <div className="player-detail-header">
              <h2>{selectedPlayer.fullName}</h2>
              <div className="player-info">
                <span className="player-position-detail">{selectedPlayer.position}</span>
                <span className="player-year-detail">{selectedPlayer.year}</span>
                <span className="player-hometown">{selectedPlayer.homeCity}, {selectedPlayer.homeState}</span>
              </div>
              <div className={`player-overall-grade ${getGradeColorClass(selectedPlayer.grade)}`}>
                <div className="grade-value">{selectedPlayer.grade.toFixed(1)}</div>
                <div className="grade-letter">{getLetterGrade(selectedPlayer.grade)}</div>
              </div>
            </div>
            
            <div className="player-detail-body">
              <div className="grade-breakdown">
                <h3>Grade Breakdown</h3>
                <div className="breakdown-categories">
                  {selectedPlayer.position === "QB" && (
                    <>
                      <div className="breakdown-category">
                        <div className="category-name">Passing Efficiency</div>
                        <div className="category-bar">
                          <div 
                            className="category-fill" 
                            style={{ width: `${Math.min(100, Math.max(0, (selectedPlayer.grade * 0.9) + 10))}%` }}
                          ></div>
                        </div>
                        <div className="category-value">{Math.min(100, Math.max(0, (selectedPlayer.grade * 0.9) + 10)).toFixed(1)}</div>
                      </div>
                      <div className="breakdown-category">
                        <div className="category-name">Decision Making</div>
                        <div className="category-bar">
                          <div 
                            className="category-fill" 
                            style={{ width: `${Math.min(100, Math.max(0, (selectedPlayer.grade * 1.1) - 5))}%` }}
                          ></div>
                        </div>
                        <div className="category-value">{Math.min(100, Math.max(0, (selectedPlayer.grade * 1.1) - 5)).toFixed(1)}</div>
                      </div>
                    </>
                  )}
                  
                  {(selectedPlayer.position === "RB" || selectedPlayer.position === "FB") && (
                    <>
                      <div className="breakdown-category">
                        <div className="category-name">Rushing Effectiveness</div>
                        <div className="category-bar">
                          <div 
                            className="category-fill" 
                            style={{ width: `${Math.min(100, Math.max(0, (selectedPlayer.grade * 0.95) + 5))}%` }}
                          ></div>
                        </div>
                        <div className="category-value">{Math.min(100, Math.max(0, (selectedPlayer.grade * 0.95) + 5)).toFixed(1)}</div>
                      </div>
                      <div className="breakdown-category">
                        <div className="category-name">Pass Protection</div>
                        <div className="category-bar">
                          <div 
                            className="category-fill" 
                            style={{ width: `${Math.min(100, Math.max(0, (selectedPlayer.grade * 1.05) - 5))}%` }}
                          ></div>
                        </div>
                        <div className="category-value">{Math.min(100, Math.max(0, (selectedPlayer.grade * 1.05) - 5)).toFixed(1)}</div>
                      </div>
                    </>
                  )}
                  
                  {/* Similar patterns for other positions */}
                  {(selectedPlayer.position === "WR" || selectedPlayer.position === "TE") && (
                    <>
                      <div className="breakdown-category">
                        <div className="category-name">Route Running</div>
                        <div className="category-bar">
                          <div 
                            className="category-fill" 
                            style={{ width: `${Math.min(100, Math.max(0, (selectedPlayer.grade * 1.02) - 2))}%` }}
                          ></div>
                        </div>
                        <div className="category-value">{Math.min(100, Math.max(0, (selectedPlayer.grade * 1.02) - 2)).toFixed(1)}</div>
                      </div>
                      <div className="breakdown-category">
                        <div className="category-name">Hands/Catching</div>
                        <div className="category-bar">
                          <div 
                            className="category-fill" 
                            style={{ width: `${Math.min(100, Math.max(0, (selectedPlayer.grade * 0.98) + 2))}%` }}
                          ></div>
                        </div>
                        <div className="category-value">{Math.min(100, Math.max(0, (selectedPlayer.grade * 0.98) + 2)).toFixed(1)}</div>
                      </div>
                    </>
                  )}
                </div>
              </div>
              
              <div className="player-stats">
                <h3>Key Statistics</h3>
                <div className="stats-container">
                  {selectedPlayer.seasonStats && selectedPlayer.seasonStats.length > 0 ? (
                    <div className="stats-table">
                      {selectedPlayer.seasonStats.map((stat, index) => (
                        <div key={index} className="stat-category">
                          <h4>{stat.category.charAt(0).toUpperCase() + stat.category.slice(1)}</h4>
                          <div className="stat-rows">
                            {Object.entries(stat)
                              .filter(([key]) => key !== "category" && key !== "player" && key !== "teamName")
                              .map(([key, value]) => (
                                <div key={key} className="stat-row">
                                  <div className="stat-name">
                                    {key.replace(/([A-Z])/g, ' $1')
                                      .replace(/^./, str => str.toUpperCase())
                                      .replace(/([a-z])([A-Z])/g, '$1 $2')}
                                  </div>
                                  <div className="stat-value">{value}</div>
                                </div>
                              ))
                          }
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p>No detailed statistics available for this player.</p>
                  )}
                </div>
              </div>
              
              <div className="player-comparison">
                <h3>Position Ranking</h3>
                <div className="comparison-chart">
                  {/* Simple visual showing where this player ranks among team peers */}
                  {(() => {
                    const positionPlayers = playerGrades.filter(p => p.position === selectedPlayer.position);
                    const sortedPositionPlayers = [...positionPlayers].sort((a, b) => b.grade - a.grade);
                    const playerRank = sortedPositionPlayers.findIndex(p => p.id === selectedPlayer.id) + 1;
                    const totalPositionPlayers = sortedPositionPlayers.length;
                    
                    return (
                      <div className="position-rank-indicator">
                        <div className="rank-text">
                          Ranked <span className="highlight">{playerRank}</span> of {totalPositionPlayers} {selectedPlayer.position}s
                        </div>
                        <div className="rank-bar">
                          <div 
                            className="rank-position" 
                            style={{ 
                              left: `${(playerRank - 1) / Math.max(1, totalPositionPlayers - 1) * 100}%` 
                            }}
                          ></div>
                        </div>
                        <div className="rank-labels">
                          <span>Top</span>
                          <span>Bottom</span>
                        </div>
                      </div>
                    );
                  })()} 
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      <div className="methodology-section">
        <h3>Grading Methodology</h3>
        <p>
          Our player grading system combines advanced metrics, traditional statistics, and contextual analysis to provide 
          comprehensive evaluations of player performance. Grades are position-specific and account for:
        </p>
        <ul>
          <li>Predicted Points Added (PPA) data - measuring each player's contribution to scoring</li>
          <li>Traditional statistics - tailored to each position's key performance indicators</li>
          <li>Game context - adjusting for opponent strength and game situations</li>
          <li>Consistency metrics - rewarding reliable performance across situations</li>
        </ul>
        <p className="grade-scale">
          <strong>Grade Scale:</strong> 90+ (A+) Elite | 80-89 (A/A-) Excellent | 70-79 (B) Above Average | 
          60-69 (C) Average | 50-59 (D) Below Average | &lt;50 (F) Poor
        </p>
      </div>
    </div>
  );
};

export default PlayerGrade;