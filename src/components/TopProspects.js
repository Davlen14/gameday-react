import React, { useEffect, useState, useMemo } from "react";
import { getAllRecruits, getTeams } from "../services/teamsService";
import { FaUserCircle, FaStar, FaCheckCircle, FaSearch, FaFilter, FaAngleDown, 
         FaSortAmountDown, FaTrophy, FaUniversity, FaTable, FaChartBar } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";

const TopProspects = () => {
  const [prospects, setProspects] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({ position: "All", team: "", commitmentStatus: "All" });
  const [sortConfig, setSortConfig] = useState({ key: "ranking", direction: "asc" });
  const [viewMode, setViewMode] = useState("prospects"); // "prospects" or "teams"

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
      <div className="tp-stars-container">
        {[...Array(5)].map((_, index) => (
          <FaStar 
            key={index} 
            className={`tp-star-icon ${index < stars ? "tp-filled" : "tp-empty"}`} 
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
  const sortedAndFilteredProspects = useMemo(() => {
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

  // Calculate team recruiting rankings
  const teamRankings = useMemo(() => {
    const teamStats = {};
    
    // Group prospects by team
    prospects.forEach(prospect => {
      if (prospect.committedTo) {
        const teamName = prospect.committedTo.trim();
        if (!teamStats[teamName]) {
          teamStats[teamName] = {
            name: teamName,
            totalProspects: 0,
            averageRating: 0,
            totalRating: 0,
            topProspect: null,
            fiveStars: 0,
            fourStars: 0,
            threeStars: 0,
            byPosition: {},
            logo: getTeamLogo(teamName)
          };
        }
        
        // Count by stars
        if (prospect.stars === 5) teamStats[teamName].fiveStars++;
        else if (prospect.stars === 4) teamStats[teamName].fourStars++;
        else if (prospect.stars === 3) teamStats[teamName].threeStars++;
        
        // Count by position
        const position = prospect.position || 'Unknown';
        if (!teamStats[teamName].byPosition[position]) {
          teamStats[teamName].byPosition[position] = 0;
        }
        teamStats[teamName].byPosition[position]++;
        
        // Update team stats
        teamStats[teamName].totalProspects++;
        teamStats[teamName].totalRating += prospect.rating || 0;
        
        // Update top prospect
        if (!teamStats[teamName].topProspect || 
            (prospect.ranking && teamStats[teamName].topProspect.ranking > prospect.ranking)) {
          teamStats[teamName].topProspect = prospect;
        }
      }
    });
    
    // Calculate average ratings and convert to array
    const teamsArray = Object.values(teamStats).map(team => {
      team.averageRating = team.totalProspects > 0 ? team.totalRating / team.totalProspects : 0;
      
      // Calculate team score: weighted sum of 5*, 4*, and 3* recruits
      team.score = (team.fiveStars * 4) + (team.fourStars * 2) + team.threeStars;
      
      return team;
    });
    
    // Sort by recruiting score (descending)
    return teamsArray.sort((a, b) => b.score - a.score);
  }, [prospects]);

  const getSortIndicator = (key) => {
    if (sortConfig.key !== key) return null;
    return (
      <FaSortAmountDown 
        className={`tp-sort-icon ${sortConfig.direction === 'desc' ? 'tp-flipped' : ''}`} 
      />
    );
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.05
      }
    }
  };
  
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { duration: 0.3 }
    }
  };

  if (loading) {
    return (
      <div className="tp-prospects-loading">
        <div className="tp-loading-spinner"></div>
        <p>Loading top prospects data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="tp-prospects-error">
        <div className="tp-error-icon">⚠️</div>
        <h2>Error Loading Data</h2>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Try Again</button>
      </div>
    );
  }

  return (
    <div className="tp-top-prospects-container">
      <header className="tp-prospects-header">
        <h1>Top Prospects - 2025 Class</h1>
        <div className="tp-prospects-subtitle">
          Tracking {prospects.length} top recruits in college football
        </div>
      </header>

      {/* View Toggle */}
      <div className="tp-view-toggle">
        <button 
          className={`tp-view-button ${viewMode === "prospects" ? "tp-active" : ""}`}
          onClick={() => setViewMode("prospects")}
        >
          <FaUserCircle className="tp-view-icon" />
          <span>Prospects View</span>
        </button>
        <button 
          className={`tp-view-button ${viewMode === "teams" ? "tp-active" : ""}`}
          onClick={() => setViewMode("teams")}
        >
          <FaUniversity className="tp-view-icon" />
          <span>Teams Rankings</span>
        </button>
      </div>

      {viewMode === "prospects" ? (
        /* PROSPECTS VIEW */
        <>
          <div className="tp-filters-container">
            <div className="tp-filter-group">
              <select 
                name="position" 
                value={filters.position} 
                onChange={handleFilterChange}
                className="tp-position-filter"
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
                className="tp-commitment-filter"
                id="commitment-select"
              >
                <option value="All">All Commitments</option>
                <option value="Committed">Committed</option>
                <option value="Undecided">Undecided</option>
              </select>
            </div>

            <div className="tp-search-container">
              <FaSearch className="tp-search-icon" />
              <input
                type="text"
                name="team"
                value={filters.team}
                onChange={handleFilterChange}
                placeholder="Search team or type 'undecided'..."
                className="tp-team-search"
              />
            </div>
          </div>

          {sortedAndFilteredProspects.length === 0 ? (
            <div className="tp-no-results">
              <h3>No prospects match your search criteria</h3>
              <p>Try changing your filters or search terms</p>
              <button onClick={() => setFilters({ position: "All", team: "", commitmentStatus: "All" })}>
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="tp-prospects-table-container">
              <div className="tp-prospects-count">
                Showing {sortedAndFilteredProspects.length} prospects
              </div>
              
              <table className="tp-prospects-table">
                <thead>
                  <tr>
                    <th onClick={() => handleSort('ranking')} className="tp-sortable-header">
                      Rank {getSortIndicator('ranking')}
                    </th>
                    <th>
                      Player
                    </th>
                    <th onClick={() => handleSort('position')} className="tp-sortable-header">
                      Position {getSortIndicator('position')}
                    </th>
                    <th onClick={() => handleSort('height')} className="tp-sortable-header">
                      Height {getSortIndicator('height')}
                    </th>
                    <th onClick={() => handleSort('weight')} className="tp-sortable-header">
                      Weight {getSortIndicator('weight')}
                    </th>
                    <th onClick={() => handleSort('stars')} className="tp-sortable-header">
                      Stars {getSortIndicator('stars')}
                    </th>
                    <th onClick={() => handleSort('rating')} className="tp-sortable-header">
                      Rating {getSortIndicator('rating')}
                    </th>
                    <th onClick={() => handleSort('commitmentRank')} className="tp-sortable-header">
                      Committed {getSortIndicator('commitmentRank')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedAndFilteredProspects.map((prospect, index) => (
                    <motion.tr 
                      key={prospect.id} 
                      className={`tp-prospect-row ${index % 2 === 0 ? "tp-even" : "tp-odd"}`}
                      variants={itemVariants}
                      initial="hidden"
                      animate="visible"
                      transition={{ delay: index * 0.03, duration: 0.3 }}
                    >
                      <td className="tp-rank-cell">
                        <div className="tp-rank-badge">
                          {prospect.ranking}
                        </div>
                      </td>
                      <td className="tp-player-cell">
                        <div className="tp-player-wrapper">
                          <div className="tp-player-avatar">
                            <FaUserCircle />
                          </div>
                          <div className="tp-player-info">
                            <div className="tp-player-name">{prospect.name}</div>
                            <div className="tp-player-hometown">{prospect.hometown || " "}</div>
                          </div>
                        </div>
                      </td>
                      <td className="tp-position-cell">{prospect.position || "N/A"}</td>
                      <td className="tp-height-cell">{formatHeight(prospect.height)}</td>
                      <td className="tp-weight-cell">{prospect.weight ? `${prospect.weight} lbs` : "N/A"}</td>
                      <td className="tp-stars-cell">
                        {renderStars(prospect.stars || 0)}
                      </td>
                      <td className="tp-rating-cell">
                        <div className="tp-rating-value">
                          {prospect.rating ? prospect.rating.toFixed(4) : "N/A"}
                        </div>
                      </td>
                      <td className="tp-committed-cell">
                        {prospect.committedTo ? (
                          <div className="tp-commit-box">
                            <img
                              src={getTeamLogo(prospect.committedTo)}
                              alt={`${prospect.committedTo} Logo`}
                              className="tp-team-logo"
                            />
                            <span className="tp-team-name">{prospect.committedTo}</span>
                            {prospect.commitmentRank && (
                              <span className="tp-commit-rank">#{prospect.commitmentRank}</span>
                            )}
                            <FaCheckCircle className="tp-commit-check" />
                          </div>
                        ) : (
                          <div className="tp-uncommitted">Undecided</div>
                        )}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      ) : (
        /* TEAMS RANKINGS VIEW */
        <motion.div 
          className="tp-teams-ranking-container"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <div className="tp-teams-count">
            Top {teamRankings.length} Teams by Recruiting Class
          </div>
          
          <div className="tp-teams-grid">
            {teamRankings.slice(0, 25).map((team, index) => (
              <motion.div 
                key={team.name} 
                className="tp-team-card"
                variants={itemVariants}
              >
                <div className="tp-team-card-header">
                  <div className="tp-team-rank">#{index + 1}</div>
                  <img 
                    src={team.logo} 
                    alt={`${team.name} logo`}
                    className="tp-team-card-logo" 
                  />
                  <h3 className="tp-team-card-name">{team.name}</h3>
                </div>
                <div className="tp-team-card-body">
                  <div className="tp-team-stats">
                    <div className="tp-team-stat">
                      <span className="tp-stat-label">Total Commits</span>
                      <span className="tp-stat-value">{team.totalProspects}</span>
                    </div>
                    <div className="tp-team-stat">
                      <span className="tp-stat-label">Class Score</span>
                      <span className="tp-stat-value">{team.score.toFixed(1)}</span>
                    </div>
                    <div className="tp-team-stat">
                      <span className="tp-stat-label">Avg Rating</span>
                      <span className="tp-stat-value">
                        {team.averageRating.toFixed(4)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="tp-star-breakdown">
                    <div className="tp-star-group">
                      <div className="tp-star-label">⭐⭐⭐⭐⭐</div>
                      <div className="tp-star-count">{team.fiveStars}</div>
                    </div>
                    <div className="tp-star-group">
                      <div className="tp-star-label">⭐⭐⭐⭐</div>
                      <div className="tp-star-count">{team.fourStars}</div>
                    </div>
                    <div className="tp-star-group">
                      <div className="tp-star-label">⭐⭐⭐</div>
                      <div className="tp-star-count">{team.threeStars}</div>
                    </div>
                  </div>
                  
                  {team.topProspect && (
                    <div className="tp-top-prospect">
                      <div className="tp-top-prospect-label">Top Commit</div>
                      <div className="tp-top-prospect-info">
                        <div className="tp-top-prospect-rank">#{team.topProspect.ranking}</div>
                        <div className="tp-top-prospect-name">{team.topProspect.name}</div>
                        <div className="tp-top-prospect-position">{team.topProspect.position}</div>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Custom CSS */}
      <style>{`
        /* Base container - full width */
        .tp-top-prospects-container {
            width: 100%;
            max-width: 100%;
            margin: 0;
            padding: 1rem; 
            font-family: "Orbitron", "Titillium Web", sans-serif;
            color: #333;
            background-color: #ffffff;
        }

        /* Title section */
        .tp-prospects-header {
            text-align: center;
            margin-bottom: 2rem;
        }

        .tp-prospects-header h1 {
            font-family: "Orbitron", sans-serif;
            font-size: 2.2rem;
            margin: 0 0 0.5rem 0;
            color: #1a1a1a;
            letter-spacing: 1px;
            text-transform: uppercase;
            font-weight: 800;
        }

        .tp-prospects-subtitle {
            font-size: 1rem;
            color: #64748b;
            font-weight: 400;
            font-family: "Titillium Web", sans-serif;
        }

        /* View Toggle */
        .tp-view-toggle {
            display: flex;
            justify-content: center;
            margin: 1.5rem auto;
            background: #f8f9fa;
            padding: 8px;
            border-radius: 12px;
            width: fit-content;
            gap: 8px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        }

        .tp-view-button {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 10px 20px;
            border: none;
            border-radius: 8px;
            background: transparent;
            font-family: "Orbitron", sans-serif;
            font-size: 14px;
            font-weight: 600;
            color: #666;
            cursor: pointer;
            transition: all 0.2s;
        }

        .tp-view-button.tp-active {
            background: linear-gradient(135deg, #D4001C, #ff4d6d);
            color: white;
            box-shadow: 0 2px 8px rgba(212, 0, 28, 0.2);
        }

        .tp-view-icon {
            font-size: 16px;
        }

        /* FILTERS SECTION */
        .tp-filters-container {
            display: flex;
            justify-content: center;
            gap: 1rem;
            margin: 2rem auto;
            width: 90%;
            max-width: 800px;
        }

        /* Position Filter - Modernized & Fixed */
        .tp-filter-group {
            flex: 1;
            position: relative;
            max-width: 300px;
            z-index: 5; /* Keep above other elements */
        }

        .tp-position-filter,
        .tp-commitment-filter {
            width: 100%;
            padding: 12px 15px;
            font-family: "Titillium Web", sans-serif;
            font-size: 0.95rem;
            font-weight: 400;
            color: #333;
            background-color: #fff;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            -webkit-appearance: none;
            -moz-appearance: none;
            appearance: none;
            cursor: pointer;
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
            transition: all 0.2s ease;
            background-image: url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23D4001C' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");
            background-repeat: no-repeat;
            background-position: calc(100% - 15px) center;
            background-size: 12px;
            padding-right: 40px;
            height: 44px;
            margin-bottom: 8px;
        }

        .tp-position-filter:hover,
        .tp-commitment-filter:hover {
            border-color: #D4001C;
        }

        .tp-position-filter:focus,
        .tp-commitment-filter:focus {
            outline: none;
            border-color: #D4001C;
            box-shadow: 0 0 0 2px rgba(212, 0, 28, 0.1);
        }

        /* Search Box - Modernized */
        .tp-search-container {
            flex: 1.5;
            position: relative;
            max-width: 450px;
        }

        .tp-search-icon {
            position: absolute;
            left: 15px;
            top: 50%;
            transform: translateY(-50%);
            color: #D4001C;
            font-size: 0.9rem;
            z-index: 10;
        }

        .tp-team-search {
            width: 100%;
            padding: 12px 15px 12px 40px;
            font-family: "Titillium Web", sans-serif;
            font-size: 0.95rem;
            color: #333;
            background-color: #fff;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
            transition: all 0.2s ease;
            height: 44px;
        }

        .tp-team-search:hover {
            border-color: #D4001C;
        }

        .tp-team-search:focus {
            outline: none;
            border-color: #D4001C;
            box-shadow: 0 0 0 2px rgba(212, 0, 28, 0.1);
        }

        .tp-team-search::placeholder {
            color: #94a3b8;
            font-style: italic;
        }

        /* Prospects count */
        .tp-prospects-count,
        .tp-teams-count {
            text-align: center;
            font-size: 1.1rem;
            color: #666;
            margin-bottom: 1.5rem;
            padding: 0 1rem;
            width: 100%;
            max-width: calc(100% - 2rem);
            font-family: "Orbitron", sans-serif;
            font-weight: 500;
        }

        /* TABLE CONTAINER */
        .tp-prospects-table-container {
            width: 100%;
            overflow: hidden;
            background: white;
            border-radius: 12px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            margin: 0 auto;
        }

        /* TABLE - FIXED STRUCTURE */
        .tp-prospects-table {
            width: 100%;
            border-collapse: collapse;
            border-spacing: 0;
            table-layout: fixed; /* Force fixed layout */
        }

        /* HEADER ROW */
        .tp-prospects-table thead {
            background-color: #fff;
            font-family: "Orbitron", sans-serif;
        }

        .tp-prospects-table thead tr {
            display: flex;
            width: 100%;
            border-bottom: 1px solid #eee;
        }

        .tp-prospects-table th {
            padding: 12px 8px;
            text-align: left;
            font-size: 0.85rem;
            font-weight: 700;
            color: #666;
            text-transform: uppercase;
            letter-spacing: 1px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            display: block;
        }

        /* Column widths */
        .tp-prospects-table th:nth-child(1), .tp-prospects-table td:nth-child(1) { width: 8%; } /* Rank */
        .tp-prospects-table th:nth-child(2), .tp-prospects-table td:nth-child(2) { width: 22%; } /* Player */
        .tp-prospects-table th:nth-child(3), .tp-prospects-table td:nth-child(3) { width: 10%; } /* Position */
        .tp-prospects-table th:nth-child(4), .tp-prospects-table td:nth-child(4) { width: 8%; } /* Height */
        .tp-prospects-table th:nth-child(5), .tp-prospects-table td:nth-child(5) { width: 9%; } /* Weight */
        .tp-prospects-table th:nth-child(6), .tp-prospects-table td:nth-child(6) { width: 15%; } /* Stars */
        .tp-prospects-table th:nth-child(7), .tp-prospects-table td:nth-child(7) { width: 8%; } /* Rating */
        .tp-prospects-table th:nth-child(8), .tp-prospects-table td:nth-child(8) { width: 20%; } /* Committed */

        .tp-sortable-header {
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 5px;
        }

        .tp-sort-icon {
            font-size: 0.8rem;
            color: #d40020;
        }

        .tp-sort-icon.tp-flipped {
            transform: rotate(180deg);
        }

        /* DATA ROWS */
        .tp-prospects-table tbody tr {
            display: flex;
            width: 100%;
            border-bottom: 1px solid #eee;
        }

        .tp-prospects-table tbody tr:last-child {
            border-bottom: none;
        }

        .tp-prospects-table tbody tr:nth-child(even) {
            background-color: #f8f9fa;
        }

        .tp-prospects-table td {
            padding: 12px 8px;
            font-size: 0.9rem;
            color: #333;
            font-family: "Titillium Web", sans-serif;
            display: block;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        /* MODERNIZED RANK COLUMN */
        .tp-rank-cell {
            text-align: center;
            display: flex;
            justify-content: center;
            align-items: center;
        }

        .tp-rank-badge {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 36px;
            height: 36px;
            background: linear-gradient(135deg, #D4001C, #ff4d6d);
            border-radius: 50%;
            color: white;
            font-family: "Orbitron", sans-serif;
            font-weight: 700;
            font-size: 0.95rem;
            box-shadow: 0 2px 6px rgba(212, 0, 28, 0.3);
        }

        /* PLAYER COLUMN */
        .tp-player-wrapper {
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .tp-player-avatar {
            width: 32px;
            height: 32px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #f0f0f0;
            border-radius: 50%;
            color: #666;
            font-size: 1.2rem;
            flex-shrink: 0;
        }

        .tp-player-info {
            display: flex;
            flex-direction: column;
            overflow: hidden;
        }

        .tp-player-name {
            font-weight: 600;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .tp-player-hometown {
            font-size: 0.75rem;
            color: #666;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        /* POSITION COLUMN */
        .tp-position-cell {
            font-weight: 600;
        }

        /* HEIGHT COLUMN - Modernized */
        .tp-height-cell {
            font-family: "Titillium Web", sans-serif;
        }

        /* STARS COLUMN */
        .tp-stars-container {
            display: flex;
            gap: 2px;
        }

        .tp-star-icon {
            font-size: 0.9rem;
        }

        .tp-star-icon.tp-filled {
            color: #fbbf24;
        }

        .tp-star-icon.tp-empty {
            color: #ddd;
        }

        /* RATING COLUMN - Modernized */
        .tp-rating-cell {
            text-align: center;
        }

        .tp-rating-value {
            font-family: "Orbitron", sans-serif;
            font-weight: 700;
            background: linear-gradient(135deg, #f8fafc, #e2e8f0);
            padding: 5px 8px;
            border-radius: 6px;
            border: 1px solid #e2e8f0;
            color: #1e293b;
            box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
            display: inline-block;
        }

        /* COMMITTED COLUMN */
        .tp-commit-box {
            display: flex;
            align-items: center;
            gap: 8px;
            background: #f8f8f8;
            border-radius: 6px;
            border: 1px solid #eee;
            padding: 4px 8px;
            max-width: 100%;
        }

        .tp-team-logo {
            width: 30px;
            height: 30px;
            object-fit: contain;
            flex-shrink: 0;
        }

        .tp-team-name {
            font-weight: 600;
            flex-grow: 1;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .tp-commit-check {
            color: #22c55e;
            flex-shrink: 0;
        }

        .tp-uncommitted {
            display: inline-block;
            background: #f0f0f0;
            color: #666;
            font-weight: 600;
            padding: 6px 12px;
            border-radius: 6px;
        }
        
        /* Commit rank badge */
        .tp-commit-rank {
            background: #c6c6c6;
            color: white;
            font-size: 0.7rem;
            padding: 2px 4px;
            border-radius: 4px;
            font-weight: bold;
        }

        /* TEAM RANKINGS GRID */
        .tp-teams-ranking-container {
            width: 100%;
            margin: 2rem auto;
        }

        .tp-teams-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
            gap: 20px;
        }

        .tp-team-card {
            background: white;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
            transition: all 0.3s;
        }

        .tp-team-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
        }

        .tp-team-card-header {
            background: linear-gradient(135deg, #D4001C, #ff4d6d);
            color: white;
            padding: 16px;
            position: relative;
            display: flex;
            align-items: center;
            gap: 12px;
        }

        .tp-team-rank {
            background: rgba(255, 255, 255, 0.2);
            border-radius: 50%;
            width: 36px;
            height: 36px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: "Orbitron", sans-serif;
            font-weight: 800;
            font-size: 16px;
        }

        .tp-team-card-logo {
            width: 40px;
            height: 40px;
            object-fit: contain;
            background: rgba(255, 255, 255, 0.9);
            padding: 4px;
            border-radius: 8px;
        }

        .tp-team-card-name {
            font-family: "Orbitron", sans-serif;
            font-size: 18px;
            font-weight: 600;
            margin: 0;
            text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
        }

        .tp-team-card-body {
            padding: 16px;
        }

        .tp-team-stats {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 8px;
            margin-bottom: 16px;
        }

        .tp-team-stat {
            display: flex;
            flex-direction: column;
            background: #f8f9fa;
            padding: 10px;
            border-radius: 8px;
            text-align: center;
        }

        .tp-stat-label {
            font-size: 12px;
            color: #666;
            margin-bottom: 4px;
        }

        .tp-stat-value {
            font-family: "Orbitron", sans-serif;
            font-weight: 700;
            font-size: 18px;
            color: #1a1a1a;
        }

        .tp-star-breakdown {
            display: flex;
            justify-content: space-between;
            margin: 16px 0;
            background: #f8f9fa;
            padding: 12px;
            border-radius: 8px;
        }

        .tp-star-group {
            display: flex;
            flex-direction: column;
            align-items: center;
        }

        .tp-star-label {
            font-size: 14px;
            margin-bottom: 4px;
        }

        .tp-star-count {
            font-family: "Orbitron", sans-serif;
            font-weight: 700;
            font-size: 20px;
            color: #1a1a1a;
        }

        .tp-top-prospect {
            margin-top: 16px;
            border-top: 1px solid #eee;
            padding-top: 16px;
        }

        .tp-top-prospect-label {
            font-size: 14px;
            color: #666;
            margin-bottom: 8px;
            font-weight: 600;
        }

        .tp-top-prospect-info {
            display: flex;
            align-items: center;
            gap: 8px;
            background: #f0f0f0;
            padding: 8px 12px;
            border-radius: 8px;
        }

        .tp-top-prospect-rank {
            background: #D4001C;
            color: white;
            font-weight: 700;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 14px;
        }

        .tp-top-prospect-name {
            font-weight: 600;
            flex-grow: 1;
        }

        .tp-top-prospect-position {
            background: #333;
            color: white;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: 600;
        }

        /* LOADING STATE */
        .tp-prospects-loading {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 300px;
            gap: 1.5rem;
            text-align: center;
            padding: 2rem;
        }

        .tp-loading-spinner {
            width: 50px;
            height: 50px;
            border: 4px solid rgba(212, 0, 28, 0.2);
            border-left-color: #D4001C;
            border-radius: 50%;
            animation: tp-spin 1s linear infinite;
        }

        @keyframes tp-spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }

        /* ERROR STATE */
        .tp-prospects-error {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 300px;
            gap: 1rem;
            text-align: center;
            padding: 2rem;
        }

        .tp-error-icon {
            font-size: 3rem;
            margin-bottom: 1rem;
        }

        .tp-prospects-error h2 {
            font-family: "Orbitron", sans-serif;
            color: #D4001C;
            margin: 0;
        }

        .tp-prospects-error button {
            margin-top: 1rem;
            padding: 0.75rem 1.5rem;
            background: #D4001C;
            color: white;
            border: none;
            border-radius: 8px;
            font-family: "Orbitron", sans-serif;
            font-weight: 600;
            cursor: pointer;
        }

        .tp-prospects-error button:hover {
            background: #ff0022;
        }

        /* NO RESULTS */
        .tp-no-results {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 200px;
            padding: 2rem;
            text-align: center;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            width: 100%;
        }

        .tp-no-results h3 {
            font-family: "Orbitron", sans-serif;
            font-weight: 700;
            color: #333;
            margin: 0 0 0.5rem 0;
        }

        .tp-no-results p {
            color: #666;
            margin-bottom: 1.5rem;
        }

        .tp-no-results button {
            padding: 0.75rem 1.5rem;
            background: #D4001C;
            color: white;
            border: none;
            border-radius: 8px;
            font-family: "Orbitron", sans-serif;
            font-weight: 600;
            cursor: pointer;
        }

        .tp-no-results button:hover {
            background: #ff0022;
        }

        /* RESPONSIVE STYLES */
        @media (max-width: 768px) {
            .tp-filters-container {
                flex-direction: column;
                align-items: stretch;
                max-width: 100%;
            }
            
            .tp-filter-group, .tp-search-container {
                width: 100%;
                max-width: 100%;
            }
            
            .tp-prospects-table-container {
                overflow-x: auto;
            }
            
            .tp-prospects-table th,
            .tp-prospects-table td {
                min-width: 100px; /* Ensure minimum width for small screens */
            }
            
            .tp-teams-grid {
                grid-template-columns: 1fr;
            }
        }
      `}</style>
    </div>
  );
};

export default TopProspects;