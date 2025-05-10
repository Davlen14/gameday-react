import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
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
  FaClock
} from 'react-icons/fa';
import teamsService from '../services/teamsService';

// CSS styles for FeaturedGames
const styles = `
/* FeaturedGames Component Styles */
.fh-games-showcase {
  margin: 1rem auto 3rem;
  width: var(--fh-content-width, 99%);
  max-width: var(--fh-max-content-width, 1800px);
  position: relative;
}

.fh-section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding: 0 1rem;
}

.fh-section-header h2 {
  font-size: 1.6rem;
  font-weight: 700;
  color: var(--fh-primary-color, #D4001C);
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.fh-section-icon {
  color: var(--fh-primary-color, #D4001C);
}

.fh-carousel-controls {
  display: flex;
  gap: 0.5rem;
}

.fh-carousel-control {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: var(--fh-card-background, #FFFFFF);
  border: var(--fh-card-border, 1px solid rgba(0, 0, 0, 0.05));
  box-shadow: var(--fh-box-shadow-sm, 0 2px 8px rgba(0, 0, 0, 0.06));
  color: var(--fh-primary-color, #D4001C);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 1.5rem;
  transition: var(--fh-transition, all 0.3s ease);
}

.fh-carousel-control:hover {
  background-color: var(--fh-primary-light, rgba(212, 0, 28, 0.1));
  color: var(--fh-primary-color, #D4001C);
  transform: translateY(-2px);
}

/* Game Cards Carousel */
.fh-games-carousel {
  display: flex;
  gap: 1.8rem;
  width: 100%;
  overflow-x: auto;
  padding: 0.5rem 1rem 1.5rem;
  scroll-behavior: smooth;
  -ms-overflow-style: none;
  scrollbar-width: none;
  align-items: stretch;
}

.fh-games-carousel::-webkit-scrollbar { 
  display: none;
}

/* Game Card */
.fh-game-card {
  flex: 0 0 auto;
  width: 360px;
  min-width: 360px;
  max-width: 360px;
  height: 480px;
  min-height: 480px;
  max-height: 480px;
  background-color: var(--fh-card-background, #FFFFFF);
  border-radius: var(--fh-border-radius, 12px);
  box-shadow: var(--fh-box-shadow, 0 4px 12px rgba(0, 0, 0, 0.08));
  overflow: hidden;
  border: var(--fh-card-border, 1px solid rgba(0, 0, 0, 0.05));
  transition: var(--fh-transition, all 0.3s ease);
  display: flex;
  flex-direction: column;
  position: relative;
  margin: 0;
}

.fh-game-card:hover {
  box-shadow: var(--fh-box-shadow-lg, 0 8px 24px rgba(0, 0, 0, 0.12));
  transform: translateY(-5px);
}

.fh-game-card-highlighted {
  box-shadow: 0 6px 18px rgba(212, 0, 28, 0.2);
  border: 2px solid var(--fh-primary-color, #D4001C);
}

/* Game Card Header */
.fh-game-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 0.75rem 1rem;
  background-color: var(--fh-light-gray, #F2F2F2);
  border-bottom: var(--fh-card-border, 1px solid rgba(0, 0, 0, 0.05));
  flex-wrap: wrap;
  gap: 0.5rem;
  height: 80px;
  min-height: 80px;
  position: relative;
}

.fh-game-week {
  font-weight: 600;
  color: var(--fh-text-secondary, #666666);
  font-size: 0.9rem;
}

.fh-game-featured {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-weight: 600;
  color: white;
  font-size: 0.85rem;
  background-color: var(--fh-primary-color, #D4001C);
  padding: 0.25rem 0.6rem;
  border-radius: 20px;
  white-space: nowrap;
}

.fh-days-until {
  font-size: 0.85rem;
  font-weight: 600;
  color: white;
  background-color: var(--fh-primary-color, #D4001C);
  padding: 0.25rem 0.6rem;
  border-radius: 20px;
  margin-left: auto;
  white-space: nowrap;
}

/* Countdown Timer Styles */
.fh-countdown-container {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 0.25rem;
}

.fh-countdown-title {
  font-size: 0.7rem;
  color: var(--fh-text-secondary, #666666);
  margin-bottom: 0.2rem;
  display: flex;
  align-items: center;
  gap: 0.3rem;
}

.fh-countdown-timer {
  display: flex;
  gap: 0.25rem;
  justify-content: center;
}

.fh-time-unit {
  display: flex;
  flex-direction: column;
  align-items: center;
  background-color: var(--fh-primary-color, #D4001C);
  color: white;
  border-radius: 4px;
  padding: 0.2rem 0.35rem;
  min-width: 2.2rem;
}

.fh-time-value {
  font-size: 0.9rem;
  font-weight: 700;
  line-height: 1;
}

.fh-time-label {
  font-size: 0.65rem;
  opacity: 0.8;
  text-transform: lowercase;
}

.fh-countdown-final {
  background-color: var(--fh-primary-color, #D4001C);
  color: white;
  font-weight: 600;
  font-size: 0.8rem;
  padding: 0.25rem 0.6rem;
  border-radius: 4px;
}

/* Teams matchup container */
.fh-teams-matchup {
  display: flex;
  align-items: center;
  padding: 1rem;
  gap: 0.5rem;
  flex: 1;
  flex-grow: 1;
  height: 280px;
  min-height: 280px;
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
  max-width: 120px;
  height: 100%;
}

.fh-home-team, 
.fh-away-team {
  position: relative;
}

/* Team logo styling */
.fh-team img {
  width: 85px;
  height: 85px;
  object-fit: contain;
  margin-bottom: 0.75rem;
  transition: transform 0.3s ease;
  border-radius: 50%;
  background: radial-gradient(circle at 30% 30%, rgba(255,255,255,1) 0%, rgba(240,240,240,1) 100%);
  padding: 0.5rem;
  border: 1px solid #eee;
  box-shadow: 0 4px 10px rgba(0,0,0,0.1);
  position: relative;
}

.fh-team img:hover {
  transform: scale(1.05);
}

/* Team text elements */
.fh-team h3 {
  font-size: 1rem;
  font-weight: 700;
  margin: 0 0 0.3rem;
  color: var(--fh-text-color, #333333);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 110px;
}

.fh-team-rank {
  font-size: 0.85rem;
  font-weight: 700;
  color: white;
  background-color: var(--fh-primary-color, #D4001C);
  padding: 0.2rem 0.6rem;
  border-radius: 12px;
  margin-bottom: 0.3rem;
}

.fh-team-stats {
  font-size: 0.85rem;
  color: var(--fh-text-secondary, #666666);
  white-space: nowrap;
}

/* VS container styling */
.fh-vs-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 100px;
  flex: 0.8;
  height: 100%;
  justify-content: flex-start;
}

.fh-vs-badge {
  background: linear-gradient(145deg, #e6e6e6, #f5f5f5);
  color: var(--fh-primary-color, #D4001C);
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 1rem;
  margin-bottom: 0.75rem;
  margin-top: 1.5rem;
  box-shadow: inset 0 2px 5px rgba(255,255,255,0.5), 0 2px 5px rgba(0,0,0,0.1);
}

/* Game details in VS container */
.fh-game-details {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  width: 100%;
  margin-bottom: 0.75rem;
}

.fh-detail-item {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.8rem;
  color: var(--fh-text-secondary, #666666);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

.fh-detail-item span {
  overflow: hidden;
  text-overflow: ellipsis;
}

.fh-detail-icon {
  color: var(--fh-primary-color, #D4001C);
  font-size: 0.85rem;
  flex-shrink: 0;
}

/* Prediction meter */
.fh-prediction-meter {
  width: 100%;
  margin-top: 0.5rem;
}

.fh-prediction-bar {
  height: 6px;
  width: 100%;
  border-radius: 3px;
  overflow: hidden;
  display: flex;
  background-color: #f0f0f0;
}

.fh-prediction-fill {
  height: 100%;
}

.fh-prediction-fill.home {
  background-color: var(--fh-primary-color, #D4001C);
}

.fh-prediction-fill.away {
  background-color: var(--fh-secondary-color, #333333);
}

.fh-prediction-labels {
  display: flex;
  justify-content: space-between;
  font-size: 0.7rem;
  color: var(--fh-text-secondary, #666666);
  margin-top: 0.25rem;
}

/* Game actions footer */
.fh-game-actions {
  display: flex;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  background-color: var(--fh-light-gray, #F2F2F2);
  border-top: var(--fh-card-border, 1px solid rgba(0, 0, 0, 0.05));
  gap: 0.5rem;
  margin-top: auto;
  height: 60px;
  min-height: 60px;
}

/* Action buttons */
.fh-game-details-btn, 
.fh-join-discussion-btn, 
.fh-predict-btn {
  padding: 0.5rem 0.75rem;
  border-radius: 20px;
  font-weight: 600;
  font-size: 0.8rem;
  transition: var(--fh-transition, all 0.3s ease);
  display: flex;
  align-items: center;
  gap: 0.4rem;
  white-space: nowrap;
}

.fh-predict-btn {
  color: white;
  background-color: var(--fh-primary-color, #D4001C);
  border: none;
  cursor: pointer;
}

.fh-predict-btn:hover {
  background-color: var(--fh-primary-dark, #B5001A);
  transform: translateY(-2px);
}

.fh-game-details-btn {
  color: var(--fh-primary-color, #D4001C);
  background-color: white;
  text-decoration: none;
  border: 1px solid var(--fh-primary-color, #D4001C);
}

.fh-game-details-btn:hover {
  color: white;
  transform: translateX(2px);
  background-color: var(--fh-primary-color, #D4001C);
}

.fh-join-discussion-btn {
  color: white;
  background-color: var(--fh-primary-color, #D4001C);
  border: none;
  cursor: pointer;
  box-shadow: 0 2px 5px rgba(212, 0, 28, 0.2);
}

.fh-join-discussion-btn:hover {
  background-color: var(--fh-primary-dark, #B5001A);
  transform: translateY(-2px);
  box-shadow: 0 4px 10px rgba(212, 0, 28, 0.3);
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
    font-size: 0.75rem;
    padding: 0.5rem 0.7rem;
  }
}

@media (max-width: 768px) {
  .fh-section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
  
  .fh-game-card {
    width: 340px;
    min-width: 340px;
    max-width: 340px;
    height: 480px;
    min-height: 480px;
    max-height: 480px;
  }
  
  .fh-team img {
    width: 75px;
    height: 75px;
  }
  
  .fh-vs-container {
    min-width: 90px;
  }
}

@media (max-width: 480px) {
  .fh-section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
  
  .fh-game-card {
    width: 310px;
    min-width: 310px;
    max-width: 310px;
    height: 480px;
    min-height: 480px;
    max-height: 480px;
  }
  
  .fh-teams-matchup {
    padding: 0.75rem;
  }
  
  .fh-game-details {
    width: 100%;
  }
  
  .fh-vs-container {
    min-width: 80px;
  }
  
  .fh-game-actions {
    padding: 0.5rem 0.75rem;
  }
  
  .fh-predict-btn, 
  .fh-game-details-btn, 
  .fh-join-discussion-btn {
    font-size: 0.7rem;
    padding: 0.4rem 0.6rem;
  }
}
`;

