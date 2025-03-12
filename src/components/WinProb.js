import React, { useEffect, useState, useRef } from "react";
import { Line } from "react-chartjs-2";
import teamsService from "../services/teamsService";

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
  // If rawColor is null, undefined, empty string, or literally "#null", use fallback
  if (!rawColor || rawColor.toLowerCase() === "#null") {
    return fallback;
  }
  return rawColor;
}

const WinProb = ({ gameId }) => {
  const [wpData, setWpData] = useState([]);
  const [visibleData, setVisibleData] = useState([]);
  const [teams, setTeams] = useState({ home: {}, away: {} });
  const [loading, setLoading] = useState(true);
  const [selectedPlay, setSelectedPlay] = useState(0); // Default to first play
  const [hoveredPlay, setHoveredPlay] = useState(null);
  const [error, setError] = useState(null);
  const [isPlaying, setIsPlaying] = useState(true); // Auto-play by default
  const [playSpeed, setPlaySpeed] = useState(500); // Animation speed in ms
  const animationRef = useRef(null);
  const chartRef = useRef(null);

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
          if (!playNumbersSeen[play.playNumber]) {
            playNumbersSeen[play.playNumber] = true;
            uniquePlays.push(play);
          }
        });
        
        setWpData(uniquePlays);
        // Initialize with just the first play
        setVisibleData([uniquePlays[0]]);
        setSelectedPlay(0);
        
        if (uniquePlays.length > 0) {
          // Get all teams first
          const allTeams = await teamsService.getTeams();
          
          // Find the home and away teams from the complete team list
          const homeTeam = allTeams.find(t => t.id === uniquePlays[0].homeId);
          const awayTeam = allTeams.find(t => t.id === uniquePlays[0].awayId);
          
          if (homeTeam && awayTeam) {
            // Safely parse the color or alt_color, falling back to a default
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
            // Fallback if we can't find the teams
            setTeams({
              home: {
                name: uniquePlays[0].home || "Home Team",
                color: "#007bff",
                id: uniquePlays[0].homeId
              },
              away: {
                name: uniquePlays[0].away || "Away Team",
                color: "#28a745",
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
    
    // Cleanup animation on component unmount
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [gameId]);

  // Start animation when data is loaded and animation is set to play
  useEffect(() => {
    if (wpData.length > 0 && isPlaying) {
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

  // Animation function to show plays one by one
  const startAnimation = () => {
    let currentIndex = visibleData.length;
    let lastUpdateTime = Date.now();
    
    const animate = () => {
      const now = Date.now();
      const deltaTime = now - lastUpdateTime;
      
      if (deltaTime >= playSpeed && currentIndex < wpData.length) {
        // Add the next play
        setVisibleData(prev => [...prev, wpData[currentIndex]]);
        setSelectedPlay(currentIndex);
        
        currentIndex++;
        lastUpdateTime = now;
        
        // Stop animation when we reach the end
        if (currentIndex >= wpData.length) {
          setIsPlaying(false);
          return;
        }
      }
      
      if (isPlaying) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };
    
    animationRef.current = requestAnimationFrame(animate);
  };

  // Toggle play/pause
  const togglePlayPause = () => {
    if (!isPlaying && visibleData.length < wpData.length) {
      setIsPlaying(true);
    } else {
      setIsPlaying(false);
    }
  };

  // Reset animation
  const resetAnimation = () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    setVisibleData([wpData[0]]);
    setSelectedPlay(0);
    setIsPlaying(true);
  };

  // Skip to end
  const skipToEnd = () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    setVisibleData(wpData);
    setSelectedPlay(wpData.length - 1);
    setIsPlaying(false);
  };

  // Change playback speed
  const changeSpeed = (newSpeed) => {
    setPlaySpeed(newSpeed);
  };

  // Helper function to format down
  const getDownString = (down) => {
    switch (down) {
      case 1: return "1st Down";
      case 2: return "2nd Down";
      case 3: return "3rd Down";
      case 4: return "4th Down";
      default: return "";
    }
  };

  // Format yard line for display
  const formatYardLine = (yardLine, homeBall) => {
    if (yardLine <= 50) {
      return `${homeBall ? teams.home.name : teams.away.name} ${yardLine}`;
    } else {
      return `${!homeBall ? teams.home.name : teams.away.name} ${100 - yardLine}`;
    }
  };

  // Prepare data for Chart.js with team color based on possession
  const chartData = {
    labels: visibleData.map((d) => d.playNumber),
    datasets: [
      {
        label: `Win Probability`,
        data: visibleData.map((d) => d.homeWinProbability * 100),
        borderWidth: 3,
        pointRadius: 0,
        pointHoverRadius: 6,
        // Set point color based on which team has possession
        pointBackgroundColor: (ctx) => {
          const index = ctx.dataIndex;
          if (!visibleData[index]) return teams.home.color;
          return visibleData[index].homeBall ? teams.home.color : teams.away.color;
        },
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        tension: 0.2,
        fill: false,
        // Default borderColor (used if no segment callback)
        borderColor: teams.home.color,
        // Use the segment API to color each line segment based on possession
        segment: {
          borderColor: (ctx) => {
            const index = ctx.p0DataIndex;
            if (!visibleData[index]) return teams.home.color;
            return visibleData[index].homeBall ? teams.home.color : teams.away.color;
          }
        }
      }
    ],
  };

  const options = {
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
            if (!visibleData[idx]) return "Play";
            return `Play #${visibleData[idx].playNumber}`;
          },
          label: (tooltipItem) => {
            const idx = tooltipItem.dataIndex;
            if (!visibleData[idx]) return "";
            
            const play = visibleData[idx];
            const homeProb = (play.homeWinProbability * 100).toFixed(1);
            const awayProb = (100 - parseFloat(homeProb)).toFixed(1);
            
            return [
              `${teams.home.name}: ${homeProb}%`,
              `${teams.away.name}: ${awayProb}%`,
              "",
              `${play.playText}`,
              `Score: ${play.homeScore}-${play.awayScore}`
            ];
          },
          afterLabel: (tooltipItem) => {
            const idx = tooltipItem.dataIndex;
            if (!visibleData[idx]) return "";
            
            const play = visibleData[idx];
            const possession = play.homeBall ? teams.home.name : teams.away.name;
            let result = [];
            
            if (play.down > 0) {
              result.push(`${getDownString(play.down)} & ${play.distance} at the ${formatYardLine(play.yardLine, play.homeBall)}`);
            }
            
            result.push(`Possession: ${possession}`);
            return result;
          }
        },
      },
      legend: {
        display: false,
      },
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
      if (elements && elements.length > 0) {
        const index = elements[0].index;
        setSelectedPlay(index);
      } else if (chart && chart.scales && chart.scales.x) {
        const canvasPosition = Chart.getRelativePosition(event, chart);
        const dataX = chart.scales.x.getValueForPixel(canvasPosition.x);
        
        if (dataX !== undefined && visibleData.length > 0) {
          const closestIdx = Math.min(
            Math.max(0, Math.round(dataX)), 
            visibleData.length - 1
          );
          setSelectedPlay(closestIdx);
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
          maxTicksLimit: 20,
          color: '#666',
          font: {
            size: 11,
          },
        },
        title: {
          display: true,
          text: "Play Number",
          color: '#333',
          font: {
            size: 13,
            weight: 'bold',
          },
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
          font: {
            size: 11,
          },
          callback: (value) => `${value}%`,
        },
        title: {
          display: true,
          text: "Win Probability",
          color: '#333',
          font: {
            size: 13,
            weight: 'bold',
          },
          padding: { bottom: 10 },
        },
      },
    },
    animation: {
      duration: 500, // Faster animations for real-time updates
      easing: 'easeOutQuart',
    },
  };

  // Display team headers with logos and scores
  const renderTeamHeaders = () => {
    const currentPlay = visibleData.length > 0 ? visibleData[visibleData.length - 1] : null;
    
    return (
      <div className="team-header-container">
        <div className="team-header home-team" style={{ borderColor: teams.home.color }}>
          <div className="team-logo-container">
            {teams.home.logo && (
              <img 
                src={teams.home.logo} 
                alt={`${teams.home.name} logo`} 
                className="team-logo" 
              />
            )}
          </div>
          <div className="team-name-container">
            <h3 className="team-name">{teams.home.name}</h3>
            <span className="team-mascot">{teams.home.mascot}</span>
          </div>
          <div className="team-score" style={{ backgroundColor: teams.home.color }}>
            {currentPlay ? currentPlay.homeScore : "0"}
          </div>
        </div>
        
        <div className="game-status">
          <span>{visibleData.length === wpData.length ? "FINAL" : "LIVE"}</span>
        </div>
        
        <div className="team-header away-team" style={{ borderColor: teams.away.color }}>
          <div className="team-score" style={{ backgroundColor: teams.away.color }}>
            {currentPlay ? currentPlay.awayScore : "0"}
          </div>
          <div className="team-name-container">
            <h3 className="team-name">{teams.away.name}</h3>
            <span className="team-mascot">{teams.away.mascot}</span>
          </div>
          <div className="team-logo-container">
            {teams.away.logo && (
              <img 
                src={teams.away.logo} 
                alt={`${teams.away.name} logo`} 
                className="team-logo" 
              />
            )}
          </div>
        </div>
      </div>
    );
  };

  // Color-coded possession legend
  const renderPossessionLegend = () => {
    return (
      <div className="possession-legend">
        <div className="legend-item">
          <div className="color-box" style={{ backgroundColor: teams.home.color }}></div>
          <span className="legend-text">{teams.home.name} possession</span>
        </div>
        <div className="legend-item">
          <div className="color-box" style={{ backgroundColor: teams.away.color }}></div>
          <span className="legend-text">{teams.away.name} possession</span>
        </div>
      </div>
    );
  };

  // Playback controls
  const renderPlaybackControls = () => {
    const isComplete = visibleData.length === wpData.length;
    const playButtonIcon = isPlaying ? "⏸" : "▶";
    
    return (
      <div className="playback-controls">
        <button 
          className="control-button" 
          onClick={resetAnimation} 
          disabled={visibleData.length === 1 && !isPlaying}
          title="Restart"
        >
          ⏮
        </button>
        
        <button 
          className="control-button" 
          onClick={togglePlayPause} 
          disabled={isComplete}
          title={isPlaying ? "Pause" : "Play"}
        >
          {playButtonIcon}
        </button>
        
        <button 
          className="control-button" 
          onClick={skipToEnd} 
          disabled={isComplete}
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
            <option value="1000">Slow</option>
            <option value="500">Normal</option>
            <option value="200">Fast</option>
            <option value="50">Very Fast</option>
          </select>
        </div>
        
        <div className="progress-indicator">
          Play: {visibleData.length} / {wpData.length}
        </div>
      </div>
    );
  };

  // Display selected play details
  const renderPlayDetails = () => {
    if (selectedPlay === null || !visibleData[selectedPlay]) return null;
    
    const play = visibleData[selectedPlay];
    const homeProb = (play.homeWinProbability * 100).toFixed(1);
    const awayProb = (100 - parseFloat(homeProb)).toFixed(1);
    const isPossessionHome = play.homeBall;
    const possessionTeam = isPossessionHome ? teams.home : teams.away;
    
    return (
      <div className="play-details" style={{ borderLeftColor: possessionTeam.color }}>
        <div className="play-header" style={{ backgroundColor: possessionTeam.color }}>
          <h3 className="play-title">Play #{play.playNumber}</h3>
        </div>
        
        <div className="play-content">
          <p className="play-text">{play.playText}</p>
          
          <div className="play-meta">
            <div className="meta-row score-row">
              <div className="score-box home-score" style={{ backgroundColor: teams.home.color }}>
                <span className="score-value">{play.homeScore}</span>
                <span className="score-team">{teams.home.name}</span>
              </div>
              <div className="score-box away-score" style={{ backgroundColor: teams.away.color }}>
                <span className="score-value">{play.awayScore}</span>
                <span className="score-team">{teams.away.name}</span>
              </div>
            </div>
            
            <div className="meta-row field-position">
              {play.down > 0 ? (
                <div className="down-distance">
                  <strong>{getDownString(play.down)} & {play.distance}</strong>
                  <span className="yard-line"> at the {formatYardLine(play.yardLine, play.homeBall)}</span>
                </div>
              ) : (
                <div className="down-distance">
                  <span className="yard-line">Ball at the {formatYardLine(play.yardLine, play.homeBall)}</span>
                </div>
              )}
            </div>
            
            <div className="meta-row possession-indicator">
              <div className="possession-label">
                <span>Possession:</span>
              </div>
              <div className="possession-team" style={{ color: possessionTeam.color }}>
                {possessionTeam.name}
              </div>
            </div>
            
            <div className="win-probability-bars">
              <div className="prob-bar-container">
                <div className="prob-bar-label">
                  <span>{teams.home.name}</span>
                  <span className="prob-value">{homeProb}%</span>
                </div>
                <div className="prob-bar-wrapper">
                  <div 
                    className="prob-bar home-prob-bar" 
                    style={{ 
                      width: `${homeProb}%`, 
                      backgroundColor: teams.home.color 
                    }}
                  ></div>
                </div>
              </div>
              
              <div className="prob-bar-container">
                <div className="prob-bar-label">
                  <span>{teams.away.name}</span>
                  <span className="prob-value">{awayProb}%</span>
                </div>
                <div className="prob-bar-wrapper">
                  <div 
                    className="prob-bar away-prob-bar" 
                    style={{ 
                      width: `${awayProb}%`, 
                      backgroundColor: teams.away.color 
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="winprob-container loading-container">
        <div className="loading-spinner"></div>
        <p className="loading-text">Loading win probability data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="winprob-container error-container">
        <div className="error-icon">⚠️</div>
        <p className="error-message">{error}</p>
      </div>
    );
  }

  return (
    <div className="winprob-container">
      {wpData.length > 0 ? (
        <>
          {renderTeamHeaders()}
          
          <div className="view-advanced">
            <a href="#">View Advanced Box Score</a>
          </div>
          
          {renderPossessionLegend()}
          {renderPlaybackControls()}
          
          <div className="chart-container">
            <Line data={chartData} options={options} height={400} ref={chartRef} />
          </div>
          
          {selectedPlay !== null && renderPlayDetails()}
        </>
      ) : (
        <div className="no-data-message">
          <div className="no-data-icon">📊</div>
          <p>No win probability data available for this game.</p>
        </div>
      )}
      
      <style jsx>{`
         .winprob-container {
          width: 100%;
          max-width: 100%; /* Changed from 1200px to 100% */
          margin: 0; /* Changed from 20px auto to 0 */
          padding: 24px 0; /* Removed horizontal padding */
          background: #ffffff;
          border-radius: 0; /* Changed from 10px to 0 */
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        }
        
        /* Team Headers with Logos */
        .team-header-container {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
          padding: 0 24px; /* Added horizontal padding */
        }
        
        .team-header {
          display: flex;
          align-items: center;
          width: 45%;
          border-bottom: 4px solid;
          padding-bottom: 12px;
          position: relative;
        }
        
        .home-team {
          flex-direction: row;
          text-align: left;
        }
        
        .away-team {
          flex-direction: row-reverse;
          text-align: right;
        }
        
        .team-logo-container {
          width: 60px;
          height: 60px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .team-logo {
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
        }
        
        .team-name-container {
          padding: 0 12px;
          flex: 1;
        }
        
        .team-name {
          margin: 0;
          font-size: 1.4rem;
          font-weight: 700;
          line-height: 1.2;
          color: #222;
        }
        
        .team-mascot {
          font-size: 0.9rem;
          color: #666;
          display: block;
          margin-top: 4px;
        }
        
        .team-score {
          font-size: 2rem;
          font-weight: 700;
          color: white;
          width: 64px;
          height: 64px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 0; /* Changed from 8px to 0 */
        }
        
        .game-status {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 8px 16px;
          background-color: #f5f5f5;
          border-radius: 0; /* Changed from 20px to 0 */
          margin: 0 16px;
        }
        
        .game-status span {
          font-size: 0.9rem;
          font-weight: 700;
          color: #333;
          letter-spacing: 1px;
        }
        
        /* Playback Controls */
        .playback-controls {
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 16px 24px 24px; /* Added horizontal margin */
          padding: 12px;
          background: #f8f8f8;
          border-radius: 0; /* Changed from 8px to 0 */
          gap: 16px;
        }
        
        .control-button {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          border-radius: 0; /* Changed from 50% to 0 */
          border: none;
          background: #fff;
          color: #333;
          font-size: 1.2rem;
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          transition: all 0.2s;
        }
        
        .control-button:hover:not(:disabled) {
          background: #f0f0f0;
          transform: scale(1.05);
        }
        
        .control-button:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
        
        .speed-controls {
          display: flex;
          align-items: center;
          margin-left: 16px;
          gap: 8px;
        }
        
        .speed-controls span {
          font-size: 0.9rem;
          color: #666;
        }
        
        .speed-select {
          padding: 4px 8px;
          border-radius: 0; /* Changed from 4px to 0 */
          border: 1px solid #ddd;
          background: #fff;
          font-size: 0.9rem;
        }
        
        .progress-indicator {
          margin-left: auto;
          padding: 4px 10px;
          background: #eee;
          border-radius: 0; /* Changed from 12px to 0 */
          font-size: 0.85rem;
          color: #555;
        }
        
        /* View Advanced Link */
        .view-advanced {
          text-align: center;
          margin-bottom: 24px;
          padding: 0 24px; /* Added horizontal padding */
        }
        
        .view-advanced a {
          color: #0275d8;
          text-decoration: none;
          font-size: 0.95rem;
          position: relative;
          padding-bottom: 2px;
          transition: color 0.3s;
        }
        
        .view-advanced a:hover {
          color: #014c8c;
        }
        
        .view-advanced a::after {
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
        
        .view-advanced a:hover::after {
          transform: scaleX(1);
          transform-origin: bottom left;
        }
        
        /* Possession Legend */
        .possession-legend {
          display: flex;
          justify-content: center;
          align-items: center;
          margin-bottom: 20px;
          flex-wrap: wrap;
          gap: 24px;
          padding: 0 24px; /* Added horizontal padding */
        }
        
        .legend-item {
          display: flex;
          align-items: center;
        }
        
        .color-box {
          display: inline-block;
          width: 16px;
          height: 16px;
          margin-right: 8px;
          border-radius: 0; /* Changed from 3px to 0 */
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        
        .legend-text {
          font-size: 0.95rem;
          color: #444;
        }
        
        /* Chart Container */
        .chart-container {
          height: 400px;
          position: relative;
          margin: 0 24px 24px; /* Changed from margin-bottom to margin with horizontal padding */
          border: 1px solid #f0f0f0;
          border-radius: 0; /* Changed from 8px to 0 */
          padding: 12px;
          background-color: #fafafa;
          box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.05);
        }
        
        /* Play Details Styling */
        .play-details {
          background: #fff;
          margin: 30px 24px 0; /* Added horizontal margin */
          border-radius: 0; /* Changed from 8px to 0 */
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
          border-left: 5px solid;
          overflow: hidden;
        }
        
        .play-header {
          padding: 12px 16px;
        }
        
        .play-title {
          margin: 0;
          color: white;
          font-size: 1.2rem;
          font-weight: 600;
        }
        
        .play-content {
          padding: 16px;
        }
        
        .play-text {
          font-size: 1.05rem;
          line-height: 1.5;
          margin-bottom: 20px;
          color: #333;
          padding-bottom: 16px;
          border-bottom: 1px solid #eee;
        }
        
        .play-meta {
          background: #f8f8f8;
          padding: 16px;
          border-radius: 0; /* Changed from 6px to 0 */
          font-size: 0.95rem;
        }
        
        .meta-row {
          margin-bottom: 14px;
        }
        
        .meta-row:last-child {
          margin-bottom: 0;
        }
        
        .score-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 20px;
        }
        
        .score-box {
          display: flex;
          flex-direction: column;
          align-items: center;
          color: white;
          border-radius: 0; /* Changed from 6px to 0 */
          width: 48%;
          padding: 10px 8px;
        }
        
        .score-value {
          font-size: 1.6rem;
          font-weight: bold;
          line-height: 1;
        }
        
        .score-team {
          font-size: 0.85rem;
          margin-top: 5px;
        }
        
        .field-position {
          background: white;
          padding: 10px 14px;
          border-radius: 0; /* Changed from 4px to 0 */
          border-left: 4px solid #ddd;
          font-size: 0.95rem;
        }
        
        .down-distance {
          color: #333;
        }
        
        .yard-line {
          color: #555;
        }
        
        .possession-indicator {
          display: flex;
          align-items: center;
          padding: 8px 0;
          margin: 12px 0;
          border-top: 1px solid #e5e5e5;
          border-bottom: 1px solid #e5e5e5;
        }
        
        .possession-label {
          color: #777;
          margin-right: 8px;
        }
        
        .possession-team {
          font-weight: 600;
        }
        
        .win-probability-bars {
          margin-top: 16px;
        }
        
        .prob-bar-container {
          margin-bottom: 10px;
        }
        
        .prob-bar-label {
          display: flex;
          justify-content: space-between;
          margin-bottom: 4px;
          font-size: 0.9rem;
          color: #555;
        }
        
        .prob-value {
          font-weight: 600;
        }
        
        .prob-bar-wrapper {
          height: 8px;
          width: 100%;
          background-color: #e9ecef;
          border-radius: 0; /* Changed from 4px to 0 */
          overflow: hidden;
        }
        
        .prob-bar {
          height: 100%;
          border-radius: 0; /* Changed from 4px to 0 */
          transition: width 0.4s ease;
        }
        
        /* Loading State */
        .loading-container {
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          height: 300px;
          margin: 0 24px; /* Added horizontal margin */
        }
        
        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #f3f3f3;
          border-top: 4px solid #0275d8;
          border-radius: 0; /* Changed from 50% to 0 */
          animation: spin 1s linear infinite;
          margin-bottom: 16px;
        }
        
        .loading-text {
          color: #555;
          font-size: 1.1rem;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        /* Error State */
        .error-container {
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          height: 200px;
          color: #721c24;
          background-color: #f8d7da;
          border-radius: 0; /* Changed from 8px to 0 */
          margin: 0 24px; /* Added horizontal margin */
        }
        
        .error-icon {
          font-size: 2rem;
          margin-bottom: 16px;
        }
        
        .error-message {
          font-size: 1.1rem;
        }
        
        /* No Data State */
        .no-data-message {
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          height: 200px;
          color: #0c5460;
          background-color: #d1ecf1;
          border-radius: 0; /* Changed from 8px to 0 */
          padding: 24px;
          margin: 0 24px; /* Added horizontal margin */
        }
        
        .no-data-icon {
          font-size: 2rem;
          margin-bottom: 16px;
        }
      `}</style>
    </div>
  );
};

export default WinProb;
