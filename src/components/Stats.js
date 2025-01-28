import React from "react";
import "../styles/Stats.css"; // Import the external CSS

const Stats = () => {
    return (
        <div className="stats-container">
            <h1 className="stats-header">College Football Stats</h1>

            {/* Team Offense Section */}
            <div className="stats-section">
                <h2 className="section-title">Team Offense</h2>
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
                        <h3 className="stat-title">Total Yards</h3>
                        <p className="stat-placeholder">Coming Soon</p>
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