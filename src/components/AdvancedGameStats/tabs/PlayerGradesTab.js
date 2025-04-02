import React, { useState } from 'react';
import { getGradeColor, getGradeDescription, renderPlayerKeyStat } from '../../../utils/gradingUtils';

const PlayerGradesTab = ({ 
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
        {[
          { label: 'All Positions', value: 'all' },
          { label: 'Offense', value: 'offense' },
          { label: 'Defense', value: 'defense' },
          { label: 'QB', value: 'QB' },
          { label: 'RB', value: 'RB' },
          { label: 'WR/TE', value: 'WR' },
          { label: 'DL', value: 'DL' },
          { label: 'LB', value: 'LB' },
          { label: 'DB', value: 'DB' }
        ].map(filter => (
          <button 
            key={filter.value}
            className={`position-button ${playerPositionFilter === filter.value ? 'active' : ''}`}
            onClick={() => setPlayerPositionFilter(filter.value)}
          >
            {filter.label}
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
          {[
            { range: "90-100", description: "Elite", color: "#2ecc71" },
            { range: "80-89", description: "Excellent", color: "#27ae60" },
            { range: "70-79", description: "Very Good", color: "#3498db" },
            { range: "60-69", description: "Above Average", color: "#2980b9" },
            { range: "50-59", description: "Average", color: "#f1c40f" },
            { range: "40-49", description: "Below Average", color: "#e67e22" },
            { range: "30-39", description: "Poor", color: "#e74c3c" },
            { range: "0-29", description: "Very Poor", color: "#c0392b" }
          ].map((grade, index) => (
            <div key={index} className="grade-scale-item">
              <div 
                className="grade-scale-color" 
                style={{ backgroundColor: grade.color }}
              ></div>
              <div className="grade-scale-text">{`${grade.range}: ${grade.description}`}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PlayerGradesTab;