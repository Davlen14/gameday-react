import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  FaSpinner,
  FaStar,
  FaUserCircle,
  FaFootballBall,
  FaTrophy,
  FaChartLine,
  FaBell,
  FaUsers
} from 'react-icons/fa';
import teamsService from '../services/teamsService';
import FeaturedGames from './FeaturedGames'; // Import the FeaturedGames component
import "../styles/FanHub.css";

// Loading spinner component
const LoadingSpinner = () => (
  <div className="fh-loading-container">
    <FaSpinner className="fh-loading-icon" />
    <p>Loading the latest college football updates...</p>
  </div>
);

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
  const [allTeams, setAllTeams] = useState([]);
  const [year] = useState(2025);
  const [week] = useState(1);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("featured");
  const [showTeamSelector, setShowTeamSelector] = useState(false);
  const [userTeams, setUserTeams] = useState([]);
  
  // References
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

  // Fetch data on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch team data
        const teamsData = await teamsService.getTeams(year);
        setAllTeams(teamsData || []);
        
      } catch (err) {
        console.error("Error fetching data:", err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [year]);
  
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
            {/* Featured Games Tab - Now using the separate FeaturedGames component */}
            {activeTab === "featured" && <FeaturedGames year={year} week={week} />}
            
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