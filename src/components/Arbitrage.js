import React from "react";

const Arbitrage = ({ oddsData, getSportsbookLogo }) => {
  if (!oddsData || oddsData.length === 0) {
    return <p>No arbitrage opportunities available.</p>;
  }

  return (
    <div>
      <h2>Arbitrage Betting Opportunities</h2>
      {oddsData.map((game) => (
        <div key={game.id} className="arbitrage-game">
          <h3>
            {game.homeTeam} vs {game.awayTeam} (Week {game.week})
          </h3>
          <div className="odds-list">
            {game.lines.map((line, index) => (
              <div key={index} className="odds-item">
                <img
                  src={getSportsbookLogo(line.provider)}
                  alt={line.provider}
                  className="sportsbook-logo"
                />
                <p>
                  <strong>{line.provider}</strong> - Home: {line.homeMoneyline}, Away: {line.awayMoneyline}
                </p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default Arbitrage;