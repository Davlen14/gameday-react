import React, { useState, useEffect } from "react";
import teamsService from "../services/teamsService";
import "../styles/GamesAndTeams.css"; // Ensure the CSS file is imported

const Games = () => {
    const [games, setGames] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [week, setWeek] = useState(1); // Default to Week 1

    useEffect(() => {
        const fetchGames = async () => {
            try {
                setIsLoading(true);
                const gamesData = await teamsService.getGames(week);
                setGames(
                    gamesData.filter(
                        (game) => game.homeConference && game.awayConference // Filter only FBS games
                    )
                );
            } catch (err) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchGames();
    }, [week]);

    const handleWeekChange = (event) => {
        setWeek(Number(event.target.value));
    };

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
                {games.map((game) => (
                    <div key={game.id} className="game-card">
                        <div className="team-logos">
                            {/* Using logic similar to Teams component */}
                            <img
                                src={
                                    game.homeLogos
                                        ? game.homeLogos[0]
                                        : "/photos/default_team.png"
                                }
                                alt={`${game.homeTeam} Logo`}
                                className="team-logo"
                            />
                            <span>vs</span>
                            <img
                                src={
                                    game.awayLogos
                                        ? game.awayLogos[0]
                                        : "/photos/default_team.png"
                                }
                                alt={`${game.awayTeam} Logo`}
                                className="team-logo"
                            />
                        </div>
                        <div className="game-info">
                            <h3>
                                {game.homeTeam} vs {game.awayTeam}
                            </h3>
                            <p>Score: {game.homePoints} - {game.awayPoints}</p>
                            <p>Venue: {game.venue}</p>
                            <p>Status: {game.status}</p>
                            {game.weather && <p>Weather: {game.weather.summary}</p>}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Games;