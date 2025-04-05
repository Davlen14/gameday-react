import React, { useState, useEffect } from 'react';
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

  // Debug logging
  useEffect(() => {
    console.log("PlayerGradesView Received playerStats:", playerStats);
    console.log("Home Team:", homeTeam);
    console.log("Away Team:", awayTeam);
  }, [playerStats, homeTeam, awayTeam]);

  // Enhanced filtering logic
  useEffect(() => {
    if (!playerStats || playerStats.length === 0) {
      setDisplayedPlayers([]);
      return;
    }

    let filteredPlayers = [...playerStats];

    // Position filtering logic
    if (playerPositionFilter !== 'all') {
      filteredPlayers = filteredPlayers.filter(player => {
        const position = player.position || '';
        
        switch (playerPositionFilter) {
          case 'offense':
            return ['QB', 'RB', 'WR', 'TE', 'OL'].some(p => position.includes(p));
          case 'defense':
            return ['DL', 'DE', 'DT', 'LB', 'CB', 'S', 'DB'].some(p => position.includes(p));
          case 'QB':
            return position === 'QB';
          case 'RB':
            return position === 'RB';
          case 'WR':
            return ['WR', 'TE'].includes(position);
          case 'DL':
            return ['DL', 'DE', 'DT'].some(p => position.includes(p));
          case 'LB':
            return position === 'LB';
          case 'DB':
            return ['CB', 'S', 'DB'].some(p => position.includes(p));
          default:
            return true;
        }
      });
    }

    // Sort by grade descending
    const sortedPlayers = filteredPlayers.sort((a, b) => 
      (b.grade || 0) - (a.grade || 0)
    );

    setDisplayedPlayers(sortedPlayers);
  }, [playerStats, playerPositionFilter]);

  // Render nothing if no players
  if (!playerStats || playerStats.length === 0) {
    return (
      <div className="no-player-data">
        <p>No player statistics available for this game.</p>
        <pre>{JSON.stringify(playerStats, null, 2)}</pre>
      </div>
    );
  }

  return (
    <div className="player-grades-container">
      <div className="position-filter-buttons">
        {[
          { key: 'all', label: 'All Positions' },
          { key: 'offense', label: 'Offense' },
          { key: 'defense', label: 'Defense' },
          { key: 'QB', label: 'QB' },
          { key: 'RB', label: 'RB' },
          { key: 'WR', label: 'WR/TE' },
          { key: 'DL', label: 'DL' },
          { key: 'LB', label: 'LB' },
          { key: 'DB', label: 'DB' }
        ].map(({ key, label }) => (
          <button 
            key={key}
            className={`position-button ${playerPositionFilter === key ? 'active' : ''}`}
            onClick={() => setPlayerPositionFilter(key)}
          >
            {label}
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
            {displayedPlayers.map((player, index) => (
              <tr 
                key={`${player.id || index}-${player.name}`}
                className={player.team === homeTeam ? 'home-team-row' : 'away-team-row'}
              >
                <td 
                  className="grade-cell"
                  style={{ 
                    backgroundColor: getGradeColor(player.grade || 50),
                    color: (player.grade || 50) >= 60 ? 'white' : 'black'
                  }}
                >
                  <div className="grade-value">{player.grade || 'N/A'}</div>
                  <div className="grade-text">{getGradeDescription(player.grade || 50)}</div>
                </td>
                <td>{player.name || 'Unknown Player'}</td>
                <td>{player.position || 'N/A'}</td>
                <td>
                  <div className="team-cell">
                    <img 
                      src={player.team === homeTeam ? homeLogo : awayLogo} 
                      alt={player.team} 
                      className="team-logo-tiny" 
                    />
                    <span>{player.team || 'N/A'}</span>
                  </div>
                </td>
                <td className="key-stats-cell">
                  {renderPlayerKeyStat(player) || 'No stats'}
                </td>
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
      
      <div className="grading-scale-explainer">
        {/* Existing grading scale code remains the same */}
      </div>
    </div>
  );
};

export default PlayerGradesView;
