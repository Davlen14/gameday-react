import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  FaFireAlt
} from 'react-icons/fa';
import teamsService from '../services/teamsService';
import "../styles/FanHub.css";

const FanHub = () => {
  // State management
  const [activeTab, setActiveTab] = useState('discussions');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilters, setSelectedFilters] = useState({
    category: 'All',
    sortBy: 'Recent'
  });
  
  // State for featured game and discussions
  const [featuredGame, setFeaturedGame] = useState(null);
  const [discussions, setDiscussions] = useState([]);
  const [teams, setTeams] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch featured game and discussions
  useEffect(() => {
    const fetchFeaturedContent = async () => {
      try {
        setIsLoading(true);
        
        // Fetch teams first
        const teamsData = await teamsService.getTeams();
        setTeams(teamsData);

        // Fetch games for Year 2025 and Week 1
        const gamesData = await teamsService.getGames(1);
        
        // Find Ohio State vs Texas game
        const ohioStateTexasGame = gamesData.find(game => 
          (game.homeTeam === "Ohio State" && game.awayTeam === "Texas") ||
          (game.awayTeam === "Ohio State" && game.homeTeam === "Texas")
        );

        // Create default featured discussions
        let featuredDiscussions = [
          { 
            id: 1, 
            title: "Week 1 College Football Showdown", 
            category: "Game Analysis", 
            activeUsers: 564, 
            lastActivity: "1 hour ago"
          },
          { 
            id: 2, 
            title: "Transfer Portal: Top Moves and Impact", 
            category: "Recruiting", 
            activeUsers: 742, 
            lastActivity: "30 mins ago" 
          }
        ];

        // Update discussions if game found
        if (ohioStateTexasGame) {
          setFeaturedGame(ohioStateTexasGame);
          featuredDiscussions = [
            { 
              id: 1, 
              title: `Week 1 Showdown: ${ohioStateTexasGame.homeTeam} vs ${ohioStateTexasGame.awayTeam}`, 
              category: "Game Analysis", 
              activeUsers: 564, 
              lastActivity: "1 hour ago"
            },
            { 
              id: 2, 
              title: "Transfer Portal Impact on This Matchup", 
              category: "Recruiting", 
              activeUsers: 742, 
              lastActivity: "30 mins ago" 
            }
          ];
        }

        setDiscussions(featuredDiscussions);
      } catch (err) {
        setError(err.message);
        console.error("Error fetching featured content:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFeaturedContent();
  }, []);

  // Filtered discussion topics
  const filteredTopics = discussions.filter(topic => 
    topic.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
    (selectedFilters.category === 'All' || topic.category === selectedFilters.category)
  );

  // Responsive design refs
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
      name: 'bets', 
      icon: <FaChartLine />, 
      label: 'Betting Insights' 
    },
    { 
      name: 'predictions', 
      icon: <FaChartBar />, 
      label: 'Game Predictions' 
    }
  ];

  // Helper to get team logo
  const getTeamLogo = (teamName) => {
    const team = teams.find(
      (t) => t.school.toLowerCase() === teamName.toLowerCase()
    );
    return team?.logos?.[0] || "/photos/default_team.png";
  };

  // Render loading state
  if (isLoading) {
    return (
      <div className="fanhub-container loading">
        <FaFootballBall className="loading-icon spinning" />
        <p>Loading Fan Hub...</p>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="fanhub-container error">
        <FaTrophy className="error-icon" />
        <h2>Oops! Something went wrong</h2>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="fanhub-container">
      {/* Header with Featured Game */}
      <header className="fanhub-header">
        {featuredGame && (
          <div className="featured-game-banner">
            <div className="teams-matchup">
              <div className="team home-team">
                <img 
                  src={getTeamLogo(featuredGame.homeTeam)} 
                  alt={featuredGame.homeTeam} 
                />
                <span>{featuredGame.homeTeam}</span>
              </div>
              <div className="vs">VS</div>
              <div className="team away-team">
                <img 
                  src={getTeamLogo(featuredGame.awayTeam)} 
                  alt={featuredGame.awayTeam} 
                />
                <span>{featuredGame.awayTeam}</span>
              </div>
            </div>
            <div className="game-details">
              <span className="venue">{featuredGame.venue}</span>
              <span className="date">
                {new Date(featuredGame.startDate).toLocaleDateString()}
              </span>
            </div>
          </div>
        )}
        
        <div className="header-content">
          <FaFootballBall className="header-icon" />
          <h1>Gameday+ Fan Hub</h1>
          <p>The ultimate community for college football enthusiasts</p>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="fanhub-tabs">
        {tabs.map(tab => (
          <motion.button
            key={tab.name}
            className={`tab-button ${activeTab === tab.name ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.name)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </motion.button>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="fanhub-content">
        {/* Search and Filter Section */}
        <div className="content-filters">
          <div className="search-container">
            <FaSearch className="search-icon" />
            <input 
              type="text" 
              placeholder="Search discussions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="filter-container">
            <select 
              value={selectedFilters.category}
              onChange={(e) => setSelectedFilters(prev => ({
                ...prev, 
                category: e.target.value
              }))}
            >
              <option value="All">All Categories</option>
              <option value="Recruiting">Recruiting</option>
              <option value="Betting">Betting</option>
              <option value="Team Analysis">Team Analysis</option>
            </select>
            <select 
              value={selectedFilters.sortBy}
              onChange={(e) => setSelectedFilters(prev => ({
                ...prev, 
                sortBy: e.target.value
              }))}
            >
              <option value="Recent">Most Recent</option>
              <option value="Popular">Most Popular</option>
              <option value="ActiveUsers">Active Users</option>
            </select>
          </div>
        </div>

        {/* Dynamic Content Based on Active Tab */}
        <AnimatePresence mode="wait">
          {activeTab === 'discussions' && (
            <motion.div 
              key="discussions"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="discussions-container"
              ref={discussionContainerRef}
            >
              <h2>Community Discussions</h2>
              {filteredTopics.length > 0 ? (
                filteredTopics.map(topic => (
                  <motion.div 
                    key={topic.id} 
                    className="discussion-topic"
                    whileHover={{ scale: 1.02 }}
                  >
                    <div className="topic-header">
                      <span className="topic-category">{topic.category}</span>
                      <span className="topic-activity">{topic.lastActivity}</span>
                    </div>
                    <h3>{topic.title}</h3>
                    <div className="topic-stats">
                      <FaUserFriends /> {topic.activeUsers} Active Users
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="no-discussions">
                  <p>No discussions available at the moment.</p>
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
              className="polls-container"
            >
              <h2>Live Community Polls</h2>
              {[{
                id: 1,
                question: `Who wins ${featuredGame ? `${featuredGame.homeTeam} vs ${featuredGame.awayTeam}` : 'Week 1 Showdown'}?`,
                options: [
                  { text: featuredGame ? featuredGame.homeTeam : "Ohio State", votes: 52, percentage: 52 },
                  { text: featuredGame ? featuredGame.awayTeam : "Texas", votes: 38, percentage: 38 },
                  { text: "Too Close to Call", votes: 10, percentage: 10 }
                ]
              }].map(poll => (
                <div key={poll.id} className="live-poll">
                  <h3>{poll.question}</h3>
                  {poll.options.map(option => (
                    <div key={option.text} className="poll-option">
                      <div 
                        className="poll-bar" 
                        style={{ width: `${option.percentage}%` }}
                      >
                        {option.text} ({option.votes} votes)
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </motion.div>
          )}

          {/* Placeholder for other tabs */}
          {['bets', 'predictions'].includes(activeTab) && (
            <motion.div 
              key="coming-soon"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="coming-soon"
            >
              <FaTrophy className="coming-soon-icon" />
              <h2>Coming Soon!</h2>
              <p>We're working on bringing you amazing {activeTab.replace('bets', 'betting').replace('predictions', 'prediction')} features.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default FanHub;