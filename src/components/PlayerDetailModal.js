import React, { useState, useMemo, useCallback } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from "recharts";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faTimes, faTrophy, faChartLine, faFootballBall, faRulerVertical, 
  faWeightHanging, faGraduationCap, faCalendarAlt, faShieldAlt,
  faArrowUp, faArrowDown, faRunning, faArrowCircleRight, faUsers,
  faArrowAltCircleUp, faBolt, faFlagCheckered, faClipboardCheck, faClock
} from '@fortawesome/free-solid-svg-icons';
import "../styles/PlayerDetailModal.css"; // Assuming you have a CSS file for styles

const PlayerDetailModal = ({ player, team, onClose, year, gameId, getLetterGrade, getGradeColorClass }) => {
  const [activeTab, setActiveTab] = useState("season");
  const [hoverGrade, setHoverGrade] = useState(null);
  const [animateIn, setAnimateIn] = useState(true);
  
  if (!player || !team) return null;

  // Use passed in functions or fallback to local implementations
  const getPlayerGradeClass = getGradeColorClass || ((grade) => {
    if (grade >= 90) return "pdm-grade-a-plus";
    if (grade >= 85) return "pdm-grade-a";
    if (grade >= 80) return "pdm-grade-a-minus";
    if (grade >= 77) return "pdm-grade-b-plus";
    if (grade >= 73) return "pdm-grade-b";
    if (grade >= 70) return "pdm-grade-b-minus";
    if (grade >= 67) return "pdm-grade-c-plus";
    if (grade >= 63) return "pdm-grade-c";
    if (grade >= 60) return "pdm-grade-c-minus";
    if (grade >= 57) return "pdm-grade-d-plus";
    if (grade >= 53) return "pdm-grade-d";
    if (grade >= 50) return "pdm-grade-d-minus";
    return "pdm-grade-f";
  });

  const getPlayerLetterGrade = getLetterGrade || ((grade) => {
    if (grade >= 90) return "A+";
    if (grade >= 85) return "A";
    if (grade >= 80) return "A-";
    if (grade >= 77) return "B+";
    if (grade >= 73) return "B";
    if (grade >= 70) return "B-";
    if (grade >= 67) return "C+";
    if (grade >= 63) return "C";
    if (grade >= 60) return "C-";
    if (grade >= 57) return "D+";
    if (grade >= 53) return "D";
    if (grade >= 50) return "D-";
    return "F";
  });

  // Get trending direction based on grade improvement
  const getTrendIndicator = useCallback((current, previous) => {
    if (current > previous + 2) return { icon: faArrowUp, color: "#00b894", text: "Improving" };
    if (current < previous - 2) return { icon: faArrowDown, color: "#d63031", text: "Declining" };
    return { icon: faArrowCircleRight, color: "#fdcb6e", text: "Steady" };
  }, []);

  // Get grade description based on grade value
  const getGradeDescription = useCallback((grade) => {
    if (grade >= 90) return "Elite";
    if (grade >= 80) return "Excellent";
    if (grade >= 70) return "Above Average";
    if (grade >= 60) return "Average";
    if (grade >= 50) return "Below Average";
    return "Poor";
  }, []);

  // Calculate passing vs running snaps data with memoization
  const snapsData = useMemo(() => {
    // In a real implementation, you would get this data from player.gameStats or seasonStats
    // For now, we're creating mock data based on position
    if (!player.seasonStats || player.seasonStats.length === 0) {
      let passSnaps, runSnaps;
      
      if (player.position === "QB") {
        passSnaps = Math.floor(Math.random() * 100) + 250;
        runSnaps = Math.floor(Math.random() * 50) + 50;
      } else if (player.position === "RB" || player.position === "FB") {
        passSnaps = Math.floor(Math.random() * 50) + 50;
        runSnaps = Math.floor(Math.random() * 100) + 150;
      } else if (player.position === "WR" || player.position === "TE") {
        passSnaps = Math.floor(Math.random() * 100) + 200;
        runSnaps = Math.floor(Math.random() * 50) + 50;
      } else {
        passSnaps = Math.floor(Math.random() * 100) + 100;
        runSnaps = Math.floor(Math.random() * 100) + 100;
      }
      
      return [
        { name: "Passing Snaps", value: passSnaps, color: "#00264c" },
        { name: "Running Snaps", value: runSnaps, color: "#d52b1e" }
      ];
    }
    
    // Attempt to extract real data if available
    let passSnaps = 0;
    let runSnaps = 0;
    
    if (player.gameStats && player.gameStats.passing) {
      passSnaps = player.gameStats.passing.reduce((sum, stat) => sum + (stat.attempts || 0), 0);
    }
    
    if (player.gameStats && player.gameStats.rushing) {
      runSnaps = player.gameStats.rushing.reduce((sum, stat) => sum + (stat.carries || 0), 0);
    }
    
    // If we couldn't get real data, use mock data with some variation
    if (passSnaps === 0 && runSnaps === 0) {
      if (player.position === "QB") {
        passSnaps = Math.floor(Math.random() * 100) + 250;
        runSnaps = Math.floor(Math.random() * 50) + 50;
      } else if (player.position === "RB" || player.position === "FB") {
        passSnaps = Math.floor(Math.random() * 50) + 50;
        runSnaps = Math.floor(Math.random() * 100) + 150;
      } else if (player.position === "WR" || player.position === "TE") {
        passSnaps = Math.floor(Math.random() * 100) + 200;
        runSnaps = Math.floor(Math.random() * 50) + 50;
      } else {
        passSnaps = Math.floor(Math.random() * 100) + 100;
        runSnaps = Math.floor(Math.random() * 100) + 100;
      }
    }
    
    return [
      { name: "Passing Snaps", value: passSnaps, color: "#00264c" },
      { name: "Running Snaps", value: runSnaps, color: "#d52b1e" }
    ];
  }, [player.position, player.seasonStats, player.gameStats]);

  // Get weekly data for the bar chart
  const weeklyData = useMemo(() => {
    // In a real implementation, you would extract this from player game stats
    return Array.from({ length: 14 }, (_, i) => ({
      week: i + 1,
      passingSnaps: Math.floor(Math.random() * 40) + 20,
      runningSnaps: Math.floor(Math.random() * 20) + 10,
      totalSnaps: Math.floor(Math.random() * 60) + 30,
    }));
  }, []);

  // Get career grade data
  const careerData = useMemo(() => {
    // Mock career data - in a real implementation, this would come from historical player data
    const baseGrade = player.grade || 75;
    return [
      { year: 2021, grade: Math.max(50, baseGrade > 80 ? baseGrade - 20 : baseGrade + 5) },
      { year: 2022, grade: Math.max(50, baseGrade > 85 ? baseGrade - 15 : baseGrade + 10) },
      { year: 2023, grade: Math.max(50, baseGrade > 85 ? baseGrade - 5 : baseGrade + 15) },
      { year: 2024, grade: baseGrade }
    ];
  }, [player.grade]);
  
  // Calculate performance trends
  const performanceTrends = useMemo(() => {
    const offenseGrade = player.grade || 75;
    const passGrade = Math.max(50, offenseGrade - 2);
    const runGrade = Math.max(50, offenseGrade - 7);
    
    return {
      overall: {
        current: offenseGrade,
        previous: careerData[careerData.length - 2]?.grade || (offenseGrade - 5),
        trend: getTrendIndicator(offenseGrade, careerData[careerData.length - 2]?.grade || (offenseGrade - 5))
      },
      pass: {
        current: passGrade,
        previous: Math.max(50, careerData[careerData.length - 2]?.grade - 2 || (passGrade - 3)),
        trend: getTrendIndicator(passGrade, Math.max(50, careerData[careerData.length - 2]?.grade - 2 || (passGrade - 3)))
      },
      run: {
        current: runGrade,
        previous: Math.max(50, careerData[careerData.length - 2]?.grade - 7 || (runGrade - 4)),
        trend: getTrendIndicator(runGrade, Math.max(50, careerData[careerData.length - 2]?.grade - 7 || (runGrade - 4)))
      }
    };
  }, [player.grade, careerData, getTrendIndicator]);

  // Colors for charts and visual elements
  const COLORS = ['#00264c', '#d52b1e'];
  
  // Use gameId to determine if we're in a game-specific view
  const isGameSpecific = !!gameId;

  // Get the background gradient based on team color
  const getTeamGradient = useCallback(() => {
    // Default gradient for team (when team has no colors)
    if (!team.color) {
      return `linear-gradient(135deg, #00264c 0%, #0d79b3 100%)`;
    }
    
    // Get secondary color - either from team data or a lighter shade of primary
    const secondaryColor = team.alt_color || lightenColor(team.color, 30);
    
    // Return the gradient
    return `linear-gradient(135deg, ${team.color} 0%, ${secondaryColor} 100%)`;
  }, [team.color, team.alt_color]);
  
  // Helper to lighten a color for gradient effect
  const lightenColor = (color, percent) => {
    if (!color) return "#0d79b3";
    
    const num = parseInt(color.replace("#", ""), 16),
      amt = Math.round(2.55 * percent),
      R = (num >> 16) + amt,
      G = ((num >> 8) & 0x00ff) + amt,
      B = (num & 0x0000ff) + amt;
    
    return (
      "#" +
      (
        0x1000000 +
        (R < 255 ? R : 255) * 0x10000 +
        (G < 255 ? G : 255) * 0x100 +
        (B < 255 ? B : 255)
      )
        .toString(16)
        .slice(1)
    );
  };
  
  // Get physical info or mock it if missing
  const physicalInfo = useMemo(() => {
    return {
      height: player.height || "6'2\"",
      weight: player.weight || "225",
      year: player.year || "Sr.",
      draftYear: year + 1
    };
  }, [player.height, player.weight, player.year, year]);

  // Custom tooltip for the weekly bar chart
  const CustomBarTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="pdm-chart-tooltip">
          <p className="pdm-tooltip-label">Week {payload[0].payload.week}</p>
          <p className="pdm-tooltip-data">
            <span className="pdm-tooltip-pass">Pass: {payload[0].value}</span>
          </p>
          <p className="pdm-tooltip-data">
            <span className="pdm-tooltip-run">Run: {payload[1].value}</span>
          </p>
          <p className="pdm-tooltip-total">
            <span>Total: {payload[0].value + payload[1].value}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  // Handle smooth closing of the modal
  const handleClose = () => {
    setAnimateIn(false);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  return (
    <div className={`pdm-overlay ${animateIn ? 'pdm-fade-in' : 'pdm-fade-out'}`} onClick={handleClose}>
      <div 
        className={`pdm-content ${animateIn ? 'pdm-slide-in' : 'pdm-slide-out'}`} 
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="player-modal-title"
      >
        <button className="pdm-close" onClick={handleClose} aria-label="Close">
          <FontAwesomeIcon icon={faTimes} />
        </button>
        
        <div className="pdm-header" style={{ background: getTeamGradient() }}>
          <div className="pdm-logo">
            {team.logos && team.logos[0] ? (
              <img 
                src={team.logos[0]} 
                alt={team.school}
                className="pdm-logo-img"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.style.display = 'none';
                }}
              />
            ) : (
              <div className="pdm-logo-placeholder">
                <FontAwesomeIcon icon={faFootballBall} />
              </div>
            )}
          </div>
          
          <div className="pdm-player-info">
            <h2 id="player-modal-title" className="pdm-player-name">{player.fullName}</h2>
            <div className="pdm-position">
              <span className="pdm-position-badge">
                <FontAwesomeIcon icon={faShieldAlt} className="pdm-position-icon" />
                {player.position}
              </span> 
              <span className="pdm-jersey">#{player.number || player.jersey || "1"}</span>
            </div>
          </div>
          
          <div className="pdm-team-info">
            <span className="pdm-team-name">{team.school}</span>
            <span className="pdm-team-mascot">{team.mascot || ''}</span>
            {isGameSpecific && (
              <div className="pdm-game-badge">
                <FontAwesomeIcon icon={faFlagCheckered} /> Game Analysis
              </div>
            )}
          </div>
        </div>

        <div className="pdm-physical-stats">
          <div className="pdm-stat-item">
            <div className="pdm-stat-icon">
              <FontAwesomeIcon icon={faRulerVertical} />
            </div>
            <div className="pdm-stat-details">
              <span className="pdm-stat-label">HEIGHT</span>
              <span className="pdm-stat-value">{physicalInfo.height}</span>
            </div>
          </div>
          
          <div className="pdm-stat-item">
            <div className="pdm-stat-icon">
              <FontAwesomeIcon icon={faWeightHanging} />
            </div>
            <div className="pdm-stat-details">
              <span className="pdm-stat-label">WEIGHT</span>
              <span className="pdm-stat-value">{physicalInfo.weight} lbs</span>
            </div>
          </div>
          
          <div className="pdm-stat-item">
            <div className="pdm-stat-icon">
              <FontAwesomeIcon icon={faGraduationCap} />
            </div>
            <div className="pdm-stat-details">
              <span className="pdm-stat-label">CLASS</span>
              <span className="pdm-stat-value">{physicalInfo.year}</span>
            </div>
          </div>
          
          <div className="pdm-stat-item">
            <div className="pdm-stat-icon">
              <FontAwesomeIcon icon={faCalendarAlt} />
            </div>
            <div className="pdm-stat-details">
              <span className="pdm-stat-label">DRAFT YEAR</span>
              <span className="pdm-stat-value">{physicalInfo.draftYear}</span>
            </div>
          </div>
        </div>

        <div className="pdm-tabs">
          <button 
            className={`pdm-tab ${activeTab === "season" ? "active" : ""}`}
            onClick={() => setActiveTab("season")}
            aria-selected={activeTab === "season"}
            role="tab"
          >
            <FontAwesomeIcon icon={faTrophy} className="pdm-tab-icon" />
            <span>Season Grades</span>
          </button>
          
          <button 
            className={`pdm-tab ${activeTab === "career" ? "active" : ""}`}
            onClick={() => setActiveTab("career")}
            aria-selected={activeTab === "career"}
            role="tab"
          >
            <FontAwesomeIcon icon={faChartLine} className="pdm-tab-icon" />
            <span>Career Progression</span>
          </button>
          
          <button 
            className={`pdm-tab ${activeTab === "snaps" ? "active" : ""}`}
            onClick={() => setActiveTab("snaps")}
            aria-selected={activeTab === "snaps"}
            role="tab"
          >
            <FontAwesomeIcon icon={faClock} className="pdm-tab-icon" />
            <span>Snap Counts</span>
          </button>
        </div>

        <div className="pdm-tab-content">
          {/* Season Grades Tab Content */}
          {activeTab === "season" && (
            <div className="pdm-tab-pane pdm-season-grades">
              <div className="pdm-card-grid">
                <div className="pdm-grade-card pdm-main-grade">
                  <div className="pdm-grade-header">
                    <FontAwesomeIcon icon={faFootballBall} className="pdm-grade-icon" />
                    <h3>OVERALL GRADE</h3>
                  </div>
                  
                  <div className={`pdm-grade-circle ${getPlayerGradeClass(player.grade)}`}>
                    <span className="pdm-grade-number">{player.grade?.toFixed(1)}</span>
                    <span className="pdm-grade-letter">{getPlayerLetterGrade(player.grade)}</span>
                  </div>
                  
                  <div className="pdm-grade-details">
                    <div className="pdm-grade-position">
                      <FontAwesomeIcon 
                        icon={performanceTrends.overall.trend.icon} 
                        style={{ color: performanceTrends.overall.trend.color }}
                        className="pdm-trend-icon"
                      />
                      <span className="pdm-grade-text">{getGradeDescription(player.grade)}</span>
                    </div>
                    
                    <div className="pdm-grade-rank">
                      <span className="pdm-rank-number">
                        #{player.rank || Math.floor(Math.random() * 20) + 1}
                      </span>
                      <span className="pdm-rank-text">
                        of {player.totalPlayers || 120} {player.position}s
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pdm-grade-card">
                  <div className="pdm-grade-header">
                    <FontAwesomeIcon icon={faArrowAltCircleUp} className="pdm-grade-icon" />
                    <h3>PASSING GRADE</h3>
                  </div>
                  
                  <div className={`pdm-grade-value ${getPlayerGradeClass(player.grade - 2)}`}>
                    {(player.grade - 2)?.toFixed(1)}
                  </div>
                  
                  <div className="pdm-grade-details">
                    <div className="pdm-grade-position">
                      <FontAwesomeIcon 
                        icon={performanceTrends.pass.trend.icon} 
                        style={{ color: performanceTrends.pass.trend.color }}
                        className="pdm-trend-icon"
                      />
                      <span className="pdm-grade-text">{getGradeDescription(player.grade - 2)}</span>
                    </div>
                    
                    <div className="pdm-grade-rank">
                      <span className="pdm-rank-number">
                        #{player.passRank || Math.floor(Math.random() * 25) + 1}
                      </span>
                      <span className="pdm-rank-text">
                        rank
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pdm-grade-card">
                  <div className="pdm-grade-header">
                    <FontAwesomeIcon icon={faRunning} className="pdm-grade-icon" />
                    <h3>RUNNING GRADE</h3>
                  </div>
                  
                  <div className={`pdm-grade-value ${getPlayerGradeClass(player.grade - 7)}`}>
                    {(player.grade - 7)?.toFixed(1)}
                  </div>
                  
                  <div className="pdm-grade-details">
                    <div className="pdm-grade-position">
                      <FontAwesomeIcon 
                        icon={performanceTrends.run.trend.icon} 
                        style={{ color: performanceTrends.run.trend.color }}
                        className="pdm-trend-icon"
                      />
                      <span className="pdm-grade-text">{getGradeDescription(player.grade - 7)}</span>
                    </div>
                    
                    <div className="pdm-grade-rank">
                      <span className="pdm-rank-number">
                        #{player.runRank || Math.floor(Math.random() * 30) + 1}
                      </span>
                      <span className="pdm-rank-text">
                        rank
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pdm-grade-card">
                  <div className="pdm-grade-header">
                    <FontAwesomeIcon icon={faClipboardCheck} className="pdm-grade-icon" />
                    <h3>PLAYER STATUS</h3>
                  </div>
                  
                  <div className="pdm-status-display">
                    <div className={`pdm-status-badge ${getPlayerGradeClass(player.grade)}`}>
                      {getPlayerLetterGrade(player.grade)}
                    </div>
                    <div className="pdm-status-description">
                      {getGradeDescription(player.grade)}
                    </div>
                  </div>
                  
                  <div className="pdm-grade-details">
                    <div className="pdm-status-summary">
                      <FontAwesomeIcon icon={faBolt} className="pdm-summary-icon" />
                      <span>
                        {player.position === "QB" 
                          ? "Effective passer with good awareness" 
                          : player.position === "RB" 
                            ? "Strong runner with good vision"
                            : "Reliable player with consistent performance"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="pdm-additional-stats">
                <div className="pdm-stat-header">
                  <FontAwesomeIcon icon={faUsers} />
                  <h3>PLAYER COMPARISONS</h3>
                </div>
                
                <div className="pdm-comparisons">
                  <div className="pdm-comparison-item">
                    <div className="pdm-comparison-player">
                      <div className="pdm-comparison-rank">1</div>
                      <div className="pdm-comparison-name">
                        {player.position === "QB" ? "C.J. Stroud" : 
                         player.position === "RB" ? "Bijan Robinson" :
                         player.position === "WR" ? "Marvin Harrison Jr." : "Top Player"}
                      </div>
                      <div className={`pdm-comparison-grade ${getPlayerGradeClass(player.grade + 5)}`}>
                        {(player.grade + 5).toFixed(1)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="pdm-comparison-item pdm-current-player">
                    <div className="pdm-comparison-player">
                      <div className="pdm-comparison-rank">
                        {player.rank || Math.floor(Math.random() * 20) + 1}
                      </div>
                      <div className="pdm-comparison-name">{player.fullName}</div>
                      <div className={`pdm-comparison-grade ${getPlayerGradeClass(player.grade)}`}>
                        {player.grade.toFixed(1)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="pdm-comparison-item">
                    <div className="pdm-comparison-player">
                      <div className="pdm-comparison-rank">
                        {player.rank ? player.rank + 10 : Math.floor(Math.random() * 20) + 21}
                      </div>
                      <div className="pdm-comparison-name">
                        {player.position === "QB" ? "Bo Nix" : 
                         player.position === "RB" ? "Trey Benson" :
                         player.position === "WR" ? "Xavier Worthy" : "Similar Player"}
                      </div>
                      <div className={`pdm-comparison-grade ${getPlayerGradeClass(player.grade - 7)}`}>
                        {(player.grade - 7).toFixed(1)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Career Chart */}
          {activeTab === "career" && (
            <div className="pdm-tab-pane">
              <div className="pdm-career-overview">
                <h3 className="pdm-section-title">
                  <FontAwesomeIcon icon={faChartLine} />
                  Career Grade Progression
                </h3>
                
                <div className="pdm-career-chart">
                  <div className="pdm-career-bars">
                    {careerData.map((data, index) => (
                      <div key={index} className="pdm-career-year">
                        <div className="pdm-year-label">{data.year}</div>
                        <div className="pdm-bar-container">
                          <div className="pdm-bar-track">
                            <div 
                              className={`pdm-bar ${index === careerData.length - 1 ? 'pdm-current-year' : ''} ${getPlayerGradeClass(data.grade)}`}
                              style={{ width: `${data.grade}%` }}
                              onMouseEnter={() => setHoverGrade(data)}
                              onMouseLeave={() => setHoverGrade(null)}
                            >
                              <span className="pdm-bar-grade">
                                {data.grade.toFixed(1)}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="pdm-year-grade-letter">
                          {getPlayerLetterGrade(data.grade)}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="pdm-grade-scale">
                    <div className="pdm-scale-markers">
                      {[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map(value => (
                        <div key={value} className="pdm-scale-mark">
                          <div className="pdm-scale-line"></div>
                          <div className="pdm-scale-value">{value}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                
                {hoverGrade && (
                  <div className="pdm-grade-details-card">
                    <h4>
                      <FontAwesomeIcon icon={faCalendarAlt} /> {hoverGrade.year} Season
                    </h4>
                    <div className="pdm-detail-row">
                      <span>Overall Grade:</span>
                      <span className={getPlayerGradeClass(hoverGrade.grade)}>
                        {hoverGrade.grade.toFixed(1)}
                      </span>
                    </div>
                    <div className="pdm-detail-row">
                      <span>Letter Grade:</span>
                      <span>{getPlayerLetterGrade(hoverGrade.grade)}</span>
                    </div>
                    <div className="pdm-detail-row">
                      <span>Performance Level:</span>
                      <span>{getGradeDescription(hoverGrade.grade)}</span>
                    </div>
                  </div>
                )}
                
                <div className="pdm-career-summary">
                  <div className="pdm-summary-card">
                    <div className="pdm-summary-icon">
                      <FontAwesomeIcon icon={faArrowUp} />
                    </div>
                    <h4>Career Trend</h4>
                    <p>{careerData[careerData.length - 1].grade > careerData[0].grade + 5
                        ? "Significant improvement over career"
                        : careerData[careerData.length - 1].grade > careerData[0].grade
                          ? "Steady improvement throughout career"
                          : careerData[careerData.length - 1].grade < careerData[0].grade - 5
                            ? "Declining performance over time"
                            : "Consistent performance level"}
                    </p>
                  </div>
                  
                  <div className="pdm-summary-card">
                    <div className="pdm-summary-icon">
                      <FontAwesomeIcon icon={faTrophy} />
                    </div>
                    <h4>Best Season</h4>
                    <p>
                      {careerData.sort((a, b) => b.grade - a.grade)[0].year} 
                      ({careerData.sort((a, b) => b.grade - a.grade)[0].grade.toFixed(1)})
                    </p>
                  </div>
                  
                  <div className="pdm-summary-card">
                    <div className="pdm-summary-icon">
                      <FontAwesomeIcon icon={faChartLine} />
                    </div>
                    <h4>Career Average</h4>
                    <p>
                      {(careerData.reduce((sum, data) => sum + data.grade, 0) / careerData.length).toFixed(1)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Snaps Tab Content */}
          {activeTab === "snaps" && (
            <div className="pdm-tab-pane">
              <div className="pdm-snap-overview">
                <div className="pdm-snap-charts">
                  <div className="pdm-snap-card">
                    <h3 className="pdm-section-title">
                      <FontAwesomeIcon icon={faFootballBall} />
                      Snap Distribution
                    </h3>
                    <div className="pdm-donut-chart">
                      <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                          <Pie
                            data={snapsData}
                            cx="50%"
                            cy="50%"
                            innerRadius={70}
                            outerRadius={90}
                            paddingAngle={2}
                            dataKey="value"
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            labelLine={false}
                          >
                            {snapsData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => [`${value} snaps`, '']} />
                          <Legend verticalAlign="bottom" height={36} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    
                    <div className="pdm-snap-data">
                      <div className="pdm-snap-total">
                        <div className="pdm-total-number">
                          {snapsData.reduce((sum, data) => sum + data.value, 0)}
                        </div>
                        <div className="pdm-total-label">Total Snaps</div>
                      </div>
                      
                      <div className="pdm-snap-details">
                        <div className="pdm-snap-item">
                          <div className="pdm-snap-color" style={{ backgroundColor: COLORS[0] }}></div>
                          <div className="pdm-snap-name">Pass</div>
                          <div className="pdm-snap-value">{snapsData[0].value}</div>
                          <div className="pdm-snap-percentage">
                            {((snapsData[0].value / (snapsData[0].value + snapsData[1].value)) * 100).toFixed(1)}%
                          </div>
                        </div>
                        
                        <div className="pdm-snap-item">
                          <div className="pdm-snap-color" style={{ backgroundColor: COLORS[1] }}></div>
                          <div className="pdm-snap-name">Run</div>
                          <div className="pdm-snap-value">{snapsData[1].value}</div>
                          <div className="pdm-snap-percentage">
                            {((snapsData[1].value / (snapsData[0].value + snapsData[1].value)) * 100).toFixed(1)}%
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="pdm-snap-card">
                    <h3 className="pdm-section-title">
                      <FontAwesomeIcon icon={faUsers} />
                      Position Breakdown
                    </h3>
                    
                    <div className="pdm-position-breakdown">
                      <div className="pdm-position-primary">
                        <div className="pdm-position-icon">
                          <FontAwesomeIcon icon={
                            player.position === "QB" ? faFootballBall :
                            player.position === "RB" || player.position === "FB" ? faRunning :
                            faShieldAlt
                          } />
                        </div>
                        <div className="pdm-position-details">
                          <div className="pdm-position-name">
                            {player.position === "QB" ? "Quarterback" :
                             player.position === "RB" ? "Running Back" :
                             player.position === "FB" ? "Fullback" :
                             player.position === "WR" ? "Wide Receiver" :
                             player.position === "TE" ? "Tight End" :
                             player.position === "OL" ? "Offensive Line" :
                             player.position === "DL" ? "Defensive Line" :
                             player.position === "LB" ? "Linebacker" :
                             player.position === "DB" ? "Defensive Back" :
                             player.position === "S" ? "Safety" :
                             player.position === "CB" ? "Cornerback" :
                             player.position}
                          </div>
                          <div className="pdm-position-snaps">
                            {snapsData[0].value + snapsData[1].value} snaps
                          </div>
                        </div>
                      </div>
                      
                      <div className="pdm-position-grid">
                        {player.position === "QB" && (
                          <>
                            <div className="pdm-position-item">
                              <div className="pdm-position-label">Shotgun</div>
                              <div className="pdm-position-value">
                                {Math.floor((snapsData[0].value + snapsData[1].value) * 0.7)}
                              </div>
                              <div className="pdm-position-bar">
                                <div className="pdm-position-fill" style={{ width: '70%' }}></div>
                              </div>
                            </div>
                            <div className="pdm-position-item">
                              <div className="pdm-position-label">Under Center</div>
                              <div className="pdm-position-value">
                                {Math.floor((snapsData[0].value + snapsData[1].value) * 0.3)}
                              </div>
                              <div className="pdm-position-bar">
                                <div className="pdm-position-fill" style={{ width: '30%' }}></div>
                              </div>
                            </div>
                          </>
                        )}
                        
                        {player.position === "WR" && (
                          <>
                            <div className="pdm-position-item">
                              <div className="pdm-position-label">Outside</div>
                              <div className="pdm-position-value">
                                {Math.floor((snapsData[0].value + snapsData[1].value) * 0.65)}
                              </div>
                              <div className="pdm-position-bar">
                                <div className="pdm-position-fill" style={{ width: '65%' }}></div>
                              </div>
                            </div>
                            <div className="pdm-position-item">
                              <div className="pdm-position-label">Slot</div>
                              <div className="pdm-position-value">
                                {Math.floor((snapsData[0].value + snapsData[1].value) * 0.35)}
                              </div>
                              <div className="pdm-position-bar">
                                <div className="pdm-position-fill" style={{ width: '35%' }}></div>
                              </div>
                            </div>
                          </>
                        )}
                        
                        {player.position === "RB" && (
                          <>
                            <div className="pdm-position-item">
                              <div className="pdm-position-label">Backfield</div>
                              <div className="pdm-position-value">
                                {Math.floor((snapsData[0].value + snapsData[1].value) * 0.85)}
                              </div>
                              <div className="pdm-position-bar">
                                <div className="pdm-position-fill" style={{ width: '85%' }}></div>
                              </div>
                            </div>
                            <div className="pdm-position-item">
                              <div className="pdm-position-label">Slot</div>
                              <div className="pdm-position-value">
                                {Math.floor((snapsData[0].value + snapsData[1].value) * 0.15)}
                              </div>
                              <div className="pdm-position-bar">
                                <div className="pdm-position-fill" style={{ width: '15%' }}></div>
                              </div>
                            </div>
                          </>
                        )}
                        
                        {(player.position !== "QB" && player.position !== "WR" && player.position !== "RB") && (
                          <div className="pdm-position-item pdm-full-width">
                            <div className="pdm-position-label">{player.position}</div>
                            <div className="pdm-position-value">
                              {snapsData[0].value + snapsData[1].value}
                            </div>
                            <div className="pdm-position-bar">
                              <div className="pdm-position-fill" style={{ width: '100%' }}></div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="pdm-snap-card pdm-weekly-snaps">
                  <h3 className="pdm-section-title">
                    <FontAwesomeIcon icon={faCalendarAlt} />
                    Weekly Snap Distribution
                  </h3>
                  
                  <div className="pdm-bar-chart">
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart
                        data={weeklyData}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="week" label={{ value: 'Week', position: 'insideBottom', offset: -5 }} />
                        <YAxis label={{ value: 'Snaps', angle: -90, position: 'insideLeft' }} />
                        <Tooltip content={<CustomBarTooltip />} />
                        <Legend />
                        <Bar 
                          name="Passing Snaps" 
                          dataKey="passingSnaps" 
                          stackId="a" 
                          fill={COLORS[0]} 
                          radius={[4, 4, 0, 0]}
                        />
                        <Bar 
                          name="Running Snaps" 
                          dataKey="runningSnaps" 
                          stackId="a" 
                          fill={COLORS[1]} 
                          radius={[0, 0, 4, 4]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  
                  <div className="pdm-week-insights">
                    <div className="pdm-insight-card">
                      <div className="pdm-insight-icon">
                        <FontAwesomeIcon icon={faArrowUp} />
                      </div>
                      <div className="pdm-insight-content">
                        <h4>Highest Usage</h4>
                        <p>Week {weeklyData.sort((a, b) => (b.passingSnaps + b.runningSnaps) - (a.passingSnaps + a.runningSnaps))[0].week}</p>
                      </div>
                    </div>
                    
                    <div className="pdm-insight-card">
                      <div className="pdm-insight-icon">
                        <FontAwesomeIcon icon={faArrowDown} />
                      </div>
                      <div className="pdm-insight-content">
                        <h4>Lowest Usage</h4>
                        <p>Week {weeklyData.sort((a, b) => (a.passingSnaps + a.runningSnaps) - (b.passingSnaps + b.runningSnaps))[0].week}</p>
                      </div>
                    </div>
                    
                    <div className="pdm-insight-card">
                      <div className="pdm-insight-icon">
                        <FontAwesomeIcon icon={faChartLine} />
                      </div>
                      <div className="pdm-insight-content">
                        <h4>Average Snaps</h4>
                        <p>{Math.round(weeklyData.reduce((sum, week) => sum + week.passingSnaps + week.runningSnaps, 0) / weeklyData.length)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="pdm-footer">
          <button className="pdm-premium-btn">
            <span className="pdm-btn-icon">
              <FontAwesomeIcon icon={faChartLine} />
            </span>
            View Advanced Stats
          </button>
          
          <button className="pdm-export-btn">
            <span className="pdm-btn-icon">
              <FontAwesomeIcon icon={faClipboardCheck} />
            </span>
            Export Report
          </button>
        </div>
      </div>
    </div>
  );
};

export default PlayerDetailModal;