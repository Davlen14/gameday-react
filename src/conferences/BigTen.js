import React, { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import teamsService from "../services/teamsService";

// Fix for marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
    iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png"
});

// Custom Map Control for Title and Legend (INLINE STYLES)
const MapControl = ({ teams, onTeamClick }) => {
    const map = useMap();

    useEffect(() => {
        const control = L.control({ position: "topleft" });

        control.onAdd = () => {
            const div = L.DomUtil.create("div");

            // Inline styles for map-control-container
            Object.assign(div.style, {
                backgroundColor: "rgba(255, 255, 255, 0.8)",
                padding: "10px",
                borderRadius: "10px",
                boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
                fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
                maxWidth: "250px", // Control width
                minWidth: "180px"
            });

            const mapTitleDiv = L.DomUtil.create("div", "", div);
            //Inline styles for map-title
            Object.assign(mapTitleDiv.style, {
              display: "flex",
              alignItems: "center",
              marginBottom: "10px",
            });


            const logoImg = L.DomUtil.create("img", "", mapTitleDiv);
            //Inline styles for map-title-logo
            Object.assign(logoImg.style, {
                width: "40px",
                height: "40px",
                marginRight: "10px",
                objectFit: "contain"
            });
            logoImg.src = "/photos/Big Ten.png";
            logoImg.alt = "Big Ten Logo";

            const titleH1 = L.DomUtil.create("h1", "", mapTitleDiv);
            //Inline styles for the h1 in map-title
             Object.assign(titleH1.style, {
                fontSize: "1.5rem",
                margin: "0",
                fontWeight: "bold",
                color: "#002855", // Dark blue - Big Ten color
            });
            titleH1.textContent = "Big Ten Conference";


            const legendDiv = L.DomUtil.create("div", "", div);
            //Inline styles for legend
            Object.assign(legendDiv.style, {
                marginTop: "10px"
            });

            const legendH3 = L.DomUtil.create('h3', "", legendDiv);
             //Inline styles for h3 in legend
            Object.assign(legendH3.style, {
                fontSize: "1.1rem",
                margin: "0 0 8px 0",
                fontWeight: "bold",
            });
            legendH3.textContent = "Teams";


            const ul = L.DomUtil.create("ul", "", legendDiv);
            //Inline styles for ul in legend
             Object.assign(ul.style, {
                listStyle: "none",
                padding: "0",
                margin: "0",
            });

            teams.forEach(team => {
                const li = L.DomUtil.create("li", "", ul);
                li.setAttribute("data-team-id", team.id);

                // Inline Styles for li in legend
                Object.assign(li.style, {
                  display: "flex",
                  alignItems: "center",
                  marginBottom: "5px",
                  cursor: "pointer",
                  padding: "5px",
                  borderRadius: "5px",
                  transition: "background-color 0.2s",
                });

                li.addEventListener('mouseover', () => {
                    li.style.backgroundColor = "#f0f0f0"; // Light gray on hover
                });
                li.addEventListener('mouseout', () => {
                    li.style.backgroundColor = "";
                });



                const img = L.DomUtil.create("img", "", li);
                img.src = team.logos?.[0] || "/photos/default_team.png";
                img.alt = team.school;
                // Inline Styles for legend-logo
                Object.assign(img.style, {
                    width: "25px",
                    height: "25px",
                    marginRight: "8px",
                    objectFit: "contain",
                });


                const span = L.DomUtil.create("span", "", li);
                //Inline styles for span in legend
                Object.assign(span.style,{
                    fontSize: "0.9rem"
                });
                span.textContent = team.school;
            });


            // Event delegation for legend clicks
            L.DomEvent.addListener(div, 'click', (e) => {
                const teamId = e.target.closest('li')?.dataset.teamId;
                if (teamId) {
                    onTeamClick(parseInt(teamId));
                }
            });
            return div;
        };


        control.addTo(map);
        return () => control.remove();
    }, [teams, map, onTeamClick]);

    return null; // This component doesn't render anything directly
};


const BigTen = () => {
    const [teams, setTeams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [mapCenter, setMapCenter] = useState([41.0, -85.0]); // Default center
    const [mapZoom, setMapZoom] = useState(6);

    // Inline Styling
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


    const mapContainerStyle = {
        width: "100%",
        height: "500px",
        borderRadius: "10px",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
        margin: "20px 0 30px 0", // Added margin
        position: "relative", // For absolute positioning of the title
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

    // Custom marker icon (INLINE STYLES)
    const customMarkerIcon = (logoUrl) => {
        return L.divIcon({
            html: `<div style="
        background: rgba(255, 255, 255, 0.9);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 45px;
        height: 45px;
        box-shadow: 0 3px 12px rgba(0,0,0,0.3);
        overflow: hidden;
        border: 3px solid #fff;
      ">
        <img src="${logoUrl}" alt="Team Logo" style="width: 35px; height: 35px; object-fit: contain;" />
      </div>`,
            className: "",
            iconSize: [45, 45],
            iconAnchor: [22.5, 22.5],
            popupAnchor: [0, -25],
        });
    };


    // Fetch teams
    useEffect(() => {
        const fetchBigTenTeams = async () => {
            try {
                setLoading(true);
                const allTeams = await teamsService.getTeams();
                const bigTenTeams = allTeams.filter(team => team.conference === "Big Ten");
                const teamsWithLocations = bigTenTeams.filter(team =>
                    team.location && team.location.latitude && team.location.longitude
                );

                if (teamsWithLocations.length === 0) {
                    throw new Error("No Big Ten teams with location data found");
                }

                setTeams(teamsWithLocations);

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

    const handleTeamClick = (teamId) => {
        const team = teams.find(t => t.id === teamId);
        if (team) {
            setMapCenter([team.location.latitude, team.location.longitude]);
            setMapZoom(10);
        }
    };

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
            <div style={mapContainerStyle}>
                <MapContainer
                    center={mapCenter}
                    zoom={mapZoom}
                    style={{ height: "100%", width: "100%", borderRadius: "10px" }} // borderRadius for MapContainer
                >
                  <TileLayer
                    url="https://tiles.stadiamaps.com/tiles/stamen_terrain/{z}/{x}/{y}{r}.png" // College-themed map style
                    attribution='&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>, &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a> &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors'
                    />
                    {teams.map((team) => (
                        <Marker
                            key={team.id}
                            position={[team.location.latitude, team.location.longitude]}
                            icon={customMarkerIcon(team.logos?.[0] || "/photos/default_team.png")}
                        >
                            <Popup>
                                 {/* Popup styling (INLINE) */}
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
                                        onError={(e) => { e.target.src = "/photos/default_team.png"; }}
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
                    {/* Custom Control for Title and Legend */}
                    <MapControl teams={teams} onTeamClick={handleTeamClick} />
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
                            onError={(e) => { e.target.src = "/photos/default_team.png"; }}
                        />
                        <span style={teamNameStyle}>{team.school}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default BigTen;