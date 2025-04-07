import React, { useState, useMemo, useEffect } from "react";
import "../styles/ArbitrageModal.css";
import { 
  FaTimes, 
  FaChartBar, 
  FaMoneyBillWave, 
  FaExchangeAlt, 
  FaCalculator,
  FaSave,
  FaChartLine,
  FaInfoCircle,
  FaArrowUp,
  FaArrowDown
} from "react-icons/fa";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const ArbitrageModal = ({
  game,
  onClose,
  onPlaceBet,
  getTeamLogo,
  getSportsbookLogo,
}) => {
  // Main state
  const [totalStake, setTotalStake] = useState(100);
  const [activeTab, setActiveTab] = useState("overview");
  const [stakeAllocation, setStakeAllocation] = useState({}); // For custom stake allocation
  const [profitVisualization, setProfitVisualization] = useState(false);
  
  // Convert American odds to decimal (reused from your code)
  const convertOddsToDecimal = (odds) => {
    const o = parseFloat(odds);
    if (Number.isNaN(o)) return null;
    return o > 0 ? o / 100 + 1 : 100 / Math.abs(o) + 1;
  };

  // Find best spread arbitrage pair (reused from your code)
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

  // Find best moneyline arbitrage pair (reused from your code)
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

  // Find all potential arbitrage pairs (not just the best)
  const findAllArbitragePairs = (lines, type) => {
    const pairs = [];
    
    for (let i = 0; i < lines.length; i++) {
      for (let j = 0; j < lines.length; j++) {
        if (i === j) continue;
        if (lines[i].provider === lines[j].provider) continue;
        
        let decimalHome, decimalAway;
        
        if (type === 'moneyline') {
          decimalHome = convertOddsToDecimal(lines[i].homeMoneyline);
          decimalAway = convertOddsToDecimal(lines[j].awayMoneyline);
        } else if (type === 'spread') {
          decimalHome = convertOddsToDecimal(lines[i].homeSpreadOdds);
          decimalAway = convertOddsToDecimal(lines[j].awaySpreadOdds);
        }
        
        if (!decimalHome || !decimalAway) continue;
        
        const sumProb = 1 / decimalHome + 1 / decimalAway;
        
        if (sumProb < 1) {
          pairs.push({
            homeLine: lines[i],
            awayLine: lines[j],
            decimalHome,
            decimalAway,
            sumProb,
            profitMargin: (1 - sumProb) * 100,
            type
          });
        }
      }
    }
    
    return pairs.sort((a, b) => b.profitMargin - a.profitMargin);
  };

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
  
  // Find all arbitrage opportunities
  const allArbitrageOpportunities = useMemo(() => {
    if (!game || !game.lines || game.lines.length === 0) return [];
    
    const moneylinePairs = findAllArbitragePairs(game.lines, 'moneyline');
    const spreadPairs = findAllArbitragePairs(game.lines, 'spread');
    
    return [...moneylinePairs, ...spreadPairs].sort((a, b) => b.profitMargin - a.profitMargin);
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
    
    return { 
      stakeHome, 
      stakeAway, 
      guaranteedReturn, 
      profit, 
      calculatedProfitMargin,
      homePercentage: (stakeHome / totalStake) * 100,
      awayPercentage: (stakeAway / totalStake) * 100
    };
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
  
  // Setup chart data for profit visualization
  const profitChartData = useMemo(() => {
    if (!bestMoneylinePair) return null;
    
    const stakeValues = [50, 100, 200, 500, 1000, 2000];
    const profitValues = stakeValues.map(stake => {
      const denom = 1 / bestMoneylinePair.decimalHome + 1 / bestMoneylinePair.decimalAway;
      const stakeHome = (stake * (1 / bestMoneylinePair.decimalHome)) / denom;
      const stakeAway = (stake * (1 / bestMoneylinePair.decimalAway)) / denom;
      const guaranteedReturn = stakeHome * bestMoneylinePair.decimalHome;
      return guaranteedReturn - stake;
    });
    
    return {
      labels: stakeValues.map(stake => `$${stake}`),
      datasets: [
        {
          label: 'Profit ($)',
          data: profitValues,
          borderColor: 'rgb(75, 192, 192)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          tension: 0.1
        }
      ]
    };
  }, [bestMoneylinePair]);
  
  // Initialize custom stake allocation
  useEffect(() => {
    if (bestMoneylinePair) {
      setStakeAllocation({
        home: moneylineCalc.stakeHome,
        away: moneylineCalc.stakeAway
      });
    }
  }, [bestMoneylinePair, moneylineCalc]);
  
  // Handle custom stake allocation
  const handleCustomStakeChange = (type, value) => {
    const newValue = Number(value);
    setStakeAllocation(prev => ({ ...prev, [type]: newValue }));
  };
  
  // Calculate custom allocation results
  const customAllocationResults = useMemo(() => {
    if (!bestMoneylinePair || !stakeAllocation.home || !stakeAllocation.away) {
      return null;
    }
    
    const totalCustomStake = stakeAllocation.home + stakeAllocation.away;
    const homeReturn = stakeAllocation.home * bestMoneylinePair.decimalHome;
    const awayReturn = stakeAllocation.away * bestMoneylinePair.decimalAway;
    
    const homeProfit = homeReturn - totalCustomStake;
    const awayProfit = awayReturn - totalCustomStake;
    
    return {
      totalStake: totalCustomStake,
      homeReturn,
      awayReturn,
      homeProfit,
      awayProfit,
      homeWinScenario: homeReturn - totalCustomStake,
      awayWinScenario: awayReturn - totalCustomStake,
    };
  }, [bestMoneylinePair, stakeAllocation]);

  return (
    <div className="modal-overlay">
      <div className="modal-content modern">
        {/* Modal Header */}
        <div className="modal-header">
          <div className="game-teams">
            <div className="team-container">
              <img
                src={getTeamLogo(game.homeTeam)}
                alt={game.homeTeam}
                className="team-logo-large"
              />
              <h3>{game.homeTeam}</h3>
            </div>
            
            <div className="versus-container">
              <span className="vs-text">VS</span>
              <div className="game-week-badge">Week {game.week}</div>
            </div>
            
            <div className="team-container">
              <img
                src={getTeamLogo(game.awayTeam)}
                alt={game.awayTeam}
                className="team-logo-large"
              />
              <h3>{game.awayTeam}</h3>
            </div>
          </div>
          
          <button className="close-button" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="modal-tabs">
          <button 
            className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <FaChartBar /> Overview
          </button>
          <button 
            className={`tab-button ${activeTab === 'moneyline' ? 'active' : ''}`}
            onClick={() => setActiveTab('moneyline')}
          >
            <FaMoneyBillWave /> Moneyline
          </button>
          <button 
            className={`tab-button ${activeTab === 'spread' ? 'active' : ''}`}
            onClick={() => setActiveTab('spread')}
          >
            <FaExchangeAlt /> Spread
          </button>
          <button 
            className={`tab-button ${activeTab === 'calculator' ? 'active' : ''}`}
            onClick={() => setActiveTab('calculator')}
          >
            <FaCalculator /> Calculator
          </button>
        </div>

        {/* Modal Body - Varies based on active tab */}
        <div className="modal-body">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="overview-tab">
              <div className="market-summary">
                <h3>Market Overview</h3>
                <div className="summary-stats">
                  <div className="stat-card">
                    <span className="stat-label">Best Moneyline Profit</span>
                    <span className="stat-value">
                      {bestMoneylinePair 
                        ? `${bestMoneylinePair.profitMargin.toFixed(2)}%` 
                        : 'None'}
                    </span>
                  </div>
                  <div className="stat-card">
                    <span className="stat-label">Best Spread Profit</span>
                    <span className="stat-value">
                      {bestSpreadPair 
                        ? `${bestSpreadPair.profitMargin.toFixed(2)}%` 
                        : 'None'}
                    </span>
                  </div>
                  <div className="stat-card">
                    <span className="stat-label">Total Opportunities</span>
                    <span className="stat-value">
                      {allArbitrageOpportunities.length}
                    </span>
                  </div>
                </div>
              </div>

              {/* All Lines Table */}
              <div className="all-lines-table">
                <h3>All Sportsbook Lines</h3>
                {game.lines && game.lines.length > 0 ? (
                  <table className="odds-table modern">
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
                          <td className="sportsbook-cell">
                            <img
                              src={getSportsbookLogo(line.provider)}
                              alt={line.provider}
                              className="sportsbook-logo"
                            />
                            <span>{line.provider}</span>
                          </td>
                          <td className="odds-cell">
                            <div className="odds-row">
                              <span className={`team-abbr ${bestSpreadPair?.homeLine.provider === line.provider ? 'highlighted' : ''}`}>
                                {homeAbbr}:
                              </span>
                              <span className={bestSpreadPair?.homeLine.provider === line.provider ? 'highlighted' : ''}>
                                {line.homeSpread} ({line.homeSpreadOdds})
                              </span>
                            </div>
                            <div className="odds-row">
                              <span className={`team-abbr ${bestSpreadPair?.awayLine.provider === line.provider ? 'highlighted' : ''}`}>
                                {awayAbbr}:
                              </span>
                              <span className={bestSpreadPair?.awayLine.provider === line.provider ? 'highlighted' : ''}>
                                {line.awaySpread} ({line.awaySpreadOdds})
                              </span>
                            </div>
                          </td>
                          <td className="odds-cell">
                            <div className="odds-row">
                              <span className={`team-abbr ${bestMoneylinePair?.homeLine.provider === line.provider ? 'highlighted' : ''}`}>
                                {homeAbbr}:
                              </span>
                              <span className={bestMoneylinePair?.homeLine.provider === line.provider ? 'highlighted' : ''}>
                                {line.homeMoneyline}
                              </span>
                            </div>
                            <div className="odds-row">
                              <span className={`team-abbr ${bestMoneylinePair?.awayLine.provider === line.provider ? 'highlighted' : ''}`}>
                                {awayAbbr}:
                              </span>
                              <span className={bestMoneylinePair?.awayLine.provider === line.provider ? 'highlighted' : ''}>
                                {line.awayMoneyline}
                              </span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="no-data-message">No lines available from selected sportsbooks.</p>
                )}
              </div>

              {/* All Arbitrage Opportunities Table */}
              {allArbitrageOpportunities.length > 0 && (
                <div className="arbitrage-opportunities">
                  <h3>All Arbitrage Opportunities</h3>
                  <table className="opportunities-table">
                    <thead>
                      <tr>
                        <th>Type</th>
                        <th>Home Sportsbook</th>
                        <th>Away Sportsbook</th>
                        <th>Profit %</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allArbitrageOpportunities.slice(0, 5).map((opp, index) => (
                        <tr key={index}>
                          <td>
                            <span className={`type-badge ${opp.type}`}>
                              {opp.type === 'moneyline' ? 'ML' : 'SPR'}
                            </span>
                          </td>
                          <td>
                            <div className="sportsbook-cell">
                              <img 
                                src={getSportsbookLogo(opp.homeLine.provider)} 
                                alt={opp.homeLine.provider}
                                className="sportsbook-logo-small" 
                              />
                              <span>{opp.homeLine.provider}</span>
                            </div>
                          </td>
                          <td>
                            <div className="sportsbook-cell">
                              <img 
                                src={getSportsbookLogo(opp.awayLine.provider)} 
                                alt={opp.awayLine.provider}
                                className="sportsbook-logo-small" 
                              />
                              <span>{opp.awayLine.provider}</span>
                            </div>
                          </td>
                          <td>
                            <span className="profit-value">
                              {opp.profitMargin.toFixed(2)}%
                            </span>
                          </td>
                          <td>
                            <button 
                              className="view-details-btn"
                              onClick={() => setActiveTab(opp.type === 'moneyline' ? 'moneyline' : 'spread')}
                            >
                              Details
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  
                  {allArbitrageOpportunities.length > 5 && (
                    <div className="see-more">
                      <button 
                        className="see-more-btn"
                        onClick={() => setActiveTab('calculator')}
                      >
                        See {allArbitrageOpportunities.length - 5} more opportunities
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Moneyline Arbitrage Tab */}
          {activeTab === 'moneyline' && (
            <div className="moneyline-tab">
              <h3>Moneyline Arbitrage</h3>
              
              {bestMoneylinePair ? (
                <div className="arbitrage-calculator">
                  <div className="profit-banner">
                    <FaMoneyBillWave className="profit-icon" />
                    <span className="profit-label">Guaranteed Profit:</span>
                    <span className="profit-value">{bestMoneylinePair.profitMargin.toFixed(2)}%</span>
                    <button 
                      className="chart-toggle"
                      onClick={() => setProfitVisualization(!profitVisualization)}
                    >
                      {profitVisualization ? 'Hide Chart' : 'Show Chart'}
                    </button>
                  </div>
                  
                  {/* Profit Visualization Chart */}
                  {profitVisualization && profitChartData && (
                    <div className="profit-chart">
                      <Line 
                        data={profitChartData} 
                        options={{
                          responsive: true,
                          plugins: {
                            legend: {
                              position: 'top',
                            },
                            title: {
                              display: true,
                              text: 'Profit by Stake Amount'
                            },
                            tooltip: {
                              callbacks: {
                                label: function(context) {
                                  return `Profit: $${context.parsed.y.toFixed(2)}`;
                                }
                              }
                            }
                          },
                        }}
                      />
                    </div>
                  )}

                  <div className="arbitrage-details">
                    <div className="arbitrage-bookmakers">
                      <div className="bookmaker-card">
                        <div className="bookmaker-header">
                          <img
                            src={getSportsbookLogo(bestMoneylinePair.homeLine.provider)}
                            alt={bestMoneylinePair.homeLine.provider}
                            className="sportsbook-logo"
                          />
                          <h4>{bestMoneylinePair.homeLine.provider}</h4>
                        </div>
                        <div className="team-bet">
                          <img
                            src={getTeamLogo(homeAbbr)}
                            alt={homeAbbr}
                            className="team-logo-small"
                          />
                          <span>{homeAbbr}</span>
                        </div>
                        <div className="odds-info">
                          <div className="odds-row">
                            <span className="odds-label">American:</span>
                            <span className="odds-value">{bestMoneylinePair.homeLine.homeMoneyline}</span>
                          </div>
                          <div className="odds-row">
                            <span className="odds-label">Decimal:</span>
                            <span className="odds-value">{bestMoneylinePair.decimalHome.toFixed(2)}</span>
                          </div>
                          <div className="odds-row">
                            <span className="odds-label">Implied %:</span>
                            <span className="odds-value">
                              {(100 / bestMoneylinePair.decimalHome).toFixed(2)}%
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="allocation-diagram">
                        <div className="stake-bar">
                          <div 
                            className="home-stake" 
                            style={{width: `${moneylineCalc.homePercentage}%`}}
                          >
                            {moneylineCalc.homePercentage.toFixed(0)}%
                          </div>
                          <div 
                            className="away-stake"
                            style={{width: `${moneylineCalc.awayPercentage}%`}}
                          >
                            {moneylineCalc.awayPercentage.toFixed(0)}%
                          </div>
                        </div>
                        <div className="stake-labels">
                          <span>Stake Allocation</span>
                        </div>
                      </div>
                      
                      <div className="bookmaker-card">
                        <div className="bookmaker-header">
                          <img
                            src={getSportsbookLogo(bestMoneylinePair.awayLine.provider)}
                            alt={bestMoneylinePair.awayLine.provider}
                            className="sportsbook-logo"
                          />
                          <h4>{bestMoneylinePair.awayLine.provider}</h4>
                        </div>
                        <div className="team-bet">
                          <img
                            src={getTeamLogo(awayAbbr)}
                            alt={awayAbbr}
                            className="team-logo-small"
                          />
                          <span>{awayAbbr}</span>
                        </div>
                        <div className="odds-info">
                          <div className="odds-row">
                            <span className="odds-label">American:</span>
                            <span className="odds-value">{bestMoneylinePair.awayLine.awayMoneyline}</span>
                          </div>
                          <div className="odds-row">
                            <span className="odds-label">Decimal:</span>
                            <span className="odds-value">{bestMoneylinePair.decimalAway.toFixed(2)}</span>
                          </div>
                          <div className="odds-row">
                            <span className="odds-label">Implied %:</span>
                            <span className="odds-value">
                              {(100 / bestMoneylinePair.decimalAway).toFixed(2)}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="stake-calculator">
                      <h4>Calculate Your Returns</h4>
                      
                      <div className="stake-input">
                        <label>Total Stake ($):</label>
                        <input
                          type="number"
                          value={totalStake}
                          onChange={handleStakeChange}
                          min="10"
                          step="10"
                        />
                      </div>
                      
                      <div className="calculation-results">
                        <div className="result-row">
                          <span className="result-label">
                            Stake on {homeAbbr}:
                          </span>
                          <span className="result-value">
                            ${moneylineCalc.stakeHome.toFixed(2)}
                          </span>
                        </div>
                        <div className="result-row">
                          <span className="result-label">
                            Stake on {awayAbbr}:
                          </span>
                          <span className="result-value">
                            ${moneylineCalc.stakeAway.toFixed(2)}
                          </span>
                        </div>
                        <div className="result-divider"></div>
                        <div className="result-row">
                          <span className="result-label">
                            Guaranteed Return:
                          </span>
                          <span className="result-value highlighted">
                            ${moneylineCalc.guaranteedReturn.toFixed(2)}
                          </span>
                        </div>
                        <div className="result-row">
                          <span className="result-label">
                            Profit:
                          </span>
                          <span className="result-value profit">
                            ${moneylineCalc.profit.toFixed(2)}
                          </span>
                        </div>
                        <div className="result-row">
                          <span className="result-label">
                            ROI:
                          </span>
                          <span className="result-value profit">
                            {moneylineCalc.calculatedProfitMargin.toFixed(2)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="no-arbitrage-message">
                  <FaInfoCircle className="info-icon" />
                  <p>No guaranteed moneyline arbitrage found for this game.</p>
                  <p>This means the combined implied probabilities from different sportsbooks exceed 100%.</p>
                </div>
              )}
            </div>
          )}

          {/* Spread Arbitrage Tab */}
          {activeTab === 'spread' && (
            <div className="spread-tab">
              <h3>Spread Arbitrage</h3>
              
              {bestSpreadPair ? (
                <div className="arbitrage-calculator">
                  <div className="profit-banner">
                    <FaMoneyBillWave className="profit-icon" />
                    <span className="profit-label">Guaranteed Profit:</span>
                    <span className="profit-value">{bestSpreadPair.profitMargin.toFixed(2)}%</span>
                  </div>

                  <div className="arbitrage-details">
                    <div className="arbitrage-bookmakers">
                      <div className="bookmaker-card">
                        <div className="bookmaker-header">
                          <img
                            src={getSportsbookLogo(bestSpreadPair.homeLine.provider)}
                            alt={bestSpreadPair.homeLine.provider}
                            className="sportsbook-logo"
                          />
                          <h4>{bestSpreadPair.homeLine.provider}</h4>
                        </div>
                        <div className="team-bet">
                          <img
                            src={getTeamLogo(homeAbbr)}
                            alt={homeAbbr}
                            className="team-logo-small"
                          />
                          <span>{homeAbbr} {bestSpreadPair.homeLine.homeSpread}</span>
                        </div>
                        <div className="odds-info">
                        <div className="odds-row">
                            <span className="odds-label">Spread:</span>
                            <span className="odds-value">{bestSpreadPair.homeLine.homeSpread}</span>
                          </div>
                          <div className="odds-row">
                            <span className="odds-label">American:</span>
                            <span className="odds-value">{bestSpreadPair.homeLine.homeSpreadOdds}</span>
                          </div>
                          <div className="odds-row">
                            <span className="odds-label">Decimal:</span>
                            <span className="odds-value">{bestSpreadPair.decimalHome.toFixed(2)}</span>
                          </div>
                          <div className="odds-row">
                            <span className="odds-label">Implied %:</span>
                            <span className="odds-value">
                              {(100 / bestSpreadPair.decimalHome).toFixed(2)}%
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="allocation-diagram">
                        <div className="stake-bar">
                          <div 
                            className="home-stake" 
                            style={{width: `${spreadCalc.homePercentage}%`}}
                          >
                            {spreadCalc.homePercentage.toFixed(0)}%
                          </div>
                          <div 
                            className="away-stake"
                            style={{width: `${spreadCalc.awayPercentage}%`}}
                          >
                            {spreadCalc.awayPercentage.toFixed(0)}%
                          </div>
                        </div>
                        <div className="stake-labels">
                          <span>Stake Allocation</span>
                        </div>
                      </div>
                      
                      <div className="bookmaker-card">
                        <div className="bookmaker-header">
                          <img
                            src={getSportsbookLogo(bestSpreadPair.awayLine.provider)}
                            alt={bestSpreadPair.awayLine.provider}
                            className="sportsbook-logo"
                          />
                          <h4>{bestSpreadPair.awayLine.provider}</h4>
                        </div>
                        <div className="team-bet">
                          <img
                            src={getTeamLogo(awayAbbr)}
                            alt={awayAbbr}
                            className="team-logo-small"
                          />
                          <span>{awayAbbr} {bestSpreadPair.awayLine.awaySpread}</span>
                        </div>
                        <div className="odds-info">
                          <div className="odds-row">
                            <span className="odds-label">Spread:</span>
                            <span className="odds-value">{bestSpreadPair.awayLine.awaySpread}</span>
                          </div>
                          <div className="odds-row">
                            <span className="odds-label">American:</span>
                            <span className="odds-value">{bestSpreadPair.awayLine.awaySpreadOdds}</span>
                          </div>
                          <div className="odds-row">
                            <span className="odds-label">Decimal:</span>
                            <span className="odds-value">{bestSpreadPair.decimalAway.toFixed(2)}</span>
                          </div>
                          <div className="odds-row">
                            <span className="odds-label">Implied %:</span>
                            <span className="odds-value">
                              {(100 / bestSpreadPair.decimalAway).toFixed(2)}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="stake-calculator">
                      <h4>Calculate Your Returns</h4>
                      
                      <div className="stake-input">
                        <label>Total Stake ($):</label>
                        <input
                          type="number"
                          value={totalStake}
                          onChange={handleStakeChange}
                          min="10"
                          step="10"
                        />
                      </div>
                      
                      <div className="calculation-results">
                        <div className="result-row">
                          <span className="result-label">
                            Stake on {homeAbbr}:
                          </span>
                          <span className="result-value">
                            ${spreadCalc.stakeHome.toFixed(2)}
                          </span>
                        </div>
                        <div className="result-row">
                          <span className="result-label">
                            Stake on {awayAbbr}:
                          </span>
                          <span className="result-value">
                            ${spreadCalc.stakeAway.toFixed(2)}
                          </span>
                        </div>
                        <div className="result-divider"></div>
                        <div className="result-row">
                          <span className="result-label">
                            Guaranteed Return:
                          </span>
                          <span className="result-value highlighted">
                            ${spreadCalc.guaranteedReturn.toFixed(2)}
                          </span>
                        </div>
                        <div className="result-row">
                          <span className="result-label">
                            Profit:
                          </span>
                          <span className="result-value profit">
                            ${spreadCalc.profit.toFixed(2)}
                          </span>
                        </div>
                        <div className="result-row">
                          <span className="result-label">
                            ROI:
                          </span>
                          <span className="result-value profit">
                            {spreadCalc.calculatedProfitMargin.toFixed(2)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="spread-note">
                    <FaInfoCircle className="info-icon" />
                    <p>
                      <strong>Note about spread bets:</strong> This calculation assumes both spread bets can't win simultaneously.
                      Depending on where the final score lands, there's a possibility of a "middle" where both bets win or a "push" 
                      where one bet wins and the other is refunded.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="no-arbitrage-message">
                  <FaInfoCircle className="info-icon" />
                  <p>No guaranteed spread arbitrage found for this game.</p>
                  <p>This means the combined implied probabilities from different sportsbooks exceed 100%.</p>
                </div>
              )}
            </div>
          )}

          {/* Advanced Calculator Tab */}
          {activeTab === 'calculator' && (
            <div className="calculator-tab">
              <h3>Arbitrage Calculator</h3>
              
              <div className="calculator-sections">
                <div className="calculator-left">
                  <h4>Standard Calculator</h4>
                  
                  {bestMoneylinePair ? (
                    <div className="standard-calculator">
                      <div className="calculator-card">
                        <div className="stake-input">
                          <label>Total Budget ($):</label>
                          <input
                            type="number"
                            value={totalStake}
                            onChange={handleStakeChange}
                            min="10"
                            step="10"
                          />
                        </div>
                        
                        <div className="calculator-results">
                          <h5>Optimal Moneyline Allocation</h5>
                          <div className="result-table">
                            <div className="result-row header">
                              <span>Team</span>
                              <span>Sportsbook</span>
                              <span>Stake</span>
                            </div>
                            <div className="result-row">
                              <span>{homeAbbr}</span>
                              <span>{bestMoneylinePair.homeLine.provider}</span>
                              <span>${moneylineCalc.stakeHome.toFixed(2)}</span>
                            </div>
                            <div className="result-row">
                              <span>{awayAbbr}</span>
                              <span>{bestMoneylinePair.awayLine.provider}</span>
                              <span>${moneylineCalc.stakeAway.toFixed(2)}</span>
                            </div>
                            <div className="result-row total">
                              <span>Total Profit</span>
                              <span>${moneylineCalc.profit.toFixed(2)}</span>
                              <span>{moneylineCalc.calculatedProfitMargin.toFixed(2)}%</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {bestSpreadPair && (
                        <div className="calculator-card">
                          <h5>Optimal Spread Allocation</h5>
                          <div className="result-table">
                            <div className="result-row header">
                              <span>Team</span>
                              <span>Sportsbook</span>
                              <span>Stake</span>
                            </div>
                            <div className="result-row">
                              <span>{homeAbbr} {bestSpreadPair.homeLine.homeSpread}</span>
                              <span>{bestSpreadPair.homeLine.provider}</span>
                              <span>${spreadCalc.stakeHome.toFixed(2)}</span>
                            </div>
                            <div className="result-row">
                              <span>{awayAbbr} {bestSpreadPair.awayLine.awaySpread}</span>
                              <span>{bestSpreadPair.awayLine.provider}</span>
                              <span>${spreadCalc.stakeAway.toFixed(2)}</span>
                            </div>
                            <div className="result-row total">
                              <span>Total Profit</span>
                              <span>${spreadCalc.profit.toFixed(2)}</span>
                              <span>{spreadCalc.calculatedProfitMargin.toFixed(2)}%</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="no-arb-message">
                      No arbitrage opportunities available for calculation.
                    </p>
                  )}
                </div>
                
                <div className="calculator-right">
                  <h4>Advanced Custom Allocation</h4>
                  
                  {bestMoneylinePair ? (
                    <div className="custom-calculator">
                      <p className="custom-intro">
                        Customize your bet allocation to create different scenarios.
                      </p>
                      
                      <div className="custom-inputs">
                        <div className="custom-stake-input">
                          <label>Stake on {homeAbbr} ({bestMoneylinePair.homeLine.provider}):</label>
                          <div className="input-with-controls">
                            <button 
                              onClick={() => handleCustomStakeChange('home', Math.max(0, stakeAllocation.home - 10))}
                              className="stake-control"
                            >
                              <FaArrowDown />
                            </button>
                            <input
                              type="number"
                              value={stakeAllocation.home}
                              onChange={(e) => handleCustomStakeChange('home', e.target.value)}
                              min="0"
                              step="10"
                            />
                            <button 
                              onClick={() => handleCustomStakeChange('home', stakeAllocation.home + 10)}
                              className="stake-control"
                            >
                              <FaArrowUp />
                            </button>
                          </div>
                        </div>
                        
                        <div className="custom-stake-input">
                          <label>Stake on {awayAbbr} ({bestMoneylinePair.awayLine.provider}):</label>
                          <div className="input-with-controls">
                            <button 
                              onClick={() => handleCustomStakeChange('away', Math.max(0, stakeAllocation.away - 10))}
                              className="stake-control"
                            >
                              <FaArrowDown />
                            </button>
                            <input
                              type="number"
                              value={stakeAllocation.away}
                              onChange={(e) => handleCustomStakeChange('away', e.target.value)}
                              min="0"
                              step="10"
                            />
                            <button 
                              onClick={() => handleCustomStakeChange('away', stakeAllocation.away + 10)}
                              className="stake-control"
                            >
                              <FaArrowUp />
                            </button>
                          </div>
                        </div>
                      </div>
                      
                      <div className="custom-results">
                        <h5>Scenario Analysis</h5>
                        
                        {customAllocationResults && (
                          <>
                            <div className="scenario-summary">
                              <div className="summary-item">
                                <span className="summary-label">Total Investment:</span>
                                <span className="summary-value">
                                  ${customAllocationResults.totalStake.toFixed(2)}
                                </span>
                              </div>
                            </div>
                            
                            <div className="scenario-table">
                              <div className="scenario-header">
                                <span>Scenario</span>
                                <span>Return</span>
                                <span>Net Profit</span>
                              </div>
                              
                              <div className="scenario-row">
                                <span className="scenario-name">
                                  If {homeAbbr} wins
                                </span>
                                <span className="scenario-return">
                                  ${customAllocationResults.homeReturn.toFixed(2)}
                                </span>
                                <span className={`scenario-profit ${customAllocationResults.homeProfit >= 0 ? 'positive' : 'negative'}`}>
                                  ${customAllocationResults.homeProfit.toFixed(2)}
                                </span>
                              </div>
                              
                              <div className="scenario-row">
                                <span className="scenario-name">
                                  If {awayAbbr} wins
                                </span>
                                <span className="scenario-return">
                                  ${customAllocationResults.awayReturn.toFixed(2)}
                                </span>
                                <span className={`scenario-profit ${customAllocationResults.awayProfit >= 0 ? 'positive' : 'negative'}`}>
                                  ${customAllocationResults.awayProfit.toFixed(2)}
                                </span>
                              </div>
                            </div>
                            
                            <div className="strategy-recommendation">
                              {customAllocationResults.homeProfit >= 0 && customAllocationResults.awayProfit >= 0 ? (
                                <div className="positive-strategy">
                                  <FaChartLine className="strategy-icon" />
                                  <span>Arbitrage Strategy: This allocation guarantees a profit regardless of outcome.</span>
                                </div>
                              ) : customAllocationResults.homeProfit >= 0 || customAllocationResults.awayProfit >= 0 ? (
                                <div className="partial-strategy">
                                  <FaExchangeAlt className="strategy-icon" />
                                  <span>Hedging Strategy: This allocation guarantees a win in one scenario but a loss in the other.</span>
                                </div>
                              ) : (
                                <div className="negative-strategy">
                                  <FaInfoCircle className="strategy-icon" />
                                  <span>Warning: This allocation results in a loss in all scenarios.</span>
                                </div>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  ) : (
                    <p className="no-arb-message">
                      No arbitrage opportunities available for custom calculation.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="modal-footer">
          <button
            className="action-button save-button"
            onClick={onPlaceBet}
            disabled={!bestSpreadPair && !bestMoneylinePair}
          >
            <FaSave className="button-icon" />
            Save Bet
          </button>
          <button className="action-button close-button-footer" onClick={onClose}>
            <FaTimes className="button-icon" />
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ArbitrageModal;