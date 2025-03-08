import React from "react";

// National Averages based on your data
const NATIONAL_AVERAGES = {
  overall: 0.55, // Overall national average
  offense: 27.14, // Offense national average
  defense: 26.61  // Defense national average
};

/**
 * GaugeComponent - A semi-circular gauge for displaying SP+ ratings
 * 
 * @param {Object} props
 * @param {string} props.label - The label for the gauge (e.g., "Overall", "Offense", "Defense")
 * @param {number} props.rawValue - The value to display on the gauge
 * @param {string} props.metricType - The type of metric ("overall", "offense", or "defense")
 * @param {Object} props.teamData - Complete team data from API/JSON
 * @returns {JSX.Element} A gauge component
 */
const GaugeComponent = ({ label, rawValue, metricType, teamData }) => {
  // Get the correct value from teamData if available
  let valueToUse = rawValue || 0;
  
  if (teamData) {
    if (metricType === "overall") {
      valueToUse = teamData.rating || teamData.overall || valueToUse;
    } else if (metricType === "offense" && teamData.offense) {
      valueToUse = teamData.offense.rating || valueToUse;
    } else if (metricType === "defense" && teamData.defense) {
      valueToUse = teamData.defense.rating || valueToUse;
    }
  }
  
  // Determine if it's the defense metric (for inverse scaling)
  const isDefense = metricType === "defense";
  
  // Set min and max values based on the data ranges
  let min, max;
  
  if (metricType === "overall") {
    min = 0;
    max = 35; // Based on top teams having ~31 rating
  } else {
    min = 0;
    max = 45; // Based on top offense/defense ratings
  }
  
  // Get national average for the metric
  const avg = NATIONAL_AVERAGES[metricType] || 0;
  
  // Calculate needle angle (0-180 degrees)
  let needleRotation;
  if (isDefense) {
    // For defense, we need to handle it differently:
    // Higher defense rating values are worse (more points allowed)
    // So we invert the scale for visual representation
    needleRotation = 180 - ((valueToUse - min) / (max - min) * 180);
  } else {
    // For offense and overall, higher is better
    needleRotation = (valueToUse - min) / (max - min) * 180;
  }
  
  // Ensure the needle stays within the gauge bounds
  needleRotation = Math.max(0, Math.min(180, needleRotation));
  
  // Determine zone color based on value and metric type
  let zone;
  
  if (isDefense) {
    // For defense lower is better
    if (valueToUse <= 20) {
      zone = "green"; // Elite defense (low rating)
    } else if (valueToUse >= 30) {
      zone = "red"; // Poor defense (high rating)
    } else {
      zone = "yellow"; // Average defense
    }
  } else if (metricType === "offense") {
    // For offense higher is better
    if (valueToUse >= 35) {
      zone = "green"; // Elite offense
    } else if (valueToUse <= 20) {
      zone = "red"; // Poor offense
    } else {
      zone = "yellow"; // Average offense
    }
  } else {
    // For overall higher is better
    if (valueToUse >= 25) {
      zone = "green"; // Elite overall
    } else if (valueToUse <= 15) {
      zone = "red"; // Poor overall
    } else {
      zone = "yellow"; // Average overall
    }
  }
  
  // Get needle color based on zone
  const needleColor = zone === "red" ? "#ff4d4d" : 
                      zone === "yellow" ? "#ffc700" : 
                      "#04aa6d";
                      
  // Format value for display - show one decimal place for precision
  const displayValue = metricType === "overall" ? 
                      valueToUse.toFixed(1) : 
                      Math.round(valueToUse * 10) / 10;
  
  // Create a unique ID for this gauge's gradients
  const uniqueId = `${label.toLowerCase().replace(/\s/g, '')}`;
  
  // Calculate tick values based on metric type
  const leftTick = isDefense ? max : min;
  const rightTick = isDefense ? min : max;
  
  // Determine average position for tick mark - should be in the middle of yellow zone
  const midTick = metricType === "offense" ? NATIONAL_AVERAGES.offense :
                 metricType === "defense" ? NATIONAL_AVERAGES.defense :
                 metricType === "overall" ? 15 : // Adjusted for overall scale
                 (max + min) / 2;

  return (
    <div className="gauge">
      <svg width="120" height="80" viewBox="0 0 120 80">
        {/* Background colors */}
        {/* Red sector - Left for offense/overall, Right for defense */}
        <path 
          d={isDefense ? 
            "M 60 60 L 110 60 A 50 50 0 0 0 85 18.5 L 60 60 Z" : 
            "M 60 60 L 10 60 A 50 50 0 0 1 35 18.5 L 60 60 Z"} 
          fill="#ff4d4d" 
          stroke="#ddd" 
          strokeWidth="0.5"
        />
        
        {/* Yellow sector - Middle */}
        <path 
          d="M 60 60 L 35 18.5 A 50 50 0 0 1 85 18.5 L 60 60 Z" 
          fill="#ffc700" 
          stroke="#ddd" 
          strokeWidth="0.5"
        />
        
        {/* Green sector - Right for offense/overall, Left for defense */}
        <path 
          d={isDefense ? 
            "M 60 60 L 10 60 A 50 50 0 0 1 35 18.5 L 60 60 Z" : 
            "M 60 60 L 110 60 A 50 50 0 0 0 85 18.5 L 60 60 Z"} 
          fill="#04aa6d" 
          stroke="#ddd" 
          strokeWidth="0.5"
        />
        
        {/* Gauge border */}
        <path 
          d="M 10 60 A 50 50 0 0 1 110 60" 
          fill="none" 
          stroke="#aaa" 
          strokeWidth="1" 
        />
        
        {/* Tick marks */}
        <line x1="10" y1="60" x2="10" y2="55" stroke="#666" strokeWidth="1" />
        <text x="10" y="70" textAnchor="middle" fontSize="8" fill="#666" fontWeight="bold">
          {leftTick}
        </text>
        
        <line x1="60" y1="60" x2="60" y2="55" stroke="#666" strokeWidth="1" />
        <text x="60" y="70" textAnchor="middle" fontSize="8" fill="#666" fontWeight="bold">
          {midTick.toFixed(1)}
        </text>
        
        <line x1="110" y1="60" x2="110" y2="55" stroke="#666" strokeWidth="1" />
        <text x="110" y="70" textAnchor="middle" fontSize="8" fill="#666" fontWeight="bold">
          {rightTick}
        </text>
        
        {/* Needle with properly sized ticker at the end */}
        <g transform={`rotate(${needleRotation}, 60, 60)`}>
          <line 
            x1="60" 
            y1="60" 
            x2="60" 
            y2="10" 
            stroke="#000" 
            strokeWidth="1.5"
          />
          <circle 
            cx="60" 
            cy="60" 
            r="3" 
            fill="#000" 
          />
          <polygon 
            points="57,16 63,16 60,6" 
            fill="#000"
          />
        </g>
      </svg>
      
      <div style={{
        fontSize: '18px',
        fontWeight: 'bold',
        textAlign: 'center',
        marginTop: '8px'
      }}>
        {displayValue}
      </div>
      
      <div className="gauge-title">
        {label}
      </div>
    </div>
  );
};

export default GaugeComponent;