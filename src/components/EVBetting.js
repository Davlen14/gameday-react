import React from "react";

const EVBetting = ({ oddsData, getSportsbookLogo }) => {
  if (!oddsData || oddsData.length === 0) {
    return <p>No positive EV bets available.</p>;
  }

  return (
    <div>
      <h2>Positive EV Betting Opportunities</h2>
      {oddsData.map((game) => (
        <div key={game.id} className="ev-game">
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
                  <strong>{line.provider}</strong> - Over/Under: {line.overUnder}, Spread: {line.spread}
                </p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default EVBetting;