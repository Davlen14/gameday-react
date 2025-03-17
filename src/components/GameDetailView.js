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
  const [ballPosition, setBallPosition] = useState(50); // 0 = away end zone, 100 = home end zone
  const [possession, setPossession] = useState(null);
  
  // Enhancement states
  const [showFireworks, setShowFireworks] = useState(false);
  const [touchdownTeam, setTouchdownTeam] = useState(null);
  const [touchdownPath, setTouchdownPath] = useState(null);
  const [touchdownYards, setTouchdownYards] = useState(0);
  const [isRedzone, setIsRedzone] = useState(false);
  const [showQuarterSummary, setShowQuarterSummary] = useState(false);
  const [currentQuarter, setCurrentQuarter] = useState(1);
  const [gameCompleted, setGameCompleted] = useState(false);
  const [bigPlay, setBigPlay] = useState(null);
  
  // Field position display
  const [fieldPosition, setFieldPosition] = useState("");

  /**
   *  Helper: figure out if a given team name is the home or away team in the game.
   *  Return "home", "away", or null if unknown.
   */
  const getTeamSide = (teamName) => {
    if (!game) return null;
    const normalized = (teamName || "").toLowerCase().trim();
    const homeLower = (game.homeTeam || "").toLowerCase().trim();
    const awayLower = (game.awayTeam || "").toLowerCase().trim();

    if (normalized === homeLower) return "home";
    if (normalized === awayLower) return "away";

    return null;
  };

  /**
   *  Convert any team name into a short abbreviation (for display).
   *  You can customize this further for more teams if needed.
   */
  const abbreviateTeamName = (fullName) => {
    if (!fullName) return "";
    // Quick examples for OSU/Indiana, else just return the first word or do a more advanced approach
    if (fullName.toLowerCase().includes("ohio state")) return "OSU";
    if (fullName.toLowerCase().includes("indiana")) return "IU";
    // Fallback: take the first word, up to e.g. 3 or 4 letters
    const firstWord = fullName.split(" ")[0];
    return firstWord.length > 4 ? firstWord.slice(0, 4).toUpperCase() : firstWord.toUpperCase();
  };

  /**
   *  parseYardLine:
   *    - Looks for "to the <team> <yard>" in playText.
   *    - Decides if <team> is the home or away team.
   *    - If <team> is home => universal yard line = 100 - <yard>.
   *    - If <team> is away => universal yard line = <yard>.
   */
  const parseYardLine = (playText) => {
    // Regex: capture "to the" + any team word(s) + yard number
    // Example: "to the Ohio State 23", "to the OSU 20", etc.
    // This will capture everything after "to the" up until the last number.
    const regex = /to the\s+(.+?)\s+(\d+)\b/i;
    const match = playText.match(regex);
    if (!match) return null;

    const teamNameRaw = match[1].trim();  // e.g. "Ohio State" or "OSU" or "Indiana"
    const yardNumber = parseInt(match[2], 10);

    if (isNaN(yardNumber)) return null;
    if (!teamNameRaw) return null;

    // Figure out if that team is home or away
    const side = getTeamSide(teamNameRaw);

    if (side === "home") {
      return 100 - yardNumber;
    } else if (side === "away") {
      return yardNumber;
    } 
    // If we can't identify side, return null
    return null;
  };

  /**
   *  Extract a "universal" yard line (0..100) from a play.
   *    - If the play has a direct yardLine field, use that, but interpret it:
   *         if homeBall => universal = 100 - yardLine? or yardLine?
   *         Actually, if the game data sets yardLine as "yards from home" or "yards from away"? 
   *         This can vary by data source, so let's rely on parseYardLine if possible.
   *    - If no direct yardLine, parse from playText. 
   *    - If parse fails, fallback to 50 (midfield).
   */
  const extractYardLine = (play) => {
    // Try parse from text
    const parsed = parseYardLine(play.playText || "");
    if (parsed !== null) {
      return Math.max(0, Math.min(100, parsed)); // clamp 0..100
    }

    // If there's a yardLine numeric in the data (some CFBD APIs store yardLine as "yards from the away team"?)
    // We can interpret if the ball belongs to home or away, but that depends on your data definitions.
    if (play.yardLine !== undefined && play.yardLine !== null) {
      // If "yardLine" in data means "distance from the away end zone," we can use it directly.
      // If the team with possession is away => yardLine is correct.
      // If the team with possession is home => universal = 100 - yardLine
      if (play.homeBall) {
        return Math.max(0, Math.min(100, 100 - play.yardLine));
      } else {
        return Math.max(0, Math.min(100, play.yardLine));
      }
    }

    // Fallback
    return 50;
  };

  // Format field position (e.g., "OSU 35")
  // We'll invert if needed: if the universal yard line is "80", that means it's the home team's 20.
  // So if the ball is at 80 and the home team is OSU, that means OSU is at OSU 20.
  const formatFieldPosition = (universalYardLine, isHomeBall) => {
    if (!game) return "";
    const teamName = isHomeBall ? game.homeTeam : game.awayTeam;
    const teamAbbr = abbreviateTeamName(teamName);

    // If home has the ball, "universal" yard line 80 => that means 20 yards from home end zone
    // yardFromHome = 100 - universal
    // yardFromAway = universal
    let yardNumber = 0;
    if (isHomeBall) {
      yardNumber = 100 - universalYardLine;
    } else {
      yardNumber = universalYardLine;
    }
    return `${teamAbbr} ${yardNumber}`;
  };

  // Check for redzone
  const checkForRedzone = (universalYardLine, isHomeBall) => {
    // If home has the ball, a universal yard line >= 80 => inside the opponent's 20
    // If away has the ball, a universal yard line <= 20 => inside the opponent's 20
    if (isHomeBall && universalYardLine >= 80) {
      setIsRedzone(true);
    } else if (!isHomeBall && universalYardLine <= 20) {
      setIsRedzone(true);
    } else {
      setIsRedzone(false);
    }
  };

  const fetchGameData = async () => {
    try {
      console.log("Fetching game data for game:", gameId);
      const [gameData, teamsData, playsData] = await Promise.all([
        teamsService.getGameById(gameId),
        teamsService.getTeams(),
        teamsService.getMetricsWP(gameId)
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

      if (playsData && playsData.length > 0) {
        const uniquePlays = [];
        const playNumbersSeen = {};
        playsData.forEach((p) => {
          if (!playNumbersSeen[p.playNumber]) {
            playNumbersSeen[p.playNumber] = true;
            uniquePlays.push(p);
          }
        });

        setPlays(uniquePlays);

        // Initialize
        if (uniquePlays.length > 0) {
          const firstPlay = uniquePlays[0];
          setPossession(firstPlay.homeBall ? "home" : "away");

          const yard = extractYardLine(firstPlay);
          setBallPosition(yard);
          setFieldPosition(formatFieldPosition(yard, firstPlay.homeBall));
          setCurrentQuarter(firstPlay.period || 1);

          if (uniquePlays[uniquePlays.length - 1].period >= 4) {
            setGameCompleted(true);
          }
        }
      }
    } catch (err) {
      console.error("Error fetching game data:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGameData();
    return () => {
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current);
      }
    };
  }, [gameId]);

  // checkForTouchdown
  const checkForTouchdown = (currentPlay, nextPlay) => {
    if (!currentPlay || !nextPlay) return false;

    // If home team just scored
    if (nextPlay.homeScore > currentPlay.homeScore &&
        nextPlay.homeScore - currentPlay.homeScore >= 6) {
      setTouchdownTeam("home");
      setShowFireworks(true);

      // Start yard (universal)
      const startYard = extractYardLine(currentPlay);
      // If home scores, that means they reached yard line 100
      const scoringYards = 100 - startYard;
      setTouchdownYards(scoringYards);

      setTouchdownPath({
        team: "home",
        startPosition: startYard,
        endPosition: 100
      });
      setBallPosition(100);

      setTimeout(() => {
        setShowFireworks(false);
        setTouchdownPath(null);
      }, 3000);
      return true;
    }

    // If away team just scored
    if (nextPlay.awayScore > currentPlay.awayScore &&
        nextPlay.awayScore - currentPlay.awayScore >= 6) {
      setTouchdownTeam("away");
      setShowFireworks(true);

      const startYard = extractYardLine(currentPlay);
      // If away scores, that means they reached yard line 0
      const scoringYards = startYard;
      setTouchdownYards(scoringYards);

      setTouchdownPath({
        team: "away",
        startPosition: startYard,
        endPosition: 0
      });
      setBallPosition(0);

      setTimeout(() => {
        setShowFireworks(false);
        setTouchdownPath(null);
      }, 3000);
      return true;
    }

    return false;
  };

  // Check for big play (gain of 20+ yards)
  const checkForBigPlay = (currentPlay, nextPlay) => {
    if (!currentPlay || !nextPlay) return;
    const currentYard = extractYardLine(currentPlay);
    const nextYard = extractYardLine(nextPlay);

    // If same team has possession and the difference is >= 20
    if (currentPlay.homeBall === nextPlay.homeBall) {
      const yardDiff = Math.abs(nextYard - currentYard);
      if (yardDiff >= 20) {
        const team = currentPlay.homeBall ? "home" : "away";
        setBigPlay({
          team,
          yards: yardDiff,
          text: `BIG PLAY! ${yardDiff} yard gain!`
        });
        setTimeout(() => setBigPlay(null), 3000);
      }
    }
  };

  // Quarter change
  const checkForQuarterChange = (currentPlay, nextPlay) => {
    if (!currentPlay || !nextPlay) return;
    if (nextPlay.period !== currentPlay.period) {
      setCurrentQuarter(nextPlay.period);
      if (nextPlay.period <= 4) {
        setShowQuarterSummary(true);
        setTimeout(() => setShowQuarterSummary(false), 5000);
      }
    }
  };

  // Simulation step
  const advancePlay = () => {
    setCurrentPlayIndex((prevIndex) => {
      const nextIndex = prevIndex + 1;
      if (nextIndex >= plays.length) {
        clearInterval(playIntervalRef.current);
        setIsPlaying(false);
        setGameCompleted(true);
        return prevIndex;
      }
      const currentPlay = plays[prevIndex];
      const nextPlay = plays[nextIndex];

      setPossession(nextPlay.homeBall ? "home" : "away");
      const nextYard = extractYardLine(nextPlay);
      setBallPosition(nextYard);
      setFieldPosition(formatFieldPosition(nextYard, nextPlay.homeBall));

      checkForTouchdown(currentPlay, nextPlay);
      checkForRedzone(nextYard, nextPlay.homeBall);
      checkForBigPlay(currentPlay, nextPlay);
      checkForQuarterChange(currentPlay, nextPlay);

      return nextIndex;
    });
  };

  // Start/Stop
  const togglePlaySimulation = () => {
    if (isPlaying) {
      clearInterval(playIntervalRef.current);
      setIsPlaying(false);
    } else {
      setIsPlaying(true);
      playIntervalRef.current = setInterval(advancePlay, playSpeed);
    }
  };

  // Reset
  const resetSimulation = () => {
    clearInterval(playIntervalRef.current);
    setIsPlaying(false);
    setCurrentPlayIndex(0);
    setShowFireworks(false);
    setTouchdownTeam(null);
    setTouchdownPath(null);
    setIsRedzone(false);
    setShowQuarterSummary(false);
    setGameCompleted(false);
    setBigPlay(null);

    if (plays.length > 0) {
      const firstPlay = plays[0];
      setPossession(firstPlay.homeBall ? "home" : "away");
      const yard = extractYardLine(firstPlay);
      setBallPosition(yard);
      setFieldPosition(formatFieldPosition(yard, firstPlay.homeBall));
      checkForRedzone(yard, firstPlay.homeBall);
      setCurrentQuarter(firstPlay.period || 1);
    }
  };

  // Skip to end
  const skipToEnd = () => {
    clearInterval(playIntervalRef.current);
    setIsPlaying(false);
    if (plays.length > 0) {
      const lastIndex = plays.length - 1;
      setCurrentPlayIndex(lastIndex);

      const lastPlay = plays[lastIndex];
      setPossession(lastPlay.homeBall ? "home" : "away");
      const yard = extractYardLine(lastPlay);
      setBallPosition(yard);
      setFieldPosition(formatFieldPosition(yard, lastPlay.homeBall));
      setGameCompleted(true);
    }
  };

  // Change speed
  const changeSpeed = (newSpeed) => {
    setPlaySpeed(newSpeed);
    if (isPlaying) {
      clearInterval(playIntervalRef.current);
      playIntervalRef.current = setInterval(advancePlay, newSpeed);
    }
  };

  // Skip to a specific play
  const skipToPlay = (index) => {
    if (index < 0 || index >= plays.length) return;
    clearInterval(playIntervalRef.current);
    setIsPlaying(false);
    setCurrentPlayIndex(index);

    const play = plays[index];
    setPossession(play.homeBall ? "home" : "away");
    const yard = extractYardLine(play);
    setBallPosition(yard);
    setFieldPosition(formatFieldPosition(yard, play.homeBall));
    checkForRedzone(yard, play.homeBall);
    setCurrentQuarter(play.period || 1);

    if (index === plays.length - 1) {
      setGameCompleted(true);
    } else {
      setGameCompleted(false);
    }
  };

  // Utilities
  const getTeamLogo = (teamName) => {
    const t = teams.find((tt) => tt.school.toLowerCase() === (teamName||"").toLowerCase());
    return t?.logos?.[0] || "/photos/default_team.png";
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

  const formatDown = (down) => {
    switch (down) {
      case 1: return "1st Down";
      case 2: return "2nd Down";
      case 3: return "3rd Down";
      case 4: return "4th Down";
      default: return "N/A";
    }
  };

  const formatQuarter = (period) => {
    if (!period) return "N/A";
    switch (period) {
      case 1: return "1st Quarter";
      case 2: return "2nd Quarter";
      case 3: return "3rd Quarter";
      case 4: return "4th Quarter";
      default: return `Overtime ${period - 4}`;
    }
  };

  if (loading) {
    return <div className="loading-container">Loading game details...</div>;
  }
  if (error) {
    return <div className="error-container">Error: {error}</div>;
  }
  if (!game) {
    return <div className="error-container">Game not found</div>;
  }

  // Current play
  const currentPlay = plays[currentPlayIndex] || null;
  // Current scores
  const homeScore = currentPlay ? currentPlay.homeScore : game.homePoints || 0;
  const awayScore = currentPlay ? currentPlay.awayScore : game.awayPoints || 0;

  // First down marker logic: 
  // We can do the simpler approach: if (distance) => universal yard line ± distance 
  let firstDownPosition = null;
  if (currentPlay && currentPlay.distance && currentPlay.down < 4) {
    // The universal yard line for this play:
    const currentYard = extractYardLine(currentPlay);
    if (currentPlay.homeBall) {
      // If home has ball, we add the distance, but that means universal yard line + distance 
      // actually means going from e.g. 30 to 30 + distance => up to 100
      firstDownPosition = Math.min(100, currentYard + currentPlay.distance);
    } else {
      // If away has ball, we subtract
      firstDownPosition = Math.max(0, currentYard - currentPlay.distance);
    }
  }

  // Endzone positions
  const homeEndzonePosition = "calc(91.67% + 4px)"; 
  const awayEndzonePosition = "calc(8.33% - 4px)";

  return (
    <div className="game-detail-container">
      <div className="field-container">
        {/* Touchdown celebration */}
        {showFireworks && (
          <div 
            className="touchdown-celebration"
            style={{
              position: "absolute",
              zIndex: 100,
              width: "100%",
              height: "100%",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              top: 0,
              left: 0,
              pointerEvents: "none"
            }}
          >
            <div 
              className="scoring-position"
              style={{
                position: "absolute",
                left: touchdownTeam === "home" ? homeEndzonePosition : awayEndzonePosition,
                top: "50%",
                transform: "translate(-50%, -50%)",
                zIndex: 15
              }}
            >
              <div 
                className="ball-scored"
                style={{
                  width: "24px",
                  height: "12px",
                  background: "#8B4513",
                  borderRadius: "50%",
                  boxShadow: "0 0 15px rgba(255, 255, 0, 0.8)"
                }}
              />
            </div>
            <div className="fireworks">
              <div className="firework"></div>
              <div className="firework"></div>
              <div className="firework"></div>
              <div className="firework"></div>
              <div className="firework"></div>
            </div>
            <div className="touchdown-text">
              TOUCHDOWN!
              <div className="touchdown-yards">
                {touchdownYards.toFixed(0)} yard score
              </div>
            </div>
          </div>
        )}

        {/* Red zone alert */}
        {isRedzone && (
          <div className="redzone-alert">
            <div className="alert-icon">🔴</div>
            <div className="alert-text">RED ZONE</div>
            <div className="alert-team">
              {possession === "home" ? game.homeTeam : game.awayTeam}
            </div>
          </div>
        )}

        {/* Big play alert */}
        {bigPlay && (
          <div className="big-play-alert">
            <div className="big-play-text">{bigPlay.text}</div>
            <div className="big-play-team">
              {bigPlay.team === "home" ? game.homeTeam : game.awayTeam}
            </div>
          </div>
        )}

        {/* Quarter summary */}
        {showQuarterSummary && (
          <div className="quarter-summary">
            <div className="quarter-heading">
              End of {formatQuarter(currentQuarter - 1)}
            </div>
            <div className="quarter-scores">
              <div className="quarter-team home">
                <img src={getTeamLogo(game.homeTeam)} alt={game.homeTeam} />
                <span>{game.homeTeam}: {homeScore}</span>
              </div>
              <div className="quarter-team away">
                <img src={getTeamLogo(game.awayTeam)} alt={game.awayTeam} />
                <span>{game.awayTeam}: {awayScore}</span>
              </div>
            </div>
          </div>
        )}

        {/* Game complete banner */}
        {gameCompleted && (
          <div className="game-complete-banner">
            <div className="complete-text">FINAL</div>
            <div className="winner-text">
              {homeScore > awayScore
                ? `${game.homeTeam} wins!`
                : homeScore < awayScore
                  ? `${game.awayTeam} wins!`
                  : "It's a tie!"}
            </div>
          </div>
        )}

        <div className="football-field">
          {/* Glassy overlay w/ game info */}
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
              <span className="current-quarter">{formatQuarter(currentPlay?.period || currentQuarter)}</span>
            </div>
          </div>

          {/* Field position indicator */}
          <div className="field-position-indicator">
            {fieldPosition}
          </div>

          {/* Left Endzone */}
          <div 
            className={`endzone left ${touchdownTeam === "away" && showFireworks ? "celebrating" : ""}`}
            style={{ background: game.awayColor }}
          >
            <img
              src={getTeamLogo(game.awayTeam)}
              alt={game.awayTeam}
              className="endzone-logo"
            />
            <div className="endzone-label">{game.awayTeam}</div>
          </div>

          {/* Playing field */}
          <div className={`playing-field ${isRedzone ? "redzone-active" : ""}`}>
            {/* Yard lines */}
            {[...Array(11)].map((_, i) => (
              <div
                key={i}
                className="yard-line"
                style={{ left: `${i * 10}%` }}
              />
            ))}
            {/* Yard numbers */}
            {[10, 20, 30, 40, 50, 40, 30, 20, 10].map((num, i) => (
              <div
                key={i}
                className="yard-number"
                style={{ left: `${(i + 1) * 10}%` }}
              >
                {num}
              </div>
            ))}

            {/* Center logo */}
            <div className="center-logo">
              <img src={getTeamLogo(game.homeTeam)} alt={game.homeTeam} />
              <div className="field-overlay" />
            </div>

            {/* Touchdown path */}
            {touchdownPath && (
              <div
                className="touchdown-path"
                style={{
                  position: "absolute",
                  height: "5px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  left: `${Math.min(touchdownPath.startPosition, touchdownPath.endPosition)}%`,
                  width: `${Math.abs(touchdownPath.endPosition - touchdownPath.startPosition)}%`,
                  backgroundColor: touchdownPath.team === "home" ? game.homeColor : game.awayColor,
                  zIndex: 2,
                  opacity: 0.7,
                  animation: "path-pulse 1s infinite alternate"
                }}
              />
            )}

            {/* First down marker */}
            {firstDownPosition !== null && currentPlay && currentPlay.down < 4 && (
              <div
                className="first-down-marker"
                style={{
                  left: `${firstDownPosition}%`,
                  zIndex: 10
                }}
              >
                <div className="marker-line" />
                <div className="marker-arrow">1st</div>
              </div>
            )}

            {/* Ball marker */}
            <div
              className="ball-marker"
              style={{ left: `${ballPosition}%`, top: "50%" }}
            >
              {/* Possession logo */}
              {possession && (
                <div className="possession-indicator">
                  <img
                    src={getTeamLogo(possession === "home" ? game.homeTeam : game.awayTeam)}
                    alt="Possession"
                  />
                </div>
              )}
              {/* Direction arrow */}
              <div className="direction-indicator">
                {possession === "home" ? "→" : "←"}
              </div>
              <div className="ball-shadow" />
            </div>
          </div>

          {/* Right Endzone */}
          <div
            className={`endzone right ${touchdownTeam === "home" && showFireworks ? "celebrating" : ""}`}
            style={{ background: game.homeColor }}
          >
            <img
              src={getTeamLogo(game.homeTeam)}
              alt={game.homeTeam}
              className="endzone-logo"
            />
            <div className="endzone-label">{game.homeTeam}</div>
          </div>
        </div>

        {/* Down & Distance */}
        {currentPlay && (
          <div className="down-distance-indicator">
            <div className="down">{formatDown(currentPlay.down)}</div>
            <div className="distance">& {currentPlay.distance} yards to go</div>
          </div>
        )}

        {/* Playback controls */}
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
                    <span className="stat-label">Quarter:</span>
                    <span className="stat-value">{formatQuarter(currentPlay.period)}</span>
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
                    <span className="stat-label">Field Position:</span>
                    <span className="stat-value">{fieldPosition}</span>
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
                              width: currentPlay.homeWinProbability
                                ? `${(currentPlay.homeWinProbability * 100).toFixed(1)}%`
                                : "0%",
                              backgroundColor: game.homeColor
                            }}
                          />
                        </div>
                        <span>
                          {currentPlay.homeWinProbability
                            ? `${(currentPlay.homeWinProbability * 100).toFixed(1)}%`
                            : "0%"}
                        </span>
                      </div>
                      <div className="team-prob">
                        <span>{game.awayTeam}</span>
                        <div className="prob-bar-container">
                          <div
                            className="prob-bar"
                            style={{
                              width: currentPlay.homeWinProbability
                                ? `${(100 - currentPlay.homeWinProbability * 100).toFixed(1)}%`
                                : "0%",
                              backgroundColor: game.awayColor
                            }}
                          />
                        </div>
                        <span>
                          {currentPlay.homeWinProbability
                            ? `${(100 - currentPlay.homeWinProbability * 100).toFixed(1)}%`
                            : "100%"}
                        </span>
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

      {/* --- STYLES BELOW --- */}
      <style jsx>{`
        /* (Same CSS as your original, left unmodified unless you'd like changes) */
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
          background: rgba(255, 255, 255, 0.15);
          border: 1px solid rgba(255, 255, 255, 0.3);
          border-radius: 12px;
          padding: 10px 20px;
          backdrop-filter: blur(10px);
          color: white;
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
          transition: all 0.3s ease;
        }
        .endzone.celebrating {
          animation: celebrate 1.5s infinite alternate;
        }
        @keyframes celebrate {
          0% {
            opacity: 0.8;
          }
          100% {
            opacity: 1;
            filter: brightness(1.3);
          }
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
          transition: all 0.3s ease;
        }
        .playing-field.redzone-active {
          background: linear-gradient(160deg, #1a472a, #2d5a27),
            repeating-linear-gradient(
              135deg,
              rgba(255, 0, 0, 0.1),
              rgba(255, 0, 0, 0.1) 10px,
              rgba(255, 0, 0, 0.05) 10px,
              rgba(255, 0, 0, 0.05) 20px
            );
          box-shadow: inset 0 0 30px rgba(255, 0, 0, 0.2);
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
        .first-down-marker {
          position: absolute;
          top: 0;
          bottom: 0;
          width: 2px;
          background: rgba(255, 255, 0, 0.8);
          z-index: 10;
          filter: drop-shadow(0 0 3px rgba(255, 255, 0, 0.8));
        }
        .marker-line {
          position: absolute;
          top: 0;
          bottom: 0;
          width: 100%;
          background: rgba(255, 255, 0, 0.8);
        }
        .marker-arrow {
          position: absolute;
          bottom: 5px;
          left: 50%;
          transform: translateX(-50%);
          background: #ffd700;
          color: #000;
          font-size: 10px;
          font-weight: bold;
          padding: 2px 4px;
          border-radius: 3px;
        }
        .ball-marker {
          position: absolute;
          width: 24px;
          height: 12px;
          background: #8b4513;
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
        .direction-indicator {
          position: absolute;
          top: -20px;
          left: 50%;
          transform: translateX(-50%);
          font-size: 1.5rem;
          color: white;
          text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.7);
          z-index: 4;
        }
        .field-position-indicator {
          position: absolute;
          top: 10px;
          right: 10px;
          background: rgba(0, 0, 0, 0.7);
          padding: 5px 10px;
          border-radius: 8px;
          color: white;
          font-weight: bold;
          z-index: 20;
        }
        .stat-label {
          font-weight: 600;
          min-width: 120px;
          color: rgba(0, 0, 0, 0.7);
        }
        .fireworks {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
        }
        .firework {
          position: absolute;
          border-radius: 50%;
          animation: firework 1.5s ease-out infinite;
        }
        .firework:nth-child(1) {
          top: 30%;
          left: 20%;
          width: 100px;
          height: 100px;
          animation-delay: 0s;
          background: radial-gradient(circle, rgba(255,215,0,0.8) 0%, rgba(255,215,0,0) 70%);
        }
        .firework:nth-child(2) {
          top: 40%;
          left: 70%;
          width: 120px;
          height: 120px;
          animation-delay: 0.2s;
          background: radial-gradient(circle, rgba(255,0,0,0.8) 0%, rgba(255,0,0,0) 70%);
        }
        .firework:nth-child(3) {
          top: 60%;
          left: 30%;
          width: 80px;
          height: 80px;
          animation-delay: 0.4s;
          background: radial-gradient(circle, rgba(0,255,255,0.8) 0%, rgba(0,255,255,0) 70%);
        }
        .firework:nth-child(4) {
          top: 20%;
          left: 50%;
          width: 150px;
          height: 150px;
          animation-delay: 0.6s;
          background: radial-gradient(circle, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0) 70%);
        }
        .firework:nth-child(5) {
          top: 70%;
          left: 60%;
          width: 90px;
          height: 90px;
          animation-delay: 0.8s;
          background: radial-gradient(circle, rgba(0,255,0,0.8) 0%, rgba(0,255,0,0) 70%);
        }
        @keyframes firework {
          0% {
            transform: scale(0);
            opacity: 1;
          }
          100% {
            transform: scale(1);
            opacity: 0;
          }
        }
        .touchdown-text {
          font-size: 4rem;
          font-weight: 900;
          color: white;
          text-shadow: 0 0 20px rgba(255, 215, 0, 0.8);
          animation: touchdown-pulse 0.5s infinite alternate;
        }
        .touchdown-yards {
          font-size: 1.5rem;
          margin-top: 8px;
          font-weight: normal;
          opacity: 0.9;
        }
        @keyframes touchdown-pulse {
          0% {
            transform: scale(1);
            text-shadow: 0 0 20px rgba(255, 215, 0, 0.8);
          }
          100% {
            transform: scale(1.1);
            text-shadow: 0 0 30px rgba(255, 215, 0, 1);
          }
        }
        .touchdown-path {
          position: absolute;
          height: 5px;
          top: 50%;
          transform: translateY(-50%);
          z-index: 2;
          opacity: 0.7;
          animation: path-pulse 1s infinite alternate;
        }
        @keyframes path-pulse {
          0% {
            opacity: 0.5;
            height: 3px;
          }
          100% {
            opacity: 0.9;
            height: 6px;
          }
        }
        .redzone-alert {
          position: absolute;
          top: 60px;
          right: 20px;
          background: rgba(255, 0, 0, 0.8);
          border-radius: 8px;
          padding: 10px 15px;
          color: white;
          display: flex;
          align-items: center;
          gap: 10px;
          z-index: 50;
          animation: pulse-redzone 1s infinite alternate;
        }
        .alert-icon {
          font-size: 1.5rem;
        }
        .alert-text {
          font-weight: bold;
          font-size: 1.2rem;
        }
        .alert-team {
          font-size: 0.9rem;
          opacity: 0.9;
        }
        @keyframes pulse-redzone {
          0% {
            transform: scale(1);
            box-shadow: 0 0 10px rgba(255, 0, 0, 0.5);
          }
          100% {
            transform: scale(1.03);
            box-shadow: 0 0 15px rgba(255, 0, 0, 0.8);
          }
        }
        .big-play-alert {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: rgba(0, 0, 0, 0.8);
          border-radius: 12px;
          padding: 15px 25px;
          color: white;
          text-align: center;
          z-index: 50;
          animation: fade-in-out 3s forwards;
        }
        .big-play-text {
          font-size: 1.8rem;
          font-weight: bold;
          margin-bottom: 5px;
          color: #ffd700;
        }
        .big-play-team {
          font-size: 1.2rem;
        }
        @keyframes fade-in-out {
          0% {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.8);
          }
          20% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
          }
          80% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
          }
          100% {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.8);
          }
        }
        .quarter-summary {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: rgba(0, 0, 0, 0.8);
          border: 1px solid rgba(255, 255, 255, 0.2);
          backdrop-filter: blur(10px);
          border-radius: 16px;
          padding: 20px;
          width: 80%;
          max-width: 500px;
          color: white;
          z-index: 100;
          box-shadow: 0 0 30px rgba(0, 0, 0, 0.5);
          animation: slide-in 0.5s ease-out;
        }
        .quarter-heading {
          font-size: 1.8rem;
          font-weight: bold;
          text-align: center;
          margin-bottom: 15px;
          color: #ffd700;
          text-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
        }
        .quarter-scores {
          display: flex;
          justify-content: space-around;
          margin-top: 15px;
        }
        .quarter-team {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
        }
        .quarter-team img {
          width: 60px;
          height: 60px;
          object-fit: contain;
          background: rgba(255, 255, 255, 0.9);
          border-radius: 50%;
          padding: 5px;
        }
        .quarter-team span {
          font-size: 1.2rem;
          font-weight: 500;
        }
        @keyframes slide-in {
          0% {
            opacity: 0;
            transform: translate(-50%, -70%);
          }
          100% {
            opacity: 1;
            transform: translate(-50%, -50%);
          }
        }
        .game-complete-banner {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: rgba(0, 0, 0, 0.8);
          border: 2px solid #ffd700;
          border-radius: 16px;
          padding: 20px 40px;
          color: white;
          text-align: center;
          z-index: 50;
          animation: game-complete 0.5s ease-out;
          box-shadow: 0 0 30px rgba(255, 215, 0, 0.3);
        }
        .complete-text {
          font-size: 2.5rem;
          font-weight: 900;
          color: #ffd700;
          margin-bottom: 10px;
          text-shadow: 0 0 10px rgba(255, 215, 0, 0.8);
        }
        .winner-text {
          font-size: 1.5rem;
          font-weight: 600;
        }
        @keyframes game-complete {
          0% {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.7);
          }
          70% {
            transform: translate(-50%, -50%) scale(1.05);
          }
          100% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
          }
        }
        .down-distance-indicator {
          position: absolute;
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(0, 0, 0, 0.7);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 8px;
          padding: 8px 15px;
          color: white;
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 1rem;
          z-index: 10;
        }
        .down {
          font-weight: bold;
          color: #ffd700;
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
          .touchdown-text {
            font-size: 2.5rem;
          }
          .quarter-summary {
            width: 90%;
          }
          .field-position-indicator {
            top: 5px;
            right: 5px;
            font-size: 0.9rem;
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
