import React from "react";

// National Averages based on provided data
const NATIONAL_AVERAGES = {
  overall: 0.55, // Overall national average
  offense: 27.14, // Offense national average
  defense: 26.61  // Defense national average
};

/**
 * GaugeComponent - A modern spider chart for displaying SP+ ratings
 * 
 * @param {Object} props
 * @param {string} props.label - The label for the metric (e.g., "Overall", "Offense", "Defense")
 * @param {number} props.rawValue - The value to display on the chart
 * @param {string} props.metricType - The type of metric ("overall", "offense", or "defense")
 * @param {Object} props.teamData - Complete team data from API/JSON
 * @returns {JSX.Element} A spider chart component
 */
const GaugeComponent = ({ label, rawValue, metricType, teamData }) => {
  // Extract correct values from teamData with fallback defaults
  let valueToUse = rawValue ?? 0;

  if (teamData) {
    if (metricType === "overall") {
      valueToUse = teamData.rating ?? valueToUse;
    } else if (metricType === "offense" && teamData.offense) {
      valueToUse = teamData.offense.rating ?? valueToUse;
    } else if (metricType === "defense" && teamData.defense) {
      valueToUse = teamData.defense.rating ?? valueToUse;
    }
  }

  // Determine if it's the defense metric (for inverse scaling)
  const isDefense = metricType === "defense";

  // Set min and max values based on the data ranges
  let min, max;
  
  if (metricType === "overall") {
    min = 0;
    max = 32; // Based on top teams having ~31 rating
  } else if (metricType === "offense") {
    min = 20;
    max = 45; // Based on top offense ratings
  } else { // defense
    min = 5;
    max = 30; // Based on defense ratings
  }

  // Calculate the percentage for the spider chart
  // For defense, invert the scale (lower is better)
  let percentage;
  if (isDefense) {
    percentage = 1 - ((valueToUse - min) / (max - min));
  } else {
    percentage = (valueToUse - min) / (max - min);
  }

  // Ensure percentage is within bounds
  percentage = Math.max(0, Math.min(1, percentage));

  // Calculate national average percentage for comparison
  let avgPercentage;
  if (isDefense) {
    avgPercentage = 1 - ((NATIONAL_AVERAGES[metricType] - min) / (max - min));
  } else {
    avgPercentage = (NATIONAL_AVERAGES[metricType] - min) / (max - min);
  }
  
  // Ensure average percentage is within bounds
  avgPercentage = Math.max(0, Math.min(1, avgPercentage));

  // Determine zone color based on value and metric type
  let zone;
  if (isDefense) {
    if (valueToUse <= 15) {
      zone = "green"; // Elite defense (low rating)
    } else if (valueToUse >= NATIONAL_AVERAGES.defense) {
      zone = "red"; // Poor defense (high rating)
    } else {
      zone = "yellow"; // Average defense
    }
  } else if (metricType === "offense") {
    if (valueToUse >= 35) {
      zone = "green"; // Elite offense
    } else if (valueToUse <= NATIONAL_AVERAGES.offense) {
      zone = "red"; // Poor offense
    } else {
      zone = "yellow"; // Average offense
    }
  } else {
    if (valueToUse >= 25) {
      zone = "green"; // Elite overall
    } else if (valueToUse <= 20) {
      zone = "red"; // Poor overall
    } else {
      zone = "yellow"; // Average overall
    }
  }

  // Get color based on zone
  const zoneColor = zone === "red" ? "#ff4d4d" : zone === "yellow" ? "#ffc700" : "#04aa6d";
                      
  // Format value for display - show one decimal place for precision
  const displayValue = valueToUse.toFixed(1);
  const natAvgValue = NATIONAL_AVERAGES[metricType].toFixed(1);

  // Spider chart dimensions
  const size = 120;
  const center = size / 2;
  const radius = size * 0.4;
  
  // Create spider web points for team values and national average
  // We make this a full hexagon spider chart (6 points) for visual appeal
  const generateSpiderPoints = (value) => {
    const points = [];
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI * 2 * i) / 6;
      const x = center + radius * value * Math.sin(angle);
      const y = center - radius * value * Math.cos(angle);
      points.push({ x, y });
    }
    return points;
  };

  const teamPoints = generateSpiderPoints(percentage);
  const avgPoints = generateSpiderPoints(avgPercentage);

  // Create path strings for the spider chart
  const createPathString = (points) => {
    return points.map((point, i) => 
      (i === 0 ? 'M' : 'L') + point.x + ',' + point.y
    ).join(' ') + 'Z';
  };

  const teamPathString = createPathString(teamPoints);
  const avgPathString = createPathString(avgPoints);

  // Create web background lines
  const webLines = [];
  for (let i = 1; i <= 3; i++) {
    const webPoints = generateSpiderPoints(i / 3);
    const webPathString = createPathString(webPoints);
    webLines.push(webPathString);
  }

  // Create axis lines
  const axisLines = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI * 2 * i) / 6;
    const x = center + radius * Math.sin(angle);
    const y = center - radius * Math.cos(angle);
    axisLines.push({ x1: center, y1: center, x2: x, y2: y });
  }

  return (
    <div className="gauge">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Background web */}
        {webLines.map((path, i) => (
          <path 
            key={`web-${i}`} 
            d={path} 
            fill="none" 
            stroke="#eaeaea" 
            strokeWidth="1"
            opacity={0.7}
          />
        ))}
        
        {/* Axis lines */}
        {axisLines.map((line, i) => (
          <line 
            key={`axis-${i}`} 
            x1={line.x1} 
            y1={line.y1} 
            x2={line.x2} 
            y2={line.y2} 
            stroke="#cccccc" 
            strokeWidth="1" 
            opacity={0.8}
          />
        ))}
        
        {/* National average area */}
        <path 
          d={avgPathString} 
          fill="rgba(150, 150, 150, 0.2)" 
          stroke="#888888" 
          strokeWidth="1" 
          strokeDasharray="3,2"
        />
        
        {/* Team value area */}
        <path 
          d={teamPathString} 
          fill={`${zoneColor}33`} 
          stroke={zoneColor} 
          strokeWidth="2" 
        />
        
        {/* Center point */}
        <circle cx={center} cy={center} r="2" fill="#666" />
      </svg>
      
      <div className="gauge-values">
        <div className="team-value" style={{ color: zoneColor }}>{displayValue}</div>
        <div className="avg-divider">vs</div>
        <div className="natl-value">{natAvgValue}</div>
      </div>
      
      <div className="gauge-title">
        {label}
      </div>
    </div>
  );
};

export default GaugeComponent;