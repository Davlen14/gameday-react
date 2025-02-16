import React, { useEffect, useState } from "react";
import { getAllRecruits, getTeams } from "../services/teamsService";
import { FaUserCircle, FaStar, FaCheckCircle, FaSearch } from "react-icons/fa"; // Icons
import "../styles/TopProspects.css";

const TopProspects = () => {
  const [prospects, setProspects] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({ position: "All", team: "" });

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
    return (
      <div className="stars-container">
        {[...Array(stars)].map((_, index) => (
          <FaStar key={index} className="star-icon small-star" />
        ))}
      </div>
    );
  };

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters({ ...filters, [name]: value });
  };

  const filteredProspects = prospects.filter((prospect) => {
    return (
      (filters.position === "All" || prospect.position === filters.position) &&
      (filters.team === "" || prospect.committedTo?.toLowerCase().includes(filters.team.toLowerCase()))
    );
  });

  return (
    <div className="top-prospects-container">
      <h1>Top Prospects - 2025 Class</h1>

      {/* Filtering Options */}
      <div className="filters-container">
        <select name="position" value={filters.position} onChange={handleFilterChange}>
          <option value="All">All Positions</option>
          {[...new Set(prospects.map((p) => p.position))].map((pos) => (
            <option key={pos} value={pos}>{pos}</option>
          ))}
        </select>

        <div className="team-search">
          <FaSearch className="search-icon" />
          <input
            type="text"
            name="team"
            value={filters.team}
            onChange={handleFilterChange}
            placeholder="Search team..."
          />
        </div>
      </div>

      {loading ? (
        <p>Loading prospects...</p>
      ) : error ? (
        <p className="error-message">⚠️ {error}</p>
      ) : prospects.length === 0 ? (
        <p>No prospects available at the moment.</p>
      ) : (
        <table className="prospects-table">
          <thead>
            <tr>
              <th>Rank</th>
              <th>Player</th>
              <th>Position</th>
              <th>Height</th>
              <th>Weight</th>
              <th>Stars</th>
              <th>Rating</th>
              <th>Committed</th>
            </tr>
          </thead>
          <tbody>
            {filteredProspects.map((prospect, index) => (
              <tr key={prospect.id} className={`prospect-row ${index % 2 === 0 ? "even" : "odd"}`}>
                <td>#{prospect.ranking}</td>
                <td className="player-cell">
                  <div className="player-wrapper">
                    <FaUserCircle className="player-icon" />
                    <span className="player-name">{prospect.name}</span>
                  </div>
                </td>
                <td>{prospect.position}</td>
                <td>{prospect.height} in</td>
                <td>{prospect.weight} lbs</td>
                <td className="stars-cell">
                  <div className="stars-wrapper">{renderStars(prospect.stars)}</div>
                </td>
                <td>{prospect.rating.toFixed(4)}</td>
                <td className="committed-cell">
                  {prospect.committedTo ? (
                    <div className="commit-box">
                      <img
                        src={getTeamLogo(prospect.committedTo)}
                        alt={`${prospect.committedTo} Logo`}
                        className="team-logo"
                      />
                      <span>{prospect.committedTo}</span>
                      <FaCheckCircle className="commit-check" />
                    </div>
                  ) : (
                    <span className="uncommitted">Undecided</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default TopProspects;





