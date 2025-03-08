import React, { useState, useRef } from 'react';
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
  FaPoll
} from 'react-icons/fa';
import "../styles/FanHub.css";

const mockLivePolls = [
  {
    id: 1,
    question: "Who wins the SEC Championship?",
    options: [
      { text: "Georgia", votes: 45, percentage: 45 },
      { text: "Alabama", votes: 35, percentage: 35 },
      { text: "LSU", votes: 20, percentage: 20 }
    ]
  },
  {
    id: 2, 
    question: "Top Transfer Portal QB?",
    options: [
      { text: "Michael Penix Jr.", votes: 52, percentage: 52 },
      { text: "Caleb Williams", votes: 38, percentage: 38 },
      { text: "Drake Maye", votes: 10, percentage: 10 }
    ]
  }
];

const mockDiscussionTopics = [
  { 
    id: 1, 
    title: "Week 1 Transfer Portal Megathread", 
    category: "Recruiting", 
    activeUsers: 342, 
    lastActivity: "2 hours ago" 
  }
];

const FanHub = () => {
  // State management
  const [activeTab, setActiveTab] = useState('discussions');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilters, setSelectedFilters] = useState({
    category: 'All',
    sortBy: 'Recent'
  });

  // Filtered discussion topics
  const filteredTopics = mockDiscussionTopics.filter(topic => 
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
              {mockLivePolls.map(poll => (
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