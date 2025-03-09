import React, { useState, useEffect, useMemo } from "react";
import { FaSearch, FaUserGraduate, FaFilter, FaArrowRight, FaStar, FaCalendarAlt, FaMapMarkerAlt, FaCheck, FaExclamationTriangle } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import teamsService from "../services/teamsService";
import newsService from "../services/newsService";
import "../styles/TransferPortal.css";

const TransferPortal = () => {
  // State for portal data
  const [transfers, setTransfers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newsLoading, setNewsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // State for filters
  const [filters, setFilters] = useState({
    position: "All",
    destinationStatus: "all", // "committed", "uncommitted", "all"
    stars: 0,
    conference: "All",
    searchTerm: ""
  });
  
  // State for sorting
  const [sortConfig, setSortConfig] = useState({
    key: "transferDate",
    direction: "desc"
  });
  
  // State for detail view
  const [selectedTransfer, setSelectedTransfer] = useState(null);
  
  // Stats counters
  const [stats, setStats] = useState({
    totalTransfers: 0,
    committedCount: 0,
    uncommittedCount: 0,
    conferenceStats: {},
    positionStats: {}
  });

  // Fetch transfer portal data and teams
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch both transfers and teams in parallel
        const [transferData, teamsData] = await Promise.all([
          teamsService.getPlayerPortal(2025),
          teamsService.getTeams()
        ]);

        if (!transferData) {
          throw new Error("Failed to fetch transfer portal data");
        }
        
        setTransfers(transferData);
        setTeams(teamsData);
        
        // Calculate stats
        calculateStats(transferData);
      } catch (err) {
        console.error("Error fetching transfer data:", err);
        setError(err.message || "Failed to load transfer portal data");
      } finally {
        setLoading(false);
      }
    };
    
    const fetchNewsData = async () => {
      try {
        setNewsLoading(true);
        const newsData = await newsService.fetchTransferPortalNews();
        setNews(newsData?.articles || []);
      } catch (err) {
        console.error("Error fetching transfer news:", err);
      } finally {
        setNewsLoading(false);
      }
    };
    
    fetchData();
    fetchNewsData();
  }, []);
  
  // Calculate statistics from transfer data
  const calculateStats = (data) => {
    const committedCount = data.filter(t => t.destination).length;
    const uncommittedCount = data.length - committedCount;
    
    // Conference stats
    const conferenceStats = {};
    teams.forEach(team => {
      const teamName = team.school;
      const conference = team.conference;
      
      if (conference && !conferenceStats[conference]) {
        conferenceStats[conference] = {
          gained: 0,
          lost: 0
        };
      }
      
      data.forEach(transfer => {
        if (transfer.origin === teamName && conference) {
          conferenceStats[conference].lost++;
        }
        if (transfer.destination === teamName && conference) {
          conferenceStats[conference].gained++;
        }
      });
    });
    
    // Position stats
    const positionStats = {};
    data.forEach(transfer => {
      const position = transfer.position || "Unknown";
      if (!positionStats[position]) {
        positionStats[position] = 0;
      }
      positionStats[position]++;
    });
    
    setStats({
      totalTransfers: data.length,
      committedCount,
      uncommittedCount,
      conferenceStats,
      positionStats
    });
  };

  // Get logo for a school
  const getTeamLogo = (schoolName) => {
    if (!schoolName) return "/photos/default_team.png";
    
    const team = teams.find(t => 
      t.school?.toLowerCase() === schoolName.toLowerCase()
    );
    
    return team?.logos?.[0] || "/photos/default_team.png";
  };
  
  // Get conference for a school
  const getTeamConference = (schoolName) => {
    if (!schoolName) return "";
    
    const team = teams.find(t => 
      t.school?.toLowerCase() === schoolName.toLowerCase()
    );
    
    return team?.conference || "";
  };
  
  // Filter handlers
  const handleFilterChange = (filter, value) => {
    setFilters(prev => ({
      ...prev,
      [filter]: value
    }));
  };
  
  const handleSearchChange = (e) => {
    setFilters(prev => ({
      ...prev,
      searchTerm: e.target.value
    }));
  };
  
  const clearFilters = () => {
    setFilters({
      position: "All",
      destinationStatus: "all",
      stars: 0,
      conference: "All",
      searchTerm: ""
    });
  };
  
  // Sort handler
  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc"
    }));
  };
  
  // Filtered and sorted transfers
  const filteredTransfers = useMemo(() => {
    let result = [...transfers];
    
    // Apply filters
    if (filters.position !== "All") {
      result = result.filter(t => t.position === filters.position);
    }
    
    if (filters.destinationStatus !== "all") {
      if (filters.destinationStatus === "committed") {
        result = result.filter(t => t.destination);
      } else {
        result = result.filter(t => !t.destination);
      }
    }
    
    if (filters.stars > 0) {
      result = result.filter(t => t.stars >= filters.stars);
    }
    
    if (filters.conference !== "All") {
      result = result.filter(t => 
        getTeamConference(t.origin) === filters.conference || 
        getTeamConference(t.destination) === filters.conference
      );
    }
    
    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      result = result.filter(t => 
        t.firstName?.toLowerCase().includes(term) || 
        t.lastName?.toLowerCase().includes(term) ||
        t.origin?.toLowerCase().includes(term) ||
        t.destination?.toLowerCase().includes(term) ||
        `${t.firstName} ${t.lastName}`.toLowerCase().includes(term)
      );
    }
    
    // Apply sorting
    result.sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];
      
      // Handle special cases
      if (sortConfig.key === "name") {
        aValue = `${a.firstName} ${a.lastName}`;
        bValue = `${b.firstName} ${b.lastName}`;
      }
      
      if (!aValue) return 1;
      if (!bValue) return -1;
      
      if (sortConfig.key === "transferDate") {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      }
      
      if (aValue < bValue) {
        return sortConfig.direction === "asc" ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === "asc" ? 1 : -1;
      }
      return 0;
    });
    
    return result;
  }, [transfers, filters, sortConfig, teams]);
  
  // Available positions for filter
  const availablePositions = useMemo(() => {
    const positions = new Set();
    transfers.forEach(t => {
      if (t.position) positions.add(t.position);
    });
    return [...positions].sort();
  }, [transfers]);
  
  // Available conferences for filter
  const availableConferences = useMemo(() => {
    const conferences = new Set();
    teams.forEach(t => {
      if (t.conference) conferences.add(t.conference);
    });
    return [...conferences].sort();
  }, [teams]);
  
  // Handle player card click
  const handlePlayerClick = (transfer) => {
    setSelectedTransfer(prev => prev?.firstName === transfer.firstName && 
                               prev?.lastName === transfer.lastName ? null : transfer);
  };
  
  // Format date nicely
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };
  
  // Modified renderStars with staggered animations for the 5 stars
  const starVariants = {
    hidden: { opacity: 0, scale: 0.5 },
    visible: { opacity: 1, scale: 1 }
  };

  const renderStars = (count) => (
    <div className="star-rating">
      {[...Array(5)].map((_, i) => (
        <motion.span
          key={i}
          variants={starVariants}
          initial="hidden"
          animate="visible"
          transition={{ delay: i * 0.1, duration: 0.2 }}
        >
          <FaStar className={i < count ? "star filled" : "star empty"} />
        </motion.span>
      ))}
    </div>
  );

  // Animation variants for container and items
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.1
      }
    }
  };
  
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { duration: 0.5 }
    }
  };
  
  // Render loading state
  if (loading) {
    return (
      <div className="transfer-portal-container tp-theme">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading transfer portal data...</p>
        </div>
      </div>
    );
  }
  
  // Render error state
  if (error) {
    return (
      <div className="transfer-portal-container tp-theme">
        <div className="error-container">
          <FaExclamationTriangle className="error-icon" />
          <h2>Error Loading Data</h2>
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>Try Again</button>
        </div>
      </div>
    );
  }

  return (
    <div className="transfer-portal-container tp-theme">
      {/* Hero Section */}
      <div className="transfer-hero">
        <motion.div 
          className="hero-content"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1>Transfer Portal</h1>
          <p>Track player movement, commitments and opportunities</p>
        </motion.div>
      </div>
      
      {/* Statistics Cards */}
      <motion.div 
        className="stats-cards"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div className="stat-card" variants={itemVariants}>
          <h3>Total Players</h3>
          <div className="stat-value">{stats.totalTransfers}</div>
        </motion.div>
        
        <motion.div className="stat-card" variants={itemVariants}>
          <h3>Committed</h3>
          <div className="stat-value">{stats.committedCount}</div>
        </motion.div>
        
        <motion.div className="stat-card" variants={itemVariants}>
          <h3>Uncommitted</h3>
          <div className="stat-value">{stats.uncommittedCount}</div>
        </motion.div>
        
        <motion.div className="stat-card" variants={itemVariants}>
          <h3>Most Active Position</h3>
          <div className="stat-value">
            {Object.entries(stats.positionStats).sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A"}
          </div>
        </motion.div>
      </motion.div>
      
      {/* Filter Section */}
      <div className="filters-section">
        <div className="search-container">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search by name, school..."
            value={filters.searchTerm}
            onChange={handleSearchChange}
            className="search-input"
          />
          {filters.searchTerm && (
            <button 
              className="clear-search"
              onClick={() => handleFilterChange("searchTerm", "")}
            >
              ×
            </button>
          )}
        </div>
        
        <div className="filter-controls">
          <div className="filter-group">
            <label>Position</label>
            <select 
              value={filters.position}
              onChange={(e) => handleFilterChange("position", e.target.value)}
            >
              <option value="All">All Positions</option>
              {availablePositions.map(pos => (
                <option key={pos} value={pos}>{pos}</option>
              ))}
            </select>
          </div>
          
          <div className="filter-group">
            <label>Status</label>
            <select 
              value={filters.destinationStatus}
              onChange={(e) => handleFilterChange("destinationStatus", e.target.value)}
            >
              <option value="all">All Players</option>
              <option value="committed">Committed</option>
              <option value="uncommitted">Uncommitted</option>
            </select>
          </div>
          
          <div className="filter-group">
            <label>Min Stars</label>
            <select 
              value={filters.stars}
              onChange={(e) => handleFilterChange("stars", parseInt(e.target.value))}
            >
              <option value={0}>Any Rating</option>
              <option value={3}>3+ Stars</option>
              <option value={4}>4+ Stars</option>
              <option value={5}>5 Stars</option>
            </select>
          </div>
          
          <div className="filter-group">
            <label>Conference</label>
            <select 
              value={filters.conference}
              onChange={(e) => handleFilterChange("conference", e.target.value)}
            >
              <option value="All">All Conferences</option>
              {availableConferences.map(conf => (
                <option key={conf} value={conf}>{conf}</option>
              ))}
            </select>
          </div>
          
          {(filters.position !== "All" || 
            filters.destinationStatus !== "all" || 
            filters.stars > 0 || 
            filters.conference !== "All" || 
            filters.searchTerm) && (
            <button className="clear-filters" onClick={clearFilters}>
              Clear Filters
            </button>
          )}
        </div>
      </div>
      
      {/* Main Content - Two Column Layout */}
      <div className="content-layout">
        {/* Main Transfer Data */}
        <div className="transfer-main-content">
          <div className="results-count">
            Showing {filteredTransfers.length} of {transfers.length} transfers
          </div>
          
          {/* Transfer Cards Grid */}
          {filteredTransfers.length > 0 ? (
            <motion.div 
              className="transfer-cards-grid"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              <AnimatePresence>
                {filteredTransfers.map((transfer, index) => (
                  <motion.div 
                    key={`${transfer.firstName}-${transfer.lastName}-${index}`}
                    className={`transfer-card ${selectedTransfer?.firstName === transfer.firstName && 
                               selectedTransfer?.lastName === transfer.lastName ? 'expanded' : ''}`}
                    variants={itemVariants}
                    layoutId={`${transfer.firstName}-${transfer.lastName}-${index}`}
                    onClick={() => handlePlayerClick(transfer)}
                  >
                    <div className="transfer-card-header">
                      <div className="player-identity">
                        <div className="player-avatar">
                          <FaUserGraduate className="avatar-icon" />
                        </div>
                        <div>
                          <h3>{transfer.firstName} {transfer.lastName}</h3>
                          <div className="position-badge">{transfer.position || "N/A"}</div>
                        </div>
                      </div>
                      <div className="player-rating">
                        {renderStars(transfer.stars)}
                        {transfer.rating && <div className="rating-value">{parseFloat(transfer.rating).toFixed(2)}</div>}
                      </div>
                    </div>
                    
                    <div className="transfer-journey">
                      <div className="school origin">
                        <img 
                          src={getTeamLogo(transfer.origin)} 
                          alt={transfer.origin || "Origin"} 
                          className="school-logo"
                        />
                        <span className="school-name">{transfer.origin || "Unknown"}</span>
                      </div>
                      
                      <div className="journey-arrow">
                        <FaArrowRight className="arrow-icon" />
                      </div>
                      
                      <div className="school destination">
                        {transfer.destination ? (
                          <>
                            <img 
                              src={getTeamLogo(transfer.destination)} 
                              alt={transfer.destination} 
                              className="school-logo"
                            />
                            <span className="school-name">{transfer.destination}</span>
                          </>
                        ) : (
                          <div className="undecided">
                            Undecided
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="transfer-meta">
                      <div className="meta-item">
                        <FaCalendarAlt className="meta-icon" />
                        <span>{formatDate(transfer.transferDate)}</span>
                      </div>
                      <div className="meta-item">
                        <span className={`eligibility-badge ${transfer.eligibility.toLowerCase()}`}>
                          {transfer.eligibility}
                        </span>
                      </div>
                    </div>
                    
                    {/* Expanded Content */}
                    {selectedTransfer?.firstName === transfer.firstName && 
                     selectedTransfer?.lastName === transfer.lastName && (
                      <motion.div 
                        className="transfer-details"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                      >
                        <div className="detail-grid">
                          <div className="detail-item">
                            <span className="detail-label">Transfer Date</span>
                            <span className="detail-value">{formatDate(transfer.transferDate)}</span>
                          </div>
                          
                          <div className="detail-item">
                            <span className="detail-label">Origin Conference</span>
                            <span className="detail-value">{getTeamConference(transfer.origin) || "N/A"}</span>
                          </div>
                          
                          {transfer.destination && (
                            <div className="detail-item">
                              <span className="detail-label">Destination Conference</span>
                              <span className="detail-value">{getTeamConference(transfer.destination) || "N/A"}</span>
                            </div>
                          )}
                          
                          <div className="detail-item">
                            <span className="detail-label">Eligibility</span>
                            <span className="detail-value">{transfer.eligibility}</span>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          ) : (
            <div className="no-results">
              <p>No transfers match your filters.</p>
              <button className="clear-filters" onClick={clearFilters}>
                Clear Filters
              </button>
            </div>
          )}
        </div>
        
        {/* Side content - News */}
        <div className="transfer-side-content">
          <div className="side-content-header">
            <h2>Transfer News</h2>
          </div>
          
          {newsLoading ? (
            <div className="side-loading">Loading news...</div>
          ) : news.length > 0 ? (
            <div className="news-list">
              {news.slice(0, 5).map((article, index) => (
                <a 
                  href={article.url} 
                  target="_blank"
                  rel="noopener noreferrer"
                  key={index}
                  className="news-item"
                >
                  {article.image && (
                    <div className="news-image">
                      <img src={article.image} alt={article.title} />
                    </div>
                  )}
                  <div className="news-content">
                    <h4>{article.title}</h4>
                    <div className="news-source">
                      {article.source.name}
                    </div>
                  </div>
                </a>
              ))}
            </div>
          ) : (
            <div className="no-news">No transfer news available.</div>
          )}
          
          {/* Conference Transfer Activity */}
          <div className="conference-activity">
            <h3>Conference Transfer Activity</h3>
            <div className="conference-bars">
              {Object.entries(stats.conferenceStats)
                .filter(([_, stats]) => stats.gained > 0 || stats.lost > 0)
                .sort((a, b) => (b[1].gained - b[1].lost) - (a[1].gained - a[1].lost))
                .slice(0, 5)
                .map(([conference, stats]) => (
                  <div key={conference} className="conference-bar">
                    <div className="conference-name">{conference}</div>
                    <div className="activity-bar">
                      <div 
                        className="gained-bar"
                        style={{ 
                          width: `${(stats.gained / (stats.gained + stats.lost)) * 100}%`,
                        }}
                      >
                        {stats.gained > 0 && `+${stats.gained}`}
                      </div>
                      <div 
                        className="lost-bar"
                        style={{ 
                          width: `${(stats.lost / (stats.gained + stats.lost)) * 100}%`,
                        }}
                      >
                        {stats.lost > 0 && `-${stats.lost}`}
                      </div>
                    </div>
                    <div className="net-change">
                      Net: {stats.gained - stats.lost > 0 ? '+' : ''}{stats.gained - stats.lost}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransferPortal;
