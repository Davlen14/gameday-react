import React, { useState, useEffect } from "react";
import "../styles/Stats.css"; // Import the external CSS
import teamsService from "../services/teamsService"; // Import the teamsService for fetching data

const Stats = () => {
    const [teamStats, setTeamStats] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                setLoading(true);
                const data = await teamsService.getTeams(); // Fetch all teams
                console.log("Fetched Team Data:", data); // Debug fetched data
                const fbsTeams = data.filter((team) => team.division === "fbs"); // Filter FBS teams
                setTeamStats(fbsTeams);
            } catch (error) {
                console.error("Error fetching stats:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    const getTeamLogo = (teamName) => {
        const team = teamStats.find(
            (t) => t.school.toLowerCase() === teamName.toLowerCase()
        );
        return team?.logos?.[0] || "/photos/default_team.png";
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
            <div key={team.id} className="team-row">
                <img src={getTeamLogo(team.school)} alt={team.school} className="team-logo" />
                <span className="team-name">{team.school}</span>
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

            {/* Player Statistics Section */}
            <div className="stats-section">
                <h2 className="section-title">Player Statistics</h2>
                <div className="stats-grid">
                    <div className="stat-card">
                        <h3 className="stat-title">Passing Yards</h3>
                        <p className="stat-placeholder">Coming Soon</p>
                    </div>
                    <div className="stat-card">
                        <h3 className="stat-title">Rushing Yards</h3>
                        <p className="stat-placeholder">Coming Soon</p>
                    </div>
                    <div className="stat-card">
                        <h3 className="stat-title">Receiving Yards</h3>
                        <p className="stat-placeholder">Coming Soon</p>
                    </div>
                    <div className="stat-card">
                        <h3 className="stat-title">Tackles</h3>
                        <p className="stat-placeholder">Coming Soon</p>
                    </div>
                    <div className="stat-card">
                        <h3 className="stat-title">Sacks</h3>
                        <p className="stat-placeholder">Coming Soon</p>
                    </div>
                    <div className="stat-card">
                        <h3 className="stat-title">Interceptions</h3>
                        <p className="stat-placeholder">Coming Soon</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Stats;