import React, { useState, useEffect } from "react";
import teamsService from "../services/teamsService";

const Home = () => {
    const [polls, setPolls] = useState([]);
    const [games, setGames] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchHomeData = async () => {
            try {
                setIsLoading(true);

                // Fetch polls and games with proper parameters
                const [pollsData, gamesData] = await Promise.all([
                    teamsService.getPolls(2024, 'ap', 1), // Added required parameters
                    teamsService.getGames(1), // Correct week parameter
                ]);

                setPolls(pollsData);
                setGames(gamesData);
            } catch (err) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchHomeData();
    }, []);

    if (isLoading) return <p>Loading...</p>;
    if (error) return <p>Error: {error}</p>;

    return (
        <div>
            <h2>Welcome to Gameday</h2>

            {/* Polls Section */}
            <section>
                <h3>Polls</h3>
                <ul>
                    {polls.map((poll) => (
                        <li key={poll.id}>
                            <strong>{poll.name}</strong>: {poll.rankings?.length} teams ranked
                            <ol>
                                {poll.rankings.slice(0, 5).map((team) => (
                                    <li key={team.school}>
                                        {team.school} ({team.points} pts)
                                    </li>
                                ))}
                            </ol>
                        </li>
                    ))}
                </ul>
            </section>

            {/* Games Section */}
            <section>
                <h3>Games (Week 1)</h3>
                <ul>
                    {games.map((game) => (
                        <li key={game.id}>
                            <strong>{game.homeTeam} vs {game.awayTeam}</strong>
                            <div>
                                {new Date(game.startDate).toLocaleDateString()} @ {game.venue}
                            </div>
                        </li>
                    ))}
                </ul>
            </section>
        </div>
    );
};

export default Home;