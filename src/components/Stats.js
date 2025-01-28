import React, { useState, useEffect } from "react";
import "../styles/Stats.css";
import teamsService from "../services/teamsService";

const Stats = () => {
    const [teamStats, setTeamStats] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                setLoading(true);

                const data = await teamsService.getTeamStats("FBS", 2024);

                // Group stats by team
                const groupedStats = data.reduce((acc, item) => {
                    const { team, statName, statValue } = item;
                    if (!acc[team]) acc[team] = { name: team, stats: {} };
                    acc[team].stats[statName] = statValue;
                    return acc;
                }, {});

                setTeamStats(Object.values(groupedStats)); // Convert back to array
            } catch (error) {
                console.error("Error fetching stats:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    const getTeamLogo = (teamName) => {
        const team = teamStats.find((t) => t.name.toLowerCase() === teamName.toLowerCase());
        return team?.logo || "/photos/default_team.png";
    };

    const renderTeamStats = (statName) => {
        if (loading) {
            return <p className="stat-placeholder">Loading...</p>;
        }

        const sortedTeams = [...teamStats]
            .filter((team) => team.stats?.[statName] !== undefined)
            .sort((a, b) => b.stats[statName] - a.stats[statName]);

        if (sortedTeams.length === 0) {
            return <p className="stat-placeholder">No data available</p>;
        }

        return sortedTeams.slice(0, 5).map((team) => (
            <div key={team.name} className="team-row">
                <img src={getTeamLogo(team.name)} alt={team.name} className="team-logo" />
                <span className="team-name">{team.name}</span>
                <span className="team-stat">{team.stats[statName]}</span>
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
                    <div className="stat-card">
                        <h3 className="stat-title">Yards Allowed</h3>
                        <p className="stat-placeholder">Coming Soon</p>
                    </div>
                    <div className="stat-card">
                        <h3 className="stat-title">Points Allowed</h3>
                        <p className="stat-placeholder">Coming Soon</p>
                    </div>
                    <div className="stat-card">
                        <h3 className="stat-title">Sacks</h3>
                        <p className="stat-placeholder">Coming Soon</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Stats;