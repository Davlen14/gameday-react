import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import teamsService from "../services/teamsService";
import { FaTv } from "react-icons/fa";

const Scoreboard = () => {
  const [games, setGames] = useState([]);
  const [teams, setTeams] = useState([]);
  const [media, setMedia] = useState([]); // <-- For TV network info
  const [week, setWeek] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch teams, games, and media data for the selected week
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        // Fetch all relevant data in parallel
        const [teamsData, gamesData, mediaData] = await Promise.all([
          teamsService.getTeams(),
          teamsService.getGames(week),
          teamsService.getGameMedia(2024, week) // or adapt if your API differs
        ]);

        setTeams(teamsData);

        // Filter games to include only FBS teams
        const fbsGames = gamesData.filter(
          (game) =>
            game.homeClassification === "fbs" &&
            game.awayClassification === "fbs"
        );
        setGames(fbsGames);

        // Store the media data (for TV network, etc.)
        setMedia(mediaData);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [week]);

  // Helpers
  const getTeamLogo = (teamName) => {
    const team = teams.find(
      (t) => t.school.toLowerCase() === teamName?.toLowerCase()
    );
    return team?.logos?.[0] || "/photos/default_team.png";
  };

  const getTeamAbbreviation = (teamName) => {
    const team = teams.find(
      (t) => t.school.toLowerCase() === teamName?.toLowerCase()
    );
    return team?.abbreviation || teamName;
  };

  // Helper to find media info for a given game
  const getMediaForGame = (gameId) => {
    return media.find((m) => m.id === gameId) || null;
  };

  // Format the game time
  const formatGameTime = (game) => {
    // If game is final, you can show "Final"
    if (game.completed) {
      return "Final";
    }
    // Otherwise, format start date/time if available
    if (game.startDate) {
      const dateObj = new Date(game.startDate);
      // Example: "Sat 3:30 PM"
      return dateObj.toLocaleString([], {
        weekday: "short",
        hour: "2-digit",
        minute: "2-digit"
      });
    }
    return "";
  };

  if (isLoading) {
    return <div className="loading-container">Loading...</div>;
  }
  if (error) {
    return <div className="error-container">Error: {error}</div>;
  }

  return (
    <div className="scoreboard-bar">
      {/* Filters (NCAAF + Week) */}
      <div className="scoreboard-filters">
        <span className="scoreboard-ncaaf-dropdown">NCAAF</span>
        <div className="scoreboard-divider" />
        <span className="scoreboard-week-label">Week:</span>
        <select
          id="weekSelect"
          className="scoreboard-week-dropdown"
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

      {/* Horizontally scrolling games */}
      <div className="scoreboard-games">
        {games.map((game) => {
          const gameMedia = getMediaForGame(game.id);
          const tvNetwork = gameMedia?.network || "";

          return (
            <Link
              to={`/games/${game.id}`}
              key={game.id}
              className="scoreboard-game-link"
            >
              <div className="scoreboard-game-card">
                {/* Row 1: Time (left) & TV (right) */}
                <div className="scoreboard-game-header">
                  <div className="scoreboard-game-time">
                    {formatGameTime(game)}
                  </div>
                  <div className="scoreboard-game-network">
                    <FaTv className="scoreboard-tv-icon" />
                    {tvNetwork && <span>{tvNetwork}</span>}
                  </div>
                </div>

                {/* Row 2: Away/Home teams stacked */}
                <div className="scoreboard-card-team">
                  <img
                    src={getTeamLogo(game.awayTeam)}
                    alt={game.awayTeam}
                    className="scoreboard-team-logo"
                  />
                  <span className="scoreboard-team-name">
                    {getTeamAbbreviation(game.awayTeam)}
                  </span>
                  <span className="scoreboard-team-score">
                    {game.awayPoints ?? ""}
                  </span>
                </div>

                <div className="scoreboard-card-team">
                  <img
                    src={getTeamLogo(game.homeTeam)}
                    alt={game.homeTeam}
                    className="scoreboard-team-logo"
                  />
                  <span className="scoreboard-team-name">
                    {getTeamAbbreviation(game.homeTeam)}
                  </span>
                  <span className="scoreboard-team-score">
                    {game.homePoints ?? ""}
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default Scoreboard;
