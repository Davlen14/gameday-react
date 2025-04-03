import React, { useState } from 'react';

// Advanced Metrics Specific Styles
const styles = {
  statSection: {
    marginBottom: "30px",
  },
  sectionTitle: {
    fontSize: "1.2rem",
    fontWeight: "600",
    padding: "10px 0",
    borderBottom: "2px solid #eee",
    marginBottom: "15px",
  },
  tabs: {
    display: "flex",
    borderBottom: "1px solid #ddd",
    marginBottom: "20px",
  },
  tab: {
    padding: "10px 20px",
    cursor: "pointer",
    borderBottom: "3px solid transparent",
    fontWeight: "500",
  },
  activeTab: {
    borderBottom: "3px solid #3498db",
    color: "#3498db",
  },
  efficiencyContainer: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "20px",
  },
  efficiencyCard: {
    padding: "15px",
    borderRadius: "8px",
    boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
    backgroundColor: "#f9f9f9",
  },
  progressBarContainer: {
    width: "100%",
    height: "8px",
    backgroundColor: "#e0e0e0",
    borderRadius: "4px",
    overflow: "hidden",
    margin: "8px 0",
  },
  progressBar: {
    height: "100%",
    borderRadius: "4px",
  },
  noData: {
    padding: "15px",
    textAlign: "center",
    color: "#666",
    backgroundColor: "#f9f9f9",
    borderRadius: "4px",
    margin: "10px 0",
  },
  metricExplanation: {
    fontSize: "0.85rem",
    color: "#666",
    marginTop: "5px",
    fontStyle: "italic",
  },
  teamHeader: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginBottom: "10px",
  },
  teamLogo: {
    width: "30px",
    height: "30px",
    objectFit: "contain",
  },
  teamName: {
    fontWeight: "bold",
    fontSize: "1.1rem",
  },
};

// Tooltip component (can be moved to a shared utils file if used elsewhere)
const Tooltip = ({ text, children }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  
  return (
    <div 
      style={{
        position: 'relative',
        display: 'inline-block'
      }}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {children}
      <span style={{
        marginLeft: "5px",
        fontSize: "14px",
        color: "#888",
        cursor: "help"
      }}>ⓘ</span>
      <div style={{
        position: 'absolute',
        top: '100%',
        left: '50%',
        transform: 'translateX(-50%)',
        padding: "8px 12px",
        backgroundColor: "#333",
        color: "#fff",
        borderRadius: "4px",
        fontSize: "0.8rem",
        zIndex: "999",
        width: "200px",
        textAlign: "center",
        boxShadow: "0 2px 5px rgba(0,0,0,0.2)",
        opacity: showTooltip ? "1" : "0",
        visibility: showTooltip ? "visible" : "hidden",
        transition: "opacity 0.3s, visibility 0.3s"
      }}>
        {text}
      </div>
    </div>
  );
};

// Component to visualize a team's efficiency with progress bar
const EfficiencyMetric = ({ label, value, maxValue, explanation, color }) => {
  const percentage = value ? Math.min(100, (value / maxValue) * 100) : 0;
  
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          {explanation ? (
            <Tooltip text={explanation}>
              <span>{label}</span>
            </Tooltip>
          ) : (
            <span>{label}</span>
          )}
        </div>
        <span style={{ fontWeight: 'bold' }}>{value ? value.toFixed(2) : 'N/A'}</span>
      </div>
      <div style={styles.progressBarContainer}>
        <div 
          style={{...styles.progressBar, width: `${percentage}%`, backgroundColor: color}}
        />
      </div>
      <div style={styles.metricExplanation}>
        League Avg: {(maxValue/2).toFixed(2)} | Max: {maxValue.toFixed(2)}
      </div>
    </div>
  );
};

