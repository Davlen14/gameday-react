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
const USABasicMap = ({ teams }) => {
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
      
      // Add team logo marker
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

    return () => {
      if (layerRef.current) {
        map.removeLayer(layerRef.current);
      }
    };
  }, [teams, map]);

  return null;
};

// Voronoi Map Component - Use D3-Delaunay for Voronoi, but without turf
const USAVoronoiMap = ({ teams }) => {
  const map = useMap();
  const layerRef = useRef(null);

  useEffect(() => {
    if (!teams || teams.length < 2) {
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
      // Add US states with light coloring
      const statesLayer = L.geoJSON(usStates, {
        style: {
          weight: 1,
          opacity: 1,
          color: "#666",
          fillOpacity: 0.1,
          fillColor: "#eee"
        }
      }).addTo(voronoiLayer);

      // Convert teams into points for Voronoi generation (in [lng, lat] order for d3-delaunay)
      const points = teams
        .filter(team => team && team.location && team.location.latitude && team.location.longitude)
        .map(team => [team.location.longitude, team.location.latitude, team]);

      if (points.length < 3) {
        console.warn("Not enough unique points to generate Voronoi diagram");
        return;
      }
      
      // Define an extended bounding box covering the continental US
      const boundingBox = [-130, 24, -65, 50];
      
      // Create Delaunay triangulation and Voronoi diagram
      const pointsArray = points.map(p => [p[0], p[1]]);
      const delaunay = Delaunay.from(pointsArray);
      const voronoi = delaunay.voronoi(boundingBox);

      // Draw Voronoi cells directly
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
            weight: 2,
            opacity: 0.8,
            color: "white",
            fillOpacity: 0.5
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
        } catch (error) {
          console.warn(`Error processing team at index ${i}:`, error);
        }
      });

      // Add team logo markers on top
      points.forEach((point, i) => {
        try {
          const team = point[2];
          const size = 40; // Fixed size for simplicity
          
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
          });
        } catch (error) {
          console.warn(`Error creating marker for team at index ${i}:`, error);
        }
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

// Conference Map Component - Group teams by conference
const USAConferenceMap = ({ teams }) => {
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

    // Create a new layer group
    const conferenceLayer = L.layerGroup().addTo(map);
    layerRef.current = conferenceLayer;

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
      }).addTo(conferenceLayer);

      // Group teams by conference
      const conferenceGroups = {};
      
      teams.forEach(team => {
        if (!team.location || !team.location.latitude || !team.location.longitude) {
          return;
        }
        
        const conference = team.conference || "Independent";
        
        if (!conferenceGroups[conference]) {
          conferenceGroups[conference] = [];
        }
        
        conferenceGroups[conference].push(team);
      });

      // Generate a color for each conference
      const conferenceColors = {};
      const baseColors = [
        "#E53935", "#D81B60", "#8E24AA", "#5E35B1", "#3949AB", 
        "#1E88E5", "#039BE5", "#00ACC1", "#00897B", "#43A047", 
        "#7CB342", "#C0CA33", "#FDD835", "#FFB300", "#FB8C00", 
        "#F4511E", "#6D4C41", "#757575", "#546E7A"
      ];
      
      let colorIndex = 0;
      Object.keys(conferenceGroups).forEach(conference => {
        conferenceColors[conference] = baseColors[colorIndex % baseColors.length];
        colorIndex++;
      });

      // Draw conference hulls
      Object.entries(conferenceGroups).forEach(([conference, conferenceTeams]) => {
        // If conference has only one team, just show a circle
        if (conferenceTeams.length === 1) {
          const team = conferenceTeams[0];
          const circle = L.circle(
            [team.location.latitude, team.location.longitude], 
            {
              radius: 120000,
              color: conferenceColors[conference],
              weight: 2,
              opacity: 0.8,
              fillColor: conferenceColors[conference],
              fillOpacity: 0.3
            }
          ).addTo(conferenceLayer);
          
          circle.bindTooltip(conference, {
            permanent: true,
            direction: 'center',
            className: 'conference-label'
          });
        } 
        // If conference has 2+ teams, try to create a convex hull
        else if (conferenceTeams.length >= 2) {
          try {
            // Show conference territory as a polygon connecting all team locations
            const points = conferenceTeams.map(team => 
              [team.location.latitude, team.location.longitude]
            );
            
            const polygon = L.polygon(points, {
              color: conferenceColors[conference],
              weight: 2,
              opacity: 0.8,
              fillColor: conferenceColors[conference],
              fillOpacity: 0.3
            }).addTo(conferenceLayer);
            
            // Add conference label at the center of the polygon
            const center = polygon.getBounds().getCenter();
            L.marker(center, {
              icon: L.divIcon({
                className: 'conference-label-container',
                html: `<div class="conference-label">${conference}</div>`,
                iconSize: [100, 40],
                iconAnchor: [50, 20]
              })
            }).addTo(conferenceLayer);
          } catch (error) {
            console.warn(`Error creating polygon for conference ${conference}:`, error);
          }
        }
      });

      // Add team logo markers on top
      teams.forEach(team => {
        if (!team.location || !team.location.latitude || !team.location.longitude) {
          return;
        }
        
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
        ).addTo(conferenceLayer);

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
      console.error("Error generating conference map:", error);
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
  const [mapMode, setMapMode] = useState("basic"); // "basic", "voronoi", or "conference"
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
        <label>
          <input
            type="radio"
            value="conference"
            checked={mapMode === "conference"}
            onChange={() => setMapMode("conference")}
          />
          Conference Map
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
          <USABasicMap teams={validTeams} />
        )}
        {validTeams.length > 0 && mapMode === "voronoi" && (
          <USAVoronoiMap teams={validTeams} />
        )}
        {validTeams.length > 0 && mapMode === "conference" && (
          <USAConferenceMap teams={validTeams} />
        )}
      </MapContainer>

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

      {/* CSS for conference labels */}
      <style jsx global>{`
        .conference-label-container {
          background: transparent;
        }
        .conference-label {
          background-color: white;
          border: 2px solid #333;
          padding: 5px 10px;
          border-radius: 5px;
          font-weight: bold;
          text-align: center;
          white-space: nowrap;
        }
      `}</style>
    </div>
  );
};

export default More;