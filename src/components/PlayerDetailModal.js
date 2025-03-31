import React, { useState, useEffect } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import "./PlayerDetailModal.css";

const PlayerDetailModal = ({ player, team, onClose, year, gameId }) => {
  if (!player || !team) return null;
  
  const [activeTab, setActiveTab] = useState("season");
  
  // Helper functions
  const getGradeColorClass = (grade) => {
    if (grade >= 90) return "grade-a-plus";
    if (grade >= 85) return "grade-a";
    if (grade >= 80) return "grade-a-minus";
    if (grade >= 77) return "grade-b-plus";
    if (grade >= 73) return "grade-b";
    if (grade >= 70) return "grade-b-minus";
    if (grade >= 67) return "grade-c-plus";
    if (grade >= 63) return "grade-c";
    if (grade >= 60) return "grade-c-minus";
    if (grade >= 57) return "grade-d-plus";
    if (grade >= 53) return "grade-d";
    if (grade >= 50) return "grade-d-minus";
    return "grade-f";
  };

  const getLetterGrade = (grade) => {
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
  };

  // Calculate passing vs running snaps data
  const getSnapsData = () => {
    // In a real implementation, you would get this data from player.gameStats or seasonStats
    // For now, we're creating mock data
    if (!player.seasonStats || player.seasonStats.length === 0) {
      const passSnaps = 350;
      const runSnaps = 150;
      return [
        { name: "Passing Snaps", value: passSnaps, color: "#1a4d80" },
        { name: "Running Snaps", value: runSnaps, color: "#3895d3" }
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
      { name: "Passing Snaps", value: passSnaps, color: "#1a4d80" },
      { name: "Running Snaps", value: runSnaps, color: "#3895d3" }
    ];
  };

  // Get weekly data for the bar chart
  const getWeeklyData = () => {
    // In a real implementation, you would extract this from player game stats
    return Array.from({ length: 14 }, (_, i) => ({
      week: i + 1,
      passingSnaps: Math.floor(Math.random() * 40) + 20,
      runningSnaps: Math.floor(Math.random() * 20) + 10
    }));
  };

  // Get career grade data
  const getCareerData = () => {
    // Mock career data - in a real implementation, this would come from historical player data
    return [
      { year: 2021, grade: player.grade > 80 ? player.grade - 20 : player.grade + 5 },
      { year: 2022, grade: player.grade > 85 ? player.grade - 15 : player.grade + 10 },
      { year: 2023, grade: player.grade > 85 ? player.grade - 5 : player.grade + 15 },
      { year: 2024, grade: player.grade }
    ];
  };

  const snapsData = getSnapsData();
  const weeklyData = getWeeklyData();
  const careerData = getCareerData();
  const COLORS = ['#1a4d80', '#3895d3'];

  // Get the background gradient based on team color
  const getTeamGradient = () => {
    // Default gradient for team (when team has no colors)
    if (!team.color) {
      return `linear-gradient(135deg, #0F3057 0%, #1a4d80 100%)`;
    }
    
    // Get secondary color - either from team data or a lighter shade of primary
    const secondaryColor = team.alt_color || lightenColor(team.color, 30);
    
    // Return the gradient
    return `linear-gradient(135deg, ${team.color} 0%, ${secondaryColor} 100%)`;
  };
  
  // Helper to lighten a color for gradient effect
  const lightenColor = (color, percent) => {
    if (!color) return "#1a4d80";
    
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
  
  // Get position text for display
  const getPositionText = () => {
    return `${player.position} #${player.number || "1"}`;
  };
  
  // Get physical info or mock it if missing
  const getPhysicalInfo = () => {
    return {
      height: player.height || "6'2\"",
      weight: player.weight || "225",
      year: player.year || "Sr.",
      draftYear: year + 1
    };
  };

  const physicalInfo = getPhysicalInfo();

  return (
    <div className="player-modal-overlay" onClick={onClose}>
      <div className="player-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-close" onClick={onClose}>×</div>
        
        <div className="modal-header" style={{ background: getTeamGradient() }}>
          <div className="team-logo">
            {team.logos && team.logos[0] ? (
              <img 
                src={team.logos[0]} 
                alt={team.school} 
                className="team-logo-img"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "/photos/default_team.png";
                }}
              />
            ) : (
              <div className="team-logo-placeholder">{team.school?.substring(0, 1)}</div>
            )}
          </div>
          
          <div className="player-name-container">
            <h2>{player.fullName}</h2>
            <div className="player-position">
              <span className="position-badge">{player.position}</span> 
              <span className="position-number">#{player.number || "1"}</span>
            </div>
          </div>
          
          <div className="team-name">
            <span>{team.school} {team.mascot || ''}</span>
          </div>
        </div>

        <div className="player-physical-info">
          <div className="info-group">
            <span className="info-label">HEIGHT</span>
            <span className="info-value">{physicalInfo.height}</span>
          </div>
          <div className="info-group">
            <span className="info-label">WEIGHT</span>
            <span className="info-value">{physicalInfo.weight}</span>
          </div>
          <div className="info-group">
            <span className="info-label">CLASS</span>
            <span className="info-value">{physicalInfo.year}</span>
          </div>
          <div className="info-group">
            <span className="info-label">DRAFT ELIGIBLE YEAR</span>
            <span className="info-value">{physicalInfo.draftYear}</span>
          </div>
        </div>

        <div className="modal-tabs">
          <div 
            className={`tab ${activeTab === "season" ? "active" : ""}`}
            onClick={() => setActiveTab("season")}
          >
            {year} Season Grades
          </div>
          <div 
            className={`tab ${activeTab === "career" ? "active" : ""}`}
            onClick={() => setActiveTab("career")}
          >
            Career Grades
          </div>
          <div 
            className={`tab ${activeTab === "snaps" ? "active" : ""}`}
            onClick={() => setActiveTab("snaps")}
          >
            {year} Snaps
          </div>
        </div>

        <div className="modal-tab-content">
          {/* Season Grades Tab Content */}
          {activeTab === "season" && (
            <div className="season-grades">
              <div className="grade-card">
                <h3>OFFENSE GRADE</h3>
                <div className={`grade-value ${getGradeColorClass(player.grade)}`}>
                  {player.grade?.toFixed(1)}
                </div>
                <div className="grade-rank">
                  {player.rank ? `${player.rank}/${player.totalPlayers} ${player.position}` : `${Math.floor(Math.random() * 20) + 1}/120 ${player.position}`}
                </div>
              </div>

              <div className="grade-card">
                <h3>PASS GRADE</h3>
                <div className={`grade-value ${getGradeColorClass(player.grade - 2)}`}>
                  {(player.grade - 2)?.toFixed(1)}
                </div>
                <div className="grade-rank">
                  {player.passRank ? `${player.passRank}/${player.totalPlayers} ${player.position}` : `${Math.floor(Math.random() * 25) + 1}/120 ${player.position}`}
                </div>
              </div>

              <div className="grade-card">
                <h3>RUN GRADE</h3>
                <div className={`grade-value ${getGradeColorClass(player.grade - 7)}`}>
                  {(player.grade - 7)?.toFixed(1)}
                </div>
                <div className="grade-rank">
                  {player.runRank ? `${player.runRank}/${player.totalPlayers} ${player.position}` : `${Math.floor(Math.random() * 30) + 1}/120 ${player.position}`}
                </div>
              </div>

              <div className="status-card">
                <h3>STATUS</h3>
                <div className="status-value">
                  {getLetterGrade(player.grade)}
                </div>
              </div>
            </div>
          )}

          {/* Career Chart */}
          {activeTab === "career" && (
            <div className="career-chart">
              {careerData.map((data, index) => (
                <div key={index} className="career-bar-container">
                  <div className="year-label">{data.year}</div>
                  <div className="career-bar-wrapper">
                    <div 
                      className="career-bar" 
                      style={{ 
                        width: `${data.grade}%`, 
                        backgroundColor: index === careerData.length - 1 ? '#3895d3' : '#AAD4E5' 
                      }}
                    >
                      <span className="career-grade">{data.grade.toFixed(1)}</span>
                    </div>
                  </div>
                </div>
              ))}
              <div className="chart-scale">
                <div>0</div>
                <div>10</div>
                <div>20</div>
                <div>30</div>
                <div>40</div>
                <div>50</div>
                <div>60</div>
                <div>70</div>
                <div>80</div>
                <div>90</div>
                <div>100</div>
              </div>
            </div>
          )}

          {/* Snaps Tab Content */}
          {activeTab === "snaps" && (
            <>
              {/* Snaps Charts */}
              <div className="snap-charts">
                <div className="total-snaps">
                  <h3>TOTAL</h3>
                  <div className="pie-chart-container">
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie
                          data={snapsData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={0}
                          dataKey="value"
                          label={false}
                        >
                          {snapsData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="pie-legend">
                      <div className="legend-item">
                        <div className="legend-color" style={{ backgroundColor: COLORS[0] }}></div>
                        <div>Passing Snaps</div>
                      </div>
                      <div className="legend-item">
                        <div className="legend-color" style={{ backgroundColor: COLORS[1] }}></div>
                        <div>Running Snaps</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="position-stats">
                  <h3>BY POSITION</h3>
                  <div className="position-stats-table">
                    <div className="position-row">
                      <div className="position-cell">{player.position}</div>
                      <div className="position-cell">{snapsData[0].value + snapsData[1].value}</div>
                    </div>
                    {player.position === "QB" && (
                      <div className="position-row">
                        <div className="position-cell">Shotgun</div>
                        <div className="position-cell">{Math.floor((snapsData[0].value + snapsData[1].value) * 0.7)}</div>
                      </div>
                    )}
                    {player.position === "WR" && (
                      <>
                        <div className="position-row">
                          <div className="position-cell">Slot</div>
                          <div className="position-cell">20</div>
                        </div>
                        <div className="position-row">
                          <div className="position-cell">Wide</div>
                          <div className="position-cell">4</div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Weekly Snap Distribution */}
              <div className="weekly-snaps">
                <h3>WEEKLY</h3>
                <div className="weekly-chart">
                  {weeklyData.map((week, index) => (
                    <div key={index} className="weekly-bar-container">
                      <div className="week-number">{week.week}</div>
                      <div className="weekly-stacked-bar">
                        <div 
                          className="passing-bar" 
                          style={{ 
                            width: `${week.passingSnaps}%`,
                            backgroundColor: COLORS[0]
                          }}
                        >
                          {week.passingSnaps}
                        </div>
                        <div 
                          className="running-bar" 
                          style={{ 
                            width: `${week.runningSnaps}%`,
                            backgroundColor: COLORS[1]
                          }}
                        >
                          {week.runningSnaps}
                        </div>
                      </div>
                    </div>
                  ))}
                  <div className="chart-legend">
                    <div className="legend-item">
                      <div className="legend-color" style={{ backgroundColor: COLORS[0] }}></div>
                      <div>Passing Snaps</div>
                    </div>
                    <div className="legend-item">
                      <div className="legend-color" style={{ backgroundColor: COLORS[1] }}></div>
                      <div>Running Snaps</div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="modal-footer">
          <button className="view-premium-btn">VIEW IN PREMIUM STATS</button>
        </div>
      </div>
    </div>
  );
};

export default PlayerDetailModal;