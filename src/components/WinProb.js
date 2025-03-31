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
  Filler
} from "chart.js";
// Annotations need to be imported as a separate package
// You'll need to run: npm install chartjs-plugin-annotation
// and then implement like this:
// import annotationPlugin from 'chartjs-plugin-annotation';

Chart.register(
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  Tooltip, 
  Legend, 
  Filler
  // annotationPlugin
);

// Safely parse a team's color or alt_color
function parseColor(rawColor, fallback) {
  if (!rawColor || rawColor === null || rawColor.toLowerCase() === "#null") {
    return fallback;
  }
  return rawColor.startsWith("#") ? rawColor : `#${rawColor}`;
}

// Find key plays with significant win probability changes
function identifyKeyPlays(wpData, threshold = 0.07) {
  if (!wpData || wpData.length < 2) return [];
  
  const keyPlays = [];
  for (let i = 1; i < wpData.length; i++) {
    const currentPlay = wpData[i];
    const previousPlay = wpData[i-1];
    
    if (!currentPlay || !previousPlay) continue;
    
    const wpChange = Math.abs(
      (currentPlay.homeWinProbability || 0) - (previousPlay.homeWinProbability || 0)
    );
    
    if (wpChange >= threshold) {
      keyPlays.push({
        playIndex: i,
        wpChange: wpChange,
        homeWinProbBefore: previousPlay.homeWinProbability || 0,
        homeWinProbAfter: currentPlay.homeWinProbability || 0,
        playData: currentPlay
      });
    }
  }
  
  // Sort by impact (largest change first)
  return keyPlays.sort((a, b) => b.wpChange - a.wpChange);
}

// Identify scoring plays
function identifyScoringPlays(wpData) {
  if (!wpData || wpData.length < 2) return [];
  
  const scoringPlays = [];
  let prevHomeScore = wpData[0]?.homeScore || 0;
  let prevAwayScore = wpData[0]?.awayScore || 0;
  
  for (let i = 1; i < wpData.length; i++) {
    const play = wpData[i];
    if (!play) continue;
    
    const currHomeScore = play.homeScore || 0;
    const currAwayScore = play.awayScore || 0;
    
    if (currHomeScore > prevHomeScore || currAwayScore > prevAwayScore) {
      scoringPlays.push({
        playIndex: i,
        homeScoreChange: currHomeScore - prevHomeScore,
        awayScoreChange: currAwayScore - prevAwayScore,
        isTouchdown: 
          (currHomeScore - prevHomeScore >= 6) || 
          (currAwayScore - prevAwayScore >= 6),
        playData: play
      });
    }
    
    prevHomeScore = currHomeScore;
    prevAwayScore = currAwayScore;
  }
  
  return scoringPlays;
}

// Calculate success rate by down
function calculateSuccessRates(wpData) {
  if (!wpData || wpData.length < 2) return {};
  
  const successCriteria = {
    1: 0.4, // 40% of needed yards on 1st down
    2: 0.6, // 60% of needed yards on 2nd down
    3: 1.0, // 100% of needed yards on 3rd down
    4: 1.0  // 100% of needed yards on 4th down
  };
  
  const downStats = {
    1: { attempts: 0, successes: 0 },
    2: { attempts: 0, successes: 0 },
    3: { attempts: 0, successes: 0 },
    4: { attempts: 0, successes: 0 }
  };
  
  const patterns = {
    touchdown: /touchdown|TD|for a TD/i,
    fieldGoal: /field goal|FG good/i,
    firstDown: /for a 1ST down|for a first down/i,
    yards: /for (\d+) yds/i,
    gain: /gain of (\d+)/i,
    loss: /loss of (\d+)/i
  };
  
  for (let i = 0; i < wpData.length; i++) {
    const play = wpData[i];
    if (!play || !play.down || play.down < 1 || play.down > 4) continue;
    
    const down = play.down;
    const distance = play.distance || 10;
    const playText = play.playText || '';
    
    if (playText.match(patterns.touchdown) || playText.match(patterns.fieldGoal)) {
      // Scoring plays are always successful
      downStats[down].attempts++;
      downStats[down].successes++;
      continue;
    }
    
    if (playText.match(patterns.firstDown)) {
      // First down conversions are always successful
      downStats[down].attempts++;
      downStats[down].successes++;
      continue;
    }
    
    // Extract yards gained
    let yardsGained = 0;
    const yardsMatch = playText.match(patterns.yards) || playText.match(patterns.gain);
    if (yardsMatch && yardsMatch[1]) {
      yardsGained = parseInt(yardsMatch[1], 10);
    } else {
      const lossMatch = playText.match(patterns.loss);
      if (lossMatch && lossMatch[1]) {
        yardsGained = -parseInt(lossMatch[1], 10);
      }
    }
    
    // Only count plays where we can determine yards gained
    if (Number.isFinite(yardsGained)) {
      downStats[down].attempts++;
      
      // Check if the play was successful based on down criteria
      const requiredYards = distance * successCriteria[down];
      if (yardsGained >= requiredYards) {
        downStats[down].successes++;
      }
    }
  }
  
  // Calculate success rates
  const successRates = {};
  for (const down in downStats) {
    const { attempts, successes } = downStats[down];
    successRates[down] = attempts > 0 ? (successes / attempts) : 0;
  }
  
  return { downStats, successRates };
}

