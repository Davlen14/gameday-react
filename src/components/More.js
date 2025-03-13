import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import teamsService from "../services/teamsService"; // Ensure you have a getFcsTeams method here
import {
  FaPlus,
  FaMinus,
  FaTrashAlt,
  FaInfoCircle,
  FaExchangeAlt,
  FaMapMarkerAlt,
  FaFootballBall,
  FaEye
} from "react-icons/fa";

const FcsTeams = () => {
  const [teams, setTeams] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTeams, setSelectedTeams] = useState([]);

  // List of FCS conferences in preferred order.
  const fcsConferencesOrder = [
    "Big Sky Conference",
    "Big South Conference",
    "Colonial Athletic Association (CAA)",
    "Missouri Valley Football Conference",
    "Northeast Conference (NEC)",
    "Ohio Valley Conference (OVC)",
    "Patriot League",
    "Pioneer Football League",
    "Southern Conference",
    "Southland Conference",
    "Southwestern Athletic Conference (SWAC)",
    "Mid-Eastern Athletic Conference (MEAC)",
    "United Athletic Conference (UAC, formerly ASUN/WAC)"
  ];

  // Fetch FCS teams on mount.
  useEffect(() => {
    const fetchFcsTeams = async () => {
      try {
        setIsLoading(true);
        // Assumes teamsService.getFcsTeams returns a promise resolving to your FCS teams data.
        const teamsData = await teamsService.getFcsTeams({ year: 2024 });
        setTeams(teamsData);
      } catch (err) {
        setError("Failed to load FCS teams...");
      } finally {
        setIsLoading(false);
      }
    };

    fetchFcsTeams();
  }, []);

  // Group teams by conference and sort according to our predefined order.
  const groupByConference = (teams) => {
    const grouped = teams.reduce((acc, team) => {
      const conference = team.conference || "Independent";
      if (!acc[conference]) acc[conference] = [];
      acc[conference].push(team);
      return acc;
    }, {});

    const sortedConferences = {};
    // First add conferences in our desired order.
    fcsConferencesOrder.forEach((conf) => {
      if (grouped[conf]) {
        sortedConferences[conf] = grouped[conf].sort((a, b) =>
          a.school.localeCompare(b.school)
        );
      }
    });
    // Then add any remaining conferences that aren’t in our list.
    Object.keys(grouped).forEach((conf) => {
      if (!sortedConferences[conf]) {
        sortedConferences[conf] = grouped[conf].sort((a, b) =>
          a.school.localeCompare(b.school)
        );
      }
    });
    return sortedConferences;
  };

  // Handle adding or removing teams from the selected list.
  const handleTeamSelect = (team) => {
    setSelectedTeams((prevSelected) => {
      // Remove if already selected.
      if (prevSelected.find((t) => t.id === team.id)) {
        return prevSelected.filter((t) => t.id !== team.id);
      } else {
        // Limit to 4 teams for comparison.
        if (prevSelected.length < 4) {
          return [...prevSelected, team];
        } else {
          alert("You can only compare up to 4 teams.");
          return prevSelected;
        }
      }
    });
  };

  // Render error or loading states.
  if (isLoading) {
    return (
      <div style={styles.loadingScreen}>
        <p>Loading FCS teams...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.errorScreen}>
        <FaInfoCircle size={40} />
        <p>{error}</p>
      </div>
    );
  }

  const groupedTeams = groupByConference(teams);

  return (
    <div style={styles.container}>
      <style>{`
        /* Inline CSS for FCS teams page */
        .fcs-header {
          text-align: center;
          margin-bottom: 40px;
          font-size: 2rem;
          font-weight: 600;
        }
        .conference-section {
          margin-bottom: 40px;
        }
        .conference-header {
          display: flex;
          align-items: center;
          margin-bottom: 20px;
        }
        .conference-logo {
          width: 50px;
          height: 50px;
          margin-right: 10px;
          object-fit: contain;
        }
        .conference-title {
          font-size: 1.5rem;
          font-weight: bold;
          margin: 0;
        }
        .teams-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
          gap: 20px;
        }
        .team-card {
          background: #fff;
          border: 1px solid #eaeaea;
          border-radius: 10px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          padding: 15px;
          text-align: center;
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        .team-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 4px 8px rgba(0,0,0,0.15);
        }
        .team-logo-container {
          width: 100%;
          height: 100px;
          display: flex;
          justify-content: center;
          align-items: center;
          margin-bottom: 10px;
        }
        .team-logo {
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
        }
        .team-name {
          font-size: 1rem;
          font-weight: 600;
          margin: 0;
          color: #444;
        }
        .select-button {
          background: #007BFF;
          border: none;
          color: #fff;
          padding: 6px 12px;
          border-radius: 4px;
          margin-top: 8px;
          cursor: pointer;
          transition: background 0.3s ease;
        }
        .select-button:hover {
          background: #0056b3;
        }
        .selected {
          background: #dc3545;
        }
      `}</style>

      <h2 className="fcs-header">FCS Teams</h2>
      {Object.entries(groupedTeams).map(([conference, confTeams]) => (
        <div key={conference} className="conference-section">
          <div className="conference-header">
            <img
              // Try to load a conference-specific logo. Replace spaces with underscores.
              src={`/photos/${conference.replace(/\s/g, "_")}.png`}
              alt={conference}
              className="conference-logo"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = "/photos/default_conference.png";
              }}
            />
            <h3 className="conference-title">{conference}</h3>
          </div>
          <div className="teams-grid">
            {confTeams.map((team) => (
              <div key={team.id} className="team-card">
                <div className="team-logo-container">
                  <img
                    src={team.logos?.[0] || "/photos/default_team.png"}
                    alt={team.school}
                    className="team-logo"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "/photos/default_team.png";
                    }}
                  />
                </div>
                <p className="team-name">{team.school}</p>
                <button
                  className={`select-button ${
                    selectedTeams.find((t) => t.id === team.id) ? "selected" : ""
                  }`}
                  onClick={() => handleTeamSelect(team)}
                >
                  {selectedTeams.find((t) => t.id === team.id)
                    ? (
                      <>
                        <FaMinus size={12} /> Remove
                      </>
                    )
                    : (
                      <>
                        <FaPlus size={12} /> Compare
                      </>
                    )}
                </button>
                <div style={{ marginTop: "8px" }}>
                  <FaMapMarkerAlt size={12} />{" "}
                  {team.location?.city}, {team.location?.state}
                </div>
                <div style={{ marginTop: "4px" }}>
                  <Link to={`/teams/${team.id}`} style={{ color: "#007BFF", textDecoration: "none" }}>
                    <FaEye size={12} /> View Team
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

// Inline styles for basic layout (you can extend these if needed)
const styles = {
  container: {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "20px",
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    color: "#333"
  },
  loadingScreen: {
    textAlign: "center",
    padding: "40px",
    fontSize: "1.2rem"
  },
  errorScreen: {
    textAlign: "center",
    padding: "40px",
    fontSize: "1.2rem",
    color: "red"
  }
};

export default FcsTeams;