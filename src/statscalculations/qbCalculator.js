/**
 * QB PFF-style Grade Calculator
 * This module calculates a PFF-style quarterback rating on a 0-100 scale
 * based on statistical performance and advanced metrics.
 */

/**
 * Calculates a PFF-style grade for a quarterback using available statistics
 * @param {Object} playerData - Object containing all player data from different API endpoints
 * @return {Number} PFF-style grade on a scale of 0-100
 */
export function calculateQBGrade(playerData) {
  // Extract and organize data from the API response
  const stats = extractPlayerStats(playerData);
  
  // Calculate category scores
  const passingEfficiency = calculatePassingEfficiency(stats);
  const totalProduction = calculateTotalProduction(stats);
  const situationalPerformance = calculateSituationalPerformance(stats);
  const dualThreatCapability = calculateDualThreatCapability(stats);
  const overallImpact = calculateOverallImpact(stats);
  
  // Apply category weights
  const weightedPassingEfficiency = passingEfficiency * 0.30;
  const weightedTotalProduction = totalProduction * 0.25;
  const weightedSituationalPerformance = situationalPerformance * 0.20;
  const weightedDualThreatCapability = dualThreatCapability * 0.10;
  const weightedOverallImpact = overallImpact * 0.15;
  
  // Calculate final grade
  const finalGrade = weightedPassingEfficiency + 
                     weightedTotalProduction + 
                     weightedSituationalPerformance + 
                     weightedDualThreatCapability + 
                     weightedOverallImpact;
  
  // Round to one decimal place
  return parseFloat(finalGrade.toFixed(1));
}

/**
 * Extracts and normalizes player statistics from the API data structure
 * @param {Object} playerData - The raw player data from API
 * @return {Object} Normalized stats object
 */
function extractPlayerStats(playerData) {
  // Initialize stats with default values
  const stats = {
    completionPct: 0,
    ypa: 0,
    passTDs: 0,
    ints: 0,
    passYards: 0,
    rushYards: 0,
    rushTDs: 0,
    rushCarries: 0,
    ypc: 0,
    wepa: 0,
    allPPA: 0,
    passPPA: 0,
    rushPPA: 0,
    firstDownPPA: 0,
    secondDownPPA: 0,
    thirdDownPPA: 0,
    standardDownsPPA: 0,
    passingDownsPPA: 0,
    totalPlays: 0
  };

  // Extract basic passing statistics
  if (playerData.passingStats) {
    const passingStats = playerData.passingStats;
    for (const stat of passingStats) {
      switch (stat.statType) {
        case "PCT":
          stats.completionPct = parseFloat(stat.stat);
          break;
        case "YPA":
          stats.ypa = parseFloat(stat.stat);
          break;
        case "TD":
          stats.passTDs = parseInt(stat.stat);
          break;
        case "INT":
          stats.ints = parseInt(stat.stat);
          break;
        case "YDS":
          stats.passYards = parseInt(stat.stat);
          break;
        default:
          break;
      }
    }
  }

  // Extract rushing statistics
  if (playerData.rushingStats) {
    const rushingStats = playerData.rushingStats;
    for (const stat of rushingStats) {
      switch (stat.statType) {
        case "YDS":
          stats.rushYards = parseInt(stat.stat);
          break;
        case "TD":
          stats.rushTDs = parseInt(stat.stat);
          break;
        case "CAR":
          stats.rushCarries = parseInt(stat.stat);
          break;
        case "YPC":
          stats.ypc = parseFloat(stat.stat);
          break;
        default:
          break;
      }
    }
  }

  // Extract PPA data
  if (playerData.ppaData && playerData.ppaData.length > 0) {
    const ppa = playerData.ppaData[0].averagePPA;
    stats.allPPA = ppa.all || 0;
    stats.passPPA = ppa.pass || 0;
    stats.rushPPA = ppa.rush || 0;
    stats.firstDownPPA = ppa.firstDown || 0;
    stats.secondDownPPA = ppa.secondDown || 0;
    stats.thirdDownPPA = ppa.thirdDown || 0;
    stats.standardDownsPPA = ppa.standardDowns || 0;
    stats.passingDownsPPA = ppa.passingDowns || 0;
  }

  // Extract WEPA data
  if (playerData.wepaData && playerData.wepaData.length > 0) {
    stats.wepa = playerData.wepaData[0].wepa || 0;
    stats.totalPlays = playerData.wepaData[0].plays || 0;
  }

  return stats;
}

