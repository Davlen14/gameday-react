import React, { useState, useEffect, useRef } from "react";
import "../styles/VisualizeTrends.css";
import PollsBumpChart from "./PollsBumpChart";
import PlayerStatsChart from "./PlayerStatsChart";
import TeamWinsTimeline from "./TeamWinsTimeline";
import teamsService from "../services/teamsService";

// SVG Icons as components
const Icons = {
  TeamWins: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3v18h18"></path>
      <path d="M18 9l-5-6-4 8-3-2"></path>
    </svg>
  ),
  PollRankings: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 1v4"></path>
      <path d="M19.071 4.929l-2.829 2.829"></path>
      <path d="M23 12h-4"></path>
      <path d="M19.071 19.071l-2.829-2.829"></path>
      <path d="M12 23v-4"></path>
      <path d="M4.929 19.071l2.829-2.829"></path>
      <path d="M1 12h4"></path>
      <path d="M4.929 4.929l2.829 2.829"></path>
      <circle cx="12" cy="12" r="4"></circle>
    </svg>
  ),
  PlayerStats: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
      <path d="M2 17l10 5 10-5"></path>
      <path d="M2 12l10 5 10-5"></path>
    </svg>
  ),
  TeamPoints: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="8" width="4" height="12"></rect>
      <rect x="10" y="4" width="4" height="16"></rect>
      <rect x="18" y="12" width="4" height="8"></rect>
    </svg>
  ),
  OffenseDefense: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 16l-6-6 6-6"></path>
      <path d="M14 8l6 6-6 6"></path>
    </svg>
  ),
  HowToUse: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"></circle>
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
      <line x1="12" y1="17" x2="12.01" y2="17"></line>
    </svg>
  ),
  DataSources: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
      <line x1="10" y1="6" x2="16" y2="6"></line>
      <line x1="10" y1="10" x2="16" y2="10"></line>
      <line x1="10" y1="14" x2="16" y2="14"></line>
    </svg>
  ),
  Menu: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="12" x2="21" y2="12"></line>
      <line x1="3" y1="6" x2="21" y2="6"></line>
      <line x1="3" y1="18" x2="21" y2="18"></line>
    </svg>
  ),
  Play: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="5 3 19 12 5 21 5 3"></polygon>
    </svg>
  ),
  Pause: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="6" y="4" width="4" height="16"></rect>
      <rect x="14" y="4" width="4" height="16"></rect>
    </svg>
  )
};

