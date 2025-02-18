import React, { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import teamsService from "../services/teamsService";
import { FaTv } from "react-icons/fa";
import { useWeek } from "../context/WeekContext";

const Scoreboard = ({ setScoreboardVisible }) => {
  const { week, setWeek } = useWeek();
  const [games, setGames] = useState([]);
  const [teams, setTeams] = useState([]);
  const [media, setMedia] = useState([]);
  const [lines, setLines] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const scoreboardRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const queryParam = week === "postseason" ? { seasonType: "postseason" } : week;
        const [teamsData, gamesData, mediaData, linesData] = await Promise.all([
          teamsService.getTeams(),
          teamsService.getGames(queryParam),
          teamsService.getGameMedia(2024, queryParam),
          teamsService.getGameLines(2024),
        ]);

        setTeams(teamsData);
        const fbsGames = gamesData.filter(
          (game) => game.homeClassification === "fbs" && game.awayClassification === "fbs"
        );

        const sortedGames =
          week === "postseason"
            ? fbsGames.sort((a, b) => new Date(a.startDate) - new Date(b.startDate))
            : fbsGames;
        setGames(sortedGames);

        setMedia(mediaData);
        setLines(linesData);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [week]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setScoreboardVisible(entry.isIntersecting);
      },
      { root: null, threshold: 0 }
    );

    if (scoreboardRef.current) {
      observer.observe(scoreboardRef.current);
    }
    return () => {
      if (scoreboardRef.current) {
        observer.unobserve(scoreboardRef.current);
      }
    };
  }, [setScoreboardVisible]);

  const getTeamLogo = (teamName) => {
    const team = teams.find((t) => t.school.toLowerCase() === teamName?.toLowerCase());
    return team?.logos?.[0] || "/photos/default_team.png";
  };

  const getTeamAbbreviation = (teamName) => {
    const team = teams.find((t) => t.school.toLowerCase() === teamName?.toLowerCase());
    return team?.abbreviation || teamName;
  };

  const getMediaForGame = (gameId) => media.find((m) => m.id === gameId) || null;
  const getLinesForGame = (gameId) => lines.find((l) => l.id === gameId) || null;

  if (isLoading) {
    return <div className="loading-container">Loading...</div>;
  }
  if (error) {
    return <div className="error-container">Error: {error}</div>;
  }

  return (
    <div className="scoreboard-bar" ref={scoreboardRef}>
      <div className="scoreboard-filters">
        <span className="scoreboard-ncaaf-dropdown">NCAAF</span>
        <div className="scoreboard-divider" />
        <select
          id="weekSelect"
          className="scoreboard-week-dropdown"
          value={week}
          onChange={(e) => setWeek(e.target.value)}
        >
          {[...Array(17).keys()].map((w) => (
            <option key={w + 1} value={w + 1}>{`Week ${w + 1}`}</option>
          ))}
          <option value="postseason">Postseason</option>
        </select>
      </div>
      <div className="scoreboard-games">
        {games.map((game) => {
          const gameLines = getLinesForGame(game.id);
          let chosenLine = null;
          if (gameLines && gameLines.lines) {
            for (let provider of ["DraftKings", "ESPN Bet", "Bovada"]) {
              chosenLine = gameLines.lines.find((line) => line.provider === provider);
              if (chosenLine) break;
            }
          }

          return (
            <Link to={`/games/${game.id}`} key={game.id} className="scoreboard-game-link">
              <div className="scoreboard-game-card">
                <div className="scoreboard-game-header">
                  <div className="scoreboard-game-time">{game.completed ? "Final" : "Live"}</div>
                </div>
                <div className="scoreboard-card-team">
                  <img src={getTeamLogo(game.awayTeam)} alt={game.awayTeam} className="scoreboard-team-logo" />
                  <span className="scoreboard-team-name">{getTeamAbbreviation(game.awayTeam)}</span>
                  <span className="scoreboard-team-score">{game.awayPoints ?? ""}</span>
                </div>
                <div className="scoreboard-home-row">
                  <div className="scoreboard-card-team scoreboard-home-team">
                    <img src={getTeamLogo(game.homeTeam)} alt={game.homeTeam} className="scoreboard-team-logo" />
                    <span className="scoreboard-team-name">{getTeamAbbreviation(game.homeTeam)}</span>
                    <span className="scoreboard-team-score">{game.homePoints ?? ""}</span>
                  </div>
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






