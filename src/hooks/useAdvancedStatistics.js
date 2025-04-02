import { useState, useEffect } from "react";
import teamsService from "../services/teamsService";
import graphqlTeamsService from "../services/graphqlTeamsService";
import {
  processPlayerStats,
  calculateTeamStats,
  processDriveData,
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
        let playersData, ppaData, drivesData;

        // Try to fetch data using teamsService first.
        try {
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

        // Calculate team-level statistics using processed player stats.
        // If processed players data is empty, use calculateEmptyTeamStats as fallback
        const homeStats = processedPlayers.length > 0
          ? calculateTeamStats(processedPlayers, homeTeam, gameData, homeTeam)
          : calculateEmptyTeamStats();
          
        const awayStats = processedPlayers.length > 0
          ? calculateTeamStats(processedPlayers, awayTeam, gameData, homeTeam)
          : calculateEmptyTeamStats();
          
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