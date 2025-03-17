import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import teamsService from "../services/teamsService";
import graphqlTeamsService from "../services/graphqlTeamsService";

const GameDetailView = () => {
  const { gameId } = useParams();
  const [game, setGame] = useState(null);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Play-by-play simulation states
  const [plays, setPlays] = useState([]);
  const [currentPlayIndex, setCurrentPlayIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playSpeed, setPlaySpeed] = useState(1000); // milliseconds between plays
  const playIntervalRef = useRef(null);
  const [ballPosition, setBallPosition] = useState(50); // Default to midfield (50%)
  const [possession, setPossession] = useState(null);

  useEffect(() => {
    const fetchGameData = async () => {
      try {
        console.log("Fetching game data for game:", gameId);
        // Modified the third call to use teamsService.getMetricsWP(gameId)
        const [gameData, teamsData, playsData] = await Promise.all([
          teamsService.getGameById(gameId),
          teamsService.getTeams(),
          teamsService.getMetricsWP(gameId) // Previously used graphqlTeamsService.getMetricsWP(gameId)
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
        
        // Filter out duplicate play numbers for the play-by-play
        if (playsData && playsData.length > 0) {
          const uniquePlays = [];
          const playNumbersSeen = {};
          playsData.forEach(play => {
            if (!playNumbersSeen[play.playNumber]) {
              playNumbersSeen[play.playNumber] = true;
              uniquePlays.push(play);
            }
          });
          setPlays(uniquePlays);
          
          // Set initial possession
          if (uniquePlays.length > 0) {
            setPossession(uniquePlays[0].homeBall ? "home" : "away");
            
            // Calculate initial ball position from yardLine
            const initialYardLine = uniquePlays[0].yardLine;
            // Convert yard line to percentage (0-100) for field position
            setBallPosition(calculateBallPosition(initialYardLine, uniquePlays[0].homeBall));
          }
        }
      } catch (err) {
        console.error("Error fetching game data:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchGameData();
    
    // Cleanup
    return () => {
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current);
      }
    };
  }, [gameId]);
  
  // Helper to calculate ball position percentage on the field
  const calculateBallPosition = (yardLine, isHomeBall) => {
    // Convert the yard line to a percentage position on the field (0-100)
    if (isHomeBall) {
      // If home has the ball, 0 is their own goal line, 100 is opponent's
      return yardLine;
    } else {
      // If away has the ball, 100 is home's goal line, 0 is away's
      return 100 - yardLine;
    }
  };

  // Start or stop the play-by-play simulation
  const togglePlaySimulation = () => {
    if (isPlaying) {
      // Stop the simulation
      clearInterval(playIntervalRef.current);
      setIsPlaying(false);
    } else {
      // Start or resume the simulation
      setIsPlaying(true);
      playIntervalRef.current = setInterval(() => {
        setCurrentPlayIndex(prevIndex => {
          const nextIndex = prevIndex + 1;
          if (nextIndex >= plays.length) {
            // End of plays, stop the simulation
            clearInterval(playIntervalRef.current);
            setIsPlaying(false);
            return prevIndex; // Stay on last play
          }
          
          // Update ball position and possession for the next play
          const nextPlay = plays[nextIndex];
          setPossession(nextPlay.homeBall ? "home" : "away");
          setBallPosition(calculateBallPosition(nextPlay.yardLine, nextPlay.homeBall));
          
          return nextIndex;
        });
      }, playSpeed);
    }
  };
  
  // Reset the simulation to the beginning
  const resetSimulation = () => {
    clearInterval(playIntervalRef.current);
    setIsPlaying(false);
    setCurrentPlayIndex(0);
    
    // Reset ball and possession to initial state
    if (plays.length > 0) {
      setPossession(plays[0].homeBall ? "home" : "away");
      setBallPosition(calculateBallPosition(plays[0].yardLine, plays[0].homeBall));
    }
  };
  
  // Skip to the end of the simulation
  const skipToEnd = () => {
    clearInterval(playIntervalRef.current);
    setIsPlaying(false);
    
    if (plays.length > 0) {
      const lastIndex = plays.length - 1;
      setCurrentPlayIndex(lastIndex);
      
      // Set final ball position and possession
      setPossession(plays[lastIndex].homeBall ? "home" : "away");
      setBallPosition(calculateBallPosition(plays[lastIndex].yardLine, plays[lastIndex].homeBall));
    }
  };
  
  // Change the simulation speed
  const changeSpeed = (newSpeed) => {
    setPlaySpeed(newSpeed);
    
    // Restart the interval if currently playing
    if (isPlaying) {
      clearInterval(playIntervalRef.current);
      playIntervalRef.current = setInterval(() => {
        setCurrentPlayIndex(prevIndex => {
          const nextIndex = prevIndex + 1;
          if (nextIndex >= plays.length) {
            clearInterval(playIntervalRef.current);
            setIsPlaying(false);
            return prevIndex;
          }
          
          const nextPlay = plays[nextIndex];
          setPossession(nextPlay.homeBall ? "home" : "away");
          setBallPosition(calculateBallPosition(nextPlay.yardLine, nextPlay.homeBall));
          
          return nextIndex;
        });
      }, newSpeed);
    }
  };
  
  // Skip to a specific play
  const skipToPlay = (index) => {
    if (index >= 0 && index < plays.length) {
      clearInterval(playIntervalRef.current);
      setIsPlaying(false);
      setCurrentPlayIndex(index);
      
      const play = plays[index];
      setPossession(play.homeBall ? "home" : "away");
      setBallPosition(calculateBallPosition(play.yardLine, play.homeBall));
    }
  };

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
  
  // Format down number as a string (1st, 2nd, 3rd, 4th)
  const formatDown = (down) => {
    if (!down) return "N/A";
    
    switch (down) {
      case 1: return "1st Down";
      case 2: return "2nd Down";
      case 3: return "3rd Down";
      case 4: return "4th Down";
      default: return `${down}th Down`;
    }
  };

  if (loading)
    return (
      <div className="loading-container">Loading game details...</div>
    );
  if (error) return <div className="error-container">Error: {error}</div>;
  if (!game) return <div className="error-container">Game not found</div>;

  // Get current play details
  const currentPlay = plays.length > 0 ? plays[currentPlayIndex] : null;
  
  // Calculate home and away scores for current play
  const homeScore = currentPlay ? currentPlay.homeScore : game.homePoints || 0;
  const awayScore = currentPlay ? currentPlay.awayScore : game.awayPoints || 0;

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
                {game.awayTeam} <strong>{awayScore}</strong>
              </span>
              <span className="score-separator">–</span>
              <span className="team-score">
                <img
                  src={getTeamLogo(game.homeTeam)}
                  alt={game.homeTeam}
                  className="score-team-logo"
                />
                {game.homeTeam} <strong>{homeScore}</strong>
              </span>
            </div>
            <div className="game-status">
              <span className="game-time">{formatGameTime(game.startDate)}</span>
              <span className="venue">{game.venue}</span>
            </div>
          </div>

          {/* Left Endzone */}
          <div className="endzone left" style={{ background: game.awayColor }}>
            <img
              src={getTeamLogo(game.awayTeam)}
              alt={game.awayTeam}
              className="endzone-logo"
            />
            <div className="endzone-label">{game.awayTeam}</div>
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

            {/* Ball Marker - Updated to use simulated position and show possession team logo */}
            <div
              className="ball-marker"
              style={{ left: `${ballPosition}%`, top: "50%" }}
            >
              {/* Possession logo above ball */}
              {possession && (
                <div className="possession-indicator">
                  <img 
                    src={getTeamLogo(possession === "home" ? game.homeTeam : game.awayTeam)} 
                    alt="Possession" 
                  />
                </div>
              )}
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

        {/* Playback Controls */}
        <div className="playback-controls">
          <button 
            className="control-button" 
            onClick={resetSimulation}
            disabled={currentPlayIndex === 0 && !isPlaying}
            title="Restart"
          >
            ⏮
          </button>
          <button 
            className="control-button" 
            onClick={togglePlaySimulation}
            disabled={plays.length === 0 || currentPlayIndex >= plays.length - 1}
            title={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? "⏸" : "▶"}
          </button>
          <button 
            className="control-button" 
            onClick={skipToEnd}
            disabled={plays.length === 0 || currentPlayIndex >= plays.length - 1}
            title="Skip to End"
          >
            ⏭
          </button>
          <div className="speed-controls">
            <span>Speed:</span>
            <select 
              value={playSpeed} 
              onChange={(e) => changeSpeed(Number(e.target.value))}
              className="speed-select"
            >
              <option value="2000">Slow</option>
              <option value="1000">Normal</option>
              <option value="500">Fast</option>
              <option value="100">Very Fast</option>
            </select>
          </div>
          <div className="progress-indicator">
            Play: {currentPlayIndex + 1} / {plays.length}
          </div>
        </div>

        {/* Game Details Panel */}
        <div className="game-details-panel">
          <div className="last-play">
            <h3>Current Play Details</h3>
            {currentPlay ? (
              <>
                <p className="play-text">{currentPlay.playText}</p>
                <div className="play-stats">
                  <div className="stat-row">
                    <span className="stat-label">Down:</span>
                    <span className="stat-value">{formatDown(currentPlay.down)}</span>
                  </div>
                  <div className="stat-row">
                    <span className="stat-label">Distance:</span>
                    <span className="stat-value">{currentPlay.distance} yards</span>
                  </div>
                  <div className="stat-row">
                    <span className="stat-label">Possession:</span>
                    <span className="stat-value">
                      {currentPlay.homeBall ? game.homeTeam : game.awayTeam}
                      <img 
                        src={getTeamLogo(currentPlay.homeBall ? game.homeTeam : game.awayTeam)} 
                        alt="Team" 
                        className="possession-logo"
                      />
                    </span>
                  </div>
                  <div className="stat-row">
                    <span className="stat-label">Win Probability:</span>
                    <div className="probability-bars">
                      <div className="team-prob">
                        <span>{game.homeTeam}</span>
                        <div className="prob-bar-container">
                          <div 
                            className="prob-bar" 
                            style={{ 
                              width: `${(currentPlay.homeWinProbability * 100).toFixed(1)}%`,
                              backgroundColor: game.homeColor
                            }}
                          ></div>
                        </div>
                        <span>{(currentPlay.homeWinProbability * 100).toFixed(1)}%</span>
                      </div>
                      <div className="team-prob">
                        <span>{game.awayTeam}</span>
                        <div className="prob-bar-container">
                          <div 
                            className="prob-bar" 
                            style={{ 
                              width: `${(100 - currentPlay.homeWinProbability * 100).toFixed(1)}%`,
                              backgroundColor: game.awayColor
                            }}
                          ></div>
                        </div>
                        <span>{(100 - currentPlay.homeWinProbability * 100).toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>
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
  max-width: 90%;
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

/* Glassy overlay for game info - size kept as is */
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
  width: 24px;
  height: 12px;
  background: #8B4513;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  box-shadow: 0 0 15px rgba(0, 0, 0, 0.5);
  animation: pulse 1.5s infinite;
  z-index: 3;
  transition: left 0.5s ease-in-out;
}

.possession-indicator {
  position: absolute;
  width: 32px;
  height: 32px;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(255, 255, 255, 0.9);
  border-radius: 50%;
  padding: 4px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
}

.possession-indicator img {
  width: 100%;
  height: 100%;
  object-fit: contain;
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

.playback-controls {
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 16px 0;
  padding: 12px;
  background: white;
  border-radius: 8px;
  gap: 16px;
  color: black;
}

.control-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 8px;
  border: none;
  background: rgba(0, 0, 0, 0.1);
  color: black;
  font-size: 1.2rem;
  cursor: pointer;
  transition: all 0.2s;
}

.control-button:hover:not(:disabled) {
  background: rgba(0, 0, 0, 0.2);
  transform: scale(1.05);
}

.control-button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.speed-controls {
  display: flex;
  align-items: center;
  margin-left: 8px;
  gap: 8px;
  color: black;
}

.speed-controls span {
  font-size: 0.9rem;
}

.speed-select {
  padding: 4px 8px;
  border-radius: 4px;
  border: 1px solid rgba(0, 0, 0, 0.3);
  background: rgba(0, 0, 0, 0.05);
  color: black;
  font-size: 0.9rem;
}

.progress-indicator {
  margin-left: auto;
  padding: 4px 10px;
  background: rgba(0, 0, 0, 0.05);
  border-radius: 8px;
  font-size: 0.85rem;
  color: black;
}

.game-details-panel {
  display: grid;
  grid-template-columns: 1fr;
  gap: 2rem;
  margin-top: 1rem;
}

.last-play {
  padding: 1.5rem;
  background: white;
  border-radius: 8px;
  color: black;
}

.play-text {
  font-size: 1.1rem;
  line-height: 1.5;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.2);
}

.play-stats {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.stat-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.stat-label {
  font-weight: 600;
  min-width: 100px;
  color: rgba(0, 0, 0, 0.7);
}

.stat-value {
  font-weight: 400;
  display: flex;
  align-items: center;
  gap: 8px;
}

.possession-logo {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  object-fit: contain;
  background: rgba(255, 255, 255, 0.9);
  padding: 2px;
}

.probability-bars {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
}

.team-prob {
  display: flex;
  align-items: center;
  gap: 8px;
}

.team-prob span {
  min-width: 80px;
  font-size: 0.9rem;
}

.team-prob span:last-child {
  min-width: 50px;
  text-align: right;
}

.prob-bar-container {
  flex: 1;
  height: 12px;
  background: rgba(0, 0, 0, 0.1);
  border-radius: 6px;
  overflow: hidden;
}

.prob-bar {
  height: 100%;
  transition: width 0.5s ease-in-out;
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
  .playback-controls {
    flex-wrap: wrap;
  }
  .progress-indicator {
    margin: 8px 0 0;
    width: 100%;
    text-align: center;
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
