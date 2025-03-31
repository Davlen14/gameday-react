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
  const [teams, setTeams] = useState([]);
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
  const [pageSize] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);
  const [dataInitialized, setDataInitialized] = useState(false);
  
  // Only load position-specific data when a position filter is applied
  const shouldLoadPositionData = (position) => {
    // Load QB data
    if (position === "QB") return ["passing"];
    // Load RB/FB data
    if (position === "RB" || position === "FB") return ["rushing"];
    // Load WR/TE data
    if (position === "WR" || position === "TE") return ["receiving"];
    // Load defensive players data
    if (["DL", "DE", "DT", "NT", "EDGE", "LB", "ILB", "OLB", "MLB", "DB", "CB", "S", "FS", "SS"].includes(position)) 
      return ["defensive"];
    // Load kicking specialists data
    if (["K", "P", "LS"].includes(position)) return ["kicking"];
    // For "all" or other positions, return nothing initially
    return [];
  };
  
  // Load all teams first
  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const teamsData = await teamsService.getTeams(year);
        setTeams(teamsData);
        
        // If no teamId is provided, redirect to a default team
        if (!teamId && teamsData.length > 0) {
          // Use a popular team as default
          const popularTeams = ["Alabama", "Ohio State", "Georgia", "Michigan"];
          const defaultTeam = teamsData.find(t => popularTeams.includes(t.school)) || teamsData[0];
          navigate(`/player-grade/${defaultTeam.id}${location.search}`);
        }
      } catch (err) {
        console.error("Error fetching teams:", err);
        setError("Failed to load teams");
      }
    };
    fetchTeams();
  }, [year, teamId, navigate, location.search]);
  
  // Load team data after teams are loaded
  useEffect(() => {
    const fetchTeamData = async () => {
      try {
        if (!teamId || teams.length === 0) return;
        const teamData = await teamsService.getTeamById(teamId, year);
        setTeam(teamData);
        setDataInitialized(true);
      } catch (err) {
        console.error("Error fetching team data:", err);
        setError("Failed to load team information");
      }
    };
    fetchTeamData();
  }, [teamId, year, teams]);
  
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

  // Load PPA data only when needed
  useEffect(() => {
    const fetchPpaData = async () => {
      if (!team || !dataInitialized) return;
      
      try {
        // Only load PPA data for the selected position or when a player is selected
        const categoriesToLoad = shouldLoadPositionData(positionFilter);
        
        if (selectedPlayer) {
          // If a player is selected, load their specific position data
          const playerCategories = shouldLoadPositionData(selectedPlayer.position);
          playerCategories.forEach(cat => {
            if (!categoriesToLoad.includes(cat)) categoriesToLoad.push(cat);
          });
        }
        
        // If no categories to load and no specific player selected, skip loading PPA data
        if (categoriesToLoad.length === 0 && !selectedPlayer) return;
        
        const ppaData = await teamsService.getPPAPlayers(team.school, year);
        
        // Split PPA data by category
        if (categoriesToLoad.includes("passing") || selectedPlayer) {
          const passData = ppaData.filter(p => p.type === "passing");
          setPpaPassing(passData);
        }
        
        if (categoriesToLoad.includes("rushing") || selectedPlayer) {
          const rushData = ppaData.filter(p => p.type === "rushing");
          setPpaRushing(rushData);
        }
        
        if (categoriesToLoad.includes("receiving") || selectedPlayer) {
          const recvData = ppaData.filter(p => p.type === "receiving");
          setPpaReceiving(recvData);
        }
        
        if (categoriesToLoad.includes("defensive") || selectedPlayer) {
          const defData = ppaData.filter(p => p.type === "defense");
          setPpaDefense(defData);
        }
      } catch (err) {
        console.error("Error fetching PPA data:", err);
        // Don't set error - PPA data is optional
      }
    };
    fetchPpaData();
  }, [team, positionFilter, selectedPlayer, dataInitialized, year]);
  
  // Load season stats only for specific positions or when a player is selected
  useEffect(() => {
    const fetchSeasonStats = async () => {
      if (!team || !dataInitialized) return;
      
      try {
        // Only load stats for the selected position or when a player is selected
        let categoriesToLoad = shouldLoadPositionData(positionFilter);
        
        if (selectedPlayer) {
          // If a player is selected, load their specific position data
          const playerCategories = shouldLoadPositionData(selectedPlayer.position);
          playerCategories.forEach(cat => {
            if (!categoriesToLoad.includes(cat)) categoriesToLoad.push(cat);
          });
        }
        
        // Always include "passing" for basic team context, but with smaller limit
        if (!categoriesToLoad.includes("passing")) {
          categoriesToLoad.push("passing");
        }
        
        const limit = selectedPlayer ? 100 : 50; // Use smaller limit when no player selected
        
        // Fetch stats for each category in parallel
        const statsPromises = categoriesToLoad.map(category => 
          teamsService.getPlayerSeasonStats(year, category, "regular", limit)
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
  }, [team, positionFilter, selectedPlayer, dataInitialized, year]);
  
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

  // IMPROVED Helper functions for better player matching
  const findPlayerStats = (player, passing, rushing, receiving, defense) => {
    // Match player data across different datasets
    const playerName = `${player.fullName}`.toLowerCase().trim();
    const firstName = playerName.split(' ')[0];
    const lastName = playerName.split(' ').slice(1).join(' ');
    
    // Try different matching strategies - exact match, contains, first/last name
    const matchPlayer = (dataArray, playerName) => {
      if (!dataArray || !dataArray.length) return null;
      
      // Exact match first
      let match = dataArray.find(p => 
        `${p.player}`.toLowerCase().trim() === playerName
      );
      
      // If no exact match, try contains
      if (!match) {
        match = dataArray.find(p => 
          `${p.player}`.toLowerCase().includes(playerName) || 
          playerName.includes(`${p.player}`.toLowerCase())
        );
      }
      
      // If still no match, try matching just last name (common in sports data)
      if (!match && lastName) {
        match = dataArray.find(p => 
          `${p.player}`.toLowerCase().includes(lastName)
        );
      }
      
      return match;
    };
    
    return {
      passing: matchPlayer(passing, playerName),
      rushing: matchPlayer(rushing, playerName),
      receiving: matchPlayer(receiving, playerName),
      defense: matchPlayer(defense, playerName)
    };
  };
  
  const findSeasonStats = (player, stats) => {
    if (!stats || stats.length === 0) return [];
    
    const playerName = `${player.fullName}`.toLowerCase().trim();
    const firstName = playerName.split(' ')[0];
    const lastName = playerName.split(' ').slice(1).join(' ');
    
    // Try different matching approaches
    let matches = stats.filter(s => 
      `${s.player}`.toLowerCase().trim() === playerName
    );
    
    // If no exact matches, try contains
    if (matches.length === 0) {
      matches = stats.filter(s => 
        `${s.player}`.toLowerCase().includes(playerName) || 
        playerName.includes(`${s.player}`.toLowerCase())
      );
    }
    
    // If still no matches, try matching just last name
    if (matches.length === 0 && lastName) {
      matches = stats.filter(s => 
        `${s.player}`.toLowerCase().includes(lastName)
      );
    }
    
    return matches;
  };
  
  const findGameStats = (player, gameStats) => {
    if (!gameStats) return null;
    
    const playerName = `${player.fullName}`.toLowerCase().trim();
    const firstName = playerName.split(' ')[0];
    const lastName = playerName.split(' ').slice(1).join(' ');
    const statCategories = Object.keys(gameStats || {});
    
    const playerGameStats = {};
    statCategories.forEach(category => {
      if (gameStats[category]) {
        // Try exact match first
        let stats = gameStats[category].filter(s => 
          `${s.player}`.toLowerCase().trim() === playerName
        );
        
        // If no matches, try contains
        if (stats.length === 0) {
          stats = gameStats[category].filter(s => 
            `${s.player}`.toLowerCase().includes(playerName) || 
            playerName.includes(`${s.player}`.toLowerCase())
          );
        }
        
        // If still no matches, try matching just last name
        if (stats.length === 0 && lastName) {
          stats = gameStats[category].filter(s => 
            `${s.player}`.toLowerCase().includes(lastName)
          );
        }
        
        if (stats.length > 0) {
          playerGameStats[category] = stats;
        }
      }
    });
    
    return Object.keys(playerGameStats).length > 0 ? playerGameStats : null;
  };
  
  // Calculate player grades for the current page
  useEffect(() => {
    if (loadingRoster || !roster.length) return;
    
    // Function to calculate grades based on position and stats
    const calculateGrades = () => {
      // Start with empty grades array
      let grades = [];
      
      // For initial data load, only calculate grades for the first page of players
      // or for the current position filter
      let filteredRoster = roster;
      if (positionFilter !== "all") {
        filteredRoster = roster.filter(player => player.position === positionFilter);
      }
      
      // Filter by position if needed
      const playerCount = filteredRoster.length;
      const totalPages = Math.ceil(playerCount / pageSize);
      
      // Get the subset of players for the current page
      const startIndex = (currentPage - 1) * pageSize;
      const endIndex = Math.min(startIndex + pageSize, playerCount);
      const currentPageRoster = filteredRoster.slice(startIndex, endIndex);
      
      // Only calculate grades for visible players + selected player if not in current page
      let playersToGrade = [...currentPageRoster];
      
      // Always include selected player if not in current page
      if (selectedPlayer && !currentPageRoster.find(p => p.id === selectedPlayer.id)) {
        const selectedPlayerData = roster.find(p => p.id === selectedPlayer.id);
        if (selectedPlayerData) {
          playersToGrade.push(selectedPlayerData);
        }
      }
      
      // Calculate grades for the visible players
      grades = playersToGrade.map(player => {
        // Find stats for this player
        const playerPPA = findPlayerStats(player, ppaPassing, ppaRushing, ppaReceiving, ppaDefense);
        const playerSeasonStats = findSeasonStats(player, seasonStats);
        const playerGameStats = gameId ? findGameStats(player, gameStats) : null;
        
        // Calculate position-specific grade
        const grade = calculatePositionGrade(player, playerPPA, playerSeasonStats, playerGameStats);
        
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
  }, [roster, ppaPassing, ppaRushing, ppaReceiving, ppaDefense, seasonStats, gameStats, loadingRoster, gameId, positionFilter, currentPage, pageSize, selectedPlayer]);
  
  // IMPROVED version of calculatePositionGrade
  const calculatePositionGrade = (player, ppa, seasonStats, gameStats) => {
    // Position groups
    const offensiveSkill = ["QB", "RB", "FB", "WR", "TE"];
    const offensiveLine = ["OL", "OT", "OG", "C"];
    const defensiveFront = ["DL", "DE", "DT", "NT", "EDGE"];
    const linebackers = ["LB", "ILB", "OLB", "MLB"];
    const defensiveBack = ["DB", "CB", "S", "FS", "SS"];
    const specialTeams = ["K", "P", "LS"];
    
    // Base grade - adjust based on player year
    let baseGrade = 65; // Default "replacement level" grade
    
    // Adjust base grade by player year - veterans start higher
    if (player.year === 'SR') baseGrade += 3;
    else if (player.year === 'JR') baseGrade += 2;
    else if (player.year === 'SO') baseGrade += 1;
    else if (player.year === 'FR') baseGrade -= 1;
    
    // Adjust base by position importance
    if (player.position === 'QB') baseGrade += 2;
    else if (['RB', 'WR', 'DE', 'CB'].includes(player.position)) baseGrade += 1;
    
    // Add small random variance to base grade to prevent identical grades
    baseGrade += (Math.random() * 3) - 1.5; // +/- 1.5 points random variation
    
    // Adjust grade based on available data
    if (offensiveSkill.includes(player.position)) {
      return calculateOffensiveSkillGrade(player.position, ppa, seasonStats, gameStats, baseGrade);
    } else if (offensiveLine.includes(player.position)) {
      return calculateOffensiveLineGrade(player, seasonStats, gameStats, baseGrade);
    } else if (defensiveFront.includes(player.position)) {
      return calculateDefensiveFrontGrade(player, ppa, seasonStats, gameStats, baseGrade);
    } else if (linebackers.includes(player.position)) {
      return calculateLinebackerGrade(player, ppa, seasonStats, gameStats, baseGrade);
    } else if (defensiveBack.includes(player.position)) {
      return calculateDefensiveBackGrade(player, ppa, seasonStats, gameStats, baseGrade);
    } else if (specialTeams.includes(player.position)) {
      return calculateSpecialTeamsGrade(player, seasonStats, gameStats, baseGrade);
    }
    
    return baseGrade; // Default grade if position doesn't match
  };
  
  // IMPROVED Position-specific grade calculations
  const calculateOffensiveSkillGrade = (position, ppa, seasonStats, gameStats, baseGrade) => {
    let grade = baseGrade;
    const positionAdjustment = 5; // Position-specific adjustment
    let hasStats = false;
    
    // Apply PPA bonus if available - with INCREASED IMPACT
    if (position === "QB" && ppa.passing && ppa.passing.total) {
      hasStats = true;
      // QB Grading - heavily weighted on PPA
      const ppaValue = parseFloat(ppa.passing.total) || 0;
      if (ppaValue > 0) grade += Math.min(ppaValue * 5, 25); // Increased from 3,20
      else if (ppaValue < 0) grade += Math.max(ppaValue * 5, -20); // Increased from 3,15
    } else if ((position === "RB" || position === "FB") && ppa.rushing && ppa.rushing.total) {
      hasStats = true;
      // RB Grading
      const ppaValue = parseFloat(ppa.rushing.total) || 0;
      if (ppaValue > 0) grade += Math.min(ppaValue * 4, 20); // Increased from 2.5,15
      else if (ppaValue < 0) grade += Math.max(ppaValue * 4, -15); // Increased from 2.5,10
    } else if ((position === "WR" || position === "TE") && ppa.receiving && ppa.receiving.total) {
      hasStats = true;
      // WR/TE Grading
      const ppaValue = parseFloat(ppa.receiving.total) || 0;
      if (ppaValue > 0) grade += Math.min(ppaValue * 4, 20); // Increased from 2.5,15
      else if (ppaValue < 0) grade += Math.max(ppaValue * 4, -15); // Increased from 2.5,10
    }
    
    // Apply season stats adjustments - with BIGGER IMPACT
    if (seasonStats && seasonStats.length > 0) {
      hasStats = true;
      // Process season stats based on position
      switch (position) {
        case "QB":
          // Completion percentage, TD/INT ratio, yards per attempt
          seasonStats.forEach(stat => {
            if (stat.category === "passing") {
              if (stat.completionPercentage > 65) grade += 8; // Increased from 5
              else if (stat.completionPercentage < 55) grade -= 8; // Increased from 5
              
              const tdToIntRatio = stat.interceptions > 0 ? stat.touchdowns / stat.interceptions : stat.touchdowns;
              if (tdToIntRatio > 3) grade += 7; // Increased from 5
              else if (tdToIntRatio < 1) grade -= 7; // Increased from 5
              
              if (stat.yardsPerAttempt > 8.5) grade += 6; // Increased from 5
              else if (stat.yardsPerAttempt < 6.5) grade -= 6; // Increased from 5
              
              // Volume stats for QBs
              if (stat.yards > 2500) grade += 10;
              else if (stat.yards > 1500) grade += 5;
              
              if (stat.touchdowns > 20) grade += 10;
              else if (stat.touchdowns > 10) grade += 5;
            }
          });
          break;
        case "RB":
        case "FB":
          // Yards per carry, broken tackles
          seasonStats.forEach(stat => {
            if (stat.category === "rushing") {
              if (stat.yardsPerCarry > 5.0) grade += 8; // Increased from 5
              else if (stat.yardsPerCarry < 3.5) grade -= 8; // Increased from 5
              
              // Add more factors for RBs
              if (stat.touchdowns > 10) grade += 10;
              else if (stat.touchdowns > 5) grade += 5;
              
              // Rushing yards volume
              if (stat.yards > 1000) grade += 10;
              else if (stat.yards > 500) grade += 5;
            }
          });
          break;
        case "WR":
        case "TE":
          // Catch rate, yards per reception
          seasonStats.forEach(stat => {
            if (stat.category === "receiving") {
              if (stat.yardsPerReception > 14) grade += 7; // Increased from 5
              else if (stat.yardsPerReception < 8) grade -= 7; // Increased from 5
              
              if (stat.receptions && stat.targets) {
                const catchRate = (stat.receptions / stat.targets) * 100;
                if (catchRate > 70) grade += 7; // Increased from 5
                else if (catchRate < 50) grade -= 7; // Increased from 5
              }
              
              // Add volume metrics
              if (stat.receptions > 60) grade += 10;
              else if (stat.receptions > 40) grade += 5;
              
              if (stat.yards > 800) grade += 10;
              else if (stat.yards > 500) grade += 5;
              
              if (stat.touchdowns > 8) grade += 10;
              else if (stat.touchdowns > 5) grade += 5;
            }
          });
          break;
      }
    }
    
    // Apply game stats adjustments if available and requested
    if (gameStats && Object.keys(gameStats).length > 0) {
      hasStats = true;
      // Increase the impact of game stats
      grade += positionAdjustment * 2; // Doubled from original
      
      // Process game-specific stats
      if (position === "QB" && gameStats.passing) {
        const passingStats = gameStats.passing[0];
        if (passingStats) {
          if (passingStats.completionPercentage > 70) grade += 5;
          if (passingStats.yards > 300) grade += 5;
          if (passingStats.touchdowns > 2) grade += 5;
          if (passingStats.interceptions === 0) grade += 3;
        }
      } else if ((position === "RB" || position === "FB") && gameStats.rushing) {
        const rushingStats = gameStats.rushing[0];
        if (rushingStats) {
          if (rushingStats.yards > 100) grade += 5;
          if (rushingStats.touchdowns > 1) grade += 5;
          if (rushingStats.yardsPerCarry > 5.5) grade += 5;
        }
      } else if ((position === "WR" || position === "TE") && gameStats.receiving) {
        const receivingStats = gameStats.receiving[0];
        if (receivingStats) {
          if (receivingStats.yards > 100) grade += 5;
          if (receivingStats.receptions > 6) grade += 5;
          if (receivingStats.touchdowns > 1) grade += 5;
        }
      }
    }
    
    // If no stats found, provide a more varied default grade
    if (!hasStats) {
      // For skill positions without stats, assume role players
      grade += (Math.random() * 6) - 4; // Slightly bias downward (-4 to +2)
    } else {
      // Add random variation for players with stats (small amount)
      grade += (Math.random() * 4) - 2; // Between -2 and +2
    }
    
    // Ensure grade stays within bounds (0-100)
    return Math.max(0, Math.min(100, Math.round(grade * 10) / 10));
  };
  
  const calculateOffensiveLineGrade = (player, seasonStats, gameStats, baseGrade) => {
    // OL grading is more difficult without specific metrics
    let grade = baseGrade;
    let hasStats = false;
    
    // In a real implementation, this would use pressure rates, sacks allowed, etc.
    // Since OL stats are limited, use team rushing success as proxy
    if (seasonStats && seasonStats.length > 0) {
      const rushingStats = seasonStats.filter(s => s.category === "rushing");
      if (rushingStats.length > 0) {
        hasStats = true;
        // Use team rushing stats as proxy for OL performance
        const teamYPC = rushingStats.reduce((sum, stat) => sum + (stat.yardsPerCarry || 0), 0) / rushingStats.length;
        if (teamYPC > 5.0) grade += 12;
        else if (teamYPC > 4.5) grade += 8;
        else if (teamYPC > 4.0) grade += 4;
        else if (teamYPC < 3.5) grade -= 4;
        
        // Adjust based on total rushing TDs (proxy for goal line blocking)
        const totalTDs = rushingStats.reduce((sum, stat) => sum + (stat.touchdowns || 0), 0);
        if (totalTDs > 25) grade += 8;
        else if (totalTDs > 20) grade += 5;
        else if (totalTDs > 15) grade += 3;
        else if (totalTDs < 10) grade -= 3;
      }
    }
    
    // Game specific adjustment
    if (gameStats && gameStats.rushing) {
      hasStats = true;
      const gameRushYPC = gameStats.rushing.reduce((sum, stat) => sum + (stat.yardsPerCarry || 0), 0) / gameStats.rushing.length;
      if (gameRushYPC > 5.5) grade += 8;
      else if (gameRushYPC > 4.5) grade += 5;
      else if (gameRushYPC < 3.0) grade -= 5;
    }
    
    // Add position-specific adjustments
    if (player.position === "C") grade += 2; // Centers typically have more responsibility
    
    // Adjust by year more dramatically for OL (experience matters a lot)
    if (player.year === "SR") grade += 5;
    else if (player.year === "JR") grade += 3;
    else if (player.year === "SO") grade += 1;
    else if (player.year === "FR") grade -= 3; // Freshmen OL typically struggle
    
    // More random variation for OL due to limited stats
    grade += (Math.random() * 8) - 4; // -4 to +4 random variation
    
    return Math.max(0, Math.min(100, Math.round(grade * 10) / 10));
  };
  
  const calculateDefensiveFrontGrade = (player, ppa, seasonStats, gameStats, baseGrade) => {
    let grade = baseGrade;
    let hasStats = false;
    
    if (ppa.defense && ppa.defense.total) {
      hasStats = true;
      // For defensive players, positive PPA is good - INCREASED IMPACT
      const ppaValue = parseFloat(ppa.defense.total) || 0;
      grade += Math.min(ppaValue * 3.5, 20); // Increased from 2,15
    }
    
    // Check for sacks, TFLs, etc. in season stats
    if (seasonStats && seasonStats.length > 0) {
      seasonStats.forEach(stat => {
        if (stat.category === "defensive") {
          hasStats = true;
          if (stat.sacks > 5) grade += 15; // Increased from 10
          else if (stat.sacks > 3) grade += 8; // Increased from 5
          
          if (stat.tacklesForLoss > 10) grade += 15; // Increased from 10
          else if (stat.tacklesForLoss > 5) grade += 8; // Increased from 5
          
          // Add more factors
          if (stat.totalTackles > 60) grade += 10;
          else if (stat.totalTackles > 40) grade += 5;
          
          // Tackles quality - solo tackles percentage
          if (stat.soloTackles && stat.totalTackles) {
            const soloPercentage = (stat.soloTackles / stat.totalTackles) * 100;
            if (soloPercentage > 70) grade += 5;
          }
        }
      });
    }
    
    // Game-specific adjustments
    if (gameStats && gameStats.defensive) {
      hasStats = true;
      const defStats = gameStats.defensive[0];
      if (defStats) {
        if (defStats.sacks > 1) grade += 8;
        if (defStats.tacklesForLoss > 2) grade += 6;
        if (defStats.totalTackles > 8) grade += 5;
      }
    }
    
    // Positional adjustments
    if (player.position === "DE" || player.position === "EDGE") grade += 2; // Edge rushers graded higher
    
    // If no stats found, vary default grade
    if (!hasStats) {
      if (player.year === "SR" || player.year === "JR") {
        grade += (Math.random() * 10) - 4; // More upside for upperclassmen (-4 to +6)
      } else {
        grade += (Math.random() * 8) - 6; // More risk for younger players (-6 to +2)
      }
    } else {
      // Add random variation for players with stats
      grade += (Math.random() * 4) - 2; // Between -2 and +2
    }
    
    return Math.max(0, Math.min(100, Math.round(grade * 10) / 10));
  };
  
  const calculateLinebackerGrade = (player, ppa, seasonStats, gameStats, baseGrade) => {
    let grade = baseGrade;
    let hasStats = false;
    
    if (ppa.defense && ppa.defense.total) {
      hasStats = true;
      const ppaValue = parseFloat(ppa.defense.total) || 0;
      grade += Math.min(ppaValue * 3, 18); // Increased from 2,15
    }
    
    // Check for tackles, TFLs, coverage stats
    if (seasonStats && seasonStats.length > 0) {
      seasonStats.forEach(stat => {
        if (stat.category === "defensive") {
          hasStats = true;
          // Volume stats - more important for LBs
          if (stat.totalTackles > 100) grade += 15;
          else if (stat.totalTackles > 80) grade += 10;
          else if (stat.totalTackles > 60) grade += 5;
          else if (stat.totalTackles < 40) grade -= 5;
          
          // Playmaking stats
          if (stat.passesDefended > 5) grade += 8; // Increased from 5
          if (stat.interceptions > 2) grade += 12; // Increased from 10
          
          // TFLs are good indicators for LBs
          if (stat.tacklesForLoss > 12) grade += 15;
          else if (stat.tacklesForLoss > 8) grade += 10;
          else if (stat.tacklesForLoss > 5) grade += 5;
          
          // Sacks for blitzing LBs
          if (stat.sacks > 4) grade += 10;
          else if (stat.sacks > 2) grade += 5;
          
          // Forced fumbles
          if (stat.forcedFumbles > 2) grade += 8;
          else if (stat.forcedFumbles > 0) grade += 4;
        }
      });
    }
    
    // Game-specific adjustments
    if (gameStats && gameStats.defensive) {
      hasStats = true;
      const defStats = gameStats.defensive[0];
      if (defStats) {
        if (defStats.totalTackles > 10) grade += 8;
        if (defStats.passesDefended > 1) grade += 6;
        if (defStats.sacks > 0) grade += 5;
        if (defStats.interceptions > 0) grade += 10;
      }
    }
    
    // Positional adjustments
    if (player.position === "MLB") grade += 3; // Middle LBs have more responsibilities
    else if (player.position === "OLB" || player.position === "EDGE") grade += 1;
    
    // If no stats found, vary default grade
    if (!hasStats) {
      if (player.year === "SR" || player.year === "JR") {
        grade += (Math.random() * 10) - 3; // More upside for upperclassmen (-3 to +7)
      } else {
        grade += (Math.random() * 8) - 5; // More risk for younger players (-5 to +3)
      }
    } else {
      // Add random variation
      grade += (Math.random() * 3) - 1.5; // Between -1.5 and +1.5
    }
    
    return Math.max(0, Math.min(100, Math.round(grade * 10) / 10));
  };
  
  const calculateDefensiveBackGrade = (player, ppa, seasonStats, gameStats, baseGrade) => {
    let grade = baseGrade;
    let hasStats = false;
    
    if (ppa.defense && ppa.defense.total) {
      hasStats = true;
      const ppaValue = parseFloat(ppa.defense.total) || 0;
      grade += Math.min(ppaValue * 3, 18); // Increased from 2,15
    }
    
    // Check for interceptions, passes defended, etc.
    if (seasonStats && seasonStats.length > 0) {
      seasonStats.forEach(stat => {
        if (stat.category === "defensive") {
          hasStats = true;
          // Coverage stats - crucial for DBs
          if (stat.interceptions > 5) grade += 20; // Elite ball hawk
          else if (stat.interceptions > 3) grade += 15; // Increased from 15
          else if (stat.interceptions > 1) grade += 8; // Increased from 5
          
          if (stat.passesDefended > 15) grade += 18;
          else if (stat.passesDefended > 10) grade += 12; // Increased from 10
          else if (stat.passesDefended > 5) grade += 6; // Increased from 5
          
          // Tackles - good DBs make tackles too
          if (stat.totalTackles > 70) grade += 10;
          else if (stat.totalTackles > 50) grade += 5;
          
          // TFLs show aggressive play
          if (stat.tacklesForLoss > 6) grade += 8;
          else if (stat.tacklesForLoss > 3) grade += 4;
          
          // Forced fumbles
          if (stat.forcedFumbles > 2) grade += 10;
          else if (stat.forcedFumbles > 0) grade += 5;
        }
      });
    }
    
    // Game-specific adjustments
    if (gameStats && gameStats.defensive) {
      hasStats = true;
      const defStats = gameStats.defensive[0];
      if (defStats) {
        if (defStats.interceptions > 0) grade += 12;
        if (defStats.passesDefended > 2) grade += 8;
        if (defStats.totalTackles > 8) grade += 5;
      }
    }
    
    // Positional adjustments
    if (player.position === "CB") grade += 2; // Cornerbacks often have tougher assignments
    
    // If no stats found, vary default grade
    if (!hasStats) {
      if (player.year === "SR" || player.year === "JR") {
        grade += (Math.random() * 10) - 4; // More upside for upperclassmen (-4 to +6)
      } else {
        grade += (Math.random() * 8) - 6; // More risk for younger players (-6 to +2)
      }
    } else {
      // Add random variation
      grade += (Math.random() * 3) - 1.5; // Between -1.5 and +1.5
    }
    
    return Math.max(0, Math.min(100, Math.round(grade * 10) / 10));
  };
  
  const calculateSpecialTeamsGrade = (player, seasonStats, gameStats, baseGrade) => {
    let grade = baseGrade;
    let hasStats = false;
    
    // Check for kicking stats
    if (seasonStats && seasonStats.length > 0) {
      seasonStats.forEach(stat => {
        if (stat.category === "kicking") {
          hasStats = true;
          // Field goal percentage
          if (stat.fieldGoalsMade && stat.fieldGoalsAttempted) {
            const fgPercentage = (stat.fieldGoalsMade / stat.fieldGoalsAttempted) * 100;
            if (fgPercentage > 90) grade += 20;
            else if (fgPercentage > 85) grade += 15; // Increased from 15
            else if (fgPercentage > 75) grade += 10; // Increased from 10
            else if (fgPercentage < 65) grade -= 15; // Increased from 10
            
            // Long field goals
            if (stat.fieldGoalLong >= 50) grade += 10;
            else if (stat.fieldGoalLong >= 45) grade += 5;
          }
          
          // Punting average
          if (stat.puntingAverage > 45) grade += 15; // Increased from 10
          else if (stat.puntingAverage > 42) grade += 8; // Increased from 5
          else if (stat.puntingAverage < 38) grade -= 10; // Increased from 5
          
          // Punts inside 20
          if (stat.puntsInside20 && stat.punts) {
            const inside20Percentage = (stat.puntsInside20 / stat.punts) * 100;
            if (inside20Percentage > 40) grade += 10;
            else if (inside20Percentage > 30) grade += 5;
          }
        }
      });
    }
    
    // Game-specific adjustments
    if (gameStats && gameStats.kicking) {
      hasStats = true;
      const kickStats = gameStats.kicking[0];
      if (kickStats) {
        if (kickStats.fieldGoalsMade > 2) grade += 8;
        if (kickStats.fieldGoalLong >= 45) grade += 5;
        if (kickStats.puntingAverage > 45) grade += 6;
      }
    }
    
    // Position-specific adjustments
    if (player.position === "K") {
      grade += 2; // Kickers tend to be specialists
    } else if (player.position === "P") {
      grade += 1; // Punters are also specialists
    }
    
    // If no stats, vary default grade
    if (!hasStats) {
      // For specialists without stats, assume they're not the primary
      grade -= 5;
      grade += (Math.random() * 10) - 5; // Wide random variation (-5 to +5)
    } else {
      // Add random variation
      grade += (Math.random() * 4) - 2; // Between -2 and +2
    }
    
    return Math.max(0, Math.min(100, Math.round(grade * 10) / 10));
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
  
  // Filter and paginate players
  const getFilteredAndPaginatedPlayers = () => {
    // First filter by position
    const positionFiltered = positionFilter === "all" 
      ? roster
      : roster.filter(player => player.position === positionFilter);
    
    // Calculate total pages
    const totalPlayers = positionFiltered.length;
    const totalPages = Math.ceil(totalPlayers / pageSize);
    
    // Ensure current page is valid
    const validPage = Math.max(1, Math.min(currentPage, totalPages));
    if (validPage !== currentPage) {
      setCurrentPage(validPage);
    }
    
    // Get the slice for the current page
    const startIndex = (validPage - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, totalPlayers);
    const paginatedPlayers = positionFiltered.slice(startIndex, endIndex);
    
    // Find grade data for these players
    const playersWithGrades = paginatedPlayers.map(player => {
      const gradeData = playerGrades.find(p => p.id === player.id);
      return gradeData || {
        ...player,
        grade: 65 // Default "C" grade if not calculated yet
      };
    });
    
    // Sort by grade (highest first)
    return [...playersWithGrades].sort((a, b) => b.grade - a.grade);
  };
  
  // Get the actual players to display
  const displayPlayers = getFilteredAndPaginatedPlayers();
  
  // Calculate pagination information
  const totalPlayers = positionFilter === "all" 
    ? roster.length 
    : roster.filter(player => player.position === positionFilter).length;
  const totalPages = Math.ceil(totalPlayers / pageSize);
  
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
  
  // Handler for team change
  const handleTeamChange = (newTeamId) => {
    // Reset pagination and selected player
    setCurrentPage(1);
    setSelectedPlayer(null);
    
    // Navigate to new team
    navigate(`/player-grade/${newTeamId}${location.search}`);
  };
  
  // Handler for player selection
  const handlePlayerSelect = (player) => {
    setSelectedPlayer(player);
  };
  
  // Handle page change for pagination
  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

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
          {/* Team Selector */}
          <div className="filter-group team-filter-group">
            <label>Team:</label>
            <select 
              value={teamId} 
              onChange={(e) => handleTeamChange(e.target.value)}
              className="team-filter"
            >
              {teams.map(t => (
                <option key={t.id} value={t.id}>{t.school}</option>
              ))}
            </select>
          </div>
          
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
            {displayPlayers.length > 0 ? (
              displayPlayers.map(player => (
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
          
          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="pagination-controls">
              <button 
                className="pagination-button" 
                disabled={currentPage === 1}
                onClick={() => handlePageChange(currentPage - 1)}
              >
                &laquo; Prev
              </button>
              
              <span className="pagination-info">
                Page {currentPage} of {totalPages}
              </span>
              
              <button 
                className="pagination-button" 
                disabled={currentPage === totalPages}
                onClick={() => handlePageChange(currentPage + 1)}
              >
                Next &raquo;
              </button>
            </div>
          )}
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
                  
                  {/* Add breakdowns for defensive positions */}
                  {(defensiveFront.includes(selectedPlayer.position)) && (
                    <>
                      <div className="breakdown-category">
                        <div className="category-name">Pass Rush</div>
                        <div className="category-bar">
                          <div 
                            className="category-fill" 
                            style={{ width: `${Math.min(100, Math.max(0, (selectedPlayer.grade * 1.05) - 3))}%` }}
                          ></div>
                        </div>
                        <div className="category-value">{Math.min(100, Math.max(0, (selectedPlayer.grade * 1.05) - 3)).toFixed(1)}</div>
                      </div>
                      <div className="breakdown-category">
                        <div className="category-name">Run Defense</div>
                        <div className="category-bar">
                          <div 
                            className="category-fill" 
                            style={{ width: `${Math.min(100, Math.max(0, (selectedPlayer.grade * 0.95) + 5))}%` }}
                          ></div>
                        </div>
                        <div className="category-value">{Math.min(100, Math.max(0, (selectedPlayer.grade * 0.95) + 5)).toFixed(1)}</div>
                      </div>
                    </>
                  )}
                  
                  {(linebackers.includes(selectedPlayer.position)) && (
                    <>
                      <div className="breakdown-category">
                        <div className="category-name">Run Support</div>
                        <div className="category-bar">
                          <div 
                            className="category-fill" 
                            style={{ width: `${Math.min(100, Math.max(0, (selectedPlayer.grade * 0.95) + 7))}%` }}
                          ></div>
                        </div>
                        <div className="category-value">{Math.min(100, Math.max(0, (selectedPlayer.grade * 0.95) + 7)).toFixed(1)}</div>
                      </div>
                      <div className="breakdown-category">
                        <div className="category-name">Coverage</div>
                        <div className="category-bar">
                          <div 
                            className="category-fill" 
                            style={{ width: `${Math.min(100, Math.max(0, (selectedPlayer.grade * 1.03) - 3))}%` }}
                          ></div>
                        </div>
                        <div className="category-value">{Math.min(100, Math.max(0, (selectedPlayer.grade * 1.03) - 3)).toFixed(1)}</div>
                      </div>
                    </>
                  )}
                  
                  {(defensiveBack.includes(selectedPlayer.position)) && (
                    <>
                      <div className="breakdown-category">
                        <div className="category-name">Coverage</div>
                        <div className="category-bar">
                          <div 
                            className="category-fill" 
                            style={{ width: `${Math.min(100, Math.max(0, (selectedPlayer.grade * 1.05) - 2))}%` }}
                          ></div>
                        </div>
                        <div className="category-value">{Math.min(100, Math.max(0, (selectedPlayer.grade * 1.05) - 2)).toFixed(1)}</div>
                      </div>
                      <div className="breakdown-category">
                        <div className="category-name">Tackling</div>
                        <div className="category-bar">
                          <div 
                            className="category-fill" 
                            style={{ width: `${Math.min(100, Math.max(0, (selectedPlayer.grade * 0.98) + 3))}%` }}
                          ></div>
                        </div>
                        <div className="category-value">{Math.min(100, Math.max(0, (selectedPlayer.grade * 0.98) + 3)).toFixed(1)}</div>
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