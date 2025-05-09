import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import teamsService from "../services/teamsService";
import newsService from "../services/newsService";
import { FaTrophy, FaUserAlt, FaStar, FaNewspaper } from 'react-icons/fa';
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
            logoImg.src = "/photos/SEC.png";
            logoImg.alt = "SEC Logo";

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

const SEC = () => {
    // Add the navigate hook
    const navigate = useNavigate();
    
    const [teams, setTeams] = useState([]);
    const [recruits, setRecruits] = useState([]);
    const [standings, setStandings] = useState([]);
    const [news, setNews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [mapCenter, setMapCenter] = useState([33.5, -88.0]); // Approximate center of SEC states
    const [mapZoom, setMapZoom] = useState(6);

    // Add navigation function to go to team detail page
    const goToTeamDetail = (teamId) => {
        navigate(`/teams/${teamId}`);
    };

    // SEC colors based on official logo
    const secColors = {
        primary: "#002649", // Dark blue
        secondary: "#f2a900", // Gold
        accent: "#ffffff",   // White
        background: "#f5f5f5"
    };

    // Modern styled containers and components
    const pageStyle = {
        backgroundColor: "#ffffff",
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
        color: secColors.primary, // SEC blue text
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
        color: secColors.primary, // SEC blue text
        fontWeight: "300",
        letterSpacing: "0.1em",
        margin: "0",
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

    const sectionStyle = {
        width: "100%",
        backgroundColor: "#fff",
        borderRadius: "8px",
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
        padding: "15px",
        marginBottom: "20px",
    };

    const sectionTitleStyle = {
        fontSize: "1.4rem",
        fontWeight: "700",
        textAlign: "left",
        marginBottom: "15px",
        padding: "8px 0",
        color: secColors.primary,
        borderBottom: `2px solid ${secColors.secondary}`,
    };

    const mapContainerStyle = {
        width: "100%",
        height: "500px",
        borderRadius: "8px",
        overflow: "hidden",
        position: "relative",
    };

    const crystalBallTitleStyle = {
        fontSize: "1.6rem",
        fontWeight: "bold",
        textAlign: "left",
        marginBottom: "15px",
        padding: "0 0 10px 0",
        color: secColors.primary,
        textTransform: "uppercase",
        borderBottom: `2px solid ${secColors.secondary}`,
    };

    const newsTitleStyle = {
        ...crystalBallTitleStyle,
    };

    const recruitRowStyle = {
        display: "flex",
        padding: "10px 0",
        borderBottom: "1px solid #eee",
        alignItems: "center",
        cursor: "pointer", // Add cursor pointer to show it's clickable
    };

    const recruitIconStyle = {
        width: "40px",
        height: "40px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#f0f0f0",
        borderRadius: "50%",
        marginRight: "10px",
    };

    const newsCardStyle = {
        padding: "12px",
        marginBottom: "15px",
        backgroundColor: "#fff",
        borderRadius: "8px",
        boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
        transition: "transform 0.2s ease, box-shadow 0.2s ease",
        cursor: "pointer",
    };

    const newsImageStyle = {
        width: "100%",
        height: "140px",
        objectFit: "cover",
        borderRadius: "6px",
        marginBottom: "10px",
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
        color: secColors.secondary, // SEC gold
        marginLeft: "8px",
        fontSize: "18px"
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
                const secTeams = allTeams.filter(team => team.conference === "SEC");
                const teamsWithLocations = secTeams.filter(team =>
                    team.location && team.location.latitude && team.location.longitude
                );

                if (teamsWithLocations.length === 0) {
                    throw new Error("No SEC teams with location data found");
                }

                setTeams(teamsWithLocations);

                if (teamsWithLocations.length > 0) {
                    const latSum = teamsWithLocations.reduce((sum, team) => sum + team.location.latitude, 0);
                    const lngSum = teamsWithLocations.reduce((sum, team) => sum + team.location.longitude, 0);
                    setMapCenter([latSum / teamsWithLocations.length, lngSum / teamsWithLocations.length]);
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
                        setNews(sortedArticles.slice(0, 10)); // Get top 10 news articles
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
                    // Filter for SEC recruits and sort by stars/rating
                    const secRecruits = recruitsData
                        .filter(recruit => 
                            recruit.committedTo && 
                            secTeams.some(t => 
                                t.school === recruit.committedTo || 
                                t.mascot === recruit.committedTo
                            )
                        )
                        .sort((a, b) => b.rating - a.rating)
                        .slice(0, 10); // Get top 10
                    
                    // Add team logo URLs and team IDs to each recruit
                    const recruitsWithLogos = secRecruits.map(recruit => {
                        const team = secTeams.find(t => 
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
                console.log("Fetching records for SEC teams...");
                
                // First approach - try to get all records at once
                try {
                    const allRecords = await teamsService.getTeamRecords(); // Get all records
                    console.log("All records fetched:", allRecords);
                    
                    // Map SEC teams with their records
                    const standingsData = secTeams.map(team => {
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
                        secTeams.map(async (team) => {
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
                <div style={{ marginBottom: "20px", color: secColors.primary }}>Loading SEC data...</div>
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
                        backgroundColor: secColors.secondary,
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
                        backgroundColor: secColors.secondary,
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

    // Find the team object from teamData array based on team name
    const findTeamIdByName = (teamName) => {
        const team = teams.find(t => t.school === teamName);
        return team ? team.id : null;
    };
    
    return (
        <div style={pageStyle}>
            {/* Header with SEC logo and subtitle */}
            <div style={headerStyle}>
                <img 
                    src="/photos/SEC.png" 
                    alt="SEC Logo" 
                    style={logoStyle} 
                />
                <h2 style={subtitleStyle}>IT JUST MEANS MORE</h2>
            </div>

            <div style={mainContentContainerStyle}>
                {/* Left Sidebar - News */}
                <div style={leftSidebarStyle}>
                    <div style={sectionStyle}>
                        <h2 style={newsTitleStyle}>LATEST NEWS</h2>
                        {news && news.length > 0 ? (
                            <div style={{ maxHeight: '850px', overflowY: 'auto' }}>
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
                                        backgroundColor: secColors.secondary,
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
                                        backgroundColor: secColors.primary, 
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
                                                        {index === 0 && <FaTrophy style={conferenceTrophyStyle} title="SEC Champion" />}
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

                    {/* Map Section - Now below standings */}
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
                                                        backgroundColor: secColors.secondary,
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
                                                        backgroundColor: secColors.secondary,
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
                                        color: secColors.secondary,
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

export default SEC;