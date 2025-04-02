import React from 'react';

const EfficiencyMetricsTab = ({ 
  advancedData, 
  homeTeam, 
  awayTeam, 
  homeTeamColor, 
  awayTeamColor, 
  homeLogo, 
  awayLogo 
}) => {
  const { homeTeamStats, awayTeamStats } = advancedData;

  const renderTeamEfficiencyColumn = (team, teamStats, teamColor, teamLogo) => (
    <div className="efficiency-column" style={{ borderColor: teamColor }}>
      <div className="team-header-small">
        <img src={teamLogo} alt={team} className="team-logo-tiny" />
        <span className="team-name">{team}</span>
      </div>
      
      {[
        { 
          name: "Offensive Efficiency", 
          value: teamStats.efficiency.offensive, 
          explainer: "Percentage of plays that were successful based on down and distance" 
        },
        { 
          name: "Defensive Efficiency", 
          value: teamStats.efficiency.defensive, 
          explainer: "Percentage of opponent plays that were stopped successfully" 
        },
        { 
          name: "Passing Success Rate", 
          value: teamStats.efficiency.passingSuccess, 
          explainer: "Percentage of passing plays that were successful" 
        },
        { 
          name: "Rushing Success Rate", 
          value: teamStats.efficiency.rushingSuccess, 
          explainer: "Percentage of rushing plays that were successful" 
        }
      ].map((metric, index) => (
        <div key={index} className="efficiency-metric">
          <div className="efficiency-header">
            <span className="metric-name">{metric.name}</span>
            <span className="metric-value">{(metric.value * 100).toFixed(1)}%</span>
          </div>
          <div className="progress-bar-container">
            <div 
              className="progress-bar" 
              style={{ 
                width: `${metric.value * 100}%`,
                backgroundColor: teamColor
              }}
            ></div>
          </div>
          <div className="metric-explainer">{metric.explainer}</div>
        </div>
      ))}
      
      <div className="ppa-container">
        <h4>Predicted Points Added (PPA)</h4>
        
        {[
          { label: "Total PPA", value: teamStats.ppa.total },
          { label: "Passing PPA", value: teamStats.ppa.passing },
          { label: "Rushing PPA", value: teamStats.ppa.rushing },
          { 
            label: "Defensive PPA", 
            value: teamStats.ppa.defense, 
            note: "(Negative is better for defense)" 
          }
        ].map((ppaMetric, index) => (
          <div key={index} className="ppa-metric">
            <span className="ppa-label">{ppaMetric.label}</span>
            <span 
              className="ppa-value" 
              style={{ 
                color: (ppaMetric.label === "Defensive PPA" 
                  ? (ppaMetric.value <= 0 ? '#27ae60' : '#e74c3c')
                  : (ppaMetric.value >= 0 ? '#27ae60' : '#e74c3c')) 
              }}
            >
              {ppaMetric.value.toFixed(2)}
            </span>
            {ppaMetric.note && <span className="metric-note">{ppaMetric.note}</span>}
          </div>
        ))}
      </div>
    </div>
  );

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
        {renderTeamEfficiencyColumn(homeTeam, homeTeamStats, homeTeamColor, homeLogo)}
        {renderTeamEfficiencyColumn(awayTeam, awayTeamStats, awayTeamColor, awayLogo)}
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

export default EfficiencyMetricsTab;