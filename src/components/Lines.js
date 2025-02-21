import React, { useEffect, useState } from "react";
import teamsService from "../services/teamsService";
import "../styles/Lines.css"; // Your custom CSS file

// SVG Components for status icons
const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="8" cy="8" r="8" fill="green" />
    <path d="M4 8l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const CrossIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="8" cy="8" r="8" fill="red" />
    <path d="M5 5l6 6M11 5l-6 6" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const Lines = () => {
  const [lines, setLines] = useState([]);
  const [teams, setTeams] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch teams and lines data on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);

        // Only fetch teams if we haven't loaded them yet
        if (teams.length === 0) {
          const teamsData = await teamsService.getTeams();
          setTeams(teamsData);
        }

        // Fetch lines for 2024 regular season
        const response = await teamsService.getGameLines(2024, null, "regular");
        setLines(response);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [teams.length]);

  /**
   * Dynamically find the matching team in the teams array by name.
   * Returns the first logo if found, otherwise returns a default image.
   */
  const getTeamLogo = (teamName) => {
    const matchedTeam = teams.find(
      (t) => t.school.toLowerCase() === teamName.toLowerCase()
    );
    return matchedTeam?.logos ? matchedTeam.logos[0] : "/photos/default_team.png";
  };

  /**
   * Get a sportsbook logo by provider name, or default if not found.
   */
  const getSportsbookLogo = (provider) => {
    const logos = {
      "DraftKings": "/photos/draftkings.png",
      "ESPN Bet": "/photos/espnbet.png",
      "Bovada": "/photos/bovada.png",
    };
    return logos[provider] || "/photos/default_sportsbook.png";
  };

  if (isLoading) {
    return <div className="lines-loading">Loading lines for 2024...</div>;
  }

  if (error) {
    return <div className="lines-error">Error: {error}</div>;
  }

  if (lines.length === 0) {
    return <p className="lines-none">No lines data available for 2024.</p>;
  }

  return (
    <div className="lines-page">
      <h1 className="lines-title">2024 Betting Odds</h1>

      {lines.map((game) => (
        <div key={game.id} className="lines-card">
          {/* Game Header (Teams, Logos, Score, Start Time) */}
          <div className="game-header">
            <div className="team-block">
              <img
                src={getTeamLogo(game.homeTeam)}
                alt={game.homeTeam}
                className="team-logo"
              />
              <div className="team-info">
                <span className="team-name">{game.homeTeam}</span>
                <span className="team-score">{game.homeScore}</span>
              </div>
            </div>

            <div className="team-block">
              <img
                src={getTeamLogo(game.awayTeam)}
                alt={game.awayTeam}
                className="team-logo"
              />
              <div className="team-info">
                <span className="team-name">{game.awayTeam}</span>
                <span className="team-score">{game.awayScore}</span>
              </div>
            </div>

            <div className="game-meta">
              <span className="game-week">Week {game.week}</span>
              <span className="game-date">
                {new Date(game.startDate).toLocaleString()}
              </span>
            </div>
          </div>

          {/* Lines Section */}
          <div className="lines-row">
            {game.lines && game.lines.length > 0 ? (
              game.lines.map((line, index) => (
                <div key={index} className="line-item">
                  <img
                    src={getSportsbookLogo(line.provider)}
                    alt={line.provider}
                    className="sportsbook-logo"
                  />
                  <div className="line-details">
                    <span className="spread">
                      <span className="metric-label">
                        Spread: {line.spread !== null ? line.spread : "N/A"}
                      </span>
                      <span className="status">
                        {line.spread === 3 ? (
                          <>
                            <CheckIcon /> Covered!
                          </>
                        ) : (
                          <>
                            <CrossIcon /> Not Covered!
                          </>
                        )}
                      </span>
                    </span>
                    <span className="over-under">
                      <span className="metric-label">
                        O/U: {line.overUnder !== null ? line.overUnder : "N/A"}
                      </span>
                      <span className="status">
                        {line.overUnder === 54 ? (
                          <>
                            <CheckIcon /> Covered!
                          </>
                        ) : (
                          <>
                            <CrossIcon /> Not Covered!
                          </>
                        )}
                      </span>
                    </span>
                    <span className="moneyline">
                      <span className="metric-label">
                        Home ML: {line.homeMoneyline !== null ? line.homeMoneyline : "N/A"}
                      </span>
                      <span className="status">
                        {line.homeMoneyline === 130 ? (
                          <>
                            <CheckIcon /> Covered!
                          </>
                        ) : (
                          <>
                            <CrossIcon /> Not Covered!
                          </>
                        )}
                      </span>
                    </span>
                    <span className="moneyline">
                      <span className="metric-label">
                        Away ML: {line.awayMoneyline !== null ? line.awayMoneyline : "N/A"}
                      </span>
                      <span className="status">
                        {line.awayMoneyline === -150 ? (
                          <>
                            <CheckIcon /> Covered!
                          </>
                        ) : (
                          <>
                            <CrossIcon /> Not Covered!
                          </>
                        )}
                      </span>
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="line-item">No lines available</div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default Lines;