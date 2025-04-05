// Utility functions for stats calculations

// ----------------------------------------------------------------------------
// Parsing Helpers
// ----------------------------------------------------------------------------

/**
 * Parses a stat value that may be a number, string, or fraction (e.g., "10/16").
 * Returns a number, or an object with { completions, attempts } for fractions.
 */
export const parseStatValue = (statValue) => {
  if (typeof statValue === "number") return statValue;
  if (!statValue) return 0;
  if (statValue.includes("/")) {
    const [made, attempted] = statValue.split("/");
    return {
      completions: parseInt(made, 10) || 0,
      attempts: parseInt(attempted, 10) || 0,
    };
  }
  const parsed = parseFloat(statValue);
  return isNaN(parsed) ? statValue : parsed;
};

/**
 * Infers an athlete's position based on the statistical category and type.
 */
export const inferPositionFromCategory = (category, statName) => {
  switch (category.toLowerCase()) {
    case "passing":
      return "QB";
    case "rushing":
      return "RB";
    case "receiving":
      return "WR";
    case "defensive":
      return "DB";
    case "kicking":
      return "K";
    case "punting":
      return "P";
    case "interceptions":
      return "DB";
    case "puntreturns":
    case "kickreturns":
      return "WR";
    default:
      return "";
  }
};

// ----------------------------------------------------------------------------
// Position-Specific Grade Calculations
// ----------------------------------------------------------------------------

export const calculateQuarterbackGrade = (player, ppaData) => {
  let grade = 50;
  if (player.stats.passing) {
    let completions = 0, attempts = 0, yards = 0, touchdowns = 0, interceptions = 0;
    if (player.stats.passing.c_att || player.stats.passing["c/att"]) {
      const parts = (player.stats.passing.c_att || player.stats.passing["c/att"])
        .toString()
        .split("/");
      completions = parseInt(parts[0], 10) || 0;
      attempts = parseInt(parts[1], 10) || 0;
    } else {
      completions = player.stats.passing.completions || 0;
      attempts = player.stats.passing.attempts || 0;
    }
    yards = player.stats.passing.yards || player.stats.passing.yds || 0;
    touchdowns = player.stats.passing.touchdowns || player.stats.passing.td || 0;
    interceptions = player.stats.passing.interceptions || player.stats.passing.int || 0;
    if (attempts > 0) {
      const completionPct = (completions / attempts) * 100;
      if (completionPct < 50) grade -= 10;
      else if (completionPct >= 70) grade += 15;
      else if (completionPct >= 60) grade += 10;
    }
    if (attempts > 0) {
      const ypa = yards / attempts;
      if (ypa < 6) grade -= 5;
      else if (ypa > 10) grade += 10;
      else if (ypa > 8) grade += 5;
    }
    if (interceptions === 0 && touchdowns > 0) {
      grade += 10 + Math.min(5, touchdowns);
    } else if (interceptions > 0) {
      const tdIntRatio = touchdowns / interceptions;
      if (tdIntRatio < 1) grade -= 10;
      else if (tdIntRatio > 3) grade += 10;
      else if (tdIntRatio > 2) grade += 5;
    }
    grade += Math.min(5, touchdowns);
    grade -= Math.min(21, interceptions * 7);
  }
  if (player.stats.rushing) {
    const rushYards = player.stats.rushing.yards || 0;
    const rushTDs = player.stats.rushing.touchdowns || 0;
    if (rushYards > 50) grade += 5;
    else if (rushYards > 25) grade += 3;
    grade += Math.min(5, rushTDs * 2);
  }
  if (ppaData && ppaData.ppa) {
    const ppaContribution = Math.min(15, Math.max(-10, ppaData.ppa * 10));
    grade += ppaContribution;
  }
  return Math.min(100, Math.max(0, Math.round(grade)));
};

export const calculateRunningBackGrade = (player, ppaData) => {
  let grade = 50;
  if (player.stats.rushing) {
    const { attempts, yards, touchdowns } = player.stats.rushing;
    if (attempts > 0) {
      const ypc = yards / attempts;
      if (ypc < 3) grade -= 10;
      else if (ypc > 5) grade += 15;
      else if (ypc > 4) grade += 7;
    }
    if (yards < 30) grade -= 5;
    else if (yards > 100) grade += 10;
    else if (yards > 75) grade += 5;
    grade += Math.min(15, touchdowns * 5);
  }
  if (player.stats.receiving) {
    const recYards = player.stats.receiving.yards || 0;
    const recTDs = player.stats.receiving.touchdowns || 0;
    if (recYards > 50) grade += 10;
    else if (recYards > 25) grade += 5;
    grade += Math.min(10, recTDs * 5);
  }
  if (ppaData && ppaData.ppa) {
    const ppaContribution = Math.min(15, Math.max(-10, ppaData.ppa * 10));
    grade += ppaContribution;
  }
  return Math.min(100, Math.max(0, Math.round(grade)));
};

