import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import teamsService from "../services/teamsService";
import { FaTrophy } from 'react-icons/fa';

// Fix for marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
    iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png"
});

// Helper component to update map view with smooth animation when center/zoom changes
const MapViewUpdater = ({ center, zoom }) => {
    const map = useMap();
    
    useEffect(() => {
        // Use flyTo for smooth animated transitions between map locations
        map.flyTo(center, zoom, {
            animate: true,
            duration: 1.5, // Duration of animation in seconds
            easeLinearity: 0.25, // Makes the animation more natural
            noMoveStart: false // Ensures the movestart event is fired
        });
    }, [center, zoom, map]);
    
    return null;
};

// Custom Map Control for Title and Legend
const MapControl = ({ teams, onTeamClick }) => {
    const map = useMap();

    useEffect(() => {
        const control = L.control({ position: "topleft" });

        control.onAdd = () => {
            const div = L.DomUtil.create("div");

            // Inline styles for map-control-container
            Object.assign(div.style, {
                backgroundColor: "rgba(255, 255, 255, 0.9)",
                padding: "10px", 
                borderRadius: "8px", 
                boxShadow: "0 4px 15px rgba(0,0,0,0.15)",
                fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
                maxWidth: "230px",
                minWidth: "180px"
            });

            const mapTitleDiv = L.DomUtil.create("div", "", div);
            // Inline styles for map-title
            Object.assign(mapTitleDiv.style, {
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              marginBottom: "8px",
            });

            const logoImg = L.DomUtil.create("img", "", mapTitleDiv);
            // Inline styles for map-title-logo
            Object.assign(logoImg.style, {
                width: "40px",
                height: "40px",
                objectFit: "contain"
            });
            logoImg.src = "/photos/Big Ten.png";
            logoImg.alt = "Big Ten Logo";

            const legendDiv = L.DomUtil.create("div", "", div);
            // Inline styles for legend
            Object.assign(legendDiv.style, {
                marginTop: "8px"
            });

            const ul = L.DomUtil.create("ul", "", legendDiv);
            // Inline styles for ul in legend
            Object.assign(ul.style, {
                listStyle: "none",
                padding: "0",
                margin: "0",
                display: 'flex',
                flexWrap: 'wrap',
                gap: '4px',
                justifyContent: 'space-between'
            });

            teams.forEach(team => {
                const li = L.DomUtil.create("li", "", ul);
                li.setAttribute("data-team-id", team.id);

                // Inline Styles for li in legend
                Object.assign(li.style, {
                  display: "flex",
                  alignItems: "center",
                  marginBottom: "3px",
                  cursor: "pointer",
                  padding: "3px",
                  borderRadius: "4px",
                  transition: "background-color 0.2s",
                  width: '45%',
                });

                li.addEventListener('mouseover', () => {
                    li.style.backgroundColor = "#f0f0f0";
                });
                li.addEventListener('mouseout', () => {
                    li.style.backgroundColor = "";
                });

                const img = L.DomUtil.create("img", "", li);
                img.src = team.logos?.[0] || "/photos/default_team.png";
                img.alt = team.school;
                // Inline Styles for legend-logo
                Object.assign(img.style, {
                    width: "20px",
                    height: "20px",
                    marginRight: "5px",
                    objectFit: "contain",
                });

                const span = L.DomUtil.create("span", "", li);
                // Inline styles for span in legend
                Object.assign(span.style, {
                    fontSize: "0.8rem"
                });
                // Use team abbreviation from API
                span.textContent = team.abbreviation || team.school.substring(0, 3).toUpperCase();
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

    return null;
};

const BigTen = () => {
    const [teams, setTeams] = useState([]);
    const [polls, setPolls] = useState([]);
    const [recruits, setRecruits] = useState([]);
    const [standings, setStandings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [mapCenter, setMapCenter] = useState([41.0, -85.0]);
    const [mapZoom, setMapZoom] = useState(6);

    // Modern styled containers and components
    const pageStyle = {
        backgroundColor: "#f8f9fa",
        padding: "20px 0",
        minHeight: "100vh",
        fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
    };

    const headerStyle = {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "30px 20px",
        backgroundColor: "#fff",
        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)",
        borderRadius: "12px",
        margin: "0 auto 30px auto",
        maxWidth: "1200px",
    };

    const logoStyle = {
        width: "180px",
        height: "auto",
        marginBottom: "10px",
    };

    const subtitleStyle = {
        fontSize: "1.2rem",
        color: "#666",
        fontWeight: "300",
        letterSpacing: "0.1em",
        margin: "0",
    };

    const containerStyle = {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
        padding: "20px",
        textAlign: "center",
        fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
        color: "#333",
        width: "100%",
        maxWidth: "1200px",
        margin: "0 auto 30px auto",
    };

    const sectionStyle = {
        width: "100%",
        backgroundColor: "#fff",
        borderRadius: "12px",
        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)",
        padding: "20px",
        marginBottom: "30px",
    };

    const sectionTitleStyle = {
        fontSize: "1.5rem",
        fontWeight: "600",
        textAlign: "left",
        marginBottom: "20px",
        borderBottom: "2px solid #002855", // Big Ten blue
        paddingBottom: "10px",
        color: "#002855",
    };

    const mapContainerStyle = {
        width: "100%",
        height: "500px",
        borderRadius: "10px",
        overflow: "hidden",
        position: "relative",
    };

    const gridStyle = {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
        gap: "20px",
        width: "100%",
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

    // Trophy styles
    const conferenceTrophyStyle = {
        color: "#002855", // Big Ten blue
        marginLeft: "8px",
        fontSize: "20px"
    };

    const nationalTrophyStyle = {
        color: "#FFD700", // Gold color
        marginLeft: "8px",
        fontSize: "20px"
    };

    // Custom marker icon
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

    // Fetch data
    // Force a data fetch if needed
    const [dataVersion, setDataVersion] = useState(1);
    
    // Function to force refresh data
    const refreshData = () => {
        console.log("Forcing data refresh...");
        setDataVersion(prev => prev + 1);
    };
    
    useEffect(() => {
        const fetchData = async () => {
            try {
                console.log("Starting data fetch process...");
                setLoading(true);
                
                // Fetch teams
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

                // Fetch postseason poll data
                const pollsData = await teamsService.getPolls(2024, "ap", "postseason");
                if (pollsData && pollsData.length > 0) {
                    // Filter for just Big Ten teams in the polls
                    const bigTenRankings = pollsData[0].rankings.filter(
                        team => bigTenTeams.some(t => t.school === team.school)
                    );
                    setPolls(bigTenRankings);
                }

                // Fetch top recruits
                const recruitsData = await teamsService.getAllRecruits();
                if (recruitsData && recruitsData.length > 0) {
                    // Filter for Big Ten recruits and sort by stars/rating
                    const bigTenRecruits = recruitsData
                        .filter(recruit => 
                            recruit.committedTo && 
                            bigTenTeams.some(t => 
                                t.school === recruit.committedTo || 
                                t.mascot === recruit.committedTo
                            )
                        )
                        .sort((a, b) => b.rating - a.rating)
                        .slice(0, 10); // Get top 10
                    
                    setRecruits(bigTenRecruits);
                }

                // Fetch team records for standings
                console.log("Fetching records for Big Ten teams...");
                
                // First approach - try to get all records at once
                try {
                    const allRecords = await teamsService.getTeamRecords(); // Get all records
                    console.log("All records fetched:", allRecords);
                    
                    // Map Big Ten teams with their records
                    const standingsData = bigTenTeams.map(team => {
                        // Find the record for this team
                        const teamRecord = allRecords.find(r => r.teamId === team.id) || {};
                        console.log(`Record for ${team.school}:`, teamRecord);
                        
                        return {
                            id: team.id,
                            school: team.school,
                            mascot: team.mascot,
                            logo: team.logos?.[0],
                            color: team.color,
                            conference: {
                                wins: teamRecord.conferenceGames?.wins || 0,
                                losses: teamRecord.conferenceGames?.losses || 0,
                                ties: teamRecord.conferenceGames?.ties || 0
                            },
                            overall: {
                                wins: teamRecord.total?.wins || 0,
                                losses: teamRecord.total?.losses || 0,
                                ties: teamRecord.total?.ties || 0
                            },
                            expectedWins: teamRecord.expectedWins,
                            homeRecord: teamRecord.homeGames,
                            awayRecord: teamRecord.awayGames,
                            postseasonRecord: teamRecord.postseason
                        };
                    });
                    
                    // Sort by conference win percentage
                    const sortedStandings = standingsData.sort((a, b) => {
                        const aWinPct = a.conference.wins / Math.max(1, (a.conference.wins + a.conference.losses + a.conference.ties));
                        const bWinPct = b.conference.wins / Math.max(1, (b.conference.wins + b.conference.losses + b.conference.ties));
                        
                        if (bWinPct !== aWinPct) {
                            return bWinPct - aWinPct;
                        }
                        
                        // If tie in conference, sort by overall record
                        const aOverallWinPct = a.overall.wins / Math.max(1, (a.overall.wins + a.overall.losses + a.overall.ties));
                        const bOverallWinPct = b.overall.wins / Math.max(1, (b.overall.wins + b.overall.losses + b.overall.ties));
                        
                        return bOverallWinPct - aOverallWinPct;
                    });
                    
                    console.log("Sorted standings:", sortedStandings);
                    setStandings(sortedStandings);
                    
                } catch (error) {
                    console.error("Error fetching all records:", error);
                    
                    // Fallback: Fetch individual team records as before
                    console.log("Falling back to individual record fetching...");
                    const fallbackStandings = await Promise.all(
                        bigTenTeams.map(async (team) => {
                            try {
                                const records = await teamsService.getTeamRecords(team.id);
                                console.log(`Records for ${team.school}:`, records);
                                return {
                                    id: team.id,
                                    school: team.school,
                                    mascot: team.mascot,
                                    logo: team.logos?.[0],
                                    color: team.color,
                                    conference: {
                                        wins: records.conferenceGames?.wins || 0,
                                        losses: records.conferenceGames?.losses || 0,
                                        ties: records.conferenceGames?.ties || 0
                                    },
                                    overall: {
                                        wins: records.total?.wins || 0,
                                        losses: records.total?.losses || 0,
                                        ties: records.total?.ties || 0
                                    },
                                    expectedWins: records.expectedWins,
                                    homeRecord: records.homeGames,
                                    awayRecord: records.awayGames,
                                    postseasonRecord: records.postseason
                                };
                            } catch (error) {
                                console.error(`Error fetching records for ${team.school}:`, error);
                                return {
                                    id: team.id,
                                    school: team.school,
                                    mascot: team.mascot,
                                    logo: team.logos?.[0],
                                    color: team.color,
                                    conference: { wins: 0, losses: 0, ties: 0 },
                                    overall: { wins: 0, losses: 0, ties: 0 }
                                };
                            }
                        })
                    );
                    
                    // Sort and set the standings
                    const sortedFallback = fallbackStandings.sort((a, b) => {
                        const aWinPct = a.conference.wins / Math.max(1, (a.conference.wins + a.conference.losses));
                        const bWinPct = b.conference.wins / Math.max(1, (b.conference.wins + b.conference.losses));
                        return bWinPct - aWinPct;
                    });
                    
                    console.log("Fallback sorted standings:", sortedFallback);
                    setStandings(sortedFallback);
                }

                // This code section has been moved into the try/catch block above
                setLoading(false);
            } catch (err) {
                setError(`Error loading data: ${err.message}`);
                setLoading(false);
            }
        };

        fetchData();
    }, [dataVersion]); // Re-run when dataVersion changes

    const handleTeamClick = (teamId) => {
        const team = teams.find(t => t.id === teamId);
        if (team) {
            setMapCenter([team.location.latitude, team.location.longitude]);
            setMapZoom(17); // Good zoom level for stadiums
        }
    };

    if (loading) {
        return (
            <div style={loadingStyle}>
                <div style={{ marginBottom: "20px" }}>Loading Big Ten data...</div>
                <div>🏈</div>
            </div>
        );
    }

    if (error) {
        return (
            <div style={errorStyle}>
                <div>{error}</div>
                <button 
                    onClick={refreshData}
                    style={{
                        marginTop: "20px",
                        padding: "10px 20px",
                        backgroundColor: "#002855",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer"
                    }}
                >
                    Try Again
                </button>
            </div>
        );
    }
    
    // Handle empty standings
    if (standings.length === 0) {
        return (
            <div style={errorStyle}>
                <div>No standings data available. Try refreshing the data.</div>
                <button 
                    onClick={refreshData}
                    style={{
                        marginTop: "20px",
                        padding: "10px 20px",
                        backgroundColor: "#002855",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer"
                    }}
                >
                    Refresh Data
                </button>
            </div>
        );
    }

    // Calculate conference and overall winning percentages
    const calculateWinPct = (wins, losses, ties) => {
        wins = parseInt(wins) || 0;
        losses = parseInt(losses) || 0;
        ties = parseInt(ties) || 0;
        
        const total = wins + losses + ties;
        if (total === 0) return 0;
        return (wins / total * 100).toFixed(1);
    };
    
    // Debug - check if we have standings data
    console.log("Standings data at render time:", standings);

    return (
        <div style={pageStyle}>
            {/* Header with Big Ten logo and subtitle */}
            <div style={headerStyle}>
                <img 
                    src="/photos/Big Ten.png" 
                    alt="Big Ten Logo" 
                    style={logoStyle} 
                />
                <h2 style={subtitleStyle}>LEADERS AND LEGENDS</h2>
            </div>

            <div style={containerStyle}>
                {/* Map Section */}
                <div style={sectionStyle}>
                    <h2 style={sectionTitleStyle}>Conference Map</h2>
                    <div style={mapContainerStyle}>
                        <MapContainer
                            center={mapCenter}
                            zoom={mapZoom}
                            style={{ height: "100%", width: "100%" }}
                            doubleClickZoom={true}
                            closePopupOnClick={false}
                            dragging={true}
                            zoomSnap={true}
                            zoomDelta={true}
                            trackResize={true}
                            touchZoom={true}
                            scrollWheelZoom={true}
                        >
                            <TileLayer
                                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                                attribution="Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community"
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
                            <MapControl teams={teams} onTeamClick={handleTeamClick} />
                            <MapViewUpdater center={mapCenter} zoom={mapZoom} />
                        </MapContainer>
                    </div>
                </div>

                {/* Conference Standings Section */}
                <div style={sectionStyle}>
                    <h2 style={sectionTitleStyle}>Conference Standings</h2>
                    <div style={{ overflowX: "auto", width: "100%" }}>
                        <table style={{ 
                            width: "100%", 
                            borderCollapse: "collapse", 
                            textAlign: "left",
                            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                            borderRadius: "8px",
                            overflow: "hidden"
                        }}>
                            <thead>
                                <tr style={{ 
                                    backgroundColor: "#002855", 
                                    color: "white",
                                }}>
                                    <th style={{ padding: "12px", textAlign: "left" }}>Team</th>
                                    <th style={{ padding: "12px", textAlign: "center" }}>Conference</th>
                                    <th style={{ padding: "12px", textAlign: "center" }}>Pct</th>
                                    <th style={{ padding: "12px", textAlign: "center" }}>Overall</th>
                                    <th style={{ padding: "12px", textAlign: "center" }}>Pct</th>
                                    <th style={{ padding: "12px", textAlign: "center" }}>Home</th>
                                    <th style={{ padding: "12px", textAlign: "center" }}>Away</th>
                                    <th style={{ padding: "12px", textAlign: "center" }}>Postseason</th>
                                </tr>
                            </thead>
                            <tbody>
                                {standings.map((team, index) => (
                                    <tr key={index} style={{ 
                                        backgroundColor: index % 2 === 0 ? "#f8f9fa" : "white",
                                        borderBottom: "1px solid #e0e0e0"
                                    }}>
                                        <td style={{ 
                                            padding: "10px", 
                                            display: "flex", 
                                            alignItems: "center"
                                        }}>
                                            <img 
                                                src={team.logo || "/photos/default_team.png"} 
                                                alt={team.school}
                                                style={{
                                                    width: "30px",
                                                    height: "30px",
                                                    marginRight: "10px",
                                                    objectFit: "contain"
                                                }}
                                            />
                                            <div style={{ display: "flex", alignItems: "center" }}>
                                                <div style={{ fontWeight: "bold" }}>
                                                    {team.school}
                                                    {/* Conference champion trophy */}
                                                    {index === 0 && <FaTrophy style={conferenceTrophyStyle} title="Big Ten Champion" />}
                                                    {/* National champion trophy */}
                                                    {team.school === "Ohio State" && <FaTrophy style={nationalTrophyStyle} title="National Champion" />}
                                                </div>
                                                <div style={{ fontSize: "0.8rem", color: "#666" }}>{team.mascot}</div>
                                            </div>
                                        </td>
                                        <td style={{ padding: "10px", textAlign: "center" }}>
                                            {team.conference.wins}-{team.conference.losses}
                                            {team.conference.ties > 0 ? `-${team.conference.ties}` : ''}
                                        </td>
                                        <td style={{ padding: "10px", textAlign: "center" }}>
                                            {calculateWinPct(team.conference.wins, team.conference.losses, team.conference.ties)}%
                                        </td>
                                        <td style={{ padding: "10px", textAlign: "center" }}>
                                            {team.overall.wins}-{team.overall.losses}
                                            {team.overall.ties > 0 ? `-${team.overall.ties}` : ''}
                                        </td>
                                        <td style={{ padding: "10px", textAlign: "center" }}>
                                            {calculateWinPct(team.overall.wins, team.overall.losses, team.overall.ties)}%
                                        </td>
                                        <td style={{ padding: "10px", textAlign: "center" }}>
                                            {team.homeRecord?.wins || 0}-{team.homeRecord?.losses || 0}
                                        </td>
                                        <td style={{ padding: "10px", textAlign: "center" }}>
                                            {team.awayRecord?.wins || 0}-{team.awayRecord?.losses || 0}
                                        </td>
                                        <td style={{ padding: "10px", textAlign: "center" }}>
                                            {team.postseasonRecord?.wins || 0}-{team.postseasonRecord?.losses || 0}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Top Recruits Section */}
                <div style={sectionStyle}>
                    <h2 style={sectionTitleStyle}>Top Big Ten Recruits</h2>
                    <div style={gridStyle}>
                        {recruits.length > 0 ? recruits.map((recruit, index) => (
                            <div key={index} style={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                padding: "15px",
                                borderRadius: "8px",
                                boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
                                backgroundColor: "white",
                                transition: "transform 0.2s",
                                cursor: "pointer",
                                position: "relative"
                            }}>
                                {/* Star rating */}
                                <div style={{
                                    position: "absolute",
                                    top: "10px",
                                    right: "10px",
                                    backgroundColor: "#FFD700",
                                    borderRadius: "50%",
                                    width: "35px",
                                    height: "35px",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontWeight: "bold",
                                    boxShadow: "0 2px 5px rgba(0,0,0,0.2)"
                                }}>
                                    {recruit.stars || Math.floor(recruit.rating)}★
                                </div>
                                
                                {/* Find the team this recruit is committed to */}
                                {teams.some(t => 
                                    t.school === recruit.committedTo || 
                                    t.mascot === recruit.committedTo
                                ) && (
                                    <img 
                                        src={teams.find(t => 
                                            t.school === recruit.committedTo || 
                                            t.mascot === recruit.committedTo
                                        )?.logos?.[0] || "/photos/default_team.png"}
                                        alt={recruit.committedTo}
                                        style={{
                                            width: "50px",
                                            height: "50px",
                                            objectFit: "contain",
                                            marginBottom: "10px"
                                        }}
                                    />
                                )}
                                
                                <h3 style={{ margin: "5px 0", fontSize: "1.1rem" }}>
                                    {recruit.name || "Unnamed Recruit"}
                                </h3>
                                <p style={{ margin: "3px 0", color: "#666", fontSize: "0.9rem" }}>
                                    {recruit.position || "Unknown Position"}
                                </p>
                                <p style={{ margin: "3px 0", color: "#333", fontSize: "0.9rem", fontWeight: "500" }}>
                                    {recruit.committedTo || "Uncommitted"}
                                </p>
                                {recruit.hometown && (
                                    <p style={{ margin: "3px 0", color: "#666", fontSize: "0.8rem" }}>
                                        {recruit.hometown}, {recruit.stateProvince}
                                    </p>
                                )}
                            </div>
                        )) : (
                            <p>No recruit data available</p>
                        )}
                    </div>
                </div>

                {/* Rankings Section */}
                {polls.length > 0 && (
                    <div style={sectionStyle}>
                        <h2 style={sectionTitleStyle}>Big Ten Teams in Final AP Poll</h2>
                        <div style={{ 
                            display: "flex", 
                            flexWrap: "wrap", 
                            gap: "15px",
                            justifyContent: "center" 
                        }}>
                            {polls.map((team, index) => (
                                <div key={index} style={{
                                    display: "flex",
                                    alignItems: "center",
                                    padding: "12px 20px",
                                    borderRadius: "8px",
                                    boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
                                    backgroundColor: "white",
                                    minWidth: "220px",
                                    // Highlight national champion
                                    border: team.school === "Ohio State" ? "2px solid #FFD700" : "none"
                                }}>
                                    <div style={{
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        minWidth: "35px",
                                        height: "35px",
                                        backgroundColor: "#002855",
                                        color: "white",
                                        borderRadius: "50%",
                                        marginRight: "15px",
                                        fontWeight: "bold"
                                    }}>
                                        {team.rank}
                                    </div>
                                    <div style={{
                                        display: "flex",
                                        alignItems: "center"
                                    }}>
                                        <img 
                                            src={teams.find(t => t.school === team.school)?.logos?.[0] || "/photos/default_team.png"}
                                            alt={team.school}
                                            style={{
                                                width: "30px",
                                                height: "30px",
                                                objectFit: "contain",
                                                marginRight: "10px"
                                            }}
                                        />
                                        <div>
                                            <div style={{ display: "flex", alignItems: "center" }}>
                                                <div style={{ fontWeight: "bold" }}>{team.school}</div>
                                                {team.school === "Ohio State" && <FaTrophy style={{...nationalTrophyStyle, marginLeft: "5px", fontSize: "16px"}} />}
                                            </div>
                                            <div style={{ fontSize: "0.8rem", color: "#666" }}>
                                                {team.points && `${team.points} points`}
                                                {team.firstPlaceVotes > 0 && ` (${team.firstPlaceVotes} first place)`}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BigTen;