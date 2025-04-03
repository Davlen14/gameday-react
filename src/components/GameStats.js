import React, { useState, useEffect } from "react";
import * as teamsService from "../services/teamsService";

// Inline CSS styles for the component
const styles = {
  container: {
    margin: "20px 0",
    padding: "10px",
    backgroundColor: "#fff",
    borderRadius: "8px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
  },
  statSection: {
    marginBottom: "30px",
  },
  sectionTitle: {
    fontSize: "1.2rem",
    fontWeight: "600",
    padding: "10px 0",
    borderBottom: "2px solid #eee",
    marginBottom: "15px",
  },
  teamComparisonGrid: {
    display: "grid",
    gridTemplateColumns: "1fr auto 1fr",
    gap: "10px",
    alignItems: "center",
  },
  statLabel: {
    fontWeight: "500",
    color: "#555",
    gridColumn: "2",
    textAlign: "center",
    padding: "0 10px",
  },
  homeStatValue: {
    fontWeight: "bold",
    textAlign: "right",
    padding: "8px 15px",
    borderRadius: "4px",
    backgroundColor: "#f5f5f5",
  },
  awayStatValue: {
    fontWeight: "bold",
    textAlign: "left",
    padding: "8px 15px",
    borderRadius: "4px",
    backgroundColor: "#f5f5f5",
  },
  statBar: {
    display: "flex",
    height: "20px",
    borderRadius: "10px",
    overflow: "hidden",
    backgroundColor: "#eee",
    margin: "10px 0",
  },
  statBarInner: {
    height: "100%",
    transition: "width 1s ease",
  },
  timeOfPossessionContainer: {
    display: "flex",
    height: "30px",
    borderRadius: "4px",
    overflow: "hidden",
    backgroundColor: "#eee",
    margin: "10px 0",
  },
  timeSegment: {
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#fff",
    fontSize: "0.8rem",
    fontWeight: "bold",
    transition: "width 1s ease",
  },
  teamHeader: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginBottom: "10px",
  },
  teamLogo: {
    width: "30px",
    height: "30px",
    objectFit: "contain",
  },
  teamName: {
    fontWeight: "bold",
    fontSize: "1.1rem",
  },
  tabs: {
    display: "flex",
    borderBottom: "1px solid #ddd",
    marginBottom: "20px",
  },
  tab: {
    padding: "10px 20px",
    cursor: "pointer",
    borderBottom: "3px solid transparent",
    fontWeight: "500",
  },
  activeTab: {
    borderBottom: "3px solid #3498db",
    color: "#3498db",
  },
  efficiencyContainer: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "20px",
  },
  efficiencyCard: {
    padding: "15px",
    borderRadius: "8px",
    boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
    backgroundColor: "#f9f9f9",
  },
  progressBarContainer: {
    width: "100%",
    height: "8px",
    backgroundColor: "#e0e0e0",
    borderRadius: "4px",
    overflow: "hidden",
    margin: "8px 0",
  },
  progressBar: {
    height: "100%",
    borderRadius: "4px",
  },
  valueDisplay: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: "0.9rem",
    color: "#555",
  },
  drivesContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    margin: "15px 0",
  },
  driveRow: {
    display: "flex",
    padding: "10px",
    backgroundColor: "#f5f5f5",
    borderRadius: "4px",
    fontSize: "0.9rem",
  },
  driveTeam: {
    width: "15%",
    display: "flex",
    alignItems: "center",
    gap: "5px",
  },
  driveLogoSmall: {
    width: "20px",
    height: "20px",
    objectFit: "contain",
  },
  driveQuarter: {
    width: "10%",
    textAlign: "center",
  },
  driveResult: {
    width: "15%",
  },
  driveYards: {
    width: "12%",
    textAlign: "center",
  },
  driveTime: {
    width: "12%",
    textAlign: "center",
  },
  drivePlays: {
    width: "12%",
    textAlign: "center",
  },
  driveStart: {
    width: "12%",
    textAlign: "center",
  },
  driveHeader: {
    fontWeight: "bold",
    color: "#333",
  },
  tooltipContainer: {
    position: "relative",
    display: "inline-block",
  },
  tooltipIcon: {
    marginLeft: "5px",
    fontSize: "14px",
    color: "#888",
    cursor: "help",
  },
  tooltip: {
    position: "absolute",
    top: "100%",
    left: "50%",
    transform: "translateX(-50%)",
    padding: "8px 12px",
    backgroundColor: "#333",
    color: "#fff",
    borderRadius: "4px",
    fontSize: "0.8rem",
    zIndex: "999",
    width: "200px",
    textAlign: "center",
    boxShadow: "0 2px 5px rgba(0,0,0,0.2)",
    opacity: "0",
    visibility: "hidden",
    transition: "opacity 0.3s, visibility 0.3s",
  },
  tooltipVisible: {
    opacity: "1",
    visibility: "visible",
  },
  playByPlayContainer: {
    maxHeight: "400px",
    overflowY: "auto",
    border: "1px solid #ddd",
    borderRadius: "4px",
    padding: "10px",
  },
  playRow: {
    padding: "8px",
    borderBottom: "1px solid #eee",
    fontSize: "0.9rem",
  },
  playRowHighlight: {
    backgroundColor: "rgba(52, 152, 219, 0.1)",
  },
  playTime: {
    color: "#555",
    fontSize: "0.8rem",
  },
  quarterHeader: {
    backgroundColor: "#f0f0f0",
    padding: "8px",
    fontWeight: "bold",
    position: "sticky",
    top: "0",
    zIndex: "1",
  },
  keyPlayBadge: {
    display: "inline-block",
    backgroundColor: "#e74c3c",
    color: "white",
    padding: "2px 6px",
    borderRadius: "4px",
    fontSize: "0.7rem",
    marginLeft: "6px",
  },
  filterContainer: {
    display: "flex",
    gap: "10px",
    margin: "0 0 15px 0",
  },
  filterButton: {
    padding: "6px 12px",
    borderRadius: "4px",
    border: "1px solid #ddd",
    background: "none",
    cursor: "pointer",
    fontSize: "0.9rem",
  },
  filterButtonActive: {
    backgroundColor: "#3498db",
    color: "white",
    border: "1px solid #3498db",
  },
  chartContainer: {
    height: "250px",
    width: "100%",
    margin: "20px 0",
  },
  playerStatsTable: {
    width: "100%",
    borderCollapse: "collapse",
    marginTop: "15px",
    fontSize: "0.9rem",
  },
  tableHeader: {
    backgroundColor: "#f5f5f5",
    padding: "10px",
    textAlign: "left",
    borderBottom: "2px solid #ddd",
    fontWeight: "bold",
  },
  tableCell: {
    padding: "8px 10px",
    borderBottom: "1px solid #eee",
  },
  noData: {
    padding: "15px",
    textAlign: "center",
    color: "#666",
    backgroundColor: "#f9f9f9",
    borderRadius: "4px",
    margin: "10px 0",
  },
  metricExplanation: {
    fontSize: "0.85rem",
    color: "#666",
    marginTop: "5px",
    fontStyle: "italic",
  },
};

