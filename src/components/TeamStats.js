import React, { useState, useEffect, useCallback } from "react";
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
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;
    return '#' + (0x1000000 + (R < 255 ? R : 255) * 0x10000 +
                  (G < 255 ? G : 255) * 0x100 +
                  (B < 255 ? B : 255)).toString(16).slice(1);
  };
  
  // Generate a darker variation of the team color
  const darkenColor = (color, percent) => {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) - amt;
    const G = (num >> 8 & 0x00FF) - amt;
    const B = (num & 0x0000FF) - amt;
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

  // Helper function to safely get stat value, memoized to avoid unnecessary recalculations
  const getStatValue = useCallback((name) => {
    const stat = stats.find(s => s && s.statName === name);
    return stat ? Number(stat.statValue) : 0;
  }, [stats]);

  // Utility functions for precise calculations
  const calculatePercentage = (numerator, denominator) => {
    if (!denominator || denominator === 0) return 0;
    return Number(((numerator / denominator) * 100).toFixed(1));
  };

  const calculateRatio = (numerator, denominator) => {
    if (!denominator || denominator === 0) return 0;
    return Number((numerator / denominator).toFixed(1));
  };

  // Fetch team stats from the API
  useEffect(() => {
    const fetchTeamStats = async () => {
      try {
        setLoading(true);
        const data = await teamsService.getTeamStats(teamName, year);
        
        if (Array.isArray(data)) {
          const statsWithParsedValues = data.map(stat => ({
            ...stat,
            statValue: isNaN(Number(stat.statValue)) ? stat.statValue : Number(stat.statValue)
          }));
          setStats(statsWithParsedValues);
          console.log("Stats fetched successfully:", statsWithParsedValues);
        } else if (data && typeof data === 'object') {
          const statsArray = Object.keys(data).map(key => ({
            statName: key,
            statValue: isNaN(Number(data[key])) ? data[key] : Number(data[key])
          }));
          setStats(statsArray);
          console.log("Stats converted to array:", statsArray);
        } else {
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

  // Calculate key performance indicators (KPIs)
  useEffect(() => {
    if (!stats || stats.length === 0) return;
    
    try {
      // Set all KPIs to 0 as requested while keeping the structure
      const calculatedKpis = {
        yardsPerGame: 0,
        estimatedPointsPerGame: 0,
        thirdDownConversionPercentage: 0,
        fourthDownConversionPercentage: 0,
        turnoverMargin: 0,
        passingYardPercentage: 0,
        rushingYardPercentage: 0,
        completionPercentage: 0,
        yardsPerAttempt: 0,
        yardsPerCarry: 0,
        kickReturnAverage: 0,
        puntReturnAverage: 0,
        passingTDPercentage: 0,
        rushingTDPercentage: 0,
        totalTDs: 0,
        estimatedPoints: 0,
        takeaways: 0,
        yardsAllowedPerGame: 0,
        pointsAllowedPerGame: 0
      };
      
      setKpis(calculatedKpis);
    } catch (err) {
      console.error("Error calculating KPIs:", err);
    }
  }, [stats, getStatValue]);

  // Process stats into categories for display
  useEffect(() => {
    if (!stats || stats.length === 0 || !kpis) return;
    
    try {
      console.log("Processing stats into categories for display...");
      
      // Get list of all available stat names
      const availableStats = stats.map(stat => stat.statName);
      console.log("Available stats:", availableStats);
      
      // Define categories with assignment rules
      const categoriesObj = {
        general: {
          name: "General",
          icon: <IoMdStats />,
          stats: ["games", "firstDowns", "totalYards", "penalties", "penaltyYards", "turnovers", "possessionTime"]
        },
        offense: {
          name: "Offense",
          icon: <FaFootballBall />,
          stats: ["netPassingYards", "passAttempts", "passCompletions", "passingTDs", "rushingYards", "rushingAttempts", "rushingTDs"]
        },
        defense: {
          name: "Defense",
          icon: <FaShieldAlt />,
          stats: ["sacks", "interceptions", "interceptionYards", "interceptionTDs", "tacklesForLoss", "fumblesRecovered", "yardsAllowed", "pointsAllowed", "passesIntercepted"]
        },
        specialTeams: {
          name: "Special Teams",
          icon: <FaTrophy />,
          stats: ["kickReturns", "kickReturnYards", "kickReturnTDs", "puntReturns", "puntReturnYards", "puntReturnTDs"]
        },
        situational: {
          name: "Situational",
          icon: <FaPercentage />,
          stats: ["thirdDowns", "thirdDownConversions", "fourthDowns", "fourthDownConversions", "fumblesLost", "passesIntercepted"]
        },
        efficiency: {
          name: "Efficiency",
          icon: <FaChartLine />,
          stats: []
        },
        misc: {
          name: "Miscellaneous",
          icon: <FaRegChartBar />,
          stats: []
        }
      };
      
      const processedStats = new Set();
      
      // Process each category and assign stats to them
      Object.keys(categoriesObj).forEach(categoryKey => {
        const category = categoriesObj[categoryKey];
        category.statList = [];
        if (category.stats) {
          category.stats.forEach(statName => {
            const statObj = stats.find(s => s && s.statName === statName);
            if (statObj) {
              const statValue = isNaN(Number(statObj.statValue)) ? statObj.statValue : Number(statObj.statValue);
              category.statList.push({ ...statObj, statValue });
              processedStats.add(statName);
            } else if (statName === "yardsAllowed" || statName === "pointsAllowed") {
              // Create placeholder stats for missing defensive stats
              category.statList.push({ 
                statName: statName, 
                statValue: 0, 
                derived: true 
              });
            }
          });
        }
      });
      
      // Add remaining unprocessed stats to misc category
      const miscStats = stats.filter(s => s && s.statName && !processedStats.has(s.statName));
      if (miscStats.length > 0) {
        categoriesObj.misc.statList = miscStats.map(stat => ({
          ...stat,
          statValue: isNaN(Number(stat.statValue)) ? stat.statValue : Number(stat.statValue)
        }));
      }
      
      // Add derived metrics to the proper categories but with values of 0
      if (categoriesObj.offense && categoriesObj.offense.statList) {
        categoriesObj.offense.statList.push(
          { statName: "completionPercentage", statValue: 0, derived: true },
          { statName: "yardsPerAttempt", statValue: 0, derived: true },
          { statName: "yardsPerCarry", statValue: 0, derived: true }
        );
      }
      
      if (categoriesObj.specialTeams && categoriesObj.specialTeams.statList) {
        categoriesObj.specialTeams.statList.push(
          { statName: "kickReturnAverage", statValue: 0, derived: true },
          { statName: "puntReturnAverage", statValue: 0, derived: true }
        );
      }
      
      if (categoriesObj.situational && categoriesObj.situational.statList) {
        categoriesObj.situational.statList.push(
          { statName: "thirdDownConversionPercentage", statValue: 0, derived: true },
          { statName: "fourthDownConversionPercentage", statValue: 0, derived: true }
        );
      }
      
      // Add efficiency metrics to the efficiency category
      categoriesObj.efficiency.statList = [
        { statName: "yardsPerGame", statValue: 0, derived: true },
        { statName: "pointsPerGame", statValue: 0, derived: true },
        { statName: "turnoverEfficiency", statValue: 0, derived: true },
        { statName: "yardsAllowedPerGame", statValue: 0, derived: true },
        { statName: "pointsAllowedPerGame", statValue: 0, derived: true }
      ];
      
      setCategories(categoriesObj);
      console.log("Categories processed:", categoriesObj);
    } catch (err) {
      console.error("Error processing categories:", err);
    }
  }, [stats, kpis, getStatValue]);
  
  // Format stat names for display
  const formatStatName = (name) => {
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
      "yardsAllowed": "Yards Allowed",
      "pointsAllowed": "Points Allowed",
      // Derived stats
      "completionPercentage": "Completion %",
      "yardsPerAttempt": "Yards per Attempt",
      "yardsPerCarry": "Yards per Carry",
      "kickReturnAverage": "Kick Return Average",
      "puntReturnAverage": "Punt Return Average",
      "yardsPerGame": "Yards per Game",
      "pointsPerGame": "Points per Game",
      "turnoverEfficiency": "Turnover Margin",
      "yardsAllowedPerGame": "Yards Allowed per Game",
      "pointsAllowedPerGame": "Points Allowed per Game"
    };
    
    return specialCases[name] || name.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
  };
  
  // Format stat values for display
  const formatStatValue = (name, value) => {
    if (value === null || value === undefined) return '-';
    
    // Ensure value is properly converted to number for numeric operations
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    
    if (name === "possessionTime") {
      const totalSeconds = parseInt(numValue, 10);
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds - (hours * 3600)) / 60);
      const seconds = totalSeconds - (hours * 3600) - (minutes * 60);
      return hours > 0 ? `${hours}h ${minutes}m ${seconds}s` : `${minutes}m ${seconds}s`;
    }
    
    if (name.includes("Percentage") || name.endsWith("Percent") || name.endsWith("%")) {
      return `${numValue}%`;
    }
    
    if (name === "turnoverEfficiency" && numValue > 0) {
      return `+${numValue}`;
    }
    
    if (typeof numValue === 'number' && !isNaN(numValue)) {
      if (numValue % 1 !== 0) return numValue.toFixed(1);
      if (numValue >= 1000) return numValue.toLocaleString();
    }
    
    return value;
  };
  
  // Get icon for a specific stat
  const getStatIcon = (statName) => {
    const iconMap = {
      "games": <FaFootballBall className="stat-icon" />,
      "totalYards": <FaChartBar className="stat-icon" />,
      "firstDowns": <FaArrowCircleRight className="stat-icon" />,
      "penalties": <FaFlag className="stat-icon" />,
      "penaltyYards": <FaFlag className="stat-icon" />,
      "turnovers": <FaExchangeAlt className="stat-icon" />,
      "possessionTime": <FaClock className="stat-icon" />,
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
      "sacks": <GiWalkingBoot className="stat-icon" />,
      "interceptions": <FaShieldAlt className="stat-icon" />,
      "interceptionYards": <FaShieldAlt className="stat-icon" />,
      "interceptionTDs": <FaShieldAlt className="stat-icon" />,
      "tacklesForLoss": <GiFootprint className="stat-icon" />,
      "fumblesRecovered": <FaShieldAlt className="stat-icon" />,
      "kickReturns": <FaExchangeAlt className="stat-icon" />,
      "kickReturnYards": <FaExchangeAlt className="stat-icon" />,
      "kickReturnTDs": <FaExchangeAlt className="stat-icon" />,
      "puntReturns": <FaExchangeAlt className="stat-icon" />,
      "puntReturnYards": <FaExchangeAlt className="stat-icon" />,
      "puntReturnTDs": <FaExchangeAlt className="stat-icon" />,
      "kickReturnAverage": <FaExchangeAlt className="stat-icon" />,
      "puntReturnAverage": <FaExchangeAlt className="stat-icon" />,
      "thirdDowns": <BiDownArrow className="stat-icon" />,
      "thirdDownConversions": <BiDownArrow className="stat-icon" />,
      "thirdDownConversionPercentage": <FaPercentage className="stat-icon" />,
      "fourthDowns": <BiDownArrow className="stat-icon" />,
      "fourthDownConversions": <BiDownArrow className="stat-icon" />,
      "fourthDownConversionPercentage": <FaPercentage className="stat-icon" />,
      "fumblesLost": <FaExchangeAlt className="stat-icon" />,
      "passesIntercepted": <FaExchangeAlt className="stat-icon" />,
      "yardsPerGame": <FaChartLine className="stat-icon" />,
      "pointsPerGame": <FaTrophy className="stat-icon" />,
      "turnoverEfficiency": <FaExchangeAlt className="stat-icon" />,
      "yardsAllowed": <FaShieldAlt className="stat-icon" />,
      "pointsAllowed": <FaShieldAlt className="stat-icon" />,
      "yardsAllowedPerGame": <FaShieldAlt className="stat-icon" />,
      "pointsAllowedPerGame": <FaShieldAlt className="stat-icon" />
    };
    return iconMap[statName] || <IoMdStats className="stat-icon" />;
  };
  
  // Determine color rating for a stat value
  const getRatingClass = (statName, value) => {
    // Ensure value is a number for comparisons
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    
    const highIsGood = [
      "netPassingYards", "passCompletions", "passingTDs", 
      "rushingYards", "rushingTDs", "totalYards", "firstDowns",
      "thirdDownConversions", "fourthDownConversions", "interceptions",
      "sacks", "interceptionYards", "interceptionTDs", "tacklesForLoss",
      "fumblesRecovered", "kickReturnYards", "puntReturnYards",
      "kickReturnTDs", "puntReturnTDs", "completionPercentage",
      "yardsPerAttempt", "yardsPerCarry", "kickReturnAverage", "puntReturnAverage",
      "thirdDownConversionPercentage", "fourthDownConversionPercentage", "turnoverEfficiency",
      "yardsPerGame", "pointsPerGame"
    ];
    
    const lowIsGood = [
      "penalties", "penaltyYards", "turnovers", "fumblesLost",
      "passesIntercepted", "yardsAllowed", "pointsAllowed", 
      "yardsAllowedPerGame", "pointsAllowedPerGame"
    ];
    
    const neutralStats = [
      "games", "passAttempts", "rushingAttempts", "possessionTime",
      "thirdDowns", "fourthDowns", "kickReturns", "puntReturns"
    ];
    
    if (neutralStats.includes(statName)) return "";
    
    if (highIsGood.includes(statName)) {
      if (statName === "netPassingYards" && numValue > 3000) return "excellent-value";
      if (statName === "rushingYards" && numValue > 2000) return "excellent-value";
      if (statName === "totalYards" && numValue > 5000) return "excellent-value";
      if (statName === "yardsPerGame" && numValue > 400) return "excellent-value";
      if (statName === "pointsPerGame" && numValue > 30) return "excellent-value";
      if (statName === "sacks" && numValue > 35) return "excellent-value";
      if (statName === "interceptions" && numValue > 12) return "excellent-value";
      if (statName === "completionPercentage" && numValue > 65) return "excellent-value";
      if (statName === "yardsPerAttempt" && numValue > 7.5) return "excellent-value";
      if (statName === "yardsPerCarry" && numValue > 4.5) return "excellent-value";
      if (statName === "thirdDownConversionPercentage" && numValue > 45) return "excellent-value";
      if (statName === "fourthDownConversionPercentage" && numValue > 60) return "excellent-value";
      if (statName === "turnoverEfficiency" && numValue > 10) return "excellent-value";
      if (numValue > 0) return "good-value";
    }
    
    if (lowIsGood.includes(statName)) {
      if (statName === "turnovers" && numValue < 15) return "excellent-value";
      if (statName === "penalties" && numValue < 60) return "excellent-value";
      if (statName === "penaltyYards" && numValue < 500) return "excellent-value";
      if (statName === "yardsAllowedPerGame" && numValue < 300) return "excellent-value";
      if (statName === "pointsAllowedPerGame" && numValue < 20) return "excellent-value";
      return numValue < 20 ? "good-value" : "poor-value";
    }
    
    return "";
  };
  
  // Render cards for each category
  const renderCategoryCards = (category) => {
    if (!category || !category.statList) return null;
    
    return category.statList.map((stat, index) => {
      if (!stat) return null;
      
      const statName = stat.statName;
      // Ensure we're handling the value as a number for display
      let statValue;
      if (stat.derived) {
        // For derived stats, make sure we're handling them as numbers
        statValue = typeof stat.statValue === 'string' ? Number(stat.statValue) : Number(stat.statValue);
      } else {
        statValue = typeof stat.statValue === 'string' ? Number(stat.statValue) : stat.statValue;
      }
      
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
              {(statName === "thirdDownConversions" || statName === "fourthDownConversions") && kpis && (
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
  
  // Render comparison cards for key metrics
  const renderComparisonCards = () => {
    if (!kpis) return null;
    
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
        percentages: [kpis.passingTDPercentage, kpis.rushingTDPercentage]
      },
      { 
        title: "Down Conversions", 
        stats: ["thirdDownConversions", "fourthDownConversions"],
        values: [getStatValue("thirdDownConversions"), getStatValue("fourthDownConversions")],
        percentages: [kpis.thirdDownConversionPercentage, kpis.fourthDownConversionPercentage]
      }
    ];
    
    return keyMetrics.map((metric, index) => {
      if (metric.values[0] === 0 && metric.values[1] === 0) return null;
      
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
    }).filter(Boolean);
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

  if (!kpis) {
    return (
      <div className="team-stats">
        <div className="loading-container">
          <div className="loading-spinner">
            <AiOutlineLoading3Quarters className="spinner-icon" />
          </div>
          <div className="loading-text">Processing statistics...</div>
        </div>
      </div>
    );
  }

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
      <div className="kpi-section">
        <div className="kpi-container">
          <div className="kpi-card" style={{ borderTop: `4px solid ${accentColor}` }}>
            <div className="kpi-icon">
              <FaChartBar />
            </div>
            <div className="kpi-value">0</div>
            <div className="kpi-label">Yards per Game</div>
          </div>
          
          <div className="kpi-card" style={{ borderTop: `4px solid ${accentColor}` }}>
            <div className="kpi-icon">
              <FaTrophy />
            </div>
            <div className="kpi-value">0</div>
            <div className="kpi-label">Est. Points per Game</div>
          </div>
          
          <div className="kpi-card" style={{ borderTop: `4px solid ${accentColor}` }}>
            <div className="kpi-icon">
              <FaPercentage />
            </div>
            <div className="kpi-value">0%</div>
            <div className="kpi-label">3rd Down Conversion</div>
          </div>
          
          <div className="kpi-card" style={{ borderTop: `4px solid ${accentColor}` }}>
            <div className="kpi-icon">
              <FaExchangeAlt />
            </div>
            <div className="kpi-value">0</div>
            <div className="kpi-label">Turnover Margin</div>
          </div>
        </div>
      </div>
      
      {/* Comparison Charts */}
      <div className="comparison-section">
        <h2 className="section-title">
          <IoMdTrendingUp className="section-icon" style={{ color: accentColor }} />
          Key Metrics
        </h2>
        <div className="comparison-grid">
          {renderComparisonCards()}
        </div>
      </div>

      {/* Category Navigation */}
      <div className="category-tabs">
        {Object.keys(categories).map((categoryKey) => {
          // Only show categories that have stats
          if (categories[categoryKey].statList && categories[categoryKey].statList.length > 0) {
            return (
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
            );
          }
          return null;
        }).filter(Boolean)}
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        {categories[activeCategory] && renderCategoryCards(categories[activeCategory])}
      </div>
      
      {/* All Stats View */}
      <div className="all-stats-section">
        <h2 className="section-title">
          <IoMdStats className="section-icon" style={{ color: accentColor }} />
          All Team Statistics
        </h2>
        <div className="stats-grid all-stats-grid">
          {stats.map((stat, index) => {
            const statName = stat.statName;
            const statValue = typeof stat.statValue === 'string' ? Number(stat.statValue) : stat.statValue;
            const displayName = formatStatName(statName);
            const displayValue = formatStatValue(statName, statValue);
            const ratingClass = getRatingClass(statName, statValue);
            
            return (
              <div className="stat-card" key={`all-${statName}-${index}`}>
                <div className="stat-card-inner">
                  <div className="stat-name">
                    {getStatIcon(statName)}
                    <span>{displayName}</span>
                  </div>
                  <div className={`stat-value ${ratingClass}`}>
                    {displayValue}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default TeamStats;