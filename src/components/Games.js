import React, { useState, useEffect } from "react";
import teamsService from "../services/teamsService";
import "../styles/GamesAndTeams.css";

const Games = () => {
    const [games, setGames] = useState([]);
    const [teams, setTeams] = useState([]);
    const [weather, setWeather] = useState([]);
    const [media, setMedia] = useState([]);
    const [lines, setLines] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [week, setWeek] = useState(1);

    useEffect(() => {
        const fetchGamesAndRelatedData = async () => {
            try {
                setIsLoading(true);
                
                if (teams.length === 0) {
                    const teamsData = await teamsService.getTeams();
                    setTeams(teamsData);
                }

                const gamesData = await teamsService.getGames(week);
                const fbsGames = gamesData.filter(
                    (game) =>
                        game.homeClassification === "fbs" &&
                        game.awayClassification === "fbs"
                );
                setGames(fbsGames);

                const weatherData = await teamsService.getGameWeather(2024, week);
                setWeather(weatherData);

                const mediaData = await teamsService.getGameMedia(2024, week);
                setMedia(mediaData);

                const linesData = await teamsService.getGameLines(2024);
                setLines(linesData);
            } catch (err) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchGamesAndRelatedData();
    }, [week, teams.length]);

    const handleWeekChange = (event) => {
        setWeek(Number(event.target.value));
    };

    const getTeamLogo = (teamName) => {
        const team = teams.find(
            (t) => t.school.toLowerCase() === teamName.toLowerCase()
        );
        return team?.logos ? team.logos[0] : "/photos/default_team.png";
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
        // Use startDate if available, fall back to startTime
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


// Replace your WeatherIcon component with this:
const WeatherIcon = ({ condition }) => {
    const iconStyle = { width: 32, height: 32 }; // Bigger icons
    const normalizedCondition = condition?.toLowerCase() || '';
    
    // Map similar conditions to our available icons
    let iconType = 'clear'; // Default
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
                
                {/* Rain Drops */}
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

// Replace your TvIcon component with this:
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
        
        {/* TV Body */}
        <rect x="2" y="3" width="20" height="14" rx="2" fill="url(#tvGradient)" filter="drop-shadow(0 1px 2px rgba(0,0,0,0.2))" />
        
        {/* TV Screen */}
        <rect x="3" y="4" width="18" height="12" rx="1" fill="url(#screenGradient)" />
        
        {/* TV Stand */}
        <path d="M10 17h4v3a1 1 0 01-1 1h-2a1 1 0 01-1-1v-3z" fill="#555" />
        <rect x="9" y="17" width="6" height="1" fill="#444" />
        
        {/* Broadcast Signal */}
        <path d="M5 8c1-1 2-1.5 3-1.5s2 .5 3 1.5" stroke="#5C6BC0" strokeWidth="0.8" strokeOpacity="0.8" fill="none" strokeLinecap="round" />
        <path d="M7 7c.5-.5 1-.7 1.5-.7s1 .2 1.5.7" stroke="#7986CB" strokeWidth="0.6" strokeOpacity="0.9" fill="none" strokeLinecap="round" />
        
        {/* Buttons/Indicators */}
        <circle cx="19" cy="6" r="0.5" fill="#f44336" />
        <circle cx="19" cy="8" r="0.5" fill="#4CAF50" />
    </svg>
);

    if (isLoading) return <div className="loading">Loading games...</div>;
    if (error) return <div className="error">Error: {error}</div>;

    return (
        <div className="games-container">
            <header className="header">
                <h1>FBS Schedule</h1>
                <div className="week-selector">
                    <label>Week:</label>
                    <select value={week} onChange={handleWeekChange} className="week-dropdown">
                        {[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17].map((w) => (
                            <option key={w} value={w}>Week {w}</option>
                        ))}
                    </select>
                </div>
            </header>

            <div className="games-grid">
                {games.map((game) => {
                    const gameWeather = getWeatherForGame(game.id);
                    const gameMedia = getMediaForGame(game.id);
                    const gameLines = getLinesForGame(game.id);

                    // Get TV network from either network or outlet property
                    const tvNetwork = gameMedia?.network || gameMedia?.outlet || 'TBD';

                    return (
                        <article key={game.id} className="game-card">
                            <div className="teams-container">
                                <div className="team">
                                    <img src={getTeamLogo(game.homeTeam)} alt={game.homeTeam} className="team-logo" />
                                    <div className="team-details">
                                        <h3>{game.homeTeam}</h3>
                                        <span className="score">{game.homePoints}</span>
                                    </div>
                                </div>
                                
                                <div className="vs-circle">
                                    <span>VS</span>
                                </div>

                                <div className="team">
                                    <img src={getTeamLogo(game.awayTeam)} alt={game.awayTeam} className="team-logo" />
                                    <div className="team-details">
                                        <h3>{game.awayTeam}</h3>
                                        <span className="score">{game.awayPoints}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="game-info">
                                <div className="info-item">
                                    <svg className="icon" viewBox="0 0 24 24">
                                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 010-5 2.5 2.5 0 010 5z"/>
                                    </svg>
                                    <span>{game.venue}</span>
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
                                <div className="weather-card">
                                    <WeatherIcon condition={gameWeather?.weatherCondition} />
                                    <div className="weather-info">
                                        <span className="temperature">
                                            {gameWeather?.temperature || '--'}°F
                                        </span>
                                        <span className="condition">
                                            {gameWeather?.weatherCondition || 'N/A'}
                                        </span>
                                    </div>
                                </div>

                                <div className="broadcast-card">
                                    <TvIcon />
                                    <div className="broadcast-info">
                                        <span className="network">{tvNetwork}</span>
                                        <span className="time">
                                            Live Coverage
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {gameLines && (
                                <div className="betting-section">
                                    <h4>Betting Lines</h4>
                                    <div className="sportsbooks">
                                        {gameLines.lines && gameLines.lines.map((line) => (
                                            <div key={line.provider} className="sportsbook">
                                                <img 
                                                    src={getSportsbookLogo(line.provider)} 
                                                    alt={line.provider} 
                                                    className="sportsbook-logo" 
                                                />
                                                <div className="odds">
                                                    <div className="spread">
                                                        <span>Spread:</span>
                                                        <strong>{line.spread || 'N/A'}</strong>
                                                    </div>
                                                    <div className="overunder">
                                                        <span>O/U:</span>
                                                        <strong>{line.overUnder || 'N/A'}</strong>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </article>
                    );
                })}
            </div>
        </div>
    );
};

export default Games;