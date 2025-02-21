import React, { useState } from "react";

const Arbitrage = ({ oddsData, getSportsbookLogo, getTeamLogo }) => {
  // This state holds user-entered stakes for each game
  const [stakes, setStakes] = useState({});

  if (!oddsData || oddsData.length === 0) {
    return <p>No arbitrage opportunities available.</p>;
  }

  // Handle stake input changes
  const handleStakeChange = (gameId, provider, outcome, value) => {
    setStakes((prev) => ({
      ...prev,
      [gameId]: {
        ...prev[gameId],
        [provider]: {
          ...prev[gameId]?.[provider],
          [outcome]: value,
        },
      },
    }));
  };

  // Example function to calculate potential returns (very simplified)
  const calculateReturn = (moneyline, stake) => {
    // Example moneyline logic: If American odds, you may need to convert them to decimal
    // For demonstration, let's assume moneyline is already in decimal format
    if (!moneyline || !stake) return 0;
    return (parseFloat(moneyline) * parseFloat(stake)).toFixed(2);
  };

  return (
    <div className="arbitrage-container">
      <h2>Arbitrage Betting Opportunities</h2>
      {oddsData.map((game) => (
        <div key={game.id} className="arbitrage-game">
          <div className="arbitrage-header">
            <img
              src={getTeamLogo(game.homeTeam)}
              alt={game.homeTeam}
              className="team-logo"
            />
            <span className="team-name">{game.homeTeam}</span>
            <span className="vs-text">vs</span>
            <img
              src={getTeamLogo(game.awayTeam)}
              alt={game.awayTeam}
              className="team-logo"
            />
            <span className="team-name">{game.awayTeam}</span>
            <span className="week-label">Week {game.week}</span>
          </div>

          <div className="arbitrage-lines">
            {game.lines.map((line, index) => (
              <div key={index} className="arbitrage-line">
                <div className="provider-info">
                  <img
                    src={getSportsbookLogo(line.provider)}
                    alt={line.provider}
                    className="sportsbook-logo"
                  />
                  <strong>{line.provider}</strong>
                </div>

                <div className="moneyline-info">
                  <div className="moneyline-item">
                    <label>Home ML:</label>
                    <span>{line.homeMoneyline}</span>
                    {/* Example stake input for home side */}
                    <input
                      type="number"
                      placeholder="Stake on Home"
                      value={
                        stakes[game.id]?.[line.provider]?.homeStake || ""
                      }
                      onChange={(e) =>
                        handleStakeChange(
                          game.id,
                          line.provider,
                          "homeStake",
                          e.target.value
                        )
                      }
                    />
                    <span className="calculated-return">
                      Potential Return: $
                      {calculateReturn(
                        line.homeMoneyline,
                        stakes[game.id]?.[line.provider]?.homeStake
                      )}
                    </span>
                  </div>

                  <div className="moneyline-item">
                    <label>Away ML:</label>
                    <span>{line.awayMoneyline}</span>
                    {/* Example stake input for away side */}
                    <input
                      type="number"
                      placeholder="Stake on Away"
                      value={
                        stakes[game.id]?.[line.provider]?.awayStake || ""
                      }
                      onChange={(e) =>
                        handleStakeChange(
                          game.id,
                          line.provider,
                          "awayStake",
                          e.target.value
                        )
                      }
                    />
                    <span className="calculated-return">
                      Potential Return: $
                      {calculateReturn(
                        line.awayMoneyline,
                        stakes[game.id]?.[line.provider]?.awayStake
                      )}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default Arbitrage;