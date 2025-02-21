// TeamGameStats.js
import React from "react";

const TeamGameStats = ({ gameStats }) => {
  if (!gameStats || gameStats.length === 0) {
    return <div>No Team Stats Available</div>;
  }

  return (
    <div className="team-game-stats">
      {gameStats.map((game) => (
        <div key={game.id} className="game-stats">
          <h2>Game ID: {game.id}</h2>
          <div className="teams">
            {game.teams.map((team) => (
              <div key={team.teamId} className="team-stats">
                <h3>
                  {team.team} ({team.homeAway})
                </h3>
                <p>
                  <strong>Points:</strong> {team.points}
                </p>
                <ul>
                  {team.stats.map((stat, index) => (
                    <li key={index}>
                      <strong>{stat.category}:</strong> {stat.stat}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default TeamGameStats;