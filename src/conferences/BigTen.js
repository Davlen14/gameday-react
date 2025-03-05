import React, { useState, useEffect } from "react";
import teamsService from "../services/teamsService";
import "../styles/BigTen.css";

// US Map coordinates mapping - these help position logos based on lat/long
const MAP_WIDTH = 900;
const MAP_HEIGHT = 500;
const MAP_OFFSET_X = -66.94; // Eastern-most longitude
const MAP_OFFSET_Y = 49.38;  // Northern-most latitude
const MAP_SCALE_X = 1.8;
const MAP_SCALE_Y = 1.3;

const BigTen = () => {
  const [teams, setTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        setLoading(true);
        // Fetch all teams from API
        const teamsData = await teamsService.getTeams();
        
        // Filter for Big Ten teams only
        const bigTenTeams = teamsData.filter(team => 
          team.conference === "Big Ten"
        );
        
        setTeams(bigTenTeams);
      } catch (err) {
        console.error("Error fetching Big Ten teams:", err);
        setError("Failed to load team data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchTeams();
  }, []);

  const handleTeamClick = (team) => {
    setSelectedTeam(team);
  };

  const closeTeamInfo = () => {
    setSelectedTeam(null);
  };

  // Convert latitude/longitude to x,y coordinates on map
  const getMapCoordinates = (latitude, longitude) => {
    // Calculate x position (longitude)
    const x = ((longitude - MAP_OFFSET_X) * MAP_SCALE_X);
    
    // Calculate y position (latitude)
    const y = MAP_HEIGHT - ((latitude - 24.5) * MAP_SCALE_Y);
    
    return { x, y };
  };

  return (
    <div className="big-ten-container">
      {/* Logo Header Section */}
      <div className="big-ten-header">
        <div className="gameday-badge">
          <span className="gameday-text">GAMEDAY+</span>
          <span className="cfb-text">CFB</span>
        </div>
        
        <div className="big-ten-title-banner">
          <h1 className="big-ten-title">BIG TEN MAP</h1>
        </div>
        
        <div className="season-banner">
          <span className="season-text">2024 CFB SEASON</span>
        </div>
      </div>

      {/* Main Map Section */}
      <div className="us-map-container">
        <div className="us-map">
          {/* Team Logos on Map */}
          {!loading && teams.map((team) => {
            // Only place teams that have location data
            if (team.location && team.location.latitude && team.location.longitude) {
              const pos = getMapCoordinates(team.location.latitude, team.location.longitude);
              
              return (
                <div 
                  key={team.id}
                  className="team-logo-marker"
                  style={{
                    left: `${pos.x}px`,
                    top: `${pos.y}px`
                  }}
                  onClick={() => handleTeamClick(team)}
                >
                  <img 
                    src={team.logos ? team.logos[0] : "/photos/default_team.png"} 
                    alt={`${team.school} logo`} 
                    className="team-logo" 
                  />
                </div>
              );
            }
            return null;
          })}
        </div>

        {/* Footer Logo */}
        <div className="big-ten-footer">
          <div className="big-ten-logo">
            <img src="/photos/Big Ten.png" alt="Big Ten Logo" />
          </div>
          <div className="big-ten-text">BIG TEN CONFERENCE</div>
        </div>
      </div>

      {/* Team Info Popup */}
      {selectedTeam && (
        <div className="team-info-popup">
          <button className="close-button" onClick={closeTeamInfo}>×</button>
          <div className="team-info-header">
            <img 
              src={selectedTeam.logos ? selectedTeam.logos[0] : "/photos/default_team.png"} 
              alt={`${selectedTeam.school} logo`} 
              className="popup-team-logo" 
            />
            <h2>{selectedTeam.school}</h2>
          </div>
          <div className="team-info-content">
            <p><strong>Location:</strong> {selectedTeam.location?.city}, {selectedTeam.location?.state}</p>
            <p><strong>Conference:</strong> {selectedTeam.conference}</p>
            <p><strong>Team Colors:</strong> {selectedTeam.color || "N/A"}</p>
            <p><strong>Stadium:</strong> {selectedTeam.location?.name || "N/A"}</p>
            <p><strong>Mascot:</strong> {selectedTeam.mascot || "N/A"}</p>
          </div>
        </div>
      )}

      {/* Loading indicator */}
      {loading && (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
          <p>Loading Big Ten team data...</p>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="error-message">
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>Try Again</button>
        </div>
      )}
    </div>
  );
};

export default BigTen;