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
                    teamsService.getPolls(),
                    teamsService.getGames(2024, 1), // Added year parameter
                ]);

                // Filter FBS games like in Games component
                const fbsGames = gamesData.filter(
                    (game) =>
                        game.homeClassification === "fbs" &&
                        game.awayClassification === "fbs"
                );

                setPolls(pollsData);
                setGames(fbsGames);
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
                            <strong>{poll.name}</strong>: {poll.rankings?.length} rankings
                        </li>
                    ))}
                </ul>
            </section>

            {/* Games Section - Fixed property names */}
            <section>
                <h3>Games (Week 1)</h3>
                <ul>
                    {games.map((game) => (
                        <li key={game.id}>
                            {/* Changed to camelCase properties */}
                            <strong>{game.homeTeam} vs {game.awayTeam}</strong> -{" "}
                            {new Date(game.startDate).toLocaleDateString()}
                        </li>
                    ))}
                </ul>
            </section>
        </div>
    );
};

export default Home;