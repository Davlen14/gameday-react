import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  FaSpinner,
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaTv,
  FaFire,
  FaArrowRight,
  FaComments,
  FaPoll,
  FaStar,
  FaClock,
  FaTrophy
} from 'react-icons/fa';
import teamsService from '../services/teamsService';

// CSS styles for FeaturedGames with modern glassy Apple-like UI
const styles = `
/* FeaturedGames Component Styles - Modern Glassy UI */
.fh-games-showcase {
  margin: 1.5rem auto 3.5rem;
  width: var(--fh-content-width, 99%);
  max-width: var(--fh-max-content-width, 1800px);
  position: relative;
}

.fh-section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.8rem;
  padding: 0 1rem;
}

.fh-section-header h2 {
  font-size: 1.8rem;
  font-weight: 700;
  color: var(--fh-primary-color, #D4001C);
  display: flex;
  align-items: center;
  gap: 0.7rem;
}

.fh-section-icon {
  color: var(--fh-primary-color, #D4001C);
}

.fh-carousel-controls {
  display: flex;
  gap: 0.7rem;
}

.fh-carousel-control {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.4);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  color: var(--fh-primary-color, #D4001C);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 1.6rem;
  transition: all 0.25s cubic-bezier(0.25, 1, 0.5, 1);
}

.fh-carousel-control:hover {
  background-color: rgba(255, 255, 255, 0.95);
  color: var(--fh-primary-color, #D4001C);
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);
}

/* Game Cards Carousel */
.fh-games-carousel {
  display: flex;
  gap: 1.8rem;
  width: 100%;
  overflow-x: auto;
  padding: 0.8rem 1rem 1.8rem;
  scroll-behavior: smooth;
  -ms-overflow-style: none;
  scrollbar-width: none;
  align-items: stretch;
}

.fh-games-carousel::-webkit-scrollbar { 
  display: none;
}

/* Game Card - Modern Glassy Design */
.fh-game-card {
  flex: 0 0 auto;
  width: 400px; /* Wider cards */
  min-width: 400px;
  max-width: 400px;
  height: 460px;
  min-height: 460px;
  max-height: 460px;
  background-color: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(15px);
  -webkit-backdrop-filter: blur(15px);
  border-radius: 18px;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.6);
  transition: all 0.3s cubic-bezier(0.25, 1, 0.5, 1);
  display: flex;
  flex-direction: column;
  position: relative;
  margin: 0;
}

.fh-game-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border-radius: 18px;
  padding: 1px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.4), rgba(255, 255, 255, 0.1));
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  pointer-events: none;
}

.fh-game-card:hover {
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.15);
  transform: translateY(-7px);
}

/* Game of the Week styling - Premium look */
.fh-game-card-highlighted {
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 12px 30px rgba(212, 0, 28, 0.25);
  border: 1px solid rgba(212, 0, 28, 0.3);
}

.fh-game-card-highlighted::before {
  background: linear-gradient(180deg, rgba(212, 0, 28, 0.2), rgba(255, 255, 255, 0.1));
}

.fh-game-card-highlighted::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border-radius: 18px;
  background: linear-gradient(120deg, rgba(212, 0, 28, 0) 0%, rgba(212, 0, 28, 0.03) 40%, rgba(212, 0, 28, 0) 60%);
  background-size: 200% 200%;
  animation: shine 3s infinite;
  pointer-events: none;
}

@keyframes shine {
  0% {background-position: -100% 100%}
  50% {background-position: 100% 100%}
  100% {background-position: 100% -100%}
}

/* Game Card Header */
.fh-game-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.2rem;
  background-color: rgba(242, 242, 242, 0.6);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border-bottom: 1px solid rgba(0, 0, 0, 0.04);
  flex-wrap: wrap;
  gap: 0.5rem;
  height: 56px;
  min-height: 56px;
  position: relative;
}

.fh-game-week {
  font-weight: 600;
  color: var(--fh-text-secondary, #666666);
  font-size: 0.95rem;
  letter-spacing: 0.01em;
}

.fh-game-featured {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 700;
  color: white;
  font-size: 0.9rem;
  background: linear-gradient(135deg, #D4001C, #E8304A);
  padding: 0.35rem 0.8rem;
  border-radius: 20px;
  white-space: nowrap;
  box-shadow: 0 2px 8px rgba(212, 0, 28, 0.25);
}

/* Live countdown timer */
.fh-countdown {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-left: auto;
  background: linear-gradient(135deg, #D4001C, #E8304A);
  color: white;
  padding: 0.35rem 0.8rem;
  border-radius: 20px;
  box-shadow: 0 2px 8px rgba(212, 0, 28, 0.25);
}

.fh-countdown-icon {
  font-size: 0.9rem;
}

.fh-countdown-time {
  font-weight: 700;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 0.2rem;
  letter-spacing: 0.01em;
}

.fh-countdown-unit {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0 0.15rem;
}

.fh-countdown-value {
  font-weight: 700;
}

.fh-countdown-label {
  font-size: 0.6rem;
  opacity: 0.9;
  text-transform: uppercase;
}

.fh-countdown-separator {
  font-weight: 700;
  padding-bottom: 0.8rem;
}

/* Teams matchup container */
.fh-teams-matchup {
  display: flex;
  align-items: center;
  padding: 1.2rem;
  gap: 0.8rem;
  flex: 1;
  flex-grow: 1;
  height: 290px;
  min-height: 290px;
  position: relative;
}

/* Team styling */
.fh-team {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  flex: 1;
  text-align: center;
  max-width: 135px;
  height: 100%;
}

.fh-home-team, 
.fh-away-team {
  position: relative;
}

/* Team logo styling - modern and premium */
.fh-team img {
  width: 100px;
  height: 100px;
  object-fit: contain;
  margin-bottom: 1rem;
  transition: all 0.4s cubic-bezier(0.25, 1, 0.5, 1);
  border-radius: 50%;
  background: radial-gradient(circle at 30% 30%, rgba(255,255,255,1) 0%, rgba(245,245,245,1) 100%);
  padding: 0.6rem;
  border: 1px solid rgba(0, 0, 0, 0.04);
  box-shadow: 
    0 10px 20px rgba(0, 0, 0, 0.08),
    0 0 0 1px rgba(255, 255, 255, 0.8) inset;
  position: relative;
}

.fh-team img::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0) 50%);
  z-index: 1;
}

.fh-team img:hover {
  transform: scale(1.06) translateY(-5px);
  box-shadow: 
    0 15px 25px rgba(0, 0, 0, 0.12),
    0 0 0 1px rgba(255, 255, 255, 0.9) inset;
}

.fh-game-card-highlighted .fh-team img {
  box-shadow: 
    0 12px 22px rgba(212, 0, 28, 0.15),
    0 0 0 1px rgba(255, 255, 255, 0.8) inset;
}

/* Team text elements */
.fh-team h3 {
  font-size: 1.05rem;
  font-weight: 700;
  margin: 0 0 0.4rem;
  color: var(--fh-text-color, #222222);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 120px;
  letter-spacing: -0.01em;
}

.fh-team-rank {
  font-size: 0.85rem;
  font-weight: 700;
  color: white;
  background: linear-gradient(135deg, #D4001C, #E8304A);
  padding: 0.25rem 0.7rem;
  border-radius: 12px;
  margin-bottom: 0.4rem;
  box-shadow: 0 2px 6px rgba(212, 0, 28, 0.2);
}

.fh-team-stats {
  font-size: 0.9rem;
  color: var(--fh-text-secondary, #666666);
  white-space: nowrap;
  font-weight: 500;
}

/* VS container styling - modern glassy look */
.fh-vs-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 120px;
  flex: 0.8;
  height: 100%;
  justify-content: flex-start;
}

.fh-vs-badge {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  color: var(--fh-primary-color, #D4001C);
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 1.1rem;
  margin-bottom: 1rem;
  margin-top: 1.5rem;
  box-shadow: 
    0 4px 15px rgba(0, 0, 0, 0.07),
    0 0 0 1px rgba(255, 255, 255, 0.6) inset;
  position: relative;
  z-index: 1;
}

.fh-vs-badge::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0) 50%);
  z-index: -1;
}

.fh-game-card-highlighted .fh-vs-badge {
  background: rgba(255, 255, 255, 0.95);
  color: var(--fh-primary-color, #D4001C);
  box-shadow: 
    0 6px 18px rgba(212, 0, 28, 0.15),
    0 0 0 1px rgba(255, 255, 255, 0.7) inset;
}

.fh-game-of-week-badge {
  position: absolute;
  top: -8px;
  left: 50%;
  transform: translateX(-50%);
  background: linear-gradient(135deg, #D4001C, #E8304A);
  color: white;
  font-size: 0.7rem;
  font-weight: 700;
  padding: 0.25rem 0.7rem;
  border-radius: 12px;
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: 0.3rem;
  box-shadow: 0 4px 10px rgba(212, 0, 28, 0.25);
  z-index: 2;
}

/* Game details in VS container */
.fh-game-details {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  width: 100%;
  margin-bottom: 1rem;
}

.fh-detail-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
  color: var(--fh-text-secondary, #666666);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

.fh-detail-item span {
  overflow: hidden;
  text-overflow: ellipsis;
  font-weight: 500;
}

.fh-detail-icon {
  color: var(--fh-primary-color, #D4001C);
  font-size: 0.9rem;
  flex-shrink: 0;
}

/* Prediction meter - Modern glassy style */
.fh-prediction-meter {
  width: 100%;
  margin-top: 0.8rem;
}

.fh-prediction-bar {
  height: 8px;
  width: 100%;
  border-radius: 4px;
  overflow: hidden;
  display: flex;
  background-color: rgba(240, 240, 240, 0.6);
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.05);
}

.fh-prediction-fill {
  height: 100%;
  transition: width 0.8s cubic-bezier(0.25, 1, 0.5, 1);
}

.fh-prediction-fill.home {
  background: linear-gradient(90deg, #D4001C, #E8304A);
}

.fh-prediction-fill.away {
  background: linear-gradient(90deg, #333333, #555555);
}

.fh-prediction-labels {
  display: flex;
  justify-content: space-between;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--fh-text-secondary, #666666);
  margin-top: 0.4rem;
}

/* Game actions footer */
.fh-game-actions {
  display: flex;
  justify-content: space-between;
  padding: 1rem 1.2rem;
  background-color: rgba(242, 242, 242, 0.6);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border-top: 1px solid rgba(0, 0, 0, 0.04);
  gap: 0.7rem;
  margin-top: auto;
  height: 64px;
  min-height: 64px;
}

/* Action buttons - Modern glassy buttons */
.fh-game-details-btn, 
.fh-join-discussion-btn, 
.fh-predict-btn {
  padding: 0.6rem 0.9rem;
  border-radius: 24px;
  font-weight: 600;
  font-size: 0.85rem;
  transition: all 0.25s cubic-bezier(0.25, 1, 0.5, 1);
  display: flex;
  align-items: center;
  gap: 0.5rem;
  white-space: nowrap;
  letter-spacing: 0.01em;
}

.fh-predict-btn {
  color: white;
  background: linear-gradient(135deg, #D4001C, #E8304A);
  border: none;
  cursor: pointer;
  box-shadow: 0 4px 10px rgba(212, 0, 28, 0.2);
}

.fh-predict-btn:hover {
  box-shadow: 0 6px 15px rgba(212, 0, 28, 0.3);
  transform: translateY(-2px);
}

.fh-game-details-btn {
  color: var(--fh-primary-color, #D4001C);
  background-color: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  text-decoration: none;
  border: 1px solid rgba(212, 0, 28, 0.3);
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.06);
}

.fh-game-details-btn:hover {
  color: white;
  transform: translateX(3px);
  background: linear-gradient(135deg, #D4001C, #E8304A);
  border-color: #D4001C;
  box-shadow: 0 4px 12px rgba(212, 0, 28, 0.25);
}

.fh-join-discussion-btn {
  color: white;
  background: linear-gradient(135deg, #D4001C, #E8304A);
  border: none;
  cursor: pointer;
  box-shadow: 0 4px 10px rgba(212, 0, 28, 0.2);
}

.fh-join-discussion-btn:hover {
  box-shadow: 0 6px 15px rgba(212, 0, 28, 0.3);
  transform: translateY(-2px);
}

/* Loading Container */
.fh-loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 70vh;
  text-align: center;
  padding: 2rem;
}

.fh-loading-icon {
  font-size: 3rem;
  color: var(--fh-primary-color, #D4001C);
  animation: fh-spin 1.5s linear infinite;
  margin-bottom: 1.5rem;
}

@keyframes fh-spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.fh-loading-container p {
  font-size: 1.2rem;
  color: var(--fh-text-secondary, #666666);
  max-width: 600px;
}

/* Error Container */
.fh-error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 60vh;
  text-align: center;
  padding: 2rem;
}

.fh-error-container h2 {
  color: var(--fh-primary-color, #D4001C);
  margin-bottom: 1rem;
}

.fh-error-container p {
  color: var(--fh-text-secondary, #666666);
  margin-bottom: 2rem;
  max-width: 600px;
}

/* Responsive Design */
@media (max-width: 1200px) {
  .fh-games-carousel {
    overflow-x: scroll;
  }
  
  .fh-game-actions {
    flex-wrap: wrap;
    gap: 0.5rem;
  }
  
  .fh-predict-btn, 
  .fh-game-details-btn, 
  .fh-join-discussion-btn {
    font-size: 0.8rem;
    padding: 0.5rem 0.8rem;
  }
}

@media (max-width: 768px) {
  .fh-section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
  
  .fh-game-card {
    width: 380px;
    min-width: 380px;
    max-width: 380px;
    height: 460px;
    min-height: 460px;
    max-height: 460px;
  }
  
  .fh-team img {
    width: 90px;
    height: 90px;
  }
  
  .fh-vs-container {
    min-width: 110px;
  }
}

@media (max-width: 480px) {
  .fh-section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
  
  .fh-game-card {
    width: 320px;
    min-width: 320px;
    max-width: 320px;
    height: 460px;
    min-height: 460px;
    max-height: 460px;
  }
  
  .fh-teams-matchup {
    padding: 0.9rem;
  }
  
  .fh-game-details {
    width: 100%;
  }
  
  .fh-vs-container {
    min-width: 90px;
  }
  
  .fh-game-actions {
    padding: 0.7rem 0.9rem;
  }
  
  .fh-predict-btn, 
  .fh-game-details-btn, 
  .fh-join-discussion-btn {
    font-size: 0.75rem;
    padding: 0.5rem 0.7rem;
  }
}
`;

