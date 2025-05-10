import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  FaFootballBall, 
  FaChartBar, 
  FaComments, 
  FaUserFriends, 
  FaBell, 
  FaFilter, 
  FaSearch,
  FaTrophy,
  FaChartLine,
  FaPoll,
  FaSpinner,
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaTv,
  FaFire,
  FaRegClock,
  FaArrowRight,
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
  const [activeTab, setActiveTab] = useState('discussions');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilters, setSelectedFilters] = useState({
    category: 'All',
    sortBy: 'Recent'
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Data states from API
  const [featuredGames, setFeaturedGames] = useState([]);
  const [polls, setPolls] = useState([]);
  const [discussions, setDiscussions] = useState([]);
  const [year] = useState(2025);
  const [week] = useState(1);
  
  // References
  const gamesContainerRef = useRef(null);
  const discussionContainerRef = useRef(null);

  // Tab configuration
  const tabs = [
    { 
      name: 'discussions', 
      icon: <FaComments />, 
      label: 'Discussions' 
    },
    { 
      name: 'polls', 
      icon: <FaPoll />, 
      label: 'Live Polls' 
    },
    { 
      name: 'gameday', 
      icon: <FaFootballBall />, 
      label: 'Game Day' 
    },
    { 
      name: 'predictions', 
      icon: <FaChartBar />, 
      label: 'Predictions' 
    }
  ];
  
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
        
        // Fetch latest AP poll
        const pollsData = await teamsService.getPolls(year, "ap", week);
        setPolls(pollsData);
        
        // Generate realistic discussion topics based on teams and current college football topics
        const allTeams = await teamsService.getTeams(year);
        generateDiscussionTopics(allTeams);
        
      } catch (err) {
        console.error("Error fetching data:", err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [year, week]);
  
  // Generate realistic discussion topics based on real teams
  const generateDiscussionTopics = (teams) => {
    if (!teams || teams.length === 0) return;
    
    // Get some popular teams for discussions
    const popularTeams = teams.filter(team => 
      ["Alabama", "Georgia", "Ohio State", "Michigan", "Texas", "USC", "Clemson", "Oklahoma", "Notre Dame", "LSU"].includes(team.school)
    );
    
    // Generate discussion topics
    const topicsData = [
      { 
        id: 1, 
        title: `2025 Season Opener: #1 Texas vs #2 Ohio State Preview`, 
        category: "Game Analysis",
        author: "BuckeyeFan614",
        avatar: "/photos/avatars/user1.png", 
        activeUsers: Math.floor(Math.random() * 500) + 800,
        comments: 347,
        likes: 832, 
        lastActivity: "Just now",
        tags: ["GameofWeek", "Top5Matchup"]
      },
      { 
        id: 2, 
        title: "Transfer Portal Megathread: Biggest Moves for 2025", 
        category: "Recruiting",
        author: "CFBInsider",
        avatar: "/photos/avatars/user2.png", 
        activeUsers: Math.floor(Math.random() * 300) + 500,
        comments: 298,
        likes: 654, 
        lastActivity: "30 mins ago",
        tags: ["TransferPortal", "Recruiting"]
      },
      { 
        id: 3, 
        title: "NIL Deals: How SEC Teams Dominated the Offseason", 
        category: "Name, Image, Likeness",
        author: "SECExpert",
        avatar: "/photos/avatars/user3.png", 
        activeUsers: Math.floor(Math.random() * 200) + 400,
        comments: 215,
        likes: 592, 
        lastActivity: "2 hours ago",
        tags: ["NIL", "SEC"]
      },
      { 
        id: 4, 
        title: "16-Team Playoff: What It Means for College Football", 
        category: "NCAA Updates",
        author: "PlayoffCommittee",
        avatar: "/photos/avatars/user4.png", 
        activeUsers: Math.floor(Math.random() * 300) + 500,
        comments: 326,
        likes: 748, 
        lastActivity: "45 mins ago",
        tags: ["Playoff", "CFPExpansion"]
      },
      { 
        id: 5, 
        title: `${popularTeams[2]?.school || "Georgia"}'s Path to the National Championship`, 
        category: "Team Analysis",
        author: "DawgNation",
        avatar: "/photos/avatars/user5.png", 
        activeUsers: Math.floor(Math.random() * 200) + 300,
        comments: 234,
        likes: 486, 
        lastActivity: "3 hours ago",
        tags: ["Championship", "Predictions"]
      },
      { 
        id: 6, 
        title: "Breaking Down Conference Realignment Winners and Losers", 
        category: "College Football Landscape",
        author: "ConferenceWatcher",
        avatar: "/photos/avatars/user6.png", 
        activeUsers: Math.floor(Math.random() * 200) + 300,
        comments: 258,
        likes: 593, 
        lastActivity: "4 hours ago",
        tags: ["Realignment", "Conferences"]
      },
      { 
        id: 7, 
        title: `Freshman QBs to Watch in ${year}`, 
        category: "Recruiting",
        author: "QBGuru",
        avatar: "/photos/avatars/user7.png", 
        activeUsers: Math.floor(Math.random() * 100) + 200,
        comments: 178,
        likes: 412, 
        lastActivity: "5 hours ago",
        tags: ["Freshmen", "Quarterbacks"]
      },
      { 
        id: 8, 
        title: `Dark Horse Teams for ${year} National Championship`, 
        category: "Predictions",
        author: "UnderdogAnalyst",
        avatar: "/photos/avatars/user8.png", 
        activeUsers: Math.floor(Math.random() * 300) + 400,
        comments: 265,
        likes: 537, 
        lastActivity: "1 day ago",
        tags: ["Underdogs", "Championship"]
      }
    ];
    
    setDiscussions(topicsData);
  };

  // Filtered discussion topics
  const filteredTopics = discussions.filter(topic => 
    topic.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
    (selectedFilters.category === 'All' || topic.category === selectedFilters.category)
  );
  
  // Create poll data based on real teams
  const getLivePolls = () => {
    if (!polls || polls.length === 0) {
      return [
        {
          id: 1,
          question: "Who will win the 2025 National Championship?",
          totalVotes: 8975,
          options: [
            { text: "Texas", votes: 2691, percentage: 30 },
            { text: "Ohio State", votes: 2243, percentage: 25 },
            { text: "Georgia", votes: 1795, percentage: 20 },
            { text: "Alabama", votes: 1346, percentage: 15 },
            { text: "Other", votes: 900, percentage: 10 }
          ]
        },
        {
          id: 2,
          question: "Who will win the Texas vs Ohio State season opener?",
          totalVotes: 6542,
          options: [
            { text: "Ohio State by 7+ points", votes: 2421, percentage: 37 },
            { text: "Ohio State by 1-6 points", votes: 1635, percentage: 25 },
            { text: "Texas by 1-6 points", votes: 1308, percentage: 20 },
            { text: "Texas by 7+ points", votes: 1178, percentage: 18 }
          ]
        },
        {
          id: 3,
          question: "Which feature would you most like added to Fan Hub?",
          totalVotes: 3854,
          options: [
            { text: "Live Game Threads", votes: 1349, percentage: 35 },
            { text: "Team Chat Rooms", votes: 924, percentage: 24 },
            { text: "Game Day Check-ins", votes: 770, percentage: 20 },
            { text: "Fan Content Upload", votes: 578, percentage: 15 },
            { text: "Enhanced Poll Features", votes: 233, percentage: 6 }
          ]
        }
      ];
    }
    
    // Use real poll data from API if available
    const apPoll = polls[0];
    
    if (!apPoll || !apPoll.rankings || apPoll.rankings.length === 0) {
      return [];
    }
    
    return [
      {
        id: 1,
        question: "Who will win the 2025 National Championship?",
        totalVotes: 8975,
        options: [
          { 
            text: apPoll.rankings[0]?.school || "Texas", 
            votes: Math.floor(Math.random() * 500) + 2200, 
            percentage: 30
          },
          { 
            text: apPoll.rankings[1]?.school || "Ohio State", 
            votes: Math.floor(Math.random() * 500) + 2000, 
            percentage: 25
          },
          { 
            text: apPoll.rankings[2]?.school || "Georgia", 
            votes: Math.floor(Math.random() * 300) + 1700, 
            percentage: 20
          },
          { 
            text: apPoll.rankings[3]?.school || "Alabama", 
            votes: Math.floor(Math.random() * 300) + 1200, 
            percentage: 15
          },
          { 
            text: "Other", 
            votes: Math.floor(Math.random() * 200) + 800, 
            percentage: 10
          }
        ]
      },
      {
        id: 2,
        question: "Who will win the Texas vs Ohio State season opener?",
        totalVotes: 6542,
        options: [
          { 
            text: "Ohio State by 7+ points", 
            votes: Math.floor(Math.random() * 300) + 2200, 
            percentage: 37
          },
          { 
            text: "Ohio State by 1-6 points", 
            votes: Math.floor(Math.random() * 200) + 1500, 
            percentage: 25
          },
          { 
            text: "Texas by 1-6 points", 
            votes: Math.floor(Math.random() * 200) + 1200, 
            percentage: 20
          },
          { 
            text: "Texas by 7+ points", 
            votes: Math.floor(Math.random() * 200) + 1000, 
            percentage: 18
          }
        ]
      }
    ];
  };
  
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
      {/* Note: FanHub header removed as requested */}
      
      {/* Featured Games Section - Moved to the top area where header was */}
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

      {/* Navigation Tabs */}
      <div className="fh-tabs">
        {tabs.map(tab => (
          <motion.button
            key={tab.name}
            className={`fh-tab-button ${activeTab === tab.name ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.name)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <span className="fh-tab-icon">{tab.icon}</span>
            <span className="fh-tab-label">{tab.label}</span>
          </motion.button>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="fh-content">
        {/* Search and Filter Section */}
        {activeTab === 'discussions' && (
          <div className="fh-content-filters">
            <div className="fh-search-container">
              <FaSearch className="fh-search-icon" />
              <input 
                type="text" 
                placeholder="Search discussions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="fh-filter-container">
              <select 
                value={selectedFilters.category}
                onChange={(e) => setSelectedFilters(prev => ({
                  ...prev, 
                  category: e.target.value
                }))}
                className="fh-filter-select"
              >
                <option value="All">All Categories</option>
                <option value="Game Analysis">Game Analysis</option>
                <option value="Recruiting">Recruiting</option>
                <option value="Team Analysis">Team Analysis</option>
                <option value="NCAA Updates">NCAA Updates</option>
                <option value="Predictions">Predictions</option>
                <option value="College Football Landscape">CFB Landscape</option>
                <option value="Name, Image, Likeness">NIL</option>
              </select>
              <select 
                value={selectedFilters.sortBy}
                onChange={(e) => setSelectedFilters(prev => ({
                  ...prev, 
                  sortBy: e.target.value
                }))}
                className="fh-filter-select"
              >
                <option value="Recent">Most Recent</option>
                <option value="Popular">Most Popular</option>
                <option value="ActiveUsers">Most Active</option>
              </select>
            </div>
          </div>
        )}

        {/* Dynamic Content Based on Active Tab */}
        <AnimatePresence mode="wait">
          {activeTab === 'discussions' && (
            <motion.div 
              key="discussions"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fh-discussions-container"
              ref={discussionContainerRef}
            >
              <h2 className="fh-content-title">Community Discussions</h2>
              {filteredTopics.length > 0 ? (
                <div className="fh-discussion-topics">
                  {filteredTopics.map(topic => (
                    <motion.div 
                      key={topic.id} 
                      className="fh-discussion-card"
                      whileHover={{ y: -5 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="fh-discussion-header">
                        <div className="fh-discussion-author">
                          <img src={topic.avatar || "/photos/default_avatar.png"} alt={topic.author} className="fh-author-avatar" />
                          <span className="fh-author-name">{topic.author}</span>
                        </div>
                        <span className="fh-discussion-time">{topic.lastActivity}</span>
                      </div>
                      
                      <h3 className="fh-discussion-title">{topic.title}</h3>
                      
                      <div className="fh-discussion-tags">
                        <span className="fh-topic-category">{topic.category}</span>
                        {topic.tags && topic.tags.map((tag, i) => (
                          <span key={i} className="fh-topic-tag">#{tag}</span>
                        ))}
                      </div>
                      
                      <div className="fh-discussion-stats">
                        <div className="fh-stat-item">
                          <FaUserFriends className="fh-stat-icon" />
                          <span>{topic.activeUsers} active</span>
                        </div>
                        <div className="fh-stat-item">
                          <FaComments className="fh-stat-icon" />
                          <span>{topic.comments}</span>
                        </div>
                        <div className="fh-stat-item">
                          <FaRegClock className="fh-stat-icon" />
                          <span>{topic.lastActivity}</span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="fh-no-discussions">
                  <p>No discussions found matching your search criteria.</p>
                  <button 
                    onClick={() => {
                      setSearchTerm('');
                      setSelectedFilters({
                        category: 'All',
                        sortBy: 'Recent'
                      });
                    }}
                    className="fh-reset-filters-btn"
                  >
                    Reset Filters
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'polls' && (
            <motion.div 
              key="polls"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fh-polls-container"
            >
              <h2 className="fh-content-title">Live Community Polls</h2>
              
              <div className="fh-live-polls">
                {getLivePolls().map(poll => (
                  <div key={poll.id} className="fh-poll-card">
                    <h3 className="fh-poll-question">{poll.question}</h3>
                    <div className="fh-poll-options">
                      {poll.options.map((option, index) => (
                        <div key={index} className="fh-poll-option">
                          <div className="fh-option-text">
                            <span className="fh-option-label">{option.text}</span>
                            <span className="fh-option-percentage">{option.percentage}%</span>
                          </div>
                          <div className="fh-option-bar-container">
                            <motion.div 
                              className="fh-option-bar"
                              initial={{ width: 0 }}
                              animate={{ width: `${option.percentage}%` }}
                              transition={{ duration: 1, delay: index * 0.1 }}
                            />
                          </div>
                          <div className="fh-option-votes">
                            {option.votes} votes
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="fh-poll-footer">
                      <span className="fh-poll-total">Total votes: {poll.totalVotes}</span>
                      <button className="fh-vote-btn">Cast Your Vote</button>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* AP Top 25 Poll Display */}
              {polls && polls.length > 0 && polls[0]?.rankings && (
                <div className="fh-ap-poll-section">
                  <h2 className="fh-content-title">AP Top 25 Rankings</h2>
                  <div className="fh-ap-poll-header">
                    <p className="fh-poll-note">Looking ahead to the 2025 Season</p>
                  </div>
                  
                  <div className="fh-ap-poll-grid">
                    {polls[0].rankings.slice(0, 10).map((team, index) => (
                      <div key={index} className="fh-ap-team-card">
                        <div className="fh-ap-team-rank">#{team.rank}</div>
                        <div className="fh-ap-team-details">
                          <span className="fh-ap-team-name">{team.school}</span>
                          <span className="fh-ap-team-points">{team.points} pts</span>
                          {team.firstPlaceVotes > 0 && (
                            <span className="fh-ap-first-votes">({team.firstPlaceVotes} first)</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <Link to="/polls" className="fh-view-all-link">
                    View Complete AP Poll Rankings <FaArrowRight />
                  </Link>
                </div>
              )}
            </motion.div>
          )}

          {/* Placeholder for other tabs */}
          {['gameday', 'predictions'].includes(activeTab) && (
            <motion.div 
              key="coming-soon"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fh-coming-soon"
            >
              <FaTrophy className="fh-coming-soon-icon" />
              <h2>Coming Soon!</h2>
              <p>We're working on bringing you amazing {activeTab === 'gameday' ? 'game day' : 'prediction'} features.</p>
              <p className="fh-coming-soon-details">
                {activeTab === 'gameday' ? 
                  'Experience live game discussions, check-ins at stadiums, and interactive game threads.' : 
                  'Make your own predictions, compete with other fans, and track your accuracy throughout the season.'}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default FanHub;