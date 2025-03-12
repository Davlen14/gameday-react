import React, { useState, useEffect, useRef } from "react";
import teamsService from "../services/teamsService";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fixing the icon issue in Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png"
});

const More = () => {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedConference, setSelectedConference] = useState("");
  const mapRef = useRef(null);

  // CSS styles
  const styles = `
    .cfb-map-container {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, sans-serif;
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
      color: #333;
    }
    
    .cfb-map-header {
      text-align: center;
      margin-bottom: 30px;
      position: relative;
      padding-bottom: 15px;
    }
    
    .cfb-map-header h1 {
      font-size: 2.5rem;
      font-weight: 800;
      margin: 0;
      background: linear-gradient(90deg, #0a2463, #3e92cc);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      color: transparent;
    }
    
    .cfb-map-header p {
      font-size: 1.1rem;
      color: #666;
      margin-top: 8px;
    }
    
    .cfb-map-header:after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 50%;
      transform: translateX(-50%);
      width: 100px;
      height: 4px;
      background: linear-gradient(90deg, #0a2463, #3e92cc);
      border-radius: 2px;
    }
    
    .cfb-map-controls {
      display: flex;
      flex-wrap: wrap;
      gap: 15px;
      margin-bottom: 20px;
      justify-content: center;
    }
    
    .cfb-map-dropdown {
      position: relative;
      min-width: 200px;
    }
    
    .cfb-map-dropdown select {
      width: 100%;
      padding: 10px 15px;
      font-size: 0.9rem;
      border: 2px solid #eaeaea;
      border-radius: 8px;
      background-color: white;
      box-shadow: 0 2px 5px rgba(0,0,0,0.05);
      appearance: none;
      cursor: pointer;
      transition: all 0.3s ease;
    }
    
    .cfb-map-dropdown select:hover {
      border-color: #ccc;
    }
    
    .cfb-map-dropdown select:focus {
      outline: none;
      border-color: #3e92cc;
      box-shadow: 0 0 0 3px rgba(62, 146, 204, 0.2);
    }
    
    .cfb-map-dropdown:after {
      content: '▼';
      font-size: 0.7rem;
      color: #666;
      position: absolute;
      right: 15px;
      top: 50%;
      transform: translateY(-50%);
      pointer-events: none;
    }
    
    .cfb-map-wrapper {
      height: 600px;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
      margin-bottom: 20px;
    }
    
    .team-list {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 15px;
      margin-top: 30px;
    }
    
    .team-card {
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
      padding: 15px;
      transition: transform 0.2s, box-shadow 0.2s;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 12px;
    }
    
    .team-card:hover {
      transform: translateY(-3px);
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
    }
    
    .team-logo {
      width: 40px;
      height: 40px;
      object-fit: contain;
    }
    
    .team-info {
      flex: 1;
    }
    
    .team-name {
      font-weight: 600;
      margin: 0 0 4px 0;
      font-size: 1rem;
    }
    
    .team-conference {
      font-size: 0.85rem;
      color: #666;
      margin: 0;
    }
    
    .team-color-dot {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      margin-left: auto;
    }
    
    .loading-container {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 300px;
      flex-direction: column;
    }
    
    .loading-spinner {
      border: 3px solid rgba(0, 0, 0, 0.1);
      border-top: 3px solid #3e92cc;
      border-radius: 50%;
      width: 40px;
      height: 40px;
      animation: spin 1s linear infinite;
      margin-bottom: 15px;
    }
    
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    
    .error-message {
      background-color: #fff5f5;
      color: #e53e3e;
      padding: 15px;
      border-radius: 8px;
      text-align: center;
      margin: 20px 0;
    }
    
    .leaflet-popup-content {
      margin: 12px;
    }
    
    .team-popup {
      width: 220px;
    }
    
    .team-popup-header {
      display: flex;
      align-items: center;
      margin-bottom: 8px;
    }
    
    .team-popup-logo {
      width: 40px;
      height: 40px;
      margin-right: 10px;
      object-fit: contain;
    }
    
    .team-popup-name {
      font-weight: 600;
      font-size: 1rem;
      margin: 0;
    }
    
    .team-popup-details {
      font-size: 0.9rem;
    }
    
    .team-popup-detail {
      margin: 4px 0;
    }
    
    .team-popup-detail strong {
      font-weight: 600;
      margin-right: 5px;
    }
  `;

  // Helper to lighten a color for visual effects
  const lightenColor = (color, percent) => {
    if (!color || color === "null" || color === "#null") {
      color = "#333333"; // Default color if invalid
    }
    
    try {
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
    } catch (e) {
      console.error("Color processing error:", e);
      return "#333333"; // Default color if processing fails
    }
  };

  // Conference order and logos mapping similar to Teams component
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

  // Fetch teams data
  useEffect(() => {
    const fetchTeams = async () => {
      try {
        setLoading(true);
        const data = await teamsService.getTeams();
        
        // Filter for FBS teams with valid coordinates
        const fbsTeamsWithCoordinates = data.filter(
          team => team.classification === "fbs" && 
                 team.location && 
                 team.location.latitude && 
                 team.location.longitude
        );
        
        // Sort teams by conference order like in Teams component
        const sortedTeams = [...fbsTeamsWithCoordinates].sort((a, b) => {
          const confA = a.conference || "Independent";
          const confB = b.conference || "Independent";
          
          const orderA = conferenceOrder.indexOf(confA);
          const orderB = conferenceOrder.indexOf(confB);
          
          if (orderA !== orderB) {
            // If one conference is not in our list, put it at the end
            if (orderA === -1) return 1;
            if (orderB === -1) return -1;
            return orderA - orderB;
          }
          
          // If same conference, sort alphabetically by school name
          return a.school.localeCompare(b.school);
        });
        
        setTeams(sortedTeams);
        setLoading(false);
      } catch (err) {
        setError("Failed to load team data");
        setLoading(false);
        console.error(err);
      }
    };

    fetchTeams();
  }, []);

  // Get unique conferences for the filter dropdown
  const conferences = React.useMemo(() => {
    const uniqueConferences = new Set();
    teams.forEach(team => {
      if (team.conference) {
        uniqueConferences.add(team.conference);
      }
    });
    return Array.from(uniqueConferences).sort();
  }, [teams]);

  // Filter teams based on selected conference
  const filteredTeams = React.useMemo(() => {
    if (!selectedConference) {
      return teams;
    }
    return teams.filter(team => team.conference === selectedConference);
  }, [teams, selectedConference]);

  // Custom icon function based on team colors
  const getTeamIcon = (team) => {
    // Get the team color with fallback
    const teamColor = team.color || '#333';
    
    // Handle null or "null" color values
    const color = teamColor === "null" || teamColor === null ? '#333' : teamColor;
    
    return L.divIcon({
      className: "team-marker",
      html: `<div style="background-color: ${color}; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 4px rgba(0,0,0,0.4);"></div>`,
      iconSize: [16, 16],
      iconAnchor: [8, 8]
    });
  };

  // Function to fly to a team's location
  const flyToTeam = (lat, lng) => {
    if (mapRef.current) {
      mapRef.current.flyTo([lat, lng], 12, {
        duration: 1.5
      });
    }
  };

  return (
    <div className="cfb-map-container">
      <style>{styles}</style>
      
      <div className="cfb-map-header">
        <h1>Interactive CFB Map</h1>
        <p>Explore FBS college football teams across the United States</p>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading FBS teams...</p>
        </div>
      ) : (
        <>
          <div className="cfb-map-controls">
            <div className="cfb-map-dropdown">
              <select 
                value={selectedConference}
                onChange={(e) => setSelectedConference(e.target.value)}
              >
                <option value="">All Conferences</option>
                {conferences.map(conf => (
                  <option key={conf} value={conf}>{conf}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="cfb-map-wrapper">
            <MapContainer 
              center={[39.8283, -98.5795]} 
              zoom={4} 
              style={{ height: "100%", width: "100%" }}
              whenCreated={map => (mapRef.current = map)}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              
              {filteredTeams.map(team => {
                // Handle null or invalid colors
                const teamColor = team.color && team.color !== "null" ? team.color : "#333";
                
                return (
                  <Marker 
                    key={team.id}
                    position={[team.location.latitude, team.location.longitude]}
                    icon={getTeamIcon(team)}
                  >
                    <Popup>
                      <div className="team-popup">
                        <div className="team-popup-header">
                          <img 
                            src={team.logos?.[0] || "/photos/default_team.png"} 
                            alt={team.school}
                            className="team-popup-logo"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = "/photos/default_team.png";
                            }}
                            loading="lazy"
                          />
                          <h3 className="team-popup-name">{team.school}</h3>
                        </div>
                        <div className="team-popup-details">
                          <p className="team-popup-detail">
                            <strong>Mascot:</strong> {team.mascot || "N/A"}
                          </p>
                          <p className="team-popup-detail">
                            <strong>Conference:</strong> {team.conference || "Independent"}
                          </p>
                          <p className="team-popup-detail">
                            <strong>Stadium:</strong> {team.location?.name || "N/A"}
                          </p>
                          <p className="team-popup-detail">
                            <strong>Location:</strong> {team.location?.city}, {team.location?.state}
                          </p>
                          <p className="team-popup-detail">
                            <strong>Capacity:</strong> {team.location?.capacity?.toLocaleString() || "N/A"}
                          </p>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
            </MapContainer>
          </div>

          <div className="team-list">
            {filteredTeams.map(team => (
              <div 
                key={team.id} 
                className="team-card"
                onClick={() => flyToTeam(team.location.latitude, team.location.longitude)}
              >
                <img 
                  src={team.logos?.[0] || "/photos/default_team.png"} 
                  alt={team.school}
                  className="team-logo"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "/photos/default_team.png";
                  }}
                  loading="lazy"
                />
                <div className="team-info">
                  <h4 className="team-name">{team.school}</h4>
                  <p className="team-conference">{team.conference || "Independent"}</p>
                </div>
                                  <div 
                  className="team-color-dot" 
                  style={{ backgroundColor: team.color && team.color !== "null" ? team.color : "#333" }}
                ></div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default More;