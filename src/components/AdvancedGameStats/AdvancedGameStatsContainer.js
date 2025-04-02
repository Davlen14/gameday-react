import React, { useState, useEffect } from "react";
import teamsService from "../../services/teamsService";
import graphqlTeamsService from "../../services/graphqlTeamsService";

// Import tab components
import OverviewTab from "./tabs/OverviewTab";
import PlayerGradesTab from "./tabs/PlayerGradesTab";
import EfficiencyMetricsTab from "./tabs/EfficiencyMetricsTab";
import DriveAnalysisTab from "./tabs/DriveAnalysisTab";

// Import utility functions
import {
  processPlayerStats,
  calculateTeamStats,
  processDriveData,
  getKeyPlayers,
  calculateEmptyTeamStats
} from "../../utils/statsProcessingUtils";

import "../../styles/AdvancedStatistics.css";

const AdvancedGameStatsContainer = ({ 
  gameData, 
  homeTeam, 
  awayTeam, 
  homeTeamColor, 
  awayTeamColor, 
  homeLogo, 
  awayLogo 
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [playerPositionFilter, setPlayerPositionFilter] = useState('all');
  const [advancedData, setAdvancedData] = useState(null);
  const [playerStats, setPlayerStats] = useState([]);
  const [teamStats, setTeamStats] = useState({});
  const [driveData, setDriveData] = useState([]);
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
          
          // Check if Florida State is playing
          const isFSUHome = homeTeam === "Florida State";
          const isFSUAway = awayTeam === "Florida State";
          
          if (isFSUHome || isFSUAway) {
            console.log("FSU detected, setting team parameter to Florida State");
            playersData = await teamsService.getPlayerGameStats(
              null, 
              gameData.year || 2024, 
              gameData.week || 1, 
              "regular", 
              "Florida State"
            );
          } else {
            playersData = await teamsService.getGamePlayers(gameData.id);
          }
          
          // Fetch additional game data
          ppaData = await teamsService.getGamePPA(gameData.id) || [];
          drivesData = await teamsService.getGameDrives(gameData.id) || [];
          
        } catch (serviceError) {
          console.error("Error with teamsService, trying fallback:", serviceError);
          
          // Fallback to graphql service or mock data
          playersData = typeof graphqlTeamsService?.getGamePlayers === 'function'
            ? await graphqlTeamsService.getGamePlayers(gameData.id)
            : [{
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
          
          // Fetch fallback PPA and drive data
          ppaData = typeof graphqlTeamsService?.getGamePPA === 'function'
            ? await graphqlTeamsService.getGamePPA(gameData.id)
            : [];
          
          drivesData = typeof graphqlTeamsService?.getGameDrives === 'function'
            ? await graphqlTeamsService.getGameDrives(gameData.id)
            : [];
        }
        
        console.log("Fetched data:", { playersData, ppaData, drivesData });
        
        // Process fetched data
        const processedPlayers = processPlayerStats(playersData, ppaData);
        setPlayerStats(processedPlayers);
        
        const homeStats = calculateTeamStats(processedPlayers, homeTeam, gameData);
        const awayStats = calculateTeamStats(processedPlayers, awayTeam, gameData);
        setTeamStats({
          [homeTeam]: homeStats,
          [awayTeam]: awayStats
        });
        
        const processedDrives = processDriveData(drivesData, homeTeam, awayTeam);
        setDriveData(processedDrives);
        
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
        console.error("Unexpected error:", err);
        setError("An unexpected error occurred: " + err.message);
        setIsLoading(false);
        
        // Fallback error handling
        setPlayerStats([]);
        setTeamStats({
          [homeTeam]: calculateEmptyTeamStats(),
          [awayTeam]: calculateEmptyTeamStats()
        });
        setDriveData([]);
        setAdvancedData(null);
      }
    };
    
    if (gameData) {
      fetchAdvancedStats();
    }
  }, [gameData, homeTeam, awayTeam]);
  
  // Tabs rendering
  const renderTabs = () => (
    <div className="advanced-stats-tabs">
      <button 
        className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
        onClick={() => setActiveTab('overview')}
      >
        Overview
      </button>
      <button 
        className={`tab-button ${activeTab === 'playerGrades' ? 'active' : ''}`}
        onClick={() => setActiveTab('playerGrades')}
      >
        Player Grades
      </button>
      <button 
        className={`tab-button ${activeTab === 'efficiency' ? 'active' : ''}`}
        onClick={() => setActiveTab('efficiency')}
      >
        Efficiency Metrics
      </button>
      <button 
        className={`tab-button ${activeTab === 'drives' ? 'active' : ''}`}
        onClick={() => setActiveTab('drives')}
      >
        Drive Analysis
      </button>
    </div>
  );
  
  // Loading state
  if (isLoading) {
    return (
      <div className="advanced-stats-loading">
        <div className="loading-spinner"></div>
        <p>Loading advanced statistics and player grades...</p>
      </div>
    );
  }
  
  // Error state
  if (error) {
    return (
      <div className="advanced-stats-error">
        <div className="error-icon">⚠️</div>
        <h3>Error Loading Advanced Statistics</h3>
        <p>{error}</p>
      </div>
    );
  }
  
  // Empty state
  if (!advancedData) {
    return (
      <div className="advanced-stats-empty">
        <p>No advanced statistics available for this game.</p>
      </div>
    );
  }
  
  return (
    <div className="advanced-statistics-container">
      {renderTabs()}
      
      <div className="advanced-stats-content">
        {activeTab === 'overview' && (
          <OverviewTab 
            advancedData={advancedData}
            homeTeam={homeTeam}
            awayTeam={awayTeam}
            homeTeamColor={homeTeamColor}
            awayTeamColor={awayTeamColor}
            homeLogo={homeLogo}
            awayLogo={awayLogo}
          />
        )}
        {activeTab === 'playerGrades' && (
          <PlayerGradesTab 
            playerStats={playerStats}
            homeTeam={homeTeam}
            awayTeam={awayTeam}
            homeLogo={homeLogo}
            awayLogo={awayLogo}
            onPositionFilterChange={setPlayerPositionFilter}
            positionFilter={playerPositionFilter}
          />
        )}
        {activeTab === 'efficiency' && (
          <EfficiencyMetricsTab 
            advancedData={advancedData}
            homeTeam={homeTeam}
            awayTeam={awayTeam}
            homeTeamColor={homeTeamColor}
            awayTeamColor={awayTeamColor}
            homeLogo={homeLogo}
            awayLogo={awayLogo}
          />
        )}
        {activeTab === 'drives' && (
          <DriveAnalysisTab 
            advancedData={advancedData}
            homeTeam={homeTeam}
            awayTeam={awayTeam}
            homeTeamColor={homeTeamColor}
            awayTeamColor={awayTeamColor}
            homeLogo={homeLogo}
            awayLogo={awayLogo}
          />
        )}
      </div>
    </div>
  );
};

export default AdvancedGameStatsContainer;