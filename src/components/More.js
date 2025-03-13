import React, { useState, useEffect, useRef } from "react";
import teamsService from "../services/teamsService";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import usStates from "../data/us-states.json";

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

// Utility function to calculate distance between two points
const getDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  const d = R * c; // Distance in km
  return d;
};

const deg2rad = (deg) => {
  return deg * (Math.PI/180);
};

// Point in polygon test - returns true if the point is in the polygon
const pointInPolygon = (point, polygon) => {
  // Ray-casting algorithm
  let inside = false;
  const x = point[0], y = point[1];
  
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0], yi = polygon[i][1];
    const xj = polygon[j][0], yj = polygon[j][1];
    
    const intersect = ((yi > y) !== (yj > y))
        && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  
  return inside;
};

// Check if a point is within the US boundaries
const isPointInUS = (point, states) => {
  for (const state of states.features) {
    if (state.geometry.type === 'Polygon') {
      if (pointInPolygon([point[1], point[0]], state.geometry.coordinates[0])) {
        return true;
      }
    } else if (state.geometry.type === 'MultiPolygon') {
      for (const polygon of state.geometry.coordinates) {
        if (pointInPolygon([point[1], point[0]], polygon[0])) {
          return true;
        }
      }
    }
  }
  return false;
};

// Generate a grid-based territory map
const CollegeFootballTerritoryMap = ({ teams }) => {
  const map = useMap();
  const layerRef = useRef(null);

  useEffect(() => {
    if (!teams || teams.length < 3) {
      console.warn("Not enough teams to generate territorial map");
      return;
    }

    // Remove any existing layer
    if (layerRef.current) {
      map.removeLayer(layerRef.current);
    }

    // Create a new layer group
    const territoryLayer = L.layerGroup().addTo(map);
    layerRef.current = territoryLayer;

    // First, add base US map layer with minimal styling
    const baseUSA = L.geoJSON(usStates, {
      style: {
        weight: 0.5,
        opacity: 0.5,
        color: "#444",
        fillOpacity: 0,
        fillColor: "transparent"
      }
    }).addTo(territoryLayer);

    // Get the bounds of the US
    const bounds = baseUSA.getBounds();
    map.fitBounds(bounds);

    // Define continental US bounds more strictly
    const continentalUS = {
      south: 24.396308, // Southern tip of Florida
      north: 49.384358, // Northern border with Canada
      west: -125.0, // Western coast
      east: -66.93457  // Eastern coast
    };

    // Filter teams with valid coordinates that are clearly within US bounds
    const filteredTeams = teams.filter(
      (team) => {
        if (!team || !team.location || !team.location.latitude || !team.location.longitude) {
          return false;
        }
        
        // Exclude teams outside the continental US
        if (team.location.latitude < continentalUS.south || 
            team.location.latitude > continentalUS.north ||
            team.location.longitude < continentalUS.west || 
            team.location.longitude > continentalUS.east) {
          return false;
        }
        
        return true;
      }
    );

    try {
      // Precompute the US border shape as a collection of boundary points
      const usBorderPoints = [];
      usStates.features.forEach(state => {
        if (state.geometry.type === 'Polygon') {
          usBorderPoints.push(...state.geometry.coordinates[0]);
        } else if (state.geometry.type === 'MultiPolygon') {
          state.geometry.coordinates.forEach(poly => {
            usBorderPoints.push(...poly[0]);
          });
        }
      });

      // Create a grid overlay to represent territories
      const gridSize = 0.3; // Grid cell size in degrees - smaller for better resolution
      const minLat = continentalUS.south - 0.1;
      const maxLat = continentalUS.north + 0.1;
      const minLng = continentalUS.west - 0.1;
      const maxLng = continentalUS.east + 0.1;
      
      // Calculate grid cells for the entire US
      const gridCells = [];
      
      for (let lat = minLat; lat <= maxLat; lat += gridSize) {
        for (let lng = minLng; lng <= maxLng; lng += gridSize) {
          const cellCenter = [lat + gridSize/2, lng + gridSize/2];
          
          // First check if this point is likely in the US
          if (!isPointInUS([cellCenter[0], cellCenter[1]], usStates)) {
            continue; // Skip points outside the US
          }
          
          // Determine which team is closest to this cell
          let closestTeam = null;
          let minDistance = Infinity;
          
          filteredTeams.forEach(team => {
            const distance = getDistance(
              cellCenter[0], 
              cellCenter[1], 
              team.location.latitude, 
              team.location.longitude
            );
            
            if (distance < minDistance) {
              minDistance = distance;
              closestTeam = team;
            }
          });
          
          if (closestTeam) {
            gridCells.push({
              bounds: [[lat, lng], [lat + gridSize, lng + gridSize]],
              team: closestTeam,
              center: cellCenter
            });
          }
        }
      }
      
      // Map to track territory size per team (for logo sizing)
      const teamTerritorySizes = {};
      const teamCells = {};
      
      // Add grid cells to the map
      gridCells.forEach(cell => {
        const team = cell.team;
        const teamColor = team.color && team.color !== "null" ? team.color : "#333";
          
        // Add to team territory counter
        if (!teamTerritorySizes[team.id]) {
          teamTerritorySizes[team.id] = 0;
          teamCells[team.id] = [];
        }
        teamTerritorySizes[team.id]++;
        teamCells[team.id].push(cell);
        
        // Create rectangle for the grid cell
        L.rectangle(cell.bounds, {
          color: "#222",
          weight: 0.3,
          fillColor: teamColor,
          fillOpacity: 1
        }).addTo(territoryLayer);
      });
      
      // Add team logos at the approximate center of each territory
      Object.keys(teamCells).forEach(teamId => {
        const cells = teamCells[teamId];
        if (cells.length === 0) return;
        
        const team = cells[0].team; // All cells have the same team
        
        // Find the average position of all cells as an approximation of territory center
        let totalLat = 0;
        let totalLng = 0;
        cells.forEach(cell => {
          totalLat += cell.center[0];
          totalLng += cell.center[1];
        });
        
        const centerLat = totalLat / cells.length;
        const centerLng = totalLng / cells.length;
        
        // Scale logo size based on territory size
        const size = teamTerritorySizes[teamId];
        const baseSize = Math.max(25, Math.min(65, 20 + Math.sqrt(size) * 2.5));
        
        // Create logo without background
        const teamIcon = L.divIcon({
          className: "team-logo-no-bg",
          html: `<div style="
                    background-image: url('${team.logos?.[0] || "/photos/default_team.png"}');
                    background-size: contain;
                    background-repeat: no-repeat;
                    background-position: center;
                    width: ${baseSize}px;
                    height: ${baseSize}px;">
                 </div>`,
          iconSize: [baseSize, baseSize],
          iconAnchor: [baseSize / 2, baseSize / 2]
        });
        
        // Add marker
        const marker = L.marker(
          [centerLat, centerLng],
          { icon: teamIcon, zIndexOffset: 1000 }
        ).addTo(territoryLayer);
        
        // Add click handler
        marker.on("click", () => {
          marker
            .bindPopup(`
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
            `, {
              className: 'custom-popup'
            })
            .openPopup();
            
          map.flyTo([team.location.latitude, team.location.longitude], 8, {
            duration: 1.5
          });
        });
      });
      
      // Add state boundaries on top
      L.geoJSON(usStates, {
        style: {
          weight: 0.8,
          opacity: 0.6,
          color: "#333",
          fillOpacity: 0,
          fillColor: "transparent"
        }
      }).addTo(territoryLayer);
      
      // Add outer US border
      L.geoJSON(usStates, {
        style: {
          weight: 2,
          opacity: 0.8,
          color: "#111",
          fill: false
        }
      }).addTo(territoryLayer);
      
    } catch (error) {
      console.error("Error generating territory map:", error);
    }

    return () => {
      if (layerRef.current) {
        map.removeLayer(layerRef.current);
      }
    };
  }, [teams, map]);

  return null;
};

