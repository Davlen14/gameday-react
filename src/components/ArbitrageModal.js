import React, { useState, useMemo } from "react";
import "../styles/ArbitrageModal.css";

const convertMoneylineToDecimal = (ml) => {
  const m = parseFloat(ml);
  return m > 0 ? m / 100 + 1 : 100 / Math.abs(m) + 1;
};

const findBestArbitragePair = (lines) => {
  let bestPair = null;
  let bestSum = Infinity;
  for (let i = 0; i < lines.length; i++) {
    for (let j = 0; j < lines.length; j++) {
      if (lines[i].provider === lines[j].provider) continue; // Ensure different sportsbooks
      const decimalHome = convertMoneylineToDecimal(lines[i].homeMoneyline);
      const decimalAway = convertMoneylineToDecimal(lines[j].awayMoneyline);
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

const ArbitrageModal = ({ game, onClose, onPlaceBet, getTeamLogo, getSportsbookLogo }) => {
  // game: { id, week, homeTeam, awayTeam, homeScore, awayScore, lines }
  const [totalStake, setTotalStake] = useState(100);

  const bestPair = useMemo(() => {
    if (!game || !game.lines || game.lines.length === 0) return null;
    return findBestArbitragePair(game.lines);
  }, [game]);

  const handleStakeChange = (e) => {
    setTotalStake(Number(e.target.value));
  };

  // Calculate stakes if arbitrage exists
  let stakeHome = 0, stakeAway = 0, guaranteedReturn = 0, profit = 0, calculatedProfitMargin = 0;
  if (bestPair) {
    const { decimalHome, decimalAway } = bestPair;
    const denom = 1 / decimalHome + 1 / decimalAway;
    stakeHome = (totalStake * (1 / decimalHome)) / denom;
    stakeAway = (totalStake * (1 / decimalAway)) / denom;
    guaranteedReturn = stakeHome * decimalHome; // (or stakeAway * decimalAway)
    profit = guaranteedReturn - totalStake;
    calculatedProfitMargin = (profit / totalStake) * 100;
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        {/* Modal Header */}
        <div className="modal-header">
          <div className="game-info">
            <div className="team">
              <img src={getTeamLogo(game.homeTeam)} alt={game.homeTeam} className="team-logo" />
              <span className="team-name">{game.homeTeam}</span>
            </div>
            <span className="versus">vs</span>
            <div className="team">
              <img src={getTeamLogo(game.awayTeam)} alt={game.awayTeam} className="team-logo" />
              <span className="team-name">{game.awayTeam}</span>
            </div>
            <div className="game-week">Week {game.week}</div>
          </div>
          <button className="close-button" onClick={onClose}>
            ×
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body">
          {bestPair ? (
            <div className="arbitrage-calculator">
              <h3>Arbitrage Opportunity</h3>
              <div className="pair-details">
                <div className="pair-item">
                  <h4>Home Bet</h4>
                  <img
                    src={getSportsbookLogo(bestPair.homeLine.provider)}
                    alt={bestPair.homeLine.provider}
                    className="sportsbook-logo"
                  />
                  <p>{bestPair.homeLine.provider}</p>
                  <p>Moneyline: {bestPair.homeLine.homeMoneyline}</p>
                  <p>Decimal: {bestPair.decimalHome.toFixed(2)}</p>
                </div>
                <div className="pair-item">
                  <h4>Away Bet</h4>
                  <img
                    src={getSportsbookLogo(bestPair.awayLine.provider)}
                    alt={bestPair.awayLine.provider}
                    className="sportsbook-logo"
                  />
                  <p>{bestPair.awayLine.provider}</p>
                  <p>Moneyline: {bestPair.awayLine.awayMoneyline}</p>
                  <p>Decimal: {bestPair.decimalAway.toFixed(2)}</p>
                </div>
              </div>
              <p className="arbitrage-condition">
                Sum of Implied Probabilities: {bestPair.sumProb.toFixed(3)} <br />
                Profit Margin: {bestPair.profitMargin.toFixed(2)}%
              </p>
              <div className="stake-input">
                <label>Total Stake ($):</label>
                <input type="number" value={totalStake} onChange={handleStakeChange} />
              </div>
              <div className="calculation-results">
                <p>
                  Stake on {game.homeTeam}: ${stakeHome.toFixed(2)}
                </p>
                <p>
                  Stake on {game.awayTeam}: ${stakeAway.toFixed(2)}
                </p>
                <p>Guaranteed Return: ${guaranteedReturn.toFixed(2)}</p>
                <p>
                  Profit: ${profit.toFixed(2)} ({calculatedProfitMargin.toFixed(2)}%)
                </p>
              </div>
            </div>
          ) : (
            <p>No arbitrage opportunity available for this game.</p>
          )}
        </div>

        {/* Modal Footer */}
        <div className="modal-footer">
          <button className="place-bet-button" onClick={onPlaceBet} disabled={!bestPair}>
            Place Bet
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