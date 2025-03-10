import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import teamsService from "../services/teamsService";
import graphqlTeamsService from "../services/graphqlTeamsService";

// Simple WeatherIcon component.
const WeatherIcon = ({ condition, temperature }) => {
  let icon;
  if (!condition || condition.toLowerCase().includes("clear")) {
    icon = (
      <svg width="32" height="32" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="5" fill="#FFEB3B" />
        <line x1="12" y1="1" x2="12" y2="4" stroke="#FFA000" strokeWidth="2" />
        <line x1="12" y1="20" x2="12" y2="23" stroke="#FFA000" strokeWidth="2" />
        <line x1="4.22" y1="4.22" x2="6.34" y2="6.34" stroke="#FFA000" strokeWidth="2" />
        <line x1="17.66" y1="17.66" x2="19.78" y2="19.78" stroke="#FFA000" strokeWidth="2" />
        <line x1="1" y1="12" x2="4" y2="12" stroke="#FFA000" strokeWidth="2" />
        <line x1="20" y1="12" x2="23" y2="12" stroke="#FFA000" strokeWidth="2" />
        <line x1="4.22" y1="19.78" x2="6.34" y2="17.66" stroke="#FFA000" strokeWidth="2" />
        <line x1="17.66" y1="6.34" x2="19.78" y2="4.22" stroke="#FFA000" strokeWidth="2" />
      </svg>
    );
  } else if (condition.toLowerCase().includes("cloud")) {
    icon = (
      <svg width="32" height="32" viewBox="0 0 24 24">
        <ellipse cx="12" cy="12" rx="8" ry="5" fill="#B0C4DE" />
      </svg>
    );
  } else if (condition.toLowerCase().includes("rain")) {
    icon = (
      <svg width="32" height="32" viewBox="0 0 24 24">
        <path d="M7 10h10a4 4 0 010 8H7a4 4 0 010-8z" fill="#4A90E2" />
        <line x1="10" y1="18" x2="10" y2="21" stroke="#4A90E2" strokeWidth="2"/>
        <line x1="14" y1="18" x2="14" y2="21" stroke="#4A90E2" strokeWidth="2"/>
      </svg>
    );
  } else {
    icon = (
      <svg width="32" height="32" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="5" fill="#FFEB3B" />
      </svg>
    );
  }
  return (
    <div className="weather-icon">
      {icon}
      {temperature && <span className="temp-label">{temperature}°F</span>}
    </div>
  );
};

