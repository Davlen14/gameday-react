import React, { useState, useEffect } from "react";
import teamsService from "../services/teamsService";
import graphqlTeamsService from "../services/graphqlTeamsService";
import "../styles/AdvancedStatistics.css";

// Advanced Statistics component that implements a player grading system
const AdvancedStatistics = ({ gameData, homeTeam, awayTeam, homeTeamColor, awayTeamColor, homeLogo, awayLogo }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [playerPositionFilter, setPlayerPositionFilter] = useState('all');
  const [advancedData, setAdvancedData] = useState(null);
  const [playerStats, setPlayerStats] = useState([]);
  const [teamStats, setTeamStats] = useState({});
  const [driveData, setDriveData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Effect to fetch player and game data
  useEffect(() => {
    const fetchAdvancedStats = async () => {
      try {
        setIsLoading(true);
        
        if (!gameData || !gameData.id) {
          setError("Game data not available");
          setIsLoading(false);
          return;
        }
        
        // Check if teamsService has the required methods
        if (!teamsService || typeof teamsService.getGamePlayers !== 'function') {
          console.error("teamsService.getGamePlayers is not a function. Using graphqlTeamsService as fallback.");
          // Try using graphqlTeamsService as fallback if available
          if (!graphqlTeamsService || typeof graphqlTeamsService.getGamePlayers !== 'function') {
            throw new Error("getGamePlayers is not available in either teamsService or graphqlTeamsService");
          }
        }
        
        // Fetch player statistics for the game
        const playersData = typeof teamsService.getGamePlayers === 'function' ?
          await teamsService.getGamePlayers(gameData.id) :
          await graphqlTeamsService.getGamePlayers(gameData.id);
        
        // Fetch PPA (Predicted Points Added) data
        const ppaData = typeof teamsService.getGamePPA === 'function' ?
          await teamsService.getGamePPA(gameData.id) :
          await graphqlTeamsService.getGamePPA?.(gameData.id) || [];
        
        // Fetch drive data
        const drivesData = typeof teamsService.getGameDrives === 'function' ?
          await teamsService.getGameDrives(gameData.id) :
          await graphqlTeamsService.getGameDrives?.(gameData.id) || [];
        
        // Process player statistics and calculate grades
        const processedPlayers = processPlayerStats(playersData, ppaData);
        setPlayerStats(processedPlayers);
        
        // Calculate team-level statistics
        const homeStats = calculateTeamStats(processedPlayers, homeTeam);
        const awayStats = calculateTeamStats(processedPlayers, awayTeam);
        setTeamStats({
          [homeTeam]: homeStats,
          [awayTeam]: awayStats
        });
        
        // Process drive data
        const processedDrives = processDriveData(drivesData, homeTeam, awayTeam);
        setDriveData(processedDrives);
        
        // Create full advanced data object
        const advancedDataObj = {
          homeTeamStats: homeStats,
          awayTeamStats: awayStats,
          players: processedPlayers,
          drives: processedDrives,
          keyPlayers: {
            [homeTeam]: getKeyPlayers(processedPlayers, homeTeam),
            [awayTeam]: getKeyPlayers(processedPlayers, awayTeam)
          }
        };
        
        setAdvancedData(advancedDataObj);
        setIsLoading(false);
      } catch (err) {
        console.error("Error fetching advanced stats:", err);
        setError("Failed to load advanced statistics. " + err.message);
        setIsLoading(false);
        // In case of error, provide fallback empty data to prevent further errors
        setPlayerStats([]);
        setTeamStats({
          [homeTeam]: calculateEmptyTeamStats(),
          [awayTeam]: calculateEmptyTeamStats()
        });
        setDriveData([]);
        setAdvancedData(null);
      }
    };
    
    if (gameData) {
      fetchAdvancedStats();
    }
  }, [gameData, homeTeam, awayTeam]);
  
  // Create empty team stats object for fallback
  const calculateEmptyTeamStats = () => ({
    totalYards: 0,
    passingYards: 0,
    rushingYards: 0,
    firstDowns: 0,
    thirdDowns: { attempts: 0, conversions: 0 },
    fourthDowns: { attempts: 0, conversions: 0 },
    turnovers: 0,
    timeOfPossession: 0,
    redZone: { attempts: 0, conversions: 0 },
    penalties: { count: 0, yards: 0 },
    sacks: { count: 0, yards: 0 },
    explosivePlays: 0,
    ppa: { total: 0, passing: 0, rushing: 0, defense: 0 },
    efficiency: { offensive: 0, defensive: 0, passingSuccess: 0, rushingSuccess: 0 }
  });

  // Process player statistics and calculate grades
  const processPlayerStats = (playersData, ppaData) => {
    if (!playersData || !Array.isArray(playersData)) return [];
    
    return playersData.map(player => {
      // Find PPA data for this player if available
      const playerPPA = ppaData?.find(p => 
        p.playerId === player.id || 
        (p.name === player.name && p.team === player.team)
      );
      
      // Calculate player grade based on position and statistics
      const grade = calculatePlayerGrade(player, playerPPA);
      
      return {
        ...player,
        ppa: playerPPA?.ppa || 0,
        grade
      };
    });
  };
  
  // Calculate player grade based on position and stats
  const calculatePlayerGrade = (player, ppaData) => {
    // Default grade components and weights
    let grade = 50; // Base grade (average)
    const ppaWeight = 10; // Weight for PPA contribution
    
    if (!player.stats) return grade;
    
    // Apply position-specific grading
    switch (player.position) {
      case 'QB':
        return calculateQuarterbackGrade(player, ppaData);
      case 'RB':
        return calculateRunningBackGrade(player, ppaData);
      case 'WR':
      case 'TE':
        return calculateReceiverGrade(player, ppaData);
      case 'DL':
      case 'DE':
      case 'DT':
        return calculateDefensiveLineGrade(player, ppaData);
      case 'LB':
        return calculateLinebackerGrade(player, ppaData);
      case 'CB':
      case 'S':
      case 'DB':
        return calculateDefensiveBackGrade(player, ppaData);
      default:
        // For other positions, use PPA if available
        if (ppaData && ppaData.ppa) {
          // Scale PPA to grade points (-5 to +15 range)
          const ppaContribution = Math.min(15, Math.max(-5, ppaData.ppa * ppaWeight));
          grade += ppaContribution;
        }
        return Math.round(grade);
    }
  };
  
  // Position-specific grade calculations
  const calculateQuarterbackGrade = (player, ppaData) => {
    let grade = 50; // Base grade
    
    if (player.stats.passing) {
      const { completions, attempts, yards, touchdowns, interceptions } = player.stats.passing;
      
      // Completion percentage (weight: 15)
      if (attempts > 0) {
        const completionPct = (completions / attempts) * 100;
        // Scale: <50% (-10), 50-60% (0), 60-70% (+10), >70% (+15)
        if (completionPct < 50) grade -= 10;
        else if (completionPct >= 70) grade += 15;
        else if (completionPct >= 60) grade += 10;
      }
      
      // Yards per attempt (weight: 10)
      if (attempts > 0) {
        const ypa = yards / attempts;
        // Scale: <6 (-5), 6-8 (0), 8-10 (+5), >10 (+10)
        if (ypa < 6) grade -= 5;
        else if (ypa > 10) grade += 10;
        else if (ypa > 8) grade += 5;
      }
      
      // TD-to-INT ratio (weight: 15)
      if (interceptions === 0 && touchdowns > 0) {
        grade += 10 + Math.min(5, touchdowns); // Bonus for no INTs
      } else if (interceptions > 0) {
        const tdIntRatio = touchdowns / interceptions;
        // Scale: <1 (-10), 1-2 (0), 2-3 (+5), >3 (+10)
        if (tdIntRatio < 1) grade -= 10;
        else if (tdIntRatio > 3) grade += 10;
        else if (tdIntRatio > 2) grade += 5;
      }
      
      // Raw touchdowns (weight: 5)
      grade += Math.min(5, touchdowns);
      
      // Raw interceptions (weight: -7 each)
      grade -= Math.min(21, interceptions * 7);
    }
    
    // Rushing contribution for QBs (weight: 5)
    if (player.stats.rushing) {
      const rushYards = player.stats.rushing.yards || 0;
      const rushTDs = player.stats.rushing.touchdowns || 0;
      
      // Add points for significant rushing yards
      if (rushYards > 50) grade += 5;
      else if (rushYards > 25) grade += 3;
      
      // Add points for rushing TDs
      grade += Math.min(5, rushTDs * 2);
    }
    
    // PPA contribution (weight: 10)
    if (ppaData && ppaData.ppa) {
      const ppaContribution = Math.min(15, Math.max(-10, ppaData.ppa * 10));
      grade += ppaContribution;
    }
    
    // Ensure grade is within 0-100 range
    return Math.min(100, Math.max(0, Math.round(grade)));
  };
  
  const calculateRunningBackGrade = (player, ppaData) => {
    let grade = 50; // Base grade
    
    if (player.stats.rushing) {
      const { attempts, yards, touchdowns } = player.stats.rushing;
      
      // Yards per carry (weight: 15)
      if (attempts > 0) {
        const ypc = yards / attempts;
        // Scale: <3 (-10), 3-4 (0), 4-5 (+7), >5 (+15)
        if (ypc < 3) grade -= 10;
        else if (ypc > 5) grade += 15;
        else if (ypc > 4) grade += 7;
      }
      
      // Volume of yards (weight: 10)
      // Scale: <30 (-5), 30-75 (0), 75-100 (+5), >100 (+10)
      if (yards < 30) grade -= 5;
      else if (yards > 100) grade += 10;
      else if (yards > 75) grade += 5;
      
      // Touchdowns (weight: 5 each, up to 15)
      grade += Math.min(15, touchdowns * 5);
    }
    
    // Receiving contribution for RBs (weight: 10)
    if (player.stats.receiving) {
      const recYards = player.stats.receiving.yards || 0;
      const recTDs = player.stats.receiving.touchdowns || 0;
      
      // Add points for receiving yards
      if (recYards > 50) grade += 10;
      else if (recYards > 25) grade += 5;
      
      // Add points for receiving TDs
      grade += Math.min(10, recTDs * 5);
    }
    
    // PPA contribution (weight: 10)
    if (ppaData && ppaData.ppa) {
      const ppaContribution = Math.min(15, Math.max(-10, ppaData.ppa * 10));
      grade += ppaContribution;
    }
    
    // Ensure grade is within 0-100 range
    return Math.min(100, Math.max(0, Math.round(grade)));
  };
  
  const calculateReceiverGrade = (player, ppaData) => {
    let grade = 50; // Base grade
    
    if (player.stats.receiving) {
      const { receptions, yards, touchdowns, targets } = player.stats.receiving;
      
      // Yards per reception (weight: 15)
      if (receptions > 0) {
        const ypr = yards / receptions;
        // Scale: <8 (-5), 8-12 (0), 12-16 (+7), >16 (+15)
        if (ypr < 8) grade -= 5;
        else if (ypr > 16) grade += 15;
        else if (ypr > 12) grade += 7;
      }
      
      // Volume of yards (weight: 10)
      // Scale: <30 (-5), 30-60 (0), 60-100 (+5), >100 (+10)
      if (yards < 30) grade -= 5;
      else if (yards > 100) grade += 10;
      else if (yards > 60) grade += 5;
      
      // Touchdowns (weight: 7 each, up to 21)
      grade += Math.min(21, touchdowns * 7);
      
      // Catch rate (weight: 10)
      if (targets > 0) {
        const catchRate = receptions / targets;
        // Scale: <50% (-5), 50-65% (0), 65-80% (+5), >80% (+10)
        if (catchRate < 0.5) grade -= 5;
        else if (catchRate > 0.8) grade += 10;
        else if (catchRate > 0.65) grade += 5;
      }
    }
    
    // PPA contribution (weight: 10)
    if (ppaData && ppaData.ppa) {
      const ppaContribution = Math.min(15, Math.max(-10, ppaData.ppa * 10));
      grade += ppaContribution;
    }
    
    // Ensure grade is within 0-100 range
    return Math.min(100, Math.max(0, Math.round(grade)));
  };
  
  const calculateDefensiveLineGrade = (player, ppaData) => {
    let grade = 50; // Base grade
    
    if (player.stats.defense) {
      const { tackles, tacklesForLoss, sacks } = player.stats.defense;
      const totalTackles = tackles || 0;
      const tfl = tacklesForLoss || 0;
      const sackCount = sacks || 0;
      
      // Total tackles (weight: 5)
      // Scale for DL: 0-2 (0), 3-5 (+3), >5 (+5)
      if (totalTackles > 5) grade += 5;
      else if (totalTackles > 2) grade += 3;
      
      // Tackles for loss (weight: 5 each, up to 15)
      grade += Math.min(15, tfl * 5);
      
      // Sacks (weight: 10 each, up to 20)
      grade += Math.min(20, sackCount * 10);
    }
    
    // PPA contribution (weight: 15 for defensive players)
    if (ppaData && ppaData.ppa) {
      // For defensive players, negative PPA is good (preventing scoring)
      const ppaContribution = Math.min(20, Math.max(-10, -ppaData.ppa * 15));
      grade += ppaContribution;
    }
    
    // Ensure grade is within 0-100 range
    return Math.min(100, Math.max(0, Math.round(grade)));
  };
  
  const calculateLinebackerGrade = (player, ppaData) => {
    let grade = 50; // Base grade
    
    if (player.stats.defense) {
      const { tackles, tacklesForLoss, sacks, interceptions, passesDefended } = player.stats.defense;
      const totalTackles = tackles || 0;
      const tfl = tacklesForLoss || 0;
      const sackCount = sacks || 0;
      const ints = interceptions || 0;
      const pbus = passesDefended || 0;
      
      // Total tackles (weight: 10)
      // Scale for LB: 0-4 (-5), 5-8 (0), 9-12 (+5), >12 (+10)
      if (totalTackles < 4) grade -= 5;
      else if (totalTackles > 12) grade += 10;
      else if (totalTackles > 8) grade += 5;
      
      // Tackles for loss (weight: 3 each, up to 12)
      grade += Math.min(12, tfl * 3);
      
      // Sacks (weight: 7 each, up to 14)
      grade += Math.min(14, sackCount * 7);
      
      // Interceptions (weight: 15 each, up to 30)
      grade += Math.min(30, ints * 15);
      
      // Pass breakups (weight: 3 each, up to 9)
      grade += Math.min(9, pbus * 3);
    }
    
    // PPA contribution (weight: 15 for defensive players)
    if (ppaData && ppaData.ppa) {
      // For defensive players, negative PPA is good (preventing scoring)
      const ppaContribution = Math.min(20, Math.max(-10, -ppaData.ppa * 15));
      grade += ppaContribution;
    }
    
    // Ensure grade is within 0-100 range
    return Math.min(100, Math.max(0, Math.round(grade)));
  };
  
  const calculateDefensiveBackGrade = (player, ppaData) => {
    let grade = 50; // Base grade
    
    if (player.stats.defense) {
      const { tackles, interceptions, passesDefended } = player.stats.defense;
      const totalTackles = tackles || 0;
      const ints = interceptions || 0;
      const pbus = passesDefended || 0;
      
      // Total tackles (weight: 5)
      // Scale for DB: 0-3 (-3), 4-7 (0), 8-10 (+3), >10 (+5)
      if (totalTackles < 3) grade -= 3;
      else if (totalTackles > 10) grade += 5;
      else if (totalTackles > 7) grade += 3;
      
      // Interceptions (weight: 15 each, up to 30)
      grade += Math.min(30, ints * 15);
      
      // Pass breakups (weight: 5 each, up to 20)
      grade += Math.min(20, pbus * 5);
    }
    
    // PPA contribution (weight: 15 for defensive players)
    if (ppaData && ppaData.ppa) {
      // For defensive players, negative PPA is good (preventing scoring)
      const ppaContribution = Math.min(20, Math.max(-10, -ppaData.ppa * 15));
      grade += ppaContribution;
    }
    
    // Ensure grade is within 0-100 range
    return Math.min(100, Math.max(0, Math.round(grade)));
  };
  
  // Calculate aggregate team statistics
  const calculateTeamStats = (players, teamName) => {
    // Filter players for the team
    const teamPlayers = players.filter(p => p.team === teamName);
    
    // Initialize team stats object
    const teamStats = {
      totalYards: 0,
      passingYards: 0,
      rushingYards: 0,
      firstDowns: 0,
      thirdDowns: { attempts: 0, conversions: 0 },
      fourthDowns: { attempts: 0, conversions: 0 },
      turnovers: 0,
      timeOfPossession: 0, // in minutes
      redZone: { attempts: 0, conversions: 0 },
      penalties: { count: 0, yards: 0 },
      sacks: { count: 0, yards: 0 },
      explosivePlays: 0, // plays over 20 yards
      ppa: {
        total: 0,
        passing: 0,
        rushing: 0,
        defense: 0
      },
      efficiency: {
        offensive: 0,
        defensive: 0,
        passingSuccess: 0,
        rushingSuccess: 0
      }
    };
    
    // Accumulate passing stats
    teamPlayers.forEach(player => {
      if (player.stats) {
        // Passing stats
        if (player.stats.passing) {
          teamStats.passingYards += player.stats.passing.yards || 0;
          teamStats.turnovers += player.stats.passing.interceptions || 0;
          
          // Track explosive passing plays (20+ yards)
          if ((player.stats.passing.yards || 0) >= 20) {
            teamStats.explosivePlays += 1;
          }
        }
        
        // Rushing stats
        if (player.stats.rushing) {
          teamStats.rushingYards += player.stats.rushing.yards || 0;
          
          // Track explosive rushing plays (20+ yards)
          if ((player.stats.rushing.yards || 0) >= 20) {
            teamStats.explosivePlays += 1;
          }
        }
        
        // Defensive stats
        if (player.stats.defense) {
          teamStats.sacks.count += player.stats.defense.sacks || 0;
          // Approximate sack yards if not directly provided
          teamStats.sacks.yards += (player.stats.defense.sacks || 0) * 7; // Average 7 yards per sack
        }
      }
      
      // Accumulate PPA values
      if (player.ppa) {
        teamStats.ppa.total += player.ppa;
        
        // Categorize PPA by player position
        if (['QB', 'RB', 'WR', 'TE'].includes(player.position)) {
          if (player.position === 'QB') {
            teamStats.ppa.passing += player.ppa * 0.8; // Assume 80% of QB PPA is from passing
            teamStats.ppa.rushing += player.ppa * 0.2; // Assume 20% of QB PPA is from rushing
          } else if (player.position === 'RB') {
            teamStats.ppa.rushing += player.ppa * 0.7; // Assume 70% of RB PPA is from rushing
            teamStats.ppa.passing += player.ppa * 0.3; // Assume 30% of RB PPA is from receiving
          } else {
            teamStats.ppa.passing += player.ppa; // WR/TE PPA is all from passing game
          }
        } else {
          teamStats.ppa.defense += player.ppa; // Defensive player PPA
        }
      }
    });
    
    // Calculate total yards
    teamStats.totalYards = teamStats.passingYards + teamStats.rushingYards;
    
    // Get time of possession and other team stats from gameData
    if (gameData) {
      if (teamName === homeTeam) {
        teamStats.timeOfPossession = gameData.homePossessionTime || 30; // Default to 30 minutes if not available
        teamStats.penalties.count = gameData.homePenalties || 0;
        teamStats.penalties.yards = gameData.homePenaltyYards || 0;
      } else {
        teamStats.timeOfPossession = gameData.awayPossessionTime || 30; // Default to 30 minutes if not available
        teamStats.penalties.count = gameData.awayPenalties || 0;
        teamStats.penalties.yards = gameData.awayPenaltyYards || 0;
      }
    }
    
    // Calculate efficiency metrics - using averaged/estimated values if actual data not available
    teamStats.efficiency.offensive = calculateOffensiveEfficiency(teamStats, teamPlayers);
    teamStats.efficiency.defensive = calculateDefensiveEfficiency(teamStats, teamPlayers);
    teamStats.efficiency.passingSuccess = calculatePassingSuccessRate(teamStats, teamPlayers);
    teamStats.efficiency.rushingSuccess = calculateRushingSuccessRate(teamStats, teamPlayers);
    
    // Estimate third and fourth down stats if not directly available
    const totalPlays = estimateTotalPlays(teamStats, teamPlayers);
    teamStats.thirdDowns.attempts = Math.round(totalPlays * 0.15); // Estimate: ~15% of plays are third downs
    teamStats.thirdDowns.conversions = Math.round(teamStats.thirdDowns.attempts * 0.4); // Estimate: ~40% conversion rate
    
    teamStats.fourthDowns.attempts = Math.round(totalPlays * 0.03); // Estimate: ~3% of plays are fourth downs
    teamStats.fourthDowns.conversions = Math.round(teamStats.fourthDowns.attempts * 0.5); // Estimate: ~50% conversion rate
    
    // Estimate red zone stats
    teamStats.redZone.attempts = Math.round(totalPlays * 0.08); // Estimate: ~8% of plays are in red zone
    teamStats.redZone.conversions = Math.round(teamStats.redZone.attempts * 0.6); // Estimate: ~60% red zone conversion
    
    return teamStats;
  };
  
  // Helper function to estimate total plays
  const estimateTotalPlays = (teamStats, teamPlayers) => {
    // Get QB pass attempts
    let passAttempts = 0;
    const qbs = teamPlayers.filter(p => p.position === 'QB');
    qbs.forEach(qb => {
      if (qb.stats && qb.stats.passing) {
        passAttempts += qb.stats.passing.attempts || 0;
      }
    });
    
    // Get RB rush attempts
    let rushAttempts = 0;
    teamPlayers.forEach(player => {
      if (player.stats && player.stats.rushing) {
        rushAttempts += player.stats.rushing.attempts || 0;
      }
    });
    
    // Total plays is pass attempts + rush attempts + some buffer for penalties, etc.
    return passAttempts + rushAttempts + 10; // Add 10 as buffer for other plays
  };
  
  // Calculate offensive efficiency
  const calculateOffensiveEfficiency = (teamStats, teamPlayers) => {
    // This is a simplified calculation
    // Ideally, we would use success rate on a play-by-play basis
    
    // Calculate yards per play
    const totalPlays = estimateTotalPlays(teamStats, teamPlayers);
    const yardsPerPlay = totalPlays > 0 ? teamStats.totalYards / totalPlays : 0;
    
    // Scale to 0-1 efficiency metric
    // < 3 yards/play: 0.3, 3-5: 0.4-0.5, 5-7: 0.6-0.7, > 7: 0.8+
    if (yardsPerPlay < 3) return 0.3;
    if (yardsPerPlay > 7) return Math.min(0.95, 0.8 + (yardsPerPlay - 7) * 0.05);
    if (yardsPerPlay > 5) return 0.6 + (yardsPerPlay - 5) * 0.1;
    return 0.4 + (yardsPerPlay - 3) * 0.05;
  };
  
  // Calculate defensive efficiency (simplified)
  const calculateDefensiveEfficiency = (teamStats, teamPlayers) => {
    // For demonstration, base on defensive PPA and counting stats
    let efficiency = 0.5; // Default average
    
    // Adjust based on defensive PPA
    if (teamStats.ppa.defense < 0) {
      // Negative defensive PPA is good for defense
      efficiency += Math.min(0.3, Math.abs(teamStats.ppa.defense) * 0.1);
    } else if (teamStats.ppa.defense > 0) {
      efficiency -= Math.min(0.3, teamStats.ppa.defense * 0.1);
    }
    
    // Adjust based on sacks
    efficiency += Math.min(0.15, teamStats.sacks.count * 0.03);
    
    return Math.min(0.95, Math.max(0.1, efficiency));
  };
  
  // Calculate passing success rate (simplified)
  const calculatePassingSuccessRate = (teamStats, teamPlayers) => {
    // Get QB completion percentage
    let completions = 0;
    let attempts = 0;
    
    teamPlayers.forEach(player => {
      if (player.position === 'QB' && player.stats && player.stats.passing) {
        completions += player.stats.passing.completions || 0;
        attempts += player.stats.passing.attempts || 0;
      }
    });
    
    if (attempts === 0) return 0.45; // Default if no data
    
    // Calculate completion percentage and adjust to success rate
    // Completion % doesn't equal success rate, but correlated
    const completionPct = completions / attempts;
    
    // Scale: 50% completion = ~40% success rate, 70% completion = ~60% success rate
    return Math.min(0.95, Math.max(0.1, completionPct * 0.85));
  };
  
  // Calculate rushing success rate (simplified)
  const calculateRushingSuccessRate = (teamStats, teamPlayers) => {
    // Calculate yards per carry
    let rushYards = 0;
    let rushAttempts = 0;
    
    teamPlayers.forEach(player => {
      if (player.stats && player.stats.rushing) {
        rushYards += player.stats.rushing.yards || 0;
        rushAttempts += player.stats.rushing.attempts || 0;
      }
    });
    
    if (rushAttempts === 0) return 0.4; // Default if no data
    
    // Calculate yards per carry
    const ypc = rushYards / rushAttempts;
    
    // Scale to success rate: < 3 ypc: 0.3, 3-4: 0.4, 4-5: 0.5, > 5: 0.6+
    if (ypc < 3) return 0.3;
    if (ypc > 5) return Math.min(0.8, 0.6 + (ypc - 5) * 0.05);
    if (ypc > 4) return 0.5 + (ypc - 4) * 0.1;
    return 0.4 + (ypc - 3) * 0.1;
  };
  
  // Process drive data
  const processDriveData = (drivesData, homeTeam, awayTeam) => {
    if (!drivesData || !Array.isArray(drivesData)) return [];
    
    return drivesData.map(drive => {
      // Determine drive result
      let result = "Unknown";
      if (drive.scoring) {
        if (drive.scoringType === "TD") result = "Touchdown";
        else if (drive.scoringType === "FG") result = "Field Goal";
        else result = drive.scoringType;
      } else if (drive.endReason === "PUNT") {
        result = "Punt";
      } else if (drive.endReason === "TURNOVER") {
        result = "Turnover";
      } else if (drive.endReason === "DOWNS") {
        result = "Turnover on Downs";
      } else if (drive.endReason === "END OF HALF" || drive.endReason === "END OF GAME") {
        result = "End of Half";
      } else {
        result = drive.endReason || "Unknown";
      }
      
      return {
        team: drive.offenseTeam,
        quarter: drive.quarter || 1,
        result,
        yards: drive.yards || 0,
        timeOfPossession: drive.timeOfPossession || "0:00",
        plays: drive.plays || 0,
        startPosition: drive.startYard ? `${drive.startSide} ${drive.startYard}` : "Unknown"
      };
    });
  };
  
  // Get key players based on grades and stats
  const getKeyPlayers = (players, teamName) => {
    const teamPlayers = players.filter(p => p.team === teamName);
    
    // Sort by grade
    const sortedPlayers = [...teamPlayers].sort((a, b) => (b.grade || 0) - (a.grade || 0));
    
    // Get top players by position
    const qbs = sortedPlayers.filter(p => p.position === 'QB').slice(0, 1);
    const rbs = sortedPlayers.filter(p => p.position === 'RB').slice(0, 2);
    const wrs = sortedPlayers.filter(p => ['WR', 'TE'].includes(p.position)).slice(0, 3);
    const defenders = sortedPlayers
      .filter(p => ['DL', 'DE', 'DT', 'LB', 'CB', 'S', 'DB'].includes(p.position))
      .slice(0, 3);
    
    // Combine and return
    return [...qbs, ...rbs, ...wrs, ...defenders].slice(0, 8);
  };
  
  // Get grade description
  const getGradeDescription = (grade) => {
    if (grade >= 90) return "Elite";
    if (grade >= 80) return "Excellent";
    if (grade >= 70) return "Very Good";
    if (grade >= 60) return "Above Average";
    if (grade >= 50) return "Average";
    if (grade >= 40) return "Below Average";
    if (grade >= 30) return "Poor";
    return "Very Poor";
  };
  
  // Get grade color
  const getGradeColor = (grade) => {
    if (grade >= 90) return "#2ecc71"; // Green
    if (grade >= 80) return "#27ae60"; // Dark Green
    if (grade >= 70) return "#3498db"; // Blue
    if (grade >= 60) return "#2980b9"; // Dark Blue
    if (grade >= 50) return "#f1c40f"; // Yellow
    if (grade >= 40) return "#e67e22"; // Orange
    if (grade >= 30) return "#e74c3c"; // Red
    return "#c0392b"; // Dark Red
  };
  
  if (isLoading) {
    return (
      <div className="advanced-stats-loading">
        <div className="loading-spinner"></div>
        <p>Loading advanced statistics and player grades...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="advanced-stats-error">
        <div className="error-icon">⚠️</div>
        <h3>Error Loading Advanced Statistics</h3>
        <p>{error}</p>
        <p>Please ensure that all required data is available through the teamsService.</p>
      </div>
    );
  }
  
  if (!advancedData) {
    return (
      <div className="advanced-stats-empty">
        <p>No advanced statistics available for this game.</p>
      </div>
    );
  }
  
  // Rendering functions
  const renderTabs = () => (
    <div className="advanced-stats-tabs">
      <button 
        className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
        onClick={() => setActiveTab('overview')}
      >
        Overview
      </button>
      <button 
        className={`tab-button ${activeTab === 'playerGrades' ? 'active' : ''}`}
        onClick={() => setActiveTab('playerGrades')}
      >
        Player Grades
      </button>
      <button 
        className={`tab-button ${activeTab === 'efficiency' ? 'active' : ''}`}
        onClick={() => setActiveTab('efficiency')}
      >
        Efficiency Metrics
      </button>
      <button 
        className={`tab-button ${activeTab === 'drives' ? 'active' : ''}`}
        onClick={() => setActiveTab('drives')}
      >
        Drive Analysis
      </button>
    </div>
  );
  
  const renderOverview = () => {
    const { homeTeamStats, awayTeamStats } = advancedData;
    
    // Calculate percentages for visual display
    const totalYards = homeTeamStats.totalYards + awayTeamStats.totalYards;
    const homeYardsPercentage = Math.round((homeTeamStats.totalYards / totalYards) * 100) || 50;
    const awayYardsPercentage = 100 - homeYardsPercentage;
    
    const totalTime = homeTeamStats.timeOfPossession + awayTeamStats.timeOfPossession;
    const homePossessionPercentage = Math.round((homeTeamStats.timeOfPossession / totalTime) * 100) || 50;
    const awayPossessionPercentage = 100 - homePossessionPercentage;
    
    return (
      <div className="advanced-stats-overview">
        <h3 className="section-title">Team Statistics Comparison</h3>
        
        <div className="team-comparison-grid">
          {/* Team headers */}
          <div className="team-header home">
            <span className="team-name">{homeTeam}</span>
            <img src={homeLogo} alt={homeTeam} className="team-logo-small" />
          </div>
          <div className="stat-label-cell"></div>
          <div className="team-header away">
            <img src={awayLogo} alt={awayTeam} className="team-logo-small" />
            <span className="team-name">{awayTeam}</span>
          </div>
          
          {/* Total Yards */}
          <div className="stat-value home" style={{ backgroundColor: `${homeTeamColor}20` }}>
            {homeTeamStats.totalYards}
          </div>
          <div className="stat-label">Total Yards</div>
          <div className="stat-value away" style={{ backgroundColor: `${awayTeamColor}20` }}>
            {awayTeamStats.totalYards}
          </div>
          
          {/* Yards Bar */}
          <div className="full-width-cell">
            <div className="stat-bar">
              <div 
                className="stat-bar-segment home" 
                style={{ 
                  width: `${homeYardsPercentage}%`, 
                  backgroundColor: homeTeamColor 
                }}
              />
              <div 
                className="stat-bar-segment away" 
                style={{ 
                  width: `${awayYardsPercentage}%`, 
                  backgroundColor: awayTeamColor 
                }}
              />
            </div>
          </div>
          
          {/* Passing Yards */}
          <div className="stat-value home" style={{ backgroundColor: `${homeTeamColor}20` }}>
            {homeTeamStats.passingYards}
          </div>
          <div className="stat-label">Passing Yards</div>
          <div className="stat-value away" style={{ backgroundColor: `${awayTeamColor}20` }}>
            {awayTeamStats.passingYards}
          </div>
          
          {/* Rushing Yards */}
          <div className="stat-value home" style={{ backgroundColor: `${homeTeamColor}20` }}>
            {homeTeamStats.rushingYards}
          </div>
          <div className="stat-label">Rushing Yards</div>
          <div className="stat-value away" style={{ backgroundColor: `${awayTeamColor}20` }}>
            {awayTeamStats.rushingYards}
          </div>
          
          {/* First Downs */}
          <div className="stat-value home" style={{ backgroundColor: `${homeTeamColor}20` }}>
            {homeTeamStats.firstDowns}
          </div>
          <div className="stat-label">First Downs</div>
          <div className="stat-value away" style={{ backgroundColor: `${awayTeamColor}20` }}>
            {awayTeamStats.firstDowns}
          </div>
          
          {/* Third Down Efficiency */}
          <div className="stat-value home" style={{ backgroundColor: `${homeTeamColor}20` }}>
            {homeTeamStats.thirdDowns.conversions}/{homeTeamStats.thirdDowns.attempts} ({Math.round((homeTeamStats.thirdDowns.conversions / homeTeamStats.thirdDowns.attempts) * 100) || 0}%)
          </div>
          <div className="stat-label">Third Down</div>
          <div className="stat-value away" style={{ backgroundColor: `${awayTeamColor}20` }}>
            {awayTeamStats.thirdDowns.conversions}/{awayTeamStats.thirdDowns.attempts} ({Math.round((awayTeamStats.thirdDowns.conversions / awayTeamStats.thirdDowns.attempts) * 100) || 0}%)
          </div>
          
          {/* Red Zone Efficiency */}
          <div className="stat-value home" style={{ backgroundColor: `${homeTeamColor}20` }}>
            {homeTeamStats.redZone.conversions}/{homeTeamStats.redZone.attempts} ({Math.round((homeTeamStats.redZone.conversions / homeTeamStats.redZone.attempts) * 100) || 0}%)
          </div>
          <div className="stat-label">Red Zone</div>
          <div className="stat-value away" style={{ backgroundColor: `${awayTeamColor}20` }}>
            {awayTeamStats.redZone.conversions}/{awayTeamStats.redZone.attempts} ({Math.round((awayTeamStats.redZone.conversions / awayTeamStats.redZone.attempts) * 100) || 0}%)
          </div>
          
          {/* Turnovers */}
          <div className="stat-value home" style={{ backgroundColor: `${homeTeamColor}20` }}>
            {homeTeamStats.turnovers}
          </div>
          <div className="stat-label">Turnovers</div>
          <div className="stat-value away" style={{ backgroundColor: `${awayTeamColor}20` }}>
            {awayTeamStats.turnovers}
          </div>
          
          {/* Penalties */}
          <div className="stat-value home" style={{ backgroundColor: `${homeTeamColor}20` }}>
            {homeTeamStats.penalties.count}-{homeTeamStats.penalties.yards}
          </div>
          <div className="stat-label">Penalties</div>
          <div className="stat-value away" style={{ backgroundColor: `${awayTeamColor}20` }}>
            {awayTeamStats.penalties.count}-{awayTeamStats.penalties.yards}
          </div>
          
          {/* Explosive Plays */}
          <div className="stat-value home" style={{ backgroundColor: `${homeTeamColor}20` }}>
            {homeTeamStats.explosivePlays}
          </div>
          <div className="stat-label tooltip-container">
            Explosive Plays
            <span className="tooltip-text">Plays of 20+ yards</span>
          </div>
          <div className="stat-value away" style={{ backgroundColor: `${awayTeamColor}20` }}>
            {awayTeamStats.explosivePlays}
          </div>
          
          {/* Time of Possession */}
          <div className="stat-value home" style={{ backgroundColor: `${homeTeamColor}20` }}>
            {Math.floor(homeTeamStats.timeOfPossession)}:{Math.round((homeTeamStats.timeOfPossession % 1) * 60).toString().padStart(2, '0')}
          </div>
          <div className="stat-label">Time of Possession</div>
          <div className="stat-value away" style={{ backgroundColor: `${awayTeamColor}20` }}>
            {Math.floor(awayTeamStats.timeOfPossession)}:{Math.round((awayTeamStats.timeOfPossession % 1) * 60).toString().padStart(2, '0')}
          </div>
          
          {/* Possession Bar */}
          <div className="full-width-cell">
            <div className="possession-bar">
              <div 
                className="possession-segment home" 
                style={{ 
                  width: `${homePossessionPercentage}%`, 
                  backgroundColor: homeTeamColor 
                }}
              >
                {homePossessionPercentage}%
              </div>
              <div 
                className="possession-segment away" 
                style={{ 
                  width: `${awayPossessionPercentage}%`, 
                  backgroundColor: awayTeamColor 
                }}
              >
                {awayPossessionPercentage}%
              </div>
            </div>
          </div>
        </div>
        
        <div className="key-players-section">
          <h3 className="section-title">Key Performers</h3>
          
          <div className="key-players-container">
            <div className="team-key-players" style={{ borderColor: homeTeamColor }}>
              <div className="team-header-small">
                <img src={homeLogo} alt={homeTeam} className="team-logo-tiny" />
                <span className="team-name">{homeTeam} Key Players</span>
              </div>
              
              <div className="key-player-cards">
                {advancedData.keyPlayers[homeTeam].slice(0, 4).map((player, index) => (
                  <div 
                    key={index} 
                    className="key-player-card"
                    style={{ borderLeftColor: getGradeColor(player.grade) }}
                  >
                    <div className="player-name-position">
                      <span className="player-name">{player.name}</span>
                      <span className="player-position">{player.position}</span>
                    </div>
                    <div className="player-grade-container">
                      <div className="player-grade">
                        <span className="grade-value">{player.grade}</span>
                        <span className="grade-label">{getGradeDescription(player.grade)}</span>
                      </div>
                      <div className="player-key-stat">
                        {renderPlayerKeyStat(player)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="team-key-players" style={{ borderColor: awayTeamColor }}>
              <div className="team-header-small">
                <img src={awayLogo} alt={awayTeam} className="team-logo-tiny" />
                <span className="team-name">{awayTeam} Key Players</span>
              </div>
              
              <div className="key-player-cards">
                {advancedData.keyPlayers[awayTeam].slice(0, 4).map((player, index) => (
                  <div 
                    key={index} 
                    className="key-player-card"
                    style={{ borderLeftColor: getGradeColor(player.grade) }}
                  >
                    <div className="player-name-position">
                      <span className="player-name">{player.name}</span>
                      <span className="player-position">{player.position}</span>
                    </div>
                    <div className="player-grade-container">
                      <div className="player-grade">
                        <span className="grade-value">{player.grade}</span>
                        <span className="grade-label">{getGradeDescription(player.grade)}</span>
                      </div>
                      <div className="player-key-stat">
                        {renderPlayerKeyStat(player)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  const renderPlayerKeyStat = (player) => {
    if (!player.stats) return "No stats";
    
    // Based on position, show the most relevant stat
    switch (player.position) {
      case 'QB':
        if (player.stats.passing) {
          return `${player.stats.passing.completions || 0}/${player.stats.passing.attempts || 0}, ${player.stats.passing.yards || 0} yds, ${player.stats.passing.touchdowns || 0} TD`;
        }
        return "No passing stats";
        
      case 'RB':
        if (player.stats.rushing) {
          return `${player.stats.rushing.attempts || 0} car, ${player.stats.rushing.yards || 0} yds, ${player.stats.rushing.touchdowns || 0} TD`;
        }
        return "No rushing stats";
        
      case 'WR':
      case 'TE':
        if (player.stats.receiving) {
          return `${player.stats.receiving.receptions || 0} rec, ${player.stats.receiving.yards || 0} yds, ${player.stats.receiving.touchdowns || 0} TD`;
        }
        return "No receiving stats";
        
      case 'DL':
      case 'DE':
      case 'DT':
      case 'LB':
        if (player.stats.defense) {
          return `${player.stats.defense.tackles || 0} tkl, ${player.stats.defense.tacklesForLoss || 0} TFL, ${player.stats.defense.sacks || 0} sacks`;
        }
        return "No defensive stats";
        
      case 'CB':
      case 'S':
      case 'DB':
        if (player.stats.defense) {
          return `${player.stats.defense.tackles || 0} tkl, ${player.stats.defense.interceptions || 0} INT, ${player.stats.defense.passesDefended || 0} PD`;
        }
        return "No defensive stats";
        
      default:
        return "Stats N/A";
    }
  };
  
  const renderPlayerGrades = () => {
    // Filter players based on position
    const filteredPlayers = playerPositionFilter === 'all'
      ? playerStats
      : playerStats.filter(p => {
          if (playerPositionFilter === 'offense') {
            return ['QB', 'RB', 'WR', 'TE', 'OL'].includes(p.position);
          } else if (playerPositionFilter === 'defense') {
            return ['DL', 'DE', 'DT', 'LB', 'CB', 'S', 'DB'].includes(p.position);
          } else {
            return p.position === playerPositionFilter;
          }
        });
    
    // Sort players by grade descending
    const sortedPlayers = [...filteredPlayers].sort((a, b) => (b.grade || 0) - (a.grade || 0));
    
    return (
      <div className="player-grades-container">
        <div className="position-filter-buttons">
          <button 
            className={`position-button ${playerPositionFilter === 'all' ? 'active' : ''}`}
            onClick={() => setPlayerPositionFilter('all')}
          >
            All Positions
          </button>
          <button 
            className={`position-button ${playerPositionFilter === 'offense' ? 'active' : ''}`}
            onClick={() => setPlayerPositionFilter('offense')}
          >
            Offense
          </button>
          <button 
            className={`position-button ${playerPositionFilter === 'defense' ? 'active' : ''}`}
            onClick={() => setPlayerPositionFilter('defense')}
          >
            Defense
          </button>
          <button 
            className={`position-button ${playerPositionFilter === 'QB' ? 'active' : ''}`}
            onClick={() => setPlayerPositionFilter('QB')}
          >
            QB
          </button>
          <button 
            className={`position-button ${playerPositionFilter === 'RB' ? 'active' : ''}`}
            onClick={() => setPlayerPositionFilter('RB')}
          >
            RB
          </button>
          <button 
            className={`position-button ${playerPositionFilter === 'WR' ? 'active' : ''}`}
            onClick={() => setPlayerPositionFilter('WR')}
          >
            WR/TE
          </button>
          <button 
            className={`position-button ${playerPositionFilter === 'DL' ? 'active' : ''}`}
            onClick={() => setPlayerPositionFilter('DL')}
          >
            DL
          </button>
          <button 
            className={`position-button ${playerPositionFilter === 'LB' ? 'active' : ''}`}
            onClick={() => setPlayerPositionFilter('LB')}
          >
            LB
          </button>
          <button 
            className={`position-button ${playerPositionFilter === 'DB' ? 'active' : ''}`}
            onClick={() => setPlayerPositionFilter('DB')}
          >
            DB
          </button>
        </div>
        
        <div className="player-grades-table-container">
          <table className="player-grades-table">
            <thead>
              <tr>
                <th className="grade-column">Grade</th>
                <th>Player</th>
                <th>Pos</th>
                <th>Team</th>
                <th>Key Stats</th>
                <th className="ppa-column tooltip-container">
                  PPA
                  <span className="tooltip-text">Predicted Points Added</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedPlayers.map((player, index) => (
                <tr 
                  key={index}
                  className={player.team === homeTeam ? 'home-team-row' : 'away-team-row'}
                >
                  <td 
                    className="grade-cell"
                    style={{ 
                      backgroundColor: getGradeColor(player.grade),
                      color: player.grade >= 60 ? 'white' : 'black'
                    }}
                  >
                    <div className="grade-value">{player.grade}</div>
                    <div className="grade-text">{getGradeDescription(player.grade)}</div>
                  </td>
                  <td>{player.name}</td>
                  <td>{player.position}</td>
                  <td>
                    <div className="team-cell">
                      <img 
                        src={player.team === homeTeam ? homeLogo : awayLogo} 
                        alt={player.team} 
                        className="team-logo-tiny" 
                      />
                      <span>{player.team}</span>
                    </div>
                  </td>
                  <td className="key-stats-cell">{renderPlayerKeyStat(player)}</td>
                  <td className="ppa-cell">{player.ppa ? player.ppa.toFixed(2) : 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="grading-scale-explainer">
          <h4>Player Grading Scale</h4>
          <div className="grade-scale-container">
            <div className="grade-scale-item">
              <div className="grade-scale-color" style={{ backgroundColor: "#2ecc71" }}></div>
              <div className="grade-scale-text">90-100: Elite</div>
            </div>
            <div className="grade-scale-item">
              <div className="grade-scale-color" style={{ backgroundColor: "#27ae60" }}></div>
              <div className="grade-scale-text">80-89: Excellent</div>
            </div>
            <div className="grade-scale-item">
              <div className="grade-scale-color" style={{ backgroundColor: "#3498db" }}></div>
              <div className="grade-scale-text">70-79: Very Good</div>
            </div>
            <div className="grade-scale-item">
              <div className="grade-scale-color" style={{ backgroundColor: "#2980b9" }}></div>
              <div className="grade-scale-text">60-69: Above Average</div>
            </div>
            <div className="grade-scale-item">
              <div className="grade-scale-color" style={{ backgroundColor: "#f1c40f" }}></div>
              <div className="grade-scale-text">50-59: Average</div>
            </div>
            <div className="grade-scale-item">
              <div className="grade-scale-color" style={{ backgroundColor: "#e67e22" }}></div>
              <div className="grade-scale-text">40-49: Below Average</div>
            </div>
            <div className="grade-scale-item">
              <div className="grade-scale-color" style={{ backgroundColor: "#e74c3c" }}></div>
              <div className="grade-scale-text">30-39: Poor</div>
            </div>
            <div className="grade-scale-item">
              <div className="grade-scale-color" style={{ backgroundColor: "#c0392b" }}></div>
              <div className="grade-scale-text">0-29: Very Poor</div>
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  const renderEfficiencyMetrics = () => {
    const { homeTeamStats, awayTeamStats } = advancedData;
    
    return (
      <div className="efficiency-metrics-container">
        <div className="efficiency-explainer">
          <h4>Advanced Efficiency Metrics</h4>
          <p>
            These metrics measure how well each team performs relative to expected outcomes. 
            Offensive and defensive efficiency indicate the percentage of successful plays. 
            PPA (Predicted Points Added) shows how much each unit contributes to scoring.
          </p>
        </div>
        
        <div className="efficiency-grid">
          <div className="efficiency-column home" style={{ borderColor: homeTeamColor }}>
            <div className="team-header-small">
              <img src={homeLogo} alt={homeTeam} className="team-logo-tiny" />
              <span className="team-name">{homeTeam}</span>
            </div>
            
            <div className="efficiency-metric">
              <div className="efficiency-header">
                <span className="metric-name">Offensive Efficiency</span>
                <span className="metric-value">{(homeTeamStats.efficiency.offensive * 100).toFixed(1)}%</span>
              </div>
              <div className="progress-bar-container">
                <div 
                  className="progress-bar" 
                  style={{ 
                    width: `${homeTeamStats.efficiency.offensive * 100}%`,
                    backgroundColor: homeTeamColor
                  }}
                ></div>
              </div>
              <div className="metric-explainer">Percentage of plays that were successful based on down and distance</div>
            </div>
            
            <div className="efficiency-metric">
              <div className="efficiency-header">
                <span className="metric-name">Defensive Efficiency</span>
                <span className="metric-value">{(homeTeamStats.efficiency.defensive * 100).toFixed(1)}%</span>
              </div>
              <div className="progress-bar-container">
                <div 
                  className="progress-bar" 
                  style={{ 
                    width: `${homeTeamStats.efficiency.defensive * 100}%`,
                    backgroundColor: homeTeamColor
                  }}
                ></div>
              </div>
              <div className="metric-explainer">Percentage of opponent plays that were stopped successfully</div>
            </div>
            
            <div className="efficiency-metric">
              <div className="efficiency-header">
                <span className="metric-name">Passing Success Rate</span>
                <span className="metric-value">{(homeTeamStats.efficiency.passingSuccess * 100).toFixed(1)}%</span>
              </div>
              <div className="progress-bar-container">
                <div 
                  className="progress-bar" 
                  style={{ 
                    width: `${homeTeamStats.efficiency.passingSuccess * 100}%`,
                    backgroundColor: homeTeamColor
                  }}
                ></div>
              </div>
              <div className="metric-explainer">Percentage of passing plays that were successful</div>
            </div>
            
            <div className="efficiency-metric">
              <div className="efficiency-header">
                <span className="metric-name">Rushing Success Rate</span>
                <span className="metric-value">{(homeTeamStats.efficiency.rushingSuccess * 100).toFixed(1)}%</span>
              </div>
              <div className="progress-bar-container">
                <div 
                  className="progress-bar" 
                  style={{ 
                    width: `${homeTeamStats.efficiency.rushingSuccess * 100}%`,
                    backgroundColor: homeTeamColor
                  }}
                ></div>
              </div>
              <div className="metric-explainer">Percentage of rushing plays that were successful</div>
            </div>
            
            <div className="ppa-container">
              <h4>Predicted Points Added (PPA)</h4>
              
              <div className="ppa-metric">
                <span className="ppa-label">Total PPA</span>
                <span className="ppa-value" style={{ color: homeTeamStats.ppa.total >= 0 ? '#27ae60' : '#e74c3c' }}>
                  {homeTeamStats.ppa.total.toFixed(2)}
                </span>
              </div>
              
              <div className="ppa-metric">
                <span className="ppa-label">Passing PPA</span>
                <span className="ppa-value" style={{ color: homeTeamStats.ppa.passing >= 0 ? '#27ae60' : '#e74c3c' }}>
                  {homeTeamStats.ppa.passing.toFixed(2)}
                </span>
              </div>
              
              <div className="ppa-metric">
                <span className="ppa-label">Rushing PPA</span>
                <span className="ppa-value" style={{ color: homeTeamStats.ppa.rushing >= 0 ? '#27ae60' : '#e74c3c' }}>
                  {homeTeamStats.ppa.rushing.toFixed(2)}
                </span>
              </div>
              
              <div className="ppa-metric">
                <span className="ppa-label">Defensive PPA</span>
                <span className="ppa-value" style={{ color: homeTeamStats.ppa.defense <= 0 ? '#27ae60' : '#e74c3c' }}>
                  {homeTeamStats.ppa.defense.toFixed(2)}
                </span>
                <span className="metric-note">(Negative is better for defense)</span>
              </div>
            </div>
          </div>
          
          <div className="efficiency-column away" style={{ borderColor: awayTeamColor }}>
            <div className="team-header-small">
              <img src={awayLogo} alt={awayTeam} className="team-logo-tiny" />
              <span className="team-name">{awayTeam}</span>
            </div>
            
            <div className="efficiency-metric">
              <div className="efficiency-header">
                <span className="metric-name">Offensive Efficiency</span>
                <span className="metric-value">{(awayTeamStats.efficiency.offensive * 100).toFixed(1)}%</span>
              </div>
              <div className="progress-bar-container">
                <div 
                  className="progress-bar" 
                  style={{ 
                    width: `${awayTeamStats.efficiency.offensive * 100}%`,
                    backgroundColor: awayTeamColor
                  }}
                ></div>
              </div>
              <div className="metric-explainer">Percentage of plays that were successful based on down and distance</div>
            </div>
            
            <div className="efficiency-metric">
              <div className="efficiency-header">
                <span className="metric-name">Defensive Efficiency</span>
                <span className="metric-value">{(awayTeamStats.efficiency.defensive * 100).toFixed(1)}%</span>
              </div>
              <div className="progress-bar-container">
                <div 
                  className="progress-bar" 
                  style={{ 
                    width: `${awayTeamStats.efficiency.defensive * 100}%`,
                    backgroundColor: awayTeamColor
                  }}
                ></div>
              </div>
              <div className="metric-explainer">Percentage of opponent plays that were stopped successfully</div>
            </div>
            
            <div className="efficiency-metric">
              <div className="efficiency-header">
                <span className="metric-name">Passing Success Rate</span>
                <span className="metric-value">{(awayTeamStats.efficiency.passingSuccess * 100).toFixed(1)}%</span>
              </div>
              <div className="progress-bar-container">
                <div 
                  className="progress-bar" 
                  style={{ 
                    width: `${awayTeamStats.efficiency.passingSuccess * 100}%`,
                    backgroundColor: awayTeamColor
                  }}
                ></div>
              </div>
              <div className="metric-explainer">Percentage of passing plays that were successful</div>
            </div>
            
            <div className="efficiency-metric">
              <div className="efficiency-header">
                <span className="metric-name">Rushing Success Rate</span>
                <span className="metric-value">{(awayTeamStats.efficiency.rushingSuccess * 100).toFixed(1)}%</span>
              </div>
              <div className="progress-bar-container">
                <div 
                  className="progress-bar" 
                  style={{ 
                    width: `${awayTeamStats.efficiency.rushingSuccess * 100}%`,
                    backgroundColor: awayTeamColor
                  }}
                ></div>
              </div>
              <div className="metric-explainer">Percentage of rushing plays that were successful</div>
            </div>
            
            <div className="ppa-container">
              <h4>Predicted Points Added (PPA)</h4>
              
              <div className="ppa-metric">
                <span className="ppa-label">Total PPA</span>
                <span className="ppa-value" style={{ color: awayTeamStats.ppa.total >= 0 ? '#27ae60' : '#e74c3c' }}>
                  {awayTeamStats.ppa.total.toFixed(2)}
                </span>
              </div>
              
              <div className="ppa-metric">
                <span className="ppa-label">Passing PPA</span>
                <span className="ppa-value" style={{ color: awayTeamStats.ppa.passing >= 0 ? '#27ae60' : '#e74c3c' }}>
                  {awayTeamStats.ppa.passing.toFixed(2)}
                </span>
              </div>
              
              <div className="ppa-metric">
                <span className="ppa-label">Rushing PPA</span>
                <span className="ppa-value" style={{ color: awayTeamStats.ppa.rushing >= 0 ? '#27ae60' : '#e74c3c' }}>
                  {awayTeamStats.ppa.rushing.toFixed(2)}
                </span>
              </div>
              
              <div className="ppa-metric">
                <span className="ppa-label">Defensive PPA</span>
                <span className="ppa-value" style={{ color: awayTeamStats.ppa.defense <= 0 ? '#27ae60' : '#e74c3c' }}>
                  {awayTeamStats.ppa.defense.toFixed(2)}
                </span>
                <span className="metric-note">(Negative is better for defense)</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="ppa-explainer">
          <h4>Understanding PPA (Predicted Points Added)</h4>
          <p>
            PPA measures the point value a player/team adds or subtracts on a given play compared to the
            expected outcome based on down, distance, and field position. Positive values indicate contributions
            toward scoring, while negative values indicate the opposite. For defensive metrics, negative values
            are better as they represent preventing the opponent from scoring.
          </p>
        </div>
      </div>
    );
  };
  
  const renderDriveAnalysis = () => {
    const { drives } = advancedData;
    
    // Group drives by quarter
    const drivesByQuarter = {};
    drives.forEach(drive => {
      if (!drivesByQuarter[drive.quarter]) {
        drivesByQuarter[drive.quarter] = [];
      }
      drivesByQuarter[drive.quarter].push(drive);
    });
    
    return (
      <div className="drive-analysis-container">
        <h3 className="section-title">Drive Analysis</h3>
        
        {Object.keys(drivesByQuarter).map(quarter => (
          <div key={quarter} className="quarter-drives">
            <h4 className="quarter-header">Quarter {quarter}</h4>
            
            <div className="drives-list">
              {drivesByQuarter[quarter].map((drive, index) => (
                <div 
                  key={index} 
                  className="drive-item"
                  style={{ 
                    borderLeftColor: drive.team === homeTeam ? homeTeamColor : awayTeamColor,
                    backgroundColor: drive.team === homeTeam ? `${homeTeamColor}10` : `${awayTeamColor}10`
                  }}
                >
                  <div className="drive-team">
                    <img 
                      src={drive.team === homeTeam ? homeLogo : awayLogo} 
                      alt={drive.team} 
                      className="team-logo-tiny" 
                    />
                    <span>{drive.team}</span>
                  </div>
                  
                  <div className="drive-details">
                    <div className="drive-detail">
                      <span className="detail-label">Result:</span>
                      <span 
                        className={`detail-value ${drive.result === 'Touchdown' || drive.result === 'Field Goal' ? 'success' : drive.result === 'Turnover' || drive.result === 'Turnover on Downs' ? 'failure' : ''}`}
                      >
                        {drive.result}
                      </span>
                    </div>
                    
                    <div className="drive-stats">
                      <div className="drive-stat">
                        <span className="stat-label">Plays:</span>
                        <span className="stat-value">{drive.plays}</span>
                      </div>
                      
                      <div className="drive-stat">
                        <span className="stat-label">Yards:</span>
                        <span className="stat-value">{drive.yards}</span>
                      </div>
                      
                      <div className="drive-stat">
                        <span className="stat-label">Start:</span>
                        <span className="stat-value">{drive.startPosition}</span>
                      </div>
                      
                      <div className="drive-stat">
                        <span className="stat-label">Time:</span>
                        <span className="stat-value">{drive.timeOfPossession}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
        
        <div className="drive-summary">
          <h4>Drive Summary Analysis</h4>
          
          {/* Calculate drive success rate */}
          {(() => {
            const homeDrives = drives.filter(d => d.team === homeTeam);
            const awayDrives = drives.filter(d => d.team === awayTeam);
            
            const homeSuccessfulDrives = homeDrives.filter(d => 
              d.result === 'Touchdown' || d.result === 'Field Goal'
            ).length;
            
            const awaySuccessfulDrives = awayDrives.filter(d => 
              d.result === 'Touchdown' || d.result === 'Field Goal'
            ).length;
            
            const homeSuccessRate = homeDrives.length > 0 
              ? (homeSuccessfulDrives / homeDrives.length * 100).toFixed(1) 
              : 0;
              
            const awaySuccessRate = awayDrives.length > 0 
              ? (awaySuccessfulDrives / awayDrives.length * 100).toFixed(1) 
              : 0;
            
            return (
              <div className="drive-success-rates">
                <div className="team-rate" style={{ borderColor: homeTeamColor }}>
                  <div className="team-header-small">
                    <img src={homeLogo} alt={homeTeam} className="team-logo-tiny" />
                    <span>{homeTeam}</span>
                  </div>
                  <div className="rate-values">
                    <div className="rate-value">{homeSuccessRate}%</div>
                    <div className="rate-label">Drive Success Rate</div>
                    <div className="rate-detail">
                      {homeSuccessfulDrives} scoring drives out of {homeDrives.length} total drives
                    </div>
                  </div>
                </div>
                
                <div className="team-rate" style={{ borderColor: awayTeamColor }}>
                  <div className="team-header-small">
                    <img src={awayLogo} alt={awayTeam} className="team-logo-tiny" />
                    <span>{awayTeam}</span>
                  </div>
                  <div className="rate-values">
                    <div className="rate-value">{awaySuccessRate}%</div>
                    <div className="rate-label">Drive Success Rate</div>
                    <div className="rate-detail">
                      {awaySuccessfulDrives} scoring drives out of {awayDrives.length} total drives
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
          
          {/* Calculate average drive length, plays, yards */}
          {(() => {
            const homeDrives = drives.filter(d => d.team === homeTeam);
            const awayDrives = drives.filter(d => d.team === awayTeam);
            
            // Average drive yards
            const homeAvgYards = homeDrives.length > 0
              ? homeDrives.reduce((sum, d) => sum + d.yards, 0) / homeDrives.length
              : 0;
              
            const awayAvgYards = awayDrives.length > 0
              ? awayDrives.reduce((sum, d) => sum + d.yards, 0) / awayDrives.length
              : 0;
            
            // Average drive plays
            const homeAvgPlays = homeDrives.length > 0
              ? homeDrives.reduce((sum, d) => sum + d.plays, 0) / homeDrives.length
              : 0;
              
            const awayAvgPlays = awayDrives.length > 0
              ? awayDrives.reduce((sum, d) => sum + d.plays, 0) / awayDrives.length
              : 0;
            
            return (
              <div className="drive-averages">
                <h5>Average Drive Statistics</h5>
                
                <div className="averages-container">
                  <div className="average-stat">
                    <div className="stat-header">Avg. Yards per Drive</div>
                    <div className="team-values">
                      <div className="team-value" style={{ color: homeTeamColor }}>
                        <span className="team-abbr">{homeTeam}:</span>
                        <span className="value">{homeAvgYards.toFixed(1)}</span>
                      </div>
                      <div className="team-value" style={{ color: awayTeamColor }}>
                        <span className="team-abbr">{awayTeam}:</span>
                        <span className="value">{awayAvgYards.toFixed(1)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="average-stat">
                    <div className="stat-header">Avg. Plays per Drive</div>
                    <div className="team-values">
                      <div className="team-value" style={{ color: homeTeamColor }}>
                        <span className="team-abbr">{homeTeam}:</span>
                        <span className="value">{homeAvgPlays.toFixed(1)}</span>
                      </div>
                      <div className="team-value" style={{ color: awayTeamColor }}>
                        <span className="team-abbr">{awayTeam}:</span>
                        <span className="value">{awayAvgPlays.toFixed(1)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="average-stat">
                    <div className="stat-header">Yards per Play</div>
                    <div className="team-values">
                      <div className="team-value" style={{ color: homeTeamColor }}>
                        <span className="team-abbr">{homeTeam}:</span>
                        <span className="value">
                          {(homeAvgYards / homeAvgPlays).toFixed(1) || 0}
                        </span>
                      </div>
                      <div className="team-value" style={{ color: awayTeamColor }}>
                        <span className="team-abbr">{awayTeam}:</span>
                        <span className="value">
                          {(awayAvgYards / awayAvgPlays).toFixed(1) || 0}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      </div>
    );
  };
  
  return (
    <div className="advanced-statistics-container">
      {renderTabs()}
      
      <div className="advanced-stats-content">
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'playerGrades' && renderPlayerGrades()}
        {activeTab === 'efficiency' && renderEfficiencyMetrics()}
        {activeTab === 'drives' && renderDriveAnalysis()}
      </div>
    </div>
  );
};

export default AdvancedStatistics;