import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { 
  FaUserTie, FaSort, FaSortUp, FaSortDown, FaFilter, FaInfoCircle, 
  FaTrophy, FaExclamationTriangle, FaTachometerAlt, FaStar 
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import newsService from "../services/newsService";
import teamsService from "../services/teamsService"; // getCoaches is here
import youtubeService from "../services/youtubeService";
import "../styles/CoachOverview.css";

// Helper to aggregate season data for a coach
const aggregateCoachData = (seasons) => {
  return seasons.reduce(
    (acc, season) => {
      acc.games += season.games || 0;
      acc.wins += season.wins || 0;
      acc.losses += season.losses || 0;
      // Ties still counted internally but not displayed:
      acc.ties += season.ties || 0;
      acc.srs += season.srs || 0;
      acc.spOverall += season.spOverall || 0;
      acc.spOffense += season.spOffense || 0;
      acc.spDefense += season.spDefense || 0;
      acc.count++;
      return acc;
    },
    {
      games: 0,
      wins: 0,
      losses: 0,
      ties: 0,
      srs: 0,
      spOverall: 0,
      spOffense: 0,
      spDefense: 0,
      count: 0,
    }
  );
};

// Enhanced coach evaluation system
const getCoachStatus = (coach, metrics) => {
  // Minimum games threshold for reliable evaluation
  const MIN_GAMES_THRESHOLD = 12;
  
  // Extract metrics from the passed object
  const { winPct, composite, trend, games, programStrength, expectations } = metrics;
  
  // If coach doesn't have enough games, mark as "Unproven"
  if (games < MIN_GAMES_THRESHOLD) {
    return {
      text: "Unproven",
      color: "#6c757d",
      icon: <FaInfoCircle />,
      className: "status-badge-unproven"
    };
  }
  
  // Calculate performance vs expectations
  // Higher number means overperforming expectations
  const performanceVsExpectations = composite - (expectations * 0.8);
  
  // Factor in trending performance
  const trendAdjustedScore = composite + (trend * 5);
  
  // Determine final rating with context-aware thresholds
  // Programs with strong history have higher expectations
  const premiereThreshold = 35 + (programStrength * 0.3);
  const hotSeatThreshold = 28 + (programStrength * 0.2);
  
  // Final decision logic with multiple factors considered
  if (trendAdjustedScore >= premiereThreshold || performanceVsExpectations > 8) {
    return {
      text: "Premiere",
      color: "var(--success-color)",
      icon: <FaTrophy />,
      className: "status-badge-premiere"
    };
  } else if (trendAdjustedScore < hotSeatThreshold || performanceVsExpectations < -5 || 
            (winPct < 40 && games > 24)) {
    return {
      text: "Hot Seat",
      color: "var(--danger-color)",
      icon: <FaExclamationTriangle />,
      className: "status-badge-hotseat"
    };
  } else {
    return {
      text: "Average",
      color: "var(--info-color)",
      icon: <FaTachometerAlt />,
      className: "status-badge-average"
    };
  }
};

// Helper: returns a sortable value for each column
const getSortableValue = (coach, field) => {
  const agg = aggregateCoachData(coach.seasons);
  const lastSeason = coach.seasons[coach.seasons.length - 1] || {};
  switch (field) {
    case "team":
      return lastSeason.school ? lastSeason.school.toLowerCase() : "";
    case "coachName":
      return (coach.firstName + " " + coach.lastName).toLowerCase();
    case "school":
      return lastSeason.school ? lastSeason.school.toLowerCase() : "";
    case "hireDate":
      return coach.hireDate ? new Date(coach.hireDate).getTime() : 0;
    case "games":
      return agg.games;
    case "wins":
      return agg.wins;
    case "losses":
      return agg.losses;
    case "winPct":
      return agg.games > 0 ? (agg.wins / agg.games) * 100 : 0;
    case "srs":
      return agg.count > 0 ? agg.srs / agg.count : 0;
    case "spOverall":
      return agg.count > 0 ? agg.spOverall / agg.count : 0;
    case "spOffense":
      return agg.count > 0 ? agg.spOffense / agg.count : 0;
    case "spDefense":
      return agg.count > 0 ? agg.spDefense / agg.count : 0;
    case "status":
      return agg.count > 0
        ? (agg.srs + agg.spOverall + agg.spOffense + agg.spDefense) / agg.count
        : 0;
    default:
      return 0;
  }
};

const CoachOverview = () => {
  const [coachInfo, setCoachInfo] = useState([]);
  const [news, setNews] = useState([]);
  const [teams, setTeams] = useState([]);
  const [videos, setVideos] = useState([]);
  const [loadingCoaches, setLoadingCoaches] = useState(true);
  const [loadingNews, setLoadingNews] = useState(true);
  const [loadingVideos, setLoadingVideos] = useState(true);
  const [selectedCoaches, setSelectedCoaches] = useState([]);
  const [sortField, setSortField] = useState("status");
  const [sortDirection, setSortDirection] = useState("desc");
  const [filterTerm, setFilterTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("profiles");
  const [detailsVisible, setDetailsVisible] = useState(null);
  const [showComparisonSection, setShowComparisonSection] = useState(false);
  const [tooltipVisible, setTooltipVisible] = useState(null);

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const [
          teamsData,
          coachesData,
          coachNewsData,
          footballNewsData,
          youtubeResponse1,
          youtubeResponse2,
        ] = await Promise.all([
          teamsService.getTeams(),
          teamsService.getCoaches(),
          newsService.fetchCollegeCoachNews(),
          newsService.fetchCollegeFootballNews(),
          youtubeService.fetchYoutubeData("college coach interviews"),
          youtubeService.fetchYoutubeData("college football coach highlights"),
        ]);

        setTeams(teamsData);

        // Get all coaches, not just those with 2024 seasons
        setCoachInfo(coachesData);

        const combinedNews = [
          ...(coachNewsData.articles || []),
          ...(footballNewsData.articles || []),
        ];
        setNews(combinedNews);

        const combinedVideos = [
          ...(youtubeResponse1.items || []),
          ...(youtubeResponse2.items || []),
        ];
        setVideos(combinedVideos);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoadingCoaches(false);
        setLoadingNews(false);
        setLoadingVideos(false);
      }
    };

    fetchAllData();
  }, []);

  // Helper: Get team logo based on school name
  const getTeamLogo = (school) => {
    const team = teams.find(
      (t) => t.school.toLowerCase() === school?.toLowerCase()
    );
    return team?.logos?.[0] || "/photos/default_team.png";
  };

  // Toggle selection of a single coach
  const handleSelectCoach = (coach) => {
    const coachKey = coach.firstName + " " + coach.lastName;
    if (selectedCoaches.some((c) => c.firstName + " " + c.lastName === coachKey)) {
      setSelectedCoaches(
        selectedCoaches.filter((c) => c.firstName + " " + c.lastName !== coachKey)
      );
    } else {
      const newSelection = [...selectedCoaches, coach];
      setSelectedCoaches(newSelection);
      
      // Auto-show comparison section when 2+ coaches are selected
      if (newSelection.length >= 2 && !showComparisonSection) {
        setShowComparisonSection(true);
        // Scroll to comparison section with slight delay
        setTimeout(() => {
          document.getElementById("comparison-section")?.scrollIntoView({ behavior: "smooth" });
        }, 300);
      }
    }
  };

  // Check if a coach is selected
  const isCoachSelected = (coach) => {
    const coachKey = coach.firstName + " " + coach.lastName;
    return selectedCoaches.some((c) => c.firstName + " " + c.lastName === coachKey);
  };

  // Sorting
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Get sort icon for column
  const getSortIcon = (field) => {
    if (sortField !== field) return <FaSort className="sort-icon" />;
    return sortDirection === "asc" ? <FaSortUp className="sort-icon" /> : <FaSortDown className="sort-icon" />;
  };

  // Handle status filter change
  const handleStatusFilter = (status) => {
    setStatusFilter(status);
  };

  // Clear all filters
  const clearFilters = () => {
    setFilterTerm("");
    setStatusFilter("all");
  };

  // Toggle coach details
  const toggleDetails = (coachName) => {
    setDetailsVisible(detailsVisible === coachName ? null : coachName);
  };

  // Handle tab change
  const changeTab = (tab) => {
    setActiveTab(tab);
  };

  // Process coaches for display
  const processedCoaches = coachInfo.map((coach) => {
    const agg = aggregateCoachData(coach.seasons);
    const lastSeason = coach.seasons[coach.seasons.length - 1] || {};
    const avgSrs = agg.count > 0 ? (agg.srs / agg.count).toFixed(1) : "N/A";
    const avgSpOverall = agg.count > 0 ? (agg.spOverall / agg.count).toFixed(1) : "N/A";
    const avgSpOffense = agg.count > 0 ? (agg.spOffense / agg.count).toFixed(1) : "N/A";
    const avgSpDefense = agg.count > 0 ? (agg.spDefense / agg.count).toFixed(1) : "N/A";
    const winPct = agg.games > 0 ? ((agg.wins / agg.games) * 100).toFixed(1) : "N/A";
    
    // Calculate trending performance over last 3 seasons (positive = improving)
    let trend = 0;
    const sortedSeasons = [...coach.seasons].sort((a, b) => b.year - a.year);
    if (sortedSeasons.length >= 3) {
      const recentSrsTrend = ((sortedSeasons[0].srs || 0) - (sortedSeasons[2].srs || 0)) / 3;
      const recentSpTrend = ((sortedSeasons[0].spOverall || 0) - (sortedSeasons[2].spOverall || 0)) / 3;
      const recentWinPctTrend = (
        ((sortedSeasons[0].wins || 0) / Math.max(1, (sortedSeasons[0].games || 1))) -
        ((sortedSeasons[2].wins || 0) / Math.max(1, (sortedSeasons[2].games || 1)))
      ) * 100 / 3;
      trend = (recentSrsTrend + recentSpTrend + recentWinPctTrend) / 3;
    }

    // Normalize metrics for better comparison
    const normalizedSrs = avgSrs === "N/A" ? 0 : Math.min(100, Math.max(0, parseFloat(avgSrs) * 10));
    const normalizedSpOverall = avgSpOverall === "N/A" ? 0 : Math.min(100, Math.max(0, parseFloat(avgSpOverall) * 10));
    const normalizedSpOffense = avgSpOffense === "N/A" ? 0 : Math.min(100, Math.max(0, parseFloat(avgSpOffense) * 10));
    const normalizedSpDefense = avgSpDefense === "N/A" ? 0 : Math.min(100, Math.max(0, (10 - parseFloat(avgSpDefense)) * 10)); // Invert defense (lower is better)
    
    // Weight recent seasons more heavily
    const currentYear = new Date().getFullYear();
    let weightedStats = {srs: 0, spOverall: 0, spOffense: 0, spDefense: 0, totalWeight: 0};
    coach.seasons.forEach(season => {
      const yearDiff = currentYear - season.year;
      const weight = Math.max(0, 1 - (yearDiff * 0.15)); // Decreasing weight for older seasons
      
      if (season.srs) weightedStats.srs += season.srs * weight;
      if (season.spOverall) weightedStats.spOverall += season.spOverall * weight;
      if (season.spOffense) weightedStats.spOffense += season.spOffense * weight;
      if (season.spDefense) weightedStats.spDefense += season.spDefense * weight;
      weightedStats.totalWeight += weight;
    });
    
    // Calculate recency-weighted metrics if we have valid weights
    const recentSrs = weightedStats.totalWeight > 0 ? weightedStats.srs / weightedStats.totalWeight : 0;
    const recentSpOverall = weightedStats.totalWeight > 0 ? weightedStats.spOverall / weightedStats.totalWeight : 0;
    const recentSpOffense = weightedStats.totalWeight > 0 ? weightedStats.spOffense / weightedStats.totalWeight : 0;
    const recentSpDefense = weightedStats.totalWeight > 0 ? weightedStats.spDefense / weightedStats.totalWeight : 0;
    
    // Get team/program data for context
    const teamData = teams.find(
      (t) => t.school.toLowerCase() === (lastSeason.school || "").toLowerCase()
    );
    const conference = teamData ? teamData.conference : "";
    
    // Program strength assessment (1-10 scale) - placeholder value until we have historical data
    const programStrength = teamData?.historicalPrestige || 5; // Would come from team database
    
    // Program expectations based on historical performance (normalized to same scale as composite)
    const expectations = programStrength * 5; // 1-10 scale converted to same scale as composite (0-50)
    
    // Enhanced weighted composite approach using normalized and recency-weighted metrics
    const wPct = winPct === "N/A" ? 0 : parseFloat(winPct);
    const normalizedComposite = (
      normalizedSrs * 0.2 + 
      normalizedSpOverall * 0.3 + 
      normalizedSpOffense * 0.2 + 
      normalizedSpDefense * 0.2 + 
      wPct * 0.3
    ) / 10; // Scale down to 0-50 range
    
    // Final composite also factors in recency-weighted metrics
    const composite = normalizedComposite * 0.7 + 
      ((recentSrs + recentSpOverall + (10 - recentSpDefense) + recentSpOffense) / 4) * 3; // Scale to match
  
    // Create metrics object for status calculation
    const metricsForStatus = {
      winPct: wPct,
      composite,
      trend,
      games: agg.games,
      programStrength,
      expectations,
      recentPerformance: {
        srs: recentSrs,
        spOverall: recentSpOverall,
        spOffense: recentSpOffense,
        spDefense: recentSpDefense
      },
      normalized: {
        srs: normalizedSrs,
        spOverall: normalizedSpOverall,
        spOffense: normalizedSpOffense,
        spDefense: normalizedSpDefense
      }
    };
    
    return {
      coach,
      team: lastSeason.school || "",
      coachName: coach.firstName + " " + coach.lastName,
      school: lastSeason.school || "",
      conference,
      hireDate: coach.hireDate ? new Date(coach.hireDate) : null,
      games: agg.games,
      wins: agg.wins,
      losses: agg.losses,
      winPct: wPct,
      srs: avgSrs === "N/A" ? 0 : parseFloat(avgSrs),
      spOverall: avgSpOverall === "N/A" ? 0 : parseFloat(avgSpOverall),
      spOffense: avgSpOffense === "N/A" ? 0 : parseFloat(avgSpOffense),
      spDefense: avgSpDefense === "N/A" ? 0 : parseFloat(avgSpDefense),
      composite,
      trend,
      programStrength,
      expectations,
      status: getCoachStatus(coach, metricsForStatus),
      hireDateFormatted: coach.hireDate
        ? new Date(coach.hireDate).toLocaleDateString("en-US", {
            month: "2-digit",
            year: "numeric",
          })
        : "N/A",
    };
  });

  // Apply filters to coaches
  let displayedCoaches = [...processedCoaches];
  
  // Apply search filter
