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
  const [rawData, setRawData] = useState(null);
  // Moved the debug state to component level
  const [showDebug, setShowDebug] = useState(false);

  // Default to a neutral blue if no team color is provided (changed from red)
  const accentColor = teamColor || "#9e9e9e";
  
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

  // IMPROVED: Helper function to safely get stat value - fixed to properly handle string values
  const getStatValue = useCallback((name) => {
    const stat = stats.find(s => s && s.statName === name);
    if (!stat) return 0;
    return typeof stat.statValue === 'string' ? 
      parseFloat(stat.statValue) || 0 : 
      (typeof stat.statValue === 'number' ? stat.statValue : 0);
  }, [stats]);

  // IMPROVED: Utility functions for precise calculations with better error handling
  const calculatePercentage = (numerator, denominator) => {
    if (!denominator || denominator === 0 || isNaN(numerator) || isNaN(denominator)) return 0;
    const result = (numerator / denominator) * 100;
    return isNaN(result) ? 0 : Number(result.toFixed(1));
  };

  const calculateRatio = (numerator, denominator) => {
    if (!denominator || denominator === 0 || isNaN(numerator) || isNaN(denominator)) return 0;
    const result = numerator / denominator;
    return isNaN(result) ? 0 : Number(result.toFixed(1));
  };

  // IMPROVED: Fetch team stats from the API with better error handling
  useEffect(() => {
    const fetchTeamStats = async () => {
      try {
        setLoading(true);
        const data = await teamsService.getTeamStats(teamName, year);
        setRawData(data); // Store raw data for debugging
        
        if (Array.isArray(data) && data.length > 0) {
          // Convert all string numeric values to actual numbers
          const statsWithParsedValues = data.map(stat => {
            let parsedValue = stat.statValue;
            
            // Try to convert string values to numbers
            if (typeof parsedValue === 'string') {
              const numericValue = parseFloat(parsedValue);
              if (!isNaN(numericValue)) {
                parsedValue = numericValue;
              }
            }
            
            return {
              ...stat,
              statValue: parsedValue
            };
          });
          
          setStats(statsWithParsedValues);
          console.log("Stats parsed successfully:", statsWithParsedValues);
        } else if (data && typeof data === 'object') {
          const statsArray = Object.keys(data).map(key => {
            let parsedValue = data[key];
            
            // Try to convert string values to numbers
            if (typeof parsedValue === 'string') {
              const numericValue = parseFloat(parsedValue);
              if (!isNaN(numericValue)) {
                parsedValue = numericValue;
              }
            }
            
            return {
              statName: key,
              statValue: parsedValue
            };
          });
          
          setStats(statsArray);
          console.log("Stats converted to array:", statsArray);
        } else {
          console.error('Unexpected data format or empty data:', data);
          if (!data || data.length === 0) {
            setError("No statistics data available for this team.");
          } else {
            setError("Received unexpected data format from API.");
          }
          setStats([]);
        }
      } catch (err) {
        console.error("Error fetching team stats:", err);
        setError(err.message || "Error fetching team stats.");
        setStats([]);
      } finally {
        setLoading(false);
      }
    };
  
    if (teamName) {
      fetchTeamStats();
    }
  }, [teamName, year]);

  // IMPROVED: Calculate key performance indicators (KPIs) with better error handling
  useEffect(() => {
    if (!stats || stats.length === 0) return;
    
    try {
      // Get stat values with proper type conversion
      const getNumberStat = (name) => {
        const val = getStatValue(name);
        return typeof val === 'number' ? val : 0;
      };
      
      const games = getNumberStat("games") || 1; // Prevent division by zero
      const totalYards = getNumberStat("totalYards");
      const netPassingYards = getNumberStat("netPassingYards");
      const rushingYards = getNumberStat("rushingYards");
      const passingTDs = getNumberStat("passingTDs");
      const rushingTDs = getNumberStat("rushingTDs");
      const kickReturnTDs = getNumberStat("kickReturnTDs");
      const puntReturnTDs = getNumberStat("puntReturnTDs");
      const interceptionTDs = getNumberStat("interceptionTDs");
      const thirdDowns = getNumberStat("thirdDowns");
      const thirdDownConversions = getNumberStat("thirdDownConversions");
      const fourthDowns = getNumberStat("fourthDowns");
      const fourthDownConversions = getNumberStat("fourthDownConversions");
      const turnovers = getNumberStat("turnovers");
      const interceptions = getNumberStat("interceptions");
      const fumblesRecovered = getNumberStat("fumblesRecovered");
      const passCompletions = getNumberStat("passCompletions");
      const passAttempts = getNumberStat("passAttempts");
      const rushingAttempts = getNumberStat("rushingAttempts");
      
      // Calculate derived metrics
      const yardsPerGame = Math.round(totalYards / games);
      const passingYardPercentage = totalYards ? Math.round((netPassingYards / totalYards) * 100) : 0;
      const rushingYardPercentage = totalYards ? Math.round((rushingYards / totalYards) * 100) : 0;
      
      const totalTDs = passingTDs + rushingTDs + kickReturnTDs + puntReturnTDs + interceptionTDs;
      const estimatedPoints = totalTDs * 7;
      const estimatedPointsPerGame = Math.round(estimatedPoints / games);
      
      const thirdDownConversionPercentage = calculatePercentage(thirdDownConversions, thirdDowns);
      const fourthDownConversionPercentage = calculatePercentage(fourthDownConversions, fourthDowns);
      
      const takeaways = interceptions + fumblesRecovered;
      const turnoverMargin = takeaways - turnovers;
      
      const completionPercentage = calculatePercentage(passCompletions, passAttempts);
      const yardsPerAttempt = calculateRatio(netPassingYards, passAttempts);
      
      const yardsPerCarry = calculateRatio(rushingYards, rushingAttempts);
      
      const kickReturns = getNumberStat("kickReturns");
      const kickReturnYards = getNumberStat("kickReturnYards");
      const kickReturnAverage = calculateRatio(kickReturnYards, kickReturns);
      
      const puntReturns = getNumberStat("puntReturns");
      const puntReturnYards = getNumberStat("puntReturnYards");
      const puntReturnAverage = calculateRatio(puntReturnYards, puntReturns);
      
      const totalOffensiveTDs = passingTDs + rushingTDs;
      const passingTDPercentage = totalOffensiveTDs ? Math.round((passingTDs / totalOffensiveTDs) * 100) : 0;
      const rushingTDPercentage = totalOffensiveTDs ? Math.round((rushingTDs / totalOffensiveTDs) * 100) : 0;
      
      const calculatedKpis = {
        yardsPerGame,
        estimatedPointsPerGame,
        thirdDownConversionPercentage,
        fourthDownConversionPercentage,
        turnoverMargin,
        passingYardPercentage,
        rushingYardPercentage,
        completionPercentage,
        yardsPerAttempt,
        yardsPerCarry,
        kickReturnAverage,
        puntReturnAverage,
        passingTDPercentage,
        rushingTDPercentage,
        totalTDs,
        estimatedPoints,
        takeaways
      };
      
      console.log("KPIs calculated:", calculatedKpis);
      setKpis(calculatedKpis);
    } catch (err) {
      console.error("Error calculating KPIs:", err);
      // Set some default KPIs to prevent rendering errors
      setKpis({
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
        takeaways: 0
      });
    }
  }, [stats, getStatValue]);

  // IMPROVED: Process stats into categories for display with better error handling
  useEffect(() => {
    if (!stats || stats.length === 0 || !kpis) return;
    
    try {
      console.log("Processing stats into categories...");
      
      const categoriesObj = {
        general: {
          name: "General",
          icon: <IoMdStats style={{ color: accentColor }} />,
          stats: ["games", "firstDowns", "totalYards", "penalties", "penaltyYards", "turnovers", "possessionTime"]
        },
        offense: {
          name: "Offense",
          icon: <FaFootballBall style={{ color: accentColor }} />,
          stats: ["netPassingYards", "passAttempts", "passCompletions", "passingTDs", "rushingYards", "rushingAttempts", "rushingTDs"]
        },
        defense: {
          name: "Defense",
          icon: <FaShieldAlt style={{ color: accentColor }} />,
          stats: ["sacks", "interceptions", "interceptionYards", "interceptionTDs", "tacklesForLoss", "fumblesRecovered"]
        },
        specialTeams: {
          name: "Special Teams",
          icon: <FaTrophy style={{ color: accentColor }} />,
          stats: ["kickReturns", "kickReturnYards", "kickReturnTDs", "puntReturns", "puntReturnYards", "puntReturnTDs"]
        },
        situational: {
          name: "Situational",
          icon: <FaPercentage style={{ color: accentColor }} />,
          stats: ["thirdDowns", "thirdDownConversions", "fourthDowns", "fourthDownConversions", "fumblesLost", "passesIntercepted"]
        },
        misc: {
          name: "Miscellaneous",
          icon: <FaRegChartBar style={{ color: accentColor }} />,
          stats: []
        }
      };
      
      const processedStats = new Set();
      
      Object.keys(categoriesObj).forEach(categoryKey => {
        const category = categoriesObj[categoryKey];
        category.statList = [];
        if (category.stats) {
          category.stats.forEach(statName => {
            const statObj = stats.find(s => s && s.statName === statName);
            if (statObj) {
              // Ensure numeric values are properly converted
              let statValue = statObj.statValue;
              if (typeof statValue === 'string' && !isNaN(parseFloat(statValue))) {
                statValue = parseFloat(statValue);
              }
              
              category.statList.push({ ...statObj, statValue });
              processedStats.add(statName);
            } else {
              // Add empty stat placeholder to maintain layout
              category.statList.push({ 
                statName, 
                statValue: 0, 
                empty: true // Flag to identify empty stats
              });
            }
          });
        }
      });
      
      const miscStats = stats.filter(s => s && s.statName && !processedStats.has(s.statName));
      if (miscStats.length > 0) {
        categoriesObj.misc.statList = miscStats.map(stat => {
          let statValue = stat.statValue;
          if (typeof statValue === 'string' && !isNaN(parseFloat(statValue))) {
            statValue = parseFloat(statValue);
          }
          return { ...stat, statValue };
        });
      }
      
      // Add derived metrics to the proper categories
      if (categoriesObj.offense && categoriesObj.offense.statList) {
        categoriesObj.offense.statList.push(
          { statName: "completionPercentage", statValue: Number(kpis.completionPercentage), derived: true },
          { statName: "yardsPerAttempt", statValue: Number(kpis.yardsPerAttempt), derived: true },
          { statName: "yardsPerCarry", statValue: Number(kpis.yardsPerCarry), derived: true }
        );
      }
      
      if (categoriesObj.specialTeams && categoriesObj.specialTeams.statList) {
        categoriesObj.specialTeams.statList.push(
          { statName: "kickReturnAverage", statValue: Number(kpis.kickReturnAverage), derived: true },
          { statName: "puntReturnAverage", statValue: Number(kpis.puntReturnAverage), derived: true }
        );
      }
      
      if (categoriesObj.situational && categoriesObj.situational.statList) {
        categoriesObj.situational.statList.push(
          { statName: "thirdDownConversionPercentage", statValue: Number(kpis.thirdDownConversionPercentage), derived: true },
          { statName: "fourthDownConversionPercentage", statValue: Number(kpis.fourthDownConversionPercentage), derived: true }
        );
      }
      
      setCategories(categoriesObj);
      console.log("Categories processed:", categoriesObj);
    } catch (err) {
      console.error("Error processing categories:", err);
    }
  }, [stats, kpis, getStatValue, accentColor]);
  
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
      // Derived stats
      "completionPercentage": "Completion %",
      "yardsPerAttempt": "Yards per Attempt",
      "yardsPerCarry": "Yards per Carry",
      "kickReturnAverage": "Kick Return Average",
      "puntReturnAverage": "Punt Return Average"
    };
    
    return specialCases[name] || name.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
  };
  
  // IMPROVED: Format stat values for display with better handling of edge cases
  const formatStatValue = (name, value) => {
    if (value === null || value === undefined || isNaN(value)) return '-';
    
    if (name === "possessionTime") {
      const totalSeconds = parseInt(value, 10);
      if (isNaN(totalSeconds)) return value;
      
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds - (hours * 3600)) / 60);
      const seconds = totalSeconds - (hours * 3600) - (minutes * 60);
      
      return hours > 0 ? 
        `${hours}h ${minutes}m ${seconds}s` : 
        `${minutes}m ${seconds}s`;
    }
    
    if (name.includes("Percentage") || name.endsWith("Percent") || name.endsWith("%")) {
      return `${value}%`;
    }
    
    if (typeof value === 'number') {
      if (value % 1 !== 0) return value.toFixed(1);
      if (value >= 1000) return value.toLocaleString();
      return value.toString();
    }
    
    return value;
  };
  
  // Get icon for a specific stat
  const getStatIcon = (statName) => {
    const iconMap = {
      "games": <FaFootballBall className="stat-icon" style={{ color: accentColor }} />,
      "totalYards": <FaChartBar className="stat-icon" style={{ color: accentColor }} />,
      "firstDowns": <FaArrowCircleRight className="stat-icon" style={{ color: accentColor }} />,
      "penalties": <FaFlag className="stat-icon" style={{ color: accentColor }} />,
      "penaltyYards": <FaFlag className="stat-icon" style={{ color: accentColor }} />,
      "turnovers": <FaExchangeAlt className="stat-icon" style={{ color: accentColor }} />,
      "possessionTime": <FaClock className="stat-icon" style={{ color: accentColor }} />,
      "netPassingYards": <IoMdFootball className="stat-icon" style={{ color: accentColor }} />,
      "passAttempts": <IoMdFootball className="stat-icon" style={{ color: accentColor }} />,
      "passCompletions": <IoMdFootball className="stat-icon" style={{ color: accentColor }} />,
      "passingTDs": <IoMdFootball className="stat-icon" style={{ color: accentColor }} />,
      "rushingYards": <FaRunning className="stat-icon" style={{ color: accentColor }} />,
      "rushingAttempts": <FaRunning className="stat-icon" style={{ color: accentColor }} />,
      "rushingTDs": <FaRunning className="stat-icon" style={{ color: accentColor }} />,
      "completionPercentage": <IoMdFootball className="stat-icon" style={{ color: accentColor }} />,
      "yardsPerAttempt": <IoMdFootball className="stat-icon" style={{ color: accentColor }} />,
      "yardsPerCarry": <FaRunning className="stat-icon" style={{ color: accentColor }} />,
      "sacks": <GiWalkingBoot className="stat-icon" style={{ color: accentColor }} />,
      "interceptions": <FaShieldAlt className="stat-icon" style={{ color: accentColor }} />,
      "interceptionYards": <FaShieldAlt className="stat-icon" style={{ color: accentColor }} />,
      "interceptionTDs": <FaShieldAlt className="stat-icon" style={{ color: accentColor }} />,
      "tacklesForLoss": <GiFootprint className="stat-icon" style={{ color: accentColor }} />,
      "fumblesRecovered": <FaShieldAlt className="stat-icon" style={{ color: accentColor }} />,
      "kickReturns": <FaExchangeAlt className="stat-icon" style={{ color: accentColor }} />,
      "kickReturnYards": <FaExchangeAlt className="stat-icon" style={{ color: accentColor }} />,
      "kickReturnTDs": <FaExchangeAlt className="stat-icon" style={{ color: accentColor }} />,
      "puntReturns": <FaExchangeAlt className="stat-icon" style={{ color: accentColor }} />,
      "puntReturnYards": <FaExchangeAlt className="stat-icon" style={{ color: accentColor }} />,
      "puntReturnTDs": <FaExchangeAlt className="stat-icon" style={{ color: accentColor }} />,
      "kickReturnAverage": <FaExchangeAlt className="stat-icon" style={{ color: accentColor }} />,
      "puntReturnAverage": <FaExchangeAlt className="stat-icon" style={{ color: accentColor }} />,
      "thirdDowns": <BiDownArrow className="stat-icon" style={{ color: accentColor }} />,
      "thirdDownConversions": <BiDownArrow className="stat-icon" style={{ color: accentColor }} />,
      "thirdDownConversionPercentage": <FaPercentage className="stat-icon" style={{ color: accentColor }} />,
      "fourthDowns": <BiDownArrow className="stat-icon" style={{ color: accentColor }} />,
      "fourthDownConversions": <BiDownArrow className="stat-icon" style={{ color: accentColor }} />,
      "fourthDownConversionPercentage": <FaPercentage className="stat-icon" style={{ color: accentColor }} />,
      "fumblesLost": <FaExchangeAlt className="stat-icon" style={{ color: accentColor }} />,
      "passesIntercepted": <FaExchangeAlt className="stat-icon" style={{ color: accentColor }} />
    };
    return iconMap[statName] || <IoMdStats className="stat-icon" style={{ color: accentColor }} />;
  };
  
  // Determine color rating for a stat value
  const getRatingClass = (statName, value) => {
    if (value === 0 || isNaN(value)) return "";
    
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
    
    const neutralStats = [
      "games", "passAttempts", "rushingAttempts", "possessionTime",
      "thirdDowns", "fourthDowns", "kickReturns", "puntReturns"
    ];
    
    if (neutralStats.includes(statName)) return "";
    
    if (highIsGood.includes(statName)) {
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
      if (value > 0) return "good-value";
    }
    
    if (lowIsGood.includes(statName)) {
      if (statName === "turnovers" && value < 15) return "excellent-value";
      if (statName === "penalties" && value < 60) return "excellent-value";
      if (statName === "penaltyYards" && value < 500) return "excellent-value";
      return value < 20 ? "good-value" : "poor-value";
    }
    
    return "";
  };
  
  // Custom color styles for value ratings
  const getRatingStyle = (ratingClass) => {
    if (ratingClass === "excellent-value") {
      return { color: "#04aa6d" }; // Green for excellent
    } else if (ratingClass === "good-value") {
      return { color: "#2196F3" }; // Blue for good
    } else if (ratingClass === "poor-value") {
      return { color: "#f44336" }; // Red for poor
    }
    return {}; // Default style
  };
  
  // IMPROVED: Render cards for each category with empty state handling
  const renderCategoryCards = (category) => {
    if (!category || !category.statList) return null;
    
    return category.statList.map((stat, index) => {
      if (!stat) return null;
      
      const statName = stat.statName;
      // Make sure we have valid numeric values for statistics
      const statValue = typeof stat.statValue === 'string' && !isNaN(parseFloat(stat.statValue))
        ? parseFloat(stat.statValue)
        : (typeof stat.statValue === 'number' ? stat.statValue : 0);
        
      const displayName = formatStatName(statName);
      const displayValue = formatStatValue(statName, statValue);
      const ratingClass = getRatingClass(statName, statValue);
      const valueStyle = getRatingStyle(ratingClass);
      
      return (
        <div className="stat-card" key={`${statName}-${index}`}>
          <div className="stat-card-inner" style={{ borderLeft: `3px solid ${accentColor}` }}>
            <div className="stat-name">
              {getStatIcon(statName)}
              <span>{displayName}</span>
            </div>
            <div className={`stat-value ${ratingClass}`} style={valueStyle}>
              {stat.empty ? "N/A" : displayValue}
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
  
  // IMPROVED: Render comparison cards for key metrics with better handling of zero values
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
      // Skip rendering if both values are zero or NaN
      if ((metric.values[0] === 0 && metric.values[1] === 0) || 
          (isNaN(metric.values[0]) && isNaN(metric.values[1]))) {
        return null;
      }
      
      // Ensure percentages are valid numbers
      const pct1 = isNaN(metric.percentages[0]) ? 0 : metric.percentages[0];
      const pct2 = isNaN(metric.percentages[1]) ? 0 : metric.percentages[1];
      
      return (
        <div className="comparison-card" key={index} style={{ borderLeft: `3px solid ${accentColor}` }}>
          <div className="comparison-title" style={{ color: accentColor, fontWeight: 'bold' }}>{metric.title}</div>
          <div className="comparison-bars">
            <div className="comparison-bar-container">
              <div className="comparison-label">
                {formatStatName(metric.stats[0])}
                <span className="comparison-value">{metric.values[0]}</span>
              </div>
              <div className="comparison-bar-wrapper">
                <div 
                  className="comparison-bar first-bar"
                  style={{ width: `${pct1}%`, background: accentColor }}
                ></div>
              </div>
              <div className="comparison-percentage" style={{ color: accentColor }}>{pct1}%</div>
            </div>
            
            <div className="comparison-bar-container">
              <div className="comparison-label">
                {formatStatName(metric.stats[1])}
                <span className="comparison-value">{metric.values[1]}</span>
              </div>
              <div className="comparison-bar-wrapper">
                <div 
                  className="comparison-bar second-bar"
                  style={{ width: `${pct2}%`, background: accentColorDark }}
                ></div>
              </div>
              <div className="comparison-percentage" style={{ color: accentColorDark }}>{pct2}%</div>
            </div>
          </div>
        </div>
      );
    }).filter(Boolean);
  };

  // FIXED: Debug section component that doesn't use hooks internally
  const renderDebugSection = () => {
    return (
      <div className="debug-section">
        <button 
          className="debug-button" 
          onClick={() => setShowDebug(!showDebug)}
          style={{ background: accentColor, color: contrastColor }}
        >
          {showDebug ? "Hide Raw Data" : "Show Raw Data (Debug)"}
        </button>
        
        {showDebug && rawData && (
          <div className="debug-data">
            <h3>Raw API Response:</h3>
            <pre style={{ maxHeight: '300px', overflow: 'auto' }}>
              {JSON.stringify(rawData, null, 2)}
            </pre>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="team-stats">
        <div className="loading-container">
          <div className="loading-spinner">
            <AiOutlineLoading3Quarters className="spinner-icon" style={{ color: accentColor }} />
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
          <div className="error-icon" style={{ color: accentColor }}>
            <AiOutlineWarning />
          </div>
          <div className="error-message">Error: {error}</div>
          <button 
            className="retry-button" 
            onClick={() => window.location.reload()}
            style={{ background: accentColor, color: contrastColor }}
          >
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
          <div className="error-icon" style={{ color: accentColor }}>
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
            <AiOutlineLoading3Quarters className="spinner-icon" style={{ color: accentColor }} />
          </div>
          <div className="loading-text">Processing statistics...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="team-stats">
      <div className="stats-header" style={{ borderBottom: `2px solid ${accentColor}` }}>
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
        <div className="info-card" style={{ border: `1px solid ${accentColorLight}`, boxShadow: `0 4px 8px ${accentColor}30` }}>
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
                <span className="legend-color excellent-legend" style={{ background: "#04aa6d" }}></span>
                <span>Excellent</span>
              </div>
              <div className="legend-item">
                <span className="legend-color good-legend" style={{ background: "#2196F3" }}></span>
                <span>Good</span>
              </div>
              <div className="legend-item">
                <span className="legend-color poor-legend" style={{ background: "#f44336" }}></span>
                <span>Below Average</span>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Key Performance Indicators */}
      <div className="kpi-section">
        <div className="kpi-container">
          <div className="kpi-card" style={{ borderTop: `4px solid ${accentColor}`, boxShadow: `0 2px 4px ${accentColor}20` }}>
            <div className="kpi-icon" style={{ color: accentColor }}>
              <FaChartBar />
            </div>
            <div className="kpi-value">{kpis.yardsPerGame}</div>
            <div className="kpi-label">Yards per Game</div>
          </div>
          
          <div className="kpi-card" style={{ borderTop: `4px solid ${accentColor}`, boxShadow: `0 2px 4px ${accentColor}20` }}>
            <div className="kpi-icon" style={{ color: accentColor }}>
              <FaTrophy />
            </div>
            <div className="kpi-value">{kpis.estimatedPointsPerGame}</div>
            <div className="kpi-label">Est. Points per Game</div>
          </div>
          
          <div className="kpi-card" style={{ borderTop: `4px solid ${accentColor}`, boxShadow: `0 2px 4px ${accentColor}20` }}>
            <div className="kpi-icon" style={{ color: accentColor }}>
              <FaPercentage />
            </div>
            <div className="kpi-value">{kpis.thirdDownConversionPercentage}%</div>
            <div className="kpi-label">3rd Down Conversion</div>
          </div>
          
          <div className="kpi-card" style={{ borderTop: `4px solid ${accentColor}`, boxShadow: `0 2px 4px ${accentColor}20` }}>
            <div className="kpi-icon" style={{ color: accentColor }}>
              <FaExchangeAlt />
            </div>
            <div className="kpi-value" style={{ color: kpis.turnoverMargin > 0 ? '#16a34a' : '#dc2626' }}>
              {kpis.turnoverMargin > 0 ? '+' : ''}{kpis.turnoverMargin}
            </div>
            <div className="kpi-label">Turnover Margin</div>
          </div>
        </div>
      </div>
      
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
              borderColor: accentColor,
              boxShadow: `0 2px 4px ${accentColor}40`
            } : {
              borderColor: accentColorLight
            }}
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
      
      {/* Debug section - properly implemented without hooks */}
      {renderDebugSection()}
      
      {/* Additional CSS for better display */}
      <style>{`
        .debug-section {
          margin-top: 20px;
          text-align: center;
        }
        
        .debug-button {
          padding: 8px 16px;
          border-radius: 4px;
          border: none;
          cursor: pointer;
          font-size: 14px;
          opacity: 0.7;
          transition: opacity 0.2s;
        }
        
        .debug-button:hover {
          opacity: 1;
        }
        
        .debug-data {
          margin-top: 10px;
          background: #f5f5f5;
          border-radius: 4px;
          padding: 10px;
          text-align: left;
        }
        
        .stat-value.excellent-value {
          font-weight: bold;
        }
      `}</style>
    </div>
  );
};

export default TeamStats;