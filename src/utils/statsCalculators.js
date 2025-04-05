// Update the processPlayerStats function to handle the new data structure

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