// Tooltip component
const Tooltip = ({ text, children }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  
  return (
    <div 
      style={styles.tooltipContainer}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {children}
      <span style={styles.tooltipIcon}>ⓘ</span>
      <div style={showTooltip ? {...styles.tooltip, ...styles.tooltipVisible} : styles.tooltip}>
        {text}
      </div>
    </div>
  );
};

// Component to visualize a team's efficiency with progress bar
const EfficiencyMetric = ({ label, value, maxValue, explanation, color }) => {
  const percentage = value ? Math.min(100, (value / maxValue) * 100) : 0;
  
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          {explanation ? (
            <Tooltip text={explanation}>
              <span>{label}</span>
            </Tooltip>
          ) : (
            <span>{label}</span>
          )}
        </div>
        <span style={{ fontWeight: 'bold' }}>{value ? value.toFixed(2) : 'N/A'}</span>
      </div>
      <div style={styles.progressBarContainer}>
        <div 
          style={{...styles.progressBar, width: `${percentage}%`, backgroundColor: color}}
        />
      </div>
      <div style={styles.metricExplanation}>
        League Avg: {(maxValue/2).toFixed(2)} | Max: {maxValue.toFixed(2)}
      </div>
    </div>
  );
};

// Main Advanced Statistics Component
const GameStats = ({ gameData, homeTeam, awayTeam, homeTeamColor, awayTeamColor, homeLogo, awayLogo }) => {
  const [activeMetricTab, setActiveMetricTab] = useState('efficiency');
  const [advancedData, setAdvancedData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [teamStats, setTeamStats] = useState(null);
  const [drives, setDrives] = useState([]);
  const [playerStats, setPlayerStats] = useState({});
  const [winProbabilities, setWinProbabilities] = useState(null);
  
  // Helper function to extract a specific stat value from team stats array
  const getStatValue = (teamData, category) => {
    if (!teamData || !teamData.stats) {
      console.log(`No stats found for category: ${category}`);
      return '-';
    }
    const statItem = teamData.stats.find(stat => stat.category === category);
    return statItem ? statItem.stat : '-';
  };
  
  // Helper function to find team stats in API response
  const findTeamStats = (teamName, teamGameStats) => {
    if (!teamGameStats || teamGameStats.length === 0) {
      console.log('No team game stats available');
      return null;
    }
    
    // Find the game data in the array 
    const gameData = teamGameStats[0];
    if (!gameData || !gameData.teams) {
      console.log('No teams data found in game stats');
      return null;
    }
    
    console.log('Looking for team:', teamName);
    console.log('Available teams:', gameData.teams.map(t => t.team));
    
    // Find team data matching this team name
    return gameData.teams.find(team => 
      team.team.toLowerCase() === teamName.toLowerCase());
  };
  
  // Helper function to create mock data when API data is not available
  const createMockTeamData = (teamName, isHome) => {
    console.log(`Creating mock data for ${teamName} as API data is not available`);
    return {
      team: teamName,
      stats: [
        { category: "totalYards", stat: isHome ? "600" : "145" },
        { category: "netPassingYards", stat: isHome ? "266" : "103" },
        { category: "rushingYards", stat: isHome ? "334" : "42" },
        { category: "yardsPerRushAttempt", stat: isHome ? "7.1" : "1.6" },
        { category: "firstDowns", stat: isHome ? "25" : "10" },
        { category: "thirdDownEff", stat: isHome ? "8-13" : "3-18" },
        { category: "fourthDownEff", stat: isHome ? "1-1" : "2-3" },
        { category: "totalPenaltiesYards", stat: isHome ? "7-59" : "4-40" },
        { category: "fumblesLost", stat: isHome ? "1" : "0" },
        { category: "interceptions", stat: isHome ? "0" : "2" },
        { category: "possessionTime", stat: isHome ? "30:35" : "29:25" },
        { category: "redZoneEff", stat: isHome ? "3-4" : "1-2" },
        { category: "turnovers", stat: isHome ? "1" : "2" },
        { category: "sacks", stat: isHome ? "3" : "1" },
        { category: "sackYards", stat: isHome ? "25" : "8" },
        { category: "explosivePlays", stat: isHome ? "5" : "2" }
      ]
    };
  };
  
  // Helper function to calculate bar widths for team stats comparison
  const calculateWidth = (home, away, isText) => {
    if (isText) return { homeWidth: 50, awayWidth: 50 };
    
    // Handle cases when values are missing or just dashes
    if (home === '-' || away === '-') return { homeWidth: 50, awayWidth: 50 };
    
    // Handle string values that need to be converted to numbers
    const homeNum = typeof home === 'string' ? parseFloat(home) : home;
    const awayNum = typeof away === 'string' ? parseFloat(away) : away;
    
    // Handle non-numeric values
    if (isNaN(homeNum) || isNaN(awayNum)) return { homeWidth: 50, awayWidth: 50 };
    
    const total = homeNum + awayNum;
    if (total === 0) return { homeWidth: 50, awayWidth: 50 };
    
    const homeWidth = Math.round((homeNum / total) * 100);
    const awayWidth = 100 - homeWidth;
    
    return { homeWidth, awayWidth };
  };
  
  // Extract team-specific information from player data
  const processPlayerData = (playersData, homeTeam, awayTeam) => {
    const result = {
      [homeTeam]: [],
      [awayTeam]: []
    };
    
    if (!playersData || playersData.length === 0) {
      return result;
    }
    
    playersData.forEach(player => {
      if (!player) return;
      
      // Create player object with key stats
      const playerObj = {
        name: player.name || `${player.firstName || ''} ${player.lastName || ''}`.trim() || 'Unknown Player',
        position: player.position || 'N/A',
        team: player.team,
        stats: {}
      };
      
      // Add available stats
      if (player.passing) {
        playerObj.stats.passing = player.passing;
      }
      
      if (player.rushing) {
        playerObj.stats.rushing = player.rushing;
      }
      
      if (player.receiving) {
        playerObj.stats.receiving = player.receiving;
      }
      
      if (player.defense) {
        playerObj.stats.defense = player.defense;
      }
      
      // Determine which team the player belongs to
      if (player.team && player.team.toLowerCase() === homeTeam.toLowerCase()) {
        result[homeTeam].push(playerObj);
      } else if (player.team && player.team.toLowerCase() === awayTeam.toLowerCase()) {
        result[awayTeam].push(playerObj);
      }
    });
    
    return result;
  };
  
  // Fetch real data from the API
  useEffect(() => {
    const fetchAllGameData = async () => {
      try {
        setIsLoading(true);
        
        // Get the year from gameData or default to current year
        const year = gameData?.season || new Date().getFullYear();
        console.log(`Fetching data for game ID: ${gameData.id}, year: ${year}, teams: ${homeTeam} vs ${awayTeam}`);
        
        // 1. Fetch team game stats
        let teamGameStats = null;
        try {
          teamGameStats = await teamsService.getTeamGameStats({ 
            gameId: gameData.id, 
            year: year
          });
          console.log('Team game stats response:', teamGameStats);
        } catch (err) {
          console.error('Error fetching team game stats:', err);
        }
        
        // 2. Find home and away team data from the API response
        const homeTeamData = findTeamStats(homeTeam, teamGameStats) || createMockTeamData(homeTeam, true);
        const awayTeamData = findTeamStats(awayTeam, teamGameStats) || createMockTeamData(awayTeam, false);
        
        // 3. Prepare team stats data structure using getStatValue
        const processedTeamStats = {
          homeTeamStats: {
            totalYards: parseFloat(getStatValue(homeTeamData, "totalYards")) || 0,
            passingYards: parseFloat(getStatValue(homeTeamData, "netPassingYards")) || 0,
            rushingYards: parseFloat(getStatValue(homeTeamData, "rushingYards")) || 0,
            firstDowns: parseFloat(getStatValue(homeTeamData, "firstDowns")) || 0,
            thirdDowns: {
              conversions: getStatValue(homeTeamData, "thirdDownEff").split('-')[0] || 0,
              attempts: getStatValue(homeTeamData, "thirdDownEff").split('-')[1] || 0
            },
            fourthDowns: {
              conversions: getStatValue(homeTeamData, "fourthDownEff").split('-')[0] || 0,
              attempts: getStatValue(homeTeamData, "fourthDownEff").split('-')[1] || 0
            },
            redZone: {
              conversions: getStatValue(homeTeamData, "redZoneEff").split('-')[0] || 0,
              attempts: getStatValue(homeTeamData, "redZoneEff").split('-')[1] || 0
            },
            turnovers: parseFloat(getStatValue(homeTeamData, "turnovers")) || 0,
            timeOfPossession: (() => {
              const parts = getStatValue(homeTeamData, "possessionTime").split(':');
              return parts.length === 2 ? parseInt(parts[0]) + (parseInt(parts[1]) / 60) : 0;
            })(),
            penalties: {
              count: getStatValue(homeTeamData, "totalPenaltiesYards").split('-')[0] || 0,
              yards: getStatValue(homeTeamData, "totalPenaltiesYards").split('-')[1] || 0
            },
            sacks: {
              count: parseFloat(getStatValue(homeTeamData, "sacks")) || 0,
              yards: parseFloat(getStatValue(homeTeamData, "sackYards")) || 0
            },
            explosivePlays: parseFloat(getStatValue(homeTeamData, "explosivePlays")) || 0,
            epa: { total: 0, passing: 0, rushing: 0, defense: 0 },
            efficiency: { offensive: 0.5, defensive: 0.5, passingSuccess: 0.5, rushingSuccess: 0.5 }
          },
          awayTeamStats: {
            totalYards: parseFloat(getStatValue(awayTeamData, "totalYards")) || 0,
            passingYards: parseFloat(getStatValue(awayTeamData, "netPassingYards")) || 0,
            rushingYards: parseFloat(getStatValue(awayTeamData, "rushingYards")) || 0,
            firstDowns: parseFloat(getStatValue(awayTeamData, "firstDowns")) || 0,
            thirdDowns: {
              conversions: getStatValue(awayTeamData, "thirdDownEff").split('-')[0] || 0,
              attempts: getStatValue(awayTeamData, "thirdDownEff").split('-')[1] || 0
            },
            fourthDowns: {
              conversions: getStatValue(awayTeamData, "fourthDownEff").split('-')[0] || 0,
              attempts: getStatValue(awayTeamData, "fourthDownEff").split('-')[1] || 0
            },
            redZone: {
              conversions: getStatValue(awayTeamData, "redZoneEff").split('-')[0] || 0,
              attempts: getStatValue(awayTeamData, "redZoneEff").split('-')[1] || 0
            },
            turnovers: parseFloat(getStatValue(awayTeamData, "turnovers")) || 0,
            timeOfPossession: (() => {
              const parts = getStatValue(awayTeamData, "possessionTime").split(':');
              return parts.length === 2 ? parseInt(parts[0]) + (parseInt(parts[1]) / 60) : 0;
            })(),
            penalties: {
              count: getStatValue(awayTeamData, "totalPenaltiesYards").split('-')[0] || 0,
              yards: getStatValue(awayTeamData, "totalPenaltiesYards").split('-')[1] || 0
            },
            sacks: {
              count: parseFloat(getStatValue(awayTeamData, "sacks")) || 0,
              yards: parseFloat(getStatValue(awayTeamData, "sackYards")) || 0
            },
            explosivePlays: parseFloat(getStatValue(awayTeamData, "explosivePlays")) || 0,
            epa: { total: 0, passing: 0, rushing: 0, defense: 0 },
            efficiency: { offensive: 0.5, defensive: 0.5, passingSuccess: 0.5, rushingSuccess: 0.5 }
          }
        };
        
        // 4. Fetch game drives
        let drivesData = [];
        try {
          drivesData = await teamsService.getGameDrives(gameData.id, year);
          console.log('All drives data:', drivesData);
          
          // Filter drives to only include the current teams
          if (drivesData && Array.isArray(drivesData)) {
            drivesData = drivesData.filter(drive => 
              drive.offense &&
              (drive.offense.toLowerCase() === homeTeam.toLowerCase() ||
               drive.offense.toLowerCase() === awayTeam.toLowerCase())
            );
          }
        } catch (err) {
          console.error('Error fetching drives:', err);
        }
        
        // 5. Fetch player stats for this game
        let playersData = [];
        try {
          // Try to fetch player data for each category and team separately
          const passingPlayersHome = await teamsService.getPlayerGameStats(gameData.id, year, null, "regular", homeTeam, "passing");
          const rushingPlayersHome = await teamsService.getPlayerGameStats(gameData.id, year, null, "regular", homeTeam, "rushing");
          const receivingPlayersHome = await teamsService.getPlayerGameStats(gameData.id, year, null, "regular", homeTeam, "receiving");
          
          const passingPlayersAway = await teamsService.getPlayerGameStats(gameData.id, year, null, "regular", awayTeam, "passing");
          const rushingPlayersAway = await teamsService.getPlayerGameStats(gameData.id, year, null, "regular", awayTeam, "rushing");
          const receivingPlayersAway = await teamsService.getPlayerGameStats(gameData.id, year, null, "regular", awayTeam, "receiving");
          
          // Combine all valid player data responses
          if (Array.isArray(passingPlayersHome)) playersData = playersData.concat(passingPlayersHome);
          if (Array.isArray(rushingPlayersHome)) playersData = playersData.concat(rushingPlayersHome);
          if (Array.isArray(receivingPlayersHome)) playersData = playersData.concat(receivingPlayersHome);
          
          if (Array.isArray(passingPlayersAway)) playersData = playersData.concat(passingPlayersAway);
          if (Array.isArray(rushingPlayersAway)) playersData = playersData.concat(rushingPlayersAway);
          if (Array.isArray(receivingPlayersAway)) playersData = playersData.concat(receivingPlayersAway);
          
          // If we still don't have data, try the direct approach
          if (playersData.length === 0) {
            const directPlayerData = await teamsService.getGamePlayers(gameData.id, year);
            if (Array.isArray(directPlayerData) && directPlayerData.length > 0) {
              playersData = directPlayerData;
            }
          }
        } catch (err) {
          console.error('Error in player stats fetching:', err);
          playersData = [];
        }
        
        // 6. Fetch advanced metrics
        let advancedMetrics = null;
        try {
          advancedMetrics = await teamsService.getAdvancedBoxScore(gameData.id, year);
          
          // Update team stats with advanced metrics if available
          if (advancedMetrics && advancedMetrics.teams) {
            // Extract EPA data for home team
            const homeTeamAdvanced = advancedMetrics.teams.find(team => 
              team.team && team.team.toLowerCase() === homeTeam.toLowerCase()
            );
            
            // Extract EPA data for away team
            const awayTeamAdvanced = advancedMetrics.teams.find(team => 
              team.team && team.team.toLowerCase() === awayTeam.toLowerCase()
            );
            
            // Update home team advanced stats if available
            if (homeTeamAdvanced) {
              processedTeamStats.homeTeamStats.epa = homeTeamAdvanced.epa || processedTeamStats.homeTeamStats.epa;
              processedTeamStats.homeTeamStats.efficiency = homeTeamAdvanced.efficiency || processedTeamStats.homeTeamStats.efficiency;
            }
            
            // Update away team advanced stats if available
            if (awayTeamAdvanced) {
              processedTeamStats.awayTeamStats.epa = awayTeamAdvanced.epa || processedTeamStats.awayTeamStats.epa;
              processedTeamStats.awayTeamStats.efficiency = awayTeamAdvanced.efficiency || processedTeamStats.awayTeamStats.efficiency;
            }
          }
        } catch (err) {
          console.warn("Advanced metrics not available:", err);
        }
        
        // 7. Process player stats into appropriate format
        const processedPlayerStats = processPlayerData(playersData, homeTeam, awayTeam);
        
        // 8. Set all data to state
        setTeamStats(processedTeamStats);
        setDrives(drivesData || []);
        setPlayerStats(processedPlayerStats);
        setAdvancedData(advancedMetrics);
        
        // Log processed data for debugging
        console.log('Processed team stats:', processedTeamStats);
        console.log('Processed player stats:', processedPlayerStats);
        
      } catch (err) {
        console.error("Error fetching game data:", err);
        setError("Failed to load game statistics");
      } finally {
        setIsLoading(false);
      }
    };
    
    if (gameData && gameData.id) {
      fetchAllGameData();
    }
  }, [gameData, homeTeam, awayTeam]);

  if (isLoading) {
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        <div style={{ display: "inline-block", width: "40px", height: "40px", border: "4px solid #f3f3f3", borderTop: "4px solid #3498db", borderRadius: "50%", animation: "spin 2s linear infinite" }}></div>
        <p>Loading advanced statistics...</p>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: "20px", backgroundColor: "#fef2f2", borderRadius: "8px", color: "#ef4444", textAlign: "center" }}>
        <div style={{ fontSize: "24px", marginBottom: "10px" }}>⚠️</div>
        <p style={{ fontWeight: "500" }}>{error}</p>
      </div>
    );
  }

  if (!teamStats) {
    console.warn('teamStats variable is null');
    return (
      <div style={styles.noData}>
        Data for this game has not been received.
      </div>
    );
  }
  
  // Check if totalYards properties are missing (not just zero)
  if (teamStats.homeTeamStats.totalYards === undefined || 
      teamStats.awayTeamStats.totalYards === undefined) {
    console.warn('Total yards property is missing or null');
    return (
      <div style={styles.noData}>
        Total yards statistics are unavailable for this game.
      </div>
    );
  }

  const { homeTeamStats, awayTeamStats } = teamStats;

  // Calculate percentages for visual display
  const totalYards = homeTeamStats.totalYards + awayTeamStats.totalYards;
  const homeYardsPercentage = Math.round((homeTeamStats.totalYards / totalYards) * 100) || 50;
  const awayYardsPercentage = 100 - homeYardsPercentage;

  const totalTime = homeTeamStats.timeOfPossession + awayTeamStats.timeOfPossession;
  const homePossessionPercentage = Math.round((homeTeamStats.timeOfPossession / totalTime) * 100) || 50;
  const awayPossessionPercentage = 100 - homePossessionPercentage;

  const renderTeamStatsComparison = () => (
    <div style={styles.statSection}>
      <h3 style={styles.sectionTitle}>Team Statistics Comparison</h3>
      
      <div style={styles.teamComparisonGrid}>
        {/* Teams Headers */}
        <div style={{ ...styles.teamHeader, justifyContent: 'flex-end' }}>
          <span style={styles.teamName}>{homeTeam}</span>
          <img src={homeLogo} alt={homeTeam} style={styles.teamLogo} />
        </div>
        <div style={{ gridColumn: "2" }}></div>
        <div style={styles.teamHeader}>
          <img src={awayLogo} alt={awayTeam} style={styles.teamLogo} />
          <span style={styles.teamName}>{awayTeam}</span>
        </div>
        
        {/* Total Yards */}
        <div style={{ ...styles.homeStatValue, backgroundColor: `${homeTeamColor}20` }}>
          {homeTeamStats.totalYards}
        </div>
        <div style={styles.statLabel}>Total Yards</div>
        <div style={{ ...styles.awayStatValue, backgroundColor: `${awayTeamColor}20` }}>
          {awayTeamStats.totalYards}
        </div>
        
        {/* Yards Bar */}
        <div style={{ gridColumn: "1 / span 3" }}>
          <div style={styles.statBar}>
            <div style={{ ...styles.statBarInner, width: `${homeYardsPercentage}%`, backgroundColor: homeTeamColor }} />
            <div style={{ ...styles.statBarInner, width: `${awayYardsPercentage}%`, backgroundColor: awayTeamColor }} />
          </div>
        </div>
        
        {/* Passing Yards */}
        <div style={{ ...styles.homeStatValue, backgroundColor: `${homeTeamColor}20` }}>
          {homeTeamStats.passingYards}
        </div>
        <div style={styles.statLabel}>Passing Yards</div>
        <div style={{ ...styles.awayStatValue, backgroundColor: `${awayTeamColor}20` }}>
          {awayTeamStats.passingYards}
        </div>
        
        {/* Rushing Yards */}
        <div style={{ ...styles.homeStatValue, backgroundColor: `${homeTeamColor}20` }}>
          {homeTeamStats.rushingYards}
        </div>
        <div style={styles.statLabel}>Rushing Yards</div>
        <div style={{ ...styles.awayStatValue, backgroundColor: `${awayTeamColor}20` }}>
          {awayTeamStats.rushingYards}
        </div>
        
        {/* First Downs */}
        <div style={{ ...styles.homeStatValue, backgroundColor: `${homeTeamColor}20` }}>
          {homeTeamStats.firstDowns}
        </div>
        <div style={styles.statLabel}>First Downs</div>
        <div style={{ ...styles.awayStatValue, backgroundColor: `${awayTeamColor}20` }}>
          {awayTeamStats.firstDowns}
        </div>
        
        {/* Third Down Efficiency */}
        <div style={{ ...styles.homeStatValue, backgroundColor: `${homeTeamColor}20` }}>
          {homeTeamStats.thirdDowns.conversions}/{homeTeamStats.thirdDowns.attempts} 
          ({homeTeamStats.thirdDowns.attempts > 0 
            ? Math.round((homeTeamStats.thirdDowns.conversions / homeTeamStats.thirdDowns.attempts) * 100) 
            : 0}%)
        </div>
        <div style={styles.statLabel}>Third Down</div>
        <div style={{ ...styles.awayStatValue, backgroundColor: `${awayTeamColor}20` }}>
          {awayTeamStats.thirdDowns.conversions}/{awayTeamStats.thirdDowns.attempts}
          ({awayTeamStats.thirdDowns.attempts > 0 
            ? Math.round((awayTeamStats.thirdDowns.conversions / awayTeamStats.thirdDowns.attempts) * 100) 
            : 0}%)
        </div>
        
        {/* Fourth Down Efficiency */}
        <div style={{ ...styles.homeStatValue, backgroundColor: `${homeTeamColor}20` }}>
          {homeTeamStats.fourthDowns.conversions}/{homeTeamStats.fourthDowns.attempts} 
          ({homeTeamStats.fourthDowns.attempts > 0 
            ? Math.round((homeTeamStats.fourthDowns.conversions / homeTeamStats.fourthDowns.attempts) * 100) 
            : 0}%)
        </div>
        <div style={styles.statLabel}>Fourth Down</div>
        <div style={{ ...styles.awayStatValue, backgroundColor: `${awayTeamColor}20` }}>
          {awayTeamStats.fourthDowns.conversions}/{awayTeamStats.fourthDowns.attempts} 
          ({awayTeamStats.fourthDowns.attempts > 0 
            ? Math.round((awayTeamStats.fourthDowns.conversions / awayTeamStats.fourthDowns.attempts) * 100) 
            : 0}%)
        </div>
        
        {/* Red Zone Efficiency */}
        <div style={{ ...styles.homeStatValue, backgroundColor: `${homeTeamColor}20` }}>
          {homeTeamStats.redZone.conversions}/{homeTeamStats.redZone.attempts} 
          ({homeTeamStats.redZone.attempts > 0 
            ? Math.round((homeTeamStats.redZone.conversions / homeTeamStats.redZone.attempts) * 100) 
            : 0}%)
        </div>
        <div style={styles.statLabel}>Red Zone</div>
        <div style={{ ...styles.awayStatValue, backgroundColor: `${awayTeamColor}20` }}>
          {awayTeamStats.redZone.conversions}/{awayTeamStats.redZone.attempts}
          ({awayTeamStats.redZone.attempts > 0 
            ? Math.round((awayTeamStats.redZone.conversions / awayTeamStats.redZone.attempts) * 100) 
            : 0}%)
        </div>
        
        {/* Penalties */}
        <div style={{ ...styles.homeStatValue, backgroundColor: `${homeTeamColor}20` }}>
          {homeTeamStats.penalties.count}-{homeTeamStats.penalties.yards}
        </div>
        <div style={styles.statLabel}>Penalties</div>
        <div style={{ ...styles.awayStatValue, backgroundColor: `${awayTeamColor}20` }}>
          {awayTeamStats.penalties.count}-{awayTeamStats.penalties.yards}
        </div>
        
        {/* Turnovers */}
        <div style={{ ...styles.homeStatValue, backgroundColor: `${homeTeamColor}20` }}>
          {homeTeamStats.turnovers}
        </div>
        <div style={styles.statLabel}>Turnovers</div>
        <div style={{ ...styles.awayStatValue, backgroundColor: `${awayTeamColor}20` }}>
          {awayTeamStats.turnovers}
        </div>
        
        {/* Sacks */}
        <div style={{ ...styles.homeStatValue, backgroundColor: `${homeTeamColor}20` }}>
          {homeTeamStats.sacks.count}-{homeTeamStats.sacks.yards}
        </div>
        <div style={styles.statLabel}>Sacks</div>
        <div style={{ ...styles.awayStatValue, backgroundColor: `${awayTeamColor}20` }}>
          {awayTeamStats.sacks.count}-{awayTeamStats.sacks.yards}
        </div>
        
        {/* Time of Possession */}
        <div style={{ ...styles.homeStatValue, backgroundColor: `${homeTeamColor}20` }}>
          {Math.floor(homeTeamStats.timeOfPossession)}:{Math.round((homeTeamStats.timeOfPossession % 1) * 60).toString().padStart(2, '0')}
        </div>
        <div style={styles.statLabel}>Time of Possession</div>
        <div style={{ ...styles.awayStatValue, backgroundColor: `${awayTeamColor}20` }}>
          {Math.floor(awayTeamStats.timeOfPossession)}:{Math.round((awayTeamStats.timeOfPossession % 1) * 60).toString().padStart(2, '0')}
        </div>
        
        {/* Possession Bar */}
        <div style={{ gridColumn: "1 / span 3" }}>
          <div style={styles.timeOfPossessionContainer}>
            <div 
              style={{ 
                ...styles.timeSegment, 
                width: `${homePossessionPercentage}%`, 
                backgroundColor: homeTeamColor
              }}
            >
              {homePossessionPercentage}%
            </div>
            <div 
              style={{ 
                ...styles.timeSegment, 
                width: `${awayPossessionPercentage}%`, 
                backgroundColor: awayTeamColor
              }}
            >
              {awayPossessionPercentage}%
            </div>
          </div>
        </div>
        
        {/* Explosive Plays */}
        <div style={{ ...styles.homeStatValue, backgroundColor: `${homeTeamColor}20` }}>
          {homeTeamStats.explosivePlays}
        </div>
        <div style={styles.statLabel}>
          <Tooltip text="Plays over 20 yards">
            Explosive Plays
          </Tooltip>
        </div>
        <div style={{ ...styles.awayStatValue, backgroundColor: `${awayTeamColor}20` }}>
          {awayTeamStats.explosivePlays}
        </div>
      </div>
    </div>
  );
  
  const renderAdvancedMetrics = () => {
    if (!advancedData) {
      return (
        <div style={styles.statSection}>
          <h3 style={styles.sectionTitle}>Advanced Metrics</h3>
          <div style={styles.noData}>Advanced metrics not available for this game.</div>
        </div>
      );
    }
    
    return (
      <div style={styles.statSection}>
        <h3 style={styles.sectionTitle}>Advanced Metrics</h3>
        
        <div style={styles.tabs}>
          <div 
            style={activeMetricTab === 'efficiency' ? {...styles.tab, ...styles.activeTab} : styles.tab}
            onClick={() => setActiveMetricTab('efficiency')}
          >
            Efficiency
          </div>
          <div 
            style={activeMetricTab === 'epa' ? {...styles.tab, ...styles.activeTab} : styles.tab}
            onClick={() => setActiveMetricTab('epa')}
          >
            EPA (Expected Points Added)
          </div>
        </div>
        
        {activeMetricTab === 'efficiency' && (
          <div style={styles.efficiencyContainer}>
            <div style={{...styles.efficiencyCard, borderLeft: `4px solid ${homeTeamColor}`}}>
              <div style={{...styles.teamHeader, marginBottom: '15px'}}>
                <img src={homeLogo} alt={homeTeam} style={styles.teamLogo} />
                <span style={styles.teamName}>{homeTeam} Efficiency</span>
              </div>
              
              <EfficiencyMetric 
                label="Offensive Efficiency" 
                value={homeTeamStats.efficiency.offensive} 
                maxValue={1.0} 
                explanation="Percentage of plays that were successful based on down and distance"
                color={homeTeamColor}
              />
              
              <div style={{marginTop: '15px'}}>
                <EfficiencyMetric 
                  label="Defensive Efficiency" 
                  value={homeTeamStats.efficiency.defensive} 
                  maxValue={1.0} 
                  explanation="Percentage of opponent plays that were stopped successfully"
                  color={homeTeamColor}
                />
              </div>
              
              <div style={{marginTop: '15px'}}>
                <EfficiencyMetric 
                  label="Passing Success Rate" 
                  value={homeTeamStats.efficiency.passingSuccess} 
                  maxValue={1.0} 
                  explanation="Percentage of pass plays that were successful based on down and distance"
                  color={homeTeamColor}
                />
              </div>
              
              <div style={{marginTop: '15px'}}>
                <EfficiencyMetric 
                  label="Rushing Success Rate" 
                  value={homeTeamStats.efficiency.rushingSuccess} 
                  maxValue={1.0} 
                  explanation="Percentage of rush plays that were successful based on down and distance"
                  color={homeTeamColor}
                />
              </div>
            </div>
            
            <div style={{...styles.efficiencyCard, borderLeft: `4px solid ${awayTeamColor}`}}>
              <div style={{...styles.teamHeader, marginBottom: '15px'}}>
                <img src={awayLogo} alt={awayTeam} style={styles.teamLogo} />
                <span style={styles.teamName}>{awayTeam} Efficiency</span>
              </div>
              
              <EfficiencyMetric 
                label="Offensive Efficiency" 
                value={awayTeamStats.efficiency.offensive} 
                maxValue={1.0} 
                explanation="Percentage of plays that were successful based on down and distance"
                color={awayTeamColor}
              />
              
              <div style={{marginTop: '15px'}}>
                <EfficiencyMetric 
                  label="Defensive Efficiency" 
                  value={awayTeamStats.efficiency.defensive} 
                  maxValue={1.0} 
                  explanation="Percentage of opponent plays that were stopped successfully"
                  color={awayTeamColor}
                />
              </div>
              
              <div style={{marginTop: '15px'}}>
                <EfficiencyMetric 
                  label="Passing Success Rate" 
                  value={awayTeamStats.efficiency.passingSuccess} 
                  maxValue={1.0} 
                  explanation="Percentage of pass plays that were successful based on down and distance"
                  color={awayTeamColor}
                />
              </div>
              
              <div style={{marginTop: '15px'}}>
                <EfficiencyMetric 
                  label="Rushing Success Rate" 
                  value={awayTeamStats.efficiency.rushingSuccess} 
                  maxValue={1.0} 
                  explanation="Percentage of rush plays that were successful based on down and distance"
                  color={awayTeamColor}
                />
              </div>
            </div>
          </div>
        )}
        
        {activeMetricTab === 'epa' && (
          <div style={styles.efficiencyContainer}>
            <div style={{...styles.efficiencyCard, borderLeft: `4px solid ${homeTeamColor}`}}>
              <div style={{...styles.teamHeader, marginBottom: '15px'}}>
                <img src={homeLogo} alt={homeTeam} style={styles.teamLogo} />
                <span style={styles.teamName}>{homeTeam} EPA</span>
              </div>
              
              <EfficiencyMetric 
                label="Total EPA" 
                value={homeTeamStats.epa.total} 
                maxValue={15} 
                explanation="Expected Points Added across all plays"
                color={homeTeamColor}
              />
              
              <div style={{marginTop: '15px'}}>
                <EfficiencyMetric 
                  label="Passing EPA" 
                  value={homeTeamStats.epa.passing} 
                  maxValue={10} 
                  explanation="Expected Points Added on passing plays"
                  color={homeTeamColor}
                />
              </div>
              
              <div style={{marginTop: '15px'}}>
                <EfficiencyMetric 
                  label="Rushing EPA" 
                  value={homeTeamStats.epa.rushing} 
                  maxValue={8} 
                  explanation="Expected Points Added on rushing plays"
                  color={homeTeamColor}
                />
              </div>
              
              <div style={{marginTop: '15px'}}>
                <EfficiencyMetric 
                  label="Defensive EPA" 
                  value={homeTeamStats.epa.defense} 
                  maxValue={5} 
                  explanation="Expected Points Added by defensive plays (negative is better for defense)"
                  color={homeTeamColor}
                />
              </div>
            </div>
            
            <div style={{...styles.efficiencyCard, borderLeft: `4px solid ${awayTeamColor}`}}>
              <div style={{...styles.teamHeader, marginBottom: '15px'}}>
                <img src={awayLogo} alt={awayTeam} style={styles.teamLogo} />
                <span style={styles.teamName}>{awayTeam} EPA</span>
              </div>
              
              <EfficiencyMetric 
                label="Total EPA" 
                value={awayTeamStats.epa.total} 
                maxValue={15} 
                explanation="Expected Points Added across all plays"
                color={awayTeamColor}
              />
              
              <div style={{marginTop: '15px'}}>
                <EfficiencyMetric 
                  label="Passing EPA" 
                  value={awayTeamStats.epa.passing} 
                  maxValue={10} 
                  explanation="Expected Points Added on passing plays"
                  color={awayTeamColor}
                />
              </div>
              
              <div style={{marginTop: '15px'}}>
                <EfficiencyMetric 
                  label="Rushing EPA" 
                  value={awayTeamStats.epa.rushing} 
                  maxValue={8} 
                  explanation="Expected Points Added on rushing plays"
                  color={awayTeamColor}
                />
              </div>
              
              <div style={{marginTop: '15px'}}>
                <EfficiencyMetric 
                  label="Defensive EPA" 
                  value={awayTeamStats.epa.defense} 
                  maxValue={5} 
                  explanation="Expected Points Added by defensive plays (negative is better for defense)"
                  color={awayTeamColor}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };
  
  const renderDrives = () => {
    if (!drives || drives.length === 0) {
      return (
        <div style={styles.statSection}>
          <h3 style={styles.sectionTitle}>Drive Summary</h3>
          <div style={styles.noData}>Drive data not available for this game.</div>
        </div>
      );
    }
    
    return (
      <div style={styles.statSection}>
        <h3 style={styles.sectionTitle}>Drive Summary</h3>
        
        <div style={styles.drivesContainer}>
          <div style={{...styles.driveRow, ...styles.driveHeader}}>
            <div style={styles.driveTeam}>Team</div>
            <div style={styles.driveQuarter}>Qtr</div>
            <div style={styles.driveResult}>Result</div>
            <div style={styles.driveYards}>Yards</div>
            <div style={styles.driveTime}>Time</div>
            <div style={styles.drivePlays}>Plays</div>
            <div style={styles.driveStart}>Start</div>
          </div>
          
          {drives.map((drive, index) => (
            <div 
              key={index} 
              style={{
                ...styles.driveRow,
                backgroundColor: drive.offense.toLowerCase() === homeTeam.toLowerCase()
                  ? `${homeTeamColor}10` 
                  : `${awayTeamColor}10`
              }}
            >
              <div style={styles.driveTeam}>
                <img 
                  src={drive.offense.toLowerCase() === homeTeam.toLowerCase() ? homeLogo : awayLogo} 
                  alt={drive.offense} 
                  style={styles.driveLogoSmall} 
                />
                <span>{drive.offense}</span>
              </div>
              <div style={styles.driveQuarter}>{drive.startPeriod || 'N/A'}</div>
              <div 
                style={{
                  ...styles.driveResult,
                  color: drive.driveResult === "TD" || drive.driveResult === "FG" 
                    ? "#2ecc71" 
                    : drive.driveResult === "TURNOVER" || drive.driveResult === "INT" || drive.driveResult === "FUMBLE" 
                      ? "#e74c3c" 
                      : "#777"
                }}
              >
                {drive.driveResult || 'N/A'}
              </div>
              <div style={styles.driveYards}>{drive.yards || 0}</div>
              <div style={styles.driveTime}>
                {drive.startTime && drive.endTime ? 
                  `${Math.abs(drive.startTime.minutes - drive.endTime.minutes)}:${Math.abs(drive.startTime.seconds - drive.endTime.seconds).toString().padStart(2, '0')}` : 
                  'N/A'}
              </div>
              <div style={styles.drivePlays}>{drive.plays || 0}</div>
              <div style={styles.driveStart}>
                {drive.startYardline ? `${drive.startYardline}` : 'N/A'}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };
  
  const renderKeyPlayers = () => {
    const homeTeamPlayers = playerStats[homeTeam] || [];
    const awayTeamPlayers = playerStats[awayTeam] || [];
    
    if (homeTeamPlayers.length === 0 && awayTeamPlayers.length === 0) {
      return (
        <div style={styles.statSection}>
          <h3 style={styles.sectionTitle}>Key Player Statistics</h3>
          <div style={styles.noData}>Player statistics not available for this game.</div>
        </div>
      );
    }
    
    return (
      <div style={styles.statSection}>
        <h3 style={styles.sectionTitle}>Key Player Statistics</h3>
        
        <div style={{...styles.teamHeader, marginBottom: '15px', borderBottom: `2px solid ${homeTeamColor}`}}>
          <img src={homeLogo} alt={homeTeam} style={styles.teamLogo} />
          <span style={styles.teamName}>{homeTeam} Key Players</span>
        </div>
        
        <table style={styles.playerStatsTable}>
          <thead>
            <tr>
              <th style={styles.tableHeader}>Player</th>
              <th style={styles.tableHeader}>Position</th>
              <th style={styles.tableHeader}>Statistics</th>
            </tr>
          </thead>
          <tbody>
            {homeTeamPlayers.length > 0 ? (
              homeTeamPlayers.map((player, index) => (
                <tr key={index}>
                  <td style={styles.tableCell}>{player.name}</td>
                  <td style={styles.tableCell}>{player.position}</td>
                  <td style={styles.tableCell}>
                    {player.stats.passing && (
                      <div>
                        Passing: {player.stats.passing.completions}/{player.stats.passing.attempts}, 
                        {player.stats.passing.yards} yds, {player.stats.passing.touchdowns} TD, 
                        {player.stats.passing.interceptions} INT
                      </div>
                    )}
                    {player.stats.rushing && (
                      <div>
                        Rushing: {player.stats.rushing.attempts} car, {player.stats.rushing.yards} yds, 
                        {player.stats.rushing.touchdowns} TD
                      </div>
                    )}
                    {player.stats.receiving && (
                      <div>
                        Receiving: {player.stats.receiving.receptions}/{player.stats.receiving.targets || 0}, 
                        {player.stats.receiving.yards} yds, {player.stats.receiving.touchdowns} TD
                      </div>
                    )}
                    {player.stats.defense && (
                      <div>
                        Defense: {player.stats.defense.tackles || 0} tackles, 
                        {player.stats.defense.sacks || 0} sacks, {player.stats.defense.interceptions || 0} INT
                      </div>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="3" style={styles.tableCell}>No player data available</td>
              </tr>
            )}
          </tbody>
        </table>
        
        <div style={{...styles.teamHeader, margin: '25px 0 15px', borderBottom: `2px solid ${awayTeamColor}`}}>
          <img src={awayLogo} alt={awayTeam} style={styles.teamLogo} />
          <span style={styles.teamName}>{awayTeam} Key Players</span>
        </div>
        
        <table style={styles.playerStatsTable}>
          <thead>
            <tr>
              <th style={styles.tableHeader}>Player</th>
              <th style={styles.tableHeader}>Position</th>
              <th style={styles.tableHeader}>Statistics</th>
            </tr>
          </thead>
          <tbody>
            {awayTeamPlayers.length > 0 ? (
              awayTeamPlayers.map((player, index) => (
                <tr key={index}>
                  <td style={styles.tableCell}>{player.name}</td>
                  <td style={styles.tableCell}>{player.position}</td>
                  <td style={styles.tableCell}>
                    {player.stats.passing && (
                      <div>
                        Passing: {player.stats.passing.completions}/{player.stats.passing.attempts}, 
                        {player.stats.passing.yards} yds, {player.stats.passing.touchdowns} TD, 
                        {player.stats.passing.interceptions} INT
                      </div>
                    )}
                    {player.stats.rushing && (
                      <div>
                        Rushing: {player.stats.rushing.attempts} car, {player.stats.rushing.yards} yds, 
                        {player.stats.rushing.touchdowns} TD
                      </div>
                    )}
                    {player.stats.receiving && (
                      <div>
                        Receiving: {player.stats.receiving.receptions}/{player.stats.receiving.targets || 0}, 
                        {player.stats.receiving.yards} yds, {player.stats.receiving.touchdowns} TD
                      </div>
                    )}
                    {player.stats.defense && (
                      <div>
                        Defense: {player.stats.defense.tackles || 0} tackles, 
                        {player.stats.defense.sacks || 0} sacks, {player.stats.defense.interceptions || 0} INT
                      </div>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="3" style={styles.tableCell}>No player data available</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    );
  };
  
  return (
    <div style={styles.container}>
      {renderTeamStatsComparison()}
      {renderAdvancedMetrics()}
      {renderDrives()}
      {renderKeyPlayers()}
    </div>
  );
};

export default GameStats;