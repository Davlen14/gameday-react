import React, { useState, useEffect } from "react";
import "../styles/Stats.css";
import teamsService from "../services/teamsService";

const Stats = () => {
    const [teamStats, setTeamStats] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                setLoading(true);

                // 1️⃣ Fetch all FBS teams
                const allTeams = await teamsService.getTeams();
                const fbsTeams = allTeams.filter((team) => team.division === "fbs");

                console.log("Fetched FBS Teams:", fbsTeams.map((t) => t.school));

                // 2️⃣ Fetch stats for each team using Promise.allSettled
                const statsPromises = fbsTeams.map(async (team) => {
                    try {
                        const stats = await teamsService.getTeamStats(team.school, 2024);
                        return {
                            id: team.id,
                            name: team.school,
                            stats,
                        };
                    } catch (error) {
                        console.error(`Failed to fetch stats for ${team.school}:`, error);
                        return null;
                    }
                });

                const results = await Promise.allSettled(statsPromises);
                const stats = results
                    .filter((result) => result.status === "fulfilled" && result.value)
                    .map((result) => result.value);

                console.log("Fetched Team Stats:", stats);

                setTeamStats(stats);
            } catch (error) {
                console.error("Error fetching team stats:", error);
                setError("Failed to load team stats. Please try again later.");
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    const renderTeamStats = (statName) => {
        if (loading) return <p className="stat-placeholder">Loading...</p>;
        if (error) return <p className="stat-placeholder">{error}</p>;

        const sortedTeams = teamStats
            .filter((team) => team.stats?.[statName] !== undefined)
            .sort((a, b) => (b.stats[statName] || 0) - (a.stats[statName] || 0));

        if (sortedTeams.length === 0) return <p className="stat-placeholder">No data available</p>;

        return sortedTeams.slice(0, 5).map((team) => (
            <div key={team.id} className="team-row">
                <span className="team-name">{team.name}</span>
                <span className="team-stat">{team.stats[statName] || 0}</span>
            </div>
        ));
    };

    return (
        <div className="stats-container">
            <h1 className="stats-header">College Football Stats</h1>

            {/* Team Offense Section */}
            <div className="stats-section">
                <h2 className="section-title">Team Offense</h2>
                <div className="stats-grid">
                    <div className="stat-card">
                        <h3 className="stat-title">Passing Yards</h3>
                        {renderTeamStats("netPassingYards")}
                    </div>
                    <div className="stat-card">
                        <h3 className="stat-title">Rushing Yards</h3>
                        {renderTeamStats("rushingYards")}
                    </div>
                    <div className="stat-card">
                        <h3 className="stat-title">Total Yards</h3>
                        {renderTeamStats("totalYards")}
                    </div>
                </div>
            </div>

            {/* Team Defense Section */}
            <div className="stats-section">
                <h2 className="section-title">Team Defense</h2>
                <div className="stats-grid">
                    <div className="stat-card"><h3 className="stat-title">Yards Allowed</h3><p className="stat-placeholder">Coming Soon</p></div>
                    <div className="stat-card"><h3 className="stat-title">Points Allowed</h3><p className="stat-placeholder">Coming Soon</p></div>
                    <div className="stat-card"><h3 className="stat-title">Sacks</h3><p className="stat-placeholder">Coming Soon</p></div>
                </div>
            </div>

            {/* Player Statistics Section */}
            <div className="stats-section">
                <h2 className="section-title">Player Statistics</h2>
                <div className="stats-grid">
                    <div className="stat-card"><h3 className="stat-title">Passing Yards</h3><p className="stat-placeholder">Coming Soon</p></div>
                    <div className="stat-card"><h3 className="stat-title">Rushing Yards</h3><p className="stat-placeholder">Coming Soon</p></div>
                    <div className="stat-card"><h3 className="stat-title">Receiving Yards</h3><p className="stat-placeholder">Coming Soon</p></div>
                    <div className="stat-card"><h3 className="stat-title">Tackles</h3><p className="stat-placeholder">Coming Soon</p></div>
                    <div className="stat-card"><h3 className="stat-title">Sacks</h3><p className="stat-placeholder">Coming Soon</p></div>
                    <div className="stat-card"><h3 className="stat-title">Interceptions</h3><p className="stat-placeholder">Coming Soon</p></div>
                </div>
            </div>
        </div>
    );
};

export default Stats;