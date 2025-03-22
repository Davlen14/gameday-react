import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import teamsService from "../services/teamsService";
import newsService from "../services/newsService";
import { FaTrophy, FaUserAlt, FaStar, FaNewspaper, FaChartBar } from 'react-icons/fa';

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
            logoImg.src = "/photos/NC2A.png";
            logoImg.alt = "NCAA Logo";

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

const Teams = () => {
    const [teams, setTeams] = useState([]);
    const [recruits, setRecruits] = useState([]);
    const [standings, setStandings] = useState([]);
    const [news, setNews] = useState([]);
    const [teamTalent, setTeamTalent] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [mapCenter, setMapCenter] = useState([39.8283, -98.5795]); // Center of US
    const [mapZoom, setMapZoom] = useState(4); // Zoom level to show continental US

    // NCAA colors
    const ncaaColors = {
        primary: "#D20A2C", // Red (primary color for headers)
        secondary: "#000000", // Black
        accent: "#ffffff",   // White
        background: "#f5f5f5"
    };

    // CSS styles - mirroring the BigTen.css approach but embedded within the component
    const styles = {
        pageStyle: {
            backgroundColor: "#ffffff",
            padding: "20px 0",
            minHeight: "100vh",
            fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
            width: "98%",
            margin: "0 auto",
        },
        
        headerStyle: {
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
            backgroundColor: "#ffffff",
            color: "#000000",
            boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
            borderRadius: "8px",
            marginBottom: "20px",
            width: "100%",
        },
        
        logoStyle: {
            width: "200px",
            height: "auto",
            marginBottom: "15px",
        },
        
        subtitleStyle: {
            fontSize: "1.2rem",
            color: "#000000",
            fontWeight: "500",
            margin: "10px 0 0 0",
            textAlign: "center",
            fontFamily: "'Orbitron', 'Titillium Web', sans-serif",
        },
        
        mainContentContainerStyle: {
            display: "grid",
            gridTemplateColumns: "350px 1fr 350px", // Left sidebar, main content, right sidebar
            gap: "20px",
            width: "100%",
        },
        
        leftSidebarStyle: {
            display: "flex",
            flexDirection: "column",
        },
        
        mainContentStyle: {
            display: "flex",
            flexDirection: "column",
        },
        
        rightSidebarStyle: {
            display: "flex",
            flexDirection: "column",
        },
        
        sectionStyle: {
            width: "100%",
            backgroundColor: "#fff",
            borderRadius: "8px",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
            padding: "15px",
            marginBottom: "20px",
        },
        
        sectionTitleStyle: {
            fontSize: "1.4rem",
            fontWeight: "700",
            textAlign: "left",
            marginBottom: "15px",
            padding: "8px 0",
            color: ncaaColors.primary,
            borderBottom: `2px solid ${ncaaColors.secondary}`,
        },
        
        mapContainerStyle: {
            width: "100%",
            height: "500px",
            borderRadius: "8px",
            overflow: "hidden",
            position: "relative",
        },
        
        crystalBallTitleStyle: {
            fontSize: "1.6rem",
            fontWeight: "bold",
            textAlign: "left",
            marginBottom: "15px",
            padding: "0 0 10px 0",
            color: ncaaColors.primary,
            textTransform: "uppercase",
            borderBottom: `2px solid ${ncaaColors.secondary}`,
        },
        
        newsTitleStyle: {
            fontSize: "1.6rem",
            fontWeight: "bold",
            textAlign: "left",
            marginBottom: "15px",
            padding: "0 0 10px 0",
            color: ncaaColors.primary,
            textTransform: "uppercase",
            borderBottom: `2px solid ${ncaaColors.secondary}`,
        },
        
        talentTitleStyle: {
            fontSize: "1.6rem",
            fontWeight: "bold",
            textAlign: "left",
            marginBottom: "15px",
            padding: "0 0 10px 0",
            color: ncaaColors.primary,
            textTransform: "uppercase",
            borderBottom: `2px solid ${ncaaColors.secondary}`,
        },
        
        talentRowStyle: {
            display: "flex",
            padding: "8px 0",
            borderBottom: "1px solid #eee",
            alignItems: "center",
        },
        
        talentBarContainerStyle: {
            height: "8px",
            borderRadius: "4px",
            backgroundColor: "#f0f0f0",
            overflow: "hidden",
            flex: 1,
            margin: "0 10px",
        },
        
        recruitRowStyle: {
            display: "flex",
            padding: "10px 0",
            borderBottom: "1px solid #eee",
            alignItems: "center",
        },
        
        recruitIconStyle: {
            width: "40px",
            height: "40px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#f0f0f0",
            borderRadius: "50%",
            marginRight: "10px",
        },
        
        newsCardStyle: {
            padding: "12px",
            marginBottom: "15px",
            backgroundColor: "#fff",
            borderRadius: "8px",
            boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
            transition: "transform 0.2s ease, box-shadow 0.2s ease",
            cursor: "pointer",
        },
        
        newsImageStyle: {
            width: "100%",
            height: "140px",
            objectFit: "cover",
            borderRadius: "6px",
            marginBottom: "10px",
        },
        
        newsTitleTextStyle: {
            fontSize: "1rem",
            fontWeight: "600",
            marginBottom: "8px",
            lineHeight: "1.3",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            textOverflow: "ellipsis",
        },
        
        newsDescriptionStyle: {
            fontSize: "0.85rem",
            color: "#555",
            marginBottom: "8px",
            display: "-webkit-box",
            WebkitLineClamp: 3,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            textOverflow: "ellipsis",
        },
        
        newsDateStyle: {
            fontSize: "0.75rem",
            color: "#888",
            textAlign: "right",
        },
        
        loadingStyle: {
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "40px",
            fontSize: "1.2rem",
        },
        
        errorStyle: {
            color: "#e53935",
            padding: "20px",
            textAlign: "center",
            border: "1px solid #ffcdd2",
            borderRadius: "8px",
            backgroundColor: "#ffebee",
        },
        
        conferenceTrophyStyle: {
            color: ncaaColors.secondary, 
            marginLeft: "8px",
            fontSize: "18px"
        },
        
        nationalTrophyStyle: {
            color: "#FFD700", // Gold color
            marginLeft: "8px",
            fontSize: "18px"
        },
        
        seasonBanner: {
            backgroundColor: "#000",
            color: "white",
            padding: "0.5rem 2rem",
            borderRadius: "4px",
            marginTop: "-10px",
            zIndex: 1,
            fontWeight: "bold",
            letterSpacing: "1px",
            border: "2px solid #333",
            position: "relative",
        },
        
        seasonText: {
            fontSize: "1.2rem",
            fontWeight: "700",
        },
        
        // Media queries would be handled with conditional styling or a library like react-responsive
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
                
                // Fetch all teams
                const allTeams = await teamsService.getTeams();
                
                // Filter teams with locations for the map
                const teamsWithLocations = allTeams.filter(team =>
                    team.location && team.location.latitude && team.location.longitude
                );

                if (teamsWithLocations.length === 0) {
                    throw new Error("No teams with location data found");
                }

                setTeams(teamsWithLocations);

                if (teamsWithLocations.length > 0) {
                    // Center map on average of all team coordinates
                    const latSum = teamsWithLocations.reduce((sum, team) => sum + team.location.latitude, 0);
                    const lngSum = teamsWithLocations.reduce((sum, team) => sum + team.location.longitude, 0);
                    setMapCenter([latSum / teamsWithLocations.length, lngSum / teamsWithLocations.length]);
                }

                // Fetch team talent data
                try {
                    console.log("Fetching team talent data");
                    const talentData = await teamsService.getTeamTalent();
                    
                    if (talentData && talentData.length > 0) {
                        // Sort teams by talent score (highest to lowest)
                        const sortedTalent = talentData
                            .sort((a, b) => b.talent - a.talent)
                            .slice(0, 25); // Top 25 teams
                        
                        setTeamTalent(sortedTalent);
                        console.log("Team talent data (top 25):", sortedTalent);
                    }
                } catch (error) {
                    console.error("Error fetching talent data:", error);
                }

                // Fetch news
                try {
                    console.log("Fetching college football news...");
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
                    // Sort by stars/rating
                    const topRecruits = recruitsData
                        .sort((a, b) => b.rating - a.rating)
                        .slice(0, 10); // Get top 10
                    
                    // Add team logo URLs to each recruit
                    const recruitsWithLogos = topRecruits.map(recruit => {
                        const team = allTeams.find(t => 
                            t.school === recruit.committedTo || 
                            t.mascot === recruit.committedTo
                        );
                        return {
                            ...recruit,
                            teamLogo: team?.logos?.[0] || null
                        };
                    });
                    
                    setRecruits(recruitsWithLogos);
                }

                // Fetch team records for standings
                console.log("Fetching records for all teams...");
                
                try {
                    const allRecords = await teamsService.getTeamRecords(); // Get all records
                    console.log("All records fetched:", allRecords);
                    
                    // Create standings from team records
                    const standingsData = teamsWithLocations.map(team => {
                        // Find the record for this team
                        const teamRecord = allRecords.find(r => r.teamId === team.id) || {};
                        
                        return {
                            id: team.id,
                            school: team.school,
                            mascot: team.mascot,
                            logo: team.logos?.[0],
                            color: team.color,
                            conference: team.conference,
                            conferenceRecord: {
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
                    
                    // Group by conference
                    const conferenceGroups = {};
                    standingsData.forEach(team => {
                        if (!conferenceGroups[team.conference]) {
                            conferenceGroups[team.conference] = [];
                        }
                        conferenceGroups[team.conference].push(team);
                    });
                    
                    // Sort each conference group by win percentage
                    Object.keys(conferenceGroups).forEach(conf => {
                        conferenceGroups[conf].sort((a, b) => {
                            const aWinPct = a.conferenceRecord.wins / Math.max(1, (a.conferenceRecord.wins + a.conferenceRecord.losses + a.conferenceRecord.ties));
                            const bWinPct = b.conferenceRecord.wins / Math.max(1, (b.conferenceRecord.wins + b.conferenceRecord.losses + b.conferenceRecord.ties));
                            
                            if (bWinPct !== aWinPct) {
                                return bWinPct - aWinPct;
                            }
                            
                            // If tie in conference, sort by overall record
                            const aOverallWinPct = a.overall.wins / Math.max(1, (a.overall.wins + a.overall.losses + a.overall.ties));
                            const bOverallWinPct = b.overall.wins / Math.max(1, (b.overall.wins + b.overall.losses + b.overall.ties));
                            
                            return bOverallWinPct - aOverallWinPct;
                        });
                    });
                    
                    // Get top 25 based on overall record
                    const top25 = standingsData
                        .sort((a, b) => {
                            const aOverallWinPct = a.overall.wins / Math.max(1, (a.overall.wins + a.overall.losses + a.overall.ties));
                            const bOverallWinPct = b.overall.wins / Math.max(1, (b.overall.wins + b.overall.losses + b.overall.ties));
                            return bOverallWinPct - aOverallWinPct;
                        })
                        .slice(0, 25);
                    
                    setStandings(top25);
                    
                } catch (error) {
                    console.error("Error fetching all records:", error);
                    setStandings([]);
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
        const team = teams.find(t => t.id === teamId);
        if (team) {
            setMapCenter([team.location.latitude, team.location.longitude]);
            setMapZoom(17); // Good zoom level for stadiums
        }
    };

    if (loading) {
        return (
            <div style={styles.loadingStyle}>
                <div style={{ marginBottom: "20px" }}>Loading NCAA Football data...</div>
                <div>🏈</div>
            </div>
        );
    }

    if (error) {
        return (
            <div style={styles.errorStyle}>
                <div>{error}</div>
                <button 
                    onClick={refreshData}
                    style={{
                        marginTop: "20px",
                        padding: "10px 20px",
                        backgroundColor: ncaaColors.secondary,
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
    
    return (
        <div style={styles.pageStyle}>
            {/* Header with NCAA logo and subtitle */}
            <div style={styles.headerStyle}>
                <img 
                    src="/photos/NC2A.png" 
                    alt="NCAA Logo" 
                    style={styles.logoStyle} 
                />
                <p style={styles.subtitleStyle}>The Heart of Saturday: NCAA Football, where dreams are chased and rivalries are born.</p>
            </div>

            <div style={styles.mainContentContainerStyle}>
                {/* Left Sidebar - Team Talent and News */}
                <div style={styles.leftSidebarStyle}>
                    {/* Team Talent Section */}
                    <div style={styles.sectionStyle}>
                        <h2 style={styles.talentTitleStyle}>
                            <FaChartBar style={{ marginRight: "10px" }} />
                            TEAM TALENT
                        </h2>
                        {teamTalent.length > 0 ? (
                            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                                {teamTalent.map((team, index) => (
                                    <div key={index} style={styles.talentRowStyle}>
                                        <div style={{ 
                                            width: "24px", 
                                            textAlign: "center", 
                                            fontWeight: "bold",
                                            fontSize: "0.9rem",
                                            color: index < 3 ? ncaaColors.secondary : "#666"
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
                                        <div style={styles.talentBarContainerStyle}>
                                            <div style={{
                                                height: "100%",
                                                width: `${(team.talent / maxTalent) * 100}%`,
                                                backgroundColor: index < 3 ? ncaaColors.secondary : "#aaa",
                                                borderRadius: "4px"
                                            }} />
                                        </div>
                                        <div style={{ 
                                            width: "60px", 
                                            textAlign: "right",
                                            fontSize: "0.85rem",
                                            fontWeight: "500",
                                            color: index < 3 ? ncaaColors.secondary : "#555"
                                        }}>
                                            {team.talent.toFixed(1)}
                                        </div>
                                    </div>
                                ))}
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

                    {/* News Section */}
                    <div style={styles.sectionStyle}>
                        <h2 style={styles.newsTitleStyle}>LATEST NEWS</h2>
                        {news && news.length > 0 ? (
                            <div style={{ maxHeight: '650px', overflowY: 'auto' }}>
                                {news.map((article, index) => (
                                    <div key={index} style={styles.newsCardStyle} onClick={() => window.open(article.url, "_blank")}>
                                        {article.image && (
                                            <img
                                                src={article.image}
                                                alt={article.title}
                                                style={styles.newsImageStyle}
                                                onError={(e) => {
                                                    e.target.src = "/photos/default_news.jpg";
                                                }}
                                            />
                                        )}
                                        <h3 style={styles.newsTitleTextStyle}>{article.title}</h3>
                                        <p style={styles.newsDescriptionStyle}>{article.description || "Read more..."}</p>
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
                                            <p style={styles.newsDateStyle}>{article.publishedAt && formatNewsDate(article.publishedAt)}</p>
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
                                        backgroundColor: ncaaColors.secondary,
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
                <div style={styles.mainContentStyle}>
                    {/* Top 25 Rankings Section */}
                    <div style={styles.sectionStyle}>
                        <h2 style={styles.sectionTitleStyle}>Top 25 Rankings</h2>
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
                                        backgroundColor: ncaaColors.primary, 
                                        color: "white",
                                    }}>
                                        <th style={{ padding: "10px", textAlign: "center", width: "40px" }}>Rank</th>
                                        <th style={{ padding: "10px", textAlign: "left" }}>Team</th>
                                        <th style={{ padding: "10px", textAlign: "center" }}>Conference</th>
                                        <th style={{ padding: "10px", textAlign: "center" }}>Overall</th>
                                        <th style={{ padding: "10px", textAlign: "center" }}>Pct</th>
                                        <th style={{ padding: "10px", textAlign: "center" }}>Home</th>
                                        <th style={{ padding: "10px", textAlign: "center" }}>Away</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {standings.map((team, index) => (
                                        <tr key={index} style={{ 
                                            backgroundColor: index % 2 === 0 ? "#f9f9f9" : "white",
                                            borderBottom: "1px solid #eee"
                                        }}>
                                            <td style={{ 
                                                padding: "8px", 
                                                textAlign: "center",
                                                fontWeight: "bold",
                                                color: index < 4 ? ncaaColors.secondary : "#333"
                                            }}>
                                                {index + 1}
                                            </td>
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
                                                        {/* National championship trophy icon for the champion */}
                                                        {index === 0 && <FaTrophy style={styles.nationalTrophyStyle} title="National Champion" />}
                                                    </div>
                                                </div>
                                            </td>
                                            <td style={{ padding: "8px", textAlign: "center", fontSize: "0.9rem" }}>
                                                {team.conference}
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
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Map Section */}
                    <div style={styles.sectionStyle}>
                        <h2 style={styles.sectionTitleStyle}>College Football Map</h2>
                        <div style={styles.mapContainerStyle}>
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
                                                <p style={{ margin: "5px 0" }}>Conference: {team.conference}</p>
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
                </div>

                {/* Right Sidebar - Crystal Ball (Top Recruits) */}
                <div style={styles.rightSidebarStyle}>
                    <div style={styles.sectionStyle}>
                        <h2 style={styles.crystalBallTitleStyle}>TOP RECRUITS</h2>
                        {recruits.length > 0 ? (
                            <div>
                                {recruits.map((recruit, index) => (
                                    <div key={index} style={styles.recruitRowStyle}>
                                        <div style={styles.recruitIconStyle}>
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
                                                        backgroundColor: ncaaColors.secondary,
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
                                        color: ncaaColors.secondary,
                                        textDecoration: "none",
                                        fontWeight: "bold",
                                        fontSize: "0.9rem"
                                    }}>
                                        View All Top Recruits
                                    </a>
                                </div>
                            </div>
                        ) : (
                            <div style={{
                                padding: "20px",
                                textAlign: "center",
                                backgroundColor: "#f9f9f9",
                                borderRadius: "6px",
                                color: "#666"
                            }}>
                                <p>No recruit data available</p>
                                <button 
                                    onClick={refreshData}
                                    style={{
                                        marginTop: "10px",
                                        padding: "8px 16px",
                                        backgroundColor: ncaaColors.secondary,
                                        color: "white",
                                        border: "none",
                                        borderRadius: "4px",
                                        cursor: "pointer",
                                        fontSize: "0.8rem"
                                    }}
                                >
                                    Refresh Data
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Teams;