import React, { useState, useEffect, useRef } from "react";
import teamsService from "../services/teamsService";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Delaunay } from "d3-delaunay";
import * as turf from "@turf/turf";
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

// Component to create team territory visualization
const USATerritorialMap = ({ teams }) => {
  const map = useMap();
  const layerRef = useRef(null);

  useEffect(() => {
    if (!teams || teams.length < 2) {
      console.warn("Not enough teams to generate map");
      return;
    }

    // Remove any existing layer
    if (layerRef.current) {
      map.removeLayer(layerRef.current);
    }

    // Set view to center of US
    const usCenter = [39.8283, -98.5795];
    map.setView(usCenter, 4);

    // Create a new layer group for team markers
    const territoryLayer = L.layerGroup().addTo(map);
    layerRef.current = territoryLayer;

    try {
      // Simple approach: Just add team markers with clickable functionality
      teams.forEach((team) => {
        if (!team.location || !team.location.latitude || !team.location.longitude) {
          return;
        }
        
        // Default size for markers
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
                    border: 3px solid white;
                    background-color: white;
                    box-shadow: 0 0 8px rgba(0,0,0,0.6);">
                 </div>`,
          iconSize: [size, size],
          iconAnchor: [size / 2, size / 2]
        });

        const marker = L.marker(
          [team.location.latitude, team.location.longitude],
          { icon: teamIcon, zIndexOffset: 1000 }
        ).addTo(territoryLayer);

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

      // Try a simpler approach for territories - using circles for influence
      teams.forEach((team) => {
        if (!team.location || !team.location.latitude || !team.location.longitude) {
          return;
        }
        
        const teamColor = team.color && team.color !== "null" ? team.color : "#333";
        
        // Create a circle with team color
        const circle = L.circle(
          [team.location.latitude, team.location.longitude], 
          {
            radius: 80000, // 80km radius
            color: teamColor,
            weight: 1,
            opacity: 0.8,
            fillColor: teamColor,
            fillOpacity: 0.2
          }
        ).addTo(territoryLayer);
        
        // Add interactivity to circle
        circle.on("click", () => {
          map.flyTo([team.location.latitude, team.location.longitude], 8, {
            duration: 1.5
          });
        });
      });
    } catch (error) {
      console.error("Error generating team territories:", error);
    }

    return () => {
      if (layerRef.current) {
        map.removeLayer(layerRef.current);
      }
    };
  }, [teams, map]);

  return null;
};

// Optional: A more advanced version that attempts to use d3-delaunay for Voronoi,
// but doesn't try to do the complex turf.js operations that were failing
const AdvancedUSATerritorialMap = ({ teams }) => {
  const map = useMap();
  const layerRef = useRef(null);

  useEffect(() => {
    if (!teams || teams.length < 2) {
      console.warn("Not enough teams to generate map");
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
    const territoryLayer = L.layerGroup().addTo(map);
    layerRef.current = territoryLayer;

    try {
      // Convert teams into points for Voronoi generation (in [lng, lat] order for d3-delaunay)
      const points = teams
        .filter(team => team && team.location && team.location.latitude && team.location.longitude)
        .map(team => [team.location.longitude, team.location.latitude, team]);

      if (points.length < 3) {
        console.warn("Not enough points for Voronoi diagram");
        return;
      }

      // Define an extended bounding box covering the continental US
      const boundingBox = [-130, 24, -65, 50];
      
      // Create Delaunay triangulation and Voronoi diagram
      const pointsArray = points.map(p => [p[0], p[1]]);
      const delaunay = Delaunay.from(pointsArray);
      const voronoi = delaunay.voronoi(boundingBox);

      // Draw Voronoi cells
      points.forEach((point, i) => {
        try {
          const cell = voronoi.cellPolygon(i);
          if (!cell || cell.length < 4) {
            console.warn(`Invalid cell for team at index ${i}`);
            return;
          }

          const team = point[2];
          const teamColor = team.color && team.color !== "null" ? team.color : "#333";

          // Convert Voronoi cell to Leaflet coordinates ([lat, lng])
          const polygonPoints = cell.map(p => [p[1], p[0]]);
          
          // Create polygon
          const polygon = L.polygon(polygonPoints, {
            fillColor: teamColor,
            weight: 1,
            opacity: 0.8,
            color: "white",
            fillOpacity: 0.5
          }).addTo(territoryLayer);

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
        } catch (error) {
          console.warn(`Error processing team at index ${i}:`, error);
        }
      });

      // Now add team logo markers on top
      points.forEach((point, i) => {
        try {
          const team = point[2];
          const size = 40; // Default size
          
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
            iconAnchor: [size / 2, size / 2]
          });

          const marker = L.marker(
            [team.location.latitude, team.location.longitude],
            { icon: teamIcon, zIndexOffset: 1000 }
          ).addTo(territoryLayer);

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
          });
        } catch (error) {
          console.warn(`Error creating marker for team at index ${i}:`, error);
        }
      });
    } catch (error) {
      console.error("Error generating Voronoi diagram:", error);
    }

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
  const [mapMode, setMapMode] = useState("basic"); // "basic" or "advanced"
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
        <label>
          <input
            type="radio"
            value="advanced"
            checked={mapMode === "advanced"}
            onChange={() => setMapMode("advanced")}
          />
          Advanced Map (Voronoi)
        </label>
      </div>
      
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
        {validTeams.length > 0 && mapMode === "advanced" && (
          <AdvancedUSATerritorialMap teams={validTeams} />
        )}
      </MapContainer>

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