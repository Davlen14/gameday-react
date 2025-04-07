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
  FaChartBar,
  FaFilter,
  FaUniversity,
  FaUserGraduate,
  FaRegStar,
  FaArrowLeft,
  FaArrowRight,
  FaTimesCircle,
  FaSortAmountDown,
  FaTimes,
  FaShieldAlt
} from "react-icons/fa";
import { useSpring, animated } from "react-spring";
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

/** 
 * Create a custom marker icon for a given star rating - enhanced with glowing, metallic effect
 */
const createStarIcon = (starRating) => {
  // Define color gradients for a more metallic look
  const colors = {
    5: "linear-gradient(135deg, #FFD700 0%, #FFA500 50%, #B8860B 100%)", // Gold metallic
    4: "linear-gradient(135deg, #C0C0C0 0%, #A9A9A9 50%, #808080 100%)", // Silver metallic
    3: "linear-gradient(135deg, #cd7f32 0%, #b87333 50%, #a0522d 100%)", // Bronze metallic
  };
  
  // Shadow colors with matching hues
  const glowColors = {
    5: "rgba(255, 215, 0, 0.6)", // Gold glow
    4: "rgba(192, 192, 192, 0.6)", // Silver glow
    3: "rgba(205, 127, 50, 0.6)", // Bronze glow
  };
  
  // Create HTML for the marker with enhanced visual effects
  return L.divIcon({
    className: `star-marker star-${starRating}`,
    html: `
      <div class="marker-container">
        <div class="pulse-ring" style="box-shadow: 0 0 15px 5px ${glowColors[starRating] || "#888"}"></div>
        <div class="star-badge" style="background: ${colors[starRating] || "#888"}">
          <span class="star-text">${starRating}</span>
          <span class="star-icon">★</span>
        </div>
      </div>
    `,
    iconSize: [46, 46],
    iconAnchor: [23, 23],
  });
};

/** A component to set up the map's bounds and constraints. */
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

const TopSchoolBadge = ({ school, logo, count, avgStars, onClick }) => {
  return (
    <motion.div 
      className="top-school-badge"
      whileHover={{ y: -5, boxShadow: "0 10px 20px rgba(0,0,0,0.1)" }}
      onClick={onClick}
    >
      <img src={logo} alt={school} className="top-school-logo" />
      <div className="top-school-info">
        <div className="top-school-name">{school}</div>
        <div className="top-school-stats">
          <span className="commit-count">{count}</span>
          <span className="avg-stars">{avgStars.toFixed(1)}★</span>
        </div>
      </div>
    </motion.div>
  );
};

