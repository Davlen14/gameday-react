import React from 'react';
import { motion } from 'framer-motion';
import { FaFootballBall, FaChartLine, FaFlag } from 'react-icons/fa';
import { GiWhistle } from 'react-icons/gi';
import "../styles/PlayByPlayTimeline.css"; // Adjust the path as necessary

const PlayByPlayTimeline = ({ 
  plays, 
  currentPlayIndex,
  skipToPlay,
  homeTeam,
  awayTeam,
  homeColor,
  awayColor,
  formatQuarter,
  formatDown
}) => {
  // If no plays data is available
  if (!plays || plays.length === 0) {
    return (
      <div className="play-timeline">
        <div className="timeline-header">
          <h3>Play-by-Play Timeline</h3>
        </div>
        <div className="timeline-content">
          <div className="no-plays-message">
            <p>No play-by-play data available for this game</p>
          </div>
        </div>
      </div>
    );
  }

  // Determine if a play is a scoring play
  const isScoringPlay = (play, index) => {
    if (index === 0) return false;
    const prevPlay = plays[index - 1];
    return (
      play.homeScore > prevPlay.homeScore ||
      play.awayScore > prevPlay.awayScore
    );
  };

  // Determine if a play is a turnover
  const isTurnoverPlay = (play, index) => {
    if (index === 0) return false;
    const prevPlay = plays[index - 1];
    return play.homeBall !== prevPlay.homeBall;
  };

  // Determine if a play is a big play (10+ yards)
  const isBigPlay = (play) => {
    return play.yardsGained >= 10;
  };

  // Get play type class
  const getPlayTypeClass = (play, index) => {
    if (isScoringPlay(play, index)) return 'scoring';
    if (isTurnoverPlay(play, index)) return 'turnover';
    if (isBigPlay(play)) return 'big-play';
    return '';
  };

  // Get play icon based on type
  const getPlayIcon = (play, index) => {
    if (isScoringPlay(play, index)) {
      return <FaFootballBall className="play-icon scoring" />;
    }
    if (isTurnoverPlay(play, index)) {
      return <FaFlag className="play-icon turnover" />;
    }
    if (isBigPlay(play)) {
      return <FaChartLine className="play-icon big-play" />;
    }
    return <GiWhistle className="play-icon" />;
  };

  return (
    <div className="play-timeline">
      <div className="timeline-header">
        <h3>Play-by-Play Timeline</h3>
        <div className="timeline-legend">
          <div className="legend-item">
            <FaFootballBall className="legend-icon scoring" />
            <span>Scoring Play</span>
          </div>
          <div className="legend-item">
            <FaFlag className="legend-icon turnover" />
            <span>Turnover</span>
          </div>
          <div className="legend-item">
            <FaChartLine className="legend-icon big-play" />
            <span>Big Play</span>
          </div>
        </div>
      </div>
      
      <div className="timeline-content">
        <div className="timeline-scrubber">
          <div className="timeline-track">
            <div 
              className="timeline-progress"
              style={{ width: `${(currentPlayIndex / (plays.length - 1)) * 100}%` }}
            />
            {plays.map((play, idx) => (
              <div 
                key={idx}
                className={`timeline-marker ${idx === currentPlayIndex ? 'active' : ''} ${getPlayTypeClass(play, idx)}`}
                style={{ left: `${(idx / (plays.length - 1)) * 100}%` }}
                onClick={() => skipToPlay(idx)}
              />
            ))}
          </div>
          <div className="timeline-labels">
            <span>Start</span>
            <span>End</span>
          </div>
        </div>
        
        <div className="timeline-plays">
          {plays.slice(Math.max(0, currentPlayIndex - 2), currentPlayIndex + 3).map((play, idx) => {
            const actualIdx = Math.max(0, currentPlayIndex - 2) + idx;
            return (
              <div 
                key={actualIdx}
                className={`timeline-play ${actualIdx === currentPlayIndex ? 'current' : ''} ${getPlayTypeClass(play, actualIdx)}`}
                onClick={() => skipToPlay(actualIdx)}
              >
                <div className="play-header">
                  <div className="play-number">Play #{play.playNumber}</div>
                  <div 
                    className="play-possession"
                    style={{ color: play.homeBall ? homeColor : awayColor }}
                  >
                    {play.homeBall ? homeTeam : awayTeam}
                  </div>
                  {getPlayIcon(play, actualIdx)}
                </div>
                <div className="play-text">{play.playText}</div>
                <div className="play-meta">
                  <div>{formatQuarter(play.period)}</div>
                  {play.down && play.distance && (
                    <div>{formatDown(play.down)} & {play.distance}</div>
                  )}
                  <div className="play-field-position">
                    <FaFootballBall className="position-icon" />
                    {play.yardLine ? `${play.yardLine} yard line` : 'N/A'}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="timeline-navigation">
          <button 
            className="nav-button"
            onClick={() => skipToPlay(currentPlayIndex - 1)}
            disabled={currentPlayIndex <= 0}
          >
            Previous Play
          </button>
          <div className="play-counter">
            Play {currentPlayIndex + 1} of {plays.length}
          </div>
          <button 
            className="nav-button"
            onClick={() => skipToPlay(currentPlayIndex + 1)}
            disabled={currentPlayIndex >= plays.length - 1}
          >
            Next Play
          </button>
        </div>
      </div>
    </div>
  );
};

export default PlayByPlayTimeline;