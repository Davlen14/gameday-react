import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import teamsService from "../services/teamsService";
import graphqlTeamsService from "../services/graphqlTeamsService";
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
  FaSpinner
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

const Teams = () => {
  // State for teams
  const [teams, setTeams] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

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

  // Helper: Get a standardized team identifier (trimmed team name)
  const getTeamIdentifier = (team) => {
    return team.school ? team.school.trim() : "";
  };

  // Fetch FBS teams on mount
  useEffect(() => {
    const fetchTeams = async () => {
      try {
        setIsLoading(true);
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
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchTeams();
  }, []);

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

  if (isLoading)
    return (
      <div className="tcd-loading-screen">
        <LoadingSpinner />
        <div>Loading teams information...</div>
      </div>
    );

  if (error)
    return (
      <div className="tcd-error-screen">
        <FaInfoCircle size={40} />
        <div>{error}</div>
      </div>
    );

  const groupedTeams = groupByConference(teams, conferenceOrder);

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

  return (
    <div className="tcd-teams-comparison-container" style={{ fontFamily: "Obriton, sans-serif" }}>
      {/* Teams Section: Displaying all teams */}
      <div className="tcd-teams-list-section">
        <h2 className="tcd-teams-section-title">FBS Teams</h2>
        <div className="tcd-teams-container">
          <div className="tcd-conferences-list">
            {Object.entries(groupedTeams).map(([conference, confTeams]) => (
              <div key={conference} className="tcd-conference-section">
                <div className="tcd-conference-header">
                  <div className="tcd-conference-logo-container">
                    <img
                      src={conferenceLogos[conference] || "/photos/default_conference.png"}
                      alt={conference}
                      className="tcd-conference-logo"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "/photos/default_conference.png";
                      }}
                    />
                  </div>
                  <h3 className="tcd-conference-title">{conference}</h3>
                </div>
                <div className="tcd-teams-table">
                  {confTeams.map((team) => (
                    <div key={team.id} className="tcd-team-card-container">
                      <div className="tcd-team-card">
                        <div className="tcd-team-content">
                          <div className="tcd-team-logo-container">
                            <Link to={`/teams/${team.id}`}>
                              <img
                                src={team.logos?.[0] || "/photos/default_team.png"}
                                alt={team.school}
                                className="tcd-team-logo"
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = "/photos/default_team.png";
                                }}
                              />
                            </Link>
                          </div>
                          <h4 className="tcd-team-name">
                            {getTeamAbbreviation(team.school)}
                          </h4>
                        </div>
                        <button
                          className={`tcd-compare-button ${selectedTeams.find((t) => t.id === team.id) ? "selected" : ""}`}
                          onClick={() => handleTeamSelect(team)}
                        >
                          {selectedTeams.find((t) => t.id === team.id) ? (
                            <>
                              <FaMinus size={12} />
                              Remove
                            </>
                          ) : (
                            <>
                              <FaPlus size={12} />
                              Compare
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Comparison Section: Displaying selected teams for comparison */}
      <div className="tcd-comparison-section" ref={comparisonRef}>
        <h2>
          <FaExchangeAlt style={{ marginRight: "10px" }} />
          Team Comparison
        </h2>

        {/* Move the Chart Tabs to the top of the comparison section */}
        {selectedTeams.length > 0 && (
          <ChartTabs activeTab={activeChart} setActiveTab={setActiveChart} />
        )}

        {selectedTeams.length === 0 ? (
          <div className="tcd-no-teams-selected">
            <div className="tcd-empty-state-icon">
              <FaExchangeAlt size={40} />
            </div>
            <p>
              No teams selected. Click "Compare" on teams to add them for comparison.
            </p>
            <p className="tcd-help-text">You can compare up to 4 teams at once.</p>
          </div>
        ) : (
          <>
            <button onClick={clearComparison} className="tcd-clear-button">
              <FaTrashAlt /> Clear All
            </button>

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
            <div className="tcd-charts-container">
              {!chartsLoaded ? (
                <div className="tcd-loading-indicator">
                  <LoadingSpinner />
                  <p>Loading team ratings...</p>
                </div>
              ) : (
                <>
                  {/* Line Chart */}
                  {activeChart === "line" && (
                    <div className="tcd-chart-wrapper">
                      <ResponsiveContainer width="100%" height={350}>
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
                    </div>
                  )}

                  {/* Radar Chart */}
                  {activeChart === "radar" && (
                    <div className="tcd-chart-wrapper">
                      <ResponsiveContainer width="100%" height={400}>
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
                    </div>
                  )}

                  {/* Bar Chart */}
                  {activeChart === "bar" && (
                    <div className="tcd-chart-wrapper">
                      <ResponsiveContainer width="100%" height={350}>
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
                    </div>
                  )}

                  {/* Table View */}
                  {activeChart === "table" && (
                    <div className="tcd-ratings-table-container">
                      <table className="tcd-ratings-table">
                        <thead>
                          <tr>
                            <th>Metric</th>
                            {selectedTeams.map((team) => (
                              <th key={team.id}>
                                <div className="tcd-table-team-header">
                                  <img
                                    src={team.logos?.[0] || "/photos/default_team.png"}
                                    alt={team.school}
                                    className="tcd-table-team-logo"
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
                            <tr key={metric}>
                              <td className="tcd-metric-cell">
                                <span className="tcd-metric-icon">{METRIC_ICONS[metric]}</span>
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
                                  <td key={team.id} className="tcd-value-cell">
                                    <span className="tcd-rating-value" style={{ color: valueColor }}>
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
            <div className="tcd-comparison-cards">
              {selectedTeams.map((team) => (
                <div key={team.id} className="tcd-comparison-card">
                  <button
                    className="tcd-remove-button"
                    onClick={() => handleTeamSelect(team)}
                    aria-label="Remove team"
                  >
                    <FaTimes size={14} />
                  </button>
                  <div className="tcd-comparison-team-logo-container">
                    <img
                      src={team.logos?.[0] || "/photos/default_team.png"}
                      alt={team.school}
                      className="tcd-comparison-team-logo"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "/photos/default_team.png";
                      }}
                    />
                  </div>
                  <div className="tcd-comparison-info">
                    <h3>{team.school}</h3>
                    <p>{team.conference || "Independent"}</p>
                    <div className="tcd-comparison-metrics">
                      <div className="tcd-metric-item">
                        <span className="tcd-metric-label">
                          <FaMapMarkerAlt size={12} style={{ marginRight: "4px" }} />
                          Location
                        </span>
                        <span className="tcd-metric-value">
                          {team.location?.city}, {team.location?.state}
                        </span>
                      </div>
                      <div className="tcd-metric-item">
                        <span className="tcd-metric-label">
                          <FaTrophy size={12} style={{ marginRight: "4px" }} />
                          Division
                        </span>
                        <span className="tcd-metric-value">Division I</span>
                      </div>
                      <div className="tcd-metric-item">
                        <span className="tcd-metric-label">
                          <FaFootballBall size={12} style={{ marginRight: "4px" }} />
                          Mascot
                        </span>
                        <span className="tcd-metric-value">
                          {team.mascot || "N/A"}
                        </span>
                      </div>
                      <div className="tcd-metric-item">
                        <span className="tcd-metric-label">
                          <FaEye size={12} style={{ marginRight: "4px" }} />
                          Details
                        </span>
                        <Link to={`/teams/${team.id}`} className="tcd-view-details-link">
                          View Team
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Teams;
