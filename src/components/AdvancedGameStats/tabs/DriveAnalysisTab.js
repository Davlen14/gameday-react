import React from 'react';

const DriveAnalysisTab = ({ 
  advancedData, 
  homeTeam, 
  awayTeam, 
  homeTeamColor, 
  awayTeamColor, 
  homeLogo, 
  awayLogo 
}) => {
  const { drives } = advancedData;
  
  // Group drives by quarter
  const drivesByQuarter = drives.reduce((acc, drive) => {
    const quarter = drive.quarter || 1;
    if (!acc[quarter]) acc[quarter] = [];
    acc[quarter].push(drive);
    return acc;
  }, {});

  // Calculate drive success rates and statistics
  const calculateDriveStats = (teamDrives) => {
    const successfulDrives = teamDrives.filter(d => 
      d.result === 'Touchdown' || d.result === 'Field Goal'
    );

    const avgYards = teamDrives.length > 0
      ? teamDrives.reduce((sum, d) => sum + d.yards, 0) / teamDrives.length
      : 0;

    const avgPlays = teamDrives.length > 0
      ? teamDrives.reduce((sum, d) => sum + d.plays, 0) / teamDrives.length
      : 0;

    return {
      successRate: teamDrives.length > 0 
        ? (successfulDrives.length / teamDrives.length * 100).toFixed(1)
        : '0.0',
      totalDrives: teamDrives.length,
      successfulDrives: successfulDrives.length,
      avgYards: avgYards.toFixed(1),
      avgPlays: avgPlays.toFixed(1)
    };
  };

  const homeDrives = drives.filter(d => d.team === homeTeam);
  const awayDrives = drives.filter(d => d.team === awayTeam);
  const homeStats = calculateDriveStats(homeDrives);
  const awayStats = calculateDriveStats(awayDrives);

  return (
    <div className="drive-analysis-container">
      <h3 className="section-title">Drive Analysis</h3>
      
      {/* Quarter-by-Quarter Drives */}
      {Object.entries(drivesByQuarter).map(([quarter, quarterDrives]) => (
        <div key={quarter} className="quarter-drives">
          <h4 className="quarter-header">Quarter {quarter}</h4>
          
          <div className="drives-list">
            {quarterDrives.map((drive, index) => (
              <div 
                key={index} 
                className="drive-item"
                style={{ 
                  borderLeftColor: drive.team === homeTeam ? homeTeamColor : awayTeamColor,
                  backgroundColor: drive.team === homeTeam 
                    ? `${homeTeamColor}10` 
                    : `${awayTeamColor}10`
                }}
              >
                <div className="drive-team">
                  <img 
                    src={drive.team === homeTeam ? homeLogo : awayLogo} 
                    alt={drive.team} 
                    className="team-logo-tiny" 
                  />
                  <span>{drive.team}</span>
                </div>
                
                <div className="drive-details">
                  <div className="drive-detail">
                    <span className="detail-label">Result:</span>
                    <span 
                      className={`detail-value ${
                        drive.result === 'Touchdown' || drive.result === 'Field Goal' 
                          ? 'success' 
                          : drive.result === 'Turnover' || drive.result === 'Turnover on Downs' 
                          ? 'failure' 
                          : ''
                      }`}
                    >
                      {drive.result}
                    </span>
                  </div>
                  
                  <div className="drive-stats">
                    <div className="drive-stat">
                      <span className="stat-label">Plays:</span>
                      <span className="stat-value">{drive.plays}</span>
                    </div>
                    
                    <div className="drive-stat">
                      <span className="stat-label">Yards:</span>
                      <span className="stat-value">{drive.yards}</span>
                    </div>
                    
                    <div className="drive-stat">
                      <span className="stat-label">Start:</span>
                      <span className="stat-value">{drive.startPosition}</span>
                    </div>
                    
                    <div className="drive-stat">
                      <span className="stat-label">Time:</span>
                      <span className="stat-value">{drive.timeOfPossession}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
      
      <div className="drive-summary">
        <h4>Drive Summary Analysis</h4>
        
        <div className="drive-success-rates">
          {[
            { 
              team: homeTeam, 
              stats: homeStats, 
              color: homeTeamColor, 
              logo: homeLogo 
            },
            { 
              team: awayTeam, 
              stats: awayStats, 
              color: awayTeamColor, 
              logo: awayLogo 
            }
          ].map((teamData, index) => (
            <div 
              key={index} 
              className="team-rate" 
              style={{ borderColor: teamData.color }}
            >
              <div className="team-header-small">
                <img 
                  src={teamData.logo} 
                  alt={teamData.team} 
                  className="team-logo-tiny" 
                />
                <span>{teamData.team}</span>
              </div>
              <div className="rate-values">
                <div className="rate-value">{teamData.stats.successRate}%</div>
                <div className="rate-label">Drive Success Rate</div>
                <div className="rate-detail">
                  {teamData.stats.successfulDrives} scoring drives out of {teamData.stats.totalDrives} total drives
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="drive-averages">
          <h5>Average Drive Statistics</h5>
          
          <div className="averages-container">
            {[
              { 
                header: "Avg. Yards per Drive", 
                home: homeStats.avgYards, 
                away: awayStats.avgYards 
              },
              { 
                header: "Avg. Plays per Drive", 
                home: homeStats.avgPlays, 
                away: awayStats.avgPlays 
              },
              { 
                header: "Yards per Play", 
                home: (homeStats.avgYards / homeStats.avgPlays).toFixed(1) || '0.0', 
                away: (awayStats.avgYards / awayStats.avgPlays).toFixed(1) || '0.0'
              }
            ].map((stat, index) => (
              <div key={index} className="average-stat">
                <div className="stat-header">{stat.header}</div>
                <div className="team-values">
                  <div className="team-value" style={{ color: homeTeamColor }}>
                    <span className="team-abbr">{homeTeam}:</span>
                    <span className="value">{stat.home}</span>
                  </div>
                  <div className="team-value" style={{ color: awayTeamColor }}>
                    <span className="team-abbr">{awayTeam}:</span>
                    <span className="value">{stat.away}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DriveAnalysisTab;