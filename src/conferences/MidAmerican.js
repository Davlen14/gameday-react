import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import teamsService from "../services/teamsService";
import newsService from "../services/newsService";
import { FaTrophy, FaUserAlt, FaStar, FaNewspaper, FaChartBar } from 'react-icons/fa';
import { useNavigate } from "react-router-dom"; // Add this import

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
            logoImg.src = "/photos/Mid-American.png";
            logoImg.alt = "Mid-American Logo";

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

// Star rating component
const StarRating = ({ rating }) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    for (let i = 1; i <= 5; i++) {
        if (i <= fullStars) {
            stars.push(<FaStar key={i} color="#FFD700" />);
        } else if (i === fullStars + 1 && hasHalfStar) {
            stars.push(<FaStar key={i} color="#FFD700" style={{ opacity: 0.5 }} />);
        } else {
            stars.push(<FaStar key={i} color="#e0e0e0" />);
        }
    }
    
    return <div style={{ display: 'flex' }}>{stars}</div>;
};

const MidAmerican = () => {
    // Add the navigate hook
    const navigate = useNavigate();
    
    // Animation keyframes for the trophy shine effect
    const keyframesStyle = `
    @keyframes trophy-shine {
        0% { filter: drop-shadow(0 0 3px rgba(255, 215, 0, 0.7)); }
        50% { filter: drop-shadow(0 0 5px rgba(255, 215, 0, 0.9)); }
        100% { filter: drop-shadow(0 0 3px rgba(255, 215, 0, 0.7)); }
    }
    @keyframes trophy-rotate {
        0% { transform: perspective(100px) rotateY(-5deg); }
        50% { transform: perspective(100px) rotateY(5deg); }
        100% { transform: perspective(100px) rotateY(-5deg); }
    }`;

    useEffect(() => {
        // Add the animation keyframes to the document
        const styleElement = document.createElement('style');
        styleElement.textContent = keyframesStyle;
        document.head.appendChild(styleElement);
        
        return () => {
            document.head.removeChild(styleElement);
        };
    }, []);

    const [teams, setTeams] = useState([]);
    const [recruits, setRecruits] = useState([]);
    const [standings, setStandings] = useState([]);
    const [news, setNews] = useState([]);
    const [teamTalent, setTeamTalent] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [mapCenter, setMapCenter] = useState([41.0, -82.0]); // Centered more for MAC region
    const [mapZoom, setMapZoom] = useState(7);

    // MAC colors
    const macColors = {
      primary: "#003366", // Navy blue
      secondary: "#00AA7E", // Mint/seafoam green (instead of sky blue)
      accent: "#ffffff",   // White
      background: "#f5f5f5"
    };

    // Add navigation function to go to team detail page
    const goToTeamDetail = (teamId) => {
        navigate(`/teams/${teamId}`);
    };

    // Modern styled containers and components
    const pageStyle = {
        backgroundColor:"#ffffff", // White background
        padding: "20px 0",
        minHeight: "100vh",
        fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
        width: "98%",
        margin: "0 auto",
    };

    const headerStyle = {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        backgroundColor: "#ffffff", // White background
        color: macColors.primary, // Navy text
        boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
        borderRadius: "8px",
        marginBottom: "20px",
        width: "100%",
    };

    const logoStyle = {
        width: "150px",
        height: "auto",
        marginBottom: "10px",
    };

    const subtitleStyle = {
        fontSize: "1.2rem",
        color: macColors.primary,
        fontWeight: "300",
        letterSpacing: "0.1em",
        margin: "10px 0 0 0",
    };

    // Three column layout with news on left, main content in middle, and crystal ball on right
    const mainContentContainerStyle = {
        display: "grid",
        gridTemplateColumns: "350px 1fr 350px", // Left sidebar, main content, right sidebar
        gap: "20px",
        width: "100%",
    };

    const leftSidebarStyle = {
        display: "flex",
        flexDirection: "column",
    };

    const mainContentStyle = {
        display: "flex",
        flexDirection: "column",
    };

    const rightSidebarStyle = {
        display: "flex",
        flexDirection: "column",
    };

    // Modernized section style with stronger shadows and subtle border
    const sectionStyle = {
        width: "100%",
        backgroundColor: "#fff",
        borderRadius: "10px",
        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.12)",
        padding: "18px",
        marginBottom: "25px",
        border: "1px solid rgba(0, 0, 0, 0.05)",
    };

    const sectionTitleStyle = {
        fontSize: "1.5rem",
        fontWeight: "700",
        textAlign: "left",
        marginBottom: "15px",
        padding: "8px 0",
        color: macColors.primary,
        borderBottom: `2px solid ${macColors.secondary}`,
    };

    // Taller map container
    const mapContainerStyle = {
        width: "100%",
        height: "700px", // Taller map
        borderRadius: "8px",
        overflow: "hidden",
        position: "relative",
        boxShadow: "0 2px 12px rgba(0, 0, 0, 0.15)",
        border: "1px solid rgba(0, 0, 0, 0.08)",
    };

    const crystalBallTitleStyle = {
        fontSize: "1.6rem",
        fontWeight: "bold",
        textAlign: "left",
        marginBottom: "18px",
        padding: "0 0 10px 0",
        color: macColors.primary,
        textTransform: "uppercase",
        borderBottom: `2px solid ${macColors.secondary}`,
    };

    const newsTitleStyle = {
        ...crystalBallTitleStyle,
    };

    const talentTitleStyle = {
        ...crystalBallTitleStyle,
    };

    const talentRowStyle = {
        display: "flex",
        padding: "10px 0",
        borderBottom: "1px solid #eee",
        alignItems: "center",
        cursor: "pointer", // Add cursor pointer to show it's clickable
    };

    const talentBarContainerStyle = {
        height: "8px",
        borderRadius: "4px",
        backgroundColor: "#f0f0f0",
        overflow: "hidden",
        flex: 1,
        margin: "0 10px",
    };

    const recruitRowStyle = {
        display: "flex",
        padding: "12px 0",
        borderBottom: "1px solid #eee",
        alignItems: "center",
        cursor: "pointer", // Add cursor pointer to show it's clickable
    };

    const recruitIconStyle = {
        width: "42px",
        height: "42px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#f0f0f0",
        borderRadius: "50%",
        marginRight: "12px",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
    };

    const newsCardStyle = {
        padding: "14px",
        marginBottom: "18px",
        backgroundColor: "#fff",
        borderRadius: "10px",
        boxShadow: "0 3px 10px rgba(0,0,0,0.08)",
        transition: "transform 0.2s ease, box-shadow 0.2s ease",
        cursor: "pointer",
        border: "1px solid rgba(0, 0, 0, 0.05)",
    };

    const newsImageStyle = {
        width: "100%",
        height: "140px",
        objectFit: "cover",
        borderRadius: "6px",
        marginBottom: "12px",
    };

    const newsTitleTextStyle = {
        fontSize: "1rem",
        fontWeight: "600",
        marginBottom: "8px",
        lineHeight: "1.3",
        display: "-webkit-box",
        WebkitLineClamp: 2,
        WebkitBoxOrient: "vertical",
        overflow: "hidden",
        textOverflow: "ellipsis",
    };

    const newsDescriptionStyle = {
        fontSize: "0.85rem",
        color: "#555",
        marginBottom: "8px",
        display: "-webkit-box",
        WebkitLineClamp: 3,
        WebkitBoxOrient: "vertical",
        overflow: "hidden",
        textOverflow: "ellipsis",
    };

    const newsDateStyle = {
        fontSize: "0.75rem",
        color: "#888",
        textAlign: "right",
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
        color: macColors.secondary,
        marginLeft: "8px",
        fontSize: "18px"
    };

    // Custom marker icon with more modern style
    const customMarkerIcon = (logoUrl) => {
        return L.divIcon({
            html: `<div style="
                background: rgba(255, 255, 255, 0.95);
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                width: 45px;
                height: 45px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.2), 0 0 0 2px rgba(255,255,255,0.8);
                overflow: hidden;
                border: 2px solid #fff;
                transition: all 0.3s ease;
                cursor: pointer;
            ">
                <img src="${logoUrl}" alt="Team Logo" style="width: 35px; height: 35px; object-fit: contain;" />
            </div>`,
            className: "",
            iconSize: [45, 45],
            iconAnchor: [22.5, 22.5],
            popupAnchor: [0, -25],
        });
    };

    // Format date for news articles
    const formatNewsDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

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
                const macTeams = allTeams.filter(team => team.conference === "Mid-American");
                const teamsWithLocations = macTeams.filter(team =>
                    team.location && team.location.latitude && team.location.longitude
                );

                if (teamsWithLocations.length === 0) {
                    throw new Error("No Mid-American teams with location data found");
                }

                setTeams(teamsWithLocations);

                if (teamsWithLocations.length > 0) {
                    const latSum = teamsWithLocations.reduce((sum, team) => sum + team.location.latitude, 0);
                    const lngSum = teamsWithLocations.reduce((sum, team) => sum + team.location.longitude, 0);
                    setMapCenter([latSum / teamsWithLocations.length, lngSum / teamsWithLocations.length]);
                }

                // Fetch team talent data
                try {
                    console.log("Fetching team talent data");
                    const talentData = await teamsService.getTeamTalent();
                    
                    if (talentData && talentData.length > 0) {
                        // Filter for MAC teams and sort by talent score (highest to lowest)
                        const macTalent = talentData
                            .filter(team => 
                                macTeams.some(t => 
                                    t.school === team.team || 
                                    t.mascot === team.team
                                )
                            )
                            .sort((a, b) => b.talent - a.talent);
                        
                        setTeamTalent(macTalent);
                        console.log("MAC talent data:", macTalent);
                    }
                } catch (error) {
                    console.error("Error fetching talent data:", error);
                }

                // Fetch news using the working approach from LatestUpdates component
                try {
                    console.log("Fetching news with general fetchNews method...");
                    const newsData = await newsService.fetchNews();
                    
                    if (newsData && newsData.articles && newsData.articles.length > 0) {
                        console.log("Successfully fetched news articles:", newsData.articles.length);
                        // Sort by published date (newest first) if publishedAt exists
                        const sortedArticles = [...newsData.articles].sort((a, b) => {
                            if (a.publishedAt && b.publishedAt) {
                                return new Date(b.publishedAt) - new Date(a.publishedAt);
                            }
                            return 0;
                        });
                        setNews(sortedArticles); // Show all news articles
                    } else {
                        console.error("News API returned empty or invalid data:", newsData);
                        setNews([]);
                    }
                } catch (error) {
                    console.error("Error fetching news:", error);
                    setNews([]);
                }

                // Fetch top recruits
                const recruitsData = await teamsService.getAllRecruits();
                if (recruitsData && recruitsData.length > 0) {
                    // Filter for MAC recruits and sort by stars/rating
                    const macRecruits = recruitsData
                        .filter(recruit => 
                            recruit.committedTo && 
                            macTeams.some(t => 
                                t.school === recruit.committedTo || 
                                t.mascot === recruit.committedTo
                            )
                        )
                        .sort((a, b) => b.rating - a.rating)
                        .slice(0, 30); // Show 20 recruits
                    
                    // Add team logo URLs and team IDs to each recruit
                    const recruitsWithLogos = macRecruits.map(recruit => {
                        const team = macTeams.find(t => 
                            t.school === recruit.committedTo || 
                            t.mascot === recruit.committedTo
                        );
                        return {
                            ...recruit,
                            teamLogo: team?.logos?.[0] || null,
                            teamId: team?.id || null // Add teamId for navigation
                        };
                    });
                    
                    setRecruits(recruitsWithLogos);
                }

                // Fetch team records for standings
                console.log("Fetching records for MAC teams...");
                
                // First approach - try to get all records at once
                try {
                    const allRecords = await teamsService.getTeamRecords(); // Get all records
                    console.log("All records fetched:", allRecords);
                    
                    // Map MAC teams with their records
                    const standingsData = macTeams.map(team => {
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
                        macTeams.map(async (team) => {
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

                setLoading(false);
            } catch (err) {
                setError(`Error loading data: ${err.message}`);
                setLoading(false);
            }
        };

        fetchData();
    }, [dataVersion]); // Re-run when dataVersion changes

    const handleTeamClick = (teamId) => {
        // First fly to the team on the map
        const team = teams.find(t => t.id === teamId);
        if (team) {
            setMapCenter([team.location.latitude, team.location.longitude]);
            setMapZoom(17); // Good zoom level for stadiums
        }
        
        // Then navigate to the team detail page after a short delay to show the map animation
        setTimeout(() => {
            goToTeamDetail(teamId);
        }, 1500); // Wait 1.5 seconds, matching the map animation duration
    };

    if (loading) {
        return (
            <div style={loadingStyle}>
                <div style={{ marginBottom: "20px", color: macColors.primary }}>Loading Mid-American data...</div>
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
                        backgroundColor: macColors.secondary,
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
                        backgroundColor: macColors.secondary,
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

    // Find max talent score for normalization
    const maxTalent = teamTalent.length > 0 ? teamTalent[0].talent : 1000;
    
    // Find the team object from teamTalent array based on team name
    const findTeamIdByName = (teamName) => {
        const team = teams.find(t => t.school === teamName);
        return team ? team.id : null;
    };
    
    return (
        <div style={pageStyle}>
            {/* Header with Mid-American logo and subtitle */}
            <div style={headerStyle}>
                <img 
                    src="/photos/Mid-American.png" 
                    alt="Mid-American Logo" 
                    style={logoStyle} 
                />
                <h2 style={subtitleStyle}>WHO'S READY FOR SOME MACTION!!</h2>
            </div>

            <div style={mainContentContainerStyle}>
                {/* Left Sidebar - Team Talent and News */}
                <div style={leftSidebarStyle}>
                    {/* Team Talent Section - No scrolling */}
                    <div style={sectionStyle}>
                        <h2 style={talentTitleStyle}>
                            <FaChartBar style={{ marginRight: "10px" }} />
                            TEAM TALENT
                        </h2>
                        {teamTalent.length > 0 ? (
                            <div>
                                {teamTalent.map((team, index) => {
                                    const teamId = findTeamIdByName(team.team);
                                    
                                    return (
                                        <div 
                                            key={index} 
                                            style={{
                                                ...talentRowStyle,
                                                transition: "background-color 0.2s ease",
                                                ":hover": { backgroundColor: "#f5f5f5" } // Simple hover state
                                            }}
                                            onClick={() => teamId && goToTeamDetail(teamId)}
                                        >
                                            <div style={{ 
                                                width: "24px", 
                                                textAlign: "center", 
                                                fontWeight: "bold",
                                                fontSize: "0.9rem",
                                                color: index < 3 ? macColors.secondary : "#666"
                                            }}>
                                                {index + 1}
                                            </div>
                                            <div style={{ 
                                                display: "flex",
                                                alignItems: "center",
                                                width: "120px"
                                            }}>
                                                {/* Try to find the matching team logo */}
                                                {teams.find(t => t.school === team.team)?.logos?.[0] && (
                                                    <img
                                                        src={teams.find(t => t.school === team.team)?.logos?.[0] || "/photos/default_team.png"}
                                                        alt={team.team}
                                                        style={{
                                                            width: "20px",
                                                            height: "20px",
                                                            marginRight: "8px",
                                                            objectFit: "contain"
                                                        }}
                                                    />
                                                )}
                                                <span style={{ fontSize: "0.9rem", fontWeight: "500" }}>
                                                    {team.team}
                                                </span>
                                            </div>
                                            <div style={talentBarContainerStyle}>
                                                <div style={{
                                                    height: "100%",
                                                    width: `${(team.talent / maxTalent) * 100}%`,
                                                    backgroundColor: index < 3 ? macColors.secondary : "#aaa",
                                                    borderRadius: "4px"
                                                }} />
                                            </div>
                                            <div style={{ 
                                                width: "60px", 
                                                textAlign: "right",
                                                fontSize: "0.85rem",
                                                fontWeight: "500",
                                                color: index < 3 ? macColors.secondary : "#555"
                                            }}>
                                                {team.talent.toFixed(1)}
                                            </div>
                                        </div>
                                    );
                                })}
                                <div style={{ 
                                    marginTop: "10px",
                                    fontSize: "0.8rem",
                                    color: "#666",
                                    textAlign: "center",
                                    padding: "5px",
                                    backgroundColor: "#f9f9f9",
                                    borderRadius: "4px"
                                }}>
                                    Talent Composite scores based on recruiting ratings
                                </div>
                            </div>
                        ) : (
                            <div style={{ 
                                padding: "15px", 
                                textAlign: "center", 
                                color: "#666",
                                backgroundColor: "#f9f9f9",
                                borderRadius: "4px"
                            }}>
                                No talent data available
                            </div>
                        )}
                    </div>

                    {/* News Section - No scrolling */}
                    <div style={sectionStyle}>
                        <h2 style={newsTitleStyle}>LATEST NEWS</h2>
                        {news && news.length > 0 ? (
                            <div>
                                {news.map((article, index) => (
                                    <div key={index} style={newsCardStyle} onClick={() => window.open(article.url, "_blank")}>
                                        {article.image && (
                                            <img
                                                src={article.image}
                                                alt={article.title}
                                                style={newsImageStyle}
                                                onError={(e) => {
                                                    e.target.src = "/photos/default_news.jpg";
                                                }}
                                            />
                                        )}
                                        <h3 style={newsTitleTextStyle}>{article.title}</h3>
                                        <p style={newsDescriptionStyle}>{article.description || "Read more..."}</p>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ 
                                                backgroundColor: '#f0f0f0', 
                                                padding: '3px 6px',
                                                borderRadius: '4px',
                                                fontSize: '0.7rem',
                                                color: '#555'
                                            }}>
                                                {article.source && article.source.name ? article.source.name : "College Sports"}
                                            </span>
                                            <p style={newsDateStyle}>{article.publishedAt && formatNewsDate(article.publishedAt)}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div style={{ 
                                padding: "20px", 
                                textAlign: "center", 
                                backgroundColor: "#f9f9f9",
                                borderRadius: "6px",
                                color: "#666"
                            }}>
                                <FaNewspaper style={{ fontSize: "24px", marginBottom: "10px", opacity: 0.6 }} />
                                <p>No news articles available at the moment</p>
                                <button 
                                    onClick={refreshData}
                                    style={{
                                        marginTop: "10px",
                                        padding: "8px 16px",
                                        backgroundColor: macColors.secondary,
                                        color: "white",
                                        border: "none",
                                        borderRadius: "4px",
                                        cursor: "pointer",
                                        fontSize: "0.8rem"
                                    }}
                                >
                                    Refresh News
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Main content area */}
                <div style={mainContentStyle}>
                    {/* Conference Standings Section - Now at the top */}
                    <div style={sectionStyle}>
                        <h2 style={sectionTitleStyle}>Conference Standings</h2>
                        <div style={{ overflowX: "auto", width: "100%" }}>
                            <table style={{ 
                                width: "100%", 
                                borderCollapse: "collapse", 
                                textAlign: "left",
                                boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
                                borderRadius: "4px",
                                overflow: "hidden"
                            }}>
                                <thead>
                                    <tr style={{ 
                                        backgroundColor: macColors.primary, 
                                        color: "white",
                                    }}>
                                        <th style={{ padding: "10px", textAlign: "left" }}>Team</th>
                                        <th style={{ padding: "10px", textAlign: "center" }}>Conference</th>
                                        <th style={{ padding: "10px", textAlign: "center" }}>Pct</th>
                                        <th style={{ padding: "10px", textAlign: "center" }}>Overall</th>
                                        <th style={{ padding: "10px", textAlign: "center" }}>Pct</th>
                                        <th style={{ padding: "10px", textAlign: "center" }}>Home</th>
                                        <th style={{ padding: "10px", textAlign: "center" }}>Away</th>
                                        <th style={{ padding: "10px", textAlign: "center" }}>Postseason</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {standings.map((team, index) => (
                                        <tr 
                                            key={index} 
                                            style={{ 
                                                backgroundColor: index % 2 === 0 ? "#f9f9f9" : "white",
                                                borderBottom: "1px solid #eee",
                                                cursor: "pointer", // Show clickable cursor
                                            }}
                                            onClick={() => goToTeamDetail(team.id)}
                                            onMouseOver={(e) => e.currentTarget.style.backgroundColor = "#f0f0f0"} 
                                            onMouseOut={(e) => e.currentTarget.style.backgroundColor = index % 2 === 0 ? "#f9f9f9" : "white"}
                                        >
                                            <td style={{ 
                                                padding: "8px", 
                                                display: "flex", 
                                                alignItems: "center"
                                            }}>
                                                <img 
                                                    src={team.logo || "/photos/default_team.png"} 
                                                    alt={team.school}
                                                    style={{
                                                        width: "25px",
                                                        height: "25px",
                                                        marginRight: "8px",
                                                        objectFit: "contain"
                                                    }}
                                                />
                                                <div>
                                                    <div style={{ display: "flex", alignItems: "center", fontWeight: "bold", fontSize: "0.9rem" }}>
                                                        {team.school}
                                                        {/* Conference champion trophy */}
                                                        {index === 0 && <FaTrophy style={conferenceTrophyStyle} title="MAC Champion" />}
                                                    </div>
                                                </div>
                                            </td>
                                            <td style={{ padding: "8px", textAlign: "center", fontSize: "0.9rem" }}>
                                                {team.conference.wins}-{team.conference.losses}
                                                {team.conference.ties > 0 ? `-${team.conference.ties}` : ''}
                                            </td>
                                            <td style={{ padding: "8px", textAlign: "center", fontSize: "0.9rem" }}>
                                                {calculateWinPct(team.conference.wins, team.conference.losses, team.conference.ties)}%
                                            </td>
                                            <td style={{ padding: "8px", textAlign: "center", fontSize: "0.9rem" }}>
                                                {team.overall.wins}-{team.overall.losses}
                                                {team.overall.ties > 0 ? `-${team.overall.ties}` : ''}
                                            </td>
                                            <td style={{ padding: "8px", textAlign: "center", fontSize: "0.9rem" }}>
                                                {calculateWinPct(team.overall.wins, team.overall.losses, team.overall.ties)}%
                                            </td>
                                            <td style={{ padding: "8px", textAlign: "center", fontSize: "0.9rem" }}>
                                                {team.homeRecord?.wins || 0}-{team.homeRecord?.losses || 0}
                                            </td>
                                            <td style={{ padding: "8px", textAlign: "center", fontSize: "0.9rem" }}>
                                                {team.awayRecord?.wins || 0}-{team.awayRecord?.losses || 0}
                                            </td>
                                            <td style={{ padding: "8px", textAlign: "center", fontSize: "0.9rem" }}>
                                                {team.postseasonRecord?.wins || 0}-{team.postseasonRecord?.losses || 0}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Map Section - Now taller with a modernized look */}
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
                                    attribution="" // Removed attribution text
                                />
                                {teams.map((team) => (
                                    <Marker
                                        key={team.id}
                                        position={[team.location.latitude, team.location.longitude]}
                                        icon={customMarkerIcon(team.logos?.[0] || "/photos/default_team.png")}
                                        eventHandlers={{
                                            click: () => goToTeamDetail(team.id)
                                        }}
                                    >
                                        <Popup>
                                            <div 
                                                style={{
                                                    display: "flex",
                                                    flexDirection: "column",
                                                    alignItems: "center",
                                                    padding: "10px",
                                                    cursor: "pointer"
                                                }}
                                                onClick={() => goToTeamDetail(team.id)}
                                            >
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
                                                <button 
                                                    style={{
                                                        marginTop: "10px",
                                                        padding: "5px 10px",
                                                        backgroundColor: macColors.secondary,
                                                        color: "white",
                                                        border: "none",
                                                        borderRadius: "4px",
                                                        cursor: "pointer",
                                                        fontSize: "0.8rem"
                                                    }}
                                                >
                                                    View Team Details
                                                </button>
                                            </div>
                                        </Popup>
                                    </Marker>
                                ))}
                                <MapControl teams={teams} onTeamClick={handleTeamClick} />
                                <MapViewUpdater center={mapCenter} zoom={mapZoom} />
                            </MapContainer>
                        </div>
                    </div>
                </div>

                {/* Right Sidebar - Crystal Ball (Recruits) */}
                <div style={rightSidebarStyle}>
                    <div style={sectionStyle}>
                        <h2 style={crystalBallTitleStyle}>CRYSTAL BALL</h2>
                        {recruits.length > 0 ? (
                            <div>
                                {recruits.map((recruit, index) => (
                                    <div 
                                        key={index} 
                                        style={recruitRowStyle}
                                        onClick={() => recruit.teamId && goToTeamDetail(recruit.teamId)}
                                    >
                                        <div style={recruitIconStyle}>
                                            <FaUserAlt size={20} color="#666" />
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: "bold", fontSize: "0.95rem" }}>
                                                {recruit.name || "Unnamed Recruit"}
                                            </div>
                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                <div style={{ 
                                                    fontSize: "0.8rem", 
                                                    color: "#666", 
                                                    display: "flex", 
                                                    alignItems: "center"
                                                }}>
                                                    {recruit.position || "Unknown"} • 
                                                    {recruit.teamLogo && (
                                                        <img 
                                                            src={recruit.teamLogo} 
                                                            alt={recruit.committedTo}
                                                            style={{
                                                                width: "18px",
                                                                height: "18px",
                                                                margin: "0 4px",
                                                                objectFit: "contain",
                                                            }}
                                                        />
                                                    )}
                                                    {recruit.committedTo || "Uncommitted"}
                                                </div>
                                                <div style={{ display: "flex", alignItems: "center" }}>
                                                    <span style={{ 
                                                        backgroundColor: macColors.secondary,
                                                        color: "white",
                                                        padding: "2px 6px",
                                                        borderRadius: "4px",
                                                        fontSize: "0.75rem",
                                                        fontWeight: "bold",
                                                        marginRight: "5px"
                                                    }}>
                                                        {recruit.stars || Math.floor(recruit.rating)}★
                                                    </span>
                                                </div>
                                            </div>
                                            <div style={{ marginTop: "2px" }}>
                                                <StarRating rating={recruit.stars || recruit.rating} />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                <div style={{ 
                                    marginTop: "15px", 
                                    textAlign: "center",
                                    padding: "8px",
                                    borderTop: "1px solid #eee" 
                                }}>
                                    <a href="#" style={{ 
                                        color: macColors.secondary,
                                        textDecoration: "none",
                                        fontWeight: "bold",
                                        fontSize: "0.9rem"
                                    }}>
                                        View All Predictions
                                    </a>
                                </div>
                            </div>
                        ) : (
                            <p>No recruit data available</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MidAmerican;