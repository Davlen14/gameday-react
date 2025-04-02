import React from 'react';

const DriveAnalysisView = ({
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
  const drivesByQuarter = {};
  drives.forEach(drive => {
    if (!drivesByQuarter[drive.quarter]) {
      drivesByQuarter[drive.quarter] = [];
    }
    drivesByQuarter[drive.quarter].push(drive);
  });

  // Calculate drive summary stats
  const calculateSummary = () => {
    const homeDrives = drives.filter(d => d.team === homeTeam);
    const awayDrives = drives.filter(d => d.team === awayTeam);

    const homeSuccessfulDrives = homeDrives.filter(d =>
      d.result === 'Touchdown' || d.result === 'Field Goal'
    ).length;

    const awaySuccessfulDrives = awayDrives.filter(d =>
      d.result === 'Touchdown' || d.result === 'Field Goal'
    ).length;

    const homeSuccessRate = homeDrives.length > 0 
      ? (homeSuccessfulDrives / homeDrives.length * 100).toFixed(1)
      : 0;

    const awaySuccessRate = awayDrives.length > 0 
      ? (awaySuccessfulDrives / awayDrives.length * 100).toFixed(1)
      : 0;

    // Calculate averages
    const homeAvgYards = homeDrives.length > 0
      ? (homeDrives.reduce((sum, d) => sum + d.yards, 0) / homeDrives.length).toFixed(1)
      : 0;
    const awayAvgYards = awayDrives.length > 0
      ? (awayDrives.reduce((sum, d) => sum + d.yards, 0) / awayDrives.length).toFixed(1)
      : 0;

    const homeAvgPlays = homeDrives.length > 0
      ? (homeDrives.reduce((sum, d) => sum + d.plays, 0) / homeDrives.length).toFixed(1)
      : 0;
    const awayAvgPlays = awayDrives.length > 0
      ? (awayDrives.reduce((sum, d) => sum + d.plays, 0) / awayDrives.length).toFixed(1)
      : 0;

    return { homeSuccessRate, awaySuccessRate, homeSuccessfulDrives, awaySuccessfulDrives, homeDrives, awayDrives, homeAvgYards, awayAvgYards, homeAvgPlays, awayAvgPlays };
  };

  const summary = calculateSummary();

  return (
    <div className="drive-analysis-container">
      <h3 className="section-title">Drive Analysis</h3>

      {Object.keys(drivesByQuarter).map(quarter => (
        <div key={quarter} className="quarter-drives">
          <h4 className="quarter-header">Quarter {quarter}</h4>
          <div className="drives-list">
            {drivesByQuarter[quarter].map((drive, index) => (
              <div
                key={index}
                className="drive-item"
                style={{
                  borderLeftColor: drive.team === homeTeam ? homeTeamColor : awayTeamColor,
                  backgroundColor: drive.team === homeTeam ? `${homeTeamColor}10` : `${awayTeamColor}10`
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
          <div className="team-rate" style={{ borderColor: homeTeamColor }}>
            <div className="team-header-small">
              <img src={homeLogo} alt={homeTeam} className="team-logo-tiny" />
              <span>{homeTeam}</span>
            </div>
            <div className="rate-values">
              <div className="rate-value">{summary.homeSuccessRate}%</div>
              <div className="rate-label">Drive Success Rate</div>
              <div className="rate-detail">
                {summary.homeSuccessfulDrives} scoring drives out of {summary.homeDrives.length} total drives
              </div>
            </div>
          </div>

          <div className="team-rate" style={{ borderColor: awayTeamColor }}>
            <div className="team-header-small">
              <img src={awayLogo} alt={awayTeam} className="team-logo-tiny" />
              <span>{awayTeam}</span>
            </div>
            <div className="rate-values">
              <div className="rate-value">{summary.awaySuccessRate}%</div>
              <div className="rate-label">Drive Success Rate</div>
              <div className="rate-detail">
                {summary.awaySuccessfulDrives} scoring drives out of {summary.awayDrives.length} total drives
              </div>
            </div>
          </div>
        </div>

        <div className="drive-averages">
          <h5>Average Drive Statistics</h5>
          <div className="averages-container">
            <div className="average-stat">
              <div className="stat-header">Avg. Yards per Drive</div>
              <div className="team-values">
                <div className="team-value" style={{ color: homeTeamColor }}>
                  <span className="team-abbr">{homeTeam}:</span>
                  <span className="value">{summary.homeAvgYards}</span>
                </div>
                <div className="team-value" style={{ color: awayTeamColor }}>
                  <span className="team-abbr">{awayTeam}:</span>
                  <span className="value">{summary.awayAvgYards}</span>
                </div>
              </div>
            </div>

            <div className="average-stat">
              <div className="stat-header">Avg. Plays per Drive</div>
              <div className="team-values">
                <div className="team-value" style={{ color: homeTeamColor }}>
                  <span className="team-abbr">{homeTeam}:</span>
                  <span className="value">{summary.homeAvgPlays}</span>
                </div>
                <div className="team-value" style={{ color: awayTeamColor }}>
                  <span className="team-abbr">{awayTeam}:</span>
                  <span className="value">{summary.awayAvgPlays}</span>
                </div>
              </div>
            </div>

            <div className="average-stat">
              <div className="stat-header">Yards per Play</div>
              <div className="team-values">
                <div className="team-value" style={{ color: homeTeamColor }}>
                  <span className="team-abbr">{homeTeam}:</span>
                  <span className="value">
                    {(summary.homeAvgPlays > 0 ? (summary.homeAvgYards / summary.homeAvgPlays).toFixed(1) : 0)}
                  </span>
                </div>
                <div className="team-value" style={{ color: awayTeamColor }}>
                  <span className="team-abbr">{awayTeam}:</span>
                  <span className="value">
                    {(summary.awayAvgPlays > 0 ? (summary.awayAvgYards / summary.awayAvgPlays).toFixed(1) : 0)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DriveAnalysisView;