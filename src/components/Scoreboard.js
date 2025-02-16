import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import teamsService from "../services/teamsService";
import { FaTv } from "react-icons/fa";
import { useWeek } from "../context/WeekContext"; // ✅ Import global week state

const Scoreboard = () => {
  const { week, setWeek } = useWeek(); // ✅ Use global week state
  const [games, setGames] = useState([]);
  const [teams, setTeams] = useState([]);
  const [media, setMedia] = useState([]);
  const [lines, setLines] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch teams, games, media, and lines data for the selected week
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [teamsData, gamesData, mediaData, linesData] = await Promise.all([
          teamsService.getTeams(),
          teamsService.getGames(week),
          teamsService.getGameMedia(2024, week),
          teamsService.getGameLines(2024),
        ]);

        setTeams(teamsData);

        // Filter games to include only FBS vs. FBS
        const fbsGames = gamesData.filter(
          (game) =>
            game.homeClassification === "fbs" &&
            game.awayClassification === "fbs"
        );
        setGames(fbsGames);

        setMedia(mediaData);
        setLines(linesData);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [week]); // ✅ Uses global week state

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

  const getMediaForGame = (gameId) => {
    return media.find((m) => m.id === gameId) || null;
  };

  const getLinesForGame = (gameId) => {
    return lines.find((l) => l.id === gameId) || null;
  };

  // Helper to get sportsbook logo based on provider
  const getSportsbookLogo = (provider) => {
    const logos = {
      DraftKings: "/photos/draftkings.png",
      "ESPN Bet": "/photos/espnbet.png",
      Bovada: "/photos/bovada.png",
    };
    return logos[provider] || "/photos/default_sportsbook.png";
  };

  // Format the game time
  const formatGameTime = (game) => {
    if (game.completed) {
      return "Final";
    }
    if (game.startDate) {
      const dateObj = new Date(game.startDate);
      return dateObj.toLocaleString([], {
        weekday: "short",
        hour: "2-digit",
        minute: "2-digit",
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
          value={week} // ✅ Now using global week state
          onChange={(e) => setWeek(Number(e.target.value))} // ✅ Updates global state
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

          // Determine sportsbook line: DraftKings > ESPN Bet > Bovada
          const gameLines = getLinesForGame(game.id);
          let chosenLine = null;
          if (gameLines && gameLines.lines) {
            for (let provider of ["DraftKings", "ESPN Bet", "Bovada"]) {
              chosenLine = gameLines.lines.find(
                (line) => line.provider === provider
              );
              if (chosenLine) break;
            }
          }

          return (
            <Link
              to={`/games/${game.id}`}
              key={game.id}
              className="scoreboard-game-link"
            >
              <div className="scoreboard-game-card">
                {/* Row 1: Time (left) & TV (right) */}
                <div className="scoreboard-game-header">
                  <div className="scoreboard-game-time">{formatGameTime(game)}</div>
                  <div className="scoreboard-game-network">
                    <FaTv className="scoreboard-tv-icon" />
                    {tvNetwork && <span>{tvNetwork}</span>}
                  </div>
                </div>

                {/* Row 2: Away team */}
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

                {/* Row 3: Home team + O/U on the right */}
                <div className="scoreboard-home-row">
                  {/* Home team on the left */}
                  <div className="scoreboard-card-team scoreboard-home-team">
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

                  {/* O/U on the right (only if chosenLine exists) */}
                  {chosenLine && (
                    <div className="scoreboard-sportsbook scoreboard-home-ou">
                      <img
                        src={getSportsbookLogo(chosenLine.provider)}
                        alt={chosenLine.provider}
                        className="scoreboard-sportsbook-logo"
                      />
                      <span className="scoreboard-sportsbook-ou">
                        O/U: {chosenLine.overUnder}
                      </span>
                    </div>
                  )}
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



