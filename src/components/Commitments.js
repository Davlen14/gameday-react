import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import L from "leaflet";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaStar,
  FaSearch,
  FaInfoCircle,
  FaMapMarkedAlt,
  FaTrophy,
  FaFootballBall,
  FaSyncAlt,
  FaChartBar
} from "react-icons/fa";
import "../styles/Commitments.css";

/**
 * You need to implement these services in your codebase.
 * getAllRecruits(year) => returns an array of recruit objects.
 * getTeams() => returns an array of team objects (for logos, etc.).
 */
import { getAllRecruits, getTeams } from "../services/teamsService";

/** US bounding box to restrict map view to the continental US. */
const US_BOUNDS = [
  [24.396308, -125.0], // Southwest
  [49.384358, -66.93457] // Northeast
];

/** Create a custom marker icon for a given star rating. */
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

/** A small component to set up the map's bounds and constraints. */
const MapControls = () => {
  const map = useMap();

  useEffect(() => {
    // Fit map to US bounds on load
    map.fitBounds(US_BOUNDS);

    // Prevent zooming too far out
    map.setMinZoom(3);

    // Restrict panning to US area (with some buffer)
    map.setMaxBounds([
      [15, -140], // Southwest buffer
      [55, -50],  // Northeast buffer
    ]);
  }, [map]);

  return null;
};