export const calculateReceiverGrade = (player, ppaData) => {
  let grade = 50;
  if (player.stats.receiving) {
    const { receptions, yards, touchdowns, targets } = player.stats.receiving;
    if (receptions > 0) {
      const ypr = yards / receptions;
      if (ypr < 8) grade -= 5;
      else if (ypr > 16) grade += 15;
      else if (ypr > 12) grade += 7;
    }
    if (yards < 30) grade -= 5;
    else if (yards > 100) grade += 10;
    else if (yards > 60) grade += 5;
    grade += Math.min(21, touchdowns * 7);
    if (targets > 0) {
      const catchRate = receptions / targets;
      if (catchRate < 0.5) grade -= 5;
      else if (catchRate > 0.8) grade += 10;
      else if (catchRate > 0.65) grade += 5;
    }
  }
  if (ppaData && ppaData.ppa) {
    const ppaContribution = Math.min(15, Math.max(-10, ppaData.ppa * 10));
    grade += ppaContribution;
  }
  return Math.min(100, Math.max(0, Math.round(grade)));
};

export const calculateDefensiveLineGrade = (player, ppaData) => {
  let grade = 50;
  if (player.stats.defense) {
    const { tackles, tacklesForLoss, sacks } = player.stats.defense;
    const totalTackles = tackles || 0;
    const tfl = tacklesForLoss || 0;
    const sackCount = sacks || 0;
    if (totalTackles > 5) grade += 5;
    else if (totalTackles > 2) grade += 3;
    grade += Math.min(15, tfl * 5);
    grade += Math.min(20, sackCount * 10);
  }
  if (ppaData && ppaData.ppa) {
    const ppaContribution = Math.min(20, Math.max(-10, -ppaData.ppa * 15));
    grade += ppaContribution;
  }
  return Math.min(100, Math.max(0, Math.round(grade)));
};

export const calculateLinebackerGrade = (player, ppaData) => {
  let grade = 50;
  if (player.stats.defense) {
    const { tackles, tacklesForLoss, sacks, interceptions, passesDefended } = player.stats.defense;
    const totalTackles = tackles || 0;
    const tfl = tacklesForLoss || 0;
    const sackCount = sacks || 0;
    const ints = interceptions || 0;
    const pbus = passesDefended || 0;
    if (totalTackles < 4) grade -= 5;
    else if (totalTackles > 12) grade += 10;
    else if (totalTackles > 8) grade += 5;
    grade += Math.min(12, tfl * 3);
    grade += Math.min(14, sackCount * 7);
    grade += Math.min(30, ints * 15);
    grade += Math.min(9, pbus * 3);
  }
  if (ppaData && ppaData.ppa) {
    const ppaContribution = Math.min(20, Math.max(-10, -ppaData.ppa * 15));
    grade += ppaContribution;
  }
  return Math.min(100, Math.max(0, Math.round(grade)));
};

export const calculateDefensiveBackGrade = (player, ppaData) => {
  let grade = 50;
  if (player.stats.defense) {
    const { tackles, interceptions, passesDefended } = player.stats.defense;
    const totalTackles = tackles || 0;
    const ints = interceptions || 0;
    const pbus = passesDefended || 0;
    if (totalTackles < 3) grade -= 3;
    else if (totalTackles > 10) grade += 5;
    else if (totalTackles > 7) grade += 3;
    grade += Math.min(30, ints * 15);
    grade += Math.min(20, pbus * 5);
  }
  if (ppaData && ppaData.ppa) {
    const ppaContribution = Math.min(20, Math.max(-10, -ppaData.ppa * 15));
    grade += ppaContribution;
  }
  return Math.min(100, Math.max(0, Math.round(grade)));
};

export const calculatePlayerGrade = (player, ppaData) => {
  let grade = 50;
  const ppaWeight = 10;
  if (!player.stats) return grade;
  switch (player.position) {
    case "QB":
      return calculateQuarterbackGrade(player, ppaData);
    case "RB":
      return calculateRunningBackGrade(player, ppaData);
    case "WR":
    case "TE":
      return calculateReceiverGrade(player, ppaData);
    case "DL":
    case "DE":
    case "DT":
      return calculateDefensiveLineGrade(player, ppaData);
    case "LB":
      return calculateLinebackerGrade(player, ppaData);
    case "CB":
    case "S":
    case "DB":
      return calculateDefensiveBackGrade(player, ppaData);
    default:
      if (ppaData && ppaData.ppa) {
        const ppaContribution = Math.min(15, Math.max(-5, ppaData.ppa * ppaWeight));
        grade += ppaContribution;
      }
      return Math.round(grade);
  }
};

// ----------------------------------------------------------------------------
// Team-Level Aggregation & Efficiency Calculations
// ----------------------------------------------------------------------------

export const estimateTotalPlays = (teamStats, teamPlayers) => {
  let passAttempts = 0;
  const qbs = teamPlayers.filter((p) => p.position === "QB");
  qbs.forEach((qb) => {
    if (qb.stats && qb.stats.passing) {
      passAttempts += qb.stats.passing.attempts || 0;
    }
  });
  let rushAttempts = 0;
  teamPlayers.forEach((player) => {
    if (player.stats && player.stats.rushing) {
      rushAttempts += player.stats.rushing.attempts || 0;
    }
  });
  return passAttempts + rushAttempts + 10;
};

export const calculateOffensiveEfficiency = (teamStats, teamPlayers) => {
  const totalPlays = estimateTotalPlays(teamStats, teamPlayers);
  const yardsPerPlay = totalPlays > 0 ? teamStats.totalYards / totalPlays : 0;
  if (yardsPerPlay < 3) return 0.3;
  if (yardsPerPlay > 7) return Math.min(0.95, 0.8 + (yardsPerPlay - 7) * 0.05);
  if (yardsPerPlay > 5) return 0.6 + (yardsPerPlay - 5) * 0.1;
  return 0.4 + (yardsPerPlay - 3) * 0.05;
};

