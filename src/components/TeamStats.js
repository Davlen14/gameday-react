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
  
  // Default to red if no team color is provided
  const accentColor = teamColor || "#D4001C";
  
  // Generate a lighter variation of the team color for gradients
  const lightenColor = (color, percent) => {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;
    return '#' + (0x1000000 + 
      (R < 255 ? R : 255) * 0x10000 +
      (G < 255 ? G : 255) * 0x100 +
      (B < 255 ? B : 255)
    ).toString(16).slice(1);
  };
  
  // Generate a darker variation of the team color
  const darkenColor = (color, percent) => {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) - amt;
    const G = (num >> 8 & 0x00FF) - amt;
    const B = (num & 0x0000FF) - amt;
    return '#' + (0x1000000 +
      (R > 0 ? R : 0) * 0x10000 +
      (G > 0 ? G : 0) * 0x100 +
      (B > 0 ? B : 0)
    ).toString(16).slice(1);
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

  useEffect(() => {
    const fetchTeamStats = async () => {
      try {
        setLoading(true);
        // Fetch team stats for the given team and year
        const data = await teamsService.getTeamStats(teamName, year);
        
        // Make sure data is an array before setting it to state
        if (Array.isArray(data)) {
          setStats(data);
        } else if (data && typeof data === 'object') {
          // If it's an object but not an array, convert it to an array
          const statsArray = Object.keys(data).map(key => ({
            statName: key,
            statValue: data[key]
          }));
          setStats(statsArray);
        } else {
          // If it's neither an array nor an object, set to empty array
          console.error('Unexpected data format:', data);
          setStats([]);
        }
      } catch (err) {
        setError(err.message || "Error fetching team stats.");
      } finally {
        setLoading(false);
      }
    };
  
    if (teamName) {
      fetchTeamStats();
    }
  }, [teamName, year]);

  // Create categories object to ensure all known stats are displayed
  const categories = {
    general: {
      name: "General",
      icon: <IoMdStats />,
      // Ensure these stats get displayed
      stats: [
        "games", 
        "firstDowns", 
        "totalYards", 
        "penalties", 
        "penaltyYards", 
        "turnovers", 
        "possessionTime"
      ]
    },
    offense: {
      name: "Offense",
      icon: <FaFootballBall />,
      stats: [
        "netPassingYards", 
        "passAttempts", 
        "passCompletions", 
        "passingTDs", 
        "rushingYards", 
        "rushingAttempts", 
        "rushingTDs"
      ]
    },
    defense: {
      name: "Defense",
      icon: <FaShieldAlt />,
      stats: [
        "sacks", 
        "interceptions", 
        "interceptionYards", 
        "interceptionTDs", 
        "tacklesForLoss", 
        "fumblesRecovered"
      ]
    },
    specialTeams: {
      name: "Special Teams",
      icon: <FaTrophy />,
      stats: [
        "kickReturns", 
        "kickReturnYards", 
        "kickReturnTDs", 
        "puntReturns", 
        "puntReturnYards", 
        "puntReturnTDs"
      ]
    },
    situational: {
      name: "Situational",
      icon: <FaPercentage />,
      stats: [
        "thirdDowns", 
        "thirdDownConversions", 
        "fourthDowns", 
        "fourthDownConversions",
        "fumblesLost", 
        "passesIntercepted"
      ]
    }
  };

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
      "fourthDowns": "4th Down Attempts",
      "fourthDownConversions": "4th Down Conversions",
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
      "puntReturnAverage": "Punt Return Average",
      "yardsPerGame": "Yards per Game",
      "passingYardPercentage": "Passing Yard %",
      "rushingYardPercentage": "Rushing Yard %",
      "estimatedPoints": "Estimated Points",
      "estimatedPointsPerGame": "Est. Points per Game",
      "thirdDownConversionPercentage": "3rd Down Conversion %",
      "fourthDownConversionPercentage": "4th Down Conversion %",
      "turnoverMargin": "Turnover Margin"
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
    
    // Add a "%" suffix for certain derived stats
    const percentStats = [
      "completionPercentage",
      "passingYardPercentage",
      "rushingYardPercentage",
      "thirdDownConversionPercentage",
      "fourthDownConversionPercentage"
    ];
    if (percentStats.includes(name)) {
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
      "yardsPerGame": <FaChartLine className="stat-icon" />,
      "passingYardPercentage": <FaChartLine className="stat-icon" />,
      "rushingYardPercentage": <FaChartLine className="stat-icon" />,
      
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
      "fourthDowns": <BiDownArrow className="stat-icon" />,
      "fourthDownConversions": <BiDownArrow className="stat-icon" />,
      "fumblesLost": <FaExchangeAlt className="stat-icon" />,
      "passesIntercepted": <FaExchangeAlt className="stat-icon" />,
      
      // Derived
      "estimatedPoints": <FaTrophy className="stat-icon" />,
      "estimatedPointsPerGame": <FaTrophy className="stat-icon" />,
      "thirdDownConversionPercentage": <FaPercentage className="stat-icon" />,
      "fourthDownConversionPercentage": <FaPercentage className="stat-icon" />,
      "turnoverMargin": <FaExchangeAlt className="stat-icon" />
    };
    
    return iconMap[statName] || <IoMdStats className="stat-icon" />;
  };

  // Determine if a value is good/bad for color coding (simplified)
  const getRatingClass = (statName, value) => {
    const highIsGood = [
      "netPassingYards", "passCompletions", "passingTDs", 
      "rushingYards", "rushingTDs", "totalYards", "firstDowns",
      "thirdDownConversions", "fourthDownConversions", "interceptions",
      "sacks", "interceptionYards", "interceptionTDs", "tacklesForLoss",
      "fumblesRecovered", "kickReturnYards", "puntReturnYards",
      "kickReturnTDs", "puntReturnTDs", "completionPercentage",
      "yardsPerAttempt", "yardsPerCarry", "kickReturnAverage", "puntReturnAverage",
      "yardsPerGame", "passingYardPercentage", "rushingYardPercentage",
      "estimatedPoints", "estimatedPointsPerGame", "thirdDownConversionPercentage",
      "fourthDownConversionPercentage", "turnoverMargin"
    ];
    
    const lowIsGood = [
      "penalties", "penaltyYards", "turnovers", "fumblesLost",
      "passesIntercepted"
    ];
    
    // Neutral stats
    const neutralStats = [
      "games", "passAttempts", "rushingAttempts", "possessionTime",
      "thirdDowns", "fourthDowns", "kickReturns", "puntReturns"
    ];
    
    if (neutralStats.includes(statName)) return "";
    
    if (highIsGood.includes(statName)) {
      // Example thresholds
      if (statName === "netPassingYards" && value > 3500) return "excellent-value";
      if (statName === "rushingYards" && value > 2500) return "excellent-value";
      if (statName === "totalYards" && value > 6000) return "excellent-value";
      if (statName === "sacks" && value > 40) return "excellent-value";
      if (statName === "completionPercentage" && value > 65) return "excellent-value";
      if (statName === "yardsPerAttempt" && value > 8) return "excellent-value";
      if (statName === "yardsPerCarry" && value > 5) return "excellent-value";
      if (statName === "turnoverMargin" && value > 5) return "excellent-value";
      
      return value > 0 ? "good-value" : "";
    }
    
    if (lowIsGood.includes(statName)) {
      if (statName === "turnovers" && value < 15) return "excellent-value";
      if (statName === "penalties" && value < 60) return "excellent-value";
      if (statName === "penaltyYards" && value < 500) return "excellent-value";
      return value < 20 ? "good-value" : "poor-value";
    }
    
    return "";
  };

  // Build categories (including derived stats)
  const processStats = () => {
    if (!Array.isArray(stats) || stats.length === 0) return {};

    // Convert the raw stats array into a quick lookup
    const getStatValue = (name) => {
      const statObj = stats.find(s => s && s.statName === name);
      return statObj ? Number(statObj.statValue) : 0;
    };
    
    // We'll store each category's "statList" here
    Object.keys(categories).forEach(categoryKey => {
      categories[categoryKey].statList = [];
    });
    
    // Keep track of which statNames we've already slotted
    const processedStats = new Set();
    
    // Insert each known stat into its category
    Object.keys(categories).forEach(categoryKey => {
      const category = categories[categoryKey];
      category.stats.forEach(statName => {
        const statObj = stats.find(s => s && s.statName === statName);
        if (statObj) {
          category.statList.push(statObj);
          processedStats.add(statName);
        }
      });
    });
    
    // Create a "misc" category for anything not in the above lists
    const miscStats = stats.filter(s => s && s.statName && !processedStats.has(s.statName));
    if (miscStats.length > 0) {
      categories.misc = {
        name: "Miscellaneous",
        icon: <FaRegChartBar />,
        statList: miscStats
      };
    }
    
    // ========================
    // ADD DERIVED CALCULATIONS
    // ========================
    
    const games = getStatValue("games");
    const totalYards = getStatValue("totalYards");
    const netPassingYards = getStatValue("netPassingYards");
    const rushingYards = getStatValue("rushingYards");
    const passingTDs = getStatValue("passingTDs");
    const rushingTDs = getStatValue("rushingTDs");
    const kickReturnTDs = getStatValue("kickReturnTDs");
    const puntReturnTDs = getStatValue("puntReturnTDs");
    const interceptionTDs = getStatValue("interceptionTDs");
    const passAttempts = getStatValue("passAttempts");
    const passCompletions = getStatValue("passCompletions");
    const thirdDowns = getStatValue("thirdDowns");
    const thirdDownConversions = getStatValue("thirdDownConversions");
    const fourthDowns = getStatValue("fourthDowns");
    const fourthDownConversions = getStatValue("fourthDownConversions");
    const interceptions = getStatValue("interceptions");
    const fumblesRecovered = getStatValue("fumblesRecovered");
    const turnovers = getStatValue("turnovers");
    const rushingAttempts = getStatValue("rushingAttempts");

    // Yards per Game
    const yardsPerGame = games > 0 ? (totalYards / games).toFixed(1) : 0;
    
    // Passing vs Rushing Yard %
    const passingYardPercentage = totalYards > 0 
      ? ((netPassingYards / totalYards) * 100).toFixed(1) 
      : 0;
    const rushingYardPercentage = totalYards > 0 
      ? ((rushingYards / totalYards) * 100).toFixed(1) 
      : 0;
    
    // Estimated Points (7 points per TD)
    const totalTDs = passingTDs + rushingTDs + kickReturnTDs + puntReturnTDs + interceptionTDs;
    const estimatedPoints = totalTDs * 7;
    const estimatedPointsPerGame = games > 0 
      ? (estimatedPoints / games).toFixed(1) 
      : 0;
    
    // 3rd & 4th Down Conversion %
    const thirdDownConversionPercentage = thirdDowns > 0 
      ? ((thirdDownConversions / thirdDowns) * 100).toFixed(1) 
      : 0;
    const fourthDownConversionPercentage = fourthDowns > 0 
      ? ((fourthDownConversions / fourthDowns) * 100).toFixed(1) 
      : 0;
    
    // Turnover Margin
    const turnoverMargin = (interceptions + fumblesRecovered) - turnovers;
    
    // Completion %
    const completionPercentage = passAttempts > 0 
      ? ((passCompletions / passAttempts) * 100).toFixed(1) 
      : 0;
    
    // Yards per Carry
    const yardsPerCarry = rushingAttempts > 0 
      ? (rushingYards / rushingAttempts).toFixed(1) 
      : 0;
    
    // Yards per Attempt (already derived in original code, but we'll unify)
    const yardsPerAttempt = passAttempts > 0 
      ? (netPassingYards / passAttempts).toFixed(1)
      : 0;

    // ================
    // PUSH DERIVED STATS
    // ================
    
    // We'll add them into relevant categories
    // General category
    if (categories.general && categories.general.statList) {
      categories.general.statList.push(
        { statName: "yardsPerGame", statValue: yardsPerGame, derived: true },
        { statName: "estimatedPoints", statValue: estimatedPoints, derived: true },
        { statName: "estimatedPointsPerGame", statValue: estimatedPointsPerGame, derived: true },
        { statName: "turnoverMargin", statValue: turnoverMargin, derived: true }
      );
    }
    
    // Offense category
    if (categories.offense && categories.offense.statList) {
      // If you already had yardsPerAttempt or completionPercentage, you can remove duplicates
      categories.offense.statList.push(
        { statName: "completionPercentage", statValue: completionPercentage, derived: true },
        { statName: "yardsPerAttempt", statValue: yardsPerAttempt, derived: true },
        { statName: "yardsPerCarry", statValue: yardsPerCarry, derived: true },
        { statName: "passingYardPercentage", statValue: passingYardPercentage, derived: true },
        { statName: "rushingYardPercentage", statValue: rushingYardPercentage, derived: true }
      );
    }
    
    // Situational category
    if (categories.situational && categories.situational.statList) {
      categories.situational.statList.push(
        { 
          statName: "thirdDownConversionPercentage", 
          statValue: thirdDownConversionPercentage, 
          derived: true 
        },
        { 
          statName: "fourthDownConversionPercentage", 
          statValue: fourthDownConversionPercentage, 
          derived: true 
        }
      );
    }
    
    // Return updated categories
    return categories;
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
      
      // Check if this is a conversion stat that needs a progress bar
      const isThirdDownConversion = statName === "thirdDownConversions";
      const isFourthDownConversion = statName === "fourthDownConversions";
      
      // We do simple percentage bars for those if needed
      let percentage = null;
      if (isThirdDownConversion || isFourthDownConversion) {
        const totalAttemptsName = isThirdDownConversion ? "thirdDowns" : "fourthDowns";
        const totalAttemptsObj = stats.find(s => s.statName === totalAttemptsName);
        const totalAttempts = totalAttemptsObj ? totalAttemptsObj.statValue : 0;
        if (totalAttempts > 0) {
          percentage = Math.round((statValue / totalAttempts) * 100);
        }
      }
      
      return (
        <div className="stat-card" key={`${statName}-${index}`}>
          <div className="stat-card-inner">
            <div className="stat-name">
              {getStatIcon(statName)}
              <span>{displayName}</span>
            </div>
            <div className={`stat-value ${ratingClass}`}>
              {displayValue}
              {percentage !== null && (
                <div className="stat-percentage">
                  <div 
                    className="percentage-bar"
                    style={{ width: `${percentage}%`, background: accentColor }}
                  ></div>
                  <span className="percentage-text">{percentage}%</span>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    });
  };

  // Build final categories object (with derived stats) once we have data
  const finalCategories = processStats();

  // Optional: A separate KPI section (already in your code) or you can rely solely on derived stats in categories
  // ...
  
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

  return (
    <div className="team-stats">
      <div className="stats-header">
        <h1>
          <GiAmericanFootballHelmet 
            className="team-icon" 
            style={{ color: accentColor }} 
          />
          <span>{teamName} Team Stats</span>
          <span 
            className="year-badge" 
            style={{ background: accentColor, color: contrastColor }}
          >
            {year}
          </span>
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
          <div 
            className="info-card-header" 
            style={{ background: accentColor, color: contrastColor }}
          >
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
                <p>Passing and rushing numbers show how effectively the team moves the ball. Higher yardage and touchdown counts typically indicate a more potent offense.</p>
              </div>
              <div className="stat-definition">
                <h4 style={{ color: accentColor }}>
                  <FaShieldAlt className="stat-icon" /> Defensive Stats
                </h4>
                <p>Sacks, interceptions, and tackles for loss demonstrate the defense's ability to disrupt opponents and create turnover opportunities.</p>
              </div>
              <div className="stat-definition">
                <h4 style={{ color: accentColor }}>
                  <FaPercentage className="stat-icon" /> Efficiency Metrics
                </h4>
                <p>Third and fourth down conversion rates show how well the team sustains drives in key situations.</p>
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

      {/* Example KPI Section (Optional) */}
      {/* 
        You could highlight a few key derived stats here if desired,
        or just rely on them showing up in the categories. 
      */}

      {/* Category Navigation */}
      <div className="category-tabs">
        {Object.keys(finalCategories).map((categoryKey) => (
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
            <span className="tab-icon">{finalCategories[categoryKey].icon}</span>
            <span className="tab-text">{finalCategories[categoryKey].name}</span>
          </button>
        ))}
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        {finalCategories[activeCategory] && renderCategoryCards(finalCategories[activeCategory])}
      </div>
    </div>
  );
};

export default TeamStats;
