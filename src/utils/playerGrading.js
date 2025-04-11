/**
 * Player Grading Utility
 * Calculates and analyzes player performance based on play-by-play data
 */

/**
 * Calculate player grades based on game data
 * @param {Object} gameData - Object containing playByPlay and boxScore data
 * @returns {Array} Array of player grade objects
 */
export const calculatePlayerGrades = (gameData) => {
    try {
      const players = new Map();
      const teams = new Set();
  
      // Track teams
      if (gameData.boxScore?.gameInfo) {
        const { homeTeam, awayTeam } = gameData.boxScore.gameInfo;
        if (homeTeam) teams.add(homeTeam);
        if (awayTeam) teams.add(awayTeam);
      }
  
      // Import player data from PPA
      if (gameData.boxScore?.players?.ppa && Array.isArray(gameData.boxScore.players.ppa)) {
        gameData.boxScore.players.ppa.forEach(playerData => {
          if (!playerData.player || !playerData.team) return;
          
          // Set a default position if missing
          const position = playerData.position || determinePositionFromRole(playerData.player, playerData.team, gameData);
          
          players.set(playerData.player, {
            name: playerData.player,
            position: position,
            team: playerData.team,
            playDetails: [],
            performanceMetrics: {
              totalPlays: playerData.plays || 0,
              positiveContributions: 0,
              negativeContributions: 0,
              epaContributions: [],
              ppaData: {
                average: playerData.average || {},
                cumulative: playerData.cumulative || {}
              }
            }
          });
        });
      }
  
      // Process plays to extract player information
      const processPlays = (plays) => {
        if (!plays || !Array.isArray(plays)) return;
        
        plays.forEach(play => {
          if (["Timeout", "End Period", "Kickoff"].includes(play.playType)) return;
          
          const parsePlayers = () => {
            const playerMatches = [];
            const playText = play.playText || '';
            if (!playText) return playerMatches;
            
            // Enhanced regex patterns for better player detection
            const playerRegexes = [
              { 
                regex: /([A-Za-z'\-\.\s]+) pass complete to ([A-Za-z'\-\.\s]+) for/i,
                roles: [
                  { name: 1, position: 'QB', role: 'passer' },
                  { name: 2, position: 'WR', role: 'receiver' }
                ]
              },
              {
                regex: /([A-Za-z'\-\.\s]+) pass incomplete to ([A-Za-z'\-\.\s]+)/i,
                roles: [
                  { name: 1, position: 'QB', role: 'passer' },
                  { name: 2, position: 'WR', role: 'target' }
                ]
              },
              { 
                regex: /([A-Za-z'\-\.\s]+) run for/i,
                roles: [
                  { name: 1, position: 'RB', role: 'rusher' }
                ]
              },
              {
                regex: /([A-Za-z'\-\.\s]+) sacked by ([A-Za-z'\-\.\s]+)/i,
                roles: [
                  { name: 1, position: 'QB', role: 'sacked' },
                  { name: 2, position: 'DL', role: 'defender' }
                ]
              },
              {
                regex: /([A-Za-z'\-\.\s]+) pass intercepted/i,
                roles: [
                  { name: 1, position: 'QB', role: 'intercepted' }
                ]
              },
              {
                regex: /([A-Za-z'\-\.\s]+) fumbled/i,
                roles: [
                  { name: 1, position: 'SKILL', role: 'fumble' }
                ]
              },
              {
                regex: /interception by ([A-Za-z'\-\.\s]+)/i,
                roles: [
                  { name: 1, position: 'DB', role: 'defender' }
                ]
              },
              {
                regex: /tackle by ([A-Za-z'\-\.\s]+)/i,
                roles: [
                  { name: 1, position: 'DEF', role: 'tackler' }
                ]
              }
            ];
            
            playerRegexes.forEach(({ regex, roles }) => {
              const match = playText.match(regex);
              if (match) {
                roles.forEach(role => {
                  if (match[role.name] && match[role.name].trim().length > 2) {
                    // Clean the player name to avoid common issues
                    const playerName = cleanPlayerName(match[role.name].trim());
                    
                    playerMatches.push({
                      name: playerName,
                      position: role.position,
                      role: role.role,
                      team: determinePlayerTeam(playerName, role.role, play)
                    });
                  }
                });
              }
            });
            return playerMatches;
          };
  
          const playersInvolved = parsePlayers();
          playersInvolved.forEach(playerInfo => {
            const { name, position, role, team } = playerInfo;
            if (!name || name.length < 2 || !team) return;
            
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
            player.performanceMetrics.totalPlays++;
            
            // Track EPA contribution
            if (play.epa !== undefined && play.epa !== null) {
              // Adjust EPA based on role (e.g., negative for defense on positive offensive play)
              let adjustedEpa = play.epa;
              if ((role === 'defender' || role === 'tackler') && 
                  player.team !== play.offense) {
                adjustedEpa = -adjustedEpa;
              }
              
              player.performanceMetrics.epaContributions.push(adjustedEpa);
              
              if (adjustedEpa > 0) {
                player.performanceMetrics.positiveContributions++;
              } else {
                player.performanceMetrics.negativeContributions++;
              }
            }
            
            // Record play details
            player.playDetails.push({
              playType: play.playType,
              role,
              epa: play.epa,
              yardsGained: play.yardsGained,
              scoring: play.scoring || false,
              period: play.period,
              down: play.down,
              distance: play.distance
            });
            
            players.set(name, player);
          });
        });
      };
  
      // Process all plays to extract player information
      if (gameData.playByPlay?.plays && Array.isArray(gameData.playByPlay.plays)) {
        processPlays(gameData.playByPlay.plays);
      }
  
      // Calculate final grades with an improved algorithm
      const finalGrades = [];
      players.forEach((playerData, name) => {
        const { performanceMetrics } = playerData;
        
        // Improved grade calculation with better weighting
        const calculateGrade = () => {
          try {
            const { totalPlays, positiveContributions, epaContributions, ppaData } = performanceMetrics;
            
            // If player didn't participate enough, assign a baseline grade
            if (totalPlays < 2) {
              return 60;
            }
            
            // Use PPA data if available, otherwise EPA
            let averagePPA = 0;
            if (ppaData && ppaData.average && ppaData.average.total !== undefined) {
              averagePPA = ppaData.average.total;
            } else if (epaContributions.length > 0) {
              averagePPA = epaContributions.reduce((a, b) => a + b, 0) / epaContributions.length;
            }
            
            // Calculate contribution ratio (positive plays / total plays)
            const contributionRatio = totalPlays > 0 ? (positiveContributions / totalPlays) : 0;
            
            // Count scoring plays for bonus points
            const scoringPlayCount = playerData.playDetails.filter(p => p.scoring).length;
            const scoringBonus = scoringPlayCount * 3; // 3 points per scoring play
            
            // Count critical situation plays (3rd/4th down conversions)
            const criticalSituationPlays = playerData.playDetails.filter(p => 
              (p.down === 3 || p.down === 4) && 
              p.yardsGained >= p.distance &&
              p.epa > 0
            ).length;
            const criticalSituationBonus = criticalSituationPlays * 1.5;
            
            // Count big plays
            const bigPlays = playerData.playDetails.filter(p => 
              (p.playType === 'Rush' && p.yardsGained >= 15) ||
              (p.playType === 'Pass Reception' && p.yardsGained >= 25)
            ).length;
            const bigPlayBonus = bigPlays * 1.5;
            
            // Calculate base grade
            let baseGrade = 60; // Starting point
            
            // Add weighted components
            baseGrade += averagePPA * 15; // PPA/EPA component
            baseGrade += contributionRatio * 20; // Play success component
            baseGrade += scoringBonus; // Scoring bonus
            baseGrade += criticalSituationBonus; // Critical situation bonus
            baseGrade += bigPlayBonus; // Big play bonus
            
            // Position-specific adjustments
            const positionMultipliers = {
              'QB': 1.05, // QBs touch the ball on every play, slightly less variance
              'RB': 1.1,
              'WR': 1.1,
              'TE': 1.1,
              'OL': 0.95, // OL has less direct statistical impact
              'DL': 1.0,
              'LB': 1.0,
              'DB': 1.05,
              'CB': 1.05,
              'S': 1.05
            };
            
            const positionMultiplier = positionMultipliers[playerData.position] || 1;
            baseGrade *= positionMultiplier;
            
            // Cap the grade range
            return Math.max(0, Math.min(100, Math.round(baseGrade)));
          } catch (err) {
            console.error(`Error calculating grade for ${name}:`, err);
            return 60; // Default to average grade on error
          }
        };
  
        // Generate player insights based on performance
        const getPlayerInsights = () => {
          const insights = [];
          
          // Scoring contribution insights
          const scoringPlays = playerData.playDetails.filter(p => p.scoring).length;
          if (scoringPlays > 0) {
            insights.push(`Contributed to ${scoringPlays} scoring ${scoringPlays === 1 ? 'play' : 'plays'}`);
          }
          
          // Late game performance
          const lateGamePlays = playerData.playDetails.filter(p => p.period >= 3);
          const goodLateGamePlays = lateGamePlays.filter(p => p.epa && p.epa > 0);
          if (goodLateGamePlays.length > 2) {
            insights.push('Strong late-game performance');
          }
          
          // Position-specific insights
          if (playerData.position === 'QB') {
            const passPlays = playerData.playDetails.filter(p => p.role === 'passer');
            const completionRatio = passPlays.filter(p => !p.playType?.includes('Incompletion')).length / (passPlays.length || 1);
            if (completionRatio > 0.65 && passPlays.length >= 5) {
              insights.push('Efficient passer');
            }
            
            // Mobile QB insight
            const rushingPlays = playerData.playDetails.filter(p => p.role === 'rusher');
            if (rushingPlays.length >= 3) {
              const goodRushes = rushingPlays.filter(p => p.epa > 0);
              if (goodRushes.length >= 2) {
                insights.push('Effective dual-threat ability');
              }
            }
          }
          
          if (playerData.position === 'RB') {
            const rushPlays = playerData.playDetails.filter(p => p.role === 'rusher');
            const bigPlays = rushPlays.filter(p => p.yardsGained && p.yardsGained > 10).length;
            if (bigPlays > 1) {
              insights.push(`${bigPlays} explosive runs`);
            }
            
            // Check for all-purpose contribution
            const receivingPlays = playerData.playDetails.filter(p => p.role === 'receiver');
            if (receivingPlays.length >= 2) {
              insights.push('Valuable in passing game');
            }
          }
          
          if (playerData.position === 'WR' || playerData.position === 'TE') {
            const receivingPlays = playerData.playDetails.filter(p => p.role === 'receiver' || p.role === 'target');
            const catchRate = receivingPlays.filter(p => p.role === 'receiver').length / (receivingPlays.length || 1);
            
            if (catchRate > 0.7 && receivingPlays.length >= 3) {
              insights.push('Reliable hands');
            }
            
            const bigPlays = playerData.playDetails.filter(p => p.yardsGained && p.yardsGained > 20).length;
            if (bigPlays >= 2) {
              insights.push('Big-play threat');
            }
          }
          
          if (['DL', 'LB', 'DB', 'CB', 'S'].includes(playerData.position)) {
            const defensivePlays = playerData.playDetails.filter(p => 
              p.role === 'defender' || p.role === 'tackler'
            );
            
            if (defensivePlays.length >= 3) {
              const impactPlays = defensivePlays.filter(p => p.epa < -0.5);
              if (impactPlays.length >= 2) {
                insights.push('Disruptive defender');
              }
            }
            
            // Check for turnovers forced
            const turnoverPlays = playerData.playDetails.filter(p => 
              p.playType?.includes('Interception') || 
              p.playType?.includes('Fumble Recovery')
            );
            
            if (turnoverPlays.length > 0) {
              insights.push('Generated takeaway');
            }
          }
          
          return insights;
        };
  
        // Add the player with calculated grades and insights
        finalGrades.push({
          ...playerData,
          overallGrade: calculateGrade(),
          playCount: performanceMetrics.totalPlays,
          insights: getPlayerInsights(),
          averagePPA: performanceMetrics.ppaData?.average?.total || 
            (performanceMetrics.epaContributions.length ? 
              performanceMetrics.epaContributions.reduce((a, b) => a + b, 0) / 
              performanceMetrics.epaContributions.length : 0)
        });
      });
  
      // Sort by overall grade
      return finalGrades.sort((a, b) => b.overallGrade - a.overallGrade);
    } catch (err) {
      console.error("Error in player grade calculation:", err);
      return [];
    }
  };
  
  /**
   * Clean player name to prevent duplicates
   * @param {string} name - Player name
   * @returns {string} Cleaned player name
   */
  export const cleanPlayerName = (name) => {
    // Remove common suffixes that cause duplicate entries
    return name.replace(/\s+(Jr\.|Sr\.|III|IV|II|V)$/, '').trim();
  };
  
  /**
   * Determine player team based on play context
   * @param {string} playerName - Player name
   * @param {string} role - Player role in the play
   * @param {Object} play - Play data object
   * @returns {string} Team name
   */
  export const determinePlayerTeam = (playerName, role, play) => {
    // For offensive roles, use the offense team
    if (['passer', 'rusher', 'receiver', 'target'].includes(role)) {
      return play.offense || play.team;
    }
    
    // For defensive roles, use the defense team
    if (['defender', 'tackler'].includes(role)) {
      return play.defense || (play.offense ? (play.offense === play.homeTeam ? play.awayTeam : play.homeTeam) : null);
    }
    
    // Default to the play's team if we can't determine
    return play.team;
  };
  
  /**
   * Determine player position from their role in plays
   * @param {string} playerName - Player name
   * @param {string} team - Team name
   * @param {Object} gameData - Game data object
   * @returns {string} Player position
   */
  export const determinePositionFromRole = (playerName, team, gameData) => {
    // Check if player appears in play-by-play data
    const plays = gameData.playByPlay?.plays || [];
    
    // Check for quarterback patterns
    const qbPlays = plays.filter(p => 
      p.playText && p.playText.includes(`${playerName} pass`)
    );
    if (qbPlays.length > 0) return 'QB';
    
    // Check for running back patterns
    const rbPlays = plays.filter(p => 
      p.playText && p.playText.includes(`${playerName} run for`)
    );
    if (rbPlays.length > 0) return 'RB';
    
    // Check for receiver patterns
    const wrPlays = plays.filter(p => 
      p.playText && p.playText.includes(`pass complete to ${playerName}`)
    );
    if (wrPlays.length > 0) return 'WR';
    
    // Default to generic position
    return 'PLAYER';
  };