// Main component
const More = () => {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const mapRef = useRef(null);

  // Fetch teams from the API
  useEffect(() => {
    const fetchTeams = async () => {
      try {
        setLoading(true);
        const data = await teamsService.getTeams();
        // Filter for FBS teams with valid coordinates
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

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading FBS teams...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error-icon">⚠️</div>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Try Again</button>
      </div>
    );
  }

  const validTeams = teams.filter((team) => team && team.id);

  return (
    <div className="territory-map-container">
      <h1>College Football Team Territories</h1>
      
      {/* Map container */}
      <div className="map-container">
        <MapContainer
          center={[39.8283, -98.5795]}
          zoom={4}
          style={{ height: "700px", width: "100%" }}
          whenCreated={(map) => {
            mapRef.current = map;
          }}
          zoomControl={true}
          dragging={true}
          touchZoom={true}
          scrollWheelZoom={true}
          doubleClickZoom={true}
          boxZoom={true}
          keyboard={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org">OSM</a> contributors'
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            opacity={0.1}
          />
          {validTeams.length > 0 && (
            <CollegeFootballTerritoryMap teams={validTeams} />
          )}
        </MapContainer>
      </div>

      {/* Map description */}
      <div className="map-legend">
        <p>Each colored region represents a team's territory based on proximity. Teams extend their influence until reaching another team's territory. Click on a team logo to see details.</p>
      </div>

      {/* CSS for styling */}
      <style jsx global>{`
        .territory-map-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
        }
        
        h1 {
          text-align: center;
          color: #333;
          margin-bottom: 20px;
        }
        
        .map-container {
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 6px 24px rgba(0, 0, 0, 0.15);
          margin-bottom: 15px;
        }
        
        .map-legend {
          padding: 12px;
          background: #f8f8f8;
          border-radius: 8px;
          font-size: 14px;
          color: #555;
          line-height: 1.5;
        }
        
        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 300px;
        }
        
        .loading-spinner {
          border: 4px solid rgba(0, 0, 0, 0.1);
          border-left-color: #333;
          border-radius: 50%;
          width: 30px;
          height: 30px;
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        .error-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 300px;
          color: #d32f2f;
        }
        
        .error-icon {
          font-size: 36px;
          margin-bottom: 12px;
        }
        
        .error-container button {
          margin-top: 16px;
          padding: 8px 16px;
          background: #333;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }
        
        /* Custom popup styling */
        .custom-popup .leaflet-popup-content-wrapper {
          background: rgba(255, 255, 255, 0.95);
          border-radius: 8px;
          box-shadow: 0 5px 20px rgba(0,0,0,0.15);
        }
        
        .custom-popup .leaflet-popup-tip {
          background: rgba(255, 255, 255, 0.95);
        }
        
        /* Team logo marker styling - no background */
        .team-logo-no-bg {
          filter: drop-shadow(1px 2px 3px rgba(0, 0, 0, 0.5));
          z-index: 1000 !important;
        }
        
        .team-logo-no-bg:hover {
          transform: scale(1.1);
          filter: drop-shadow(2px 4px 6px rgba(0, 0, 0, 0.6));
        }
      `}</style>
    </div>
  );
};

export default More;