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

// Component to create US-shaped Voronoi diagram
const USATerritorialMap = ({ teams }) => {
  const map = useMap();
  const layerRef = useRef(null);

  // Create a union of all US states from the GeoJSON file.
  // This function reduces the FeatureCollection to one combined polygon.
  const getUSBoundaryUnion = () => {
    if (!usStates || !usStates.features || usStates.features.length === 0) {
      console.error("No US states features found");
      return null;
    }
    try {
      // Filter out features with invalid geometries
      const validFeatures = usStates.features.filter(
        feature => feature && feature.geometry && 
        (feature.geometry.type === "Polygon" || feature.geometry.type === "MultiPolygon")
      );
      
      if (validFeatures.length < 2) {
        console.error("Not enough valid features to create a union");
        // Return a bounding box for the US as a fallback
        return turf.bboxPolygon([-130, 24, -65, 50]);
      }
      
      // Start with the first feature
      let unionPoly = turf.feature(validFeatures[0].geometry);
      
      // Union each feature one by one
      for (let i = 1; i < validFeatures.length; i++) {
        try {
          const currentFeature = turf.feature(validFeatures[i].geometry);
          unionPoly = turf.union(unionPoly, currentFeature);
        } catch (error) {
          console.warn(`Error unioning feature ${i}:`, error);
          // Continue with the next feature
        }
      }
      return unionPoly;
    } catch (error) {
      console.error("Error creating US boundary union:", error);
      // Return a bounding box for the US as a fallback
      return turf.bboxPolygon([-130, 24, -65, 50]);
    }
  };

  useEffect(() => {
    if (!teams || teams.length < 2) {
      console.error("Not enough teams to generate Voronoi diagram");
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

    // Convert teams into points for Voronoi generation (in [lng, lat] order)
    const points = teams.map(team => [
      team.location.longitude, 
      team.location.latitude, 
      team
    ]);

    const generateVoronoi = () => {
      // Define an extended bounding box covering the continental US
      const boundingBox = [-130, 24, -65, 50];
      const pointsArray = points.map(p => [p[0], p[1]]);
      
      // Ensure we have at least 2 unique points to create a Voronoi diagram
      if (pointsArray.length < 2) {
        console.error("Not enough unique points to generate Voronoi diagram");
        return;
      }
      
      const delaunay = Delaunay.from(pointsArray);
      const voronoi = delaunay.voronoi(boundingBox);

      // Clear any previous layers
      territoryLayer.clearLayers();

      // Get the union polygon for the entire US from the imported states GeoJSON
      const usUnion = getUSBoundaryUnion();
      if (!usUnion) {
        console.error("US boundary union not available");
        return;
      }

      // For each team (point), generate its Voronoi cell and clip it to the US boundary
      points.forEach((point, i) => {
        try {
          const cell = voronoi.cellPolygon(i);
          if (!cell || cell.length < 4) {
            console.warn(`Invalid cell for team at index ${i}`);
            return;
          }

          const team = point[2];
          const teamColor = team.color && team.color !== "null" ? team.color : "#333";

          // Build a Turf polygon from the Voronoi cell (note: cell is in [lng, lat])
          const cellPolygon = turf.polygon([cell]);

          // Clip the cell with the US union polygon
          try {
            const clipped = turf.intersect(cellPolygon, usUnion);
            if (!clipped) {
              console.warn(`No intersection found for team at index ${i}`);
              return;
            }

            // Convert the clipped polygon to Leaflet coordinates ([lat, lng])
            let polygonsToDraw = [];
            if (clipped.geometry.type === "Polygon") {
              polygonsToDraw.push(clipped.geometry.coordinates);
            } else if (clipped.geometry.type === "MultiPolygon") {
              clipped.geometry.coordinates.forEach(coords => {
                polygonsToDraw.push(coords);
              });
            }

            polygonsToDraw.forEach((coords) => {
              // Check if coordinates are valid
              if (!coords || !coords[0] || coords[0].length < 3) {
                console.warn("Invalid polygon coordinates");
                return;
              }
              
              // Use only the outer ring (coords[0]) for simplicity
              const outerRing = coords[0].map(([lng, lat]) => [lat, lng]);
              const polygon = L.polygon(outerRing, {
                fillColor: teamColor,
                weight: 1,
                opacity: 1,
                color: "white",
                fillOpacity: 0.9
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
            });
          } catch (error) {
            console.warn(`Error creating intersection for team ${team.school}:`, error);
          }
        } catch (error) {
          console.warn(`Error processing team at index ${i}:`, error);
        }
      });

      // Now add team logo markers on top of their respective territories
      points.forEach((point, i) => {
        try {
          const team = point[2];
          
          // Create a valid marker even if Voronoi cell calculation fails
          let size = 50; // Default size
          
          try {
            const cell = voronoi.cellPolygon(i);
            if (cell && cell.length >= 4) {
              const polygonPoints = cell.map(p => [p[1], p[0]]);
              let area = 0;
              for (let j = 0; j < polygonPoints.length - 1; j++) {
                area += polygonPoints[j][0] * polygonPoints[j+1][1] - polygonPoints[j+1][0] * polygonPoints[j][1];
              }
              area = Math.abs(area / 2);
              const minSize = 30;
              const maxSize = 70;
              const baseSize = 50;
              const normalizedArea = Math.sqrt(area) * 8;
              size = Math.max(minSize, Math.min(maxSize, baseSize * (normalizedArea / 10)));
            }
          } catch (error) {
            console.warn(`Error calculating cell area for team ${team.school}:`, error);
          }

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
    };

    try {
      generateVoronoi();
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

  // Ensure we have at least 2 teams for Voronoi
  const hasEnoughTeams = validTeams.length >= 2;

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
        zoomControl={true}  // Changed to true for better user control
        dragging={true}     // Changed to true
        touchZoom={true}    // Changed to true
        scrollWheelZoom={true} // Changed to true
        doubleClickZoom={true} // Changed to true
        boxZoom={true}      // Changed to true
        keyboard={true}     // Changed to true
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org">OSM</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          opacity={0.1}
        />
        {hasEnoughTeams && <USATerritorialMap teams={validTeams} />}
        {!hasEnoughTeams && validTeams.length > 0 && (
          <div style={{ 
            position: "absolute", 
            zIndex: 1000, 
            top: "10px", 
            left: "10px", 
            backgroundColor: "white", 
            padding: "10px",
            borderRadius: "5px"
          }}>
            Need at least 2 teams to generate territories
          </div>
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

