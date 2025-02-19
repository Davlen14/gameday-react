import React, { useState, useEffect } from "react";
import teamsService from "../services/teamsService";
import "../styles/TeamAnalyticsDetail.css";

const TeamAnalyticsDetail = ({ teamName }) => {
    const [schedule, setSchedule] = useState([]);
    const [advancedStats, setAdvancedStats] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [expandedGameId, setExpandedGameId] = useState(null);

    useEffect(() => {
        const fetchSchedule = async () => {
            try {
                const scheduleData = await teamsService.getTeamSchedule(teamName, 2024);
                setSchedule(scheduleData);

                const statsPromises = scheduleData.map(game =>
                    teamsService.getAdvancedStats(game.id).catch(() => null)
                );

                const statsResults = await Promise.all(statsPromises);

                const statsMap = statsResults.reduce((acc, stat, index) => {
                    acc[scheduleData[index].id] = stat || {
                        homeOffense: {},
                        awayOffense: {},
                        homeDefense: {},
                        awayDefense: {}
                    };
                    return acc;
                }, {});
                
                setAdvancedStats(statsMap);
            } catch (err) {
                setError("Failed to load data.");
            } finally {
                setIsLoading(false);
            }
        };

        if (teamName) {
            fetchSchedule();
        }
    }, [teamName]);

    const handleGameClick = (gameId) => {
        setExpandedGameId(expandedGameId === gameId ? null : gameId);
    };

    if (isLoading) return <p>Loading game details...</p>;
    if (error) return <p className="error">{error}</p>;

    return (
        <div className="team-analytics-detail-container">
            <h2 className="detail-title">{teamName} 2024 Game Details</h2>
            {schedule.map((game) => (
                <div
                    key={game.id}
                    className={`game-detail-card ${expandedGameId === game.id ? "expanded" : ""}`}
                    onClick={() => handleGameClick(game.id)}
                >
                    <div className="game-header">
                        <div className="team-info">
                            <img src={`/logos/${game.homeTeam}.png`} alt={game.homeTeam} className="team-logo-detail" />
                            <span className="team-name">{game.homeTeam}</span>
                        </div>
                        <span className="vs">VS</span>
                        <div className="team-info">
                            <img src={`/logos/${game.awayTeam}.png`} alt={game.awayTeam} className="team-logo-detail" />
                            <span className="team-name">{game.awayTeam}</span>
                        </div>
                    </div>

                    <div className="game-meta">
                        <p><strong>Date:</strong> {new Date(game.date).toLocaleDateString()}</p>
                        <p><strong>Venue:</strong> {game.venue}</p>
                    </div>

                    <div className="game-stats">
                        <div className="stat-box">
                            <span className="stat-label">{game.homeTeam} Points</span>
                            <span className="stat-value">{game.homePoints}</span>
                        </div>
                        <div className="stat-box">
                            <span className="stat-label">{game.awayTeam} Points</span>
                            <span className="stat-value">{game.awayPoints}</span>
                        </div>
                    </div>

                    {expandedGameId === game.id && advancedStats[game.id] && advancedStats[game.id].homeOffense && (
                        <div className="advanced-stats">
                            <h4 className="advanced-stats-title">Detailed Performance</h4>

                            {/* Offensive Stats */}
                            <h5>Offensive Stats</h5>
                            <div className="stat-grid">
                                <div className="stat-item">
                                    <span className="stat-category">Plays</span>
                                    <div className="stat-comparison">
                                        <span>{advancedStats[game.id].homeOffense.plays || "N/A"}</span>
                                        <span>vs</span>
                                        <span>{advancedStats[game.id].awayOffense.plays || "N/A"}</span>
                                    </div>
                                </div>
                                <div className="stat-item">
                                    <span className="stat-category">Total PPA</span>
                                    <div className="stat-comparison">
                                        <span>{(advancedStats[game.id].homeOffense.totalPPA || 0).toFixed(2)}</span>
                                        <span>vs</span>
                                        <span>{(advancedStats[game.id].awayOffense.totalPPA || 0).toFixed(2)}</span>
                                    </div>
                                </div>
                                <div className="stat-item">
                                    <span className="stat-category">Success Rate</span>
                                    <div className="stat-comparison">
                                        <span>{((advancedStats[game.id].homeOffense.successRate || 0) * 100).toFixed(1)}%</span>
                                        <span>vs</span>
                                        <span>{((advancedStats[game.id].awayOffense.successRate || 0) * 100).toFixed(1)}%</span>
                                    </div>
                                </div>
                            </div>

                            {/* Defensive Stats */}
                            <h5>Defensive Stats</h5>
                            <div className="stat-grid">
                                <div className="stat-item">
                                    <span className="stat-category">Plays Defended</span>
                                    <div className="stat-comparison">
                                        <span>{advancedStats[game.id].homeDefense.plays || "N/A"}</span>
                                        <span>vs</span>
                                        <span>{advancedStats[game.id].awayDefense.plays || "N/A"}</span>
                                    </div>
                                </div>
                                <div className="stat-item">
                                    <span className="stat-category">Total PPA Allowed</span>
                                    <div className="stat-comparison">
                                        <span>{(advancedStats[game.id].homeDefense.totalPPA || 0).toFixed(2)}</span>
                                        <span>vs</span>
                                        <span>{(advancedStats[game.id].awayDefense.totalPPA || 0).toFixed(2)}</span>
                                    </div>
                                </div>
                                <div className="stat-item">
                                    <span className="stat-category">Success Rate Allowed</span>
                                    <div className="stat-comparison">
                                        <span>{((advancedStats[game.id].homeDefense.successRate || 0) * 100).toFixed(1)}%</span>
                                        <span>vs</span>
                                        <span>{((advancedStats[game.id].awayDefense.successRate || 0) * 100).toFixed(1)}%</span>
                                    </div>
                                </div>
                            </div>

                            {/* Explosiveness and Other Metrics */}
                            <h5>Additional Metrics</h5>
                            <div className="stat-grid">
                                <div className="stat-item">
                                    <span className="stat-category">Explosiveness</span>
                                    <div className="stat-comparison">
                                        <span>{(advancedStats[game.id].homeOffense.explosiveness || 0).toFixed(2)}</span>
                                        <span>vs</span>
                                        <span>{(advancedStats[game.id].awayOffense.explosiveness || 0).toFixed(2)}</span>
                                    </div>
                                </div>
                                <div className="stat-item">
                                    <span className="stat-category">Power Success</span>
                                    <div className="stat-comparison">
                                        <span>{((advancedStats[game.id].homeOffense.powerSuccess || 0) * 100).toFixed(1)}%</span>
                                        <span>vs</span>
                                        <span>{((advancedStats[game.id].awayOffense.powerSuccess || 0) * 100).toFixed(1)}%</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};

export default TeamAnalyticsDetail;