export const calculateDefensiveEfficiency = (teamStats, teamPlayers) => {
  let efficiency = 0.5;
  if (teamStats.ppa.defense < 0) {
    efficiency += Math.min(0.3, Math.abs(teamStats.ppa.defense) * 0.1);
  } else if (teamStats.ppa.defense > 0) {
    efficiency -= Math.min(0.3, teamStats.ppa.defense * 0.1);
  }
  efficiency += Math.min(0.15, teamStats.sacks.count * 0.03);
  return Math.min(0.95, Math.max(0.1, efficiency));
};

export const calculatePassingSuccessRate = (teamStats, teamPlayers) => {
  let completions = 0, attempts = 0;
  teamPlayers.forEach((player) => {
    if (player.position === "QB" && player.stats && player.stats.passing) {
      completions += player.stats.passing.completions || 0;
      attempts += player.stats.passing.attempts || 0;
    }
  });
  if (attempts === 0) return 0.45;
  const completionPct = completions / attempts;
  return Math.min(0.95, Math.max(0.1, completionPct * 0.85));
};

export const calculateRushingSuccessRate = (teamStats, teamPlayers) => {
  let rushYards = 0, rushAttempts = 0;
  teamPlayers.forEach((player) => {
    if (player.stats && player.stats.rushing) {
      rushYards += player.stats.rushing.yards || 0;
      rushAttempts += player.stats.rushing.attempts || 0;
    }
  });
  if (rushAttempts === 0) return 0.4;
  const ypc = rushYards / rushAttempts;
  if (ypc < 3) return 0.3;
  if (ypc > 5) return Math.min(0.8, 0.6 + (ypc - 5) * 0.05);
  if (ypc > 4) return 0.5 + (ypc - 4) * 0.1;
  return 0.4 + (ypc - 3) * 0.1;
};

