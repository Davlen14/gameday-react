import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import teamsService from "../services/teamsService";
import "../styles/Teams.css"; // Import the new CSS file

// Import D3.js for data visualization
import * as d3 from "d3";

// Conference logo mapping
const conferenceLogos = {
  "ACC": "ACC.png",
  "American Athletic": "American Athletic.png",
  "Big 12": "Big 12.png",
  "Big Ten": "Big Ten.png",
  "Conference USA": "Conference USA.png",
  "FBS Independents": "FBS Independents.png",
  "Mid-American": "Mid-American.png",
  "Mountain West": "Mountain West.png",
  "Pac-12": "Pac-12.png",
  "SEC": "SEC.png",
};

const Teams = () => {
  const [teams, setTeams] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTeams, setSelectedTeams] = useState([]);
  const [teamRatings, setTeamRatings] = useState({});

  const conferenceOrder = [
    "Big Ten", "SEC", "ACC", "Big 12", "Pac-12", "American Athletic", "Mountain West",
    "Conference USA", "Mid-American", "FBS Independents"
  ];

  // Group teams by conference and sort by popularity
  const groupByConference = (teams) => {
    const grouped = teams.reduce((acc, team) => {
      const conference = team.conference;
      if (!acc[conference]) acc[conference] = [];
      acc[conference].push(team);
      return acc;
    }, {});

    const sortedConferences = {};
    conferenceOrder.forEach((conference) => {
      if (grouped[conference]) {
        sortedConferences[conference] = grouped[conference];
      }
    });

    return sortedConferences;
  };

  // Fetch all teams on mount
  useEffect(() => {
    const fetchTeams = async () => {
      try {
        setIsLoading(true);
        const teamsData = await teamsService.getTeams();
        setTeams(teamsData);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchTeams();
  }, []);

  // Fetch selected team ratings
  useEffect(() => {
    const fetchSelectedTeamsRatings = async () => {
      const newRatings = { ...teamRatings };
      for (const team of selectedTeams) {
        try {
          const data = await teamsService.getTeamRatings(team.school, 2024);
          newRatings[team.school] = data;
        } catch (err) {
          console.error(`Error fetching ratings for team ${team.school}:`, err);
          newRatings[team.school] = { offense: 1, defense: 1, overall: 1 };
        }
      }
      setTeamRatings(newRatings);
    };

    if (selectedTeams.length > 0) {
      fetchSelectedTeamsRatings();
    }
  }, [selectedTeams]);

  if (isLoading) return <div className="loading">Loading teams...</div>;
  if (error) return <div className="error">Error: {error}</div>;

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
  };

  // ------------------------------
  // BUILD THE COMPARISON CHART DATA
  // ------------------------------
  const METRICS = ["Offense", "Defense", "Overall"];
  const chartData = METRICS.map((metric) => {
    const row = { metric };
    selectedTeams.forEach((team) => {
      const r = teamRatings[team.school];
      row[team.school] = r ? r[metric.toLowerCase()] || 0 : 0;
    });
    return row;
  });

  const renderBarChart = () => {
    const svgWidth = 800;
    const svgHeight = 400;
    const margin = { top: 20, right: 30, bottom: 40, left: 40 };

    const x = d3.scaleBand()
      .domain(selectedTeams.map((team) => team.school))
      .range([margin.left, svgWidth - margin.right])
      .padding(0.1);

    const y = d3.scaleLinear()
      .domain([0, d3.max(chartData, (d) => d3.max(METRICS, (metric) => d[metric]))])
      .nice()
      .range([svgHeight - margin.bottom, margin.top]);

    const svg = d3.select("#bar-chart")
      .attr("width", svgWidth)
      .attr("height", svgHeight);

    svg.selectAll("*").remove(); // Clear previous content

    svg.append("g")
      .selectAll(".bar")
      .data(chartData)
      .enter()
      .append("rect")
      .attr("class", "bar")
      .attr("x", (d) => x(d.metric))
      .attr("y", (d) => y(d3.max(METRICS, (metric) => d[metric]))) // Dynamic positioning
      .attr("width", x.bandwidth())
      .attr("height", (d) => svgHeight - margin.bottom - y(d3.max(METRICS, (metric) => d[metric])))
      .style("fill", "#00D2D5");

    svg.append("g")
      .selectAll(".axis")
      .data([x, y])
      .enter()
      .append("g")
      .each(function (d) {
        d.select(this);
      });
  };

  useEffect(() => {
    if (selectedTeams.length > 0) {
      renderBarChart();
    }
  }, [selectedTeams]);

  return (
    <div className="teams-comparison-container">
      {/* Left Column: Teams */}
      <div className="teams-list-section">
        <div className="teams-container">
          <div className="conferences-list">
            {Object.entries(groupedTeams).map(([conference, teams]) => (
              <section key={conference} className="conference-section">
                <div className="conference-header">
                  <img
                    src={`/photos/${conferenceLogos[conference]}`}
                    alt={conference}
                    className="conference-logo"
                    onError={(e) => {
                      e.target.style.display = "none";
                    }}
                  />
                  <h2 className="conference-title">{conference}</h2>
                </div>

                <div className="teams-table">
                  {teams.map((team) => (
                    <div key={team.id} className="team-card-container">
                      <div className="team-card">
                        <div className="team-content">
                          <Link to={`/teams/${team.id}`}>
                            <img
                              src={team.logos?.[0] || "/photos/default-team.png"}
                              alt={team.school}
                              className="team-logo"
                            />
                          </Link>
                          <span className="team-name">{getTeamAbbreviation(team.school)}</span>
                        </div>
                      </div>
                      <button
                        className="compare-button"
                        onClick={() => handleTeamSelect(team)}
                      >
                        {selectedTeams.find((t) => t.id === team.id)
                          ? "Remove"
                          : "Compare"}
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>
      </div>

      {/* Right Column: Comparison Panel */}
      <div className="comparison-section">
        <h2>Team Comparison</h2>
        {selectedTeams.length === 0 && (
          <p>No teams selected. Click "Compare" on a team to add it.</p>
        )}

        {selectedTeams.length > 0 && (
          <>
            <button onClick={clearComparison} className="clear-button">
              Clear All
            </button>

            {/* Bar chart comparing selected teams on Offense/Defense/Overall */}
            <div id="bar-chart" style={{ width: "100%", height: 400 }}></div>

            {/* Comparison Cards */}
            <div className="comparison-table">
              {selectedTeams.map((team) => (
                <div key={team.id} className="comparison-card">
                  <img
                    src={team.logos?.[0] || "/photos/default-team.png"}
                    alt={team.school}
                    className="comparison-team-logo"
                  />
                  <div className="comparison-info">
                    <h3>{team.school}</h3>
                    <p>Conference: {team.conference}</p>
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