// Loading spinner component
const LoadingSpinner = () => (
  <div className="fh-loading-container">
    <FaSpinner className="fh-loading-icon" />
    <p>Loading the latest college football updates...</p>
  </div>
);

// Countdown Timer Component
const CountdownTimer = ({ startDate }) => {
  const [timeLeft, setTimeLeft] = useState(null);
  
  // Calculate time until game
  const calculateTimeLeft = () => {
    if (!startDate) return null;
    
    const gameDate = new Date(startDate);
    if (isNaN(gameDate.getTime())) return null;
    
    const now = new Date();
    
    // If game is in the past
    if (gameDate < now) return "Final";
    
    // Calculate difference in milliseconds
    const difference = gameDate - now;
    
    // Calculate days, hours, minutes, seconds
    const days = Math.floor(difference / (1000 * 60 * 60 * 24));
    const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((difference % (1000 * 60)) / 1000);
    
    return { days, hours, minutes, seconds };
  };
  
  // Update countdown every second
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);
    
    // Set initial value
    setTimeLeft(calculateTimeLeft());
    
    return () => clearInterval(timer);
  }, [startDate]);
  
  if (!timeLeft) return null;
  
  if (timeLeft === "Final") {
    return (
      <div className="fh-countdown-container">
        <span className="fh-countdown-final">Final</span>
      </div>
    );
  }
  
  return (
    <div className="fh-countdown-container">
      <div className="fh-countdown-title">
        <FaClock /> Kickoff In
      </div>
      <div className="fh-countdown-timer">
        <div className="fh-time-unit">
          <span className="fh-time-value">{timeLeft.days}</span>
          <span className="fh-time-label">d</span>
        </div>
        <div className="fh-time-unit">
          <span className="fh-time-value">{timeLeft.hours.toString().padStart(2, '0')}</span>
          <span className="fh-time-label">h</span>
        </div>
        <div className="fh-time-unit">
          <span className="fh-time-value">{timeLeft.minutes.toString().padStart(2, '0')}</span>
          <span className="fh-time-label">m</span>
        </div>
        <div className="fh-time-unit">
          <span className="fh-time-value">{timeLeft.seconds.toString().padStart(2, '0')}</span>
          <span className="fh-time-label">s</span>
        </div>
      </div>
    </div>
  );
};