export const calculateTeamStats = (players, teamName, gameData, homeTeam, drivesData) => {
  // Log important input parameters to help with troubleshooting
  console.log(`Calculating team stats for ${teamName}:`, {
    totalPlayers: players.length,
    teamPlayers: players.filter(p => p.team === teamName).length,
    gameDataAvailable: !!gameData,
    drivesDataAvailable: !!drivesData && Array.isArray(drivesData)
  });
  
  const teamPlayers = players.filter((p) => p.team === teamName);
  const teamStats = {
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
    efficiency: { offensive: 0, defensive: 0, passingSuccess: 0, rushingSuccess: 0 },
  };
  
  // If we have valid drive data, use it for accurate yardage calculations
  if (drivesData && Array.isArray(drivesData) && drivesData.length > 0) {
    // Filter drives for the current team
    const teamDrives = drivesData.filter(drive => {
      // Match by team name or ID
      return (drive.offense === teamName || drive.offenseId === teamName);
    });
    
    console.log(`Found ${teamDrives.length} drives for ${teamName}`);
    
    let totalYards = 0;
    let passingYards = 0;
    let rushingYards = 0;
    let firstDowns = 0;
    
    // Process each drive to extract statistics
    teamDrives.forEach(drive => {
      // Add drive yards to total
      if (typeof drive.yards === 'number') {
        totalYards += drive.yards;
      }
      
      // Process plays in each drive if available
      if (drive.plays && Array.isArray(drive.plays)) {
        drive.plays.forEach(play => {
          // Skip special plays that shouldn't count toward offensive stats
          const specialPlayTypes = ["Kickoff", "Punt", "Timeout", "End Period", "End of Half", "End of Game"];
          if (specialPlayTypes.includes(play.playType)) {
            return;
          }
          
          // Count passing yards
          if (play.playType === "Pass Reception" || play.playType === "Pass Completion") {
            if (typeof play.yardsGained === 'number') {
              passingYards += play.yardsGained;
            }
          }
          // Count rushing yards
          else if (play.playType === "Rush" || play.playType === "Rushing Touchdown") {
            if (typeof play.yardsGained === 'number') {
              rushingYards += play.yardsGained;
            }
          }
          
          // Count first downs
          if (play.playText && play.playText.includes("1ST down")) {
            firstDowns++;
          }
          
          // Count explosive plays (plays of 20+ yards)
          if (play.yardsGained >= 20) {
            teamStats.explosivePlays++;
          }
        });
      }
    });
    
    // If we have valid play-by-play data, use these totals
    if (totalYards > 0) {
      teamStats.totalYards = totalYards;
      teamStats.passingYards = passingYards;
      teamStats.rushingYards = rushingYards;
      teamStats.firstDowns = firstDowns;
    }
    // Otherwise, fall back to summing up player stats
    else {
      console.log(`No valid play data for ${teamName}, falling back to player stats`);
      calculateStatsFromPlayers(teamPlayers, teamStats);
    }
  }
  // If no drive data, fall back to player stats
  else {
    console.log(`No drives data for ${teamName}, using player stats`);
    // If we don't have any team players, use default estimated team values
    if (teamPlayers.length === 0) {
      console.warn(`No players found for team ${teamName}. Using estimated values.`);
      // Default to reasonable values for an average college football game
      teamStats.totalYards = 380;
      teamStats.passingYards = 220;
      teamStats.rushingYards = 160;
      teamStats.firstDowns = 22;
      teamStats.explosivePlays = 4;
      teamStats.thirdDowns = { attempts: 12, conversions: 5 };
      teamStats.fourthDowns = { attempts: 2, conversions: 1 };
      teamStats.redZone = { attempts: 4, conversions: 2 };
      teamStats.turnovers = 1;
      teamStats.timeOfPossession = 30;
      teamStats.ppa.total = 0.05;
      teamStats.ppa.passing = 0.08;
      teamStats.ppa.rushing = 0.03;
      teamStats.ppa.defense = -0.02;
    } else {
      calculateStatsFromPlayers(teamPlayers, teamStats);
    }
  }

  // Helper function to calculate stats from player data
  function calculateStatsFromPlayers(players, stats) {
    // Process player stats if we have players
    players.forEach((player) => {
      if (player.stats) {
        console.log(`Processing stats for player: ${player.name}, position: ${player.position}`);
        console.log("Player stats structure:", player.stats);

        // Passing yards - try all possible formats
        let pYds = 0;
        if (player.stats.passing && player.stats.passing.yards) {
          pYds = parseFloat(player.stats.passing.yards);
        } else if (player.stats.passing && player.stats.passing.yds) {
          pYds = parseFloat(player.stats.passing.yds);
        } else if (player.stats.netpassingyards) {
          pYds = parseFloat(player.stats.netpassingyards);
        } else if (player.stats.passingyards) {
          pYds = parseFloat(player.stats.passingyards);
        } else if (player.stats.passing) {
          // If passing exists but yards not found in expected location
          const passingKeys = Object.keys(player.stats.passing);
          for (const key of passingKeys) {
            if (key.includes('yard') || key.includes('yds')) {
              pYds = parseFloat(player.stats.passing[key]);
              break;
            }
          }
        }
        if (pYds && !isNaN(pYds)) {
          stats.passingYards += pYds;
          console.log(`Added ${pYds} passing yards for ${player.name}`);
        }

        // Rushing yards - try all possible formats
        let rYds = 0;
        if (player.stats.rushing && player.stats.rushing.yards) {
          rYds = parseFloat(player.stats.rushing.yards);
        } else if (player.stats.rushing && player.stats.rushing.yds) {
          rYds = parseFloat(player.stats.rushing.yds);
        } else if (player.stats.rushingyards) {
          rYds = parseFloat(player.stats.rushingyards);
        } else if (player.stats.rushing) {
          // If rushing exists but yards not found in expected location
          const rushingKeys = Object.keys(player.stats.rushing);
          for (const key of rushingKeys) {
            if (key.includes('yard') || key.includes('yds')) {
              rYds = parseFloat(player.stats.rushing[key]);
              break;
            }
          }
        }
        if (rYds && !isNaN(rYds)) {
          stats.rushingYards += rYds;
          console.log(`Added ${rYds} rushing yards for ${player.name}`);
        }

        // First downs - check multiple possible formats
        if (player.stats.firstdowns) {
          const firstDowns = parseFloat(player.stats.firstdowns);
          if (!isNaN(firstDowns)) {
            stats.firstDowns += firstDowns;
          }
        } else if (player.stats.firstDowns) {
          const firstDowns = parseFloat(player.stats.firstDowns);
          if (!isNaN(firstDowns)) {
            stats.firstDowns += firstDowns;
          }
        }

        // Explosive plays (if yards in passing or rushing is at least 20):
        let hasExplosivePlay = false;
        if (player.stats.passing) {
          const passYards = parseFloat(player.stats.passing.yards || player.stats.passing.yds || 0);
          if (passYards >= 20) {
            stats.explosivePlays += 1;
            hasExplosivePlay = true;
          }
        }
        if (!hasExplosivePlay && player.stats.rushing) {
          const rushYards = parseFloat(player.stats.rushing.yards || player.stats.rushing.yds || 0);
          if (rushYards >= 20) {
            stats.explosivePlays += 1;
          }
        }

        // Turnovers: use interceptions and fumbles if available
        let interceptions = 0;
        if (player.stats.passing && player.stats.passing.interceptions) {
          interceptions = parseFloat(player.stats.passing.interceptions);
        } else if (player.stats.passing && player.stats.passing.int) {
          interceptions = parseFloat(player.stats.passing.int);
        }
        
        if (!isNaN(interceptions)) {
          stats.turnovers += interceptions;
        }
        
        // Check for fumbles too
        if (player.stats.fumbles) {
          const fumbles = parseFloat(player.stats.fumbles);
          if (!isNaN(fumbles)) {
            stats.turnovers += fumbles;
          }
        }

        // Defensive stats: count sacks
        if (player.stats.defense && player.stats.defense.sacks) {
          const sacks = parseFloat(player.stats.defense.sacks);
          if (!isNaN(sacks)) {
            stats.sacks.count += sacks;
            stats.sacks.yards += sacks * 7; // Estimate 7 yards per sack
          }
        }

        // PPA values
        if (player.ppa && !isNaN(parseFloat(player.ppa))) {
          const ppaValue = parseFloat(player.ppa);
          stats.ppa.total += ppaValue;
          
          if (["QB", "RB", "WR", "TE"].includes(player.position)) {
            if (player.position === "QB") {
              stats.ppa.passing += ppaValue * 0.8;
              stats.ppa.rushing += ppaValue * 0.2;
            } else if (player.position === "RB") {
              stats.ppa.rushing += ppaValue * 0.7;
              stats.ppa.passing += ppaValue * 0.3;
            } else {
              stats.ppa.passing += ppaValue;
            }
          } else {
            stats.ppa.defense += ppaValue;
          }
        }
      }
    });
    
    // Calculate total yards as sum of passing and rushing
    stats.totalYards = stats.passingYards + stats.rushingYards;
  }

  if (gameData) {
    if (teamName === homeTeam) {
      teamStats.timeOfPossession = gameData.homePossessionTime || 30;
      teamStats.penalties.count = gameData.homePenalties || 0;
      teamStats.penalties.yards = gameData.homePenaltyYards || 0;
    } else {
      teamStats.timeOfPossession = gameData.awayPossessionTime || 30;
      teamStats.penalties.count = gameData.awayPenalties || 0;
      teamStats.penalties.yards = gameData.awayPenaltyYards || 0;
    }
  }

  teamStats.efficiency.offensive = calculateOffensiveEfficiency(teamStats, teamPlayers);
  teamStats.efficiency.defensive = calculateDefensiveEfficiency(teamStats, teamPlayers);
  teamStats.efficiency.passingSuccess = calculatePassingSuccessRate(teamStats, teamPlayers);
  teamStats.efficiency.rushingSuccess = calculateRushingSuccessRate(teamStats, teamPlayers);

  const totalPlays = estimateTotalPlays(teamStats, teamPlayers);
  teamStats.thirdDowns.attempts = Math.round(totalPlays * 0.15);
  teamStats.thirdDowns.conversions = Math.round(teamStats.thirdDowns.attempts * 0.4);
  teamStats.fourthDowns.attempts = Math.round(totalPlays * 0.03);
  teamStats.fourthDowns.conversions = Math.round(teamStats.fourthDowns.attempts * 0.5);
  teamStats.redZone.attempts = Math.round(totalPlays * 0.08);
  teamStats.redZone.conversions = Math.round(teamStats.redZone.attempts * 0.6);

  return teamStats;
};

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
  efficiency: { offensive: 0, defensive: 0, passingSuccess: 0, rushingSuccess: 0 },
});

