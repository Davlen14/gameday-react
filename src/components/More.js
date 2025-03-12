import React, { useState, useEffect, useRef } from "react";
import teamsService from "../services/teamsService";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
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
      mapRef.current.flyTo([lat, lng], 12, { duration: 1.5 });
    }
  };

  // Create a small colored circle icon for each team
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
      <h1>Interactive CFB Map</h1>
      <MapContainer
        center={[39.8283, -98.5795]}
        zoom={4}
        style={{ height: "600px", width: "100%" }}
        whenCreated={(map) => (mapRef.current = map)}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {validTeams.map((team) => (
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
                  style={{ width: "50px", height: "auto", marginBottom: "5px" }}
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

      <div style={{ marginTop: "20px" }}>
        <h2>Team List</h2>
        <ul style={{ listStyle: "none", padding: 0 }}>
          {validTeams.map((team) => (
            <li
              key={team.id}
              style={{
                cursor: "pointer",
                padding: "5px 0",
                borderBottom: "1px solid #eee"
              }}
              onClick={() =>
                flyToTeam(team.location.latitude, team.location.longitude)
              }
            >
              {team.school} ({team.conference || "Independent"})
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default More;
