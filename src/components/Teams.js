import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import teamsService from "../services/teamsService";
import graphqlTeamsService from "../services/graphqlTeamsService";
import newsService from "../services/newsService";
import "../styles/Teams.css"; // Using our modernized CSS

// Import icons
import {
  FaChartLine,
  FaExchangeAlt,
  FaTrophy,
  FaPlus,
  FaMinus,
  FaTrashAlt,
  FaSyncAlt,
  FaInfoCircle,
  FaTable,
  FaChartBar,
  FaChartPie,
  FaMapMarkerAlt,
  FaUsers,
  FaShieldAlt,
  FaFootballBall,
  FaRunning,
  FaEye,
  FaTimes,
  FaSpinner,
  FaNewspaper,
  FaChartArea,
  FaUserAlt,
  FaStar,
  FaFilter,
  FaSearch,
  FaSortAmountDown,
  FaSortAmountUp
} from "react-icons/fa";

// Import Recharts components
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  BarChart,
  Bar,
  ReferenceLine
} from "recharts";

// Enhanced Loading Spinner Component
const LoadingSpinner = () => (
  <div className="tcd-loading-spinner">
    <svg width="60" height="60" viewBox="0 0 60 60">
      <circle 
        cx="30" 
        cy="30" 
        r="25" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="5"
        strokeDasharray="157 157"
        strokeLinecap="round"
      >
        <animateTransform 
          attributeName="transform" 
          type="rotate"
          from="0 30 30"
          to="360 30 30"
          dur="1.5s"
          repeatCount="indefinite" />
      </circle>
      <circle 
        cx="30" 
        cy="30" 
        r="15" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="4"
        strokeDasharray="94.2 94.2"
        strokeLinecap="round"
        opacity="0.6"
      >
        <animateTransform 
          attributeName="transform" 
          type="rotate"
          from="360 30 30"
          to="0 30 30"
          dur="1s"
          repeatCount="indefinite" />
      </circle>
    </svg>
  </div>
);

// Tab Component for Chart Selection
const ChartTabs = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: "line", label: "Line", icon: <FaChartLine /> },
    { id: "radar", label: "Radar", icon: <FaChartPie /> },
    { id: "bar", label: "Bar", icon: <FaChartBar /> },
    { id: "table", label: "Table", icon: <FaTable /> }
  ];

  return (
    <div className="tcd-chart-tabs">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          className={`tcd-chart-tab ${activeTab === tab.id ? "active" : ""}`}
          onClick={() => setActiveTab(tab.id)}
        >
          {tab.icon}
          <span>{tab.label}</span>
        </button>
      ))}
    </div>
  );
};

// Star rating component
const StarRating = ({ rating }) => {
  const stars = [];
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  
  for (let i = 1; i <= 5; i++) {
    if (i <= fullStars) {
      stars.push(<FaStar key={i} color="#FFD700" />);
    } else if (i === fullStars + 1 && hasHalfStar) {
      stars.push(<FaStar key={i} color="#FFD700" style={{ opacity: 0.5 }} />);
    } else {
      stars.push(<FaStar key={i} color="#e0e0e0" />);
    }
  }
  
  return <div style={{ display: 'flex' }}>{stars}</div>;
};

