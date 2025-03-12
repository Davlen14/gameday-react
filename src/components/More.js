import React, { useState, useEffect, useRef } from "react";
import teamsService from "../services/teamsService";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Delaunay } from "d3-delaunay";

// Fix default Leaflet icon paths
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png"
});

// Component to create US-shaped Voronoi diagram
const USATerritorialMap = ({ teams }) => {
  const map = useMap();
  const layerRef = useRef(null);
  
  useEffect(() => {
    if (!teams || teams.length === 0) return;

    // Clean up previous layer if it exists
    if (layerRef.current) {
      map.removeLayer(layerRef.current);
    }
    
    // Set US-specific view
    const usCenter = [39.8283, -98.5795]; // Center of US
    map.setView(usCenter, 4);
    
    // Create a new layer group for all the polygons
    const territoryLayer = L.layerGroup().addTo(map);
    layerRef.current = territoryLayer;
    
    // Convert teams to points for Voronoi generation
    const points = teams.map(team => [
      team.location.longitude, 
      team.location.latitude, 
      team
    ]);
    
    // Function to generate the Voronoi diagram
    const generateVoronoi = () => {
      // Create extended bounds for Voronoi diagram
      const boundingBox = [
        -130, 24, // Southwest - covers continental US
        -65, 50   // Northeast
      ];
      
      // Generate Voronoi diagram using d3-delaunay
      const pointsArray = points.map(p => [p[0], p[1]]);
      const delaunay = Delaunay.from(pointsArray);
      const voronoi = delaunay.voronoi(boundingBox);
      
      // Clear existing polygons
      territoryLayer.clearLayers();
      
      // Create polygons for each team
      points.forEach((point, i) => {
        const cell = voronoi.cellPolygon(i);
        if (!cell) return;
        
        const team = point[2];
        const teamColor = team.color && team.color !== "null" ? team.color : "#333";
        
        // Convert polygon to leaflet format
        const polygonPoints = cell.map(point => [point[1], point[0]]);
        
        const polygon = L.polygon(polygonPoints, {
          fillColor: teamColor,
          weight: 1,
          opacity: 1,
          color: 'white',
          fillOpacity: 0.9
        }).addTo(territoryLayer);
        
        // Add click handler to polygon
        polygon.on('click', () => {
          // Fly to the team location
          map.flyTo([team.location.latitude, team.location.longitude], 8, {
            duration: 1.5
          });
        });
        
        // Add popup to polygon
        polygon.bindPopup(`
          <div style="text-align: center">
            <img
              src="${team.logos?.[0] || "/photos/default_team.png"}"
              alt="${team.school}"
              style="width: 60px; height: auto; margin-bottom: 5px"
              onerror="this.onerror=null; this.src='/photos/default_team.png';"
            />
            <h3 style="margin: 5px 0">${team.school}</h3>
            <p style="margin: 0">
              <strong>Conference:</strong> ${team.conference || "Independent"}
            </p>
          </div>
        `);
      });
      
      // Add team logos on top of polygons
      points.forEach((point, i) => {
        const team = point[2];
        
        // Calculate territory size
        const cell = voronoi.cellPolygon(i);
        if (!cell) return;
        
        // Calculate area of polygon to determine logo size
        const polygonPoints = cell.map(p => [p[1], p[0]]);
        let area = 0;
        for (let j = 0; j < polygonPoints.length - 1; j++) {
          area += polygonPoints[j][0] * polygonPoints[j+1][1] - polygonPoints[j+1][0] * polygonPoints[j][1];
        }
        area = Math.abs(area / 2);
        
        // Scale logo size based on territory area
        const minSize = 30;
        const maxSize = 70;
        const baseSize = 50;
        
        // Normalize area to a reasonable size range
        const normalizedArea = Math.sqrt(area) * 8;
        const size = Math.max(minSize, Math.min(maxSize, baseSize * (normalizedArea / 10)));
        
        // Create custom icon with team logo
        const teamIcon = L.divIcon({
          className: "team-logo-marker",
          html: `<div style="
                    background-image: url('${team.logos?.[0] || "/photos/default_team.png"}');
                    background-size: contain;
                    background-repeat: no-repeat;
                    background-position: center;
                    width: ${size}px;
                    height: ${size}px;
                    border-radius: 50%;
                    border: 3px solid white;
                    background-color: white;
                    box-shadow: 0 0 8px rgba(0,0,0,0.6);">
                 </div>`,
          iconSize: [size, size],
          iconAnchor: [size/2, size/2]
        });
        
        // Place logo at team location
        const marker = L.marker(
          [team.location.latitude, team.location.longitude],
          { 
            icon: teamIcon,
            zIndexOffset: 1000 // Make sure logos are on top
          }
        ).addTo(territoryLayer);
        
        // Add click handler
        marker.on('click', () => {
          // Show popup
          marker.bindPopup(`
            <div style="text-align: center">
              <img
                src="${team.logos?.[0] || "/photos/default_team.png"}"
                alt="${team.school}"
                style="width: 60px; height: auto; margin-bottom: 5px"
                onerror="this.onerror=null; this.src='/photos/default_team.png';"
              />
              <h3 style="margin: 5px 0">${team.school}</h3>
              <p style="margin: 0">
                <strong>Conference:</strong> ${team.conference || "Independent"}
              </p>
            </div>
          `).openPopup();
        });
      });
      
      // Handle Alaska and Hawaii teams separately (if any)
      const alaskaTeams = teams.filter(team => 
        team.location.latitude > 50 && team.location.longitude < -130
      );
      
      if (alaskaTeams.length > 0) {
        // Create Alaska section in bottom left
        // Code for Alaska teams goes here
      }
      
      const hawaiiTeams = teams.filter(team => 
        team.location.latitude < 23 && team.location.longitude < -154
      );
      
      if (hawaiiTeams.length > 0) {
        // Create Hawaii section in bottom left
        // Code for Hawaii teams goes here
      }
    };
    
    // Generate initial Voronoi diagram
    generateVoronoi();
    
    // Don't regenerate on every map move - this keeps the view stable
    // and more like the static image you want
    
    // Cleanup function
    return () => {
      if (layerRef.current) {
        map.removeLayer(layerRef.current);
      }
    };
  }, [teams, map]);
  
  return null;
};

