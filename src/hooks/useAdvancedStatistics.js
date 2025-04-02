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
          console.log("Fetching player data using teamsService for game", gameData.id);

          // Uncomment the next lines if you need special handling for Florida State.
          // const isFSUHome = homeTeam === "Florida State";
          // const isFSUAway = awayTeam === "Florida State";
          // if (isFSUHome || isFSUAway) {
          //   console.log("FSU detected, using FSU-specific API call");
          //   playersData = await teamsService.getPlayerGameStats(
          //     null, 2024, 1, "regular", "Florida State"
          //   );
          // } else {
            playersData = await teamsService.getGamePlayers(gameData.id);
          // }

          console.log("Fetching PPA data using teamsService for game", gameData.id);
          ppaData = (await teamsService.getGamePPA(gameData.id)) || [];

          console.log("Fetching drive data using teamsService for game", gameData.id);
          drivesData = (await teamsService.getGameDrives(gameData.id)) || [];
        } catch (serviceError) {
          console.error("teamsService error, trying graphqlTeamsService:", serviceError);

          if (typeof graphqlTeamsService?.getGamePlayers === "function") {
            console.log("Fetching player data using graphqlTeamsService for game", gameData.id);
            playersData = await graphqlTeamsService.getGamePlayers(gameData.id);
          } else {
            console.log("Fallback: using empty mock player data");
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
            console.log("Fetching PPA data using graphqlTeamsService for game", gameData.id);
            ppaData = await graphqlTeamsService.getGamePPA(gameData.id);
          } else {
            console.log("No PPA data source available; using empty array");
            ppaData = [];
          }

          if (typeof graphqlTeamsService?.getGameDrives === "function") {
            console.log("Fetching drive data using graphqlTeamsService for game", gameData.id);
            drivesData = await graphqlTeamsService.getGameDrives(gameData.id);
          } else {
            console.log("No drive data source available; using empty array");
            drivesData = [];
          }
        }

        console.log("Player data fetched:", playersData);
        console.log("PPA data fetched:", ppaData);
        console.log("Drive data fetched:", drivesData);

        // Process the player statistics with PPA data.
        const processedPlayers = processPlayerStats(playersData, ppaData);
        setPlayerStats(processedPlayers);

        // Calculate team-level statistics.
        const homeStats = calculateTeamStats(processedPlayers, homeTeam, gameData, homeTeam);
        const awayStats = calculateTeamStats(processedPlayers, awayTeam, gameData, homeTeam);

        // Process drive data.
        const processedDrives = processDriveData(drivesData, homeTeam, awayTeam);

        // Create the final advancedData object.
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
        // Fallback: set empty data to prevent downstream errors.
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