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

// === Utility Functions ===
const deg2rad = (deg) => deg * (Math.PI / 180);

const getDistance = (lat1, lon1, lat2, lon2) => {
  // Haversine formula
  const R = 6371; // Earth radius in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(deg2rad(lat1)) *
      Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
};

// Improved pointInPolygon (with checks for edges)
const pointInPolygon = (point, polygon) => {
  let inside = false;
  const x = point[0],
    y = point[1];

  // Check if point is exactly on a vertex
  for (let i = 0; i < polygon.length; i++) {
    if (Math.abs(x - polygon[i][0]) < 0.0001 && Math.abs(y - polygon[i][1]) < 0.0001) {
      return true;
    }
  }

  // Check edges + ray-casting
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0],
      yi = polygon[i][1];
    const xj = polygon[j][0],
      yj = polygon[j][1];

    // On horizontal edge
    if (
      Math.abs(yi - yj) < 0.0001 &&
      Math.abs(y - yi) < 0.0001 &&
      x >= Math.min(xi, xj) &&
      x <= Math.max(xi, xj)
    ) {
      return true;
    }

    // On vertical edge
    if (
      Math.abs(xi - xj) < 0.0001 &&
      Math.abs(x - xi) < 0.0001 &&
      y >= Math.min(yi, yj) &&
      y <= Math.max(yi, yj)
    ) {
      return true;
    }

    // Standard ray-casting
    const intersect =
      (yi > y) !== (yj > y) &&
      x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }

  return inside;
};

/**
 * Gather all polygons from the GeoJSON into a single array of polygons.
 * For each feature:
 *   - If Polygon, push its coordinates array.
 *   - If MultiPolygon, push each sub-array.
 */
const getAllPolygons = (geoJson) => {
  const polygons = [];
  geoJson.features.forEach((feature) => {
    const { geometry } = feature;
    if (!geometry) return;

    if (geometry.type === "Polygon") {
      polygons.push(geometry.coordinates[0]); // single outer ring
    } else if (geometry.type === "MultiPolygon") {
      geometry.coordinates.forEach((poly) => {
        polygons.push(poly[0]); // each sub-polygon’s outer ring
      });
    }
  });
  return polygons;
};

/**
 * Calculate bounding box for an array of polygons (in [lng, lat] form).
 */
const getBoundingBoxFromAllPolygons = (polygons) => {
  let minLat = Infinity,
    maxLat = -Infinity,
    minLng = Infinity,
    maxLng = -Infinity;

  polygons.forEach((poly) => {
    poly.forEach((point) => {
      const [lng, lat] = point;
      if (lat < minLat) minLat = lat;
      if (lat > maxLat) maxLat = lat;
      if (lng < minLng) minLng = lng;
      if (lng > maxLng) maxLng = lng;
    });
  });

  return { minLat, maxLat, minLng, maxLng };
};

