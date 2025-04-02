import { useState, useEffect } from "react";
import teamsService from "../services/teamsService";
import graphqlTeamsService from "../services/graphqlTeamsService";
import {
  processTeamStatsFromAPI,
  processPlayerStats,
  calculateTeamStats,
  processDriveData,
  extractStatsFromDrives,
  getKeyPlayers,
  calculateEmptyTeamStats,
} from "../utils/statsCalculators";

const useAdvancedStatistics = ({ gameData, homeTeam, awayTeam }) => {
  const [advancedData, setAdvancedData] = useState(null);
  const [playerStats, setPlayerStats] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!gameData || !gameData.id) {
      setError("Game data not available");
      setIsLoading(false);
      return;
    }

    const fetchAdvancedStats = async () => {
      try {
        setIsLoading(true);
        let playersData = [], ppaData = [], drivesData = [], teamStatsData = [];

        // Try to fetch data using teamsService first.
        try {
          console.log("Fetching team stats using teamsService for game", gameData.id);
          teamStatsData = await teamsService.getTeamGameStats(gameData.id);
          console.log("Raw team stats data received:", teamStatsData);

          // If teamStatsData is empty or not in the expected format, try with a year parameter
          if (!teamStatsData || teamStatsData.length === 0) {
            console.log("No team stats found with just gameId, trying with year parameter...");
            // Get the year from gameData if available
            const year = gameData.season || gameData.year || 2024;
            teamStatsData = await teamsService.getTeamGameStats(gameData.id, null, year);
            console.log("Team stats with year parameter:", teamStatsData);
          }
          
          console.log("Fetching player data using teamsService for game", gameData.id);
          playersData = await teamsService.getGamePlayers(gameData.id);

          console.log("Fetching PPA data using teamsService for game", gameData.id);
          ppaData = (await teamsService.getGamePPA(gameData.id)) || [];

          console.log("Fetching drive data using teamsService for game", gameData.id);
          drivesData = (await teamsService.getGameDrives(gameData.id)) || [];
        } catch (primaryError) {
          console.error("teamsService error:", primaryError);
          // Fallback: use graphqlTeamsService if available.
          if (graphqlTeamsService && typeof graphqlTeamsService.getGamePlayers === "function") {
            console.log("Fetching player data using graphqlTeamsService for game", gameData.id);
            playersData = await graphqlTeamsService.getGamePlayers(gameData.id);
            ppaData = (await graphqlTeamsService.getGamePPA(gameData.id)) || [];
            drivesData = (await graphqlTeamsService.getGameDrives(gameData.id)) || [];
          } else {
            console.warn("No fallback available; setting empty data for game", gameData.id);
            playersData = [];
            ppaData = [];
            drivesData = [];
          }
        }

        console.log("Team stats data fetched:", teamStatsData);
        console.log("Player data fetched:", playersData);
        console.log("PPA data fetched:", ppaData);
        console.log("Drive data fetched:", drivesData);

        console.log("Starting to process player and team stats...");
        // Process player-level stats and calculate grades.
        // Ensure we have valid playersData before processing
        const processedPlayers = Array.isArray(playersData) && playersData.length > 0 
          ? processPlayerStats(playersData, ppaData)
          : [];
        
        console.log(`Processed ${processedPlayers.length} players`);
        setPlayerStats(processedPlayers);

        // Use team stats from API when available, otherwise calculate from player stats
        let homeStats, awayStats;
        
        if (teamStatsData && teamStatsData.length > 0) {
          console.log(`Looking for teams in data: home='${homeTeam}', away='${awayTeam}'`);
          
          // First, try exact match on team names
          let homeTeamData = teamStatsData.find(t => t.team === homeTeam);
          let awayTeamData = teamStatsData.find(t => t.team === awayTeam);
          
          // If not found, try case-insensitive match
          if (!homeTeamData) {
            console.log(`Home team '${homeTeam}' not found with exact match, trying case insensitive...`);
            homeTeamData = teamStatsData.find(t => t.team && t.team.toLowerCase() === homeTeam.toLowerCase());
          }
          
          if (!awayTeamData) {
            console.log(`Away team '${awayTeam}' not found with exact match, trying case insensitive...`);
            awayTeamData = teamStatsData.find(t => t.team && t.team.toLowerCase() === awayTeam.toLowerCase());
          }
          
          // If still not found, try partial match (for cases like "Florida State" vs "Florida St")
          if (!homeTeamData) {
            console.log(`Home team '${homeTeam}' not found with case insensitive match, trying partial...`);
            homeTeamData = teamStatsData.find(t => {
              if (!t.team) return false;
              // Check if either name contains the other
              return t.team.includes(homeTeam) || homeTeam.includes(t.team);
            });
          }
          
          if (!awayTeamData) {
            console.log(`Away team '${awayTeam}' not found with case insensitive match, trying partial...`);
            awayTeamData = teamStatsData.find(t => {
              if (!t.team) return false;
              // Check if either name contains the other
              return t.team.includes(awayTeam) || awayTeam.includes(t.team);
            });
          }
          
          // As a last resort, just take the first two entries if there are exactly two teams
          if ((!homeTeamData || !awayTeamData) && teamStatsData.length === 2) {
            console.log("Using position-based team data as fallback");
            homeTeamData = teamStatsData[0];
            awayTeamData = teamStatsData[1];
          }
          
          // Log what we found
          console.log("Home team data found:", homeTeamData);
          console.log("Away team data found:", awayTeamData);
          
          // Process drive data to extract more stats
          const processedDrives = processDriveData(drivesData, homeTeam, awayTeam);

          // Use the direct stats from API when available
          homeStats = homeTeamData ? processTeamStatsFromAPI(homeTeamData) : calculateEmptyTeamStats();
          awayStats = awayTeamData ? processTeamStatsFromAPI(awayTeamData) : calculateEmptyTeamStats();
          
          // Enhance stats with drive data if needed
          if (processedDrives && processedDrives.length > 0) {
            // Extract additional stats from drives if primary values are missing
            const homeStatsFromDrives = extractStatsFromDrives(processedDrives, homeTeam);
            const awayStatsFromDrives = extractStatsFromDrives(processedDrives, awayTeam);
            
            // Merge in any missing stats from drives
            if (homeStatsFromDrives) {
              console.log("Stats from drives for", homeTeam, homeStatsFromDrives);
              if (homeStats.firstDowns === 0 && homeStatsFromDrives.firstDowns > 0) 
                homeStats.firstDowns = homeStatsFromDrives.firstDowns;
                
              if (homeStats.thirdDowns.attempts === 0 && homeStatsFromDrives.thirdDowns.attempts > 0)
                homeStats.thirdDowns = homeStatsFromDrives.thirdDowns;
                
              if (homeStats.redZone.attempts === 0 && homeStatsFromDrives.redZone.attempts > 0)
                homeStats.redZone = homeStatsFromDrives.redZone;
                
              if (homeStats.turnovers === 0 && homeStatsFromDrives.turnovers > 0)
                homeStats.turnovers = homeStatsFromDrives.turnovers;
                
              if (homeStats.timeOfPossession === 30 && homeStatsFromDrives.timeOfPossession > 0)
                homeStats.timeOfPossession = homeStatsFromDrives.timeOfPossession;
                
              if (homeStats.explosivePlays === 0 && homeStatsFromDrives.explosivePlays > 0)
                homeStats.explosivePlays = homeStatsFromDrives.explosivePlays;
            }
            
            if (awayStatsFromDrives) {
              console.log("Stats from drives for", awayTeam, awayStatsFromDrives);
              if (awayStats.firstDowns === 0 && awayStatsFromDrives.firstDowns > 0) 
                awayStats.firstDowns = awayStatsFromDrives.firstDowns;
                
              if (awayStats.thirdDowns.attempts === 0 && awayStatsFromDrives.thirdDowns.attempts > 0)
                awayStats.thirdDowns = awayStatsFromDrives.thirdDowns;
                
              if (awayStats.redZone.attempts === 0 && awayStatsFromDrives.redZone.attempts > 0)
                awayStats.redZone = awayStatsFromDrives.redZone;
                
              if (awayStats.turnovers === 0 && awayStatsFromDrives.turnovers > 0)
                awayStats.turnovers = awayStatsFromDrives.turnovers;
                
              if (awayStats.timeOfPossession === 30 && awayStatsFromDrives.timeOfPossession > 0)
                awayStats.timeOfPossession = awayStatsFromDrives.timeOfPossession;
                
              if (awayStats.explosivePlays === 0 && awayStatsFromDrives.explosivePlays > 0)
                awayStats.explosivePlays = awayStatsFromDrives.explosivePlays;
            }
          }
        } else {
          // Fallback to calculating from player stats
          homeStats = processedPlayers.length > 0
            ? calculateTeamStats(processedPlayers, homeTeam, gameData, homeTeam)
            : calculateEmptyTeamStats();
            
          awayStats = processedPlayers.length > 0
            ? calculateTeamStats(processedPlayers, awayTeam, gameData, homeTeam)
            : calculateEmptyTeamStats();
        }
          
        console.log("Home team stats processed:", homeStats);
        console.log("Away team stats processed:", awayStats);

        // Process drive data.
        const processedDrives = processDriveData(drivesData, homeTeam, awayTeam);

        // Build the final advancedData object.
        const advancedDataObj = {
          gameInfo: gameData, // Include raw game data for additional context
          homeTeamStats: homeStats,
          awayTeamStats: awayStats,
          players: processedPlayers,
          drives: processedDrives,
          keyPlayers: {
            [homeTeam]: getKeyPlayers(processedPlayers, homeTeam),
            [awayTeam]: getKeyPlayers(processedPlayers, awayTeam),
          },
        };

        setAdvancedData(advancedDataObj);
        setIsLoading(false);
      } catch (err) {
        console.error("Error fetching advanced stats:", err);
        setError("Failed to load advanced statistics. " + err.message);
        setIsLoading(false);
        setPlayerStats([]);
        setAdvancedData(null);
      }
    };

    fetchAdvancedStats();
  }, [gameData, homeTeam, awayTeam]);

  return { advancedData, playerStats, isLoading, error };
};

export default useAdvancedStatistics;