import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import teamsService from "../services/teamsService";
import graphqlTeamsService from "../services/graphqlTeamsService";
import { motion, AnimatePresence } from "framer-motion";
import { FaFootballBall, FaFlag, FaChartLine, FaChevronRight, FaChevronLeft, FaPlay, FaPause, FaStepBackward, FaStepForward, FaFastForward } from "react-icons/fa";
import { IoMdFootball } from "react-icons/io";
import { GiWhistle, GiAmericanFootballHelmet } from "react-icons/gi";
import PlayByPlayTimeline from "./PlayByPlayTimeline";
import GameStats from "./GameStats";
import FieldHeatmap from "./FieldHeatmap";
import DriveVisualizer from "./DriveVisualizer";
import '../styles/GameDetailView.css'; // Adjust the path as necessary

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
  const [playSpeed, setPlaySpeed] = useState(1000); // ms between plays
  const playIntervalRef = useRef(null);
  const fieldRef = useRef(null);
  
  // This "universal" yard line means:
  //   0   = Home end zone (left side)
  //   100 = Away end zone (right side)
  const [ballPosition, setBallPosition] = useState(50); 
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
  
  // New enhanced states
  const [showPlayHistory, setShowPlayHistory] = useState(false);
  const [selectedHistoryPlay, setSelectedHistoryPlay] = useState(null);
  const [showStats, setShowStats] = useState(false);
  const [gameMomentum, setGameMomentum] = useState(0); // -100 to 100, 0 is neutral
  const [playSpotlight, setPlaySpotlight] = useState(null);
  const [driveInfo, setDriveInfo] = useState(null);
  const [showFieldHeatmap, setShowFieldHeatmap] = useState(false);
  const [viewMode, setViewMode] = useState("standard"); // standard, broadcast, coach
  // Determine if a given teamName is the home or away team for this game
  const getTeamSide = (teamName) => {
    if (!game) return null;
    const normalized = (teamName || "").toLowerCase().trim();
    if (normalized === (game.homeTeam || "").toLowerCase()) return "home";
    if (normalized === (game.awayTeam || "").toLowerCase()) return "away";
    return null;
  };

  // Basic abbreviation function (expand if needed)
  const abbreviateTeamName = (fullName) => {
    if (!fullName) return "";
    if (fullName.toLowerCase().includes("ohio state")) return "OSU";
    if (fullName.toLowerCase().includes("indiana")) return "IU";
    // Otherwise, take first word or something short
    const firstWord = fullName.split(" ")[0];
    return firstWord.length > 4 ? firstWord.slice(0, 4).toUpperCase() : firstWord.toUpperCase();
  };

  /**
   * parseYardLine from play text:
   *  If it says "to the [HomeTeam] 23" => universal yard line = 23
   *  If it says "to the [AwayTeam] 23" => universal yard line = 100 - 23 = 77
   */
  const parseYardLine = (playText) => {
    const regex = /to the\s+(.+?)\s+(\d+)\b/i;
    const match = playText.match(regex);
    if (!match) return null;
    const teamNameRaw = match[1].trim();
    const yardNumber = parseInt(match[2], 10);
    if (isNaN(yardNumber)) return null;

    const side = getTeamSide(teamNameRaw);
    if (!side) return null; // couldn't identify
    // If it's home's yard line => universal = yardNumber
    // If it's away's yard line => universal = 100 - yardNumber
    if (side === "home") {
      return yardNumber;
    } else {
      return 100 - yardNumber;
    }
  };

  /**
   * extractYardLine: return 0..100 for the given play
   *   - prefer parseYardLine from text
   *   - fallback to play.yardLine if available
   *   - else 50
   */
  const extractYardLine = (play) => {
    const fromText = parseYardLine(play.playText || "");
    if (fromText !== null) {
      return Math.max(0, Math.min(100, fromText));
    }
    // If there's a numeric yardLine field:
    if (play.yardLine !== undefined && play.yardLine !== null) {
      // But we need to interpret it. If yardLine is from the home end zone, we can use yardLine directly.
      // If the ball belongs to away, we do 100 - yardLine. 
      if (play.homeBall) {
        return Math.max(0, Math.min(100, play.yardLine));
      } else {
        return Math.max(0, Math.min(100, 100 - play.yardLine));
      }
    }
    return 50; // fallback
  };

  /**
   * Format field position display
   *  If yardLine = 35 and the home team has the ball => "HOME 35"
   *  If yardLine = 65 and the away team has the ball => that means 100-65=35 from away end zone => "AWAY 35"
   */
  const formatFieldPosition = (universalYardLine, isHomeBall) => {
    if (!game) return "";
    const teamName = isHomeBall ? game.homeTeam : game.awayTeam;
    const teamAbbr = abbreviateTeamName(teamName);
    let yardNumber = 0;
    if (isHomeBall) {
      yardNumber = universalYardLine; // 0..100 from home end zone
    } else {
      yardNumber = 100 - universalYardLine; // 0..100 from away end zone
    }
    return `${teamAbbr} ${yardNumber}`;
  };
  // Redzone check
  const checkForRedzone = (universalYardLine, isHomeBall) => {
    // Home has ball => yardLine >= 80 => inside away's 20
    // Away has ball => yardLine <= 20 => inside home's 20
    if (isHomeBall && universalYardLine >= 80) {
      setIsRedzone(true);
    } else if (!isHomeBall && universalYardLine <= 20) {
      setIsRedzone(true);
    } else {
      setIsRedzone(false);
    }
  };

  // Calculate game momentum based on recent plays
  const calculateMomentum = (currentIndex) => {
    if (!plays || plays.length === 0 || currentIndex < 0) return 0;
    
    // Look at last 5 plays or fewer if not available
    const startIdx = Math.max(0, currentIndex - 4);
    const recentPlays = plays.slice(startIdx, currentIndex + 1);
    
    let momentumValue = 0;
    
    recentPlays.forEach((play, idx) => {
      // More recent plays have higher weight
      const weight = (idx + 1) / recentPlays.length;
      
      // Factors that affect momentum
      // 1. Yards gained
      const yardsGained = play.yardsGained || 0;
      
      // 2. First downs
      const isFirstDown = play.isFirstDown || false;
      
      // 3. Turnovers
      const isTurnover = play.isTurnover || false;
      
      // 4. Scoring plays
      const isScoring = 
        (play.homeScore > (plays[currentIndex - 1]?.homeScore || 0)) || 
        (play.awayScore > (plays[currentIndex - 1]?.awayScore || 0));
      
      // Calculate play value
      let playValue = 0;
      playValue += yardsGained * 0.5;
      if (isFirstDown) playValue += 10;
      if (isTurnover) playValue += 20;
      if (isScoring) playValue += 30;
      
      // Apply to momentum (positive for home, negative for away)
      if (play.homeBall) {
        momentumValue += playValue * weight;
      } else {
        momentumValue -= playValue * weight;
      }
    });
    
    // Normalize to -100 to 100 range
    return Math.max(-100, Math.min(100, momentumValue));
  };

  // Data fetching
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
        // Remove duplicates
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

          // If last play is 4th Q or beyond, game might be complete
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
  
        const startYard = extractYardLine(currentPlay);
        // If home scores => yard line goes to 100 if we were "home=0" ? Actually no. 
        // We said home end zone=0, away end zone=100. 
        // That means to score, the home team goes from e.g. 20 up to 100? 
        // Wait, if home is 0, then to score a TD, they'd have to get to 100 (the away end zone). 
        const scoringYards = 100 - startYard; 
        setTouchdownYards(scoringYards);
  
        setTouchdownPath({
          team: "home",
          startPosition: startYard,
          endPosition: 100
        });
        setBallPosition(100);
  
        // Set play spotlight for touchdown
        setPlaySpotlight({
          type: "touchdown",
          team: "home",
          yards: scoringYards,
          text: `TOUCHDOWN ${game.homeTeam}!`,
          description: `${scoringYards} yard touchdown`
        });
  
        setTimeout(() => {
          setShowFireworks(false);
          setTouchdownPath(null);
          setPlaySpotlight(null);
        }, 5000);
        return true;
      }
  
      // If away team just scored
      if (nextPlay.awayScore > currentPlay.awayScore &&
          nextPlay.awayScore - currentPlay.awayScore >= 6) {
        setTouchdownTeam("away");
        setShowFireworks(true);
  
        const startYard = extractYardLine(currentPlay);
        // If away is at 100 and they drive to 0 to score
        const scoringYards = startYard; 
        setTouchdownYards(scoringYards);
  
        setTouchdownPath({
          team: "away",
          startPosition: startYard,
          endPosition: 0
        });
        setBallPosition(0);
  
        // Set play spotlight for touchdown
        setPlaySpotlight({
          type: "touchdown",
          team: "away",
          yards: scoringYards,
          text: `TOUCHDOWN ${game.awayTeam}!`,
          description: `${scoringYards} yard touchdown`
        });
  
        setTimeout(() => {
          setShowFireworks(false);
          setTouchdownPath(null);
          setPlaySpotlight(null);
        }, 5000);
        return true;
      }
  
      return false;
    };
  
    // Big play
    const checkForBigPlay = (currentPlay, nextPlay) => {
      if (!currentPlay || !nextPlay) return;
      const currentYard = extractYardLine(currentPlay);
      const nextYard = extractYardLine(nextPlay);
      if (currentPlay.homeBall === nextPlay.homeBall) {
        const diff = Math.abs(nextYard - currentYard);
        if (diff >= 20) {
          const team = currentPlay.homeBall ? "home" : "away";
          const teamName = team === "home" ? game.homeTeam : game.awayTeam;
          
          setBigPlay({
            team,
            yards: diff,
            text: `BIG PLAY! ${diff} yard gain!`
          });
          
          // Set play spotlight for big play
          setPlaySpotlight({
            type: "bigPlay",
            team,
            yards: diff,
            text: `BIG PLAY!`,
            description: `${teamName} gains ${diff} yards!`,
            player: nextPlay.playerName || "Unknown Player"
          });
          
          setTimeout(() => {
            setBigPlay(null);
            setPlaySpotlight(null);
          }, 5000);
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
    // Advance one play
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
  
        const yard = extractYardLine(nextPlay);
        setBallPosition(yard);
        setFieldPosition(formatFieldPosition(yard, nextPlay.homeBall));
  
        // Update momentum
        setGameMomentum(calculateMomentum(nextIndex));
  
        // Check for special events
        checkForTouchdown(currentPlay, nextPlay);
        checkForRedzone(yard, nextPlay.homeBall);
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
      setPlaySpotlight(null);
  
      if (plays.length > 0) {
        const firstPlay = plays[0];
        setPossession(firstPlay.homeBall ? "home" : "away");
        const yard = extractYardLine(firstPlay);
        setBallPosition(yard);
        setFieldPosition(formatFieldPosition(yard, firstPlay.homeBall));
        checkForRedzone(yard, firstPlay.homeBall);
        setCurrentQuarter(firstPlay.period || 1);
        setGameMomentum(0);
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
        setGameMomentum(calculateMomentum(lastIndex));
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
      setGameMomentum(calculateMomentum(index));
  
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
  
    // Toggle view modes
    const toggleViewMode = () => {
      if (viewMode === "standard") {
        setViewMode("broadcast");
      } else if (viewMode === "broadcast") {
        setViewMode("coach");
      } else {
        setViewMode("standard");
      }
    };
  
    if (loading) {
      return (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <div className="loading-text">Loading game details...</div>
        </div>
      );
    }
    
    if (error) {
      return (
        <div className="error-container">
          <div className="error-icon">⚠️</div>
          <div className="error-message">Error: {error}</div>
          <button className="retry-button" onClick={fetchGameData}>Retry</button>
        </div>
      );
    }
    
    if (!game) {
      return (
        <div className="error-container">
          <div className="error-icon">🔍</div>
          <div className="error-message">Game not found</div>
        </div>
      );
    }
  
  // Current play info
  const currentPlay = plays[currentPlayIndex] || null;
  const homeScore = currentPlay?.homeScore || 0;
  const awayScore = currentPlay?.awayScore || 0;
  const down = currentPlay?.down;
  const distance = currentPlay?.distance;
  const playText = currentPlay?.playText || "";
  const isHomeBall = currentPlay?.homeBall || false;
  const firstDownLine = currentPlay?.firstDownLine;

  // Calculate first down marker position (0-100)
  const firstDownPosition = firstDownLine ? 
    (isHomeBall ? firstDownLine : 100 - firstDownLine) : 
    (isHomeBall ? ballPosition + 10 : ballPosition - 10);

  return (
    <div className="game-detail-container">
      <div className={`field-container view-mode-${viewMode}`}>
        <div className="view-mode-toggle">
          <button className="view-mode-button" onClick={toggleViewMode}>
            {viewMode === "standard" ? "Standard View" : 
             viewMode === "broadcast" ? "Broadcast View" : "Coach View"}
          </button>
        </div>
        
        {/* Momentum indicator */}
        <div className="momentum-indicator">
          <div className="momentum-label">Game Momentum</div>
          <div className="momentum-bar-container">
            <motion.div 
              className="momentum-bar home"
              style={{ 
                width: `${Math.max(0, 50 + gameMomentum/2)}%`,
                backgroundColor: game.homeColor
              }}
              initial={{ width: "50%" }}
              animate={{ width: `${Math.max(0, 50 + gameMomentum/2)}%` }}
              transition={{ duration: 0.5 }}
            />
            <motion.div 
              className="momentum-bar away"
              style={{ 
                width: `${Math.max(0, 50 - gameMomentum/2)}%`,
                backgroundColor: game.awayColor
              }}
              initial={{ width: "50%" }}
              animate={{ width: `${Math.max(0, 50 - gameMomentum/2)}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          <div className="momentum-teams">
            <span>{game.homeTeam}</span>
            <span>{game.awayTeam}</span>
          </div>
        </div>
        
        <div className="football-field" ref={fieldRef}>
          {/* Game info overlay */}
          <div className="game-info">
            <div className="score-display">
              <div className="team-score">
                <img 
                  src={getTeamLogo(game.homeTeam)} 
                  alt={game.homeTeam} 
                  className="score-team-logo"
                />
                <span>{game.homeTeam}</span>
                <span>{homeScore}</span>
              </div>
              <div className="score-separator">-</div>
              <div className="team-score">
                <span>{awayScore}</span>
                <span>{game.awayTeam}</span>
                <img 
                  src={getTeamLogo(game.awayTeam)} 
                  alt={game.awayTeam} 
                  className="score-team-logo"
                />
              </div>
            </div>
            <div className="game-status">
              <span>{formatGameTime(game.startDate)}</span>
              <span>{formatQuarter(currentQuarter)}</span>
              {down && distance && (
                <span>{formatDown(down)} & {distance}</span>
              )}
            </div>
          </div>
          
          {/* Field position indicator */}
          <div className="field-position-indicator">
            <FaFootballBall className="position-icon" />
            <span>{fieldPosition}</span>
          </div>
          
          {/* Home endzone */}
          <div 
            className={`endzone left ${touchdownTeam === "away" ? "celebrating" : ""}`}
            style={{ backgroundColor: game.homeColor }}
          >
            <img 
              src={getTeamLogo(game.homeTeam)} 
              alt={game.homeTeam} 
              className="endzone-logo"
            />
            <div className="endzone-label">{game.homeTeam}</div>
          </div>
          
          {/* Playing field */}
          <div className={`playing-field ${isRedzone ? "redzone-active" : ""}`}>
            {/* Yard lines */}
            {[10, 20, 30, 40, 50, 60, 70, 80, 90].map((yard) => (
              <div 
                key={yard} 
                className="yard-line" 
                style={{ left: `${yard}%` }}
              />
            ))}
            
            {/* Yard numbers */}
            {[10, 20, 30, 40, 50, 40, 30, 20, 10].map((num, idx) => (
              <div 
                key={idx} 
                className="yard-number" 
                style={{ left: `${(idx + 1) * 10}%` }}
              >
                {num}
              </div>
            ))}
            
            {/* Center logo */}
            <div className="center-logo">
              <img src="/photos/ncaa-logo.png" alt="NCAA" />
            </div>
            
            {/* Field overlay for visual effect */}
            <div className="field-overlay"></div>
            
            {/* First down marker */}
            {firstDownPosition >= 0 && firstDownPosition <= 100 && (
              <div 
                className="first-down-marker"
                style={{ left: `${firstDownPosition}%` }}
              >
                <div className="marker-line"></div>
                <div className="marker-arrow">1st</div>
              </div>
            )}
            
            {/* Ball marker */}
            <motion.div 
              className="ball-marker"
              initial={{ left: "50%", top: "50%" }}
              animate={{ left: `${ballPosition}%`, top: "50%" }}
              transition={{ duration: 0.5 }}
              style={{ 
                left: `${ballPosition}%`, 
                top: "50%" 
              }}
            >
              <div className="possession-indicator">
                <img 
                  src={getTeamLogo(isHomeBall ? game.homeTeam : game.awayTeam)} 
                  alt={isHomeBall ? game.homeTeam : game.awayTeam}
                />
              </div>
              <div className="direction-indicator">
                {isHomeBall ? "→" : "←"}
              </div>
              <div className="ball">
                <FaFootballBall className="football-icon" />
                <div className="ball-shadow"></div>
              </div>
            </motion.div>
            
            {/* Touchdown path visualization */}
            {touchdownPath && (
              <div 
                className="touchdown-path"
                style={{
                  left: `${Math.min(touchdownPath.startPosition, touchdownPath.endPosition)}%`,
                  width: `${Math.abs(touchdownPath.endPosition - touchdownPath.startPosition)}%`,
                  backgroundColor: touchdownPath.team === "home" ? game.homeColor : game.awayColor,
                  opacity: 0.3,
                  position: "absolute",
                  height: "10px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  animation: "path-pulse 1s infinite alternate"
                }}
              />
            )}
          </div>
          
          {/* Away endzone */}
          <div 
            className={`endzone right ${touchdownTeam === "home" ? "celebrating" : ""}`}
            style={{ backgroundColor: game.awayColor }}
          >
            <img 
              src={getTeamLogo(game.awayTeam)} 
              alt={game.awayTeam} 
              className="endzone-logo"
            />
            <div className="endzone-label">{game.awayTeam}</div>
          </div>
          
          {/* Redzone alert */}
          {isRedzone && (
            <div className="redzone-alert">
              <div className="alert-icon">🔥</div>
              <div className="alert-text">RED ZONE</div>
              <div className="alert-team">
                {isHomeBall ? game.homeTeam : game.awayTeam}
              </div>
            </div>
          )}
          
          {/* Big play alert */}
          <AnimatePresence>
            {bigPlay && (
              <motion.div 
                className="big-play-alert"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.3 }}
              >
                <div className="big-play-text">{bigPlay.text}</div>
                <div className="big-play-team">
                  {bigPlay.team === "home" ? game.homeTeam : game.awayTeam}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Quarter summary */}
          <AnimatePresence>
            {showQuarterSummary && (
              <motion.div 
                className="quarter-summary"
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 50 }}
                transition={{ duration: 0.3 }}
              >
                <div className="quarter-heading">
                  {formatQuarter(currentQuarter - 1)} Complete
                </div>
                <div className="quarter-scores">
                  <div className="quarter-team">
                    <img 
                      src={getTeamLogo(game.homeTeam)} 
                      alt={game.homeTeam}
                    />
                    <span>{game.homeTeam}</span>
                    <span>{homeScore}</span>
                  </div>
                  <div className="quarter-team">
                    <img 
                      src={getTeamLogo(game.awayTeam)} 
                      alt={game.awayTeam}
                    />
                    <span>{game.awayTeam}</span>
                    <span>{awayScore}</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Game complete banner */}
          <AnimatePresence>
            {gameCompleted && (
              <motion.div 
                className="game-complete-banner"
                initial={{ opacity: 0, y: -50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="complete-text">GAME COMPLETE</div>
                <div className="winner-text">
                  {homeScore > awayScore ? 
                    `${game.homeTeam} wins ${homeScore}-${awayScore}` : 
                    homeScore < awayScore ? 
                    `${game.awayTeam} wins ${awayScore}-${homeScore}` : 
                    `Game tied ${homeScore}-${awayScore}`}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Play spotlight */}
          <AnimatePresence>
            {playSpotlight && (
              <motion.div 
                className={`play-spotlight ${playSpotlight.type}`}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 50 }}
                transition={{ duration: 0.3 }}
              >
                <div className="spotlight-header">
                  {playSpotlight.type === "touchdown" ? (
                    <FaFootballBall className="spotlight-icon" />
                  ) : (
                    <FaChartLine className="spotlight-icon" />
                  )}
                  <h3>{playSpotlight.text}</h3>
                </div>
                <div className="spotlight-details">
                  <p>{playSpotlight.description}</p>
                  {playSpotlight.player && (
                    <div className="spotlight-player">
                      <GiAmericanFootballHelmet className="player-icon" />
                      <span>{playSpotlight.player}</span>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Touchdown celebration */}
          <AnimatePresence>
            {showFireworks && (
              <motion.div 
                className="touchdown-celebration"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
              >
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
                    {touchdownYards} yard drive
                  </div>
                </div>
                <div className="ball-scored"></div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        {/* Down & Distance */}
        <div className="down-distance-indicator">
          <div className="down">{down ? formatDown(down) : "N/A"}</div>
          <div className="distance">{distance ? `& ${distance}` : ""}</div>
        </div>
        
        {/* Playback controls */}
        <div className="playback-controls">
          <button 
            className="control-button"
            onClick={resetSimulation}
            title="Reset"
          >
            <FaStepBackward />
          </button>
          
          <button 
            className="control-button"
            onClick={() => skipToPlay(currentPlayIndex - 1)}
            disabled={currentPlayIndex <= 0}
            title="Previous Play"
          >
            <FaChevronLeft />
          </button>
          
          <button 
            className="control-button play-pause"
            onClick={togglePlaySimulation}
            title={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? <FaPause /> : <FaPlay />}
          </button>
          
          <button 
            className="control-button"
            onClick={() => skipToPlay(currentPlayIndex + 1)}
            disabled={currentPlayIndex >= plays.length - 1}
            title="Next Play"
          >
            <FaChevronRight />
          </button>
          
          <button 
            className="control-button"
            onClick={skipToEnd}
            title="Skip to End"
          >
            <FaFastForward />
          </button>
          
          <div className="speed-controls">
            <span>Speed:</span>
            <select 
              className="speed-select"
              value={playSpeed}
              onChange={(e) => changeSpeed(Number(e.target.value))}
            >
              <option value={2000}>0.5x</option>
              <option value={1000}>1x</option>
              <option value={500}>2x</option>
              <option value={250}>4x</option>
            </select>
          </div>
          
          <div className="progress-indicator">
            Play {currentPlayIndex + 1} of {plays.length}
          </div>
        </div>
        
        {/* Game details panel */}
        <div className="game-details-panel">
          <div className="panel-tabs">
            <button 
              className={`tab-button ${!showStats && !showFieldHeatmap ? 'active' : ''}`}
              onClick={() => {
                setShowStats(false);
                setShowFieldHeatmap(false);
              }}
            >
              Last Play
            </button>
            <button 
              className={`tab-button ${showStats ? 'active' : ''}`}
              onClick={() => {
                setShowStats(true);
                setShowFieldHeatmap(false);
              }}
            >
              Game Stats
            </button>
            <button 
              className={`tab-button ${showFieldHeatmap ? 'active' : ''}`}
              onClick={() => {
                setShowStats(false);
                setShowFieldHeatmap(true);
              }}
            >
              Field Heatmap
            </button>
          </div>
          
          {!showStats && !showFieldHeatmap && (
            <div className="last-play">
              <h3>Last Play</h3>
              <div className="play-text">{playText}</div>
              <div className="play-stats">
                <div className="stat-row">
                  <div className="stat-label">Possession</div>
                  <div className="stat-value">
                    <img 
                      src={getTeamLogo(isHomeBall ? game.homeTeam : game.awayTeam)} 
                      alt={isHomeBall ? game.homeTeam : game.awayTeam}
                      className="possession-logo"
                    />
                    {isHomeBall ? game.homeTeam : game.awayTeam}
                  </div>
                </div>
                <div className="stat-row">
                  <div className="stat-label">Field Position</div>
                  <div className="stat-value">{fieldPosition}</div>
                </div>
                <div className="stat-row">
                  <div className="stat-label">Down & Distance</div>
                  <div className="stat-value">
                    {down && distance ? `${formatDown(down)} & ${distance}` : "N/A"}
                  </div>
                </div>
                <div className="stat-row">
                  <div className="stat-label">Quarter</div>
                  <div className="stat-value">{formatQuarter(currentQuarter)}</div>
                </div>
              </div>
              
              <div className="probability-bars">
                <h3>Win Probability</h3>
                <div className="team-prob">
                  <span>{game.homeTeam}</span>
                  <div className="prob-bar-container">
                    <div 
                      className="prob-bar"
                      style={{ 
                        width: `${currentPlay?.homeWinProb * 100 || 50}%`,
                        backgroundColor: game.homeColor
                      }}
                    />
                  </div>
                  <span>{Math.round((currentPlay?.homeWinProb || 0.5) * 100)}%</span>
                </div>
                <div className="team-prob">
                  <span>{game.awayTeam}</span>
                  <div className="prob-bar-container">
                    <div 
                      className="prob-bar"
                      style={{ 
                        width: `${(1 - (currentPlay?.homeWinProb || 0.5)) * 100}%`,
                        backgroundColor: game.awayColor
                      }}
                    />
                  </div>
                  <span>{Math.round((1 - (currentPlay?.homeWinProb || 0.5)) * 100)}%</span>
                </div>
              </div>
            </div>
          )}
          
          {showStats && (
            <GameStats 
              game={game}
              currentPlay={currentPlay}
              homeScore={homeScore}
              awayScore={awayScore}
              homeColor={game.homeColor}
              awayColor={game.awayColor}
            />
          )}
          
          {showFieldHeatmap && (
            <FieldHeatmap 
              plays={plays}
              homeTeam={game.homeTeam}
              awayTeam={game.awayTeam}
              homeColor={game.homeColor}
              awayColor={game.awayColor}
            />
          )}
        </div>
      </div>
      
      {/* Play-by-Play Timeline */}
      <PlayByPlayTimeline 
        plays={plays}
        currentPlayIndex={currentPlayIndex}
        skipToPlay={skipToPlay}
        homeTeam={game.homeTeam}
        awayTeam={game.awayTeam}
        homeColor={game.homeColor}
        awayColor={game.awayColor}
        formatQuarter={formatQuarter}
        formatDown={formatDown}
      />
      
      {/* Drive Visualizer */}
      <DriveVisualizer 
        plays={plays}
        currentPlayIndex={currentPlayIndex}
        homeTeam={game.homeTeam}
        awayTeam={game.awayTeam}
        homeColor={game.homeColor}
        awayColor={game.awayColor}
        skipToPlay={skipToPlay}
      />
    </div>
  );
};

export default GameDetailView;
