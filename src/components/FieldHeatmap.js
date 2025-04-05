import React from 'react';
import { motion } from 'framer-motion';
import { FaFootballBall, FaChartLine } from 'react-icons/fa';
import { GiAmericanFootballHelmet } from 'react-icons/gi';
import "../styles/FieldHeatmap.css"; // Adjust the path as necessary"

const FieldHeatmap = ({ 
  plays, 
  homeTeam, 
  awayTeam, 
  homeColor, 
  awayColor 
}) => {
  // If no plays data is available
  if (!plays || plays.length === 0) {
    return (
      <div className="field-heatmap-container">
        <div className="heatmap-header">
          <h3>Field Usage Heatmap</h3>
        </div>
        <div className="heatmap-content empty">
          <p>No play data available to generate heatmap</p>
        </div>
      </div>
    );
  }

  // Generate field zones (10-yard increments)
  const fieldZones = [
    { name: "Home 0-10", range: [0, 10] },
    { name: "Home 10-20", range: [10, 20] },
    { name: "Home 20-30", range: [20, 30] },
    { name: "Home 30-40", range: [30, 40] },
    { name: "Home 40-50", range: [40, 50] },
    { name: "Away 40-50", range: [50, 60] },
    { name: "Away 30-40", range: [60, 70] },
    { name: "Away 20-30", range: [70, 80] },
    { name: "Away 10-20", range: [80, 90] },
    { name: "Away 0-10", range: [90, 100] }
  ];

  // Count plays in each zone
  const zonePlayCounts = fieldZones.map(zone => {
    const homePlays = plays.filter(play => 
      play.homeBall && 
      play.yardLine >= zone.range[0] && 
      play.yardLine < zone.range[1]
    ).length;
    
    const awayPlays = plays.filter(play => 
      !play.homeBall && 
      play.yardLine >= zone.range[0] && 
      play.yardLine < zone.range[1]
    ).length;
    
    return {
      ...zone,
      homePlays,
      awayPlays,
      totalPlays: homePlays + awayPlays
    };
  });

  // Find max plays for scaling
  const maxPlays = Math.max(...zonePlayCounts.map(zone => zone.totalPlays));

  // Calculate big plays by zone
  const bigPlaysByZone = fieldZones.map(zone => {
    const homeBigPlays = plays.filter(play => 
      play.homeBall && 
      play.yardLine >= zone.range[0] && 
      play.yardLine < zone.range[1] &&
      play.yardsGained >= 10
    ).length;
    
    const awayBigPlays = plays.filter(play => 
      !play.homeBall && 
      play.yardLine >= zone.range[0] && 
      play.yardLine < zone.range[1] &&
      play.yardsGained >= 10
    ).length;
    
    return {
      ...zone,
      homeBigPlays,
      awayBigPlays,
      totalBigPlays: homeBigPlays + awayBigPlays
    };
  });

  // Calculate scoring plays by zone
  const scoringPlaysByZone = fieldZones.map(zone => {
    // This is a simplified approach - in a real app you'd have more data
    const homeScoringPlays = plays.filter((play, index) => {
      if (index === 0) return false;
      const prevPlay = plays[index - 1];
      return (
        play.homeBall && 
        play.yardLine >= zone.range[0] && 
        play.yardLine < zone.range[1] &&
        play.homeScore > prevPlay.homeScore
      );
    }).length;
    
    const awayScoringPlays = plays.filter((play, index) => {
      if (index === 0) return false;
      const prevPlay = plays[index - 1];
      return (
        !play.homeBall && 
        play.yardLine >= zone.range[0] && 
        play.yardLine < zone.range[1] &&
        play.awayScore > prevPlay.awayScore
      );
    }).length;
    
    return {
      ...zone,
      homeScoringPlays,
      awayScoringPlays,
      totalScoringPlays: homeScoringPlays + awayScoringPlays
    };
  });

  return (
    <div className="field-heatmap-container">
      <div className="heatmap-header">
        <h3>Field Usage Heatmap</h3>
        <div className="heatmap-legend">
          <div className="legend-item">
            <div className="legend-color home" style={{ backgroundColor: homeColor }}></div>
            <span>{homeTeam}</span>
          </div>
          <div className="legend-item">
            <div className="legend-color away" style={{ backgroundColor: awayColor }}></div>
            <span>{awayTeam}</span>
          </div>
        </div>
      </div>
      
      <div className="heatmap-content">
        <div className="field-visualization">
          <div className="field-endzone home" style={{ backgroundColor: homeColor }}>
            <span>HOME</span>
          </div>
          
          <div className="field-playing-area">
            {fieldZones.map((zone, index) => (
              <div 
                key={index} 
                className="field-zone"
                style={{ width: `${100 / fieldZones.length}%` }}
              >
                <div className="zone-yard-line"></div>
                <div className="zone-yard-number">{zone.range[0]}</div>
                
                {/* Home team heatmap */}
                <motion.div 
                  className="zone-heatmap home"
                  initial={{ height: 0 }}
                  animate={{ 
                    height: `${(zonePlayCounts[index].homePlays / maxPlays) * 100}%`,
                    opacity: zonePlayCounts[index].homePlays > 0 ? 1 : 0
                  }}
                  transition={{ duration: 1, delay: index * 0.05 }}
                  style={{ 
                    backgroundColor: homeColor,
                    opacity: 0.7
                  }}
                >
                  {zonePlayCounts[index].homePlays > 0 && (
                    <span className="play-count">{zonePlayCounts[index].homePlays}</span>
                  )}
                </motion.div>
                
                {/* Away team heatmap */}
                <motion.div 
                  className="zone-heatmap away"
                  initial={{ height: 0 }}
                  animate={{ 
                    height: `${(zonePlayCounts[index].awayPlays / maxPlays) * 100}%`,
                    opacity: zonePlayCounts[index].awayPlays > 0 ? 1 : 0
                  }}
                  transition={{ duration: 1, delay: index * 0.05 }}
                  style={{ 
                    backgroundColor: awayColor,
                    opacity: 0.7
                  }}
                >
                  {zonePlayCounts[index].awayPlays > 0 && (
                    <span className="play-count">{zonePlayCounts[index].awayPlays}</span>
                  )}
                </motion.div>
                
                {/* Big play indicators */}
                {bigPlaysByZone[index].totalBigPlays > 0 && (
                  <div className="zone-indicator big-play">
                    <FaChartLine className="indicator-icon" />
                    <span>{bigPlaysByZone[index].totalBigPlays}</span>
                  </div>
                )}
                
                {/* Scoring play indicators */}
                {scoringPlaysByZone[index].totalScoringPlays > 0 && (
                  <div className="zone-indicator scoring-play">
                    <FaFootballBall className="indicator-icon" />
                    <span>{scoringPlaysByZone[index].totalScoringPlays}</span>
                  </div>
                )}
              </div>
            ))}
            
            {/* Add the final yard line (100) */}
            <div className="final-yard-line">
              <div className="zone-yard-line"></div>
              <div className="zone-yard-number">100</div>
            </div>
          </div>
          
          <div className="field-endzone away" style={{ backgroundColor: awayColor }}>
            <span>AWAY</span>
          </div>
        </div>
        
        <div className="heatmap-stats">
          <div className="heatmap-stat-item">
            <div className="stat-header">
              <GiAmericanFootballHelmet className="stat-icon" />
              <h4>Most Active Zone</h4>
            </div>
            <div className="stat-content">
              {zonePlayCounts.reduce((max, zone) => 
                zone.totalPlays > max.totalPlays ? zone : max, 
                { totalPlays: 0 }
              ).name}
              <span className="stat-highlight">
                ({zonePlayCounts.reduce((max, zone) => 
                  zone.totalPlays > max.totalPlays ? zone : max, 
                  { totalPlays: 0 }
                ).totalPlays} plays)
              </span>
            </div>
          </div>
          
          <div className="heatmap-stat-item">
            <div className="stat-header">
              <FaChartLine className="stat-icon" />
              <h4>Big Play Zone</h4>
            </div>
            <div className="stat-content">
              {bigPlaysByZone.reduce((max, zone) => 
                zone.totalBigPlays > max.totalBigPlays ? zone : max, 
                { totalBigPlays: 0 }
              ).name}
              <span className="stat-highlight">
                ({bigPlaysByZone.reduce((max, zone) => 
                  zone.totalBigPlays > max.totalBigPlays ? zone : max, 
                  { totalBigPlays: 0 }
                ).totalBigPlays} big plays)
              </span>
            </div>
          </div>
          
          <div className="heatmap-stat-item">
            <div className="stat-header">
              <FaFootballBall className="stat-icon" />
              <h4>Scoring Zone</h4>
            </div>
            <div className="stat-content">
              {scoringPlaysByZone.reduce((max, zone) => 
                zone.totalScoringPlays > max.totalScoringPlays ? zone : max, 
                { totalScoringPlays: 0 }
              ).name}
              <span className="stat-highlight">
                ({scoringPlaysByZone.reduce((max, zone) => 
                  zone.totalScoringPlays > max.totalScoringPlays ? zone : max, 
                  { totalScoringPlays: 0 }
                ).totalScoringPlays} scoring plays)
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FieldHeatmap;
