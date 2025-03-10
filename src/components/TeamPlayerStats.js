import React, { useState, useEffect } from "react";
import teamsService from "../services/teamsService";

const TeamPlayerStats = ({ teamName, year = 2024 }) => {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showInfoCard, setShowInfoCard] = useState(false);
  const [selectedStat, setSelectedStat] = useState(null);

  useEffect(() => {
    const fetchPlayerStats = async () => {
      try {
        setLoading(true);
        // Fetch PPA player data for the given team and year
        const data = await teamsService.getPPAPlayers(teamName, year);
        setPlayers(data);
      } catch (err) {
        setError(err.message || "Error fetching player stats.");
      } finally {
        setLoading(false);
      }
    };

    if (teamName) {
      fetchPlayerStats();
    }
  }, [teamName, year]);

  // Helper function to determine color based on value
  const getValueColor = (value, category) => {
    // Customized thresholds based on the stat category
    const thresholds = {
      default: { low: 0, medium: 0.5 },
      all: { low: 0.2, medium: 0.5 },
      pass: { low: 0.3, medium: 0.6 },
      rush: { low: 0.2, medium: 0.4 },
    };
    
    const { low, medium } = thresholds[category] || thresholds.default;
    
    if (value === null || value === undefined || isNaN(value)) return "";
    if (value < low) return "low-value";
    if (value < medium) return "medium-value";
    return "high-value";
  };

  // Helper function to get info for stats
  const getStatInfo = (stat) => {
    const statInfoMap = {
      all: "Overall average PPA (Predicted Points Added) across all plays. This measures a player's total contribution.",
      pass: "Average PPA on passing plays. Higher values indicate more effective passing contributions.",
      rush: "Average PPA on rushing plays. Higher values indicate more effective rushing contributions.",
      firstDown: "Average PPA on first down plays. Shows effectiveness at starting drives.",
      secondDown: "Average PPA on second down plays. Indicates ability to create manageable third downs.",
      thirdDown: "Average PPA on third down plays. Measures ability to convert crucial downs.",
      standardDowns: "Average PPA on standard downs (likely to gain enough yardage). Shows baseline effectiveness.",
      passingDowns: "Average PPA on obvious passing downs. Indicates performance under pressure situations.",
      totalAll: "Total cumulative PPA across all plays. This measures overall impact on the season.",
      totalPass: "Total cumulative PPA on passing plays for the season.",
      totalRush: "Total cumulative PPA on rushing plays for the season.",
    };
    
    return statInfoMap[stat] || "Statistical measurement of player performance";
  };

  if (loading) {
    return (
      <div className="team-player-stats">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <div className="loading-text">Loading player statistics...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="team-player-stats">
        <div className="error-container">
          <div className="error-icon">⚠️</div>
          <div className="error-message">Error: {error}</div>
          <button className="retry-button" onClick={() => window.location.reload()}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Sort players by overall impact (totalPPA.all) in descending order
  const sortedPlayers = [...players].sort(
    (a, b) => b.totalPPA.all - a.totalPPA.all
  );
  
  // Identify the top 5 impact players
  const impactPlayers = sortedPlayers.slice(0, 5);
  
  // Remaining players for the table
  const remainingPlayers = sortedPlayers.slice(5);

  return (
    <div className="team-player-stats">
      <div className="stats-header">
        <h1>{teamName} Player Stats <span className="year-badge">{year}</span></h1>
        <button 
          className="info-button" 
          onClick={() => setShowInfoCard(!showInfoCard)}
        >
          {showInfoCard ? "Hide Stat Definitions" : "What Do These Stats Mean?"}
        </button>
      </div>

      {showInfoCard && (
        <div className="info-card">
          <div className="info-card-header">
            <h3>Understanding PPA (Predicted Points Added) Statistics</h3>
            <button className="close-button" onClick={() => setShowInfoCard(false)}>×</button>
          </div>
          <div className="info-card-content">
            <p>PPA measures the expected points added on each play, based on down, distance, and field position. Higher values indicate more positive contributions.</p>
            
            <div className="stat-definitions">
              <div className="stat-definition">
                <h4>Average PPA</h4>
                <p>The average points contribution per play type. Higher is better.</p>
              </div>
              <div className="stat-definition">
                <h4>Total PPA</h4>
                <p>The cumulative sum of all PPA values. Represents overall season impact.</p>
              </div>
              <div className="legend">
                <div className="legend-item">
                  <span className="legend-color high-legend"></span>
                  <span>High Impact</span>
                </div>
                <div className="legend-item">
                  <span className="legend-color medium-legend"></span>
                  <span>Medium Impact</span>
                </div>
                <div className="legend-item">
                  <span className="legend-color low-legend"></span>
                  <span>Low Impact</span>
                </div>
              </div>
            </div>
            
            {selectedStat && (
              <div className="selected-stat-info">
                <h4>{selectedStat}</h4>
                <p>{getStatInfo(selectedStat)}</p>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="impact-players-section">
        <h2 className="section-title">Top Impact Players</h2>
        <div className="impact-players-container">
          {impactPlayers.map((player, index) => (
            <div className="impact-player-card" key={player.id}>
              <div className="player-card-inner">
                <div className="player-image-container">
                  <div className="player-avatar">
                    {player.name.split(" ").map(name => name[0]).join("")}
                  </div>
                  <div className="player-position">{player.position}</div>
                </div>
                <div className="player-info">
                  <h3 className="player-name">{player.name}</h3>
                  <div className="player-rank">#{index + 1} Impact Player</div>
                  <div className="player-stats">
                    <div className="stat-box">
                      <div className="stat-value">{player.totalPPA.all.toFixed(2)}</div>
                      <div className="stat-label">Total PPA</div>
                    </div>
                    <div className="stat-box">
                      <div className="stat-value">{player.averagePPA.all.toFixed(2)}</div>
                      <div className="stat-label">Avg PPA</div>
                    </div>
                    <div className="stat-box">
                      <div className="stat-value">{Math.max(player.averagePPA.pass, player.averagePPA.rush).toFixed(2)}</div>
                      <div className="stat-label">{player.averagePPA.pass > player.averagePPA.rush ? "Pass" : "Rush"}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="regular-players-section">
        <h2 className="section-title">All Players Statistics</h2>
        <div className="table-container">
          <table className="stats-table">
            <thead>
              <tr>
                <th rowSpan="2" className="sticky-col">Player</th>
                <th colSpan="4">Average PPA</th>
                <th colSpan="4">Total PPA</th>
              </tr>
              <tr>
                <th 
                  onClick={() => setSelectedStat("all")}
                  className={selectedStat === "all" ? "selected-header" : ""}
                >All</th>
                <th 
                  onClick={() => setSelectedStat("pass")}
                  className={selectedStat === "pass" ? "selected-header" : ""}
                >Pass</th>
                <th 
                  onClick={() => setSelectedStat("rush")}
                  className={selectedStat === "rush" ? "selected-header" : ""}
                >Rush</th>
                <th 
                  onClick={() => setSelectedStat("thirdDown")}
                  className={selectedStat === "thirdDown" ? "selected-header" : ""}
                >3rd Down</th>
                <th 
                  onClick={() => setSelectedStat("totalAll")}
                  className={selectedStat === "totalAll" ? "selected-header" : ""}
                >All</th>
                <th 
                  onClick={() => setSelectedStat("totalPass")}
                  className={selectedStat === "totalPass" ? "selected-header" : ""}
                >Pass</th>
                <th 
                  onClick={() => setSelectedStat("totalRush")}
                  className={selectedStat === "totalRush" ? "selected-header" : ""}
                >Rush</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {remainingPlayers.map((player) => (
                <tr key={player.id}>
                  <td className="player-cell sticky-col">
                    <div className="table-player-info">
                      <div className="table-player-avatar">
                        {player.name.split(" ").map(name => name[0]).join("")}
                      </div>
                      <div className="table-player-details">
                        <div className="table-player-name">{player.name}</div>
                        <div className="table-player-position">{player.position}</div>
                      </div>
                    </div>
                  </td>
                  <td className={getValueColor(player.averagePPA.all, "all")}>
                    {player.averagePPA.all.toFixed(2)}
                  </td>
                  <td className={getValueColor(player.averagePPA.pass, "pass")}>
                    {player.averagePPA.pass.toFixed(2)}
                  </td>
                  <td className={getValueColor(player.averagePPA.rush, "rush")}>
                    {player.averagePPA.rush.toFixed(2)}
                  </td>
                  <td className={getValueColor(player.averagePPA.thirdDown, "thirdDown")}>
                    {player.averagePPA.thirdDown.toFixed(2)}
                  </td>
                  <td className={getValueColor(player.totalPPA.all, "all")}>
                    {player.totalPPA.all.toFixed(2)}
                  </td>
                  <td className={getValueColor(player.totalPPA.pass, "pass")}>
                    {player.totalPPA.pass.toFixed(2)}
                  </td>
                  <td className={getValueColor(player.totalPPA.rush, "rush")}>
                    {player.totalPPA.rush.toFixed(2)}
                  </td>
                  <td>
                    <button className="view-details-button">View</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Embedded CSS for modern styling */}
      <style>{`
        .team-player-stats {
          font-family: 'Inter', 'Helvetica Neue', Helvetica, Arial, sans-serif;
          padding: 30px;
          background: #f8fafc;
          color: #1e293b;
          line-height: 1.6;
          max-width: 1200px;
          margin: 0 auto;
          border-radius: 12px;
          box-shadow: 0 4px 6px rgba(0,0,0,0.05);
        }

        /* Header Styles */
        .stats-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
          padding-bottom: 15px;
          border-bottom: 2px solid #e2e8f0;
        }

        h1 {
          font-size: 2rem;
          font-weight: 700;
          margin: 0;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .year-badge {
          background: linear-gradient(135deg, #3b82f6, #2563eb);
          color: white;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 0.9rem;
          font-weight: 600;
        }

        .section-title {
          font-size: 1.5rem;
          font-weight: 600;
          margin: 40px 0 20px;
          position: relative;
          display: inline-block;
        }

        .section-title:after {
          content: '';
          position: absolute;
          bottom: -8px;
          left: 0;
          width: 60px;
          height: 4px;
          background: linear-gradient(90deg, #3b82f6, #60a5fa);
          border-radius: 2px;
        }

        /* Impact Players Cards */
        .impact-players-container {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 20px;
          margin-bottom: 40px;
        }

        .impact-player-card {
          background: white;
          border-radius: 12px;
          overflow: hidden;
          transition: transform 0.3s, box-shadow 0.3s;
          perspective: 1000px;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
        }

        .impact-player-card:hover {
          transform: translateY(-10px);
          box-shadow: 0 12px 20px rgba(0, 0, 0, 0.15);
        }

        .player-card-inner {
          background: linear-gradient(180deg, #f7f7f7 0%, #ffffff 100%);
          border-radius: 12px;
          overflow: hidden;
          height: 100%;
        }

        .player-image-container {
          background: linear-gradient(135deg, #3b82f6, #1e40af);
          padding: 20px;
          display: flex;
          flex-direction: column;
          align-items: center;
          position: relative;
        }

        .player-avatar {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.8rem;
          font-weight: 700;
          color: #1e40af;
          box-shadow: 0 4px 10px rgba(0,0,0,0.2);
          z-index: 2;
          position: relative;
        }

        .player-position {
          background: rgba(255, 255, 255, 0.9);
          color: #1e40af;
          padding: 4px 12px;
          border-radius: 20px;
          font-weight: 600;
          font-size: 0.8rem;
          position: absolute;
          bottom: -10px;
          z-index: 3;
          box-shadow: 0 2px 6px rgba(0,0,0,0.1);
        }

        .player-info {
          padding: 25px 20px 20px;
          text-align: center;
        }

        .player-name {
          margin: 0 0 5px;
          font-size: 1.2rem;
          font-weight: 700;
          color: #1e293b;
        }

        .player-rank {
          color: #64748b;
          font-size: 0.9rem;
          margin-bottom: 15px;
          font-weight: 500;
        }

        .player-stats {
          display: flex;
          justify-content: space-between;
          margin-top: 15px;
          padding-top: 15px;
          border-top: 1px solid #e2e8f0;
        }

        .stat-box {
          flex: 1;
          text-align: center;
        }

        .stat-value {
          font-size: 1.2rem;
          font-weight: 700;
          color: #1e40af;
        }

        .stat-label {
          font-size: 0.75rem;
          color: #64748b;
          margin-top: 5px;
        }

        /* Regular Players Table */
        .table-container {
          overflow-x: auto;
          border-radius: 10px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.08);
          background: white;
        }

        .stats-table {
          width: 100%;
          border-collapse: collapse;
          white-space: nowrap;
        }

        .stats-table th, .stats-table td {
          padding: 12px 15px;
          text-align: center;
          border-bottom: 1px solid #e2e8f0;
          font-size: 0.9rem;
        }

        .stats-table th {
          background-color: #f1f5f9;
          font-weight: 600;
          color: #475569;
          position: sticky;
          top: 0;
          z-index: 10;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .stats-table th:hover {
          background-color: #e2e8f0;
        }

        .stats-table th.selected-header {
          background-color: #dbeafe;
          color: #1e40af;
          box-shadow: inset 0 -2px 0 #3b82f6;
        }

        .sticky-col {
          position: sticky;
          left: 0;
          background-color: #f8fafc;
          z-index: 9;
          border-right: 1px solid #e2e8f0;
        }

        .stats-table tr:hover td {
          background-color: #f8fafc;
        }

        .table-player-info {
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 180px;
          padding: 5px 0;
        }

        .table-player-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: linear-gradient(135deg, #3b82f6, #1e40af);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 0.8rem;
          flex-shrink: 0;
        }

        .table-player-details {
          text-align: left;
        }

        .table-player-name {
          font-weight: 600;
          font-size: 0.9rem;
          color: #1e293b;
        }

        .table-player-position {
          font-size: 0.75rem;
          color: #64748b;
          margin-top: 3px;
        }

        .low-value {
          background-color: rgba(239, 68, 68, 0.1);
          color: #b91c1c;
          font-weight: 600;
        }

        .medium-value {
          background-color: rgba(245, 158, 11, 0.1);
          color: #b45309;
          font-weight: 600;
        }

        .high-value {
          background-color: rgba(34, 197, 94, 0.1);
          color: #15803d;
          font-weight: 600;
        }

        .view-details-button {
          background: transparent;
          color: #3b82f6;
          border: 1px solid #3b82f6;
          border-radius: 4px;
          padding: 4px 10px;
          font-size: 0.8rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .view-details-button:hover {
          background: #3b82f6;
          color: white;
        }

        /* Info Button & Card */
        .info-button {
          background: linear-gradient(135deg, #3b82f6, #2563eb);
          color: white;
          border: none;
          border-radius: 6px;
          padding: 8px 16px;
          font-size: 0.9rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 2px 5px rgba(37, 99, 235, 0.3);
        }

        .info-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(37, 99, 235, 0.4);
        }

        .info-card {
          background: white;
          border-radius: 12px;
          box-shadow: 0 8px 25px rgba(0,0,0,0.1);
          margin-bottom: 30px;
          overflow: hidden;
          animation: slideDown 0.3s ease-out;
        }

        .info-card-header {
          background: linear-gradient(135deg, #3b82f6, #2563eb);
          color: white;
          padding: 15px 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .info-card-header h3 {
          margin: 0;
          font-size: 1.2rem;
          font-weight: 600;
        }

        .close-button {
          background: none;
          border: none;
          color: white;
          font-size: 1.5rem;
          cursor: pointer;
          opacity: 0.8;
          transition: opacity 0.2s;
        }

        .close-button:hover {
          opacity: 1;
        }

        .info-card-content {
          padding: 20px;
        }

        .stat-definitions {
          display: flex;
          flex-wrap: wrap;
          gap: 20px;
          margin-top: 15px;
        }

        .stat-definition {
          flex: 1;
          min-width: 250px;
          background: #f8fafc;
          padding: 15px;
          border-radius: 8px;
          border-left: 4px solid #3b82f6;
        }

        .stat-definition h4 {
          margin: 0 0 10px;
          color: #1e40af;
        }

        .stat-definition p {
          margin: 0;
          font-size: 0.9rem;
          color: #475569;
        }

        .selected-stat-info {
          margin-top: 20px;
          padding: 15px;
          background: #dbeafe;
          border-radius: 8px;
          animation: fadeIn 0.3s;
        }

        .selected-stat-info h4 {
          margin: 0 0 10px;
          color: #1e40af;
        }

        .selected-stat-info p {
          margin: 0;
          color: #1e293b;
        }

        .legend {
          display: flex;
          gap: 15px;
          margin-top: 20px;
          justify-content: center;
          flex-wrap: wrap;
        }

        .legend-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.85rem;
          color: #475569;
        }

        .legend-color {
          width: 20px;
          height: 12px;
          border-radius: 3px;
        }

        .high-legend {
          background-color: rgba(34, 197, 94, 0.2);
          border: 1px solid #15803d;
        }

        .medium-legend {
          background-color: rgba(245, 158, 11, 0.2);
          border: 1px solid #b45309;
        }

        .low-legend {
          background-color: rgba(239, 68, 68, 0.2);
          border: 1px solid #b91c1c;
        }

        /* Loading and Error States */
        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px 0;
          gap: 20px;
        }

        .loading-spinner {
          width: 50px;
          height: 50px;
          border: 4px solid rgba(59, 130, 246, 0.2);
          border-left-color: #3b82f6;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        .loading-text {
          font-size: 1rem;
          color: #64748b;
          font-weight: 500;
        }

        .error-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 40px 20px;
          gap: 15px;
          text-align: center;
        }

        .error-icon {
          font-size: 3rem;
          margin-bottom: 10px;
        }

        .error-message {
          font-size: 1.1rem;
          color: #ef4444;
          margin-bottom: 20px;
        }

        .retry-button {
          background: #ef4444;
          color: white;
          border: none;
          border-radius: 6px;
          padding: 10px 20px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .retry-button:hover {
          background: #dc2626;
        }

        /* Animations */
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        /* Media Queries */
        @media (max-width: 768px) {
          .team-player-stats {
            padding: 20px 15px;
          }

          .stats-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 15px;
          }

          h1 {
            font-size: 1.6rem;
          }

          .info-button {
            width: 100%;
          }

          .impact-players-container {
            grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
            gap: 15px;
          }

          .player-stats {
            flex-direction: column;
            gap: 10px;
          }

          .stat-box {
            padding: 8px 0;
            border-bottom: 1px solid #e2e8f0;
          }

          .stat-box:last-child {
            border-bottom: none;
          }

          .stat-definitions {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
};

export default TeamPlayerStats;

