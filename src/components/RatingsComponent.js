import React, { useState, useEffect } from "react";
import graphqlTeamsService from "../services/graphqlTeamsService";

const RatingsComponent = ({ teamName, year }) => {
  const [ratings, setRatings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRatings = async () => {
      try {
        // Ensure the service is correctly calling the GraphQL endpoint
        const data = await graphqlTeamsService.getTeamRatings(teamName, year);
        console.log("Fetched ratings data:", data); // Debug log
        setRatings(data);
      } catch (err) {
        console.error("Error fetching ratings:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (teamName && year) {
      fetchRatings();
    }
  }, [teamName, year]);

  if (loading) return <div className="ratings-loading">Loading ratings data...</div>;
  if (error) return <div className="ratings-error">Error: {error}</div>;
  if (!ratings) return <div className="ratings-no-data">No ratings data available.</div>;

  return (
    <div className="ratings-component">
      <table className="ratings-table">
        <thead>
          <tr>
            <th>Team</th>
            <th>Conference</th>
            <th>ELO</th>
            <th>FPI</th>
            <th>FPI Avg Win Prob Rank</th>
            <th>FPI Overall Efficiency</th>
            <th>SP Overall</th>
            <th>SRS</th>
            <th>Year</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>{ratings.team || teamName}</td>
            <td>{ratings.conference}</td>
            <td>{ratings.elo}</td>
            <td>{ratings.fpi}</td>
            <td>{ratings.fpiAvgWinProbabilityRank}</td>
            <td>{ratings.fpiOverallEfficiency}</td>
            <td>{ratings.spOverall}</td>
            <td>{ratings.srs}</td>
            <td>{ratings.year || year}</td>
          </tr>
        </tbody>
      </table>
      
      {/* Add some debug info that will help during development */}
      <div className="debug-info" style={{ display: 'none' }}>
        <pre>{JSON.stringify(ratings, null, 2)}</pre>
      </div>
    </div>
  );
};

export default RatingsComponent;