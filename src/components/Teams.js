import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import teamsService from "../services/teamsService";
import graphqlTeamsService from "../services/graphqlTeamsService";
import newsService from "../services/newsService";
import "../styles/Teams.css";

// Import icons
import {
  FaChartLine,
  FaChartPie,
  FaChartBar,
  FaTable,
  FaPlus,
  FaMinus,
  FaTrashAlt,
  FaInfoCircle,
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
  ReferenceLine,
} from "recharts";

// Header images (assuming these are in your public/photos folder)
const footballImg = "/photos/football.avif";
const committeeImg = "/photos/committee.png";

// Loading spinner component
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
          repeatCount="indefinite"
        />
      </circle>
    </svg>
  </div>
);

// ChartTabs component for switching between chart types
const ChartTabs = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: "line", label: "Line", icon: <FaChartLine /> },
    { id: "radar", label: "Radar", icon: <FaChartPie /> },
    { id: "bar", label: "Bar", icon: <FaChartBar /> },
    { id: "table", label: "Table", icon: <FaTable /> },
  ];

  return (
    <div className="chart-tabs">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          className={`chart-tab ${activeTab === tab.id ? "active" : ""}`}
          onClick={() => setActiveTab(tab.id)}
        >
          {tab.icon} <span>{tab.label}</span>
        </button>
      ))}
    </div>
  );
};