// Simple TvIcon component.
const TvIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24">
    <rect x="2" y="3" width="20" height="14" rx="2" fill="#666" />
    <rect x="3" y="4" width="18" height="12" rx="1" fill="#333" />
    <path d="M10 17h4v3a1 1 0 01-1 1h-2a1 1 0 01-1-1v-3z" fill="#555" />
  </svg>
);

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
    windDirection,
    windSpeed,
    tv, // We'll ignore this since we'll always display ESPN
    weather,    // Object containing: condition, dewpoint, etc.
    // Removed mediaInfo and lines from rendering for now.
  } = gameData;

  const homeTeamDetails = getTeamDetails(homeTeam);
  const awayTeamDetails = getTeamDetails(awayTeam);

  // Render a modern line scores table.
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
    <div className="tab-content overview">
      <div className="teams-comparison">
        <div className="team-column">
          <img src={getTeamLogo(homeTeam)} alt={homeTeam} className="team-logo" />
          <div className="team-name">{homeTeam}</div>
          <div className="team-record">
            {homeTeamDetails.record ? `Record: ${homeTeamDetails.record}` : ""}{" "}
            {homeTeamDetails.rank ? `• Rank: #${homeTeamDetails.rank}` : ""}
          </div>
          <div className="score">{homePoints || "0"}</div>
        </div>
        <div className="vs-column">VS</div>
        <div className="team-column">
          <img src={getTeamLogo(awayTeam)} alt={awayTeam} className="team-logo" />
          <div className="team-name">{awayTeam}</div>
          <div className="team-record">
            {awayTeamDetails.record ? `Record: ${awayTeamDetails.record}` : ""}{" "}
            {awayTeamDetails.rank ? `• Rank: #${awayTeamDetails.rank}` : ""}
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
        <p className="broadcast">
          <TvIcon /> <span><strong>Broadcast:</strong> ESPN</span>
        </p>
        {lastPlay && <p><strong>Last Play:</strong> {lastPlay}</p>}
      </div>
    </div>
  );

  // Statistics tab.
  const renderStatistics = () => (
    <div className="tab-content statistics">
      <h2>Scoring by Period</h2>
      {renderLineScores()}
      {currentClock && (
        <p>
          <strong>Current Clock:</strong> {currentClock} (Period: {currentPeriod || "N/A"})
        </p>
      )}
      {lastPlay && <p><strong>Last Play:</strong> {lastPlay}</p>}
    </div>
  );

  // Betting tab.
  const renderBetting = () => (
    <div className="tab-content betting">
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
    <div className="tab-content weather">
      <h2>Weather Conditions</h2>
      <div className="weather-details">
        <WeatherIcon
          condition={weather && weather.condition && weather.condition.description ? weather.condition.description : ""}
          temperature={temperature || (weather && weather.temperature)}
        />
        <p>
          <strong>Description:</strong>{" "}
          {weather && weather.condition && weather.condition.description ? weather.condition.description : "N/A"}
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
        {weather && weather.dewpoint && (
          <p>
            <strong>Dewpoint:</strong> {weather.dewpoint}
          </p>
        )}
      </div>
    </div>
  );

  // Venue tab.
  const renderVenue = () => (
    <div className="tab-content venue">
      <h2>Venue Information</h2>
      <p>
        <strong>Stadium:</strong> {venue || "TBD"}
      </p>
      <p>
        <strong>Location:</strong> {city || "TBD"}, {state || ""}
      </p>
    </div>
  );

  // Details tab: displays additional game info.
  const renderDetails = () => (
    <div className="tab-content details">
      <h2>Additional Game Details</h2>
      <div className="details-grid">
        <p><strong>Attendance:</strong> {attendance || "N/A"}</p>
        <p>
          <strong>Season:</strong> {season || "N/A"} {seasonType ? `(Type: ${seasonType})` : ""}
        </p>
        <p>
          <strong>Conference Game:</strong> {conferenceGame !== undefined ? (conferenceGame ? "Yes" : "No") : "N/A"}
        </p>
        <p><strong>Excitement:</strong> {excitement || "N/A"}</p>
        <p><strong>Away Classification:</strong> {awayClassification || "N/A"}</p>
        <p>
          <strong>Away Conference:</strong> {awayConference || "N/A"} (ID: {awayConferenceId || "N/A"})
        </p>
        <p>
          <strong>Away Elo:</strong> Start: {awayStartElo || "N/A"}, End: {awayEndElo || "N/A"}, Postgame Win Prob: {awayPostgameWinProb || "N/A"}
        </p>
        <p><strong>Away Team ID:</strong> {awayTeamId || "N/A"}</p>
        <p><strong>Home Classification:</strong> {homeClassification || "N/A"}</p>
        <p>
          <strong>Home Conference:</strong> {homeConference || "N/A"} (ID: {homeConferenceId || "N/A"})
        </p>
        <p>
          <strong>Home Elo:</strong> Start: {homeStartElo || "N/A"}, End: {homeEndElo || "N/A"}, Postgame Win Prob: {homePostgameWinProb || "N/A"}
        </p>
        <p><strong>Home Team ID:</strong> {homeTeamId || "N/A"}</p>
        <p>
          <strong>Neutral Site:</strong> {neutralSite !== undefined ? (neutralSite ? "Yes" : "No") : "N/A"}
        </p>
        <p><strong>Week:</strong> {week || "N/A"}</p>
        {notes && <p><strong>Notes:</strong> {notes}</p>}
      </div>
    </div>
  );

  // Render tab buttons.
  const renderTabs = () => (
    <div className="tabs">
      <button className={activeTab === "overview" ? "active" : ""} onClick={() => setActiveTab("overview")}>
        Overview
      </button>
      <button className={activeTab === "statistics" ? "active" : ""} onClick={() => setActiveTab("statistics")}>
        Statistics
      </button>
      <button className={activeTab === "betting" ? "active" : ""} onClick={() => setActiveTab("betting")}>
        Betting
      </button>
      <button className={activeTab === "weather" ? "active" : ""} onClick={() => setActiveTab("weather")}>
        Weather
      </button>
      <button className={activeTab === "venue" ? "active" : ""} onClick={() => setActiveTab("venue")}>
        Venue
      </button>
      <button className={activeTab === "details" ? "active" : ""} onClick={() => setActiveTab("details")}>
        Details
      </button>
    </div>
  );

  return (
    <div className="advanced-game-detail">
      {/* Inline CSS */}
      <style>{`
        .advanced-game-detail {
          padding: 20px;
          font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
          max-width: 1000px;
          margin: 0 auto;
          background-color: #fafafa;
        }
        .game-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          padding-bottom: 10px;
          border-bottom: 2px solid #ddd;
        }
        .game-header h1 {
          font-size: 2rem;
          margin: 0;
          color: #333;
        }
        .game-status {
          font-size: 1rem;
          color: #555;
        }
        .tabs {
          display: flex;
          gap: 10px;
          margin-bottom: 20px;
        }
        .tabs button {
          flex: 1;
          background-color: #eee;
          border: none;
          padding: 12px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 1rem;
          transition: background-color 0.3s;
        }
        .tabs button.active {
          background-color: #D4001C;
          color: #fff;
        }
        .teams-comparison {
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          align-items: center;
          margin-bottom: 20px;
        }
        .team-column {
          text-align: center;
        }
        .vs-column {
          font-size: 2rem;
          font-weight: bold;
          color: #777;
        }
        .team-logo {
          width: 100px;
          height: 100px;
          object-fit: cover;
          border-radius: 50%;
          margin: 0 auto 10px;
        }
        .team-name {
          font-size: 1.5rem;
          font-weight: bold;
          margin-bottom: 5px;
          color: #333;
        }
        .team-record {
          font-size: 1rem;
          color: #777;
          margin-bottom: 10px;
        }
        .score {
          font-size: 2rem;
          font-weight: bold;
          color: #222;
        }
        .basic-info {
          text-align: center;
          margin-bottom: 20px;
        }
        .basic-info p {
          font-size: 1rem;
          color: #555;
          margin: 5px 0;
        }
        .tab-content {
          background-color: #fff;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          margin-bottom: 20px;
        }
        .line-scores table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 10px;
        }
        .line-scores th, .line-scores td {
          border: 1px solid #ddd;
          padding: 10px;
          text-align: center;
        }
        .line-scores th {
          background-color: #f7f7f7;
        }
        .betting-grid, .details-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 15px;
          margin-top: 15px;
        }
        .weather-icon {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .temp-label {
          font-size: 1rem;
          color: #333;
        }
        @media (max-width: 768px) {
          .teams-comparison {
            grid-template-columns: 1fr;
            gap: 10px;
          }
          .vs-column {
            font-size: 1.5rem;
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
