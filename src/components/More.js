import React, { useState, useEffect, useRef } from "react";
import teamsService from "../services/teamsService";
import { MapContainer, TileLayer, GeoJSON, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Set up Leaflet to handle image paths
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png"
});

// Component to trigger map updates
const MapUpdater = ({ voronoiLayer, bounds }) => {
  const map = useMap();
  
  useEffect(() => {
    if (voronoiLayer && bounds) {
      map.fitBounds(bounds);
      voronoiLayer.addTo(map);
    }
  }, [map, voronoiLayer, bounds]);
  
  return null;
};

const More = () => {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedConference, setSelectedConference] = useState("");
  const [voronoiLayer, setVoronoiLayer] = useState(null);
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

    .leaflet-popup-content {
      margin: 10px;
    }

    .territory-logo {
      position: absolute;
      z-index: 450;
      pointer-events: none;
      filter: drop-shadow(0 0 5px rgba(255, 255, 255, 0.7));
    }

    .leaflet-container {
      background: #f0f0f0;
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

  // This function generates Voronoi polygons for team territories
  const generateVoronoiTerritories = (teams) => {
    // Import d3-delaunay for Voronoi tessellation
    const d3Delaunay = window.d3?.Delaunay;
    
    if (!d3Delaunay || teams.length === 0) {
      console.error("D3-Delaunay not available or no teams provided");
      return null;
    }
    
    try {
      // Define the bounds of the US
      const usaBounds = [
        [24.396308, -125.0], // Southwest - covering Hawaii
        [49.384358, -66.93457] // Northeast
      ];
      
      // Create a GeoJSON FeatureCollection to hold all territories
      const territoriesGeoJSON = {
        type: "FeatureCollection",
        features: []
      };
      
      // Extract team points for Voronoi calculation
      const points = teams.map(team => [team.location.longitude, team.location.latitude]);
      const teamIds = teams.map(team => team.id);
      
      // Calculate Voronoi diagram with D3-Delaunay
      if (points.length > 0) {
        // Create a larger area for clipping to make sure territories extend to edges
        const width = Math.abs(usaBounds[1][1] - usaBounds[0][1]) * 1.2;
        const height = Math.abs(usaBounds[1][0] - usaBounds[0][0]) * 1.2;
        const centerX = (usaBounds[0][1] + usaBounds[1][1]) / 2;
        const centerY = (usaBounds[0][0] + usaBounds[1][0]) / 2;
        
        const clipBounds = [
          centerX - width/2, centerY - height/2,
          centerX + width/2, centerY + height/2
        ];

        // Create Delaunay triangulation then Voronoi diagram
        const delaunay = d3Delaunay.Delaunay.from(points);
        const voronoi = delaunay.voronoi(clipBounds);
        
        // Generate GeoJSON polygons for each cell
        for (let i = 0; i < teams.length; i++) {
          const cell = voronoi.cellPolygon(i);
          
          if (cell) {
            // Convert cell to GeoJSON
            const coordinates = cell.map(point => [point[0], point[1]]);
            
            // Make sure polygon is closed
            if (coordinates.length > 0 && 
                (coordinates[0][0] !== coordinates[coordinates.length-1][0] || 
                 coordinates[0][1] !== coordinates[coordinates.length-1][1])) {
              coordinates.push(coordinates[0]);
            }
            
            // Create GeoJSON feature
            const feature = {
              type: "Feature",
              properties: {
                teamId: teamIds[i],
                team: teams[i]
              },
              geometry: {
                type: "Polygon",
                coordinates: [coordinates]
              }
            };
            
            territoriesGeoJSON.features.push(feature);
          }
        }
        
        // Create Leaflet layer with styles
        const layer = L.geoJSON(territoriesGeoJSON, {
          style: (feature) => {
            const team = feature.properties.team;
            const color = team.color && team.color !== "null" ? team.color : "#333";
            return {
              fillColor: color,
              weight: 1,
              opacity: 0.8,
              color: lightenColor(color, 20),
              fillOpacity: 0.6
            };
          },
          onEachFeature: (feature, layer) => {
            const team = feature.properties.team;
            
            // Add popup
            layer.bindPopup(() => {
              const popupContent = document.createElement('div');
              popupContent.className = 'team-popup';
              
              const header = document.createElement('div');
              header.className = 'team-popup-header';
              
              const logo = document.createElement('img');
              logo.className = 'team-popup-logo';
              logo.src = team.logos?.[0] || "/photos/default_team.png";
              logo.alt = team.school;
              logo.onerror = function() {
                this.onerror = null;
                this.src = "/photos/default_team.png";
              };
              
              const name = document.createElement('h3');
              name.className = 'team-popup-name';
              name.textContent = team.school;
              
              header.appendChild(logo);
              header.appendChild(name);
              
              const details = document.createElement('div');
              details.className = 'team-popup-details';
              
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
                detail.className = 'team-popup-detail';
                
                const label = document.createElement('strong');
                label.textContent = item.label + ':';
                
                const value = document.createTextNode(item.value);
                
                detail.appendChild(label);
                detail.appendChild(value);
                details.appendChild(detail);
              });
              
              popupContent.appendChild(header);
              popupContent.appendChild(details);
              
              return popupContent;
            });
          }
        });
        
        // Add team logos to the map
        teams.forEach(team => {
          // Create an img element for each team logo
          const logoIcon = L.divIcon({
            className: 'territory-logo',
            html: `<img src="${team.logos?.[0] || "/photos/default_team.png"}" 
                   alt="${team.school}" 
                   style="width: 40px; height: 40px; object-fit: contain;"
                   onerror="this.onerror=null; this.src='/photos/default_team.png';">`
          });
          
          // Add marker at team location
          L.marker([team.location.latitude, team.location.longitude], {
            icon: logoIcon,
            interactive: false
          }).addTo(layer);
        });
        
        return { layer, bounds: layer.getBounds() };
      }
    } catch (error) {
      console.error("Error generating Voronoi territories:", error);
      return null;
    }
    
    return null;
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
        setLoading(false);
      } catch (err) {
        setError("Failed to load team data");
        setLoading(false);
        console.error(err);
      }
    };

    fetchTeams();
  }, []);

  // Filter teams based on selected conference
  const filteredTeams = React.useMemo(() => {
    if (!selectedConference) {
      return teams;
    }
    return teams.filter(team => team.conference === selectedConference);
  }, [teams, selectedConference]);

  // Generate Voronoi territories
  useEffect(() => {
    if (filteredTeams.length > 0) {
      // Include D3-Delaunay library
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/d3-delaunay@6';
      script.async = true;
      
      script.onload = () => {
        const voronoi = generateVoronoiTerritories(filteredTeams);
        if (voronoi) {
          setVoronoiLayer(voronoi.layer);
          setMapBounds(voronoi.bounds);
        }
      };
      
      document.body.appendChild(script);
      
      return () => {
        document.body.removeChild(script);
      };
    }
  }, [filteredTeams]);

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

  // Function to fly to a team's location
  const flyToTeam = (lat, lng) => {
    if (mapRef.current) {
      mapRef.current.flyTo([lat, lng], 10, {
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
                  setVoronoiLayer(null); // Reset layer on conference change
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
              zoomControl={false}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                opacity={0.4}
              />
              
              {voronoiLayer && mapBounds && (
                <MapUpdater voronoiLayer={voronoiLayer} bounds={mapBounds} />
              )}
              
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
            Map inspired by <a href="https://mapchart.net" target="_blank" rel="noopener noreferrer">MapChart.net</a> college football team territories visualization
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