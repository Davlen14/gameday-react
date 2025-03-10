import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import teamsService from "../services/teamsService";
import graphqlTeamsService from "../services/graphqlTeamsService";

const AdvancedGameDetailView = () => {
  const { id } = useParams(); // Game ID from URL
  const [gameData, setGameData] = useState(null);
  const [teams, setTeams] = useState([]);
  const [activeTab, setActiveTab] = useState("overview");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch teams and game data (REST, GraphQL scoreboard, and GraphQL game_info) and merge them.
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);

        // Get teams from REST (for logos and extra team info)
        const teamsData = await teamsService.getTeams();
        setTeams(teamsData);

        // Get basic game data from REST (assuming getGameById exists)
        const restGameData = await teamsService.getGameById(id);

        // Get detailed scoreboard data from GraphQL
        const scoreboardData = await graphqlTeamsService.getGameScoreboard(id);

        // Get comprehensive game info from GraphQL (using the full schema)
        const gameInfoData = await graphqlTeamsService.getGameInfo(id);

        // Merge data – REST values override GraphQL if present.
        const mergedData = { ...scoreboardData, ...gameInfoData, ...restGameData };

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

  // Helper: Get team logo from REST teams data.
  const getTeamLogo = (teamName) => {
    const team = teams.find(
      (t) => t.school.toLowerCase() === teamName.toLowerCase()
    );
    return team && team.logos && team.logos.length > 0
      ? team.logos[0]
      : "/photos/default_team.png";
  };

  // Helper: Get team details for display.
  const getTeamDetails = (teamName) => {
    const team = teams.find(
      (t) => t.school.toLowerCase() === teamName.toLowerCase()
    );
    return team || {};
  };

  if (isLoading) return <div>Loading game details...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!gameData) return <div>Game not found</div>;

  // Destructure all fields from merged gameData.
  const {
    id: gameId,
    attendance,
    awayClassification,
    awayConference,
    awayConferenceId,
    awayEndElo,
    awayLineScores,
    awayPoints,
    awayPostgameWinProb,
    awayStartElo,
    awayTeam,
    awayTeamId,
    conferenceGame,
    excitement,
    homeClassification,
    homeConference,
    homeConferenceId,
    homeEndElo,
    homeLineScores,
    homePoints,
    homePostgameWinProb,
    homeStartElo,
    homeTeam,
    homeTeamId,
    neutralSite,
    notes,
    season,
    seasonType,
    startDate,
    startTimeTbd,
    status,
    venue,
    city,
    state,
    week,
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
    weather,    // Nested object from game_info.weather
    mediaInfo,  // Array from game_info.mediaInfo
    lines       // Array from game_info.lines
  } = gameData;

  const homeTeamDetails = getTeamDetails(homeTeam);
  const awayTeamDetails = getTeamDetails(awayTeam);

  // Modernized line scores table for the Statistics tab.
  const renderLineScores = () => {
    const periods = homeLineScores && homeLineScores.length;
    if (!periods) return <p>No line score data available.</p>;
    return (
      <div className="line-scores">
        <h3>Quarter Scores</h3>
        <table>
          <thead>
            <tr>
              <th>Period</th>
              <th>{homeTeam}</th>
              <th>{awayTeam}</th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: periods }).map((_, index) => (
              <tr key={index}>
                <td>{`Q${index + 1}`}</td>
                <td>{homeLineScores[index] !== null ? homeLineScores[index] : '-'}</td>
                <td>
                  {awayLineScores && awayLineScores[index] !== undefined
                    ? awayLineScores[index]
                    : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  // Overview tab.
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

  // Statistics tab.
  const renderStatistics = () => (
    <div className="tab-content">
      <h2>Scoring by Period</h2>
      {renderLineScores()}
      {currentClock && (
        <p>
          <strong>Current Clock:</strong> {currentClock} (Period:{" "}
          {currentPeriod || "N/A"})
        </p>
      )}
      {lastPlay && <p><strong>Last Play:</strong> {lastPlay}</p>}
    </div>
  );

  // Betting tab.
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

  // Weather tab.
  const renderWeather = () => (
    <div className="tab-content">
      <h2>Weather Conditions</h2>
      <p>
        <strong>Temperature:</strong>{" "}
        {temperature || (weather && weather.temperature) || "N/A"}°F
      </p>
      <p>
        <strong>Description:</strong>{" "}
        {weatherDescription || (weather && weather.weatherDescription) || "N/A"}
      </p>
      <p>
        <strong>Wind:</strong>{" "}
        {windSpeed || (weather && weather.windSpeed)
          ? `${windSpeed || weather.windSpeed} mph`
          : "N/A"}{" "}
        {windDirection || (weather && weather.windDirection)
          ? `(${windDirection || weather.windDirection}°)`
          : ""}
      </p>
    </div>
  );

  // Venue tab.
  const renderVenue = () => (
    <div className="tab-content">
      <h2>Venue Information</h2>
      <p>
        <strong>Stadium:</strong> {venue || "TBD"}
      </p>
      <p>
        <strong>Location:</strong> {city || "TBD"}, {state || ""}
      </p>
    </div>
  );

  // Details tab: displays additional game info from game_info.
  const renderDetails = () => (
    <div className="tab-content">
      <h2>Additional Game Details</h2>
      <p>
        <strong>Attendance:</strong> {attendance || "N/A"}
      </p>
      <p>
        <strong>Season:</strong> {season || "N/A"}{" "}
        {seasonType ? `(Type: ${seasonType})` : ""}
      </p>
      <p>
        <strong>Conference Game:</strong>{" "}
        {conferenceGame !== undefined ? (conferenceGame ? "Yes" : "No") : "N/A"}
      </p>
      <p>
        <strong>Excitement:</strong> {excitement || "N/A"}
      </p>
      <p>
        <strong>Away Classification:</strong> {awayClassification || "N/A"}
      </p>
      <p>
        <strong>Away Conference:</strong> {awayConference || "N/A"} (ID:{" "}
        {awayConferenceId || "N/A"})
      </p>
      <p>
        <strong>Away Elo:</strong> Start: {awayStartElo || "N/A"}, End:{" "}
        {awayEndElo || "N/A"}, Postgame Win Prob:{" "}
        {awayPostgameWinProb || "N/A"}
      </p>
      <p>
        <strong>Away Team ID:</strong> {awayTeamId || "N/A"}
      </p>
      <p>
        <strong>Home Classification:</strong> {homeClassification || "N/A"}
      </p>
      <p>
        <strong>Home Conference:</strong> {homeConference || "N/A"} (ID:{" "}
        {homeConferenceId || "N/A"})
      </p>
      <p>
        <strong>Home Elo:</strong> Start: {homeStartElo || "N/A"}, End:{" "}
        {homeEndElo || "N/A"}, Postgame Win Prob:{" "}
        {homePostgameWinProb || "N/A"}
      </p>
      <p>
        <strong>Home Team ID:</strong> {homeTeamId || "N/A"}
      </p>
      <p>
        <strong>Neutral Site:</strong>{" "}
        {neutralSite !== undefined ? (neutralSite ? "Yes" : "No") : "N/A"}
      </p>
      {notes && <p><strong>Notes:</strong> {notes}</p>}
      <p>
        <strong>Week:</strong> {week || "N/A"}
      </p>
      {mediaInfo && mediaInfo.length > 0 && (
        <div className="media-info">
          <h3>Media Information</h3>
          <ul>
            {mediaInfo.map((media) => (
              <li key={media.id}>
                <strong>Network:</strong> {media.network}{" "}
                {media.outlet && `- Outlet: ${media.outlet}`}
              </li>
            ))}
          </ul>
        </div>
      )}
      {lines && lines.length > 0 && (
        <div className="lines-info">
          <h3>Betting Lines</h3>
          <ul>
            {lines.map((line, idx) => (
              <li key={idx}>
                <strong>Provider:</strong> {line.provider} –{" "}
                <strong>Spread:</strong> {line.spread || "N/A"} –{" "}
                <strong>O/U:</strong> {line.overUnder || "N/A"}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );

  // Render tab buttons including the new "Details" tab.
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
      <button
        className={activeTab === "details" ? "active" : ""}
        onClick={() => setActiveTab("details")}
      >
        Details
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
        .line-scores table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 10px;
        }
        .line-scores th, .line-scores td {
          border: 1px solid #ddd;
          padding: 8px;
          text-align: center;
        }
        .line-scores th {
          background-color: #f2f2f2;
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
      {activeTab === "details" && renderDetails()}
    </div>
  );
};

export default AdvancedGameDetailView;
