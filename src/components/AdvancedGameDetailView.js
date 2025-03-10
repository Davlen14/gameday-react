import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import teamsService from "../services/teamsService";
import graphqlTeamsService from "../services/graphqlTeamsService";

const AdvancedGameDetailView = () => {
  const { id } = useParams(); // game ID from URL
  const [gameData, setGameData] = useState(null);
  const [teams, setTeams] = useState([]);
  const [activeTab, setActiveTab] = useState("overview");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch team logos and both game data sources then merge them.
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);

        // Fetch teams for logos and additional info from REST
        const teamsData = await teamsService.getTeams();
        setTeams(teamsData);

        // Fetch REST game data (this method should exist in your REST service)
        const restGameData = await teamsService.getGameById(id);
        // Fetch detailed game data (scoreboard) from GraphQL
        const scoreboardData = await graphqlTeamsService.getGameScoreboard(id);

        // Merge the two objects.
        // Fields from restGameData override those in scoreboardData if present.
        const mergedData = { ...scoreboardData, ...restGameData };

        if (mergedData) {
          setGameData(mergedData);
        } else {
          setError("Game not found");
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id]);

  // Helper to get team logo from teams REST data
  const getTeamLogo = (teamName) => {
    const team = teams.find(
      (t) => t.school.toLowerCase() === teamName.toLowerCase()
    );
    return team && team.logos && team.logos.length > 0
      ? team.logos[0]
      : "/photos/default_team.png";
  };

  // Helper to get team details for display (record, ranking, etc.)
  const getTeamDetails = (teamName) => {
    const team = teams.find(
      (t) => t.school.toLowerCase() === teamName.toLowerCase()
    );
    return team || {};
  };

  if (isLoading) return <div>Loading game details...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!gameData) return <div>Game not found</div>;

  // Destructure common fields from the merged data
  const {
    id: gameId,
    homeTeam,
    awayTeam,
    homePoints,
    awayPoints,
    homeLineScores,
    awayLineScores,
    homeConference,
    awayConference,
    venue,
    city,
    state,
    startDate,
    startTimeTbd,
    status,
    currentClock,
    currentPeriod,
    lastPlay,
    moneylineAway,
    moneylineHome,
    overUnder,
    spread,
    temperature,
    weatherDescription,
    windDirection,
    windSpeed,
    tv,
    // Additional REST fields (if any) like notes, attendance, etc. can also be destructured here.
  } = gameData;

  const homeTeamDetails = getTeamDetails(homeTeam);
  const awayTeamDetails = getTeamDetails(awayTeam);

  // Interactive tab content renderers:
  const renderOverview = () => (
    <div className="tab-content">
      <div className="teams-comparison">
        <div className="team-column">
          <img src={getTeamLogo(homeTeam)} alt={homeTeam} className="team-logo" />
          <div className="team-name">{homeTeam}</div>
          <div className="team-record">
            {homeTeamDetails.record ? `Record: ${homeTeamDetails.record}` : ""}{" "}
            {homeTeamDetails.rank ? ` • Rank: #${homeTeamDetails.rank}` : ""}
          </div>
          <div className="score">{homePoints || "0"}</div>
        </div>

        <div className="vs-column">VS</div>

        <div className="team-column">
          <img src={getTeamLogo(awayTeam)} alt={awayTeam} className="team-logo" />
          <div className="team-name">{awayTeam}</div>
          <div className="team-record">
            {awayTeamDetails.record ? `Record: ${awayTeamDetails.record}` : ""}{" "}
            {awayTeamDetails.rank ? ` • Rank: #${awayTeamDetails.rank}` : ""}
          </div>
          <div className="score">{awayPoints || "0"}</div>
        </div>
      </div>
      <div className="basic-info">
        <p>
          <strong>Status:</strong>{" "}
          {status === "final"
            ? "Final Score"
            : startDate
            ? new Date(startDate).toLocaleString()
            : "Upcoming Game"}
        </p>
        {tv && <p><strong>Broadcast:</strong> {tv}</p>}
        {lastPlay && <p><strong>Last Play:</strong> {lastPlay}</p>}
      </div>
    </div>
  );

  const renderStatistics = () => (
    <div className="tab-content">
      <h2>Scoring by Period</h2>
      <div className="stat-grid">
        <div>
          <h3>{homeTeam}</h3>
          <p>{homeLineScores ? homeLineScores.join(" | ") : "N/A"}</p>
        </div>
        <div>
          <h3>{awayTeam}</h3>
          <p>{awayLineScores ? awayLineScores.join(" | ") : "N/A"}</p>
        </div>
      </div>
      {currentClock && (
        <p>
          <strong>Current Clock:</strong> {currentClock} (Period:{" "}
          {currentPeriod || "N/A"})
        </p>
      )}
      {lastPlay && <p><strong>Last Play:</strong> {lastPlay}</p>}
    </div>
  );

  const renderBetting = () => (
    <div className="tab-content">
      <h2>Betting Information</h2>
      <div className="betting-grid">
        <p>
          <strong>Moneyline (Home):</strong> {moneylineHome || "N/A"}
        </p>
        <p>
          <strong>Moneyline (Away):</strong> {moneylineAway || "N/A"}
        </p>
        <p>
          <strong>Spread:</strong> {spread || "N/A"}
        </p>
        <p>
          <strong>Over/Under:</strong> {overUnder || "N/A"}
        </p>
      </div>
    </div>
  );

  const renderWeather = () => (
    <div className="tab-content">
      <h2>Weather Conditions</h2>
      <p>
        <strong>Temperature:</strong> {temperature || "N/A"}°F
      </p>
      <p>
        <strong>Description:</strong> {weatherDescription || "N/A"}
      </p>
      <p>
        <strong>Wind:</strong>{" "}
        {windSpeed ? `${windSpeed} mph` : "N/A"}{" "}
        {windDirection ? `(${windDirection}°)` : ""}
      </p>
    </div>
  );

  const renderVenue = () => (
    <div className="tab-content">
      <h2>Venue Information</h2>
      <p>
        <strong>Stadium:</strong> {venue || "TBD"}
      </p>
      <p>
        <strong>Location:</strong> {city || "TBD"}, {state || ""}
      </p>
      {/* Additional venue details from REST (like capacity or notes) can be rendered here */}
    </div>
  );

  // Render tab buttons
  const renderTabs = () => (
    <div className="tabs">
      <button
        className={activeTab === "overview" ? "active" : ""}
        onClick={() => setActiveTab("overview")}
      >
        Overview
      </button>
      <button
        className={activeTab === "statistics" ? "active" : ""}
        onClick={() => setActiveTab("statistics")}
      >
        Statistics
      </button>
      <button
        className={activeTab === "betting" ? "active" : ""}
        onClick={() => setActiveTab("betting")}
      >
        Betting
      </button>
      <button
        className={activeTab === "weather" ? "active" : ""}
        onClick={() => setActiveTab("weather")}
      >
        Weather
      </button>
      <button
        className={activeTab === "venue" ? "active" : ""}
        onClick={() => setActiveTab("venue")}
      >
        Venue
      </button>
    </div>
  );

  return (
    <div className="advanced-game-detail">
      {/* Inline CSS for the component */}
      <style>{`
        .advanced-game-detail {
          padding: 20px;
          font-family: Arial, sans-serif;
          max-width: 1000px;
          margin: 0 auto;
        }
        .game-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          padding-bottom: 10px;
          border-bottom: 1px solid #eee;
        }
        .game-header h1 {
          margin: 0;
        }
        .tabs {
          display: flex;
          gap: 10px;
          margin-bottom: 20px;
        }
        .tabs button {
          background-color: #eee;
          border: none;
          padding: 10px 15px;
          border-radius: 4px;
          cursor: pointer;
          font-weight: bold;
        }
        .tabs button.active {
          background-color: #D4001C;
          color: #fff;
        }
        .teams-comparison {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }
        .team-column {
          flex: 1;
          text-align: center;
          padding: 10px;
        }
        .vs-column {
          width: 80px;
          text-align: center;
          font-size: 28px;
          font-weight: bold;
        }
        .team-logo {
          width: 100px;
          height: 100px;
          object-fit: contain;
          margin-bottom: 10px;
        }
        .team-name {
          font-size: 24px;
          font-weight: bold;
          margin-bottom: 5px;
        }
        .team-record {
          color: #666;
          margin-bottom: 10px;
        }
        .score {
          font-size: 42px;
          font-weight: bold;
          margin: 10px 0;
        }
        .basic-info {
          text-align: center;
          margin-bottom: 20px;
        }
        .basic-info p {
          margin: 5px 0;
          font-size: 16px;
        }
        .tab-content {
          background-color: #f9f9f9;
          border-radius: 8px;
          padding: 20px;
          margin-bottom: 20px;
        }
        .stat-grid, .betting-grid {
          display: flex;
          gap: 20px;
          flex-wrap: wrap;
        }
        .stat-grid > div, .betting-grid > p {
          flex: 1;
          min-width: 150px;
        }
        @media (max-width: 768px) {
          .teams-comparison {
            flex-direction: column;
          }
          .vs-column {
            margin: 15px 0;
          }
        }
      `}</style>

      <div className="game-header">
        <h1>Game Details</h1>
        <div className="game-status">
          {status === "final"
            ? "Final Score"
            : startDate
            ? new Date(startDate).toLocaleString()
            : "Upcoming Game"}
        </div>
      </div>

      {renderTabs()}

      {/* Render tab content based on activeTab */}
      {activeTab === "overview" && renderOverview()}
      {activeTab === "statistics" && renderStatistics()}
      {activeTab === "betting" && renderBetting()}
      {activeTab === "weather" && renderWeather()}
      {activeTab === "venue" && renderVenue()}
    </div>
  );
};

export default AdvancedGameDetailView;

