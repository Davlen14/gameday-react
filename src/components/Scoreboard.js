import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import teamsService from "../services/teamsService";

const Scoreboard = () => {
  const [games, setGames] = useState([]);
  const [teams, setTeams] = useState([]);
  const [week, setWeek] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch teams and games data for the selected week
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [teamsData, gamesData] = await Promise.all([
          teamsService.getTeams(),
          teamsService.getGames(week),
        ]);
        setTeams(teamsData);

        // Filter games to include only FBS teams
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

    fetchData();
  }, [week]);

  // Helper to get the team logo based on team name
  const getTeamLogo = (teamName) => {
    const team = teams.find(
      (t) => t.school.toLowerCase() === teamName?.toLowerCase()
    );
    return team?.logos?.[0] || "/photos/default_team.png";
  };

  // Helper to get the team abbreviation based on team name
  const getTeamAbbreviation = (teamName) => {
    const team = teams.find(
      (t) => t.school.toLowerCase() === teamName?.toLowerCase()
    );
    return team?.abbreviation || teamName;
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
        {games.map((game) => (
          <Link
            to={`/games/${game.id}`}
            key={game.id}
            className="scoreboard-game-link"
          >
            <div className="scoreboard-game-card">
              {/* Away team (top) */}
              <div className="scoreboard-card-team">
                <img
                  src={getTeamLogo(game.awayTeam)}
                  alt={game.awayTeam}
                  className="scoreboard-team-logo"
                />
                <span className="scoreboard-team-name">
                  {getTeamAbbreviation(game.awayTeam)}
                </span>
                <span className="scoreboard-team-record">0-0</span>
              </div>
              {/* Home team (bottom) */}
              <div className="scoreboard-card-team">
                <img
                  src={getTeamLogo(game.homeTeam)}
                  alt={game.homeTeam}
                  className="scoreboard-team-logo"
                />
                <span className="scoreboard-team-name">
                  {getTeamAbbreviation(game.homeTeam)}
                </span>
                <span className="scoreboard-team-record">0-0</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Scoreboard;
