import React from "react";
import "../styles/VisualizeTrends.css";

const VisualizeTrends = () => {
  return (
    <div className="visualize-container">
      <header className="visualize-header">
        <h1>Visualize Trends</h1>
        <p>
          Explore animated trends, polls, player stats, team points and more over
          the season.
        </p>
      </header>
      <section className="visualize-filters">
        <div className="filter-group">
          <label htmlFor="team-select">Team</label>
          <select id="team-select">
            <option>All Teams</option>
            <option>Team A</option>
            <option>Team B</option>
          </select>
        </div>
        <div className="filter-group">
          <label htmlFor="player-select">Player</label>
          <select id="player-select">
            <option>All Players</option>
            <option>Player 1</option>
            <option>Player 2</option>
          </select>
        </div>
        <div className="filter-group">
          <label htmlFor="poll-select">Polls</label>
          <select id="poll-select">
            <option>Weekly Rankings</option>
            <option>Other Polls</option>
          </select>
        </div>
      </section>
      <section className="visualize-dashboard">
        <div className="chart-card">
          <div className="chart-header">
            <h2>Animated Poll Rankings</h2>
            <button className="play-button">Play</button>
          </div>
          <div className="chart-placeholder">[Animated Bump Chart]</div>
        </div>
        <div className="chart-card">
          <div className="chart-header">
            <h2>Player Stats Over Weeks</h2>
          </div>
          <div className="chart-placeholder">[Line Chart Placeholder]</div>
        </div>
        <div className="chart-card">
          <div className="chart-header">
            <h2>Team Points Per Game</h2>
          </div>
          <div className="chart-placeholder">[Bar Chart Placeholder]</div>
        </div>
        <div className="chart-card">
          <div className="chart-header">
            <h2>Offense vs. Defense Trends</h2>
          </div>
          <div className="chart-placeholder">[Dual-Axis Chart Placeholder]</div>
        </div>
      </section>
    </div>
  );
};

export default VisualizeTrends;