// Game Card Component - Optimized for alignment and consistent rendering
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
      whileHover={{ y: -5 }}
      transition={{ duration: 0.3 }}
    >
      <div className="fh-game-card-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
          <span className="fh-game-week">Week {game.week}</span>
          {isHighlighted && <span className="fh-game-featured"><FaFire /> Featured</span>}
        </div>
        <CountdownTimer startDate={game.startDate} />
      </div>
      
      <div className="fh-teams-matchup">
        <div className="fh-team fh-home-team">
          <img 
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
              <span title={formatGameDate(game.startDate) + " " + formatGameTime(game.startDate)}>
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
          
          {/* Game prediction meter */}
          <div className="fh-prediction-meter">
            <div className="fh-prediction-bar">
              <div 
                className="fh-prediction-fill home"
                style={{ width: `${game.homePredictionPercent || 50}%` }}
              ></div>
              <div 
                className="fh-prediction-fill away"
                style={{ width: `${100 - (game.homePredictionPercent || 50)}%` }}
              ></div>
            </div>
            <div className="fh-prediction-labels">
              <span>{game.homePredictionPercent || 50}%</span>
              <span>{100 - (game.homePredictionPercent || 50)}%</span>
            </div>
          </div>
        </div>
        
        <div className="fh-team fh-away-team">
          <img 
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
        <button 
          className="fh-predict-btn"
          onClick={() => onPredictionClick(game.id)}
        >
          <FaPoll /> Predict
        </button>
        <Link to={`/game/${game.id}`} className="fh-game-details-btn">
          Details <FaArrowRight />
        </Link>
        <button className="fh-join-discussion-btn">
          <FaComments /> Discuss
        </button>
      </div>
    </motion.div>
  );
};

// FeaturedGames component
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
      // Calculate scroll amount based on card width plus gap
      const cardWidth = 360; // Match the updated CSS width
      const gap = 28; // 1.8rem gap (increased gap)
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
        <button onClick={() => window.location.reload()} className="fh-reload-btn">
          Try Again
        </button>
      </div>
    );
  }

  return (
    <section className="fh-games-showcase">
      <div className="fh-section-header">
        <h2><FaStar className="fh-section-icon" /> Featured Games of the Week</h2>
        <div className="fh-carousel-controls">
          <button 
            className="fh-carousel-control left"
            onClick={() => scrollGames('left')}
            aria-label="Scroll left"
          >
            &lsaquo;
          </button>
          <button 
            className="fh-carousel-control right"
            onClick={() => scrollGames('right')}
            aria-label="Scroll right"
          >
            &rsaquo;
          </button>
        </div>
      </div>
      
      <div className="fh-games-carousel" ref={gamesContainerRef}>
        {featuredGames.map((game, index) => (
          <GameCard 
            key={game.id || index} 
            game={game} 
            isHighlighted={game.isGameOfWeek}
            onPredictionClick={handlePredictionClick}
          />
        ))}
      </div>
    </section>
  );
};

export default FeaturedGames;