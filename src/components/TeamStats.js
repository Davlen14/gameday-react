import React, { useState, useEffect } from "react";
import teamsService from "../services/teamsService";
// Import react-icons
import { 
  FaFootballBall, 
  FaInfoCircle, 
  FaChartLine, 
  FaChartBar, 
  FaShieldAlt,
  FaRunning, 
  FaClock, 
  FaExchangeAlt,
  FaArrowCircleRight,
  FaArrowDown,
  FaArrowUp,
  FaFlag,
  FaTrophy,
  FaPercentage,
  FaSortAmountUp,
  FaRegChartBar,
  FaExclamationTriangle
} from "react-icons/fa";
import { 
  GiAmericanFootballHelmet, 
  GiFootprint, 
  GiWhistle, 
  GiWalkingBoot 
} from "react-icons/gi";
import { 
  IoMdStats, 
  IoMdFootball, 
  IoMdTrendingUp 
} from "react-icons/io";
import { 
  BiTimer, 
  BiDownArrow, 
  BiFootball 
} from "react-icons/bi";
import { 
  AiOutlineLoading3Quarters, 
  AiOutlineWarning 
} from "react-icons/ai";
import { 
  BsArrowRepeat, 
  BsChevronDown, 
  BsChevronUp,
  BsDot
} from "react-icons/bs";
import "../styles/TeamStats.css";

