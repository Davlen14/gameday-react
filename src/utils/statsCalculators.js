// Utility functions for stats calculations

// Helper function to parse stat values which may be strings
export const parseStatValue = (statValue) => {
  if (typeof statValue === 'number') return statValue;
  if (!statValue) return 0;
  
  // Handle fractions like "4/4"
  if (statValue.includes('/')) {
    const [made, attempted] = statValue.split('/');
    return {
      completions: parseInt(made, 10) || 0,
      attempts: parseInt(attempted, 10) || 0
    };
  }
  
  // Try to parse as a number
  const parsed = parseFloat(statValue);
  return isNaN(parsed) ? statValue : parsed;
};

// Infer position based on category and stat name
export const inferPositionFromCategory = (category, statName) => {
  switch (category.toLowerCase()) {
    case 'passing':
      return 'QB';
    case 'rushing':
      return 'RB';
    case 'receiving':
      return 'WR';
    case 'defensive':
      return 'DB';
    case 'kicking':
      return 'K';
    case 'punting':
      return 'P';
    case 'interceptions':
      return 'DB';
    case 'puntreturns':
    case 'kickreturns':
      return 'WR';
    default:
      return '';
  }
};

// Position-specific grade calculations
export const calculateQuarterbackGrade = (player, ppaData) => {
  let grade = 50; // Base grade
  
  if (player.stats.passing) {
    let completions = 0, attempts = 0, yards = 0, touchdowns = 0, interceptions = 0;
    
    // Handle C/ATT format (e.g., "10/16")
    if (player.stats.passing.c_att || player.stats.passing['c/att']) {
      const completionString = player.stats.passing.c_att || player.stats.passing['c/att'];
      const parts = completionString.toString().split('/');
      completions = parseInt(parts[0], 10) || 0;
      attempts = parseInt(parts[1], 10) || 0;
    } else {
      completions = player.stats.passing.completions || 0;
      attempts = player.stats.passing.attempts || 0;
    }
    
    // Handle various field names for yards, touchdowns, and interceptions
    yards = player.stats.passing.yards || player.stats.passing.yds || 0;
    touchdowns = player.stats.passing.touchdowns || player.stats.passing.td || 0;
    interceptions = player.stats.passing.interceptions || player.stats.passing.int || 0;
    
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

export const calculateRunningBackGrade = (player, ppaData) => {
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

export const calculateReceiverGrade = (player, ppaData) => {
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

export const calculateDefensiveLineGrade = (player, ppaData) => {
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

export const calculateLinebackerGrade = (player, ppaData) => {
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

export const calculateDefensiveBackGrade = (player, ppaData) => {
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

// Main player grade calculation
export const calculatePlayerGrade = (player, ppaData) => {
  // Default grade components and weights
  let grade = 50; // Base grade (average)
  const ppaWeight = 10; // Weight for PPA contribution
  
  if (!player.stats) return grade;
  
  // Apply position-specific grading
  switch (player.position) {
    case 'QB':return calculateQuarterbackGrade(player, ppaData);
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

// Helper function to estimate total plays
export const estimateTotalPlays = (teamStats, teamPlayers) => {
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
export const calculateOffensiveEfficiency = (teamStats, teamPlayers) => {
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
export const calculateDefensiveEfficiency = (teamStats, teamPlayers) => {
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
export const calculatePassingSuccessRate = (teamStats, teamPlayers) => {
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
export const calculateRushingSuccessRate = (teamStats, teamPlayers) => {
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

// Calculate team statistics
export const calculateTeamStats = (players, teamName, gameData, homeTeam) => {
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

// Create empty team stats object for fallback
export const calculateEmptyTeamStats = () => ({
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

// Process drive data
export const processDriveData = (drivesData, homeTeam, awayTeam) => {
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
export const getKeyPlayers = (players, teamName) => {
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
export const getGradeDescription = (grade) => {
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
export const getGradeColor = (grade) => {
  if (grade >= 90) return "#2ecc71"; // Green
  if (grade >= 80) return "#27ae60"; // Dark Green
  if (grade >= 70) return "#3498db"; // Blue
  if (grade >= 60) return "#2980b9"; // Dark Blue
  if (grade >= 50) return "#f1c40f"; // Yellow
  if (grade >= 40) return "#e67e22"; // Orange
  if (grade >= 30) return "#e74c3c"; // Red
  return "#c0392b"; // Dark Red
};

// Get player key stats based on position
export const renderPlayerKeyStat = (player) => {
  if (!player.stats) return "No stats";
  
  // Based on position, show the most relevant stat
  switch (player.position) {
    case 'QB':
      if (player.stats.passing) {
        // Get completions/attempts - might be stored as c/att or individually
        let completions, attempts, yards, touchdowns;
        
        if (player.stats.passing.c_att || player.stats.passing['c/att']) {
          const completionString = player.stats.passing.c_att || player.stats.passing['c/att'];
          const parts = completionString.toString().split('/');
          completions = parts[0];
          attempts = parts[1];
        } else {
          completions = player.stats.passing.completions || 0;
          attempts = player.stats.passing.attempts || 0;
        }
        
        yards = player.stats.passing.yards || player.stats.passing.yds || 0;
        touchdowns = player.stats.passing.touchdowns || player.stats.passing.td || 0;
        
        return `${completions}/${attempts}, ${yards} yds, ${touchdowns} TD`;
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

// Process player statistics and extract meaningful player stats
export const processPlayerStats = (playersData, ppaData) => {
  if (!playersData || !Array.isArray(playersData) || playersData.length === 0) return [];
  
  // Extract the actual player stats from the nested JSON structure
  let allPlayers = [];
  
  // Check if we're dealing with the API data structure from the JSON
  if (playersData[0]?.teams && Array.isArray(playersData[0].teams)) {
    // Loop through each game
    playersData.forEach(game => {
      // Loop through each team in the game
      game.teams.forEach(teamData => {
        const teamName = teamData.team;
        const conference = teamData.conference;
        const isHome = teamData.homeAway === 'home';
        
        // Loop through each category (passing, rushing, etc.)
        if (teamData.categories && Array.isArray(teamData.categories)) {
          teamData.categories.forEach(category => {
            const categoryName = category.name;
            
            // Loop through each stat type in the category
            if (category.types && Array.isArray(category.types)) {
              category.types.forEach(type => {
                const statName = type.name;
                
                // Loop through each athlete for this stat
                if (type.athletes && Array.isArray(type.athletes)) {
                  type.athletes.forEach(athlete => {
                    // Find if this player already exists in our processed list
                    let existingPlayer = allPlayers.find(p => p.id === athlete.id);
                    
                    if (!existingPlayer) {
                      // Create a new player entry
                      existingPlayer = {
                        id: athlete.id,
                        name: athlete.name,
                        team: teamName,
                        conference: conference,
                        homeAway: teamData.homeAway,
                        position: inferPositionFromCategory(categoryName, statName),
                        stats: {}
                      };
                      allPlayers.push(existingPlayer);
                    }
                    
                    // Ensure the category exists in the player's stats
                    if (!existingPlayer.stats[categoryName]) {
                      existingPlayer.stats[categoryName] = {};
                    }
                    
                    // Add or update the stat
                    existingPlayer.stats[categoryName][statName.toLowerCase()] = parseStatValue(athlete.stat);
                  });
                }
              });
            }
          });
        }
      });
    });
  } else {
    // Handle other data formats if any
    allPlayers = playersData;
  }
  
  // Process each player with PPA data and calculate grades
  return allPlayers.map(player => {
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

export default {
  parseStatValue,
  inferPositionFromCategory,
  calculatePlayerGrade,
  calculateTeamStats,
  processDriveData,
  getKeyPlayers,
  getGradeDescription,
  getGradeColor,
  renderPlayerKeyStat,
  processPlayerStats,
  calculateEmptyTeamStats
};