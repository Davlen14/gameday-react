import React, { useState, useEffect } from "react";
import graphqlTeamsService from "../services/graphqlTeamsService";

const RatingsComponent = ({ teamName, year }) => {
  const [ratings, setRatings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // National averages for comparison
  const nationalAverages = {
    elo: 1500, // Standard baseline for ELO
    fpi: 0, // FPI is normalized around 0
    fpiAvgWinProbabilityRank: 65, // Middle rank (out of 130 teams)
    fpiOverallEfficiency: 0, // Normalized around 0
    spOverall: 0, // SP+ is normalized around 0
    srs: 0 // SRS is typically normalized around 0
  };

  useEffect(() => {
    const fetchRatings = async () => {
      if (!teamName || !year) {
        setLoading(false);
        return;
      }

      try {
        // Call the getTeamDetailedRatings function from graphqlTeamsService
        const ratingData = await graphqlTeamsService.getTeamDetailedRatings(teamName, year);
        console.log("Ratings data response:", ratingData);
        
        if (!ratingData) {
          console.warn(`No ratings data found for ${teamName} in ${year}`);
        }
        
        setRatings(ratingData || {});
        setError(null); // Clear any previous errors
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

  // Helper function to determine if a rating is good, average, or poor
  const getRatingStatus = (value, metricName) => {
    if (value === null || value === undefined || value === "N/A") return "unknown";
    
    // Different metrics have different interpretations of good/bad
    switch (metricName) {
      case "elo":
        if (value > 1600) return "excellent";
        if (value > 1500) return "good";
        if (value > 1400) return "average";
        return "poor";
      
      case "fpi":
      case "fpiOverallEfficiency":
      case "spOverall":
      case "srs":
        if (value > 15) return "excellent";
        if (value > 5) return "good";
        if (value > -5) return "average";
        return "poor";
      
      case "fpiAvgWinProbabilityRank":
        // For ranks, lower is better
        if (value < 20) return "excellent";
        if (value < 40) return "good";
        if (value < 80) return "average";
        return "poor";
      
      default:
        return "unknown";
    }
  };

  // Get percentage for bar chart based on metric
  const getPercentage = (value, metricName) => {
    if (value === null || value === undefined || value === "N/A") return 0;
    
    switch (metricName) {
      case "elo":
        // ELO typically ranges from ~1300 to ~1700 for FBS teams
        return Math.min(Math.max(((value - 1300) / 400) * 100, 0), 100);
      
      case "fpiAvgWinProbabilityRank":
        // For ranks (1-130), invert so lower is better
        return Math.min(Math.max(100 - ((value / 130) * 100), 0), 100);
      
      case "fpi":
      case "fpiOverallEfficiency":
      case "spOverall":
      case "srs":
        // These metrics typically range from -30 to +30
        return Math.min(Math.max(((value + 30) / 60) * 100, 0), 100);
      
      default:
        return 50; // Default to 50% if unknown
    }
  };

  // Helper to get a readable label for each metric
  const getMetricLabel = (metricName) => {
    const labels = {
      elo: "ELO Rating",
      fpi: "FPI Score",
      fpiAvgWinProbabilityRank: "FPI Win Probability Rank",
      fpiOverallEfficiency: "FPI Overall Efficiency",
      spOverall: "SP+ Overall",
      srs: "SRS (Simple Rating System)"
    };
    return labels[metricName] || metricName;
  };

  // Helper to get a description for each metric
  const getMetricDescription = (metricName) => {
    const descriptions = {
      elo: "ELO is a rating system that measures team strength. Higher values indicate stronger teams.",
      fpi: "Football Power Index is an overall team rating. Positive values are above average.",
      fpiAvgWinProbabilityRank: "Ranking of teams by average win probability. Lower ranks are better.",
      fpiOverallEfficiency: "Measures a team's overall efficiency. Higher values are better.",
      spOverall: "SP+ measures team strength using play-by-play data. Higher values are better.",
      srs: "Simple Rating System accounts for strength of schedule. Higher values are better."
    };
    return descriptions[metricName] || "";
  };

  if (loading) return <div className="ratings-loading">Loading ratings data...</div>;
  if (error) return <div className="ratings-error">Error: {error}</div>;
  if (!ratings || Object.keys(ratings).length === 0) {
    return <div className="ratings-no-data">No ratings data available for {teamName}.</div>;
  }

  // The metrics we want to display as visualization cards
  const metricsToDisplay = [
    "elo",
    "fpi",
    "fpiAvgWinProbabilityRank",
    "fpiOverallEfficiency",
    "spOverall",
    "srs"
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
          const value = ratings[metric] || "N/A";
          const status = getRatingStatus(value, metric);
          const percentage = getPercentage(value, metric);
          
          return (
            <div key={metric} className={`metric-card status-${status}`}>
              <div className="metric-header">
                <div className="metric-name">{getMetricLabel(metric)}</div>
                <div className="metric-value">{value !== "N/A" ? Number(value).toFixed(1) : "N/A"}</div>
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
        
        /* Mobile-friendly adjustments */
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