// Live countdown timer component
const CountdownTimer = ({ targetDate }) => {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const gameTime = new Date(targetDate);
      const difference = gameTime - now;
      
      if (difference <= 0) {
        return { days: 0, hours: 0, minutes: 0, seconds: 0 };
      }
      
      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60)
      };
    };

    // Initial calculation
    setTimeLeft(calculateTimeLeft());

    // Update every second
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    // Cleanup interval on unmount
    return () => clearInterval(timer);
  }, [targetDate]);

  // Show numbers with leading zeros
  const formatNumber = num => String(num).padStart(2, '0');
  
  // If the game is in the past, show "Final"
  if (new Date(targetDate) < new Date()) {
    return (
      <div className="fh-countdown">
        <FaClock className="fh-countdown-icon" />
        <span className="fh-countdown-time">Final</span>
      </div>
    );
  }
  
  return (
    <div className="fh-countdown">
      <FaClock className="fh-countdown-icon" />
      <div className="fh-countdown-time">
        {timeLeft.days > 0 && (
          <div className="fh-countdown-unit">
            <span className="fh-countdown-value">{formatNumber(timeLeft.days)}</span>
            <span className="fh-countdown-label">d</span>
          </div>
        )}
        {timeLeft.days > 0 && <span className="fh-countdown-separator">:</span>}
        <div className="fh-countdown-unit">
          <span className="fh-countdown-value">{formatNumber(timeLeft.hours)}</span>
          <span className="fh-countdown-label">h</span>
        </div>
        <span className="fh-countdown-separator">:</span>
        <div className="fh-countdown-unit">
          <span className="fh-countdown-value">{formatNumber(timeLeft.minutes)}</span>
          <span className="fh-countdown-label">m</span>
        </div>
        <span className="fh-countdown-separator">:</span>
        <div className="fh-countdown-unit">
          <span className="fh-countdown-value">{formatNumber(timeLeft.seconds)}</span>
          <span className="fh-countdown-label">s</span>
        </div>
      </div>
    </div>
  );
};