// Calculate expected points added (EPA) based on field position
function calculateEPA(wpData) {
  // Simple expected points model based on field position
  const getExpectedPoints = (yardLine) => {
    if (!yardLine || yardLine < 1 || yardLine > 99) return 0;
    
    if (yardLine <= 10) return 5.5; // Near opponent's end zone (high value)
    if (yardLine <= 20) return 4.0;
    if (yardLine <= 50) return 3.0 - ((yardLine - 20) * 0.05); // Decreasing as you move away
    if (yardLine <= 80) return 1.5 - ((yardLine - 50) * 0.03); // Negative in own territory
    return 0.5; // Deep in own territory
  };
  
  if (!wpData || wpData.length < 2) return [];
  
  const epaByPlay = [];
  
  for (let i = 1; i < wpData.length; i++) {
    const currentPlay = wpData[i];
    const previousPlay = wpData[i-1];
    
    if (!currentPlay || !previousPlay) continue;
    
    const prevYardLine = previousPlay.yardLine || 0;
    const currYardLine = currentPlay.yardLine || 0;
    
    // Adjust yard line based on possession
    const adjustedPrevYardLine = previousPlay.homeBall ? prevYardLine : 100 - prevYardLine;
    const adjustedCurrYardLine = currentPlay.homeBall ? currYardLine : 100 - currYardLine;
    
    const prevEP = getExpectedPoints(adjustedPrevYardLine);
    const currEP = getExpectedPoints(adjustedCurrYardLine);
    
    // Check if scoring occurred on this play
    let pointsScored = 0;
    if (currentPlay.homeScore !== previousPlay.homeScore || 
        currentPlay.awayScore !== previousPlay.awayScore) {
      const homeScoreDiff = (currentPlay.homeScore || 0) - (previousPlay.homeScore || 0);
      const awayScoreDiff = (currentPlay.awayScore || 0) - (previousPlay.awayScore || 0);
      pointsScored = currentPlay.homeBall ? homeScoreDiff : awayScoreDiff;
    }
    
    // EPA calculation
    const epa = (currEP - prevEP) + pointsScored;
    
    epaByPlay.push({
      playIndex: i,
      epa: epa,
      playData: currentPlay
    });
  }
  
  return epaByPlay;
}

