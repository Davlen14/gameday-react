import React, { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import teamsService from "../services/teamsService";
import { FaTv } from "react-icons/fa";
import { useWeek } from "../context/WeekContext"; // ✅ Import global week state

const Scoreboard = ({ setScoreboardVisible }) => {
  const { week, setWeek } = useWeek();
  const [games, setGames] = useState([]);
  const [teams, setTeams] = useState([]);
  const [media, setMedia] = useState([]);
  const [lines, setLines] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const scoreboardRef = useRef(null); // ✅ Track visibility

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const queryParam =
          week === "postseason" ? { seasonType: "postseason" } : week;

        const [teamsData, gamesData, mediaData, linesData] = await Promise.all([
          teamsService.getTeams(),
          teamsService.getGames(queryParam),
          teamsService.getGameMedia(2024, queryParam),
          teamsService.getGameLines(2024),
        ]);

        setTeams(teamsData);

        // Filter for FBS vs. FBS games
        const fbsGames = gamesData.filter(
          (game) =>
            game.homeClassification === "fbs" &&
            game.awayClassification === "fbs"
        );

        // Sort if postseason
        const sortedGames =
          week === "postseason"
            ? fbsGames.sort(
                (a, b) => new Date(a.startDate) - new Date(b.startDate)
              )
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

  // Intersection Observer to detect if scoreboard is visible
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

  // Helper functions
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
      {/* Filters on the left (NCAAF + Week Selector) */}
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

      {/* Scrollable list of games */}
      <div className="scoreboard-games">
        {games.map((game) => {
          const isFinal = game.completed;
          const mediaInfo = getMediaForGame(game.id);

          return (
            <Link
              to={`/games/${game.id}`}
              key={game.id}
              className="scoreboard-game-link"
            >
              <div className="scoreboard-game-card">
                {/* Top row: status + TV network */}
                <div className="scoreboard-game-header">
                  <div
                    className={`scoreboard-game-time ${isFinal ? "final" : ""}`}
                  >
                    {isFinal ? "Final" : "Live"}
                  </div>
                  <div className="scoreboard-game-network">
                    <FaTv className="scoreboard-tv-icon" />
                    {mediaInfo?.network && <span>{mediaInfo.network}</span>}
                  </div>
                </div>

                {/* Away Team Row */}
                <div className="scoreboard-card-team">
                  <div className="scoreboard-team-info">
                    <img
                      src={getTeamLogo(game.awayTeam)}
                      alt={game.awayTeam}
                      className="scoreboard-team-logo"
                    />
                    <span className="scoreboard-team-name">
                      {getTeamAbbreviation(game.awayTeam)}
                    </span>
                  </div>
                  <span className="scoreboard-team-score">
                    {game.awayPoints ?? ""}
                  </span>
                </div>

                {/* Home Team Row */}
                <div className="scoreboard-card-team">
                  <div className="scoreboard-team-info">
                    <img
                      src={getTeamLogo(game.homeTeam)}
                      alt={game.homeTeam}
                      className="scoreboard-team-logo"
                    />
                    <span className="scoreboard-team-name">
                      {getTeamAbbreviation(game.homeTeam)}
                    </span>
                  </div>
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