import React from 'react';
import { motion } from 'framer-motion';
import { FaChartLine, FaChartBar, FaExchangeAlt } from 'react-icons/fa';
import '../styles/NewGameStats.css'; // Adjust the path as necessar

const NewGameStats = ({ 
  game, 
  currentPlay, 
  homeScore, 
  awayScore,
  homeColor,
  awayColor
}) => {
  // If no current play data is available
  if (!currentPlay) {
    return (
      <div className="game-stats">
        <h3>Game Statistics</h3>
        <div className="stats-message">
          <p>No statistical data available for this game yet.</p>
        </div>
      </div>
    );
  }

  // Calculate stat percentages for visualization
  const calculatePercentage = (home, away) => {
    const total = home + away;
    if (total === 0) return { homePercent: 50, awayPercent: 50 };
    
    const homePercent = Math.round((home / total) * 100);
    return { 
      homePercent, 
      awayPercent: 100 - homePercent 
    };
  };

  // Get stats from current play
  const homeTotalYards = currentPlay.homeTotalYards || 0;
  const awayTotalYards = currentPlay.awayTotalYards || 0;
  const homePassingYards = currentPlay.homePassingYards || 0;
  const awayPassingYards = currentPlay.awayPassingYards || 0;
  const homeRushingYards = currentPlay.homeRushingYards || 0;
  const awayRushingYards = currentPlay.awayRushingYards || 0;
  const homeFirstDowns = currentPlay.homeFirstDowns || 0;
  const awayFirstDowns = currentPlay.awayFirstDowns || 0;
  const homeTurnovers = currentPlay.homeTurnovers || 0;
  const awayTurnovers = currentPlay.awayTurnovers || 0;
  const homePossessionTime = currentPlay.homePossessionTime || 0;
  const awayPossessionTime = currentPlay.awayPossessionTime || 0;

  // Calculate percentages
  const yardsPercentage = calculatePercentage(homeTotalYards, awayTotalYards);
  const passingPercentage = calculatePercentage(homePassingYards, awayPassingYards);
  const rushingPercentage = calculatePercentage(homeRushingYards, awayRushingYards);
  const firstDownsPercentage = calculatePercentage(homeFirstDowns, awayFirstDowns);
  const possessionPercentage = calculatePercentage(homePossessionTime, awayPossessionTime);

  return (
    <div className="game-stats">
      <h3>Game Statistics</h3>
      
      <div className="stats-header">
        <div className="team-header home">
          <img 
            src={game.homeLogo || `/photos/default_team.png`} 
            alt={game.homeTeam} 
            className="team-logo"
          />
          <div className="team-info">
            <div className="team-name">{game.homeTeam}</div>
            <div className="team-score">{homeScore}</div>
          </div>
        </div>
        
        <div className="stats-divider">VS</div>
        
        <div className="team-header away">
          <div className="team-info">
            <div className="team-name">{game.awayTeam}</div>
            <div className="team-score">{awayScore}</div>
          </div>
          <img 
            src={game.awayLogo || `/photos/default_team.png`} 
            alt={game.awayTeam} 
            className="team-logo"
          />
        </div>
      </div>
      
      <div className="stats-grid">
        {/* Total Yards */}
        <div className="stat-item">
          <div className="stat-header">
            <FaChartBar className="stat-icon" />
            <h4>Total Yards</h4>
          </div>
          
          <div className="stat-comparison">
            <div className="stat-value home">{homeTotalYards}</div>
            <div className="stat-bar-container">
              <motion.div 
                className="stat-bar home"
                initial={{ width: 0 }}
                animate={{ width: `${yardsPercentage.homePercent}%` }}
                transition={{ duration: 1 }}
                style={{ backgroundColor: homeColor }}
              />
              <motion.div 
                className="stat-bar away"
                initial={{ width: 0 }}
                animate={{ width: `${yardsPercentage.awayPercent}%` }}
                transition={{ duration: 1 }}
                style={{ backgroundColor: awayColor }}
              />
            </div>
            <div className="stat-value away">{awayTotalYards}</div>
          </div>
        </div>
        
        {/* Passing Yards */}
        <div className="stat-item">
          <div className="stat-header">
            <FaExchangeAlt className="stat-icon" />
            <h4>Passing</h4>
          </div>
          
          <div className="stat-comparison">
            <div className="stat-value home">{homePassingYards}</div>
            <div className="stat-bar-container">
              <motion.div 
                className="stat-bar home"
                initial={{ width: 0 }}
                animate={{ width: `${passingPercentage.homePercent}%` }}
                transition={{ duration: 1 }}
                style={{ backgroundColor: homeColor }}
              />
              <motion.div 
                className="stat-bar away"
                initial={{ width: 0 }}
                animate={{ width: `${passingPercentage.awayPercent}%` }}
                transition={{ duration: 1 }}
                style={{ backgroundColor: awayColor }}
              />
            </div>
            <div className="stat-value away">{awayPassingYards}</div>
          </div>
        </div>
        
        {/* Rushing Yards */}
        <div className="stat-item">
          <div className="stat-header">
            <FaChartLine className="stat-icon" />
            <h4>Rushing</h4>
          </div>
          
          <div className="stat-comparison">
            <div className="stat-value home">{homeRushingYards}</div>
            <div className="stat-bar-container">
              <motion.div 
                className="stat-bar home"
                initial={{ width: 0 }}
                animate={{ width: `${rushingPercentage.homePercent}%` }}
                transition={{ duration: 1 }}
                style={{ backgroundColor: homeColor }}
              />
              <motion.div 
                className="stat-bar away"
                initial={{ width: 0 }}
                animate={{ width: `${rushingPercentage.awayPercent}%` }}
                transition={{ duration: 1 }}
                style={{ backgroundColor: awayColor }}
              />
            </div>
            <div className="stat-value away">{awayRushingYards}</div>
          </div>
        </div>
        
        {/* First Downs */}
        <div className="stat-item">
          <div className="stat-header">
            <FaChartBar className="stat-icon" />
            <h4>First Downs</h4>
          </div>
          
          <div className="stat-comparison">
            <div className="stat-value home">{homeFirstDowns}</div>
            <div className="stat-bar-container">
              <motion.div 
                className="stat-bar home"
                initial={{ width: 0 }}
                animate={{ width: `${firstDownsPercentage.homePercent}%` }}
                transition={{ duration: 1 }}
                style={{ backgroundColor: homeColor }}
              />
              <motion.div 
                className="stat-bar away"
                initial={{ width: 0 }}
                animate={{ width: `${firstDownsPercentage.awayPercent}%` }}
                transition={{ duration: 1 }}
                style={{ backgroundColor: awayColor }}
              />
            </div>
            <div className="stat-value away">{awayFirstDowns}</div>
          </div>
        </div>
        
        {/* Turnovers */}
        <div className="stat-item">
          <div className="stat-header">
            <FaExchangeAlt className="stat-icon" />
            <h4>Turnovers</h4>
          </div>
          
          <div className="stat-comparison turnovers">
            <div className="stat-value home">{homeTurnovers}</div>
            <div className="turnover-display">
              {[...Array(Math.max(homeTurnovers, awayTurnovers))].map((_, i) => (
                <div key={i} className="turnover-indicator">
                  {i < homeTurnovers && <div className="turnover-dot home" style={{ backgroundColor: homeColor }}></div>}
                  {i < awayTurnovers && <div className="turnover-dot away" style={{ backgroundColor: awayColor }}></div>}
                </div>
              ))}
            </div>
            <div className="stat-value away">{awayTurnovers}</div>
          </div>
        </div>
        
        {/* Possession Time */}
        <div className="stat-item">
          <div className="stat-header">
            <FaChartLine className="stat-icon" />
            <h4>Possession Time</h4>
          </div>
          
          <div className="stat-comparison">
            <div className="stat-value home">
              {Math.floor(homePossessionTime / 60)}:{(homePossessionTime % 60).toString().padStart(2, '0')}
            </div>
            <div className="stat-bar-container">
              <motion.div 
                className="stat-bar home"
                initial={{ width: 0 }}
                animate={{ width: `${possessionPercentage.homePercent}%` }}
                transition={{ duration: 1 }}
                style={{ backgroundColor: homeColor }}
              />
              <motion.div 
                className="stat-bar away"
                initial={{ width: 0 }}
                animate={{ width: `${possessionPercentage.awayPercent}%` }}
                transition={{ duration: 1 }}
                style={{ backgroundColor: awayColor }}
              />
            </div>
            <div className="stat-value away">
              {Math.floor(awayPossessionTime / 60)}:{(awayPossessionTime % 60).toString().padStart(2, '0')}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewGameStats;