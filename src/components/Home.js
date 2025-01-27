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
        // Force HTTPS for logos
        const logo = team?.logos?.[0] || "/photos/default_team.png";
        return logo.startsWith('http://') ? logo.replace('http://', 'https://') : logo;
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

            {/* Games Section - Moved to top */}
            <section className="games-section">
                <h2 className="section-title">Week {week} Matchups</h2>
                <div className="games-slider">
                    {games
                        .filter(game => game.homeTeam && game.awayTeam) // Basic FBS filter
                        .map(game => (
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
                }

                .week-selector {
                    margin-top: 1rem;
                }

                select {
                    padding: 0.5rem;
                    margin-left: 0.5rem;
                    background: white;
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

                /* Games Section */
                .games-slider {
                    display: flex;
                    overflow-x: auto;
                    gap: 2rem;
                    padding-bottom: 2rem;
                    margin-bottom: 3rem;
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
                    width: 45%;
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

                /* Polls Section */
                .polls-grid {
                    display: grid;
                    gap: 2rem;
                    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
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

                /* Rest of the styles remain similar to previous version */
                /* ... (keep all other styles from previous answer) ... */
            `}</style>
        </div>
    );
};

export default Home;