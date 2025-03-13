import React, { useState, useEffect, useRef } from "react";
import teamsService from "../services/teamsService";
import { MapContainer, TileLayer, useMap, GeoJSON } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Delaunay } from "d3-delaunay";
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

// Basic Map Component - Just show states and markers
const USATerritorialMap = ({ teams }) => {
  const map = useMap();
  const layerRef = useRef(null);

  useEffect(() => {
    if (!teams || teams.length === 0) return;

    // Remove any existing layer
    if (layerRef.current) {
      map.removeLayer(layerRef.current);
    }

    // Set view to center of US
    const usCenter = [39.8283, -98.5795];
    map.setView(usCenter, 4);

    // Create a new layer group for polygons and markers
    const markerLayer = L.layerGroup().addTo(map);
    layerRef.current = markerLayer;

    try {
      // Add US states with light coloring
      const statesLayer = L.geoJSON(usStates, {
        style: {
          weight: 1,
          opacity: 0.8,
          color: "#555",
          fillOpacity: 0.1,
          fillColor: "#f8f8f8",
          dashArray: "2"
        }
      }).addTo(markerLayer);

      // Add circles for each team
      teams.forEach(team => {
        if (!team.location || !team.location.latitude || !team.location.longitude) {
          return;
        }

        const teamColor = team.color && team.color !== "null" ? team.color : "#333";
        
        // Create a circle with team color
        const circle = L.circle(
          [team.location.latitude, team.location.longitude], 
          {
            radius: 100000, // 100km radius
            color: teamColor,
            weight: 3,
            opacity: 0.8,
            fillColor: teamColor,
            fillOpacity: 0.4
          }
        ).addTo(markerLayer);
        
        circle.on("click", () => {
          map.flyTo([team.location.latitude, team.location.longitude], 8, {
            duration: 1.5
          });
        });
        
        // Add team logo marker with improved styling
        const size = 40;
        
        const teamIcon = L.divIcon({
          className: "team-logo-marker",
          html: `<div style="
                    background-image: url('${team.logos?.[0] || "/photos/default_team.png"}');
                    background-size: contain;
                    background-repeat: no-repeat;
                    background-position: center;
                    width: ${size}px;
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
        
        /* Team logo marker styling */
        .team-logo-marker {
          filter: drop-shadow(0 3px 5px rgba(0, 0, 0, 0.3));
          transition: transform 0.2s ease, filter 0.2s ease;
        }
        
        .team-logo-marker:hover {
          transform: scale(1.1) translateY(-3px);
          filter: drop-shadow(0 5px 10px rgba(0, 0, 0, 0.4));
          z-index: 1000 !important;
        }: ${size}px;
                    border-radius: 50%;
                    background-color: white;
                    box-shadow: 0 3px 14px rgba(0,0,0,0.4), 0 3px 6px rgba(0,0,0,0.4);">
                 </div>`,
          iconSize: [size, size],
          iconAnchor: [size / 2, size / 2]
        });

        const marker = L.marker(
          [team.location.latitude, team.location.longitude],
          { icon: teamIcon, zIndexOffset: 1000 }
        ).addTo(markerLayer);

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
            `)
            .openPopup();
            
          map.flyTo([team.location.latitude, team.location.longitude], 8, {
            duration: 1.5
          });
        });
      });
    } catch (error) {
      console.error("Error generating map:", error);
    }

    return () => {
      if (layerRef.current) {
        map.removeLayer(layerRef.current);
      }
    };
  }, [teams, map]);

  return null;
};

// Enhanced Voronoi Map strictly confined to US boundaries
const AdvancedUSATerritorialMap = ({ teams }) => {
  const map = useMap();
  const layerRef = useRef(null);

  // Helper function to determine if a state should be fully colored
  const getSingleTeamForState = (stateName, teamsInState) => {
    // If only one team in state, return that team
    if (teamsInState.length === 1) return teamsInState[0];
    
    // If a flagship state university exists, prioritize it
    const flagship = teamsInState.find(team => {
      const school = team.school.toLowerCase();
      const pattern = new RegExp(`university of ${stateName.toLowerCase()}|${stateName.toLowerCase()} state`);
      return pattern.test(school);
    });
    
    return flagship || null;
  };
  
  // Function to generate state-based coloring
  const createStateBasedColoring = (states, teamsByState) => {
    const stateFeatures = [];
    
    states.features.forEach(state => {
      const stateName = state.properties.name;
      const teamsInState = teamsByState[stateName] || [];
      
      // Get dominant team for the state if applicable
      const dominantTeam = getSingleTeamForState(stateName, teamsInState);
      
      if (dominantTeam) {
        // If there's a dominant team, color the whole state
        const teamColor = dominantTeam.color && dominantTeam.color !== "null" ? dominantTeam.color : "#333";
        
        stateFeatures.push({
          type: "Feature",
          properties: { 
            team: dominantTeam,
            color: teamColor,
            name: stateName,
            isDominant: true
          },
          geometry: state.geometry
        });
      }
      // If no dominant team but has teams, will be handled by Voronoi
    });
    
    return {
      type: "FeatureCollection",
      features: stateFeatures
    };
  };

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
    const voronoiLayer = L.layerGroup().addTo(map);
    layerRef.current = voronoiLayer;
    
    // Set view to center of US
    const usCenter = [39.8283, -98.5795];
    map.setView(usCenter, 4);

    try {
      // First, add a nicer base US map layer
      const baseUSA = L.geoJSON(usStates, {
        style: {
          weight: 0.5,
          opacity: 0.7,
          color: "#888",
          fillOpacity: 0.05,
          fillColor: "#f8f8f8"
        }
      }).addTo(voronoiLayer);

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
      
      // Group teams by state for dominant team analysis
      const teamsByState = {};
      
      filteredTeams.forEach(team => {
        // Find which state the team is in
        const teamPoint = [team.location.longitude, team.location.latitude];
        
        for (const feature of usStates.features) {
          const stateName = feature.properties.name;
          
          if (feature.geometry.type === 'Polygon') {
            if (turf.booleanPointInPolygon(teamPoint, feature.geometry)) {
              if (!teamsByState[stateName]) teamsByState[stateName] = [];
              teamsByState[stateName].push(team);
              break;
            }
          } else if (feature.geometry.type === 'MultiPolygon') {
            const multiPoly = turf.multiPolygon(feature.geometry.coordinates);
            if (turf.booleanPointInPolygon(teamPoint, multiPoly)) {
              if (!teamsByState[stateName]) teamsByState[stateName] = [];
              teamsByState[stateName].push(team);
              break;
            }
          }
        }
      });
      
      // Create state-based coloring for dominant teams
      const stateBasedColoring = createStateBasedColoring(usStates, teamsByState);
      
      // Add solid colored states for dominant teams
      const dominantStatesLayer = L.geoJSON(stateBasedColoring, {
        style: (feature) => {
          return {
            fillColor: feature.properties.color,
            weight: 0.8,
            opacity: 1,
            color: "#fff",
            fillOpacity: 0.8
          };
        },
        onEachFeature: (feature, layer) => {
          const team = feature.properties.team;
          
          layer.on("click", () => {
            map.flyTo([team.location.latitude, team.location.longitude], 8, {
              duration: 1.5
            });
          });

          layer.bindPopup(`
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
              <p style="margin: 5px 0"><em>Dominant team in ${feature.properties.name}</em></p>
            </div>
          `);
        }
      }).addTo(voronoiLayer);
      
      // Create a list of states that already have dominant teams
      const dominantStateNames = stateBasedColoring.features.map(f => f.properties.name);
      
      // Filter out teams from dominant states for Voronoi generation
      const teamsForVoronoi = filteredTeams.filter(team => {
        const teamPoint = [team.location.longitude, team.location.latitude];
        
        for (const feature of usStates.features) {
          const stateName = feature.properties.name;
          
          // Skip if state already has a dominant team
          if (dominantStateNames.includes(stateName)) continue;
          
          if (feature.geometry.type === 'Polygon') {
            if (turf.booleanPointInPolygon(teamPoint, feature.geometry)) {
              return true;
            }
          } else if (feature.geometry.type === 'MultiPolygon') {
            const multiPoly = turf.multiPolygon(feature.geometry.coordinates);
            if (turf.booleanPointInPolygon(teamPoint, multiPoly)) {
              return true;
            }
          }
        }
        
        return false;
      });
      
      // If we have teams for Voronoi, generate them
      if (teamsForVoronoi.length >= 3) {
        // Create a USA GeoJSON that excludes states with dominant teams
        const remainingStates = {
          type: "FeatureCollection",
          features: usStates.features.filter(f => !dominantStateNames.includes(f.properties.name))
        };
        
        // Generate points for Voronoi
        const points = teamsForVoronoi.map(team => [
          team.location.longitude, 
          team.location.latitude, 
          team
        ]);
        
        // Create Voronoi Polygons
        const voronoiPolygons = [];
        
        // Calculate the bounding box of remaining states
        const bbox = turf.bbox(remainingStates);
        
        // Add padding to bbox
        const paddedBbox = [
          bbox[0] - 1, // min lon
          bbox[1] - 1, // min lat
          bbox[2] + 1, // max lon
          bbox[3] + 1  // max lat
        ];
        
        // Create Voronoi diagram
        const voronoiCells = turf.voronoi(
          turf.featureCollection(points.map(p => turf.point([p[0], p[1]]))),
          { bbox: paddedBbox }
        );
        
        // Intersect Voronoi cells with USA shape
        voronoiCells.features.forEach((cell, i) => {
          const team = teamsForVoronoi[i];
          const teamColor = team.color && team.color !== "null" ? team.color : "#333";
          
          try {
            // Create a polygon with all remaining states
            const statesPolygon = turf.combine(remainingStates);
            
            // Intersect the Voronoi cell with the states shape
            const intersection = turf.intersect(cell, statesPolygon.features[0]);
            
            if (intersection) {
              // Add the team properties to the clipped polygon
              intersection.properties = {
                team: team,
                color: teamColor
              };
              
              voronoiPolygons.push(intersection);
            }
          } catch (e) {
            console.warn(`Error processing Voronoi cell for team ${i}:`, e);
          }
        });
        
        // Create a GeoJSON collection of the clipped Voronoi cells
        const clippedVoronoi = {
          type: "FeatureCollection",
          features: voronoiPolygons
        };
        
        // Add the Voronoi polygons to the map
        const voronoiGeoJSON = L.geoJSON(clippedVoronoi, {
          style: (feature) => {
            return {
              fillColor: feature.properties.color,
              weight: 1.2,
              opacity: 1,
              color: "#fff",
              fillOpacity: 0.7
            };
          },
          onEachFeature: (feature, layer) => {
            const team = feature.properties.team;
            
            layer.on("click", () => {
              map.flyTo([team.location.latitude, team.location.longitude], 8, {
                duration: 1.5
              });
            });

            layer.bindPopup(`
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
          }
        }).addTo(voronoiLayer);
      }
      
      // Add state boundaries on top with improved styling
      L.geoJSON(usStates, {
        style: {
          weight: 1.5,
          opacity: 0.7,
          color: "#666",
          fillOpacity: 0,
          dashArray: "3,3",
          fillColor: "transparent"
        }
      }).addTo(voronoiLayer);
      
      // Add outer US border for a cleaner look
      L.geoJSON(usStates, {
        style: {
          weight: 3,
          opacity: 0.9,
          color: "#444",
          fill: false
        }
      }).addTo(voronoiLayer);
      
      // Create a visual offset counter to scale logo sizes inversely with density
      const locationCounts = {};
      
      filteredTeams.forEach(team => {
        const key = `${Math.round(team.location.latitude * 10)},${Math.round(team.location.longitude * 10)}`;
        if (!locationCounts[key]) locationCounts[key] = 0;
        locationCounts[key]++;
      });
      
      // Add team logo markers on top with scaling based on density
      filteredTeams.forEach(team => {
        try {
          const key = `${Math.round(team.location.latitude * 10)},${Math.round(team.location.longitude * 10)}`;
          const density = locationCounts[key] || 1;
          
          // Scale logo size inversely with density
          let baseSize = 40;
          if (density > 1) baseSize = Math.max(24, 40 - (density * 4));
          
          const teamIcon = L.divIcon({
            className: "team-logo-marker",
            html: `<div style="
                      background-image: url('${team.logos?.[0] || "/photos/default_team.png"}');
                      background-size: contain;
                      background-repeat: no-repeat;
                      background-position: center;
                      width: ${baseSize}px;
                      height: ${baseSize}px;
                      border-radius: 50%;
                      background-color: white;
                      box-shadow: 0 3px 14px rgba(0,0,0,0.4), 0 3px 6px rgba(0,0,0,0.2);
                      border: 1px solid rgba(255,255,255,0.8);">
                   </div>`,
            iconSize: [baseSize, baseSize],
            iconAnchor: [baseSize / 2, baseSize / 2]
          });

          const marker = L.marker(
            [team.location.latitude, team.location.longitude],
            { icon: teamIcon, zIndexOffset: 1000 }
          ).addTo(voronoiLayer);

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
                className: 'custom-popup' // For custom styling
              })
              .openPopup();
              
            map.flyTo([team.location.latitude, team.location.longitude], 8, {
              duration: 1.5
            });
          });
        } catch (error) {
          console.warn(`Error creating marker for team:`, error);
        }
      });
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
  const [mapMode, setMapMode] = useState("voronoi"); // Default to voronoi for better looks
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

  // Helper function to fly to a team's location
  const flyToTeam = (lat, lng) => {
    if (mapRef.current) {
      mapRef.current.flyTo([lat, lng], 8, { duration: 1.5 });
    }
  };

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
      
      {/* Map selection controls */}
      <div className="map-controls">
        <label className={mapMode === "basic" ? "active" : ""}>
          <input
            type="radio"
            value="basic"
            checked={mapMode === "basic"}
            onChange={() => setMapMode("basic")}
          />
          Basic Map (Markers + Circles)
        </label>
        <label className={mapMode === "voronoi" ? "active" : ""}>
          <input
            type="radio"
            value="voronoi"
            checked={mapMode === "voronoi"}
            onChange={() => setMapMode("voronoi")}
          />
          Territory Map (Team Regions)
        </label>
      </div>
      
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
            opacity={0.3}
          />
          {validTeams.length > 0 && mapMode === "basic" && (
            <USATerritorialMap teams={validTeams} />
          )}
          {validTeams.length > 0 && mapMode === "voronoi" && (
            <AdvancedUSATerritorialMap teams={validTeams} />
          )}
        </MapContainer>
      </div>

      {/* Add a key/legend for the maps */}
      <div className="map-legend">
        {mapMode === "voronoi" && (
          <p>Each colored region represents a team's territory. States with a single dominant team are filled with that team's color, while contested areas are divided based on proximity. Click on a territory or team logo to see details.</p>
        )}
        
        {mapMode === "basic" && (
          <p>Each team is represented by its logo and a colored circle. Click on a logo to see team details.</p>
        )}
      </div>

      {/* Team list */}
      <div className="team-list-section">
        <h2>Team List</h2>
        <div className="team-list">
          {validTeams.map((team) => (
            <div
              key={team.id}
              className="team-item"
              style={{
                backgroundColor:
                  team.color && team.color !== "null" ? team.color : "#333"
              }}
              onClick={() =>
                flyToTeam(team.location.latitude, team.location.longitude)
              }
            >
              <div
                className="team-logo"
                style={{
                  backgroundImage: `url('${team.logos?.[0] || "/photos/default_team.png"}')`
                }}
              />
              <span className="team-name">{team.school}</span>
            </div>
          ))}
        </div>
      </div>

      {/* CSS for logo markers and other styling */}
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
        
        .map-controls {
          display: flex;
          justify-content: center;
          margin-bottom: 20px;
          gap: 20px;
        }
        
        .map-controls label {
          display: inline-flex;
          align-items: center;
          padding: 8px 16px;
          background: #f0f0f0;
          border-radius: 30px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .map-controls label.active {
          background: #333;
          color: white;
        }
        
        .map-controls input {
          margin-right: 8px;
        }
        
        .map-container {
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 6px 24px rgba(0, 0, 0, 0.15);
        }
        
        .map-legend {
          margin-top: 15px;
          padding: 12px;
          background: #f8f8f8;
          border-radius: 8px;
          font-size: 14px;
          color: #555;
          line-height: 1.5;
        }
        
        .team-list-section {
          margin-top: 30px;
        }
        
        .team-list {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 12px;
          max-height: 400px;
          overflow-y: auto;
          padding: 5px;
        }
        
        .team-item {
          display: flex;
          align-items: center;
          padding: 10px;
          border-radius: 8px;
          cursor: pointer;
          color: white;
          transition: all 0.2s ease;
          text-shadow: 1px 1px 2px rgba(0,0,0,0.7);
          box-shadow: 0 3px 8px rgba(0,0,0,0.1);
        }
        
        .team-item:hover {
          transform: translateY(-3px);
          box-shadow: 0 6px 16px rgba(0,0,0,0.15);
        }
        
        .team-logo {
          width: 28px;
          height: 28px;
          margin-right: 12px;
          background-size: contain;
          background-position: center;
          background-repeat: no-repeat;
          flex-shrink: 0;
          border-radius: 50%;
          background-color: white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
        
        .team-name {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          font-weight: 500;
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

/* Team logo marker styling */
.team-logo-marker {
  filter: drop-shadow(0 3px 5px rgba(0, 0, 0, 0.3));
  transition: transform 0.2s ease, filter 0.2s ease;
}

.team-logo-marker:hover {
  transform: scale(1.1) translateY(-3px);
  filter: drop-shadow(0 5px 10px rgba(0, 0, 0, 0.4));
  z-index: 1000 !important;
}
        `}</style>
        </div>
    );
    }

export default More;