import React, { useState, useEffect, useRef } from "react";
import teamsService from "../services/teamsService";
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Set up Leaflet to handle image paths
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png"
});

// Component to update the map view
const MapUpdater = ({ bounds }) => {
  const map = useMap();
  
  useEffect(() => {
    if (bounds) {
      map.fitBounds(bounds);
    }
  }, [map, bounds]);
  
  return null;
};

// Team logo component
const TeamLogo = ({ team, map }) => {
  const [position, setPosition] = useState([
    team.location.latitude,
    team.location.longitude
  ]);

  useEffect(() => {
    const logoElement = document.createElement('div');
    logoElement.className = 'team-logo-overlay';
    
    const logoImg = document.createElement('img');
    logoImg.src = team.logos?.[0] || "/photos/default_team.png";
    logoImg.alt = team.school;
    logoImg.style.width = '40px';
    logoImg.style.height = '40px';
    logoImg.style.objectFit = 'contain';
    logoImg.style.filter = 'drop-shadow(1px 1px 3px rgba(0,0,0,0.7))';
    logoImg.onerror = function() {
      this.onerror = null;
      this.src = "/photos/default_team.png";
    };
    
    logoElement.appendChild(logoImg);
    
    const logoIcon = L.divIcon({
      html: logoElement,
      className: 'team-logo-marker',
      iconSize: [40, 40],
      iconAnchor: [20, 20]
    });
    
    const marker = L.marker(position, {
      icon: logoIcon,
      interactive: true,
      zIndexOffset: 1000
    });
    
    // Add popup
    const popupContent = document.createElement('div');
    popupContent.className = 'team-popup';
    
    const header = document.createElement('div');
    header.className = 'team-popup-header';
    
    const logo = document.createElement('img');
    logo.className = 'team-popup-logo';
    logo.src = team.logos?.[0] || "/photos/default_team.png";
    logo.alt = team.school;
    logo.style.width = '50px';
    logo.style.height = '50px';
    logo.style.marginRight = '10px';
    logo.style.objectFit = 'contain';
    logo.onerror = function() {
      this.onerror = null;
      this.src = "/photos/default_team.png";
    };
    
    const name = document.createElement('h3');
    name.className = 'team-popup-name';
    name.textContent = team.school;
    name.style.fontWeight = 'bold';
    name.style.fontSize = '1.1rem';
    name.style.margin = '0';
    
    header.appendChild(logo);
    header.appendChild(name);
    
    const details = document.createElement('div');
    details.className = 'team-popup-details';
    details.style.fontSize = '0.9rem';
    
    // Add details
    const detailsList = [
      { label: 'Mascot', value: team.mascot || 'N/A' },
      { label: 'Conference', value: team.conference || 'Independent' },
      { label: 'Stadium', value: team.location?.name || 'N/A' },
      { label: 'Location', value: `${team.location?.city}, ${team.location?.state}` },
      { label: 'Capacity', value: team.location?.capacity?.toLocaleString() || 'N/A' }
    ];
    
    detailsList.forEach(item => {
      const detail = document.createElement('p');
      detail.style.margin = '5px 0';
      
      const label = document.createElement('strong');
      label.textContent = item.label + ': ';
      label.style.fontWeight = 'bold';
      
      const value = document.createTextNode(item.value);
      
      detail.appendChild(label);
      detail.appendChild(value);
      details.appendChild(detail);
    });
    
    popupContent.appendChild(header);
    popupContent.appendChild(details);
    
    marker.bindPopup(popupContent, { 
      maxWidth: 300,
      className: 'team-popup-container'
    });
    
    marker.addTo(map);
    
    return () => {
      map.removeLayer(marker);
    };
  }, [team, position, map]);
  
  return null;
};

