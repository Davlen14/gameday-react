import React, { useState, useEffect } from "react";
import teamsService from "../services/teamsService";
import "../styles/GamesAndTeams.css"; // Ensure the CSS file is imported

const Games = () => {
    const [games, setGames] = useState([]);
    const [teams, setTeams] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [week, setWeek] = useState(1); // Default to Week 1

    useEffect(() => {
        const fetchGamesAndTeams = async () => {
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
            } catch (err) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchGamesAndTeams();
    }, [week]);

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
                {games.map((game) => (
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
                            {game.weather && (
                                <p>Weather: {game.weather.summary}</p>
                            )}
                        </div>
                        <div className="betting-lines">
                            <h4>Betting Lines</h4>
                            {game.betting ? (
                                Object.keys(game.betting).map((provider) => (
                                    <div key={provider} className="betting-line">
                                        <img
                                            src={getSportsbookLogo(provider)}
                                            alt={`${provider} Logo`}
                                            className="sportsbook-logo"
                                        />
                                        <p>
                                            Spread: {game.betting[provider].spread}
                                            , O/U: {game.betting[provider].overUnder}
                                        </p>
                                    </div>
                                ))
                            ) : (
                                <p>No betting lines available</p>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Games;