// ----------------------------------------------------------------------------
// Drive Data Processing
// ----------------------------------------------------------------------------

export const processDriveData = (drivesData, homeTeam, awayTeam) => {
  if (!drivesData || !Array.isArray(drivesData)) return [];
  
  // Process each drive
  const processedDrives = drivesData.map((drive) => {
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
    } else if (drive.result === "Touchdown" || drive.result === "Field Goal" || 
               drive.result === "Punt" || drive.result === "Downs" || 
               drive.result === "End of Half") {
      // For the new API format that has the result directly
      result = drive.result;
    } else {
      result = drive.endReason || drive.result || "Unknown";
    }
    return {
      team: drive.offenseTeam || drive.offense,
      quarter: drive.quarter || drive.startPeriod || 1,
      result,
      yards: drive.yards || 0,
      timeOfPossession: drive.timeOfPossession || drive.duration || "0:00",
      plays: drive.plays || drive.playCount || 0,
      startPosition: drive.startYard ? `${drive.startSide} ${drive.startYard}` : 
                    drive.startYardsToGoal ? `Own ${100 - drive.startYardsToGoal}` : "Unknown",
      scoringOpportunity: drive.scoringOpportunity || (result === "Touchdown" || result === "Field Goal"),
      pointsGained: drive.pointsGained || (result === "Touchdown" ? 7 : (result === "Field Goal" ? 3 : 0)),
      playDetails: Array.isArray(drive.plays) ? drive.plays : []
    };
  });
  
  return processedDrives;
};

