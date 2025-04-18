import React, { useEffect, useState } from "react";
import graphqlTeamsService from "../services/graphqlTeamsService";

// National Averages based on provided data
const NATIONAL_AVERAGES = {
  overall: 0.55,  // Overall national average
  offense: 27.14, // Offense national average
  defense: 26.61  // Defense national average
};

// Performance thresholds (adjusted for each metric)
const THRESHOLDS = {
  overall: {
    poor: 10, 
    average: 20, 
    good: 30
  },
  offense: {
    poor: 20, 
    average: 30, 
    good: 40
  },
  defense: {
    // Defense is inverted - lower is better
    good: 15, 
    average: 20, 
    poor: 30
  }
};

/**
 * Modern Gauge Component - Displays team metrics with sleek, visual gauges
 */
const GaugeComponent = ({ teamName, year, teamColor = "#1a73e8" }) => {
  const [ratings, setRatings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hoveredMetric, setHoveredMetric] = useState(null);
  const [animationComplete, setAnimationComplete] = useState(false);

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
        
        // Trigger animation after a short delay
        setTimeout(() => {
          setAnimationComplete(true);
        }, 300);
        
      } catch (err) {
        console.error("Error fetching SP+ ratings:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchRatings();
    // Reset animation state on team/year change
    setAnimationComplete(false);
  }, [teamName, year]);

  // Display loading, error state, or no data message
  if (loading) return (
    <div className="sp-loading-container">
      <div className="sp-loading-spinner"></div>
      <div>Loading team metrics...</div>
    </div>
  );

  if (error) return (
    <div className="sp-error-container">
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
      <div className="sp-no-data-container">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M9 4h6v6h4l-7 7-7-7h4V4z" fill="currentColor"/>
        </svg>
        <div>No metrics available for {teamName} in {year}.</div>
      </div>
    );
  }

  // Determine performance level and color for a metric
  const getPerformanceDetails = (metricId, value) => {
    const thresholds = THRESHOLDS[metricId];
    const isDefense = metricId === 'defense';
    
    let level, color;
    
    if (isDefense) {
      // For defense, lower is better
      if (value <= thresholds.good) {
        level = "Above Average";
        color = "#04aa6d"; // Green
      } else if (value <= thresholds.average) {
        level = "Average";
        color = "#ffc700"; // Yellow
      } else {
        level = "Below Average";
        color = "#ff4d4d"; // Red
      }
    } else {
      // For offense and overall, higher is better
      if (value >= thresholds.good) {
        level = "Above Average";
        color = "#04aa6d"; // Green
      } else if (value >= thresholds.average) {
        level = "Average";
        color = "#ffc700"; // Yellow
      } else {
        level = "Below Average";
        color = "#ff4d4d"; // Red
      }
    }
    
    return { level, color };
  };

  // Calculate gauge settings for each metric
  const gaugeMetrics = [
    {
      id: "overall",
      label: "Overall",
      value: ratings.overall,
      nationalAvg: NATIONAL_AVERAGES.overall,
      min: -30, // Allow for negative values
      max: 40,
      isInverted: false,
      color: "#3B82F6", // Blue
      ...getPerformanceDetails("overall", ratings.overall)
    },
    {
      id: "offense",
      label: "Offense",
      value: ratings.offense,
      nationalAvg: NATIONAL_AVERAGES.offense,
      min: 10,
      max: 50,
      isInverted: false,
      color: "#F59E0B", // Orange
      ...getPerformanceDetails("offense", ratings.offense)
    },
    {
      id: "defense",
      label: "Defense",
      value: ratings.defense,
      nationalAvg: NATIONAL_AVERAGES.defense,
      min: 5,
      max: 40,
      isInverted: true, // Defense is inverted (lower is better)
      color: "#10B981", // Green
      ...getPerformanceDetails("defense", ratings.defense)
    }
  ];

  // Create a modern circular gauge for each metric
  const CircularGauge = ({ metric }) => {
    const { id, label, value, min, max, isInverted, color, level } = metric;
    
    // Gauge dimensions
    const size = 200;
    const strokeWidth = 10;
    const radius = (size / 2) - (strokeWidth * 2);
    const circumference = 2.05 * Math.PI * radius; // 2.05 for slightly more than semi-circle
    
    // Calculate the percentage filled
    let normalizedValue = (value - min) / (max - min);
    normalizedValue = Math.max(0, Math.min(1, normalizedValue)); // Clamp between 0-1
    
    // For defense, invert the fill (lower values = higher fill)
    if (isInverted) normalizedValue = 1 - normalizedValue;
    
    // Animated stroke amount
    const strokeDashoffset = !animationComplete 
      ? circumference 
      : circumference * (1 - normalizedValue);
    
    // Calculate angle for needle (180° is the bottom, needle points up)
    const needleAngle = 180 - (normalizedValue * 180);
    
    // Functions to generate tick marks
    const generateTicks = () => {
      const ticks = [];
      const numTicks = 5; // Number of tick marks
      
      for (let i = 0; i <= numTicks; i++) {
        const tickValue = min + ((max - min) * (i / numTicks));
        const tickPercent = i / numTicks;
        const tickAngle = 180 - (tickPercent * 180);
        // Calculate position on the gauge arc
        const radian = (tickAngle * Math.PI) / 180;
        const outerRadius = radius + strokeWidth/2;
        const innerRadius = radius - strokeWidth/2;
        
        const x1 = size/2 + Math.cos(radian) * innerRadius;
        const y1 = size/2 + Math.sin(radian) * innerRadius;
        const x2 = size/2 + Math.cos(radian) * (outerRadius + 10);
        const y2 = size/2 + Math.sin(radian) * (outerRadius + 10);
        
        // Text positioning
        const textRadius = outerRadius + 20;
        const textX = size/2 + Math.cos(radian) * textRadius;
        const textY = size/2 + Math.sin(radian) * textRadius;
        
        // Create tick object
        ticks.push({
          line: {x1, y1, x2, y2},
          text: {
            x: textX,
            y: textY,
            value: Math.round(tickValue),
            // Adjust text anchor based on position
            anchor: i === 0 ? "start" : i === numTicks ? "end" : "middle"
          }
        });
      }
      
      return ticks;
    };
    
    // Generate color gradient stops based on performance levels
    const getGradientStops = () => {
      if (isInverted) {
        // Defense: green to yellow to red (left to right)
        return (
          <>
            <stop offset="0%" stopColor="#04aa6d" />
            <stop offset="50%" stopColor="#ffc700" />
            <stop offset="100%" stopColor="#ff4d4d" />
          </>
        );
      } else {
        // Offense/Overall: red to yellow to green (left to right)
        return (
          <>
            <stop offset="0%" stopColor="#ff4d4d" />
            <stop offset="50%" stopColor="#ffc700" />
            <stop offset="100%" stopColor="#04aa6d" />
          </>
        );
      }
    };
    
    // Generate tick marks
    const ticks = generateTicks();
    
    return (
      <div className={`sp-gauge-container ${hoveredMetric === id ? 'sp-hover' : ''}`} 
           onMouseEnter={() => setHoveredMetric(id)}
           onMouseLeave={() => setHoveredMetric(null)}>
        <div className="sp-gauge-header">
          <h3>{label}</h3>
          <div className="sp-performance-badge" style={{ backgroundColor: metric.color }}>
            {level}
          </div>
        </div>
        
        <svg width={size} height={size/1.75} viewBox={`0 0 ${size} ${size}`} className="sp-gauge-svg">
          <defs>
            <linearGradient id={`gauge-gradient-${id}`} x1="0%" y1="0%" x2="100%" y2="0%">
              {getGradientStops()}
            </linearGradient>
            <filter id="gauge-shadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="1" stdDeviation="2" floodColor="rgba(0,0,0,0.3)" />
            </filter>
          </defs>
          
          {/* Gauge background */}
          <path
            d={`M ${size/2 - radius} ${size/2} A ${radius} ${radius} 0 0 1 ${size/2 + radius} ${size/2}`}
            fill="none"
            stroke="#e0e0e0"
            strokeWidth={strokeWidth + 5}
            strokeLinecap="round"
          />
          
          {/* Gauge fill with gradient */}
          <path
            d={`M ${size/2 - radius} ${size/2} A ${radius} ${radius} 0 0 1 ${size/2 + radius} ${size/2}`}
            fill="none"
            stroke={`url(#gauge-gradient-${id})`}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 1s ease-in-out" }}
            filter="url(#gauge-shadow)"
          />
          
          {/* Tick marks and labels */}
          {ticks.map((tick, i) => (
            <g key={`tick-${i}`}>
              <line
                x1={tick.line.x1}
                y1={tick.line.y1}
                x2={tick.line.x2}
                y2={tick.line.y2}
                stroke="#888"
                strokeWidth="1.5"
              />
              <text
                x={tick.text.x}
                y={tick.text.y}
                textAnchor={tick.text.anchor}
                fill="#555"
                fontSize="11"
                fontWeight="500"
              >
                {tick.text.value}
              </text>
            </g>
          ))}
          
          {/* Gauge needle with glow effect */}
          <g transform={`rotate(${needleAngle}, ${size/2}, ${size/2})`} 
             style={{ transition: "transform 1s ease-in-out" }}
             filter="url(#gauge-shadow)">
            <line
              x1={size/2}
              y1={size/2}
              x2={size/2}
              y2={size/2 - radius - 15}
              stroke={color}
              strokeWidth="2"
              strokeLinecap="round"
            />
            <circle
              cx={size/2}
              cy={size/2}
              r="8"
              fill={color}
              stroke="#fff"
              strokeWidth="2"
            />
          </g>
          
          {/* Value display */}
          <text
            x={size/2}
            y={size/2 + radius/2}
            textAnchor="middle"
            fill="#333"
            fontSize="24"
            fontWeight="700"
          >
            {value.toFixed(1)}
          </text>
        </svg>
        
        <div className="sp-gauge-comparison">
          <div className="sp-comparison-item">
            <span className="sp-comparison-label">National Avg</span>
            <span className="sp-comparison-value">{metric.nationalAvg.toFixed(1)}</span>
          </div>
          <div className="sp-comparison-diff" style={{ color: metric.color }}>
            {isInverted 
              ? (metric.nationalAvg - value).toFixed(1) 
              : (value - metric.nationalAvg).toFixed(1)
            }
            {isInverted 
              ? (value < metric.nationalAvg ? " Better" : " Worse") 
              : (value > metric.nationalAvg ? " Better" : " Worse")
            }
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="sp-metrics-dashboard">
      <div className="sp-gauges-container">
        {gaugeMetrics.map(metric => (
          <CircularGauge key={metric.id} metric={metric} />
        ))}
      </div>
      
      <div className="sp-explanation">
        <div className="sp-explanation-title">How SP+ Ratings Work</div>
        <div className="sp-explanation-content">
          <p>
            <strong>Overall:</strong> Combines offense, defense, and special teams.
            <strong className="sp-good-text">Higher is better</strong>.
          </p>
          <p>
            <strong>Offense:</strong> Measures scoring efficiency and ball movement.
            <strong className="sp-good-text">Higher is better</strong>.
          </p>
          <p>
            <strong>Defense:</strong> Measures defensive efficiency.
            <strong className="sp-good-text">Lower is better</strong>.
          </p>
        </div>
        <div className="sp-color-legend">
          <div className="sp-legend-item">
            <span className="sp-legend-color" style={{backgroundColor: "#ff4d4d"}}></span>
            <span>Below Average</span>
          </div>
          <div className="sp-legend-item">
            <span className="sp-legend-color" style={{backgroundColor: "#ffc700"}}></span>
            <span>Average</span>
          </div>
          <div className="sp-legend-item">
            <span className="sp-legend-color" style={{backgroundColor: "#04aa6d"}}></span>
            <span>Above Average</span>
          </div>
        </div>
      </div>
      
      <style jsx>{`
        .sp-metrics-dashboard {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 2rem;
          padding: 1rem;
        }
        
        .sp-gauges-container {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 2rem;
        }
        
        .sp-gauge-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          background: white;
          border-radius: 16px;
          padding: 1.5rem;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
          transition: all 0.3s ease;
          width: 220px;
          position: relative;
          overflow: hidden;
        }
        
        .sp-gauge-container::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 5px;
          background: linear-gradient(90deg, rgba(255,77,77,1) 0%, rgba(255,199,0,1) 50%, rgba(4,170,109,1) 100%);
          opacity: 0;
          transition: opacity 0.3s ease;
        }
        
        .sp-gauge-container.sp-hover {
          transform: translateY(-5px);
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
        }
        
        .sp-gauge-container.sp-hover::before {
          opacity: 1;
        }
        
        .sp-gauge-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          margin-bottom: 1rem;
        }
        
        .sp-gauge-header h3 {
          margin: 0;
          font-size: 1.1rem;
          font-weight: 600;
          color: #333;
        }
        
        .sp-performance-badge {
          font-size: 11px;
          font-weight: 600;
          color: white;
          padding: 4px 8px;
          border-radius: 4px;
          box-shadow: 0 2px 6px rgba(0,0,0,0.2);
        }
        
        .sp-gauge-svg {
          margin-bottom: 1rem;
        }
        
        .sp-gauge-comparison {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
          width: 100%;
          padding-top: 0.5rem;
          border-top: 1px solid #f0f0f0;
        }
        
        .sp-comparison-item {
          display: flex;
          justify-content: space-between;
          width: 100%;
        }
        
        .sp-comparison-label {
          font-size: 12px;
          color: #777;
        }
        
        .sp-comparison-value {
          font-size: 14px;
          font-weight: 600;
          color: #333;
        }
        
        .sp-comparison-diff {
          font-size: 13px;
          font-weight: 600;
        }
        
        /* Explanation styles */
        .sp-explanation {
          background: white;
          border-radius: 16px;
          padding: 1.5rem;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
          max-width: 800px;
          margin: 0 auto;
        }
        
        .sp-explanation-title {
          font-size: 1.1rem;
          font-weight: 600;
          color: #333;
          margin-bottom: 1rem;
          padding-bottom: 0.5rem;
          border-bottom: 1px solid #f0f0f0;
        }
        
        .sp-explanation-content {
          font-size: 14px;
          color: #555;
          line-height: 1.5;
          margin-bottom: 1rem;
        }
        
        .sp-explanation-content p {
          margin: 0.5rem 0;
        }
        
        .sp-good-text {
          margin-left: 6px;
          font-weight: 600;
          color: #04aa6d;
        }
        
        .sp-color-legend {
          display: flex;
          justify-content: center;
          gap: 1.5rem;
          padding-top: 1rem;
          border-top: 1px solid #f0f0f0;
        }
        
        .sp-legend-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 13px;
          color: #555;
        }
        
        .sp-legend-color {
          width: 16px;
          height: 16px;
          border-radius: 4px;
        }
        
        /* Loading and error states */
        .sp-loading-container,
        .sp-error-container,
        .sp-no-data-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 3rem;
          gap: 1rem;
          background: white;
          border-radius: 16px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
          color: #666;
          text-align: center;
          height: 240px;
          width: 100%;
        }
        
        .sp-loading-spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #f3f3f3;
          border-top: 4px solid ${teamColor};
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        /* Responsive styles */
        @media (max-width: 768px) {
          .sp-gauges-container {
            flex-direction: column;
            align-items: center;
          }
          
          .sp-gauge-container {
            width: 100%;
            max-width: 300px;
          }
        }
      `}</style>
    </div>
  );
};

export default GaugeComponent;