// Format date for news articles
const formatNewsDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const Teams = () => {
  // State for teams
  const [teams, setTeams] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dataVersion, setDataVersion] = useState(1);
  
  // News, recruits and team talent states
  const [news, setNews] = useState([]);
  const [recruits, setRecruits] = useState([]);
  const [teamTalent, setTeamTalent] = useState([]);

  // Store the teams selected for comparison
  const [selectedTeams, setSelectedTeams] = useState([]);

  // We'll store each selected team's ratings here.
  // Shape: { [team.id]: { offense, defense, overall } }
  const [teamRatings, setTeamRatings] = useState({});

  // Chart state
  const [activeChart, setActiveChart] = useState("line");

  // Animation ref for comparison panel
  const comparisonRef = useRef(null);

  // Track if charts are loaded
  const [chartsLoaded, setChartsLoaded] = useState(false);
  
  // Filter states
  const [conferenceFilter, setConferenceFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("conference");
  const [sortOrder, setSortOrder] = useState("asc");

  // NCAA colors (similar to Big Ten colors but with NCAA branding)
  const ncaaColors = {
    primary: "#00275d", // NCAA blue
    secondary: "#0076c0", // Light blue
    accent: "#ffffff",   // White
    background: "#f5f5f5"
  };

  // Conference order based on popularity for FBS
  const conferenceOrder = [
    "Big Ten",
    "SEC",
    "ACC",
    "Big 12",
    "Pac-12",
    "American Athletic",
    "Mountain West",
    "Conference USA",
    "Mid-American",
    "FBS Independents"
  ];

  // Conference logo mapping for FBS
  const conferenceLogos = {
    ACC: "/photos/ACC.png",
    "American Athletic": "/photos/American Athletic.png",
    "Big 12": "/photos/Big 12.png",
    "Big Ten": "/photos/Big Ten.png",
    "Conference USA": "/photos/Conference USA.png",
    "FBS Independents": "/photos/FBS Independents.png",
    "Mid-American": "/photos/Mid-American.png",
    "Mountain West": "/photos/Mountain West.png",
    "Pac-12": "/photos/Pac-12.png",
    SEC: "/photos/SEC.png",
    Independent: "/photos/FBS Independents.png"
  };

  // Function to force refresh data
  const refreshData = () => {
    console.log("Forcing data refresh...");
    setDataVersion(prev => prev + 1);
  };

  // Group teams by conference and sort by popularity
  const groupByConference = (teams, conferenceOrder) => {
    const grouped = teams.reduce((acc, team) => {
      const conference = team.conference || "Independent";
      if (!acc[conference]) acc[conference] = [];
      acc[conference].push(team);
      return acc;
    }, {});

    // Sort conferences based on the predefined order
    const sortedConferences = {};
    conferenceOrder.forEach((conference) => {
      if (grouped[conference]) {
        sortedConferences[conference] = grouped[conference].sort((a, b) =>
          a.school.localeCompare(b.school)
        );
      }
    });

    // Add any remaining conferences that were not in the predefined order
    Object.keys(grouped).forEach((conference) => {
      if (!sortedConferences[conference]) {
        sortedConferences[conference] = grouped[conference].sort((a, b) =>
          a.school.localeCompare(b.school)
        );
      }
    });

    return sortedConferences;
  };

  // Helper: Get a standardized team identifier (trimmed team name)
  const getTeamIdentifier = (team) => {
    return team.school ? team.school.trim() : "";
  };

  // Helper to get team abbreviation
  const getTeamAbbreviation = (teamName) => {
    const team = teams.find(
      (t) => t.school.toLowerCase() === teamName?.toLowerCase()
    );
    return team?.abbreviation || teamName;
  };

  // Helper to create gradient id from team color
  const getGradientId = (teamColor) => {
    return `gradient-${teamColor.replace("#", "")}`;
  };

  // Helper to lighten a color for gradient effect
  const lightenColor = (color, percent) => {
    const num = parseInt(color.replace("#", ""), 16),
      amt = Math.round(2.55 * percent),
      R = (num >> 16) + amt,
      G = ((num >> 8) & 0x00ff) + amt,
      B = (num & 0x0000ff) + amt;
          
    return (
      "#" +
      (
        0x1000000 +
        (R < 255 ? R : 255) * 0x10000 +
        (G < 255 ? G : 255) * 0x100 +
        (B < 255 ? B : 255)
      )
        .toString(16)
        .slice(1)
    );
  };

  // Fetch teams and other data on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log("Starting data fetch process...");
        setIsLoading(true);
        
        // Fetch teams
        const teamsData = await teamsService.getTeams();
        setTeams(teamsData);
        
        // Check if there are teams in localStorage to compare
        const savedTeams = localStorage.getItem("compareTeams");
        if (savedTeams) {
          const parsedTeams = JSON.parse(savedTeams);
          // Find the actual team objects from the fetched data
          const teamsToCompare = parsedTeams
            .map((savedTeam) => teamsData.find((team) => team.id === savedTeam.id))
            .filter(Boolean);
          setSelectedTeams(teamsToCompare);
        }
        
        // Fetch team talent data
        try {
          console.log("Fetching team talent data");
          const talentData = await teamsService.getTeamTalent();
          
          if (talentData && talentData.length > 0) {
            // Sort by talent score (highest to lowest)
            const sortedTalent = talentData.sort((a, b) => b.talent - a.talent);
            setTeamTalent(sortedTalent.slice(0, 25)); // Top 25 teams by talent
            console.log("Talent data:", sortedTalent.slice(0, 25));
          }
        } catch (error) {
          console.error("Error fetching talent data:", error);
        }
        
        // Fetch news
        try {
          console.log("Fetching news articles...");
          const newsData = await newsService.fetchNews();
          
          if (newsData && newsData.articles && newsData.articles.length > 0) {
            console.log("Successfully fetched news articles:", newsData.articles.length);
            // Sort by published date (newest first) if publishedAt exists
            const sortedArticles = [...newsData.articles].sort((a, b) => {
              if (a.publishedAt && b.publishedAt) {
                return new Date(b.publishedAt) - new Date(a.publishedAt);
              }
              return 0;
            });
            setNews(sortedArticles.slice(0, 10)); // Get top 10 news articles
          } else {
            console.error("News API returned empty or invalid data:", newsData);
            setNews([]);
          }
        } catch (error) {
          console.error("Error fetching news:", error);
          setNews([]);
        }
        
        // Fetch top recruits
        try {
          const recruitsData = await teamsService.getAllRecruits();
          if (recruitsData && recruitsData.length > 0) {
            // Sort by stars/rating
            const topRecruits = recruitsData
              .sort((a, b) => b.rating - a.rating)
              .slice(0, 15); // Get top 15
            
            // Add team logo URLs to each recruit
            const recruitsWithLogos = topRecruits.map(recruit => {
              const team = teamsData.find(t => 
                t.school === recruit.committedTo || 
                t.mascot === recruit.committedTo
              );
              return {
                ...recruit,
                teamLogo: team?.logos?.[0] || null
              };
            });
            
            setRecruits(recruitsWithLogos);
          }
        } catch (error) {
          console.error("Error fetching recruits:", error);
        }
        
        setIsLoading(false);
      } catch (err) {
        setError(err.message);
        setIsLoading(false);
      }
    };

    fetchData();
  }, [dataVersion]); // Re-run when dataVersion changes

  // Extract and transform ratings data from GraphQL response
  const extractRatingsFromGraphQL = (data) => {
    if (!data) return null;
    
    // Define default values
    const defaultRating = 25;
    
    // Process offense rating - using specifically spOffense
    const offenseRating = data.spOffense !== undefined && data.spOffense !== null
        ? parseFloat(data.spOffense)
        : defaultRating;
    
    // Process defense rating - using specifically spDefense
    const defenseRating = data.spDefense !== undefined && data.spDefense !== null
        ? parseFloat(data.spDefense)
        : defaultRating;
    
    // Process overall rating - using specifically spOverall
    const overallRating = data.spOverall !== undefined && data.spOverall !== null
        ? parseFloat(data.spOverall)
        : defaultRating;
    
    // Return formatted ratings object
    return {
      offense: { rating: offenseRating },
      defense: { rating: defenseRating },
      rating: overallRating
    };
  };

  // Whenever the user selects (or deselects) teams, fetch their ratings.
  useEffect(() => {
    const fetchSelectedTeamsRatings = async () => {
      const newRatings = { ...teamRatings };
      const currentYear = 2024;

      // Save the selected teams to localStorage
      if (selectedTeams.length > 0) {
        localStorage.setItem("compareTeams", JSON.stringify(selectedTeams));
      } else {
        localStorage.removeItem("compareTeams");
      }

      for (const team of selectedTeams) {
        const teamIdentifier = getTeamIdentifier(team);
        try {
          if (newRatings[team.id]) continue; // Use team.id as key
          
          // First try to get detailed ratings from GraphQL using a trimmed team identifier
          console.log(`Fetching detailed ratings for ${teamIdentifier} via GraphQL...`);
          const graphqlData = await graphqlTeamsService.getTeamDetailedRatings(teamIdentifier, currentYear);
          
          if (graphqlData) {
            console.log(`GraphQL data for ${teamIdentifier}:`, graphqlData);
            const processedRatings = extractRatingsFromGraphQL(graphqlData);
            newRatings[team.id] = processedRatings;
            console.log(`Processed ratings for ${teamIdentifier}:`, processedRatings);
          } else {
            // Fallback to regular API if GraphQL fails or returns empty
            console.log(`Fallback to regular API for ${teamIdentifier}...`);
            const apiData = await teamsService.getTeamRatings(teamIdentifier, currentYear);
            
            // Create a properly structured rating object for consistency
            newRatings[team.id] = {
              offense: { rating: apiData?.offense?.rating || 25 },
              defense: { rating: apiData?.defense?.rating || 25 },
              rating: apiData?.rating || 25
            };
            console.log(`API fallback ratings for ${teamIdentifier}:`, newRatings[team.id]);
          }
        } catch (err) {
          console.error(`Error fetching ratings for team ${teamIdentifier}:`, err);
          // Provide default values when fetch fails
          newRatings[team.id] = {
            offense: { rating: 25 },
            defense: { rating: 25 },
            rating: 25
          };
        }
      }
      setTeamRatings(newRatings);
      setChartsLoaded(true);
    };

    if (selectedTeams.length > 0) {
      fetchSelectedTeamsRatings();
    } else {
      setChartsLoaded(false);
    }
  }, [selectedTeams]);

  // Animation effect when teams are selected
  useEffect(() => {
    if (comparisonRef.current && selectedTeams.length > 0) {
      comparisonRef.current.style.opacity = "0";
      comparisonRef.current.style.transform = "translateY(20px)";

      setTimeout(() => {
        comparisonRef.current.style.opacity = "1";
        comparisonRef.current.style.transform = "translateY(0)";
        comparisonRef.current.style.transition = "opacity 0.6s ease-out, transform 0.6s ease-out";
      }, 100);
    }
  }, [selectedTeams, chartsLoaded]);

  // Handle adding/removing teams from comparison
  const handleTeamSelect = (team) => {
    setSelectedTeams((prevSelected) => {
      if (prevSelected.find((t) => t.id === team.id)) {
        // If removing a team, also remove its ratings from state
        const newRatings = { ...teamRatings };
        delete newRatings[team.id];
        setTeamRatings(newRatings);
        return prevSelected.filter((t) => t.id !== team.id);
      } else {
        if (prevSelected.length < 4) {
          return [...prevSelected, team];
        } else {
          alert("You can only compare up to 4 teams.");
          return prevSelected;
        }
      }
    });
  };

  // Clear all selections
  const clearComparison = () => {
    setSelectedTeams([]);
    setTeamRatings({});
    setChartsLoaded(false);
    localStorage.removeItem("compareTeams");
  };

  // Toggle sort order
  const toggleSortOrder = () => {
    setSortOrder(sortOrder === "asc" ? "desc" : "asc");
  };

  // Change sort field
  const handleSortChange = (field) => {
    if (sortBy === field) {
      toggleSortOrder();
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  // Build data for chart comparison.
  // We'll compare 3 metrics: Offense, Defense, Overall.
  const METRICS = ["Offense", "Defense", "Overall"];
  const METRIC_ICONS = {
    Overall: <FaFootballBall />,
    Offense: <FaRunning />,
    Defense: <FaShieldAlt />
  };

  const chartData = METRICS.map((metric) => {
    const row = { metric };
    selectedTeams.forEach((team) => {
      const teamData = teamRatings[team.id]; // Use team.id as key
      
      if (teamData) {
        if (metric === "Offense") {
          row[team.id] = teamData.offense?.rating || 0;
        } else if (metric === "Defense") {
          row[team.id] = teamData.defense?.rating || 0;
        } else { // Overall
          row[team.id] = teamData.rating || 0;
        }
      } else {
        row[team.id] = 0;
      }
    });
    return row;
  });

  // Custom Legend for the charts
  const renderCustomLegend = (props) => {
    const { payload } = props;
    return (
      <div className="tcd-custom-legend">
        {payload.map((entry) => {
          const teamId = entry.dataKey;
          const team = selectedTeams.find((t) => t.id === teamId);
          if (!team) return null;
          return (
            <div key={teamId} className="tcd-legend-item">
              <div
                className="tcd-legend-color"
                style={{ backgroundColor: entry.color }}
              />
              <img
                src={team.logos?.[0] || "/photos/default_team.png"}
                alt={team.school}
                className="tcd-legend-logo"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "/photos/default_team.png";
                }}
              />
              <span className="tcd-legend-name">{getTeamAbbreviation(team.school)}</span>
            </div>
          );
        })}
      </div>
    );
  };

  // Custom Tooltip for the charts
  const renderCustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="tcd-custom-tooltip">
          <p className="tcd-tooltip-metric">
            {METRIC_ICONS[label]} {label}
          </p>
          <div className="tcd-tooltip-items">
            {payload.map((entry, index) => {
              const team = selectedTeams.find((t) => t.id === entry.dataKey);
              if (!team) return null;
              return (
                <div key={index} className="tcd-tooltip-item">
                  <img
                    src={team.logos?.[0] || "/photos/default_team.png"}
                    alt={team.school}
                    className="tcd-tooltip-logo"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "/photos/default_team.png";
                    }}
                  />
                  <span style={{ color: entry.color }}>{team.school}:</span>
                  <span className="tcd-tooltip-value">{entry.value.toFixed(2)}</span>
                </div>
              );
            })}
          </div>
        </div>
      );
    }
    return null;
  };

  // Helper function to safely get rating value
  const getRatingValue = (team, metricType) => {
    const ratings = teamRatings[team.id];
    
    if (!ratings) return null;
    
    if (metricType === "Offense") {
      return ratings.offense?.rating;
    } else if (metricType === "Defense") {
      return ratings.defense?.rating;
    } else { // Overall
      return ratings.rating;
    }
  };

  // Filter and sort teams
  const getFilteredAndSortedTeams = () => {
    let filteredTeams = [...teams];
    
    // Apply conference filter
    if (conferenceFilter !== "All") {
      filteredTeams = filteredTeams.filter(team => 
        team.conference === conferenceFilter
      );
    }
    
    // Apply search filter
    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase();
      filteredTeams = filteredTeams.filter(team => 
        team.school.toLowerCase().includes(query) || 
        (team.mascot && team.mascot.toLowerCase().includes(query))
      );
    }
    
    // Apply sorting
    filteredTeams.sort((a, b) => {
      let compareResult = 0;
      
      if (sortBy === "school") {
        compareResult = a.school.localeCompare(b.school);
      } else if (sortBy === "conference") {
        // First sort by conference
        compareResult = (a.conference || "").localeCompare(b.conference || "");
        // If same conference, sort by school name
        if (compareResult === 0) {
          compareResult = a.school.localeCompare(b.school);
        }
      } else if (sortBy === "location") {
        const aLocation = a.location?.state || "";
        const bLocation = b.location?.state || "";
        compareResult = aLocation.localeCompare(bLocation);
      }
      
      // Apply sort order
      return sortOrder === "asc" ? compareResult : -compareResult;
    });
    
    return filteredTeams;
  };

  // Get all unique conferences for filter dropdown
  const getUniqueConferences = () => {
    const conferences = teams.map(team => team.conference || "Independent");
    return ["All", ...new Set(conferences)].sort();
  };

  // Find max talent score for normalization
  const maxTalent = teamTalent.length > 0 ? teamTalent[0].talent : 1000;

  // Modern styled containers and components
  const pageStyle = {
    backgroundColor: "#ffffff",
    padding: "20px 0",
    minHeight: "100vh",
    fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
    width: "98%",
    margin: "0 auto",
  };

  const headerStyle = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
    backgroundColor: "#ffffff",
    color: "#000000",
    boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
    borderRadius: "8px",
    marginBottom: "20px",
    width: "100%",
  };

  const headerImagesStyle = {
    display: "flex",
    justifyContent: "center",
    gap: "20px",
    marginBottom: "15px",
    width: "100%",
  };

  const headerImageStyle = {
    width: "300px",
    height: "180px",
    objectFit: "cover",
    borderRadius: "8px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
  };

  const sloganStyle = {
    fontSize: "1.2rem",
    color: ncaaColors.primary,
    fontWeight: "500",
    textAlign: "center",
    margin: "10px 0",
    fontStyle: "italic",
  };

  const mainContentContainerStyle = {
    display: "grid",
    gridTemplateColumns: "350px 1fr 350px", // Left sidebar, main content, right sidebar
    gap: "20px",
    width: "100%",
  };

  const leftSidebarStyle = {
    display: "flex",
    flexDirection: "column",
  };

  const mainContentStyle = {
    display: "flex",
    flexDirection: "column",
  };

  const rightSidebarStyle = {
    display: "flex",
    flexDirection: "column",
  };

  const sectionStyle = {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: "8px",
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
    padding: "15px",
    marginBottom: "20px",
  };

  const sectionTitleStyle = {
    fontSize: "1.4rem",
    fontWeight: "700",
    textAlign: "left",
    marginBottom: "15px",
    padding: "8px 0",
    color: ncaaColors.primary,
    borderBottom: `2px solid ${ncaaColors.secondary}`,
  };

  const talentTitleStyle = {
    fontSize: "1.6rem",
    fontWeight: "bold",
    textAlign: "left",
    marginBottom: "15px",
    padding: "0 0 10px 0",
    color: ncaaColors.primary,
    textTransform: "uppercase",
    borderBottom: `2px solid ${ncaaColors.secondary}`,
  };

  const recruitsTitleStyle = {
    ...talentTitleStyle
  };

  const newsTitleStyle = {
    ...talentTitleStyle
  };

  const talentRowStyle = {
    display: "flex",
    padding: "8px 0",
    borderBottom: "1px solid #eee",
    alignItems: "center",
  };

  const talentBarContainerStyle = {
    height: "8px",
    borderRadius: "4px",
    backgroundColor: "#f0f0f0",
    overflow: "hidden",
    flex: 1,
    margin: "0 10px",
  };

  const recruitRowStyle = {
    display: "flex",
    padding: "10px 0",
    borderBottom: "1px solid #eee",
    alignItems: "center",
  };

  const recruitIconStyle = {
    width: "40px",
    height: "40px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f0f0f0",
    borderRadius: "50%",
    marginRight: "10px",
  };

  const newsCardStyle = {
    padding: "12px",
    marginBottom: "15px",
    backgroundColor: "#fff",
    borderRadius: "8px",
    boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
    transition: "transform 0.2s ease, box-shadow 0.2s ease",
    cursor: "pointer",
  };

  const newsImageStyle = {
    width: "100%",
    height: "140px",
    objectFit: "cover",
    borderRadius: "6px",
    marginBottom: "10px",
  };

  const newsTitleTextStyle = {
    fontSize: "1rem",
    fontWeight: "600",
    marginBottom: "8px",
    lineHeight: "1.3",
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
    textOverflow: "ellipsis",
  };

  const newsDescriptionStyle = {
    fontSize: "0.85rem",
    color: "#555",
    marginBottom: "8px",
    display: "-webkit-box",
    WebkitLineClamp: 3,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
    textOverflow: "ellipsis",
  };

  const newsDateStyle = {
    fontSize: "0.75rem",
    color: "#888",
    textAlign: "right",
  };

  const filterContainerStyle = {
    display: "flex",
    flexWrap: "wrap",
    gap: "10px",
    marginBottom: "15px",
    padding: "10px",
    backgroundColor: "#f9f9f9",
    borderRadius: "8px",
  };

  const filterSelectStyle = {
    padding: "8px 12px",
    borderRadius: "4px",
    border: "1px solid #ddd",
    backgroundColor: "#fff",
    flex: "1 1 150px",
    maxWidth: "250px",
  };

  const searchInputStyle = {
    padding: "8px 12px",
    borderRadius: "4px",
    border: "1px solid #ddd",
    backgroundColor: "#fff",
    flex: "1 1 200px",
  };

  const sortButtonStyle = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "8px 12px",
    borderRadius: "4px",
    border: "1px solid #ddd",
    backgroundColor: "#fff",
    cursor: "pointer",
  };

  const teamTableStyle = {
    width: "100%",
    borderCollapse: "collapse",
    marginTop: "15px",
  };

  const teamTableHeaderStyle = {
    backgroundColor: ncaaColors.primary,
    color: "#fff",
    padding: "10px",
    textAlign: "left",
  };

  const teamTableCellStyle = {
    padding: "10px",
    borderBottom: "1px solid #eee",
  };

  const teamLogoStyle = {
    width: "30px",
    height: "30px",
    marginRight: "10px",
    objectFit: "contain",
  };

  const loadingStyle = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "40px",
    fontSize: "1.2rem",
  };

  const errorStyle = {
    color: "#e53935",
    padding: "20px",
    textAlign: "center",
    border: "1px solid #ffcdd2",
    borderRadius: "8px",
    backgroundColor: "#ffebee",
  };

  if (isLoading)
    return (
      <div style={loadingStyle}>
        <LoadingSpinner />
        <div>Loading teams information...</div>
      </div>
    );

  if (error)
    return (
      <div style={errorStyle}>
        <FaInfoCircle size={40} />
        <div>{error}</div>
        <button 
          onClick={refreshData}
          style={{
            marginTop: "20px",
            padding: "10px 20px",
            backgroundColor: ncaaColors.secondary,
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer"
          }}
        >
          Try Again
        </button>
      </div>
    );
    
  const filteredTeams = getFilteredAndSortedTeams();
  const uniqueConferences = getUniqueConferences();

  return (
    <div style={pageStyle}>
      {/* Header with NCAA images and slogan */}
      <div style={headerStyle}>
        <div style={headerImagesStyle}>
          <img 
            src="/photos/football.avif" 
            alt="NCAA Football" 
            style={headerImageStyle} 
          />
          <img 
            src="/photos/Playoff.jpg" 
            alt="NCAA Playoff" 
            style={headerImageStyle} 
          />
        </div>
        <p style={sloganStyle}>
          "NCAA The Heart of Saturday: This NCAA Football, where dreams are chased and rivalries are born."
        </p>
      </div>

      <div style={mainContentContainerStyle}>
        {/* Left Sidebar - Team Talent and News */}
        <div style={leftSidebarStyle}>
          {/* Team Talent Section */}
          <div style={sectionStyle}>
            <h2 style={talentTitleStyle}>
              <FaChartBar style={{ marginRight: "10px" }} />
              TEAM TALENT
            </h2>
            {teamTalent.length > 0 ? (
              <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                {teamTalent.map((team, index) => (
                  <div key={index} style={talentRowStyle}>
                    <div style={{ 
                      width: "24px", 
                      textAlign: "center", 
                      fontWeight: "bold",
                      fontSize: "0.9rem",
                      color: index < 3 ? ncaaColors.secondary : "#666"
                    }}>
                      {index + 1}
                    </div>
                    <div style={{ 
                      display: "flex",
                      alignItems: "center",
                      width: "120px"
                    }}>
                      {/* Try to find the matching team logo */}
                      {teams.find(t => t.school === team.team)?.logos?.[0] && (
                        <img
                          src={teams.find(t => t.school === team.team)?.logos?.[0] || "/photos/default_team.png"}
                          alt={team.team}
                          style={{
                            width: "20px",
                            height: "20px",
                            marginRight: "8px",
                            objectFit: "contain"
                          }}
                        />
                      )}
                      <span style={{ fontSize: "0.9rem", fontWeight: "500" }}>
                        {team.team}
                      </span>
                    </div>
                    <div style={talentBarContainerStyle}>
                      <div style={{
                        height: "100%",
                        width: `${(team.talent / maxTalent) * 100}%`,
                        backgroundColor: index < 3 ? ncaaColors.secondary : "#aaa",
                        borderRadius: "4px"
                      }} />
                    </div>
                    <div style={{ 
                      width: "60px", 
                      textAlign: "right",
                      fontSize: "0.85rem",
                      fontWeight: "500",
                      color: index < 3 ? ncaaColors.secondary : "#555"
                    }}>
                      {team.talent.toFixed(1)}
                    </div>
                  </div>
                ))}
                <div style={{ 
                  marginTop: "10px",
                  fontSize: "0.8rem",
                  color: "#666",
                  textAlign: "center",
                  padding: "5px",
                  backgroundColor: "#f9f9f9",
                  borderRadius: "4px"
                }}>
                  Talent Composite scores based on recruiting ratings
                </div>
              </div>
            ) : (
              <div style={{ 
                padding: "15px", 
                textAlign: "center", 
                color: "#666",
                backgroundColor: "#f9f9f9",
                borderRadius: "4px"
              }}>
                No talent data available
              </div>
            )}
          </div>

          {/* News Section */}
          <div style={sectionStyle}>
            <h2 style={newsTitleStyle}>
              <FaNewspaper style={{ marginRight: "10px" }} />
              LATEST NEWS
            </h2>
            {news && news.length > 0 ? (
              <div style={{ maxHeight: '650px', overflowY: 'auto' }}>
                {news.map((article, index) => (
                  <div key={index} style={newsCardStyle} onClick={() => window.open(article.url, "_blank")}>
                    {article.image && (
                      <img
                        src={article.image}
                        alt={article.title}
                        style={newsImageStyle}
                        onError={(e) => {
                          e.target.src = "/photos/default_news.jpg";
                        }}
                      />
                    )}
                    <h3 style={newsTitleTextStyle}>{article.title}</h3>
                    <p style={newsDescriptionStyle}>{article.description || "Read more..."}</p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ 
                        backgroundColor: '#f0f0f0', 
                        padding: '3px 6px',
                        borderRadius: '4px',
                        fontSize: '0.7rem',
                        color: '#555'
                      }}>
                        {article.source && article.source.name ? article.source.name : "College Sports"}
                      </span>
                      <p style={newsDateStyle}>{article.publishedAt && formatNewsDate(article.publishedAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ 
                padding: "20px", 
                textAlign: "center", 
                backgroundColor: "#f9f9f9",
                borderRadius: "6px",
                color: "#666"
              }}>
                <FaNewspaper style={{ fontSize: "24px", marginBottom: "10px", opacity: 0.6 }} />
                <p>No news articles available at the moment</p>
                <button 
                  onClick={refreshData}
                  style={{
                    marginTop: "10px",
                    padding: "8px 16px",
                    backgroundColor: ncaaColors.secondary,
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontSize: "0.8rem"
                  }}
                >
                  Refresh News
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Main content area - Teams Table */}
        <div style={mainContentStyle}>
          <div style={sectionStyle}>
            <h2 style={sectionTitleStyle}>NCAA Football Teams</h2>
            
            {/* Filter and Search Controls */}
            <div style={filterContainerStyle}>
              <select 
                style={filterSelectStyle}
                value={conferenceFilter}
                onChange={(e) => setConferenceFilter(e.target.value)}
              >
                {uniqueConferences.map((conf) => (
                  <option key={conf} value={conf}>{conf}</option>
                ))}
              </select>
              
              <input 
                type="text"
                placeholder="Search teams..."
                style={searchInputStyle}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              
              <button 
                style={sortButtonStyle}
                onClick={() => handleSortChange("school")}
              >
                Name {sortBy === "school" && (sortOrder === "asc" ? <FaSortAmountDown /> : <FaSortAmountUp />)}
              </button>
              
              <button 
                style={sortButtonStyle}
                onClick={() => handleSortChange("conference")}
              >
                Conference {sortBy === "conference" && (sortOrder === "asc" ? <FaSortAmountDown /> : <FaSortAmountUp />)}
              </button>
              
              <button 
                style={sortButtonStyle}
                onClick={() => handleSortChange("location")}
              >
                Location {sortBy === "location" && (sortOrder === "asc" ? <FaSortAmountDown /> : <FaSortAmountUp />)}
              </button>
            </div>
            
            {/* Teams Table */}
            <div style={{ overflowX: "auto" }}>
              <table style={teamTableStyle}>
                <thead>
                  <tr>
                    <th style={teamTableHeaderStyle}>Team</th>
                    <th style={teamTableHeaderStyle}>Conference</th>
                    <th style={teamTableHeaderStyle}>Location</th>
                    <th style={teamTableHeaderStyle}>Mascot</th>
                    <th style={teamTableHeaderStyle}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTeams.map((team) => (
                    <tr key={team.id}>
                      <td style={{...teamTableCellStyle, display: "flex", alignItems: "center"}}>
                        <img 
                          src={team.logos?.[0] || "/photos/default_team.png"} 
                          alt={team.school}
                          style={teamLogoStyle}
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = "/photos/default_team.png";
                          }}
                        />
                        <span>{team.school}</span>
                      </td>
                      <td style={teamTableCellStyle}>
                        {team.conference || "Independent"}
                      </td>
                      <td style={teamTableCellStyle}>
                        {team.location?.city}, {team.location?.state || "N/A"}
                      </td>
                      <td style={teamTableCellStyle}>
                        {team.mascot || "N/A"}
                      </td>
                      <td style={teamTableCellStyle}>
                        <div style={{ display: "flex", gap: "10px" }}>
                          <button
                            style={{
                              padding: "5px 10px",
                              backgroundColor: selectedTeams.find(t => t.id === team.id) ? "#f44336" : ncaaColors.secondary,
                              color: "white",
                              border: "none",
                              borderRadius: "4px",
                              cursor: "pointer",
                              fontSize: "0.8rem",
                              display: "flex",
                              alignItems: "center",
                              gap: "5px"
                            }}
                            onClick={() => handleTeamSelect(team)}
                          >
                            {selectedTeams.find(t => t.id === team.id) ? (
                              <>
                                <FaMinus size={10} />
                                Remove
                              </>
                            ) : (
                              <>
                                <FaPlus size={10} />
                                Compare
                              </>
                            )}
                          </button>
                          <Link 
                            to={`/teams/${team.id}`}
                            style={{
                              padding: "5px 10px",
                              backgroundColor: "#555",
                              color: "white",
                              border: "none",
                              borderRadius: "4px",
                              cursor: "pointer",
                              fontSize: "0.8rem",
                              textDecoration: "none",
                              display: "flex",
                              alignItems: "center",
                              gap: "5px"
                            }}
                          >
                            <FaEye size={10} />
                            Details
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {filteredTeams.length === 0 && (
              <div style={{ 
                padding: "20px", 
                textAlign: "center", 
                backgroundColor: "#f9f9f9",
                borderRadius: "6px",
                color: "#666",
                marginTop: "15px"
              }}>
                <p>No teams match your search criteria.</p>
              </div>
            )}
          </div>

          {/* Team Comparison Section */}
          <div style={sectionStyle} ref={comparisonRef}>
            <h2 style={sectionTitleStyle}>
              <FaExchangeAlt style={{ marginRight: "10px" }} />
              Team Comparison
            </h2>

            {selectedTeams.length === 0 ? (
              <div style={{ 
                padding: "30px", 
                textAlign: "center", 
                backgroundColor: "#f9f9f9",
                borderRadius: "6px",
                color: "#666"
              }}>
                <FaExchangeAlt style={{ fontSize: "24px", marginBottom: "10px", opacity: 0.6 }} />
                <p>Select up to 4 teams to compare their statistics.</p>
                <p style={{ fontSize: "0.9rem", color: "#888", marginTop: "10px" }}>
                  Use the "Compare" button in the teams table above.
                </p>
              </div>
            ) : (
              <>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "15px" }}>
                  <ChartTabs activeTab={activeChart} setActiveTab={setActiveChart} />
                  <button 
                    onClick={clearComparison} 
                    style={{
                      backgroundColor: "#f44336",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      padding: "8px 15px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "5px"
                    }}
                  >
                    <FaTrashAlt size={14} />
                    Clear All
                  </button>
                </div>

                {/* Define gradients for chart elements */}
                <svg style={{ width: 0, height: 0, position: "absolute" }} aria-hidden="true" focusable="false">
                  <defs>
                    {selectedTeams.map((team) => {
                      const baseColor = team.color || "#666";
                      const lightColor = lightenColor(baseColor, 30);
                      return (
                        <linearGradient key={team.id} id={getGradientId(team.color || "#666")} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={lightColor} stopOpacity="0.8" />
                          <stop offset="95%" stopColor={baseColor} stopOpacity="0.8" />
                        </linearGradient>
                      );
                    })}
                  </defs>
                </svg>
                
                {/* Charts Content - Conditional Rendering */}
                <div style={{ 
                  height: "400px", 
                  backgroundColor: "#f9f9f9", 
                  borderRadius: "8px", 
                  padding: "15px",
                  marginBottom: "20px"
                }}>
                  {!chartsLoaded ? (
                    <div style={{ 
                      height: "100%", 
                      display: "flex", 
                      flexDirection: "column", 
                      justifyContent: "center", 
                      alignItems: "center" 
                    }}>
                      <LoadingSpinner />
                      <p>Loading team ratings...</p>
                    </div>
                  ) : (
                    <>
                      {/* Line Chart */}
                      {activeChart === "line" && (
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 10 }}>
                            <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                            <XAxis dataKey="metric" axisLine={false} tickLine={false} tick={{ fill: "#666", fontSize: 14 }} />
                            <YAxis domain={[0, 50]} axisLine={false} tickLine={false} tick={{ fill: "#666", fontSize: 12 }} />
                            <Tooltip content={renderCustomTooltip} />
                            <Legend content={renderCustomLegend} />
                            <ReferenceLine y={25} stroke="#666" strokeDasharray="3 3" strokeOpacity={0.5} />
                            {selectedTeams.map((team) => (
                              <Line
                                key={team.id}
                                type="monotone"
                                dataKey={team.id}
                                stroke={team.color || "#666"}
                                strokeWidth={3}
                                dot={{ stroke: team.color || "#666", strokeWidth: 2, r: 6, fill: "#fff" }}
                                activeDot={{ r: 8, stroke: team.color || "#666", strokeWidth: 2, fill: "#fff" }}
                              />
                            ))}
                          </LineChart>
                        </ResponsiveContainer>
                      )}

                      {/* Radar Chart */}
                      {activeChart === "radar" && (
                        <ResponsiveContainer width="100%" height="100%">
                          <RadarChart cx="50%" cy="50%" outerRadius="70%" data={chartData}>
                            <PolarGrid gridType="polygon" stroke="#ddd" />
                            <PolarAngleAxis dataKey="metric" tick={{ fill: "#666", fontSize: 14 }} axisLine={{ stroke: "#ddd" }} />
                            <PolarRadiusAxis angle={30} domain={[0, 50]} axisLine={false} tick={{ fill: "#666", fontSize: 12 }} />
                            {selectedTeams.map((team) => (
                              <Radar
                                key={team.id}
                                name={team.school}
                                dataKey={team.id}
                                stroke={team.color || "#666"}
                                fill={`url(#${getGradientId(team.color || "#666")})`}
                                fillOpacity={0.6}
                              />
                            ))}
                            <Legend content={renderCustomLegend} />
                            <Tooltip content={renderCustomTooltip} />
                          </RadarChart>
                        </ResponsiveContainer>
                      )}

                      {/* Bar Chart */}
                      {activeChart === "bar" && (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 10 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.2} />
                            <XAxis dataKey="metric" axisLine={false} tickLine={false} tick={{ fill: "#666", fontSize: 14 }} />
                            <YAxis domain={[0, 50]} axisLine={false} tickLine={false} tick={{ fill: "#666", fontSize: 12 }} />
                            <Tooltip content={renderCustomTooltip} />
                            <Legend content={renderCustomLegend} />
                            <ReferenceLine y={25} stroke="#666" strokeDasharray="3 3" label="Avg" />
                            {selectedTeams.map((team) => (
                              <Bar
                                key={team.id}
                                dataKey={team.id}
                                fill={`url(#${getGradientId(team.color || "#666")})`}
                                stroke={team.color || "#666"}
                                strokeWidth={1}
                                radius={[4, 4, 0, 0]}
                                barSize={35}
                              />
                            ))}
                          </BarChart>
                        </ResponsiveContainer>
                      )}

                      {/* Table View */}
                      {activeChart === "table" && (
                        <div style={{ height: "100%", overflowY: "auto" }}>
                          <table style={{ width: "100%", borderCollapse: "collapse" }}>
                            <thead>
                              <tr>
                                <th style={{
                                  padding: "10px",
                                  backgroundColor: ncaaColors.primary,
                                  color: "white",
                                  textAlign: "left",
                                  position: "sticky",
                                  top: 0
                                }}>
                                  Metric
                                </th>
                                {selectedTeams.map((team) => (
                                  <th key={team.id} style={{
                                    padding: "10px",
                                    backgroundColor: ncaaColors.primary,
                                    color: "white",
                                    textAlign: "center",
                                    position: "sticky",
                                    top: 0
                                  }}>
                                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                                      <img
                                        src={team.logos?.[0] || "/photos/default_team.png"}
                                        alt={team.school}
                                        style={{
                                          width: "25px",
                                          height: "25px",
                                          marginRight: "8px",
                                          objectFit: "contain"
                                        }}
                                        onError={(e) => {
                                          e.target.onerror = null;
                                          e.target.src = "/photos/default_team.png";
                                        }}
                                      />
                                      <span>{getTeamAbbreviation(team.school)}</span>
                                    </div>
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {METRICS.map((metric) => (
                                <tr key={metric} style={{ backgroundColor: metric === "Overall" ? "#f0f0f0" : "white" }}>
                                  <td style={{
                                    padding: "12px",
                                    borderBottom: "1px solid #ddd",
                                    display: "flex",
                                    alignItems: "center",
                                    fontWeight: metric === "Overall" ? "bold" : "normal"
                                  }}>
                                    <span style={{ marginRight: "8px" }}>{METRIC_ICONS[metric]}</span>
                                    {metric}
                                  </td>
                                  {selectedTeams.map((team) => {
                                    // Get the rating value using our helper function
                                    let value = getRatingValue(team, metric);
                                    
                                    // Apply default if missing
                                    if (value === null || value === undefined) {
                                      value = 25; // Default rating when missing
                                    }
                                    
                                    // Determine the color based on value
                                    let valueColor = "#666";
                                    if (typeof value === "number") {
                                      if (value > 30) valueColor = "#04aa6d";
                                      else if (value < 20) valueColor = "#ff4d4d";
                                      else valueColor = "#ffc700";
                                    }
                                    
                                    return (
                                      <td key={team.id} style={{
                                        padding: "12px",
                                        borderBottom: "1px solid #ddd",
                                        textAlign: "center",
                                        fontWeight: metric === "Overall" ? "bold" : "normal"
                                      }}>
                                        <span style={{ 
                                          color: valueColor,
                                          fontSize: "1.1rem" 
                                        }}>
                                          {typeof value === "number" ? value.toFixed(2) : "N/A"}
                                        </span>
                                      </td>
                                    );
                                  })}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </>
                  )}
                </div>
                
                {/* Comparison Cards */}
                <div style={{ 
                  display: "grid", 
                  gridTemplateColumns: `repeat(${Math.min(selectedTeams.length, 4)}, 1fr)`,
                  gap: "15px"
                }}>
                  {selectedTeams.map((team) => (
                    <div key={team.id} style={{
                      backgroundColor: "#f9f9f9",
                      borderRadius: "8px",
                      padding: "15px",
                      position: "relative",
                      boxShadow: "0 2px 5px rgba(0,0,0,0.1)"
                    }}>
                      <button
                        style={{
                          position: "absolute",
                          top: "10px",
                          right: "10px",
                          backgroundColor: "#f44336",
                          color: "white",
                          border: "none",
                          borderRadius: "50%",
                          width: "24px",
                          height: "24px",
                          display: "flex",
                          justifyContent: "center",
                          alignItems: "center",
                          cursor: "pointer",
                          fontSize: "12px"
                        }}
                        onClick={() => handleTeamSelect(team)}
                        aria-label="Remove team"
                      >
                        <FaTimes size={12} />
                      </button>
                      
                      <div style={{ 
                        display: "flex", 
                        flexDirection: "column", 
                        alignItems: "center",
                        marginBottom: "15px"
                      }}>
                        <img
                          src={team.logos?.[0] || "/photos/default_team.png"}
                          alt={team.school}
                          style={{
                            width: "60px",
                            height: "60px",
                            objectFit: "contain",
                            marginBottom: "10px"
                          }}
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = "/photos/default_team.png";
                          }}
                        />
                        <h3 style={{ 
                          fontSize: "1.1rem", 
                          fontWeight: "bold",
                          margin: "5px 0",
                          textAlign: "center"
                        }}>
                          {team.school}
                        </h3>
                        <p style={{ 
                          fontSize: "0.9rem", 
                          color: "#666",
                          margin: "0"
                        }}>
                          {team.conference || "Independent"}
                        </p>
                      </div>
                      
                      <div style={{ fontSize: "0.85rem" }}>
                        <div style={{ display: "flex", marginBottom: "6px" }}>
                          <FaMapMarkerAlt style={{ marginRight: "8px", color: "#666" }} />
                          <span>{team.location?.city}, {team.location?.state || "N/A"}</span>
                        </div>
                        <div style={{ display: "flex", marginBottom: "6px" }}>
                          <FaFootballBall style={{ marginRight: "8px", color: "#666" }} />
                          <span>{team.mascot || "N/A"}</span>
                        </div>
                        <div style={{ display: "flex", marginBottom: "6px" }}>
                          <FaTrophy style={{ marginRight: "8px", color: "#666" }} />
                          <span>Division I</span>
                        </div>
                        
                        <Link to={`/teams/${team.id}`} style={{
                          display: "block",
                          backgroundColor: ncaaColors.secondary,
                          color: "white",
                          padding: "8px 12px",
                          borderRadius: "4px",
                          textAlign: "center",
                          textDecoration: "none",
                          marginTop: "10px",
                          fontSize: "0.85rem"
                        }}>
                          <FaEye style={{ marginRight: "5px" }} />
                          View Details
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Right Sidebar - Top Recruits */}
        <div style={rightSidebarStyle}>
          <div style={sectionStyle}>
            <h2 style={recruitsTitleStyle}>
              <FaUsers style={{ marginRight: "10px" }} />
              TOP RECRUITS
            </h2>
            {recruits && recruits.length > 0 ? (
              <div style={{ maxHeight: '650px', overflowY: 'auto' }}>
                {recruits.map((recruit, index) => (
                  <div key={index} style={recruitRowStyle}>
                    <div style={recruitIconStyle}>
                      <FaUserAlt size={20} color="#666" />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: "bold", fontSize: "0.95rem" }}>
                        {recruit.name || "Unnamed Recruit"}
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ 
                          fontSize: "0.8rem", 
                          color: "#666", 
                          display: "flex", 
                          alignItems: "center"
                        }}>
                          {recruit.position || "Unknown"} • 
                          {recruit.teamLogo && (
                            <img 
                              src={recruit.teamLogo} 
                              alt={recruit.committedTo}
                              style={{
                                width: "18px",
                                height: "18px",
                                margin: "0 4px",
                                objectFit: "contain",
                              }}
                            />
                          )}
                          {recruit.committedTo || "Uncommitted"}
                        </div>
                        <div style={{ display: "flex", alignItems: "center" }}>
                          <span style={{ 
                            backgroundColor: ncaaColors.secondary,
                            color: "white",
                            padding: "2px 6px",
                            borderRadius: "4px",
                            fontSize: "0.75rem",
                            fontWeight: "bold",
                            marginRight: "5px"
                          }}>
                            {recruit.stars || Math.floor(recruit.rating)}★
                          </span>
                        </div>
                      </div>
                      <div style={{ marginTop: "2px" }}>
                        <StarRating rating={recruit.stars || recruit.rating} />
                      </div>
                    </div>
                  </div>
                ))}
                <div style={{ 
                  marginTop: "15px", 
                  textAlign: "center",
                  padding: "8px",
                  borderTop: "1px solid #eee" 
                }}>
                  <a href="#" style={{ 
                    color: ncaaColors.secondary,
                    textDecoration: "none",
                    fontWeight: "bold",
                    fontSize: "0.9rem"
                  }}>
                    View All Recruits
                  </a>
                </div>
              </div>
            ) : (
              <div style={{ 
                padding: "20px", 
                textAlign: "center", 
                backgroundColor: "#f9f9f9",
                borderRadius: "6px",
                color: "#666"
              }}>
                <FaUsers style={{ fontSize: "24px", marginBottom: "10px", opacity: 0.6 }} />
                <p>No recruit data available at the moment</p>
                <button 
                  onClick={refreshData}
                  style={{
                    marginTop: "10px",
                    padding: "8px 16px",
                    backgroundColor: ncaaColors.secondary,
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontSize: "0.8rem"
                  }}
                >
                  Refresh Data
                </button>
              </div>
            )}
          </div>
          
          {/* Additional Info Section for Right Sidebar */}
          <div style={sectionStyle}>
            <h2 style={sectionTitleStyle}>NCAA Information</h2>
            <div style={{ padding: "10px" }}>
              <div style={{ marginBottom: "15px" }}>
                <h3 style={{ 
                  fontSize: "1.1rem", 
                  fontWeight: "bold",
                  color: ncaaColors.primary,
                  marginBottom: "8px" 
                }}>
                  Divisions
                </h3>
                <ul style={{ paddingLeft: "20px" }}>
                  <li style={{ marginBottom: "5px" }}>Division I FBS</li>
                  <li style={{ marginBottom: "5px" }}>Division I FCS</li>
                  <li style={{ marginBottom: "5px" }}>Division II</li>
                  <li style={{ marginBottom: "5px" }}>Division III</li>
                </ul>
              </div>
              
              <div style={{ marginBottom: "15px" }}>
                <h3 style={{ 
                  fontSize: "1.1rem", 
                  fontWeight: "bold", 
                  color: ncaaColors.primary,
                  marginBottom: "8px" 
                }}>
                  Championship Events
                </h3>
                <ul style={{ paddingLeft: "20px" }}>
                  <li style={{ marginBottom: "5px" }}>College Football Playoff</li>
                  <li style={{ marginBottom: "5px" }}>Bowl Games</li>
                  <li style={{ marginBottom: "5px" }}>FCS Championship</li>
                </ul>
              </div>
              
              <div>
                <h3 style={{ 
                  fontSize: "1.1rem", 
                  fontWeight: "bold", 
                  color: ncaaColors.primary,
                  marginBottom: "8px" 
                }}>
                  Season Calendar
                </h3>
                <ul style={{ paddingLeft: "20px" }}>
                  <li style={{ marginBottom: "5px" }}>Regular Season: August - November</li>
                  <li style={{ marginBottom: "5px" }}>Conference Championships: December</li>
                  <li style={{ marginBottom: "5px" }}>Bowl Season: December - January</li>
                  <li style={{ marginBottom: "5px" }}>Playoffs: December - January</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Teams;
