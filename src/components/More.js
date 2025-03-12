import React, { useState, useEffect, useRef } from "react";
import teamsService from "../services/teamsService";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  ImageOverlay
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

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

// Approximate bounding box for the lower 48 US states
const US_BOUNDS = [
  [24.396308, -124.848974], // Southwest [Lat, Lng]
  [49.384358, -66.885444]   // Northeast [Lat, Lng]
];

const More = () => {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const mapRef = useRef(null);

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        setLoading(true);
        const data = await teamsService.getTeams();
        // Filter for FBS teams with valid coordinates
        const fbsTeams = data.filter(
          (team) =>
            team.classification === "fbs" &&
            team.location?.latitude &&
            team.location?.longitude
        );
        setTeams(fbsTeams);
        setLoading(false);
      } catch (err) {
        setError("Failed to load team data");
        setLoading(false);
        console.error(err);
      }
    };

    fetchTeams();
  }, []);

  // Helper to create a small colored circle or a standard icon
  const getTeamIcon = (team) => {
    const color = team.color && team.color !== "null" ? team.color : "#333";
    return L.divIcon({
      className: "team-marker",
      html: `<div style="background-color: ${color};
                         width: 12px;
                         height: 12px;
                         border-radius: 50%;
                         border: 2px solid white;
                         box-shadow: 0 0 4px rgba(0,0,0,0.4);">
             </div>`,
      iconSize: [16, 16],
      iconAnchor: [8, 8]
    });
  };

  // If you want to "fly to" a team’s location when clicked in a list:
  const flyToTeam = (lat, lng) => {
    if (mapRef.current) {
      mapRef.current.flyTo([lat, lng], 6, { duration: 1.5 });
    }
  };

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
      <h1>My Interactive CFB Map (No Polygons)</h1>
      {error && <p style={{ color: "red" }}>{error}</p>}

      {loading ? (
        <p>Loading FBS teams...</p>
      ) : (
        <>
          <MapContainer
            center={[37.8, -96]} // Center on the US
            zoom={4}
            style={{ height: "600px", width: "100%" }}
            whenCreated={(map) => (mapRef.current = map)}
          >
            {/* Standard OSM tile layer (optional). 
                You could remove this if you only want the custom image. */}
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org">OSM</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {/* The key piece: an ImageOverlay with your pre-colored map */}
            <ImageOverlay
              url="/images/pre_colored_cfb_map.png" // The custom map image
              bounds={US_BOUNDS}
              opacity={0.7} // Adjust if you want some transparency
            />

            {/* Now place markers on top */}
            {teams.map((team) => (
              <Marker
                key={team.id}
                position={[team.location.latitude, team.location.longitude]}
                icon={getTeamIcon(team)}
              >
                <Popup>
                  <div style={{ textAlign: "center" }}>
                    <img
                      src={team.logos?.[0] || "/photos/default_team.png"}
                      alt={team.school}
                      style={{ width: 50, height: "auto", marginBottom: 5 }}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "/photos/default_team.png";
                      }}
                    />
                    <h3 style={{ margin: "5px 0" }}>{team.school}</h3>
                    <p style={{ margin: 0 }}>
                      <strong>Conference:</strong>{" "}
                      {team.conference || "Independent"}
                    </p>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>

          {/* Optional list of teams to click and fly to location */}
          <div style={{ marginTop: "20px" }}>
            <h2>Team List</h2>
            <ul>
              {teams.map((team) => (
                <li
                  key={team.id}
                  style={{ cursor: "pointer", margin: "5px 0" }}
                  onClick={() =>
                    flyToTeam(team.location.latitude, team.location.longitude)
                  }
                >
                  {team.school} ({team.conference})
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  );
};

export default More;
