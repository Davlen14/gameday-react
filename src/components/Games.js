import React, { useState, useEffect } from "react";
import teamsService from "../services/teamsService";
import "../styles/GamesAndTeams.css"; // Ensure the CSS file is imported

const Games = () => {
    const [games, setGames] = useState([]);
    const [teams, setTeams] = useState([]);
    const [weather, setWeather] = useState([]);
    const [media, setMedia] = useState([]);
    const [lines, setLines] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [week, setWeek] = useState(1); // Default to Week 1

    useEffect(() => {
        const fetchGamesAndRelatedData = async () => {
            try {
                setIsLoading(true);

                // Fetch teams if not already fetched
                if (teams.length === 0) {
                    const teamsData = await teamsService.getTeams();
                    setTeams(teamsData);
                }

                // Fetch games for the selected week
                const gamesData = await teamsService.getGames(week);

                // Filter only FBS games
                const fbsGames = gamesData.filter(
                    (game) =>
                        game.homeClassification === "fbs" &&
                        game.awayClassification === "fbs"
                );
                setGames(fbsGames);

                // Fetch weather data
                const weatherData = await teamsService.getGameWeather(2024, week);
                setWeather(weatherData);

                // Fetch media data
                const mediaData = await teamsService.getGameMedia(2024, week);
                setMedia(mediaData);

                // Fetch betting lines
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

    // Handle week selection changes
    const handleWeekChange = (event) => {
        setWeek(Number(event.target.value));
    };

    // Get team logo with case-insensitive matching
    const getTeamLogo = (teamName) => {
        const team = teams.find(
            (t) => t.school.toLowerCase() === teamName.toLowerCase()
        );
        return team?.logos ? team.logos[0] : "/photos/default_team.png"; // Fallback logo
    };

    // Get sportsbook logo
    const getSportsbookLogo = (provider) => {
        const logos = {
            "DraftKings": "/photos/draftkings.png",
            "ESPN Bet": "/photos/espnbet.png",
            "Bovada": "/photos/bovada.png",
        };
        return logos[provider] || "/photos/default_sportsbook.png";
    };

    // Get weather data for a specific game
    const getWeatherForGame = (gameId) =>
        weather.find((w) => w.id === gameId) || null;

    // Get media data for a specific game
    const getMediaForGame = (gameId) =>
        media.find((m) => m.id === gameId) || null;

    // Get betting lines for a specific game
    const getLinesForGame = (gameId) =>
        lines.find((l) => l.id === gameId) || null;

    // Render loading or error state
    if (isLoading) return <p>Loading games...</p>;
    if (error) return <p>Error: {error}</p>;

    return (
        <div className="games-container">
            <h1>FBS Games</h1>
            <label>
                Select Week:
                <select value={week} onChange={handleWeekChange}>
                    {[...Array(17).keys()].map((w) => (
                        <option key={w + 1} value={w + 1}>
                            Week {w + 1}
                        </option>
                    ))}
                </select>
            </label>
            <div className="games-grid">
                {games.map((game) => {
                    const gameWeather = getWeatherForGame(game.id);
                    const gameMedia = getMediaForGame(game.id);
                    const gameLines = getLinesForGame(game.id);

                    return (
                        <div key={game.id} className="game-card">
                            <div className="team-logos">
                                <img
                                    src={getTeamLogo(game.homeTeam)}
                                    alt={`${game.homeTeam} Logo`}
                                    className="team-logo"
                                />
                                <span>vs</span>
                                <img
                                    src={getTeamLogo(game.awayTeam)}
                                    alt={`${game.awayTeam} Logo`}
                                    className="team-logo"
                                />
                            </div>
                            <div className="game-info">
                                <h3>
                                    {game.homeTeam} vs {game.awayTeam}
                                </h3>
                                <p>
                                    {game.homePoints} - {game.awayPoints}{" "}
                                    {game.status === "final" ? "(Final)" : ""}
                                </p>
                                <p>Venue: {game.venue}</p>
                                {gameWeather ? (
                                    <p>
                                        Weather: {gameWeather.weatherCondition},{" "}
                                        {gameWeather.temperature}°F
                                    </p>
                                ) : (
                                    <p>Weather data not available</p>
                                )}
                                {gameMedia ? (
                                    <p>
                                        Network: {gameMedia.network || "N/A"}{" "}
                                        {gameMedia.startTime && (
                                            <>on {new Date(gameMedia.startTime).toLocaleString()}</>
                                        )}
                                    </p>
                                ) : (
                                    <p>Media data not available</p>
                                )}
                            </div>
                            <div className="betting-lines">
                                <h4>Betting Lines</h4>
                                {gameLines ? (
                                    <div className="betting-line">
                                        {gameLines.lines.map((line) => (
                                            <div key={line.provider}>
                                                <img
                                                    src={getSportsbookLogo(
                                                        line.provider
                                                    )}
                                                    alt={`${line.provider} Logo`}
                                                    className="sportsbook-logo"
                                                />
                                                <p>
                                                    Spread: {line.spread}, O/U:{" "}
                                                    {line.overUnder}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p>No betting lines available</p>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default Games;