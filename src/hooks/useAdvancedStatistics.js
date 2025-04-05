import { useState, useEffect } from "react";
import teamsService from "../services/teamsService";
import graphqlTeamsService from "../services/graphqlTeamsService";
import {
  processPlayerStats,
  calculateTeamStats,
  processDriveData,
  getKeyPlayers,
  calculateEmptyTeamStats,
  enhancePlayerStats
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

        // Fetch traditional player stats
        let traditionalPlayerStats = [];
        try {
          console.log(`Fetching traditional player stats for game ${gameData.id}`);
          
          // Get game player data for both teams
          const homePlayerStats = await teamsService.getGamePlayers(gameData.id, gameData.season || 2024, homeTeam);
          const awayPlayerStats = await teamsService.getGamePlayers(gameData.id, gameData.season || 2024, awayTeam);
          
          // Combine all player stats
          traditionalPlayerStats = [...homePlayerStats, ...awayPlayerStats];
          
          console.log(`Fetched ${traditionalPlayerStats.length} traditional player stats`);
          
          // If we don't have enough data, try fetching by category
          if (traditionalPlayerStats.length < 10) {
            console.log("Not enough player data, fetching by category...");
            
            // Fetch player stats by category
            const passingStats = await teamsService.getPlayerGameStats(
              gameData.id, gameData.season || 2024, null, "regular", null, "passing"
            );
            
            const rushingStats = await teamsService.getPlayerGameStats(
              gameData.id, gameData.season || 2024, null, "regular", null, "rushing"
            );
            
            const receivingStats = await teamsService.getPlayerGameStats(
              gameData.id, gameData.season || 2024, null, "regular", null, "receiving"
            );
            
            const defensiveStats = await teamsService.getPlayerGameStats(
              gameData.id, gameData.season || 2024, null, "regular", null, "defensive"
            );
            
            // Merge all categories
            traditionalPlayerStats = [
              ...traditionalPlayerStats,
              ...passingStats, 
              ...rushingStats, 
              ...receivingStats,
              ...defensiveStats
            ];
            
            // Remove duplicates based on player name
            const uniquePlayers = {};
            traditionalPlayerStats.forEach(player => {
              if (player.name) {
                if (!uniquePlayers[player.name]) {
                  uniquePlayers[player.name] = player;
                } else {
                  // Merge stats from multiple entries for the same player
                  if (player.passing) uniquePlayers[player.name].passing = player.passing;
                  if (player.rushing) uniquePlayers[player.name].rushing = player.rushing;
                  if (player.receiving) uniquePlayers[player.name].receiving = player.receiving;
                  if (player.defensive) uniquePlayers[player.name].defensive = player.defensive;
                }
              }
            });
            
            traditionalPlayerStats = Object.values(uniquePlayers);
            console.log(`Fetched ${traditionalPlayerStats.length} unique players through category queries`);
          }
          
        } catch (statsError) {
          console.error("Error fetching traditional player stats:", statsError);
          // Continue with just the advanced stats
          traditionalPlayerStats = [];
        }

        // Process players by combining advanced and traditional stats
        const enhancedPlayers = enhancePlayerStats(advancedBoxScoreData, traditionalPlayerStats);
        
        console.log(`Processed ${enhancedPlayers.length} enhanced players`);
        setPlayerStats(enhancedPlayers);

        // Calculate team stats
        const homeStats = enhancedPlayers.length > 0
          ? calculateTeamStats(enhancedPlayers, homeTeam, gameData, homeTeam)
          : calculateEmptyTeamStats();
          
        const awayStats = enhancedPlayers.length > 0
          ? calculateTeamStats(enhancedPlayers, awayTeam, gameData, homeTeam)
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
          players: enhancedPlayers,
          drives: processedDrives,
          keyPlayers: {
            [homeTeam]: getKeyPlayers(enhancedPlayers, homeTeam),
            [awayTeam]: getKeyPlayers(enhancedPlayers, awayTeam),
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
