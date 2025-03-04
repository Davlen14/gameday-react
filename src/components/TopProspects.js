import React, { useEffect, useState } from "react";
import { getAllRecruits, getTeams } from "../services/teamsService";
import { FaUserCircle, FaStar, FaCheckCircle, FaSearch, FaFilter, FaAngleDown, FaSortAmountDown } from "react-icons/fa";
import "../styles/TopProspects.css";

const TopProspects = () => {
  const [prospects, setProspects] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({ position: "All", team: "" });
  const [sortConfig, setSortConfig] = useState({ key: "ranking", direction: "asc" });

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

        // Add a unique ID if not present
        const processedProspects = prospectData.map((prospect, index) => ({
          ...prospect,
          id: prospect.id || `prospect-${index}`,
        }));
        
        setProspects(processedProspects.sort((a, b) => a.ranking - b.ranking));
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
      (t) => t.school?.toLowerCase().replace(/[^a-z]/g, "") === teamName.toLowerCase().replace(/[^a-z]/g, "")
    );
    return team?.logos?.[0] || "/logos/default.png";
  };

  const renderStars = (stars) => {
    return (
      <div className="stars-container">
        {[...Array(5)].map((_, index) => (
          <FaStar 
            key={index} 
            className={`star-icon ${index < stars ? "filled" : "empty"}`} 
          />
        ))}
      </div>
    );
  };

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters({ ...filters, [name]: value });
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Sort and filter prospects
  const sortedAndFilteredProspects = React.useMemo(() => {
    let filtered = [...prospects].filter((prospect) => {
      return (
        (filters.position === "All" || prospect.position === filters.position) &&
        (filters.team === "" || (prospect.committedTo && prospect.committedTo.toLowerCase().includes(filters.team.toLowerCase())))
      );
    });

    if (sortConfig.key) {
      filtered.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    
    return filtered;
  }, [prospects, filters, sortConfig]);

  const getSortIndicator = (key) => {
    if (sortConfig.key !== key) return null;
    return (
      <FaSortAmountDown 
        className={`sort-icon ${sortConfig.direction === 'desc' ? 'flipped' : ''}`} 
      />
    );
  };

  if (loading) {
    return (
      <div className="prospects-loading">
        <div className="loading-spinner"></div>
        <p>Loading top prospects data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="prospects-error">
        <div className="error-icon">⚠️</div>
        <h2>Error Loading Data</h2>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Try Again</button>
      </div>
    );
  }

  return (
    <div className="top-prospects-container">
      <header className="prospects-header">
        <h1>Top Prospects - 2025 Class</h1>
        <div className="prospects-subtitle">
          Tracking {prospects.length} top recruits in college football
        </div>
      </header>

      <div className="filters-container">
        <div className="filter-group">
          <div className="filter-icon">
            <FaFilter />
          </div>
          <select 
            name="position" 
            value={filters.position} 
            onChange={handleFilterChange}
            className="position-filter"
          >
            <option value="All">All Positions</option>
            {[...new Set(prospects.map((p) => p.position))]
              .filter(Boolean)
              .sort()
              .map((pos) => (
                <option key={pos} value={pos}>{pos}</option>
            ))}
          </select>
        </div>

        <div className="search-container">
          <div className="search-icon">
            <FaSearch />
          </div>
          <input
            type="text"
            name="team"
            value={filters.team}
            onChange={handleFilterChange}
            placeholder="Search team commitment..."
            className="team-search"
          />
        </div>
      </div>

      {sortedAndFilteredProspects.length === 0 ? (
        <div className="no-results">
          <h3>No prospects match your search criteria</h3>
          <p>Try changing your filters or search terms</p>
          <button onClick={() => setFilters({ position: "All", team: "" })}>
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="prospects-table-container">
          <div className="prospects-count">
            Showing {sortedAndFilteredProspects.length} prospects
          </div>
          
          <table className="prospects-table">
            <thead>
              <tr>
                <th onClick={() => handleSort('ranking')} className="sortable-header">
                  Rank {getSortIndicator('ranking')}
                </th>
                <th>
                  Player
                </th>
                <th onClick={() => handleSort('position')} className="sortable-header">
                  Position {getSortIndicator('position')}
                </th>
                <th onClick={() => handleSort('height')} className="sortable-header">
                  Height {getSortIndicator('height')}
                </th>
                <th onClick={() => handleSort('weight')} className="sortable-header">
                  Weight {getSortIndicator('weight')}
                </th>
                <th onClick={() => handleSort('stars')} className="sortable-header">
                  Stars {getSortIndicator('stars')}
                </th>
                <th onClick={() => handleSort('rating')} className="sortable-header">
                  Rating {getSortIndicator('rating')}
                </th>
                <th>
                  Committed
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedAndFilteredProspects.map((prospect, index) => (
                <tr key={prospect.id} className={`prospect-row ${index % 2 === 0 ? "even" : "odd"}`}>
                  <td className="rank-cell">
                    <div className="rank-badge">
                      {prospect.ranking}
                    </div>
                  </td>
                  <td className="player-cell">
                    <div className="player-wrapper">
                      <div className="player-avatar">
                        <FaUserCircle />
                      </div>
                      <div className="player-info">
                        <div className="player-name">{prospect.name}</div>
                        <div className="player-hometown">{prospect.hometown || " "}</div>
                      </div>
                    </div>
                  </td>
                  <td className="position-cell">{prospect.position || "N/A"}</td>
                  <td>{prospect.height ? `${prospect.height} in` : "N/A"}</td>
                  <td>{prospect.weight ? `${prospect.weight} lbs` : "N/A"}</td>
                  <td className="stars-cell">
                    {renderStars(prospect.stars || 0)}
                  </td>
                  <td className="rating-cell">
                    <div className="rating-value">{prospect.rating ? prospect.rating.toFixed(2) : "N/A"}</div>
                  </td>
                  <td className="committed-cell">
                    {prospect.committedTo ? (
                      <div className="commit-box">
                        <img
                          src={getTeamLogo(prospect.committedTo)}
                          alt={`${prospect.committedTo} Logo`}
                          className="team-logo"
                        />
                        <span className="team-name">{prospect.committedTo}</span>
                        <FaCheckCircle className="commit-check" />
                      </div>
                    ) : (
                      <div className="uncommitted">Undecided</div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default TopProspects;