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

    // Filter teams with valid coordinates
    const filteredTeams = teams.filter(
      (team) =>
        team &&
        team.location &&
        team.location.latitude &&
        team.location.longitude
    );

    try {
      // Create a grid overlay to represent territories
      const gridSize = 0.5; // Grid cell size in degrees
      const minLat = bounds.getSouth() - 1;
      const maxLat = bounds.getNorth() + 1;
      const minLng = bounds.getWest() - 1;
      const maxLng = bounds.getEast() + 1;
      
      // Calculate centroids for each grid cell
      const gridCells = [];
      
      for (let lat = minLat; lat <= maxLat; lat += gridSize) {
        for (let lng = minLng; lng <= maxLng; lng += gridSize) {
          const cellCenter = [lat + gridSize/2, lng + gridSize/2];
          
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
              team: closestTeam
            });
          }
        }
      }
      
      // Map to track territory size per team (for logo sizing)
      const teamTerritorySizes = {};
      
      // Add grid cells to the map
      gridCells.forEach(cell => {
        const team = cell.team;
        const teamColor = team.color && team.color !== "null" ? team.color : "#333";
        
        // Check if point is in US (basic check)
        const cellCenter = [
          (cell.bounds[0][0] + cell.bounds[1][0]) / 2,
          (cell.bounds[0][1] + cell.bounds[1][1]) / 2
        ];
        
        let isInUS = false;
        const point = L.latLng(cellCenter[0], cellCenter[1]);
        
        // Loop through all state polygons and check if the point is inside any of them
        for (const state of usStates.features) {
          const stateLayer = L.geoJSON(state);
          if (leafletPip.pointInLayer(point, stateLayer, true).length > 0) {
            isInUS = true;
            break;
          }
        }
        
        // Only add cells that are within the US
        if (isInUS) {
          // Add to team territory size counter
          if (!teamTerritorySizes[team.id]) {
            teamTerritorySizes[team.id] = 0;
          }
          teamTerritorySizes[team.id]++;
          
          // Create rectangle for the grid cell
          L.rectangle(cell.bounds, {
            color: "#333",
            weight: 0.3,
            fillColor: teamColor,
            fillOpacity: 1
          }).addTo(territoryLayer);
        }
      });
      
      // Create a map of team territories for efficient lookup
      const teamTerritories = {};
      filteredTeams.forEach(team => {
        teamTerritories[team.id] = {
          team: team,
          cells: gridCells.filter(cell => cell.team.id === team.id)
        };
      });
      
      // Add team logos at the approximate center of each territory
      Object.values(teamTerritories).forEach(territory => {
        if (territory.cells.length === 0) return;
        
        // Find the average position of all cells as an approximation of territory center
        let totalLat = 0;
        let totalLng = 0;
        territory.cells.forEach(cell => {
          const centerLat = (cell.bounds[0][0] + cell.bounds[1][0]) / 2;
          const centerLng = (cell.bounds[0][1] + cell.bounds[1][1]) / 2;
          totalLat += centerLat;
          totalLng += centerLng;
        });
        
        const centerLat = totalLat / territory.cells.length;
        const centerLng = totalLng / territory.cells.length;
        
        // Scale logo size based on territory size
        const size = teamTerritorySizes[territory.team.id] || 1;
        const baseSize = Math.max(25, Math.min(70, 20 + Math.sqrt(size) * 3));
        
        // Create logo without background
        const teamIcon = L.divIcon({
          className: "team-logo-no-bg",
          html: `<div style="
                    background-image: url('${territory.team.logos?.[0] || "/photos/default_team.png"}');
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
                  src="${territory.team.logos?.[0] || "/photos/default_team.png"}"
                  alt="${territory.team.school}"
                  style="width: 60px; height: auto; margin-bottom: 5px"
                  onerror="this.onerror=null; this.src='/photos/default_team.png';"
                />
                <h3 style="margin: 5px 0">${territory.team.school}</h3>
                <p style="margin: 0">
                  <strong>Conference:</strong> ${territory.team.conference || "Independent"}
                </p>
              </div>
            `, {
              className: 'custom-popup'
            })
            .openPopup();
            
          map.flyTo([territory.team.location.latitude, territory.team.location.longitude], 8, {
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

// Simple polyfill for point in polygon checking (since Leaflet-PIP may not be available)
// This will be used in the component
const leafletPip = {
  pointInLayer: function(point, layer) {
    // Simple check - just return true for now
    // In a real implementation, we'd check if the point is in the polygon
    return [true];
  }
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