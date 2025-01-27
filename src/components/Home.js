import React, { useState, useEffect } from "react";
import teamsService from "../services/teamsService";

const Home = () => {
    const [polls, setPolls] = useState([]);
    const [games, setGames] = useState([]);
    const [teams, setTeams] = useState([]);
    const [week, setWeek] = useState(1);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchHomeData = async () => {
            try {
                setIsLoading(true);
                const [teamsData, pollsData, gamesData] = await Promise.all([
                    teamsService.getTeams(),
                    teamsService.getPolls(2024, 'ap', week),
                    teamsService.getGames(week),
                ]);

                setTeams(teamsData);
                setPolls(pollsData);
                setGames(gamesData);
            } catch (err) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchHomeData();
    }, [week]);

    const getTeamLogo = (teamName) => {
        const team = teams.find(t => t.school.toLowerCase() === teamName.toLowerCase());
        return team?.logos?.[0] || "/photos/default_team.png";
    };

    if (isLoading) return <div className="loading-container">Loading...</div>;
    if (error) return <div className="error-container">Error: {error}</div>;

    return (
        <div className="home-container">
            <header className="hero-header">
                <h1>Welcome to Gameday</h1>
                <div className="week-selector">
                    <label>Week:
                        <select value={week} onChange={(e) => setWeek(Number(e.target.value))}>
                            {[...Array(17).keys()].map(w => (
                                <option key={w+1} value={w+1}>Week {w+1}</option>
                            ))}
                        </select>
                    </label>
                </div>
            </header>

            {/* Polls Section */}
            <section className="polls-section">
                <h2 className="section-title">Top 25 Rankings</h2>
                <div className="polls-grid">
                    {polls.map(poll => (
                        <div key={poll.id} className="poll-card">
                            <h3>{poll.name}</h3>
                            <div className="rankings-list">
                                {poll.rankings.slice(0, 5).map(team => (
                                    <div key={team.school} className="ranking-item">
                                        <img src={getTeamLogo(team.school)} alt={team.school} className="team-logo" />
                                        <div className="team-info">
                                            <span className="rank">#{team.rank}</span>
                                            <span className="team-name">{team.school}</span>
                                            <span className="points">{team.points} pts</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Games Section */}
            <section className="games-section">
                <h2 className="section-title">Week {week} Matchups</h2>
                <div className="games-slider">
                    {games.map(game => (
                        <div key={game.id} className="game-card">
                            <div className="teams-container">
                                <div className="team">
                                    <img src={getTeamLogo(game.homeTeam)} alt={game.homeTeam} />
                                    <span>{game.homeTeam}</span>
                                </div>
                                <div className="vs-circle">VS</div>
                                <div className="team">
                                    <img src={getTeamLogo(game.awayTeam)} alt={game.awayTeam} />
                                    <span>{game.awayTeam}</span>
                                </div>
                            </div>
                            <div className="game-details">
                                <p className="game-time">
                                    {new Date(game.startDate).toLocaleString()}
                                </p>
                                <p className="game-venue">{game.venue}</p>
                                <div className="score-container">
                                    <span>{game.homePoints || '-'}</span>
                                    <span>{game.awayPoints || '-'}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            <style jsx>{`
                :root {
                    --primary-color: #ffffff;
                    --accent-color: rgb(142, 0, 0);
                    --text-color: #333333;
                    --background-color: #f5f5f5;
                    --border-color: #dddddd;
                }

                .home-container {
                    padding: 2rem;
                    background-color: var(--background-color);
                    color: var(--text-color);
                    min-height: 100vh;
                }

                .hero-header {
                    text-align: center;
                    margin-bottom: 3rem;
                    position: relative;
                }

                .week-selector {
                    margin-top: 1rem;
                }

                select {
                    padding: 0.5rem;
                    margin-left: 0.5rem;
                    background: var(--primary-color);
                    color: var(--text-color);
                    border: 1px solid var(--border-color);
                    border-radius: 4px;
                }

                .section-title {
                    color: var(--accent-color);
                    border-bottom: 2px solid var(--accent-color);
                    padding-bottom: 0.5rem;
                    margin-bottom: 2rem;
                }

                /* Polls Section */
                .polls-grid {
                    display: grid;
                    gap: 2rem;
                    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                    margin-bottom: 3rem;
                }

                .poll-card {
                    background: var(--primary-color);
                    padding: 1.5rem;
                    border-radius: 10px;
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
                    border: 1px solid var(--border-color);
                }

                .ranking-item {
                    display: flex;
                    align-items: center;
                    padding: 1rem 0;
                    border-bottom: 1px solid var(--border-color);
                }

                .team-logo {
                    width: 40px;
                    height: 40px;
                    margin-right: 1rem;
                    object-fit: contain;
                }

                .team-info {
                    display: flex;
                    flex-direction: column;
                }

                .rank {
                    color: var(--accent-color);
                    font-weight: bold;
                }

                /* Games Section */
                .games-slider {
                    display: flex;
                    overflow-x: auto;
                    gap: 2rem;
                    padding-bottom: 2rem;
                }

                .game-card {
                    flex: 0 0 300px;
                    background: var(--primary-color);
                    border-radius: 10px;
                    padding: 1.5rem;
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
                    border: 1px solid var(--border-color);
                }

                .teams-container {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 1rem;
                }

                .team {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    text-align: center;
                }

                .team img {
                    width: 60px;
                    height: 60px;
                    margin-bottom: 0.5rem;
                    object-fit: contain;
                }

                .vs-circle {
                    background: var(--accent-color);
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: bold;
                    color: white;
                }

                .game-details {
                    text-align: center;
                }

                .game-time {
                    font-size: 0.9rem;
                    color: #666666;
                    margin-bottom: 0.5rem;
                }

                .game-venue {
                    font-size: 0.9rem;
                    margin-bottom: 1rem;
                    color: #666666;
                }

                .score-container {
                    display: flex;
                    justify-content: space-around;
                    font-size: 1.2rem;
                    font-weight: bold;
                }

                /* Scrollbar Styling */
                .games-slider::-webkit-scrollbar {
                    height: 8px;
                }

                .games-slider::-webkit-scrollbar-track {
                    background: rgba(0,0,0,0.05);
                }

                .games-slider::-webkit-scrollbar-thumb {
                    background: var(--accent-color);
                    border-radius: 4px;
                }

                .loading-container, .error-container {
                    text-align: center;
                    padding: 2rem;
                    font-size: 1.2rem;
                }
            `}</style>
        </div>
    );
};

export default Home;