const GameAdvancedMetrics = ({ 
  homeTeamStats, 
  awayTeamStats, 
  homeTeam, 
  awayTeam, 
  homeLogo, 
  awayLogo, 
  homeTeamColor, 
  awayTeamColor,
  advancedData 
}) => {
  const [activeMetricTab, setActiveMetricTab] = useState('efficiency');

  if (!advancedData) {
    return (
      <div style={styles.statSection}>
        <h3 style={styles.sectionTitle}>Advanced Metrics</h3>
        <div style={styles.noData}>Advanced metrics not available for this game.</div>
      </div>
    );
  }
  
  return (
    <div style={styles.statSection}>
      <h3 style={styles.sectionTitle}>Advanced Metrics</h3>
      
      <div style={styles.tabs}>
        <div 
          style={activeMetricTab === 'efficiency' ? {...styles.tab, ...styles.activeTab} : styles.tab}
          onClick={() => setActiveMetricTab('efficiency')}
        >
          Efficiency
        </div>
        <div 
          style={activeMetricTab === 'epa' ? {...styles.tab, ...styles.activeTab} : styles.tab}
          onClick={() => setActiveMetricTab('epa')}
        >
          EPA (Expected Points Added)
        </div>
      </div>
      
      {activeMetricTab === 'efficiency' && (
        <div style={styles.efficiencyContainer}>
          <div style={{...styles.efficiencyCard, borderLeft: `4px solid ${homeTeamColor}`}}>
            <div style={{...styles.teamHeader, marginBottom: '15px'}}>
              <img src={homeLogo} alt={homeTeam} style={styles.teamLogo} />
              <span style={styles.teamName}>{homeTeam} Efficiency</span>
            </div>
            
            <EfficiencyMetric 
              label="Offensive Efficiency" 
              value={homeTeamStats.efficiency.offensive} 
              maxValue={1.0} 
              explanation="Percentage of plays that were successful based on down and distance"
              color={homeTeamColor}
            />
            
            <div style={{marginTop: '15px'}}>
              <EfficiencyMetric 
                label="Defensive Efficiency" 
                value={homeTeamStats.efficiency.defensive} 
                maxValue={1.0} 
                explanation="Percentage of opponent plays that were stopped successfully"
                color={homeTeamColor}
              />
            </div>
            
            <div style={{marginTop: '15px'}}>
              <EfficiencyMetric 
                label="Passing Success Rate" 
                value={homeTeamStats.efficiency.passingSuccess} 
                maxValue={1.0} 
                explanation="Percentage of pass plays that were successful based on down and distance"
                color={homeTeamColor}
              />
            </div>
            
            <div style={{marginTop: '15px'}}>
              <EfficiencyMetric 
                label="Rushing Success Rate" 
                value={homeTeamStats.efficiency.rushingSuccess} 
                maxValue={1.0} 
                explanation="Percentage of rush plays that were successful based on down and distance"
                color={homeTeamColor}
              />
            </div>
          </div>
          
          <div style={{...styles.efficiencyCard, borderLeft: `4px solid ${awayTeamColor}`}}>
            <div style={{...styles.teamHeader, marginBottom: '15px'}}>
              <img src={awayLogo} alt={awayTeam} style={styles.teamLogo} />
              <span style={styles.teamName}>{awayTeam} Efficiency</span>
            </div>
            
            <EfficiencyMetric 
              label="Offensive Efficiency" 
              value={awayTeamStats.efficiency.offensive} 
              maxValue={1.0} 
              explanation="Percentage of plays that were successful based on down and distance"
              color={awayTeamColor}
            />
            
            <div style={{marginTop: '15px'}}>
              <EfficiencyMetric 
                label="Defensive Efficiency" 
                value={awayTeamStats.efficiency.defensive} 
                maxValue={1.0} 
                explanation="Percentage of opponent plays that were stopped successfully"
                color={awayTeamColor}
              />
            </div>
            
            <div style={{marginTop: '15px'}}>
              <EfficiencyMetric 
                label="Passing Success Rate" 
                value={awayTeamStats.efficiency.passingSuccess} 
                maxValue={1.0} 
                explanation="Percentage of pass plays that were successful based on down and distance"
                color={awayTeamColor}
              />
            </div>
            
            <div style={{marginTop: '15px'}}>
              <EfficiencyMetric 
                label="Rushing Success Rate" 
                value={awayTeamStats.efficiency.rushingSuccess} 
                maxValue={1.0} 
                explanation="Percentage of rush plays that were successful based on down and distance"
                color={awayTeamColor}
              />
            </div>
          </div>
        </div>
      )}
      
      {activeMetricTab === 'epa' && (
        <div style={styles.efficiencyContainer}>
          <div style={{...styles.efficiencyCard, borderLeft: `4px solid ${homeTeamColor}`}}>
            <div style={{...styles.teamHeader, marginBottom: '15px'}}>
              <img src={homeLogo} alt={homeTeam} style={styles.teamLogo} />
              <span style={styles.teamName}>{homeTeam} EPA</span>
            </div>
            
            <EfficiencyMetric 
              label="Total EPA" 
              value={homeTeamStats.epa.total} 
              maxValue={15} 
              explanation="Expected Points Added across all plays"
              color={homeTeamColor}
            />
            
            <div style={{marginTop: '15px'}}>
              <EfficiencyMetric 
                label="Passing EPA" 
                value={homeTeamStats.epa.passing} 
                maxValue={10} 
                explanation="Expected Points Added on passing plays"
                color={homeTeamColor}
              />
            </div>
            
            <div style={{marginTop: '15px'}}>
              <EfficiencyMetric 
                label="Rushing EPA" 
                value={homeTeamStats.epa.rushing} 
                maxValue={8} 
                explanation="Expected Points Added on rushing plays"
                color={homeTeamColor}
              />
            </div>
            
            <div style={{marginTop: '15px'}}>
              <EfficiencyMetric 
                label="Defensive EPA" 
                value={homeTeamStats.epa.defense} 
                maxValue={5} 
                explanation="Expected Points Added by defensive plays (negative is better for defense)"
                color={homeTeamColor}
              />
            </div>
          </div>
          
          <div style={{...styles.efficiencyCard, borderLeft: `4px solid ${awayTeamColor}`}}>
            <div style={{...styles.teamHeader, marginBottom: '15px'}}>
              <img src={awayLogo} alt={awayTeam} style={styles.teamLogo} />
              <span style={styles.teamName}>{awayTeam} EPA</span>
            </div>
            
            <EfficiencyMetric 
              label="Total EPA" 
              value={awayTeamStats.epa.total} 
              maxValue={15} 
              explanation="Expected Points Added across all plays"
              color={awayTeamColor}
            />
            
            <div style={{marginTop: '15px'}}>
              <EfficiencyMetric 
                label="Passing EPA" 
                value={awayTeamStats.epa.passing} 
                maxValue={10} 
                explanation="Expected Points Added on passing plays"
                color={awayTeamColor}
              />
            </div>
            
            <div style={{marginTop: '15px'}}>
              <EfficiencyMetric 
                label="Rushing EPA" 
                value={awayTeamStats.epa.rushing} 
                maxValue={8} 
                explanation="Expected Points Added on rushing plays"
                color={awayTeamColor}
              />
            </div>
            
            <div style={{marginTop: '15px'}}>
              <EfficiencyMetric 
                label="Defensive EPA" 
                value={awayTeamStats.epa.defense} 
                maxValue={5} 
                explanation="Expected Points Added by defensive plays (negative is better for defense)"
                color={awayTeamColor}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GameAdvancedMetrics;