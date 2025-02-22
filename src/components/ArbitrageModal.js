import React, { useState, useMemo } from "react";
import "../styles/ArbitrageModal.css";

/* 
  Example game object shape:
  {
    id: "game123",
    week: 5,
    homeTeam: "Ohio State",
    awayTeam: "Texas",
    homeScore: 24,
    awayScore: 17,
    lines: [
      {
        provider: "Buckeye Bets",
        // Spread values:
        homeSpread: -3.5,         // e.g., Ohio State is favored by 3.5 points
        homeSpreadOdds: "-110",    // odds for the spread market on Ohio State
        awaySpread: +3.5,          // Texas's spread (the opposite)
        awaySpreadOdds: "-110",
        // Moneyline values:
        homeMoneyline: "-200",
        awayMoneyline: "+170"
      },
      {
        provider: "Lone Star Lines",
        homeSpread: -4.0,
        homeSpreadOdds: "-115",
        awaySpread: +4.0,
        awaySpreadOdds: "-105",
        homeMoneyline: "-180",
        awayMoneyline: "+150"
      },
      // ... more line objects if available
    ]
  }
*/

/* 
  Convert American odds (for spreads, O/U, or moneylines) to decimal odds.
  For example: +150 becomes 2.50, -120 becomes 1.83.
*/
const convertOddsToDecimal = (odds) => {
  const o = parseFloat(odds);
  if (Number.isNaN(o)) return null;
  return o > 0 ? o / 100 + 1 : 100 / Math.abs(o) + 1;
};

