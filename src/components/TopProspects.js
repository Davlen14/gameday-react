import React, { useEffect, useState } from "react";
import { getAllRecruits } from "../services/teamsService"; // Import API function
import "../styles/TopProspects.css";

// Function to fetch team logos (adjust based on how you're storing them)
const getTeamLogo = (teamName) => {
  return teamName
    ? `/logos/${teamName.replace(/\s+/g, "-").toLowerCase()}.png`
    : "/logos/default.png";
};

const TopProspects = () => {
  const [prospects, setProspects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProspects = async () => {
      try {
        const data = await getAllRecruits(2025);
        setProspects(data.sort((a, b) => a.ranking - b.ranking)); // Sort by ranking
      } catch (error) {
        console.error("Error fetching prospects:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProspects();
  }, []);

  return (
    <div className="top-prospects-container">
      <h1>Top Prospects - 2025 Class</h1>
      {loading ? (
        <p>Loading prospects...</p>
      ) : (
        <div className="prospect-grid">
          {prospects.map((prospect) => (
            <div key={prospect.id} className="prospect-card">
              <img
                src={getTeamLogo(prospect.committedTo)}
                alt={`${prospect.committedTo} Logo`}
                className="team-logo"
              />
              <div className="prospect-info">
                <h2>{prospect.ranking}. {prospect.name}</h2>
                <p><strong>Position:</strong> {prospect.position}</p>
                <p><strong>Height:</strong> {prospect.height} in</p>
                <p><strong>Weight:</strong> {prospect.weight} lbs</p>
                <p><strong>Committed To:</strong> {prospect.committedTo || "Undecided"}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TopProspects;