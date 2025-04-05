// Update the processPlayerStats function to handle the new data structure

// Function to get grade color based on grade value
export const getGradeColor = (grade) => {
  if (grade >= 90) return '#2ecc71'; // Elite (A+)
  if (grade >= 80) return '#27ae60'; // Excellent (A/A-)
  if (grade >= 70) return '#3498db'; // Very Good (B)
  if (grade >= 60) return '#2980b9'; // Above Average (C+)
  if (grade >= 50) return '#f1c40f'; // Average (C)
  if (grade >= 40) return '#e67e22'; // Below Average (D)
  if (grade >= 30) return '#e74c3c'; // Poor (F)
  return '#c0392b';                  // Very Poor (F-)
};

// Function to get grade description
export const getGradeDescription = (grade) => {
  if (grade >= 90) return 'Elite';
  if (grade >= 80) return 'Excellent';
  if (grade >= 70) return 'Very Good';
  if (grade >= 60) return 'Above Average';
  if (grade >= 50) return 'Average';
  if (grade >= 40) return 'Below Average';
  if (grade >= 30) return 'Poor';
  return 'Very Poor';
};

// Function to render player's key stat based on position and stats
export const renderPlayerKeyStat = (player) => {
  if (!player || !player.stats) return null;
  
  const { stats, position } = player;
  
  // QB: Show passing yards and TDs
  if (position === 'QB' && stats.passing) {
    return `${stats.passing.yards || 0} pass yds, ${stats.passing.touchdowns || 0} TDs`;
  }
  
  // RB: Show rushing yards and TDs
  if ((position === 'RB' || position === 'FB') && stats.rushing) {
    return `${stats.rushing.yards || 0} rush yds, ${stats.rushing.touchdowns || 0} TDs`;
  }
  
  // WR/TE: Show receiving yards and receptions
  if ((position === 'WR' || position === 'TE') && stats.receiving) {
    return `${stats.receiving.yards || 0} rec yds, ${stats.receiving.receptions || 0} catches`;
  }
  
  // Defense: Show tackles and sacks if available
  if (['DL', 'DE', 'DT', 'LB', 'CB', 'S', 'DB'].some(p => position.includes(p)) && stats.defense) {
    return `${stats.defense.tackles || 0} tackles, ${stats.defense.sacks || 0} sacks`;
  }
  
  // Default: show PPA if available
  if (player.ppa !== undefined) {
    return `PPA: ${player.ppa.toFixed(2)}`;
  }
  
  return null;
};

export const processPlayerStats = (playersData) => {
  // Check if the data is from the advanced box score
  if (playersData?.players?.usage && playersData?.players?.ppa) {
    const usageData = playersData.players.usage;
    const ppaData = playersData.players.ppa;

    return usageData.map(player => {
      // Find corresponding PPA data for this player
      const playerPPA = ppaData.find(p => p.player === player.player);
      
      return {
        id: crypto.randomUUID(), // Unique identifier
        name: player.player,
        team: player.team,
        position: player.position,
        
        // Usage metrics
        usage: player.total,
        rushingUsage: player.rushing,
        passingUsage: player.passing,
        
        // Enhanced stats object to match existing grade calculation method
        stats: {
          passing: playerPPA?.average ? {
            yards: playerPPA.average.passing || 0,
            completions: 0,
            attempts: 0,
            touchdowns: playerPPA.average.passingTouchdowns || 0,
            interceptions: 0
          } : null,
          rushing: playerPPA?.average ? {
            yards: playerPPA.average.rushing || 0,
            attempts: 0,
            touchdowns: playerPPA.average.rushingTouchdowns || 0
          } : null
        },
        
        // PPA metrics with robust fallback
        ppa: playerPPA?.average?.total || playerPPA?.average || 0,
        cumulativePpa: playerPPA?.cumulative?.total || playerPPA?.cumulative || 0,
        
        // Calculate grade using existing method with enhanced fallback
        grade: calculatePlayerGrade(
          {
            position: player.position,
            stats: {
              passing: playerPPA?.average ? 
                { 
                  yards: playerPPA.average.passing || 0,
                  touchdowns: playerPPA.average.passingTouchdowns || 0
                } : null,
              rushing: playerPPA?.average ? 
                { 
                  yards: playerPPA.average.rushing || 0,
                  touchdowns: playerPPA.average.rushingTouchdowns || 0
                } : null
            }
          }, 
          { ppa: playerPPA?.average?.total || playerPPA?.average || 0 }
        )
      };
    });
  }

  // Fallback to existing processing if structure doesn't match
  console.warn('Unexpected player data structure:', playersData);
  return [];
};