const TeamStats = ({ teamName, year = 2024, teamColor }) => {
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeCategory, setActiveCategory] = useState('general');
  const [showInfoCard, setShowInfoCard] = useState(false);
  const [categories, setCategories] = useState({});
  const [kpis, setKpis] = useState(null);
  
  // Default to red if no team color is provided
  const accentColor = teamColor || "#D4001C";
  
  // Generate a lighter variation of the team color for gradients
  const lightenColor = (color, percent) => {
    const num = parseInt(color.replace('#', ''), 16),
          amt = Math.round(2.55 * percent),
          R = (num >> 16) + amt,
          G = (num >> 8 & 0x00FF) + amt,
          B = (num & 0x0000FF) + amt;
    return '#' + (0x1000000 + (R < 255 ? R : 255) * 0x10000 +
                  (G < 255 ? G : 255) * 0x100 +
                  (B < 255 ? B : 255)).toString(16).slice(1);
  };
  
  // Generate a darker variation of the team color
  const darkenColor = (color, percent) => {
    const num = parseInt(color.replace('#', ''), 16),
          amt = Math.round(2.55 * percent),
          R = (num >> 16) - amt,
          G = (num >> 8 & 0x00FF) - amt,
          B = (num & 0x0000FF) - amt;
    return '#' + (0x1000000 + (R > 0 ? R : 0) * 0x10000 +
                  (G > 0 ? G : 0) * 0x100 +
                  (B > 0 ? B : 0)).toString(16).slice(1);
  };
  
  // Color for gradient effects
  const accentColorLight = lightenColor(accentColor, 20);
  const accentColorDark = darkenColor(accentColor, 20);
  
  // Get contrast color for text
  const getContrastColor = (hexColor) => {
    hexColor = hexColor.replace('#', '');
    const r = parseInt(hexColor.substr(0, 2), 16);
    const g = parseInt(hexColor.substr(2, 2), 16);
    const b = parseInt(hexColor.substr(4, 2), 16);
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return (yiq >= 128) ? '#000000' : '#ffffff';
  };
  
  // Determine text color to use against team color background
  const contrastColor = getContrastColor(accentColor);

  // Helper function to safely get stat value
  const getStatValue = (name) => {
    const stat = stats.find(s => s && s.statName === name);
    return stat ? parseFloat(stat.statValue) : 0;
  };

  useEffect(() => {
    const fetchTeamStats = async () => {
      try {
        setLoading(true);
        // Fetch team stats for the given team and year
        const data = await teamsService.getTeamStats(teamName, year);
        
        // Make sure data is an array before setting it to state
        if (Array.isArray(data)) {
          setStats(data);
          console.log("Stats fetched successfully:", data);
        } else if (data && typeof data === 'object') {
          // If it's an object but not an array, convert it to an array
          const statsArray = Object.keys(data).map(key => ({
            statName: key,
            statValue: data[key]
          }));
          setStats(statsArray);
          console.log("Stats converted to array:", statsArray);
        } else {
          // If it's neither an array nor an object, set to empty array
          console.error('Unexpected data format:', data);
          setStats([]);
        }
      } catch (err) {
        console.error("Error fetching team stats:", err);
        setError(err.message || "Error fetching team stats.");
      } finally {
        setLoading(false);
      }
    };
  
    if (teamName) {
      fetchTeamStats();
    }
  }, [teamName, year]);

  // Calculate key performance indicators
  useEffect(() => {
    if (!stats || stats.length === 0) return;
    
    // Get basic stats values
    const games = getStatValue("games");
    const totalYards = getStatValue("totalYards");
    const netPassingYards = getStatValue("netPassingYards");
    const rushingYards = getStatValue("rushingYards");
    const passingTDs = getStatValue("passingTDs");
    const rushingTDs = getStatValue("rushingTDs");
    const kickReturnTDs = getStatValue("kickReturnTDs");
    const puntReturnTDs = getStatValue("puntReturnTDs");
    const interceptionTDs = getStatValue("interceptionTDs");
    const thirdDowns = getStatValue("thirdDowns");
    const thirdDownConversions = getStatValue("thirdDownConversions");
    const fourthDowns = getStatValue("fourthDowns");
    const fourthDownConversions = getStatValue("fourthDownConversions");
    const turnovers = getStatValue("turnovers");
    const interceptions = getStatValue("interceptions");
    const fumblesRecovered = getStatValue("fumblesRecovered");
    const passCompletions = getStatValue("passCompletions");
    const passAttempts = getStatValue("passAttempts");
    const rushingAttempts = getStatValue("rushingAttempts");
    
    // Calculate all the required metrics
    const yardsPerGame = games ? Math.round(totalYards / games) : 0;
    const passingYardPercentage = totalYards ? Math.round((netPassingYards / totalYards) * 100) : 0;
    const rushingYardPercentage = totalYards ? Math.round((rushingYards / totalYards) * 100) : 0;
    const estimatedPoints = (passingTDs + rushingTDs + kickReturnTDs + puntReturnTDs + interceptionTDs) * 7;
    const estimatedPointsPerGame = games ? Math.round(estimatedPoints / games) : 0;
    const thirdDownConversionPercentage = thirdDowns ? Math.round((thirdDownConversions / thirdDowns) * 100) : 0;
    const fourthDownConversionPercentage = fourthDowns ? Math.round((fourthDownConversions / fourthDowns) * 100) : 0;
    const turnoverMargin = (interceptions + fumblesRecovered) - turnovers;
    const completionPercentage = passAttempts ? parseFloat((passCompletions / passAttempts * 100).toFixed(1)) : 0;
    const yardsPerAttempt = passAttempts ? parseFloat((netPassingYards / passAttempts).toFixed(1)) : 0;
    const yardsPerCarry = rushingAttempts ? parseFloat((rushingYards / rushingAttempts).toFixed(1)) : 0;
    
    setKpis({
      yardsPerGame,
      estimatedPointsPerGame,
      thirdDownConversionPercentage,
      turnoverMargin,
      passingYardPercentage,
      rushingYardPercentage,
      estimatedPoints,
      fourthDownConversionPercentage,
      completionPercentage,
      yardsPerAttempt,
      yardsPerCarry
    });
    
    console.log("KPIs calculated:", {
      yardsPerGame,
      estimatedPointsPerGame,
      thirdDownConversionPercentage,
      turnoverMargin,
      passingYardPercentage,
      rushingYardPercentage,
      estimatedPoints,
      fourthDownConversionPercentage,
      completionPercentage,
      yardsPerAttempt,
      yardsPerCarry
    });
  }, [stats]);

  // Process stats into categories
  useEffect(() => {
    if (!stats || stats.length === 0 || !kpis) return;
    
    console.log("Processing stats into categories...");
    
    // Create categories object
    const categoriesObj = {
      general: {
        name: "General",
        icon: <IoMdStats />,
        stats: ["games", "firstDowns", "totalYards", "penalties", "penaltyYards", "turnovers", "possessionTime"]
      },
      offense: {
        name: "Offense",
        icon: <FaFootballBall />,
        stats: [
          "netPassingYards", "passAttempts", "passCompletions", "passingTDs", 
          "rushingYards", "rushingAttempts", "rushingTDs"
        ]
      },
      defense: {
        name: "Defense",
        icon: <FaShieldAlt />,
        stats: ["sacks", "interceptions", "interceptionYards", "interceptionTDs", "tacklesForLoss", "fumblesRecovered"]
      },
      specialTeams: {
        name: "Special Teams",
        icon: <FaTrophy />,
        stats: [
          "kickReturns", "kickReturnYards", "kickReturnTDs", 
          "puntReturns", "puntReturnYards", "puntReturnTDs"
        ]
      },
      situational: {
        name: "Situational",
        icon: <FaPercentage />,
        stats: [
          "thirdDowns", "thirdDownConversions", 
          "fourthDowns", "fourthDownConversions",
          "fumblesLost", "passesIntercepted"
        ]
      }
    };
    
    // Stats we've already processed (to avoid duplicates)
    const processedStats = new Set();
    
    // Process explicitly categorized stats
    Object.keys(categoriesObj).forEach(categoryKey => {
      const category = categoriesObj[categoryKey];
      category.statList = [];
      
      category.stats.forEach(statName => {
        try {
          const statObj = stats.find(s => s && s.statName === statName);
          if (statObj) {
            category.statList.push(statObj);
            processedStats.add(statName);
          }
        } catch (err) {
          console.error(`Error finding stat ${statName}:`, err);
        }
      });
    });
    
    try {
      // Create a misc category for any uncategorized stats
      const miscStats = stats.filter(s => s && s.statName && !processedStats.has(s.statName));
      if (miscStats.length > 0) {
        categoriesObj.misc = {
          name: "Miscellaneous",
          icon: <FaRegChartBar />,
          statList: miscStats
        };
      }
    } catch (err) {
      console.error("Error creating misc category:", err);
    }
    
    try {
      // Add derived metrics
      if (categoriesObj.offense && categoriesObj.offense.statList) {
        categoriesObj.offense.statList.push(
          { statName: "completionPercentage", statValue: kpis.completionPercentage, derived: true },
          { statName: "yardsPerAttempt", statValue: kpis.yardsPerAttempt, derived: true },
          { statName: "yardsPerCarry", statValue: kpis.yardsPerCarry, derived: true }
        );
      }
      
      // Add special teams efficiency
      const kickReturns = getStatValue("kickReturns");
      const kickReturnYards = getStatValue("kickReturnYards");
      const kickReturnAverage = kickReturns > 0 ? parseFloat((kickReturnYards / kickReturns).toFixed(1)) : 0;
      
      const puntReturns = getStatValue("puntReturns");
      const puntReturnYards = getStatValue("puntReturnYards");
      const puntReturnAverage = puntReturns > 0 ? parseFloat((puntReturnYards / puntReturns).toFixed(1)) : 0;
      
      if (categoriesObj.specialTeams && categoriesObj.specialTeams.statList) {
        categoriesObj.specialTeams.statList.push(
          { statName: "kickReturnAverage", statValue: kickReturnAverage, derived: true },
          { statName: "puntReturnAverage", statValue: puntReturnAverage, derived: true }
        );
      }

      // Add situational derived metrics
      if (categoriesObj.situational && categoriesObj.situational.statList) {
        categoriesObj.situational.statList.push(
          { statName: "thirdDownConversionPercentage", statValue: kpis.thirdDownConversionPercentage, derived: true },
          { statName: "fourthDownConversionPercentage", statValue: kpis.fourthDownConversionPercentage, derived: true }
        );
      }
      
    } catch (err) {
      console.error("Error adding derived metrics:", err);
    }
    
    setCategories(categoriesObj);
    console.log("Categories processed:", categoriesObj);
  }, [stats, kpis]);
  
  // Format stat name for display
  const formatStatName = (name) => {
    // Handle specific stats
    const specialCases = {
      "netPassingYards": "Passing Yards",
      "passCompletions": "Pass Completions",
      "passAttempts": "Pass Attempts",
      "passingTDs": "Passing Touchdowns",
      "rushingYards": "Rushing Yards",
      "rushingAttempts": "Rushing Attempts",
      "rushingTDs": "Rushing Touchdowns",
      "thirdDowns": "3rd Down Attempts",
      "thirdDownConversions": "3rd Down Conversions",
      "thirdDownConversionPercentage": "3rd Down Conversion %",
      "fourthDowns": "4th Down Attempts",
      "fourthDownConversions": "4th Down Conversions",
      "fourthDownConversionPercentage": "4th Down Conversion %",
      "possessionTime": "Time of Possession",
      "kickReturns": "Kick Returns",
      "kickReturnYards": "Kick Return Yards",
      "kickReturnTDs": "Kick Return TDs",
      "puntReturns": "Punt Returns",
      "puntReturnYards": "Punt Return Yards",
      "puntReturnTDs": "Punt Return TDs",
      "interceptionYards": "Interception Return Yards",
      "interceptionTDs": "Interception Return TDs",
      "passesIntercepted": "Passes Intercepted",
      "tacklesForLoss": "Tackles For Loss",
      "fumblesRecovered": "Fumbles Recovered",
      "fumblesLost": "Fumbles Lost",
      "totalYards": "Total Yards",
      "firstDowns": "First Downs",
      "penaltyYards": "Penalty Yards",
      // Derived stats
      "completionPercentage": "Completion %",
      "yardsPerAttempt": "Yards per Attempt",
      "yardsPerCarry": "Yards per Carry",
      "kickReturnAverage": "Kick Return Average",
      "puntReturnAverage": "Punt Return Average"
    };
    
    if (specialCases[name]) {
      return specialCases[name];
    }
    
    // Default formatting: capitalize first letter and add spaces before capital letters
    return name
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (str) => str.toUpperCase());
  };
  
  // Format stat value for display
  const formatStatValue = (name, value) => {
    // Handle time of possession specially
    if (name === "possessionTime") {
      const totalSeconds = parseInt(value, 10);
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds - (hours * 3600)) / 60);
      const seconds = totalSeconds - (hours * 3600) - (minutes * 60);
      
      if (hours > 0) {
        return `${hours}h ${minutes}m ${seconds}s`;
      } else {
        return `${minutes}m ${seconds}s`;
      }
    }
    
    // Add percentage sign for derived percentage metrics
    if (name === "completionPercentage" || 
        name === "thirdDownConversionPercentage" || 
        name === "fourthDownConversionPercentage") {
      return `${value}%`;
    }
    
    // Default: just return the value
    return value;
  };
  
  // Get icon for a specific stat
  const getStatIcon = (statName) => {
    const iconMap = {
      // General
      "games": <FaFootballBall className="stat-icon" />,
      "totalYards": <FaChartBar className="stat-icon" />,
      "firstDowns": <FaArrowCircleRight className="stat-icon" />,
      "penalties": <FaFlag className="stat-icon" />,
      "penaltyYards": <FaFlag className="stat-icon" />,
      "turnovers": <FaExchangeAlt className="stat-icon" />,
      "possessionTime": <FaClock className="stat-icon" />,
      
      // Offense
      "netPassingYards": <IoMdFootball className="stat-icon" />,
      "passAttempts": <IoMdFootball className="stat-icon" />,
      "passCompletions": <IoMdFootball className="stat-icon" />,
      "passingTDs": <IoMdFootball className="stat-icon" />,
      "rushingYards": <FaRunning className="stat-icon" />,
      "rushingAttempts": <FaRunning className="stat-icon" />,
      "rushingTDs": <FaRunning className="stat-icon" />,
      "completionPercentage": <IoMdFootball className="stat-icon" />,
      "yardsPerAttempt": <IoMdFootball className="stat-icon" />,
      "yardsPerCarry": <FaRunning className="stat-icon" />,
      
      // Defense
      "sacks": <GiWalkingBoot className="stat-icon" />,
      "interceptions": <FaShieldAlt className="stat-icon" />,
      "interceptionYards": <FaShieldAlt className="stat-icon" />,
      "interceptionTDs": <FaShieldAlt className="stat-icon" />,
      "tacklesForLoss": <GiFootprint className="stat-icon" />,
      "fumblesRecovered": <FaShieldAlt className="stat-icon" />,
      
      // Special Teams
      "kickReturns": <FaExchangeAlt className="stat-icon" />,
      "kickReturnYards": <FaExchangeAlt className="stat-icon" />,
      "kickReturnTDs": <FaExchangeAlt className="stat-icon" />,
      "puntReturns": <FaExchangeAlt className="stat-icon" />,
      "puntReturnYards": <FaExchangeAlt className="stat-icon" />,
      "puntReturnTDs": <FaExchangeAlt className="stat-icon" />,
      "kickReturnAverage": <FaExchangeAlt className="stat-icon" />,
      "puntReturnAverage": <FaExchangeAlt className="stat-icon" />,
      
      // Situational
      "thirdDowns": <BiDownArrow className="stat-icon" />,
      "thirdDownConversions": <BiDownArrow className="stat-icon" />,
      "thirdDownConversionPercentage": <FaPercentage className="stat-icon" />,
      "fourthDowns": <BiDownArrow className="stat-icon" />,
      "fourthDownConversions": <BiDownArrow className="stat-icon" />,
      "fourthDownConversionPercentage": <FaPercentage className="stat-icon" />,
      "fumblesLost": <FaExchangeAlt className="stat-icon" />,
      "passesIntercepted": <FaExchangeAlt className="stat-icon" />
    };
    
    return iconMap[statName] || <IoMdStats className="stat-icon" />;
  };
  
  // Determine if a value is good/bad for color coding
  const getRatingClass = (statName, value) => {
    // This is a simplified rating system
    // In a real application, you would compare to league averages
    const highIsGood = [
      "netPassingYards", "passCompletions", "passingTDs", 
      "rushingYards", "rushingTDs", "totalYards", "firstDowns",
      "thirdDownConversions", "fourthDownConversions", "interceptions",
      "sacks", "interceptionYards", "interceptionTDs", "tacklesForLoss",
      "fumblesRecovered", "kickReturnYards", "puntReturnYards",
      "kickReturnTDs", "puntReturnTDs", "completionPercentage",
      "yardsPerAttempt", "yardsPerCarry", "kickReturnAverage", "puntReturnAverage",
      "thirdDownConversionPercentage", "fourthDownConversionPercentage"
    ];
    
    const lowIsGood = [
      "penalties", "penaltyYards", "turnovers", "fumblesLost",
      "passesIntercepted"
    ];
    
    // No rating for neutral stats
    const neutralStats = [
      "games", "passAttempts", "rushingAttempts", "possessionTime",
      "thirdDowns", "fourthDowns", "kickReturns", "puntReturns"
    ];
    
    if (neutralStats.includes(statName)) return "";
    
    if (highIsGood.includes(statName)) {
      // For high-is-good stats, rating depends on magnitude
      if (statName === "netPassingYards" && value > 3500) return "excellent-value";
      if (statName === "rushingYards" && value > 2500) return "excellent-value";
      if (statName === "totalYards" && value > 6000) return "excellent-value";
      if (statName === "sacks" && value > 40) return "excellent-value";
      if (statName === "interceptions" && value > 15) return "excellent-value";
      if (statName === "completionPercentage" && value > 65) return "excellent-value";
      if (statName === "yardsPerAttempt" && value > 8) return "excellent-value";
      if (statName === "yardsPerCarry" && value > 5) return "excellent-value";
      if (statName === "thirdDownConversionPercentage" && value > 50) return "excellent-value";
      if (statName === "fourthDownConversionPercentage" && value > 60) return "excellent-value";
      
      // Default high-value rating
      if (value > 0) return "good-value";
    }
    
    if (lowIsGood.includes(statName)) {
      // For low-is-good stats
      if (statName === "turnovers" && value < 15) return "excellent-value";
      if (statName === "penalties" && value < 60) return "excellent-value";
      if (statName === "penaltyYards" && value < 500) return "excellent-value";
      
      // Default low-value rating
      return value < 20 ? "good-value" : "poor-value";
    }
    
    return "";
  };
  
  // Render the cards for a category
  const renderCategoryCards = (category) => {
    if (!category || !category.statList) return null;
    
    return category.statList.map((stat, index) => {
      const statName = stat.statName;
      const statValue = stat.statValue;
      const displayName = formatStatName(statName);
      const displayValue = formatStatValue(statName, statValue);
      const ratingClass = getRatingClass(statName, statValue);
      
      return (
        <div className="stat-card" key={`${statName}-${index}`}>
          <div className="stat-card-inner">
            <div className="stat-name">
              {getStatIcon(statName)}
              <span>{displayName}</span>
            </div>
            <div className={`stat-value ${ratingClass}`}>
              {displayValue}
              {(statName === "thirdDownConversions" || statName === "fourthDownConversions") && (
                <div className="stat-percentage">
                  <div 
                    className="percentage-bar"
                    style={{ 
                      width: `${statName === "thirdDownConversions" 
                        ? kpis.thirdDownConversionPercentage 
                        : kpis.fourthDownConversionPercentage}%`, 
                      background: accentColor 
                    }}
                  ></div>
                  <span className="percentage-text">
                    {statName === "thirdDownConversions" 
                      ? kpis.thirdDownConversionPercentage 
                      : kpis.fourthDownConversionPercentage}%
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    });
  };
  
  // Generate comparison cards for key metrics
  const renderComparisonCards = () => {
    if (!kpis) return null;
    
    // Define key metrics to compare
    const keyMetrics = [
      { 
        title: "Passing vs. Rushing", 
        stats: ["netPassingYards", "rushingYards"],
        values: [getStatValue("netPassingYards"), getStatValue("rushingYards")],
        percentages: [kpis.passingYardPercentage, kpis.rushingYardPercentage]
      },
      { 
        title: "Offensive TDs", 
        stats: ["passingTDs", "rushingTDs"],
        values: [getStatValue("passingTDs"), getStatValue("rushingTDs")],
        percentages: [
          Math.round((getStatValue("passingTDs") / (getStatValue("passingTDs") + getStatValue("rushingTDs"))) * 100) || 0,
          Math.round((getStatValue("rushingTDs") / (getStatValue("passingTDs") + getStatValue("rushingTDs"))) * 100) || 0
        ]
      },
      { 
        title: "Down Conversions", 
        stats: ["thirdDownConversions", "fourthDownConversions"],
        values: [getStatValue("thirdDownConversions"), getStatValue("fourthDownConversions")],
        percentages: [kpis.thirdDownConversionPercentage, kpis.fourthDownConversionPercentage]
      }
    ];
    
    return keyMetrics.map((metric, index) => {
      if (!metric.values[0] && !metric.values[1]) return null;
      
      return (
        <div className="comparison-card" key={index}>
          <div className="comparison-title">{metric.title}</div>
          <div className="comparison-bars">
            <div className="comparison-bar-container">
              <div className="comparison-label">
                {formatStatName(metric.stats[0])}
                <span className="comparison-value">{metric.values[0]}</span>
              </div>
              <div className="comparison-bar-wrapper">
                <div 
                  className="comparison-bar first-bar"
                  style={{ width: `${metric.percentages[0]}%`, background: accentColor }}
                ></div>
              </div>
              <div className="comparison-percentage">{metric.percentages[0]}%</div>
            </div>
            
            <div className="comparison-bar-container">
              <div className="comparison-label">
                {formatStatName(metric.stats[1])}
                <span className="comparison-value">{metric.values[1]}</span>
              </div>
              <div className="comparison-bar-wrapper">
                <div 
                  className="comparison-bar second-bar"
                  style={{ width: `${metric.percentages[1]}%`, background: darkenColor(accentColor, 20) }}
                ></div>
              </div>
              <div className="comparison-percentage">{metric.percentages[1]}%</div>
            </div>
          </div>
        </div>
      );
    });
  };

  if (loading) {
    return (
      <div className="team-stats">
        <div className="loading-container">
          <div className="loading-spinner">
            <AiOutlineLoading3Quarters className="spinner-icon" />
          </div>
          <div className="loading-text">Loading team statistics...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="team-stats">
        <div className="error-container">
          <div className="error-icon">
            <AiOutlineWarning />
          </div>
          <div className="error-message">Error: {error}</div>
          <button className="retry-button" onClick={() => window.location.reload()}>
            <BsArrowRepeat className="button-icon" /> Retry
          </button>
        </div>
      </div>
    );
  }

  if (!stats || stats.length === 0) {
    return (
      <div className="team-stats">
        <div className="error-container">
          <div className="error-icon">
            <FaExclamationTriangle />
          </div>
          <div className="error-message">No statistics available for this team</div>
        </div>
      </div>
    );
  }

  // Debug output for KPIs
  console.log("Rendering with KPIs:", kpis);
  console.log("Rendering with categories:", categories);

  return (
    <div className="team-stats">
      <div className="stats-header">
        <h1>
          <GiAmericanFootballHelmet className="team-icon" style={{ color: accentColor }} />
          <span>{teamName} Team Stats</span>
          <span className="year-badge" style={{ background: accentColor, color: contrastColor }}>{year}</span>
        </h1>
        <button 
          className="info-button" 
          onClick={() => setShowInfoCard(!showInfoCard)}
          style={{ background: accentColor, color: contrastColor }}
        >
          <FaInfoCircle className="button-icon" />
          {showInfoCard ? "Hide Information" : "What Do These Stats Mean?"}
        </button>
      </div>

      {showInfoCard && (
        <div className="info-card">
          <div className="info-card-header" style={{ background: accentColor, color: contrastColor }}>
            <h3>
              <FaInfoCircle className="card-header-icon" />
              Understanding Team Statistics
            </h3>
            <button className="close-button" onClick={() => setShowInfoCard(false)}>×</button>
          </div>
          <div className="info-card-content">
            <p>These statistics represent the team's performance across various aspects of the game. Key metrics are highlighted to show areas of strength and weakness.</p>
            
            <div className="stat-definitions">
              <div className="stat-definition">
                <h4 style={{ color: accentColor }}>
                  <FaChartBar className="stat-icon" /> Offensive Stats
                </h4>
                <p>Passing and rushing statistics show how the team moves the ball. High yardage and touchdown numbers indicate an effective offense.</p>
              </div>
              <div className="stat-definition">
                <h4 style={{ color: accentColor }}>
                  <FaShieldAlt className="stat-icon" /> Defensive Stats
                </h4>
                <p>Sacks, interceptions, and tackles for loss demonstrate the defense's ability to disrupt opposing offenses and create turnover opportunities.</p>
              </div>
              <div className="stat-definition">
                <h4 style={{ color: accentColor }}>
                  <FaPercentage className="stat-icon" /> Efficiency Metrics
                </h4>
                <p>Third and fourth down conversion rates show how effectively the team maintains possession in crucial situations.</p>
              </div>
            </div>
            
            <div className="legend">
              <div className="legend-item">
                <span className="legend-color excellent-legend"></span>
                <span>Excellent</span>
              </div>
              <div className="legend-item">
                <span className="legend-color good-legend"></span>
                <span>Good</span>
              </div>
              <div className="legend-item">
                <span className="legend-color poor-legend"></span>
                <span>Below Average</span>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Key Performance Indicators */}
      {kpis && (
        <div className="kpi-section">
          <div className="kpi-container">
            <div className="kpi-card" style={{ borderTop: `4px solid ${accentColor}` }}>
              <div className="kpi-icon">
                <FaChartBar />
              </div>
              <div className="kpi-value">{kpis.yardsPerGame}</div>
              <div className="kpi-label">Yards per Game</div>
            </div>
            
            <div className="kpi-card" style={{ borderTop: `4px solid ${accentColor}` }}>
              <div className="kpi-icon">
                <FaTrophy />
              </div>
              <div className="kpi-value">{kpis.estimatedPointsPerGame}</div>
              <div className="kpi-label">Est. Points per Game</div>
            </div>
            
            <div className="kpi-card" style={{ borderTop: `4px solid ${accentColor}` }}>
              <div className="kpi-icon">
                <FaPercentage />
              </div>
              <div className="kpi-value">{kpis.thirdDownConversionPercentage}%</div>
              <div className="kpi-label">3rd Down Conversion</div>
            </div>
            
            <div className="kpi-card" style={{ borderTop: `4px solid ${accentColor}` }}>
              <div className="kpi-icon">
                <FaExchangeAlt />
              </div>
              <div className="kpi-value" style={{ color: kpis.turnoverMargin > 0 ? '#16a34a' : '#dc2626' }}>
                {kpis.turnoverMargin > 0 ? '+' : ''}{kpis.turnoverMargin}
              </div>
              <div className="kpi-label">Turnover Margin</div>
            </div>
          </div>
        </div>
      )}
      
      {/* Comparison Charts */}
      <div className="comparison-section">
        <h2 className="section-title">
          <IoMdTrendingUp className="section-icon" style={{ color: accentColor }} />
          Key Metrics Comparison
        </h2>
        <div className="comparison-grid">
          {renderComparisonCards()}
        </div>
      </div>

      {/* Category Navigation */}
      <div className="category-tabs">
        {Object.keys(categories).map((categoryKey) => (
          <button
            key={categoryKey}
            className={`category-tab ${activeCategory === categoryKey ? 'active' : ''}`}
            onClick={() => setActiveCategory(categoryKey)}
            style={activeCategory === categoryKey ? { 
              background: accentColor, 
              color: contrastColor,
              borderColor: accentColor
            } : {}}
          >
            <span className="tab-icon">{categories[categoryKey].icon}</span>
            <span className="tab-text">{categories[categoryKey].name}</span>
          </button>
        ))}
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        {categories[activeCategory] && renderCategoryCards(categories[activeCategory])}
      </div>
    </div>
  );
};

export default TeamStats;