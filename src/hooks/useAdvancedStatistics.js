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
    const fetchAdvancedStats = async () => {
      try {
        setIsLoading(true);

        if (!gameData || !gameData.id) {
          setError("Game data not available");
          setIsLoading(false);
          return;
        }

        let playersData, ppaData, drivesData;

        try {
          console.log("Fetching player data with teamsService for game", gameData.id);
          const isFSUHome = homeTeam === "Florida State";
          const isFSUAway = awayTeam === "Florida State";

          if (isFSUHome || isFSUAway) {
            console.log("FSU detected, setting team parameter to Florida State");
            playersData = await teamsService.getPlayerGameStats(
              null,   // No gameId when using team parameter
              2024,   // Default year
              1,      // Default week (assume week 1)
              "regular",
              "Florida State"
            );
          } else {
            playersData = await teamsService.getGamePlayers(gameData.id);
          }

          console.log("Fetching PPA data with teamsService");
          ppaData = (await teamsService.getGamePPA(gameData.id)) || [];
          console.log("Fetching drive data with teamsService");
          drivesData = (await teamsService.getGameDrives(gameData.id)) || [];
        } catch (serviceError) {
          console.error("teamsService error, trying graphqlTeamsService:", serviceError);
          if (typeof graphqlTeamsService?.getGamePlayers === "function") {
            console.log("Fetching player data from graphqlTeamsService");
            playersData = await graphqlTeamsService.getGamePlayers(gameData.id);
          } else {
            console.log("Fallback: using mock player data");
            playersData = [{
              id: gameData.id,
              teams: [
                {
                  team: homeTeam,
                  conference: "ACC",
                  homeAway: "home",
                  points: gameData.homePoints || 0,
                  categories: []
                },
                {
                  team: awayTeam,
                  conference: "ACC",
                  homeAway: "away",
                  points: gameData.awayPoints || 0,
                  categories: []
                }
              ]
            }];
          }

          if (typeof graphqlTeamsService?.getGamePPA === "function") {
            console.log("Fetching PPA data from graphqlTeamsService");
            ppaData = await graphqlTeamsService.getGamePPA(gameData.id);
          } else {
            console.log("No PPA source available; using empty array");
            ppaData = [];
          }

          if (typeof graphqlTeamsService?.getGameDrives === "function") {
            console.log("Fetching drive data from graphqlTeamsService");
            drivesData = await graphqlTeamsService.getGameDrives(gameData.id);
          } else {
            console.log("No drive data source available; using empty array");
            drivesData = [];
          }
        }

        console.log("Player data:", playersData);
        console.log("PPA data:", ppaData);
        console.log("Drive data:", drivesData);

        // Process player statistics
        const processedPlayers = processPlayerStats(playersData, ppaData);
        setPlayerStats(processedPlayers);

        // Calculate team-level statistics (if gameData is available)
        const homeStats = calculateTeamStats(processedPlayers, homeTeam, gameData, homeTeam);
        const awayStats = calculateTeamStats(processedPlayers, awayTeam, gameData, homeTeam);

        // Process drive data
        const processedDrives = processDriveData(drivesData, homeTeam, awayTeam);

        // Create advancedData object
        const advancedDataObj = {
          homeTeamStats: homeStats,
          awayTeamStats: awayStats,
          players: processedPlayers,
          drives: processedDrives,
          keyPlayers: {
            [homeTeam]: getKeyPlayers(processedPlayers, homeTeam),
            [awayTeam]: getKeyPlayers(processedPlayers, awayTeam)
          }
        };

        setAdvancedData(advancedDataObj);
        setIsLoading(false);
      } catch (err) {
        console.error("Error fetching advanced stats:", err);
        setError("Failed to load advanced statistics. " + err.message);
        setIsLoading(false);
        // Fallback to prevent further errors
        setPlayerStats([]);
        setAdvancedData(null);
      }
    };

    if (gameData) {
      fetchAdvancedStats();
    }
  }, [gameData, homeTeam, awayTeam]);

  return { advancedData, playerStats, isLoading, error };
};

export default useAdvancedStatistics;