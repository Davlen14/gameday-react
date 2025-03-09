import React, { useState, useEffect } from "react";
import graphqlTeamsService from "../services/graphqlTeamsService";

const RatingsComponent = ({ teamName, year }) => {
  const [ratings, setRatings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRatings = async () => {
      try {
        const data = await graphqlTeamsService.getTeamRatings(teamName, year);
        setRatings(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchRatings();
  }, [teamName, year]);

  if (loading) return <div>Loading ratings data...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!ratings) return <div>No ratings data available.</div>;

  return (
    <div className="ratings-component">
      <h3>Ratings Data</h3>
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
            <td>{ratings.team}</td>
            <td>{ratings.conference}</td>
            <td>{ratings.elo}</td>
            <td>{ratings.fpi}</td>
            <td>{ratings.fpiAvgWinProbabilityRank}</td>
            <td>{ratings.fpiOverallEfficiency}</td>
            <td>{ratings.spOverall}</td>
            <td>{ratings.srs}</td>
            <td>{ratings.year}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default RatingsComponent;