const More = () => {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedConference, setSelectedConference] = useState("");
  const [mapBounds, setMapBounds] = useState(null);
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
      height: 700px;
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

    .team-popup-container .leaflet-popup-content-wrapper {
      border-radius: 8px;
      padding: 0;
    }
    
    .team-popup-container .leaflet-popup-content {
      margin: 0;
      padding: 12px;
      min-width: 250px;
    }
    
    .team-popup-header {
      display: flex;
      align-items: center;
      border-bottom: 2px solid #f0f0f0;
      padding-bottom: 10px;
      margin-bottom: 10px;
    }

    .legend {
      background: white;
      padding: 10px;
      border-radius: 5px;
      box-shadow: 0 0 10px rgba(0,0,0,0.1);
      max-height: 300px;
      overflow-y: auto;
      max-width: 200px;
    }

    .legend-item {
      display: flex;
      align-items: center;
      margin-bottom: 5px;
      cursor: pointer;
      padding: 3px;
      border-radius: 4px;
      transition: background-color 0.2s;
    }

    .legend-item:hover {
      background-color: #f0f0f0;
    }

    .legend-color {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      margin-right: 8px;
      border: 1px solid rgba(0,0,0,0.1);
    }

    .legend-name {
      font-size: 0.75rem;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .map-attribution {
      font-size: 0.7rem;
      text-align: center;
      margin-top: 5px;
      color: #666;
    }
    
    .team-logo-marker div {
      background: none !important;
      border: none !important;
    }
    
    .team-logo-overlay {
      display: flex;
      justify-content: center;
      align-items: center;
      width: 40px;
      height: 40px;
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

  // Conference order and logos mapping
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
        
        // Sort teams by conference order
        const sortedTeams = [...fbsTeamsWithCoordinates].sort((a, b) => {
          const confA = a.conference || "Independent";
          const confB = b.conference || "Independent";
          
          const orderA = conferenceOrder.indexOf(confA);
          const orderB = conferenceOrder.indexOf(confB);
          
          if (orderA !== orderB) {
            if (orderA === -1) return 1;
            if (orderB === -1) return -1;
            return orderA - orderB;
          }
          
          return a.school.localeCompare(b.school);
        });
        
        setTeams(sortedTeams);
        
        // Calculate bounds for the teams
        if (sortedTeams.length > 0) {
          const lats = sortedTeams.map(t => t.location.latitude);
          const lngs = sortedTeams.map(t => t.location.longitude);
          
          const southWest = [
            Math.min(...lats) - 2, // Add padding
            Math.min(...lngs) - 2
          ];
          
          const northEast = [
            Math.max(...lats) + 2,
            Math.max(...lngs) + 2
          ];
          
          setMapBounds([southWest, northEast]);
        }
        
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

  // Calculate the circle radius based on the number of teams
  // We want circles to overlap and create a territory-like appearance
  const getCircleRadius = (numTeams) => {
    if (numTeams <= 20) return 120; // Larger territories for fewer teams
    if (numTeams <= 50) return 90;
    if (numTeams <= 100) return 70;
    return 50; // Smaller territories for many teams
  };

  // Function to fly to a team's location
  const flyToTeam = (lat, lng) => {
    if (mapRef.current) {
      mapRef.current.flyTo([lat, lng], 8, {
        duration: 1.5
      });
    }
  };

  // Simple legend component
  const Legend = ({ teams }) => {
    return (
      <div className="legend leaflet-control">
        <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>Teams</div>
        {teams.map(team => (
          <div 
            key={team.id} 
            className="legend-item"
            onClick={() => flyToTeam(team.location.latitude, team.location.longitude)}
          >
            <div 
              className="legend-color" 
              style={{ backgroundColor: team.color && team.color !== "null" ? team.color : "#333" }}
            ></div>
            <div className="legend-name">{team.school}</div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="cfb-map-container">
      <style>{styles}</style>
      
      <div className="cfb-map-header">
        <h1>Interactive CFB Map</h1>
        <p>Explore FBS college football team territories across the United States</p>
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
                onChange={(e) => {
                  setSelectedConference(e.target.value);
                }}
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
              minZoom={3}
              maxZoom={10}
              zoomControl={false}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                opacity={0.3} // Very light base map
              />

              {mapBounds && <MapUpdater bounds={mapBounds} />}
              
              {/* Add large colored circles for team territories */}
              {filteredTeams.map(team => {
                const teamColor = team.color && team.color !== "null" ? team.color : "#333";
                const circleRadius = getCircleRadius(filteredTeams.length) * 1000; // Convert to meters
                
                return (
                  <CircleMarker
                    key={team.id}
                    center={[team.location.latitude, team.location.longitude]}
                    radius={circleRadius}
                    pathOptions={{
                      fillColor: teamColor,
                      fillOpacity: 0.7,
                      stroke: true,
                      color: lightenColor(teamColor, 20),
                      weight: 2,
                      opacity: 0.8
                    }}
                    eventHandlers={{
                      click: () => {
                        flyToTeam(team.location.latitude, team.location.longitude);
                      }
                    }}
                  >
                    <Popup>
                      <div className="team-popup">
                        <div className="team-popup-header">
                          <img 
                            src={team.logos?.[0] || "/photos/default_team.png"} 
                            alt={team.school}
                            className="team-popup-logo"
                            style={{
                              width: '50px',
                              height: '50px',
                              marginRight: '10px',
                              objectFit: 'contain'
                            }}
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = "/photos/default_team.png";
                            }}
                          />
                          <h3 
                            className="team-popup-name"
                            style={{
                              fontWeight: 'bold',
                              fontSize: '1.1rem',
                              margin: 0
                            }}
                          >{team.school}</h3>
                        </div>
                        <div 
                          className="team-popup-details"
                          style={{ fontSize: '0.9rem' }}
                        >
                          <p style={{ margin: '5px 0' }}>
                            <strong style={{ fontWeight: 'bold' }}>Mascot:</strong> {team.mascot || "N/A"}
                          </p>
                          <p style={{ margin: '5px 0' }}>
                            <strong style={{ fontWeight: 'bold' }}>Conference:</strong> {team.conference || "Independent"}
                          </p>
                          <p style={{ margin: '5px 0' }}>
                            <strong style={{ fontWeight: 'bold' }}>Stadium:</strong> {team.location?.name || "N/A"}
                          </p>
                          <p style={{ margin: '5px 0' }}>
                            <strong style={{ fontWeight: 'bold' }}>Location:</strong> {team.location?.city}, {team.location?.state}
                          </p>
                          <p style={{ margin: '5px 0' }}>
                            <strong style={{ fontWeight: 'bold' }}>Capacity:</strong> {team.location?.capacity?.toLocaleString() || "N/A"}
                          </p>
                        </div>
                      </div>
                    </Popup>
                  </CircleMarker>
                );
              })}
              
              {/* Add team logos */}
              {mapRef.current && filteredTeams.map(team => (
                <TeamLogo key={team.id} team={team} map={mapRef.current} />
              ))}
              
              {/* Add zoom controls in a custom position */}
              <div className="leaflet-top leaflet-left" style={{ top: '60px' }}>
                <div className="leaflet-control leaflet-bar">
                  <a href="#" title="Zoom in" onClick={(e) => {
                    e.preventDefault();
                    mapRef.current.zoomIn();
                  }}>+</a>
                  <a href="#" title="Zoom out" onClick={(e) => {
                    e.preventDefault();
                    mapRef.current.zoomOut();
                  }}>-</a>
                </div>
              </div>
              
              {/* Add legend in bottom right */}
              <div className="leaflet-bottom leaflet-right">
                <Legend teams={filteredTeams} />
              </div>
            </MapContainer>
          </div>
          
          <div className="map-attribution">
            Map inspired by college football team territories visualization
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