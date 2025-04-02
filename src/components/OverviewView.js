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
  // Destructure both the processed stats and official stats
  const { homeTeamStats, awayTeamStats, officialHomeStats, officialAwayStats, keyPlayers } = advancedData || {};

  // Defensive checks for required team stats (from processed data)
  if (!homeTeamStats || !awayTeamStats) {
    return <div>No team statistics available.</div>;
  }

  // Calculate percentages for visual display (using processed stats)
  const totalYards = (homeTeamStats.totalYards || 0) + (awayTeamStats.totalYards || 0);
  
  let homeYardsPercentage = 50;
  let awayYardsPercentage = 50;
  
  if (totalYards > 0) {
    homeYardsPercentage = Math.round((homeTeamStats.totalYards / totalYards) * 100);
    awayYardsPercentage = 100 - homeYardsPercentage;
  } else {
    console.warn("Total yards is zero. Using default 50/50 split for display.");
  }

  // For timeOfPossession, assume values are numbers (or use default if not)
  const homePossession = typeof homeTeamStats.timeOfPossession === 'number'
    ? homeTeamStats.timeOfPossession
    : 30;
  const awayPossession = typeof awayTeamStats.timeOfPossession === 'number'
    ? awayTeamStats.timeOfPossession
    : 30;
  const totalTime = homePossession + awayPossession;
  const homePossessionPercentage = Math.round((homePossession / totalTime) * 100);
  const awayPossessionPercentage = 100 - homePossessionPercentage;

  // Render the official stats table if the data is available.
  const renderOfficialStatsTable = () => {
    if (!officialHomeStats || !officialAwayStats) return null;
    // Exclude metadata keys from the official stats object.
    const skipKeys = new Set(["teamId", "team", "conference", "homeAway", "points", "stats"]);
    const categories = Object.keys(officialHomeStats).filter(key => !skipKeys.has(key));
    return (
      <div className="official-stats-section">
        <h3 className="section-title">Official Team Stats</h3>
        <table className="official-stats-table">
          <thead>
            <tr>
              <th>Category</th>
              <th>{homeTeam} (pts: {officialHomeStats.points})</th>
              <th>{awayTeam} (pts: {officialAwayStats.points})</th>
            </tr>
          </thead>
          <tbody>
            {categories.map(category => (
              <tr key={category}>
                <td>{category}</td>
                <td>{officialHomeStats[category]}</td>
                <td>{officialAwayStats[category]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

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
          {homeTeamStats.totalYards || 0}
        </div>
        <div className="stat-label">Total Yards</div>
        <div className="stat-value away" style={{ backgroundColor: `${awayTeamColor}20` }}>
          {awayTeamStats.totalYards || 0}
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
          {homeTeamStats.passingYards || 0}
        </div>
        <div className="stat-label">Passing Yards</div>
        <div className="stat-value away" style={{ backgroundColor: `${awayTeamColor}20` }}>
          {awayTeamStats.passingYards || 0}
        </div>
        
        {/* Rushing Yards */}
        <div className="stat-value home" style={{ backgroundColor: `${homeTeamColor}20` }}>
          {homeTeamStats.rushingYards || 0}
        </div>
        <div className="stat-label">Rushing Yards</div>
        <div className="stat-value away" style={{ backgroundColor: `${awayTeamColor}20` }}>
          {awayTeamStats.rushingYards || 0}
        </div>
        
        {/* First Downs */}
        <div className="stat-value home" style={{ backgroundColor: `${homeTeamColor}20` }}>
          {homeTeamStats.firstDowns || 0}
        </div>
        <div className="stat-label">First Downs</div>
        <div className="stat-value away" style={{ backgroundColor: `${awayTeamColor}20` }}>
          {awayTeamStats.firstDowns || 0}
        </div>
        
        {/* Third Down Efficiency */}
        <div className="stat-value home" style={{ backgroundColor: `${homeTeamColor}20` }}>
          {homeTeamStats.thirdDowns?.conversions || 0}/{homeTeamStats.thirdDowns?.attempts || 0} ({homeTeamStats.thirdDowns?.attempts ? Math.round((homeTeamStats.thirdDowns.conversions / homeTeamStats.thirdDowns.attempts) * 100) : 0}%)
        </div>
        <div className="stat-label">Third Down</div>
        <div className="stat-value away" style={{ backgroundColor: `${awayTeamColor}20` }}>
          {awayTeamStats.thirdDowns?.conversions || 0}/{awayTeamStats.thirdDowns?.attempts || 0} ({awayTeamStats.thirdDowns?.attempts ? Math.round((awayTeamStats.thirdDowns.conversions / awayTeamStats.thirdDowns.attempts) * 100) : 0}%)
        </div>
        
        {/* Red Zone Efficiency */}
        <div className="stat-value home" style={{ backgroundColor: `${homeTeamColor}20` }}>
          {homeTeamStats.redZone?.conversions || 0}/{homeTeamStats.redZone?.attempts || 0} ({homeTeamStats.redZone?.attempts ? Math.round((homeTeamStats.redZone.conversions / homeTeamStats.redZone.attempts) * 100) : 0}%)
        </div>
        <div className="stat-label">Red Zone</div>
        <div className="stat-value away" style={{ backgroundColor: `${awayTeamColor}20` }}>
          {awayTeamStats.redZone?.conversions || 0}/{awayTeamStats.redZone?.attempts || 0} ({awayTeamStats.redZone?.attempts ? Math.round((awayTeamStats.redZone.conversions / awayTeamStats.redZone.attempts) * 100) : 0}%)
        </div>
        
        {/* Turnovers */}
        <div className="stat-value home" style={{ backgroundColor: `${homeTeamColor}20` }}>
          {homeTeamStats.turnovers || 0}
        </div>
        <div className="stat-label">Turnovers</div>
        <div className="stat-value away" style={{ backgroundColor: `${awayTeamColor}20` }}>
          {awayTeamStats.turnovers || 0}
        </div>
        
        {/* Penalties */}
        <div className="stat-value home" style={{ backgroundColor: `${homeTeamColor}20` }}>
          {homeTeamStats.penalties?.count || 0}-{homeTeamStats.penalties?.yards || 0}
        </div>
        <div className="stat-label">Penalties</div>
        <div className="stat-value away" style={{ backgroundColor: `${awayTeamColor}20` }}>
          {awayTeamStats.penalties?.count || 0}-{awayTeamStats.penalties?.yards || 0}
        </div>
        
        {/* Explosive Plays */}
        <div className="stat-value home" style={{ backgroundColor: `${homeTeamColor}20` }}>
          {homeTeamStats.explosivePlays || 0}
        </div>
        <div className="stat-label tooltip-container">
          Explosive Plays
          <span className="tooltip-text">Plays of 20+ yards</span>
        </div>
        <div className="stat-value away" style={{ backgroundColor: `${awayTeamColor}20` }}>
          {awayTeamStats.explosivePlays || 0}
        </div>
        
        {/* Time of Possession */}
        <div className="stat-value home" style={{ backgroundColor: `${homeTeamColor}20` }}>
          {Math.floor(homePossession)}:{Math.round((homePossession % 1) * 60).toString().padStart(2, '0')}
        </div>
        <div className="stat-label">Time of Possession</div>
        <div className="stat-value away" style={{ backgroundColor: `${awayTeamColor}20` }}>
          {Math.floor(awayPossession)}:{Math.round((awayPossession % 1) * 60).toString().padStart(2, '0')}
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
      
      {/* Official Stats Table Section */}
      {officialHomeStats && officialAwayStats && (
        <div className="official-stats-section">
          <h3 className="section-title">Official Team Stats</h3>
          <table className="official-stats-table">
            <thead>
              <tr>
                <th>Category</th>
                <th>{homeTeam} (pts: {officialHomeStats.points})</th>
                <th>{awayTeam} (pts: {officialAwayStats.points})</th>
              </tr>
            </thead>
            <tbody>
              {Object.keys(officialHomeStats)
                .filter(key => !["teamId", "team", "conference", "homeAway", "points", "stats"].includes(key))
                .map(category => (
                <tr key={category}>
                  <td>{category}</td>
                  <td>{officialHomeStats[category]}</td>
                  <td>{officialAwayStats[category]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      <div className="key-players-section">
        <h3 className="section-title">Key Performers</h3>
        
        <div className="key-players-container">
          <div className="team-key-players" style={{ borderColor: homeTeamColor }}>
            <div className="team-header-small">
              <img src={homeLogo} alt={homeTeam} className="team-logo-tiny" />
              <span className="team-name">{homeTeam} Key Players</span>
            </div>
            
            <div className="key-player-cards">
              {advancedData.keyPlayers?.[homeTeam]?.slice(0, 4).map((player, index) => (
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
              {advancedData.keyPlayers?.[awayTeam]?.slice(0, 4).map((player, index) => (
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