import React from 'react';
import { getGradeColor, getGradeDescription, renderPlayerKeyStat } from '../../../utils/gradingUtils';

const OverviewTab = ({ 
  advancedData, 
  homeTeam, 
  awayTeam, 
  homeTeamColor, 
  awayTeamColor, 
  homeLogo, 
  awayLogo 
}) => {
  const { homeTeamStats, awayTeamStats } = advancedData;
  
  // Calculate percentages for visual display
  const totalYards = homeTeamStats.totalYards + awayTeamStats.totalYards;
  const homeYardsPercentage = Math.round((homeTeamStats.totalYards / totalYards) * 100) || 50;
  const awayYardsPercentage = 100 - homeYardsPercentage;
  
  const totalTime = homeTeamStats.timeOfPossession + awayTeamStats.timeOfPossession;
  const homePossessionPercentage = Math.round((homeTeamStats.timeOfPossession / totalTime) * 100) || 50;
  const awayPossessionPercentage = 100 - homePossessionPercentage;
  
  return (
    <div className="advanced-stats-overview">
      <h3 className="section-title">Team Statistics Comparison</h3>
      
      <div className="team-comparison-grid">
        {/* Team headers */}
        <div className="team-header home">
          <span className="team-name">{homeTeam}</span>
          <img src={homeLogo} alt={homeTeam} className="team-logo-small" />
        </div>
        <div className="stat-label-cell"></div>
        <div className="team-header away">
          <img src={awayLogo} alt={awayTeam} className="team-logo-small" />
          <span className="team-name">{awayTeam}</span>
        </div>
        
        {/* Total Yards */}
        <div className="stat-value home" style={{ backgroundColor: `${homeTeamColor}20` }}>
          {homeTeamStats.totalYards}
        </div>
        <div className="stat-label">Total Yards</div>
        <div className="stat-value away" style={{ backgroundColor: `${awayTeamColor}20` }}>
          {awayTeamStats.totalYards}
        </div>
        
        {/* Yards Bar */}
        <div className="full-width-cell">
          <div className="stat-bar">
            <div 
              className="stat-bar-segment home" 
              style={{ 
                width: `${homeYardsPercentage}%`, 
                backgroundColor: homeTeamColor 
              }}
            />
            <div 
              className="stat-bar-segment away" 
              style={{ 
                width: `${awayYardsPercentage}%`, 
                backgroundColor: awayTeamColor 
              }}
            />
          </div>
        </div>
        
        {/* Additional team comparison stats */}
        {/* Passing Yards */}
        <div className="stat-value home" style={{ backgroundColor: `${homeTeamColor}20` }}>
          {homeTeamStats.passingYards}
        </div>
        <div className="stat-label">Passing Yards</div>
        <div className="stat-value away" style={{ backgroundColor: `${awayTeamColor}20` }}>
          {awayTeamStats.passingYards}
        </div>
        
        {/* Rushing Yards */}
        <div className="stat-value home" style={{ backgroundColor: `${homeTeamColor}20` }}>
          {homeTeamStats.rushingYards}
        </div>
        <div className="stat-label">Rushing Yards</div>
        <div className="stat-value away" style={{ backgroundColor: `${awayTeamColor}20` }}>
          {awayTeamStats.rushingYards}
        </div>
        
        {/* Turnovers */}
        <div className="stat-value home" style={{ backgroundColor: `${homeTeamColor}20` }}>
          {homeTeamStats.turnovers}
        </div>
        <div className="stat-label">Turnovers</div>
        <div className="stat-value away" style={{ backgroundColor: `${awayTeamColor}20` }}>
          {awayTeamStats.turnovers}
        </div>
      </div>
      
      {/* Key Players Section */}
      <div className="key-players-section">
        <h3 className="section-title">Key Performers</h3>
        
        <div className="key-players-container">
          {[homeTeam, awayTeam].map(team => (
            <div 
              key={team} 
              className="team-key-players" 
              style={{ borderColor: team === homeTeam ? homeTeamColor : awayTeamColor }}
            >
              <div className="team-header-small">
                <img 
                  src={team === homeTeam ? homeLogo : awayLogo} 
                  alt={team} 
                  className="team-logo-tiny" 
                />
                <span className="team-name">{team} Key Players</span>
              </div>
              
              <div className="key-player-cards">
                {advancedData.keyPlayers[team].slice(0, 4).map((player, index) => (
                  <div 
                    key={index} 
                    className="key-player-card"
                    style={{ borderLeftColor: getGradeColor(player.grade) }}
                  >
                    <div className="player-name-position">
                      <span className="player-name">{player.name}</span>
                      <span className="player-position">{player.position}</span>
                    </div>
                    <div className="player-grade-container">
                      <div className="player-grade">
                        <span className="grade-value">{player.grade}</span>
                        <span className="grade-label">{getGradeDescription(player.grade)}</span>
                      </div>
                      <div className="player-key-stat">
                        {renderPlayerKeyStat(player)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default OverviewTab;