// Loading spinner component - Enhanced with animation
const LoadingSpinner = () => (
  <div className="fh-loading-container">
    <FaSpinner className="fh-loading-icon" />
    <p>Loading the latest college football updates...</p>
  </div>
);

// Game Card Component - Modernized with glass effect and live countdown
const GameCard = ({ game, isHighlighted, onPredictionClick }) => {
  // Format date more concisely for better display
  const formatGameDate = (dateString) => {
    if (!dateString) return "TBD";
    
    const gameDate = new Date(dateString);
    if (isNaN(gameDate.getTime())) return "TBD";
    
    // More compact format for better alignment
    return gameDate.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Format time separately for better layout
  const formatGameTime = (dateString) => {
    if (!dateString) return "";
    
    const gameDate = new Date(dateString);
    if (isNaN(gameDate.getTime())) return "";
    
    return gameDate.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Truncate text helper function
  const truncateText = (text, maxLength) => {
    if (!text) return "";
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  return (
    <motion.div 
      className={`fh-game-card ${isHighlighted ? 'fh-game-card-highlighted' : ''}`}
      whileHover={{ y: -7 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.4, 
        ease: [0.25, 1, 0.5, 1],
        delay: isHighlighted ? 0 : 0.1 
      }}
    >
      <div className="fh-game-card-header">
        <span className="fh-game-week">Week {game.week}</span>
        {isHighlighted && <span className="fh-game-featured"><FaFire /> Featured</span>}
        <CountdownTimer targetDate={game.startDate} />
      </div>
      
      <div className="fh-teams-matchup">
        {isHighlighted && (
          <div className="fh-game-of-week-badge">
            <FaTrophy /> Game of the Week
          </div>
        )}
        
        <div className="fh-team fh-home-team">
          <motion.img 
            whileHover={{ scale: 1.06, y: -5 }}
            transition={{ duration: 0.3 }}
            src={game.homeTeamData?.logos?.[0] || `/photos/teams/${game.homeTeam.toLowerCase().replace(/\s+/g, '')}.png`} 
            alt={game.homeTeam} 
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = "/photos/default_team.png";
            }}
          />
          <h3 title={game.homeTeam}>{truncateText(game.homeTeam, 15)}</h3>
          {game.homeRank && <span className="fh-team-rank">#{game.homeRank}</span>}
          <div className="fh-team-stats">
            {game.homeRecord ? game.homeRecord : "0-0"}
          </div>
        </div>
        
        <div className="fh-vs-container">
          <div className="fh-vs-badge">VS</div>
          <div className="fh-game-details">
            <div className="fh-detail-item">
              <FaCalendarAlt className="fh-detail-icon" />
              <span title={`${formatGameDate(game.startDate)} ${formatGameTime(game.startDate)}`}>
                {formatGameDate(game.startDate)}
              </span>
            </div>
            <div className="fh-detail-item">
              <FaMapMarkerAlt className="fh-detail-icon" />
              <span title={game.venue}>{truncateText(game.venue, 20)}</span>
            </div>
            {game.media?.network && (
              <div className="fh-detail-item">
                <FaTv className="fh-detail-icon" />
                <span title={game.media.network}>{truncateText(game.media.network, 12)}</span>
              </div>
            )}
          </div>
          
          {/* Game prediction meter - Enhanced modern style */}
          <div className="fh-prediction-meter">
            <div className="fh-prediction-bar">
              <motion.div 
                className="fh-prediction-fill home"
                initial={{ width: 0 }}
                animate={{ width: `${game.homePredictionPercent || 50}%` }}
                transition={{ duration: 1, delay: 0.3 }}
              ></motion.div>
              <motion.div 
                className="fh-prediction-fill away"
                initial={{ width: 0 }}
                animate={{ width: `${100 - (game.homePredictionPercent || 50)}%` }}
                transition={{ duration: 1, delay: 0.3 }}
              ></motion.div>
            </div>
            <div className="fh-prediction-labels">
              <span>{game.homePredictionPercent || 50}%</span>
              <span>{100 - (game.homePredictionPercent || 50)}%</span>
            </div>
          </div>
        </div>
        
        <div className="fh-team fh-away-team">
          <motion.img 
            whileHover={{ scale: 1.06, y: -5 }}
            transition={{ duration: 0.3 }}
            src={game.awayTeamData?.logos?.[0] || `/photos/teams/${game.awayTeam.toLowerCase().replace(/\s+/g, '')}.png`} 
            alt={game.awayTeam}
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = "/photos/default_team.png";
            }}
          />
          <h3 title={game.awayTeam}>{truncateText(game.awayTeam, 15)}</h3>
          {game.awayRank && <span className="fh-team-rank">#{game.awayRank}</span>}
          <div className="fh-team-stats">
            {game.awayRecord ? game.awayRecord : "0-0"}
          </div>
        </div>
      </div>
      
      <div className="fh-game-actions">
        <motion.button 
          className="fh-predict-btn"
          onClick={() => onPredictionClick(game.id)}
          whileHover={{ y: -2, boxShadow: '0 6px 15px rgba(212, 0, 28, 0.3)' }}
          transition={{ duration: 0.2 }}
        >
          <FaPoll /> Predict
        </motion.button>
        
        <motion.div whileHover={{ x: 3, scale: 1.01 }} transition={{ duration: 0.2 }}>
          <Link to={`/game/${game.id}`} className="fh-game-details-btn">
            Details <FaArrowRight />
          </Link>
        </motion.div>
        
        <motion.button 
          className="fh-join-discussion-btn"
          whileHover={{ y: -2, boxShadow: '0 6px 15px rgba(212, 0, 28, 0.3)' }}
          transition={{ duration: 0.2 }}
        >
          <FaComments /> Discuss
        </motion.button>
      </div>
    </motion.div>
  );
};

// FeaturedGames component with enhanced animations and modern styling
const FeaturedGames = ({ year = 2025, week = 1 }) => {
  // State management
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [featuredGames, setFeaturedGames] = useState([]);
  
  // Reference for horizontal scrolling
  const gamesContainerRef = useRef(null);

  // Fetch data on component mount
  useEffect(() => {
    const fetchFeaturedGames = async () => {
      try {
        setIsLoading(true);
        
        // Fetch games for specified week and year
        const gamesData = await teamsService.getGames(week, year);
        
        // Define featured matchups we want to highlight
        const targetMatchups = [
          { home: "Florida State", away: "Alabama" },
          { home: "Clemson", away: "LSU" },
          { home: "Ohio State", away: "Texas" },
          { home: "Miami", away: "Notre Dame" }
        ];
        
        let featuredGamesList = [];
        
        // Check if games data exists and process accordingly
        if (gamesData && gamesData.length > 0) {
          // Try to find the actual games from the API
          featuredGamesList = targetMatchups.map(matchup => {
            const foundGame = gamesData.find(
              game => 
                (game.homeTeam === matchup.home && game.awayTeam === matchup.away) || 
                (game.homeTeam === matchup.away && game.awayTeam === matchup.home)
            );
            
            // If found, return the real game data
            if (foundGame) return foundGame;
            
            // Otherwise create a placeholder
            return {
              id: `${year}_${matchup.home.toLowerCase().replace(/\s+/g, '')}_${matchup.away.toLowerCase().replace(/\s+/g, '')}`,
              homeTeam: matchup.home,
              awayTeam: matchup.away,
              startDate: `${year}-08-30T19:30:00.000Z`, // Placeholder date
              venue: `${matchup.home} Stadium`,
              homePoints: null,
              awayPoints: null,
              season: year,
              week: week
            };
          });
          
          // Fetch team data for logos and rankings
          const teamsData = await teamsService.getTeams(year);
          
          // Enhance game objects with team data and media
          const enhancedGames = await Promise.all(featuredGamesList.map(async game => {
            // Get team data
            const homeTeam = teamsData.find(t => t.school === game.homeTeam);
            const awayTeam = teamsData.find(t => t.school === game.awayTeam);
            
            // Get media data
            const mediaData = await teamsService.getGameMedia(year, week);
            const gameMedia = mediaData.find(m => m.id === game.id);
            
            // Get AP Poll rankings if available
            const pollsData = await teamsService.getPolls(year, "ap", week);
            let homeRank = null;
            let awayRank = null;
            
            if (pollsData && pollsData.length > 0 && pollsData[0].rankings) {
              const homeTeamRanking = pollsData[0].rankings.find(r => r.school === game.homeTeam);
              const awayTeamRanking = pollsData[0].rankings.find(r => r.school === game.awayTeam);
              
              if (homeTeamRanking) homeRank = homeTeamRanking.rank;
              if (awayTeamRanking) awayRank = awayTeamRanking.rank;
            } else {
              // Placeholder rankings for the highlighted games
              if (game.homeTeam === "Ohio State") homeRank = 2;
              if (game.homeTeam === "Florida State") homeRank = 5;
              if (game.homeTeam === "Clemson") homeRank = 8;
              if (game.homeTeam === "Miami") homeRank = 12;
              
              if (game.awayTeam === "Texas") awayRank = 1;
              if (game.awayTeam === "Alabama") awayRank = 3;
              if (game.awayTeam === "LSU") awayRank = 7;
              if (game.awayTeam === "Notre Dame") awayRank = 9;
            }
            
            // Add placeholder records
            const homeRecord = "10-2";
            const awayRecord = "11-1";
            
            // Add placeholder prediction percentages
            const homePredictionPercent = Math.floor(Math.random() * 40) + 30; // Between 30-70%
            
            // Mark Texas vs Ohio State as the main Game of the Week
            const isGameOfWeek = (game.homeTeam === "Ohio State" && game.awayTeam === "Texas") || 
                               (game.homeTeam === "Texas" && game.awayTeam === "Ohio State");
            
            return {
              ...game,
              media: gameMedia || { network: "TBD" },
              homeTeamData: homeTeam || {},
              awayTeamData: awayTeam || {},
              homeRank,
              awayRank,
              homeRecord,
              awayRecord,
              homePredictionPercent,
              isGameOfWeek
            };
          }));
          
          // Sort the games to ensure consistent order
          const sortedGames = [...enhancedGames].sort((a, b) => {
            // Game of the Week first
            if (a.isGameOfWeek && !b.isGameOfWeek) return -1;
            if (!a.isGameOfWeek && b.isGameOfWeek) return 1;
            
            // Then by rankings (higher rank first)
            const aHighestRank = Math.min(a.homeRank || 999, a.awayRank || 999);
            const bHighestRank = Math.min(b.homeRank || 999, b.awayRank || 999);
            return aHighestRank - bHighestRank;
          });
          
          setFeaturedGames(sortedGames);
        }
        
      } catch (err) {
        console.error("Error fetching featured games:", err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchFeaturedGames();
  }, [year, week]);

  // Handle prediction click
  const handlePredictionClick = (gameId) => {
    console.log(`Make prediction for game ${gameId}`);
    // Here you would open a prediction modal or navigate to prediction page
  };
  
  // Scroll games left/right with improved scrolling amount
  const scrollGames = (direction) => {
    if (gamesContainerRef.current) {
      // Calculate scroll amount based on card width
      const cardWidth = 400; // Match the CSS width of wider cards
      const gap = 28; // 1.8rem gap
      const scrollAmount = direction === 'left' ? -(cardWidth + gap) : (cardWidth + gap);
      
      gamesContainerRef.current.scrollBy({
        top: 0,
        left: scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  // Inject CSS styles
  useEffect(() => {
    const styleElement = document.createElement('style');
    styleElement.type = 'text/css';
    styleElement.innerHTML = styles;
    document.head.appendChild(styleElement);
    
    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);
  
  if (isLoading) {
    return <LoadingSpinner />;
  }
  
  if (error) {
    return (
      <div className="fh-error-container">
        <h2>Error loading featured games</h2>
        <p>{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="fh-predict-btn"
          style={{ padding: '0.7rem 1.5rem', margin: '0 auto' }}
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <section className="fh-games-showcase">
      <motion.div 
        className="fh-section-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h2><FaStar className="fh-section-icon" /> Featured Games of the Week</h2>
        <div className="fh-carousel-controls">
          <motion.button 
            className="fh-carousel-control left"
            onClick={() => scrollGames('left')}
            whileHover={{ y: -2, boxShadow: '0 6px 16px rgba(0, 0, 0, 0.12)' }}
            whileTap={{ scale: 0.95 }}
            aria-label="Scroll left"
          >
            &lsaquo;
          </motion.button>
          <motion.button 
            className="fh-carousel-control right"
            onClick={() => scrollGames('right')}
            whileHover={{ y: -2, boxShadow: '0 6px 16px rgba(0, 0, 0, 0.12)' }}
            whileTap={{ scale: 0.95 }}
            aria-label="Scroll right"
          >
            &rsaquo;
          </motion.button>
        </div>
      </motion.div>
      
      <div className="fh-games-carousel" ref={gamesContainerRef}>
        <AnimatePresence>
          {featuredGames.map((game, index) => (
            <GameCard 
              key={game.id || index} 
              game={game} 
              isHighlighted={game.isGameOfWeek}
              onPredictionClick={handlePredictionClick}
            />
          ))}
        </AnimatePresence>
      </div>
    </section>
  );
};

export default FeaturedGames;