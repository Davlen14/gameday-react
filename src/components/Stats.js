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
                const allTeams = await teamsService.getTeams(); // Fetch all teams
                const fbsTeams = allTeams.filter((team) => team.division === "fbs"); // Filter for FBS teams

                console.log("Fetched FBS Teams:", fbsTeams); // Log FBS teams

                // Fetch stats for each team
                const statsPromises = fbsTeams.map((team) =>
                    teamsService.getTeamStats(team.school, 2024).then((stats) => ({
                        id: team.id,
                        name: team.school,
                        logo: team.logos?.[0] || "/photos/default_team.png",
                        stats,
                    }))
                );

                const stats = await Promise.all(statsPromises);
                console.log("Fetched Team Stats:", stats); // Log fetched stats

                setTeamStats(stats);
            } catch (error) {
                console.error("Error fetching stats:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

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
            <div key={team.id} className="team-row">
                <img src={team.logo} alt={team.name} className="team-logo" />
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
                        {teamStats.length > 0 ? (
                            renderTeamStats("netPassingYards")
                        ) : (
                            <p className="stat-placeholder">Coming Soon</p>
                        )}
                    </div>
                    <div className="stat-card">
                        <h3 className="stat-title">Rushing Yards</h3>
                        {teamStats.length > 0 ? (
                            renderTeamStats("rushingYards")
                        ) : (
                            <p className="stat-placeholder">Coming Soon</p>
                        )}
                    </div>
                    <div className="stat-card">
                        <h3 className="stat-title">Total Yards</h3>
                        {teamStats.length > 0 ? (
                            renderTeamStats("totalYards")
                        ) : (
                            <p className="stat-placeholder">Coming Soon</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Stats;