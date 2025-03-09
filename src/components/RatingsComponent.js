import React, { useState, useEffect } from "react";
import graphqlTeamsService from "../services/graphqlTeamsService";

const RatingsComponent = ({ teamName, year }) => {
  const [ratings, setRatings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  if (loading) return <div className="ratings-loading">Loading ratings data...</div>;
  if (error) return <div className="ratings-error">Error: {error}</div>;
  if (!ratings || Object.keys(ratings).length === 0) {
    return <div className="ratings-no-data">No ratings data available for {teamName}.</div>;
  }

  return (
    <div className="ratings-component">
      <h3>Detailed Ratings Data</h3>
      <div className="ratings-table-container">
        <table className="ratings-table">
          <thead>
            <tr>
              <th>Team</th>
              <th>Conference</th>
              <th>ELO</th>
              <th>FPI</th>
              <th>Win Prob Rank</th>
              <th>Efficiency</th>
              <th>SP+</th>
              <th>SRS</th>
              <th>Year</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>{ratings.team || teamName}</td>
              <td>{ratings.conference || "N/A"}</td>
              <td>{ratings.elo || "N/A"}</td>
              <td>{ratings.fpi || "N/A"}</td>
              <td>{ratings.fpiAvgWinProbabilityRank || "N/A"}</td>
              <td>{ratings.fpiOverallEfficiency || "N/A"}</td>
              <td>{ratings.spOverall || "N/A"}</td>
              <td>{ratings.srs || "N/A"}</td>
              <td>{ratings.year || year}</td>
            </tr>
          </tbody>
        </table>
      </div>
      
      {/* Mobile-friendly view that only shows on smaller screens */}
      <div className="ratings-mobile-view">
        <div className="ratings-metric">
          <span className="metric-label">Team:</span>
          <span className="metric-value">{ratings.team || teamName}</span>
        </div>
        <div className="ratings-metric">
          <span className="metric-label">Conference:</span>
          <span className="metric-value">{ratings.conference || "N/A"}</span>
        </div>
        <div className="ratings-metric">
          <span className="metric-label">ELO:</span>
          <span className="metric-value">{ratings.elo || "N/A"}</span>
        </div>
        <div className="ratings-metric">
          <span className="metric-label">FPI:</span>
          <span className="metric-value">{ratings.fpi || "N/A"}</span>
        </div>
        <div className="ratings-metric">
          <span className="metric-label">Win Prob Rank:</span>
          <span className="metric-value">{ratings.fpiAvgWinProbabilityRank || "N/A"}</span>
        </div>
        <div className="ratings-metric">
          <span className="metric-label">FPI Efficiency:</span>
          <span className="metric-value">{ratings.fpiOverallEfficiency || "N/A"}</span>
        </div>
        <div className="ratings-metric">
          <span className="metric-label">SP+ Overall:</span>
          <span className="metric-value">{ratings.spOverall || "N/A"}</span>
        </div>
        <div className="ratings-metric">
          <span className="metric-label">SRS:</span>
          <span className="metric-value">{ratings.srs || "N/A"}</span>
        </div>
        <div className="ratings-metric">
          <span className="metric-label">Year:</span>
          <span className="metric-value">{ratings.year || year}</span>
        </div>
      </div>

      <style jsx>{`
        .ratings-component {
          width: 100%;
          margin-top: 20px;
          font-size: 14px;
        }
        
        .ratings-loading, .ratings-error, .ratings-no-data {
          padding: 15px;
          margin: 10px 0;
          border-radius: 5px;
          text-align: center;
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
        
        .ratings-table-container {
          width: 100%;
          overflow-x: auto;
          border-radius: 5px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        }
        
        .ratings-table {
          width: 100%;
          border-collapse: collapse;
          min-width: 600px;
        }
        
        .ratings-table th, .ratings-table td {
          padding: 8px 12px;
          text-align: left;
          border-bottom: 1px solid #ddd;
          white-space: nowrap;
        }
        
        .ratings-table th {
          background-color: rgba(0, 0, 0, 0.05);
          font-weight: 600;
        }
        
        .ratings-table tr:hover {
          background-color: rgba(0, 0, 0, 0.02);
        }
        
        /* Mobile view styles */
        .ratings-mobile-view {
          display: none;
          flex-direction: column;
          gap: 8px;
          padding: 12px;
          border: 1px solid #ddd;
          border-radius: 8px;
          margin-top: 15px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        }
        
        .ratings-metric {
          display: flex;
          justify-content: space-between;
          padding: 6px 0;
          border-bottom: 1px solid #eee;
        }
        
        .metric-label {
          font-weight: 600;
          color: #555;
        }
        
        .metric-value {
          text-align: right;
          font-weight: 500;
        }
        
        /* Mobile breakpoint */
        @media (max-width: 768px) {
          .ratings-table-container {
            display: none;
          }
          
          .ratings-mobile-view {
            display: flex;
          }
        }
      `}</style>
    </div>
  );
};

export default RatingsComponent;