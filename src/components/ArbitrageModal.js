import React, { useState, useMemo } from "react";
import "../styles/ArbitrageModal.css";

/* 
  Convert American moneyline (e.g., -110, +200) to decimal odds.
  +150 => 2.50, -120 => 1.83, etc.
*/
const convertMoneylineToDecimal = (ml) => {
  const m = parseFloat(ml);
  if (Number.isNaN(m)) return null; // Handle bad data gracefully
  return m > 0 ? m / 100 + 1 : 100 / Math.abs(m) + 1;
};

/* 
  Check all pairs of lines from different sportsbooks to see if
  sum of implied probabilities < 1. The best (lowest sum) is chosen.
*/
const findBestArbitragePair = (lines) => {
  let bestPair = null;
  let bestSum = Infinity;

  for (let i = 0; i < lines.length; i++) {
    for (let j = 0; j < lines.length; j++) {
      if (i === j) continue; 
      // Ensure different sportsbooks for a 2-way arbitrage
      if (lines[i].provider === lines[j].provider) continue;

      const decimalHome = convertMoneylineToDecimal(lines[i].homeMoneyline);
      const decimalAway = convertMoneylineToDecimal(lines[j].awayMoneyline);

      // If we have invalid data, skip
      if (!decimalHome || !decimalAway) continue;

      const sumProb = 1 / decimalHome + 1 / decimalAway;
      if (sumProb < 1 && sumProb < bestSum) {
        bestSum = sumProb;
        bestPair = {
          homeLine: lines[i],
          awayLine: lines[j],
          decimalHome,
          decimalAway,
          sumProb,
          profitMargin: (1 - sumProb) * 100,
        };
      }
    }
  }
  return bestPair;
};

const ArbitrageModal = ({
  game,
  onClose,
  onPlaceBet,
  getTeamLogo,
  getSportsbookLogo,
}) => {
  /* Example game object shape:
     {
       id,
       week,
       homeTeam,
       awayTeam,
       homeScore,
       awayScore,
       lines: [
         { provider, homeMoneyline, awayMoneyline, ... },
         ...
       ]
     }
  */

  // State for user-input total stake
  const [totalStake, setTotalStake] = useState(100);

  // Attempt to find a best arbitrage pair among the lines
  const bestPair = useMemo(() => {
    if (!game || !game.lines || game.lines.length === 0) return null;
    return findBestArbitragePair(game.lines);
  }, [game]);

  const handleStakeChange = (e) => {
    setTotalStake(Number(e.target.value));
  };

  // If we found an arbitrage pair, calculate the stakes/returns
  let stakeHome = 0,
    stakeAway = 0,
    guaranteedReturn = 0,
    profit = 0,
    calculatedProfitMargin = 0;

  if (bestPair) {
    const { decimalHome, decimalAway } = bestPair;
    const denom = 1 / decimalHome + 1 / decimalAway;
    stakeHome = (totalStake * (1 / decimalHome)) / denom;
    stakeAway = (totalStake * (1 / decimalAway)) / denom;
    guaranteedReturn = stakeHome * decimalHome; // same as stakeAway * decimalAway
    profit = guaranteedReturn - totalStake;
    calculatedProfitMargin = (profit / totalStake) * 100;
  }

  // We'll use abbreviations or short forms if you have them;
  // otherwise, fallback to the full name.
  const homeAbbr = game.homeTeam;
  const awayAbbr = game.awayTeam;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        {/* Modal Header (Simplified) */}
        <div className="modal-header">
          <div>
            <div className="game-week">Week {game.week}</div>
          </div>
          <button className="close-button" onClick={onClose}>
            ×
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body">
          <h3>{bestPair ? "Arbitrage Opportunity" : "Market Overview"}</h3>

          {/* Table of all lines from each sportsbook */}
          {game.lines && game.lines.length > 0 ? (
            <table className="odds-table">
              <thead>
                <tr>
                  <th>Sportsbook</th>
                  <th>Moneylines</th>
                </tr>
              </thead>
              <tbody>
                {game.lines.map((line, index) => (
                  <tr key={index}>
                    <td>
                      <img
                        src={getSportsbookLogo(line.provider)}
                        alt={line.provider}
                        className="sportsbook-logo"
                      />
                      <span>{line.provider}</span>
                    </td>
                    <td>
                      {homeAbbr}: {line.homeMoneyline} | {awayAbbr}: {line.awayMoneyline}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>No lines available from selected sportsbooks.</p>
          )}

          {/* Arbitrage Calculator Section */}
          {bestPair ? (
            <div className="arbitrage-calculator">
              <p className="arbitrage-condition">
                <strong>Sum of Implied Probabilities:</strong>{" "}
                {bestPair.sumProb.toFixed(3)} <br />
                <strong>Profit Margin:</strong>{" "}
                {bestPair.profitMargin.toFixed(2)}%
              </p>

              <div className="pair-details">
                <div className="pair-item">
                  <h4>{homeAbbr}</h4>
                  <img
                    src={getSportsbookLogo(bestPair.homeLine.provider)}
                    alt={bestPair.homeLine.provider}
                    className="sportsbook-logo"
                  />
                  <p>{bestPair.homeLine.provider}</p>
                  <p>ML: {bestPair.homeLine.homeMoneyline}</p>
                  <p>
                    Decimal:{" "}
                    {bestPair.decimalHome
                      ? bestPair.decimalHome.toFixed(2)
                      : "N/A"}
                  </p>
                </div>
                <div className="pair-item">
                  <h4>{awayAbbr}</h4>
                  <img
                    src={getSportsbookLogo(bestPair.awayLine.provider)}
                    alt={bestPair.awayLine.provider}
                    className="sportsbook-logo"
                  />
                  <p>{bestPair.awayLine.provider}</p>
                  <p>ML: {bestPair.awayLine.awayMoneyline}</p>
                  <p>
                    Decimal:{" "}
                    {bestPair.decimalAway
                      ? bestPair.decimalAway.toFixed(2)
                      : "N/A"}
                  </p>
                </div>
              </div>

              <div className="stake-input">
                <label>Total Stake ($):</label>
                <input
                  type="number"
                  value={totalStake}
                  onChange={handleStakeChange}
                />
              </div>
              <div className="calculation-results">
                <p>
                  Stake on {homeAbbr}: ${stakeHome.toFixed(2)}
                </p>
                <p>
                  Stake on {awayAbbr}: ${stakeAway.toFixed(2)}
                </p>
                <p>Guaranteed Return: ${guaranteedReturn.toFixed(2)}</p>
                <p>
                  Profit: ${profit.toFixed(2)} (
                  {calculatedProfitMargin.toFixed(2)}%)
                </p>
              </div>
            </div>
          ) : (
            <p style={{ marginTop: "1rem" }}>
              <strong>No guaranteed arbitrage found.</strong>
            </p>
          )}
        </div>

        {/* Modal Footer */}
        <div className="modal-footer">
          <button
            className="place-bet-button"
            onClick={onPlaceBet}
            disabled={!bestPair}
          >
            Save Bet
          </button>
          <button className="close-button-footer" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ArbitrageModal;