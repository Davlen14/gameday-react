import React, { useState, useEffect, useMemo, useRef } from "react";
import { getAllRecruits, getTeams } from "../services/teamsService";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FaStar, 
  FaFilter, 
  FaLayerGroup, 
  FaSearch, 
  FaInfoCircle, 
  FaMapMarkedAlt,
  FaTrophy,
  FaFootballBall,
  FaSyncAlt,
  FaChartBar
} from "react-icons/fa";
import "../styles/Commitments.css";

// Helper: create custom marker icon for a given star rating
const createStarIcon = (starRating) => {
  const colors = {
    3: "#4287f5", // Blue
    4: "#f5a742", // Orange
    5: "#f54242", // Red
  };

  return L.divIcon({
    className: `star-marker star-${starRating}`,
    html: `
      <div class="marker-container">
        <div class="pulse-ring" style="background-color: ${colors[starRating] || "#888"}"></div>
        <div class="star-badge" style="background-color: ${colors[starRating] || "#888"}">
          ${starRating}★
        </div>
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });
};

const Commitments = () => {
  const [prospects, setProspects] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    position: "All",
    stars: 0,
    team: "",
    committed: "all", // options: "all", "committed", "uncommitted"
  });
  const [mapMode, setMapMode] = useState("markers"); // modes: markers, heatmap, clusters
  const [activeProspect, setActiveProspect] = useState(null);
  const [statsVisible, setStatsVisible] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const mapRef = useRef(null);

  // Fetch recruits and team data
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

        // Process the data: assign an id if missing
        const processedProspects = prospectData.map((prospect, index) => ({
          ...prospect,
          id: prospect.id || `prospect-${index}`,
        }));

        setProspects(processedProspects);
        setTeams(teamData);
        setMapReady(true);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Apply filters to prospects
  const filteredProspects = useMemo(() => {
    return prospects.filter((prospect) => {
      // Filter by position
      if (filters.position !== "All" && prospect.position !== filters.position) {
        return false;
      }
      // Filter by star rating
      if (filters.stars > 0 && prospect.stars < filters.stars) {
        return false;
      }
      // Filter by team (school search)
      if (
        filters.team &&
        (!prospect.committedTo ||
          !prospect.committedTo.toLowerCase().includes(filters.team.toLowerCase()))
      ) {
        return false;
      }
      // Filter by commitment status
      if (
        (filters.committed === "committed" && !prospect.committedTo) ||
        (filters.committed === "uncommitted" && prospect.committedTo)
      ) {
        return false;
      }
      return true;
    });
  }, [prospects, filters]);

  // Calculate team statistics from committed prospects
  const teamStats = useMemo(() => {
    const stats = {};
    const committedProspects = prospects.filter(p => p.committedTo);

    committedProspects.forEach(prospect => {
      const team = prospect.committedTo;
      if (!stats[team]) {
        stats[team] = {
          name: team,
          count: 0,
          avgStars: 0,
          totalStars: 0,
          fiveStars: 0,
          fourStars: 0,
          threeStars: 0,
          positions: {}
        };
      }
      stats[team].count++;
      stats[team].totalStars += prospect.stars || 0;
      if (prospect.stars === 5) stats[team].fiveStars++;
      if (prospect.stars === 4) stats[team].fourStars++;
      if (prospect.stars === 3) stats[team].threeStars++;
      if (prospect.position) {
        stats[team].positions[prospect.position] = (stats[team].positions[prospect.position] || 0) + 1;
      }
    });

    Object.keys(stats).forEach(team => {
      stats[team].avgStars = stats[team].totalStars / stats[team].count;
    });

    return Object.values(stats).sort((a, b) => b.count - a.count);
  }, [prospects]);

  // Get team logo based on school name
  const getTeamLogo = (teamName) => {
    if (!teamName) return "/logos/default.png";
    const team = teams.find(
      (t) => t.school?.toLowerCase().replace(/[^a-z]/g, "") === teamName.toLowerCase().replace(/[^a-z]/g, "")
    );
    return team?.logos?.[0] || "/logos/default.png";
  };

  // Aggregate state-level data (for potential heatmap logic)
  const stateData = useMemo(() => {
    const states = {};
    filteredProspects.forEach(prospect => {
      if (prospect.stateProvince) {
        if (!states[prospect.stateProvince]) {
          states[prospect.stateProvince] = {
            count: 0,
            totalStars: 0,
            prospects: []
          };
        }
        states[prospect.stateProvince].count++;
        states[prospect.stateProvince].totalStars += prospect.stars || 0;
        states[prospect.stateProvince].prospects.push(prospect);
      }
    });
    Object.keys(states).forEach(state => {
      states[state].avgStars = states[state].totalStars / states[state].count;
    });
    return states;
  }, [filteredProspects]);

  // Handle filter changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: name === "stars" ? parseInt(value) : value
    }));
  };

  // Switch map mode (markers, clusters, heatmap)
  const handleMapModeChange = (mode) => {
    setMapMode(mode);
  };

  // Reset map view to default center/zoom
  const resetMapView = () => {
    if (mapRef.current) {
      mapRef.current.setView([39.8283, -98.5795], 4);
    }
  };

  // Toggle the stats panel visibility
  const toggleStats = () => {
    setStatsVisible((prev) => !prev);
  };

  // Loading and error handling
  if (loading) {
    return (
      <div className="commitments-loading">
        <div className="loading-spinner"></div>
        <p>Loading recruiting map data...</p>
      </div>
    );
  }
  if (error) {
    return (
      <div className="commitments-error">
        <div className="error-icon">⚠️</div>
        <h2>Error Loading Map Data</h2>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Try Again</button>
      </div>
    );
  }

  return (
    <div className="commitments-container">
      <header className="commitments-header">
        <h1>2025 Recruiting Map</h1>
        <div className="commitments-subtitle">
          Visualizing the geographic distribution of top football recruits
        </div>
      </header>

      <div className="map-controls">
        <div className="map-toolbar">
          <div className="map-modes">
            <button 
              className={`mode-button ${mapMode === 'markers' ? 'active' : ''}`}
              onClick={() => handleMapModeChange('markers')}
            >
              <FaMapMarkedAlt /> Markers
            </button>
            <button 
              className={`mode-button ${mapMode === 'clusters' ? 'active' : ''}`}
              onClick={() => handleMapModeChange('clusters')}
            >
              <FaFootballBall /> Clusters
            </button>
          </div>
          <div className="map-actions">
            <button className="action-button" onClick={resetMapView}>
              <FaSyncAlt /> Reset View
            </button>
            <button 
              className={`action-button ${statsVisible ? 'active' : ''}`} 
              onClick={toggleStats}
            >
              <FaChartBar /> {statsVisible ? 'Hide Stats' : 'Show Stats'}
            </button>
          </div>
        </div>
        <div className="filter-controls">
          <div className="filter-group">
            <label htmlFor="position-select">Position:</label>
            <select
              id="position-select"
              name="position"
              value={filters.position}
              onChange={handleFilterChange}
              className="filter-select"
            >
              <option value="All">All Positions</option>
              {[...new Set(prospects.map(p => p.position))]
                .filter(Boolean)
                .sort()
                .map(pos => (
                  <option key={pos} value={pos}>{pos}</option>
                ))}
            </select>
          </div>
          <div className="filter-group">
            <label htmlFor="stars-select">Min Stars:</label>
            <select
              id="stars-select"
              name="stars"
              value={filters.stars}
              onChange={handleFilterChange}
              className="filter-select"
            >
              <option value="0">Any Rating</option>
              <option value="3">3+ Stars</option>
              <option value="4">4+ Stars</option>
              <option value="5">5 Stars</option>
            </select>
          </div>
          <div className="filter-group">
            <label htmlFor="commitment-select">Status:</label>
            <select
              id="commitment-select"
              name="committed"
              value={filters.committed}
              onChange={handleFilterChange}
              className="filter-select"
            >
              <option value="all">All Recruits</option>
              <option value="committed">Committed Only</option>
              <option value="uncommitted">Uncommitted Only</option>
            </select>
          </div>
          <div className="filter-group search-group">
            <label htmlFor="team-search">School:</label>
            <div className="search-input-container">
              <FaSearch className="search-icon" />
              <input
                id="team-search"
                type="text"
                name="team"
                value={filters.team}
                onChange={handleFilterChange}
                placeholder="Search school..."
                className="team-search"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="map-container">
        {mapReady && (
          <MapContainer
            center={[39.8283, -98.5795]}
            zoom={4}
            style={{ height: "70vh", width: "100%" }}
            ref={mapRef}
          >
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            />
            {mapMode === 'markers' && filteredProspects.map((prospect) => {
              if (!prospect.hometownInfo?.latitude || !prospect.hometownInfo?.longitude) {
                return null;
              }
              return (
                <Marker
                  key={prospect.id}
                  position={[prospect.hometownInfo.latitude, prospect.hometownInfo.longitude]}
                  icon={createStarIcon(prospect.stars)}
                  eventHandlers={{
                    click: () => setActiveProspect(prospect)
                  }}
                >
                  <Popup className="prospect-popup">
                    <div className="prospect-popup-content">
                      <div className="prospect-popup-header">
                        <div className="prospect-popup-stars">
                          {[...Array(5)].map((_, i) => (
                            <FaStar
                              key={i}
                              className={`star-icon ${i < prospect.stars ? "filled" : "empty"}`}
                            />
                          ))}
                        </div>
                        <div className="prospect-popup-rating">
                          {prospect.rating ? prospect.rating.toFixed(4) : "N/A"}
                        </div>
                      </div>
                      <h3 className="prospect-popup-name">{prospect.name}</h3>
                      <div className="prospect-popup-details">
                        <div className="prospect-popup-rank">
                          <FaTrophy /> Rank: #{prospect.ranking}
                        </div>
                        <div className="prospect-popup-position">{prospect.position}</div>
                        <div className="prospect-popup-hometown">
                          {prospect.city}, {prospect.stateProvince}
                        </div>
                        <div className="prospect-popup-metrics">
                          <span>
                            {prospect.height ? `${Math.floor(prospect.height / 12)}'${prospect.height % 12}"` : "N/A"}
                          </span>
                          <span>
                            {prospect.weight ? `${prospect.weight} lbs` : "N/A"}
                          </span>
                        </div>
                      </div>
                      {prospect.committedTo ? (
                        <div className="prospect-popup-commitment">
                          <img
                            src={getTeamLogo(prospect.committedTo)}
                            alt={`${prospect.committedTo} Logo`}
                            className="popup-team-logo"
                          />
                          <span>Committed to {prospect.committedTo}</span>
                        </div>
                      ) : (
                        <div className="prospect-popup-uncommitted">
                          <span>Uncommitted</span>
                        </div>
                      )}
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
        )}
        <AnimatePresence>
          {statsVisible && (
            <motion.div
              className="stats-panel"
              initial={{ opacity: 0, x: 300 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 300 }}
              transition={{ duration: 0.3 }}
            >
              <div className="stats-panel-header">
                <h3>2025 Recruiting Stats</h3>
                <button className="close-stats" onClick={toggleStats}>×</button>
              </div>
              <div className="stats-panel-content">
                <div className="stats-summary">
                  <div className="stat-card">
                    <div className="stat-value">{filteredProspects.length}</div>
                    <div className="stat-label">Recruits</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-value">
                      {filteredProspects.filter(p => p.stars === 5).length}
                    </div>
                    <div className="stat-label">5-Stars</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-value">
                      {filteredProspects.filter(p => p.committedTo).length}
                    </div>
                    <div className="stat-label">Committed</div>
                  </div>
                </div>
                <div className="top-teams-section">
                  <h4>Top Recruiting Teams</h4>
                  <div className="team-rankings">
                    {teamStats.slice(0, 10).map((team, index) => (
                      <div key={team.name} className="team-rank-card">
                        <div className="team-rank-position">{index + 1}</div>
                        <div className="team-rank-logo">
                          <img
                            src={getTeamLogo(team.name)}
                            alt={`${team.name} Logo`}
                          />
                        </div>
                        <div className="team-rank-info">
                          <div className="team-rank-name">{team.name}</div>
                          <div className="team-rank-stats">
                            <div className="team-rank-commits">
                              {team.count} commits
                            </div>
                            <div className="team-rank-stars">
                              {team.avgStars.toFixed(2)} avg ★
                            </div>
                          </div>
                          <div className="team-star-breakdown">
                            {team.fiveStars > 0 && (
                              <span className="five-star-count">
                                {team.fiveStars} × 5★
                              </span>
                            )}
                            {team.fourStars > 0 && (
                              <span className="four-star-count">
                                {team.fourStars} × 4★
                              </span>
                            )}
                            {team.threeStars > 0 && (
                              <span className="three-star-count">
                                {team.threeStars} × 3★
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="map-legend">
        <div className="legend-item">
          <div className="legend-marker five-star"></div>
          <span>5-Star Recruit</span>
        </div>
        <div className="legend-item">
          <div className="legend-marker four-star"></div>
          <span>4-Star Recruit</span>
        </div>
        <div className="legend-item">
          <div className="legend-marker three-star"></div>
          <span>3-Star Recruit</span>
        </div>
        <div className="legend-info">
          <FaInfoCircle />
          <span>Click on a marker to see recruit details</span>
        </div>
      </div>

      <div className="recruit-stats">
        <h3>Quick Stats</h3>
        <div className="stat-grid">
          <div className="stat-box">
            <div className="stat-number">{prospects.filter(p => p.stars === 5).length}</div>
            <div className="stat-label">5-Star Recruits</div>
          </div>
          <div className="stat-box">
            <div className="stat-number">{prospects.filter(p => p.stars === 4).length}</div>
            <div className="stat-label">4-Star Recruits</div>
          </div>
          <div className="stat-box">
            <div className="stat-number">
              {Object.keys(stateData).length}
            </div>
            <div className="stat-label">States with Recruits</div>
          </div>
          <div className="stat-box">
            <div className="stat-number">
              {new Set(prospects.filter(p => p.committedTo).map(p => p.committedTo)).size}
            </div>
            <div className="stat-label">Schools with Commits</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Commitments;