const Commitments = () => {
  const [prospects, setProspects] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [quickTeamsOpen, setQuickTeamsOpen] = useState(false);

  // Enhanced filters
  const [filters, setFilters] = useState({
    position: "All",
    stars: 0,
    team: "",
    committed: "all", // "all", "committed", "uncommitted"
    state: "All",
    conference: "All"
  });

  const [mapMode, setMapMode] = useState("markers"); // "markers" or "clusters"
  const [statsVisible, setStatsVisible] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [activeProspect, setActiveProspect] = useState(null);
  const [selectedSchool, setSelectedSchool] = useState(null);
  const mapRef = useRef(null);

  // Animation for filters panel
  const filtersPanelAnimation = useSpring({
    opacity: filtersOpen ? 1 : 0,
    transform: filtersOpen ? 'translateY(0%)' : 'translateY(-100%)',
    config: { tension: 280, friction: 60 }
  });

  // Animation for quick teams panel
  const quickTeamsPanelAnimation = useSpring({
    opacity: quickTeamsOpen ? 1 : 0,
    transform: quickTeamsOpen ? 'translateY(0%)' : 'translateY(-100%)',
    config: { tension: 280, friction: 60 }
  });

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
      // Conference filter (if prospect has committed to a team in a specific conference)
      if (filters.conference !== "All") {
        // Need to find team's conference from the teams array
        if (!prospect.committedTo) return false;
        
        const team = teams.find(t => 
          t.school.toLowerCase() === prospect.committedTo.toLowerCase()
        );
        
        if (!team || team.conference !== filters.conference) return false;
      }
      
      // Selected school filter
      if (selectedSchool && (!prospect.committedTo || prospect.committedTo !== selectedSchool)) {
        return false;
      }

      return true;
    });
  }, [prospects, filters, selectedSchool, teams]);

  /** Generate top team statistics with more metrics. */
  const teamStats = useMemo(() => {
    const stats = {};
    const committedProspects = prospects.filter((p) => p.committedTo);

    committedProspects.forEach((prospect) => {
      const team = prospect.committedTo;
      if (!team) return;
      
      if (!stats[team]) {
        // Find conference for this team
        const teamData = teams.find(t => t.school.toLowerCase() === team.toLowerCase());
        
        stats[team] = {
          name: team,
          count: 0,
          totalStars: 0,
          totalRating: 0,
          fiveStars: 0,
          fourStars: 0,
          threeStars: 0,
          positions: {},
          conference: teamData?.conference || 'Unknown',
          topRank: Number.MAX_SAFE_INTEGER
        };
      }
      
      stats[team].count++;
      stats[team].totalStars += prospect.stars || 0;
      stats[team].totalRating += prospect.rating || 0;
      
      // Track star counts
      if (prospect.stars === 5) stats[team].fiveStars++;
      if (prospect.stars === 4) stats[team].fourStars++;
      if (prospect.stars === 3) stats[team].threeStars++;
      
      // Track positions committed
      if (prospect.position) {
        if (!stats[team].positions[prospect.position]) {
          stats[team].positions[prospect.position] = 0;
        }
        stats[team].positions[prospect.position]++;
      }
      
      // Track highest-ranked recruit
      if (prospect.ranking && prospect.ranking < stats[team].topRank) {
        stats[team].topRank = prospect.ranking;
      }
    });

    // Calculate metrics
    Object.keys(stats).forEach((team) => {
      stats[team].avgStars = stats[team].count > 0 ? stats[team].totalStars / stats[team].count : 0;
      stats[team].avgRating = stats[team].count > 0 ? stats[team].totalRating / stats[team].count : 0;
      
      // Create a sorted array of positions
      stats[team].positionBreakdown = Object.entries(stats[team].positions)
        .sort((a, b) => b[1] - a[1])
        .map(([pos, count]) => ({ position: pos, count }));
    });

    // Sort primarily by total stars, then by avgStars
    return Object.values(stats).sort((a, b) => {
      const diff = b.totalStars - a.totalStars;
      return diff !== 0 ? diff : b.avgStars - a.avgStars;
    });
  }, [prospects, teams]);

  /** All available conferences from team data */
  const conferences = useMemo(() => {
    const confs = new Set();
    teams.forEach(team => {
      if (team.conference) confs.add(team.conference);
    });
    return ['All', ...Array.from(confs).sort()];
  }, [teams]);

  /** Simple caching for team logos with fallbacks. */
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

  /** State-level stats with enhanced metrics */
  const stateData = useMemo(() => {
    const states = {};
    filteredProspects.forEach((prospect) => {
      const st = prospect.stateProvince;
      if (!st) return;
      
      if (!states[st]) {
        states[st] = { 
          count: 0, 
          totalStars: 0,
          fiveStars: 0,
          fourStars: 0,
          threeStars: 0,
          topSchools: {},
          positions: {}
        };
      }
      
      states[st].count++;
      states[st].totalStars += prospect.stars || 0;
      
      // Track star counts by state
      if (prospect.stars === 5) states[st].fiveStars++;
      if (prospect.stars === 4) states[st].fourStars++;
      if (prospect.stars === 3) states[st].threeStars++;
      
      // Track positions by state
      if (prospect.position) {
        if (!states[st].positions[prospect.position]) {
          states[st].positions[prospect.position] = 0;
        }
        states[st].positions[prospect.position]++;
      }
      
      // Track which schools are getting commits from this state
      if (prospect.committedTo) {
        if (!states[st].topSchools[prospect.committedTo]) {
          states[st].topSchools[prospect.committedTo] = 0;
        }
        states[st].topSchools[prospect.committedTo]++;
      }
    });
    
    // Calculate averages and prepare sorted lists
    Object.keys(states).forEach(st => {
      states[st].avgStars = states[st].count > 0 ? states[st].totalStars / states[st].count : 0;
      
      // Sort top schools
      states[st].topSchoolsList = Object.entries(states[st].topSchools)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([school, count]) => ({ school, count }));
      
      // Sort positions
      states[st].positionsList = Object.entries(states[st].positions)
        .sort((a, b) => b[1] - a[1])
        .map(([position, count]) => ({ position, count }));
    });
    
    return states;
  }, [filteredProspects]);

  /** Generate position breakdown data */
  const positionBreakdown = useMemo(() => {
    const positions = {};
    
    filteredProspects.forEach(prospect => {
      const pos = prospect.position;
      if (!pos) return;
      
      if (!positions[pos]) {
        positions[pos] = {
          position: pos,
          count: 0,
          totalStars: 0,
          committed: 0,
          uncommitted: 0
        };
      }
      
      positions[pos].count++;
      positions[pos].totalStars += prospect.stars || 0;
      
      if (prospect.committedTo) {
        positions[pos].committed++;
      } else {
        positions[pos].uncommitted++;
      }
    });
    
    // Calculate averages
    Object.values(positions).forEach(pos => {
      pos.avgStars = pos.count > 0 ? pos.totalStars / pos.count : 0;
      pos.commitPercent = pos.count > 0 ? (pos.committed / pos.count) * 100 : 0;
    });
    
    return Object.values(positions).sort((a, b) => b.count - a.count);
  }, [filteredProspects]);

  /** Handle changes to filters. */
  const handleFilterChange = useCallback((e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: name === "stars" ? parseInt(value, 10) : value
    }));
  }, []);

  /** Clear all filters and reset to defaults */
  const clearAllFilters = useCallback(() => {
    setFilters({
      position: "All",
      stars: 0,
      team: "",
      committed: "all",
      state: "All",
      conference: "All"
    });
    setSelectedSchool(null);
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
  
  /** Toggle the filters panel */
  const toggleFilters = useCallback(() => {
    setFiltersOpen(prev => !prev);
    // Close quick teams if opening filters
    if (!filtersOpen) setQuickTeamsOpen(false);
  }, [filtersOpen]);
  
  /** Toggle the quick teams panel */
  const toggleQuickTeams = useCallback(() => {
    setQuickTeamsOpen(prev => !prev);
    // Close filters if opening quick teams
    if (!quickTeamsOpen) setFiltersOpen(false);
  }, [quickTeamsOpen]);
  
  /** Select a specific school to filter by */
  const handleSchoolSelect = useCallback((schoolName) => {
    setSelectedSchool(prev => prev === schoolName ? null : schoolName);
    
    // If selecting a school, clear the team text filter to avoid confusion
    if (schoolName && schoolName !== filters.team) {
      setFilters(prev => ({...prev, team: ""}));
    }
    
    // Close quick teams panel
    setQuickTeamsOpen(false);
  }, [filters.team]);

  /** Create the content of each prospect's popup with enhanced design. */
  const createProspectPopup = useCallback(
    (prospect) => (
      <div className="prospect-popup-content">
        <div className="prospect-popup-header" style={{
          background: prospect.stars === 5 
            ? 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)' 
            : prospect.stars === 4 
              ? 'linear-gradient(135deg, #C0C0C0 0%, #A9A9A9 100%)' 
              : 'linear-gradient(135deg, #cd7f32 0%, #a0522d 100%)'
        }}>
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
            <FaFootballBall /> {prospect.position || "Unknown"}
          </div>
          <div className="prospect-popup-hometown">
            <FaMapMarkedAlt />
            {prospect.city || ""}
            {prospect.city && prospect.stateProvince ? ", " : ""}
            {prospect.stateProvince || ""}
          </div>
          <div className="prospect-popup-metrics">
            <FaUserGraduate />
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
            <FaUniversity />
            <span>Uncommitted</span>
          </div>
        )}
        
        <button 
          className="view-prospect-details"
          onClick={() => setActiveProspect(prospect)}
        >
          View Full Profile
        </button>
      </div>
    ),
    [getTeamLogo]
  );
  
  /** Get top schools for quick selection */
  const topRecruitingSchools = useMemo(() => {
    return teamStats.slice(0, 8);
  }, [teamStats]);

  /** If data is still loading or there was an error, show messages. */
  if (loading) {
    return (
      <div className="commitments-loading">
        <div className="loading-spinner">
          <FaFootballBall className="loading-icon" />
        </div>
        <h2>Loading Recruiting Data</h2>
        <p>Preparing the nationwide map of top football talent...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="commitments-error">
        <div className="error-icon">⚠️</div>
        <h2>Error Loading Recruit Data</h2>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>
          <FaSyncAlt /> Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="commitments-container">
      {/* Modern Header with Glassy Effect */}
      <header className="commitments-header">
        <h1>
          <FaFootballBall className="header-icon" /> 
          2025 Football Recruiting Map
        </h1>
        <div className="commitments-subtitle">
          Visualizing the geographic distribution of top football recruits across the nation
        </div>
      </header>

      {/* Main Control Panel - Glassy, floating panel */}
      <div className="control-panel">
        <div className="main-controls">
          <div className="mode-switcher">
            <button
              className={`mode-button ${mapMode === "markers" ? "active" : ""}`}
              onClick={() => handleMapModeChange("markers")}
            >
              <FaMapMarkedAlt className="button-icon" />
              <span>Individual</span>
            </button>
            <button
              className={`mode-button ${mapMode === "clusters" ? "active" : ""}`}
              onClick={() => handleMapModeChange("clusters")}
            >
              <FaFootballBall className="button-icon" />
              <span>Clusters</span>
            </button>
          </div>
          
          <div className="action-buttons">
            <button 
              className={`action-button ${filtersOpen ? "active" : ""}`} 
              onClick={toggleFilters}
              aria-label="Toggle Filters"
            >
              <FaFilter className="button-icon" />
              <span>Filters</span>
            </button>
            
            <button 
              className={`action-button ${quickTeamsOpen ? "active" : ""}`} 
              onClick={toggleQuickTeams}
              aria-label="Quick Teams"
            >
              <FaUniversity className="button-icon" />
              <span>Schools</span>
            </button>
            
            <button 
              className={`action-button ${statsVisible ? "active" : ""}`} 
              onClick={toggleStats}
              aria-label="Toggle Stats"
            >
              <FaChartBar className="button-icon" />
              <span>Stats</span>
            </button>
            
            <button 
              className="action-button" 
              onClick={resetMapView}
              aria-label="Reset Map View"
            >
              <FaSyncAlt className="button-icon" />
              <span>Reset</span>
            </button>
          </div>
          
          {/* Current Filters Summary */}
          <div className="current-filters-summary">
            {selectedSchool && (
              <div className="active-filter school-filter">
                <img 
                  src={getTeamLogo(selectedSchool)} 
                  alt={selectedSchool} 
                  className="mini-school-logo" 
                />
                <span>{selectedSchool}</span>
                <button 
                  className="clear-filter" 
                  onClick={() => handleSchoolSelect(null)}
                  aria-label="Clear school filter"
                >
                  <FaTimes />
                </button>
              </div>
            )}
            
            {filters.stars > 0 && (
              <div className="active-filter stars-filter">
                <span>{filters.stars}+ Stars</span>
                <button 
                  className="clear-filter" 
                  onClick={() => setFilters(prev => ({...prev, stars: 0}))}
                  aria-label="Clear stars filter"
                >
                  <FaTimes />
                </button>
              </div>
            )}
            
            {filters.position !== "All" && (
              <div className="active-filter position-filter">
                <span>{filters.position}</span>
                <button 
                  className="clear-filter" 
                  onClick={() => setFilters(prev => ({...prev, position: "All"}))}
                  aria-label="Clear position filter"
                >
                  <FaTimes />
                </button>
              </div>
            )}
            
            {filters.state !== "All" && (
              <div className="active-filter state-filter">
                <span>{filters.state}</span>
                <button 
                  className="clear-filter" 
                  onClick={() => setFilters(prev => ({...prev, state: "All"}))}
                  aria-label="Clear state filter"
                >
                  <FaTimes />
                </button>
              </div>
            )}
            
            {filters.conference !== "All" && (
              <div className="active-filter conference-filter">
                <span>{filters.conference}</span>
                <button 
                  className="clear-filter" 
                  onClick={() => setFilters(prev => ({...prev, conference: "All"}))}
                  aria-label="Clear conference filter"
                >
                  <FaTimes />
                </button>
              </div>
            )}
            
            {filters.committed !== "all" && (
              <div className="active-filter status-filter">
                <span>{filters.committed === "committed" ? "Committed Only" : "Uncommitted Only"}</span>
                <button 
                  className="clear-filter" 
                  onClick={() => setFilters(prev => ({...prev, committed: "all"}))}
                  aria-label="Clear commitment status filter"
                >
                  <FaTimes />
                </button>
              </div>
            )}
            
            {/* Clear all filters button - only show if any filter is active */}
            {(selectedSchool || 
              filters.stars > 0 || 
              filters.position !== "All" || 
              filters.state !== "All" || 
              filters.conference !== "All" || 
              filters.committed !== "all" ||
              filters.team !== "") && (
              <button 
                className="clear-all-filters"
                onClick={clearAllFilters}
                aria-label="Clear all filters"
              >
                Clear All
              </button>
            )}
          </div>
        </div>
        
        {/* Filters Panel - Animated */}
        <AnimatePresence>
          {filtersOpen && (
            <animated.div 
              className="filters-panel"
              style={filtersPanelAnimation}
            >
              <div className="filters-header">
                <h3><FaFilter /> Advanced Filters</h3>
                <button 
                  className="close-panel"
                  onClick={toggleFilters}
                  aria-label="Close filters panel"
                >
                  <FaTimes />
                </button>
              </div>
              
              <div className="filters-content">
                <div className="filters-grid">
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
                    <div className="star-rating-selector">
                      {[0, 3, 4, 5].map(stars => (
                        <button
                          key={stars}
                          className={`star-filter-btn ${filters.stars === stars ? 'active' : ''}`}
                          onClick={() => setFilters(prev => ({...prev, stars}))}
                        >
                          {stars === 0 ? 'Any' : (
                            <>
                              {stars}
                              <FaStar className="star-icon" />
                            </>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="filter-group">
                    <label htmlFor="commitment-select">Commitment:</label>
                    <div className="commitment-selector">
                      <button
                        className={`commitment-btn ${filters.committed === 'all' ? 'active' : ''}`}
                        onClick={() => setFilters(prev => ({...prev, committed: 'all'}))}
                      >
                        All
                      </button>
                      <button
                        className={`commitment-btn ${filters.committed === 'committed' ? 'active' : ''}`}
                        onClick={() => setFilters(prev => ({...prev, committed: 'committed'}))}
                      >
                        Committed
                      </button>
                      <button
                        className={`commitment-btn ${filters.committed === 'uncommitted' ? 'active' : ''}`}
                        onClick={() => setFilters(prev => ({...prev, committed: 'uncommitted'}))}
                      >
                        Uncommitted
                      </button>
                    </div>
                  </div>
                  
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
                  
                  <div className="filter-group">
                    <label htmlFor="conference-select">Conference:</label>
                    <select
                      id="conference-select"
                      name="conference"
                      value={filters.conference}
                      onChange={handleFilterChange}
                      className="filter-select"
                    >
                      {conferences.map(conf => (
                        <option key={conf} value={conf}>
                          {conf === 'All' ? 'All Conferences' : conf}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="filter-group search-group">
                    <label htmlFor="team-search">School Search:</label>
                    <div className="search-input-container">
                      <FaSearch className="search-icon" />
                      <input
                        id="team-search"
                        type="text"
                        name="team"
                        value={filters.team}
                        onChange={handleFilterChange}
                        placeholder="Search by school name..."
                        className="team-search"
                      />
                      {filters.team && (
                        <button 
                          className="clear-search" 
                          onClick={() => setFilters(prev => ({...prev, team: ""}))}
                          aria-label="Clear search"
                        >
                          <FaTimes />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="filters-actions">
                  <button 
                    className="apply-filters"
                    onClick={toggleFilters}
                    aria-label="Apply filters and close panel"
                  >
                    Apply Filters
                  </button>
                  <button 
                    className="reset-filters"
                    onClick={clearAllFilters}
                    aria-label="Reset all filters to default"
                  >
                    Reset All
                  </button>
                </div>
              </div>
            </animated.div>
          )}
        </AnimatePresence>
        
        {/* Quick School Selector - Animated */}
        <AnimatePresence>
          {quickTeamsOpen && (
            <animated.div 
              className="quick-schools-panel"
              style={quickTeamsPanelAnimation}
            >
              <div className="quick-schools-header">
                <h3><FaUniversity /> Top Recruiting Programs</h3>
                <button 
                  className="close-panel"
                  onClick={toggleQuickTeams}
                  aria-label="Close quick schools panel"
                >
                  <FaTimes />
                </button>
              </div>
              
              <div className="quick-schools-content">
                <div className="schools-grid">
                  {topRecruitingSchools.map(school => (
                    <TopSchoolBadge 
                      key={school.name}
                      school={school.name}
                      logo={getTeamLogo(school.name)}
                      count={school.count}
                      avgStars={school.avgStars}
                      onClick={() => handleSchoolSelect(school.name)}
                    />
                  ))}
                </div>
                
                <div className="quick-schools-info">
                  <p>
                    <FaInfoCircle /> Click on a school to see their committed recruits on the map
                  </p>
                </div>
              </div>
            </animated.div>
          )}
        </AnimatePresence>
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
                iconCreateFunction={(cluster) => {
                  const count = cluster.getChildCount();
                  let className = 'cluster-icon small';
                  
                  if (count > 10) className = 'cluster-icon medium';
                  if (count > 20) className = 'cluster-icon large';
                  
                  return L.divIcon({
                    html: `<div class="${className}"><span>${count}</span></div>`,
                    className: 'custom-cluster-icon',
                    iconSize: L.point(40, 40)
                  });
                }}
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

        {/* Stats Panel - Enhanced with animations */}
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
                <h3><FaChartBar /> Recruiting Analytics</h3>
                <button className="close-stats" onClick={toggleStats}>
                  <FaTimes />
                </button>
              </div>
              
              <div className="stats-panel-content">
                {/* Overall Stats Summary */}
                <div className="stats-summary">
                  <div className="stat-card">
                    <div className="stat-value">{filteredProspects.length}</div>
                    <div className="stat-label">Recruits</div>
                  </div>
                  <div className="stat-card five-star">
                    <div className="stat-value">
                      {filteredProspects.filter((p) => p.stars === 5).length}
                    </div>
                    <div className="stat-label">5★ Recruits</div>
                  </div>
                  <div className="stat-card four-star">
                    <div className="stat-value">
                      {filteredProspects.filter((p) => p.stars === 4).length}
                    </div>
                    <div className="stat-label">4★ Recruits</div>
                  </div>
                  <div className="stat-card three-star">
                    <div className="stat-value">
                      {filteredProspects.filter((p) => p.stars === 3).length}
                    </div>
                    <div className="stat-label">3★ Recruits</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-value">
                      {filteredProspects.filter((p) => p.committedTo).length}
                    </div>
                    <div className="stat-label">Committed</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-value">
                      {filteredProspects.filter((p) => !p.committedTo).length}
                    </div>
                    <div className="stat-label">Uncommitted</div>
                  </div>
                </div>

                {/* Top Teams Section - with enhanced visuals */}
                <div className="top-teams-section">
                  <div className="section-header">
                    <h4><FaTrophy /> Top Recruiting Teams</h4>
                    <span className="section-subtitle">Based on total stars</span>
                  </div>
                  
                  <div className="team-rankings">
                    {teamStats.slice(0, 10).map((team, index) => (
                      <motion.div 
                        key={team.name} 
                        className="team-rank-card"
                        whileHover={{ 
                          y: -3, 
                          boxShadow: "0 10px 20px rgba(0,0,0,0.15)" 
                        }}
                        onClick={() => handleSchoolSelect(team.name)}
                      >
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
                              <span className="five-star-count" title="5-star recruits">
                                {team.fiveStars} × 5★
                              </span>
                            )}
                            {team.fourStars > 0 && (
                              <span className="four-star-count" title="4-star recruits">
                                {team.fourStars} × 4★
                              </span>
                            )}
                            {team.threeStars > 0 && (
                              <span className="three-star-count" title="3-star recruits">
                                {team.threeStars} × 3★
                              </span>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
                
                {/* Position Breakdown */}
                <div className="position-breakdown-section">
                  <div className="section-header">
                    <h4><FaFootballBall /> Position Breakdown</h4>
                    <span className="section-subtitle">Top positions in current view</span>
                  </div>
                  
                  <div className="position-stats">
                    {positionBreakdown.slice(0, 6).map(pos => (
                      <div key={pos.position} className="position-stat-card">
                        <div className="position-name">{pos.position}</div>
                        <div className="position-count">{pos.count}</div>
                        <div className="position-metrics">
                          <div className="position-avg-stars">
                            {pos.avgStars.toFixed(1)}★ avg
                          </div>
                          <div className="position-commit-percent">
                            {pos.commitPercent.toFixed(0)}% committed
                          </div>
                        </div>
                        <div 
                          className="commit-progress-bar"
                          title={`${pos.committed} committed, ${pos.uncommitted} uncommitted`}
                        >
                          <div 
                            className="committed-portion" 
                            style={{width: `${pos.commitPercent}%`}}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Full Prospect Detail Modal */}
        <AnimatePresence>
          {activeProspect && (
            <motion.div
              className="prospect-detail-modal"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
            >
              <div className="modal-content">
                <button 
                  className="close-modal"
                  onClick={() => setActiveProspect(null)}
                  aria-label="Close prospect details"
                >
                  <FaTimes />
                </button>
                
                <div className="prospect-header" style={{
                  background: activeProspect.stars === 5 
                    ? 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)' 
                    : activeProspect.stars === 4 
                      ? 'linear-gradient(135deg, #C0C0C0 0%, #A9A9A9 100%)' 
                      : 'linear-gradient(135deg, #cd7f32 0%, #a0522d 100%)'
                }}>
                  <div className="prospect-star-badge">
                    <span className="star-number">{activeProspect.stars}</span>
                    <FaStar className="star-symbol" />
                  </div>
                  
                  <div className="prospect-identity">
                    <h2>{activeProspect.name}</h2>
                    <div className="prospect-subheader">
                      <span className="prospect-position">{activeProspect.position}</span>
                      <span className="hometown-separator">•</span>
                      <span className="prospect-hometown">
                        {activeProspect.city}, {activeProspect.stateProvince}
                      </span>
                    </div>
                  </div>
                  
                  <div className="prospect-rating-display">
                    <div className="rating-number">{activeProspect.rating?.toFixed(2) || "N/A"}</div>
                    <div className="rating-label">Rating</div>
                  </div>
                </div>
                
                <div className="prospect-body">
                  <div className="prospect-metrics-grid">
                    <div className="metric-card">
                      <div className="metric-icon"><FaTrophy /></div>
                      <div className="metric-value">#{activeProspect.ranking || "N/A"}</div>
                      <div className="metric-label">National Rank</div>
                    </div>
                    
                    <div className="metric-card">
                      <div className="metric-icon"><FaUserGraduate /></div>
                      <div className="metric-value">
                        {activeProspect.height 
                          ? `${Math.floor(activeProspect.height / 12)}'${activeProspect.height % 12}"` 
                          : "N/A"}
                      </div>
                      <div className="metric-label">Height</div>
                    </div>
                    
                    <div className="metric-card">
                      <div className="metric-icon"><FaSortAmountDown /></div>
                      <div className="metric-value">
                        {activeProspect.weight ? `${activeProspect.weight} lbs` : "N/A"}
                      </div>
                      <div className="metric-label">Weight</div>
                    </div>
                  </div>
                  
                  <div className="prospect-commitment-status">
                    {activeProspect.committedTo ? (
                      <div className="committed-display">
                        <div className="commitment-header">Committed To</div>
                        <div className="commitment-school">
                          <img 
                            src={getTeamLogo(activeProspect.committedTo)} 
                            alt={activeProspect.committedTo}
                            className="commitment-logo"
                          />
                          <span className="school-name">{activeProspect.committedTo}</span>
                        </div>
                        
                        <button 
                          className="view-team-recruits"
                          onClick={() => {
                            handleSchoolSelect(activeProspect.committedTo);
                            setActiveProspect(null);
                          }}
                        >
                          <FaShieldAlt /> View All {activeProspect.committedTo} Recruits
                        </button>
                      </div>
                    ) : (
                      <div className="uncommitted-display">
                        <FaUniversity className="uncommitted-icon" />
                        <div className="uncommitted-text">Uncommitted</div>
                        <div className="uncommitted-subtext">This recruit has not committed to a school yet</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Enhanced Map Legend */}
      <div className="map-legend">
        <div className="legend-header">
          <FaInfoCircle className="legend-icon" />
          <span>Map Legend</span>
        </div>
        
        <div className="legend-items">
          <div className="legend-item five-star">
            <div className="legend-marker"></div>
            <span className="legend-label">5-Star Elite Recruit</span>
          </div>
          <div className="legend-item four-star">
            <div className="legend-marker"></div>
            <span className="legend-label">4-Star Blue Chip</span>
          </div>
          <div className="legend-item three-star">
            <div className="legend-marker"></div>
            <span className="legend-label">3-Star Prospect</span>
          </div>
          
          {mapMode === "clusters" && (
            <div className="legend-item cluster">
              <div className="legend-cluster-marker">
                <span>10+</span>
              </div>
              <span className="legend-label">Recruit Cluster</span>
            </div>
          )}
        </div>
        
        <div className="legend-tip">
          <span>Click on a marker to see recruit details</span>
        </div>
      </div>

      {/* Quick Stats Section - Bottom of page */}
      <div className="recruit-stats">
        <h3>National Recruiting Snapshot</h3>
        <div className="stat-grid">
          <motion.div 
            className="stat-box"
            whileHover={{ y: -5, boxShadow: "0 10px 20px rgba(0,0,0,0.1)" }}
          >
            <div className="stat-icon five-star">
              <FaStar />
            </div>
            <div className="stat-number">
              {prospects.filter((p) => p.stars === 5).length}
            </div>
            <div className="stat-label">5-Star Recruits</div>
          </motion.div>
          
          <motion.div 
            className="stat-box"
            whileHover={{ y: -5, boxShadow: "0 10px 20px rgba(0,0,0,0.1)" }}
          >
            <div className="stat-icon four-star">
              <FaStar />
            </div>
            <div className="stat-number">
              {prospects.filter((p) => p.stars === 4).length}
            </div>
            <div className="stat-label">4-Star Recruits</div>
          </motion.div>
          
          <motion.div 
            className="stat-box"
            whileHover={{ y: -5, boxShadow: "0 10px 20px rgba(0,0,0,0.1)" }}
          >
            <div className="stat-icon">
              <FaMapMarkedAlt />
            </div>
            <div className="stat-number">{Object.keys(stateData).length}</div>
            <div className="stat-label">States with Recruits</div>
          </motion.div>
          
          <motion.div 
            className="stat-box"
            whileHover={{ y: -5, boxShadow: "0 10px 20px rgba(0,0,0,0.1)" }}
          >
            <div className="stat-icon">
              <FaUniversity />
            </div>
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
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Commitments;