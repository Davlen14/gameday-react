import React, { useEffect, useState } from "react";
import { getAllRecruits, getTeams } from "../services/teamsService";
import { FaUserCircle, FaStar } from "react-icons/fa"; // Player Icon & Star Rating
import "../styles/TopProspects.css";

const TopProspects = () => {
  const [prospects, setProspects] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [prospectData, teamData] = await Promise.all([
          getAllRecruits(2025),
          getTeams(),
        ]);

        if (!prospectData || !teamData) {
          throw new Error("Failed to fetch data");
        }

        setProspects(prospectData.sort((a, b) => a.ranking - b.ranking));
        setTeams(teamData);
      } catch (error) {
        console.error("Error fetching data:", error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getTeamLogo = (teamName) => {
    if (!teamName) return "/logos/default.png";
    const team = teams.find(
      (t) => t.school.toLowerCase().replace(/[^a-z]/g, "") === teamName.toLowerCase().replace(/[^a-z]/g, "")
    );
    return team?.logos?.[0] || "/logos/default.png";
  };

  const renderStars = (stars) => {
    return [...Array(stars)].map((_, index) => (
      <FaStar key={index} className="star-icon" />
    ));
  };

  return (
    <div className="top-prospects-container">
      <h1>Top Prospects - 2025 Class</h1>

      {loading ? (
        <p>Loading prospects...</p>
      ) : error ? (
        <p className="error-message">⚠️ {error}</p>
      ) : prospects.length === 0 ? (
        <p>No prospects available at the moment.</p>
      ) : (
        <div className="prospect-list">
          {prospects.map((prospect) => (
            <div key={prospect.id} className="prospect-item">
              {/* Rank Number */}
              <div className="prospect-rank">#{prospect.ranking}</div>

              {/* Player Headshot (Placeholder) */}
              <div className="prospect-photo">
                <FaUserCircle className="player-icon" />
              </div>

              {/* Player Details */}
              <div className="prospect-info">
                <h2>{prospect.name}</h2>
                <p className="prospect-details">
                  <span className="position">{prospect.position}</span> | {prospect.height} in | {prospect.weight} lbs
                </p>
                <p className="stars-rating">
                  {renderStars(prospect.stars)} {prospect.rating.toFixed(4)}
                </p>
              </div>

              {/* Committed Team */}
              <div className="prospect-commit">
                {prospect.committedTo ? (
                  <>
                    <img
                      src={getTeamLogo(prospect.committedTo)}
                      alt={`${prospect.committedTo} Logo`}
                      className="team-logo"
                    />
                    <span className="committed-team">{prospect.committedTo}</span>
                  </>
                ) : (
                  <span className="uncommitted">Undecided</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TopProspects;

