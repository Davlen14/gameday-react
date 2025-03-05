import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import teamsService from "../services/teamsService";

const GameDetailView = () => {
  const { gameId } = useParams();
  const [game, setGame] = useState(null);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchGameData = async () => {
      try {
        const [gameData, teamsData] = await Promise.all([
          teamsService.getGameById(gameId),
          teamsService.getTeams(),
        ]);

        if (!gameData) throw new Error("Game not found");

        // Enhance game data with team colors
        const enhancedGame = {
          ...gameData,
          homeColor:
            teamsData.find((t) => t.school === gameData.homeTeam)?.color ||
            "#002244",
          awayColor:
            teamsData.find((t) => t.school === gameData.awayTeam)?.color ||
            "#008E97",
        };

        setGame(enhancedGame);
        setTeams(teamsData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchGameData();
  }, [gameId]);

  const getTeamLogo = (teamName) => {
    const team = teams.find(
      (t) => t.school.toLowerCase() === teamName?.toLowerCase()
    );
    return team?.logos?.[0] || "/photos/default_team.png";
  };

  const formatGameTime = (dateString) => {
    const options = {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    };
    return new Date(dateString).toLocaleString("en-US", options);
  };

  if (loading)
    return (
      <div className="loading-container">Loading game details...</div>
    );
  if (error) return <div className="error-container">Error: {error}</div>;
  if (!game) return <div className="error-container">Game not found</div>;

  // Determine the last play (if any)
  const lastPlay =
    Array.isArray(game.plays) && game.plays.length > 0
      ? game.plays[game.plays.length - 1]
      : null;

  return (
    <div className="game-detail-container">
      <div className="field-container">
        <div className="football-field">
          {/* Glassy overlay with game info */}
          <div className="game-info">
            <div className="score-display">
              <span className="team-score">
                <img
                  src={getTeamLogo(game.awayTeam)}
                  alt={game.awayTeam}
                  className="score-team-logo"
                />
                {game.awayTeam} <strong>{game.awayPoints}</strong>
              </span>
              <span className="score-separator">–</span>
              <span className="team-score">
                <img
                  src={getTeamLogo(game.homeTeam)}
                  alt={game.homeTeam}
                  className="score-team-logo"
                />
                {game.homeTeam} <strong>{game.homePoints}</strong>
              </span>
            </div>
            <div className="game-status">
              <span className="game-time">{formatGameTime(game.startDate)}</span>
              <span className="venue">{game.venue}</span>
            </div>
          </div>

          {/* Left Endzone */}
          <div className="endzone left" style={{ background: game.homeColor }}>
            <img
              src={getTeamLogo(game.homeTeam)}
              alt={game.homeTeam}
              className="endzone-logo"
            />
            <div className="endzone-label">{game.homeTeam}</div>
          </div>

          {/* Playing Field */}
          <div className="playing-field">
            {/* Yard Lines */}
            {[...Array(11)].map((_, i) => (
              <div
                key={i}
                className="yard-line"
                style={{ left: `${i * 10}%` }}
              ></div>
            ))}
            {/* Yard Numbers */}
            {[10, 20, 30, 40, 50, 40, 30, 20, 10].map((num, i) => (
              <div
                key={i}
                className="yard-number"
                style={{ left: `${(i + 1) * 10}%` }}
              >
                {num}
              </div>
            ))}

            {/* Center Logo */}
            <div className="center-logo">
              <img
                src={getTeamLogo(game.homeTeam)}
                alt={game.homeTeam}
              />
              <div className="field-overlay"></div>
            </div>

            {/* Ball Marker */}
            <div
              className="ball-marker"
              style={{ left: `${game.currentYardLine || 34}%`, top: "50%" }}
            >
              <div className="ball-shadow"></div>
            </div>
          </div>

          {/* Right Endzone */}
          <div className="endzone right" style={{ background: game.homeColor }}>
            <img
              src={getTeamLogo(game.homeTeam)}
              alt={game.homeTeam}
              className="endzone-logo"
            />
            <div className="endzone-label">{game.homeTeam}</div>
          </div>
        </div>

        {/* Game Details Panel */}
        <div className="game-details-panel">
          <div className="last-play">
            <h3>Last Play Details</h3>
            {lastPlay ? (
              <>
                <p>{lastPlay.playText}</p>
                <div className="last-play-stats">
                  <span>Down: {lastPlay.down}</span>
                  <span>Yards to Go: {lastPlay.yardsToGoal}</span>
                  <span>Possession: {game.possession || "N/A"}</span>
                </div>
              </>
            ) : (
              <p>No play information available</p>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        .game-detail-container {
          max-width: 1200px;
          margin: 2rem auto;
          padding: 20px;
        }

        .field-container {
          position: relative;
          background: rgba(0, 0, 0, 0.1);
          border-radius: 12px;
          padding: 20px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
          margin-top: 20px;
        }

        .football-field {
          position: relative;
          display: flex;
          width: 100%;
          height: 65vh;
          min-height: 500px;
          border: 4px solid #5d4a36;
        }

        /* Glassy overlay for game info */
        .game-info {
          position: absolute;
          top: 10px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 10;
          background: rgba(255, 255, 255, 0.15);
          border: 1px solid rgba(255, 255, 255, 0.3);
          border-radius: 12px;
          padding: 10px 20px;
          backdrop-filter: blur(10px);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 5px;
          color: white;
        }

        .score-display {
          display: flex;
          align-items: center;
          gap: 1rem;
          font-size: 1.5rem;
        }

        .team-score {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .score-team-logo {
          width: 30px;
          height: 30px;
          object-fit: contain;
          border-radius: 50%;
          border: 1px solid rgba(255, 255, 255, 0.5);
        }

        .score-separator {
          font-weight: bold;
          color: #ffd700;
        }

        .game-status {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          font-size: 0.9rem;
          opacity: 0.9;
        }

        .endzone {
          width: 8.33%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-transform: uppercase;
          color: white;
          text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
          padding: 5px;
        }

        .endzone-logo {
          width: 80px;
          height: 80px;
          object-fit: contain;
          filter: drop-shadow(2px 2px 4px rgba(0, 0, 0, 0.5));
        }

        .endzone-label {
          font-size: 0.6em;
          margin-top: 8px;
          text-align: center;
        }

        .playing-field {
          position: relative;
          width: 83.33%;
          height: 100%;
          background: linear-gradient(160deg, #1a472a, #2d5a27),
            repeating-linear-gradient(
              135deg,
              rgba(0, 0, 0, 0.1),
              rgba(0, 0, 0, 0.1) 10px,
              transparent 10px,
              transparent 20px
            );
        }

        .yard-line {
          position: absolute;
          top: 0;
          bottom: 0;
          width: 2px;
          background: rgba(255, 255, 255, 0.8);
        }

        .yard-number {
          position: absolute;
          bottom: 10px;
          color: white;
          font-size: 18px;
          font-weight: 700;
          text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
          transform: translateX(-50%);
        }

        .center-logo {
          position: absolute;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
          width: 150px;
          height: 150px;
          background: rgba(255, 255, 255, 0.9);
          border-radius: 50%;
          padding: 15px;
          box-shadow: 0 0 20px rgba(0, 0, 0, 0.3);
          z-index: 2;
        }

        .center-logo img {
          width: 100%;
          height: 100%;
          object-fit: contain;
        }

        .ball-marker {
          position: absolute;
          width: 20px;
          height: 20px;
          background: #ffd700;
          border-radius: 50%;
          transform: translate(-50%, -50%);
          box-shadow: 0 0 15px #ffd700;
          animation: pulse 1.5s infinite;
          z-index: 3;
        }

        .ball-shadow {
          position: absolute;
          width: 40px;
          height: 10px;
          background: rgba(0, 0, 0, 0.3);
          border-radius: 50%;
          bottom: -15px;
          left: 50%;
          transform: translateX(-50%);
          filter: blur(2px);
        }

        @keyframes pulse {
          0% {
            transform: translate(-50%, -50%) scale(0.95);
          }
          50% {
            transform: translate(-50%, -50%) scale(1.1);
          }
          100% {
            transform: translate(-50%, -50%) scale(0.95);
          }
        }

        .game-details-panel {
          display: grid;
          grid-template-columns: 1fr;
          gap: 2rem;
          margin-top: 2rem;
        }

        .last-play {
          padding: 1.5rem;
          background: rgba(0, 0, 0, 0.7);
          border-radius: 8px;
          color: white;
        }

        .last-play-stats {
          margin-top: 0.5rem;
          display: flex;
          gap: 1rem;
          font-weight: bold;
        }

        @media (max-width: 768px) {
          .football-field {
            flex-direction: column;
            height: auto;
          }
          .endzone {
            width: 100%;
            flex-direction: row;
            justify-content: center;
            gap: 10px;
          }
          .playing-field {
            width: 100%;
            height: 50vh;
            min-height: 400px;
          }
          .center-logo {
            width: 100px;
            height: 100px;
          }
          .endzone-logo {
            width: 50px;
            height: 50px;
          }
          .yard-number {
            font-size: 14px;
          }
          .game-details-panel {
            grid-template-columns: 1fr;
          }
        }

        .loading-container,
        .error-container {
          text-align: center;
          padding: 2rem;
          font-size: 1.2rem;
          color: white;
        }
      `}</style>
    </div>
  );
};

export default GameDetailView;