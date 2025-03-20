import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import teamsService from "../services/teamsService";
import "../styles/GamesAndTeams.css";
import { FaSearch, FaFilter, FaRegCalendarAlt, FaChevronDown } from "react-icons/fa";

const Games = () => {
    const [games, setGames] = useState([]);
    const [filteredGames, setFilteredGames] = useState([]);
    const [teams, setTeams] = useState([]);
    const [fcsTeams, setFcsTeams] = useState([]);
    const [weather, setWeather] = useState([]);
    const [media, setMedia] = useState([]);
    const [lines, setLines] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // New state variables for filters
    const [year, setYear] = useState(2024);
    const [week, setWeek] = useState(1);
    const [searchTerm, setSearchTerm] = useState("");
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    const navigate = useNavigate();

    // Available years and weeks
    const availableYears = [2020, 2021, 2022, 2023, 2024, 2025];
    const availableWeeks = Array.from({ length: 17 }, (_, i) => i + 1);

    useEffect(() => {
        const fetchGamesAndRelatedData = async () => {
            try {
                setIsLoading(true);
                
                // Load both FBS and FCS teams if not already loaded
                if (teams.length === 0) {
                    const teamsData = await teamsService.getTeams(year);
                    setTeams(teamsData);
                    
                    // Also load FCS teams for logos
                    const fcsTeamsData = await teamsService.getFCSTeams(year);
                    setFcsTeams(fcsTeamsData);
                }

                const gamesData = await teamsService.getGames(week, year);
                // We want to include games where at least one team is FBS
                const fbsGames = gamesData.filter(
                    (game) =>
                        game.homeClassification === "fbs" ||
                        game.awayClassification === "fbs"
                );
                setGames(fbsGames);

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
    }, [year, week, teams.length]);

    // Update filtered games whenever games or search term changes
    useEffect(() => {
        if (searchTerm.trim() === "") {
            setFilteredGames(games);
            return;
        }

        const lowerSearchTerm = searchTerm.toLowerCase();
        const filtered = games.filter(game => 
            game.homeTeam.toLowerCase().includes(lowerSearchTerm) ||
            game.awayTeam.toLowerCase().includes(lowerSearchTerm) ||
            (game.homeConference && game.homeConference.toLowerCase().includes(lowerSearchTerm)) ||
            (game.awayConference && game.awayConference.toLowerCase().includes(lowerSearchTerm))
        );
        
        setFilteredGames(filtered);
    }, [games, searchTerm]);

    const handleYearChange = (event) => {
        setYear(Number(event.target.value));
        // Reset to week 1 when year changes
        setWeek(1);
    };

    const handleWeekChange = (event) => {
        setWeek(Number(event.target.value));
    };

    const handleSearchChange = (event) => {
        setSearchTerm(event.target.value);
    };

    const toggleFilters = () => {
        setIsFilterOpen(!isFilterOpen);
    };

    const clearFilters = () => {
        setSearchTerm("");
        setYear(2024);
        setWeek(1);
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

    // Updated WeatherIcon component with cleaner design
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
                    <circle cx="12" cy="12" r="5" fill="#FFBB33" />
                    <path d="M12 3v2M12 19v2M5.64 5.64l1.41 1.41M16.95 16.95l1.41 1.41M3 12h2M19 12h2M5.64 18.36l1.41-1.41M16.95 7.05l1.41-1.41" 
                          stroke="#FFBB33" strokeWidth="1.5" strokeLinecap="round" fill="none" />
                </svg>
            ),
            cloudy: (
                <svg {...iconStyle} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M19.5 14.5c0 2.2-1.8 4-4 4H6.5c-2.8 0-5-2.2-5-5 0-2.3 1.6-4.3 3.8-4.8.5-2.5 2.7-4.2 5.2-4.2 2.3 0 4.3 1.5 5 3.6.4-.1.9-.1 1.3-.1 2.2 0 4 1.8 4 4 0 .3 0 .5-.1.8.9.5 1.5 1.5 1.5 2.6 0 1.7-1.3 3.1-2.9 3.1h-.8" 
                    fill="#B0C4DE" stroke="#90A4BE" strokeWidth="0.5" />
                    <ellipse cx="9" cy="13" rx="3.5" ry="2.8" fill="#EAEAEA" opacity="0.7" />
                </svg>
            ),
            rain: (
                <svg {...iconStyle} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M19 12.5c0 1.9-1.5 3.5-3.5 3.5H6c-2.5 0-4.5-2-4.5-4.5 0-2.1 1.4-3.8 3.4-4.3.5-2.2 2.4-3.7 4.7-3.7 2.1 0 3.9 1.3 4.5 3.2.4-.1.8-.1 1.2-.1 2 0 3.6 1.5 3.6 3.5 0 .2 0 .5-.1.7.8.5 1.4 1.3 1.4 2.3 0 1.5-1.2 2.7-2.6 2.7h-.8" 
                    fill="#4682B4" stroke="#3672A4" strokeWidth="0.5" />
                    
                    <path d="M8.5 16v4" stroke="#55AAEE" strokeWidth="1.5" strokeLinecap="round" />
                    <path d="M12 17v4" stroke="#55AAEE" strokeWidth="1.5" strokeLinecap="round" />
                    <path d="M15.5 16v4" stroke="#55AAEE" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
            ),
            clear: (
                <svg {...iconStyle} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="5.5" fill="#FFBB33" />
                    <path d="M12 4v2M12 18v2M6 12H4M20 12h-2M7.05 7.05l1.4 1.4M15.55 15.55l1.4 1.4M7.05 16.95l1.4-1.4M15.55 8.45l1.4-1.4" 
                        stroke="#FFBB33" strokeWidth="2" strokeLinecap="round" />
                </svg>
            )
        };
        return icons[iconType] || <div style={iconStyle}>?</div>;
    };

    // Updated TvIcon component with cleaner design
    const TvIcon = () => (
        <svg width="32" height="32" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <rect x="2" y="3" width="20" height="14" rx="2" fill="#555555" />
            <rect x="3" y="4" width="18" height="12" rx="1" fill="#333333" />
            <path d="M10 17h4v3a1 1 0 01-1 1h-2a1 1 0 01-1-1v-3z" fill="#555555" />
            <rect x="9" y="17" width="6" height="1" fill="#444444" />
            <path d="M5 8c1-1 2-1.5 3-1.5s2 .5 3 1.5" stroke="#6C7CD0" strokeWidth="0.8" fill="none" strokeLinecap="round" />
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

    if (isLoading) return (
        <div className="loading-container">
            <div className="loading-spinner"></div>
            <div className="loading-text">Loading games...</div>
        </div>
    );
    
    if (error) return (
        <div className="error-container">
            <div className="error-icon">!</div>
            <div className="error-text">Error: {error}</div>
        </div>
    );

    return (
        <div className="games-container">
            <header className="header">
                <h1>FBS Schedule</h1>
                
                <div className="filter-bar">
                    <div className="filter-toggle" onClick={toggleFilters}>
                        <FaFilter />
                        <span>Filters</span>
                        <FaChevronDown className={isFilterOpen ? "chevron-open" : "chevron-closed"} />
                    </div>
                    
                    <div className="search-box">
                        <FaSearch className="search-icon" />
                        <input 
                            type="text" 
                            placeholder="Search teams or conferences..." 
                            value={searchTerm} 
                            onChange={handleSearchChange}
                            className="search-input"
                        />
                        {searchTerm && (
                            <button className="search-clear" onClick={() => setSearchTerm("")}>
                                ×
                            </button>
                        )}
                    </div>
                </div>
            </header>

            <div className={`filter-panel ${isFilterOpen ? 'filter-panel-open' : ''}`}>
                <div className="filter-group">
                    <label className="filter-label">
                        <FaRegCalendarAlt className="filter-icon" />
                        Season:
                    </label>
                    <select value={year} onChange={handleYearChange} className="filter-select">
                        {availableYears.map((y) => (
                            <option key={y} value={y}>{y}</option>
                        ))}
                    </select>
                </div>
                
                <div className="filter-group">
                    <label className="filter-label">Week:</label>
                    <select value={week} onChange={handleWeekChange} className="filter-select">
                        {availableWeeks.map((w) => (
                            <option key={w} value={w}>Week {w}</option>
                        ))}
                    </select>
                </div>
                
                <button className="filter-reset" onClick={clearFilters}>
                    Reset Filters
                </button>
            </div>

            <div className="results-summary">
                <span className="results-count">
                    {filteredGames.length} {filteredGames.length === 1 ? 'game' : 'games'} found
                </span>
                {year === 2025 && (
                    <span className="future-season-note">
                        Note: 2025 season has not started yet
                    </span>
                )}
            </div>

            <div className="games-grid">
                {filteredGames.length > 0 ? (
                    filteredGames.map((game) => {
                        const gameWeather = getWeatherForGame(game.id);
                        const gameMedia = getMediaForGame(game.id);
                        const gameLines = getLinesForGame(game.id);
                        const tvNetwork = gameMedia?.network || gameMedia?.outlet || 'TBD';
                        
                        // Check if either team is FCS
                        const homeIsFCS = isTeamFCS(game.homeTeam);
                        const awayIsFCS = isTeamFCS(game.awayTeam);

                        return (
                            <article key={game.id} className="game-card" onClick={() => navigateToGameDetails(game.id)}>
                                <div className="teams-container">
                                    <div className="team">
                                        <img src={getTeamLogo(game.homeTeam)} alt={game.homeTeam} className="team-logo" />
                                        <div className="team-details">
                                            <h3>{game.homeTeam}</h3>
                                            {homeIsFCS && <span className="team-division">FCS</span>}
                                            {game.status === 'final' && <span className="score">{game.homePoints || '0'}</span>}
                                        </div>
                                    </div>
                                    
                                    <div className="vs-circle">
                                        <span>VS</span>
                                    </div>

                                    <div className="team">
                                        <img src={getTeamLogo(game.awayTeam)} alt={game.awayTeam} className="team-logo" />
                                        <div className="team-details">
                                            <h3>{game.awayTeam}</h3>
                                            {awayIsFCS && <span className="team-division">FCS</span>}
                                            {game.status === 'final' && <span className="score">{game.awayPoints || '0'}</span>}
                                        </div>
                                    </div>
                                </div>

                                <div className="game-info">
                                    <div className="info-item">
                                        <svg className="icon" viewBox="0 0 24 24">
                                            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 010-5 2.5 2.5 0 010 5z"/>
                                        </svg>
                                        <span>{game.venue || 'TBD'}</span>
                                    </div>
                                    
                                    <div className="info-item">
                                        <svg className="icon" viewBox="0 0 24 24">
                                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>
                                        </svg>
                                        {game.status === 'final' ? (
                                            <span className="final">Final Score</span>
                                        ) : (
                                            <span>{formatGameDate(game)}</span>
                                        )}
                                    </div>
                                </div>

                                <div className="game-meta">
                                    <div className="broadcast-weather-row">
                                        <TvIcon />
                                        <span className="network">{tvNetwork || 'TBD'}</span>
                                        {gameWeather && (
                                            <>
                                                <WeatherIcon condition={gameWeather?.weatherCondition} />
                                                <span className="temperature">
                                                    {gameWeather?.temperature || '--'}°F
                                                </span>
                                                <span className="condition">
                                                    {gameWeather?.weatherCondition || 'N/A'}
                                                </span>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {gameLines && gameLines.lines && gameLines.lines.length > 0 && (
                                <div className="betting-section">
                                    <h4>Betting Lines</h4>
                                    <div className="sportsbooks">
                                    {gameLines.lines.slice(0, 2).map((line) => (
                                        <div key={line.provider} className="sportsbook-line">
                                            <img 
                                                src={getSportsbookLogo(line.provider)} 
                                                alt={line.provider} 
                                                className="sportsbook-logo" 
                                            />
                                            <span className="spread">SP: {line.spread || 'N/A'}</span>
                                            <span className="overunder">O/U: {line.overUnder || 'N/A'}</span>
                                        </div>
                                    ))}
                                    </div>
                                </div>
                                )}

                                <div className="view-details-footer">
                                    <span className="view-details-text">View Advanced Game Details</span>
                                </div>
                            </article>
                        );
                    })
                ) : (
                    <div className="no-results">
                        <div className="no-results-icon">🔍</div>
                        <h3>No games found</h3>
                        <p>
                            Try adjusting your filters or search term to see more results.
                            {searchTerm && (
                                <button className="clear-search-button" onClick={() => setSearchTerm("")}>
                                    Clear Search
                                </button>
                            )}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Games;