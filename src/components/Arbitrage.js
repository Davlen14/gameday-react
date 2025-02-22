import React, { useState } from "react";

const Arbitrage = ({ oddsData, getSportsbookLogo, getTeamLogo }) => {
  const [expandedGameId, setExpandedGameId] = useState(null);

  const toggleExpand = (gameId) => {
    setExpandedGameId(expandedGameId === gameId ? null : gameId);
  };

  if (!oddsData || oddsData.length === 0) {
    return <p>No arbitrage opportunities available.</p>;
  }

  return (
    <div className="arbitrage-container modern-arbitrage-container">
      {oddsData.map((game) => (
        <div
          key={game.id}
          className="game-card modern-game-card"
          onClick={() => toggleExpand(game.id)}
          style={{ cursor: "pointer" }}
        >
          {/* Game Header with Team Logos */}
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

          {/* Expandable Arbitrage Details */}
          {expandedGameId === game.id && (
            <div className="arbitrage-details">
              {game.lines.length > 0 ? (
                <table className="odds-table">
                  <thead>
                    <tr>
                      <th>Sportsbook</th>
                      <th>Home ML</th>
                      <th>Away ML</th>
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
                        <td>{line.homeMoneyline}</td>
                        <td>{line.awayMoneyline}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p>No lines available from selected sportsbooks.</p>
              )}
              {/* Placeholder for arbitrage calculator details */}
              <div className="arbitrage-calculator-inline">
                <p>Arbitrage calculator details go here...</p>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default Arbitrage;