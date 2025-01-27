import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FaTv } from "react-icons/fa";
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
        const team = teams.find(t => t.school.toLowerCase() === teamName?.toLowerCase());
        return team?.logos?.[0] || "/photos/default_team.png";
    };

    const getNetworkLogo = (network) => {
        // Add your network logo mappings here
        const networks = {
            'ESPN': <FaTv className="network-icon espn" />,
            'FOX': <FaTv className="network-icon fox" />,
            'ABC': <FaTv className="network-icon abc" />,
            'CBS': <FaTv className="network-icon cbs" />
        };
        return networks[network] || <FaTv className="network-icon default" />;
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

            {/* Games Section with Router Links */}
            <section className="games-section">
                <h2 className="section-title">Week {week} Matchups</h2>
                <div className="games-slider">
                    {games.map(game => (
                        <Link 
                            to={`/games/${game.id}`} 
                            key={game.id} 
                            className="game-card-link"
                        >
                            <div className="game-card">
                                <div className="game-header">
                                    <div className="game-time">
                                        {new Date(game.startDate).toLocaleDateString('en-US', {
                                            weekday: 'short', 
                                            month: 'short', 
                                            day: 'numeric'
                                        })}
                                    </div>
                                    <div className="network">
                                        {getNetworkLogo(game.network || 'ESPN')}
                                        <span className="network-name">{game.network || 'ESPN'}</span>
                                    </div>
                                </div>
                                
                                <div className="teams-container">
                                    <div className="team home-team">
                                        <img src={getTeamLogo(game.homeTeam)} alt={game.homeTeam} />
                                        <div className="team-info">
                                            <span className="team-name">{game.homeTeam}</span>
                                            <span className="team-record">(8-2)</span>
                                        </div>
                                    </div>
                                    
                                    <div className="vs-container">
                                        <div className="vs-circle">VS</div>
                                        <div className="score-container">
                                            <span className="score">{game.homePoints || '-'}</span>
                                            <span className="score-divider">-</span>
                                            <span className="score">{game.awayPoints || '-'}</span>
                                        </div>
                                    </div>

                                    <div className="team away-team">
                                        <img src={getTeamLogo(game.awayTeam)} alt={game.awayTeam} />
                                        <div className="team-info">
                                            <span className="team-name">{game.awayTeam}</span>
                                            <span className="team-record">(7-3)</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="game-footer">
                                    <div className="game-venue">
                                        <span>📍 {game.venue}</span>
                                    </div>
                                </div>
                            </div>
                        </Link>
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
                    font-size: 1rem;
                }

                .section-title {
                    color: var(--accent-color);
                    border-bottom: 2px solid var(--accent-color);
                    padding-bottom: 0.5rem;
                    margin-bottom: 2rem;
                    font-size: 1.8rem;
                    font-weight: 600;
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
                    border-radius: 16px;
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
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

                /* Modern Game Cards */
                .games-slider {
                    display: flex;
                    overflow-x: auto;
                    gap: 2rem;
                    padding-bottom: 2rem;
                }

                .game-card-link {
                    text-decoration: none;
                    color: inherit;
                    display: block;
                    transition: transform 0.3s ease;
                }

                .game-card {
                    flex: 0 0 300px;
                    background: linear-gradient(145deg, #ffffff, #f8f8f8);
                    border-radius: 16px;
                    padding: 1.5rem;
                    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
                    border: 1px solid rgba(255, 255, 255, 0.3);
                    cursor: pointer;
                    transition: all 0.3s ease;
                }

                .game-card:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.12);
                }

                .game-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 1.5rem;
                    font-size: 0.9rem;
                    color: #666;
                }

                .network {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }

                .network-icon {
                    font-size: 1.2rem;
                    color: var(--accent-color);
                }

                .network-name {
                    font-weight: 500;
                }

                .teams-container {
                    display: grid;
                    grid-template-columns: 1fr auto 1fr;
                    align-items: center;
                    gap: 1.5rem;
                    margin-bottom: 1.5rem;
                }

                .team {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    text-align: center;
                }

                .team img {
                    width: 72px;
                    height: 72px;
                    margin-bottom: 0.75rem;
                    object-fit: contain;
                    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
                }

                .team-name {
                    font-weight: 600;
                    font-size: 1.1rem;
                    margin-bottom: 0.25rem;
                }

                .team-record {
                    font-size: 0.85rem;
                    color: #666;
                }

                .vs-container {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 0.5rem;
                }

                .vs-circle {
                    background: linear-gradient(135deg, var(--accent-color), #b30000);
                    width: 48px;
                    height: 48px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: 700;
                    color: white;
                    font-size: 1.1rem;
                    box-shadow: 0 4px 12px rgba(142, 0, 0, 0.2);
                    transition: transform 0.3s ease;
                }

                .game-card:hover .vs-circle {
                    transform: scale(1.1);
                }

                .score-container {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }

                .score {
                    font-size: 1.4rem;
                    font-weight: 700;
                    color: var(--text-color);
                    padding: 0.25rem 0.75rem;
                    border-radius: 6px;
                    background: rgba(0, 0, 0, 0.04);
                }

                .score-divider {
                    font-weight: 500;
                    color: #999;
                }

                .game-footer {
                    padding-top: 1rem;
                    margin-top: 1rem;
                    border-top: 1px solid rgba(0, 0, 0, 0.08);
                    font-size: 0.9rem;
                    color: #666;
                }

                /* Scrollbar Styling */
                .games-slider::-webkit-scrollbar {
                    height: 6px;
                }

                .games-slider::-webkit-scrollbar-track {
                    background: rgba(0,0,0,0.05);
                }

                .games-slider::-webkit-scrollbar-thumb {
                    background: rgba(142, 0, 0, 0.3);
                    border-radius: 4px;
                }

                .games-slider::-webkit-scrollbar-thumb:hover {
                    background: rgba(142, 0, 0, 0.4);
                }

                .loading-container, .error-container {
                    text-align: center;
                    padding: 2rem;
                    font-size: 1.2rem;
                }

                @media (max-width: 768px) {
                    .game-card {
                        flex: 0 0 280px;
                    }

                    .team img {
                        width: 56px;
                        height: 56px;
                    }

                    .vs-circle {
                        width: 40px;
                        height: 40px;
                        font-size: 1rem;
                    }

                    .score {
                        font-size: 1.2rem;
                    }
                }
            `}</style>
        </div>
    );
};

export default Home;