import React, { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import teamsService from "../services/teamsService";
import { FaTv } from "react-icons/fa";
import { useWeek } from "../context/WeekContext";

const Scoreboard = ({ setScoreboardVisible }) => {
  const { week } = useWeek(); // Keep the context but don't use setWeek
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
        // Always use postseason parameter regardless of week context
        const queryParam = { seasonType: "postseason" };

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

        // Sort postseason games by date
        const sortedGames = fbsGames.sort(
          (a, b) => new Date(a.startDate) - new Date(b.startDate)
        );

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
  }, []); // Removed week dependency since we're always showing postseason

  // MODIFIED THIS SECTION - The intersection observer was causing navbar issues
  useEffect(() => {
    // Only set up the observer if setScoreboardVisible is provided
    if (typeof setScoreboardVisible === 'function') {
      // Initialize as visible by default
      setScoreboardVisible(true);
      
      const observer = new IntersectionObserver(
        ([entry]) => {
          // Only handle scoreboard visibility, don't affect other nav elements
          if (entry.target === scoreboardRef.current) {
            setScoreboardVisible(entry.isIntersecting);
          }
        },
        { 
          root: null, 
          threshold: 0.1, // Slightly higher threshold to prevent flickering
          rootMargin: "0px 0px 0px 0px" // Default margin
        }
      );

      if (scoreboardRef.current) {
        observer.observe(scoreboardRef.current);
      }
      
      return () => {
        if (scoreboardRef.current) {
          observer.unobserve(scoreboardRef.current);
          // Reset to visible when component unmounts
          setScoreboardVisible(true);
        }
      };
    }
  }, [setScoreboardVisible]);

  // Helper functions
  const getTeamLogo = (teamName) => {
    const team = teams.find(
      (t) => t.school?.toLowerCase() === teamName?.toLowerCase()
    );
    return team?.logos?.[0] || "/photos/default_team.png";
  };

  const getTeamAbbreviation = (teamName) => {
    const team = teams.find(
      (t) => t.school?.toLowerCase() === teamName?.toLowerCase()
    );
    return team?.abbreviation || teamName;
  };

  const getMediaForGame = (gameId) =>
    media.find((m) => m.id === gameId) || null;

  // Render placeholder cards for loading state
  const renderPlaceholderCards = () => {
    return Array(8)
      .fill(0)
      .map((_, index) => (
        <div key={`placeholder-${index}`} className="scoreboard-placeholder-card"></div>
      ));
  };

  // If there's an error, render error message
  if (error) {
    return (
      <div className="scoreboard-bar" ref={scoreboardRef}>
        <div className="error-container">
          Error loading scoreboard: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="scoreboard-bar" ref={scoreboardRef}>
      {/* Removed the filters section (NCAAF + Week Selector) */}
      
      {/* Scrollable list of games with loading state */}
      <div className="scoreboard-games">
        {isLoading ? (
          <>
            {/* Show loading spinner */}
            <div className="scoreboard-loading">
              <div className="scoreboard-spinner"></div>
            </div>
            {/* Show placeholder cards while loading */}
            {renderPlaceholderCards()}
          </>
        ) : games.length > 0 ? (
          games.map((game) => {
            const isFinal = game.completed;
            const mediaInfo = getMediaForGame(game.id);

            return (
              <Link
                to={`/games/${game.id}`}
                key={game.id}
                className="scoreboard-game-link"
              >
                <div className="scoreboard-game-card">
                  {/* Top row: status + TV outlet */}
                  <div className="scoreboard-game-header">
                    <div
                      className={`scoreboard-game-time ${isFinal ? "final" : ""}`}
                    >
                      {isFinal ? "Final" : "Live"}
                    </div>
                    <div className="scoreboard-game-network">
                      {/* Put the outlet first, then the TV icon */}
                      {mediaInfo?.outlet && (
                        <span className="scoreboard-tv-outlet">
                          {mediaInfo.outlet}
                        </span>
                      )}
                      <FaTv className="scoreboard-tv-icon" />
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
          })
        ) : (
          <div className="no-games-message">No postseason games available</div>
        )}
      </div>
    </div>
  );
};

export default Scoreboard;