// Apply search filter (by name, school, or conference)
if (filterTerm) {
  const searchTerm = filterTerm.toLowerCase();
  displayedCoaches = displayedCoaches.filter(
    coach => 
      coach.coachName.toLowerCase().includes(searchTerm) ||
      coach.school.toLowerCase().includes(searchTerm) ||
      (coach.conference && coach.conference.toLowerCase().includes(searchTerm))
  );
}
  // Apply status filter
  if (statusFilter !== "all") {
    displayedCoaches = displayedCoaches.filter(coach => {
      if (statusFilter === "premiere") {
        return coach.status.text === "Premiere";
      } else if (statusFilter === "average") {
        return coach.status.text === "Average";
      } else if (statusFilter === "hotseat") {
        return coach.status.text === "Hot Seat";
      } else if (statusFilter === "unproven") {
        return coach.status.text === "Unproven";
      }
      return true;
    });
  }

  // Sort processed coaches based on sortField/sortDirection
  displayedCoaches.sort((a, b) => {
    let aValue = getSortableValue(a.coach, sortField);
    let bValue = getSortableValue(b.coach, sortField);
    
    if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
    if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
    return 0;
  });

  // Build ranking maps for numeric categories (spDefense: lower is better)
  const categoriesForRanking = [
    { key: "wins", better: "higher" },
    { key: "losses", better: "lower" },
    { key: "winPct", better: "higher" },
    { key: "srs", better: "higher" },
    { key: "spOverall", better: "higher" },
    { key: "spOffense", better: "higher" },
    { key: "spDefense", better: "lower" },
  ];
  const rankingMap = {};
  categoriesForRanking.forEach((cat) => {
    const sorted = [...processedCoaches].sort((a, b) => {
      if (cat.better === "higher") {
        return b[cat.key] - a[cat.key];
      } else {
        return a[cat.key] - b[cat.key];
      }
    });
    rankingMap[cat.key] = {};
    sorted.forEach((coach, index) => {
      rankingMap[cat.key][coach.coachName] = index + 1;
    });
  });
  const totalCoaches = processedCoaches.length;

  // Build comparison data for selected coaches
  const comparisonData = selectedCoaches.map((coach) => {
    const processed = processedCoaches.find(
      c => c.coachName === coach.firstName + " " + coach.lastName
    );
    return {
      coach,
      processed
    };
  });

  // Define comparison categories for the comparison table
  const comparisonCategories = [
    { key: "wins", label: "Wins", better: "higher" },
    { key: "losses", label: "Losses", better: "lower" },
    { key: "winPct", label: "Win %", better: "higher" },
    { key: "srs", label: "SRS", better: "higher" },
    { key: "spOverall", label: "SP Overall", better: "higher" },
    { key: "spOffense", label: "SP Offense", better: "higher" },
    { key: "spDefense", label: "SP Defense", better: "lower" },
  ];

  // For each category, determine best and worst among selected coaches
  const getBestWorst = (key, better) => {
    const values = comparisonData.map((data) => data.processed[key]);
    if (values.length === 0) return { best: null, worst: null };
    let best, worst;
    if (better === "higher") {
      best = Math.max(...values);
      worst = Math.min(...values);
    } else {
      best = Math.min(...values);
      worst = Math.max(...values);
    }
    return { best, worst };
  };

  // Generate years of experience for coach details
  const getYearsOfExperience = (coach) => {
    if (coach.seasons && coach.seasons.length > 0) {
      const years = [...new Set(coach.seasons.map(s => s.year))];
      return years.length;
    }
    return "N/A";
  };

  // Tooltip content generation
  const getTooltipContent = (statKey) => {
    switch(statKey) {
      case "srs":
        return "Simple Rating System - A measure of team strength based on margin of victory and strength of schedule";
      case "spOverall":
        return "Success Percentage Overall - A rating that combines offensive and defensive performance";
      case "spOffense":
        return "Success Percentage Offense - A rating of the team's offensive efficiency";
      case "spDefense":
        return "Success Percentage Defense - A rating of the team's defensive efficiency (lower is better)";
      default:
        return "";
    }
  };

  // Animation variants
  const tableRowVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i) => ({ 
      opacity: 1, 
      y: 0,
      transition: { 
        delay: i * 0.05,
        duration: 0.3
      }
    }),
    exit: { opacity: 0, y: -20 }
  };

  // Card variants
  const cardVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.3 } },
    exit: { opacity: 0, scale: 0.9 }
  };

  return (
    <div className="coach-overview-container">
      {/* Hero Section */}
      <div className="coach-hero">
        <div className="hero-content">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            Coach Overview
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            Comprehensive analytics and insights on college football coaches
          </motion.p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="navigation-tabs">
        <button 
          className={`tab-button ${activeTab === 'profiles' ? 'active' : ''}`}
          onClick={() => changeTab('profiles')}
        >
          <FaUserTie /> Coach Profiles
        </button>
        <button 
          className={`tab-button ${activeTab === 'news' ? 'active' : ''}`}
          onClick={() => changeTab('news')}
        >
          News
        </button>
        <button 
          className={`tab-button ${activeTab === 'videos' ? 'active' : ''}`}
          onClick={() => changeTab('videos')}
        >
          Videos
        </button>
      </div>

      {/* Selected coaches chip bar */}
      {selectedCoaches.length > 0 && (
        <motion.div 
          className="selected-coaches-bar"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
        >
          <div className="selected-count">
            {selectedCoaches.length} {selectedCoaches.length === 1 ? 'Coach' : 'Coaches'} Selected
          </div>
          <div className="selected-chips">
            {selectedCoaches.map((coach, idx) => (
              <div key={idx} className="coach-chip">
                <span>{coach.firstName} {coach.lastName}</span>
                <button 
                  className="remove-coach" 
                  onClick={() => handleSelectCoach(coach)}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          {selectedCoaches.length >= 2 ? (
            <button 
              className="compare-button"
              onClick={() => {
                setShowComparisonSection(true);
                document.getElementById("comparison-section")?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              Compare
            </button>
          ) : (
            <div className="compare-hint">Select at least one more coach to compare</div>
          )}
        </motion.div>
      )}

      {/* Coach Profiles Tab Content */}
      {activeTab === 'profiles' && (
        <>
          {/* Coach Profiles Section */}
          <section className="coach-profiles-section">
            <div className="section-header">
              <h2>Coach Comparison Profiles</h2>
              <div className="filters-container">
                <div className="search-container">
                  <input
                    type="text"
                    placeholder="Search by name or school..."
                    value={filterTerm}
                    onChange={(e) => setFilterTerm(e.target.value)}
                    className="search-input"
                  />
                  {filterTerm && (
                    <button className="clear-search" onClick={() => setFilterTerm("")}>×</button>
                  )}
                </div>
                <div className="status-filters">
                  <button 
                    className={`status-filter ${statusFilter === "all" ? "active" : ""}`}
                    onClick={() => handleStatusFilter("all")}
                  >
                    All
                  </button>
                  <button 
                    className={`status-filter premiere ${statusFilter === "premiere" ? "active" : ""}`}
                    onClick={() => handleStatusFilter("premiere")}
                  >
                    <FaTrophy /> Premiere
                  </button>
                  <button 
                    className={`status-filter average ${statusFilter === "average" ? "active" : ""}`}
                    onClick={() => handleStatusFilter("average")}
                  >
                    <FaTachometerAlt /> Average
                  </button>
                  <button 
                    className={`status-filter hotseat ${statusFilter === "hotseat" ? "active" : ""}`}
                    onClick={() => handleStatusFilter("hotseat")}
                  >
                    <FaExclamationTriangle /> Hot Seat
                  </button>
                  <button 
                    className={`status-filter unproven ${statusFilter === "unproven" ? "active" : ""}`}
                    onClick={() => handleStatusFilter("unproven")}
                  >
                    <FaInfoCircle /> Unproven
                  </button>
                </div>
                {(filterTerm || statusFilter !== "all") && (
                  <button className="clear-filters" onClick={clearFilters}>
                    Clear Filters
                  </button>
                )}
              </div>
            </div>
            
            {loadingCoaches ? (
              <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Loading coach profiles...</p>
              </div>
            ) : displayedCoaches.length > 0 ? (
              <>
                <div className="results-count">
                  Showing {displayedCoaches.length} of {processedCoaches.length} coaches
                </div>
                
                <div className="coach-cards-container">
                  <AnimatePresence>
                    {displayedCoaches.map((item, index) => {
                      // Calculate extra ranking info
                      const rankWins = rankingMap["wins"][item.coachName];
                      const rankWinPct = rankingMap["winPct"][item.coachName];
                      const rankOverall = rankingMap["spOverall"][item.coachName];
                      
                      return (
                        <motion.div 
                          key={item.coachName}
                          className={`coach-card ${isCoachSelected(item.coach) ? 'selected' : ''}`}
                          variants={cardVariants}
                          initial="hidden"
                          animate="visible"
                          exit="exit"
                          custom={index}
                          layoutId={item.coachName}
                        >
                          <div className="coach-card-header">
                            <div className="coach-team-logo">
                              <img src={getTeamLogo(item.school)} alt={item.school} />
                            </div>
                            <div className="coach-info">
                              <h3 data-length={item.coachName.length > 20 ? 'very-long' : item.coachName.length > 15 ? 'long' : 'normal'}>{item.coachName}</h3>
                              <p>{item.school}</p>
                            </div>
                            
                            <div className={`coach-status ${item.status.className}`}>
                              {item.status.icon} {item.status.text}
                            </div>
                            
                            <div className="card-actions">
                              <button 
                                className={`select-coach-btn ${isCoachSelected(item.coach) ? 'selected' : ''}`}
                                onClick={() => handleSelectCoach(item.coach)}
                              >
                                {isCoachSelected(item.coach) ? 'Selected' : 'Select'}
                              </button>
                            </div>
                          </div>
                          
                          <div className="stats-grid">
                            {/* Win % */}
                            <div className="stat-item">
                              <div>
                                <span className="stat-label">Win %</span>
                                <span className="stat-value" style={{ color: '#222' }}>{item.winPct.toFixed(1)}%</span>
                              </div>
                              {rankWinPct <= 5 && (
                                <div className="glassy-metal">
                                  Top 5
                                </div>
                              )}
                            </div>

                            {/* Record */}
                            <div className="stat-item">
                              <div>
                                <span className="stat-label">Record</span>
                                <span className="stat-value" style={{ color: '#222' }}>
                                  {item.wins}-{item.losses}
                                </span>
                              </div>
                            </div>

                            {/* SP Overall */}
                            <div className="stat-item">
                              <div>
                                <span className="stat-label">SP Overall</span>
                                <span className="stat-value" style={{ color: '#222' }}>{item.spOverall.toFixed(1)}</span>
                              </div>
                              {rankOverall <= 5 && (
                                <div className="glassy-metal">
                                  Top 5
                                </div>
                              )}
                            </div>

                            {/* Experience */}
                            <div className="stat-item">
                              <div>
                                <span className="stat-label">Experience</span>
                                <span className="stat-value" style={{ color: '#222' }}>{getYearsOfExperience(item.coach)} yrs</span>
                              </div>
                            </div>
                          </div>
                          <button 
                            className="view-details-btn"
                            onClick={() => toggleDetails(item.coachName)}
                          >
                            {detailsVisible === item.coachName ? 'Hide Details' : 'View Details'}
                          </button>
                          
                          {detailsVisible === item.coachName && (
                            <motion.div 
                              className="coach-details"
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                            >
                              <div className="details-grid">
                                <div className="detail-item">
                                  <span className="detail-label">Hire Date</span>
                                  <span className="detail-value" style={{ color: '#222' }}>{item.hireDateFormatted}</span>
                                </div>
                                <div className="detail-item">
                                  <span className="detail-label">SRS</span>
                                  <span className="detail-value" style={{ color: '#222' }}>{item.srs.toFixed(1)}</span>
                                  <button 
                                    className="info-tooltip-trigger"
                                    onMouseEnter={() => setTooltipVisible("srs")}
                                    onMouseLeave={() => setTooltipVisible(null)}
                                  >
                                    <FaInfoCircle />
                                  </button>
                                  {tooltipVisible === "srs" && (
                                    <div className="info-tooltip">
                                      {getTooltipContent("srs")}
                                    </div>
                                  )}
                                </div>
                                <div className="detail-item">
                                  <span className="detail-label">SP Offense</span>
                                  <span className="detail-value" style={{ color: '#222' }}>{item.spOffense.toFixed(1)}</span>
                                  <button 
                                    className="info-tooltip-trigger"
                                    onMouseEnter={() => setTooltipVisible("spOffense")}
                                    onMouseLeave={() => setTooltipVisible(null)}
                                  >
                                    <FaInfoCircle />
                                  </button>
                                  {tooltipVisible === "spOffense" && (
                                    <div className="info-tooltip">
                                      {getTooltipContent("spOffense")}
                                    </div>
                                  )}
                                </div>
                                <div className="detail-item">
                                  <span className="detail-label">SP Defense</span>
                                  <span className="detail-value" style={{ color: '#222' }}>{item.spDefense.toFixed(1)}</span>
                                  <button 
                                    className="info-tooltip-trigger"
                                    onMouseEnter={() => setTooltipVisible("spDefense")}
                                    onMouseLeave={() => setTooltipVisible(null)}
                                  >
                                    <FaInfoCircle />
                                  </button>
                                  {tooltipVisible === "spDefense" && (
                                    <div className="info-tooltip">
                                      {getTooltipContent("spDefense")}
                                    </div>
                                  )}
                                </div>
                                {/* Trend indicator */}
                                <div className="detail-item">
                                  <span className="detail-label">Performance Trend</span>
                                  <div className="trend-indicator">
                                    {item.trend > 1 ? (
                                      <span className="trend-positive">
                                        <FaSortUp /> Strong Improvement ({item.trend.toFixed(1)})
                                      </span>
                                    ) : item.trend > 0.2 ? (
                                      <span className="trend-positive">
                                        <FaSortUp /> Improving ({item.trend.toFixed(1)})
                                      </span>
                                    ) : item.trend > -0.2 ? (
                                      <span className="trend-neutral">
                                        <FaSort /> Stable ({item.trend.toFixed(1)})
                                      </span>
                                    ) : item.trend > -1 ? (
                                      <span className="trend-negative">
                                        <FaSortDown /> Declining ({item.trend.toFixed(1)})
                                      </span>
                                    ) : (
                                      <span className="trend-negative">
                                        <FaSortDown /> Strong Decline ({item.trend.toFixed(1)})
                                      </span>
                                    )}
                                  </div>
                                </div>
                                {/* Program context */}
                                <div className="detail-item">
                                  <span className="detail-label">Program Expectations</span>
                                  <div className="program-context">
                                    {item.programStrength > 7 ? (
                                      <span className="program-elite">Elite Program</span>
                                    ) : item.programStrength > 5 ? (
                                      <span className="program-strong">Strong Program</span>
                                    ) : item.programStrength > 3 ? (
                                      <span className="program-average">Average Program</span>
                                    ) : (
                                      <span className="program-building">Building Program</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>

                {/* Stats Info Card */}
                <div className="stats-info-card">
                  <div className="info-card-header">
                    <h3><FaInfoCircle /> Stat Definitions</h3>
                  </div>
                  <div className="stats-descriptions">
                    <div className="stat-description">
                      <strong>SRS:</strong> Simple Rating System - measures team strength relative to opponents.
                    </div>
                    <div className="stat-description">
                      <strong>SP Overall:</strong> Success Percentage Overall - combined offensive and defensive rating.
                    </div>
                    <div className="stat-description">
                      <strong>SP Offense:</strong> Success Percentage Offense - offensive efficiency rating.
                    </div>
                    <div className="stat-description">
                      <strong>SP Defense:</strong> Success Percentage Defense - defensive efficiency rating (lower is better).
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="no-results">
                <p>No coaches match your search criteria.</p>
                <button className="clear-filters" onClick={clearFilters}>Clear Filters</button>
              </div>
            )}
          </section>

          {/* Comparison Section */}
          {showComparisonSection && selectedCoaches.length >= 2 && (
            <motion.section 
              id="comparison-section"
              className="coach-comparison-section"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="section-header">
                <h2>Coach Comparison</h2>
                <button 
                  className="close-comparison-btn"
                  onClick={() => setShowComparisonSection(false)}
                >
                  Close Comparison
                </button>
              </div>

              <div className="comparison-cards">
                {comparisonData.map((data, idx) => (
                  <div key={idx} className="comparison-coach-card">
                    <div className="coach-logo-wrap">
                      <img 
                        src={getTeamLogo(data.processed?.school)} 
                        alt={data.processed?.school} 
                        className="comparison-team-logo"
                      />
                    </div>
                    <h3>{data.coach.firstName} {data.coach.lastName}</h3>
                    <p>{data.processed?.school}</p>
                    <div className="comparison-quick-stats">
                      <div className="quick-stat">
                        <span className="stat-number">
                          {data.processed?.winPct.toFixed(1)}%
                        </span>
                        <span className="stat-label">Win %</span>
                      </div>
                      <div className="quick-stat">
                        <span className="stat-number">
                          {data.processed?.composite.toFixed(1)}
                        </span>
                        <span className="stat-label">Rating</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="comparison-chart-container">
                <h3>Statistical Comparison</h3>
                <div className="radar-chart-placeholder">
                  <div className="comparison-table-container">
                    <table className="comparison-table">
                      <thead>
                        <tr>
                          <th>Category</th>
                          {comparisonData.map((data, idx) => (
                            <th key={idx} className="coach-col">
                              {data.coach.firstName} {data.coach.lastName}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {comparisonCategories.map((cat) => {
                          const values = comparisonData.map((d) => d.processed[cat.key]);
                          let best, worst;
                          if (values.length > 0) {
                            if (cat.better === "higher") {
                              best = Math.max(...values);
                              worst = Math.min(...values);
                            } else {
                              best = Math.min(...values);
                              worst = Math.max(...values);
                            }
                          } else {
                            best = null;
                            worst = null;
                          }

                          return (
                            <tr key={cat.key}>
                              <td className="category-label">
                                {cat.label}
                                <span className="tooltip-icon">
                                  <FaInfoCircle />
                                  <span className="tooltip-text">
                                    {getTooltipContent(cat.key)}
                                  </span>
                                </span>
                              </td>
                              {comparisonData.map((data, idx2) => {
                                const value = data.processed[cat.key];
                                let cellClass = "";
                                if (value === best) {
                                  cellClass = "best-value";
                                } else if (value === worst) {
                                  cellClass = "worst-value";
                                }
                                return (
                                  <td key={idx2} className={cellClass}>
                                    {cat.key === "winPct"
                                      ? value.toFixed(1) + "%"
                                      : value.toFixed(1)
                                    }
                                  </td>
                                );
                              })}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </motion.section>
          )}
        </>
      )}

      {/* News Tab Content */}
      {activeTab === 'news' && (
        <section className="coach-news-section">
          <div className="section-header">
            <h2>Coach News</h2>
          </div>
          
          {loadingNews ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Loading news...</p>
            </div>
          ) : news.length > 0 ? (
            <>
              <motion.div 
                className="featured-news"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <a
                  href={news[0].url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="featured-news-card"
                >
                  {news[0].image && (
                    <div className="featured-image-container">
                      <img
                        src={news[0].image}
                        alt={news[0].title}
                        className="featured-image"
                      />
                    </div>
                  )}
                  <div className="featured-news-details">
                    <div className="news-source-badge">
                      {news[0].source.name}
                    </div>
                    <h3>{news[0].title}</h3>
                    <p>{news[0].description}</p>
                    <div className="news-date">
                      {news[0].publishedAt 
                        ? new Date(news[0].publishedAt).toLocaleDateString() 
                        : 'Recent'
                      }
                    </div>
                  </div>
                </a>
              </motion.div>
              
              <div className="news-list">
                {news.slice(1, 7).map((article, idx) => (
                  <motion.a
                    key={idx}
                    href={article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="news-card"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: idx * 0.1 }}
                  >
                    {article.image && (
                      <div className="news-image-container">
                        <img
                          src={article.image}
                          alt={article.title}
                          className="news-image"
                        />
                      </div>
                    )}
                    <div className="news-details">
                      <div className="news-source-badge small">
                        {article.source.name}
                      </div>
                      <h4>{article.title}</h4>
                      <div className="news-date small">
                        {article.publishedAt 
                          ? new Date(article.publishedAt).toLocaleDateString() 
                          : 'Recent'
                        }
                      </div>
                    </div>
                  </motion.a>
                ))}
              </div>
            </>
          ) : (
            <div className="no-results">
              <p>No news available at this time.</p>
            </div>
          )}
        </section>
      )}

      {/* Videos Tab Content */}
      {activeTab === 'videos' && (
        <section className="coach-videos-section">
          <div className="section-header">
            <h2>Coach Videos</h2>
          </div>
          
          {loadingVideos ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Loading videos...</p>
            </div>
          ) : videos.length > 0 ? (
            <div className="video-grid">
              {videos.slice(0, 6).map((video, idx) => (
                <motion.div 
                  key={video.id.videoId} 
                  className="video-card"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: idx * 0.1 }}
                >
                  <div className="video-container">
                    <iframe
                      width="100%"
                      height="100%"
                      src={`https://www.youtube.com/embed/${video.id.videoId}`}
                      title={video.snippet.title}
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    ></iframe>
                  </div>
                  <div className="video-info">
                    <h4>{video.snippet.title}</h4>
                    <div className="video-channel">
                      {video.snippet.channelTitle}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="no-results">
              <p>No videos available at this time.</p>
            </div>
          )}
        </section>
      )}
    </div>
  );
};

export default CoachOverview;