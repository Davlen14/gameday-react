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

// Component to create Voronoi diagram
const USATerritorialMap = ({ teams }) => {
  const map = useMap();
  const layerRef = useRef(null);
  
  useEffect(() => {
    if (!teams || teams.length === 0) return;

    // Clean up previous layer if it exists
    if (layerRef.current) {
      map.removeLayer(layerRef.current);
    }
    
    // Set US boundaries for better focus
    const usBounds = L.latLngBounds(
      L.latLng(24.396308, -125.000000), // Southwest - includes Hawaii
      L.latLng(49.384358, -66.934570)   // Northeast
    );
    
    // Add Alaska and Hawaii bounds
    const alaskaBounds = L.latLngBounds(
      L.latLng(51.214183, -179.148909),
      L.latLng(71.365162, -129.974567)
    );
    
    const hawaiiBounds = L.latLngBounds(
      L.latLng(18.910361, -160.236588),
      L.latLng(22.236967, -154.807819)
    );
    
    // Set map to US view
    map.fitBounds(usBounds);
    
    // Convert teams to points for Voronoi generation
    const points = teams.map(team => [
      team.location.longitude, 
      team.location.latitude, 
      team
    ]);
    
    // Create a new layer group for all the polygons
    const territoryLayer = L.layerGroup().addTo(map);
    layerRef.current = territoryLayer;
    
    // Function to generate the Voronoi diagram
    const generateVoronoi = () => {
      // Get current map bounds
      const bounds = map.getBounds();
      const sw = bounds.getSouthWest();
      const ne = bounds.getNorthEast();
      
      // Create extended bounds for Voronoi diagram
      const boundingBox = [
        sw.lng - 5, sw.lat - 5,
        ne.lng + 5, ne.lat + 5
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
        
        // Create polygon for team's territory
        const polygonPoints = cell.map(point => [point[1], point[0]]);
        
        const polygon = L.polygon(polygonPoints, {
          fillColor: teamColor,
          weight: 1.5,
          opacity: 1,
          color: 'white',
          fillOpacity: 0.8
        }).addTo(territoryLayer);
        
        // Add popup to polygon
        polygon.bindPopup(`
          <div style="text-align: center">
            <img
              src="${team.logos?.[0] || "/photos/default_team.png"}"
              alt="${team.school}"
              style="width: 50px; height: auto; margin-bottom: 5px"
              onerror="this.onerror=null; this.src='/photos/default_team.png';"
            />
            <h3 style="margin: 5px 0">${team.school}</h3>
            <p style="margin: 0">
              <strong>Conference:</strong> ${team.conference || "Independent"}
            </p>
          </div>
        `);
        
        // Calculate area of polygon to determine logo size
        let area = 0;
        for (let j = 0; j < polygonPoints.length - 1; j++) {
          area += polygonPoints[j][0] * polygonPoints[j+1][1] - polygonPoints[j+1][0] * polygonPoints[j][1];
        }
        area = Math.abs(area / 2);
        
        // Scale logo size based on territory area
        const baseSize = 40;
        const minSize = 30;
        const maxSize = 60;
        
        // Normalize area to a reasonable size range
        const normalizedArea = Math.sqrt(area) * 10;
        const size = Math.max(minSize, Math.min(maxSize, baseSize * (normalizedArea / 10)));
        
        // Create custom icon with team logo sized by territory
        const teamIcon = L.divIcon({
          className: "team-logo-marker",
          html: `<div style="background-image: url('${team.logos?.[0] || "/photos/default_team.png"}');
                            background-size: contain;
                            background-repeat: no-repeat;
                            background-position: center;
                            width: ${size}px;
                            height: ${size}px;
                            border-radius: 50%;
                            border: 2px solid white;
                            background-color: white;
                            box-shadow: 0 0 4px rgba(0,0,0,0.4);">
                 </div>`,
          iconSize: [size, size],
          iconAnchor: [size/2, size/2]
        });
        
        // Place logo at team location
        L.marker(
          [team.location.latitude, team.location.longitude],
          { icon: teamIcon }
        ).addTo(territoryLayer);
      });
    };
    
    // Generate initial Voronoi diagram
    generateVoronoi();
    
    // Update Voronoi on zoom end
    const handleZoomEnd = () => {
      generateVoronoi();
    };
    
    // Debounce for performance
    let moveTimeout = null;
    const handleMoveEnd = () => {
      clearTimeout(moveTimeout);
      moveTimeout = setTimeout(generateVoronoi, 300);
    };
    
    map.on('zoomend', handleZoomEnd);
    map.on('moveend', handleMoveEnd);
    
    // Handle special regions (Alaska, Hawaii)
    // For teams in Alaska
    const alaskaTeams = teams.filter(team => 
      team.location.latitude > 50 && team.location.longitude < -130
    );
    
    // For teams in Hawaii
    const hawaiiTeams = teams.filter(team => 
      team.location.latitude < 23 && team.location.longitude < -154
    );
    
    // Cleanup function
    return () => {
      map.off('zoomend', handleZoomEnd);
      map.off('moveend', handleMoveEnd);
      clearTimeout(moveTimeout);
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
        style={{ height: "750px", width: "100%" }} // Taller map for better view
        whenCreated={(map) => {
          mapRef.current = map;
        }}
        minZoom={3} // Prevent zooming out too far
        maxBoundsViscosity={1.0} // Prevent dragging outside bounds
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          opacity={0.2} // Very faint base map to emphasize territories
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