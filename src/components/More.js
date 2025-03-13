import React, { useState, useEffect, useRef } from "react";
import teamsService from "../services/teamsService";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import usStates from "../data/us-states.json";
import * as turf from '@turf/turf';

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

// Advanced Territory Map with purely proximity-based approach
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
    
    // Set view to center of US
    const usCenter = [39.8283, -98.5795];
    map.setView(usCenter, 4);

    try {
      // First, add a base US map layer
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
      const usBounds = L.latLngBounds(
        L.latLng(bounds.getSouth() - 0.5, bounds.getWest() - 0.5),
        L.latLng(bounds.getNorth() + 0.5, bounds.getEast() + 0.5)
      );
      
      // Fit map to US bounds
      map.fitBounds(usBounds);
      
      // Filter teams to only include those within US bounds with padding
      const filteredTeams = teams.filter(team => {
        if (!team.location || !team.location.latitude || !team.location.longitude) {
          return false;
        }
        
        // Check if team is within expanded US bounds
        const expanded = usBounds.pad(0.2);
        return expanded.contains(L.latLng(team.location.latitude, team.location.longitude));
      });
      
      if (filteredTeams.length < 3) {
        console.warn("Not enough teams in US to generate map");
        return;
      }
      
      // Create a single GeoJSON of all US states for clipping
      const usShape = {
        type: "FeatureCollection",
        features: usStates.features
      };
      
      // Generate Voronoi diagram for the entire US based on team locations
      try {
        // Get all team points
        const points = filteredTeams.map(team => [
          team.location.longitude, 
          team.location.latitude
        ]);
        
        // Calculate the bounding box of the US with padding
        const bbox = turf.bbox(usShape);
        const paddedBbox = [
          bbox[0] - 5, // min lon with extra padding
          bbox[1] - 5, // min lat with extra padding
          bbox[2] + 5, // max lon with extra padding
          bbox[3] + 5  // max lat with extra padding
        ];
        
        // Create a Voronoi diagram from team points
        const voronoiDiagram = turf.voronoi(
          turf.points(points),
          { bbox: paddedBbox }
        );
        
        // Create a merged US polygon
        const mergedUs = turf.dissolve(usShape);
        
        // Process each Voronoi cell and clip with US boundary
        const teamTerritories = [];
        voronoiDiagram.features.forEach((cell, i) => {
          try {
            const team = filteredTeams[i];
            const teamColor = team.color && team.color !== "null" ? team.color : "#333";
            
            // Calculate cell area for scaling logo size
            const intersectedCell = turf.intersect(cell, mergedUs.features[0]);
            
            if (intersectedCell) {
              // Add team properties to the cell
              intersectedCell.properties = {
                team: team,
                color: teamColor,
                area: turf.area(intersectedCell)
              };
              
              teamTerritories.push(intersectedCell);
            }
          } catch (e) {
            console.warn(`Error processing cell for ${filteredTeams[i]?.school}:`, e);
          }
        });
        
        // Add the territory polygons to the map
        L.geoJSON(teamTerritories, {
          style: (feature) => {
            return {
              fillColor: feature.properties.color,
              weight: 0.8,
              opacity: 0.7,
              color: "#444",
              fillOpacity: 1
            };
          }
        }).addTo(territoryLayer);
        
        // Calculate centroids for logo placement
        teamTerritories.forEach(territory => {
          try {
            const team = territory.properties.team;
            const area = territory.properties.area;
            
            // Calculate centroid for logo placement
            const centroid = turf.centroid(territory);
            const coords = centroid.geometry.coordinates;
            
            // Scale logo size based on territory area
            const scaleFactor = Math.sqrt(area) / 35000;
            const baseSize = Math.max(25, Math.min(70, 30 * scaleFactor));
            
            // Create team logo without circular background
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
            
            // Add the logo marker
            const marker = L.marker(
              [coords[1], coords[0]],
              { icon: teamIcon, zIndexOffset: 1000 }
            ).addTo(territoryLayer);
            
            // Add click handler for the marker
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
          } catch (error) {
            console.warn(`Error creating marker:`, error);
          }
        });
        
        // Add state boundaries on top with minimal styling
        L.geoJSON(usStates, {
          style: {
            weight: 0.5,
            opacity: 0.5,
            color: "#444",
            fillOpacity: 0,
            fillColor: "transparent"
          }
        }).addTo(territoryLayer);
        
        // Add outer US border for a cleaner look
        L.geoJSON(usStates, {
          style: {
            weight: 2,
            opacity: 0.7,
            color: "#333",
            fill: false
          }
        }).addTo(territoryLayer);
      } catch (error) {
        console.error("Error generating Voronoi diagram:", error);
      }
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