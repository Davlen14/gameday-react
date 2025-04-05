import React, { useState, useEffect } from "react";
import * as teamsService from "../services/teamsService";
import '../styles/GameStats.css';

// Tooltip component
const Tooltip = ({ text, children }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  
  return (
    <div 
      className="tooltipContainer"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {children}
      <span className="tooltipIcon">ⓘ</span>
      <div className={showTooltip ? "tooltip tooltipVisible" : "tooltip"}>
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
      <div className="progressBarContainer">
        <div 
          className="progressBar"
          style={{width: `${percentage}%`, backgroundColor: color}}
        />
      </div>
      <div className="metricExplanation">
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
  const [showAllDrives, setShowAllDrives] = useState(false);
  
  // Helper function to extract a specific stat value from team stats array
  const getStatValue = (teamData, category) => {
    if (!teamData || !teamData.stats) {
      console.log(`No stats found for category: ${category}`);
      return '-';
    }
    const statItem = teamData.stats.find(stat => stat.category === category);
    return statItem ? statItem.stat : '-';
  };
  
  const findTeamStats = (teamName, teamGameStats) => {
    if (!teamGameStats || teamGameStats.length === 0) {
      console.log('No team game stats available');
      return null;
    }
    
    // Iterate over all game stats items and try a flexible match
    for (const game of teamGameStats) {
      if (game.teams && game.teams.length > 0) {
        const teamData = game.teams.find(team =>
          team.team.toLowerCase() === teamName.toLowerCase() ||
          team.team.toLowerCase().includes(teamName.toLowerCase()) ||
          teamName.toLowerCase().includes(team.team.toLowerCase())
        );
        if (teamData) {
          return teamData;
        }
      }
    }
    console.log(`No matching stats found for: ${teamName}`);
    return null;
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
                year: year,
                week: gameData.week // pass the correct week
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
          // Fetch player data for each category and team using gameData.week
          const passingPlayersHome = await teamsService.getPlayerGameStats(gameData.id, year, gameData.week, "regular", homeTeam, "passing");
          const rushingPlayersHome = await teamsService.getPlayerGameStats(gameData.id, year, gameData.week, "regular", homeTeam, "rushing");
          const receivingPlayersHome = await teamsService.getPlayerGameStats(gameData.id, year, gameData.week, "regular", homeTeam, "receiving");
          
          const passingPlayersAway = await teamsService.getPlayerGameStats(gameData.id, year, gameData.week, "regular", awayTeam, "passing");
          const rushingPlayersAway = await teamsService.getPlayerGameStats(gameData.id, year, gameData.week, "regular", awayTeam, "rushing");
          const receivingPlayersAway = await teamsService.getPlayerGameStats(gameData.id, year, gameData.week, "regular", awayTeam, "receiving");
          
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
      <div className="loading">
        <div className="loader"></div>
        <p>Loading advanced statistics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error">
        <div className="errorIcon">⚠️</div>
        <p className="errorMessage">{error}</p>
      </div>
    );
  }

  if (!teamStats) {
    console.warn('teamStats variable is null');
    return (
      <div className="noData">
        Data for this game has not been received.
      </div>
    );
  }
  
  // Check if totalYards properties are missing (not just zero)
  if (teamStats.homeTeamStats.totalYards === undefined || 
      teamStats.awayTeamStats.totalYards === undefined) {
    console.warn('Total yards property is missing or null');
    return (
      <div className="noData">
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
    <div className="statSection">
      <h3 className="sectionTitle">Team Statistics Comparison</h3>
      
      <div className="teamComparisonGrid">
        {/* Teams Headers */}
        <div className="teamHeader" style={{ justifyContent: 'flex-end' }}>
          <span className="teamName">{homeTeam}</span>
          <img src={homeLogo} alt={homeTeam} className="teamLogo" />
        </div>
        <div style={{ gridColumn: "2" }}></div>
        <div className="teamHeader">
          <img src={awayLogo} alt={awayTeam} className="teamLogo" />
          <span className="teamName">{awayTeam}</span>
        </div>
        
        {/* Total Yards */}
        <div className="homeStatValue" style={{ backgroundColor: `${homeTeamColor}20` }}>
          {homeTeamStats.totalYards}
        </div>
        <div className="statLabel">Total Yards</div>
        <div className="awayStatValue" style={{ backgroundColor: `${awayTeamColor}20` }}>
          {awayTeamStats.totalYards}
        </div>
        
        {/* Yards Bar */}
        <div style={{ gridColumn: "1 / span 3" }}>
          <div className="statBar">
            <div className="statBarInner" style={{ width: `${homeYardsPercentage}%`, backgroundColor: homeTeamColor }} />
            <div className="statBarInner" style={{ width: `${awayYardsPercentage}%`, backgroundColor: awayTeamColor }} />
          </div>
        </div>
        
        {/* Passing Yards */}
        <div className="homeStatValue" style={{ backgroundColor: `${homeTeamColor}20` }}>
          {homeTeamStats.passingYards}
        </div>
        <div className="statLabel">Passing Yards</div>
        <div className="awayStatValue" style={{ backgroundColor: `${awayTeamColor}20` }}>
          {awayTeamStats.passingYards}
        </div>
        
        {/* Rushing Yards */}
        <div className="homeStatValue" style={{ backgroundColor: `${homeTeamColor}20` }}>
          {homeTeamStats.rushingYards}
        </div>
        <div className="statLabel">Rushing Yards</div>
        <div className="awayStatValue" style={{ backgroundColor: `${awayTeamColor}20` }}>
          {awayTeamStats.rushingYards}
        </div>
        
        {/* First Downs */}
        <div className="homeStatValue" style={{ backgroundColor: `${homeTeamColor}20` }}>
          {homeTeamStats.firstDowns}
        </div>
        <div className="statLabel">First Downs</div>
        <div className="awayStatValue" style={{ backgroundColor: `${awayTeamColor}20` }}>
          {awayTeamStats.firstDowns}
        </div>
        
        {/* Third Down Efficiency */}
        <div className="homeStatValue" style={{ backgroundColor: `${homeTeamColor}20` }}>
          {homeTeamStats.thirdDowns.conversions}/{homeTeamStats.thirdDowns.attempts} 
          ({homeTeamStats.thirdDowns.attempts > 0 
            ? Math.round((homeTeamStats.thirdDowns.conversions / homeTeamStats.thirdDowns.attempts) * 100) 
            : 0}%)
        </div>
        <div className="statLabel">Third Down</div>
        <div className="awayStatValue" style={{ backgroundColor: `${awayTeamColor}20` }}>
          {awayTeamStats.thirdDowns.conversions}/{awayTeamStats.thirdDowns.attempts}
          ({awayTeamStats.thirdDowns.attempts > 0 
            ? Math.round((awayTeamStats.thirdDowns.conversions / awayTeamStats.thirdDowns.attempts) * 100) 
            : 0}%)
        </div>
        
        {/* Fourth Down Efficiency */}
        <div className="homeStatValue" style={{ backgroundColor: `${homeTeamColor}20` }}>
          {homeTeamStats.fourthDowns.conversions}/{homeTeamStats.fourthDowns.attempts} 
          ({homeTeamStats.fourthDowns.attempts > 0 
            ? Math.round((homeTeamStats.fourthDowns.conversions / homeTeamStats.fourthDowns.attempts) * 100) 
            : 0}%)
        </div>
        <div className="statLabel">Fourth Down</div>
        <div className="awayStatValue" style={{ backgroundColor: `${awayTeamColor}20` }}>
          {awayTeamStats.fourthDowns.conversions}/{awayTeamStats.fourthDowns.attempts} 
          ({awayTeamStats.fourthDowns.attempts > 0 
            ? Math.round((awayTeamStats.fourthDowns.conversions / awayTeamStats.fourthDowns.attempts) * 100) 
            : 0}%)
        </div>
        
        {/* Red Zone Efficiency */}
        <div className="homeStatValue" style={{ backgroundColor: `${homeTeamColor}20` }}>
          {homeTeamStats.redZone.conversions}/{homeTeamStats.redZone.attempts} 
          ({homeTeamStats.redZone.attempts > 0 
            ? Math.round((homeTeamStats.redZone.conversions / homeTeamStats.redZone.attempts) * 100) 
            : 0}%)
        </div>
        <div className="statLabel">Red Zone</div>
        <div className="awayStatValue" style={{ backgroundColor: `${awayTeamColor}20` }}>
          {awayTeamStats.redZone.conversions}/{awayTeamStats.redZone.attempts}
          ({awayTeamStats.redZone.attempts > 0 
            ? Math.round((awayTeamStats.redZone.conversions / awayTeamStats.redZone.attempts) * 100) 
            : 0}%)
        </div>
        
        {/* Penalties */}
        <div className="homeStatValue" style={{ backgroundColor: `${homeTeamColor}20` }}>
          {homeTeamStats.penalties.count}-{homeTeamStats.penalties.yards}
        </div>
        <div className="statLabel">Penalties</div>
        <div className="awayStatValue" style={{ backgroundColor: `${awayTeamColor}20` }}>
          {awayTeamStats.penalties.count}-{awayTeamStats.penalties.yards}
        </div>
        
        {/* Turnovers */}
        <div className="homeStatValue" style={{ backgroundColor: `${homeTeamColor}20` }}>
          {homeTeamStats.turnovers}
        </div>
        <div className="statLabel">Turnovers</div>
        <div className="awayStatValue" style={{ backgroundColor: `${awayTeamColor}20` }}>
          {awayTeamStats.turnovers}
        </div>
        
        {/* Sacks */}
        <div className="homeStatValue" style={{ backgroundColor: `${homeTeamColor}20` }}>
          {homeTeamStats.sacks.count}-{homeTeamStats.sacks.yards}
        </div>
        <div className="statLabel">Sacks</div>
        <div className="awayStatValue" style={{ backgroundColor: `${awayTeamColor}20` }}>
          {awayTeamStats.sacks.count}-{awayTeamStats.sacks.yards}
        </div>
        
        {/* Time of Possession */}
        <div className="homeStatValue" style={{ backgroundColor: `${homeTeamColor}20` }}>
          {Math.floor(homeTeamStats.timeOfPossession)}:{Math.round((homeTeamStats.timeOfPossession % 1) * 60).toString().padStart(2, '0')}
        </div>
        <div className="statLabel">Time of Possession</div>
        <div className="awayStatValue" style={{ backgroundColor: `${awayTeamColor}20` }}>
          {Math.floor(awayTeamStats.timeOfPossession)}:{Math.round((awayTeamStats.timeOfPossession % 1) * 60).toString().padStart(2, '0')}
        </div>
        
        {/* Possession Bar */}
        <div style={{ gridColumn: "1 / span 3" }}>
          <div className="timeOfPossessionContainer">
            <div 
              className="timeSegment"
              style={{ 
                width: `${homePossessionPercentage}%`, 
                backgroundColor: homeTeamColor
              }}
            >
              {homePossessionPercentage}%
            </div>
            <div 
              className="timeSegment"
              style={{ 
                width: `${awayPossessionPercentage}%`, 
                backgroundColor: awayTeamColor
              }}
            >
              {awayPossessionPercentage}%
            </div>
          </div>
        </div>
        
        {/* Explosive Plays */}
        <div className="homeStatValue" style={{ backgroundColor: `${homeTeamColor}20` }}>
          {homeTeamStats.explosivePlays}
        </div>
        <div className="statLabel">
          <Tooltip text="Plays over 20 yards">
            Explosive Plays
          </Tooltip>
        </div>
        <div className="awayStatValue" style={{ backgroundColor: `${awayTeamColor}20` }}>
          {awayTeamStats.explosivePlays}
        </div>
      </div>
    </div>
  );
  
  const renderAdvancedMetrics = () => {
    if (!advancedData) {
      return (
        <div className="statSection">
          <h3 className="sectionTitle">Advanced Metrics</h3>
          <div className="noData">Advanced metrics not available for this game.</div>
        </div>
      );
    }
    
    return (
      <div className="statSection">
        <h3 className="sectionTitle">Advanced Metrics</h3>
        
        <div className="tabs">
          <div 
            className={activeMetricTab === 'efficiency' ? "tab activeTab" : "tab"}
            onClick={() => setActiveMetricTab('efficiency')}
          >
            Efficiency
          </div>
          <div 
            className={activeMetricTab === 'epa' ? "tab activeTab" : "tab"}
            onClick={() => setActiveMetricTab('epa')}
          >
            EPA (Expected Points Added)
          </div>
        </div>
        
        {activeMetricTab === 'efficiency' && (
          <div className="efficiencyContainer">
            <div className="efficiencyCard" style={{borderLeft: `4px solid ${homeTeamColor}`}}>
              <div className="teamHeader" style={{marginBottom: '15px'}}>
                <img src={homeLogo} alt={homeTeam} className="teamLogo" />
                <span className="teamName">{homeTeam} Efficiency</span>
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
            
            <div className="efficiencyCard" style={{borderLeft: `4px solid ${awayTeamColor}`}}>
              <div className="teamHeader" style={{marginBottom: '15px'}}>
                <img src={awayLogo} alt={awayTeam} className="teamLogo" />
                <span className="teamName">{awayTeam} Efficiency</span>
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
          <div className="efficiencyContainer">
            <div className="efficiencyCard" style={{borderLeft: `4px solid ${homeTeamColor}`}}>
              <div className="teamHeader" style={{marginBottom: '15px'}}>
                <img src={homeLogo} alt={homeTeam} className="teamLogo" />
                <span className="teamName">{homeTeam} EPA</span>
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
            
            <div className="efficiencyCard" style={{borderLeft: `4px solid ${awayTeamColor}`}}>
              <div className="teamHeader" style={{marginBottom: '15px'}}>
                <img src={awayLogo} alt={awayTeam} className="teamLogo" />
                <span className="teamName">{awayTeam} EPA</span>
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
        <div className="statSection">
          <h3 className="sectionTitle">Drive Summary</h3>
          <div className="noData">Drive data not available for this game.</div>
        </div>
      );
    }
    
    // Filter drives to show only 1st quarter initially
    const filteredDrives = showAllDrives 
      ? drives 
      : drives.filter(drive => drive.startPeriod === 1 || drive.startPeriod === '1');
    
    // If no 1st quarter drives are available, show all drives
    const drivesToShow = filteredDrives.length > 0 ? filteredDrives : drives;
    
    return (
      <div className="statSection">
        <h3 className="sectionTitle">Drive Summary {!showAllDrives ? '(1st Quarter)' : ''}</h3>
        
        <div className="drivesContainer">
          <div className="driveRow driveHeader">
            <div className="driveTeam">Team</div>
            <div className="driveQuarter">Qtr</div>
            <div className="driveResult">Result</div>
            <div className="driveYards">Yards</div>
            <div className="driveTime">Time</div>
            <div className="drivePlays">Plays</div>
            <div className="driveStart">Start</div>
          </div>
          
          {drivesToShow.map((drive, index) => (
            <div 
              key={index} 
              className="driveRow"
              style={{
                backgroundColor: drive.offense.toLowerCase() === homeTeam.toLowerCase()
                  ? `${homeTeamColor}10` 
                  : `${awayTeamColor}10`
              }}
            >
              <div className="driveTeam">
                <img 
                  src={drive.offense.toLowerCase() === homeTeam.toLowerCase() ? homeLogo : awayLogo} 
                  alt={drive.offense} 
                  className="driveLogoSmall" 
                />
                <span>{drive.offense}</span>
              </div>
              <div className="driveQuarter">{drive.startPeriod || 'N/A'}</div>
              <div 
                className="driveResult"
                style={{
                  color: drive.driveResult === "TD" || drive.driveResult === "FG" 
                    ? "#2ecc71" 
                    : drive.driveResult === "TURNOVER" || drive.driveResult === "INT" || drive.driveResult === "FUMBLE" 
                      ? "#e74c3c" 
                      : "#777"
                }}
              >
                {drive.driveResult || 'N/A'}
              </div>
              <div className="driveYards">{drive.yards || 0}</div>
              <div className="driveTime">
                {drive.startTime && drive.endTime ? 
                  `${Math.abs(drive.startTime.minutes - drive.endTime.minutes)}:${Math.abs(drive.startTime.seconds - drive.endTime.seconds).toString().padStart(2, '0')}` : 
                  'N/A'}
              </div>
              <div className="drivePlays">{drive.plays || 0}</div>
              <div className="driveStart">
                {drive.startYardline ? `${drive.startYardline}` : 'N/A'}
              </div>
            </div>
          ))}
          
          {/* Only show the toggle button if there are drives beyond the 1st quarter */}
          {drives.length > filteredDrives.length && (
            <div 
              onClick={() => setShowAllDrives(!showAllDrives)}
              className="viewMoreButton"
            >
              {showAllDrives ? 'View Less (1st Quarter Only)' : 'View More (All Quarters)'}
            </div>
          )}
        </div>
      </div>
    );
  };
  
  const renderKeyPlayers = () => {
    const homeTeamPlayers = playerStats[homeTeam] || [];
    const awayTeamPlayers = playerStats[awayTeam] || [];
    
    if (homeTeamPlayers.length === 0 && awayTeamPlayers.length === 0) {
      return (
        <div className="statSection">
          <h3 className="sectionTitle">Key Player Statistics</h3>
          <div className="noData">Player statistics not available for this game.</div>
        </div>
      );
    }
    
    return (
      <div className="statSection">
        <h3 className="sectionTitle">Key Player Statistics</h3>
        
        <div className="teamHeader" style={{marginBottom: '15px', borderBottom: `2px solid ${homeTeamColor}`}}>
          <img src={homeLogo} alt={homeTeam} className="teamLogo" />
          <span className="teamName">{homeTeam} Key Players</span>
        </div>
        
        <table className="playerStatsTable">
          <thead>
            <tr>
              <th className="tableHeader">Player</th>
              <th className="tableHeader">Position</th>
              <th className="tableHeader">Statistics</th>
            </tr>
          </thead>
          <tbody>
            {homeTeamPlayers.length > 0 ? (
              homeTeamPlayers.map((player, index) => (
                <tr key={index}>
                  <td className="tableCell">{player.name}</td>
                  <td className="tableCell">{player.position}</td>
                  <td className="tableCell">
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
                <td colSpan="3" className="tableCell">No player data available</td>
              </tr>
            )}
          </tbody>
        </table>
        
        <div className="teamHeader" style={{margin: '25px 0 15px', borderBottom: `2px solid ${awayTeamColor}`}}>
          <img src={awayLogo} alt={awayTeam} className="teamLogo" />
          <span className="teamName">{awayTeam} Key Players</span>
        </div>
        
        <table className="playerStatsTable">
          <thead>
            <tr>
              <th className="tableHeader">Player</th>
              <th className="tableHeader">Position</th>
              <th className="tableHeader">Statistics</th>
            </tr>
          </thead>
          <tbody>
            {awayTeamPlayers.length > 0 ? (
              awayTeamPlayers.map((player, index) => (
                <tr key={index}>
                  <td className="tableCell">{player.name}</td>
                  <td className="tableCell">{player.position}</td>
                  <td className="tableCell">
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
                <td colSpan="3" className="tableCell">No player data available</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    );
  };
  
  return (
    <div className="container">
      {renderTeamStatsComparison()}
      {renderAdvancedMetrics()}
      {renderDrives()}
      {renderKeyPlayers()}
    </div>
  );
};

export default GameStats;