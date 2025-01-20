import React, { useState, useEffect } from "react";
import teamsService from "../services/teamsService";
import "../styles/GamesAndTeams.css"; // Ensure the CSS file is imported

const Games = () => {
    const [games, setGames] = useState([]);
    const [teams, setTeams] = useState([]); // Store all teams
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [week, setWeek] = useState(1); // Default to Week 1

    useEffect(() => {
        const fetchGamesAndTeams = async () => {
            try {
                setIsLoading(true);

                // Fetch teams and games
                const teamsData = await teamsService.getTeams(); // Fetch teams for logos
                setTeams(teamsData);

                const gamesData = await teamsService.getGames(week); // Fetch games
                const fbsGames = gamesData.filter(
                    (game) => game.homeConference && game.awayConference // Filter only FBS games
                );
                setGames(fbsGames);
            } catch (err) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchGamesAndTeams();
    }, [week]);

    const handleWeekChange = (event) => {
        setWeek(Number(event.target.value));
    };

    // Find team logo by matching the team name
    const getTeamLogo = (teamName) => {
        const team = teams.find((t) => t.school === teamName);
        return team?.logos ? team.logos[0] : "/photos/default_team.png"; // Fallback to default
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
                            {/* Fetch logos using getTeamLogo */}
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