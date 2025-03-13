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
      return null;
    }
    // Start with the first feature
    let unionPoly = turf.feature(usStates.features[0].geometry);
    for (let i = 1; i < usStates.features.length; i++) {
      const currentFeature = turf.feature(usStates.features[i].geometry);
      unionPoly = turf.union(unionPoly, currentFeature);
    }
    return unionPoly;
  };

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
        const cell = voronoi.cellPolygon(i);
        if (!cell) return;

        const team = point[2];
        const teamColor = team.color && team.color !== "null" ? team.color : "#333";

        // Build a Turf polygon from the Voronoi cell (note: cell is in [lng, lat])
        const cellPolygon = turf.polygon([cell]);

        // Clip the cell with the US union polygon
        const clipped = turf.intersect(cellPolygon, usUnion);
        if (!clipped) return;

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
          // Use only the outer ring (coords[0]) for simplicity
          const outerRing = coords[0].map(([lng, lat]) => [lat, lng]);
          const polygon = L.polygon(outerRing, {
            fillColor: teamColor,
            weight: 1,
            opacity: 1,
            color: "white",
            fillOpacity: 0.9
          }).addTo(territoryLayer);

          // When clicking the polygon, fly to the team’s location
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
      });

      // Now add team logo markers on top of their respective territories
      points.forEach((point, i) => {
        const team = point[2];
        const cell = voronoi.cellPolygon(i);
        if (!cell) return;
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
        const size = Math.max(minSize, Math.min(maxSize, baseSize * (normalizedArea / 10)));

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
      });

      // (Optional) Handle Alaska and Hawaii teams separately if desired.
    };

    generateVoronoi();

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
        zoomControl={false}
        dragging={false}
        touchZoom={false}
        scrollWheelZoom={false}
        doubleClickZoom={false}
        boxZoom={false}
        keyboard={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org">OSM</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          opacity={0.1}
        />
        {validTeams.length > 0 && <USATerritorialMap teams={validTeams} />}
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
