import React, { useState } from 'react';
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

  // Filter players based on position
  const filteredPlayers = playerPositionFilter === 'all'
    ? playerStats
    : playerStats.filter(p => {
        if (playerPositionFilter === 'offense') {
          return ['QB', 'RB', 'WR', 'TE', 'OL'].includes(p.position);
        } else if (playerPositionFilter === 'defense') {
          return ['DL', 'DE', 'DT', 'LB', 'CB', 'S', 'DB'].includes(p.position);
        } else {
          return p.position === playerPositionFilter;
        }
      });
  
  // Sort players by grade descending
  const sortedPlayers = [...filteredPlayers].sort((a, b) => (b.grade || 0) - (a.grade || 0));
  
  return (
    <div className="player-grades-container">
      <div className="position-filter-buttons">
        <button 
          className={`position-button ${playerPositionFilter === 'all' ? 'active' : ''}`}
          onClick={() => setPlayerPositionFilter('all')}
        >
          All Positions
        </button>
        <button 
          className={`position-button ${playerPositionFilter === 'offense' ? 'active' : ''}`}
          onClick={() => setPlayerPositionFilter('offense')}
        >
          Offense
        </button>
        <button 
          className={`position-button ${playerPositionFilter === 'defense' ? 'active' : ''}`}
          onClick={() => setPlayerPositionFilter('defense')}
        >
          Defense
        </button>
        <button 
          className={`position-button ${playerPositionFilter === 'QB' ? 'active' : ''}`}
          onClick={() => setPlayerPositionFilter('QB')}
        >
          QB
        </button>
        <button 
          className={`position-button ${playerPositionFilter === 'RB' ? 'active' : ''}`}
          onClick={() => setPlayerPositionFilter('RB')}
        >
          RB
        </button>
        <button 
          className={`position-button ${playerPositionFilter === 'WR' ? 'active' : ''}`}
          onClick={() => setPlayerPositionFilter('WR')}
        >
          WR/TE
        </button>
        <button 
          className={`position-button ${playerPositionFilter === 'DL' ? 'active' : ''}`}
          onClick={() => setPlayerPositionFilter('DL')}
        >
          DL
        </button>
        <button 
          className={`position-button ${playerPositionFilter === 'LB' ? 'active' : ''}`}
          onClick={() => setPlayerPositionFilter('LB')}
        >
          LB
        </button>
        <button 
          className={`position-button ${playerPositionFilter === 'DB' ? 'active' : ''}`}
          onClick={() => setPlayerPositionFilter('DB')}
        >
          DB
        </button>
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
            {sortedPlayers.map((player, index) => (
              <tr 
                key={index}
                className={player.team === homeTeam ? 'home-team-row' : 'away-team-row'}
              >
                <td 
                  className="grade-cell"
                  style={{ 
                    backgroundColor: getGradeColor(player.grade),
                    color: player.grade >= 60 ? 'white' : 'black'
                  }}
                >
                  <div className="grade-value">{player.grade}</div>
                  <div className="grade-text">{getGradeDescription(player.grade)}</div>
                </td>
                <td>{player.name}</td>
                <td>{player.position}</td>
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
                <td className="key-stats-cell">{renderPlayerKeyStat(player)}</td>
                <td className="ppa-cell">{player.ppa ? player.ppa.toFixed(2) : 'N/A'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="grading-scale-explainer">
        <h4>Player Grading Scale</h4>
        <div className="grade-scale-container">
          <div className="grade-scale-item">
            <div className="grade-scale-color" style={{ backgroundColor: "#2ecc71" }}></div>
            <div className="grade-scale-text">90-100: Elite</div>
          </div>
          <div className="grade-scale-item">
            <div className="grade-scale-color" style={{ backgroundColor: "#27ae60" }}></div>
            <div className="grade-scale-text">80-89: Excellent</div>
          </div>
          <div className="grade-scale-item">
            <div className="grade-scale-color" style={{ backgroundColor: "#3498db" }}></div>
            <div className="grade-scale-text">70-79: Very Good</div>
          </div>
          <div className="grade-scale-item">
            <div className="grade-scale-color" style={{ backgroundColor: "#2980b9" }}></div>
            <div className="grade-scale-text">60-69: Above Average</div>
          </div>
          <div className="grade-scale-item">
            <div className="grade-scale-color" style={{ backgroundColor: "#f1c40f" }}></div>
            <div className="grade-scale-text">50-59: Average</div>
          </div>
          <div className="grade-scale-item">
            <div className="grade-scale-color" style={{ backgroundColor: "#e67e22" }}></div>
            <div className="grade-scale-text">40-49: Below Average</div>
          </div>
          <div className="grade-scale-item">
            <div className="grade-scale-color" style={{ backgroundColor: "#e74c3c" }}></div>
            <div className="grade-scale-text">30-39: Poor</div>
          </div>
          <div className="grade-scale-item">
            <div className="grade-scale-color" style={{ backgroundColor: "#c0392b" }}></div>
            <div className="grade-scale-text">0-29: Very Poor</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayerGradesView;