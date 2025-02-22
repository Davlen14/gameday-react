import React, { useState } from "react";
import ArbitrageModal from "./ArbitrageModal";

const Arbitrage = ({ oddsData, getSportsbookLogo, getTeamLogo }) => {
  const [selectedGame, setSelectedGame] = useState(null);

  const openModal = (game) => {
    setSelectedGame(game);
  };

  const closeModal = () => {
    setSelectedGame(null);
  };

  if (!oddsData || oddsData.length === 0) {
    return <p>No arbitrage opportunities available.</p>;
  }

  return (
    <div className="arbitrage-container">
      {oddsData.map((game) => (
        <div
          key={game.id}
          className="game-card"
          onClick={() => openModal(game)}
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

          {/* Compare Sportsbooks in a Table */}
          <div className="odds-comparison">
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
          </div>
        </div>
      ))}
      {selectedGame && (
        <ArbitrageModal
          game={selectedGame}
          onClose={closeModal}
          getTeamLogo={getTeamLogo}
          getSportsbookLogo={getSportsbookLogo}
        />
      )}
    </div>
  );
};

export default Arbitrage;