const VisualizeTrends = () => {
  // State for sidebar
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  // State to track which visualization is active
  const [activeViz, setActiveViz] = useState("teamWins");
  const [isLoading, setIsLoading] = useState(false);

  // Refs
  const dashboardRef = useRef(null);
  
  // State to store poll filters
  const [selectedWeekRange, setSelectedWeekRange] = useState("Week 1 - 5");
  const [selectedPollType, setSelectedPollType] = useState("AP Poll");

  // State to store player stats filters
  const [selectedPlayer, setSelectedPlayer] = useState("All Players");
  const [selectedStatType, setSelectedStatType] = useState("Passing Yards");
  const [players, setPlayers] = useState([]);
  const [teams, setTeams] = useState([]);

  // State for team wins timeline
  const [selectedYearRange, setSelectedYearRange] = useState("2015-2023");
  const [selectedConference, setSelectedConference] = useState("All Conferences");
  const [topTeamCount, setTopTeamCount] = useState("10");
  
  // State for Team Points
  const [selectedTeam, setSelectedTeam] = useState("All Teams");
  
  // State for Offense vs. Defense
  const [selectedOffensiveStat, setSelectedOffensiveStat] = useState("Total Yards");
  const [selectedDefensiveStat, setSelectedDefensiveStat] = useState("Yards Allowed");

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setSidebarCollapsed(true);
      }
    };
    
    window.addEventListener('resize', handleResize);
    handleResize(); // Initialize on load
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Handle click outside to collapse sidebar on mobile
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dashboardRef.current && 
          !dashboardRef.current.contains(event.target) && 
          window.innerWidth < 768 && 
          !sidebarCollapsed) {
        setSidebarCollapsed(true);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [sidebarCollapsed]);

  // Fetch players and teams on mount
  useEffect(() => {
    const fetchPlayersAndTeams = async () => {
      setIsLoading(true);
      try {
        const playersData = await teamsService.getPlayerSearch("");
        setPlayers(playersData);
        const teamsData = await teamsService.getTeams();
        setTeams(teamsData);
      } catch (error) {
        console.error("Error fetching players or teams:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPlayersAndTeams();
  }, []);

  // Toggle sidebar
  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  // Navigation item data
  const navItems = [
    {
      id: "teamWins",
      title: "Team Wins Timeline",
      icon: <Icons.TeamWins />
    },
    {
      id: "pollRankings",
      title: "Poll Rankings",
      icon: <Icons.PollRankings />
    },
    {
      id: "playerStats",
      title: "Player Stats",
      icon: <Icons.PlayerStats />
    },
    {
      id: "teamPoints",
      title: "Team Points",
      icon: <Icons.TeamPoints />
    },
    {
      id: "offenseDefense",
      title: "Offense vs Defense",
      icon: <Icons.OffenseDefense />
    }
  ];

  // About items
  const aboutItems = [
    {
      id: "howToUse",
      title: "How to Use",
      icon: <Icons.HowToUse />
    },
    {
      id: "dataSources",
      title: "Data Sources",
      icon: <Icons.DataSources />
    }
  ];

  // List of conferences for filter
  const conferences = [
    "All Conferences",
    "SEC",
    "Big Ten",
    "ACC",
    "Big 12",
    "Pac-12",
    "American",
    "Conference USA",
    "Mountain West",
    "Sun Belt",
    "MAC"
  ];

  // Handlers for updating filter selections
  const handleWeekRangeChange = (e) => {
    setSelectedWeekRange(e.target.value);
  };
  
  const handlePollTypeChange = (e) => {
    setSelectedPollType(e.target.value);
  };
  
  const handlePlayerChange = (e) => {
    setSelectedPlayer(e.target.value);
  };
  
  const handleStatTypeChange = (e) => {
    setSelectedStatType(e.target.value);
  };
  
  const handleYearRangeChange = (e) => {
    setSelectedYearRange(e.target.value);
  };
  
  const handleConferenceChange = (e) => {
    setSelectedConference(e.target.value);
  };
  
  const handleTopTeamCountChange = (e) => {
    setTopTeamCount(e.target.value);
  };
  
  const handleTeamChange = (e) => {
    setSelectedTeam(e.target.value);
  };
  
  const handleOffensiveStatChange = (e) => {
    setSelectedOffensiveStat(e.target.value);
  };
  
  const handleDefensiveStatChange = (e) => {
    setSelectedDefensiveStat(e.target.value);
  };

  // Function to render the appropriate filter controls for the active visualization
  const renderFilters = () => {
    switch(activeViz) {
      case "teamWins":
        return (
          <div className="vtfilters-container">
            <h3 className="vtfilter-title">Cumulative Football Wins Analysis</h3>
            <div className="vtfilter-groups">
              <div className="vtfilter-group">
                <label>Year Range</label>
                <select value={selectedYearRange} onChange={handleYearRangeChange}>
                  <option value="2000-2023">2000-2023</option>
                  <option value="2010-2023">2010-2023</option>
                  <option value="2015-2023">2015-2023</option>
                  <option value="2020-2023">2020-2023</option>
                </select>
              </div>
              <div className="vtfilter-group">
                <label>Conference</label>
                <select value={selectedConference} onChange={handleConferenceChange}>
                  {conferences.map((conf) => (
                    <option key={conf} value={conf}>{conf}</option>
                  ))}
                </select>
              </div>
              <div className="vtfilter-group">
                <label>Top Teams</label>
                <select value={topTeamCount} onChange={handleTopTeamCountChange}>
                  <option value="5">Top 5</option>
                  <option value="10">Top 10</option>
                  <option value="15">Top 15</option>
                  <option value="20">Top 20</option>
                </select>
              </div>
            </div>
          </div>
        );
        
      case "pollRankings":
        return (
          <div className="vtfilters-container">
            <h3 className="vtfilter-title">Poll Rankings Comparison</h3>
            <div className="vtfilter-groups">
              <div className="vtfilter-group">
                <label>Week Range</label>
                <select value={selectedWeekRange} onChange={handleWeekRangeChange}>
                  <option value="Week 1 - 5">Week 1 - 5</option>
                  <option value="Week 1 - 10">Week 1 - 10</option>
                  <option value="Week 1 - 15">Week 1 - 15</option>
                  <option value="Week 1 - Postseason">Week 1 - Postseason</option>
                </select>
              </div>
              <div className="vtfilter-group">
                <label>Poll Type</label>
                <select value={selectedPollType} onChange={handlePollTypeChange}>
                  <option value="AP Poll">AP Poll</option>
                  <option value="Coaches Poll">Coaches Poll</option>
                  <option value="Playoff Rankings">Playoff Rankings</option>
                </select>
              </div>
            </div>
          </div>
        );
        
      case "playerStats":
        return (
          <div className="vtfilters-container">
            <h3 className="vtfilter-title">Player Statistics Analysis</h3>
            <div className="vtfilter-groups">
              <div className="vtfilter-group">
                <label>Player</label>
                <select value={selectedPlayer} onChange={handlePlayerChange}>
                  <option value="All Players">All Players</option>
                  {players.map((player) => (
                    <option key={player.id} value={player.name}>
                      {player.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="vtfilter-group">
                <label>Stat Type</label>
                <select value={selectedStatType} onChange={handleStatTypeChange}>
                  <option value="Passing Yards">Passing Yards</option>
                  <option value="Rushing Yards">Rushing Yards</option>
                  <option value="Receiving Yards">Receiving Yards</option>
                  <option value="Touchdowns">Touchdowns</option>
                </select>
              </div>
              <div className="vtfilter-group">
                <label>Week Range</label>
                <select value={selectedWeekRange} onChange={handleWeekRangeChange}>
                  <option value="Week 1 - 5">Week 1 - 5</option>
                  <option value="Week 1 - 10">Week 1 - 10</option>
                  <option value="Week 1 - 15">Week 1 - 15</option>
                  <option value="Week 1 - Postseason">Week 1 - Postseason</option>
                </select>
              </div>
            </div>
          </div>
        );
        
      case "teamPoints":
        return (
          <div className="vtfilters-container">
            <h3 className="vtfilter-title">Team Points Analysis</h3>
            <div className="vtfilter-groups">
              <div className="vtfilter-group">
                <label>Team</label>
                <select value={selectedTeam} onChange={handleTeamChange}>
                  <option value="All Teams">All Teams</option>
                  {teams.map((team) => (
                    <option key={team.id} value={team.school}>
                      {team.school}
                    </option>
                  ))}
                </select>
              </div>
              <div className="vtfilter-group">
                <label>Year</label>
                <select>
                  <option>2023</option>
                  <option>2022</option>
                  <option>2021</option>
                </select>
              </div>
              <div className="vtfilter-group">
                <label>Season Type</label>
                <select>
                  <option>Regular Season</option>
                  <option>Postseason</option>
                  <option>All Games</option>
                </select>
              </div>
            </div>
          </div>
        );
        
      case "offenseDefense":
        return (
          <div className="vtfilters-container">
            <h3 className="vtfilter-title">Offense vs Defense Comparison</h3>
            <div className="vtfilter-groups">
              <div className="vtfilter-group">
                <label>Offensive Stat</label>
                <select value={selectedOffensiveStat} onChange={handleOffensiveStatChange}>
                  <option>Total Yards</option>
                  <option>Rushing Yards</option>
                  <option>Passing Yards</option>
                </select>
              </div>
              <div className="vtfilter-group">
                <label>Defensive Stat</label>
                <select value={selectedDefensiveStat} onChange={handleDefensiveStatChange}>
                  <option>Yards Allowed</option>
                  <option>Points Allowed</option>
                  <option>Sacks</option>
                </select>
              </div>
              <div className="vtfilter-group">
                <label>Conference</label>
                <select value={selectedConference} onChange={handleConferenceChange}>
                  {conferences.map((conf) => (
                    <option key={conf} value={conf}>{conf}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };
  
  // Function to render the active visualization
  const renderVisualization = () => {
    if (isLoading) {
      return (
        <div className="vtloading-spinner">
          <div className="vtspinner"></div>
          <p>Loading data...</p>
        </div>
      );
    }
    
    switch(activeViz) {
      case "teamWins":
        return (
          <div className="vtchart-container">
            <TeamWinsTimeline
              width={800}
              height={600}
              yearRange={selectedYearRange}
              conference={selectedConference}
              topTeamCount={topTeamCount}
            />
          </div>
        );
        
      case "pollRankings":
        return (
          <div className="vtchart-container">
            <PollsBumpChart
              width={700}
              height={450}
              pollType={selectedPollType}
              weekRange={selectedWeekRange}
            />
          </div>
        );
        
      case "playerStats":
        return (
          <div className="vtchart-container">
            <PlayerStatsChart
              width={700}
              height={450}
              player={selectedPlayer}
              statType={selectedStatType}
              weekRange={selectedWeekRange}
            />
          </div>
        );
        
      case "teamPoints":
        return (
          <div className="vtchart-container">
            <div className="vtempty-state">
              <div className="vtempty-state-icon">
                <Icons.TeamPoints />
              </div>
              <h3 className="vtempty-state-title">Coming Soon</h3>
              <p className="vtempty-state-text">
                Team Points visualization is under development and will be available soon.
              </p>
            </div>
          </div>
        );
        
      case "offenseDefense":
        return (
          <div className="vtchart-container">
            <div className="vtempty-state">
              <div className="vtempty-state-icon">
                <Icons.OffenseDefense />
              </div>
              <h3 className="vtempty-state-title">Coming Soon</h3>
              <p className="vtempty-state-text">
                Offense vs. Defense trends visualization is under development and will be available soon.
              </p>
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };

  return (
    <div 
      className={`vtvisualize-container ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`} 
      ref={dashboardRef}
    >
      {/* Mobile Menu Button */}
      <button className="vtmenu-button" onClick={toggleSidebar} aria-label="Toggle menu">
        <Icons.Menu />
      </button>
      
      {/* Sidebar with navigation */}
      <aside className={`vtdashboard-sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <header className="vtvisualize-header">
          <h1>Visualize</h1>
          <p>Interactive data & trends</p>
        </header>
        
        <div className="vtviz-nav-title">Visualizations</div>
        <ul className="vtviz-nav">
          {navItems.map((item) => (
            <li key={item.id} className="vtviz-nav-item">
              <div 
                className={`vtviz-nav-link ${activeViz === item.id ? 'active' : ''}`}
                onClick={() => {
                  setActiveViz(item.id);
                  if (window.innerWidth < 768) {
                    setSidebarCollapsed(true);
                  }
                }}
              >
                <span className="vtviz-nav-icon">{item.icon}</span>
                {item.title}
              </div>
            </li>
          ))}
        </ul>
        
        <div className="vtviz-nav-title">About</div>
        <ul className="vtviz-nav">
          {aboutItems.map((item) => (
            <li key={item.id} className="vtviz-nav-item">
              <div className="vtviz-nav-link">
                <span className="vtviz-nav-icon">{item.icon}</span>
                {item.title}
              </div>
            </li>
          ))}
        </ul>
      </aside>
      
      {/* Main content area */}
      <main className="vtdashboard-content">
        <div className="vtviz-title-bar">
          <h2>{navItems.find(item => item.id === activeViz)?.title}</h2>
          <div className="vtviz-actions">
            <button className="vtviz-action-button" title="Export data">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
            </button>
            <button className="vtviz-action-button" title="Share">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="18" cy="5" r="3"></circle>
                <circle cx="6" cy="12" r="3"></circle>
                <circle cx="18" cy="19" r="3"></circle>
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
              </svg>
            </button>
          </div>
        </div>
        
        {/* Filters for the active visualization */}
        {renderFilters()}
        
        {/* Active visualization */}
        <div className="vtvisualization-container">
          {renderVisualization()}
        </div>
      </main>
    </div>
  );
};

export default VisualizeTrends;