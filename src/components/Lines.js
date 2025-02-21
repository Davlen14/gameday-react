import React, { useEffect, useState } from "react";
import teamsService from "../services/teamsService";
import "../styles/Lines.css"; // Your custom CSS file

// Modern SVG Components
const CheckIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="12" fill="#00C853" />
    <path d="M7 12l3 3 6-6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const CrossIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="12" fill="#D50000" />
    <path d="M7 7l10 10M17 7l-10 10" stroke="white" strokeWidth="2" strokeLinecap="round" />
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

        if (teams.length === 0) {
          const teamsData = await teamsService.getTeams();
          setTeams(teamsData);
        }

        const response = await teamsService.getGameLines(2024, null, "regular");
        setLines(response.sort((a, b) => a.week - b.week)); // Sort games by week
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [teams.length]);

  const getTeamAbbreviation = (teamName) => {
    const team = teams.find((t) => t.school.toLowerCase() === teamName.toLowerCase());
    return team ? team.abbreviation : teamName;
  };

  const getSportsbookLogo = (provider) => {
    const logos = {
      "DraftKings": "/photos/draftkings.png",
      "ESPN Bet": "/photos/espnbet.png",
      "Bovada": "/photos/bovada.png",
    };
    return logos[provider] || "/photos/default_sportsbook.png";
  };

  const hasCoveredSpread = (spread, homeScore, awayScore, homeTeam) => {
    const actualMargin = homeScore - awayScore;
    return spread < 0 ? actualMargin > Math.abs(spread) : actualMargin < spread;
  };

  const hasCoveredOverUnder = (overUnder, homeScore, awayScore) => {
    return homeScore + awayScore > overUnder;
  };

  if (isLoading) return <div className="lines-loading">Loading lines for 2024...</div>;
  if (error) return <div className="lines-error">Error: {error}</div>;
  if (lines.length === 0) return <p className="lines-none">No lines data available for 2024.</p>;

  return (
    <div className="lines-page">
      <h1 className="lines-title">2024 Betting Odds</h1>

      {lines.map((game) => (
        <div key={game.id} className="lines-card">
          {/* Game Header */}
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
                      <span className="metric-label">Spread: {line.spread ?? "N/A"}</span>
                      <span className="status">
                        {hasCoveredSpread(line.spread, game.homeScore, game.awayScore, game.homeTeam) ? (
                          <><CheckIcon /> Covered!</>
                        ) : (
                          <><CrossIcon /> Not Covered!</>
                        )}
                      </span>
                    </span>
                    <span className="over-under">
                      <span className="metric-label">O/U: {line.overUnder ?? "N/A"}</span>
                      <span className="status">
                        {hasCoveredOverUnder(line.overUnder, game.homeScore, game.awayScore) ? (
                          <><CheckIcon /> Over!</>
                        ) : (
                          <><CrossIcon /> Under!</>
                        )}
                      </span>
                    </span>
                    <span className="moneyline">
                      <span className="metric-label">
                        {getTeamAbbreviation(game.homeTeam)} ML: {line.homeMoneyline ?? "N/A"}
                      </span>
                      <span className="status">
                        {game.homeScore > game.awayScore ? (
                          <><CheckIcon /> Won!</>
                        ) : (
                          <><CrossIcon /> Lost!</>
                        )}
                      </span>
                    </span>
                    <span className="moneyline">
                      <span className="metric-label">
                        {getTeamAbbreviation(game.awayTeam)} ML: {line.awayMoneyline ?? "N/A"}
                      </span>
                      <span className="status">
                        {game.awayScore > game.homeScore ? (
                          <><CheckIcon /> Won!</>
                        ) : (
                          <><CrossIcon /> Lost!</>
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