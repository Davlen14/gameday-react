import React, { useState, useEffect, useRef } from "react";
import teamsService from "../services/teamsService";
import {
  MapContainer,
  TileLayer,
  GeoJSON,
  Marker,
  Popup
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Import the relevant Turf functions
import { points, voronoi } from "@turf/turf";

// Fix default Leaflet icons
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
  const [voronoiData, setVoronoiData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const mapRef = useRef(null);

  // 1) Fetch your teams from the service
  useEffect(() => {
    const fetchTeams = async () => {
      try {
        setLoading(true);
        const data = await teamsService.getTeams();

        // Filter for FBS teams that have valid coordinates
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

  // 2) Once teams are loaded, generate Voronoi polygons
  useEffect(() => {
    if (teams.length === 0) return;

    // Convert team stadiums to GeoJSON points (note: Turf uses [lng, lat])
    const teamCoords = teams.map((team) => [
      team.location.longitude,
      team.location.latitude
    ]);
    const teamPoints = points(teamCoords);

    // Generate Voronoi polygons for the entire bounding box of the US
    // Adjust this [minX, minY, maxX, maxY] to include your region of interest.
    // For the lower-48 states, something like:
    const options = {
      bbox: [-125, 24, -66, 50] // [west, south, east, north]
    };

    // voronoi() returns a FeatureCollection of polygons
    const voronoiPolygons = voronoi(teamPoints, options);

    // Each polygon in the result has a property "pointIndex"
    // which indicates which input point generated it.
    // We can attach each team's color and info to that polygon:
    voronoiPolygons.features.forEach((feature) => {
      const idx = feature.properties.pointIndex; // index of the team in 'teams'
      const team = teams[idx];
      feature.properties.teamId = team.id;
      feature.properties.teamSchool = team.school;
      feature.properties.teamConference = team.conference;
      feature.properties.teamColor =
        team.color && team.color !== "null" ? team.color : "#666";
      feature.properties.teamLogo = team.logos?.[0] || "/photos/default_team.png";
    });

    setVoronoiData(voronoiPolygons);
  }, [teams]);

  // 3) Define a style function for each Voronoi polygon
  const styleVoronoiPolygon = (feature) => {
    return {
      fillColor: feature.properties.teamColor,
      color: "#ffffff", // Outline color
      weight: 1,
      fillOpacity: 0.6
    };
  };

  // 4) Optionally, bind popups or tooltips to polygons
  const onEachVoronoiPolygon = (feature, layer) => {
    const props = feature.properties;
    const popupContent = `
      <div style="text-align:center;">
        <img 
          src="${props.teamLogo}" 
          alt="${props.teamSchool}" 
          style="width:50px;height:auto;margin-bottom:5px;"
          onerror="this.src='/photos/default_team.png';"
        />
        <h3 style="margin:5px 0;">${props.teamSchool}</h3>
        <p style="margin:0;"><strong>Conference:</strong> ${
          props.teamConference || "Independent"
        }</p>
      </div>
    `;
    layer.bindPopup(popupContent);
  };

  // 5) If you still want markers at each stadium:
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

  // Helper: fly to a team's location if you click on them in a list
  const flyToTeam = (lat, lng) => {
    if (mapRef.current) {
      mapRef.current.flyTo([lat, lng], 6, { duration: 1.5 });
    }
  };

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
      <h1>Voronoi FBS Map</h1>
      {error && <p style={{ color: "red" }}>{error}</p>}

      {loading ? (
        <p>Loading teams...</p>
      ) : (
        <MapContainer
          center={[37.8, -96]} // roughly center of the US
          zoom={4}
          style={{ height: "600px", width: "100%" }}
          whenCreated={(map) => (mapRef.current = map)}
        >
          {/* Base map tiles */}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org">OSM</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* The Voronoi polygons, each colored by the team color */}
          {voronoiData && (
            <GeoJSON
              data={voronoiData}
              style={styleVoronoiPolygon}
              onEachFeature={onEachVoronoiPolygon}
            />
          )}

          {/* Optional markers for stadium locations */}
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
      )}

      {/* Optional list to fly to a team */}
      {!loading && teams.length > 0 && (
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
      )}
    </div>
  );
};

export default More;
