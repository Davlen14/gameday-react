import React, { useState, useEffect, useRef } from "react";
import teamsService from "../services/teamsService";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import usStates from "../data/us-states.json";

// Leaflet icon configuration
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png"
});

// Utility functions
const getDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
};

const pointInPolygon = (point, polygon) => {
  let inside = false;
  const x = point[0], y = point[1];
  
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0], yi = polygon[i][1];
    const xj = polygon[j][0], yj = polygon[j][1];
    
    const intersect = ((yi > y) !== (yj > y)) &&
      (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
};

const isPointInUS = (point, states) => {
  return states.features.some(state => {
    if (state.geometry.type === 'Polygon') {
      return pointInPolygon([point[1], point[0]], state.geometry.coordinates[0]);
    }
    return state.geometry.coordinates.some(polygon => 
      pointInPolygon([point[1], point[0]], polygon[0])
    );
  });
};

const CollegeFootballTerritoryMap = ({ teams }) => {
  const map = useMap();
  const layerRef = useRef(null);

  useEffect(() => {
    if (!teams?.length) return;

    const territoryLayer = L.layerGroup().addTo(map);
    layerRef.current = territoryLayer;

    // Continental US bounds
    const bounds = {
      south: 24.396308,
      north: 49.384358,
      west: -125.0,
      east: -66.93457
    };

    // Filter valid teams within continental US
    const validTeams = teams.filter(team => 
      team?.location?.latitude >= bounds.south &&
      team?.location?.latitude <= bounds.north &&
      team?.location?.longitude >= bounds.west &&
      team?.location?.longitude <= bounds.east
    );

    // Generate uniform grid
    const gridSize = 0.1;
    const gridCells = [];
    
    for (let lat = bounds.south; lat < bounds.north; lat += gridSize) {
      for (let lng = bounds.west; lng < bounds.east; lng += gridSize) {
        const center = [lat + gridSize/2, lng + gridSize/2];
        
        if (isPointInUS(center, usStates)) {
          let closestTeam = validTeams.reduce((prev, curr) => {
            const prevDist = getDistance(...center, prev.location.latitude, prev.location.longitude);
            const currDist = getDistance(...center, curr.location.latitude, curr.location.longitude);
            return currDist < prevDist ? curr : prev;
          }, validTeams[0]);

          gridCells.push({
            bounds: [[lat, lng], [lat + gridSize, lng + gridSize]],
            team: closestTeam,
            center
          });
        }
      }
    }

    // Draw territories
    gridCells.forEach(({ bounds, team }) => {
      L.rectangle(bounds, {
        weight: 0.2,
        color: "#222",
        fillColor: team.color || "#333",
        fillOpacity: 0.8
      }).addTo(territoryLayer);
    });

    // Add team logos
    const teamCentroids = new Map();
    gridCells.forEach(({ center, team }) => {
      const existing = teamCentroids.get(team.id) || { sum: [0, 0], count: 0 };
      existing.sum[0] += center[0];
      existing.sum[1] += center[1];
      existing.count++;
      teamCentroids.set(team.id, existing);
    });

    teamCentroids.forEach((value, teamId) => {
      const team = validTeams.find(t => t.id === teamId);
      const [lat, lng] = value.sum.map(v => v / value.count);
      
      L.marker([lat, lng], {
        icon: L.divIcon({
          className: "team-logo",
          html: `<div style="background-image:url('${team.logos?.[0]}');width:40px;height:40px;background-size:contain"></div>`,
          iconSize: [40, 40]
        })
      }).addTo(territoryLayer);
    });

    return () => map.removeLayer(territoryLayer);
  }, [teams, map]);

  return null;
};

const More = () => {
  const [teams, setTeams] = useState([]);
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    teamsService.getTeams()
      .then(data => {
        setTeams(data.filter(t => 
          t.classification === "fbs" &&
          t.location?.latitude &&
          t.location?.longitude
        ));
        setStatus("loaded");
      })
      .catch(() => setStatus("error"));
  }, []);

  return (
    <div className="map-container">
      <h1>College Football Team Territories</h1>
      
      {status === "loading" && <div className="loader">Loading...</div>}
      {status === "error" && <div className="error">Error loading data</div>}
      
      <MapContainer
        center={[39.8283, -98.5795]}
        zoom={4}
        style={{ height: "700px", width: "100%" }}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; OpenStreetMap'
        />
        {status === "loaded" && <CollegeFootballTerritoryMap teams={teams} />}
      </MapContainer>
    </div>
  );
};

export default More;