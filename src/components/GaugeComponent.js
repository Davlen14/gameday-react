import React from "react";

// National Averages
const NATIONAL_AVERAGES = {
  overall: 16, // Updated based on your gauge image
  offense: 27, // Updated based on your gauge image
  defense: 27  // Updated based on your gauge image
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
  let valueToUse = rawValue;
  
  if (teamData) {
    if (metricType === "overall" && teamData.rating) {
      valueToUse = teamData.rating;
    } else if (metricType === "offense" && teamData.offense && teamData.offense.rating) {
      valueToUse = teamData.offense.rating;
    } else if (metricType === "defense" && teamData.defense && teamData.defense.rating) {
      valueToUse = teamData.defense.rating;
    }
  }
  
  // Get ranges based on metric type (offense, defense, overall)
  const isDefense = metricType === "defense";
  
  // Set min and max values based on the gauge ranges shown in your image
  let min = 1;
  let max = 45;
  const avg = NATIONAL_AVERAGES[metricType || "overall"];
  
  // Calculate needle angle (0-180 degrees)
  let needleRotation;
  if (isDefense) {
    // For defense - lower is better, so invert
    needleRotation = 180 - ((valueToUse - min) / (max - min) * 180);
  } else {
    needleRotation = (valueToUse - min) / (max - min) * 180;
  }
  
  // Ensure the needle stays within the gauge bounds
  needleRotation = Math.max(0, Math.min(180, needleRotation));
  
  // Determine zone color based on value
  let zone;
  if (isDefense) {
    zone = valueToUse <= 15 ? "green" :
           valueToUse >= 30 ? "red" : "yellow";
  } else {
    zone = valueToUse >= 30 ? "green" :
           valueToUse <= 15 ? "red" : "yellow";
  }
  
  // Get needle color based on zone
  const needleColor = zone === "red" ? "#ff4d4d" : 
                      zone === "yellow" ? "#ffc700" : 
                      "#04aa6d";
                      
  // Format value for display
  const displayValue = Math.round(valueToUse);
  
  // Create a unique ID for this gauge's gradients
  const uniqueId = `${label.toLowerCase().replace(/\s/g, '')}`;

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
        
        {/* Tick marks - showing 1, 45 at ends and custom value for the middle */}
        <line x1="10" y1="60" x2="10" y2="55" stroke="#666" strokeWidth="1" />
        <text x="10" y="70" textAnchor="middle" fontSize="8" fill="#666" fontWeight="bold">
          {isDefense ? "45" : "1"}
        </text>
        
        <line x1="60" y1="60" x2="60" y2="55" stroke="#666" strokeWidth="1" />
        <text x="60" y="70" textAnchor="middle" fontSize="8" fill="#666" fontWeight="bold">
          {avg}
        </text>
        
        <line x1="110" y1="60" x2="110" y2="55" stroke="#666" strokeWidth="1" />
        <text x="110" y="70" textAnchor="middle" fontSize="8" fill="#666" fontWeight="bold">
          {isDefense ? "1" : "45"}
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