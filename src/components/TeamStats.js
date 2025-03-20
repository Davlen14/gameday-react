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
  FaExclamationTriangle,
  FaCheckCircle,
  FaTimesCircle,
  FaArrowRight
} from "react-icons/fa";
import { 
  GiAmericanFootballHelmet, 
  GiFootprint, 
  GiWhistle, 
  GiWalkingBoot,
  GiStrength
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
  BsDot,
  BsLightningChargeFill
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
  const [showDebug, setShowDebug] = useState(false);
  const [teamStrengths, setTeamStrengths] = useState([]);
  const [teamWeaknesses, setTeamWeaknesses] = useState([]);

  // Default to a neutral gray if no team color is provided
  const accentColor = teamColor || "#555555";
  
  // Generate a lighter variation of the team color for gradients - more subtle
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

  // Modern color palette - using team color more subtly
  const primaryColor = accentColor;
  const secondaryColor = lightenColor(accentColor, 45); // Very light version of team color
  const accentLight = lightenColor(accentColor, 20);
  const accentDark = darkenColor(accentColor, 20);
  
  // Modern stat indicators
  const excellentColor = "#38c172"; // Green
  const goodColor = "#ffbb33";      // Yellow/Amber
  const poorColor = "#ff4d4d";      // Red
  const neutralColor = "#667788";   // Slate gray
  const textColor = "#444444";      // Dark gray for text
  
  // Get contrast color for text
  const getContrastColor = (hexColor) => {
    hexColor = hexColor.replace('#', '');
    const r = parseInt(hexColor.substr(0, 2), 16);
    const g = parseInt(hexColor.substr(2, 2), 16);
    const b = parseInt(hexColor.substr(4, 2), 16);
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return (yiq >= 128) ? '#444444' : '#ffffff';
  };
  
  // Determine text color to use against team color background
  const contrastColor = getContrastColor(accentColor);

  // Helper function to safely get stat value
  const getStatValue = useCallback((name) => {
    const stat = stats.find(s => s && s.statName === name);
    if (!stat) {
      return 0;
    }
    
    const value = typeof stat.statValue === 'string' ? 
      parseFloat(stat.statValue) || 0 : 
      (typeof stat.statValue === 'number' ? stat.statValue : 0);
    
    return value;
  }, [stats]);

  // Utility functions for precise calculations
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

  // Fetch team stats from the API
  useEffect(() => {
    const fetchTeamStats = async () => {
      try {
        setLoading(true);
        const data = await teamsService.getTeamStats(teamName, year);
        
        // Store raw data for debugging
        setRawData(data);
        
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
        } else {
          if (!data || data.length === 0) {
            setError("No statistics data available for this team.");
          } else {
            setError("Received unexpected data format from API.");
          }
          setStats([]);
        }
      } catch (err) {
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

  // Calculate key performance indicators (KPIs)
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
      const sacks = getNumberStat("sacks");
      const tacklesForLoss = getNumberStat("tacklesForLoss");
      
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
        takeaways,
        sacks,
        tacklesForLoss
      };
      
      setKpis(calculatedKpis);
      
      // Calculate team strengths and weaknesses
      const strengths = [];
      const weaknesses = [];
      
      // Passing offense
      if (netPassingYards > 3500) strengths.push({ name: "Elite Passing Attack", value: netPassingYards, icon: <IoMdFootball /> });
      else if (netPassingYards < 2500 && netPassingYards > 0) weaknesses.push({ name: "Weak Passing Game", value: netPassingYards, icon: <IoMdFootball /> });
      
      // Rushing offense
      if (rushingYards > 2000) strengths.push({ name: "Strong Ground Game", value: rushingYards, icon: <FaRunning /> });
      else if (rushingYards < 1500 && rushingYards > 0) weaknesses.push({ name: "Ineffective Running Game", value: rushingYards, icon: <FaRunning /> });
      
      // Defensive strength
      if (sacks > 35) strengths.push({ name: "Dominant Pass Rush", value: sacks, icon: <GiWalkingBoot /> });
      if (tacklesForLoss > 85) strengths.push({ name: "Disruptive Defense", value: tacklesForLoss, icon: <FaShieldAlt /> });
      
      // Efficiency
      if (thirdDownConversionPercentage > 43) strengths.push({ name: "Efficient on 3rd Down", value: `${thirdDownConversionPercentage}%`, icon: <FaPercentage /> });
      else if (thirdDownConversionPercentage < 33 && thirdDownConversionPercentage > 0) weaknesses.push({ name: "Struggles on 3rd Down", value: `${thirdDownConversionPercentage}%`, icon: <FaPercentage /> });
      
      // Turnover margin
      if (turnoverMargin > 5) strengths.push({ name: "Positive Turnover Margin", value: `+${turnoverMargin}`, icon: <FaExchangeAlt /> });
      else if (turnoverMargin < -3) weaknesses.push({ name: "Negative Turnover Margin", value: turnoverMargin, icon: <FaExchangeAlt /> });
      
      setTeamStrengths(strengths);
      setTeamWeaknesses(weaknesses);
      
    } catch (err) {
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

  // Process stats into categories for display
  useEffect(() => {
    if (!stats || stats.length === 0 || !kpis) return;
    
    try {
      const categoriesObj = {
        general: {
          name: "General",
          icon: <IoMdStats style={{ color: primaryColor }} />,
          stats: ["games", "firstDowns", "totalYards", "penalties", "penaltyYards", "turnovers", "possessionTime"]
        },
        offense: {
          name: "Offense",
          icon: <FaFootballBall style={{ color: primaryColor }} />,
          stats: ["netPassingYards", "passAttempts", "passCompletions", "passingTDs", "rushingYards", "rushingAttempts", "rushingTDs"]
        },
        defense: {
          name: "Defense",
          icon: <FaShieldAlt style={{ color: primaryColor }} />,
          stats: ["sacks", "interceptions", "interceptionYards", "interceptionTDs", "tacklesForLoss", "fumblesRecovered"]
        },
        specialTeams: {
          name: "Special Teams",
          icon: <FaTrophy style={{ color: primaryColor }} />,
          stats: ["kickReturns", "kickReturnYards", "kickReturnTDs", "puntReturns", "puntReturnYards", "puntReturnTDs"]
        },
        situational: {
          name: "Situational",
          icon: <FaPercentage style={{ color: primaryColor }} />,
          stats: ["thirdDowns", "thirdDownConversions", "fourthDowns", "fourthDownConversions", "fumblesLost", "passesIntercepted"]
        },
        misc: {
          name: "Miscellaneous",
          icon: <FaRegChartBar style={{ color: primaryColor }} />,
          stats: []
        }
      };
      
      const processedStats = new Set();
      
      // For each category, process its stats
      Object.keys(categoriesObj).forEach(categoryKey => {
        const category = categoriesObj[categoryKey];
        category.statList = [];
        
        if (category.stats) {
          category.stats.forEach(statName => {
            // Look for the stat in our data
            const statObj = stats.find(s => s && s.statName === statName);
            
            if (statObj) {
              let statValue = statObj.statValue;
              if (typeof statValue === 'string' && !isNaN(parseFloat(statValue))) {
                statValue = parseFloat(statValue);
              }
              
              category.statList.push({ ...statObj, statValue });
              processedStats.add(statName);
            } else {
              // We didn't find this stat - check if it might be under a different name
              const altStatName = statName.toLowerCase();
              const altStatObj = stats.find(s => s && s.statName.toLowerCase() === altStatName);
              
              if (altStatObj) {
                let statValue = altStatObj.statValue;
                if (typeof statValue === 'string' && !isNaN(parseFloat(statValue))) {
                  statValue = parseFloat(statValue);
                }
                
                category.statList.push({ ...altStatObj, statName, statValue });
                processedStats.add(altStatObj.statName);
              } else {
                // Still not found - add an empty placeholder
                category.statList.push({ 
                  statName, 
                  statValue: 0, 
                  empty: false
                });
              }
            }
          });
        }
      });
      
      // Process miscellaneous stats
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
    } catch (err) {
      console.error("Error processing categories:", err);
    }
  }, [stats, kpis, getStatValue, primaryColor]);
  
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
  
  // Format stat values for display with better handling of edge cases
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
      "games": <FaFootballBall className="stat-icon" style={{ color: neutralColor }} />,
      "totalYards": <FaChartBar className="stat-icon" style={{ color: neutralColor }} />,
      "firstDowns": <FaArrowCircleRight className="stat-icon" style={{ color: neutralColor }} />,
      "penalties": <FaFlag className="stat-icon" style={{ color: neutralColor }} />,
      "penaltyYards": <FaFlag className="stat-icon" style={{ color: neutralColor }} />,
      "turnovers": <FaExchangeAlt className="stat-icon" style={{ color: neutralColor }} />,
      "possessionTime": <FaClock className="stat-icon" style={{ color: neutralColor }} />,
      "netPassingYards": <IoMdFootball className="stat-icon" style={{ color: neutralColor }} />,
      "passAttempts": <IoMdFootball className="stat-icon" style={{ color: neutralColor }} />,
      "passCompletions": <IoMdFootball className="stat-icon" style={{ color: neutralColor }} />,
      "passingTDs": <IoMdFootball className="stat-icon" style={{ color: neutralColor }} />,
      "rushingYards": <FaRunning className="stat-icon" style={{ color: neutralColor }} />,
      "rushingAttempts": <FaRunning className="stat-icon" style={{ color: neutralColor }} />,
      "rushingTDs": <FaRunning className="stat-icon" style={{ color: neutralColor }} />,
      "completionPercentage": <IoMdFootball className="stat-icon" style={{ color: neutralColor }} />,
      "yardsPerAttempt": <IoMdFootball className="stat-icon" style={{ color: neutralColor }} />,
      "yardsPerCarry": <FaRunning className="stat-icon" style={{ color: neutralColor }} />,
      "sacks": <GiWalkingBoot className="stat-icon" style={{ color: neutralColor }} />,
      "interceptions": <FaShieldAlt className="stat-icon" style={{ color: neutralColor }} />,
      "interceptionYards": <FaShieldAlt className="stat-icon" style={{ color: neutralColor }} />,
      "interceptionTDs": <FaShieldAlt className="stat-icon" style={{ color: neutralColor }} />,
      "tacklesForLoss": <GiFootprint className="stat-icon" style={{ color: neutralColor }} />,
      "fumblesRecovered": <FaShieldAlt className="stat-icon" style={{ color: neutralColor }} />,
      "kickReturns": <FaExchangeAlt className="stat-icon" style={{ color: neutralColor }} />,
      "kickReturnYards": <FaExchangeAlt className="stat-icon" style={{ color: neutralColor }} />,
      "kickReturnTDs": <FaExchangeAlt className="stat-icon" style={{ color: neutralColor }} />,
      "puntReturns": <FaExchangeAlt className="stat-icon" style={{ color: neutralColor }} />,
      "puntReturnYards": <FaExchangeAlt className="stat-icon" style={{ color: neutralColor }} />,
      "puntReturnTDs": <FaExchangeAlt className="stat-icon" style={{ color: neutralColor }} />,
      "kickReturnAverage": <FaExchangeAlt className="stat-icon" style={{ color: neutralColor }} />,
      "puntReturnAverage": <FaExchangeAlt className="stat-icon" style={{ color: neutralColor }} />,
      "thirdDowns": <BiDownArrow className="stat-icon" style={{ color: neutralColor }} />,
      "thirdDownConversions": <BiDownArrow className="stat-icon" style={{ color: neutralColor }} />,
      "thirdDownConversionPercentage": <FaPercentage className="stat-icon" style={{ color: neutralColor }} />,
      "fourthDowns": <BiDownArrow className="stat-icon" style={{ color: neutralColor }} />,
      "fourthDownConversions": <BiDownArrow className="stat-icon" style={{ color: neutralColor }} />,
      "fourthDownConversionPercentage": <FaPercentage className="stat-icon" style={{ color: neutralColor }} />,
      "fumblesLost": <FaExchangeAlt className="stat-icon" style={{ color: neutralColor }} />,
      "passesIntercepted": <FaExchangeAlt className="stat-icon" style={{ color: neutralColor }} />
    };
    return iconMap[statName] || <IoMdStats className="stat-icon" style={{ color: neutralColor }} />;
  };
  
  // Determine color rating for a stat value - modernized for better visual feedback
  const getRatingInfo = (statName, value) => {
    if (value === 0 || isNaN(value)) return { class: "", color: textColor, icon: null };
    
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
    
    if (neutralStats.includes(statName)) return { class: "", color: textColor, icon: null };
    
    if (highIsGood.includes(statName)) {
      // Percentage stats have different thresholds
      if (statName.includes("Percentage")) {
        if (value > 60) return { class: "excellent-value", color: excellentColor, icon: <FaCheckCircle /> };
        if (value > 45) return { class: "good-value", color: goodColor, icon: null };
        return { class: "poor-value", color: poorColor, icon: <FaTimesCircle /> };
      }
      
      // Special thresholds for particular stats
      if (statName === "netPassingYards" && value > 3500) return { class: "excellent-value", color: excellentColor, icon: <FaCheckCircle /> };
      if (statName === "rushingYards" && value > 2500) return { class: "excellent-value", color: excellentColor, icon: <FaCheckCircle /> };
      if (statName === "totalYards" && value > 6000) return { class: "excellent-value", color: excellentColor, icon: <FaCheckCircle /> };
      if (statName === "sacks" && value > 40) return { class: "excellent-value", color: excellentColor, icon: <FaCheckCircle /> };
      if (statName === "interceptions" && value > 15) return { class: "excellent-value", color: excellentColor, icon: <FaCheckCircle /> };
      if (statName === "yardsPerAttempt" && value > 8) return { class: "excellent-value", color: excellentColor, icon: <FaCheckCircle /> };
      if (statName === "yardsPerCarry" && value > 5) return { class: "excellent-value", color: excellentColor, icon: <FaCheckCircle /> };
      
      // Default for high-is-good stats
      if (value > 0) return { class: "good-value", color: goodColor, icon: null };
    }
    
    if (lowIsGood.includes(statName)) {
      if (statName === "turnovers" && value < 15) return { class: "excellent-value", color: excellentColor, icon: <FaCheckCircle /> };
      if (statName === "penalties" && value < 60) return { class: "excellent-value", color: excellentColor, icon: <FaCheckCircle /> };
      if (statName === "penaltyYards" && value < 500) return { class: "excellent-value", color: excellentColor, icon: <FaCheckCircle /> };
      return value < 20 ? { class: "good-value", color: goodColor, icon: null } : { class: "poor-value", color: poorColor, icon: <FaTimesCircle /> };
    }
    
    return { class: "", color: textColor, icon: null };
  };
  
  // Render cards for each category with modern visual indicators
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
      const ratingInfo = getRatingInfo(statName, statValue);
      
      // Create modern stat card with value indicator
      return (
        <div className="stat-card" key={`${statName}-${index}`}>
          <div className="stat-card-inner">
            <div className="stat-name">
              {getStatIcon(statName)}
              <span>{displayName}</span>
            </div>
            <div className={`stat-value ${ratingInfo.class}`} style={{ color: ratingInfo.color }}>
              <div className="value-display">
                {stat.empty ? "N/A" : displayValue}
                {ratingInfo.icon && <span className="rating-icon">{ratingInfo.icon}</span>}
              </div>
              
              {/* Add percentage bars for conversion stats */}
              {(statName === "thirdDownConversions" || statName === "fourthDownConversions") && kpis && (
                <div className="stat-percentage">
                  <div className="percentage-track">
                    <div 
                      className="percentage-bar"
                      style={{ 
                        width: `${statName === "thirdDownConversions" 
                          ? kpis.thirdDownConversionPercentage 
                          : kpis.fourthDownConversionPercentage}%`, 
                        background: getPercentageColor(
                          statName === "thirdDownConversions" 
                            ? kpis.thirdDownConversionPercentage 
                            : kpis.fourthDownConversionPercentage
                        )
                      }}
                    ></div>
                  </div>
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
  
  // Get color for percentage bars
  const getPercentageColor = (percentage) => {
    if (percentage >= 60) return excellentColor;
    if (percentage >= 40) return goodColor;
    return poorColor;
  };
  
  // Render comparison cards with modern design
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
      
      // Use modern colors for the comparison bars
      const color1 = primaryColor;
      const color2 = neutralColor;
      
      return (
        <div className="comparison-card" key={index}>
          <div className="comparison-title">
            <span>{metric.title}</span>
            <div className="total-value">{metric.values[0] + metric.values[1]}</div>
          </div>
          <div className="comparison-bars">
            <div className="comparison-bar-container">
              <div className="comparison-label">
                {formatStatName(metric.stats[0])}
                <span className="comparison-value">{metric.values[0]}</span>
              </div>
              <div className="comparison-bar-wrapper">
                <div className="bar-track">
                  <div 
                    className="comparison-bar first-bar"
                    style={{ width: `${pct1}%`, background: color1 }}
                  >
                    {pct1 > 15 && <span className="bar-value">{pct1}%</span>}
                  </div>
                </div>
                {pct1 <= 15 && <div className="percentage-small" style={{ color: color1 }}>{pct1}%</div>}
              </div>
            </div>
            
            <div className="comparison-bar-container">
              <div className="comparison-label">
                {formatStatName(metric.stats[1])}
                <span className="comparison-value">{metric.values[1]}</span>
              </div>
              <div className="comparison-bar-wrapper">
                <div className="bar-track">
                  <div 
                    className="comparison-bar second-bar"
                    style={{ width: `${pct2}%`, background: color2 }}
                  >
                    {pct2 > 15 && <span className="bar-value">{pct2}%</span>}
                  </div>
                </div>
                {pct2 <= 15 && <div className="percentage-small" style={{ color: color2 }}>{pct2}%</div>}
              </div>
            </div>
          </div>
        </div>
      );
    }).filter(Boolean);
  };

  // Render team strengths and weaknesses section
  const renderTeamStrengthsWeaknesses = () => {
    if (teamStrengths.length === 0 && teamWeaknesses.length === 0) return null;
    
    return (
      <div className="team-analysis-section">
        <h2 className="section-title">
          <GiStrength className="section-icon" />
          Team Analysis
        </h2>
        
        <div className="analysis-grid">
          {teamStrengths.length > 0 && (
            <div className="strengths-card">
              <div className="analysis-header">
                <BsLightningChargeFill className="strength-icon" />
                <h3>Team Strengths</h3>
              </div>
              <div className="analysis-items">
                {teamStrengths.map((strength, index) => (
                  <div className="analysis-item" key={index}>
                    <div className="analysis-item-icon">{strength.icon}</div>
                    <div className="analysis-item-text">
                      <span className="analysis-item-name">{strength.name}</span>
                      <span className="analysis-item-value">{strength.value}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {teamWeaknesses.length > 0 && (
            <div className="weaknesses-card">
              <div className="analysis-header">
                <FaExclamationTriangle className="weakness-icon" />
                <h3>Areas to Improve</h3>
              </div>
              <div className="analysis-items">
                {teamWeaknesses.map((weakness, index) => (
                  <div className="analysis-item" key={index}>
                    <div className="analysis-item-icon">{weakness.icon}</div>
                    <div className="analysis-item-text">
                      <span className="analysis-item-name">{weakness.name}</span>
                      <span className="analysis-item-value">{weakness.value}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Debug section component 
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
            <h3>Special Teams Stats:</h3>
            <pre style={{ maxHeight: '150px', overflow: 'auto' }}>
              {JSON.stringify(rawData.filter(s => 
                s.statName.includes('kick') || 
                s.statName.includes('punt')
              ), null, 2)}
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
            <AiOutlineLoading3Quarters className="spinner-icon" style={{ color: primaryColor }} />
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
          <div className="error-icon" style={{ color: primaryColor }}>
            <AiOutlineWarning />
          </div>
          <div className="error-message">Error: {error}</div>
          <button 
            className="retry-button" 
            onClick={() => window.location.reload()}
            style={{ background: primaryColor, color: contrastColor }}
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
          <div className="error-icon" style={{ color: primaryColor }}>
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
            <AiOutlineLoading3Quarters className="spinner-icon" style={{ color: primaryColor }} />
          </div>
          <div className="loading-text">Processing statistics...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="team-stats">
      {/* Page header with team info */}
      <div className="stats-header">
        <div className="header-content">
          <GiAmericanFootballHelmet className="team-icon" style={{ color: primaryColor }} />
          <div className="header-text">
            <h1>{teamName} <span>Team Stats</span></h1>
            <div className="year-badge" style={{ background: primaryColor, color: contrastColor }}>{year}</div>
          </div>
        </div>
        <button 
          className="info-button" 
          onClick={() => setShowInfoCard(!showInfoCard)}
          style={{ background: secondaryColor, color: textColor, borderLeft: `3px solid ${primaryColor}` }}
        >
          <FaInfoCircle className="button-icon" />
          {showInfoCard ? "Hide Information" : "What Do These Stats Mean?"}
        </button>
      </div>

      {/* Information card */}
      {showInfoCard && (
        <div className="info-card">
          <div className="info-card-header" style={{ borderBottom: `2px solid ${secondaryColor}` }}>
            <h3>
              <FaInfoCircle className="card-header-icon" style={{ color: primaryColor }} />
              Understanding Team Statistics
            </h3>
            <button className="close-button" onClick={() => setShowInfoCard(false)}>×</button>
          </div>
          <div className="info-card-content">
            <p>These statistics represent the team's performance across various aspects of the game. Color-coded metrics highlight strengths and areas for improvement.</p>
            <div className="stat-definitions">
              <div className="stat-definition">
                <h4 style={{ color: primaryColor }}>
                  <FaChartBar className="stat-icon" /> Offensive Stats
                </h4>
                <p>Passing and rushing statistics show how the team moves the ball. High yardage and touchdown numbers indicate an effective offense.</p>
              </div>
              <div className="stat-definition">
                <h4 style={{ color: primaryColor }}>
                  <FaShieldAlt className="stat-icon" /> Defensive Stats
                </h4>
                <p>Sacks, interceptions, and tackles for loss demonstrate the defense's ability to disrupt opposing offenses and create turnover opportunities.</p>
              </div>
              <div className="stat-definition">
                <h4 style={{ color: primaryColor }}>
                  <FaPercentage className="stat-icon" /> Efficiency Metrics
                </h4>
                <p>Third and fourth down conversion rates show how effectively the team maintains possession in crucial situations.</p>
              </div>
            </div>
            <div className="stat-indicators">
              <div className="indicator-key">
                <h4>Color Indicators</h4>
                <div className="indicator-items">
                  <div className="indicator-item">
                    <span className="indicator-color" style={{ background: excellentColor }}></span>
                    <span>Excellent</span>
                  </div>
                  <div className="indicator-item">
                    <span className="indicator-color" style={{ background: goodColor }}></span>
                    <span>Good</span>
                  </div>
                  <div className="indicator-item">
                    <span className="indicator-color" style={{ background: poorColor }}></span>
                    <span>Below Average</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Team Analysis Section */}
      {renderTeamStrengthsWeaknesses()}
      
      {/* Key Performance Indicators */}
      <div className="kpi-section">
        <h2 className="section-title">
          <FaChartLine className="section-icon" style={{ color: primaryColor }} />
          Key Performance Metrics
        </h2>
        <div className="kpi-container">
          <div className="kpi-card">
            <div className="kpi-icon" style={{ color: primaryColor }}>
              <FaChartBar />
            </div>
            <div className="kpi-value">{kpis.yardsPerGame}</div>
            <div className="kpi-label">Yards per Game</div>
          </div>
          
          <div className="kpi-card">
            <div className="kpi-icon" style={{ color: primaryColor }}>
              <FaTrophy />
            </div>
            <div className="kpi-value">{kpis.estimatedPointsPerGame}</div>
            <div className="kpi-label">Est. Points per Game</div>
          </div>
          
          <div className="kpi-card">
            <div className="kpi-icon" style={{ color: primaryColor }}>
              <FaPercentage />
            </div>
            <div className="kpi-value">{kpis.thirdDownConversionPercentage}%</div>
            <div className="kpi-label">3rd Down Conversion</div>
          </div>
          
          <div className="kpi-card">
            <div className="kpi-icon" style={{ color: primaryColor }}>
              <FaExchangeAlt />
            </div>
            <div className="kpi-value" style={{ 
              color: kpis.turnoverMargin > 0 ? excellentColor : 
                     kpis.turnoverMargin < 0 ? poorColor : textColor 
            }}>
              {kpis.turnoverMargin > 0 ? '+' : ''}{kpis.turnoverMargin}
            </div>
            <div className="kpi-label">Turnover Margin</div>
          </div>
        </div>
      </div>
      
      {/* Comparison Charts */}
      <div className="comparison-section">
        <h2 className="section-title">
          <IoMdTrendingUp className="section-icon" style={{ color: primaryColor }} />
          Offensive Distribution
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
              background: secondaryColor, 
              color: textColor,
              borderLeft: `3px solid ${primaryColor}`
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
      
      {/* Debug section */}
      {renderDebugSection()}
      
      {/* Additional CSS for Orbitron font and modern styling */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;600;700&display=swap');
        
        .team-stats {
          font-family: 'Orbitron', sans-serif;
          color: ${textColor};
          --primary-color: ${primaryColor};
          --secondary-color: ${secondaryColor};
          --excellent-color: ${excellentColor};
          --good-color: ${goodColor};
          --poor-color: ${poorColor};
          --neutral-color: ${neutralColor};
        }
        
        .stats-header, .section-title, .kpi-value, .comparison-title, .analysis-header h3 {
          font-family: 'Orbitron', sans-serif;
          font-weight: 600;
        }
        
        /* Modern animations */
        .stat-card, .kpi-card, .comparison-card {
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        
        .stat-card:hover, .kpi-card:hover, .comparison-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 8px 15px rgba(0, 0, 0, 0.1);
        }
        
        /* Better percentage bars */
        .percentage-track {
          height: 6px;
          width: 100%;
          background: rgba(0,0,0,0.08);
          border-radius: 3px;
          overflow: hidden;
          margin-top: 8px;
        }
        
        .percentage-bar {
          height: 100%;
          border-radius: 3px;
          transition: width 1s ease-out;
        }
        
        /* Team analysis section */
        .team-analysis-section {
          margin-bottom: 30px;
        }
        
        .analysis-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 20px;
        }
        
        .strengths-card, .weaknesses-card {
          background: white;
          border-radius: 8px;
          padding: 20px;
          box-shadow: 0 3px 10px rgba(0,0,0,0.08);
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        
        .strengths-card:hover, .weaknesses-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 6px 15px rgba(0,0,0,0.1);
        }
        
        .strengths-card {
          border-left: 3px solid ${excellentColor};
        }
        
        .weaknesses-card {
          border-left: 3px solid ${poorColor};
        }
        
        .analysis-header {
          display: flex;
          align-items: center;
          margin-bottom: 15px;
        }
        
        .analysis-header h3 {
          margin: 0;
          font-size: 1.2rem;
          margin-left: 10px;
        }
        
        .strength-icon {
          color: ${excellentColor};
          font-size: 1.4rem;
        }
        
        .weakness-icon {
          color: ${poorColor};
          font-size: 1.4rem;
        }
        
        .analysis-items {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        
        .analysis-item {
          display: flex;
          align-items: center;
          padding: 10px;
          background: rgba(0,0,0,0.02);
          border-radius: 6px;
          transition: background 0.2s ease;
        }
        
        .analysis-item:hover {
          background: rgba(0,0,0,0.04);
        }
        
        .analysis-item-icon {
          margin-right: 12px;
          color: ${primaryColor};
          font-size: 1.2rem;
        }
        
        .analysis-item-text {
          display: flex;
          justify-content: space-between;
          width: 100%;
        }
        
        .analysis-item-name {
          font-weight: 500;
        }
        
        .analysis-item-value {
          font-weight: 600;
          color: ${primaryColor};
        }
        
        /* Rating icons next to values */
        .value-display {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        
        .rating-icon {
          opacity: 0.8;
        }
      `}</style>
    </div>
  );
};

export default TeamStats;