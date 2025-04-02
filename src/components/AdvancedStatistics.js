import React, { useState } from "react";
import "../styles/AdvancedStatistics.css";

// Import the custom hook and view components
import useAdvancedStatistics from "../hooks/useAdvancedStatistics";
import OverviewView from "./OverviewView";
import PlayerGradesView from "./PlayerGradesView";
import EfficiencyMetricsView from "./EfficiencyMetricsView";
import DriveAnalysisView from "./DriveAnalysisView";

const AdvancedStatistics = ({
  gameData,
  homeTeam,
  awayTeam,
  homeTeamColor,
  awayTeamColor,
  homeLogo,
  awayLogo
}) => {
  // Manage the active tab locally
  const [activeTab, setActiveTab] = useState("overview");

  // Use our custom hook to fetch and process the advanced stats
  const { advancedData, playerStats, isLoading, error } = useAdvancedStatistics({
    gameData,
    homeTeam,
    awayTeam
  });

  // Render loading, error, or empty states as needed
  if (isLoading) {
    return (
      <div className="advanced-stats-loading">
        <div className="loading-spinner"></div>
        <p>Loading advanced statistics and player grades...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="advanced-stats-error">
        <div className="error-icon">⚠️</div>
        <h3>Error Loading Advanced Statistics</h3>
        <p>{error}</p>
        <p>Please ensure that all required data is available through the teamsService.</p>
      </div>
    );
  }

  if (!advancedData) {
    return (
      <div className="advanced-stats-empty">
        <p>No advanced statistics available for this game.</p>
      </div>
    );
  }

  // Render tab buttons
  const renderTabs = () => (
    <div className="advanced-stats-tabs">
      <button
        className={`tab-button ${activeTab === "overview" ? "active" : ""}`}
        onClick={() => setActiveTab("overview")}
      >
        Overview
      </button>
      <button
        className={`tab-button ${activeTab === "playerGrades" ? "active" : ""}`}
        onClick={() => setActiveTab("playerGrades")}
      >
        Player Grades
      </button>
      <button
        className={`tab-button ${activeTab === "efficiency" ? "active" : ""}`}
        onClick={() => setActiveTab("efficiency")}
      >
        Efficiency Metrics
      </button>
      <button
        className={`tab-button ${activeTab === "drives" ? "active" : ""}`}
        onClick={() => setActiveTab("drives")}
      >
        Drive Analysis
      </button>
    </div>
  );

  // Render content based on the active tab
  return (
    <div className="advanced-statistics-container">
      {renderTabs()}
      <div className="advanced-stats-content">
        {activeTab === "overview" && (
          <OverviewView
            advancedData={advancedData}
            homeTeam={homeTeam}
            awayTeam={awayTeam}
            homeTeamColor={homeTeamColor}
            awayTeamColor={awayTeamColor}
            homeLogo={homeLogo}
            awayLogo={awayLogo}
          />
        )}
        {activeTab === "playerGrades" && (
          <PlayerGradesView
            playerStats={playerStats}
            homeTeam={homeTeam}
            awayTeam={awayTeam}
            homeLogo={homeLogo}
            awayLogo={awayLogo}
          />
        )}
        {activeTab === "efficiency" && (
          <EfficiencyMetricsView
            advancedData={advancedData}
            homeTeam={homeTeam}
            awayTeam={awayTeam}
            homeTeamColor={homeTeamColor}
            awayTeamColor={awayTeamColor}
            homeLogo={homeLogo}
            awayLogo={awayLogo}
          />
        )}
        {activeTab === "drives" && (
          <DriveAnalysisView
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

export default AdvancedStatistics;