// === Territory Map Component ===
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

    // Base US map layer with minimal styling
    const baseUSA = L.geoJSON(usStates, {
      style: {
        weight: 0.5,
        opacity: 0.5,
        color: "#444",
        fillOpacity: 0,
        fillColor: "transparent"
      }
    }).addTo(territoryLayer);

    // Fit map to the US bounds
    const bounds = baseUSA.getBounds();
    map.fitBounds(bounds);

    // Filter teams with valid coordinates in approximate continental US
    const filteredTeams = teams.filter((team) => {
      if (!team?.location?.latitude || !team?.location?.longitude) return false;
      const lat = team.location.latitude;
      const lng = team.location.longitude;
      // Rough bounding box for continental US
      if (lat < 24 || lat > 50 || lng < -125 || lng > -66) return false;
      return true;
    });

    // Get all polygons + bounding box
    const allPolygons = getAllPolygons(usStates);
    const { minLat, maxLat, minLng, maxLng } = getBoundingBoxFromAllPolygons(allPolygons);

    // Grid settings
    const gridSize = 0.15; // tweak for resolution vs. performance
    const gridCells = [];

    // Generate cells for the entire US bounding box
    for (let lat = minLat; lat <= maxLat; lat += gridSize) {
      for (let lng = minLng; lng <= maxLng; lng += gridSize) {
        // Center of the cell
        const cellCenterLat = lat + gridSize / 2;
        const cellCenterLng = lng + gridSize / 2;

        // Check if this center is inside any polygon
        // note: pointInPolygon expects [lng, lat]
        let isInside = false;
        for (const poly of allPolygons) {
          if (pointInPolygon([cellCenterLng, cellCenterLat], poly)) {
            isInside = true;
            break;
          }
        }
        if (!isInside) continue; // skip cells outside US

        // Find closest team
        let closestTeam = null;
        let minDistance = Infinity;
        filteredTeams.forEach((team) => {
          const distance = getDistance(
            cellCenterLat,
            cellCenterLng,
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
            bounds: [
              [lat, lng],
              [lat + gridSize, lng + gridSize]
            ],
            center: [cellCenterLat, cellCenterLng],
            team: closestTeam
          });
        }
      }
    }

    // Track how many cells each team owns
    const teamTerritorySizes = {};
    const teamCells = {};

    // Add rectangles to the map
    gridCells.forEach((cell) => {
      const { team } = cell;
      const teamColor = team.color && team.color !== "null" ? team.color : "#333";

      // Tally territory size
      if (!teamTerritorySizes[team.id]) {
        teamTerritorySizes[team.id] = 0;
        teamCells[team.id] = [];
      }
      teamTerritorySizes[team.id]++;
      teamCells[team.id].push(cell);

      L.rectangle(cell.bounds, {
        color: "#222",
        weight: 0.2,
        fillColor: teamColor,
        fillOpacity: 1
      }).addTo(territoryLayer);
    });

    // Add team logos at approximate territory centers
    Object.keys(teamCells).forEach((teamId) => {
      const cells = teamCells[teamId];
      if (!cells.length) return;
      const team = cells[0].team;

      // Weighted centroid
      let totalLat = 0;
      let totalLng = 0;
      cells.forEach((cell) => {
        totalLat += cell.center[0];
        totalLng += cell.center[1];
      });
      const centerLat = totalLat / cells.length;
      const centerLng = totalLng / cells.length;

      // Scale logo size based on territory
      const territorySize = teamTerritorySizes[teamId];
      const baseSize = Math.max(25, Math.min(70, 20 + Math.sqrt(territorySize) * 2));

      // Create logo icon
      const teamIcon = L.divIcon({
        className: "team-logo-no-bg",
        html: `
          <div style="
            background-image: url('${team.logos?.[0] || "/photos/default_team.png"}');
            background-size: contain;
            background-repeat: no-repeat;
            background-position: center;
            width: ${baseSize}px;
            height: ${baseSize}px;
          "></div>`,
        iconSize: [baseSize, baseSize],
        iconAnchor: [baseSize / 2, baseSize / 2]
      });

      // Marker with popup
      const marker = L.marker([centerLat, centerLng], {
        icon: teamIcon,
        zIndexOffset: 1000
      }).addTo(territoryLayer);

      marker.on("click", () => {
        marker
          .bindPopup(
            `
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
          `,
            { className: "custom-popup" }
          )
          .openPopup();

        map.flyTo([team.location.latitude, team.location.longitude], 8, {
          duration: 1.5
        });
      });
    });

    // Finally, draw the state boundaries on top
    L.geoJSON(usStates, {
      style: {
        weight: 0.8,
        opacity: 0.6,
        color: "#333",
        fillOpacity: 0,
        fillColor: "transparent"
      }
    }).addTo(territoryLayer);

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
        // Filter for FBS teams with valid coords
        const fbsTeams = data.filter(
          (team) =>
            team &&
            team.classification === "fbs" &&
            team.location?.latitude &&
            team.location?.longitude
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

  const validTeams = teams.filter((team) => team?.id);

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
        <p>
          Each colored region represents a team's territory based on proximity.
          Teams extend their influence until reaching another team's territory.
          Click on a team logo to see details.
        </p>
      </div>

      {/* CSS for styling */}
      <style jsx global>{`
        .territory-map-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto,
            Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
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
          to {
            transform: rotate(360deg);
          }
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
          box-shadow: 0 5px 20px rgba(0, 0, 0, 0.15);
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
