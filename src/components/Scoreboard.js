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

  if (isLoading)
    return <div className="loading-container">Loading...</div>;
  if (error)
    return <div className="error-container">Error: {error}</div>;

  return (
    <div className="scoreboard-main-wrapper">
      {/* Top Scoreboard Filter Bar */}
      <div className="scoreboard-top-bar">
        <div className="scoreboard-top-bar-left">
          {/* NCAAF label/link */}
          <span className="scoreboard-ncaaf-dropdown">NCAAF</span>
          {/* ESPN-like vertical divider */}
          <div className="scoreboard-divider" />
        </div>

        <div className="scoreboard-top-bar-right">
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
      </div>

      {/* Horizontal Scrolling Scoreboard Cards */}
      <div className="scoreboard-games-container">
        {games.map((game) => (
          <Link
            to={`/games/${game.id}`}
            key={game.id}
            className="scoreboard-game-link"
          >
            <div className="scoreboard-game-card">
              <div className="scoreboard-card-teams">
                {/* Away Team first */}
                <div className="scoreboard-card-team">
                  <img
                    src={getTeamLogo(game.awayTeam)}
                    alt={game.awayTeam}
                    className="scoreboard-team-logo"
                  />
                  <span className="scoreboard-team-name">{game.awayTeam}</span>
                  <span className="scoreboard-team-record">0-0</span>
                </div>
                {/* Home Team second */}
                <div className="scoreboard-card-team">
                  <img
                    src={getTeamLogo(game.homeTeam)}
                    alt={game.homeTeam}
                    className="scoreboard-team-logo"
                  />
                  <span className="scoreboard-team-name">{game.homeTeam}</span>
                  <span className="scoreboard-team-record">0-0</span>
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
