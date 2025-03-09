import React, { useState, useEffect } from "react";
import graphqlTeamsService from "../services/graphqlTeamsService";

const RatingsComponent = ({ teamName, year }) => {
  const [ratings, setRatings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRatings = async () => {
      try {
        // Using the getRatings method from the service
        const ratingData = await graphqlTeamsService.getRatingsElo(year);
        console.log("Ratings data response:", ratingData);
        
        // Find the rating for the specific team
        const teamRating = ratingData.find(rating => rating.team === teamName);
        
        if (!teamRating) {
          console.warn(`No ratings data found for ${teamName} in ${year}`);
        }
        
        setRatings(teamRating || {});
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
  if (!ratings) return <div className="ratings-no-data">No ratings data available for {teamName}.</div>;

  return (
    <div className="ratings-component">
      <h3>Detailed Ratings Data</h3>
      <table className="ratings-table">
        <thead>
          <tr>
            <th>Team</th>
            <th>Conference</th>
            <th>ELO</th>
            <th>FPI</th>
            <th>FPI Avg Win Prob Rank</th>
            <th>FPI Overall Efficiency</th>
            <th>SP+ Overall</th>
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
  );
};

export default RatingsComponent;