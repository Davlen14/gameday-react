import React, { useState, useEffect } from "react";
import teamsService from "../services/teamsService"; // Make sure you have a getFcsTeams method

const More = () => {
  const [teams, setTeams] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch FCS teams on mount
  useEffect(() => {
    const fetchFcsTeams = async () => {
      try {
        // Assuming you have a getFcsTeams method that accepts an options object
        const teamsData = await teamsService.getFcsTeams({ year: 2024 });
        setTeams(teamsData);
      } catch (err) {
        setError("Failed to load FCS teams.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchFcsTeams();
  }, []);

  // Group teams by conference (if available)
  const groupByConference = (teams) => {
    return teams.reduce((acc, team) => {
      const conference = team.conference || "Independent";
      if (!acc[conference]) acc[conference] = [];
      acc[conference].push(team);
      return acc;
    }, {});
  };

  const groupedTeams = groupByConference(teams);

  if (isLoading) {
    return (
      <div className="fcs-loading">
        <p>Loading FCS teams...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fcs-error">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="fcs-container">
      <style>{`
        .fcs-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          color: #333;
        }
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
        .fcs-loading, .fcs-error {
          text-align: center;
          padding: 40px;
          font-size: 1.2rem;
        }
      `}</style>

      <h2 className="fcs-header">FCS Teams</h2>
      {Object.entries(groupedTeams).map(([conference, confTeams]) => (
        <div key={conference} className="conference-section">
          <div className="conference-header">
            <img
              // Try to load a conference-specific logo. If none exists, fallback to a default image.
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
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default More;