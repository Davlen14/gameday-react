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

// Improved point in polygon test with better handling of edge cases
const pointInPolygon = (point, polygon) => {
  let inside = false;
  const x = point[0], y = point[1];
  
  // First check if point is exactly on any vertex
  for (let i = 0; i < polygon.length; i++) {
    if (Math.abs(x - polygon[i][0]) < 0.0001 && Math.abs(y - polygon[i][1]) < 0.0001) {
      return true; // Point is exactly on a vertex
    }
  }
  
  // Then check if point is on any edge
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0], yi = polygon[i][1];
    const xj = polygon[j][0], yj = polygon[j][1];
    
    // Check if point is on horizontal edge
    if (Math.abs(yi - yj) < 0.0001 && Math.abs(y - yi) < 0.0001 && 
        x >= Math.min(xi, xj) && x <= Math.max(xi, xj)) {
      return true;
    }
    
    // Check if point is on vertical edge
    if (Math.abs(xi - xj) < 0.0001 && Math.abs(x - xi) < 0.0001 && 
        y >= Math.min(yi, yj) && y <= Math.max(yi, yj)) {
      return true;
    }
    
    // Standard ray casting algorithm for other points
    const intersect = ((yi > y) !== (yj > y)) &&
        (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  
  return inside;
};

// Improved function to check if a point is within the US boundaries
const isPointInUS = (point, states) => {
  // Apply a small buffer for points near boundaries
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

// Helper function to get state boundaries as GeoJSON
const getStateBoundaries = (usStates) => {
  const boundaries = [];
  
  usStates.features.forEach(state => {
    const stateName = state.properties.name;
    boundaries.push({
      name: stateName,
      geometry: state.geometry
    });
  });
  
  return boundaries;
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

    // Define continental US bounds
    const continentalUS = {
      south: 24.396308, // Southern tip of Florida
      north: 49.384358, // Northern border with Canada
      west: -125.0, // Western coast
      east: -66.93457  // Eastern coast
    };

    // Filter teams with valid coordinates within US bounds
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
      // Get state boundaries
      const stateBoundaries = getStateBoundaries(usStates);
      
      // Create a grid overlay to represent territories
      const gridSize = 0.15; // Smaller grid size for better resolution
      const minLat = continentalUS.south - 0.1;
      const maxLat = continentalUS.north + 0.1;
      const minLng = continentalUS.west - 0.1;
      const maxLng = continentalUS.east + 0.1;
      
      // Calculate grid cells for the entire US
      const gridCells = [];
      
      // Process each state boundary to ensure no gaps
      stateBoundaries.forEach(state => {
        // Create a finer grid for each state
        if (state.geometry.type === 'Polygon') {
          const coordinates = state.geometry.coordinates[0];
          const bbox = getBoundingBox(coordinates);
          
          // Create grid cells within state bounds
          for (let lat = bbox.minLat; lat <= bbox.maxLat; lat += gridSize) {
            for (let lng = bbox.minLng; lng <= bbox.maxLng; lng += gridSize) {
              const cellCenter = [lat + gridSize/2, lng + gridSize/2];
              
              // Check if point is in state
              if (pointInPolygon([cellCenter[1], cellCenter[0]], coordinates)) {
                // Find closest team
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
                    center: cellCenter,
                    state: state.name
                  });
                }
              }
            }
          }
        } else if (state.geometry.type === 'MultiPolygon') {
          state.geometry.coordinates.forEach(polyCoords => {
            const coordinates = polyCoords[0];
            const bbox = getBoundingBox(coordinates);
            
            // Create grid cells within state bounds
            for (let lat = bbox.minLat; lat <= bbox.maxLat; lat += gridSize) {
              for (let lng = bbox.minLng; lng <= bbox.maxLng; lng += gridSize) {
                const cellCenter = [lat + gridSize/2, lng + gridSize/2];
                
                // Check if point is in state
                if (pointInPolygon([cellCenter[1], cellCenter[0]], coordinates)) {
                  // Find closest team
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
                      center: cellCenter,
                      state: state.name
                    });
                  }
                }
              }
            }
          });
        }
      });
      
      // Get bounding box of polygon coordinates
      function getBoundingBox(coordinates) {
        let minLat = Infinity;
        let maxLat = -Infinity;
        let minLng = Infinity;
        let maxLng = -Infinity;
        
        coordinates.forEach(point => {
          const lng = point[0];
          const lat = point[1];
          
          minLat = Math.min(minLat, lat);
          maxLat = Math.max(maxLat, lat);
          minLng = Math.min(minLng, lng);
          maxLng = Math.max(maxLng, lng);
        });
        
        return { minLat, maxLat, minLng, maxLng };
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
          weight: 0.2,  // Thinner borders
          fillColor: teamColor,
          fillOpacity: 1
        }).addTo(territoryLayer);
      });
      
      // Add team logos at the approximate center of each territory
      Object.keys(teamCells).forEach(teamId => {
        const cells = teamCells[teamId];
        if (cells.length === 0) return;
        
        const team = cells[0].team; // All cells have the same team
        
        // Find centroid using weighted approach for more natural placement
        let weightedLat = 0;
        let weightedLng = 0;
        let totalCells = cells.length;
        
        // Group cells by state for better logo positioning
        const stateGroups = {};
        cells.forEach(cell => {
          if (!stateGroups[cell.state]) {
            stateGroups[cell.state] = [];
          }
          stateGroups[cell.state].push(cell);
        });
        
        // Find the state with the most cells
        let maxCells = 0;
        let primaryState = null;
        Object.keys(stateGroups).forEach(state => {
          if (stateGroups[state].length > maxCells) {
            maxCells = stateGroups[state].length;
            primaryState = state;
          }
        });
        
        // Calculate center based on primary state if available, otherwise use all cells
        const cellsToUse = primaryState ? stateGroups[primaryState] : cells;
        
        cellsToUse.forEach(cell => {
          weightedLat += cell.center[0];
          weightedLng += cell.center[1];
        });
        
        const centerLat = weightedLat / cellsToUse.length;
        const centerLng = weightedLng / cellsToUse.length;
        
        // Scale logo size based on territory size
        const size = teamTerritorySizes[teamId];
        const baseSize = Math.max(25, Math.min(70, 20 + Math.sqrt(size) * 2));
        
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
      
      // Add state boundaries on top with thinner lines
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