const More = () => {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const mapRef = useRef(null);

  // Fetch teams from API
  useEffect(() => {
    const fetchTeams = async () => {
      try {
        setLoading(true);
        const data = await teamsService.getTeams();
        // Filter for FBS teams that have valid coordinates
        const fbsTeams = data.filter(
          (team) =>
            team &&
            team.classification === "fbs" &&
            team.location &&
            team.location.latitude &&
            team.location.longitude
        );
        setTeams(fbsTeams);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching teams:", err);
        setError("Failed to load team data");
        setLoading(false);
      }
    };

    fetchTeams();
  }, []);

  // Helper function to fly to a team's location
  const flyToTeam = (lat, lng) => {
    if (mapRef.current) {
      mapRef.current.flyTo([lat, lng], 8, { duration: 1.5 });
    }
  };

  // Before rendering, check that teams are loaded and valid
  if (loading) {
    return <div>Loading FBS teams...</div>;
  }

  if (error) {
    return <div style={{ color: "red" }}>{error}</div>;
  }

  // Filter out any undefined or invalid team items
  const validTeams = teams.filter((team) => team && team.id);

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "20px" }}>
      <h1>College Football Team Territories</h1>
      <MapContainer
        center={[39.8283, -98.5795]}
        zoom={4}
        style={{ height: "700px", width: "100%" }}
        whenCreated={(map) => {
          mapRef.current = map;
        }}
        zoomControl={false} // Disable zoom controls for cleaner look
        dragging={false}    // Disable dragging for static map-like experience
        touchZoom={false}   // Disable touch zoom
        scrollWheelZoom={false} // Disable scroll wheel zoom
        doubleClickZoom={false} // Disable double click zoom
        boxZoom={false}     // Disable box zoom
        keyboard={false}    // Disable keyboard navigation
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          opacity={0.1} // Very faint base map
        />
        {validTeams.length > 0 && <USATerritorialMap teams={validTeams} />}
      </MapContainer>

      <div style={{ marginTop: "20px" }}>
        <h2>Team List</h2>
        <ul style={{ 
          listStyle: "none", 
          padding: 0,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
          gap: "10px",
          maxHeight: "400px",
          overflowY: "auto"
        }}>
          {validTeams.map((team) => (
            <li
              key={team.id}
              style={{
                cursor: "pointer",
                padding: "10px",
                borderRadius: "5px",
                backgroundColor: team.color && team.color !== "null" ? team.color : "#333",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                textShadow: "1px 1px 2px rgba(0,0,0,0.7)"
              }}
              onClick={() =>
                flyToTeam(team.location.latitude, team.location.longitude)
              }
            >
              <img 
                src={team.logos?.[0] || "/photos/default_team.png"} 
                alt=""
                style={{
                  width: "25px",
                  height: "25px",
                  marginRight: "10px",
                  backgroundColor: "white",
                  borderRadius: "50%",
                  padding: "2px"
                }}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "/photos/default_team.png";
                }}
              />
              <span>{team.school}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default More;