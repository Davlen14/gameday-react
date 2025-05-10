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
  FaStar
} from 'react-icons/fa';
import teamsService from '../services/teamsService';
import "../styles/FanHub.css";

// Loading spinner component
const LoadingSpinner = () => (
  <div className="fh-loading-container">
    <FaSpinner className="fh-loading-icon" />
    <p>Loading the latest college football updates...</p>
  </div>
);

// Game Card Component
const GameCard = ({ game, isHighlighted }) => {
  const formatGameDate = (dateString) => {
    if (!dateString) return "TBD";
    
    const gameDate = new Date(dateString);
    if (isNaN(gameDate.getTime())) return "TBD";
    
    return gameDate.toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }) + ' • ' + gameDate.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <motion.div 
      className={`fh-game-card ${isHighlighted ? 'fh-game-card-highlighted' : ''}`}
      whileHover={{ y: -5 }}
      transition={{ duration: 0.3 }}
    >
      <div className="fh-game-card-header">
        <span className="fh-game-week">Week {game.week}</span>
        {isHighlighted && <span className="fh-game-featured"><FaFire /> Game of the Week</span>}
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
          <h3>{game.homeTeam}</h3>
          {game.homeRank && <span className="fh-team-rank">#{game.homeRank}</span>}
        </div>
        
        <div className="fh-vs-container">
          <div className="fh-vs-badge">VS</div>
          <div className="fh-game-details">
            <div className="fh-detail-item">
              <FaCalendarAlt className="fh-detail-icon" />
              <span>{formatGameDate(game.startDate)}</span>
            </div>
            <div className="fh-detail-item">
              <FaMapMarkerAlt className="fh-detail-icon" />
              <span>{game.venue}</span>
            </div>
            {game.media?.network && (
              <div className="fh-detail-item">
                <FaTv className="fh-detail-icon" />
                <span>{game.media.network}</span>
              </div>
            )}
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
          <h3>{game.awayTeam}</h3>
          {game.awayRank && <span className="fh-team-rank">#{game.awayRank}</span>}
        </div>
      </div>
      
      <div className="fh-game-actions">
        <Link to={`/game/${game.id}`} className="fh-game-details-btn">
          Game Details <FaArrowRight />
        </Link>
        <button className="fh-join-discussion-btn">
          <FaComments /> Join Discussion
        </button>
      </div>
    </motion.div>
  );
};

const FanHub = () => {
  // State management
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Data states from API
  const [featuredGames, setFeaturedGames] = useState([]);
  const [year] = useState(2025);
  const [week] = useState(1);
  
  // References
  const gamesContainerRef = useRef(null);

  // Fetch data on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch games for week 1 of 2025
        const gamesData = await teamsService.getGames(week, year);
        console.log("Games data:", gamesData);
        
        // Find featured games (Alabama at FSU, LSU at Clemson, Texas at Ohio State, ND at Miami)
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
              id: `2025_${matchup.home.toLowerCase().replace(/\s+/g, '')}_${matchup.away.toLowerCase().replace(/\s+/g, '')}`,
              homeTeam: matchup.home,
              awayTeam: matchup.away,
              startDate: "2025-08-30T19:30:00.000Z", // Placeholder date for 2025 season opener
              venue: `${matchup.home} Stadium`,
              homePoints: null,
              awayPoints: null,
              season: 2025,
              week: 1
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
            
            // Mark Texas vs Ohio State as the main Game of the Week
            const isGameOfWeek = (game.homeTeam === "Ohio State" && game.awayTeam === "Texas") || 
                                 (game.homeTeam === "Texas" && game.awayTeam === "Ohio State");
            
            return {
              ...game,
              media: gameMedia || {},
              homeTeamData: homeTeam || {},
              awayTeamData: awayTeam || {},
              homeRank,
              awayRank,
              isGameOfWeek
            };
          }));
          
          setFeaturedGames(enhancedGames);
        }
        
      } catch (err) {
        console.error("Error fetching data:", err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [year, week]);
  
  // Scroll games left/right
  const scrollGames = (direction) => {
    if (gamesContainerRef.current) {
      const scrollAmount = direction === 'left' ? -400 : 400;
      gamesContainerRef.current.scrollBy({
        top: 0,
        left: scrollAmount,
        behavior: 'smooth'
      });
    }
  };
  
  if (isLoading) {
    return <LoadingSpinner />;
  }
  
  if (error) {
    return (
      <div className="fh-error-container">
        <h2>Error loading data</h2>
        <p>{error}</p>
        <button onClick={() => window.location.reload()} className="fh-reload-btn">
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="fh-container">
      {/* Featured Games Section */}
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
            />
          ))}
        </div>
      </section>
    </div>
  );
};

export default FanHub;