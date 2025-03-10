import React, { useEffect, useState } from "react";
import graphqlTeamsService from "../services/graphqlTeamsService";

// National Averages based on provided data (Do NOT round them)
const NATIONAL_AVERAGES = {
  overall: 0.55,  // Overall national average
  offense: 27.14, // Offense national average
  defense: 26.61  // Defense national average
};

/**
 * GaugeComponent - A modern spider chart for displaying SP+ ratings
 * 
 * @param {Object} props
 * @param {string} props.label - The label for the metric (e.g., "Overall", "Offense", "Defense")
 * @param {string} props.metricType - The type of metric ("overall", "offense", or "defense")
 * @param {string} props.teamName - The name of the team
 * @param {number} props.year - The year for fetching ratings
 * @returns {JSX.Element} A spider chart component
 */
const GaugeComponent = ({ label, metricType, teamName, year }) => {
  const [valueToUse, setValueToUse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
          setValueToUse(null);
          return;
        }

        // Extract the correct SP+ rating based on metricType
        let extractedValue = null;
        if (metricType === "overall") {
          extractedValue = ratingData.spOverall ?? null;
        } else if (metricType === "offense") {
          extractedValue = ratingData.spOffense ?? null;
        } else if (metricType === "defense") {
          extractedValue = ratingData.spDefense ?? null;
        }

        setValueToUse(extractedValue);
        setError(null);
      } catch (err) {
        console.error("Error fetching SP+ ratings:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchRatings();
  }, [teamName, year, metricType]);

  // Display loading or error state
  if (loading) return <div className="loading">Loading {label} data...</div>;
  if (error) return <div className="error">Error: {error}</div>;
  if (valueToUse === null) return <div className="no-data">No data available for {label}.</div>;

  // Determine if it's the defense metric (for inverse scaling)
  const isDefense = metricType === "defense";

  // Set min and max values based on the data ranges
  let min, max;
  
  if (metricType === "overall") {
    min = 0;
    max = 32;
  } else if (metricType === "offense") {
    min = 20;
    max = 45;
  } else {
    min = 5;
    max = 30;
  }

  // Calculate the percentage for the spider chart
  let percentage;
  if (isDefense) {
    percentage = 1 - ((valueToUse - min) / (max - min));
  } else {
    percentage = (valueToUse - min) / (max - min);
  }
  percentage = Math.max(0, Math.min(1, percentage));

  // Calculate national average percentage for comparison
  let avgPercentage;
  if (isDefense) {
    avgPercentage = 1 - ((NATIONAL_AVERAGES[metricType] - min) / (max - min));
  } else {
    avgPercentage = (NATIONAL_AVERAGES[metricType] - min) / (max - min);
  }
  avgPercentage = Math.max(0, Math.min(1, avgPercentage));

  // Determine zone color based on value
  let zone;
  if (isDefense) {
    zone = valueToUse <= 15 ? "green" : valueToUse >= NATIONAL_AVERAGES.defense ? "red" : "yellow";
  } else if (metricType === "offense") {
    zone = valueToUse >= 35 ? "green" : valueToUse <= NATIONAL_AVERAGES.offense ? "red" : "yellow";
  } else {
    zone = valueToUse >= 25 ? "green" : valueToUse <= 20 ? "red" : "yellow";
  }

  const zoneColor = zone === "red" ? "#ff4d4d" : zone === "yellow" ? "#ffc700" : "#04aa6d";

  // Spider chart dimensions
  const size = 120;
  const center = size / 2;
  const radius = size * 0.4;

  // Create spider web points
  const generateSpiderPoints = (value) => {
    return Array.from({ length: 6 }, (_, i) => {
      const angle = (Math.PI * 2 * i) / 6;
      return {
        x: center + radius * value * Math.sin(angle),
        y: center - radius * value * Math.cos(angle)
      };
    });
  };

  const teamPoints = generateSpiderPoints(percentage);
  const avgPoints = generateSpiderPoints(avgPercentage);

  // Convert points into path strings
  const createPathString = (points) => {
    return points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ') + 'Z';
  };

  return (
    <div className="gauge">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* National average area */}
        <path d={createPathString(avgPoints)} fill="rgba(150, 150, 150, 0.2)" stroke="#888888" strokeWidth="1" strokeDasharray="3,2" />

        {/* Team value area */}
        <path d={createPathString(teamPoints)} fill={`${zoneColor}33`} stroke={zoneColor} strokeWidth="2" />

        {/* Center point */}
        <circle cx={center} cy={center} r="2" fill="#666" />
      </svg>

      <div className="gauge-values">
        <div className="team-value" style={{ color: zoneColor }}>{valueToUse}</div>
        <div className="avg-divider">vs</div>
        <div className="natl-value">{NATIONAL_AVERAGES[metricType]}</div>
      </div>

      <div className="gauge-title">{label}</div>
    </div>
  );
};

export default GaugeComponent;