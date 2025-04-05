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
        let advancedBoxScoreData;

        // Attempt to fetch advanced box score
        try {
          console.log(`Fetching advanced box score for game ${gameData.id}`);
          advancedBoxScoreData = await teamsService.getAdvancedBoxScore(gameData.id);
          
          // Log the structure of the advanced box score for debugging
          console.log('Advanced Box Score Data:', {
            playersUsageCount: advancedBoxScoreData?.players?.usage?.length || 0,
            playersPPACount: advancedBoxScoreData?.players?.ppa?.length || 0
          });
        } catch (primaryError) {
          console.error("Error fetching advanced box score:", primaryError);
          
          // Fallback to GraphQL service if available
          if (graphqlTeamsService && typeof graphqlTeamsService.getAdvancedBoxScore === "function") {
            console.log("Attempting to fetch from GraphQL service");
            advancedBoxScoreData = await graphqlTeamsService.getAdvancedBoxScore(gameData.id);
          } else {
            console.warn("No fallback available; setting empty data");
            advancedBoxScoreData = { players: { usage: [], ppa: [] } };
          }
        }

        // Process players from advanced stats
        const processedPlayers = processPlayerStats(advancedBoxScoreData);
        
        console.log(`Processed ${processedPlayers.length} players`);
        setPlayerStats(processedPlayers);

        // Calculate team stats
        const homeStats = processedPlayers.length > 0
          ? calculateTeamStats(processedPlayers, homeTeam, gameData, homeTeam)
          : calculateEmptyTeamStats();
          
        const awayStats = processedPlayers.length > 0
          ? calculateTeamStats(processedPlayers, awayTeam, gameData, homeTeam)
          : calculateEmptyTeamStats();

        // Fetch drive data
        let drivesData = [];
        try {
          drivesData = await teamsService.getGameDrives(gameData.id) || [];
        } catch (drivesError) {
          console.error("Error fetching drive data:", drivesError);
        }

        const processedDrives = processDriveData(drivesData, homeTeam, awayTeam);

        // Construct advanced data object
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
          rawAdvancedData: advancedBoxScoreData, // Include raw data for reference
        };

        setAdvancedData(advancedDataObj);
        setIsLoading(false);
      } catch (err) {
        console.error("Comprehensive error in fetchAdvancedStats:", err);
        setError(`Failed to load advanced statistics: ${err.message}`);
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