const Teams = () => {
  // Basic data states
  const [teams, setTeams] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Comparison states
  const [selectedTeams, setSelectedTeams] = useState([]);
  const [teamRatings, setTeamRatings] = useState({});
  const [chartsLoaded, setChartsLoaded] = useState(false);
  const [activeChart, setActiveChart] = useState("line");

  // Sidebars data
  const [talent, setTalent] = useState([]);
  const [news, setNews] = useState([]);
  const [recruits, setRecruits] = useState([]);

  // Ref for comparison section animation
  const comparisonRef = useRef(null);

  // Fetch teams and sidebar data on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        // Fetch all teams
        const teamsData = await teamsService.getTeams();
        setTeams(teamsData);

        // Load previously selected teams from localStorage if any
        const savedTeams = localStorage.getItem("compareTeams");
        if (savedTeams) {
          const parsed = JSON.parse(savedTeams);
          const preSelected = teamsData.filter((team) =>
            parsed.some((t) => t.id === team.id)
          );
          setSelectedTeams(preSelected);
        }

        // Fetch team talent data
        try {
          const talentData = await teamsService.getTeamTalent();
          setTalent(talentData);
        } catch (err) {
          console.error("Error fetching talent data:", err);
        }

        // Fetch latest news
        try {
          const newsData = await newsService.fetchNews();
          setNews(newsData.articles ? newsData.articles.slice(0, 10) : []);
        } catch (err) {
          console.error("Error fetching news:", err);
        }

        // Fetch recruiting data
        try {
          const recruitsData = await teamsService.getAllRecruits();
          setRecruits(recruitsData);
        } catch (err) {
          console.error("Error fetching recruits data:", err);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  // Fetch ratings for selected teams
  useEffect(() => {
    const fetchRatings = async () => {
      const newRatings = { ...teamRatings };
      const currentYear = new Date().getFullYear();

      // Save selected teams to localStorage
      if (selectedTeams.length > 0) {
        localStorage.setItem("compareTeams", JSON.stringify(selectedTeams));
      } else {
        localStorage.removeItem("compareTeams");
      }

      for (const team of selectedTeams) {
        if (newRatings[team.id]) continue; // Already fetched

        try {
          const graphqlData = await graphqlTeamsService.getTeamDetailedRatings(
            team.school.trim(),
            currentYear
          );
          if (graphqlData) {
            newRatings[team.id] = {
              offense: { rating: graphqlData.spOffense != null ? parseFloat(graphqlData.spOffense) : 25 },
              defense: { rating: graphqlData.spDefense != null ? parseFloat(graphqlData.spDefense) : 25 },
              rating: graphqlData.spOverall != null ? parseFloat(graphqlData.spOverall) : 25,
            };
          } else {
            const apiData = await teamsService.getTeamRatings(team.school.trim(), currentYear);
            newRatings[team.id] = {
              offense: { rating: apiData?.offense?.rating || 25 },
              defense: { rating: apiData?.defense?.rating || 25 },
              rating: apiData?.rating || 25,
            };
          }
        } catch (err) {
          console.error("Error fetching ratings for", team.school, err);
          newRatings[team.id] = {
            offense: { rating: 25 },
            defense: { rating: 25 },
            rating: 25,
          };
        }
      }
      setTeamRatings(newRatings);
      setChartsLoaded(true);
    };

    if (selectedTeams.length > 0) {
      fetchRatings();
    } else {
      setChartsLoaded(false);
    }
  }, [selectedTeams]);

  // Handle multi-select dropdown changes for team comparison
  const handleComparisonSelect = (e) => {
    const options = e.target.options;
    const selected = [];
    for (let i = 0; i < options.length; i++) {
      if (options[i].selected) {
        const team = teams.find((t) => t.id === parseInt(options[i].value));
        if (team) selected.push(team);
      }
    }
    if (selected.length > 4) {
      alert("You can only compare up to 4 teams.");
      return;
    }
    setSelectedTeams(selected);
  };

  // Prepare chart data from selected teams and their ratings
  const METRICS = ["Offense", "Defense", "Overall"];
  const chartData = METRICS.map((metric) => {
    const row = { metric };
    selectedTeams.forEach((team) => {
      const data = teamRatings[team.id];
      if (data) {
        row[team.id] =
          metric === "Offense"
            ? data.offense.rating
            : metric === "Defense"
            ? data.defense.rating
            : data.rating;
      } else {
        row[team.id] = 0;
      }
    });
    return row;
  });

  // Animate comparison section on selection changes
  useEffect(() => {
    if (comparisonRef.current && selectedTeams.length > 0) {
      comparisonRef.current.style.opacity = "0";
      comparisonRef.current.style.transform = "translateY(20px)";
      setTimeout(() => {
        comparisonRef.current.style.opacity = "1";
        comparisonRef.current.style.transform = "translateY(0)";
        comparisonRef.current.style.transition =
          "opacity 0.6s ease-out, transform 0.6s ease-out";
      }, 100);
    }
  }, [selectedTeams, chartsLoaded]);

  if (isLoading) {
    return (
      <div className="loading-screen">
        <LoadingSpinner />
        <div>Loading teams information...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-screen">
        <FaInfoCircle size={40} />
        <div>{error}</div>
      </div>
    );
  }

  // Helper to get team abbreviation (first 3 letters)
  const getTeamAbbreviation = (school) => {
    return school ? school.substring(0, 3).toUpperCase() : "";
  };

  // Render header with images and slogan
  const renderHeader = () => (
    <div className="teams-header">
      <div className="header-images">
        <img src={footballImg} alt="Football" className="header-image" />
        <img src={committeeImg} alt="Committee" className="header-image" />
      </div>
      <h1 className="teams-title" style={{ color: "black" }}>
        NCAA The Heart of Saturday: This NCAA Football, where dreams are chased and rivalries are born.
      </h1>
    </div>
  );

  return (
    <div className="teams-container">
      {renderHeader()}
      <div className="teams-layout">
        {/* Left Sidebar: Team Talent & Recruiting */}
        <div className="left-sidebar">
          <div className="sidebar-section">
            <h2>Team Talent</h2>
            {talent.length > 0 ? (
              <ul>
                {talent.map((t, idx) => (
                  <li key={idx}>
                    {t.team}: {t.talent.toFixed(1)}
                  </li>
                ))}
              </ul>
            ) : (
              <p>No talent data available.</p>
            )}
          </div>
          <div className="sidebar-section">
            <h2>Recruiting</h2>
            {recruits.length > 0 ? (
              <ul>
                {recruits.slice(0, 5).map((r, idx) => (
                  <li key={idx}>
                    {r.name} - {r.rating}
                  </li>
                ))}
              </ul>
            ) : (
              <p>No recruiting data available.</p>
            )}
          </div>
        </div>

        {/* Main Content: Teams Table & Comparison Section */}
        <div className="main-content">
          <div className="teams-table-section">
            <h2>All Teams</h2>
            <table className="teams-table">
              <thead>
                <tr>
                  <th>Logo</th>
                  <th>School</th>
                  <th>Conference</th>
                  <th>Location</th>
                  <th>Mascot</th>
                </tr>
              </thead>
              <tbody>
                {teams.map((team) => (
                  <tr key={team.id}>
                    <td>
                      <img
                        src={team.logos?.[0] || "/photos/default_team.png"}
                        alt={team.school}
                        className="team-logo"
                      />
                    </td>
                    <td>{team.school}</td>
                    <td>{team.conference || "N/A"}</td>
                    <td>
                      {team.location
                        ? `${team.location.city}, ${team.location.state}`
                        : "N/A"}
                    </td>
                    <td>{team.mascot || "N/A"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Comparison Section */}
          <div className="comparison-section" ref={comparisonRef}>
            <h2>Team Comparison</h2>
            <div className="comparison-dropdown">
              <label htmlFor="team-select">
                Select up to 4 teams to compare:
              </label>
              <select
                id="team-select"
                multiple
                value={selectedTeams.map((t) => t.id)}
                onChange={handleComparisonSelect}
              >
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.school}
                  </option>
                ))}
              </select>
            </div>

            {selectedTeams.length === 0 ? (
              <div className="no-selection">
                <p>No teams selected for comparison.</p>
              </div>
            ) : (
              <>
                <button
                  className="clear-button"
                  onClick={() => setSelectedTeams([])}
                >
                  <FaTrashAlt /> Clear All
                </button>
                <ChartTabs activeTab={activeChart} setActiveTab={setActiveChart} />
                <div className="charts-container">
                  {!chartsLoaded ? (
                    <div className="loading-indicator">
                      <LoadingSpinner />
                      <p>Loading team ratings...</p>
                    </div>
                  ) : (
                    <>
                      {activeChart === "line" && (
                        <div className="chart-wrapper">
                          <ResponsiveContainer width="100%" height={350}>
                            <LineChart
                              data={chartData}
                              margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
                            >
                              <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                              <XAxis dataKey="metric" />
                              <YAxis domain={[0, 50]} />
                              <Tooltip />
                              <Legend />
                              <ReferenceLine y={25} stroke="#666" strokeDasharray="3 3" />
                              {selectedTeams.map((team) => (
                                <Line
                                  key={team.id}
                                  type="monotone"
                                  dataKey={team.id}
                                  stroke={team.color || "#666"}
                                  strokeWidth={3}
                                  dot
                                />
                              ))}
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      )}
                      {activeChart === "radar" && (
                        <div className="chart-wrapper">
                          <ResponsiveContainer width="100%" height={400}>
                            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={chartData}>
                              <PolarGrid />
                              <PolarAngleAxis dataKey="metric" />
                              <PolarRadiusAxis angle={30} domain={[0, 50]} />
                              {selectedTeams.map((team) => (
                                <Radar
                                  key={team.id}
                                  name={team.school}
                                  dataKey={team.id}
                                  stroke={team.color || "#666"}
                                  fill={team.color || "#666"}
                                  fillOpacity={0.6}
                                />
                              ))}
                              <Legend />
                              <Tooltip />
                            </RadarChart>
                          </ResponsiveContainer>
                        </div>
                      )}
                      {activeChart === "bar" && (
                        <div className="chart-wrapper">
                          <ResponsiveContainer width="100%" height={350}>
                            <BarChart
                              data={chartData}
                              margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
                            >
                              <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                              <XAxis dataKey="metric" />
                              <YAxis domain={[0, 50]} />
                              <Tooltip />
                              <Legend />
                              <ReferenceLine y={25} stroke="#666" strokeDasharray="3 3" />
                              {selectedTeams.map((team) => (
                                <Bar
                                  key={team.id}
                                  dataKey={team.id}
                                  fill={team.color || "#666"}
                                />
                              ))}
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      )}
                      {activeChart === "table" && (
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
                                  <td>{metric}</td>
                                  {selectedTeams.map((team) => {
                                    let value = teamRatings[team.id]
                                      ? metric === "Offense"
                                        ? teamRatings[team.id].offense.rating
                                        : metric === "Defense"
                                        ? teamRatings[team.id].defense.rating
                                        : teamRatings[team.id].rating
                                      : 25;
                                    return (
                                      <td key={team.id}>
                                        {typeof value === "number" ? value.toFixed(2) : "N/A"}
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
              </>
            )}
          </div>
        </div>

        {/* Right Sidebar: Latest News */}
        <div className="right-sidebar">
          <div className="sidebar-section">
            <h2>Latest News</h2>
            {news.length > 0 ? (
              <ul>
                {news.map((article, idx) => (
                  <li key={idx} onClick={() => window.open(article.url, "_blank")}>
                    {article.title}
                  </li>
                ))}
              </ul>
            ) : (
              <p>No news available.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Teams;
