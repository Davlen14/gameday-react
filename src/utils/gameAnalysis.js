/**
 * Game Analysis Utility
 * Handles analysis and insight generation for college football games
 */

/**
 * Generates comprehensive game analysis based on play-by-play and box score data
 * @param {Object} data - Object containing playByPlay, boxScore, and optionally scoreboard data
 * @returns {Object} Detailed game analysis object
 */
export const generateGameAnalysis = (data) => {
    try {
      // Ensure we have the basic game info
      if (!data?.boxScore?.gameInfo) {
        throw new Error("Missing game info data");
      }
  
      // Extract game info with proper error handling
      const gameInfo = {
        homeTeam: data.boxScore.gameInfo.homeTeam || "Home Team",
        awayTeam: data.boxScore.gameInfo.awayTeam || "Away Team",
        homePoints: data.boxScore.gameInfo.homePoints || 0,
        awayPoints: data.boxScore.gameInfo.awayPoints || 0,
        excitement: data.boxScore.gameInfo.excitement || "N/A",
        homeWinProb: data.boxScore.gameInfo.homeWinProb ? 
          parseFloat(data.boxScore.gameInfo.homeWinProb) * 100 : 50,
        awayWinProb: data.boxScore.gameInfo.awayWinProb ? 
          parseFloat(data.boxScore.gameInfo.awayWinProb) * 100 : 50
      };
      
      // Determine game outcome metrics
      const homeWin = gameInfo.homePoints > gameInfo.awayPoints;
      const winner = homeWin ? gameInfo.homeTeam : gameInfo.awayTeam;
      const loser = homeWin ? gameInfo.awayTeam : gameInfo.homeTeam;
      const winnerPoints = homeWin ? gameInfo.homePoints : gameInfo.awayPoints;
      const loserPoints = homeWin ? gameInfo.awayPoints : gameInfo.homePoints;
      const scoreDifference = Math.abs(gameInfo.homePoints - gameInfo.awayPoints);
      const isCloseGame = scoreDifference <= 7;
      const isBlowout = scoreDifference >= 21;
      
      // Extract team data with error handling
      const teams = Array.isArray(data.boxScore?.teams?.ppa) ? data.boxScore.teams.ppa : [];
      const homeTeamData = teams.find(t => t?.team === gameInfo.homeTeam) || {};
      const awayTeamData = teams.find(t => t?.team === gameInfo.awayTeam) || {};
      
      // Get team success rates
      const successRates = Array.isArray(data.boxScore?.teams?.successRates) ? 
        data.boxScore.teams.successRates : [];
      const homeSuccessRate = successRates.find(t => t?.team === gameInfo.homeTeam) || {};
      const awaySuccessRate = successRates.find(t => t?.team === gameInfo.awayTeam) || {};
      
      // Get explosiveness data
      const explosiveness = Array.isArray(data.boxScore?.teams?.explosiveness) ? 
        data.boxScore.teams.explosiveness : [];
      const homeExplosiveness = explosiveness.find(t => t?.team === gameInfo.homeTeam) || {};
      const awayExplosiveness = explosiveness.find(t => t?.team === gameInfo.awayTeam) || {};
      
      // Process scoring opportunities
      const scoringOpps = Array.isArray(data.boxScore?.teams?.scoringOpportunities) ? 
        data.boxScore.teams.scoringOpportunities : [];
      const homeScoringOpps = scoringOpps.find(t => t?.team === gameInfo.homeTeam) || {};
      const awayScoringOpps = scoringOpps.find(t => t?.team === gameInfo.awayTeam) || {};
      
      // Get field position data
      const fieldPosition = Array.isArray(data.boxScore?.teams?.fieldPosition) ? 
        data.boxScore.teams.fieldPosition : [];
      const homeFieldPos = fieldPosition.find(t => t?.team === gameInfo.homeTeam) || {};
      const awayFieldPos = fieldPosition.find(t => t?.team === gameInfo.awayTeam) || {};
      
      // Extract plays by period (quarters in college football)
      const plays = Array.isArray(data.playByPlay?.plays) ? data.playByPlay.plays : [];
      const playsByQuarter = {};
      for (let i = 1; i <= 4; i++) {
        // Filter plays by period number to match with box score quarter data
        playsByQuarter[i] = plays.filter(p => p.period === i);
        console.log(`Period ${i} has ${playsByQuarter[i].length} plays`);
      }
      
      // Calculate scoring by period (quarter) from multiple sources
      const scoringByQuarter = {};
      
      // Try to get quarter scores from scoreboard data first
      if (data.scoreboard && data.scoreboard.homeLineScores && data.scoreboard.awayLineScores) {
        console.log("Using scoreboard line scores for quarter data");
        const homeLineScores = data.scoreboard.homeLineScores;
        const awayLineScores = data.scoreboard.awayLineScores;
        
        for (let i = 0; i < Math.min(4, homeLineScores.length); i++) {
          scoringByQuarter[i + 1] = {
            [gameInfo.homeTeam]: typeof homeLineScores[i] === 'number' ? homeLineScores[i] : 0,
            [gameInfo.awayTeam]: typeof awayLineScores[i] === 'number' ? awayLineScores[i] : 0
          };
          console.log(`Quarter ${i + 1} scoring from scoreboard - Home: ${scoringByQuarter[i + 1][gameInfo.homeTeam]}, Away: ${scoringByQuarter[i + 1][gameInfo.awayTeam]}`);
        }
      } 
      // If no scoreboard, try using boxScore quarters
      else if (data.boxScore?.teams?.quarters && Array.isArray(data.boxScore.teams.quarters)) {
        console.log("Using box score quarters data");
        const quartersData = data.boxScore.teams.quarters;
        
        quartersData.forEach(qData => {
          if (qData.quarter >= 1 && qData.quarter <= 4) {
            scoringByQuarter[qData.quarter] = {
              [gameInfo.homeTeam]: typeof qData.homeScore === 'number' ? qData.homeScore : 0,
              [gameInfo.awayTeam]: typeof qData.awayScore === 'number' ? qData.awayScore : 0
            };
            console.log(`Quarter ${qData.quarter} from box score - Home: ${scoringByQuarter[qData.quarter][gameInfo.homeTeam]}, Away: ${scoringByQuarter[qData.quarter][gameInfo.awayTeam]}`);
          }
        });
      }
      // Fallback to calculating from play-by-play
      else {
        console.log("Calculating quarter scores from play-by-play data");
        
        for (let i = 1; i <= 4; i++) {
          const quarterPlays = playsByQuarter[i] || [];
          
          // Initialize quarter scoring
          let homeScoring = 0;
          let awayScoring = 0;
          
          // Track scoring plays in this quarter
          quarterPlays.forEach(play => {
            if (play.scoring) {
              const scoringTeam = play.offense || play.team;
              let points = 0;
              
              // Calculate points based on play type
              if (play.play_type === 'Rushing Touchdown' || play.play_type === 'Passing Touchdown' || play.playType?.includes('Touchdown')) {
                points = play.play_text?.includes('KICK') || play.playText?.includes('KICK') ? 7 : 6;
              } else if (play.play_type === 'Field Goal Good' || play.playType?.includes('Field Goal')) {
                points = 3;
              } else if (play.play_type?.includes('Safety') || play.playType?.includes('Safety')) {
                points = 2;
              }
              
              // Add points to the appropriate team
              if (scoringTeam === gameInfo.homeTeam) {
                homeScoring += points;
              } else if (scoringTeam === gameInfo.awayTeam) {
                awayScoring += points;
              }
            }
          });
          
          scoringByQuarter[i] = {
            [gameInfo.homeTeam]: homeScoring,
            [gameInfo.awayTeam]: awayScoring
          };
      
          console.log(`Quarter ${i} scoring calculated - Home: ${homeScoring}, Away: ${awayScoring}`);
        }
      }
      
      // Check for missing quarters (should have all 4)
      for (let i = 1; i <= 4; i++) {
        if (!scoringByQuarter[i]) {
          scoringByQuarter[i] = {
            [gameInfo.homeTeam]: 0,
            [gameInfo.awayTeam]: 0
          };
        }
      }
      
      // Validate total points match final score
      const totalHomeScore = Object.values(scoringByQuarter).reduce((sum, q) => sum + q[gameInfo.homeTeam], 0);
      const totalAwayScore = Object.values(scoringByQuarter).reduce((sum, q) => sum + q[gameInfo.awayTeam], 0);
      
      // If totals don't match final score, adjust the fourth quarter
      if (totalHomeScore !== gameInfo.homePoints || totalAwayScore !== gameInfo.awayPoints) {
        console.log(`Quarter score totals (${totalHomeScore}-${totalAwayScore}) don't match final score (${gameInfo.homePoints}-${gameInfo.awayPoints}), adjusting...`);
        
        const homeAdjustment = gameInfo.homePoints - totalHomeScore;
        const awayAdjustment = gameInfo.awayPoints - totalAwayScore;
        
        scoringByQuarter[4] = {
          [gameInfo.homeTeam]: Math.max(0, (scoringByQuarter[4][gameInfo.homeTeam] + homeAdjustment)),
          [gameInfo.awayTeam]: Math.max(0, (scoringByQuarter[4][gameInfo.awayTeam] + awayAdjustment))
        };
        
        console.log(`Adjusted Q4 - Home: ${scoringByQuarter[4][gameInfo.homeTeam]}, Away: ${scoringByQuarter[4][gameInfo.awayTeam]}`);
      }
      
      // Extract period-by-period (quarter) PPA performance
      const quarters = ['quarter1', 'quarter2', 'quarter3', 'quarter4'];
      
      // Fix for the PPA values - use total PPA from the homeTeamData and awayTeamData
      // This ensures the Team Efficiency chart uses the correct values
      const homeTotalPPA = homeTeamData?.overall?.total || 0;
      const awayTotalPPA = awayTeamData?.overall?.total || 0;
      
      // These values are stored directly in the teamEfficiency object later
      
      const quarterAnalysis = quarters.map((quarter, index) => {
        // Get PPA values or default to 0
        // Note: box score data might have null for some quarters even when play-by-play has data
        const homeQuarterPPA = homeTeamData?.overall?.[quarter] !== null ? homeTeamData?.overall?.[quarter] || 0 : 0;
        const awayQuarterPPA = awayTeamData?.overall?.[quarter] !== null ? awayTeamData?.overall?.[quarter] || 0 : 0;
        
        // Get scoring from the calculated values
        const homeScoring = scoringByQuarter[index + 1]?.[gameInfo.homeTeam] || 0;
        const awayScoring = scoringByQuarter[index + 1]?.[gameInfo.awayTeam] || 0;
        
        return {
          quarter: index + 1,
          homePPA: homeQuarterPPA,
          awayPPA: awayQuarterPPA,
          homeAdvantage: homeQuarterPPA > awayQuarterPPA,
          significance: Math.abs(homeQuarterPPA - awayQuarterPPA) > 0.3 ? 'significant' : 'moderate',
          homeScoring: homeScoring,
          awayScoring: awayScoring,
          scoringDiff: homeScoring - awayScoring
        };
      });
      
      // Extract offensive and defensive efficiency by play type
      const passingEfficiency = {
        [gameInfo.homeTeam]: homeTeamData?.passing?.total || 0,
        [gameInfo.awayTeam]: awayTeamData?.passing?.total || 0,
      };
      
      const rushingEfficiency = {
        [gameInfo.homeTeam]: homeTeamData?.rushing?.total || 0,
        [gameInfo.awayTeam]: awayTeamData?.rushing?.total || 0,
      };
      
      // Analyze team strengths based on efficiency metrics
      const teamStrengths = {
        [gameInfo.homeTeam]: [],
        [gameInfo.awayTeam]: []
      };
      
      // Determine passing strength
      if (passingEfficiency[gameInfo.homeTeam] > 0.3) {
        teamStrengths[gameInfo.homeTeam].push('Efficient passing attack');
      }
      if (passingEfficiency[gameInfo.awayTeam] > 0.3) {
        teamStrengths[gameInfo.awayTeam].push('Efficient passing attack');
      }
      
      // Determine rushing strength
      if (rushingEfficiency[gameInfo.homeTeam] > 0.3) {
        teamStrengths[gameInfo.homeTeam].push('Strong rushing game');
      }
      if (rushingEfficiency[gameInfo.awayTeam] > 0.3) {
        teamStrengths[gameInfo.awayTeam].push('Strong rushing game');
      }
      
      // Determine explosiveness as a strength
      if (homeExplosiveness?.overall?.total > 1.5) {
        teamStrengths[gameInfo.homeTeam].push('Explosive play capability');
      }
      if (awayExplosiveness?.overall?.total > 1.5) {
        teamStrengths[gameInfo.awayTeam].push('Explosive play capability');
      }
      
      // Evaluate red zone efficiency
      if (homeScoringOpps?.pointsPerOpportunity > 5) {
        teamStrengths[gameInfo.homeTeam].push('Excellent red zone efficiency');
      }
      if (awayScoringOpps?.pointsPerOpportunity > 5) {
        teamStrengths[gameInfo.awayTeam].push('Excellent red zone efficiency');
      }
      
      // Find key plays based on EPA/PPA and context
      const keyPlays = [];
      plays.forEach(play => {
        // Skip non-meaningful plays
        if (play.playType === "Timeout" || play.playType === "End Period" || play.playType === "Kickoff" ||
            play.play_type === "Timeout" || play.play_type === "End Period" || play.play_type === "Kickoff") {
          return;
        }
        
        // Try to determine EPA or use PPA as fallback
        const playImpact = play.epa || play.ppa || 0;
        
        // High impact plays
        if (Math.abs(playImpact) > 2) {
          keyPlays.push({
            period: play.period || 1,
            clock: play.clock || { minutes: 0, seconds: 0 },
            playText: play.playText || play.play_text || "Play description unavailable",
            team: play.offense || play.team || "Unknown",
            epa: playImpact,
            scoringPlay: play.scoring || false,
            playType: play.playType || play.play_type || "Unknown Play Type",
            yardsGained: play.yardsGained || 0,
            down: play.down || 1,
            distance: play.distance || 10,
            importance: 'high'
          });
        }
        // Scoring plays that aren't already captured
        else if (play.scoring && Math.abs(playImpact) > 0.5) {
          keyPlays.push({
            period: play.period || 1,
            clock: play.clock || { minutes: 0, seconds: 0 },
            playText: play.playText || play.play_text || "Play description unavailable",
            team: play.offense || play.team || "Unknown",
            epa: playImpact,
            scoringPlay: true,
            playType: play.playType || play.play_type || "Unknown Play Type",
            yardsGained: play.yardsGained || 0,
            down: play.down || 1,
            distance: play.distance || 10,
            importance: 'medium'
          });
        }
        // Third/fourth down conversions in important game situations
        else if ((play.down === 3 || play.down === 4) && 
                play.yardsGained >= play.distance &&
                play.period >= 3 &&
                Math.abs(playImpact) > 0.8) {
          keyPlays.push({
            period: play.period || 1,
            clock: play.clock || { minutes: 0, seconds: 0 },
            playText: play.playText || play.play_text || "Play description unavailable",
            team: play.offense || play.team || "Unknown",
            epa: playImpact,
            scoringPlay: play.scoring || false,
            playType: play.playType || play.play_type || "Unknown Play Type",
            yardsGained: play.yardsGained || 0,
            down: play.down || 1,
            distance: play.distance || 10,
            importance: 'medium'
          });
        }
        // Explosive plays
        else if (
          (play.playType === "Rush" || play.play_type === "Rush") && play.yardsGained >= 20 ||
          ((play.playType === "Pass Reception" || play.play_type === "Pass Reception") && play.yardsGained >= 30)
        ) {
          keyPlays.push({
            period: play.period || 1,
            clock: play.clock || { minutes: 0, seconds: 0 },
            playText: play.playText || play.play_text || "Play description unavailable",
            team: play.offense || play.team || "Unknown",
            epa: playImpact,
            scoringPlay: play.scoring || false,
            playType: play.playType || play.play_type || "Unknown Play Type",
            yardsGained: play.yardsGained || 0,
            down: play.down || 1,
            distance: play.distance || 10,
            importance: play.period >= 3 ? 'medium' : 'standard'
          });
        }
        // Turnovers
        else if (
          (play.playType?.includes("Interception") || play.play_type?.includes("Interception")) || 
          (play.playText?.includes("fumble") || play.play_text?.includes("fumble"))
        ) {
          keyPlays.push({
            period: play.period || 1,
            clock: play.clock || { minutes: 0, seconds: 0 },
            playText: play.playText || play.play_text || "Play description unavailable",
            team: play.offense || play.team || "Unknown",
            epa: playImpact,
            scoringPlay: play.scoring || false,
            playType: play.playType || play.play_type || "Unknown Play Type",
            yardsGained: play.yardsGained || 0,
            down: play.down || 1,
            distance: play.distance || 10,
            importance: play.period >= 3 ? 'high' : 'medium'
          });
        }
      });
      
      // Sort by importance first, then by absolute EPA value
      keyPlays.sort((a, b) => {
        const importanceValues = { 'high': 3, 'medium': 2, 'standard': 1 };
        const importanceDiff = importanceValues[b.importance] - importanceValues[a.importance];
        if (importanceDiff !== 0) return importanceDiff;
        return Math.abs(b.epa) - Math.abs(a.epa);
      });
      
      // Cap the number of key plays to show
      const maxKeyPlays = 12;
      const selectedKeyPlays = keyPlays.slice(0, maxKeyPlays);
      
      // Enhanced team efficiency analysis
      const teamEfficiency = {
        // Include the total PPA values
        homeTotalPPA,
        awayTotalPPA,
        passingComparison: {
          [gameInfo.homeTeam]: passingEfficiency[gameInfo.homeTeam],
          [gameInfo.awayTeam]: passingEfficiency[gameInfo.awayTeam],
          advantage: passingEfficiency[gameInfo.homeTeam] > passingEfficiency[gameInfo.awayTeam] 
            ? gameInfo.homeTeam : gameInfo.awayTeam,
          margin: Math.abs(passingEfficiency[gameInfo.homeTeam] - passingEfficiency[gameInfo.awayTeam])
        },
        rushingComparison: {
          [gameInfo.homeTeam]: rushingEfficiency[gameInfo.homeTeam],
          [gameInfo.awayTeam]: rushingEfficiency[gameInfo.awayTeam],
          advantage: rushingEfficiency[gameInfo.homeTeam] > rushingEfficiency[gameInfo.awayTeam] 
            ? gameInfo.homeTeam : gameInfo.awayTeam,
          margin: Math.abs(rushingEfficiency[gameInfo.homeTeam] - rushingEfficiency[gameInfo.awayTeam])
        },
        successRates: {
          [gameInfo.homeTeam]: homeSuccessRate?.overall?.total || 0,
          [gameInfo.awayTeam]: awaySuccessRate?.overall?.total || 0,
          advantage: (homeSuccessRate?.overall?.total || 0) > (awaySuccessRate?.overall?.total || 0)
            ? gameInfo.homeTeam : gameInfo.awayTeam
        },
        explosiveness: {
          [gameInfo.homeTeam]: homeExplosiveness?.overall?.total || 0,
          [gameInfo.awayTeam]: awayExplosiveness?.overall?.total || 0,
          advantage: (homeExplosiveness?.overall?.total || 0) > (awayExplosiveness?.overall?.total || 0)
            ? gameInfo.homeTeam : gameInfo.awayTeam
        },
        scoringOpportunities: {
          [gameInfo.homeTeam]: {
            count: homeScoringOpps?.opportunities || 0,
            points: homeScoringOpps?.points || 0,
            perOpportunity: homeScoringOpps?.pointsPerOpportunity || 0
          },
          [gameInfo.awayTeam]: {
            count: awayScoringOpps?.opportunities || 0,
            points: awayScoringOpps?.points || 0,
            perOpportunity: awayScoringOpps?.pointsPerOpportunity || 0
          }
        },
        fieldPosition: {
          [gameInfo.homeTeam]: homeFieldPos?.averageStart || 0,
          [gameInfo.awayTeam]: awayFieldPos?.averageStart || 0,
          advantage: (homeFieldPos?.averageStart || 0) < (awayFieldPos?.averageStart || 0)
            ? gameInfo.homeTeam : gameInfo.awayTeam
        }
      };
      
      // Get standout player performances
      const players = data.boxScore.players?.ppa || [];
      
      // Define qualifying plays threshold
      const MIN_PLAYS_THRESHOLD = 3;
      
      // Filter and enhance player data
      const starPlayers = players
        .filter(player => {
          // Make sure we have valid player data
          if (!player.player || !player.team) return false;
          
          // Check if player had significant impact (PPA > 0.6 and multiple plays)
          const cumulativePPA = player.cumulative?.total || 0;
          const totalPlays = player.plays || 0;
          return cumulativePPA > 0.6 && totalPlays >= MIN_PLAYS_THRESHOLD;
        })
        .map(player => {
          // Get position-specific stats
          const isQB = player.position === 'QB';
          const isRB = player.position === 'RB';
          const isWR = player.position === 'WR' || player.position === 'TE';
          
          // Get position-specific plays
          const passPlays = isQB ? player.plays : 0;
          const rushPlays = isRB ? player.plays : 0;
          const receivingPlays = isWR ? player.plays : 0;
          
          // Get PPA by play type
          const passingPPA = isQB ? (player.average?.passing?.total || 0) : 0;
          const rushingPPA = player.average?.rushing?.total || 0;
          
          // Determine player role and effectiveness
          let playerRole = player.position;
          let effectiveness = 'solid';
          
          if (player.average?.total > 1.0) effectiveness = 'elite';
          else if (player.average?.total > 0.7) effectiveness = 'excellent';
          
          // Create a strength description
          let strengthDescription = '';
          
          if (isQB) {
            if (passingPPA > 0.7) strengthDescription = 'Efficient passer';
            else if (rushingPPA > 0.7) strengthDescription = 'Dual-threat capability';
          } else if (isRB) {
            if (rushingPPA > 0.7) strengthDescription = 'Explosive runner';
          } else if (isWR) {
            strengthDescription = 'Reliable target';
          } else {
            // For defensive or other players
            strengthDescription = 'Impact player';
          }
          
          return {
            name: player.player,
            team: player.team,
            position: player.position || "Unknown",
            ppaAverage: player.average?.total || 0,
            ppaCumulative: player.cumulative?.total || 0,
            plays: player.plays || 0,
            playType: {
              passing: passingPPA,
              rushing: rushingPPA
            },
            effectiveness,
            strengthDescription
          };
        })
        .sort((a, b) => b.ppaCumulative - a.ppaCumulative);
      
      // Cap the number of star players to show
      const topPlayerCount = Math.min(8, starPlayers.length);
      const topPlayers = starPlayers.slice(0, topPlayerCount);
      
      // Generate key matchup insights
      const teamComparisonInsights = [];
      
      // Passing offense comparison
      if (Math.abs(passingEfficiency[gameInfo.homeTeam] - passingEfficiency[gameInfo.awayTeam]) > 0.3) {
        const betterPassingTeam = passingEfficiency[gameInfo.homeTeam] > passingEfficiency[gameInfo.awayTeam] 
          ? gameInfo.homeTeam : gameInfo.awayTeam;
        teamComparisonInsights.push({
          aspect: 'Passing Game',
          advantage: betterPassingTeam,
          description: `${betterPassingTeam} had the superior passing attack (${passingEfficiency[betterPassingTeam].toFixed(2)} PPA vs ${passingEfficiency[betterPassingTeam === gameInfo.homeTeam ? gameInfo.awayTeam : gameInfo.homeTeam].toFixed(2)})`
        });
      }
      
      // Rushing offense comparison
      if (Math.abs(rushingEfficiency[gameInfo.homeTeam] - rushingEfficiency[gameInfo.awayTeam]) > 0.2) {
        const betterRushingTeam = rushingEfficiency[gameInfo.homeTeam] > rushingEfficiency[gameInfo.awayTeam] 
          ? gameInfo.homeTeam : gameInfo.awayTeam;
        teamComparisonInsights.push({
          aspect: 'Ground Game',
          advantage: betterRushingTeam,
          description: `${betterRushingTeam} controlled the ground game (${rushingEfficiency[betterRushingTeam].toFixed(2)} rushing PPA)`
        });
      }
      
      // Field position advantage
      const homeFP = parseFloat(teamEfficiency.fieldPosition[gameInfo.homeTeam]) || 0;
      const awayFP = parseFloat(teamEfficiency.fieldPosition[gameInfo.awayTeam]) || 0;
      
      if (Math.abs(homeFP - awayFP) > 5) {
        const betterFieldPosTeam = homeFP < awayFP ? gameInfo.homeTeam : gameInfo.awayTeam;
        teamComparisonInsights.push({
          aspect: 'Field Position',
          advantage: betterFieldPosTeam,
          description: `${betterFieldPosTeam} enjoyed better starting field position (own ${betterFieldPosTeam === gameInfo.homeTeam ? homeFP : awayFP} yard line)`
        });
      }
      
      // Explosiveness advantage
      if (Math.abs(teamEfficiency.explosiveness[gameInfo.homeTeam] - teamEfficiency.explosiveness[gameInfo.awayTeam]) > 0.3) {
        const moreExplosiveTeam = teamEfficiency.explosiveness.advantage;
        teamComparisonInsights.push({
          aspect: 'Explosiveness',
          advantage: moreExplosiveTeam,
          description: `${moreExplosiveTeam} generated more explosive plays (${teamEfficiency.explosiveness[moreExplosiveTeam].toFixed(2)} vs ${teamEfficiency.explosiveness[moreExplosiveTeam === gameInfo.homeTeam ? gameInfo.awayTeam : gameInfo.homeTeam].toFixed(2)})`
        });
      }
      
      // Red zone efficiency
      const homeRedZone = teamEfficiency.scoringOpportunities[gameInfo.homeTeam].perOpportunity;
      const awayRedZone = teamEfficiency.scoringOpportunities[gameInfo.awayTeam].perOpportunity;
      
      if (Math.abs(homeRedZone - awayRedZone) > 1) {
        const betterRedZoneTeam = homeRedZone > awayRedZone ? gameInfo.homeTeam : gameInfo.awayTeam;
        teamComparisonInsights.push({
          aspect: 'Red Zone',
          advantage: betterRedZoneTeam,
          description: `${betterRedZoneTeam} was more efficient in scoring opportunities (${betterRedZoneTeam === gameInfo.homeTeam ? homeRedZone : awayRedZone} pts/opp)`
        });
      }
      
      // Generate narrative overview
      const starPlayerInfo = topPlayers.length > 0 ? 
        `${topPlayers[0].name} (${topPlayers[0].position}, ${topPlayers[0].team}) was the standout performer with a cumulative PPA of ${topPlayers[0].ppaCumulative.toFixed(1)}.` : 
        '';
      
      // Create a game description based on the scoring pattern
      const gameFlow = determineGameFlow(quarterAnalysis, gameInfo);
      
      // Generate detailed quarter summaries
      const quarterSummaries = quarterAnalysis.map((q, index) => {
        let quarterDescription = '';
        const homePts = q.homeScoring;
        const awayPts = q.awayScoring;
        const scoringDiff = homePts - awayPts;
        const quarterNum = index + 1;
        
        if (Math.abs(scoringDiff) === 0) {
          quarterDescription = `Q${quarterNum}: Both teams scored ${homePts} points in an even quarter.`;
        } else {
          const dominantTeam = scoringDiff > 0 ? gameInfo.homeTeam : gameInfo.awayTeam;
          const scoringMargin = Math.abs(scoringDiff);
          quarterDescription = `Q${quarterNum}: ${dominantTeam} outscored their opponent ${scoringDiff > 0 ? homePts : awayPts}-${scoringDiff > 0 ? awayPts : homePts}`;
          
          if (q.homeAdvantage !== (scoringDiff > 0)) {
            // Team with PPA advantage didn't outscore opponent
            quarterDescription += ` despite ${scoringDiff > 0 ? gameInfo.awayTeam : gameInfo.homeTeam} having a slight efficiency advantage.`;
          } else {
            quarterDescription += `.`;
          }
        }
        
        return quarterDescription;
      });
      
      // Generate a statistical keys to victory
      const keysToVictory = generateKeysToVictory(gameInfo, teamEfficiency, winner);
      
      // Complete game overview with enhanced narrative
      const overview = `${winner} defeated ${loser} ${winnerPoints}-${loserPoints} in ${gameDescription(scoreDifference)}. ${starPlayerInfo} ${gameFlow}`;
      
      // Game story with more tactical insights
      const gameStory = `${winner} ${winnerPoints > loserPoints + 14 ? 'dominated' : 'edged'} ${loser} in ${keysToVictory.map(k => k.toLowerCase()).join(', ')}. ${teamComparisonInsights.length > 1 ? teamComparisonInsights[0].description + ' while ' + teamComparisonInsights[1].description + '.' : ''}`;
      
      // Generate turning point of the game
      const turningPoint = identifyTurningPoint(keyPlays, gameInfo);
      
      return {
        gameId: data.playByPlay?.gameId,
        gameInfo,
        homeWin,
        winner,
        loser,
        scoreDifference,
        isCloseGame,
        overview,
        quarterAnalysis,
        keyPlays: selectedKeyPlays,
        teamEfficiency,
        starPlayers: topPlayers,
        gameStory,
        quarterSummaries,
        teamStrengths,
        teamComparisonInsights,
        turningPoint,
        keysToVictory
      };
    } catch (err) {
      console.error("Error generating game analysis:", err);
      throw new Error("Failed to generate comprehensive game analysis");
    }
  };
  
  /**
   * Helper function to determine game flow based on quarter analysis
   * @param {Array} quarterAnalysis - Array of quarter analysis objects
   * @param {Object} gameInfo - Game info object
   * @returns {string} Game flow description
   */
  export const determineGameFlow = (quarterAnalysis, gameInfo) => {
    // Check if any quarter data is available
    if (!quarterAnalysis || quarterAnalysis.length === 0) {
      return "Game flow details unavailable.";
    }
    
    // Analyze scoring patterns
    const firstHalfHomeScore = (quarterAnalysis[0]?.homeScoring || 0) + (quarterAnalysis[1]?.homeScoring || 0);
    const firstHalfAwayScore = (quarterAnalysis[0]?.awayScoring || 0) + (quarterAnalysis[1]?.awayScoring || 0);
    const secondHalfHomeScore = (quarterAnalysis[2]?.homeScoring || 0) + (quarterAnalysis[3]?.homeScoring || 0);
    const secondHalfAwayScore = (quarterAnalysis[2]?.awayScoring || 0) + (quarterAnalysis[3]?.awayScoring || 0);
    
    const firstHalfDominant = firstHalfHomeScore > firstHalfAwayScore ? gameInfo.homeTeam : gameInfo.awayTeam;
    const secondHalfDominant = secondHalfHomeScore > secondHalfAwayScore ? gameInfo.homeTeam : gameInfo.awayTeam;
    
    const firstHalfMargin = Math.abs(firstHalfHomeScore - firstHalfAwayScore);
    const secondHalfMargin = Math.abs(secondHalfHomeScore - secondHalfAwayScore);
    
    // Check for comeback scenarios
    if (firstHalfDominant !== secondHalfDominant && secondHalfMargin > 7) {
      return `${secondHalfDominant} mounted a second half comeback, outscoring their opponent ${secondHalfDominant === gameInfo.homeTeam ? secondHalfHomeScore : secondHalfAwayScore}-${secondHalfDominant === gameInfo.homeTeam ? secondHalfAwayScore : secondHalfHomeScore} after halftime.`;
    }
    
    // Check for wire-to-wire dominance
    if (firstHalfDominant === secondHalfDominant && firstHalfMargin > 7 && secondHalfMargin > 7) {
      return `${firstHalfDominant} controlled the game from start to finish, dominating both halves.`;
    }
    
    // Check for early dominance holding on
    if (firstHalfMargin > 14 && secondHalfMargin < 7) {
      return `${firstHalfDominant} built a substantial early lead and held on for the victory.`;
    }
    
    // Late game surge
    if (firstHalfMargin < 7 && secondHalfMargin > 14) {
      return `After a close first half, ${secondHalfDominant} pulled away in the second half to secure the win.`;
    }
    
    // Back and forth game
    const leadChanges = countLeadChanges(quarterAnalysis);
    if (leadChanges >= 2) {
      return `The lead changed hands ${leadChanges} times in this back-and-forth contest.`;
    }
    
    // Default description for close games
    return `The game remained competitive throughout with neither team able to build a commanding lead.`;
  };
  
  /**
   * Helper to count approximate lead changes based on quarter-by-quarter scoring
   * @param {Array} quarterAnalysis - Array of quarter analysis objects
   * @returns {number} Number of lead changes
   */
  export const countLeadChanges = (quarterAnalysis) => {
    let leadChanges = 0;
    let homeTeamLeading = false;
    let homeScore = 0;
    let awayScore = 0;
    
    // Process each quarter
    quarterAnalysis.forEach(quarter => {
      homeScore += quarter.homeScoring;
      awayScore += quarter.awayScoring;
      
      const currentHomeLeading = homeScore > awayScore;
      if (currentHomeLeading !== homeTeamLeading && quarter.quarter > 1) {
        leadChanges++;
      }
      homeTeamLeading = currentHomeLeading;
    });
    
    return leadChanges;
  };
  
  /**
   * Helper function to describe game based on margin
   * @param {number} margin - Point margin of the game
   * @returns {string} Game description phrase
   */
  export const gameDescription = (margin) => {
    if (margin >= 28) return 'a dominant blowout';
    if (margin >= 21) return 'a decisive victory';
    if (margin >= 14) return 'a comfortable win';
    if (margin >= 8) return 'a solid victory';
    if (margin >= 4) return 'a competitive game';
    if (margin >= 1) return 'a nail-biter';
    return 'a closely contested battle';
  };
  
  /**
   * Generate keys to victory
   * @param {Object} gameInfo - Game info object
   * @param {Object} teamEfficiency - Team efficiency data
   * @param {string} winner - Winner team name
   * @returns {Array} Keys to victory
   */
  export const generateKeysToVictory = (gameInfo, teamEfficiency, winner) => {
    const keys = [];
    
    // Determine if passing or rushing was key
    const winnerPassingPPA = teamEfficiency.passingComparison[winner];
    const winnerRushingPPA = teamEfficiency.rushingComparison[winner];
    
    if (winnerPassingPPA > 0.3 && winnerPassingPPA > winnerRushingPPA) {
      keys.push('Passing Efficiency');
    }
    
    if (winnerRushingPPA > 0.3) {
      keys.push('Running Game Control');
    }
    
    // Check for field position advantage
    if (teamEfficiency.fieldPosition.advantage === winner) {
      keys.push('Field Position');
    }
    
    // Check for red zone efficiency
    const winnerRedZone = teamEfficiency.scoringOpportunities[winner].perOpportunity;
    if (winnerRedZone > 5) {
      keys.push('Red Zone Efficiency');
    }
    
    // Check for explosiveness
    if (teamEfficiency.explosiveness.advantage === winner && 
        teamEfficiency.explosiveness[winner] > 1.3) {
      keys.push('Explosive Play Generation');
    }
    
    // If we don't have enough keys, add a generic one
    if (keys.length < 2) {
      keys.push('Overall Execution');
    }
    
    return keys;
  };
  
  /**
   * Identify the turning point of the game
   * @param {Array} keyPlays - Array of key plays
   * @param {Object} gameInfo - Game info object
   * @returns {Object} Turning point details
   */
  export const identifyTurningPoint = (keyPlays, gameInfo) => {
    if (!keyPlays || keyPlays.length === 0) {
      return {
        exists: false,
        description: "No clear turning point identified."
      };
    }
    
    // Look for high-impact plays in the second half
    const secondHalfPlays = keyPlays.filter(play => play.period > 2);
    if (secondHalfPlays.length === 0) {
      // Fall back to first half if necessary
      const biggestPlay = keyPlays[0];
      return {
        exists: true,
        play: biggestPlay,
        description: `${biggestPlay.team}'s ${biggestPlay.playType.toLowerCase()} for ${biggestPlay.yardsGained} yards in the ${getOrdinalNum(biggestPlay.period)} quarter was a key momentum changer.`,
        period: biggestPlay.period,
        team: biggestPlay.team
      };
    }
    
    // Find the highest impact play in the second half
    const turningPoint = secondHalfPlays[0];
    
    return {
      exists: true,
      play: turningPoint,
      description: `${turningPoint.scoringPlay ? "A scoring play by " : ""}${turningPoint.team} in the ${getOrdinalNum(turningPoint.period)} quarter (${turningPoint.clock.minutes}:${turningPoint.clock.seconds < 10 ? '0' : ''}${turningPoint.clock.seconds}) shifted momentum decisively.`,
      period: turningPoint.period,
      team: turningPoint.team
    };
  };
  
  /**
   * Helper for ordinal numbers
   * @param {number} n - The number
   * @returns {string} Number with ordinal suffix
   */
  export const getOrdinalNum = (n) => {
    const suffixes = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return n + (suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0]);
  };