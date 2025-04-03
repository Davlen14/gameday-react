import React, { useState, useEffect } from "react";
import teamsService from "../services/teamsService";
import GameAdvancedMetrics from "./GameAdvancedMetrics";

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
};

const GameStats = ({ gameData, homeTeam, awayTeam, homeTeamColor, awayTeamColor, homeLogo, awayLogo }) => {
  const [advancedData, setAdvancedData] = useState(null);
  const [teamStats, setTeamStats] = useState(null);
  const [drives, setDrives] = useState([]);
  const [playerStats, setPlayerStats] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Helper functions (isSameTeam, teamsMatch, findStatValue, parseFractionStat, parseTimeOfPossession, parsePenalties)
  // … (unchanged helper functions from your original file)

  useEffect(() => {
    const fetchAllGameData = async () => {
      try {
        setIsLoading(true);
        const year = gameData?.season || new Date().getFullYear();
        console.log(`Fetching data for game ID: ${gameData.id}, year: ${year}, teams: ${homeTeam} vs ${awayTeam}`);

        // Fetch team stats for home and away teams
        let homeTeamStats = [];
        let awayTeamStats = [];
        try {
          const homeTeamResponse = await teamsService.getTeamGameStatsByGameId(gameData.id, homeTeam, year);
          const awayTeamResponse = await teamsService.getTeamGameStatsByGameId(gameData.id, awayTeam, year);
          homeTeamStats = homeTeamResponse || [];
          awayTeamStats = awayTeamResponse || [];
        } catch (err) {
          console.error('Error fetching team game stats:', err);
        }

        // Fetch drives data
        let drivesData = [];
        try {
          drivesData = await teamsService.getGameDrives(gameData.id, year);
          if (drivesData && Array.isArray(drivesData)) {
            drivesData = drivesData.filter(drive =>
              drive.offense &&
              (drive.offense.toLowerCase().trim() === homeTeam.toLowerCase().trim() ||
               drive.offense.toLowerCase().trim() === awayTeam.toLowerCase().trim())
            );
          }
        } catch (err) {
          console.error('Error fetching drives:', err);
        }

        // Fetch player stats
        let playersData = [];
        try {
          const passingPlayersHome = await teamsService.getPlayerGameStats(gameData.id, year, null, "regular", homeTeam, "passing");
          const rushingPlayersHome = await teamsService.getPlayerGameStats(gameData.id, year, null, "regular", homeTeam, "rushing");
          const receivingPlayersHome = await teamsService.getPlayerGameStats(gameData.id, year, null, "regular", homeTeam, "receiving");
          const passingPlayersAway = await teamsService.getPlayerGameStats(gameData.id, year, null, "regular", awayTeam, "passing");
          const rushingPlayersAway = await teamsService.getPlayerGameStats(gameData.id, year, null, "regular", awayTeam, "rushing");
          const receivingPlayersAway = await teamsService.getPlayerGameStats(gameData.id, year, null, "regular", awayTeam, "receiving");

          if (Array.isArray(passingPlayersHome) && passingPlayersHome.length > 0) playersData.push(...passingPlayersHome);
          if (Array.isArray(rushingPlayersHome) && rushingPlayersHome.length > 0) playersData.push(...rushingPlayersHome);
          if (Array.isArray(receivingPlayersHome) && receivingPlayersHome.length > 0) playersData.push(...receivingPlayersHome);
          if (Array.isArray(passingPlayersAway) && passingPlayersAway.length > 0) playersData.push(...passingPlayersAway);
          if (Array.isArray(rushingPlayersAway) && rushingPlayersAway.length > 0) playersData.push(...rushingPlayersAway);
          if (Array.isArray(receivingPlayersAway) && receivingPlayersAway.length > 0) playersData.push(...receivingPlayersAway);

          if (playersData.length === 0) {
            try {
              const directPlayerData = await teamsService.getGamePlayers(gameData.id, year);
              if (Array.isArray(directPlayerData) && directPlayerData.length > 0) {
                playersData = directPlayerData;
              }
            } catch (directErr) {
              console.warn('Error with direct getGamePlayers:', directErr);
            }
          }
        } catch (err) {
          console.error('Error in player stats fetching:', err);
          playersData = [];
        }

        // Fetch advanced metrics (if available)
        let advancedMetrics = null;
        try {
          advancedMetrics = await teamsService.getAdvancedBoxScore(gameData.id, year);
        } catch (err) {
          console.warn("Advanced metrics not available:", err);
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

        // Process player and team stats data
        const processedPlayerStats = processPlayerStats(playersData, homeTeam, awayTeam);
        const processedTeamStats = processTeamStats(homeTeamStats, awayTeamStats);

        setTeamStats(processedTeamStats);
        setDrives(drivesData || []);
        setPlayerStats(processedPlayerStats || { [homeTeam]: [], [awayTeam]: [] });
        setAdvancedData(advancedMetrics);

      } catch (err) {
        console.error("Error fetching game data:", err);
        setError("Failed to load game statistics");
      } finally {
        setIsLoading(false);
      }
    };

    // Helper functions to create and process stats (createEmptyTeamStats, processTeamStats, processPlayerStats, etc.)
    // … (unchanged code)

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

  // Destructure processed team stats for use in team comparison
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
                backgroundColor: drive.offense.toLowerCase().trim() === homeTeam.toLowerCase().trim()
                  ? `${homeTeamColor}10` 
                  : `${awayTeamColor}10`
              }}
            >
              <div style={styles.driveTeam}>
                <img 
                  src={drive.offense.toLowerCase().trim() === homeTeam.toLowerCase().trim() ? homeLogo : awayLogo} 
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
                    : (drive.driveResult === "TURNOVER" || drive.driveResult === "INT" || drive.driveResult === "FUMBLE" 
                      ? "#e74c3c" 
                      : "#777")
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
      {/* Importing the advanced metrics component */}
      <GameAdvancedMetrics
        homeTeamStats={teamStats.homeTeamStats}
        awayTeamStats={teamStats.awayTeamStats}
        homeTeam={homeTeam}
        awayTeam={awayTeam}
        homeLogo={homeLogo}
        awayLogo={awayLogo}
        homeTeamColor={homeTeamColor}
        awayTeamColor={awayTeamColor}
        advancedData={advancedData}
      />
      {renderDrives()}
      {renderKeyPlayers()}
    </div>
  );
};

export default GameStats;