import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import teamsService from "../services/teamsService";
import {
  FaMapMarkerAlt,
  FaFootballBall,
  FaUserFriends,
  FaSort,
  FaSortUp,
  FaSortDown,
  FaChartBar,
  FaInfoCircle,
  FaTrophy,
  FaUniversity
} from "react-icons/fa";

const More = () => {
  // State for all player data
  const [playerData, setPlayerData] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // For now, we’re focusing on passing yards only.
  const [activePosition, setActivePosition] = useState("All");
  const [sortDirection, setSortDirection] = useState("desc");
  const [viewType, setViewType] = useState("states"); // "states" or "players"
  const [selectedState, setSelectedState] = useState(null);
  const [activeTab, setActiveTab] = useState("hometownHeroes");

  // Fetch player roster data with hometown info and team data for every FBS team,
  // then limit to passing yards and top 50 players overall.
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch team data for logos and team names
        const teamsData = await teamsService.getTeams();
        setTeams(teamsData);

        // For each team, fetch the roster and add passing yards stat
        const playersPromises = teamsData.map(async (team) => {
          const roster = await teamsService.getTeamRoster(team.name);
          return roster.map(player => ({
            ...player,
            teamName: team.name,
            teamLogo: team.logo, // assuming team object includes a 'logo' property
            // Generate passing yards stat for demonstration purposes
            passingYards: player.position === 'QB'
              ? Math.floor(Math.random() * 3500)
              : Math.floor(Math.random() * 300)
          }));
        });

        const playersArrays = await Promise.all(playersPromises);
        const allPlayers = playersArrays.flat();

        // Sort players by passing yards in descending order and limit to top 50
        const topPlayers = allPlayers
          .sort((a, b) => b.passingYards - a.passingYards)
          .slice(0, 50);

        setPlayerData(topPlayers);
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
          players: []
        };
      }

      stateGroups[player.homeState].playerCount++;
      stateGroups[player.homeState].totalPassingYards += player.passingYards || 0;

      stateGroups[player.homeState].players.push({
        id: player.id,
        name: `${player.firstName} ${player.lastName}`.trim(),
        position: player.position,
        teamName: player.teamName,
        teamLogo: player.teamLogo,
        homeCity: player.homeCity,
        homeState: player.homeState,
        passingYards: player.passingYards
      });
    });

    return Object.values(stateGroups);
  }, [playerData, activePosition]);

  // Sort state data by passing yards
  const sortedStateData = useMemo(() => {
    if (!statePerformanceData.length) return [];
    return [...statePerformanceData].sort((a, b) => {
      return sortDirection === 'desc'
        ? b.totalPassingYards - a.totalPassingYards
        : a.totalPassingYards - b.totalPassingYards;
    });
  }, [statePerformanceData, sortDirection]);

  // Get players from the selected state (sorted by passing yards) – limit to top 50 if more
  const playersFromSelectedState = useMemo(() => {
    if (!selectedState || !statePerformanceData.length) return [];
    const stateData = statePerformanceData.find(s => s.state === selectedState);
    if (!stateData) return [];
    const sortedPlayers = [...stateData.players].sort((a, b) => {
      return sortDirection === 'desc'
        ? b.passingYards - a.passingYards
        : a.passingYards - b.passingYards;
    });
    return sortedPlayers.slice(0, 50);
  }, [selectedState, statePerformanceData, sortDirection]);

  // Utility: Format numbers with commas
  const formatNumber = (num) => {
    if (!num && num !== 0) return 'N/A';
    return num.toLocaleString();
  };

  // Toggle sort direction when clicking on the passing yards column header
  const handleSortChange = () => {
    setSortDirection(sortDirection === 'desc' ? 'asc' : 'desc');
  };

  // Render sort direction indicator for passing yards column
  const renderSortIndicator = () => {
    return sortDirection === 'desc'
      ? <FaSortDown className="sort-icon active" />
      : <FaSortUp className="sort-icon active" />;
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
                <p>Geographic performance analysis showing which states produce the best talent (based on passing yards).</p>
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
            </div>
          </div>

          <div className="info-card">
            <FaInfoCircle className="info-icon" />
            <div className="info-content">
              <h3>Passing Yards Analysis</h3>
              <p>
                This visualization shows which states produce the best performing players based on <strong>Passing Yards</strong>.
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
                    <th className="metric-col" onClick={handleSortChange}>
                      <FaUserFriends className="col-icon" />
                      <span>Players</span>
                    </th>
                    <th className="metric-col" onClick={handleSortChange}>
                      <FaFootballBall className="col-icon" />
                      <span>Passing</span>
                      {renderSortIndicator()}
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
                        <td className="metric-col">{state.playerCount}</td>
                        <td className="metric-col">{formatNumber(state.totalPassingYards)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="no-data">No data available for selected criteria</td>
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
                <h3>{selectedState} Players - Passing Yards</h3>
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
                      <th className="metric-col" onClick={handleSortChange}>
                        <span>Passing</span>
                        {renderSortIndicator()}
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
                      <FaFootballBall className="metric-icon" />
                      <span className="top-metric">
                        {formatNumber(sortedStateData[0].totalPassingYards)}
                      </span>
                      <span className="metric-label">Passing Yards</span>
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
                      {sortedStateData[0].state} leads in passing yards with {formatNumber(sortedStateData[0].totalPassingYards)}
                    </li>
                    <li>
                      Top 3 states account for {formatNumber(
                        sortedStateData.slice(0, 3).reduce((sum, state) =>
                          sum + state.totalPassingYards, 0)
                      )} passing yards
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
        
        .filter-control {
          display: flex;
          flex-direction: column;
        }
        
        .filter-control label {
          margin-bottom: 5px;
          font-size: 0.9rem;
          font-weight: 600;
          color: #666;
        }
        
        .filter-control select {
          padding: 8px 12px;
          border: 1px solid #ddd;
          border-radius: 6px;
          font-size: 0.95rem;
          background-color: white;
          min-width: 180px;
          cursor: pointer;
        }
        
        .filter-control select:focus {
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
