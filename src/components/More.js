import React, { useState, useEffect, useRef } from "react";
import teamsService from "../services/teamsService";
import { MapContainer, TileLayer, GeoJSON, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Delaunay } from "d3-delaunay";

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

// Component to create Voronoi diagram
const VoronoiLayer = ({ teams }) => {
  const map = useMap();
  const [voronoiGeoJSON, setVoronoiGeoJSON] = useState(null);
  
  useEffect(() => {
    if (!teams || teams.length === 0) return;
    
    // Convert teams to points for Voronoi generation
    const points = teams.map(team => [
      team.location.longitude, 
      team.location.latitude, 
      team
    ]);
    
    // Get map bounds and extend them to create a slightly larger bounding box
    const bounds = map.getBounds();
    const sw = bounds.getSouthWest();
    const ne = bounds.getNorthEast();
    
    // Create extended bounds for Voronoi diagram
    const boundingBox = [
      [sw.lng - 10, sw.lat - 5],
      [ne.lng + 10, ne.lat + 5]
    ];
    
    // Generate Voronoi diagram using d3-delaunay
    const pointsArray = points.map(p => [p[0], p[1]]);
    const delaunay = Delaunay.from(pointsArray);
    const voronoi = delaunay.voronoi([
      boundingBox[0][0], boundingBox[0][1], 
      boundingBox[1][0], boundingBox[1][1]
    ]);
    
    // Convert Voronoi polygons to GeoJSON
    const features = points.map((point, i) => {
      const cell = voronoi.cellPolygon(i);
      if (!cell) return null;
      
      // Convert polygon to GeoJSON format
      const coordinates = [cell.map(point => [point[0], point[1]])];
      
      // The cell is already closed (first and last points are the same)
      
      return {
        type: "Feature",
        properties: {
          team: points[i][2]
        },
        geometry: {
          type: "Polygon",
          coordinates: coordinates
        }
      };
    }).filter(feature => feature !== null);
    
    const geoJSON = {
      type: "FeatureCollection",
      features: features
    };
    
    setVoronoiGeoJSON(geoJSON);
  }, [teams, map]);
  
  // Function to style each polygon based on team colors
  const stylePolygon = (feature) => {
    const team = feature.properties.team;
    const color = team.color && team.color !== "null" ? team.color : "#333";
    
    return {
      fillColor: color,
      weight: 2,
      opacity: 1,
      color: 'white',
      dashArray: '3',
      fillOpacity: 0.7
    };
  };
  
  // Function to create popups for each region
  const onEachFeature = (feature, layer) => {
    const team = feature.properties.team;
    
    layer.bindPopup(() => {
      const popupDiv = L.DomUtil.create('div', 'team-popup');
      popupDiv.innerHTML = `
        <div style="text-align: center">
          <img
            src="${team.logos?.[0] || "/photos/default_team.png"}"
            alt="${team.school}"
            style="width: 50px; height: auto; margin-bottom: 5px"
            onerror="this.onerror=null; this.src='/photos/default_team.png';"
          />
          <h3 style="margin: 5px 0">${team.school}</h3>
          <p style="margin: 0">
            <strong>Conference:</strong> ${team.conference || "Independent"}
          </p>
        </div>
      `;
      return popupDiv;
    });
  };
  
  // Create team logos at the center of each region
  const TeamMarkers = () => {
    return teams.map(team => {
      // Create a custom icon with the team's logo
      const teamIcon = L.divIcon({
        className: "team-logo-marker",
        html: `<div style="background-image: url('${team.logos?.[0] || "/photos/default_team.png"}');
                          background-size: contain;
                          background-repeat: no-repeat;
                          background-position: center;
                          width: 40px;
                          height: 40px;
                          border-radius: 50%;
                          border: 2px solid white;
                          background-color: white;
                          box-shadow: 0 0 4px rgba(0,0,0,0.4);">
               </div>`,
        iconSize: [40, 40],
        iconAnchor: [20, 20]
      });
      
      // Create a marker with the custom icon
      const marker = L.marker(
        [team.location.latitude, team.location.longitude],
        { icon: teamIcon }
      );
      
      // Add the marker to the map
      marker.addTo(map);
      
      return null;
    });
  };
  
  return (
    <>
      {voronoiGeoJSON && (
        <GeoJSON 
          data={voronoiGeoJSON} 
          style={stylePolygon}
          onEachFeature={onEachFeature}
        />
      )}
      <TeamMarkers />
    </>
  );
};

const More = () => {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const mapRef = useRef(null);

  // Fetch teams from API
  useEffect(() => {
    const fetchTeams = async () => {
      try {
        setLoading(true);
        const data = await teamsService.getTeams();
        // Filter for FBS teams that have valid coordinates
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

  // Before rendering, check that teams are loaded and valid
  if (loading) {
    return <div>Loading FBS teams...</div>;
  }

  if (error) {
    return <div style={{ color: "red" }}>{error}</div>;
  }

  // Filter out any undefined or invalid team items
  const validTeams = teams.filter((team) => team && team.id);

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "20px" }}>
      <h1>College Football Team Territories</h1>
      <MapContainer
        center={[39.8283, -98.5795]}
        zoom={4}
        style={{ height: "600px", width: "100%" }}
        whenCreated={(map) => {
          mapRef.current = map;
        }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          opacity={0.3} // Make the base map less visible to better see the team colors
        />
        {validTeams.length > 0 && <VoronoiLayer teams={validTeams} />}
      </MapContainer>

      <div style={{ marginTop: "20px" }}>
        <h2>Team List</h2>
        <ul style={{ 
          listStyle: "none", 
          padding: 0,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
          gap: "10px"
        }}>
          {validTeams.map((team) => (
            <li
              key={team.id}
              style={{
                cursor: "pointer",
                padding: "10px",
                borderRadius: "5px",
                backgroundColor: team.color && team.color !== "null" ? team.color : "#333",
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