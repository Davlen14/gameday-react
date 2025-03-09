import React, { useState, useEffect } from "react";
import graphqlTeamsService from "../services/graphqlTeamsService";

const RatingsComponent = ({ teamName, year }) => {
  const [ratings, setRatings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Updated national averages for reference
  const nationalAverages = {
    elo: 1500,
    fpi: 0,
    winProbability: 50, // Average win probability is ~50%
    spDefense: 27,
    spOffense: 28,
    spOverall: 3,
    srs: 0,
    fpiDefensiveEfficiency: 50,
    fpiOffensiveEfficiency: 50,
    fpiSpecialTeamsEfficiency: 50
  };

  useEffect(() => {
    const fetchRatings = async () => {
      if (!teamName || !year) {
        setLoading(false);
        return;
      }

      try {
        const ratingData = await graphqlTeamsService.getTeamDetailedRatings(teamName, year);
        console.log("Ratings data response:", ratingData);
        
        if (!ratingData) {
          console.warn(`No ratings data found for ${teamName} in ${year}`);
        }
        
        setRatings(ratingData || {});
        setError(null);
      } catch (err) {
        console.error("Error fetching ratings:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    setLoading(true);
    fetchRatings();
  }, [teamName, year]);

  // Determine rating status based on thresholds
  const getRatingStatus = (value, metricName) => {
    if (value === null || value === undefined || value === "N/A") return "unknown";

    switch (metricName) {
      case "elo":
        if (value >= 1800) return "excellent";
        if (value <= 1200) return "poor";
        if (value >= 1500) return "good";
        return "average";

      case "fpi":
        if (value >= 15) return "excellent";
        if (value <= -15) return "poor";
        return "average";

      case "winProbability":
        if (value >= 60) return "excellent";
        if (value < 40) return "poor";
        return "average";

      case "spDefense":
        // For defense: lower is better
        if (value < 20) return "excellent";
        if (value > 34) return "poor";
        return "average";

      case "spOffense":
        if (value > 34) return "excellent";
        if (value < 22) return "poor";
        return "average";

      case "spOverall":
        if (value >= 11) return "excellent";
        if (value <= -5) return "poor";
        return "average";

      case "srs":
        if (value >= 10) return "excellent";
        if (value <= -10) return "poor";
        return "average";

      case "fpiDefensiveEfficiency":
        if (value >= 60) return "excellent";
        if (value < 40) return "poor";
        return "average";

      case "fpiOffensiveEfficiency":
        if (value >= 60) return "excellent";
        if (value < 40) return "poor";
        return "average";

      case "fpiSpecialTeamsEfficiency":
        if (value >= 60) return "excellent";
        if (value < 40) return "poor";
        return "average";

      default:
        return "unknown";
    }
  };

  // Calculate percentage for the bar chart based on the metric's range
  const getPercentage = (value, metricName) => {
    if (value === null || value === undefined || value === "N/A") return 0;

    switch (metricName) {
      case "elo":
        // Range: 1200 (0%) to 1800 (100%)
        return Math.min(Math.max(((value - 1200) / (1800 - 1200)) * 100, 0), 100);

      case "fpi":
        // Range: -15 to +15
        return Math.min(Math.max(((value + 15) / 30) * 100, 0), 100);

      case "winProbability":
        // Value is already in percentage
        return Math.min(Math.max(value, 0), 100);

      case "spDefense":
        // Inverted range: excellent if below 20 (100%), poor if above 34 (0%)
        return Math.min(Math.max(((34 - value) / (34 - 20)) * 100, 0), 100);

      case "spOffense":
        // Range: 22 (0%) to 34 (100%)
        return Math.min(Math.max(((value - 22) / (34 - 22)) * 100, 0), 100);

      case "spOverall":
        // Range: -5 to +11
        return Math.min(Math.max(((value + 5) / (11 - (-5))) * 100, 0), 100);

      case "srs":
        // Range: -10 to +10
        return Math.min(Math.max(((value + 10) / 20) * 100, 0), 100);

      case "fpiDefensiveEfficiency":
      case "fpiOffensiveEfficiency":
      case "fpiSpecialTeamsEfficiency":
        // Range: 40 to 60
        return Math.min(Math.max(((value - 40) / (60 - 40)) * 100, 0), 100);

      default:
        return 50;
    }
  };

  // Labels for each metric
  const getMetricLabel = (metricName) => {
    const labels = {
      elo: "ELO Rating",
      fpi: "FPI Score",
      winProbability: "Win Probability (%)",
      spDefense: "SP Defense",
      spOffense: "SP Offense",
      spOverall: "SP Overall",
      srs: "SRS (Simple Rating System)",
      fpiDefensiveEfficiency: "FPI Defensive Efficiency",
      fpiOffensiveEfficiency: "FPI Offensive Efficiency",
      fpiSpecialTeamsEfficiency: "FPI Special Teams Efficiency"
    };
    return labels[metricName] || metricName;
  };

  // Descriptions for each metric
  const getMetricDescription = (metricName) => {
    const descriptions = {
      elo: "ELO is a rating system that measures team strength. Higher values indicate stronger teams.",
      fpi: "Football Power Index is an overall team rating. Positive values are above average.",
      winProbability: "Win probability reflects the chance of winning a game. Around 50% is average, above 60% is excellent, and below 40% is below average.",
      spDefense: "Special teams defense rating. Lower values indicate elite defensive performance.",
      spOffense: "Special teams offense rating. Higher values indicate strong offensive performance on special teams.",
      spOverall: "Combines aspects of special teams play. Higher values reflect superior performance.",
      srs: "Simple Rating System accounts for strength of schedule. Higher values are better.",
      fpiDefensiveEfficiency: "Measures the efficiency of a team's defense. Higher values indicate better performance.",
      fpiOffensiveEfficiency: "Measures the efficiency of a team's offense. Higher values indicate better performance.",
      fpiSpecialTeamsEfficiency: "Measures the efficiency of a team's special teams. Higher values indicate better performance."
    };
    return descriptions[metricName] || "";
  };

  if (loading) return <div className="ratings-loading">Loading ratings data...</div>;
  if (error) return <div className="ratings-error">Error: {error}</div>;
  if (!ratings || Object.keys(ratings).length === 0) {
    return <div className="ratings-no-data">No ratings data available for {teamName}.</div>;
  }

  // Updated metrics to display, now including winProbability
  const metricsToDisplay = [
    "elo",
    "fpi",
    "winProbability",
    "spDefense",
    "spOffense",
    "spOverall",
    "srs",
    "fpiDefensiveEfficiency",
    "fpiOffensiveEfficiency",
    "fpiSpecialTeamsEfficiency"
  ];

  return (
    <div className="ratings-component">
      <h3>Detailed Ratings Analysis</h3>
      <div className="ratings-summary">
        <div className="team-badge">
          <div className="team-name">{ratings.team || teamName}</div>
          <div className="team-conference">{ratings.conference || "N/A"}</div>
          <div className="team-year">{ratings.year || year}</div>
        </div>
        <div className="ratings-explanation">
          <p>
            These metrics compare {teamName} to other teams using various rating systems.
            Each rating uses different calculations to evaluate team performance.
          </p>
        </div>
      </div>
      
      <div className="metrics-grid">
        {metricsToDisplay.map(metric => {
          const value = ratings[metric] ?? "N/A";
          const status = getRatingStatus(value, metric);
          const percentage = getPercentage(value, metric);
          
          return (
            <div key={metric} className={`metric-card status-${status}`}>
              <div className="metric-header">
                <div className="metric-name">{getMetricLabel(metric)}</div>
                <div className="metric-value">
                  {value !== "N/A" ? Number(value).toFixed(1) : "N/A"}
                </div>
              </div>
              <div className="metric-bar-container">
                <div 
                  className="metric-bar" 
                  style={{width: `${percentage}%`}}
                ></div>
                <div className="metric-markers">
                  <div className="marker poor"></div>
                  <div className="marker average"></div>
                  <div className="marker good"></div>
                  <div className="marker excellent"></div>
                </div>
              </div>
              <div className="metric-description">
                {getMetricDescription(metric)}
              </div>
              <div className="metric-status">
                {status === "excellent" && "Elite performance"}
                {status === "good" && "Above average"}
                {status === "average" && "Average performance"}
                {status === "poor" && "Below average"}
                {status === "unknown" && "No data available"}
              </div>
            </div>
          );
        })}
      </div>
      
      <style jsx>{`
        .ratings-component {
          width: 100%;
          padding: 20px 0;
          font-size: 14px;
        }
        
        .ratings-loading, .ratings-error, .ratings-no-data {
          padding: 20px;
          margin: 10px 0;
          border-radius: 8px;
          text-align: center;
          font-weight: 500;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
        }
        
        .ratings-loading {
          background-color: #f8f9fa;
          color: #6c757d;
        }
        
        .ratings-error {
          background-color: #f8d7da;
          color: #721c24;
        }
        
        .ratings-no-data {
          background-color: #fff3cd;
          color: #856404;
        }
        
        .ratings-summary {
          display: flex;
          align-items: center;
          gap: 20px;
          margin-bottom: 30px;
          padding: 20px;
          background-color: rgba(0, 0, 0, 0.02);
          border-radius: 10px;
        }
        
        .team-badge {
          padding: 15px 25px;
          background: linear-gradient(145deg, #f0f0f0, #ffffff);
          border-radius: 12px;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
          min-width: 180px;
          text-align: center;
        }
        
        .team-name {
          font-size: 18px;
          font-weight: 700;
          margin-bottom: 5px;
        }
        
        .team-conference {
          font-size: 14px;
          color: #555;
          margin-bottom: 3px;
        }
        
        .team-year {
          font-size: 13px;
          color: #777;
        }
        
        .ratings-explanation {
          flex: 1;
        }
        
        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 20px;
          margin-top: 20px;
        }
        
        .metric-card {
          padding: 20px;
          background: white;
          border-radius: 10px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
          transition: transform 0.2s, box-shadow 0.2s;
          position: relative;
          overflow: hidden;
        }
        
        .metric-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 6px 15px rgba(0, 0, 0, 0.12);
        }
        
        .metric-card.status-excellent {
          border-left: 4px solid #28a745;
        }
        
        .metric-card.status-good {
          border-left: 4px solid #4caf50;
        }
        
        .metric-card.status-average {
          border-left: 4px solid #ffc107;
        }
        
        .metric-card.status-poor {
          border-left: 4px solid #dc3545;
        }
        
        .metric-card.status-unknown {
          border-left: 4px solid #6c757d;
        }
        
        .metric-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 15px;
        }
        
        .metric-name {
          font-weight: 600;
          font-size: 15px;
          color: #333;
        }
        
        .metric-value {
          font-weight: 700;
          font-size: 18px;
          color: #222;
        }
        
        .metric-bar-container {
          height: 8px;
          background-color: #e9ecef;
          border-radius: 4px;
          margin-bottom: 15px;
          position: relative;
          overflow: hidden;
        }
        
        .metric-bar {
          height: 100%;
          border-radius: 4px;
          transition: width 1s ease-out;
        }
        
        .status-excellent .metric-bar {
          background-color: #28a745;
        }
        
        .status-good .metric-bar {
          background-color: #4caf50;
        }
        
        .status-average .metric-bar {
          background-color: #ffc107;
        }
        
        .status-poor .metric-bar {
          background-color: #dc3545;
        }
        
        .status-unknown .metric-bar {
          background-color: #6c757d;
        }
        
        .metric-markers {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          display: flex;
          pointer-events: none;
        }
        
        .marker {
          flex: 1;
          border-right: 1px dashed rgba(0, 0, 0, 0.1);
        }
        
        .marker:last-child {
          border-right: none;
        }
        
        .metric-description {
          font-size: 13px;
          color: #666;
          line-height: 1.4;
          margin-bottom: 15px;
          min-height: 55px;
        }
        
        .metric-status {
          font-size: 13px;
          font-weight: 600;
          padding: 5px 12px;
          border-radius: 12px;
          display: inline-block;
        }
        
        .status-excellent .metric-status {
          background-color: rgba(40, 167, 69, 0.1);
          color: #28a745;
        }
        
        .status-good .metric-status {
          background-color: rgba(76, 175, 80, 0.1);
          color: #4caf50;
        }
        
        .status-average .metric-status {
          background-color: rgba(255, 193, 7, 0.1);
          color: #d39e00;
        }
        
        .status-poor .metric-status {
          background-color: rgba(220, 53, 69, 0.1);
          color: #dc3545;
        }
        
        .status-unknown .metric-status {
          background-color: rgba(108, 117, 125, 0.1);
          color: #6c757d;
        }
        
        @media (max-width: 768px) {
          .ratings-summary {
            flex-direction: column;
            text-align: center;
          }
          
          .team-badge {
            width: 100%;
          }
          
          .metrics-grid {
            grid-template-columns: 1fr;
          }
          
          .metric-description {
            min-height: auto;
          }
        }
      `}</style>
    </div>
  );
};

export default RatingsComponent;
