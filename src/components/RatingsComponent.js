import React, { useState, useEffect } from "react";

const RatingsComponent = ({ teamName, year }) => {
  const [ratings, setRatings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRatings = async () => {
      try {
        setLoading(true);
        
        // Using the correct query format for the CFBD API
        const query = `
          query GetTeamDetailedRatings($year: Int!, $team: String!) {
            ratings(where: { year: { _eq: $year }, team: { _eq: $team } }) {
              team
              conference
              elo
              fpi
              fpiAvgWinProbabilityRank
              fpiOverallEfficiency
              spOverall
              srs
              year
            }
          }
        `;
        
        const variables = { year, team: teamName };
        
        // Make a direct API call to avoid conflicts with your teamsService implementation
        const response = await fetch('/api/proxy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          // This must match what your proxy handler is expecting
          body: JSON.stringify({ 
            endpoint: '/graphql',
            query, 
            variables 
          })
        });
        
        const data = await response.json();
        console.log("Ratings data response:", data);
        
        if (data.errors) {
          throw new Error(data.errors.map(e => e.message).join(', '));
        }
        
        // Extract the ratings data correctly based on your API response structure
        const ratingData = data.data?.ratings?.[0];
        if (!ratingData) {
          console.warn(`No ratings data found for ${teamName} in ${year}`);
        }
        
        setRatings(ratingData || {});
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