import React, { useState, useEffect } from "react";
import "../styles/VisualizeTrends.css";
import PollsBumpChart from "./PollsBumpChart"; // D3 chart component
import PlayerStatsChart from "./PlayerStatsChart"; // D3 chart component
import TeamWinsTimeline from "./TeamWinsTimeline"; // D3 chart component for team wins
import teamsService from "../services/teamsService";

const VisualizeTrends = () => {
  // State to track which visualization is active
  const [activeViz, setActiveViz] = useState("teamWins");
  const [isLoading, setIsLoading] = useState(false);

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
  
  // Navigation item data
  const navItems = [
    {
      id: "teamWins",
      title: "Team Wins Timeline",
      icon: "📈"
    },
    {
      id: "pollRankings",
      title: "Poll Rankings",
      icon: "🏆"
    },
    {
      id: "playerStats",
      title: "Player Stats",
      icon: "🏈"
    },
    {
      id: "teamPoints",
      title: "Team Points",
      icon: "📊"
    },
    {
      id: "offenseDefense",
      title: "Offense vs Defense",
      icon: "⚔️"
    }
  ];

  // Function to render the appropriate filter controls for the active visualization
  const renderFilters = () => {
    switch(activeViz) {
      case "teamWins":
        return (
          <div className="vtfilters-container">
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
        );
        
      case "pollRankings":
        return (
          <div className="vtfilters-container">
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
        );
        
      case "playerStats":
        return (
          <div className="vtfilters-container">
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
        );
        
      case "teamPoints":
        return (
          <div className="vtfilters-container">
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
        );
        
      case "offenseDefense":
        return (
          <div className="vtfilters-container">
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
              <div className="vtempty-state-icon">📊</div>
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
              <div className="vtempty-state-icon">⚔️</div>
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
    <div className="vtvisualize-container">
      {/* Sidebar with navigation */}
      <aside className="vtdashboard-sidebar">
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
                onClick={() => setActiveViz(item.id)}
              >
                <span className="vtviz-nav-icon">{item.icon}</span>
                {item.title}
              </div>
            </li>
          ))}
        </ul>
        
        <div className="vtviz-nav-title">About</div>
        <ul className="vtviz-nav">
          <li className="vtviz-nav-item">
            <div className="vtviz-nav-link">
              <span className="vtviz-nav-icon">🔍</span>
              How to Use
            </div>
          </li>
          <li className="vtviz-nav-item">
            <div className="vtviz-nav-link">
              <span className="vtviz-nav-icon">📚</span>
              Data Sources
            </div>
          </li>
        </ul>
      </aside>
      
      {/* Main content area */}
      <main className="vtdashboard-content">
        <div className="vtviz-title-bar">
          <h2>{navItems.find(item => item.id === activeViz)?.title}</h2>
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
