import React, { useEffect, useState } from "react";
import { getAllRecruits, getTeams } from "../services/teamsService"; // Import getTeams for team logos
import "../styles/TopProspects.css";

const TopProspects = () => {
  const [prospects, setProspects] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch recruits and teams concurrently
        const [prospectData, teamData] = await Promise.all([
          getAllRecruits(2025),
          getTeams(),
        ]);

        setProspects(prospectData.sort((a, b) => a.ranking - b.ranking));
        setTeams(teamData);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Function to get the team logo dynamically
  const getTeamLogo = (teamName) => {
    if (!teamName) return "/logos/default.png"; // Default logo for undecided players
    const team = teams.find((t) => t.school.toLowerCase() === teamName.toLowerCase());
    return team?.logos?.[0] || "/logos/default.png"; // Return team logo if found, otherwise default
  };

  return (
    <div className="top-prospects-container">
      <h1>Top Prospects - 2025 Class</h1>
      {loading ? (
        <p>Loading prospects...</p>
      ) : (
        <div className="prospect-grid">
          {prospects.map((prospect) => (
            <div key={prospect.id} className="prospect-card">
              {/* Team Logo */}
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