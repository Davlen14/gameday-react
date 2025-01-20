import React, { useState, useEffect } from "react";
import teamsService from "../services/teamsService";

const Games = () => {
    const [games, setGames] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [week, setWeek] = useState(1); // Default to Week 1

    useEffect(() => {
        const fetchGames = async () => {
            try {
                setIsLoading(true);
                const gamesData = await teamsService.getGames(week); // Use getGames
                setGames(gamesData);
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

    if (isLoading) return <p>Loading...</p>;
    if (error) return <p>Error: {error}</p>;

    return (
        <div>
            <h1>Games</h1>
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

            <ul>
                {games.map((game) => (
                    <li key={game.id}>
                        <strong>{game.homeTeam} vs {game.awayTeam}</strong>
                        <p>Score: {game.homePoints} - {game.awayPoints}</p>
                        <p>Venue: {game.venue}</p>
                        <p>Status: {game.status}</p>
                        {game.weather && <p>Weather: {game.weather.summary}</p>}
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default Games;