/**
 * Calculates the passing efficiency score (0-100)
 * @param {Object} stats - Normalized player statistics
 * @return {Number} Score from 0-100
 */
function calculatePassingEfficiency(stats) {
  let score = 75; // Base score
  
  // Completion percentage (league average ~65%)
  score += (stats.completionPct - 0.65) * 100;
  
  // YPA bonus (7.5 is average)
  score += (stats.ypa - 7.5) * 4;
  
  // TD-INT ratio impact
  const tdIntRatio = stats.passTDs / Math.max(1, stats.ints);
  score += (tdIntRatio - 2) * 2;
  
  // Cap at 100
  return Math.min(100, Math.max(0, score));
}

/**
 * Calculates the total production score (0-100)
 * @param {Object} stats - Normalized player statistics
 * @return {Number} Score from 0-100
 */
function calculateTotalProduction(stats) {
  let score = 70; // Base score
  
  // Passing yards (3000 is baseline)
  score += (stats.passYards - 3000) / 100;
  
  // Total TDs (30 is baseline)
  const totalTDs = stats.passTDs + stats.rushTDs;
  score += (totalTDs - 30) * 1.5;
  
  // Cap at 100
  return Math.min(100, Math.max(0, score));
}

/**
 * Calculates the situational performance score (0-100)
 * @param {Object} stats - Normalized player statistics
 * @return {Number} Score from 0-100
 */
function calculateSituationalPerformance(stats) {
  let score = 65; // Base score
  
  // Third down PPA (0.4 is baseline)
  score += (stats.thirdDownPPA - 0.4) * 35;
  
  // Passing downs vs standard downs
  const passingDownsDiff = stats.passingDownsPPA - stats.standardDownsPPA;
  score += passingDownsDiff * 20;
  
  // Cap at 100
  return Math.min(100, Math.max(0, score));
}

/**
 * Calculates the dual-threat capability score (0-100)
 * @param {Object} stats - Normalized player statistics
 * @return {Number} Score from 0-100
 */
function calculateDualThreatCapability(stats) {
  let score = 70; // Base score
  
  // Rushing TDs
  score += stats.rushTDs * 2;
  
  // Rush PPA
  score += stats.rushPPA * 15;
  
  // Cap at 100
  return Math.min(100, Math.max(0, score));
}

/**
 * Calculates the overall impact score (0-100)
 * @param {Object} stats - Normalized player statistics
 * @return {Number} Score from 0-100
 */
function calculateOverallImpact(stats) {
  let score = 60; // Base score
  
  // WEPA
  score += stats.wepa * 35;
  
  // Cap at 100
  return Math.min(100, Math.max(0, score));
}

/**
 * Returns detailed category breakdown for a QB
 * @param {Object} playerData - The raw player data from API
 * @return {Object} Detailed grading breakdown by category
 */
export function getQBGradeBreakdown(playerData) {
  const stats = extractPlayerStats(playerData);
  
  const passingEfficiency = calculatePassingEfficiency(stats);
  const totalProduction = calculateTotalProduction(stats);
  const situationalPerformance = calculateSituationalPerformance(stats);
  const dualThreatCapability = calculateDualThreatCapability(stats);
  const overallImpact = calculateOverallImpact(stats);
  
  const finalGrade = calculateQBGrade(playerData);
  
  return {
    overall: finalGrade,
    categories: {
      passingEfficiency,
      totalProduction,
      situationalPerformance,
      dualThreatCapability,
      overallImpact
    },
    stats: {
      completionPct: stats.completionPct,
      ypa: stats.ypa,
      tdToIntRatio: (stats.passTDs / Math.max(1, stats.ints)).toFixed(1),
      passingTDs: stats.passTDs,
      rushingTDs: stats.rushTDs,
      totalTDs: stats.passTDs + stats.rushTDs,
      passPPA: stats.passPPA,
      thirdDownPPA: stats.thirdDownPPA,
      passingDownsPPA: stats.passingDownsPPA,
      wepa: stats.wepa
    }
  };
}
