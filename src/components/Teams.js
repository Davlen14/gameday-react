import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import teamsService from "../services/teamsService";
import "../styles/Teams.css"; // Import the new CSS file

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
} from "recharts";

const Teams = () => {
  const [teams, setTeams] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Store the teams selected for comparison
  const [selectedTeams, setSelectedTeams] = useState([]);

  // We'll store each selected team's ratings here
  // Shape: { [team.school]: { offense, defense, overall, ... } }
  const [teamRatings, setTeamRatings] = useState({});

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
    "FBS Independents",
  ];

  // Group teams by conference and sort by popularity
  const groupByConference = (teams) => {
    const grouped = teams.reduce((acc, team) => {
      const conference = team.conference;
      if (!acc[conference]) acc[conference] = [];
      acc[conference].push(team);
      return acc;
    }, {});

    // Sort conferences based on the predefined order
    const sortedConferences = {};
    conferenceOrder.forEach((conference) => {
      if (grouped[conference]) {
        sortedConferences[conference] = grouped[conference];
      }
    });

    // Add any remaining conferences that were not in the predefined order
    Object.keys(grouped).forEach((conference) => {
      if (!sortedConferences[conference]) {
        sortedConferences[conference] = grouped[conference];
      }
    });

    return sortedConferences;
  };

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

  // Whenever the user selects (or deselects) teams, fetch their ratings.
  useEffect(() => {
    const fetchSelectedTeamsRatings = async () => {
      const newRatings = { ...teamRatings };

      for (const team of selectedTeams) {
        try {
          // Fetch ratings using team.school and 2024 as parameters
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

  // Helper to get team abbreviation
  const getTeamAbbreviation = (teamName) => {
    const team = teams.find(
      (t) => t.school.toLowerCase() === teamName?.toLowerCase()
    );
    return team?.abbreviation || teamName;
  };

  // ------------------------------
  // BUILD THE COMPARISON CHART DATA
  // ------------------------------
  // We'll compare 3 metrics: Offense, Defense, Overall.
  // Each row in chartData represents one metric.
  const METRICS = ["Offense", "Defense", "Overall"];
  const chartData = METRICS.map((metric) => {
    const row = { metric };
    selectedTeams.forEach((team) => {
      const r = teamRatings[team.school];
      row[team.school] = r ? r[metric.toLowerCase()] || 0 : 0;
    });
    return row;
  });

  // Custom Legend to show each team's logo and name
  const renderCustomLegend = (props) => {
    const { payload } = props;
    return (
      <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
        {payload.map((entry) => {
          const teamSchool = entry.dataKey;
          const team = selectedTeams.find((t) => t.school === teamSchool);
          if (!team) return null;
          return (
            <div key={teamSchool} style={{ display: "flex", alignItems: "center" }}>
              <div
                style={{
                  width: 16,
                  height: 16,
                  backgroundColor: entry.color,
                  marginRight: 6,
                }}
              />
              <img
                src={team.logos?.[0] || "/photos/default-team.png"}
                alt={team.school}
                style={{
                  width: 20,
                  height: 20,
                  marginRight: 6,
                  objectFit: "contain",
                }}
              />
              <span>{team.school}</span>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="teams-comparison-container">
      {/* Left Column: Teams (modern sidebar) */}
      <div className="teams-list-section modern-sidebar">
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

                {/* Teams in a "table" layout */}
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
                          <span className="team-name">
                            {getTeamAbbreviation(team.school)}
                          </span>
                        </div>
                      </div>
                      {/* Compare Button */}
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

      {/* Right Column: Comparison Panel (unchanged) */}
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

            {/* Chart comparing selected teams on Offense/Defense/Overall */}
            <div style={{ width: "100%", height: 300, marginBottom: "1rem" }}>
              <ResponsiveContainer>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="metric" />
                  <YAxis domain={[0, 50]} />
                  <Tooltip />
                  <Legend content={renderCustomLegend} />
                  {selectedTeams.map((team) => (
                    <Line
                      key={team.school}
                      type="monotone"
                      dataKey={team.school}
                      stroke={team.color || "#000"}
                      strokeWidth={2}
                      activeDot={{ r: 6 }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>

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
