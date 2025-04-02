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
    let completions = 0,
      attempts = 0,
      yards = 0,
      touchdowns = 0,
      interceptions = 0;

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

  return passAttempts + rushAttempts + 10; // Adding buffer for other plays
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

export const calculateTeamStats = (players, teamName, gameData, homeTeam) => {
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

  teamPlayers.forEach((player) => {
    if (player.stats) {
      // Passing stats
      if (player.stats.passing) {
        teamStats.passingYards += player.stats.passing.yards || 0;
        teamStats.turnovers += player.stats.passing.interceptions || 0;
        if ((player.stats.passing.yards || 0) >= 20) {
          teamStats.explosivePlays += 1;
        }
      }
      // Rushing stats
      if (player.stats.rushing) {
        teamStats.rushingYards += player.stats.rushing.yards || 0;
        if ((player.stats.rushing.yards || 0) >= 20) {
          teamStats.explosivePlays += 1;
        }
      }
      // Defensive stats
      if (player.stats.defense) {
        teamStats.sacks.count += player.stats.defense.sacks || 0;
        teamStats.sacks.yards += (player.stats.defense.sacks || 0) * 7;
      }
    }

    if (player.ppa) {
      teamStats.ppa.total += player.ppa;
      if (["QB", "RB", "WR", "TE"].includes(player.position)) {
        if (player.position === "QB") {
          teamStats.ppa.passing += player.ppa * 0.8;
          teamStats.ppa.rushing += player.ppa * 0.2;
        } else if (player.position === "RB") {
          teamStats.ppa.rushing += player.ppa * 0.7;
          teamStats.ppa.passing += player.ppa * 0.3;
        } else {
          teamStats.ppa.passing += player.ppa;
        }
      } else {
        teamStats.ppa.defense += player.ppa;
      }
    }
  });

  teamStats.totalYards = teamStats.passingYards + teamStats.rushingYards;

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

  // Estimate red zone stats (if no direct data, we use rough estimates)
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
  
  return drivesData.map((drive) => {
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
      startPosition: drive.startYard ? `${drive.startSide} ${drive.startYard}` : "Unknown",
    };
  });
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
  if (!playersData || !Array.isArray(playersData) || playersData.length === 0) return [];

  let allPlayers = [];

  if (playersData[0]?.teams && Array.isArray(playersData[0].teams)) {
    playersData.forEach((game) => {
      game.teams.forEach((teamData) => {
        const teamName = teamData.team;
        const conference = teamData.conference;
        // Loop through each category (e.g., passing, rushing, etc.)
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
                        conference: conference,
                        homeAway: teamData.homeAway,
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
      });
    });
  } else {
    allPlayers = playersData;
  }

  return allPlayers.map((player) => {
    const playerPPA = ppaData?.find(
      (p) => p.playerId === player.id || (p.name === player.name && p.team === player.team)
    );
    const grade = calculatePlayerGrade(player, playerPPA);
    return {
      ...player,
      ppa: playerPPA?.ppa || 0,
      grade,
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
};