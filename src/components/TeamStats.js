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

  useEffect(() => {
    const fetchTeamStats = async () => {
      try {
        setLoading(true);
        // Fetch team stats for the given team and year
        const data = await teamsService.getTeamStats(teamName, year);
        setStats(data);
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

  // Process stats into categories
  const processStats = () => {
    if (!stats || stats.length === 0) return {};
    
    // Create categories object
    const categories = {
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
    Object.keys(categories).forEach(categoryKey => {
      const category = categories[categoryKey];
      category.statList = [];
      
      category.stats.forEach(statName => {
        const statObj = stats.find(s => s.statName === statName);
        if (statObj) {
          category.statList.push(statObj);
          processedStats.add(statName);
        }
      });
    });
    
    // Create a misc category for any uncategorized stats
    const miscStats = stats.filter(s => !processedStats.has(s.statName));
    if (miscStats.length > 0) {
      categories.misc = {
        name: "Miscellaneous",
        icon: <FaRegChartBar />,
        statList: miscStats
      };
    }
    
    return categories;
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
      "penaltyYards": "Penalty Yards"
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
      
      // Situational
      "thirdDowns": <BiDownArrow className="stat-icon" />,
      "thirdDownConversions": <BiDownArrow className="stat-icon" />,
      "fourthDowns": <BiDownArrow className="stat-icon" />,
      "fourthDownConversions": <BiDownArrow className="stat-icon" />,
      "fumblesLost": <FaExchangeAlt className="stat-icon" />,
      "passesIntercepted": <FaExchangeAlt className="stat-icon" />
    };
    
    return iconMap[statName] || <IoMdStats className="stat-icon" />;
  };
  
  // Calculate percentage for situational stats
  const calculatePercentage = (value, total) => {
    if (!total || total === 0) return 0;
    return Math.round((value / total) * 100);
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
      "kickReturnTDs", "puntReturnTDs"
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
      
      // Check if this is a conversion stat that needs percentage
      const isThirdDownConversion = statName === "thirdDownConversions";
      const isFourthDownConversion = statName === "fourthDownConversions";
      
      let percentage = null;
      
      if (isThirdDownConversion || isFourthDownConversion) {
        const totalAttempts = stats.find(s => 
          s.statName === (isThirdDownConversion ? "thirdDowns" : "fourthDowns")
        )?.statValue || 0;
        
        percentage = calculatePercentage(statValue, totalAttempts);
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
  
  // Generate comparison cards for key metrics
  const renderComparisonCards = () => {
    // Define key metrics to compare
    const keyMetrics = [
      { title: "Passing vs. Rushing", stats: ["netPassingYards", "rushingYards"] },
      { title: "Offensive TDs", stats: ["passingTDs", "rushingTDs"] },
      { title: "Down Conversions", stats: ["thirdDownConversions", "fourthDownConversions"] }
    ];
    
    return keyMetrics.map((metric, index) => {
      const firstStat = stats.find(s => s.statName === metric.stats[0]);
      const secondStat = stats.find(s => s.statName === metric.stats[1]);
      
      if (!firstStat || !secondStat) return null;
      
      const firstValue = firstStat.statValue;
      const secondValue = secondStat.statValue;
      const totalValue = firstValue + secondValue;
      
      const firstPercentage = Math.round((firstValue / totalValue) * 100);
      const secondPercentage = 100 - firstPercentage;
      
      return (
        <div className="comparison-card" key={index}>
          <div className="comparison-title">{metric.title}</div>
          <div className="comparison-bars">
            <div className="comparison-bar-container">
              <div className="comparison-label">
                {formatStatName(metric.stats[0])}
                <span className="comparison-value">{firstValue}</span>
              </div>
              <div className="comparison-bar-wrapper">
                <div 
                  className="comparison-bar first-bar"
                  style={{ width: `${firstPercentage}%`, background: accentColor }}
                ></div>
              </div>
              <div className="comparison-percentage">{firstPercentage}%</div>
            </div>
            
            <div className="comparison-bar-container">
              <div className="comparison-label">
                {formatStatName(metric.stats[1])}
                <span className="comparison-value">{secondValue}</span>
              </div>
              <div className="comparison-bar-wrapper">
                <div 
                  className="comparison-bar second-bar"
                  style={{ width: `${secondPercentage}%`, background: darkenColor(accentColor, 20) }}
                ></div>
              </div>
              <div className="comparison-percentage">{secondPercentage}%</div>
            </div>
          </div>
        </div>
      );
    });
  };
  
  // Calculate key performance indicators
  const calculateKPIs = () => {
    if (!stats || stats.length === 0) return null;
    
    // Helper function to get stat value
    const getStatValue = (name) => {
      const stat = stats.find(s => s.statName === name);
      return stat ? stat.statValue : 0;
    };
    
    // Calculate yards per game
    const games = getStatValue("games");
    const totalYards = getStatValue("totalYards");
    const yardsPerGame = games ? Math.round(totalYards / games) : 0;
    
    // Calculate points per game (if we have the data)
    // Usually this would be in the stats, but we can approximate
    const passingTDs = getStatValue("passingTDs");
    const rushingTDs = getStatValue("rushingTDs");
    const specialTeamsTDs = getStatValue("kickReturnTDs") + getStatValue("puntReturnTDs") + getStatValue("interceptionTDs");
    const totalTDs = passingTDs + rushingTDs + specialTeamsTDs;
    const approximatePoints = totalTDs * 7; // Rough estimate, assuming PAT after each TD
    const pointsPerGame = games ? Math.round(approximatePoints / games) : 0;
    
    // Calculate 3rd down efficiency
    const thirdDowns = getStatValue("thirdDowns");
    const thirdDownConversions = getStatValue("thirdDownConversions");
    const thirdDownPercentage = thirdDowns ? Math.round((thirdDownConversions / thirdDowns) * 100) : 0;
    
    // Calculate turnover margin
    const turnovers = getStatValue("turnovers");
    const takeaways = getStatValue("interceptions") + getStatValue("fumblesRecovered");
    const turnoverMargin = takeaways - turnovers;
    
    return {
      yardsPerGame,
      pointsPerGame,
      thirdDownPercentage,
      turnoverMargin
    };
  };
  
  const categories = processStats();
  const kpis = calculateKPIs();

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
              <div className="kpi-value">{kpis.pointsPerGame}</div>
              <div className="kpi-label">Est. Points per Game</div>
            </div>
            
            <div className="kpi-card" style={{ borderTop: `4px solid ${accentColor}` }}>
              <div className="kpi-icon">
                <FaPercentage />
              </div>
              <div className="kpi-value">{kpis.thirdDownPercentage}%</div>
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