// Extract team stats from drive data when API stats aren't available
export const extractStatsFromDrives = (drivesData, teamName) => {
  if (!drivesData || !Array.isArray(drivesData) || drivesData.length === 0) {
    return null;
  }
  
  // Filter drives for this team
  const teamDrives = drivesData.filter(drive => {
    return drive.team === teamName || drive.offense === teamName || drive.offenseTeam === teamName;
  });
  
  if (teamDrives.length === 0) return null;
  
  // Initialize stats
  const extractedStats = {
    firstDowns: 0,
    thirdDowns: { attempts: 0, conversions: 0 },
    redZone: { attempts: 0, conversions: 0 },
    turnovers: 0,
    timeOfPossession: 0,
    explosivePlays: 0
  };
  
  // Process each drive
  teamDrives.forEach(drive => {
    // Count red zone attempts (drives that reach the opponent's 20 yard line)
    if (drive.scoringOpportunity) {
      extractedStats.redZone.attempts++;
      
      // Count conversions (touchdowns or field goals)
      if (drive.result === "Touchdown" || drive.result === "Field Goal") {
        extractedStats.redZone.conversions++;
      }
    }
    
    // Count turnovers
    if (drive.result === "Turnover" || drive.result === "Fumble" || drive.result === "Interception") {
      extractedStats.turnovers++;
    }
    
    // Parse time of possession
    if (drive.timeOfPossession) {
      const [minutes, seconds] = drive.timeOfPossession.split(':').map(Number);
      if (!isNaN(minutes) && !isNaN(seconds)) {
        extractedStats.timeOfPossession += minutes + (seconds / 60);
      }
    }
    
    // Process play details if available
    if (Array.isArray(drive.playDetails) && drive.playDetails.length > 0) {
      drive.playDetails.forEach(play => {
        // Count first downs from play descriptions
        if (play.playText && play.playText.includes("1ST down")) {
          extractedStats.firstDowns++;
        }
        
        // Count third downs and conversions
        if (play.down === 3) {
          extractedStats.thirdDowns.attempts++;
          
          // Check for conversion (next play is 1st down or scoring play)
          const nextPlayIndex = drive.playDetails.indexOf(play) + 1;
          if (nextPlayIndex < drive.playDetails.length) {
            const nextPlay = drive.playDetails[nextPlayIndex];
            if (nextPlay.down === 1 || nextPlay.playType === "Touchdown" || nextPlay.playType === "Rushing Touchdown" || nextPlay.playType === "Passing Touchdown") {
              extractedStats.thirdDowns.conversions++;
            }
          }
        }
        
        // Count explosive plays (20+ yard gains)
        if (play.yardsGained >= 20) {
          extractedStats.explosivePlays++;
        } else if (play.playText) {
          // Try to detect yards gained from play text
          const yardPatterns = [
            /for (\d+) yds/i,     // "for 25 yds"
            /gain of (\d+)/i,     // "gain of 30"
            /for (\d+) yards/i,   // "for 22 yards" 
            /run for (\d+) yds/i, // "run for 35 yds"
            /pass.+for (\d+) yds/i // "pass complete... for 24 yds"
          ];
          
          for (const pattern of yardPatterns) {
            const match = play.playText.match(pattern);
            if (match && match[1]) {
              const yards = parseInt(match[1]);
              if (yards >= 20) {
                extractedStats.explosivePlays++;
                break;
              }
            }
          }
        }
      });
    }
  });
  
  return extractedStats;
};

// ----------------------------------------------------------------------------
// Key Players & Presentation Helpers
// ----------------------------------------------------------------------------

export const getKeyPlayers = (players, teamName) => {
  const teamPlayers = players.filter((p) => p.team === teamName);
  const sortedPlayers = [...teamPlayers].sort((a, b) => (b.grade || 0) - (a.grade || 0));
  const qbs = sortedPlayers.filter((p) => p.position === "QB").slice(0, 1);
  const rbs = sortedPlayers.filter((p) => p.position === "RB").slice(0, 2);
  const wrs = sortedPlayers.filter((p) => ["WR", "TE"].includes(p.position)).slice(0, 3);
  const defenders = sortedPlayers
    .filter((p) => ["DL", "DE", "DT", "LB", "CB", "S", "DB"].includes(p.position))
    .slice(0, 3);
  return [...qbs, ...rbs, ...wrs, ...defenders].slice(0, 8);
};

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

export const getGradeColor = (grade) => {
  if (grade >= 90) return "#2ecc71";
  if (grade >= 80) return "#27ae60";
  if (grade >= 70) return "#3498db";
  if (grade >= 60) return "#2980b9";
  if (grade >= 50) return "#f1c40f";
  if (grade >= 40) return "#e67e22";
  if (grade >= 30) return "#e74c3c";
  return "#c0392b";
};