// Get game control metric - which team controlled the game longer
function calculateGameControl(wpData) {
  if (!wpData || wpData.length < 2) return { home: 0.5, away: 0.5 };
  
  let homeControl = 0;
  let awayControl = 0;
  
  for (let i = 0; i < wpData.length; i++) {
    const play = wpData[i];
    if (!play || play.homeWinProbability === undefined) continue;
    
    if (play.homeWinProbability > 0.5) {
      homeControl++;
    } else if (play.homeWinProbability < 0.5) {
      awayControl++;
    } else {
      // Equal 0.5 probability - split the control
      homeControl += 0.5;
      awayControl += 0.5;
    }
  }
  
  const total = homeControl + awayControl;
  return {
    home: total > 0 ? homeControl / total : 0.5,
    away: total > 0 ? awayControl / total : 0.5
  };
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
  const [keyPlays, setKeyPlays] = useState([]);
  const [scoringPlays, setScoringPlays] = useState([]);
  const [successRates, setSuccessRates] = useState({});
  const [epaData, setEpaData] = useState([]);
  const [gameControl, setGameControl] = useState({ home: 0.5, away: 0.5 });
  const [showAdvancedStats, setShowAdvancedStats] = useState(false);
  const [selectedTab, setSelectedTab] = useState('gameFlow');
  
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

  // Fetch game data with better error handling
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
        
        // Calculate advanced metrics
        const keyPlaysData = identifyKeyPlays(uniquePlays);
        const scoringPlaysData = identifyScoringPlays(uniquePlays);
        const successRatesData = calculateSuccessRates(uniquePlays);
        const epaCalculations = calculateEPA(uniquePlays);
        const gameControlData = calculateGameControl(uniquePlays);
        
        setKeyPlays(keyPlaysData);
        setScoringPlays(scoringPlaysData);
        setSuccessRates(successRatesData);
        setEpaData(epaCalculations);
        setGameControl(gameControlData);
        
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

  // Handle animation with improved throttling
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

  // Optimized animation function with error handling
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
            // Ensure enough time for the user to see the final state before showing recap
            setTimeout(() => setShowRecap(true), 1200);
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

  // Improved playback controls
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
      setTimeout(() => setShowRecap(true), 1200);
    }
  }, [wpData]);

  const changeSpeed = useCallback((newSpeed) => {
    setPlaySpeed(newSpeed);
  }, []);

  // Jump to specific key play
  const jumpToPlay = useCallback((playIndex) => {
    if (!wpData || playIndex >= wpData.length) return;
    
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    
    // Create array of plays up to the selected index
    const newVisibleData = wpData.slice(0, playIndex + 1);
    setVisibleData(newVisibleData);
    setSelectedPlay(playIndex);
    setIsPlaying(false);
  }, [wpData]);

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

  // Enhanced chart data with annotations for key plays and scoring plays
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
          pointRadius: (ctx) => {
            const index = ctx.dataIndex;
            if (!safeData[index]) return 0;
            
            // Identify if this is a scoring play or key play
            const playNumber = safeData[index].playNumber;
            const isScoring = scoringPlays.some(p => p.playData.playNumber === playNumber);
            const isKeyPlay = keyPlays.slice(0, 5).some(p => p.playData.playNumber === playNumber);
            
            if (isScoring) return 6; // Larger points for scoring plays
            if (isKeyPlay) return 5; // Slightly larger points for key plays
            return hoveredPlay === index ? 4 : 0; // Normal point behavior
          },
          pointHoverRadius: 8,
          pointBackgroundColor: (ctx) => {
            const index = ctx.dataIndex;
            if (!safeData[index]) return teams?.home?.color || '#007bff';
            
            // Color points based on play type
            const playNumber = safeData[index].playNumber;
            const isScoring = scoringPlays.some(p => p.playData.playNumber === playNumber);
            const isTouchdown = scoringPlays.some(p => p.playData.playNumber === playNumber && p.isTouchdown);
            
            if (isTouchdown) return '#ff5722'; // Orange for touchdowns
            if (isScoring) return '#ffc107'; // Yellow for other scoring plays
            
            return safeData[index].homeBall ? teams?.home?.color : teams?.away?.color;
          },
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          tension: 0.2,
          fill: {
            target: 'origin',
            above: `${teams?.home?.color || '#007bff'}20`, // Semi-transparent home team color
            below: `${teams?.away?.color || '#28a745'}20` // Semi-transparent away team color
          },
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
  }, [visibleData, teams, hoveredPlay, scoringPlays, keyPlays]);

  // Enhanced chart options with annotations
  const options = useMemo(() => {
    // Create quarter markers using estimated play counts (assuming typical play counts per quarter)
    const estimateQuarterMarkers = () => {
      if (!wpData || wpData.length < 10) return [];
      
      const playCount = wpData.length;
      const playsPerQuarter = Math.ceil(playCount / 4);
      
      return [
        { value: playsPerQuarter, text: 'Q2' },
        { value: playsPerQuarter * 2, text: 'Q3' },
        { value: playsPerQuarter * 3, text: 'Q4' }
      ].filter(marker => marker.value < playCount);
    };
    
    const quarterMarkers = estimateQuarterMarkers();
    
    // Since we're not using the annotation plugin, we'll use a simpler approach
    // with regular chart.js elements
    const fiftyPercent = 50;
    
    return {
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
              
              // Check if this is a key play
              const playNumber = play.playNumber;
              const isKeyPlay = keyPlays.slice(0, 5).some(p => p.playData.playNumber === playNumber);
              const isScoring = scoringPlays.some(p => p.playData.playNumber === playNumber);
              
              const labels = [
                `${teams?.home?.name || 'Home'}: ${homeProb}%`,
                `${teams?.away?.name || 'Away'}: ${awayProb}%`,
                "",
                `${play.playText || ''}`,
                `Score: ${play.homeScore || 0}-${play.awayScore || 0}`
              ];
              
              if (isKeyPlay) {
                const keyPlay = keyPlays.find(p => p.playData.playNumber === playNumber);
                if (keyPlay) {
                  const wpChangePercent = (keyPlay.wpChange * 100).toFixed(1);
                  labels.push("", `🔑 Key Play: ${wpChangePercent}% win prob swing`);
                }
              }
              
              if (isScoring) {
                const scoringPlay = scoringPlays.find(p => p.playData.playNumber === playNumber);
                if (scoringPlay) {
                  const team = scoringPlay.homeScoreChange > 0 ? teams?.home?.name : teams?.away?.name;
                  const points = Math.max(scoringPlay.homeScoreChange, scoringPlay.awayScoreChange);
                  labels.push("", `🏈 Scoring Play: ${team} +${points} points`);
                }
              }
              
              // Add EPA info if available
              const epaInfo = epaData.find(e => e.playData.playNumber === playNumber);
              if (epaInfo && epaInfo.epa !== 0) {
                const epaValue = epaInfo.epa.toFixed(2);
                const epaSign = epaInfo.epa > 0 ? '+' : '';
                labels.push(`EPA: ${epaSign}${epaValue}`);
              }
              
              return labels;
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
        legend: { display: false }
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
    };
  }, [visibleData, teams, getDownString, formatYardLine, windowSize, keyPlays, scoringPlays, wpData, epaData]);

  // Toggle for advanced stats view
  const toggleAdvancedStats = useCallback(() => {
    setShowAdvancedStats(prev => !prev);
  }, []);

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
        <div className="wp-legend-item">
          <div className="wp-color-box" style={{ backgroundColor: '#ff5722' }}></div>
          <span className="wp-legend-text">Touchdown</span>
        </div>
        <div className="wp-legend-item">
          <div className="wp-color-box" style={{ backgroundColor: '#ffc107' }}></div>
          <span className="wp-legend-text">Field Goal/Other Score</span>
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

  // Updated play details with enhanced metrics
  const renderPlayDetails = useCallback(() => {
    if (selectedPlay === null || !visibleData || !visibleData[selectedPlay] || !teams) return null;
    
    const play = visibleData[selectedPlay];
    if (!play) return null;
    
    const homeProb = (play.homeWinProbability !== undefined ? play.homeWinProbability * 100 : 0).toFixed(1);
    const awayProb = (100 - parseFloat(homeProb)).toFixed(1);
    const isPossessionHome = play.homeBall;
    const possessionTeam = isPossessionHome ? teams.home : teams.away;
    
    if (!possessionTeam) return null;
    
    // Find EPA for this play
    const epaInfo = epaData.find(e => e.playData.playNumber === play.playNumber);
    const epaValue = epaInfo ? epaInfo.epa.toFixed(2) : "N/A";
    
    // Is this a key play?
    const isKeyPlay = keyPlays.slice(0, 5).some(p => p.playData.playNumber === play.playNumber);
    const keyPlayInfo = isKeyPlay 
      ? keyPlays.find(p => p.playData.playNumber === play.playNumber)
      : null;
    
    // Is this a scoring play?
    const isScoringPlay = scoringPlays.some(p => p.playData.playNumber === play.playNumber);
    const scoringPlayInfo = isScoringPlay
      ? scoringPlays.find(p => p.playData.playNumber === play.playNumber)
      : null;
    
    return (
      <div className={`wp-play-details ${isKeyPlay ? 'wp-key-play' : ''} ${isScoringPlay ? 'wp-scoring-play' : ''}`} 
           style={{ borderLeftColor: possessionTeam.color || '#6c757d' }}>
        <div className="wp-play-header" style={{ backgroundColor: possessionTeam.color || '#6c757d' }}>
          <h3 className="wp-play-title">Play #{play.playNumber || 0}</h3>
          {isKeyPlay && <span className="wp-key-play-badge">KEY PLAY</span>}
          {isScoringPlay && scoringPlayInfo?.isTouchdown && <span className="wp-touchdown-badge">TOUCHDOWN</span>}
          {isScoringPlay && !scoringPlayInfo?.isTouchdown && <span className="wp-scoring-badge">SCORING PLAY</span>}
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
            
            {/* New EPA indicator */}
            {epaInfo && (
              <div className="wp-meta-row wp-epa-indicator">
                <div className="wp-epa-label">
                  <span>EPA:</span>
                </div>
                <div className={`wp-epa-value ${parseFloat(epaValue) > 0 ? 'wp-positive-epa' : parseFloat(epaValue) < 0 ? 'wp-negative-epa' : ''}`}>
                  {epaValue > 0 ? '+' : ''}{epaValue}
                </div>
              </div>
            )}
            
            {/* Win probability impact for key plays */}
            {keyPlayInfo && (
              <div className="wp-meta-row wp-wp-change">
                <div className="wp-wp-change-label">Win Probability Impact:</div>
                <div className={`wp-wp-change-value ${keyPlayInfo.homeWinProbAfter > keyPlayInfo.homeWinProbBefore ? 'wp-positive-change' : 'wp-negative-change'}`}>
                  {keyPlayInfo.homeWinProbAfter > keyPlayInfo.homeWinProbBefore ? '+' : ''}
                  {((keyPlayInfo.homeWinProbAfter - keyPlayInfo.homeWinProbBefore) * 100).toFixed(1)}% for {keyPlayInfo.homeWinProbAfter > keyPlayInfo.homeWinProbBefore ? teams.home?.name : teams.away?.name}
                </div>
              </div>
            )}
            
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
  }, [selectedPlay, visibleData, teams, getDownString, formatYardLine, keyPlays, scoringPlays, epaData]);

  // New component to display key plays
  const renderKeyPlays = useCallback(() => {
    if (!keyPlays || keyPlays.length === 0 || !teams) return null;
    
    // Only show top 5 key plays
    const topKeyPlays = keyPlays.slice(0, 5);
    
    return (
      <div className="wp-key-plays-container">
        <h3 className="wp-key-plays-title">Key Plays</h3>
        <div className="wp-key-plays-list">
          {topKeyPlays.map((keyPlay, index) => {
            const play = keyPlay.playData;
            if (!play) return null;
            
            const wpChangePercent = (keyPlay.wpChange * 100).toFixed(1);
            const benefitingTeam = keyPlay.homeWinProbAfter > keyPlay.homeWinProbBefore ? teams.home : teams.away;
            
            return (
              <div 
                key={`key-play-${index}`} 
                className="wp-key-play-item"
                onClick={() => jumpToPlay(keyPlay.playIndex)}
                style={{ borderColor: benefitingTeam?.color || '#6c757d' }}
              >
                <div className="wp-key-play-number">Play #{play.playNumber || index}</div>
                <div className="wp-key-play-text">{play.playText || ''}</div>
                <div className="wp-key-play-impact">
                  <span className="wp-impact-value" style={{ color: benefitingTeam?.color || '#6c757d' }}>
                    +{wpChangePercent}% 
                  </span>
                  <span className="wp-impact-team">for {benefitingTeam?.name || ''}</span>
                </div>
                <div className="wp-key-play-score">
                  Score: {play.homeScore || 0}-{play.awayScore || 0}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }, [keyPlays, teams, jumpToPlay]);

  // New component to display success rates by down
  const renderSuccessRates = useCallback(() => {
    if (!successRates || !successRates.successRates || !teams) return null;
    
    const { successRates: rates, downStats } = successRates;
    
    return (
      <div className="wp-success-rates-container">
        <h3 className="wp-success-rates-title">Success Rates by Down</h3>
        <div className="wp-success-rates-grid">
          {[1, 2, 3, 4].map(down => {
            const rate = rates[down] || 0;
            const attempts = downStats[down]?.attempts || 0;
            const successes = downStats[down]?.successes || 0;
            
            return (
              <div key={`down-${down}`} className="wp-success-rate-card">
                <div className="wp-down-label">{getDownString(down)}</div>
                <div className="wp-success-rate-value">{(rate * 100).toFixed(1)}%</div>
                <div className="wp-success-rate-bar-container">
                  <div 
                    className="wp-success-rate-bar" 
                    style={{ 
                      width: `${rate * 100}%`,
                      backgroundColor: rate > 0.5 ? '#28a745' : rate > 0.3 ? '#ffc107' : '#dc3545'
                    }}
                  ></div>
                </div>
                <div className="wp-success-rate-details">
                  {successes} of {attempts} plays
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }, [successRates, getDownString, teams]);

  // New component to display game control metrics
  const renderGameControl = useCallback(() => {
    if (!gameControl || !teams) return null;
    
    return (
      <div className="wp-game-control-container">
        <h3 className="wp-game-control-title">Game Control</h3>
        <div className="wp-game-control-bar-container">
          <div 
            className="wp-game-control-bar wp-home-control" 
            style={{ 
              width: `${gameControl.home * 100}%`,
              backgroundColor: teams.home?.color || '#007bff'
            }}
          >
            {gameControl.home > 0.15 && (
              <span className="wp-control-label">{teams.home?.name || 'Home'}</span>
            )}
          </div>
          <div 
            className="wp-game-control-bar wp-away-control" 
            style={{ 
              width: `${gameControl.away * 100}%`,
              backgroundColor: teams.away?.color || '#28a745'
            }}
          >
            {gameControl.away > 0.15 && (
              <span className="wp-control-label">{teams.away?.name || 'Away'}</span>
            )}
          </div>
        </div>
        <div className="wp-game-control-percentages">
          <div className="wp-control-percentage">{(gameControl.home * 100).toFixed(1)}%</div>
          <div className="wp-control-percentage">{(gameControl.away * 100).toFixed(1)}%</div>
        </div>
        <div className="wp-game-control-explanation">
          Percentage of plays where each team had &gt;50% win probability
        </div>
      </div>
    );
  }, [gameControl, teams]);

  // Tabbed interface for advanced stats
  const renderAdvancedStatsPanel = useCallback(() => {
    if (!showAdvancedStats) return null;
    
    return (
      <div className="wp-advanced-stats-panel">
        <div className="wp-tabs">
          <button 
            className={`wp-tab ${selectedTab === 'gameFlow' ? 'wp-tab-active' : ''}`}
            onClick={() => setSelectedTab('gameFlow')}
          >
            Game Flow
          </button>
          <button 
            className={`wp-tab ${selectedTab === 'keyPlays' ? 'wp-tab-active' : ''}`}
            onClick={() => setSelectedTab('keyPlays')}
          >
            Key Plays
          </button>
          <button 
            className={`wp-tab ${selectedTab === 'successRates' ? 'wp-tab-active' : ''}`}
            onClick={() => setSelectedTab('successRates')}
          >
            Success Rates
          </button>
          <button 
            className={`wp-tab ${selectedTab === 'gameControl' ? 'wp-tab-active' : ''}`}
            onClick={() => setSelectedTab('gameControl')}
          >
            Game Control
          </button>
        </div>
        
        <div className="wp-tab-content">
          {selectedTab === 'gameFlow' && (
            <div className="wp-game-flow-tab">
              <p>The win probability chart shows how each team's chances of winning changed throughout the game.</p>
              <p>Points represent plays. Larger points indicate scoring plays or key momentum-shifting moments.</p>
              <div className="wp-color-coding">
                <strong>Color Coding:</strong>
                <ul>
                  <li><span className="wp-color-dot" style={{ backgroundColor: teams.home?.color || '#007bff' }}></span> {teams.home?.name || 'Home'} possession</li>
                  <li><span className="wp-color-dot" style={{ backgroundColor: teams.away?.color || '#28a745' }}></span> {teams.away?.name || 'Away'} possession</li>
                  <li><span className="wp-color-dot" style={{ backgroundColor: '#ff5722' }}></span> Touchdown</li>
                  <li><span className="wp-color-dot" style={{ backgroundColor: '#ffc107' }}></span> Field Goal/Other Score</li>
                </ul>
              </div>
            </div>
          )}
          
          {selectedTab === 'keyPlays' && (
            <div className="wp-key-plays-tab">
              {renderKeyPlays()}
            </div>
          )}
          
          {selectedTab === 'successRates' && (
            <div className="wp-success-rates-tab">
              {renderSuccessRates()}
            </div>
          )}
          
          {selectedTab === 'gameControl' && (
            <div className="wp-game-control-tab">
              {renderGameControl()}
            </div>
          )}
        </div>
      </div>
    );
  }, [showAdvancedStats, selectedTab, renderKeyPlays, renderSuccessRates, renderGameControl, teams]);

  // Enhanced game recap with additional metrics
  const renderGameRecap = useCallback(() => {
    if (!winner && !gameFinished && !showRecap && !wpData || !wpData.length || !teams) return null;
    
    const finalPlay = wpData[wpData.length - 1];
    if (!finalPlay) return null;
    
    const homeScore = finalPlay.homeScore || 0;
    const awayScore = finalPlay.awayScore || 0;
    const isTie = homeScore === awayScore;
    
    // Calculate largest WP swing play
    const largestSwingPlay = keyPlays && keyPlays.length > 0 ? keyPlays[0] : null;
    
    // Calculate most successful down
    const mostSuccessfulDown = successRates && successRates.successRates ? 
      Object.entries(successRates.successRates)
        .filter(([_, rate]) => rate > 0) // Filter out zero rates
        .sort(([_, rateA], [__, rateB]) => rateB - rateA)[0] : null;
    
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
            <div className="wp-stat-row">
              <div className="wp-stat-item">
                <div className="wp-stat-label">Game Control</div>
                <div className="wp-stat-value">
                  {gameControl.home > gameControl.away ? teams.home?.name : teams.away?.name} 
                  ({(Math.max(gameControl.home, gameControl.away) * 100).toFixed(1)}%)
                </div>
              </div>
              <div className="wp-stat-item">
                <div className="wp-stat-label">Most Successful Down</div>
                <div className="wp-stat-value">
                  {mostSuccessfulDown 
                    ? `${getDownString(parseInt(mostSuccessfulDown[0]))} (${(mostSuccessfulDown[1] * 100).toFixed(1)}%)`
                    : 'N/A'}
                </div>
              </div>
            </div>
            {largestSwingPlay && (
              <div className="wp-key-swing-play">
                <div className="wp-key-swing-label">Largest Win Probability Swing</div>
                <div className="wp-key-swing-value">
                  {(largestSwingPlay.wpChange * 100).toFixed(1)}% on Play #{largestSwingPlay.playData.playNumber}
                </div>
                <div className="wp-key-swing-text">
                  {largestSwingPlay.playData.playText}
                </div>
              </div>
            )}
          </div>
          
          <button className="wp-recap-button" onClick={resetAnimation}>
            Watch Again
          </button>
          <button className="wp-recap-button wp-advanced-button" onClick={toggleAdvancedStats}>
            View Advanced Stats
          </button>
        </div>
      </div>
    );
  }, [winner, gameFinished, showRecap, wpData, teams, windowSize, resetAnimation, gameControl, successRates, keyPlays, getDownString, toggleAdvancedStats]);

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
    <div className={`winprob-container ${showRecap ? 'wp-recap-active' : ''}`}>
      {wpData && wpData.length > 0 ? (
        <>
          {renderTeamHeaders}
          <div className="wp-view-advanced">
            <button onClick={toggleAdvancedStats} className="wp-advanced-button">
              {showAdvancedStats ? 'Hide Advanced Stats' : 'View Advanced Stats'}
            </button>
          </div>
          {showAdvancedStats && renderAdvancedStatsPanel()}
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
          min-height: 600px; /* Ensure minimum height to accommodate recap */
          transition: all 0.3s ease;
        }
        
        /* Add a class for when recap is active */
        .winprob-container.wp-recap-active {
          min-height: 700px; /* Additional space for recap content */
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
        
        /* Advanced Button Styling */
        .wp-advanced-button {
          background-color: #f8f9fa;
          color: #495057;
          border: 1px solid #ddd;
          padding: 8px 16px;
          border-radius: 4px;
          font-size: 0.9rem;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .wp-advanced-button:hover {
          background-color: #e9ecef;
          border-color: #ced4da;
        }
        
        /* Advanced Stats Panel */
        .wp-advanced-stats-panel {
          margin: 16px 0 24px;
          padding: 16px;
          background: #f8f9fa;
          border-radius: 8px;
          box-shadow: 0 2px 6px rgba(0,0,0,0.05);
          animation: fadeIn 0.3s ease;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        /* Tabs */
        .wp-tabs {
          display: flex;
          border-bottom: 1px solid #dee2e6;
          margin-bottom: 16px;
          overflow-x: auto;
          white-space: nowrap;
          -ms-overflow-style: none;  /* IE and Edge */
          scrollbar-width: none;  /* Firefox */
        }
        .wp-tabs::-webkit-scrollbar {
          display: none;
        }
        .wp-tab {
          padding: 8px 16px;
          background: none;
          border: none;
          border-bottom: 3px solid transparent;
          font-size: 0.95rem;
          color: #495057;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .wp-tab:hover {
          color: #212529;
          background-color: #e9ecef;
        }
        .wp-tab-active {
          border-bottom-color: #007bff;
          color: #007bff;
          font-weight: 600;
        }
        
        /* Tab Content */
        .wp-tab-content {
          padding: 8px 0;
        }
        
        /* Game Flow Tab */
        .wp-game-flow-tab {
          color: #495057;
          line-height: 1.5;
        }
        .wp-color-coding {
          margin-top: 16px;
          padding: 12px;
          background: #fff;
          border-radius: 4px;
          border-left: 4px solid #6c757d;
        }
        .wp-color-coding ul {
          margin: 8px 0 0;
          padding-left: 20px;
          list-style-type: none;
        }
        .wp-color-coding li {
          margin-bottom: 6px;
          display: flex;
          align-items: center;
        }
        .wp-color-dot {
          display: inline-block;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          margin-right: 8px;
        }
        
        /* Key Plays Tab */
        .wp-key-plays-container {
          margin-top: 8px;
        }
        .wp-key-plays-title {
          font-size: 1.1rem;
          margin-bottom: 16px;
          color: #343a40;
          padding-bottom: 8px;
          border-bottom: 1px solid #e9ecef;
        }
        .wp-key-plays-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .wp-key-play-item {
          padding: 12px;
          background: #fff;
          border-radius: 6px;
          border-left: 4px solid;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
          cursor: pointer;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .wp-key-play-item:hover {
          transform: translateY(-2px);
          box-shadow: 0 3px 6px rgba(0,0,0,0.1);
        }
        .wp-key-play-number {
          font-size: 0.85rem;
          font-weight: 600;
          color: #6c757d;
          margin-bottom: 6px;
        }
        .wp-key-play-text {
          font-size: 0.95rem;
          margin-bottom: 10px;
          line-height: 1.4;
        }
        .wp-key-play-impact {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 6px;
        }
        .wp-impact-value {
          font-size: 1.1rem;
          font-weight: 700;
        }
        .wp-impact-team {
          font-size: 0.9rem;
          color: #495057;
        }
        .wp-key-play-score {
          font-size: 0.85rem;
          color: #6c757d;
        }
        
        /* Success Rates Tab */
        .wp-success-rates-container {
          margin-top: 8px;
        }
        .wp-success-rates-title {
          font-size: 1.1rem;
          margin-bottom: 16px;
          color: #343a40;
          padding-bottom: 8px;
          border-bottom: 1px solid #e9ecef;
        }
        .wp-success-rates-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 16px;
        }
        .wp-success-rate-card {
          padding: 16px;
          background: #fff;
          border-radius: 8px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
          display: flex;
          flex-direction: column;
        }
        .wp-down-label {
          font-size: 1rem;
          font-weight: 600;
          color: #343a40;
          margin-bottom: 8px;
        }
        .wp-success-rate-value {
          font-size: 1.8rem;
          font-weight: 700;
          margin-bottom: 10px;
          color: #212529;
        }
        .wp-success-rate-bar-container {
          height: 8px;
          background: #e9ecef;
          border-radius: 4px;
          overflow: hidden;
          margin-bottom: 10px;
        }
        .wp-success-rate-bar {
          height: 100%;
          border-radius: 4px;
        }
        .wp-success-rate-details {
          font-size: 0.85rem;
          color: #6c757d;
          margin-top: auto;
        }
        
        /* Game Control Tab */
        .wp-game-control-container {
          margin-top: 8px;
        }
        .wp-game-control-title {
          font-size: 1.1rem;
          margin-bottom: 16px;
          color: #343a40;
          padding-bottom: 8px;
          border-bottom: 1px solid #e9ecef;
        }
        .wp-game-control-bar-container {
          height: 30px;
          display: flex;
          width: 100%;
          border-radius: 6px;
          overflow: hidden;
          margin-bottom: 10px;
        }
        .wp-game-control-bar {
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 600;
          font-size: 0.85rem;
          transition: width 0.5s ease;
        }
        .wp-control-label {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          padding: 0 8px;
          text-shadow: 0 1px 2px rgba(0,0,0,0.3);
        }
        .wp-game-control-percentages {
          display: flex;
          justify-content: space-between;
          margin-bottom: 16px;
        }
        .wp-control-percentage {
          font-size: 1rem;
          font-weight: 600;
        }
        .wp-game-control-explanation {
          font-size: 0.85rem;
          color: #6c757d;
          font-style: italic;
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
          transition: all 0.5s ease;
        }
        .wp-chart-container.wp-fade-out {
          opacity: 0;
          transform: scale(0.95);
          position: absolute;
          pointer-events: none;
          z-index: -1; /* Place behind recap content */
          visibility: hidden; /* Hide from view but maintain space */
        }
        /* Enhanced Play Details Styling */
        .wp-play-details {
          background: #fff;
          margin-top: 30px;
          border-radius: 8px;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
          border-left: 5px solid;
          overflow: hidden;
          width: 100%;
          transition: all 0.3s ease;
        }
        .wp-key-play {
          box-shadow: 0 3px 10px rgba(0, 0, 0, 0.15);
          transform: translateY(-3px);
        }
        .wp-scoring-play {
          box-shadow: 0 3px 10px rgba(0, 0, 0, 0.15);
        }
        .wp-play-header {
          padding: 12px 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .wp-play-title {
          margin: 0;
          color: white;
          font-size: 1.2rem;
          font-weight: 600;
        }
        .wp-key-play-badge,
        .wp-touchdown-badge,
        .wp-scoring-badge {
          color: white;
          font-size: 0.75rem;
          font-weight: 700;
          padding: 4px 8px;
          border-radius: 4px;
          background-color: rgba(0, 0, 0, 0.2);
          letter-spacing: 0.5px;
        }
        .wp-key-play-badge {
          background-color: rgba(0, 0, 0, 0.3);
        }
        .wp-touchdown-badge {
          background-color: #ff5722;
        }
        .wp-scoring-badge {
          background-color: #ffc107;
          color: #212529;
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
        
        /* EPA Indicator */
        .wp-epa-indicator {
          display: flex;
          align-items: center;
          padding: 8px 0;
          margin-bottom: 12px;
        }
        .wp-epa-label {
          color: #777;
          margin-right: 8px;
        }
        .wp-epa-value {
          font-weight: 600;
          color: #333;
        }
        .wp-positive-epa {
          color: #28a745;
        }
        .wp-negative-epa {
          color: #dc3545;
        }
        
        /* Win Probability Change */
        .wp-wp-change {
          background: white;
          padding: 10px 14px;
          border-radius: 4px;
          margin-bottom: 12px;
          border-left: 4px solid #6c757d;
        }
        .wp-wp-change-label {
          font-size: 0.9rem;
          color: #555;
          margin-bottom: 4px;
        }
        .wp-wp-change-value {
          font-size: 1rem;
          font-weight: 600;
        }
        .wp-positive-change {
          color: #28a745;
        }
        .wp-negative-change {
          color: #dc3545;
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
        
        /* Enhanced Game Recap Styling */
        .wp-game-recap {
          position: relative; /* Changed from absolute to relative */
          width: 100%;
          min-height: 500px; /* Ensure enough space for recap content */
          background: rgba(255, 255, 255, 0.98);
          display: flex;
          justify-content: center;
          align-items: center;
          opacity: 0;
          visibility: hidden;
          height: 0;
          overflow: hidden;
          transition: opacity 0.8s ease, visibility 0.8s ease, height 0.8s ease;
          z-index: 10;
          padding: 0;
          margin-top: -24px; /* Offset to ensure smooth transition */
        }
        
        .wp-game-recap.wp-visible {
          opacity: 1;
          visibility: visible;
          height: auto;
          min-height: 500px;
          padding: 24px;
          margin-top: 0;
        }
        
        .wp-recap-content {
          background: white;
          border-radius: 12px;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
          padding: 32px;
          max-width: 800px;
          width: 100%;
          text-align: center;
          animation: slideUp 0.8s ease;
          margin: 20px auto; /* Center horizontally */
        }
        
        @keyframes slideUp {
          from { transform: translateY(40px); opacity: 0; }
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
        
        /* Key swing play */
        .wp-key-swing-play {
          background: white;
          padding: 16px;
          border-radius: 8px;
          margin-top: 16px;
          border-left: 4px solid #6c757d;
          text-align: left;
        }
        
        .wp-key-swing-label {
          font-weight: 600;
          margin-bottom: 8px;
          color: #495057;
        }
        
        .wp-key-swing-value {
          font-size: 1.1rem;
          font-weight: 700;
          color: #212529;
          margin-bottom: 8px;
        }
        
        .wp-key-swing-text {
          font-size: 0.9rem;
          color: #6c757d;
          font-style: italic;
        }
        
        /* Recap buttons */
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
          margin: 0 8px;
        }
        
        .wp-recap-button:hover {
          background: #0267bf;
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
        }
        
        .wp-advanced-button {
          background: #6c757d;
        }
        
        .wp-advanced-button:hover {
          background: #5a6268;
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
          
          .winprob-container {
            min-height: 500px;
          }
          
          .winprob-container.wp-recap-active {
            min-height: 600px;
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
          
          .wp-tabs {
            flex-wrap: wrap;
          }
          
          .wp-tab {
            flex: 1;
            min-width: 120px;
            text-align: center;
            padding: 8px;
          }
        }
        
        @media (max-width: 480px) {
          .winprob-container {
            padding: 16px;
            min-height: 450px;
          }
          
          .winprob-container.wp-recap-active {
            min-height: 550px;
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
            margin-bottom: 8px;
            width: 100%;
          }
          
          .wp-possession-legend {
            gap: 12px;
          }
          
          .wp-legend-item {
            font-size: 0.8rem;
          }
          
          .wp-key-play-badge,
          .wp-touchdown-badge,
          .wp-scoring-badge {
            font-size: 0.7rem;
            padding: 3px 6px;
          }
        }
      `}</style>
    </div>
  );
};

export default WinProb;