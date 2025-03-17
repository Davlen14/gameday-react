import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import teamsService from "../services/teamsService";
import graphqlTeamsService from "../services/graphqlTeamsService";
import "../styles/GameDetailView.css";

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
    </div>
  );
};

export default GameDetailView;