export const renderPlayerKeyStat = (player) => {
  if (!player.stats) return "No stats";
  switch (player.position) {
    case "QB":
      if (player.stats.passing) {
        let completions, attempts, yards, touchdowns;
        if (player.stats.passing.c_att || player.stats.passing["c/att"]) {
          const parts = (player.stats.passing.c_att || player.stats.passing["c/att"])
            .toString()
            .split("/");
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
    case "RB":
      if (player.stats.rushing) {
        return `${player.stats.rushing.attempts || 0} car, ${player.stats.rushing.yards || 0} yds, ${player.stats.rushing.touchdowns || 0} TD`;
      }
      return "No rushing stats";
    case "WR":
    case "TE":
      if (player.stats.receiving) {
        return `${player.stats.receiving.receptions || 0} rec, ${player.stats.receiving.yards || 0} yds, ${player.stats.receiving.touchdowns || 0} TD`;
      }
      return "No receiving stats";
    case "DL":
    case "DE":
    case "DT":
    case "LB":
      if (player.stats.defense) {
        return `${player.stats.defense.tackles || 0} tkl, ${player.stats.defense.tacklesForLoss || 0} TFL, ${player.stats.defense.sacks || 0} sacks`;
      }
      return "No defensive stats";
    case "CB":
    case "S":
    case "DB":
      if (player.stats.defense) {
        return `${player.stats.defense.tackles || 0} tkl, ${player.stats.defense.interceptions || 0} INT, ${player.stats.defense.passesDefended || 0} PD`;
      }
      return "No defensive stats";
    default:
      return "Stats N/A";
  }
};

// ----------------------------------------------------------------------------
// Processing Player Data
// ----------------------------------------------------------------------------

export const processPlayerStats = (playersData, ppaData) => {
  console.log("Processing player stats with:", {
    playersDataAvailable: !!playersData && Array.isArray(playersData), 
    playersCount: playersData?.length || 0,
    ppaDataAvailable: !!ppaData && Array.isArray(ppaData),
    ppaCount: ppaData?.length || 0 
  });
  
  if (!playersData || !Array.isArray(playersData) || playersData.length === 0) {
    console.warn("No valid players data available");
    return [];
  }

  // Normalize PPA data if available
  let normalizedPpaData = [];
  if (ppaData && Array.isArray(ppaData) && ppaData.length > 0) {
    // Log sample PPA data structure to help debug
    console.log("Sample PPA data structure:", ppaData[0]);
    
    // Normalize PPA data to a consistent format
    normalizedPpaData = ppaData.map(item => {
      // Check for different PPA value formats
      let ppaValue = 0;
      if (typeof item.ppa === 'number') {
        ppaValue = item.ppa;
      } else if (item.ppa && typeof item.ppa.total === 'number') {
        ppaValue = item.ppa.total;
      } else if (typeof item.total === 'number') {
        ppaValue = item.total;
      } else if (typeof item.value === 'number') {
        ppaValue = item.value;
      }
      
      return {
        id: item.playerId || item.player_id || item.id,
        name: item.player || item.playerName || item.name,
        team: item.team || item.teamName,
        ppa: ppaValue
      };
    });
  }

  let allPlayers = [];

  // Check if data uses the nested categories structure...
  if (playersData[0]?.teams && Array.isArray(playersData[0].teams)) {
    playersData.forEach((game) => {
      game.teams.forEach((teamData) => {
        const teamName = teamData.team;
        const conference = teamData.conference;
        const homeAway = teamData.homeAway;
        // If the old structure exists:
        if (teamData.categories && Array.isArray(teamData.categories)) {
          teamData.categories.forEach((category) => {
            const categoryName = category.name;
            if (category.types && Array.isArray(category.types)) {
              category.types.forEach((type) => {
                const statName = type.name;
                if (type.athletes && Array.isArray(type.athletes)) {
                  type.athletes.forEach((athlete) => {
                    let existingPlayer = allPlayers.find((p) => p.id === athlete.id);
                    if (!existingPlayer) {
                      existingPlayer = {
                        id: athlete.id,
                        name: athlete.name,
                        team: teamName,
                        conference,
                        homeAway,
                        position: inferPositionFromCategory(categoryName, statName),
                        stats: {},
                      };
                      allPlayers.push(existingPlayer);
                    }
                    if (!existingPlayer.stats[categoryName]) {
                      existingPlayer.stats[categoryName] = {};
                    }
                    existingPlayer.stats[categoryName][statName.toLowerCase()] = parseStatValue(athlete.stat);
                  });
                }
              });
            }
          });
        }
        // Else if using the new flat "stats" array
        else if (teamData.stats && Array.isArray(teamData.stats)) {
          // Create a flat stats object for this team/player
          let flatStats = {};
          teamData.stats.forEach((statObj) => {
            // Use the lowercased category name as key
            flatStats[statObj.category.toLowerCase()] = parseStatValue(statObj.stat);
          });
          // Create a new player entry using this flat structure
          // (Assuming one entry per team here; adjust if your data contains multiple athletes per team)
          let player = {
            id: teamData.teamId, // Using teamId as id in this flat structure
            name: teamData.team,
            team: teamData.team,
            conference,
            homeAway,
            // For flat stats, we directly assign the flatStats object
            stats: flatStats,
          };
          // Optionally, set grade if PPA data is available (this may require mapping from team-level PPA if provided)
          const playerPPA = ppaData?.find(
            (p) => p.team === teamData.team || p.name === teamData.team
          );
          player.grade = calculatePlayerGrade(player, playerPPA);
          player.ppa = playerPPA?.ppa || 0;
          allPlayers.push(player);
        }
      });
    });
  } else {
    allPlayers = playersData;
  }

  // For each processed player, calculate grade using PPA data if available
  console.log(`Processing ${allPlayers.length} players for grades`);
  
  return allPlayers.map((player) => {
    // Try to find matching PPA data in normalized format
    const playerPPA = normalizedPpaData.find(
      (p) => 
        p.id === player.id || 
        p.playerId === player.id || 
        (p.name === player.name && p.team === player.team)
    );
    
    // Fallback to original PPA data format if normalized search fails
    const originalPPA = !playerPPA && ppaData ? ppaData.find(
      (p) =>
        p.playerId === player.id ||
        (p.name === player.name && p.team === player.team)
    ) : null;
    
    // Calculate grade with PPA data if available
    const ppaForGrade = playerPPA || originalPPA;
    const grade = calculatePlayerGrade(player, ppaForGrade);
    
    return {
      ...player,
      ppa: playerPPA?.ppa || originalPPA?.ppa || 0,
      grade: grade || 50, // Use default grade of 50 if calculation fails
    };
  });
};

/**
 * Process team statistics directly from the /games/teams API response
 * This provides more accurate stats than calculating from individual player stats
 */
export const processTeamStatsFromAPI = (teamData) => {
  if (!teamData || !teamData.stats) {
    console.warn("No team stats data available");
    return calculateEmptyTeamStats();
  }

  // Create an easy-to-access map of stats by category, prioritizing exact match
  const statsByCategory = {};
  teamData.stats.forEach(stat => {
    statsByCategory[stat.category.toLowerCase()] = stat.stat;
  });

  // Comprehensive parsing function with multiple fallback strategies
  const parseStatSafely = (categories, defaultValue = 0) => {
    // Ensure categories is always an array
    const categoryList = Array.isArray(categories) ? categories : [categories];

    for (const category of categoryList) {
      const statValue = statsByCategory[category.toLowerCase()];
      
      if (statValue === undefined) continue;

      // Fraction parsing (like "5/10")
      if (typeof statValue === 'string' && statValue.includes('/')) {
        const [made, attempted] = statValue.split('/');
        return {
          conversions: parseInt(made, 10) || 0,
          attempts: parseInt(attempted, 10) || 0
        };
      }
      
      // Numeric parsing
      if (typeof statValue === 'string') {
        const parsed = parseFloat(statValue);
        if (!isNaN(parsed)) return parsed;
      }
      
      return statValue;
    }

    return defaultValue;
  };

  // Enhanced parsing functions
  const parsePossessionTime = (timeStr) => {
    if (!timeStr) return 30;
    
    const parts = timeStr.split(':');
    if (parts.length !== 2) return 30;
    
    const minutes = parseInt(parts[0], 10);
    const seconds = parseInt(parts[1], 10);
    
    return minutes + (seconds / 60);
  };

  const parsePenalties = (penaltiesStr) => {
    if (!penaltiesStr) return { count: 0, yards: 0 };
    
    const parts = penaltiesStr.split('-');
    if (parts.length !== 2) return { count: 0, yards: 0 };
    
    return {
      count: parseInt(parts[0], 10) || 0,
      yards: parseInt(parts[1], 10) || 0
    };
  };

  // Detailed parsing with multiple fallback categories
  const teamStats = {
    totalYards: parseStatSafely(['totalYards', 'total yards'], 0),
    passingYards: parseStatSafely(['netPassingYards', 'passing yards', 'passingYards'], 0),
    rushingYards: parseStatSafely(['rushingYards', 'rushing yards'], 0),
    firstDowns: parseStatSafely(['firstDowns', 'first downs'], 0),
    
    // Complex parsing for efficiency metrics
    thirdDowns: (() => {
      const thirdDownEff = parseStatSafely(['thirdDownEff', 'third down eff', 'third downs']);
      if (typeof thirdDownEff === 'object' && thirdDownEff.attempts) return thirdDownEff;
      if (typeof thirdDownEff === 'string' && thirdDownEff.includes('/')) {
        const [made, attempted] = thirdDownEff.split('/');
        return {
          conversions: parseInt(made, 10) || 0,
          attempts: parseInt(attempted, 10) || 0
        };
      }
      return { attempts: 0, conversions: 0 };
    })(),

    fourthDowns: (() => {
      const fourthDownEff = parseStatSafely(['fourthDownEff', 'fourth down eff', 'fourth downs']);
      if (typeof fourthDownEff === 'object' && fourthDownEff.attempts) return fourthDownEff;
      if (typeof fourthDownEff === 'string' && fourthDownEff.includes('/')) {
        const [made, attempted] = fourthDownEff.split('/');
        return {
          conversions: parseInt(made, 10) || 0,
          attempts: parseInt(attempted, 10) || 0
        };
      }
      return { attempts: 0, conversions: 0 };
    })(),

    turnovers: parseStatSafely(['turnovers'], 0),
    timeOfPossession: parsePossessionTime(
      parseStatSafely(['possessionTime', 'time of possession'], '30:00')
    ),
    
    redZone: (() => {
      const redZoneEff = parseStatSafely(['redZoneEff', 'red zone eff', 'red zone']);
      if (typeof redZoneEff === 'object' && redZoneEff.attempts) return redZoneEff;
      if (typeof redZoneEff === 'string' && redZoneEff.includes('/')) {
        const [made, attempted] = redZoneEff.split('/');
        return {
          conversions: parseInt(made, 10) || 0,
          attempts: parseInt(attempted, 10) || 0
        };
      }
      return { attempts: 0, conversions: 0 };
    })(),

    penalties: parsePenalties(
      parseStatSafely(['totalPenaltiesYards', 'penalties'], '0-0')
    ),
    
    sacks: { 
      count: parseStatSafely(['sacks'], 0),
      yards: parseStatSafely(['sackYards'], 0)
    },
    
    explosivePlays: parseStatSafely(['explosivePlays'], 
      Math.round(parseStatSafely(['totalYards'], 0) / 100)
    ),
    
    // Initialize with placeholders
    ppa: { total: 0, passing: 0, rushing: 0, defense: 0 },
    efficiency: {
      offensive: 0.5, 
      defensive: 0.5, 
      passingSuccess: 0.5, 
      rushingSuccess: 0.5
    }
  };

  // Diagnostic logging
  console.log(`Processed Team Stats for ${teamData.team}:`, teamStats);

  return teamStats;
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
  calculateEmptyTeamStats,
  calculateQuarterbackGrade,
  calculateRunningBackGrade,
  calculateReceiverGrade,
  calculateDefensiveLineGrade,
  calculateLinebackerGrade,
  calculateDefensiveBackGrade,
  estimateTotalPlays,
  calculateOffensiveEfficiency,
  calculateDefensiveEfficiency,
  calculatePassingSuccessRate,
  calculateRushingSuccessRate,
  processTeamStatsFromAPI,
};