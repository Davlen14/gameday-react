import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import teamsService from "../services/teamsService";
import {
  FaPlus,
  FaMinus,
  FaInfoCircle,
  FaMapMarkerAlt,
  FaEye,
  FaSpinner
} from "react-icons/fa";

const More = () => {
  const [teams, setTeams] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTeams, setSelectedTeams] = useState([]);

  // List of FCS conferences in preferred order
  const fcsConferencesOrder = [
    "Big Sky Conference",
    "Big South Conference",
    "Colonial Athletic Association ",
    "Missouri Valley Football Conference",
    "Northeast Conference",
    "Ohio Valley Conference",
    "Patriot League",
    "Pioneer Football League",
    "Southern Conference",
    "Southland Conference",
    "United Athletic Conference "
  ];

  // Fetch FCS teams on mount
  useEffect(() => {
    const fetchFcsTeams = async () => {
      try {
        setIsLoading(true);
        const teamsData = await teamsService.getFCSTeams();
        setTeams(teamsData);
      } catch (err) {
        console.error("Error fetching FCS teams:", err);
        setError("Failed to load FCS teams...");
      } finally {
        setIsLoading(false);
      }
    };

    fetchFcsTeams();
  }, []);

  // Group teams by conference and sort according to predefined order
  const groupByConference = (teams) => {
    const grouped = teams.reduce((acc, team) => {
      const conference = team.conference || "Independent";
      if (!acc[conference]) acc[conference] = [];
      acc[conference].push(team);
      return acc;
    }, {});

    const sortedConferences = {};
    // First add conferences in our desired order
    fcsConferencesOrder.forEach((conf) => {
      if (grouped[conf]) {
        sortedConferences[conf] = grouped[conf].sort((a, b) =>
          a.school.localeCompare(b.school)
        );
      }
    });
    // Then add any remaining conferences that aren't in our list
    Object.keys(grouped).forEach((conf) => {
      if (!sortedConferences[conf]) {
        sortedConferences[conf] = grouped[conf].sort((a, b) =>
          a.school.localeCompare(b.school)
        );
      }
    });
    return sortedConferences;
  };

  // Handle adding or removing teams from the selected list
  const handleTeamSelect = (team) => {
    setSelectedTeams((prevSelected) => {
      // Remove if already selected
      if (prevSelected.find((t) => t.id === team.id)) {
        return prevSelected.filter((t) => t.id !== team.id);
      } else {
        // Limit to 4 teams for comparison
        if (prevSelected.length < 4) {
          return [...prevSelected, team];
        } else {
          alert("You can only compare up to 4 teams.");
          return prevSelected;
        }
      }
    });
  };

  // Render loading state
  if (isLoading) {
    return (
      <div className="fcs-loading">
        <FaSpinner className="fcs-spinner" />
        <p>Loading FCS teams...</p>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="fcs-error">
        <FaInfoCircle size={40} />
        <p>{error}</p>
      </div>
    );
  }

  const groupedTeams = groupByConference(teams);

  return (
    <div className="fcs-container">
      {/* Modern CSS for FCS teams page with custom color scheme */}
      <style>{`
        :root {
          --primary-color: #ffffff;
          --accent-color: #D4001C;
          --text-color: #333333;
          --background-color: #ffffff;
          --border-color: #dddddd;
        }
        
        .fcs-container {
          width: 100%;
          max-width: 100%;
          margin: 0 auto;
          padding: 2rem;
          font-family: 'Inter', 'Segoe UI', Tahoma, sans-serif;
          color: var(--text-color);
          background-color: var(--background-color);
        }
        
        .fcs-header {
          text-align: center;
          margin-bottom: 3rem;
          font-size: 2.5rem;
          font-weight: 700;
          color: var(--text-color);
          letter-spacing: -0.5px;
        }
        
        .fcs-conference-section {
          margin-bottom: 3.5rem;
          background: var(--primary-color);
          border-radius: 12px;
          padding: 2rem;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
          transition: transform 0.2s;
          border: 1px solid var(--border-color);
        }
        
        .fcs-conference-section:hover {
          transform: translateY(-3px);
        }
        
        .fcs-conference-header {
          display: flex;
          align-items: center;
          margin-bottom: 1.5rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid var(--border-color);
        }
        
        .fcs-conference-logo {
          width: 70px;
          height: 70px;
          margin-right: 1.5rem;
          object-fit: contain;
          padding: 0.5rem;
          filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1));
        }
        
        .fcs-conference-title {
          font-size: 1.8rem;
          font-weight: 700;
          margin: 0;
          color: var(--accent-color);
        }
        
        .fcs-teams-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
          gap: 1.5rem;
        }
        
        .fcs-team-card {
          background: var(--primary-color);
          border-radius: 10px;
          box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
          padding: 1.5rem 1rem;
          text-align: center;
          transition: all 0.3s ease;
          border: 1px solid var(--border-color);
          display: flex;
          flex-direction: column;
          height: 100%;
        }
        
        .fcs-team-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 12px 24px rgba(0, 0, 0, 0.1);
          border: 1px solid var(--accent-color);
        }
        
        .fcs-team-logo-container {
          width: 100%;
          height: 150px;
          display: flex;
          justify-content: center;
          align-items: center;
          margin-bottom: 1rem;
          position: relative;
        }
        
        .fcs-team-logo {
          max-width: 90%;
          max-height: 90%;
          object-fit: contain;
          filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.1));
          transition: transform 0.3s ease;
        }
        
        .fcs-team-card:hover .fcs-team-logo {
          transform: scale(1.05);
        }
        
        .fcs-team-name {
          font-size: 1.2rem;
          font-weight: 600;
          margin: 0 0 0.5rem;
          color: var(--text-color);
        }
        
        .fcs-select-button {
          background: var(--accent-color);
          border: none;
          color: white;
          padding: 0.5rem 1rem;
          border-radius: 6px;
          margin-top: 1rem;
          cursor: pointer;
          transition: all 0.3s ease;
          font-weight: 500;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          width: 100%;
        }
        
        .fcs-select-button:hover {
          background: #b3001a;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(212, 0, 28, 0.3);
        }
        
        .fcs-selected {
          background: #333333;
        }
        
        .fcs-selected:hover {
          background: #222222;
          box-shadow: 0 4px 12px rgba(51, 51, 51, 0.3);
        }
        
        .fcs-team-location {
          margin-top: 0.75rem;
          font-size: 0.9rem;
          color: #6b7280;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
        }
        
        .fcs-team-links {
          margin-top: 0.75rem;
          display: flex;
          justify-content: center;
        }
        
        .fcs-view-link {
          color: var(--accent-color);
          text-decoration: none;
          font-size: 0.9rem;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: all 0.2s ease;
          padding: 0.35rem 0.75rem;
          border-radius: 6px;
        }
        
        .fcs-view-link:hover {
          color: #b3001a;
          background: rgba(212, 0, 28, 0.1);
          transform: translateY(-2px);
        }
        
        .fcs-loading, 
        .fcs-error {
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          height: 60vh;
          text-align: center;
          color: var(--text-color);
          font-size: 1.2rem;
        }
        
        .fcs-error {
          color: var(--accent-color);
        }
        
        .fcs-spinner {
          animation: spin 1s linear infinite;
          font-size: 2rem;
          margin-bottom: 1rem;
          color: var(--accent-color);
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        /* Responsive adjustments to fill screen */
        @media (max-width: 1440px) {
          .fcs-teams-grid {
            grid-template-columns: repeat(auto-fill, minmax(170px, 1fr));
            gap: 1rem;
          }
        }
        
        @media (max-width: 1024px) {
          .fcs-teams-grid {
            grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
          }
        }
        
        @media (max-width: 768px) {
          .fcs-teams-grid {
            grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
            gap: 0.8rem;
          }
          
          .fcs-conference-section {
            padding: 1.5rem;
          }
          
          .fcs-team-logo-container {
            height: 120px;
          }
          
          .fcs-header {
            font-size: 2rem;
          }
        }
      `}</style>

      <h2 className="fcs-header">FCS Teams</h2>
      
      {Object.entries(groupedTeams).map(([conference, confTeams]) => (
        <div key={conference} className="fcs-conference-section">
          <div className="fcs-conference-header">
            <img
              src={`/photos/${conference.replace(/\s/g, "_")}.png`}
              alt={conference}
              className="fcs-conference-logo"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = "/photos/fcs.png";
              }}
            />
            <h3 className="fcs-conference-title">{conference}</h3>
          </div>
          
          <div className="fcs-teams-grid">
            {confTeams.map((team) => (
              <div key={team.id} className="fcs-team-card">
                <div className="fcs-team-logo-container">
                  <img
                    src={team.logos?.[0] || "/photos/default_team.png"}
                    alt={team.school}
                    className="fcs-team-logo"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "/photos/default_team.png";
                    }}
                  />
                </div>
                
                <p className="fcs-team-name">{team.school}</p>
                
                <div className="fcs-team-location">
                  <FaMapMarkerAlt size={12} />
                  {team.location?.city}, {team.location?.state}
                </div>
                
                <div className="fcs-team-links">
                  <Link to={`/teams/${team.id}`} className="fcs-view-link">
                    <FaEye size={14} /> View Team
                  </Link>
                </div>
                
                <button
                  className={`fcs-select-button ${
                    selectedTeams.find((t) => t.id === team.id) ? "fcs-selected" : ""
                  }`}
                  onClick={() => handleTeamSelect(team)}
                >
                  {selectedTeams.find((t) => t.id === team.id) ? (
                    <>
                      <FaMinus size={14} /> Remove
                    </>
                  ) : (
                    <>
                      <FaPlus size={14} /> Compare
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default More;