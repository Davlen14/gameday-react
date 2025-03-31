import React from "react";
import "../styles/PlayerGrade.css";

const PlayerGrade = () => {
  return (
    <div className="player-grade-container">
      <div className="player-grade-header">
        <h1>Player Grading System</h1>
        <p className="player-grade-subtitle">
          Our proprietary player evaluation methodology
        </p>
      </div>
      
      <div className="coming-soon-section">
        <div className="coming-soon-content">
          <h2 className="coming-soon-title">Coming Soon</h2>
          <p className="coming-soon-description">
            We're developing a comprehensive player grading system to analyze every player on every play.
            Our advanced metrics will provide insights you can't find anywhere else.
          </p>
          
          <div className="features-preview">
            <div className="feature">
              <div className="feature-icon">📊</div>
              <h3>Play-by-Play Analysis</h3>
              <p>Detailed grading of each player's performance on every single play</p>
            </div>
            
            <div className="feature">
              <div className="feature-icon">📈</div>
              <h3>Position-Specific Metrics</h3>
              <p>Unique grading criteria for each position based on college football requirements</p>
            </div>
            
            <div className="feature">
              <div className="feature-icon">🎮</div>
              <h3>Interactive Grading Interface</h3>
              <p>Visual tools to understand player performance in context</p>
            </div>
          </div>
          
          <div className="notification-signup">
            <h3>Get Notified When We Launch</h3>
            <form className="signup-form">
              <input type="email" placeholder="Enter your email" className="email-input" />
              <button type="submit" className="submit-button">Notify Me</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayerGrade;