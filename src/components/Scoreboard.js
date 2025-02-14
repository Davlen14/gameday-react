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
    <div className="scoreboard-wrapper">
      {/* Top Scoreboard Filter Bar */}
      <div className="top-scoreboard">
        <div className="scoreboard-left">
          {/* NCAAF label/link */}
          <span className="ncaaf-dropdown">NCAAF</span>
        </div>
  
        <div className="scoreboard-right">
          <span className="week-label">Week:</span>
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
      </div>
  
      {/* Horizontal Scrolling Scoreboard Cards */}
      <div className="scoreboard-container">
        {games.map((game) => (
          <Link
            to={`/games/${game.id}`}
            key={game.id}
            className="scoreboard-card-link"
          >
            <div className="scoreboard-card">
              <div className="teams">
                {/* Home Team */}
                <div className="team">
                  <img
                    src={getTeamLogo(game.homeTeam)}
                    alt={game.homeTeam}
                    className="team-logo"
                  />
                  <span className="team-name">{game.homeTeam}</span>
                  <span className="team-record">0-0</span>
                </div>
                {/* Away Team */}
                <div className="team">
                  <img
                    src={getTeamLogo(game.awayTeam)}
                    alt={game.awayTeam}
                    className="team-logo"
                  />
                  <span className="team-name">{game.awayTeam}</span>
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
