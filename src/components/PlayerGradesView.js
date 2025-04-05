import React, { useState, useEffect, useMemo } from 'react';
import { 
  getGradeDescription, 
  getGradeColor, 
  renderPlayerKeyStat 
} from '../utils/statsCalculators';

const PlayerGradesView = ({ 
  playerStats, 
  homeTeam, 
  awayTeam, 
  homeLogo, 
  awayLogo 
}) => {
  const [playerPositionFilter, setPlayerPositionFilter] = useState('all');
  const [displayedPlayers, setDisplayedPlayers] = useState([]);

  // Comprehensive position mapping for flexible filtering
  const positionMappings = {
    'all': () => true,
    'offense': (pos) => ['QB', 'RB', 'WR', 'TE', 'OL'].some(p => pos.includes(p)),
    'defense': (pos) => ['DL', 'DE', 'DT', 'LB', 'CB', 'S', 'DB'].some(p => pos.includes(p)),
    'QB': (pos) => pos === 'QB',
    'RB': (pos) => pos === 'RB',
    'WR': (pos) => ['WR', 'TE'].includes(pos),
    'DL': (pos) => ['DL', 'DE', 'DT'].some(p => pos.includes(p)),
    'LB': (pos) => pos === 'LB',
    'DB': (pos) => ['CB', 'S', 'DB'].some(p => pos.includes(p))
  };

  // Debug logging for player stats
  useEffect(() => {
    console.group('Player Grades View - Data Inspection');
    console.log('Raw Player Stats:', playerStats);
    console.log('Home Team:', homeTeam);
    console.log('Away Team:', awayTeam);
    console.groupEnd();
  }, [playerStats, homeTeam, awayTeam]);

  // Memoized player processing to optimize performance
  const processedPlayers = useMemo(() => {
    if (!playerStats || playerStats.length === 0) {
      console.warn('No player stats available');
      return [];
    }

    // Safe player data transformation
    return playerStats.map(player => ({
      ...player,
      // Ensure all necessary fields have default values
      id: player.id || crypto.randomUUID(), // Unique identifier
      name: player.name || 'Unknown Player',
      position: player.position || 'N/A',
      team: player.team || 'Unknown Team',
      grade: player.grade !== undefined ? player.grade : 50,
      ppa: player.ppa !== undefined ? parseFloat(player.ppa) : 0,
      stats: player.stats || {} // Ensure stats object exists
    }));
  }, [playerStats]);

  // Filter and sort players based on position
  useEffect(() => {
    if (processedPlayers.length === 0) {
      setDisplayedPlayers([]);
      return;
    }

    const filterFn = positionMappings[playerPositionFilter] || positionMappings['all'];
    
    const filteredPlayers = processedPlayers
      .filter(player => filterFn(player.position))
      .sort((a, b) => (b.grade || 50) - (a.grade || 50));

    console.log('Filtered Players:', filteredPlayers);
    setDisplayedPlayers(filteredPlayers);
  }, [processedPlayers, playerPositionFilter]);

  // Render nothing if no players found
  if (!playerStats || playerStats.length === 0) {
    return (
      <div className="no-player-data">
        <p>No player statistics available for this game.</p>
        <details>
          <summary>Debug Information</summary>
          <pre>{JSON.stringify({ playerStats, homeTeam, awayTeam }, null, 2)}</pre>
        </details>
      </div>
    );
  }

  return (
    <div className="player-grades-container">
      {/* Position Filter Buttons */}
      <div className="position-filter-buttons">
        {Object.keys(positionMappings).map(key => (
          <button 
            key={key}
            className={`position-button ${playerPositionFilter === key ? 'active' : ''}`}
            onClick={() => setPlayerPositionFilter(key)}
          >
            {key === 'all' ? 'All Positions' : 
             key === 'offense' ? 'Offense' : 
             key === 'defense' ? 'Defense' : key}
          </button>
        ))}
      </div>
      
      <div className="player-grades-table-container">
        <table className="player-grades-table">
          <thead>
            <tr>
              <th className="grade-column">Grade</th>
              <th>Player</th>
              <th>Pos</th>
              <th>Team</th>
              <th>Key Stats</th>
              <th className="ppa-column tooltip-container">
                PPA
                <span className="tooltip-text">Predicted Points Added</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {displayedPlayers.map((player) => (
              <tr 
                key={`${player.id}-${player.name}`}
                className={player.team === homeTeam ? 'home-team-row' : 'away-team-row'}
              >
                {/* Grade Cell */}
                <td 
                  className="grade-cell"
                  style={{ 
                    backgroundColor: getGradeColor(player.grade),
                    color: player.grade >= 60 ? 'white' : 'black'
                  }}
                >
                  <div className="grade-value">{player.grade.toFixed(0)}</div>
                  <div className="grade-text">{getGradeDescription(player.grade)}</div>
                </td>
                
                {/* Player Name */}
                <td>{player.name}</td>
                
                {/* Position */}
                <td>{player.position}</td>
                
                {/* Team */}
                <td>
                  <div className="team-cell">
                    <img 
                      src={player.team === homeTeam ? homeLogo : awayLogo} 
                      alt={player.team} 
                      className="team-logo-tiny" 
                    />
                    <span>{player.team}</span>
                  </div>
                </td>
                
                {/* Key Stats */}
                <td className="key-stats-cell">
                  {renderPlayerKeyStat(player) || 'No stats available'}
                </td>
                
                {/* PPA */}
                <td className="ppa-cell">
                  {player.ppa !== undefined ? player.ppa.toFixed(2) : 'N/A'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {displayedPlayers.length === 0 && (
          <div className="no-players-found">
            <p>No players match the selected filter.</p>
          </div>
        )}
      </div>
      
      {/* Grading Scale Explainer */}
      <div className="grading-scale-explainer">
        <h4>Player Grading Scale</h4>
        <div className="grade-scale-container">
          {[
            { range: "90-100", description: "Elite", color: "#2ecc71" },
            { range: "80-89", description: "Excellent", color: "#27ae60" },
            { range: "70-79", description: "Very Good", color: "#3498db" },
            { range: "60-69", description: "Above Average", color: "#2980b9" },
            { range: "50-59", description: "Average", color: "#f1c40f" },
            { range: "40-49", description: "Below Average", color: "#e67e22" },
            { range: "30-39", description: "Poor", color: "#e74c3c" },
            { range: "0-29", description: "Very Poor", color: "#c0392b" }
          ].map(({ range, description, color }) => (
            <div key={range} className="grade-scale-item">
              <div 
                className="grade-scale-color" 
                style={{ backgroundColor: color }}
              />
              <div className="grade-scale-text">
                {range}: {description}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PlayerGradesView;
