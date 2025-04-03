import React, { useState, useEffect } from "react";
import teamsService from "../services/teamsService";

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

// Helper function to determine if a value is empty or zero
const isEmptyValue = (value) => {
  if (value === null || value === undefined) return true;
  if (typeof value === 'number' && value === 0) return true;
  if (typeof value === 'string' && value.trim() === '') return true;
  if (Array.isArray(value) && value.length === 0) return true;
  if (typeof value === 'object' && value !== null && Object.keys(value).length === 0) return true;
  return false;
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
  
  // Fetch real data from the API
  useEffect(() => {
    const fetchAllGameData = async () => {
      try {
        setIsLoading(true);
        
        // Get the year from gameData or default to current year
        const year = gameData?.season || new Date().getFullYear();
        console.log(`Fetching data for game ID: ${gameData.id}, year: ${year}, teams: ${homeTeam} vs ${awayTeam}`);
        
        // Fetch both team's game stats
        let homeTeamStats, awayTeamStats;
        try {
          [homeTeamStats, awayTeamStats] = await Promise.all([
            teamsService.getTeamGameStats(gameData.id, homeTeam, year),
            teamsService.getTeamGameStats(gameData.id, awayTeam, year)
          ]);
          console.log('Home team stats:', homeTeamStats);
          console.log('Away team stats:', awayTeamStats);
        } catch (err) {
          console.error('Error fetching team stats:', err);
          homeTeamStats = [];
          awayTeamStats = [];
        }
        
        // Fetch game drives
        let drivesData = [];
        try {
          drivesData = await teamsService.getGameDrives(gameData.id, year);
          // Filter drives to only include the current teams
          drivesData = drivesData.filter(drive => 
            drive.offense === homeTeam || drive.offense === awayTeam
          );
          console.log('Filtered drives data:', drivesData);
        } catch (err) {
          console.error('Error fetching drives:', err);
        }
        
        // Fetch player stats for this game
        let playersData = [];
        try {
          // Try first with getGamePlayers
          try {
            playersData = await teamsService.getGamePlayers(gameData.id, year);
            console.log('Player data from getGamePlayers:', playersData);
          } catch (playerErr) {
            console.warn('Error with getGamePlayers, trying alternative approach:', playerErr);
            // Try alternative approach with getPlayerGameStats
            try {
              playersData = await teamsService.getPlayerGameStats(gameData.id, year);
              console.log('Player data from getPlayerGameStats:', playersData);
            } catch (altErr) {
              console.error('Both player data approaches failed:', altErr);
              playersData = [];
            }
          }
        } catch (err) {
          console.error('Error in player stats outer try block:', err);
          playersData = [];
        }
        
        // Optionally fetch advanced metrics if available
        let advancedMetrics = null;
        try {
          advancedMetrics = await teamsService.getAdvancedBoxScore(gameData.id, year);
        } catch (err) {
          console.warn("Advanced metrics not available:", err);
        }
        
        // Optionally fetch win probability data if available
        let winProbData = null;
        try {
          winProbData = await teamsService.getMetricsWP(gameData.id, year);
        } catch (err) {
          console.warn("Win probability data not available:", err);
        }
        
        // Process player stats into appropriate format
        const processedPlayerStats = processPlayerStats(playersData, homeTeam, awayTeam);
        
        // Process team stats data
        const processedTeamStats = processTeamStats(homeTeamStats, awayTeamStats);
        
        // Set all data to state
        setTeamStats(processedTeamStats);
        setDrives(drivesData || []);
        setPlayerStats(processedPlayerStats || { [homeTeam]: [], [awayTeam]: [] });
        setAdvancedData(advancedMetrics);
        setWinProbabilities(winProbData);
        
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
    
    // Create an empty team stats object with default values
    const createEmptyTeamStats = () => ({
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
      epa: { total: 0, passing: 0, rushing: 0, defense: 0 },
      efficiency: { offensive: 0.5, defensive: 0.5, passingSuccess: 0, rushingSuccess: 0 }
    });
    
    const processTeamStats = (homeStats, awayStats) => {
      // Ensure we have data to process
      if (!homeStats || (Array.isArray(homeStats) && homeStats.length === 0) || 
          !awayStats || (Array.isArray(awayStats) && awayStats.length === 0)) {
        console.warn('Missing or invalid team stats data');
        // Return default structure with zeros
        return {
          homeTeamStats: createEmptyTeamStats(),
          awayTeamStats: createEmptyTeamStats()
        };
      }
      
      // Get the first element if arrays are returned
      const homeStatsData = Array.isArray(homeStats) ? homeStats[0] : homeStats;
      const awayStatsData = Array.isArray(awayStats) ? awayStats[0] : awayStats;
      
      console.log('Processing home stats:', homeStatsData);
      console.log('Processing away stats:', awayStatsData);
      
      // Extract and structure the relevant stats for both teams
      return {
        homeTeamStats: {
          totalYards: getTotalYards(homeStatsData),
          passingYards: getPassingYards(homeStatsData),
          rushingYards: getRushingYards(homeStatsData),
          firstDowns: getFirstDowns(homeStatsData),
          thirdDowns: getThirdDowns(homeStatsData),
          fourthDowns: getFourthDowns(homeStatsData),
          turnovers: getTurnovers(homeStatsData),
          timeOfPossession: getTimeOfPossession(homeStatsData),
          redZone: getRedZone(homeStatsData),
          penalties: getPenalties(homeStatsData),
          sacks: getSacks(homeStatsData),
          explosivePlays: getExplosivePlays(homeStatsData),
          epa: getEPA(homeStatsData, advancedData),
          efficiency: getEfficiency(homeStatsData, advancedData)
        },
        awayTeamStats: {
          totalYards: getTotalYards(awayStatsData),
          passingYards: getPassingYards(awayStatsData),
          rushingYards: getRushingYards(awayStatsData),
          firstDowns: getFirstDowns(awayStatsData),
          thirdDowns: getThirdDowns(awayStatsData),
          fourthDowns: getFourthDowns(awayStatsData),
          turnovers: getTurnovers(awayStatsData),
          timeOfPossession: getTimeOfPossession(awayStatsData),
          redZone: getRedZone(awayStatsData),
          penalties: getPenalties(awayStatsData),
          sacks: getSacks(awayStatsData),
          explosivePlays: getExplosivePlays(awayStatsData),
          epa: getEPA(awayStatsData, advancedData),
          efficiency: getEfficiency(awayStatsData, advancedData)
        }
      };
    };
    
    // Helper functions to extract stats from API response
    const getTotalYards = (stats) => {
      return (stats.netPassingYards || 0) + (stats.rushingYards || 0);
    };
    
    const getPassingYards = (stats) => {
      return stats.netPassingYards || 0;
    };
    
    const getRushingYards = (stats) => {
      return stats.rushingYards || 0;
    };
    
    const getFirstDowns = (stats) => {
      return stats.firstDowns || 0;
    };
    
    const getThirdDowns = (stats) => {
      return {
        attempts: stats.thirdDownAttempts || 0,
        conversions: stats.thirdDownConversions || 0
      };
    };
    
    const getFourthDowns = (stats) => {
      return {
        attempts: stats.fourthDownAttempts || 0,
        conversions: stats.fourthDownConversions || 0
      };
    };
    
    const getTurnovers = (stats) => {
      return (stats.interceptions || 0) + (stats.fumblesLost || 0);
    };
    
    const getTimeOfPossession = (stats) => {
      // Convert time format "MM:SS" to minutes as a decimal
      if (!stats.possessionTime) return 0;
      
      const [minutes, seconds] = stats.possessionTime.split(':').map(Number);
      return minutes + (seconds / 60);
    };
    
    const getRedZone = (stats) => {
      return {
        attempts: stats.redZoneAttempts || 0,
        conversions: stats.redZoneConversions || 0
      };
    };
    
    const getPenalties = (stats) => {
      return {
        count: stats.penalties || 0,
        yards: stats.penaltyYards || 0
      };
    };
    
    const getSacks = (stats) => {
      return {
        count: stats.sacks || 0,
        yards: stats.sackYards || 0
      };
    };
    
    const getExplosivePlays = (stats) => {
      // Count plays over 20 yards - this might need to be calculated from play-by-play data
      // For now, use a placeholder or estimated value
      return stats.explosivePlays || 0;
    };
    
    const getEPA = (stats, advancedData) => {
      // If advanced data is available, use it
      if (advancedData && advancedData.teams) {
        const teamData = advancedData.teams.find(t => t.team === stats.school);
        if (teamData && teamData.epa) {
          return {
            total: teamData.epa.total || 0,
            passing: teamData.epa.passing || 0,
            rushing: teamData.epa.rushing || 0,
            defense: teamData.epa.defense || 0
          };
        }
      }
      
      // Fallback defaults
      return {
        total: 0,
        passing: 0,
        rushing: 0,
        defense: 0
      };
    };
    
    const getEfficiency = (stats, advancedData) => {
      // If advanced data is available, use it
      if (advancedData && advancedData.teams) {
        const teamData = advancedData.teams.find(t => t.team === stats.school);
        if (teamData && teamData.efficiency) {
          return {
            offensive: teamData.efficiency.offensive || 0,
            defensive: teamData.efficiency.defensive || 0,
            passingSuccess: teamData.efficiency.passingSuccess || 0,
            rushingSuccess: teamData.efficiency.rushingSuccess || 0
          };
        }
      }
      
      // Fallback defaults using available stats - these are estimates
      return {
        offensive: 0.5, // Default value
        defensive: 0.5, // Default value
        passingSuccess: stats.completionAttempts ? stats.completions / stats.completionAttempts : 0,
        rushingSuccess: stats.rushingYards && stats.rushingAttempts ? 
          Math.min(0.8, stats.rushingYards / (stats.rushingAttempts * 5)) : 0
      };
    };
    
    const processPlayerStats = (playersData, homeTeam, awayTeam) => {
      // Ensure we have data to process
      if (!playersData || !Array.isArray(playersData) || playersData.length === 0) {
        console.warn('No player data available');
        return { [homeTeam]: [], [awayTeam]: [] };
      }
      
      // Check the structure of the data to handle different API response formats
      if (playersData.length > 0 && playersData[0] && typeof playersData[0] === 'object') {
        // We have valid data to process
        console.log(`Processing player stats for ${homeTeam} and ${awayTeam}. First player:`, playersData[0]);
      } else {
        console.warn('Player data has unexpected format:', playersData);
        return { [homeTeam]: [], [awayTeam]: [] };
      }
      
      // Group players by team
      const homeTeamPlayers = [];
      const awayTeamPlayers = [];
      
      // Use for...of instead of forEach for better error handling with async/await
      for (const player of playersData) {
        
        // Skip if player is null or undefined
        if (!player) continue;
        
        // Make sure we have a valid player object with a team property
        if (!player.team) {
          console.warn('Player missing team information:', player);
          continue;
        }
        
        // Create player object with key stats
        const playerObj = {
          name: player.name || `${player.firstName || ''} ${player.lastName || ''}`.trim() || 'Unknown Player',
          position: player.position || 'N/A',
          stats: {}
        };
        
        // Add passing stats if available
        if (player.passing) {
          playerObj.stats.passing = {
            attempts: player.passing.attempts || 0,
            completions: player.passing.completions || 0,
            yards: player.passing.yards || 0,
            touchdowns: player.passing.touchdowns || 0,
            interceptions: player.passing.interceptions || 0
          };
        }
        
        // Add rushing stats if available
        if (player.rushing) {
          playerObj.stats.rushing = {
            attempts: player.rushing.attempts || 0,
            yards: player.rushing.yards || 0,
            touchdowns: player.rushing.touchdowns || 0
          };
        }
        
        // Add receiving stats if available
        if (player.receiving) {
          playerObj.stats.receiving = {
            targets: player.receiving.targets || 0,
            receptions: player.receiving.receptions || 0,
            yards: player.receiving.yards || 0,
            touchdowns: player.receiving.touchdowns || 0
          };
        }
        
        // Add defensive stats if available
        if (player.defense) {
          playerObj.stats.defense = {
            tackles: player.defense.tackles || 0,
            sacks: player.defense.sacks || 0,
            tacklesForLoss: player.defense.tacklesForLoss || 0,
            interceptions: player.defense.interceptions || 0,
            passesDefended: player.defense.passesDefended || 0
          };
        }
        
        // Add to appropriate team array
        // Make a more flexible comparison to handle potential string differences
        try {
          const playerTeamLower = (player.team || '').toLowerCase();
          const homeTeamLower = homeTeam.toLowerCase();
          const awayTeamLower = awayTeam.toLowerCase();
          
          if (playerTeamLower.includes(homeTeamLower) || homeTeamLower.includes(playerTeamLower)) {
            homeTeamPlayers.push(playerObj);
          } else if (playerTeamLower.includes(awayTeamLower) || awayTeamLower.includes(playerTeamLower)) {
            awayTeamPlayers.push(playerObj);
          } else {
            console.log(`Player team '${player.team}' doesn't match '${homeTeam}' or '${awayTeam}'`);
          }
        } catch (err) {
          console.error('Error processing player team assignment:', err, player);
        }
      }
      
      return {
        [homeTeam]: homeTeamPlayers,
        [awayTeam]: awayTeamPlayers
      };
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

  if (!teamStats || isEmptyValue(teamStats.homeTeamStats.totalYards) && isEmptyValue(teamStats.awayTeamStats.totalYards)) {
    console.warn('No valid team statistics available');
    return (
      <div style={styles.noData}>
        No advanced statistics available for this game.
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
                backgroundColor: drive.offense === homeTeam 
                  ? `${homeTeamColor}10` 
                  : `${awayTeamColor}10`
              }}
            >
              <div style={styles.driveTeam}>
                <img 
                  src={drive.offense === homeTeam ? homeLogo : awayLogo} 
                  alt={drive.offense} 
                  style={styles.driveLogoSmall} 
                />
                <span>{drive.offense}</span>
              </div>
              <div style={styles.driveQuarter}>{drive.period || 'N/A'}</div>
              <div 
                style={{
                  ...styles.driveResult,
                  color: drive.result === "Touchdown" || drive.result === "Field Goal" 
                    ? "#2ecc71" 
                    : drive.result === "Turnover" || drive.result === "Interception" || drive.result === "Fumble" 
                      ? "#e74c3c" 
                      : "#777"
                }}
              >
                {drive.result || 'N/A'}
              </div>
              <div style={styles.driveYards}>{drive.yards || 0}</div>
              <div style={styles.driveTime}>{drive.elapsed || 'N/A'}</div>
              <div style={styles.drivePlays}>{drive.plays || 0}</div>
              <div style={styles.driveStart}>{drive.startingPosition || 'N/A'}</div>
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
                        Receiving: {player.stats.receiving.receptions}/{player.stats.receiving.targets}, 
                        {player.stats.receiving.yards} yds, {player.stats.receiving.touchdowns} TD
                      </div>
                    )}
                    {player.stats.defense && (
                      <div>
                        Defense: {player.stats.defense.tackles} tackles, 
                        {player.stats.defense.sacks} sacks, {player.stats.defense.interceptions} INT
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
                        Receiving: {player.stats.receiving.receptions}/{player.stats.receiving.targets}, 
                        {player.stats.receiving.yards} yds, {player.stats.receiving.touchdowns} TD
                      </div>
                    )}
                    {player.stats.defense && (
                      <div>
                        Defense: {player.stats.defense.tackles} tackles, 
                        {player.stats.defense.sacks} sacks, {player.stats.defense.interceptions} INT
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