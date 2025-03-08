import React from "react";

// National Averages
const NATIONAL_AVERAGES = {
  overall: 0.55, // Overall is on a different scale
  offense: 27.14,
  defense: 26.61
};

/**
 * GaugeComponent - A semi-circular gauge for displaying SP+ ratings
 * 
 * @param {Object} props
 * @param {string} props.label - The label for the gauge (e.g., "Overall", "Offense", "Defense")
 * @param {number} props.rawValue - The value to display on the gauge
 * @param {string} props.metricType - The type of metric ("overall", "offense", or "defense")
 * @returns {JSX.Element} A gauge component
 */
const GaugeComponent = ({ label, rawValue, metricType }) => {
  // Get ranges based on metric type (offense, defense, overall)
  const isDefense = metricType === "defense";
  
  // Set min and max values based on national averages
  const avg = NATIONAL_AVERAGES[metricType || "overall"];
  
  // For defense lower is better, for offense higher is better
  const min = isDefense ? Math.max(1, avg - 15) : 1;
  const max = isDefense ? 45 : Math.min(45, avg + 15);
  
  // Determine the range size for proper scaling
  const totalRange = max - min;
  
  // Calculate normalized value between min and max
  const clampedValue = Math.max(min, Math.min(rawValue, max));
  const valuePercentage = (clampedValue - min) / totalRange;
  
  // For defense, invert the needle position (lower is better)
  const needleRotation = isDefense ? 
    180 - (valuePercentage * 180) : 
    valuePercentage * 180;
  
  // Determine zone color based on value
  let zone;
  if (isDefense) {
    zone = clampedValue <= avg - (avg - min) / 2 ? "green" :
           clampedValue >= avg + (max - avg) / 2 ? "red" : "yellow";
  } else {
    zone = clampedValue >= avg + (max - avg) / 2 ? "green" :
           clampedValue <= avg - (avg - min) / 2 ? "red" : "yellow";
  }
  
  // Get needle color based on zone
  const needleColor = zone === "red" ? "#ff4d4d" : 
                      zone === "yellow" ? "#ffc700" : 
                      "#04aa6d";
                      
  // Format value for display
  const displayValue = Math.round(clampedValue);
  
  // Create a unique ID for this gauge's gradients
  const uniqueId = `${label.toLowerCase().replace(/\s/g, '')}`;

  return (
    <div className="gauge">
      <svg width="120" height="70" viewBox="0 0 120 70">
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
          {Math.round(isDefense ? max : min)}
        </text>
        
        <line x1="60" y1="60" x2="60" y2="55" stroke="#666" strokeWidth="1" />
        <text x="60" y="70" textAnchor="middle" fontSize="8" fill="#666" fontWeight="bold">
          {Math.round(avg)}
        </text>
        
        <line x1="110" y1="60" x2="110" y2="55" stroke="#666" strokeWidth="1" />
        <text x="110" y="70" textAnchor="middle" fontSize="8" fill="#666" fontWeight="bold">
          {Math.round(isDefense ? min : max)}
        </text>
        
        {/* Needle */}
        <g transform={`rotate(${needleRotation}, 60, 60)`}>
          <line x1="60" y1="60" x2="60" y2="15" stroke="#000" strokeWidth="2" />
          <circle cx="60" cy="60" r="4" fill="#000" />
        </g>
      </svg>
      
      <div style={{
        fontSize: '18px',
        fontWeight: 'bold',
        color: needleColor,
        textAlign: 'center',
        marginTop: '5px'
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