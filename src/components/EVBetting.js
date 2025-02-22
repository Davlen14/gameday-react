import React from "react";

const EVBetting = ({ oddsData, getSportsbookLogo, getTeamLogo }) => {
  if (!oddsData || oddsData.length === 0) {
    return <p>No positive EV bets available.</p>;
  }

  return (
    <div className="ev-container modern-ev-container">
      {oddsData.map((game) => (
        <div key={game.id} className="game-card modern-game-card">
          {/* Game Header */}
          <div className="game-header">
            <div className="team-info">
              <img
                src={getTeamLogo(game.homeTeam)}
                alt={game.homeTeam}
                className="team-logo"
              />
              <span className="team-name">{game.homeTeam}</span>
            </div>
            <span className="versus">vs</span>
            <div className="team-info">
              <img
                src={getTeamLogo(game.awayTeam)}
                alt={game.awayTeam}
                className="team-logo"
              />
              <span className="team-name">{game.awayTeam}</span>
            </div>
            <div className="game-week">Week {game.week}</div>
          </div>

          {/* Odds Comparison Table */}
          <div className="odds-comparison">
            {game.lines.length > 0 ? (
              <table className="odds-table">
                <thead>
                  <tr>
                    <th>Sportsbook</th>
                    <th>Over/Under</th>
                    <th>Spread</th>
                  </tr>
                </thead>
                <tbody>
                  {game.lines.map((line, index) => (
                    <tr key={index}>
                      <td className="sportsbook">
                        <img
                          src={getSportsbookLogo(line.provider)}
                          alt={line.provider}
                          className="sportsbook-logo"
                        />
                        {line.provider}
                      </td>
                      <td>{line.overUnder}</td>
                      <td>{line.spread}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p>No lines available from selected sportsbooks.</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default EVBetting;