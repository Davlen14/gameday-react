import React from 'react';

const EfficiencyMetricsView = ({
  advancedData,
  homeTeam,
  awayTeam,
  homeTeamColor,
  awayTeamColor,
  homeLogo,
  awayLogo
}) => {
  const { homeTeamStats, awayTeamStats } = advancedData;

  return (
    <div className="efficiency-metrics-container">
      <div className="efficiency-explainer">
        <h4>Advanced Efficiency Metrics</h4>
        <p>
          These metrics measure how well each team performs relative to expected outcomes. 
          Offensive and defensive efficiency indicate the percentage of successful plays. 
          PPA (Predicted Points Added) shows how much each unit contributes to scoring.
        </p>
      </div>

      <div className="efficiency-grid">
        <div className="efficiency-column home" style={{ borderColor: homeTeamColor }}>
          <div className="team-header-small">
            <img src={homeLogo} alt={homeTeam} className="team-logo-tiny" />
            <span className="team-name">{homeTeam}</span>
          </div>

          <div className="efficiency-metric">
            <div className="efficiency-header">
              <span className="metric-name">Offensive Efficiency</span>
              <span className="metric-value">
                {(homeTeamStats.efficiency.offensive * 100).toFixed(1)}%
              </span>
            </div>
            <div className="progress-bar-container">
              <div 
                className="progress-bar"
                style={{
                  width: `${homeTeamStats.efficiency.offensive * 100}%`,
                  backgroundColor: homeTeamColor
                }}
              ></div>
            </div>
            <div className="metric-explainer">
              Percentage of plays that were successful based on down and distance
            </div>
          </div>

          <div className="efficiency-metric">
            <div className="efficiency-header">
              <span className="metric-name">Defensive Efficiency</span>
              <span className="metric-value">
                {(homeTeamStats.efficiency.defensive * 100).toFixed(1)}%
              </span>
            </div>
            <div className="progress-bar-container">
              <div 
                className="progress-bar"
                style={{
                  width: `${homeTeamStats.efficiency.defensive * 100}%`,
                  backgroundColor: homeTeamColor
                }}
              ></div>
            </div>
            <div className="metric-explainer">
              Percentage of opponent plays that were stopped successfully
            </div>
          </div>

          <div className="efficiency-metric">
            <div className="efficiency-header">
              <span className="metric-name">Passing Success Rate</span>
              <span className="metric-value">
                {(homeTeamStats.efficiency.passingSuccess * 100).toFixed(1)}%
              </span>
            </div>
            <div className="progress-bar-container">
              <div 
                className="progress-bar"
                style={{
                  width: `${homeTeamStats.efficiency.passingSuccess * 100}%`,
                  backgroundColor: homeTeamColor
                }}
              ></div>
            </div>
            <div className="metric-explainer">
              Percentage of passing plays that were successful
            </div>
          </div>

          <div className="efficiency-metric">
            <div className="efficiency-header">
              <span className="metric-name">Rushing Success Rate</span>
              <span className="metric-value">
                {(homeTeamStats.efficiency.rushingSuccess * 100).toFixed(1)}%
              </span>
            </div>
            <div className="progress-bar-container">
              <div 
                className="progress-bar"
                style={{
                  width: `${homeTeamStats.efficiency.rushingSuccess * 100}%`,
                  backgroundColor: homeTeamColor
                }}
              ></div>
            </div>
            <div className="metric-explainer">
              Percentage of rushing plays that were successful
            </div>
          </div>

          <div className="ppa-container">
            <h4>Predicted Points Added (PPA)</h4>

            <div className="ppa-metric">
              <span className="ppa-label">Total PPA</span>
              <span 
                className="ppa-value" 
                style={{ color: homeTeamStats.ppa.total >= 0 ? '#27ae60' : '#e74c3c' }}
              >
                {homeTeamStats.ppa.total.toFixed(2)}
              </span>
            </div>

            <div className="ppa-metric">
              <span className="ppa-label">Passing PPA</span>
              <span 
                className="ppa-value" 
                style={{ color: homeTeamStats.ppa.passing >= 0 ? '#27ae60' : '#e74c3c' }}
              >
                {homeTeamStats.ppa.passing.toFixed(2)}
              </span>
            </div>

            <div className="ppa-metric">
              <span className="ppa-label">Rushing PPA</span>
              <span 
                className="ppa-value" 
                style={{ color: homeTeamStats.ppa.rushing >= 0 ? '#27ae60' : '#e74c3c' }}
              >
                {homeTeamStats.ppa.rushing.toFixed(2)}
              </span>
            </div>

            <div className="ppa-metric">
              <span className="ppa-label">Defensive PPA</span>
              <span 
                className="ppa-value" 
                style={{ color: homeTeamStats.ppa.defense <= 0 ? '#27ae60' : '#e74c3c' }}
              >
                {homeTeamStats.ppa.defense.toFixed(2)}
              </span>
              <span className="metric-note">(Negative is better for defense)</span>
            </div>
          </div>
        </div>

        <div className="efficiency-column away" style={{ borderColor: awayTeamColor }}>
          <div className="team-header-small">
            <img src={awayLogo} alt={awayTeam} className="team-logo-tiny" />
            <span className="team-name">{awayTeam}</span>
          </div>

          <div className="efficiency-metric">
            <div className="efficiency-header">
              <span className="metric-name">Offensive Efficiency</span>
              <span className="metric-value">
                {(awayTeamStats.efficiency.offensive * 100).toFixed(1)}%
              </span>
            </div>
            <div className="progress-bar-container">
              <div 
                className="progress-bar"
                style={{
                  width: `${awayTeamStats.efficiency.offensive * 100}%`,
                  backgroundColor: awayTeamColor
                }}
              ></div>
            </div>
            <div className="metric-explainer">
              Percentage of plays that were successful based on down and distance
            </div>
          </div>

          <div className="efficiency-metric">
            <div className="efficiency-header">
              <span className="metric-name">Defensive Efficiency</span>
              <span className="metric-value">
                {(awayTeamStats.efficiency.defensive * 100).toFixed(1)}%
              </span>
            </div>
            <div className="progress-bar-container">
              <div 
                className="progress-bar"
                style={{
                  width: `${awayTeamStats.efficiency.defensive * 100}%`,
                  backgroundColor: awayTeamColor
                }}
              ></div>
            </div>
            <div className="metric-explainer">
              Percentage of opponent plays that were stopped successfully
            </div>
          </div>

          <div className="efficiency-metric">
            <div className="efficiency-header">
              <span className="metric-name">Passing Success Rate</span>
              <span className="metric-value">
                {(awayTeamStats.efficiency.passingSuccess * 100).toFixed(1)}%
              </span>
            </div>
            <div className="progress-bar-container">
              <div 
                className="progress-bar"
                style={{
                  width: `${awayTeamStats.efficiency.passingSuccess * 100}%`,
                  backgroundColor: awayTeamColor
                }}
              ></div>
            </div>
            <div className="metric-explainer">
              Percentage of passing plays that were successful
            </div>
          </div>

          <div className="efficiency-metric">
            <div className="efficiency-header">
              <span className="metric-name">Rushing Success Rate</span>
              <span className="metric-value">
                {(awayTeamStats.efficiency.rushingSuccess * 100).toFixed(1)}%
              </span>
            </div>
            <div className="progress-bar-container">
              <div 
                className="progress-bar"
                style={{
                  width: `${awayTeamStats.efficiency.rushingSuccess * 100}%`,
                  backgroundColor: awayTeamColor
                }}
              ></div>
            </div>
            <div className="metric-explainer">
              Percentage of rushing plays that were successful
            </div>
          </div>

          <div className="ppa-container">
            <h4>Predicted Points Added (PPA)</h4>

            <div className="ppa-metric">
              <span className="ppa-label">Total PPA</span>
              <span 
                className="ppa-value" 
                style={{ color: awayTeamStats.ppa.total >= 0 ? '#27ae60' : '#e74c3c' }}
              >
                {awayTeamStats.ppa.total.toFixed(2)}
              </span>
            </div>

            <div className="ppa-metric">
              <span className="ppa-label">Passing PPA</span>
              <span 
                className="ppa-value" 
                style={{ color: awayTeamStats.ppa.passing >= 0 ? '#27ae60' : '#e74c3c' }}
              >
                {awayTeamStats.ppa.passing.toFixed(2)}
              </span>
            </div>

            <div className="ppa-metric">
              <span className="ppa-label">Rushing PPA</span>
              <span 
                className="ppa-value" 
                style={{ color: awayTeamStats.ppa.rushing >= 0 ? '#27ae60' : '#e74c3c' }}
              >
                {awayTeamStats.ppa.rushing.toFixed(2)}
              </span>
            </div>

            <div className="ppa-metric">
              <span className="ppa-label">Defensive PPA</span>
              <span 
                className="ppa-value" 
                style={{ color: awayTeamStats.ppa.defense <= 0 ? '#27ae60' : '#e74c3c' }}
              >
                {awayTeamStats.ppa.defense.toFixed(2)}
              </span>
              <span className="metric-note">(Negative is better for defense)</span>
            </div>
          </div>
        </div>
      </div>

      <div className="ppa-explainer">
        <h4>Understanding PPA (Predicted Points Added)</h4>
        <p>
          PPA measures the point value a player/team adds or subtracts on a given play compared to the
          expected outcome based on down, distance, and field position. Positive values indicate contributions
          toward scoring, while negative values indicate the opposite. For defensive metrics, negative values
          are better as they represent preventing the opponent from scoring.
        </p>
      </div>
    </div>
  );
};

export default EfficiencyMetricsView;