const Commitments = () => {
  const [prospects, setProspects] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Added "state" to the filters
  const [filters, setFilters] = useState({
    position: "All",
    stars: 0,
    team: "",
    committed: "all", // "all", "committed", "uncommitted"
    state: "All",
  });

  const [mapMode, setMapMode] = useState("markers"); // "markers" or "clusters"
  const [statsVisible, setStatsVisible] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const mapRef = useRef(null);

  // Fetch recruits and team data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [prospectData, teamData] = await Promise.all([
          getAllRecruits(2025),
          getTeams(),
        ]);

        if (!prospectData || !teamData) {
          throw new Error("Failed to fetch data");
        }

        // Process the data: give each prospect a unique ID if missing
        // Optionally filter out any invalid lat/long here if you wish
        const processedProspects = prospectData.map((prospect, index) => ({
          ...prospect,
          id: prospect.id || `prospect-${index}`,
        }));

        setProspects(processedProspects);
        setTeams(teamData);
        setMapReady(true);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError(err.message || "Failed to load recruiting data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  /** Filter the prospects based on user selections. */
  const filteredProspects = useMemo(() => {
    return prospects.filter((prospect) => {
      // Position filter
      if (filters.position !== "All" && prospect.position !== filters.position) {
        return false;
      }
      // Star rating filter
      if (filters.stars > 0 && (prospect.stars || 0) < filters.stars) {
        return false;
      }
      // Team (school) search
      if (
        filters.team &&
        (!prospect.committedTo ||
          !prospect.committedTo.toLowerCase().includes(filters.team.toLowerCase()))
      ) {
        return false;
      }
      // Commitment status
      if (
        (filters.committed === "committed" && !prospect.committedTo) ||
        (filters.committed === "uncommitted" && prospect.committedTo)
      ) {
        return false;
      }
      // State filter
      if (filters.state !== "All" && prospect.stateProvince !== filters.state) {
        return false;
      }

      return true;
    });
  }, [prospects, filters]);

  /** Generate top team statistics (commits, average stars, etc.). */
  const teamStats = useMemo(() => {
    const stats = {};
    const committedProspects = prospects.filter((p) => p.committedTo);

    committedProspects.forEach((prospect) => {
      const team = prospect.committedTo;
      if (!stats[team]) {
        stats[team] = {
          name: team,
          count: 0,
          totalStars: 0,
          fiveStars: 0,
          fourStars: 0,
          threeStars: 0,
        };
      }
      stats[team].count++;
      stats[team].totalStars += prospect.stars || 0;
      if (prospect.stars === 5) stats[team].fiveStars++;
      if (prospect.stars === 4) stats[team].fourStars++;
      if (prospect.stars === 3) stats[team].threeStars++;
    });

    // Calculate average stars
    Object.keys(stats).forEach((team) => {
      stats[team].avgStars =
        stats[team].count > 0 ? stats[team].totalStars / stats[team].count : 0;
    });

    // Sort primarily by total stars, then by avgStars
    return Object.values(stats).sort((a, b) => {
      const diff = b.totalStars - a.totalStars;
      return diff !== 0 ? diff : b.avgStars - a.avgStars;
    });
  }, [prospects]);

  /** Simple caching for team logos. */
  const teamLogoCache = useRef({});
  const getTeamLogo = useCallback(
    (teamName) => {
      if (!teamName) return "/logos/default.png";

      if (teamLogoCache.current[teamName]) {
        return teamLogoCache.current[teamName];
      }

      const normalizedTeamName = teamName.toLowerCase().replace(/[^a-z]/g, "");
      const foundTeam = teams.find((t) => {
        const normalizedSchool = t.school?.toLowerCase().replace(/[^a-z]/g, "");
        return normalizedSchool === normalizedTeamName;
      });

      const logo = foundTeam?.logos?.[0] || "/logos/default.png";
      teamLogoCache.current[teamName] = logo;
      return logo;
    },
    [teams]
  );

  /** State-level stats (if you need them). */
  const stateData = useMemo(() => {
    const states = {};
    filteredProspects.forEach((prospect) => {
      const st = prospect.stateProvince;
      if (!st) return;
      if (!states[st]) {
        states[st] = { count: 0, totalStars: 0 };
      }
      states[st].count++;
      states[st].totalStars += prospect.stars || 0;
    });
    // Could add average star calc if needed
    return states;
  }, [filteredProspects]);

  /** Handle changes to filters. */
  const handleFilterChange = useCallback((e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: name === "stars" ? parseInt(value, 10) : value
    }));
  }, []);

  /** Switch between marker mode and cluster mode. */
  const handleMapModeChange = useCallback((mode) => {
    setMapMode(mode);
  }, []);

  /** Reset the map to the default US view. */
  const resetMapView = useCallback(() => {
    if (mapRef.current) {
      mapRef.current.fitBounds(US_BOUNDS);
    }
  }, []);

  /** Toggle the stats panel on/off. */
  const toggleStats = useCallback(() => {
    setStatsVisible((prev) => !prev);
  }, []);

  /** Create the content of each prospect's popup. */
  const createProspectPopup = useCallback(
    (prospect) => (
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
            {prospect.rating ? prospect.rating.toFixed(2) : "N/A"}
          </div>
        </div>
        <h3 className="prospect-popup-name">{prospect.name}</h3>
        <div className="prospect-popup-details">
          <div className="prospect-popup-rank">
            <FaTrophy /> Rank: #{prospect.ranking || "N/A"}
          </div>
          <div className="prospect-popup-position">
            {prospect.position || "Unknown"}
          </div>
          <div className="prospect-popup-hometown">
            {prospect.city || ""}
            {prospect.city && prospect.stateProvince ? ", " : ""}
            {prospect.stateProvince || ""}
          </div>
          <div className="prospect-popup-metrics">
            {prospect.height ? `${Math.floor(prospect.height / 12)}'${prospect.height % 12}"` : ""}
            {prospect.height && prospect.weight ? " · " : ""}
            {prospect.weight ? `${prospect.weight} lbs` : ""}
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
    ),
    [getTeamLogo]
  );

  /** If data is still loading or there was an error, show messages. */
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
      {/* Header */}
      <header className="commitments-header">
        <h1>2025 Recruiting Map</h1>
        <div className="commitments-subtitle">
          Visualizing the geographic distribution of top football recruits
        </div>
      </header>

      {/* Map Controls */}
      <div className="map-controls">
        <div className="map-toolbar">
          <div className="map-modes">
            <button
              className={`mode-button ${mapMode === "markers" ? "active" : ""}`}
              onClick={() => handleMapModeChange("markers")}
            >
              <FaMapMarkedAlt /> Markers
            </button>
            <button
              className={`mode-button ${mapMode === "clusters" ? "active" : ""}`}
              onClick={() => handleMapModeChange("clusters")}
            >
              <FaFootballBall /> Clusters
            </button>
          </div>
          <div className="map-actions">
            <button className="action-button" onClick={resetMapView}>
              <FaSyncAlt /> Reset View
            </button>
            <button
              className={`action-button ${statsVisible ? "active" : ""}`}
              onClick={toggleStats}
            >
              <FaChartBar /> {statsVisible ? "Hide Stats" : "Show Stats"}
            </button>
          </div>
        </div>

        {/* Filter Controls */}
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
              {[...new Set(prospects.map((p) => p.position))]
                .filter(Boolean)
                .sort()
                .map((pos) => (
                  <option key={pos} value={pos}>
                    {pos}
                  </option>
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

          {/* New State Filter */}
          <div className="filter-group">
            <label htmlFor="state-select">State:</label>
            <select
              id="state-select"
              name="state"
              value={filters.state}
              onChange={handleFilterChange}
              className="filter-select"
            >
              <option value="All">All States</option>
              {[...new Set(prospects.map((p) => p.stateProvince))]
                .filter(Boolean)
                .sort()
                .map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
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

      {/* Map Container */}
      <div className="map-container">
        {mapReady && (
          <MapContainer
            center={[39.8283, -98.5795]} // Approx center of the US
            zoom={4}
            style={{ height: "70vh", width: "100%" }}
            ref={mapRef}
            scrollWheelZoom={true}
            // No need for noWrap or maxBounds here; we handle in MapControls
          >
            {/* Dark-themed tiles from Carto */}
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>
                contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            />
            <MapControls />

            {/* Marker Mode */}
            {mapMode === "markers" &&
              filteredProspects.map((prospect) => {
                if (
                  !prospect.hometownInfo?.latitude ||
                  !prospect.hometownInfo?.longitude
                ) {
                  return null;
                }
                return (
                  <Marker
                    key={prospect.id}
                    position={[
                      prospect.hometownInfo.latitude,
                      prospect.hometownInfo.longitude
                    ]}
                    icon={createStarIcon(prospect.stars)}
                  >
                    <Popup className="prospect-popup">
                      {createProspectPopup(prospect)}
                    </Popup>
                  </Marker>
                );
              })}

            {/* Cluster Mode */}
            {mapMode === "clusters" && (
              <MarkerClusterGroup
                chunkedLoading
                maxClusterRadius={50}
                spiderfyOnMaxZoom
                disableClusteringAtZoom={8}
              >
                {filteredProspects.map((prospect) => {
                  if (
                    !prospect.hometownInfo?.latitude ||
                    !prospect.hometownInfo?.longitude
                  ) {
                    return null;
                  }
                  return (
                    <Marker
                      key={prospect.id}
                      position={[
                        prospect.hometownInfo.latitude,
                        prospect.hometownInfo.longitude
                      ]}
                      icon={createStarIcon(prospect.stars)}
                    >
                      <Popup className="prospect-popup">
                        {createProspectPopup(prospect)}
                      </Popup>
                    </Marker>
                  );
                })}
              </MarkerClusterGroup>
            )}
          </MapContainer>
        )}

        {/* Animated Stats Panel */}
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
                <button className="close-stats" onClick={toggleStats}>
                  ×
                </button>
              </div>
              <div className="stats-panel-content">
                <div className="stats-summary">
                  <div className="stat-card">
                    <div className="stat-value">{filteredProspects.length}</div>
                    <div className="stat-label">Recruits</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-value">
                      {filteredProspects.filter((p) => p.stars === 5).length}
                    </div>
                    <div className="stat-label">5-Stars</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-value">
                      {filteredProspects.filter((p) => p.committedTo).length}
                    </div>
                    <div className="stat-label">Committed</div>
                  </div>
                </div>

                {/* Top Teams */}
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
                            loading="lazy"
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

      {/* Map Legend */}
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

      {/* Quick Stats Section */}
      <div className="recruit-stats">
        <h3>Quick Stats</h3>
        <div className="stat-grid">
          <div className="stat-box">
            <div className="stat-number">
              {prospects.filter((p) => p.stars === 5).length}
            </div>
            <div className="stat-label">5-Star Recruits</div>
          </div>
          <div className="stat-box">
            <div className="stat-number">
              {prospects.filter((p) => p.stars === 4).length}
            </div>
            <div className="stat-label">4-Star Recruits</div>
          </div>
          <div className="stat-box">
            <div className="stat-number">{Object.keys(stateData).length}</div>
            <div className="stat-label">States with Recruits</div>
          </div>
          <div className="stat-box">
            <div className="stat-number">
              {
                new Set(
                  prospects
                    .filter((p) => p.committedTo)
                    .map((p) => p.committedTo)
                ).size
              }
            </div>
            <div className="stat-label">Schools with Commits</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Commitments;