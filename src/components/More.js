import React, { useState, useEffect, useRef } from "react";
import teamsService from "../services/teamsService";
import { MapContainer, TileLayer, Marker, Popup, GeoJSON } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import * as turf from "@turf/turf";

// Fix leaflet icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png"
});

const More = () => {
  const [teams, setTeams] = useState([]);
  const [voronoiPolygons, setVoronoiPolygons] = useState([]);
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
    
    .team-logo-marker {
      filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
      transition: transform 0.2s ease;
    }
    
    .team-map-logo {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      border: 2px solid white;
      object-fit: cover;
      background: white;
      transform: scale(1);
      transition: transform 0.2s ease;
    }
    
    .leaflet-pane .leaflet-marker-pane img {
      transition: transform 0.2s ease;
    }
    
    .leaflet-pane .leaflet-marker-pane img:hover {
      transform: scale(1.15);
      z-index: 1000 !important;
    }
    
    .voronoi-polygon {
      stroke-width: 0.5;
      transition: fill-opacity 0.2s;
    }
    
    .voronoi-polygon:hover {
      fill-opacity: 0.7 !important;
    }
  `;

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        setLoading(true);
        const data = await teamsService.getTeams();
        
        const validTeams = data.filter(
          team => team.classification === "fbs" && 
                 team.location && 
                 team.location.latitude && 
                 team.location.longitude
        );

        // Generate Voronoi diagram
        const points = validTeams.map(team => 
          turf.point([team.location.longitude, team.location.latitude], {
            teamId: team.id,
            color: team.color || '#333'
          })
        );

        const voronoi = turf.voronoi(turf.featureCollection(points), { bbox: [-125, 24, -66, 50] });
        
        // Process polygons and add team data
        const processedPolygons = voronoi.features.map((polygon, index) => ({
          ...polygon,
          properties: {
            ...polygon.properties,
            teamId: validTeams[index].id,
            color: validTeams[index].color || '#333',
            school: validTeams[index].school
          }
        }));

        setVoronoiPolygons(processedPolygons);
        setTeams(validTeams);
        setLoading(false);
      } catch (err) {
        setError("Failed to load team data");
        setLoading(false);
        console.error(err);
      }
    };

    fetchTeams();
  }, []);

  const getTeamIcon = (team) => {
    const logoUrl = team.logos?.[0] || "/photos/default_team.png";
    return L.divIcon({
      className: "team-logo-marker",
      html: `
        <div class="logo-marker-container">
          <img src="${logoUrl}" 
               alt="Team Logo" 
               class="team-map-logo"
               onerror="this.src='/photos/default_team.png'"/>
        </div>
      `,
      iconSize: [40, 40],
      iconAnchor: [20, 40]
    });
  };

  const voronoiStyle = (feature) => ({
    fillColor: feature.properties.color,
    fillOpacity: 0.3,
    weight: 0.5,
    color: feature.properties.color,
    opacity: 0.7
  });

  const onEachVoronoi = (feature, layer) => {
    const team = teams.find(t => t.id === feature.properties.teamId);
    if (team) {
      layer.bindPopup(`
        <div class="team-popup">
          <div class="team-popup-header">
            <img src="${team.logos?.[0] || "/photos/default_team.png"}" 
                 alt="${team.school}" 
                 style="width: 40px; height: 40px; border-radius: 50%; margin-right: 10px;"/>
            <h3 style="margin: 0; font-size: 1.1rem;">${team.school}</h3>
          </div>
          <p style="margin: 8px 0; font-size: 0.9rem;">
            Territory Area: ${turf.area(feature).toFixed(0)} km²
          </p>
        </div>
      `);
    }
  };

  return (
    <div className="cfb-map-container">
      <style>{styles}</style>
      
      <div className="cfb-map-header">
        <h1>College Football Territories</h1>
        <p>Voronoi diagram showing team influence areas based on location</p>
      </div>

      {error && <div className="error-message">{error}</div>}

      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading FBS teams...</p>
        </div>
      ) : (
        <>
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

              <GeoJSON
                data={{ type: "FeatureCollection", features: voronoiPolygons }}
                style={voronoiStyle}
                onEachFeature={onEachVoronoi}
                className="voronoi-polygon"
              />

              {teams.map(team => (
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
                          style={{ 
                            width: "40px",
                            height: "40px",
                            borderRadius: "50%",
                            marginRight: "10px"
                          }}
                        />
                        <h3 style={{ margin: 0 }}>{team.school}</h3>
                      </div>
                      <p style={{ margin: "8px 0" }}>
                        Conference: {team.conference || "Independent"}
                      </p>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        </>
      )}
    </div>
  );
};

export default More;