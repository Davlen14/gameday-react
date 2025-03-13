import React, { useState, useEffect, useRef } from "react";
import teamsService from "../services/teamsService";
import { MapContainer, TileLayer, useMap, GeoJSON } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Delaunay } from "d3-delaunay";
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
          opacity: 1,
          color: "#666",
          fillOpacity: 0.1,
          fillColor: "#eee"
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
            weight: 2,
            opacity: 0.8,
            fillColor: teamColor,
            fillOpacity: 0.3
          }
        ).addTo(markerLayer);
        
        circle.on("click", () => {
          map.flyTo([team.location.latitude, team.location.longitude], 8, {
            duration: 1.5
          });
        });
        
        // Add team logo marker - Transparent background
        const size = 40;
        
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
                    background-color: transparent;
                    box-shadow: 0 0 8px rgba(0,0,0,0.6);">
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

// Advanced Voronoi Map clipped to US boundaries
const AdvancedUSATerritorialMap = ({ teams }) => {
  const map = useMap();
  const layerRef = useRef(null);

  useEffect(() => {
    if (!teams || teams.length < 3) {
      console.warn("Not enough teams to generate Voronoi diagram");
      return;
    }

    // Remove any existing layer
    if (layerRef.current) {
      map.removeLayer(layerRef.current);
    }

    // Set view to center of US
    const usCenter = [39.8283, -98.5795];
    map.setView(usCenter, 4);

    // Create a new layer group for polygons and markers
    const voronoiLayer = L.layerGroup().addTo(map);
    layerRef.current = voronoiLayer;

    try {
      // First, add US states outline
      const statesLayer = L.geoJSON(usStates, {
        style: {
          weight: 2,
          opacity: 1,
          color: "#444",
          fillOpacity: 0,
          fillColor: "#eee"
        }
      }).addTo(voronoiLayer);

      // Define US continental bounds for Voronoi
      const bounds = statesLayer.getBounds();
      const continentalBounds = L.latLngBounds(
        L.latLng(bounds.getSouth() - 1, bounds.getWest() - 1),
        L.latLng(bounds.getNorth() + 1, bounds.getEast() + 1)
      );
      
      // Adjust the map view to US continental bounds
      map.fitBounds(continentalBounds);

      // Filter teams to only include those within continental US with some padding
      const filteredTeams = teams.filter(team => {
        if (!team.location || !team.location.latitude || !team.location.longitude) {
          return false;
        }
        
        // Check if team is within expanded continental US bounds (with some margin)
        const expanded = continentalBounds.pad(0.3); // 30% padding
        return expanded.contains(L.latLng(team.location.latitude, team.location.longitude));
      });

      if (filteredTeams.length < 3) {
        console.warn("Not enough teams in continental US to generate Voronoi diagram");
        return;
      }

      // Create canvas for clipping
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const width = 1000;
      const height = 600;
      canvas.width = width;
      canvas.height = height;
      
      // Function to convert lat/lng to canvas coordinates
      const projectToCanvas = (latlng) => {
        const boundWidth = continentalBounds.getEast() - continentalBounds.getWest();
        const boundHeight = continentalBounds.getNorth() - continentalBounds.getSouth();
        
        const x = ((latlng[1] - continentalBounds.getWest()) / boundWidth) * width;
        const y = ((continentalBounds.getNorth() - latlng[0]) / boundHeight) * height;
        
        return [x, y];
      };
      
      // Draw US states on canvas for clipping
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#000000';
      
      usStates.features.forEach(feature => {
        ctx.beginPath();
        
        if (feature.geometry.type === 'Polygon') {
          feature.geometry.coordinates.forEach(ring => {
            ring.forEach((coord, i) => {
              const [x, y] = projectToCanvas([coord[1], coord[0]]);
              if (i === 0) ctx.moveTo(x, y);
              else ctx.lineTo(x, y);
            });
          });
        } else if (feature.geometry.type === 'MultiPolygon') {
          feature.geometry.coordinates.forEach(polygon => {
            polygon.forEach(ring => {
              ring.forEach((coord, i) => {
                const [x, y] = projectToCanvas([coord[1], coord[0]]);
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
              });
            });
          });
        }
        
        ctx.fill();
      });
      
      // Convert teams into points for Voronoi generation
      const points = filteredTeams.map(team => {
        const [x, y] = projectToCanvas([team.location.latitude, team.location.longitude]);
        return [x, y, team];
      });
      
      // Create Delaunay triangulation and Voronoi diagram
      const delaunay = Delaunay.from(points.map(p => [p[0], p[1]]));
      const voronoi = delaunay.voronoi([0, 0, width, height]);
      
      // Generate GeoJSON-like structure for each Voronoi cell
      const voronoiPolygons = [];
      
      points.forEach((point, i) => {
        try {
          const cell = voronoi.cellPolygon(i);
          if (!cell) return;
          
          const team = point[2];
          const teamColor = team.color && team.color !== "null" ? team.color : "#333";
          
          // Convert canvas coordinates back to lat/lng
          const boundWidth = continentalBounds.getEast() - continentalBounds.getWest();
          const boundHeight = continentalBounds.getNorth() - continentalBounds.getSouth();
          
          const latlngPolygon = cell.map(p => {
            if (p[0] < 0 || p[0] > width || p[1] < 0 || p[1] > height) {
              return null;
            }
            
            const lng = (p[0] / width) * boundWidth + continentalBounds.getWest();
            const lat = continentalBounds.getNorth() - (p[1] / height) * boundHeight;
            
            return [lat, lng];
          }).filter(p => p !== null);
          
          if (latlngPolygon.length < 3) return;
          
          // Create the GeoJSON-like feature
          voronoiPolygons.push({
            type: "Feature",
            properties: { team: team, color: teamColor },
            geometry: {
              type: "Polygon",
              coordinates: [latlngPolygon]
            }
          });
        } catch (e) {
          console.warn(`Error processing Voronoi cell for team ${i}:`, e);
        }
      });
      
      // Create a combined GeoJSON object
      const voronoiGeoJSON = {
        type: "FeatureCollection",
        features: voronoiPolygons
      };
      
      // Clip the Voronoi cells to the US shape
      const clippedVoronoi = {
        type: "FeatureCollection",
        features: []
      };
      
      // Function to check if a point is inside US (using canvas)
      const isPointInUS = (x, y) => {
        const pixelData = ctx.getImageData(x, y, 1, 1).data;
        // Black means inside the US
        return pixelData[0] < 128;
      };
      
      // Clip each Voronoi polygon to US shape
      voronoiGeoJSON.features.forEach(feature => {
        try {
          const team = feature.properties.team;
          const teamColor = feature.properties.color;
          
          // Check if most points of the polygon are within US
          const coords = feature.geometry.coordinates[0];
          const canvasCoords = coords.map(p => projectToCanvas(p));
          
          // Filter points to only those inside the US
          const validPoints = canvasCoords.filter(p => 
            p[0] >= 0 && p[0] < width && p[1] >= 0 && p[1] < height && isPointInUS(p[0], p[1])
          );
          
          if (validPoints.length < 3) return;
          
          // Add the clipped polygon
          const polygon = L.polygon(coords, {
            fillColor: teamColor,
            weight: 1.5,
            opacity: 0.8,
            color: "white",
            fillOpacity: 0.7
          }).addTo(voronoiLayer);
          
          // When clicking the polygon, fly to the team's location
          polygon.on("click", () => {
            map.flyTo([team.location.latitude, team.location.longitude], 8, {
              duration: 1.5
            });
          });

          // Bind a popup with team details
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
        } catch (e) {
          console.warn("Error processing clipped polygon:", e);
        }
      });
      
      // Add state boundaries on top of Voronoi cells
      L.geoJSON(usStates, {
        style: {
          weight: 1.5,
          opacity: 0.8,
          color: "#555",
          fillOpacity: 0,
          fillColor: "transparent"
        }
      }).addTo(voronoiLayer);
      
      // Add team logo markers on top with transparent background
      filteredTeams.forEach(team => {
        try {
          const size = 40;
          
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
                      background-color: transparent;
                      box-shadow: 0 0 8px rgba(0,0,0,0.6);">
                   </div>`,
            iconSize: [size, size],
            iconAnchor: [size / 2, size / 2]
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
              `)
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
      console.error("Error generating Voronoi map:", error);
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
  const [mapMode, setMapMode] = useState("basic"); // "basic" or "voronoi"
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
    return <div>Loading FBS teams...</div>;
  }

  if (error) {
    return <div style={{ color: "red" }}>{error}</div>;
  }

  const validTeams = teams.filter((team) => team && team.id);

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "20px" }}>
      <h1>College Football Team Territories</h1>
      
      {/* Map selection controls */}
      <div style={{ marginBottom: "20px" }}>
        <label style={{ marginRight: "20px" }}>
          <input
            type="radio"
            value="basic"
            checked={mapMode === "basic"}
            onChange={() => setMapMode("basic")}
          />
          Basic Map (Markers + Circles)
        </label>
        <label style={{ marginRight: "20px" }}>
          <input
            type="radio"
            value="voronoi"
            checked={mapMode === "voronoi"}
            onChange={() => setMapMode("voronoi")}
          />
          Voronoi Map (Team Territories)
        </label>
      </div>
      
      {/* Map container */}
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
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          opacity={0.3}
        />
        {validTeams.length > 0 && mapMode === "basic" && (
          <USATerritorialMap teams={validTeams} />
        )}
        {validTeams.length > 0 && mapMode === "voronoi" && (
          <AdvancedUSATerritorialMap teams={validTeams} />
        )}
      </MapContainer>

      {/* Add a key/legend for the maps */}
      {mapMode === "voronoi" && (
        <div style={{ marginTop: "10px", fontSize: "14px", color: "#666" }}>
          <p>Each colored region represents a team's territory based on proximity. Click on a territory or team logo to see details.</p>
        </div>
      )}
      
      {mapMode === "basic" && (
        <div style={{ marginTop: "10px", fontSize: "14px", color: "#666" }}>
          <p>Each team is represented by its logo and a colored circle. Click on a logo to see team details.</p>
        </div>
      )}

      {/* Team list */}
      <div style={{ marginTop: "20px" }}>
        <h2>Team List</h2>
        <ul
          style={{
            listStyle: "none",
            padding: 0,
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
            gap: "10px",
            maxHeight: "400px",
            overflowY: "auto"
          }}
        >
          {validTeams.map((team) => (
            <li
              key={team.id}
              style={{
                cursor: "pointer",
                padding: "10px",
                borderRadius: "5px",
                backgroundColor:
                  team.color && team.color !== "null" ? team.color : "#333",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                textShadow: "1px 1px 2px rgba(0,0,0,0.7)"
              }}
              onClick={() =>
                flyToTeam(team.location.latitude, team.location.longitude)
              }
            >
              <div
                style={{
                  width: "25px",
                  height: "25px",
                  marginRight: "10px",
                  backgroundImage: `url('${team.logos?.[0] || "/photos/default_team.png"}')`,
                  backgroundSize: "contain",
                  backgroundPosition: "center",
                  backgroundRepeat: "no-repeat"
                }}
              />
              <span>{team.school}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* CSS for logo markers */}
      <style jsx global>{`
        .team-logo-marker {
          filter: drop-shadow(0 2px 3px rgba(0, 0, 0, 0.4));
          transition: transform 0.2s ease;
        }
        .team-logo-marker:hover {
          transform: scale(1.1);
          z-index: 1000 !important;
        }
      `}</style>
    </div>
  );
};

export default More;