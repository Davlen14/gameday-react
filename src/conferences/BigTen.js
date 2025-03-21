import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import teamsService from "../services/teamsService"; // Import the teamsService

// Fix for marker icons in Leaflet with React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png"
});

const BigTen = () => {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mapCenter, setMapCenter] = useState([41.0, -85.0]); // Default center around Big Ten region
  const [mapZoom, setMapZoom] = useState(6);

  // Styling
  const containerStyle = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "flex-start",
    padding: "20px",
    textAlign: "center",
    minHeight: "90vh",
    fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
    color: "#333",
    width: "100%",
    maxWidth: "1200px",
    margin: "0 auto",
  };

  const headerStyle = {
    display: "flex",
    alignItems: "center",
    marginBottom: "30px",
    width: "100%",
  };

  const logoStyle = {
    width: "80px",
    height: "80px",
    objectFit: "contain",
    marginRight: "20px",
  };

  const headingStyle = {
    fontSize: "2.2rem",
    margin: 0,
  };

  const mapContainerStyle = {
    width: "100%",
    height: "500px",
    borderRadius: "10px",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
    margin: "20px 0 30px 0",
  };

  const teamListStyle = {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: "20px",
    width: "100%",
    marginTop: "20px",
  };

  const glassyTeamLogoStyle = {
    width: "80px",
    height: "80px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "15px",
    borderRadius: "15px",
    background: "rgba(255, 255, 255, 0.25)",
    backdropFilter: "blur(10px)",
    border: "1px solid rgba(255, 255, 255, 0.18)",
    boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.17)",
    transition: "transform 0.3s ease, box-shadow 0.3s ease",
    cursor: "pointer",
  };

  const teamLogoImageStyle = {
    width: "100%",
    height: "auto",
    objectFit: "contain",
    maxHeight: "50px",
  };

  const teamNameStyle = {
    fontSize: "0.8rem",
    marginTop: "8px",
    fontWeight: "bold",
  };

  const loadingStyle = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "40px",
    fontSize: "1.2rem",
  };

  const errorStyle = {
    color: "#e53935",
    padding: "20px",
    textAlign: "center",
    border: "1px solid #ffcdd2",
    borderRadius: "8px",
    backgroundColor: "#ffebee",
  };

  // Custom marker icon for team logos
  const customMarkerIcon = (logoUrl) => {
    return L.divIcon({
      html: `<div style="
        background: rgba(255, 255, 255, 0.8);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 40px;
        height: 40px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        overflow: hidden;
        border: 2px solid #fff;
      ">
        <img src="${logoUrl}" alt="Team Logo" style="width: 30px; height: 30px; object-fit: contain;" />
      </div>`,
      className: "",
      iconSize: [40, 40],
      iconAnchor: [20, 20],
      popupAnchor: [0, -20],
    });
  };

  // Fetch Big Ten teams from teamsService
  useEffect(() => {
    const fetchBigTenTeams = async () => {
      try {
        setLoading(true);
        // Fetch all teams and filter for Big Ten
        const allTeams = await teamsService.getTeams();
        const bigTenTeams = allTeams.filter(team => team.conference === "Big Ten");
        
        // Make sure we have valid location data for each team
        const teamsWithLocations = bigTenTeams.filter(team => 
          team.location && team.location.latitude && team.location.longitude
        );
        
        if (teamsWithLocations.length === 0) {
          throw new Error("No Big Ten teams with location data found");
        }
        
        setTeams(teamsWithLocations);
        
        // Calculate map center based on team locations
        if (teamsWithLocations.length > 0) {
          const latSum = teamsWithLocations.reduce((sum, team) => sum + team.location.latitude, 0);
          const lngSum = teamsWithLocations.reduce((sum, team) => sum + team.location.longitude, 0);
          setMapCenter([latSum / teamsWithLocations.length, lngSum / teamsWithLocations.length]);
        }
        
        setLoading(false);
      } catch (err) {
        setError(`Error loading Big Ten teams: ${err.message}`);
        setLoading(false);
      }
    };

    fetchBigTenTeams();
  }, []);

  if (loading) {
    return (
      <div style={loadingStyle}>
        <div style={{ marginBottom: "20px" }}>Loading Big Ten team data...</div>
        <div>🏈</div>
      </div>
    );
  }

  if (error) {
    return <div style={errorStyle}>{error}</div>;
  }

  return (
    <div style={containerStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <img src="/photos/Big Ten.png" alt="Big Ten Logo" style={logoStyle} />
        <h1 style={headingStyle}>Big Ten Conference Teams Map</h1>
      </div>

      {/* Map */}
      <div style={mapContainerStyle}>
        <MapContainer 
          center={mapCenter} 
          zoom={mapZoom} 
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          
          {teams.map((team) => (
            <Marker
              key={team.id}
              position={[team.location.latitude, team.location.longitude]}
              icon={customMarkerIcon(team.logos?.[0] || "/photos/default_team.png")}
            >
              <Popup>
                <div style={{ 
                  display: "flex", 
                  flexDirection: "column", 
                  alignItems: "center", 
                  padding: "10px" 
                }}>
                  <img 
                    src={team.logos?.[0] || "/photos/default_team.png"} 
                    alt={team.school} 
                    style={{ width: "50px", height: "50px", marginBottom: "10px" }}
                    onError={(e) => { e.target.src = "/photos/default_team.png" }}
                  />
                  <h3 style={{ margin: "5px 0" }}>{team.school}</h3>
                  <p style={{ margin: "5px 0" }}>{team.mascot}</p>
                  <p style={{ margin: "5px 0" }}>
                    {team.location.city}, {team.location.state}
                  </p>
                  {team.location.name && (
                    <p style={{ margin: "5px 0", fontStyle: "italic" }}>
                      {team.location.name}
                    </p>
                  )}
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {/* Team Logos */}
      <h2>Teams</h2>
      <div style={teamListStyle}>
        {teams.map((team) => (
          <div 
            key={team.id} 
            style={glassyTeamLogoStyle}
            onClick={() => {
              setMapCenter([team.location.latitude, team.location.longitude]);
              setMapZoom(10);
            }}
          >
            <img
              src={team.logos?.[0] || "/photos/default_team.png"}
              alt={team.school}
              style={teamLogoImageStyle}
              onError={(e) => { e.target.src = "/photos/default_team.png" }}
            />
            <span style={teamNameStyle}>{team.school}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BigTen;