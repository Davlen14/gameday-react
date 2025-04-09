import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import teamsService from "../services/teamsService";
import "../styles/GamesAndTeams.css";

const Games = () => {
    const [games, setGames] = useState([]);
    const [filteredGames, setFilteredGames] = useState([]);
    const [teams, setTeams] = useState([]);
    const [fcsTeams, setFcsTeams] = useState([]); // New state for FCS teams
    const [weather, setWeather] = useState([]);
    const [media, setMedia] = useState([]);
    const [lines, setLines] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [week, setWeek] = useState(1);
    const [year, setYear] = useState(2024); // New state for year
    const [searchTerm, setSearchTerm] = useState("");
    const navigate = useNavigate();

    // 🔴 ADDED: New state variable for toggling the detailed view of a game
    const [expandedGames, setExpandedGames] = useState({});

    // 🔴 ADDED: Function to toggle game details
    const toggleGameDetails = (gameId) => {
        setExpandedGames(prev => ({
            ...prev,
            [gameId]: !prev[gameId]
        }));
    };

    useEffect(() => {
        const fetchGamesAndRelatedData = async () => {
            try {
                setIsLoading(true);
                
                // Load both FBS and FCS teams
                if (teams.length === 0) {
                    const teamsData = await teamsService.getTeams();
                    setTeams(teamsData);
                    
                    // Also load FCS teams for logos
                    const fcsTeamsData = await teamsService.getFCSTeams();
                    setFcsTeams(fcsTeamsData);
                }

                // Note: Update these service calls based on your API structure
                // You may need to modify these to match how your backend expects parameters
                const gamesData = await teamsService.getGames(week, year);
                // We want to include games where at least one team is FBS
                const fbsGames = gamesData.filter(
                    (game) =>
                        game.homeClassification === "fbs" ||
                        game.awayClassification === "fbs"
                );
                setGames(fbsGames);
                setFilteredGames(fbsGames);

                const weatherData = await teamsService.getGameWeather(year, week);
                setWeather(weatherData);

                const mediaData = await teamsService.getGameMedia(year, week);
                setMedia(mediaData);

                const linesData = await teamsService.getGameLines(year);
                setLines(linesData);
            } catch (err) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchGamesAndRelatedData();
    }, [week, year, teams.length]); // Added year to dependency array

    const handleWeekChange = (event) => {
        setWeek(Number(event.target.value));
    };

    const handleYearChange = (event) => {
        setYear(Number(event.target.value));
    };
    
    const handleSearchChange = (event) => {
        const searchValue = event.target.value.toLowerCase();
        setSearchTerm(searchValue);
        
        if (!searchValue.trim()) {
            setFilteredGames(games);
            return;
        }
        
        const filtered = games.filter(game => {
            // Search by team name
            const homeTeamMatch = game.homeTeam.toLowerCase().includes(searchValue);
            const awayTeamMatch = game.awayTeam.toLowerCase().includes(searchValue);
            
            // Search by conference (if available in the data)
            const homeConferenceMatch = game.homeConference && 
                game.homeConference.toLowerCase().includes(searchValue);
            const awayConferenceMatch = game.awayConference && 
                game.awayConference.toLowerCase().includes(searchValue);
            
            // Find team objects to get conference info
            const homeTeam = teams.find(t => t.school.toLowerCase() === game.homeTeam.toLowerCase());
            const awayTeam = teams.find(t => t.school.toLowerCase() === game.awayTeam.toLowerCase());
            
            const homeTeamConferenceMatch = homeTeam?.conference?.toLowerCase().includes(searchValue);
            const awayTeamConferenceMatch = awayTeam?.conference?.toLowerCase().includes(searchValue);
            
            return homeTeamMatch || awayTeamMatch || 
                   homeConferenceMatch || awayConferenceMatch ||
                   homeTeamConferenceMatch || awayTeamConferenceMatch;
        });
        
        setFilteredGames(filtered);
    };

    const navigateToGameDetails = (gameId) => {
        navigate(`/game/${gameId}`);
    };

    const getTeamLogo = (teamName) => {
        // First check FBS teams
        const fbsTeam = teams.find(
            (t) => t.school.toLowerCase() === teamName.toLowerCase()
        );
        
        if (fbsTeam?.logos) {
            return fbsTeam.logos[0];
        }
        
        // If not found in FBS teams, check FCS teams
        const fcsTeam = fcsTeams.find(
            (t) => t.school.toLowerCase() === teamName.toLowerCase()
        );
        
        if (fcsTeam?.logos) {
            return fcsTeam.logos[0];
        }
        
        // Default logo if not found in either
        return "/photos/default_team.png";
    };

    const getSportsbookLogo = (provider) => {
        const logos = {
            "DraftKings": "/photos/draftkings.png",
            "ESPN Bet": "/photos/espnbet.png",
            "Bovada": "/photos/bovada.jpg",
        };
        return logos[provider] || "/photos/default_sportsbook.png";
    };

    const getWeatherForGame = (gameId) => weather.find((w) => w.id === gameId) || null;
    const getMediaForGame = (gameId) => media.find((m) => m.id === gameId) || null;
    const getLinesForGame = (gameId) => lines.find((l) => l.id === gameId) || null;

    const formatGameDate = (game) => {
        const dateString = game.startDate || game.startTime;
        if (!dateString) return "TBD";
        
        const gameDate = new Date(dateString);
        if (isNaN(gameDate.getTime())) return "TBD";
        
        return gameDate.toLocaleDateString(undefined, {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        }) + ' • ' + gameDate.toLocaleTimeString(undefined, {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // WeatherIcon component
    const WeatherIcon = ({ condition }) => {
        const iconStyle = { width: 32, height: 32 };
        const normalizedCondition = condition?.toLowerCase() || '';
        
        let iconType = 'clear';
        if (normalizedCondition.includes('sun') || normalizedCondition === 'clear') {
            iconType = 'clear';
        } else if (normalizedCondition.includes('cloud') || normalizedCondition.includes('overcast')) {
            iconType = 'cloudy';
        } else if (normalizedCondition.includes('rain') || normalizedCondition.includes('shower') || normalizedCondition.includes('drizzle')) {
            iconType = 'rain';
        }
        
        const icons = {
            sunny: (
                <svg {...iconStyle} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                        <radialGradient id="sunGradient" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
                            <stop offset="0%" stopColor="#FFEB3B" />
                            <stop offset="100%" stopColor="#FFA000" />
                        </radialGradient>
                    </defs>
                    <circle cx="12" cy="12" r="5" fill="url(#sunGradient)" filter="drop-shadow(0 0 2px rgba(255, 200, 0, 0.8))" />
                    <path d="M12 3v2M12 19v2M5.64 5.64l1.41 1.41M16.95 16.95l1.41 1.41M3 12h2M19 12h2M5.64 18.36l1.41-1.41M16.95 7.05l1.41-1.41" 
                          stroke="#FFA000" strokeWidth="1.5" strokeLinecap="round" fill="none" />
                    <circle cx="12" cy="12" r="9" stroke="#FFA000" strokeWidth="0.5" strokeOpacity="0.3" fill="none" />
                </svg>
            ),
            cloudy: (
                <svg {...iconStyle} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                        <linearGradient id="cloudGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#F5F5F5" />
                            <stop offset="100%" stopColor="#B0C4DE" />
                        </linearGradient>
                    </defs>
                    <path d="M19.5 14.5c0 2.2-1.8 4-4 4H6.5c-2.8 0-5-2.2-5-5 0-2.3 1.6-4.3 3.8-4.8.5-2.5 2.7-4.2 5.2-4.2 2.3 0 4.3 1.5 5 3.6.4-.1.9-.1 1.3-.1 2.2 0 4 1.8 4 4 0 .3 0 .5-.1.8.9.5 1.5 1.5 1.5 2.6 0 1.7-1.3 3.1-2.9 3.1h-.8" 
                    fill="url(#cloudGradient)" stroke="#B0C4DE" strokeWidth="0.5" filter="drop-shadow(0 1px 2px rgba(0,0,0,0.1))" />
                    <ellipse cx="9" cy="13" rx="3.5" ry="2.8" fill="#F0F8FF" opacity="0.7" />
                    <ellipse cx="15.5" cy="13.5" rx="3" ry="2.5" fill="#F0F8FF" opacity="0.5" />
                </svg>
            ),
            rain: (
                <svg {...iconStyle} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                        <linearGradient id="rainCloudGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#B0C4DE" />
                            <stop offset="100%" stopColor="#4682B4" />
                        </linearGradient>
                        <linearGradient id="rainDropGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#A6D4FF" />
                            <stop offset="100%" stopColor="#4A90E2" />
                        </linearGradient>
                    </defs>
                    <path d="M19 12.5c0 1.9-1.5 3.5-3.5 3.5H6c-2.5 0-4.5-2-4.5-4.5 0-2.1 1.4-3.8 3.4-4.3.5-2.2 2.4-3.7 4.7-3.7 2.1 0 3.9 1.3 4.5 3.2.4-.1.8-.1 1.2-.1 2 0 3.6 1.5 3.6 3.5 0 .2 0 .5-.1.7.8.5 1.4 1.3 1.4 2.3 0 1.5-1.2 2.7-2.6 2.7h-.8" 
                    fill="url(#rainCloudGradient)" stroke="#4682B4" strokeWidth="0.5" filter="drop-shadow(0 1px 2px rgba(0,0,0,0.15))" />
                    
                    <path d="M8.5 16v4" stroke="url(#rainDropGradient)" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="0,2" strokeDashoffset="2" filter="drop-shadow(0 1px 1px rgba(0,0,0,0.3))">
                        <animate attributeName="stroke-dashoffset" values="0;4" dur="1.2s" repeatCount="indefinite" />
                    </path>
                    <path d="M12 17v4" stroke="url(#rainDropGradient)" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="0,2" strokeDashoffset="1" filter="drop-shadow(0 1px 1px rgba(0,0,0,0.3))">
                        <animate attributeName="stroke-dashoffset" values="0;4" dur="1s" repeatCount="indefinite" />
                    </path>
                    <path d="M15.5 16v4" stroke="url(#rainDropGradient)" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="0,2" strokeDashoffset="0" filter="drop-shadow(0 1px 1px rgba(0,0,0,0.3))">
                        <animate attributeName="stroke-dashoffset" values="0;4" dur="0.8s" repeatCount="indefinite" />
                    </path>
                </svg>
            ),
            clear: (
                <svg {...iconStyle} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                        <radialGradient id="sunGradient2" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
                            <stop offset="0%" stopColor="#FFEB3B" />
                            <stop offset="100%" stopColor="#FF9800" />
                        </radialGradient>
                    </defs>
                    <circle cx="12" cy="12" r="5.5" fill="url(#sunGradient2)" filter="drop-shadow(0 0 2px rgba(255, 160, 0, 0.6))" />
                    <path d="M12 4v2M12 18v2M6 12H4M20 12h-2M7.05 7.05l1.4 1.4M15.55 15.55l1.4 1.4M7.05 16.95l1.4-1.4M15.55 8.45l1.4-1.4" 
                        stroke="#FF9800" strokeWidth="2" strokeLinecap="round" />
                    <circle cx="12" cy="12" r="10" stroke="#FF9800" strokeWidth="0.5" strokeOpacity="0.3" fill="none" />
                </svg>
            )
        };
        return icons[iconType] || <div style={iconStyle}>?</div>;
    };

    // TvIcon component
    const TvIcon = () => (
        <svg width="32" height="32" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient id="tvGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#666" />
                    <stop offset="100%" stopColor="#444" />
                </linearGradient>
                <linearGradient id="screenGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#333" />
                    <stop offset="100%" stopColor="#111" />
                </linearGradient>
            </defs>
            <rect x="2" y="3" width="20" height="14" rx="2" fill="url(#tvGradient)" filter="drop-shadow(0 1px 2px rgba(0,0,0,0.2))" />
            <rect x="3" y="4" width="18" height="12" rx="1" fill="url(#screenGradient)" />
            <path d="M10 17h4v3a1 1 0 01-1 1h-2a1 1 0 01-1-1v-3z" fill="#555" />
            <rect x="9" y="17" width="6" height="1" fill="#444" />
            <path d="M5 8c1-1 2-1.5 3-1.5s2 .5 3 1.5" stroke="#5C6BC0" strokeWidth="0.8" strokeOpacity="0.8" fill="none" strokeLinecap="round" />
            <path d="M7 7c.5-.5 1-.7 1.5-.7s1 .2 1.5.7" stroke="#7986CB" strokeWidth="0.6" strokeOpacity="0.9" fill="none" strokeLinecap="round" />
            <circle cx="19" cy="6" r="0.5" fill="#f44336" />
            <circle cx="19" cy="8" r="0.5" fill="#4CAF50" />
        </svg>
    );

    // Helper function to determine if a team is FCS
    const isTeamFCS = (teamName) => {
        const fbsTeam = teams.find(
            (t) => t.school.toLowerCase() === teamName.toLowerCase()
        );
        
        return !fbsTeam; // If not found in FBS teams, assume it's FCS
    };

    if (isLoading) return <div className="gtloading">Loading games...</div>;
    if (error) return <div className="gterror">Error: {error}</div>;

    return (
        <div className="gtgames-container">
            <header className="gtheader">
                <h1>FBS Schedule</h1>
                <div className="gtfilters-container">
                    <div className="gtweek-selector">
                        <label>Week:</label>
                        <select value={week} onChange={handleWeekChange} className="gtweek-dropdown">
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17].map((w) => (
                                <option key={w} value={w}>Week {w}</option>
                            ))}
                        </select>
                    </div>
                    <div className="gtyear-selector">
                        <label>Year:</label>
                        <select value={year} onChange={handleYearChange} className="gtyear-dropdown">
                            {[2020, 2021, 2022, 2023, 2024, 2025].map((y) => (
                                <option key={y} value={y}>{y}</option>
                            ))}
                        </select>
                    </div>
                    <div className="gtsearch-container">
                        <label>Search:</label>
                        <div className="gtsearch-input-wrapper">
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={handleSearchChange}
                                placeholder="Team or Conference"
                                className="gtsearch-input"
                            />
                            {searchTerm && (
                                <button 
                                    className="gtclear-search-btn"
                                    onClick={() => {
                                        setSearchTerm("");
                                        setFilteredGames(games);
                                    }}
                                >
                                    ×
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            <div className="gtgames-grid">
                {filteredGames.length === 0 && !isLoading ? (
                    <div className="gtno-results">
                        <p>No games found matching your search for "{searchTerm}"</p>
                        <button 
                            className="gtclear-search-btn-large"
                            onClick={() => {
                                setSearchTerm("");
                                setFilteredGames(games);
                            }}
                        >
                            Clear Search
                        </button>
                    </div>
                ) : (
                    filteredGames.map((game) => {
                    const gameWeather = getWeatherForGame(game.id);
                    const gameMedia = getMediaForGame(game.id);
                    const gameLines = getLinesForGame(game.id);
                    const tvNetwork = gameMedia?.network || gameMedia?.outlet || 'TBD';
                    
                    // Check if either team is FCS
                    const homeIsFCS = isTeamFCS(game.homeTeam);
                    const awayIsFCS = isTeamFCS(game.awayTeam);

                    return (
                        <article key={game.id} className="gtgame-card">
                            {/* Game Card Header */}
                            <div className="gtgame-card-header">
                                <div className="gtteams-container">
                                    <div className="gtteam home-team">
                                        <div className="gtteam-logo-container">
                                            <img src={getTeamLogo(game.homeTeam)} alt={game.homeTeam} className="gtteam-logo" />
                                        </div>
                                        <div className="gtteam-details">
                                            <h3>{game.homeTeam}</h3>

                                        </div>
                                        <span className="gtscore">{game.homePoints || "-"}</span>
                                    </div>
                                    
                                    <div className="gtvs-circle">
                                        <span>VS</span>
                                    </div>

                                    <div className="gtteam away-team">
                                        <div className="gtteam-logo-container">
                                            <img src={getTeamLogo(game.awayTeam)} alt={game.awayTeam} className="gtteam-logo" />
                                        </div>
                                        <div className="gtteam-details">
                                            <h3>{game.awayTeam}</h3>

                                        </div>
                                        <span className="gtscore">{game.awayPoints || "-"}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Game Info Grid */}
                            <div className="gtgame-info-grid">
                                <div className="gtinfo-item">
                                    <svg className="gticon" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M12 21C15.5 17.4 19 14.1764 19 9.88235C19 5.58824 15.866 2 12 2C8.13401 2 5 5.58824 5 9.88235C5 14.1764 8.5 17.4 12 21Z" fill="#E6EDF3" stroke="#64748B" strokeWidth="1.5"/>
                                        <circle cx="12" cy="10" r="3" fill="#D4001C" stroke="#64748B" strokeWidth="0.5"/>
                                    </svg>
                                    <div>
                                        <span className="gtinfo-label">Venue</span>
                                        <span className="gtinfo-value">{game.venue}</span>
                                    </div>
                                </div>
                                
                                <div className="gtinfo-item">
                                    <svg className="gticon" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <circle cx="12" cy="12" r="9" fill="#E6EDF3" stroke="#64748B" strokeWidth="1.5"/>
                                        <path d="M12 7V12L15.5 14.5" stroke="#D4001C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        <circle cx="12" cy="12" r="1" fill="#64748B"/>
                                    </svg>
                                    <div>
                                        <span className="gtinfo-label">Time</span>
                                        <span className="gtinfo-value">
                                            {game.status === 'final' ? (
                                                <span className="gtfinal">Final</span>
                                            ) : (
                                                formatGameDate(game)
                                            )}
                                        </span>
                                    </div>
                                </div>

                                <div className="gtinfo-item">
                                    <TvIcon />
                                    <div>
                                        <span className="gtinfo-label">Network</span>
                                        <span className="gtinfo-value">{tvNetwork}</span>
                                    </div>
                                </div>
                                
                                <div className="gtinfo-item">
                                    <WeatherIcon condition={gameWeather?.weatherCondition} />
                                    <div>
                                        <span className="gtinfo-label">Weather</span>
                                        <span className="gtinfo-value">
                                            {gameWeather?.temperature ? `${gameWeather.temperature}°F` : '--'} 
                                            <span className="gtweather-condition">
                                                {gameWeather?.weatherCondition || 'N/A'}
                                            </span>
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* 🔴 ADDED: Toggle details button */}
                            <button 
                                className="gtview-details-btn"
                                onClick={() => toggleGameDetails(game.id)}
                            >
                                {expandedGames[game.id] ? 'Hide Details' : 'View Details'}
                            </button>
                            
                            {/* 🔴 ADDED: Expandable Details Section */}
                            {expandedGames[game.id] && (
                                <div className="gtgame-details">
                                    {gameLines && (
                                        <div className="gtbetting-lines">
                                            <h4>Betting Lines</h4>
                                            <div className="gtlines-grid">
                                                {gameLines.lines && gameLines.lines.map((line) => (
                                                    <div key={line.provider} className="gtline-item">
                                                        <div className="gtline-provider">
                                                            <img 
                                                                src={getSportsbookLogo(line.provider)} 
                                                                alt={line.provider} 
                                                                className="gtsportsbook-logo" 
                                                            />
                                                            <span>{line.provider}</span>
                                                        </div>
                                                        <div className="gtline-values">
                                                            <div className="gtline-value">
                                                                <span className="gtline-label">Spread</span>
                                                                <span className="gtline-number">{line.spread || 'N/A'}</span>
                                                            </div>
                                                            <div className="gtline-value">
                                                                <span className="gtline-label">O/U</span>
                                                                <span className="gtline-number">{line.overUnder || 'N/A'}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <div className="gtdetails-actions">
                                        <button 
                                            className="gtadvanced-details-button"
                                            onClick={() => navigateToGameDetails(game.id)}
                                        >
                                            View Advanced Game Details
                                        </button>
                                        
                                        <button 
                                            className="gtadvanced-player-button"
                                            onClick={() => navigate(`/playerGameGrade/${game.id}`)}
                                        >
                                            Advanced Player Stats
                                        </button>
                                    </div>
                                </div>
                            )}
                        </article>
                    );
                }))}
            </div>
        </div>
    );
};

export default Games;