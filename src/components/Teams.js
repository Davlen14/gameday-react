import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import teamsService from "../services/teamsService";
import "../styles/Teams.css"; // Use our modernized CSS

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
  FaTimes

} from 'react-icons/fa';

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
  <div className="loading-spinner">
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
    { id: 'line', label: 'Line', icon: <FaChartLine /> },
    { id: 'radar', label: 'Radar', icon: <FaChartPie /> },
    { id: 'bar', label: 'Bar', icon: <FaChartBar /> },
    { id: 'table', label: 'Table', icon: <FaTable /> }
  ];
  
  return (
    <div className="chart-tabs">
      {tabs.map(tab => (
        <button 
          key={tab.id}
          className={`chart-tab ${activeTab === tab.id ? 'active' : ''}`}
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
  const [teams, setTeams] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Store the teams selected for comparison
  const [selectedTeams, setSelectedTeams] = useState([]);

  // We'll store each selected team's ratings here.
  // Shape: { [team.school]: { offense, defense, overall } }
  const [teamRatings, setTeamRatings] = useState({});
  
  // Chart state
  const [activeChart, setActiveChart] = useState('line');
  
  // Animation refs
  const comparisonRef = useRef(null);
  
  // Track if charts are loaded
  const [chartsLoaded, setChartsLoaded] = useState(false);

  // Conference order based on popularity
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
  const groupByConference = (teams) => {
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

  // Conference logo mapping
  const conferenceLogos = {
    "ACC": "/photos/ACC.png",
    "American Athletic": "/photos/American Athletic.png",
    "Big 12": "/photos/Big 12.png",
    "Big Ten": "/photos/Big Ten.png",
    "Conference USA": "/photos/Conference USA.png",
    "FBS Independents": "/photos/FBS Independents.png",
    "Mid-American": "/photos/Mid-American.png",
    "Mountain West": "/photos/Mountain West.png",
    "Pac-12": "/photos/Pac-12.png",
    "SEC": "/photos/SEC.png",
    "Independent": "/photos/FBS Independents.png"
  };

  // Fetch all teams on mount
  useEffect(() => {
    const fetchTeams = async () => {
      try {
        setIsLoading(true);
        const teamsData = await teamsService.getTeams();
        setTeams(teamsData);
        
        // Check if there are teams in localStorage to compare
        const savedTeams = localStorage.getItem('compareTeams');
        if (savedTeams) {
          const parsedTeams = JSON.parse(savedTeams);
          // Find the actual team objects from the fetched data
          const teamsToCompare = parsedTeams
            .map(savedTeam => teamsData.find(team => team.id === savedTeam.id))
            .filter(Boolean); // Remove any undefined values
          
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

  // Whenever the user selects (or deselects) teams, fetch their ratings.
  useEffect(() => {
    const fetchSelectedTeamsRatings = async () => {
      const newRatings = { ...teamRatings };
      
      // Save the selected teams to localStorage
      if (selectedTeams.length > 0) {
        localStorage.setItem('compareTeams', JSON.stringify(selectedTeams));
      } else {
        localStorage.removeItem('compareTeams');
      }
      
      for (const team of selectedTeams) {
        try {
          if (newRatings[team.school]) continue; // Skip already fetched ratings
          
          // Fetch ratings using team.school and 2024 as parameters
          const data = await teamsService.getTeamRatings(team.school, 2024);
          newRatings[team.school] = data;
        } catch (err) {
          console.error(`Error fetching ratings for team ${team.school}:`, err);
          newRatings[team.school] = { 
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

  if (isLoading) return (
    <div className="loading-screen">
      <LoadingSpinner />
      <div>Loading teams information...</div>
    </div>
  );
  
  if (error) return (
    <div className="error-screen">
      <FaInfoCircle size={40} />
      <div>{error}</div>
    </div>
  );

  const groupedTeams = groupByConference(teams);

  // Handle adding/removing teams from comparison
  const handleTeamSelect = (team) => {
    setSelectedTeams((prevSelected) => {
      if (prevSelected.find((t) => t.id === team.id)) {
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
    setChartsLoaded(false);
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
    return `gradient-${teamColor.replace('#', '')}`;
  };

  // Helper to lighten a color for gradient effect
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

  // Build data for chart comparison
  // We'll compare 3 metrics: Offense, Defense, Overall.
  const METRICS = ["Offense", "Defense", "Overall"];
  const METRIC_ICONS = {
    "Overall": <FaFootballBall />,
    "Offense": <FaRunning />,
    "Defense": <FaShieldAlt />
  };
  
  const chartData = METRICS.map((metric) => {
    const row = { metric };
    selectedTeams.forEach((team) => {
      const r = teamRatings[team.school];
      
      // Handle the nested structure for offense and defense ratings
      if (metric === "Offense" || metric === "Defense") {
        row[team.school] = r ? (r[metric.toLowerCase()]?.rating || 0) : 0;
      } else {
        row[team.school] = r ? (r.rating || 0) : 0;
      }
    });
    return row;
  });

  // Custom Legend for the charts
  const renderCustomLegend = (props) => {
    const { payload } = props;
    return (
      <div className="custom-legend">
        {payload.map((entry) => {
          const teamSchool = entry.dataKey;
          const team = selectedTeams.find((t) => t.school === teamSchool);
          if (!team) return null;
          return (
            <div key={teamSchool} className="legend-item">
              <div
                className="legend-color"
                style={{ backgroundColor: entry.color }}
              />
              <img
                src={team.logos?.[0] || "/photos/default_team.png"}
                alt={team.school}
                className="legend-logo"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "/photos/default_team.png";
                }}
              />
              <span className="legend-name">{getTeamAbbreviation(team.school)}</span>
            </div>
          );
        })}
      </div>
    );
  };
  
  // Custom Tooltip for charts
  const renderCustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip">
          <p className="tooltip-metric">
            {METRIC_ICONS[label]} {label}
          </p>
          <div className="tooltip-items">
            {payload.map((entry, index) => {
              const team = selectedTeams.find(t => t.school === entry.dataKey);
              if (!team) return null;
              return (
                <div key={index} className="tooltip-item">
                  <img 
                    src={team.logos?.[0] || "/photos/default_team.png"} 
                    alt={team.school}
                    className="tooltip-logo"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "/photos/default_team.png";
                    }}
                  />
                  <span style={{ color: entry.color }}>{team.school}:</span>
                  <span className="tooltip-value">{entry.value.toFixed(2)}</span>
                </div>
              );
            })}
          </div>
        </div>
      );
    }
  
    return null;
  };

  return (
    <div className="teams-comparison-container">
      {/* Left Column: Teams List */}
      <div className="teams-list-section">
        <div className="teams-container">
          <div className="conferences-list">
            {Object.entries(groupedTeams).map(([conference, teams]) => (
              <div key={conference} className="conference-section">
                <div className="conference-header">
                  <div className="conference-logo-container">
                    <img
                      src={conferenceLogos[conference]}
                      alt={conference}
                      className="conference-logo"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "/photos/default_conference.png";
                      }}
                    />
                  </div>
                  <h3 className="conference-title">{conference}</h3>
                </div>
                <div className="teams-table">
                  {teams.map((team) => (
                    <div key={team.id} className="team-card-container">
                      <div className="team-card">
                        <div className="team-content">
                          <div className="team-logo-container">
                            <Link to={`/teams/${team.id}`}>
                              <img
                                src={team.logos?.[0] || "/photos/default_team.png"}
                                alt={team.school}
                                className="team-logo"
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = "/photos/default_team.png";
                                }}
                              />
                            </Link>
                          </div>
                          <h4 className="team-name">{getTeamAbbreviation(team.school)}</h4>
                        </div>
                        <button
                          className={`compare-button ${selectedTeams.find((t) => t.id === team.id) ? 'selected' : ''}`}
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

      {/* Right Column: Comparison Panel */}
      <div className="comparison-section" ref={comparisonRef}>
        <h2>
          <FaExchangeAlt style={{ marginRight: "10px" }} />
          Team Comparison
        </h2>
        
        {selectedTeams.length === 0 ? (
          <div className="no-teams-selected">
            <div className="empty-state-icon">
              <FaExchangeAlt size={40} />
            </div>
            <p>No teams selected. Click "Compare" on teams to add them for comparison.</p>
            <p className="help-text">You can compare up to 4 teams at once.</p>
          </div>
        ) : (
          <>
            <button onClick={clearComparison} className="clear-button">
              <FaTrashAlt /> Clear All
            </button>

            {/* Chart Selection Tabs */}
            <ChartTabs activeTab={activeChart} setActiveTab={setActiveChart} />
            
            {/* Define gradients for chart elements */}
            <svg style={{ width: 0, height: 0, position: 'absolute' }} aria-hidden="true" focusable="false">
              <defs>
                {selectedTeams.map((team) => {
                  const baseColor = team.color || "#666";
                  const lightColor = lightenColor(baseColor, 30);
                  return (
                    <linearGradient key={team.id} id={getGradientId(team.color || "#666")} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={lightColor} stopOpacity={0.8}/>
                      <stop offset="95%" stopColor={baseColor} stopOpacity={0.8}/>
                    </linearGradient>
                  );
                })}
              </defs>
            </svg>
            
            {/* Charts Content - Conditional Rendering */}
            <div className="charts-container">
              {!chartsLoaded ? (
                <div className="loading-indicator">
                  <LoadingSpinner />
                  <p>Loading team ratings...</p>
                </div>
              ) : (
                <>
                  {/* Line Chart */}
                  {activeChart === 'line' && (
                    <div className="chart-wrapper">
                      <ResponsiveContainer width="100%" height={350}>
                        <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 10 }}>
                          <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                          <XAxis 
                            dataKey="metric" 
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#666', fontSize: 14 }}
                          />
                          <YAxis 
                            domain={[0, 50]} 
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#666', fontSize: 12 }}
                          />
                          <Tooltip content={renderCustomTooltip} />
                          <Legend content={renderCustomLegend} />
                          <ReferenceLine y={25} stroke="#666" strokeDasharray="3 3" strokeOpacity={0.5} />
                          {selectedTeams.map((team) => (
                            <Line
                              key={team.school}
                              type="monotone"
                              dataKey={team.school}
                              stroke={team.color || "#666"}
                              strokeWidth={3}
                              dot={{ 
                                stroke: team.color || "#666", 
                                strokeWidth: 2, 
                                r: 6,
                                fill: "#fff"
                              }}
                              activeDot={{ 
                                r: 8, 
                                stroke: team.color || "#666",
                                strokeWidth: 2,
                                fill: "#fff"
                              }}
                            />
                          ))}
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                  
                  {/* Radar Chart */}
                  {activeChart === 'radar' && (
                    <div className="chart-wrapper">
                      <ResponsiveContainer width="100%" height={400}>
                        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={chartData}>
                          <PolarGrid gridType="polygon" stroke="#ddd" />
                          <PolarAngleAxis 
                            dataKey="metric" 
                            tick={{ fill: '#666', fontSize: 14 }}
                            axisLine={{ stroke: '#ddd' }}
                          />
                          <PolarRadiusAxis 
                            angle={30} 
                            domain={[0, 50]} 
                            axisLine={false}
                            tick={{ fill: '#666', fontSize: 12 }}
                          />
                          {selectedTeams.map((team) => (
                            <Radar
                              key={team.school}
                              name={team.school}
                              dataKey={team.school}
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
                  {activeChart === 'bar' && (
                    <div className="chart-wrapper">
                      <ResponsiveContainer width="100%" height={350}>
                        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 10 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.2} />
                          <XAxis 
                            dataKey="metric" 
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#666', fontSize: 14 }}
                          />
                          <YAxis 
                            domain={[0, 50]} 
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#666', fontSize: 12 }}
                          />
                          <Tooltip content={renderCustomTooltip} />
                          <Legend content={renderCustomLegend} />
                          <ReferenceLine y={25} stroke="#666" strokeDasharray="3 3" label="Avg" />
                          {selectedTeams.map((team, index) => (
                            <Bar
                              key={team.school}
                              dataKey={team.school}
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
                  {activeChart === 'table' && (
                    <div className="ratings-table-container">
                      <table className="ratings-table">
                        <thead>
                          <tr>
                            <th>Metric</th>
                            {selectedTeams.map((team) => (
                              <th key={team.id}>
                                <div className="table-team-header">
                                  <img 
                                    src={team.logos?.[0] || "/photos/default_team.png"} 
                                    alt={team.school}
                                    className="table-team-logo"
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
                              <td className="metric-cell">
                                <span className="metric-icon">{METRIC_ICONS[metric]}</span>
                                {metric}
                              </td>
                              {selectedTeams.map((team) => {
                                let value = "N/A";
                                if (teamRatings[team.school]) {
                                  if (metric === "Offense" || metric === "Defense") {
                                    value = teamRatings[team.school][metric.toLowerCase()]?.rating || "N/A";
                                  } else {
                                    value = teamRatings[team.school].rating || "N/A";
                                  }
                                }
                                
                                // Determine color based on value
                                let valueColor = "#666";
                                if (typeof value === 'number') {
                                  if (value > 30) valueColor = "#04aa6d";
                                  else if (value < 20) valueColor = "#ff4d4d";
                                  else valueColor = "#ffc700";
                                }
                                
                                return (
                                  <td key={team.id} className="value-cell">
                                    {typeof value === 'number' ? (
                                      <span className="rating-value" style={{ color: valueColor }}>
                                        {value.toFixed(2)}
                                      </span>
                                    ) : value}
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
            <div className="comparison-cards">
              {selectedTeams.map((team) => (
                <div key={team.id} className="comparison-card">
                  <button 
                    className="remove-button" 
                    onClick={() => handleTeamSelect(team)}
                    aria-label="Remove team"
                  >
                    <FaTimes size={14} />
                  </button>
                  
                  <div className="comparison-team-logo-container">
                    <img
                      src={team.logos?.[0] || "/photos/default_team.png"}
                      alt={team.school}
                      className="comparison-team-logo"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "/photos/default_team.png";
                      }}
                    />
                  </div>
                  
                  <div className="comparison-info">
                    <h3>{team.school}</h3>
                    <p>{team.conference || "Independent"}</p>
                    
                    <div className="comparison-metrics">
                      <div className="metric-item">
                        <span className="metric-label">
                          <FaMapMarkerAlt size={12} style={{ marginRight: "4px" }} />
                          Location
                        </span>
                        <span className="metric-value">
                          {team.location?.city}, {team.location?.state}
                        </span>
                      </div>
                      
                      <div className="metric-item">
                        <span className="metric-label">
                          <FaTrophy size={12} style={{ marginRight: "4px" }} />
                          Division
                        </span>
                        <span className="metric-value">
                          Division I
                        </span>
                      </div>
                      
                      <div className="metric-item">
                        <span className="metric-label">
                          <FaFootballBall size={12} style={{ marginRight: "4px" }} />
                          Mascot
                        </span>
                        <span className="metric-value">
                          {team.mascot || "N/A"}
                        </span>
                      </div>
                      
                      <div className="metric-item">
                        <span className="metric-label">
                          <FaEye size={12} style={{ marginRight: "4px" }} />
                          Details
                        </span>
                        <Link to={`/teams/${team.id}`} className="view-details-link">
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