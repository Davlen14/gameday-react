import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FaTv } from "react-icons/fa";
import teamsService from "../services/teamsService";
import "../styles/Home.css";

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
                    teamsService.getPolls(2024, "ap", week),
                    teamsService.getGames(week),
                ]);

                setTeams(teamsData);
                setPolls(pollsData);

                // Filter games to include only FBS teams
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

        fetchHomeData();
    }, [week]);

    const getTeamLogo = (teamName) => {
        const team = teams.find(
            (t) => t.school.toLowerCase() === teamName?.toLowerCase()
        );
        return team?.logos?.[0] || "/photos/default_team.png";
    };

    const getNetworkLogo = (network) => {
        const networks = {
            ESPN: <FaTv className="network-icon espn" />,
            FOX: <FaTv className="network-icon fox" />,
            ABC: <FaTv className="network-icon abc" />,
            CBS: <FaTv className="network-icon cbs" />,
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
                    <label>
                        Week:
                        <select
                            value={week}
                            onChange={(e) => setWeek(Number(e.target.value))}
                        >
                            {[...Array(17).keys()].map((w) => (
                                <option key={w + 1} value={w + 1}>
                                    Week {w + 1}
                                </option>
                            ))}
                        </select>
                    </label>
                </div>
            </header>

            {/* Polls Section */}
            <section className="polls-section">
                <div className="polls-grid">
                    {polls.map((poll) => (
                        <div key={poll.id} className="poll-card">
                            <h3 className="poll-title">
                                <img
                                    src="/photos/committee.png"
                                    alt="Committee Logo"
                                    className="poll-logo"
                                />
                                {poll.name}
                            </h3>
                            <div className="rankings-list">
                                {poll.rankings.slice(0, 5).map((team) => (
                                    <div key={team.school} className="ranking-item">
                                        <img
                                            src={getTeamLogo(team.school)}
                                            alt={team.school}
                                            className="team-logo"
                                        />
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
                    {games.map((game) => (
                        <Link
                            to={`/games/${game.id}`}
                            key={game.id}
                            className="game-card-link"
                        >
                            <div className="game-card">
                                <div className="game-header">
                                    <div className="game-time">
                                        {new Date(
                                            game.startDate
                                        ).toLocaleDateString("en-US", {
                                            weekday: "short",
                                            month: "short",
                                            day: "numeric",
                                        })}
                                    </div>
                                    <div className="network">
                                        {getNetworkLogo(
                                            game.network || "ESPN"
                                        )}
                                        <span className="network-name">
                                            {game.network || "ESPN"}
                                        </span>
                                    </div>
                                </div>

                                <div className="teams-container">
                                    <div className="team home-team">
                                        <img
                                            src={getTeamLogo(game.homeTeam)}
                                            alt={game.homeTeam}
                                        />
                                        <div className="team-info">
                                            <span className="team-name">
                                                {game.homeTeam}
                                            </span>
                                            <span className="team-record">
                                                (8-2)
                                            </span>
                                        </div>
                                    </div>

                                    <div className="vs-container">
                                        <div className="vs-circle">VS</div>
                                        <div className="score-container">
                                            <span className="score">
                                                {game.homePoints || "-"}
                                            </span>
                                            <span className="score-divider">
                                                -
                                            </span>
                                            <span className="score">
                                                {game.awayPoints || "-"}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="team away-team">
                                        <img
                                            src={getTeamLogo(game.awayTeam)}
                                            alt={game.awayTeam}
                                        />
                                        <div className="team-info">
                                            <span className="team-name">
                                                {game.awayTeam}
                                            </span>
                                            <span className="team-record">
                                                (7-3)
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="game-footer">
                                    <div className="game-venue">
                                        <span>🏟️ {game.venue}</span>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </section>
        </div>
    );
};

// Export Home Component
export default Home;