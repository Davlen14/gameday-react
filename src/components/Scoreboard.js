import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FaTv } from "react-icons/fa";
import teamsService from "../services/teamsService";

const Scoreboard = () => {
  const [games, setGames] = useState([]);
  const [week, setWeek] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchGames = async () => {
      try {
        setIsLoading(true);
        const gamesData = await teamsService.getGames(week);
        // Filter to include only FBS teams
        const fbsGames = gamesData.filter(
          (game) =>
            game.homeClassification === "fbs" &&
            game.awayClassification === "fbs"
        );
        setGames(fbsGames);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchGames();
  }, [week]);

  // Simple helper to create abbreviations from team names
  const abbreviateTeamName = (name) => {
    if (!name) return "";
    // e.g., take the first letter of each word
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase();
  };

  if (isLoading) return <div className="loading-container">Loading...</div>;
  if (error) return <div className="error-container">Error: {error}</div>;

  return (
    <div className="scoreboard-wrapper">
      {/* Minimal top bar for changing the week */}
      <div className="scoreboard-filter-bar">
        <label htmlFor="weekSelect" className="week-label">Week:</label>
        <select
          id="weekSelect"
          className="week-dropdown"
          value={week}
          onChange={(e) => setWeek(Number(e.target.value))}
        >
          {[...Array(17).keys()].map((w) => (
            <option key={w + 1} value={w + 1}>
              {w + 1}
            </option>
          ))}
        </select>
      </div>

      {/* Scrollable container for scoreboard cards */}
      <div className="scoreboard-container">
        {games.map((game) => (
          <Link
            to={`/games/${game.id}`}
            key={game.id}
            className="scoreboard-card-link"
          >
            <div className="scoreboard-card">
              <div className="scoreboard-header">
                {/* Display the date on the left */}
                <div className="game-date">
                  {new Date(game.startDate).toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  })}
                </div>
                {/* TV icon at the top right */}
                <div className="network">
                  <FaTv className="network-icon" />
                </div>
              </div>
              <div className="teams">
                {/* Home team */}
                <div className="team">
                  <span className="team-abbr">
                    {abbreviateTeamName(game.homeTeam)}
                  </span>
                  <span className="team-record">0-0</span>
                </div>
                {/* Away team */}
                <div className="team">
                  <span className="team-abbr">
                    {abbreviateTeamName(game.awayTeam)}
                  </span>
                  <span className="team-record">0-0</span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Scoreboard;