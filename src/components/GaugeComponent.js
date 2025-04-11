import React, { useEffect, useState } from "react";
import graphqlTeamsService from "../services/graphqlTeamsService";

// National Averages based on provided data
const NATIONAL_AVERAGES = {
  overall: 0.55,  // Overall national average
  offense: 27.14, // Offense national average
  defense: 26.61  // Defense national average
};

/**
 * GaugeComponent - A sleek, interactive radar chart for displaying team metrics vs. national averages
 * 
 * @param {Object} props
 * @param {string} props.teamName - The name of the team
 * @param {number} props.year - The year for fetching ratings
 * @param {string} props.teamColor - The primary color of the team
 * @returns {JSX.Element} A modern radar chart component
 */
const GaugeComponent = ({ teamName, year, teamColor = "#1a73e8" }) => {
  const [ratings, setRatings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hoveredMetric, setHoveredMetric] = useState(null);

  useEffect(() => {
    const fetchRatings = async () => {
      if (!teamName || !year) {
        setLoading(false);
        return;
      }

      try {
        // Fetch SP+ Ratings via GraphQL
        const ratingData = await graphqlTeamsService.getTeamDetailedRatings(teamName, year);
        console.log("Fetched SP+ Ratings:", ratingData);

        if (!ratingData) {
          console.warn(`No SP+ ratings found for ${teamName} in ${year}`);
          setRatings(null);
          return;
        }

        setRatings({
          overall: ratingData.spOverall ?? null,
          offense: ratingData.spOffense ?? null,
          defense: ratingData.spDefense ?? null
        });
        setError(null);
      } catch (err) {
        console.error("Error fetching SP+ ratings:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchRatings();
  }, [teamName, year]);

  // Display loading, error state, or no data message
  if (loading) return (
    <div className="g-radar-chart-loading">
      <div className="g-loading-spinner"></div>
      <div>Loading team metrics...</div>
    </div>
  );
  
  if (error) return (
    <div className="g-radar-chart-error">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
        <line x1="12" y1="8" x2="12" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <circle cx="12" cy="16" r="1" fill="currentColor"/>
      </svg>
      <div>Error loading metrics: {error}</div>
    </div>
  );
  
  if (!ratings || Object.values(ratings).every(v => v === null)) {
    return (
      <div className="g-radar-chart-no-data">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M9 4h6v6h4l-7 7-7-7h4V4z" fill="currentColor"/>
        </svg>
        <div>No metrics available for {teamName} in {year}.</div>
      </div>
    );
  }

  // Chart dimensions
  const size = 320;
  const center = size / 2;
  const maxRadius = size * 0.42; // Slightly reduce triangle size
  const labelOffset = size * 0.52; // Increase label distance
  
  // Normalize data for radar chart - ensure proper ordering
  const metrics = [
    { id: "overall", label: "Overall", min: 0, max: 32, order: 1 },
    { id: "offense", label: "Offense", min: 20, max: 45, order: 2 },
    { id: "defense", label: "Defense", min: 5, max: 30, inverted: true, order: 3 } // Defense is inverted because lower is better
  ];
  
  // Ensure all three metrics are always shown in correct order
  const allMetrics = metrics.map(metric => {
    // Use actual value if available, otherwise use national average
    const value = ratings[metric.id] !== null ? ratings[metric.id] : NATIONAL_AVERAGES[metric.id];
    return {
      ...metric,
      value
    };
  });
  
  // Calculate normalized values between 0-1 for plotting
  const getNormalizedValue = (value, min, max, inverted = false) => {
    if (value === null) return 0;
    const normalized = (value - min) / (max - min);
    return inverted ? 1 - normalized : normalized;
  };
  
  // Generate points for the team's values and national averages
  // Use the metrics sorted by order to ensure consistent positioning
  const sortedMetrics = [...metrics].sort((a, b) => a.order - b.order);
  
  const teamPoints = sortedMetrics.map((metric, i) => {
    const angle = (Math.PI * 2 * i) / sortedMetrics.length;
    // Get the value from ratings or fall back to national average to ensure the point is always displayed
    const value = ratings[metric.id] !== null ? ratings[metric.id] : NATIONAL_AVERAGES[metric.id];
    
    const normalizedValue = getNormalizedValue(value, metric.min, metric.max, metric.inverted);
    const clampedValue = Math.max(0, Math.min(1, normalizedValue));
    
    return {
      x: center + maxRadius * clampedValue * Math.sin(angle),
      y: center - maxRadius * clampedValue * Math.cos(angle),
      value,
      metric,
      angle,
      normalizedValue: clampedValue
    };
  });
  
  const nationalPoints = sortedMetrics.map((metric, i) => {
    const angle = (Math.PI * 2 * i) / sortedMetrics.length;
    const value = NATIONAL_AVERAGES[metric.id];
    const normalizedValue = getNormalizedValue(value, metric.min, metric.max, metric.inverted);
    const clampedValue = Math.max(0, Math.min(1, normalizedValue));
    
    return {
      x: center + maxRadius * clampedValue * Math.sin(angle),
      y: center - maxRadius * clampedValue * Math.cos(angle),
      value,
      metric,
      angle,
      normalizedValue: clampedValue
    };
  });
  
  // Generate axis lines and labels
  const axisLines = sortedMetrics.map((metric, i) => {
    const angle = (Math.PI * 2 * i) / sortedMetrics.length;
    const x2 = center + maxRadius * Math.sin(angle);
    const y2 = center - maxRadius * Math.cos(angle);
    
    // Calculate label position with increased offset for better visibility
    const labelX = center + labelOffset * Math.sin(angle);
    const labelY = center - labelOffset * Math.cos(angle);
    
    // Adjust label alignment based on position
    let textAnchor = "middle";
    let dy = "0.35em";
    
    if (angle < 0.1 || Math.abs(angle - Math.PI) < 0.1) {
      textAnchor = "middle";
    } else if (angle < Math.PI) {
      textAnchor = "start";
    } else {
      textAnchor = "end";
    }
    
    return { 
      line: { x1: center, y1: center, x2, y2 },
      label: { x: labelX, y: labelY, textAnchor, dy, text: metric.label }
    };
  });

  // Create spider web rings (scales)
  const rings = [0.25, 0.5, 0.75, 1].map(scale => {
    const points = sortedMetrics.map((_, i) => {
      const angle = (Math.PI * 2 * i) / sortedMetrics.length;
      return {
        x: center + maxRadius * scale * Math.sin(angle),
        y: center - maxRadius * scale * Math.cos(angle)
      };
    });
    
    return {
      path: points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ') + 'Z',
      scale
    };
  });

  // Create path strings for the radar areas
  const createAreaPath = (points) => {
    if (!points.length) return '';
    return points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ') + 'Z';
  };

  const teamColor10 = `${teamColor}1A`; // 10% opacity
  const teamColor40 = `${teamColor}66`; // 40% opacity
  const teamColor80 = `${teamColor}CC`; // 80% opacity

  // Determine metric performance level
  const getPerformanceLevel = (metricId, value) => {
    if (metricId === 'defense') {
      // For defense, lower values are better (fewer points allowed)
      return value <= 15 ? "Above Average" : value >= NATIONAL_AVERAGES.defense ? "Below Average" : "Average";
    } else if (metricId === 'offense') {
      // For offense, higher values are better (more points scored)
      return value >= 35 ? "Above Average" : value <= NATIONAL_AVERAGES.offense ? "Below Average" : "Average";
    } else {
      // For overall, higher values are better
      return value >= 25 ? "Above Average" : value <= 20 ? "Below Average" : "Average";
    }
  };

  // Determine metric performance color
  const getPerformanceColor = (metricId, value) => {
    const level = getPerformanceLevel(metricId, value);
    return level === "Above Average" ? "#04aa6d" : level === "Below Average" ? "#ff4d4d" : "#ffc700";
  };

  return (
    <div className="g-modern-radar-chart">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="g-radar-svg">
        {/* Gradient definitions */}
        <defs>
          <linearGradient id="team-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={teamColor40} />
            <stop offset="100%" stopColor={teamColor80} />
          </linearGradient>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          <filter id="drop-shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="1" stdDeviation="2" floodColor="rgba(0,0,0,0.3)" />
          </filter>
        </defs>
      
        {/* Background rings */}
        <g className="g-radar-rings">
          {rings.map((ring, i) => (
            <path
              key={`ring-${i}`}
              d={ring.path}
              stroke="#e0e0e0"
              strokeWidth="1"
              fill="none"
              strokeDasharray={i === rings.length - 1 ? "none" : "2,2"}
            />
          ))}
        </g>
        
        {/* Axis lines */}
        <g className="g-radar-axes">
          {axisLines.map((axis, i) => (
            <line
              key={`axis-${i}`}
              x1={axis.line.x1}
              y1={axis.line.y1}
              x2={axis.line.x2}
              y2={axis.line.y2}
              stroke="#e0e0e0"
              strokeWidth="1.5"
            />
          ))}
        </g>
        
        {/* National average area */}
        <g className="g-national-avg-area">
          <path
            d={createAreaPath(nationalPoints)}
            fill="rgba(150, 150, 150, 0.15)"
            stroke="#aaaaaa"
            strokeWidth="1.5"
            strokeDasharray="3,3"
          />
        </g>
        
        {/* Team area */}
        <g className="g-team-area" filter="url(#drop-shadow)">
          <path
            d={createAreaPath(teamPoints)}
            fill="url(#team-gradient)"
            stroke={teamColor}
            strokeWidth="2"
          />
        </g>
        
        {/* Data points with hover effect */}
        <g className="g-data-points">
          {teamPoints.map((point, i) => (
            <g key={`point-${i}`} className="g-point-group">
              <circle
                cx={point.x}
                cy={point.y}
                r="6"
                fill="#fff"
                stroke={getPerformanceColor(point.metric.id, point.value)}
                strokeWidth="2"
                filter={hoveredMetric === point.metric.id ? "url(#glow)" : "none"}
                onMouseEnter={() => setHoveredMetric(point.metric.id)}
                onMouseLeave={() => setHoveredMetric(null)}
                style={{ cursor: 'pointer' }}
              />
              <circle
                cx={point.x}
                cy={point.y}
                r="3"
                fill={getPerformanceColor(point.metric.id, point.value)}
              />
            </g>
          ))}
        </g>
        
        {/* Axis labels */}
        <g className="g-radar-labels">
          {axisLines.map((axis, i) => (
            <text
              key={`label-${i}`}
              x={axis.label.x}
              y={axis.label.y}
              textAnchor={axis.label.textAnchor}
              dy={axis.label.dy}
              fontSize="14"
              fontWeight="600"
              fill="#555555"
              style={{
                filter: 'drop-shadow(0px 0px 2px white)',
                paintOrder: 'stroke fill',
                stroke: 'white',
                strokeWidth: '2px',
                strokeLinecap: 'round',
                strokeLinejoin: 'round'
              }}
            >
              {axis.label.text}
            </text>
          ))}
        </g>
      </svg>
      
      {/* Metrics legend */}
      <div className="g-metrics-legend">
        {allMetrics.map(metric => {
          const value = metric.value;
          const nationalAvg = NATIONAL_AVERAGES[metric.id];
          const performanceLevel = getPerformanceLevel(metric.id, value);
          const performanceColor = getPerformanceColor(metric.id, value);
          
          return (
            <div 
              key={metric.id} 
              className={`g-metric-card ${hoveredMetric === metric.id ? 'g-active' : ''}`}
              onMouseEnter={() => setHoveredMetric(metric.id)}
              onMouseLeave={() => setHoveredMetric(null)}
              style={{ borderColor: hoveredMetric === metric.id ? performanceColor : 'transparent' }}
            >
              <div className="g-metric-header">
                <span className="g-metric-name">{metric.label}</span>
                <span 
                  className="g-performance-indicator" 
                  style={{ 
                    backgroundColor: performanceColor,
                    boxShadow: `0 3px 6px ${performanceColor}40`
                  }}
                >
                  {performanceLevel === "Below Average" ? "Below Avg" : 
                   performanceLevel === "Above Average" ? "Above Avg" : 
                   "Average"}
                </span>
              </div>
              <div className="g-metric-values">
                <div className="g-team-value">
                  <span className="g-value-label">Team</span>
                  <span className="g-value-number" style={{ color: performanceColor }}>{value.toFixed(2)}</span>
                </div>
                <div className="g-vs-divider">vs</div>
                <div className="g-natl-value">
                  <span className="g-value-label">National Avg</span>
                  <span className="g-value-number">{nationalAvg.toFixed(2)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      <style jsx>{`
        /* Custom radar chart styles with g- prefix to avoid style collisions */
        .g-modern-radar-chart {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          display: flex;
          flex-direction: column;
          align-items: center;
          background: white;
          border-radius: 12px;
          padding: 1.5rem;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
        }
        
        .g-radar-svg {
          margin-bottom: 1.5rem;
        }
        
        .g-metrics-legend {
          display: flex;
          flex-wrap: nowrap;
          justify-content: center;
          gap: 1rem;
          margin-bottom: 1.5rem;
          width: 100%;
        }
        
        .g-metric-card {
          background: white;
          border-radius: 8px;
          padding: 0.75rem 1rem;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
          flex: 1;
          min-width: 150px;
          max-width: 200px;
          transition: all 0.2s ease;
          border: 2px solid transparent;
          height: 140px;
          display: flex;
          flex-direction: column;
        }
        
        .g-metric-card:hover, .g-metric-card.g-active {
          transform: translateY(-3px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
        }
        
        .g-metric-header {
          display: flex;
          justify-content: flex-start;
          align-items: flex-start;
          margin-bottom: 1rem;
          height: 35px;
          position: relative;
          padding-top: 25px;
        }
        
        .g-metric-name {
          font-weight: 600;
          font-size: 15px;
        }
        
        .g-performance-indicator {
          font-size: 11px;
          font-weight: 700;
          padding: 4px 8px;
          border-radius: 4px;
          color: white;
          height: 20px;
          width: auto;
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
          white-space: nowrap;
          letter-spacing: 0.5px;
          box-shadow: 0 2px 6px rgba(0,0,0,0.2);
          position: absolute;
          top: 0;
          left: 0;
        }
        
        .g-metric-values {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        
        .g-team-value, .g-natl-value {
          display: flex;
          flex-direction: column;
          flex: 1;
        }
        
        .g-vs-divider {
          font-size: 13px;
          color: #999;
          margin: 0 0.5rem;
        }
        
        .g-value-label {
          font-size: 12px;
          color: #666;
          margin-bottom: 0.25rem;
        }
        
        .g-value-number {
          font-size: 18px;
          font-weight: 700;
        }
        

        
        .g-loading-spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #f3f3f3;
          border-top: 4px solid ${teamColor};
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 1rem;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .g-radar-chart-loading,
        .g-radar-chart-error,
        .g-radar-chart-no-data {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 2rem;
          color: #666;
          text-align: center;
          height: 320px;
        }
      `}</style>
    </div>
  );
};

export default GaugeComponent;