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
  FaStar,
  FaUserCircle,
  FaFootballBall,
  FaTrophy,
  FaChartLine,
  FaBell,
  FaPoll,
  FaUsers
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

  // Calculate days until game
  const getDaysUntilGame = (dateString) => {
    if (!dateString) return null;
    
    const gameDate = new Date(dateString);
    if (isNaN(gameDate.getTime())) return null;
    
    const today = new Date();
    const diffTime = gameDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return "Final";
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Tomorrow";
    return `${diffDays} days`;
  };

  // Truncate text helper function
  const truncateText = (text, maxLength) => {
    if (!text) return "";
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  const daysUntil = getDaysUntilGame(game.startDate);

  return (
    <motion.div 
      className={`fh-game-card ${isHighlighted ? 'fh-game-card-highlighted' : ''}`}
      whileHover={{ y: -5 }}
      transition={{ duration: 0.3 }}
    >
      <div className="fh-game-card-header">
        <span className="fh-game-week">Week {game.week}</span>
        {isHighlighted && <span className="fh-game-featured"><FaFire /> Featured</span>}
        {daysUntil && <span className="fh-days-until">{daysUntil}</span>}
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

// Team Selection Card Component
const TeamSelectionCard = ({ team, onSelect, isSelected }) => {
  return (
    <motion.div 
      className={`fh-team-selection-card ${isSelected ? 'fh-team-selected' : ''}`}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={() => onSelect(team)}
    >
      <img 
        src={team.logos?.[0] || `/photos/teams/${team.school.toLowerCase().replace(/\s+/g, '')}.png`} 
        alt={team.school}
        onError={(e) => {
          e.target.onerror = null;
          e.target.src = "/photos/default_team.png";
        }}
      />
      <h3 title={team.school}>{team.school}</h3>
      {team.mascot && <p className="fh-team-mascot">{team.mascot}</p>}
    </motion.div>
  );
};

// Tab Component
const TabSystem = ({ tabs, activeTab, setActiveTab }) => {
  return (
    <div className="fh-tabs">
      {tabs.map(tab => (
        <button
          key={tab.id}
          className={`fh-tab ${activeTab === tab.id ? 'fh-tab-active' : ''}`}
          onClick={() => setActiveTab(tab.id)}
        >
          {tab.icon && <span className="fh-tab-icon">{tab.icon}</span>}
          {tab.name}
        </button>
      ))}
    </div>
  );
};

const FanHub = () => {
  // State management
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Data states
  const [featuredGames, setFeaturedGames] = useState([]);
  const [allTeams, setAllTeams] = useState([]);
  const [year] = useState(2025);
  const [week] = useState(1);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("featured");
  const [showTeamSelector, setShowTeamSelector] = useState(false);
  const [userTeams, setUserTeams] = useState([]);
  
  // References
  const gamesContainerRef = useRef(null);
  const teamSelectorRef = useRef(null);

  // Tabs definition
  const tabs = [
    { id: "featured", name: "Featured Games", icon: <FaFootballBall /> },
    { id: "my-teams", name: "My Teams", icon: <FaStar /> },
    { id: "trending", name: "Trending", icon: <FaChartLine /> },
    { id: "community", name: "Fan Zone", icon: <FaUsers /> }
  ];

  // Handle team selection
  const handleTeamSelect = (team) => {
    // Check if team is already selected
    const isAlreadySelected = userTeams.some(t => t.school === team.school);
    
    if (isAlreadySelected) {
      setUserTeams(userTeams.filter(t => t.school !== team.school));
    } else {
      // Limit to 5 teams max
      if (userTeams.length < 5) {
        setUserTeams([...userTeams, team]);
      }
    }
  };

  // Handle prediction click
  const handlePredictionClick = (gameId) => {
    console.log(`Make prediction for game ${gameId}`);
    // Here you would open a prediction modal or navigate to prediction page
  };

  // Fetch data on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch games for week 1 of 2025
        const gamesData = await teamsService.getGames(week, year);
        
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
          setAllTeams(teamsData || []);
          
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
        console.error("Error fetching data:", err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [year, week]);
  
  // Handle click outside of team selector
  useEffect(() => {
    function handleClickOutside(event) {
      if (teamSelectorRef.current && !teamSelectorRef.current.contains(event.target)) {
        setShowTeamSelector(false);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [teamSelectorRef]);
  
  // Scroll games left/right with improved scrolling amount
  const scrollGames = (direction) => {
    if (gamesContainerRef.current) {
      // Calculate scroll amount based on card width
      const cardWidth = 330; // Match the CSS width
      const gap = 24; // 1.5rem gap
      const scrollAmount = direction === 'left' ? -(cardWidth + gap) : (cardWidth + gap);
      
      gamesContainerRef.current.scrollBy({
        top: 0,
        left: scrollAmount,
        behavior: 'smooth'
      });
    }
  };
  
  // Filter teams by search term
  const filteredTeams = allTeams.filter(team => 
    team.school.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (team.mascot && team.mascot.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  
  if (isLoading) {
    return (
      <div className="fanhub-wrapper">
        <LoadingSpinner />
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="fanhub-wrapper">
        <div className="fh-error-container">
          <h2>Error loading data</h2>
          <p>{error}</p>
          <button onClick={() => window.location.reload()} className="fh-reload-btn">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fanhub-wrapper">
      <div className="fh-container">
        {/* Welcome Banner */}
        {!userTeams.length && (
          <motion.div 
            className="fh-welcome-banner"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="fh-welcome-content">
              <h2>Welcome to FanHub</h2>
              <p>Your personalized college football experience starts here. Select your favorite teams to customize your feed.</p>
              <button 
                className="fh-welcome-btn"
                onClick={() => setShowTeamSelector(true)}
              >
                <FaUserCircle /> Pick Your Teams
              </button>
            </div>
            <div className="fh-welcome-illustration">
              <FaFootballBall className="fh-football-icon" />
              <FaTrophy className="fh-trophy-icon" />
            </div>
          </motion.div>
        )}
        
        {/* Team Selection Modal */}
        <AnimatePresence>
          {showTeamSelector && (
            <motion.div 
              className="fh-team-selector-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div 
                className="fh-team-selector"
                ref={teamSelectorRef}
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 50, opacity: 0 }}
              >
                <div className="fh-team-selector-header">
                  <h2>Select Your Favorite Teams</h2>
                  <p>Choose up to 5 teams to follow closely</p>
                  <div className="fh-search-box">
                    <input 
                      type="text" 
                      placeholder="Search for teams..." 
                      value={searchTerm} 
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <div className="fh-selected-count">
                    Selected: {userTeams.length}/5
                  </div>
                </div>
                
                <div className="fh-team-grid">
                  {filteredTeams.map(team => (
                    <TeamSelectionCard 
                      key={team.id} 
                      team={team} 
                      onSelect={handleTeamSelect}
                      isSelected={userTeams.some(t => t.school === team.school)}
                    />
                  ))}
                  {filteredTeams.length === 0 && (
                    <div className="fh-no-teams">
                      <p>No teams found matching "{searchTerm}"</p>
                    </div>
                  )}
                </div>
                
                <div className="fh-team-selector-footer">
                  <button 
                    className="fh-done-btn"
                    onClick={() => setShowTeamSelector(false)}
                  >
                    Done
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Main Content Area with Tabs */}
        <div className="fh-content-area">
          <TabSystem 
            tabs={tabs} 
            activeTab={activeTab} 
            setActiveTab={setActiveTab}
          />
          
          <div className="fh-tab-content">
            {/* Featured Games Tab */}
            {activeTab === "featured" && (
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
            )}
            
            {/* My Teams Tab */}
            {activeTab === "my-teams" && (
              <section className="fh-my-teams">
                <div className="fh-section-header">
                  <h2><FaUserCircle className="fh-section-icon" /> My Teams</h2>
                  <button 
                    className="fh-add-team-btn"
                    onClick={() => setShowTeamSelector(true)}
                  >
                    + Add Teams
                  </button>
                </div>
                
                {userTeams.length === 0 ? (
                  <div className="fh-empty-state">
                    <FaUserCircle className="fh-empty-icon" />
                    <h3>No teams selected yet</h3>
                    <p>Select your favorite teams to see their schedules, news, and more</p>
                    <button 
                      className="fh-select-teams-btn"
                      onClick={() => setShowTeamSelector(true)}
                    >
                      Select Teams
                    </button>
                  </div>
                ) : (
                  <div className="fh-my-teams-content">
                    {userTeams.map(team => (
                      <div key={team.id} className="fh-my-team-card">
                        <img 
                          src={team.logos?.[0]} 
                          alt={team.school}
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = "/photos/default_team.png";
                          }}
                        />
                        <h3>{team.school}</h3>
                        <Link to={`/team/${team.id}`} className="fh-view-team-btn">
                          View Team
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}
            
            {/* Trending Tab */}
            {activeTab === "trending" && (
              <section className="fh-trending">
                <div className="fh-section-header">
                  <h2><FaChartLine className="fh-section-icon" /> Trending in College Football</h2>
                </div>
                
                <div className="fh-empty-state">
                  <FaChartLine className="fh-empty-icon" />
                  <h3>Trending topics coming soon</h3>
                  <p>We're working on bringing you the hottest topics in college football</p>
                </div>
              </section>
            )}
            
            {/* Community Tab */}
            {activeTab === "community" && (
              <section className="fh-community">
                <div className="fh-section-header">
                  <h2><FaUsers className="fh-section-icon" /> Fan Zone</h2>
                </div>
                
                <div className="fh-empty-state">
                  <FaUsers className="fh-empty-icon" />
                  <h3>Fan discussions coming soon</h3>
                  <p>Connect with other fans and join the conversation</p>
                </div>
              </section>
            )}
          </div>
        </div>
        
        {/* Floating Notification Button for Mobile */}
        <div className="fh-notification-button">
          <FaBell />
          <span className="fh-notification-badge">3</span>
        </div>
      </div>
    </div>
  );
};

export default FanHub;