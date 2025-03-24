import React, { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { Line } from "react-chartjs-2";
import teamsService from "../services/teamsService";
import Confetti from "react-confetti";

// Register required Chart.js components
import {
  Chart,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
Chart.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler);

// Safely parse a team's color or alt_color
function parseColor(rawColor, fallback) {
  if (!rawColor || rawColor === null || rawColor.toLowerCase() === "#null") {
    return fallback;
  }
  return rawColor.startsWith("#") ? rawColor : `#${rawColor}`;
}

const WinProb = ({ gameId }) => {
  const [wpData, setWpData] = useState([]);
  const [visibleData, setVisibleData] = useState([]);
  const [teams, setTeams] = useState({ home: {}, away: {} });
  const [loading, setLoading] = useState(true);
  const [selectedPlay, setSelectedPlay] = useState(0);
  const [hoveredPlay, setHoveredPlay] = useState(null);
  const [error, setError] = useState(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [playSpeed, setPlaySpeed] = useState(500);
  const [gameFinished, setGameFinished] = useState(false);
  const [showRecap, setShowRecap] = useState(false);
  const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });
  
  const animationRef = useRef(null);
  const chartRef = useRef(null);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Determine the winner of the game
  const winner = useMemo(() => {
    if (!wpData || !wpData.length) return null;
    
    const finalPlay = wpData[wpData.length - 1];
    if (!finalPlay) return null;
    
    if (finalPlay.homeScore > finalPlay.awayScore) {
      return teams.home;
    } else if (finalPlay.awayScore > finalPlay.homeScore) {
      return teams.away;
    }
    return null; // Tie game
  }, [wpData, teams]);

  // Fetch game data
  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!gameId) {
          setError("No game ID provided");
          setLoading(false);
          return;
        }
        
        console.log("Fetching win probability data for game:", gameId);
        const data = await teamsService.getMetricsWP(gameId);
        
        if (!data || data.length === 0) {
          setError("No win probability data available for this game");
          setLoading(false);
          return;
        }
        
        // Filter out duplicate play numbers
        const uniquePlays = [];
        const playNumbersSeen = {};
        data.forEach(play => {
          if (play && play.playNumber && !playNumbersSeen[play.playNumber]) {
            playNumbersSeen[play.playNumber] = true;
            uniquePlays.push(play);
          }
        });
        
        if (uniquePlays.length === 0) {
          setError("No valid play data available");
          setLoading(false);
          return;
        }
        
        setWpData(uniquePlays);
        setVisibleData([uniquePlays[0]]);
        setSelectedPlay(0);
        
        if (uniquePlays.length > 0 && uniquePlays[0]) {
          const allTeams = await teamsService.getTeams();
          const homeTeam = allTeams.find(t => t && t.id === uniquePlays[0].homeId);
          const awayTeam = allTeams.find(t => t && t.id === uniquePlays[0].awayId);
          
          if (homeTeam && awayTeam) {
            const homeColor = parseColor(
              homeTeam.color,
              parseColor(homeTeam.alt_color, "#007bff")
            );
            const awayColor = parseColor(
              awayTeam.color,
              parseColor(awayTeam.alt_color, "#28a745")
            );
            
            setTeams({ 
              home: { 
                name: uniquePlays[0].home || homeTeam.school || "Home", 
                color: homeColor,
                alternateColor: awayColor,
                logo: homeTeam.logos && homeTeam.logos.length > 0 ? homeTeam.logos[0] : null,
                id: uniquePlays[0].homeId,
                mascot: homeTeam.mascot || "",
              }, 
              away: { 
                name: uniquePlays[0].away || awayTeam.school || "Away", 
                color: awayColor,
                alternateColor: homeColor,
                logo: awayTeam.logos && awayTeam.logos.length > 0 ? awayTeam.logos[0] : null,
                id: uniquePlays[0].awayId,
                mascot: awayTeam.mascot || "",
              }
            });
          } else {
            setTeams({
              home: {
                name: uniquePlays[0].home || "Home Team",
                color: "#007bff",
                alternateColor: "#f8f9fa",
                id: uniquePlays[0].homeId
              },
              away: {
                name: uniquePlays[0].away || "Away Team",
                color: "#28a745",
                alternateColor: "#f8f9fa",
                id: uniquePlays[0].awayId
              }
            });
          }
        }
      } catch (error) {
        console.error("Error fetching win probability metrics:", error);
        setError("Failed to load win probability data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [gameId]);

  // Handle animation
  useEffect(() => {
    if (wpData && wpData.length > 0 && isPlaying) {
      startAnimation();
    } else if (!isPlaying && animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [wpData, isPlaying, playSpeed]);

  // Animation function with error handling
  const startAnimation = useCallback(() => {
    if (!wpData || !wpData.length || !visibleData || !visibleData.length) {
      return;
    }
    
    let currentIndex = visibleData.length;
    let lastUpdateTime = Date.now();
    
    const animate = () => {
      const now = Date.now();
      const deltaTime = now - lastUpdateTime;
      
      if (deltaTime >= playSpeed && currentIndex < wpData.length) {
        try {
          setVisibleData(prev => [...prev, wpData[currentIndex]]);
          setSelectedPlay(currentIndex);
          currentIndex++;
          lastUpdateTime = now;
          
          // When animation reaches the end
          if (currentIndex >= wpData.length) {
            setIsPlaying(false);
            setGameFinished(true);
            setTimeout(() => setShowRecap(true), 800); // Delay recap animation
            return;
          }
        } catch (e) {
          console.error("Animation error:", e);
          setIsPlaying(false);
          return;
        }
      }
      
      if (isPlaying) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };
    
    animationRef.current = requestAnimationFrame(animate);
  }, [wpData, visibleData, playSpeed, isPlaying]);

  // Playback controls
  const togglePlayPause = useCallback(() => {
    if (!isPlaying && visibleData && visibleData.length < wpData.length) {
      setIsPlaying(true);
    } else {
      setIsPlaying(false);
    }
  }, [isPlaying, visibleData, wpData]);

  const resetAnimation = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    if (wpData && wpData.length > 0) {
      setVisibleData([wpData[0]]);
      setSelectedPlay(0);
      setIsPlaying(true);
      setGameFinished(false);
      setShowRecap(false);
    }
  }, [wpData]);

  const skipToEnd = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    if (wpData && wpData.length > 0) {
      setVisibleData(wpData);
      setSelectedPlay(wpData.length - 1);
      setIsPlaying(false);
      setGameFinished(true);
      setTimeout(() => setShowRecap(true), 800);
    }
  }, [wpData]);

  const changeSpeed = useCallback((newSpeed) => {
    setPlaySpeed(newSpeed);
  }, []);

  // Helper functions with null checks
  const getDownString = useCallback((down) => {
    if (!down) return "";
    switch (down) {
      case 1: return "1st Down";
      case 2: return "2nd Down";
      case 3: return "3rd Down";
      case 4: return "4th Down";
      default: return "";
    }
  }, []);

  const formatYardLine = useCallback((yardLine, homeBall) => {
    if (yardLine === undefined || yardLine === null) return "N/A";
    if (!teams || !teams.home || !teams.away) return `${yardLine} yard line`;
    
    if (yardLine <= 50) {
      return `${homeBall ? teams.home.name : teams.away.name} ${yardLine}`;
    } else {
      return `${!homeBall ? teams.home.name : teams.away.name} ${100 - yardLine}`;
    }
  }, [teams]);

  // Chart data and options with robust error handling
  const chartData = useMemo(() => {
    // Ensure visibleData is valid
    if (!visibleData || !visibleData.length) {
      return {
        labels: [],
        datasets: [{
          label: 'Win Probability',
          data: [],
          borderWidth: 3,
          pointRadius: 0,
          tension: 0.2,
          fill: false,
          borderColor: teams && teams.home && teams.home.color ? teams.home.color : '#007bff'
        }]
      };
    }
    
    // Filter out any undefined/null entries
    const safeData = visibleData.filter(item => item != null);
    
    return {
      labels: safeData.map(d => d && d.playNumber ? d.playNumber : 0),
      datasets: [
        {
          label: `Win Probability`,
          data: safeData.map(d => d && d.homeWinProbability !== undefined ? d.homeWinProbability * 100 : 0),
          borderWidth: 3,
          pointRadius: 0,
          pointHoverRadius: 6,
          pointBackgroundColor: (ctx) => {
            const index = ctx.dataIndex;
            if (!safeData[index]) return teams?.home?.color || '#007bff';
            return safeData[index].homeBall ? teams?.home?.color : teams?.away?.color;
          },
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          tension: 0.2,
          fill: false,
          borderColor: teams?.home?.color || '#007bff',
          segment: {
            borderColor: (ctx) => {
              const index = ctx.p0DataIndex;
              if (!safeData[index]) return teams?.home?.color || '#007bff';
              return safeData[index].homeBall ? teams?.home?.color : teams?.away?.color;
            }
          }
        }
      ],
    };
  }, [visibleData, teams]);

  const options = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleFont: { size: 14, weight: 'bold' },
        bodyFont: { size: 13 },
        padding: 12,
        cornerRadius: 4,
        displayColors: false,
        callbacks: {
          title: (tooltipItems) => {
            const idx = tooltipItems[0].dataIndex;
            if (!visibleData || !visibleData[idx]) return "Play";
            return `Play #${visibleData[idx].playNumber || 0}`;
          },
          label: (tooltipItem) => {
            const idx = tooltipItem.dataIndex;
            if (!visibleData || !visibleData[idx]) return "";
            const play = visibleData[idx];
            const homeProb = (play.homeWinProbability * 100).toFixed(1);
            const awayProb = (100 - parseFloat(homeProb)).toFixed(1);
            return [
              `${teams?.home?.name || 'Home'}: ${homeProb}%`,
              `${teams?.away?.name || 'Away'}: ${awayProb}%`,
              "",
              `${play.playText || ''}`,
              `Score: ${play.homeScore || 0}-${play.awayScore || 0}`
            ];
          },
          afterLabel: (tooltipItem) => {
            const idx = tooltipItem.dataIndex;
            if (!visibleData || !visibleData[idx]) return "";
            const play = visibleData[idx];
            const possession = play.homeBall ? teams?.home?.name || 'Home' : teams?.away?.name || 'Away';
            let result = [];
            if (play.down > 0) {
              result.push(`${getDownString(play.down)} & ${play.distance || '?'} at the ${formatYardLine(play.yardLine, play.homeBall)}`);
            }
            result.push(`Possession: ${possession}`);
            return result;
          }
        },
      },
      legend: { display: false },
    },
    interaction: {
      mode: 'index',
      intersect: false,
    },
    onHover: (event, elements, chart) => {
      if (elements && elements.length > 0) {
        setHoveredPlay(elements[0].index);
      } else {
        setHoveredPlay(null);
      }
    },
    onClick: (event, elements, chart) => {
      if (!chart || !visibleData || !visibleData.length) return;
      
      if (elements && elements.length > 0) {
        const index = elements[0].index;
        setSelectedPlay(index);
      } else if (chart.scales && chart.scales.x) {
        try {
          const canvasPosition = Chart.getRelativePosition(event, chart);
          const dataX = chart.scales.x.getValueForPixel(canvasPosition.x);
          if (dataX !== undefined) {
            const closestIdx = Math.min(
              Math.max(0, Math.round(dataX)), 
              visibleData.length - 1
            );
            setSelectedPlay(closestIdx);
          }
        } catch (e) {
          console.error("Chart click error:", e);
        }
      }
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(200, 200, 200, 0.2)',
          drawTicks: false,
          drawBorder: false,
        },
        ticks: {
          maxRotation: 0,
          autoSkip: true,
          maxTicksLimit: windowSize.width < 768 ? 10 : 20,
          color: '#666',
          font: { size: windowSize.width < 768 ? 9 : 11 },
        },
        title: {
          display: true,
          text: "Play Number",
          color: '#333',
          font: { size: windowSize.width < 768 ? 11 : 13, weight: 'bold' },
          padding: { top: 10 },
        },
      },
      y: {
        min: 0,
        max: 100,
        grid: {
          color: 'rgba(200, 200, 200, 0.2)',
          drawTicks: false,
          drawBorder: false,
        },
        ticks: {
          stepSize: 10,
          color: '#666',
          font: { size: windowSize.width < 768 ? 9 : 11 },
          callback: (value) => `${value}%`,
        },
        title: {
          display: true,
          text: "Win Probability",
          color: '#333',
          font: { size: windowSize.width < 768 ? 11 : 13, weight: 'bold' },
          padding: { bottom: 10 },
        },
      },
    },
    animation: {
      duration: 500,
      easing: 'easeOutQuart',
    },
  }), [visibleData, teams, getDownString, formatYardLine, windowSize]);

  // Component rendering functions with error handling
  const renderTeamHeaders = useMemo(() => {
    if (!teams || !teams.home || !teams.away) return null;
    
    const finalScore = visibleData && visibleData.length > 0 ? visibleData[visibleData.length - 1] : null;
    
    return (
      <div className="wp-team-header-container">
        <div className="wp-team-header wp-home-team" style={{ borderColor: teams.home.color || '#007bff' }}>
          <div className="wp-team-logo-container">
            {teams.home.logo && (
              <img 
                src={teams.home.logo} 
                alt={`${teams.home.name} logo`} 
                className="wp-team-logo" 
                loading="eager"
              />
            )}
          </div>
          <div className="wp-team-name-container">
            <h3 className="wp-team-name">{teams.home.name || 'Home'}</h3>
            <span className="wp-team-mascot">{teams.home.mascot || ''}</span>
          </div>
          <div className="wp-team-score" style={{ backgroundColor: teams.home.color || '#007bff' }}>
            {finalScore ? finalScore.homeScore || 0 : "0"}
          </div>
        </div>
        
        <div className="wp-game-status">
          <span>{visibleData && wpData && visibleData.length === wpData.length ? "FINAL" : "LIVE"}</span>
        </div>
        
        <div className="wp-team-header wp-away-team" style={{ borderColor: teams.away.color || '#28a745' }}>
          <div className="wp-team-score" style={{ backgroundColor: teams.away.color || '#28a745' }}>
            {finalScore ? finalScore.awayScore || 0 : "0"}
          </div>
          <div className="wp-team-name-container">
            <h3 className="wp-team-name">{teams.away.name || 'Away'}</h3>
            <span className="wp-team-mascot">{teams.away.mascot || ''}</span>
          </div>
          <div className="wp-team-logo-container">
            {teams.away.logo && (
              <img 
                src={teams.away.logo} 
                alt={`${teams.away.name} logo`} 
                className="wp-team-logo" 
                loading="eager"
              />
            )}
          </div>
        </div>
      </div>
    );
  }, [visibleData, wpData, teams]);

  const renderPossessionLegend = useMemo(() => {
    if (!teams || !teams.home || !teams.away) return null;
    
    return (
      <div className="wp-possession-legend">
        <div className="wp-legend-item">
          <div className="wp-color-box" style={{ backgroundColor: teams.home.color || '#007bff' }}></div>
          <span className="wp-legend-text">{teams.home.name || 'Home'} possession</span>
        </div>
        <div className="wp-legend-item">
          <div className="wp-color-box" style={{ backgroundColor: teams.away.color || '#28a745' }}></div>
          <span className="wp-legend-text">{teams.away.name || 'Away'} possession</span>
        </div>
      </div>
    );
  }, [teams]);

  const renderPlaybackControls = useCallback(() => {
    if (!wpData || !visibleData) return null;
    
    const isComplete = visibleData.length === wpData.length;
    const playButtonIcon = isPlaying ? "⏸" : "▶";
    
    return (
      <div className="wp-playback-controls">
        <button 
          className="wp-control-button" 
          onClick={resetAnimation} 
          disabled={visibleData.length === 1 && !isPlaying}
          title="Restart"
        >
          ⏮
        </button>
        <button 
          className="wp-control-button" 
          onClick={togglePlayPause} 
          disabled={isComplete}
          title={isPlaying ? "Pause" : "Play"}
        >
          {playButtonIcon}
        </button>
        <button 
          className="wp-control-button" 
          onClick={skipToEnd} 
          disabled={isComplete}
          title="Skip to End"
        >
          ⏭
        </button>
        <div className="wp-speed-controls">
          <span>Speed:</span>
          <select 
            value={playSpeed} 
            onChange={(e) => changeSpeed(Number(e.target.value))}
            className="wp-speed-select"
          >
            <option value="1000">Slow</option>
            <option value="500">Normal</option>
            <option value="200">Fast</option>
            <option value="50">Very Fast</option>
          </select>
        </div>
        <div className="wp-progress-indicator">
          Play: {visibleData.length} / {wpData.length}
        </div>
      </div>
    );
  }, [visibleData, wpData, isPlaying, resetAnimation, togglePlayPause, skipToEnd, playSpeed, changeSpeed]);

  const renderPlayDetails = useCallback(() => {
    if (selectedPlay === null || !visibleData || !visibleData[selectedPlay] || !teams) return null;
    
    const play = visibleData[selectedPlay];
    if (!play) return null;
    
    const homeProb = (play.homeWinProbability !== undefined ? play.homeWinProbability * 100 : 0).toFixed(1);
    const awayProb = (100 - parseFloat(homeProb)).toFixed(1);
    const isPossessionHome = play.homeBall;
    const possessionTeam = isPossessionHome ? teams.home : teams.away;
    
    if (!possessionTeam) return null;
    
    return (
      <div className="wp-play-details" style={{ borderLeftColor: possessionTeam.color || '#6c757d' }}>
        <div className="wp-play-header" style={{ backgroundColor: possessionTeam.color || '#6c757d' }}>
          <h3 className="wp-play-title">Play #{play.playNumber || 0}</h3>
        </div>
        <div className="wp-play-content">
          <p className="wp-play-text">{play.playText || 'No play description available'}</p>
          <div className="wp-play-meta">
            <div className="wp-meta-row wp-score-row">
              <div className="wp-score-box wp-home-score" style={{ backgroundColor: teams.home?.color || '#007bff' }}>
                <span className="wp-score-value">{play.homeScore || 0}</span>
                <span className="wp-score-team">{teams.home?.name || 'Home'}</span>
              </div>
              <div className="wp-score-box wp-away-score" style={{ backgroundColor: teams.away?.color || '#28a745' }}>
                <span className="wp-score-value">{play.awayScore || 0}</span>
                <span className="wp-score-team">{teams.away?.name || 'Away'}</span>
              </div>
            </div>
            <div className="wp-meta-row wp-field-position">
              {play.down > 0 ? (
                <div className="wp-down-distance">
                  <strong>{getDownString(play.down)} & {play.distance || '?'}</strong>
                  <span className="wp-yard-line"> at the {formatYardLine(play.yardLine, play.homeBall)}</span>
                </div>
              ) : (
                <div className="wp-down-distance">
                  <span className="wp-yard-line">Ball at the {formatYardLine(play.yardLine, play.homeBall)}</span>
                </div>
              )}
            </div>
            <div className="wp-meta-row wp-possession-indicator">
              <div className="wp-possession-label">
                <span>Possession:</span>
              </div>
              <div className="wp-possession-team" style={{ color: possessionTeam.color || '#6c757d' }}>
                {possessionTeam.name || (isPossessionHome ? 'Home' : 'Away')}
              </div>
            </div>
            <div className="wp-win-probability-bars">
              <div className="wp-prob-bar-container">
                <div className="wp-prob-bar-label">
                  <span>{teams.home?.name || 'Home'}</span>
                  <span className="wp-prob-value">{homeProb}%</span>
                </div>
                <div className="wp-prob-bar-wrapper">
                  <div 
                    className="wp-prob-bar wp-home-prob-bar" 
                    style={{ 
                      width: `${homeProb}%`, 
                      backgroundColor: teams.home?.color || '#007bff' 
                    }}
                  ></div>
                </div>
              </div>
              <div className="wp-prob-bar-container">
                <div className="wp-prob-bar-label">
                  <span>{teams.away?.name || 'Away'}</span>
                  <span className="wp-prob-value">{awayProb}%</span>
                </div>
                <div className="wp-prob-bar-wrapper">
                  <div 
                    className="wp-prob-bar wp-away-prob-bar" 
                    style={{ 
                      width: `${awayProb}%`, 
                      backgroundColor: teams.away?.color || '#28a745' 
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }, [selectedPlay, visibleData, teams, getDownString, formatYardLine]);

  // Game Recap component with error handling
  const renderGameRecap = useCallback(() => {
    if (!winner || !gameFinished || !showRecap || !wpData || !wpData.length || !teams) return null;
    
    const finalPlay = wpData[wpData.length - 1];
    if (!finalPlay) return null;
    
    const homeScore = finalPlay.homeScore || 0;
    const awayScore = finalPlay.awayScore || 0;
    const isTie = homeScore === awayScore;
    
    return (
      <div className={`wp-game-recap ${showRecap ? 'wp-visible' : ''}`}>
        {!isTie && <Confetti 
          width={windowSize.width}
          height={windowSize.height}
          recycle={false}
          numberOfPieces={500}
          colors={[
            winner.color || '#007bff', 
            winner.alternateColor || '#f8f9fa', 
            '#ffffff', 
            '#ffd700'
          ]}
        />}
        
        <div className="wp-recap-content">
          <h2 className="wp-recap-title">Game Recap</h2>
          
          {isTie ? (
            <div className="wp-tie-game">
              <h3>Tie Game!</h3>
              <div className="wp-tie-score">{homeScore} - {awayScore}</div>
            </div>
          ) : (
            <div className="wp-winner-display">
              <div className="wp-winner-label">Winner</div>
              <div className="wp-winner-logo-container">
                {winner.logo && (
                  <img 
                    src={winner.logo} 
                    alt={`${winner.name} logo`} 
                    className="wp-winner-logo" 
                  />
                )}
              </div>
              <h3 className="wp-winner-name" style={{ color: winner.color || '#007bff' }}>
                {winner.name || (homeScore > awayScore ? 'Home' : 'Away')}
              </h3>
              <div className="wp-final-score">
                <span className="wp-score-box" style={{ backgroundColor: teams.home?.color || '#007bff' }}>{homeScore}</span>
                <span className="wp-score-divider">-</span>
                <span className="wp-score-box" style={{ backgroundColor: teams.away?.color || '#28a745' }}>{awayScore}</span>
              </div>
            </div>
          )}
          
          <div className="wp-recap-stats">
            <h4>Key Game Stats</h4>
            <div className="wp-stat-row">
              <div className="wp-stat-item">
                <div className="wp-stat-label">Highest Win Probability ({teams.home?.name || 'Home'})</div>
                <div className="wp-stat-value">
                  {(Math.max(...wpData.map(p => p?.homeWinProbability || 0)) * 100).toFixed(1)}%
                </div>
              </div>
              <div className="wp-stat-item">
                <div className="wp-stat-label">Highest Win Probability ({teams.away?.name || 'Away'})</div>
                <div className="wp-stat-value">
                  {(Math.max(...wpData.map(p => 1 - (p?.homeWinProbability || 0))) * 100).toFixed(1)}%
                </div>
              </div>
            </div>
            <div className="wp-stat-row">
              <div className="wp-stat-item">
                <div className="wp-stat-label">Lead Changes</div>
                <div className="wp-stat-value">
                  {wpData.reduce((count, play, i) => {
                    if (i === 0) return 0;
                    const prevPlay = wpData[i - 1];
                    if (!prevPlay || !play) return count;
                    
                    const prevHomeWinning = (prevPlay.homeWinProbability || 0) > 0.5;
                    const currentHomeWinning = (play.homeWinProbability || 0) > 0.5;
                    return prevHomeWinning !== currentHomeWinning ? count + 1 : count;
                  }, 0)}
                </div>
              </div>
              <div className="wp-stat-item">
                <div className="wp-stat-label">Total Plays</div>
                <div className="wp-stat-value">{wpData.length}</div>
              </div>
            </div>
          </div>
          
          <button className="wp-recap-button" onClick={resetAnimation}>
            Watch Again
          </button>
        </div>
      </div>
    );
  }, [winner, gameFinished, showRecap, wpData, teams, windowSize, resetAnimation]);

  // Loading and error states
  if (loading) {
    return (
      <div className="winprob-container wp-loading-container">
        <div className="wp-loading-spinner"></div>
        <p className="wp-loading-text">Loading win probability data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="winprob-container wp-error-container">
        <div className="wp-error-icon">⚠️</div>
        <p className="wp-error-message">{error}</p>
      </div>
    );
  }

  return (
    <div className="winprob-container">
      {wpData && wpData.length > 0 ? (
        <>
          {renderTeamHeaders}
          <div className="wp-view-advanced">
            <a href="#">View Advanced Box Score</a>
          </div>
          {renderPossessionLegend}
          {!showRecap && renderPlaybackControls()}
          
          <div className={`wp-chart-container ${showRecap ? 'wp-fade-out' : ''}`}>
            <Line data={chartData} options={options} height={400} ref={chartRef} />
          </div>
          
          {selectedPlay !== null && !showRecap && renderPlayDetails()}
          {renderGameRecap()}
        </>
      ) : (
        <div className="wp-no-data-message">
          <div className="wp-no-data-icon">📊</div>
          <p>No win probability data available for this game.</p>
        </div>
      )}
      
      <style jsx>{`
        .winprob-container {
          width: 100%;
          max-width: 100%;
          margin: 0;
          padding: 24px;
          background: #ffffff;
          border-radius: 0;
          box-shadow: 0 4px 12px rgba(0,0,0,0.08);
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          position: relative;
          overflow: hidden;
        }
        /* Team Headers with Logos */
        .wp-team-header-container {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
          width: 100%;
        }
        .wp-team-header {
          display: flex;
          align-items: center;
          width: 45%;
          border-bottom: 4px solid;
          padding-bottom: 12px;
          position: relative;
        }
        .wp-home-team {
          flex-direction: row;
          text-align: left;
        }
        .wp-away-team {
          flex-direction: row-reverse;
          text-align: right;
        }
        .wp-team-logo-container {
          width: 64px;
          height: 64px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
          overflow: hidden;
          background: #f8f8f8;
          box-shadow: 0 2px 6px rgba(0,0,0,0.1);
          padding: 4px;
          box-sizing: border-box;
        }
        .wp-team-logo {
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
          transition: transform 0.3s ease;
        }
        .wp-team-logo:hover {
          transform: scale(1.1);
        }
        .wp-team-name-container {
          padding: 0 12px;
          flex: 1;
        }
        .wp-team-name {
          margin: 0;
          font-size: 1.5rem;
          font-weight: 700;
          line-height: 1.2;
          color: #222;
        }
        .wp-team-mascot {
          font-size: 0.9rem;
          color: #666;
          display: block;
          margin-top: 4px;
        }
        .wp-team-score {
          font-size: 2.2rem;
          font-weight: 700;
          color: white;
          width: 80px;
          height: 80px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
          box-shadow: 0 3px 10px rgba(0,0,0,0.15);
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        .wp-team-score:hover {
          transform: translateY(-3px);
          box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        }
        .wp-game-status {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 8px 16px;
          background-color: #f5f5f5;
          border-radius: 8px;
          margin: 0 16px;
          box-shadow: 0 2px 5px rgba(0,0,0,0.05);
        }
        .wp-game-status span {
          font-size: 0.9rem;
          font-weight: 700;
          color: #333;
          letter-spacing: 1px;
        }
        /* Playback Controls */
        .wp-playback-controls {
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 16px 0 24px;
          padding: 12px;
          background: #f8f8f8;
          border-radius: 8px;
          gap: 16px;
          width: 100%;
          flex-wrap: wrap;
        }
        .wp-control-button {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          border-radius: 8px;
          border: none;
          background: #fff;
          color: #333;
          font-size: 1.2rem;
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          transition: all 0.2s;
        }
        .wp-control-button:hover:not(:disabled) {
          background: #f0f0f0;
          transform: scale(1.05);
        }
        .wp-control-button:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
        .wp-speed-controls {
          display: flex;
          align-items: center;
          margin-left: 16px;
          gap: 8px;
        }
        .wp-speed-controls span {
          font-size: 0.9rem;
          color: #666;
        }
        .wp-speed-select {
          padding: 4px 8px;
          border-radius: 4px;
          border: 1px solid #ddd;
          background: #fff;
          font-size: 0.9rem;
        }
        .wp-progress-indicator {
          margin-left: auto;
          padding: 4px 10px;
          background: #eee;
          border-radius: 8px;
          font-size: 0.85rem;
          color: #555;
        }
        /* View Advanced Link */
        .wp-view-advanced {
          text-align: center;
          margin-bottom: 24px;
          width: 100%;
        }
        .wp-view-advanced a {
          color: #0275d8;
          text-decoration: none;
          font-size: 0.95rem;
          position: relative;
          padding-bottom: 2px;
          transition: color 0.3s;
        }
        .wp-view-advanced a:hover {
          color: #014c8c;
        }
        .wp-view-advanced a::after {
          content: "";
          position: absolute;
          width: 100%;
          height: 1px;
          bottom: 0;
          left: 0;
          background-color: #0275d8;
          transform: scaleX(0);
          transform-origin: bottom right;
          transition: transform 0.3s;
        }
        .wp-view-advanced a:hover::after {
          transform: scaleX(1);
          transform-origin: bottom left;
        }
        /* Possession Legend */
        .wp-possession-legend {
          display: flex;
          justify-content: center;
          align-items: center;
          margin-bottom: 20px;
          flex-wrap: wrap;
          gap: 24px;
          width: 100%;
        }
        .wp-legend-item {
          display: flex;
          align-items: center;
        }
        .wp-color-box {
          display: inline-block;
          width: 16px;
          height: 16px;
          margin-right: 8px;
          border-radius: 3px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        .wp-legend-text {
          font-size: 0.95rem;
          color: #444;
        }
        /* Chart Container */
        .wp-chart-container {
          height: 400px;
          position: relative;
          margin-bottom: 24px;
          border: 1px solid #f0f0f0;
          border-radius: 8px;
          padding: 12px;
          background-color: #fafafa;
          box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.05);
          width: 100%;
          transition: opacity 0.5s ease;
        }
        .wp-chart-container.wp-fade-out {
          opacity: 0;
          height: 0;
          margin: 0;
          padding: 0;
          overflow: hidden;
        }
        /* Play Details Styling */
        .wp-play-details {
          background: #fff;
          margin-top: 30px;
          border-radius: 8px;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
          border-left: 5px solid;
          overflow: hidden;
          width: 100%;
          transition: opacity 0.5s ease;
        }
        .wp-play-header {
          padding: 12px 16px;
        }
        .wp-play-title {
          margin: 0;
          color: white;
          font-size: 1.2rem;
          font-weight: 600;
        }
        .wp-play-content {
          padding: 16px;
        }
        .wp-play-text {
          font-size: 1.05rem;
          line-height: 1.5;
          margin-bottom: 20px;
          color: #333;
          padding-bottom: 16px;
          border-bottom: 1px solid #eee;
        }
        .wp-play-meta {
          background: #f8f8f8;
          padding: 16px;
          border-radius: 6px;
          font-size: 0.95rem;
        }
        .wp-meta-row {
          margin-bottom: 14px;
        }
        .wp-meta-row:last-child {
          margin-bottom: 0;
        }
        .wp-score-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 20px;
        }
        .wp-score-box {
          display: flex;
          flex-direction: column;
          align-items: center;
          color: white;
          border-radius: 6px;
          width: 48%;
          padding: 10px 8px;
        }
        .wp-score-value {
          font-size: 1.6rem;
          font-weight: bold;
          line-height: 1;
        }
        .wp-score-team {
          font-size: 0.85rem;
          margin-top: 5px;
        }
        .wp-field-position {
          background: white;
          padding: 10px 14px;
          border-radius: 4px;
          border-left: 4px solid #ddd;
          font-size: 0.95rem;
        }
        .wp-down-distance {
          color: #333;
        }
        .wp-yard-line {
          color: #555;
        }
        .wp-possession-indicator {
          display: flex;
          align-items: center;
          padding: 8px 0;
          margin: 12px 0;
          border-top: 1px solid #e5e5e5;
          border-bottom: 1px solid #e5e5e5;
        }
        .wp-possession-label {
          color: #777;
          margin-right: 8px;
        }
        .wp-possession-team {
          font-weight: 600;
        }
        .wp-win-probability-bars {
          margin-top: 16px;
        }
        .wp-prob-bar-container {
          margin-bottom: 10px;
        }
        .wp-prob-bar-label {
          display: flex;
          justify-content: space-between;
          margin-bottom: 4px;
          font-size: 0.9rem;
          color: #555;
        }
        .wp-prob-value {
          font-weight: 600;
        }
        .wp-prob-bar-wrapper {
          height: 8px;
          width: 100%;
          background-color: #e9ecef;
          border-radius: 4px;
          overflow: hidden;
        }
        .wp-prob-bar {
          height: 100%;
          border-radius: 4px;
          transition: width 0.4s ease;
        }
        
        /* Game Recap Styling */
        .wp-game-recap {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(255, 255, 255, 0.95);
          display: flex;
          justify-content: center;
          align-items: center;
          opacity: 0;
          visibility: hidden;
          transition: opacity 0.5s ease, visibility 0.5s ease;
          z-index: 10;
          padding: 24px;
          overflow: auto;
        }
        
        .wp-game-recap.wp-visible {
          opacity: 1;
          visibility: visible;
        }
        
        .wp-recap-content {
          background: white;
          border-radius: 12px;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
          padding: 32px;
          max-width: 800px;
          width: 100%;
          text-align: center;
          animation: slideUp 0.6s ease;
        }
        
        @keyframes slideUp {
          from { transform: translateY(30px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        
        .wp-recap-title {
          font-size: 2rem;
          margin-bottom: 32px;
          color: #222;
          position: relative;
          display: inline-block;
        }
        
        .wp-recap-title:after {
          content: '';
          position: absolute;
          bottom: -10px;
          left: 50%;
          transform: translateX(-50%);
          width: 80px;
          height: 3px;
          background: #f0f0f0;
          border-radius: 3px;
        }
        
        .wp-winner-display {
          margin-bottom: 32px;
        }
        
        .wp-winner-label {
          font-size: 1rem;
          text-transform: uppercase;
          letter-spacing: 2px;
          color: #777;
          margin-bottom: 16px;
        }
        
        .wp-winner-logo-container {
          width: 120px;
          height: 120px;
          margin: 0 auto 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.05); }
          100% { transform: scale(1); }
        }
        
        .wp-winner-logo {
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
        }
        
        .wp-winner-name {
          font-size: 2.2rem;
          margin: 0 0 16px;
        }
        
        .wp-final-score {
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.8rem;
          font-weight: bold;
        }
        
        .wp-score-box {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 60px;
          height: 60px;
          color: white;
          border-radius: 8px;
        }
        
        .wp-score-divider {
          margin: 0 12px;
          color: #666;
        }
        
        .wp-tie-game {
          margin-bottom: 32px;
        }
        
        .wp-tie-game h3 {
          font-size: 2rem;
          margin-bottom: 16px;
        }
        
        .wp-tie-score {
          font-size: 2.4rem;
          font-weight: bold;
        }
        
        .wp-recap-stats {
          background: #f8f8f8;
          border-radius: 8px;
          padding: 20px;
          margin-bottom: 32px;
          text-align: left;
        }
        
        .wp-recap-stats h4 {
          font-size: 1.2rem;
          margin-top: 0;
          margin-bottom: 16px;
          color: #444;
          text-align: center;
        }
        
        .wp-stat-row {
          display: flex;
          flex-wrap: wrap;
          gap: 16px;
          margin-bottom: 16px;
        }
        
        .wp-stat-row:last-child {
          margin-bottom: 0;
        }
        
        .wp-stat-item {
          flex: 1;
          min-width: 200px;
          background: white;
          padding: 12px;
          border-radius: 6px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
        }
        
        .wp-stat-label {
          font-size: 0.85rem;
          color: #666;
          margin-bottom: 4px;
        }
        
        .wp-stat-value {
          font-size: 1.1rem;
          font-weight: 600;
          color: #333;
        }
        
        .wp-recap-button {
          background: #0275d8;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 50px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.3s, transform 0.3s;
          box-shadow: 0 3px 6px rgba(0, 0, 0, 0.1);
        }
        
        .wp-recap-button:hover {
          background: #0267bf;
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
        }
        
        /* Loading State */
        .wp-loading-container {
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          height: 300px;
          width: 100%;
        }
        .wp-loading-spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #f3f3f3;
          border-top: 4px solid #0275d8;
          border-radius: 8px;
          animation: spin 1s linear infinite;
          margin-bottom: 16px;
        }
        .wp-loading-text {
          color: #555;
          font-size: 1.1rem;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        /* Error State */
        .wp-error-container {
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          height: 200px;
          color: #721c24;
          background-color: #f8d7da;
          border-radius: 8px;
          width: 100%;
        }
        .wp-error-icon {
          font-size: 2rem;
          margin-bottom: 16px;
        }
        .wp-error-message {
          font-size: 1.1rem;
        }
        /* No Data State */
        .wp-no-data-message {
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          height: 200px;
          color: #0c5460;
          background-color: #d1ecf1;
          border-radius: 8px;
          padding: 24px;
          width: 100%;
        }
        .wp-no-data-icon {
          font-size: 2rem;
          margin-bottom: 16px;
        }
        
        /* Responsive Styles */
        @media (max-width: 992px) {
          .wp-recap-content {
            padding: 24px;
          }
          
          .wp-winner-logo-container {
            width: 100px;
            height: 100px;
          }
          
          .wp-winner-name {
            font-size: 1.8rem;
          }
          
          .wp-final-score {
            font-size: 1.6rem;
          }
          
          .wp-score-box {
            width: 50px;
            height: 50px;
          }
        }
        
        @media (max-width: 768px) {
          .wp-team-header-container {
            flex-direction: column;
            gap: 16px;
          }
          
          .wp-team-header {
            width: 100%;
          }
          
          .wp-game-status {
            margin: 8px 0;
            width: 100%;
            text-align: center;
          }
          
          .wp-playback-controls {
            padding: 10px;
            gap: 8px;
          }
          
          .wp-speed-controls {
            margin-left: 0;
            width: 100%;
            justify-content: center;
            margin-top: 8px;
          }
          
          .wp-progress-indicator {
            margin-left: 0;
            width: 100%;
            text-align: center;
            margin-top: 8px;
          }
          
          .wp-chart-container {
            height: 300px;
          }
          
          .wp-recap-content {
            padding: 16px;
          }
          
          .wp-recap-title {
            font-size: 1.5rem;
          }
          
          .wp-winner-logo-container {
            width: 80px;
            height: 80px;
          }
          
          .wp-winner-name {
            font-size: 1.5rem;
          }
          
          .wp-final-score {
            font-size: 1.3rem;
          }
          
          .wp-score-box {
            width: 40px;
            height: 40px;
          }
          
          .wp-stat-row {
            flex-direction: column;
          }
        }
        
        @media (max-width: 480px) {
          .winprob-container {
            padding: 16px;
          }
          
          .wp-team-logo-container {
            width: 48px;
            height: 48px;
          }
          
          .wp-team-name {
            font-size: 1.2rem;
          }
          
          .wp-team-score {
            width: 60px;
            height: 60px;
            font-size: 1.8rem;
          }
          
          .wp-control-button {
            width: 36px;
            height: 36px;
          }
          
          .wp-chart-container {
            height: 250px;
            padding: 8px;
          }
          
          .wp-play-text {
            font-size: 0.95rem;
          }
          
          .wp-recap-content {
            padding: 12px;
          }
          
          .wp-winner-logo-container {
            width: 70px;
            height: 70px;
          }
          
          .wp-winner-name {
            font-size: 1.3rem;
          }
          
          .wp-recap-button {
            padding: 10px 20px;
            font-size: 0.9rem;
          }
        }
      `}</style>
    </div>
  );
};

export default WinProb;