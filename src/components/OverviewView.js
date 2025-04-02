import React from 'react';
import { getGradeDescription, getGradeColor, renderPlayerKeyStat } from '../utils/statsCalculators';

const OverviewView = ({ 
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
        
        {/* First Downs */}
        <div className="stat-value home" style={{ backgroundColor: `${homeTeamColor}20` }}>
          {homeTeamStats.firstDowns}
        </div>
        <div className="stat-label">First Downs</div>
        <div className="stat-value away" style={{ backgroundColor: `${awayTeamColor}20` }}>
          {awayTeamStats.firstDowns}
        </div>
        
        {/* Third Down Efficiency */}
        <div className="stat-value home" style={{ backgroundColor: `${homeTeamColor}20` }}>
          {homeTeamStats.thirdDowns.conversions}/{homeTeamStats.thirdDowns.attempts} ({Math.round((homeTeamStats.thirdDowns.conversions / homeTeamStats.thirdDowns.attempts) * 100) || 0}%)
        </div>
        <div className="stat-label">Third Down</div>
        <div className="stat-value away" style={{ backgroundColor: `${awayTeamColor}20` }}>
          {awayTeamStats.thirdDowns.conversions}/{awayTeamStats.thirdDowns.attempts} ({Math.round((awayTeamStats.thirdDowns.conversions / awayTeamStats.thirdDowns.attempts) * 100) || 0}%)
        </div>
        
        {/* Red Zone Efficiency */}
        <div className="stat-value home" style={{ backgroundColor: `${homeTeamColor}20` }}>
          {homeTeamStats.redZone.conversions}/{homeTeamStats.redZone.attempts} ({Math.round((homeTeamStats.redZone.conversions / homeTeamStats.redZone.attempts) * 100) || 0}%)
        </div>
        <div className="stat-label">Red Zone</div>
        <div className="stat-value away" style={{ backgroundColor: `${awayTeamColor}20` }}>
          {awayTeamStats.redZone.conversions}/{awayTeamStats.redZone.attempts} ({Math.round((awayTeamStats.redZone.conversions / awayTeamStats.redZone.attempts) * 100) || 0}%)
        </div>
        
        {/* Turnovers */}
        <div className="stat-value home" style={{ backgroundColor: `${homeTeamColor}20` }}>
          {homeTeamStats.turnovers}
        </div>
        <div className="stat-label">Turnovers</div>
        <div className="stat-value away" style={{ backgroundColor: `${awayTeamColor}20` }}>
          {awayTeamStats.turnovers}
        </div>
        
        {/* Penalties */}
        <div className="stat-value home" style={{ backgroundColor: `${homeTeamColor}20` }}>
          {homeTeamStats.penalties.count}-{homeTeamStats.penalties.yards}
        </div>
        <div className="stat-label">Penalties</div>
        <div className="stat-value away" style={{ backgroundColor: `${awayTeamColor}20` }}>
          {awayTeamStats.penalties.count}-{awayTeamStats.penalties.yards}
        </div>
        
        {/* Explosive Plays */}
        <div className="stat-value home" style={{ backgroundColor: `${homeTeamColor}20` }}>
          {homeTeamStats.explosivePlays}
        </div>
        <div className="stat-label tooltip-container">
          Explosive Plays
          <span className="tooltip-text">Plays of 20+ yards</span>
        </div>
        <div className="stat-value away" style={{ backgroundColor: `${awayTeamColor}20` }}>
          {awayTeamStats.explosivePlays}
        </div>
        
        {/* Time of Possession */}
        <div className="stat-value home" style={{ backgroundColor: `${homeTeamColor}20` }}>
          {Math.floor(homeTeamStats.timeOfPossession)}:{Math.round((homeTeamStats.timeOfPossession % 1) * 60).toString().padStart(2, '0')}
        </div>
        <div className="stat-label">Time of Possession</div>
        <div className="stat-value away" style={{ backgroundColor: `${awayTeamColor}20` }}>
          {Math.floor(awayTeamStats.timeOfPossession)}:{Math.round((awayTeamStats.timeOfPossession % 1) * 60).toString().padStart(2, '0')}
        </div>
        
        {/* Possession Bar */}
        <div className="full-width-cell">
          <div className="possession-bar">
            <div 
              className="possession-segment home" 
              style={{ 
                width: `${homePossessionPercentage}%`, 
                backgroundColor: homeTeamColor 
              }}
            >
              {homePossessionPercentage}%
            </div>
            <div 
              className="possession-segment away" 
              style={{ 
                width: `${awayPossessionPercentage}%`, 
                backgroundColor: awayTeamColor 
              }}
            >
              {awayPossessionPercentage}%
            </div>
          </div>
        </div>
      </div>
      
      <div className="key-players-section">
        <h3 className="section-title">Key Performers</h3>
        
        <div className="key-players-container">
          <div className="team-key-players" style={{ borderColor: homeTeamColor }}>
            <div className="team-header-small">
              <img src={homeLogo} alt={homeTeam} className="team-logo-tiny" />
              <span className="team-name">{homeTeam} Key Players</span>
            </div>
            
            <div className="key-player-cards">
              {advancedData.keyPlayers[homeTeam].slice(0, 4).map((player, index) => (
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
          
          <div className="team-key-players" style={{ borderColor: awayTeamColor }}>
            <div className="team-header-small">
              <img src={awayLogo} alt={awayTeam} className="team-logo-tiny" />
              <span className="team-name">{awayTeam} Key Players</span>
            </div>
            
            <div className="key-player-cards">
              {advancedData.keyPlayers[awayTeam].slice(0, 4).map((player, index) => (
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
        </div>
      </div>
    </div>
  );
};

export default OverviewView;