import React from 'react';
import { motion } from 'framer-motion';
import { FaFootballBall, FaChartLine, FaChartBar, FaHistory } from 'react-icons/fa';
import { GiWhistle, GiAmericanFootballHelmet } from 'react-icons/gi';
import '../styles/DriveVisualizer.css'; // Adjust the path as necessary

const DriveVisualizer = ({ 
  plays, 
  currentPlayIndex,
  homeTeam,
  awayTeam,
  homeColor,
  awayColor,
  skipToPlay
}) => {
  // If no plays data is available
  if (!plays || plays.length === 0) {
    return (
      <div className="drive-visualizer-container">
        <div className="drive-header">
          <h3>Drive Visualizer</h3>
        </div>
        <div className="drive-content empty">
          <p>No play data available to visualize drives</p>
        </div>
      </div>
    );
  }

  // Group plays into drives
  const groupPlaysByDrive = () => {
    const drives = [];
    let currentDrive = [];
    let currentPossession = plays[0]?.homeBall;
    
    plays.forEach((play, index) => {
      // If possession changed or it's the first play
      if (play.homeBall !== currentPossession || index === 0) {
        // If not the first play, push the previous drive
        if (index > 0) {
          drives.push(currentDrive);
          currentDrive = [];
        }
        currentPossession = play.homeBall;
      }
      
      currentDrive.push({
        ...play,
        index // Store the original index for navigation
      });
    });
    
    // Add the last drive
    if (currentDrive.length > 0) {
      drives.push(currentDrive);
    }
    
    return drives;
  };

  const drives = groupPlaysByDrive();

  // Find which drive contains the current play
  const currentDriveIndex = drives.findIndex(drive => 
    drive.some(play => play.index === currentPlayIndex)
  );

  // Calculate drive statistics
  const calculateDriveStats = (drive) => {
    if (!drive || drive.length === 0) return null;
    
    const startYard = drive[0].yardLine || 0;
    const endYard = drive[drive.length - 1].yardLine || 0;
    const yardsGained = Math.abs(endYard - startYard);
    const playCount = drive.length;
    const isScoring = drive.length > 1 && (
      (drive[0].homeBall && drive[drive.length - 1].homeScore > drive[0].homeScore) ||
      (!drive[0].homeBall && drive[drive.length - 1].awayScore > drive[0].awayScore)
    );
    
    return {
      yardsGained,
      playCount,
      isScoring,
      team: drive[0].homeBall ? homeTeam : awayTeam,
      teamColor: drive[0].homeBall ? homeColor : awayColor,
      isHomeBall: drive[0].homeBall
    };
  };

  // Get visible drives (current +/- 1)
  const visibleDrivesStart = Math.max(0, currentDriveIndex - 1);
  const visibleDrivesEnd = Math.min(drives.length, currentDriveIndex + 2);
  const visibleDrives = drives.slice(visibleDrivesStart, visibleDrivesEnd);

  return (
    <div className="drive-visualizer-container">
      <div className="drive-header">
        <h3>Drive Visualizer</h3>
        <div className="drive-counter">
          Drive {currentDriveIndex + 1} of {drives.length}
        </div>
      </div>
      
      <div className="drive-content">
        <div className="drives-timeline">
          {drives.map((drive, idx) => {
            const stats = calculateDriveStats(drive);
            if (!stats) return null;
            
            return (
              <div 
                key={idx}
                className={`drive-marker ${idx === currentDriveIndex ? 'active' : ''} ${stats.isHomeBall ? 'home' : 'away'}`}
                style={{ 
                  backgroundColor: stats.teamColor,
                  width: `${Math.max(2, (stats.playCount / plays.length) * 100)}%`
                }}
                onClick={() => skipToPlay(drive[0].index)}
                title={`${stats.team} drive: ${stats.playCount} plays, ${stats.yardsGained} yards`}
              >
                {stats.isScoring && <div className="scoring-indicator">TD</div>}
              </div>
            );
          })}
        </div>
        
        <div className="visible-drives">
          {visibleDrives.map((drive, idx) => {
            const actualIdx = visibleDrivesStart + idx;
            const stats = calculateDriveStats(drive);
            if (!stats) return null;
            
            return (
              <motion.div 
                key={actualIdx}
                className={`drive-card ${actualIdx === currentDriveIndex ? 'current' : ''}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: idx * 0.1 }}
              >
                <div 
                  className="drive-card-header"
                  style={{ backgroundColor: stats.teamColor }}
                >
                  <div className="drive-team">
                    <GiAmericanFootballHelmet className="team-icon" />
                    <span>{stats.team}</span>
                  </div>
                  <div className="drive-number">Drive {actualIdx + 1}</div>
                  {stats.isScoring && (
                    <div className="drive-result">
                      <FaFootballBall className="result-icon" />
                      <span>TOUCHDOWN</span>
                    </div>
                  )}
                </div>
                
                <div className="drive-card-content">
                  <div className="drive-stats">
                    <div className="stat-item">
                      <FaHistory className="stat-icon" />
                      <span>{stats.playCount} plays</span>
                    </div>
                    <div className="stat-item">
                      <FaChartBar className="stat-icon" />
                      <span>{stats.yardsGained} yards</span>
                    </div>
                    <div className="stat-item">
                      <FaChartLine className="stat-icon" />
                      <span>{(stats.yardsGained / stats.playCount).toFixed(1)} yards/play</span>
                    </div>
                  </div>
                  
                  <div className="drive-plays">
                    {drive.map((play, playIdx) => (
                      <div 
                        key={playIdx}
                        className={`drive-play ${play.index === currentPlayIndex ? 'active' : ''}`}
                        onClick={() => skipToPlay(play.index)}
                      >
                        <div className="play-indicator">
                          <GiWhistle className="play-icon" />
                        </div>
                        <div className="play-details">
                          <div className="play-text">{play.playText}</div>
                          <div className="play-meta">
                            {play.down && play.distance && (
                              <span>{play.down}rd & {play.distance}</span>
                            )}
                            {play.yardLine && (
                              <span>
                                <FaFootballBall className="yard-icon" />
                                {play.homeBall ? play.yardLine : 100 - play.yardLine} yard line
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
        
        <div className="drive-navigation">
          <button 
            className="nav-button"
            onClick={() => {
              const prevDrive = drives[Math.max(0, currentDriveIndex - 1)];
              if (prevDrive) skipToPlay(prevDrive[0].index);
            }}
            disabled={currentDriveIndex <= 0}
          >
            Previous Drive
          </button>
          <button 
            className="nav-button"
            onClick={() => {
              const nextDrive = drives[Math.min(drives.length - 1, currentDriveIndex + 1)];
              if (nextDrive) skipToPlay(nextDrive[0].index);
            }}
            disabled={currentDriveIndex >= drives.length - 1}
          >
            Next Drive
          </button>
        </div>
      </div>
    </div>
  );
};

export default DriveVisualizer;