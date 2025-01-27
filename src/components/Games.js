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
            "Bovada": "/photos/bovada.png",
        };
        return logos[provider] || "/photos/default_sportsbook.png";
    };

    const getWeatherForGame = (gameId) => weather.find((w) => w.id === gameId) || null;
    const getMediaForGame = (gameId) => media.find((m) => m.id === gameId) || null;
    const getLinesForGame = (gameId) => lines.find((l) => l.id === gameId) || null;

    const WeatherIcon = ({ condition }) => {
        const iconStyle = { width: 40, height: 40 };
        const icons = {
            sunny: (
                <svg {...iconStyle} viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="5" fill="#FFD700" />
                    <path d="M12 3v2M12 19v2M5.64 5.64l1.41 1.41M16.95 16.95l1.41 1.41M3 12h2M19 12h2M5.64 18.36l1.41-1.41M16.95 7.05l1.41-1.41" 
                          stroke="#FFD700" strokeWidth="2" fill="none"/>
                </svg>
            ),
            cloudy: (
                <svg {...iconStyle} viewBox="0 0 24 24">
                    <path fill="#B0C4DE" d="M19 15a3 3 0 01-3 3H6a4 4 0 01-.8-7.9A5 5 0 0115 9h1a4 4 0 013 6z" />
                    <circle cx="8" cy="12" r="3" fill="#F0F8FF" />
                    <circle cx="16" cy="12" r="3" fill="#F0F8FF" />
                </svg>
            ),
            rain: (
                <svg {...iconStyle} viewBox="0 0 24 24">
                    <path fill="#4682B4" d="M19 15a3 3 0 01-3 3H6a4 4 0 01-.8-7.9A5 5 0 0115 9h1a4 4 0 013 6z" />
                    <path stroke="#87CEEB" strokeWidth="2" d="M10 18l-2 4m6-4l-2 4m6-4l-2 4" />
                </svg>
            ),
            clear: (
                <svg {...iconStyle} viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="5" fill="#FFA500" />
                    <path d="M12 5V3M12 21v-2M5.64 7.05L4.22 5.64M19.78 18.36l-1.41-1.41M19 12h2M3 12h2M5.64 16.95l-1.41 1.41M18.36 7.05l1.41-1.41" 
                          stroke="#FFA500" strokeWidth="2" fill="none"/>
                </svg>
            )
        };
        return icons[condition?.toLowerCase()] || <div style={iconStyle}>?</div>;
    };

    const TvIcon = () => (
        <svg width="24" height="24" viewBox="0 0 24 24">
            <path fill="#666" d="M21 3H3c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h5v2h8v-2h5c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 14H3V5h18v12z"/>
            <path fill="#666" d="M8 13h2v3H8zm3 0h2v3h-2zm3 0h2v3h-2z"/>
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
                                        <span>{new Date(game.startTime).toLocaleString()}</span>
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
                                        <span className="network">{gameMedia?.network || 'TBD'}</span>
                                        {gameMedia?.startTime && (
                                            <span className="time">
                                                {new Date(gameMedia.startTime).toLocaleTimeString([], { 
                                                    hour: '2-digit', 
                                                    minute: '2-digit' 
                                                })}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {gameLines && (
                                <div className="betting-section">
                                    <h4>Betting Lines</h4>
                                    <div className="sportsbooks">
                                        {gameLines.lines.map((line) => (
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