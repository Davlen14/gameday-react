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

// Helper function to determine if a value is empty (but not zero)
const isEmptyValue = (value) => {
  if (value === null || value === undefined) return true;
  // Removed check for zero values as they are valid statistical values
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
  
  // Case insensitive string comparison helper - for team name matching
  const isSameTeam = (team1, team2) => {
    if (!team1 || !team2) return false;
    return team1.toLowerCase().trim() === team2.toLowerCase().trim();
  };

  // Team name exact match check
  const teamsMatch = (team1, team2) => {
    if (!team1 || !team2) return false;
    const t1 = team1.toLowerCase().trim();
    const t2 = team2.toLowerCase().trim();
    
    // First try exact match
    if (t1 === t2) return true;
    
    // Special case for A&M/A & M variations
    const normalizeTeamName = (name) => name.replace(/\s*&\s*|\s+and\s+/gi, '').replace(/\s+/g, '');
    return normalizeTeamName(t1) === normalizeTeamName(t2);
  };

  // Helper function to find a stat value from array of stat objects
  const findStatValue = (stats, category) => {
    if (!stats || !Array.isArray(stats)) return 0;
    
    const statItem = stats.find(s => s.category === category);
    if (!statItem) return 0;
    
    let statStr = statItem.stat;
    // If statStr is null, empty, or just a dash, treat it as 0
    if (statStr === null || statStr === undefined || statStr.trim() === "" || statStr === "-") {
      return 0;
    }
    
    const numValue = parseFloat(statStr);
    return isNaN(numValue) ? 0 : numValue;
  };

  // Helper to parse fraction-like stats (e.g. "5-12")
  const parseFractionStat = (stats, category) => {
    const statValue = findStatValue(stats, category);
    // If the statValue is 0 or not in a fraction format, return zeros.
    if (!statValue || typeof statValue !== "string" || !statValue.includes("-")) {
      return { attempts: 0, conversions: 0 };
    }
    
    const parts = statValue.split('-');
    if (parts.length !== 2) return { attempts: 0, conversions: 0 };
    
    return {
      conversions: parseInt(parts[0]) || 0,
      attempts: parseInt(parts[1]) || 0
    };
  };

  // Parse time of possession from MM:SS format
  const parseTimeOfPossession = (stats) => {
    const possessionTime = findStatValue(stats, 'possessionTime');
    if (!possessionTime) return 0;
    
    const parts = possessionTime.split(':');
    if (parts.length !== 2) return 0;
    
    const minutes = parseInt(parts[0]) || 0;
    const seconds = parseInt(parts[1]) || 0;
    
    return minutes + (seconds / 60);
  };

  // Parse penalties stats (e.g. "11-125")
  const parsePenalties = (stats) => {
    const penaltiesValue = findStatValue(stats, 'totalPenaltiesYards');
    if (!penaltiesValue) return { count: 0, yards: 0 };
    
    const parts = String(penaltiesValue).split('-');
    if (parts.length !== 2) return { count: 0, yards: 0 };
    
    return {
      count: parseInt(parts[0]) || 0,
      yards: parseInt(parts[1]) || 0
    };
  };
  
  // Fetch real data from the API
  useEffect(() => {
    const fetchAllGameData = async () => {
      try {
        setIsLoading(true);
        
        // Get the year from gameData or default to current year
        const year = gameData?.season || new Date().getFullYear();
        console.log(`Fetching data for game ID: ${gameData.id}, year: ${year}, teams: ${homeTeam} vs ${awayTeam}`);
        
        // Fetch team stats for home and away teams
        let homeTeamStats = [];
        let awayTeamStats = [];
        
        try {
          // Use the new method to fetch team stats
          const homeTeamResponse = await teamsService.getTeamGameStatsByGameId(gameData.id, homeTeam, year);
          const awayTeamResponse = await teamsService.getTeamGameStatsByGameId(gameData.id, awayTeam, year);
          
          console.log('Home Team Stats Response:', homeTeamResponse);
          console.log('Away Team Stats Response:', awayTeamResponse);
          
          // Assuming the response is an array of stats objects
          homeTeamStats = homeTeamResponse || [];
          awayTeamStats = awayTeamResponse || [];
        } catch (err) {
          console.error('Error fetching team game stats:', err);
        }
        
        // Fetch game drives
        let drivesData = [];
        try {
          drivesData = await teamsService.getGameDrives(gameData.id, year);
          console.log('All drives data:', drivesData);
          
        // Filter drives to only include the current teams with exact name matching
        if (drivesData && Array.isArray(drivesData)) {
            drivesData = drivesData.filter(drive => 
            drive.offense &&
            (drive.offense.toLowerCase().trim() === homeTeam.toLowerCase().trim() ||
            drive.offense.toLowerCase().trim() === awayTeam.toLowerCase().trim())
            );
            console.log('Filtered drives data (exact match):', drivesData);
        }
        } catch (err) {
          console.error('Error fetching drives:', err);
        }
        
        // Fetch player stats for this game - try multiple approaches
        let playersData = [];
        try {
          // Mirror the approach from TeamAnalyticsDetail.js
          // Try to fetch player data for each category and team separately
          const passingPlayersHome = await teamsService.getPlayerGameStats(gameData.id, year, null, "regular", homeTeam, "passing");
          const rushingPlayersHome = await teamsService.getPlayerGameStats(gameData.id, year, null, "regular", homeTeam, "rushing");
          const receivingPlayersHome = await teamsService.getPlayerGameStats(gameData.id, year, null, "regular", homeTeam, "receiving");
          
          const passingPlayersAway = await teamsService.getPlayerGameStats(gameData.id, year, null, "regular", awayTeam, "passing");
          const rushingPlayersAway = await teamsService.getPlayerGameStats(gameData.id, year, null, "regular", awayTeam, "rushing");
          const receivingPlayersAway = await teamsService.getPlayerGameStats(gameData.id, year, null, "regular", awayTeam, "receiving");
          
          // Combine all valid player data responses
          if (Array.isArray(passingPlayersHome) && passingPlayersHome.length > 0) playersData.push(...passingPlayersHome);
          if (Array.isArray(rushingPlayersHome) && rushingPlayersHome.length > 0) playersData.push(...rushingPlayersHome);
          if (Array.isArray(receivingPlayersHome) && receivingPlayersHome.length > 0) playersData.push(...receivingPlayersHome);
          
          if (Array.isArray(passingPlayersAway) && passingPlayersAway.length > 0) playersData.push(...passingPlayersAway);
          if (Array.isArray(rushingPlayersAway) && rushingPlayersAway.length > 0) playersData.push(...rushingPlayersAway);
          if (Array.isArray(receivingPlayersAway) && receivingPlayersAway.length > 0) playersData.push(...receivingPlayersAway);
          
          console.log('Player data from category-specific fetch:', playersData);
          
          // If we still don't have data, try the direct approach
          if (playersData.length === 0) {
            try {
              const directPlayerData = await teamsService.getGamePlayers(gameData.id, year);
              if (Array.isArray(directPlayerData) && directPlayerData.length > 0) {
                playersData = directPlayerData;
                console.log('Player data from direct getGamePlayers:', playersData);
              }
            } catch (directErr) {
              console.warn('Error with direct getGamePlayers:', directErr);
            }
          }
        } catch (err) {
          console.error('Error in player stats fetching:', err);
          playersData = [];
        }
        
        // Optionally fetch advanced metrics if available
        let advancedMetrics = null;
        try {
          advancedMetrics = await teamsService.getAdvancedBoxScore(gameData.id, year);
        } catch (err) {
          console.warn("Advanced metrics not available:", err);
          
          // Create minimal advanced metrics from standard stats if possible
          if (homeTeamStats.length > 0 && awayTeamStats.length > 0) {
            advancedMetrics = {
              teams: [
                {
                  team: homeTeam,
                  efficiency: {
                    offensive: 0.5,
                    defensive: 0.5,
                    passingSuccess: 0.5,
                    rushingSuccess: 0.5
                  },
                  epa: {
                    total: 0,
                    passing: 0,
                    rushing: 0,
                    defense: 0
                  }
                },
                {
                  team: awayTeam,
                  efficiency: {
                    offensive: 0.5,
                    defensive: 0.5,
                    passingSuccess: 0.5,
                    rushingSuccess: 0.5
                  },
                  epa: {
                    total: 0,
                    passing: 0,
                    rushing: 0,
                    defense: 0
                  }
                }
              ]
            };
          }
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
      if (!homeStats || !Array.isArray(homeStats) || 
          !awayStats || !Array.isArray(awayStats)) {
        console.warn('Missing or invalid team stats data');
        // Print debug information
        console.warn('homeStats:', homeStats); // Debug homeStats
        console.warn('awayStats:', awayStats); // Debug awayStats
        // Return default structure with zeros
        return {
          homeTeamStats: createEmptyTeamStats(),
          awayTeamStats: createEmptyTeamStats()
        };
      }
      
      console.log('Processing home stats array length:', homeStats.length);
      console.log('Processing away stats array length:', awayStats.length);
      
      // Extract and structure the relevant stats for both teams
      return {
        homeTeamStats: {
          totalYards: findStatValue(homeStats, 'totalYards') || 0,
          passingYards: findStatValue(homeStats, 'netPassingYards') || 0,
          rushingYards: findStatValue(homeStats, 'rushingYards') || 0,
          firstDowns: findStatValue(homeStats, 'firstDowns') || 0,
          thirdDowns: parseFractionStat(homeStats, 'thirdDownEff'),
          fourthDowns: parseFractionStat(homeStats, 'fourthDownEff'),
          turnovers: findStatValue(homeStats, 'turnovers') || 0,
          timeOfPossession: parseTimeOfPossession(homeStats),
          redZone: parseFractionStat(homeStats, 'redZoneEff'),
          penalties: parsePenalties(homeStats),
          sacks: {
            count: findStatValue(homeStats, 'sacks') || 0,
            yards: findStatValue(homeStats, 'sackYards') || 0
          },
          explosivePlays: findStatValue(homeStats, 'explosivePlays') || 0,
          epa: {
            total: 0,
            passing: 0,
            rushing: 0,
            defense: 0
          },
          efficiency: {
            offensive: 0.5,
            defensive: 0.5,
            passingSuccess: 0.5,
            rushingSuccess: 0.5
          }
        },
        awayTeamStats: {
          totalYards: findStatValue(awayStats, 'totalYards') || 0,
          passingYards: findStatValue(awayStats, 'netPassingYards') || 0,
          rushingYards: findStatValue(awayStats, 'rushingYards') || 0,
          firstDowns: findStatValue(awayStats, 'firstDowns') || 0,
          thirdDowns: parseFractionStat(awayStats, 'thirdDownEff'),
          fourthDowns: parseFractionStat(awayStats, 'fourthDownEff'),
          turnovers: findStatValue(awayStats, 'turnovers') || 0,
          timeOfPossession: parseTimeOfPossession(awayStats),
          redZone: parseFractionStat(awayStats, 'redZoneEff'),
          penalties: parsePenalties(awayStats),
          sacks: {
            count: findStatValue(awayStats, 'sacks') || 0,
            yards: findStatValue(awayStats, 'sackYards') || 0
          },
          explosivePlays: findStatValue(awayStats, 'explosivePlays') || 0,
          epa: {
            total: 0,
            passing: 0,
            rushing: 0,
            defense: 0
          },
          efficiency: {
            offensive: 0.5,
            defensive: 0.5,
            passingSuccess: 0.5,
            rushingSuccess: 0.5
          }
        }
      };
    };
    
    // Extract player stats from potentially nested structure
    const processPlayerStats = (playersData, homeTeam, awayTeam) => {
      // Default empty result
      const result = {
        [homeTeam]: [],
        [awayTeam]: []
      };
      
      // Ensure we have data to process
      if (!playersData || !Array.isArray(playersData) || playersData.length === 0) {
        console.warn('No player data available');
        return result;
      }
      
      // Check for the structure - array of category type or direct players array
      if (playersData[0] && playersData[0].categories) {
        // Nested category structure
        console.log('Processing nested category player data');
        return processNestedPlayerData(playersData, homeTeam, awayTeam);
      } else {
        // Direct player array
        console.log('Processing direct player array data');
        return processDirectPlayerData(playersData, homeTeam, awayTeam);
      }
    };
    
    // Process direct player array structure
    const processDirectPlayerData = (playersData, homeTeam, awayTeam) => {
      const homeTeamPlayers = [];
      const awayTeamPlayers = [];
      
      // Track warnings for missing team information
      let warningCount = 0;
      const MAX_WARNINGS = 5; // Limit warning spam in console
      
      for (const player of playersData) {
        // Skip if player is null or undefined
        if (!player) continue;
        
        // Make sure we have a valid player object with a team property
        if (!player.team) {
          if (warningCount < MAX_WARNINGS) {
            console.warn('Player missing team information:', player);
            warningCount++;
            
            if (warningCount === MAX_WARNINGS) {
              console.warn('Additional missing team warnings suppressed...');
            }
          }
          
          // Try to infer team based on homeTeam/awayTeam properties
          if (player.homeTeam) {
            console.log(`Inferring team ${player.homeTeam} for player ${player.name || 'Unknown'}`);
            player.team = player.homeTeam;
          } else if (player.awayTeam) {
            console.log(`Inferring team ${player.awayTeam} for player ${player.name || 'Unknown'}`);
            player.team = player.awayTeam;
          } else {
            // Cannot determine team, skip this player
            continue;
          }
        }
        
        // Create player object with key stats
        const playerObj = {
          name: player.name || `${player.firstName || ''} ${player.lastName || ''}`.trim() || 'Unknown Player',
          position: player.position || 'N/A',
          team: player.team, // Explicitly add team property
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
        
        // Add to appropriate team array using flexible matching
        try {
          if (teamsMatch(player.team, homeTeam)) {
            homeTeamPlayers.push(playerObj);
          } else if (teamsMatch(player.team, awayTeam)) {
            awayTeamPlayers.push(playerObj);
          } else {
            console.log(`Player team '${player.team}' doesn't match '${homeTeam}' or '${awayTeam}'`);
            
            // As a last resort, try to guess based on whether it's in homeTeam or awayTeam array
            // This is speculative but better than losing the data entirely
            if (player.homeAway === 'home') {
              console.log(`Using homeAway='home' to assign player ${playerObj.name} to ${homeTeam}`);
              homeTeamPlayers.push(playerObj);
            } else if (player.homeAway === 'away') {
              console.log(`Using homeAway='away' to assign player ${playerObj.name} to ${awayTeam}`);
              awayTeamPlayers.push(playerObj);
            }
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
    
    // Process nested category player data
    const processNestedPlayerData = (playersData, homeTeam, awayTeam) => {
      const result = {
        [homeTeam]: [],
        [awayTeam]: []
      };
      
      // Ensure we have data to process
      if (!playersData || !Array.isArray(playersData) || playersData.length === 0) {
        console.warn('No player data available');
        return result;
      }
      
      // Check for the structure - we need to handle multiple possible API response formats
      
      // Format 1: Array of entries with teams -> categories -> types -> athletes (like TopPerformers format)
      if (playersData[0] && playersData[0].teams && Array.isArray(playersData[0].teams)) {
        console.log('Processing TopPerformers-style player data structure');
        
        playersData.forEach(gameData => {
          if (!gameData.teams || !Array.isArray(gameData.teams)) return;
          
          gameData.teams.forEach(teamData => {
            if (!teamData.team || !teamData.categories || !Array.isArray(teamData.categories)) return;
            
            // Determine which team this data belongs to
            const currentTeam = teamsMatch(teamData.team, homeTeam) ? homeTeam : 
                              teamsMatch(teamData.team, awayTeam) ? awayTeam : null;
            
            if (!currentTeam) {
              console.warn(`Team ${teamData.team} doesn't match either ${homeTeam} or ${awayTeam}`);
              return;
            }
            
            // Process each category for this team
            teamData.categories.forEach(category => {
              if (!category.name || !category.types || !Array.isArray(category.types)) return;
              
              // Process each stat type within the category
              category.types.forEach(type => {
                if (!type.name || !type.athletes || !Array.isArray(type.athletes)) return;
                
                // Process each athlete for this stat type
                type.athletes.forEach(athlete => {
                  if (!athlete.id || athlete.stat === undefined) return;
                  
                  // Find existing player or create new one
                  let player = result[currentTeam].find(p => p.id === athlete.id);
                  
                  if (!player) {
                    player = {
                      id: athlete.id,
                      name: athlete.name || 'Unknown Player',
                      team: currentTeam, // Explicitly set team
                      position: athlete.position || 'N/A',
                      stats: {}
                    };
                    result[currentTeam].push(player);
                  }
                  
                  // Parse stat value
                  const statValue = parseFloat(athlete.stat);
                  const statNumber = isNaN(statValue) ? 0 : statValue;
                  
                  // Map category.name and type.name to our stats structure
                  const categoryName = category.name.toLowerCase();
                  const typeName = type.name.toUpperCase();
                  
                  // Initialize stat category if it doesn't exist
                  if (!player.stats[categoryName]) {
                    player.stats[categoryName] = {};
                  }
                  
                  // Add specific stat based on category and type
                  switch (categoryName) {
                    case 'passing':
                      switch (typeName) {
                        case 'ATT': player.stats.passing.attempts = statNumber; break;
                        case 'C/ATT': 
                          // Handle completion/attempts format (like "21-35")
                          const parts = athlete.stat.split('-');
                          if (parts.length === 2) {
                            player.stats.passing.completions = parseInt(parts[0]) || 0;
                            player.stats.passing.attempts = parseInt(parts[1]) || 0;
                          }
                          break;
                        case 'CMP': player.stats.passing.completions = statNumber; break;
                        case 'YDS': player.stats.passing.yards = statNumber; break;
                        case 'TD': player.stats.passing.touchdowns = statNumber; break;
                        case 'INT': player.stats.passing.interceptions = statNumber; break;
                      }
                      break;
                      
                    case 'rushing':
                      switch (typeName) {
                        case 'ATT': case 'CAR': player.stats.rushing.attempts = statNumber; break;
                        case 'YDS': player.stats.rushing.yards = statNumber; break;
                        case 'TD': player.stats.rushing.touchdowns = statNumber; break;
                      }
                      break;
                      
                    case 'receiving':
                      switch (typeName) {
                        case 'REC': player.stats.receiving.receptions = statNumber; break;
                        case 'TAR': player.stats.receiving.targets = statNumber; break;
                        case 'YDS': player.stats.receiving.yards = statNumber; break;
                        case 'TD': player.stats.receiving.touchdowns = statNumber; break;
                      }
                      break;
                      
                    case 'defensive':
                      switch (typeName) {
                        case 'TOT': player.stats.defense.tackles = statNumber; break;
                        case 'SOLO': player.stats.defense.soloTackles = statNumber; break;
                        case 'SACKS': player.stats.defense.sacks = statNumber; break;
                        case 'TFL': player.stats.defense.tacklesForLoss = statNumber; break;
                        case 'PD': player.stats.defense.passesDefended = statNumber; break;
                        case 'QB HUR': player.stats.defense.qbHurries = statNumber; break;
                        case 'INT': player.stats.defense.interceptions = statNumber; break;
                      }
                      break;
                  }
                });
              });
            });
          });
        });
        
        return result;
      }
      
      // Format 2: Original format with array of team objects with categories
      console.log('Processing original nested category player data format');
      
      for (const teamData of playersData) {
        if (!teamData.team || !teamData.categories) continue;
        
        const currentTeam = teamsMatch(teamData.team, homeTeam) ? homeTeam : 
                          teamsMatch(teamData.team, awayTeam) ? awayTeam : null;
        
        if (!currentTeam) {
          console.warn(`Team ${teamData.team} doesn't match either ${homeTeam} or ${awayTeam}`);
          continue;
        }
        
        const allPlayers = new Map(); // Use map to collect all player data
        
        // Process each category
        for (const category of teamData.categories) {
          if (!category.name || !category.types) continue;
          
          // Process each stat type within the category
          for (const type of category.types) {
            if (!type.name || !type.athletes) continue;
            
            // Process each athlete for this stat type
            for (const athlete of type.athletes) {
              if (!athlete.id || athlete.stat === undefined) continue;
              
              // Get or create player object
              if (!allPlayers.has(athlete.id)) {
                allPlayers.set(athlete.id, {
                  id: athlete.id,
                  name: athlete.name || 'Unknown Player',
                  team: currentTeam, // Explicitly set team
                  position: 'N/A', // Position info might be elsewhere
                  stats: {}
                });
              }
              
              const player = allPlayers.get(athlete.id);
              
              // Add stat based on category and type
              const statValue = parseFloat(athlete.stat);
              const statNumber = isNaN(statValue) ? 0 : statValue;
              
              // Map category.name and type.name to our stats structure
              switch (category.name.toLowerCase()) {
                case 'passing':
                  if (!player.stats.passing) player.stats.passing = {};
                  
                  switch (type.name.toLowerCase()) {
                    case 'att': player.stats.passing.attempts = statNumber; break;
                    case 'cmp': player.stats.passing.completions = statNumber; break;
                    case 'yds': player.stats.passing.yards = statNumber; break;
                    case 'td': player.stats.passing.touchdowns = statNumber; break;
                    case 'int': player.stats.passing.interceptions = statNumber; break;
                  }
                  break;
                  
                case 'rushing':
                  if (!player.stats.rushing) player.stats.rushing = {};
                  
                  switch (type.name.toLowerCase()) {
                    case 'att': case 'car': player.stats.rushing.attempts = statNumber; break;
                    case 'yds': player.stats.rushing.yards = statNumber; break;
                    case 'td': player.stats.rushing.touchdowns = statNumber; break;
                  }
                  break;
                  
                case 'receiving':
                  if (!player.stats.receiving) player.stats.receiving = {};
                  
                  switch (type.name.toLowerCase()) {
                    case 'rec': player.stats.receiving.receptions = statNumber; break;
                    case 'tar': player.stats.receiving.targets = statNumber; break;
                    case 'yds': player.stats.receiving.yards = statNumber; break;
                    case 'td': player.stats.receiving.touchdowns = statNumber; break;
                  }
                  break;
                  
                case 'defensive':
                  if (!player.stats.defense) player.stats.defense = {};
                  
                  switch (type.name.toLowerCase()) {
                    case 'tot': player.stats.defense.tackles = statNumber; break;
                    case 'solo': player.stats.defense.soloTackles = statNumber; break;
                    case 'sacks': player.stats.defense.sacks = statNumber; break;
                    case 'tfl': player.stats.defense.tacklesForLoss = statNumber; break;
                    case 'pd': player.stats.defense.passesDefended = statNumber; break;
                    case 'qb hur': player.stats.defense.qbHurries = statNumber; break;
                    case 'int': player.stats.defense.interceptions = statNumber; break;
                  }
                  break;
              }
            }
          }
        }
        
        // Add all players to result
        result[currentTeam] = Array.from(allPlayers.values());
      }
      
      return result;
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
  if (teamStats.homeTeamStats.totalYards === undefined || teamStats.homeTeamStats.totalYards === null ||
      teamStats.awayTeamStats.totalYards === undefined || teamStats.awayTeamStats.totalYards === null) {
    console.warn('Total yards property is missing or null:', { 
      homeTeamTotalYards: teamStats.homeTeamStats.totalYards,
      awayTeamTotalYards: teamStats.awayTeamStats.totalYards 
    });
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
                backgroundColor: teamsMatch(drive.offense, homeTeam)
                  ? `${homeTeamColor}10` 
                  : `${awayTeamColor}10`
              }}
            >
              <div style={styles.driveTeam}>
                <img 
                  src={teamsMatch(drive.offense, homeTeam) ? homeLogo : awayLogo} 
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