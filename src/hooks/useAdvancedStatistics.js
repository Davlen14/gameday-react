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

    // Helper: Transform the stats array into an object with key/value pairs.
    const transformOfficialStats = (teamData) => {
      if (!teamData) return {};
      const transformed = { ...teamData };
      if (teamData.stats && Array.isArray(teamData.stats)) {
        teamData.stats.forEach(item => {
          transformed[item.category] = item.stat;
        });
      }
      return transformed;
    };

    const fetchAdvancedStats = async () => {
      try {
        setIsLoading(true);
        let playersData, ppaData, drivesData;

        // Fetch player, PPA, and drive data
        try {
          console.log("Fetching player data using teamsService for game", gameData.id);
          playersData = await teamsService.getGamePlayers(gameData.id);

          console.log("Fetching PPA data using teamsService for game", gameData.id);
          ppaData = (await teamsService.getGamePPA(gameData.id)) || [];

          console.log("Fetching drive data using teamsService for game", gameData.id);
          drivesData = (await teamsService.getGameDrives(gameData.id)) || [];
        } catch (primaryError) {
          console.error("teamsService error:", primaryError);
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

        const processedPlayers = Array.isArray(playersData) && playersData.length > 0 
          ? processPlayerStats(playersData, ppaData)
          : [];
        
        console.log(`Processed ${processedPlayers.length} players`);
        setPlayerStats(processedPlayers);

        const homeStats = processedPlayers.length > 0
          ? calculateTeamStats(processedPlayers, homeTeam, gameData, homeTeam)
          : calculateEmptyTeamStats();
          
        const awayStats = processedPlayers.length > 0
          ? calculateTeamStats(processedPlayers, awayTeam, gameData, homeTeam)
          : calculateEmptyTeamStats();
          
        console.log("Home team stats processed:", homeStats);
        console.log("Away team stats processed:", awayStats);

        const processedDrives = processDriveData(drivesData, homeTeam, awayTeam);

        // Fetch the official team stats from the API
        const officialStatsData = await teamsService.getTeamGameStats(gameData.id, null, 2024);
        let officialHomeStats = {};
        let officialAwayStats = {};
        if (officialStatsData && officialStatsData.length > 0) {
          const teamsData = officialStatsData[0].teams;
          officialHomeStats = teamsData.find(team => team.team === homeTeam);
          officialAwayStats = teamsData.find(team => team.team === awayTeam);
        }
        const transformedHomeStats = transformOfficialStats(officialHomeStats);
        const transformedAwayStats = transformOfficialStats(officialAwayStats);

        const advancedDataObj = {
          gameInfo: gameData,
          homeTeamStats: homeStats,
          awayTeamStats: awayStats,
          players: processedPlayers,
          drives: processedDrives,
          keyPlayers: {
            [homeTeam]: getKeyPlayers(processedPlayers, homeTeam),
            [awayTeam]: getKeyPlayers(processedPlayers, awayTeam),
          },
          // Include the official team stats (transformed)
          officialHomeStats: transformedHomeStats,
          officialAwayStats: transformedAwayStats,
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