/* 
  Find the best arbitrage pair for spread markets.
  We compare the home spread odds from one line with the away spread odds
  from another (from different sportsbooks). A valid arbitrage exists if:
    (1 / decimalHomeSpreadOdds) + (1 / decimalAwaySpreadOdds) < 1.
  The best (lowest sum) is chosen.
*/
const findBestSpreadArbitragePair = (lines) => {
  let bestPair = null;
  let bestSum = Infinity;
  for (let i = 0; i < lines.length; i++) {
    for (let j = 0; j < lines.length; j++) {
      if (i === j) continue;
      // Ensure different sportsbooks
      if (lines[i].provider === lines[j].provider) continue;
      const decimalHome = convertOddsToDecimal(lines[i].homeSpreadOdds);
      const decimalAway = convertOddsToDecimal(lines[j].awaySpreadOdds);
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

/* 
  Find the best arbitrage pair for moneyline markets.
  We compare the home moneyline from one line with the away moneyline
  from another (from different sportsbooks). A valid arbitrage exists if:
    (1 / decimalHomeMoneyline) + (1 / decimalAwayMoneyline) < 1.
  The best (lowest sum) is chosen.
*/
const findBestMoneylineArbitragePair = (lines) => {
  let bestPair = null;
  let bestSum = Infinity;
  for (let i = 0; i < lines.length; i++) {
    for (let j = 0; j < lines.length; j++) {
      if (i === j) continue;
      if (lines[i].provider === lines[j].provider) continue;
      const decimalHome = convertOddsToDecimal(lines[i].homeMoneyline);
      const decimalAway = convertOddsToDecimal(lines[j].awayMoneyline);
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
  // State for user-input total stake
  const [totalStake, setTotalStake] = useState(100);

  // Find best spread arbitrage pair
  const bestSpreadPair = useMemo(() => {
    if (!game || !game.lines || game.lines.length === 0) return null;
    return findBestSpreadArbitragePair(game.lines);
  }, [game]);

  // Find best moneyline arbitrage pair
  const bestMoneylinePair = useMemo(() => {
    if (!game || !game.lines || game.lines.length === 0) return null;
    return findBestMoneylineArbitragePair(game.lines);
  }, [game]);

  const handleStakeChange = (e) => {
    setTotalStake(Number(e.target.value));
  };

  // Calculation helper: given decimal odds, compute stakes etc.
  const calculateStakes = (decimalHome, decimalAway) => {
    const denom = 1 / decimalHome + 1 / decimalAway;
    const stakeHome = (totalStake * (1 / decimalHome)) / denom;
    const stakeAway = (totalStake * (1 / decimalAway)) / denom;
    const guaranteedReturn = stakeHome * decimalHome; // same as stakeAway * decimalAway
    const profit = guaranteedReturn - totalStake;
    const calculatedProfitMargin = (profit / totalStake) * 100;
    return { stakeHome, stakeAway, guaranteedReturn, profit, calculatedProfitMargin };
  };

  // For Spread arbitrage calculations
  const spreadCalc = bestSpreadPair
    ? calculateStakes(bestSpreadPair.decimalHome, bestSpreadPair.decimalAway)
    : null;
  // For Moneyline arbitrage calculations
  const moneylineCalc = bestMoneylinePair
    ? calculateStakes(bestMoneylinePair.decimalHome, bestMoneylinePair.decimalAway)
    : null;

  // Use team names (or abbreviations if available)
  const homeAbbr = game.homeTeam;
  const awayAbbr = game.awayTeam;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        {/* Modal Header */}
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
          <h3>Market Overview</h3>

          {/* Table of all lines from each sportsbook */}
          {game.lines && game.lines.length > 0 ? (
            <table className="odds-table">
              <thead>
                <tr>
                  <th>Sportsbook</th>
                  <th>Spread (Odds)</th>
                  <th>Moneyline</th>
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
                      {homeAbbr}: {line.homeSpread} ({line.homeSpreadOdds}) |{" "}
                      {awayAbbr}: {line.awaySpread} ({line.awaySpreadOdds})
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

          {/* Spread Arbitrage Section */}
          <h4 style={{ marginTop: "1rem" }}>Spread Arbitrage</h4>
          {bestSpreadPair ? (
            <div className="arbitrage-calculator">
              <p className="arbitrage-condition">
                <strong>Sum of Implied Probabilities:</strong>{" "}
                {bestSpreadPair.sumProb.toFixed(3)} <br />
                <strong>Profit Margin:</strong>{" "}
                {bestSpreadPair.profitMargin.toFixed(2)}%
              </p>

              <div className="pair-details">
                <div className="pair-item">
                  <h4>{homeAbbr}</h4>
                  <img
                    src={getSportsbookLogo(bestSpreadPair.homeLine.provider)}
                    alt={bestSpreadPair.homeLine.provider}
                    className="sportsbook-logo"
                  />
                  <p>{bestSpreadPair.homeLine.provider}</p>
                  <p>
                    Spread: {bestSpreadPair.homeLine.homeSpread} (Odds:{" "}
                    {bestSpreadPair.homeLine.homeSpreadOdds})
                  </p>
                  <p>
                    Decimal:{" "}
                    {bestSpreadPair.decimalHome
                      ? bestSpreadPair.decimalHome.toFixed(2)
                      : "N/A"}
                  </p>
                </div>
                <div className="pair-item">
                  <h4>{awayAbbr}</h4>
                  <img
                    src={getSportsbookLogo(bestSpreadPair.awayLine.provider)}
                    alt={bestSpreadPair.awayLine.provider}
                    className="sportsbook-logo"
                  />
                  <p>{bestSpreadPair.awayLine.provider}</p>
                  <p>
                    Spread: {bestSpreadPair.awayLine.awaySpread} (Odds:{" "}
                    {bestSpreadPair.awayLine.awaySpreadOdds})
                  </p>
                  <p>
                    Decimal:{" "}
                    {bestSpreadPair.decimalAway
                      ? bestSpreadPair.decimalAway.toFixed(2)
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
                  Stake on {homeAbbr}: ${spreadCalc.stakeHome.toFixed(2)}
                </p>
                <p>
                  Stake on {awayAbbr}: ${spreadCalc.stakeAway.toFixed(2)}
                </p>
                <p>Guaranteed Return: ${spreadCalc.guaranteedReturn.toFixed(2)}</p>
                <p>
                  Profit: ${spreadCalc.profit.toFixed(2)} (
                  {spreadCalc.calculatedProfitMargin.toFixed(2)}%)
                </p>
              </div>
            </div>
          ) : (
            <p>
              <strong>No guaranteed spread arbitrage found.</strong>
            </p>
          )}

          {/* Moneyline Arbitrage Section */}
          <h4 style={{ marginTop: "1rem" }}>Moneyline Arbitrage</h4>
          {bestMoneylinePair ? (
            <div className="arbitrage-calculator">
              <p className="arbitrage-condition">
                <strong>Sum of Implied Probabilities:</strong>{" "}
                {bestMoneylinePair.sumProb.toFixed(3)} <br />
                <strong>Profit Margin:</strong>{" "}
                {bestMoneylinePair.profitMargin.toFixed(2)}%
              </p>

              <div className="pair-details">
                <div className="pair-item">
                  <h4>{homeAbbr}</h4>
                  <img
                    src={getSportsbookLogo(bestMoneylinePair.homeLine.provider)}
                    alt={bestMoneylinePair.homeLine.provider}
                    className="sportsbook-logo"
                  />
                  <p>{bestMoneylinePair.homeLine.provider}</p>
                  <p>ML: {bestMoneylinePair.homeLine.homeMoneyline}</p>
                  <p>
                    Decimal:{" "}
                    {bestMoneylinePair.decimalHome
                      ? bestMoneylinePair.decimalHome.toFixed(2)
                      : "N/A"}
                  </p>
                </div>
                <div className="pair-item">
                  <h4>{awayAbbr}</h4>
                  <img
                    src={getSportsbookLogo(bestMoneylinePair.awayLine.provider)}
                    alt={bestMoneylinePair.awayLine.provider}
                    className="sportsbook-logo"
                  />
                  <p>{bestMoneylinePair.awayLine.provider}</p>
                  <p>ML: {bestMoneylinePair.awayLine.awayMoneyline}</p>
                  <p>
                    Decimal:{" "}
                    {bestMoneylinePair.decimalAway
                      ? bestMoneylinePair.decimalAway.toFixed(2)
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
                  Stake on {homeAbbr}: ${moneylineCalc.stakeHome.toFixed(2)}
                </p>
                <p>
                  Stake on {awayAbbr}: ${moneylineCalc.stakeAway.toFixed(2)}
                </p>
                <p>Guaranteed Return: ${moneylineCalc.guaranteedReturn.toFixed(2)}</p>
                <p>
                  Profit: ${moneylineCalc.profit.toFixed(2)} (
                  {moneylineCalc.calculatedProfitMargin.toFixed(2)}%)
                </p>
              </div>
            </div>
          ) : (
            <p>
              <strong>No guaranteed moneyline arbitrage found.</strong>
            </p>
          )}
        </div>

        {/* Modal Footer */}
        <div className="modal-footer">
          <button
            className="place-bet-button"
            onClick={onPlaceBet}
            disabled={!bestSpreadPair && !bestMoneylinePair}
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