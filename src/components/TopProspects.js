import React, { useEffect, useState } from "react";
import { getAllRecruits, getTeams } from "../services/teamsService";
import { FaUserCircle, FaStar, FaCheckCircle, FaSearch, FaFilter, FaAngleDown, FaSortAmountDown } from "react-icons/fa";
import "../styles/TopProspects.css";

const TopProspects = () => {
  const [prospects, setProspects] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({ position: "All", team: "", commitmentStatus: "All" });
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

        // Add a unique ID if not present and process commitment ranks
        const committedProspects = {};
        
        // First pass to count committed prospects per team
        prospectData.forEach(prospect => {
          if (prospect.committedTo) {
            const teamName = prospect.committedTo.trim().toLowerCase();
            if (!committedProspects[teamName]) {
              committedProspects[teamName] = [];
            }
            committedProspects[teamName].push(prospect);
          }
        });
        
        // Sort each team's commits by ranking and assign commitment rank
        Object.keys(committedProspects).forEach(team => {
          committedProspects[team].sort((a, b) => a.ranking - b.ranking);
          committedProspects[team].forEach((prospect, index) => {
            prospect.commitmentRank = index + 1;
          });
        });
        
        // Process all prospects with unique IDs
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

  // Convert inches to feet and inches
  const formatHeight = (inches) => {
    if (!inches) return "N/A";
    
    const feet = Math.floor(inches / 12);
    const remainingInches = inches % 12;
    
    return `${feet}'${remainingInches}"`;
  };

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
      // Filter by position
      const positionMatch = filters.position === "All" || prospect.position === filters.position;
      
      // Filter by commitment status
      let commitmentMatch = true;
      if (filters.commitmentStatus === "Committed") {
        commitmentMatch = prospect.committedTo && prospect.committedTo.trim() !== "";
      } else if (filters.commitmentStatus === "Undecided") {
        commitmentMatch = !prospect.committedTo || prospect.committedTo.trim() === "";
      }
      
      // Filter by team name (only if not searching specifically for undecided)
      let teamMatch = true;
      if (filters.team !== "") {
        if (filters.team.toLowerCase() === "undecided") {
          teamMatch = !prospect.committedTo || prospect.committedTo.trim() === "";
        } else {
          teamMatch = prospect.committedTo && prospect.committedTo.toLowerCase().includes(filters.team.toLowerCase());
        }
      }
      
      return positionMatch && commitmentMatch && teamMatch;
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
          <select 
            name="position" 
            value={filters.position} 
            onChange={handleFilterChange}
            className="position-filter"
            id="position-select"
          >
            <option value="All">All Positions</option>
            {[...new Set(prospects.map((p) => p.position))]
              .filter(Boolean)
              .sort()
              .map((pos) => (
                <option key={pos} value={pos}>{pos}</option>
              ))}
          </select>
          
          <select 
            name="commitmentStatus" 
            value={filters.commitmentStatus} 
            onChange={handleFilterChange}
            className="commitment-filter"
            id="commitment-select"
          >
            <option value="All">All Commitments</option>
            <option value="Committed">Committed</option>
            <option value="Undecided">Undecided</option>
          </select>
        </div>

        <div className="search-container">
          <FaSearch className="search-icon" />
          <input
            type="text"
            name="team"
            value={filters.team}
            onChange={handleFilterChange}
            placeholder="Search team or type 'undecided'..."
            className="team-search"
          />
        </div>
      </div>

      {sortedAndFilteredProspects.length === 0 ? (
        <div className="no-results">
          <h3>No prospects match your search criteria</h3>
          <p>Try changing your filters or search terms</p>
          <button onClick={() => setFilters({ position: "All", team: "", commitmentStatus: "All" })}>
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
                <th onClick={() => handleSort('commitmentRank')} className="sortable-header">
                  Committed {getSortIndicator('commitmentRank')}
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
                  <td className="height-cell">{formatHeight(prospect.height)}</td>
                  <td>{prospect.weight ? `${prospect.weight} lbs` : "N/A"}</td>
                  <td className="stars-cell">
                    {renderStars(prospect.stars || 0)}
                  </td>
                  <td className="rating-cell">
                    <div className="rating-value">
                      {prospect.rating ? prospect.rating.toFixed(4) : "N/A"}
                    </div>
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
                        {prospect.commitmentRank && (
                          <span className="commit-rank">#{prospect.commitmentRank}</span>
                        )}
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