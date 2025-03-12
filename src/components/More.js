import React, { useState, useEffect, useRef } from "react";
import teamsService from "../services/teamsService";
import { MapContainer, TileLayer, GeoJSON, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix Leaflet icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png"
});

// Component to update map view
const MapUpdater = ({ bounds }) => {
  const map = useMap();
  
  useEffect(() => {
    if (bounds) {
      map.fitBounds(bounds);
    }
  }, [map, bounds]);
  
  return null;
};

const More = () => {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedConference, setSelectedConference] = useState("");
  const [mapBounds, setMapBounds] = useState(null);
  const [usStatesData, setUsStatesData] = useState(null);
  const [teamTerritories, setTeamTerritories] = useState(null);
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

    .team-popup {
      width: 250px;
      padding: 5px;
    }
    
    .team-popup-header {
      display: flex;
      align-items: center;
      margin-bottom: 10px;
      border-bottom: 2px solid #f0f0f0;
      padding-bottom: 8px;
    }
    
    .team-popup-logo {
      width: 50px;
      height: 50px;
      margin-right: 10px;
      object-fit: contain;
    }
    
    .team-popup-name {
      font-weight: 700;
      font-size: 1.1rem;
      margin: 0;
      color: #333;
    }
    
    .team-popup-details {
      font-size: 0.9rem;
    }
    
    .team-popup-detail {
      margin: 4px 0;
      display: flex;
      align-items: center;
    }
    
    .team-popup-detail strong {
      font-weight: 600;
      margin-right: 5px;
      min-width: 80px;
      display: inline-block;
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
    
    .team-logo-marker {
      z-index: 1000 !important;
    }
    
    .leaflet-popup-content {
      margin: 12px;
    }
  `;

  // Helper to lighten a color for borders
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

  // Fetch US states GeoJSON data
  useEffect(() => {
    const fetchStatesData = async () => {
      try {
        const response = await fetch('https://raw.githubusercontent.com/PublicaMundi/MappingAPI/master/data/geojson/us-states.json');
        if (!response.ok) {
          throw new Error('Failed to fetch US states data');
        }
        const data = await response.json();
        setUsStatesData(data);
      } catch (err) {
        console.error('Error fetching US states data:', err);
        setError('Failed to load map data. Please try again later.');
      }
    };

    fetchStatesData();
  }, []);

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
            Math.min(...lats) - 2, 
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

  // Calculate distances between points (haversine formula)
  const calculateDistance = React.useCallback((point1, point2) => {
    // Validate inputs to avoid TDZ issues
    if (!Array.isArray(point1) || point1.length < 2 || !Array.isArray(point2) || point2.length < 2) {
      return Infinity; // Return a safe value for invalid inputs
    }
    
    // Extract coordinates with defaults to avoid undefined values
    const lon1 = Number(point1[0]) || 0;
    const lat1 = Number(point1[1]) || 0;
    const lon2 = Number(point2[0]) || 0;
    const lat2 = Number(point2[1]) || 0;
    
    try {
      const R = 6371; // Radius of the earth in km
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;
      
      const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2); 
      
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
      return R * c; // Distance in km
    } catch (error) {
      console.error("Error calculating distance:", error);
      return Infinity; // Safe default on error
    }
  }, []);

  // Calculate the state centroid (approximate center point)
  const getStateCentroid = React.useCallback((coordinates) => {
    if (!coordinates || !Array.isArray(coordinates) || coordinates.length === 0) {
      return [0, 0]; // Safe default
    }
    
    try {
      // For simple polygons
      if (coordinates.length === 1 && Array.isArray(coordinates[0])) {
        // Calculate average of all points
        const points = coordinates[0];
        if (!Array.isArray(points) || points.length === 0) {
          return [0, 0]; // Safe default
        }
        
        let sumLng = 0;
        let sumLat = 0;
        
        points.forEach(point => {
          if (Array.isArray(point) && point.length >= 2) {
            sumLng += point[0] || 0;
            sumLat += point[1] || 0;
          }
        });
        
        // Avoid division by zero
        const pointCount = Math.max(points.length, 1);
        return [sumLng / pointCount, sumLat / pointCount];
      }
      
      // For multi-polygons, use the first one (main area)
      if (Array.isArray(coordinates[0])) {
        const firstCoord = coordinates[0];
        // Recursive call with proper wrapping
        return getStateCentroid([firstCoord]);
      }
      
      return [0, 0]; // Default fallback
    } catch (error) {
      console.error("Error calculating centroid:", error);
      return [0, 0]; // Safe default on error
    }
  }, []);

  // Create team territories by assigning states to closest team
  useEffect(() => {
    // Check that both dependencies exist
    if (!usStatesData || !filteredTeams || filteredTeams.length === 0) {
      return;
    }
    
    try {
      // Create a deep copy of the states data, capturing it in this scope
      const statesCopy = JSON.parse(JSON.stringify(usStatesData));
      // Keep a reference to the filtered teams, avoiding closure issues
      const currentFilteredTeams = [...filteredTeams];
      
      // For each state, find the closest team
      statesCopy.features.forEach(state => {
        if (!state.geometry || !state.geometry.coordinates) return;
        
        // Get center coordinates of the state
        const stateCentroid = getStateCentroid(state.geometry.coordinates);
        if (!stateCentroid || !stateCentroid[0] || !stateCentroid[1]) return;
        
        // Find the closest team
        let closestTeam = null;
        let minDistance = Infinity;
        
        // Use our stable reference to filtered teams
        currentFilteredTeams.forEach(team => {
          if (!team.location || !team.location.longitude || !team.location.latitude) return;
          
          const teamLocation = [team.location.longitude, team.location.latitude];
          const distance = calculateDistance(stateCentroid, teamLocation);
          
          if (distance < minDistance) {
            minDistance = distance;
            closestTeam = { ...team }; // Create a copy to avoid reference issues
          }
        });
        
        // Safely assign team to state
        if (closestTeam && state.properties) {
          state.properties.teamId = closestTeam.id;
          state.properties.teamName = closestTeam.school || '';
          state.properties.teamColor = 
            (closestTeam.color && closestTeam.color !== "null") 
              ? closestTeam.color 
              : "#333";
          state.properties.teamLogo = closestTeam.logos && closestTeam.logos.length > 0 
            ? closestTeam.logos[0] 
            : null;
        }
      });
      
      setTeamTerritories(statesCopy);
    } catch (err) {
      console.error("Error creating territories:", err);
    }
  }, [usStatesData, filteredTeams, getStateCentroid, calculateDistance]);

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

  // Function to style the GeoJSON states
  const stateStyle = (feature) => {
    return {
      fillColor: feature.properties.teamColor || "#ccc",
      weight: 1,
      opacity: 1,
      color: lightenColor(feature.properties.teamColor || "#ccc", 20),
      fillOpacity: 0.7
    };
  };

  // Function to handle click on a state
  const onStateClick = (e, feature) => {
    if (!feature || !feature.properties) return;
    
    const teamId = feature.properties.teamId;
    if (!teamId) return;
    
    const team = filteredTeams.find(t => t.id === teamId);
    if (team && team.location && mapRef.current) {
      const lat = team.location.latitude;
      const lng = team.location.longitude;
      
      if (lat && lng) {
        mapRef.current.flyTo(
          [lat, lng],
          6,
          { duration: 1.5 }
        );
      }
    }
  };

  // Function to add popups to states
  const onEachState = (feature, layer) => {
    // Add click event
    layer.on({
      click: (e) => {
        // Avoid accessing variables in temporal dead zone
        const featureCopy = {...feature};
        onStateClick(e, featureCopy);
      }
    });
    
    // Add tooltip - avoid potential TDZ issues
    const stateName = feature.properties.name || '';
    const teamName = feature.properties.teamName || 'No team';
    layer.bindTooltip(`${stateName} - ${teamName}`, {
      sticky: true
    });
  };

  // Function to fly to a team's location
  const flyToTeam = (lat, lng) => {
    if (mapRef.current) {
      mapRef.current.flyTo([lat, lng], 6, {
        duration: 1.5
      });
    }
  };

  // Create a team logo icon with safe access to properties
  const createTeamLogoIcon = React.useCallback((team) => {
    if (!team) return L.divIcon({
      className: 'team-logo-marker',
      html: `<img src="/photos/default_team.png" alt="Default" style="width: 40px; height: 40px; object-fit: contain;"/>`,
      iconSize: [40, 40],
      iconAnchor: [20, 20]
    });
    
    // Safely extract values to avoid TDZ
    const logoUrl = team.logos && team.logos.length > 0 ? team.logos[0] : '/photos/default_team.png';
    const teamName = team.school || 'Team';
    
    return L.divIcon({
      className: 'team-logo-marker',
      html: `
        <img 
          src="${logoUrl}" 
          alt="${teamName}" 
          style="width: 40px; height: 40px; object-fit: contain; filter: drop-shadow(0 0 3px white);"
          onerror="this.onerror=null; this.src='/photos/default_team.png';"
        />
      `,
      iconSize: [40, 40],
      iconAnchor: [20, 20]
    });
  }, []);

  // Simple legend component with improved safety
  const Legend = React.memo(({ teams }) => {
    // Safely handle empty teams array
    if (!teams || !Array.isArray(teams) || teams.length === 0) {
      return (
        <div className="legend leaflet-control">
          <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>Teams</div>
          <div>No teams selected</div>
        </div>
      );
    }
    
    return (
      <div className="legend leaflet-control">
        <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>Teams</div>
        {teams.map(team => {
          // Skip if we don't have an ID or location data
          if (!team || !team.id || !team.location) return null;
          
          // Extract values safely
          const teamId = team.id;
          const teamName = team.school || 'Unknown Team';
          const teamColor = team.color && team.color !== "null" ? team.color : "#333";
          const latitude = team.location.latitude;
          const longitude = team.location.longitude;
          
          return (
            <div 
              key={teamId} 
              className="legend-item"
              onClick={() => {
                if (latitude && longitude) {
                  flyToTeam(latitude, longitude);
                }
              }}
            >
              <div 
                className="legend-color" 
                style={{ backgroundColor: teamColor }}
              ></div>
              <div className="legend-name">{teamName}</div>
            </div>
          );
        })}
      </div>
    );
  });

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
              {/* Very light background map */}
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                opacity={0.3} 
              />

              {/* Team territories (states colored by team) */}
              {teamTerritories && (
                <GeoJSON 
                  data={teamTerritories}
                  style={stateStyle}
                  onEachFeature={onEachState}
                />
              )}
              
              {/* Team logo markers */}
              {filteredTeams.map(team => (
                <Marker
                  key={team.id}
                  position={[team.location.latitude, team.location.longitude]}
                  icon={createTeamLogoIcon(team)}
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
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = "/photos/default_team.png";
                          }}
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
              ))}
              
              {mapBounds && <MapUpdater bounds={mapBounds} />}
              
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