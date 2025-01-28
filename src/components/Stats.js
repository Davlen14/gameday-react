import React from "react";
import "../styles/Stats.css"; // Import the external CSS

const Stats = () => {
    return (
        <div className="stats-container">
            <h1 className="stats-header">College Football Stats</h1>

            {/* Team Statistics Section */}
            <div className="stats-section">
                <h2 className="section-title">Team Statistics</h2>
                <div className="stats-grid">
                    <div className="stat-card">
                        <h3 className="stat-title">Offense</h3>
                        <p className="stat-placeholder">Coming Soon</p>
                    </div>
                    <div className="stat-card">
                        <h3 className="stat-title">Defense</h3>
                        <p className="stat-placeholder">Coming Soon</p>
                    </div>
                    <div className="stat-card">
                        <h3 className="stat-title">Special Teams</h3>
                        <p className="stat-placeholder">Coming Soon</p>
                    </div>
                </div>
            </div>

            {/* Player Statistics Section */}
            <div className="stats-section">
                <h2 className="section-title">Player Statistics</h2>
                <div className="stats-grid">
                    <div className="stat-card">
                        <h3 className="stat-title">Passing Leaders</h3>
                        <p className="stat-placeholder">Coming Soon</p>
                    </div>
                    <div className="stat-card">
                        <h3 className="stat-title">Rushing Leaders</h3>
                        <p className="stat-placeholder">Coming Soon</p>
                    </div>
                    <div className="stat-card">
                        <h3 className="stat-title">Receiving Leaders</h3>
                        <p className="stat-placeholder">Coming Soon</p>
                    </div>
                </div>
            </div>

            {/* Defensive Leaders Section */}
            <div className="stats-section">
                <h2 className="section-title">Defensive Leaders</h2>
                <div className="stats-grid">
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