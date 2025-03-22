import React, { useState, useRef, useEffect } from 'react';
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
  FaTv
} from 'react-icons/fa';
import teamsService from '../services/teamsService';
import "../styles/FanHub.css";

// Loading spinner component
const LoadingSpinner = () => (
  <div className="loading-container">
    <FaSpinner className="loading-icon" />
    <p>Loading data...</p>
  </div>
);

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
  const [featuredGame, setFeaturedGame] = useState(null);
  const [polls, setPolls] = useState([]);
  const [discussions, setDiscussions] = useState([]);
  const [year] = useState(2025);
  const [week] = useState(1); // Week 1 for Ohio State vs Texas game in 2025 season
  
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
  
  // Fetch data on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch games for week 1
        const gamesData = await teamsService.getGames(week, year);
        console.log("Games data:", gamesData);
        
        // Find Ohio State vs Texas game (could be home or away)
        console.log("Looking for Ohio State vs Texas game in 2025 Week 1");
        let ohioTexasGame = gamesData.find(
          game => 
            (game.homeTeam === "Ohio State" && game.awayTeam === "Texas") || 
            (game.homeTeam === "Texas" && game.awayTeam === "Ohio State")
        );
        
        // If game not found in API, create a placeholder for the 2025 season
        if (!ohioTexasGame) {
          console.log("Game not found in API, creating placeholder");
          ohioTexasGame = {
            id: "2025_ohiostate_texas",
            homeTeam: "Ohio State",
            awayTeam: "Texas",
            startDate: "2025-08-30T19:30:00.000Z", // Fictional date for 2025 season opener
            venue: "Ohio Stadium, Columbus, OH",
            homePoints: null,
            awayPoints: null,
            season: 2025,
            week: 1
          };
        }
        
        // If game found, get additional details
        if (ohioTexasGame) {
          // Get media data
          const mediaData = await teamsService.getGameMedia(year, week);
          const gameMedia = mediaData.find(m => m.id === ohioTexasGame.id);
          
          // Get weather data
          const weatherData = await teamsService.getGameWeather(year, week);
          const gameWeather = weatherData.find(w => w.id === ohioTexasGame.id);
          
          // Get betting lines
          const linesData = await teamsService.getGameLines(year);
          const gameLines = linesData.find(l => l.id === ohioTexasGame.id);
          
          // Get team data for logos
          const teamsData = await teamsService.getTeams(year);
          const homeTeam = teamsData.find(t => t.school === ohioTexasGame.homeTeam);
          const awayTeam = teamsData.find(t => t.school === ohioTexasGame.awayTeam);
          
          // Combine all data
          setFeaturedGame({
            ...ohioTexasGame,
            media: gameMedia || {},
            weather: gameWeather || {},
            lines: gameLines || {},
            homeTeamData: homeTeam || {},
            awayTeamData: awayTeam || {}
          });
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
        title: `2025 Season Opener: Ohio State vs Texas Preview`, 
        category: "Game Analysis", 
        activeUsers: Math.floor(Math.random() * 500) + 800, // High interest for this big matchup
        lastActivity: "Just now" 
      },
      { 
        id: 2, 
        title: "Transfer Portal Megathread: Biggest Moves", 
        category: "Recruiting", 
        activeUsers: Math.floor(Math.random() * 300) + 500, 
        lastActivity: "30 mins ago" 
      },
      { 
        id: 3, 
        title: "NIL Deals: Top Earning College Athletes", 
        category: "Name, Image, Likeness", 
        activeUsers: Math.floor(Math.random() * 200) + 400, 
        lastActivity: "2 hours ago" 
      },
      { 
        id: 4, 
        title: "16-Team Playoff: What It Means for College Football", 
        category: "NCAA Updates", 
        activeUsers: Math.floor(Math.random() * 300) + 500, 
        lastActivity: "45 mins ago" 
      },
      { 
        id: 5, 
        title: `${popularTeams[2]?.school || "Georgia"}'s Path to the National Championship`, 
        category: "Team Analysis", 
        activeUsers: Math.floor(Math.random() * 200) + 300, 
        lastActivity: "3 hours ago" 
      },
      { 
        id: 6, 
        title: "Breaking Down Conference Realignment", 
        category: "College Football Landscape", 
        activeUsers: Math.floor(Math.random() * 200) + 300, 
        lastActivity: "4 hours ago" 
      },
      { 
        id: 7, 
        title: `Freshman QBs to Watch in ${year}`, 
        category: "Recruiting", 
        activeUsers: Math.floor(Math.random() * 100) + 200, 
        lastActivity: "5 hours ago" 
      },
      { 
        id: 8, 
        title: `Dark Horse Teams for ${year} National Championship`, 
        category: "Predictions", 
        activeUsers: Math.floor(Math.random() * 300) + 400, 
        lastActivity: "1 day ago" 
      },
      { 
        id: 9, 
        title: "Best Tailgate Locations Across College Football", 
        category: "Fan Culture", 
        activeUsers: Math.floor(Math.random() * 100) + 200, 
        lastActivity: "6 hours ago" 
      },
      { 
        id: 10, 
        title: "Analytics Revolution in College Football", 
        category: "Strategy", 
        activeUsers: Math.floor(Math.random() * 100) + 150, 
        lastActivity: "12 hours ago" 
      }
    ];
    
    setDiscussions(topicsData);
  };
  
  // Format game date
  const formatGameDate = (dateString) => {
    if (!dateString) return "TBD";
    
    const gameDate = new Date(dateString);
    if (isNaN(gameDate.getTime())) return "TBD";
    
    return gameDate.toLocaleDateString(undefined, {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }) + ' • ' + gameDate.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Filtered discussion topics
  const filteredTopics = discussions.filter(topic => 
    topic.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
    (selectedFilters.category === 'All' || topic.category === selectedFilters.category)
  );
  
  // Create poll data based on real teams from the AP poll
  const getLivePolls = () => {
    if (!polls || polls.length === 0) {
      return [];
    }
    
    // Use the first poll (AP Top 25)
    const apPoll = polls[0];
    
    if (!apPoll || !apPoll.rankings || apPoll.rankings.length === 0) {
      return [];
    }
    
    return [
      {
        id: 1,
        question: "Who will win the 2025 National Championship?",
        options: [
          { 
            text: "Ohio State", 
            votes: Math.floor(Math.random() * 15) + 30, 
            percentage: Math.floor(Math.random() * 15) + 30
          },
          { 
            text: apPoll.rankings[0]?.school || "Georgia", 
            votes: Math.floor(Math.random() * 15) + 25, 
            percentage: Math.floor(Math.random() * 15) + 25
          },
          { 
            text: "Texas", 
            votes: Math.floor(Math.random() * 15) + 20, 
            percentage: Math.floor(Math.random() * 15) + 20
          },
          { 
            text: apPoll.rankings[1]?.school || "Alabama", 
            votes: Math.floor(Math.random() * 10) + 15, 
            percentage: Math.floor(Math.random() * 10) + 15
          },
          { 
            text: "Other", 
            votes: Math.floor(Math.random() * 10) + 5, 
            percentage: Math.floor(Math.random() * 10) + 5
          }
        ]
      },
      {
        id: 2,
        question: "Who will win the Ohio State vs Texas 2025 opener?",
        options: [
          { 
            text: "Ohio State by 7+ points", 
            votes: Math.floor(Math.random() * 15) + 35, 
            percentage: Math.floor(Math.random() * 15) + 35
          },
          { 
            text: "Ohio State by 1-6 points", 
            votes: Math.floor(Math.random() * 15) + 25, 
            percentage: Math.floor(Math.random() * 15) + 25
          },
          { 
            text: "Texas by 1-6 points", 
            votes: Math.floor(Math.random() * 10) + 20, 
            percentage: Math.floor(Math.random() * 10) + 20
          },
          { 
            text: "Texas by 7+ points", 
            votes: Math.floor(Math.random() * 10) + 15, 
            percentage: Math.floor(Math.random() * 10) + 15
          }
        ]
      }
    ];
  };
  
  if (isLoading) {
    return <LoadingSpinner />;
  }
  
  if (error) {
    return (
      <div className="error">
        <h2>Error loading data</h2>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="fanhub-container">
      {/* Header */}
      <header className="fanhub-header">
        <div className="header-content">
          <FaFootballBall className="header-icon" />
          <h1>Gameday+ Fan Hub</h1>
          <p>The ultimate community for college football enthusiasts</p>
        </div>
      </header>

      {/* Featured Game Banner */}
      {featuredGame && (
        <div className="featured-game-banner">
          <h2>2025 Season Opener - Week 1</h2>
          <div className="teams-matchup">
            <div className="team">
              <img 
                src={featuredGame.homeTeamData.logos?.[0] || "/photos/default_team.png"} 
                alt={featuredGame.homeTeam} 
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "/photos/default_team.png";
                }}
              />
              <span>{featuredGame.homeTeam}</span>
            </div>
            <div className="vs">VS</div>
            <div className="team">
              <img 
                src={featuredGame.awayTeamData.logos?.[0] || "/photos/default_team.png"} 
                alt={featuredGame.awayTeam} 
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "/photos/default_team.png";
                }}
              />
              <span>{featuredGame.awayTeam}</span>
            </div>
          </div>
          
          <div className="game-details">
            <div className="detail-item">
              <FaMapMarkerAlt />
              <span>{featuredGame.venue || "TBD"}</span>
            </div>
            <div className="detail-item">
              <FaCalendarAlt />
              <span>{formatGameDate(featuredGame.startDate)}</span>
            </div>
            <div className="detail-item">
              <FaTv />
              <span>{featuredGame.media?.network || "TBD"}</span>
            </div>
          </div>
          
          <Link to={`/game/${featuredGame.id}`} className="view-game-details">
            View Full Game Details
          </Link>
        </div>
      )}

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
        {activeTab === 'discussions' && (
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
                <option value="Game Analysis">Game Analysis</option>
                <option value="Recruiting">Recruiting</option>
                <option value="Team Analysis">Team Analysis</option>
                <option value="NCAA Updates">NCAA Updates</option>
                <option value="Predictions">Predictions</option>
                <option value="Fan Culture">Fan Culture</option>
                <option value="Strategy">Strategy</option>
                <option value="Name, Image, Likeness">NIL</option>
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
        )}

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
                  <p>No discussions found matching your search criteria.</p>
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
              {getLivePolls().map(poll => (
                <div key={poll.id} className="live-poll">
                  <h3>{poll.question}</h3>
                  {poll.options.map((option, index) => (
                    <div key={index} className="poll-option">
                      <div 
                        className="poll-bar" 
                        style={{ width: `${option.percentage}%` }}
                      >
                        <span className="poll-text">{option.text}</span>
                        <span className="poll-votes">({option.votes} votes)</span>
                      </div>
                    </div>
                  ))}
                  <div className="poll-total">
                    Total votes: {poll.options.reduce((sum, option) => sum + option.votes, 0)}
                  </div>
                </div>
              ))}
              
              {/* AP Top 25 Poll Display */}
              {polls && polls.length > 0 && polls[0]?.rankings && (
                <div className="ap-poll-container">
                  <h3>Latest AP Top 25 Poll</h3>
                  <div className="ap-poll-rankings">
                    <h4 className="poll-year-note">Looking ahead to the 2025 Season</h4>
              {polls[0].rankings.slice(0, 10).map((team, index) => (
                      <div key={index} className="ap-poll-team">
                        <span className="ap-poll-rank">{team.rank}</span>
                        <span className="ap-poll-school">{team.school}</span>
                        <span className="ap-poll-points">{team.points} pts</span>
                        {team.firstPlaceVotes > 0 && (
                          <span className="ap-poll-first-votes">
                            ({team.firstPlaceVotes} first place)
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                  <Link to="/polls" className="view-full-polls">
                    View Complete AP Poll Rankings
                  </Link>
                </div>
              )}
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
              <p>We're working on bringing you amazing {activeTab === 'bets' ? 'betting insights' : 'game prediction'} features.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default FanHub;