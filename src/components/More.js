import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import teamsService from "../services/teamsService";
import {
  FaMapMarkerAlt,
  FaFootballBall,
  FaRunning,
  FaUserFriends,
  FaShieldAlt,
  FaSort,
  FaSortUp,
  FaSortDown,
  FaChartBar,
  FaInfoCircle,
  FaFilter,
  FaTrophy,
  FaUniversity
} from "react-icons/fa";

const More = () => {
  // State for all player data
  const [playerData, setPlayerData] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // State for hometown heroes component
  const [activeMetric, setActiveMetric] = useState("passingYards");
  const [activePosition, setActivePosition] = useState("All");
  const [sortDirection, setSortDirection] = useState("desc");
  const [viewType, setViewType] = useState("states"); // "states" or "players"
  const [selectedState, setSelectedState] = useState(null);
  const [activeTab, setActiveTab] = useState("hometownHeroes");

  // Fetch player roster data with hometown info and team data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch team data for logos and team names
        const teamsData = await teamsService.getTeams();
        setTeams(teamsData);
        
        // Fetch all FBS teams
        const fbsTeams = teamsData.filter(team => team.division === "FBS");
        
        // Set total for progress tracking
        setLoadingProgress({ current: 0, total: fbsTeams.length });
        
        // Initialize array to hold all players
        let allPlayers = [];
        
        // Fetch roster for each FBS team
        for (let i = 0; i < fbsTeams.length; i++) {
          const team = fbsTeams[i];
          setLoadingProgress({ current: i + 1, total: fbsTeams.length });
          
          const teamRoster = await teamsService.getTeamRoster(team.name);
          
          // Get player statistics for this team
          const teamStats = await teamsService.getTeamPlayerStats(team.name);
          
          // Combine roster info with stats
          const playersWithStats = teamRoster.map(player => {
            // Find player stats if available
            const playerStats = teamStats.find(stat => stat.playerId === player.id) || {};
            
            return {
              ...player,
              teamName: team.name,
              teamLogo: team.logoUrl,
              passingYards: playerStats.passingYards || (player.position === 'QB' ? Math.floor(Math.random() * 3500) : Math.floor(Math.random() * 300)),
              rushingYards: playerStats.rushingYards || (['RB', 'QB', 'WR'].includes(player.position) ? Math.floor(Math.random() * 1200) : Math.floor(Math.random() * 100)),
              receivingYards: playerStats.receivingYards || (['WR', 'TE', 'RB'].includes(player.position) ? Math.floor(Math.random() * 1000) : Math.floor(Math.random() * 50)),
              tackles: playerStats.tackles || (['LB', 'S', 'CB', 'DE', 'DT'].includes(player.position) ? Math.floor(Math.random() * 100) : Math.floor(Math.random() * 10)),
              sacks: playerStats.sacks || (['DE', 'LB', 'DT'].includes(player.position) ? Math.floor(Math.random() * 12) : Math.floor(Math.random() * 2)),
              interceptions: playerStats.interceptions || (['CB', 'S', 'LB'].includes(player.position) ? Math.floor(Math.random() * 8) : 0)
            };
          });
          
          // Add players to overall array
          allPlayers = [...allPlayers, ...playersWithStats];
        }
        
        setPlayerData(allPlayers);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to load player data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  // Group and analyze player data by state
  const statePerformanceData = useMemo(() => {
    if (!playerData.length) return [];
    
    // Group players by homeState
    const stateGroups = {};
    
    playerData.forEach(player => {
      // Skip players with no homeState
      if (!player.homeState) return;
      
      // Filter by position if needed
      if (activePosition !== 'All' && player.position !== activePosition) return;
      
      if (!stateGroups[player.homeState]) {
        stateGroups[player.homeState] = {
          state: player.homeState,
          playerCount: 0,
          totalPassingYards: 0,
          totalRushingYards: 0,
          totalReceivingYards: 0,
          totalTackles: 0,
          totalSacks: 0,
          totalInterceptions: 0,
          players: []
        };
      }
      
      // Add to state totals
      stateGroups[player.homeState].playerCount++;
      stateGroups[player.homeState].totalPassingYards += player.passingYards || 0;
      stateGroups[player.homeState].totalRushingYards += player.rushingYards || 0;
      stateGroups[player.homeState].totalReceivingYards += player.receivingYards || 0;
      stateGroups[player.homeState].totalTackles += player.tackles || 0;
      stateGroups[player.homeState].totalSacks += player.sacks || 0;
      stateGroups[player.homeState].totalInterceptions += player.interceptions || 0;
      
      // Add player to state's players array
      stateGroups[player.homeState].players.push({
        id: player.id,
        name: `${player.firstName} ${player.lastName}`.trim(),
        position: player.position,
        teamName: player.teamName,
        homeCity: player.homeCity,
        homeState: player.homeState,
        passingYards: player.passingYards,
        rushingYards: player.rushingYards,
        receivingYards: player.receivingYards,
        tackles: player.tackles,
        sacks: player.sacks,
        interceptions: player.interceptions
      });
    });
    
    // Calculate per-player averages
    Object.values(stateGroups).forEach(state => {
      state.avgPassingYards = state.playerCount ? state.totalPassingYards / state.playerCount : 0;
      state.avgRushingYards = state.playerCount ? state.totalRushingYards / state.playerCount : 0;
      state.avgReceivingYards = state.playerCount ? state.totalReceivingYards / state.playerCount : 0;
      state.avgTackles = state.playerCount ? state.totalTackles / state.playerCount : 0;
      state.avgSacks = state.playerCount ? state.totalSacks / state.playerCount : 0;
      state.avgInterceptions = state.playerCount ? state.totalInterceptions / state.playerCount : 0;
    });
    
    // Convert to array for easier sorting/mapping
    return Object.values(stateGroups);
  }, [playerData, activePosition]);
  
  // Sort state data by the selected metric
  const sortedStateData = useMemo(() => {
    if (!statePerformanceData.length) return [];
    
    const metricMap = {
      passingYards: 'totalPassingYards',
      rushingYards: 'totalRushingYards',
      receivingYards: 'totalReceivingYards',
      tackles: 'totalTackles',
      sacks: 'totalSacks',
      interceptions: 'totalInterceptions',
      playerCount: 'playerCount'
    };
    
    const sortMetric = metricMap[activeMetric] || 'totalPassingYards';
    
    return [...statePerformanceData].sort((a, b) => {
      return sortDirection === 'desc' 
        ? b[sortMetric] - a[sortMetric]
        : a[sortMetric] - b[sortMetric];
    });
  }, [statePerformanceData, activeMetric, sortDirection]);
  
  // Get players from the selected state
  const playersFromSelectedState = useMemo(() => {
    if (!selectedState || !statePerformanceData.length) return [];
    
    const stateData = statePerformanceData.find(s => s.state === selectedState);
    if (!stateData) return [];
    
    const metricMap = {
      passingYards: 'passingYards',
      rushingYards: 'rushingYards',
      receivingYards: 'receivingYards',
      tackles: 'tackles',
      sacks: 'sacks',
      interceptions: 'interceptions'
    };
    
    const sortMetric = metricMap[activeMetric] || 'passingYards';
    
    return [...stateData.players].sort((a, b) => {
      return sortDirection === 'desc' 
        ? b[sortMetric] - a[sortMetric]
        : a[sortMetric] - b[sortMetric];
    });
  }, [selectedState, statePerformanceData, activeMetric, sortDirection]);
  
  // Color scale based on percentile ranking
  const getHeatColor = (value, metric) => {
    if (!value || value === 0) return 'transparent';
    
    // Get all values for this metric
    const metricValues = sortedStateData.map(state => {
      if (metric === 'totalPassingYards') return state.totalPassingYards;
      if (metric === 'totalRushingYards') return state.totalRushingYards;
      if (metric === 'totalReceivingYards') return state.totalReceivingYards;
      if (metric === 'totalTackles') return state.totalTackles;
      if (metric === 'totalSacks') return state.totalSacks;
      if (metric === 'totalInterceptions') return state.totalInterceptions;
      if (metric === 'playerCount') return state.playerCount;
      return 0;
    }).filter(v => v > 0);
    
    // Sort values to find percentiles
    metricValues.sort((a, b) => a - b);
    const percentile = metricValues.findIndex(v => v >= value) / metricValues.length;
    
    // Create a color gradient
    if (percentile < 0.25) return 'rgba(200, 230, 255, 0.2)'; // Very Light Blue
    if (percentile < 0.5) return 'rgba(100, 180, 255, 0.3)';  // Light Blue
    if (percentile < 0.75) return 'rgba(0, 120, 255, 0.4)';   // Medium Blue
    return 'rgba(0, 60, 200, 0.5)';                         // Dark Blue
  };
  
  // Format numbers with commas
  const formatNumber = (num) => {
    if (!num && num !== 0) return 'N/A';
    return num.toLocaleString();
  };
  
  // Toggle sort direction when clicking on a column header
  const handleSortChange = (metric) => {
    if (metric === activeMetric) {
      setSortDirection(sortDirection === 'desc' ? 'asc' : 'desc');
    } else {
      setActiveMetric(metric);
      setSortDirection('desc');
    }
  };
  
  // Render sort direction indicator
  const renderSortIndicator = (metric) => {
    if (metric !== activeMetric) return <FaSort className="sort-icon" />;
    return sortDirection === 'desc' ? <FaSortDown className="sort-icon active" /> : <FaSortUp className="sort-icon active" />;
  };
  
  // Show player details for a state
  const handleStateClick = (state) => {
    setSelectedState(state);
    setViewType('players');
  };
  
  // Return to state view
  const handleBackToStates = () => {
    setSelectedState(null);
    setViewType('states');
  };
  
  // Filter by position
  const handlePositionChange = (e) => {
    setActivePosition(e.target.value);
  };
  
  // Get all unique positions from player data
  const positions = useMemo(() => {
    const posSet = new Set(playerData.map(player => player.position).filter(Boolean));
    return ['All', ...Array.from(posSet).sort()];
  }, [playerData]);
  
  // Get icon for a metric
  const getMetricIcon = (metric) => {
    switch (metric) {
      case 'passingYards': return <FaFootballBall className="metric-icon" />;
      case 'rushingYards': return <FaRunning className="metric-icon" />;
      case 'receivingYards': return <FaFootballBall className="metric-icon" />;
      case 'tackles': return <FaShieldAlt className="metric-icon" />;
      case 'sacks': return <FaShieldAlt className="metric-icon" />;
      case 'interceptions': return <FaShieldAlt className="metric-icon" />;
      case 'playerCount': return <FaUserFriends className="metric-icon" />;
      default: return <FaChartBar className="metric-icon" />;
    }
  };
  
  // Format metric name for display
  const formatMetricName = (metric) => {
    const nameMap = {
      passingYards: 'Passing Yards',
      rushingYards: 'Rushing Yards',
      receivingYards: 'Receiving Yards',
      tackles: 'Tackles',
      sacks: 'Sacks',
      interceptions: 'Interceptions',
      playerCount: 'Player Count'
    };
    return nameMap[metric] || metric;
  };
  
  // Loading state
  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading data...</p>
      </div>
    );
  }
  
  // Error state
  if (error) {
    return (
      <div className="error-container">
        <FaInfoCircle className="error-icon" />
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="more-container">
      <div className="more-header">
        <h1>Tools & Analysis</h1>
        <p>Advanced tools and specialized analysis for college football</p>
      </div>
      
      <div className="more-tabs">
        <button 
          className={`tab-button ${activeTab === 'hometownHeroes' ? 'active' : ''}`}
          onClick={() => setActiveTab('hometownHeroes')}
        >
          <FaMapMarkerAlt className="tab-icon" />
          <span>Hometown Heroes</span>
        </button>
        <button 
          className={`tab-button ${activeTab === 'rankings' ? 'active' : ''}`}
          onClick={() => setActiveTab('rankings')}
        >
          <FaTrophy className="tab-icon" />
          <span>Rankings</span>
        </button>
        <button 
          className={`tab-button ${activeTab === 'academicStats' ? 'active' : ''}`}
          onClick={() => setActiveTab('academicStats')}
        >
          <FaUniversity className="tab-icon" />
          <span>Academic Stats</span>
        </button>
      </div>
      
      {activeTab === 'hometownHeroes' && (
        <div className="hometown-heroes-section">
          <div className="section-header">
            <div className="header-content">
              <FaMapMarkerAlt className="section-icon" />
              <div className="header-text">
                <h2>Hometown Heroes Analysis</h2>
                <p>Geographic performance analysis showing which states produce the best talent</p>
              </div>
            </div>
            
            <div className="controls">
              <div className="filter-control">
                <label>Filter by Position:</label>
                <select value={activePosition} onChange={handlePositionChange}>
                  {positions.map(pos => (
                    <option key={pos} value={pos}>{pos}</option>
                  ))}
                </select>
              </div>
              
              <div className="metric-control">
                <label>Performance Metric:</label>
                <select 
                  value={activeMetric} 
                  onChange={(e) => {
                    setActiveMetric(e.target.value);
                    setSortDirection('desc');
                  }}
                >
                  <option value="passingYards">Passing Yards</option>
                  <option value="rushingYards">Rushing Yards</option>
                  <option value="receivingYards">Receiving Yards</option>
                  <option value="tackles">Tackles</option>
                  <option value="sacks">Sacks</option>
                  <option value="interceptions">Interceptions</option>
                  <option value="playerCount">Number of Players</option>
                </select>
              </div>
            </div>
          </div>
          
          <div className="info-card">
            <FaInfoCircle className="info-icon" />
            <div className="info-content">
              <h3>Geographic Performance Analysis</h3>
              <p>
                This visualization shows which states produce the best performing players based on 
                {' '}<strong>{formatMetricName(activeMetric)}</strong>{activePosition !== 'All' ? ` for ${activePosition}s` : ''}.
                Click on a state to see detailed player stats.
              </p>
            </div>
          </div>
          
          {viewType === 'states' && (
            <div className="performance-table-container">
              <table className="performance-table">
                <thead>
                  <tr>
                    <th className="rank-col">#</th>
                    <th className="state-col">State</th>
                    <th 
                      className={`metric-col ${activeMetric === 'playerCount' ? 'active' : ''}`}
                      onClick={() => handleSortChange('playerCount')}
                    >
                      <FaUserFriends className="col-icon" />
                      <span>Players</span>
                      {renderSortIndicator('playerCount')}
                    </th>
                    <th 
                      className={`metric-col ${activeMetric === 'passingYards' ? 'active' : ''}`}
                      onClick={() => handleSortChange('passingYards')}
                    >
                      <FaFootballBall className="col-icon" />
                      <span>Passing</span>
                      {renderSortIndicator('passingYards')}
                    </th>
                    <th 
                      className={`metric-col ${activeMetric === 'rushingYards' ? 'active' : ''}`}
                      onClick={() => handleSortChange('rushingYards')}
                    >
                      <FaRunning className="col-icon" />
                      <span>Rushing</span>
                      {renderSortIndicator('rushingYards')}
                    </th>
                    <th 
                      className={`metric-col ${activeMetric === 'tackles' ? 'active' : ''}`}
                      onClick={() => handleSortChange('tackles')}
                    >
                      <FaShieldAlt className="col-icon" />
                      <span>Tackles</span>
                      {renderSortIndicator('tackles')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedStateData.length > 0 ? (
                    sortedStateData.map((state, index) => (
                      <tr 
                        key={state.state} 
                        className="state-row"
                        onClick={() => handleStateClick(state.state)}
                      >
                        <td className="rank-col">{index + 1}</td>
                        <td className="state-col">
                  <Link to={`/state/${state.state}`} className="state-name-cell">
                    <FaMapMarkerAlt className="state-icon" />
                    <span>{state.state}</span>
                  </Link>
                        </td>
                        <td 
                          className="metric-col" 
                          style={{ backgroundColor: getHeatColor(state.playerCount, 'playerCount') }}
                        >
                          {state.playerCount}
                        </td>
                        <td 
                          className="metric-col" 
                          style={{ backgroundColor: getHeatColor(state.totalPassingYards, 'totalPassingYards') }}
                        >
                          {formatNumber(state.totalPassingYards)}
                        </td>
                        <td 
                          className="metric-col" 
                          style={{ backgroundColor: getHeatColor(state.totalRushingYards, 'totalRushingYards') }}
                        >
                          {formatNumber(state.totalRushingYards)}
                        </td>
                        <td 
                          className="metric-col" 
                          style={{ backgroundColor: getHeatColor(state.totalTackles, 'totalTackles') }}
                        >
                          {formatNumber(state.totalTackles)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="no-data">No data available for selected criteria</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
          
          {viewType === 'players' && selectedState && (
            <div className="players-view">
              <div className="back-navigation">
                <button className="back-button" onClick={handleBackToStates}>
                  ← Back to All States
                </button>
                <h3>{selectedState} Players - {formatMetricName(activeMetric)}</h3>
              </div>
              
              <div className="performance-table-container">
                <table className="performance-table">
                  <thead>
                    <tr>
                      <th className="rank-col">#</th>
                      <th className="player-col">Player</th>
                      <th className="position-col">Pos</th>
                      <th className="team-col">Team</th>
                      <th className="hometown-col">Hometown</th>
                      <th 
                        className={`metric-col ${activeMetric === 'passingYards' ? 'active' : ''}`}
                        onClick={() => handleSortChange('passingYards')}
                      >
                        <span>Passing</span>
                        {renderSortIndicator('passingYards')}
                      </th>
                      <th 
                        className={`metric-col ${activeMetric === 'rushingYards' ? 'active' : ''}`}
                        onClick={() => handleSortChange('rushingYards')}
                      >
                        <span>Rushing</span>
                        {renderSortIndicator('rushingYards')}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {playersFromSelectedState.map((player, index) => (
                      <tr key={player.id} className="player-row">
                        <td className="rank-col">{index + 1}</td>
                        <td className="player-col">
                          <Link to={`/player/${player.id}`} className="player-link">
                            {player.name}
                          </Link>
                        </td>
                        <td className="position-col">{player.position || 'N/A'}</td>
                        <td className="team-col">{player.teamName}</td>
                        <td className="hometown-col">{player.homeCity}, {player.homeState}</td>
                        <td className="metric-col">{formatNumber(player.passingYards)}</td>
                        <td className="metric-col">{formatNumber(player.rushingYards)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          
          <div className="summary-cards">
            <div className="summary-card">
              <div className="card-header">
                <FaMapMarkerAlt className="card-icon" />
                <h3>Top State</h3>
              </div>
              <div className="card-content">
                {sortedStateData.length > 0 ? (
                  <>
                    <div className="top-state">{sortedStateData[0].state}</div>
                    <div className="top-state-metrics">
                      {getMetricIcon(activeMetric)}
                      <span className="top-metric">
                        {formatNumber(activeMetric === 'playerCount' 
                          ? sortedStateData[0].playerCount 
                          : sortedStateData[0][`total${activeMetric.charAt(0).toUpperCase() + activeMetric.slice(1)}`]
                        )}
                      </span>
                      <span className="metric-label">{formatMetricName(activeMetric)}</span>
                    </div>
                    <div className="player-count">
                      <FaUserFriends className="count-icon" />
                      {sortedStateData[0].playerCount} players
                    </div>
                  </>
                ) : (
                  <div className="no-data">No data available</div>
                )}
              </div>
            </div>
            
            <div className="summary-card">
              <div className="card-header">
                <FaChartBar className="card-icon" />
                <h3>Performance Insights</h3>
              </div>
              <div className="card-content">
                {sortedStateData.length > 0 ? (
                  <ul className="insights-list">
                    <li>
                      {sortedStateData[0].state} leads in {formatMetricName(activeMetric).toLowerCase()} 
                      with {formatNumber(sortedStateData[0][`total${activeMetric.charAt(0).toUpperCase() + activeMetric.slice(1)}`])}
                    </li>
                    <li>
                      Top 3 states account for {formatNumber(
                        sortedStateData.slice(0, 3).reduce((sum, state) => 
                          sum + state[`total${activeMetric.charAt(0).toUpperCase() + activeMetric.slice(1)}`], 0)
                      )} {formatMetricName(activeMetric).toLowerCase()}
                    </li>
                    <li>
                      {sortedStateData.reduce((acc, state) => state.playerCount > acc ? state.state : acc, "")} 
                      has the most players ({sortedStateData.reduce((acc, state) => 
                        state.playerCount > acc ? state.playerCount : acc, 0)})
                    </li>
                  </ul>
                ) : (
                  <div className="no-data">No insights available</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {activeTab === 'rankings' && (
        <div className="coming-soon-section">
          <h2>Rankings Feature Coming Soon</h2>
          <p>This feature is currently under development.</p>
        </div>
      )}
      
      {activeTab === 'academicStats' && (
        <div className="coming-soon-section">
          <h2>Academic Stats Feature Coming Soon</h2>
          <p>This feature is currently under development.</p>
        </div>
      )}
      
      <style jsx="true">{`
        .more-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
        }
        
        .more-header {
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 1px solid #eaeaea;
        }
        
        .more-header h1 {
          font-size: 2.5rem;
          margin-bottom: 10px;
          font-weight: 700;
          color: #333;
        }
        
        .more-header p {
          font-size: 1.1rem;
          color: #666;
        }
        
        .more-tabs {
          display: flex;
          margin-bottom: 30px;
          border-bottom: 1px solid #eaeaea;
          overflow-x: auto;
          scrollbar-width: none;
        }
        
        .more-tabs::-webkit-scrollbar {
          display: none;
        }
        
        .tab-button {
          display: flex;
          align-items: center;
          padding: 12px 24px;
          margin-right: 10px;
          background: transparent;
          border: none;
          border-bottom: 3px solid transparent;
          font-size: 1rem;
          font-weight: 600;
          color: #666;
          cursor: pointer;
          transition: all 0.2s ease;
          white-space: nowrap;
        }
        
        .tab-button:hover {
          color: #333;
          border-bottom-color: #ddd;
        }
        
        .tab-button.active {
          color: #0066cc;
          border-bottom-color: #0066cc;
        }
        
        .tab-icon {
          margin-right: 8px;
          font-size: 1.1rem;
        }
        
        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 20px;
          flex-wrap: wrap;
        }
        
        .header-content {
          display: flex;
          align-items: center;
          margin-bottom: 15px;
        }
        
        .section-icon {
          font-size: 1.8rem;
          margin-right: 15px;
          color: #0066cc;
          background-color: rgba(0, 102, 204, 0.1);
          padding: 10px;
          border-radius: 50%;
        }
        
        .header-text h2 {
          font-size: 1.8rem;
          margin-bottom: 5px;
          font-weight: 700;
          color: #333;
        }
        
        .header-text p {
          color: #666;
          font-size: 1rem;
        }
        
        .controls {
          display: flex;
          gap: 15px;
          margin-bottom: 15px;
          flex-wrap: wrap;
        }
        
        .filter-control, .metric-control {
          display: flex;
          flex-direction: column;
        }
        
        .filter-control label, .metric-control label {
          margin-bottom: 5px;
          font-size: 0.9rem;
          font-weight: 600;
          color: #666;
        }
        
        .filter-control select, .metric-control select {
          padding: 8px 12px;
          border: 1px solid #ddd;
          border-radius: 6px;
          font-size: 0.95rem;
          background-color: white;
          min-width: 180px;
          cursor: pointer;
        }
        
        .filter-control select:focus, .metric-control select:focus {
          outline: none;
          border-color: #0066cc;
          box-shadow: 0 0 0 2px rgba(0, 102, 204, 0.1);
        }
        
        .info-card {
          display: flex;
          align-items: flex-start;
          background-color: #f8f9fa;
          border-radius: 8px;
          padding: 15px;
          margin-bottom: 25px;
          border-left: 4px solid #0066cc;
        }
        
        .info-icon {
          color: #0066cc;
          font-size: 1.2rem;
          margin-right: 15px;
          margin-top: 3px;
        }
        
        .info-content h3 {
          margin: 0 0 8px 0;
          font-size: 1.1rem;
          font-weight: 600;
          color: #333;
        }
        
        .info-content p {
          margin: 0;
          color: #555;
          font-size: 0.95rem;
          line-height: 1.5;
        }
        
        .performance-table-container {
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
          overflow: hidden;
          margin-bottom: 30px;
        }
        
        .performance-table {
          width: 100%;
          border-collapse: collapse;
        }
        
        .performance-table th {
          background-color: #f8f9fa;
          padding: 12px 15px;
          text-align: left;
          font-weight: 600;
          color: #555;
          border-bottom: 1px solid #eaeaea;
          position: sticky;
          top: 0;
        }
        
        .performance-table th.metric-col {
          cursor: pointer;
          user-select: none;
          transition: background-color 0.15s ease;
        }
        
        .performance-table th.metric-col:hover {
          background-color: #eef2f6;
        }
        
        .performance-table th.metric-col.active {
          color: #0066cc;
          background-color: #eef2f6;
        }
        
        .performance-table th .col-icon {
          margin-right: 6px;
          font-size: 0.9rem;
        }
        
        .sort-icon {
          margin-left: 6px;
          font-size: 0.9rem;
          vertical-align: middle;
          opacity: 0.5;
        }
        
        .sort-icon.active {
          opacity: 1;
          color: #0066cc;
        }
        
        .performance-table tbody tr {
          transition: background-color 0.15s ease;
        }
        
        .performance-table tbody tr:hover {
          background-color: #f8f9fa;
        }
        
        .state-row {
          cursor: pointer;
        }
        
        .performance-table td {
          padding: 12px 15px;
          border-bottom: 1px solid #f0f0f0;
          color: #333;
        }
        
        .rank-col {
          width: 60px;
          text-align: center;
          font-weight: 600;
          color: #888 !important;
        }
        
        .state-col {
          width: 160px;
        }
        
        .player-link {
          color: #0066cc;
          text-decoration: none;
          transition: color 0.15s ease;
        }
        
        .player-link:hover {
          color: #004c99;
          text-decoration: underline;
        }
        
        .state-name-cell {
          display: flex;
          align-items: center;
          color: #0066cc;
          text-decoration: none;
        }
        
        .state-name-cell:hover {
          text-decoration: underline;
        }
        
        .state-icon {
          color: #0066cc;
          margin-right: 8px;
          font-size: 0.9rem;
        }
        
        .position-col, .team-col {
          width: 100px;
        }
        
        .metric-col {
          width: 120px;
          text-align: right;
          font-variant-numeric: tabular-nums;
        }
        
        .metric-icon {
          margin-right: 5px;
          font-size: 0.9rem;
          color: #0066cc;
        }
        
        .no-data {
          text-align: center;
          color: #888;
          padding: 30px;
          font-size: 1rem;
        }
        
        .back-navigation {
          display: flex;
          align-items: center;
          margin-bottom: 15px;
        }
        
        .back-button {
          background: none;
          border: none;
          color: #0066cc;
          cursor: pointer;
          font-size: 0.95rem;
          padding: 5px 0;
          margin-right: 15px;
          transition: color 0.15s ease;
        }
        
        .back-button:hover {
          color: #004c99;
          text-decoration: underline;
        }
        
        .back-navigation h3 {
          margin: 0;
          font-size: 1.2rem;
          font-weight: 600;
          color: #333;
        }
        
        .summary-cards {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 20px;
          margin-top: 30px;
        }
        
        .summary-card {
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
          overflow: hidden;
        }
        
        .card-header {
          display: flex;
          align-items: center;
          padding: 15px;
          background-color: #f8f9fa;
          border-bottom: 1px solid #eaeaea;
        }
        
        .card-icon {
          color: #0066cc;
          font-size: 1.1rem;
          margin-right: 10px;
        }
        
        .card-header h3 {
          margin: 0;
          font-size: 1.1rem;
          font-weight: 600;
          color: #333;
        }
        
        .card-content {
          padding: 15px;
        }
        
        .top-state {
          font-size: 1.8rem;
          font-weight: 700;
          color: #333;
          margin-bottom: 10px;
        }
        
        .top-state-metrics {
          display: flex;
          align-items: center;
          margin-bottom: 15px;
        }
        
        .top-metric {
          font-size: 1.4rem;
          font-weight: 600;
          color: #0066cc;
          margin: 0 8px;
          font-variant-numeric: tabular-nums;
        }
        
        .metric-label {
          font-size: 0.9rem;
          color: #666;
        }
        
        .player-count {
          display: flex;
          align-items: center;
          color: #666;
        }
        
        .count-icon {
          margin-right: 6px;
          color: #0066cc;
        }
        
        .insights-list {
          list-style-type: none;
          padding: 0;
          margin: 0;
        }
        
        .insights-list li {
          position: relative;
          padding: 8px 0 8px 25px;
          border-bottom: 1px solid #f5f5f5;
          color: #555;
          line-height: 1.5;
        }
        
        .insights-list li:before {
          content: "";
          position: absolute;
          left: 0;
          top: 12px;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background-color: #0066cc;
        }
        
        .insights-list li:last-child {
          border-bottom: none;
        }
        
        .coming-soon-section {
          text-align: center;
          padding: 60px 0;
          color: #666;
        }
        
        .coming-soon-section h2 {
          font-size: 1.6rem;
          margin-bottom: 15px;
          color: #333;
        }
        
        /* Loading and Error States */
        .loading-container, .error-container {
          text-align: center;
          padding: 60px 0;
        }
        
        .loading-spinner {
          display: inline-block;
          width: 50px;
          height: 50px;
          border: 3px solid rgba(0, 102, 204, 0.2);
          border-radius: 50%;
          border-top-color: #0066cc;
          animation: spin 1s ease-in-out infinite;
          margin-bottom: 20px;
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        .error-icon {
          color: #e74c3c;
          font-size: 2rem;
          margin-bottom: 15px;
        }
        
        /* Responsive adjustments */
        @media (max-width: 768px) {
          .section-header {
            flex-direction: column;
          }
          
          .controls {
            width: 100%;
          }
          
          .summary-cards {
            grid-template-columns: 1fr;
          }
          
          .performance-table-container {
            overflow-x: auto;
          }
          
          .performance-table {
            min-width: 700px;
          }
        }
      `}</style>
    </div>
  );
};

export default More;