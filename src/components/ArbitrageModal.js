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
    <div className="arbmodal-overlay">
      <div className="arbmodal-content modern">
        {/* Modal Header */}
        <div className="arbmodal-header">
          <div className="arbmodal-game-teams">
            <div className="arbmodal-team-container">
              <img
                src={getTeamLogo(game.homeTeam)}
                alt={game.homeTeam}
                className="arbmodal-team-logo-large"
              />
              <h3>{game.homeTeam}</h3>
            </div>
            
            <div className="arbmodal-versus-container">
              <span className="arbmodal-vs-text">VS</span>
              <div className="arbmodal-game-week-badge">Week {game.week}</div>
            </div>
            
            <div className="arbmodal-team-container">
              <img
                src={getTeamLogo(game.awayTeam)}
                alt={game.awayTeam}
                className="arbmodal-team-logo-large"
              />
              <h3>{game.awayTeam}</h3>
            </div>
          </div>
          
          <button className="arbmodal-close-button" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="arbmodal-tabs">
          <button 
            className={`arbmodal-tab-button ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <FaChartBar /> Overview
          </button>
          <button 
            className={`arbmodal-tab-button ${activeTab === 'moneyline' ? 'active' : ''}`}
            onClick={() => setActiveTab('moneyline')}
          >
            <FaMoneyBillWave /> Moneyline
          </button>
          <button 
            className={`arbmodal-tab-button ${activeTab === 'spread' ? 'active' : ''}`}
            onClick={() => setActiveTab('spread')}
          >
            <FaExchangeAlt /> Spread
          </button>
          <button 
            className={`arbmodal-tab-button ${activeTab === 'calculator' ? 'active' : ''}`}
            onClick={() => setActiveTab('calculator')}
          >
            <FaCalculator /> Calculator
          </button>
        </div>

        {/* Modal Body - Varies based on active tab */}
        <div className="arbmodal-body">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="arbmodal-overview-tab">
              <div className="arbmodal-market-summary">
                <h3>Market Overview</h3>
                <div className="arbmodal-summary-stats">
                  <div className="arbmodal-stat-card">
                    <span className="arbmodal-stat-label">Best Moneyline Profit</span>
                    <span className="arbmodal-stat-value">
                      {bestMoneylinePair 
                        ? `${bestMoneylinePair.profitMargin.toFixed(2)}%` 
                        : 'None'}
                    </span>
                  </div>
                  <div className="arbmodal-stat-card">
                    <span className="arbmodal-stat-label">Best Spread Profit</span>
                    <span className="arbmodal-stat-value">
                      {bestSpreadPair 
                        ? `${bestSpreadPair.profitMargin.toFixed(2)}%` 
                        : 'None'}
                    </span>
                  </div>
                  <div className="arbmodal-stat-card">
                    <span className="arbmodal-stat-label">Total Opportunities</span>
                    <span className="arbmodal-stat-value">
                      {allArbitrageOpportunities.length}
                    </span>
                  </div>
                </div>
              </div>

              {/* All Lines Table */}
              <div className="arbmodal-all-lines-table">
                <h3>All Sportsbook Lines</h3>
                {game.lines && game.lines.length > 0 ? (
                  <table className="arbmodal-odds-table modern">
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
                          <td className="arbmodal-sportsbook-cell">
                            <img
                              src={getSportsbookLogo(line.provider)}
                              alt={line.provider}
                              className="arbmodal-sportsbook-logo"
                            />
                            <span>{line.provider}</span>
                          </td>
                          <td className="arbmodal-odds-cell">
                            <div className="arbmodal-odds-row">
                              <span className={`arbmodal-team-abbr ${bestSpreadPair?.homeLine.provider === line.provider ? 'highlighted' : ''}`}>
                                {homeAbbr}:
                              </span>
                              <span className={bestSpreadPair?.homeLine.provider === line.provider ? 'arbmodal-highlighted' : ''}>
                                {line.homeSpread} ({line.homeSpreadOdds})
                              </span>
                            </div>
                            <div className="arbmodal-odds-row">
                              <span className={`arbmodal-team-abbr ${bestSpreadPair?.awayLine.provider === line.provider ? 'highlighted' : ''}`}>
                                {awayAbbr}:
                              </span>
                              <span className={bestSpreadPair?.awayLine.provider === line.provider ? 'arbmodal-highlighted' : ''}>
                                {line.awaySpread} ({line.awaySpreadOdds})
                              </span>
                            </div>
                          </td>
                          <td className="arbmodal-odds-cell">
                            <div className="arbmodal-odds-row">
                              <span className={`arbmodal-team-abbr ${bestMoneylinePair?.homeLine.provider === line.provider ? 'highlighted' : ''}`}>
                                {homeAbbr}:
                              </span>
                              <span className={bestMoneylinePair?.homeLine.provider === line.provider ? 'arbmodal-highlighted' : ''}>
                                {line.homeMoneyline}
                              </span>
                            </div>
                            <div className="arbmodal-odds-row">
                              <span className={`arbmodal-team-abbr ${bestMoneylinePair?.awayLine.provider === line.provider ? 'highlighted' : ''}`}>
                                {awayAbbr}:
                              </span>
                              <span className={bestMoneylinePair?.awayLine.provider === line.provider ? 'arbmodal-highlighted' : ''}>
                                {line.awayMoneyline}
                              </span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="arbmodal-no-data-message">No lines available from selected sportsbooks.</p>
                )}
              </div>

              {/* All Arbitrage Opportunities Table */}
              {allArbitrageOpportunities.length > 0 && (
                <div className="arbmodal-arbitrage-opportunities">
                  <h3>All Arbitrage Opportunities</h3>
                  <table className="arbmodal-opportunities-table">
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
                            <span className={`arbmodal-type-badge ${opp.type}`}>
                              {opp.type === 'moneyline' ? 'ML' : 'SPR'}
                            </span>
                          </td>
                          <td>
                            <div className="arbmodal-sportsbook-cell">
                              <img 
                                src={getSportsbookLogo(opp.homeLine.provider)} 
                                alt={opp.homeLine.provider}
                                className="arbmodal-sportsbook-logo-small" 
                              />
                              <span>{opp.homeLine.provider}</span>
                            </div>
                          </td>
                          <td>
                            <div className="arbmodal-sportsbook-cell">
                              <img 
                                src={getSportsbookLogo(opp.awayLine.provider)} 
                                alt={opp.awayLine.provider}
                                className="arbmodal-sportsbook-logo-small" 
                              />
                              <span>{opp.awayLine.provider}</span>
                            </div>
                          </td>
                          <td>
                            <span className="arbmodal-profit-value">
                              {opp.profitMargin.toFixed(2)}%
                            </span>
                          </td>
                          <td>
                            <button 
                              className="arbmodal-view-details-btn"
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
                    <div className="arbmodal-see-more">
                      <button 
                        className="arbmodal-see-more-btn"
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
            <div className="arbmodal-moneyline-tab">
              <h3>Moneyline Arbitrage</h3>
              
              {bestMoneylinePair ? (
                <div className="arbmodal-arbitrage-calculator">
                  <div className="arbmodal-profit-banner">
                    <FaMoneyBillWave className="arbmodal-profit-icon" />
                    <span className="arbmodal-profit-label">Guaranteed Profit:</span>
                    <span className="arbmodal-profit-value">{bestMoneylinePair.profitMargin.toFixed(2)}%</span>
                    <button 
                      className="arbmodal-chart-toggle"
                      onClick={() => setProfitVisualization(!profitVisualization)}
                    >
                      {profitVisualization ? 'Hide Chart' : 'Show Chart'}
                    </button>
                  </div>
                  
                  {/* Profit Visualization Chart */}
                  {profitVisualization && profitChartData && (
                    <div className="arbmodal-profit-chart">
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

                  <div className="arbmodal-arbitrage-details">
                    <div className="arbmodal-arbitrage-bookmakers">
                      <div className="arbmodal-bookmaker-card">
                        <div className="arbmodal-bookmaker-header">
                          <img
                            src={getSportsbookLogo(bestMoneylinePair.homeLine.provider)}
                            alt={bestMoneylinePair.homeLine.provider}
                            className="arbmodal-sportsbook-logo"
                          />
                          <h4>{bestMoneylinePair.homeLine.provider}</h4>
                        </div>
                        <div className="arbmodal-team-bet">
                          <img
                            src={getTeamLogo(homeAbbr)}
                            alt={homeAbbr}
                            className="arbmodal-team-logo-small"
                          />
                          <span>{homeAbbr}</span>
                        </div>
                        <div className="arbmodal-odds-info">
                          <div className="arbmodal-odds-row">
                            <span className="arbmodal-odds-label">American:</span>
                            <span className="arbmodal-odds-value">{bestMoneylinePair.homeLine.homeMoneyline}</span>
                          </div>
                          <div className="arbmodal-odds-row">
                            <span className="arbmodal-odds-label">Decimal:</span>
                            <span className="arbmodal-odds-value">{bestMoneylinePair.decimalHome.toFixed(2)}</span>
                          </div>
                          <div className="arbmodal-odds-row">
                            <span className="arbmodal-odds-label">Implied %:</span>
                            <span className="arbmodal-odds-value">
                              {(100 / bestMoneylinePair.decimalHome).toFixed(2)}%
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="arbmodal-allocation-diagram">
                        <div className="arbmodal-stake-bar">
                          <div 
                            className="arbmodal-home-stake" 
                            style={{width: `${moneylineCalc.homePercentage}%`}}
                          >
                            {moneylineCalc.homePercentage.toFixed(0)}%
                          </div>
                          <div 
                            className="arbmodal-away-stake"
                            style={{width: `${moneylineCalc.awayPercentage}%`}}
                          >
                            {moneylineCalc.awayPercentage.toFixed(0)}%
                          </div>
                        </div>
                        <div className="arbmodal-stake-labels">
                          <span>Stake Allocation</span>
                        </div>
                      </div>
                      
                      <div className="arbmodal-bookmaker-card">
                        <div className="arbmodal-bookmaker-header">
                          <img
                            src={getSportsbookLogo(bestMoneylinePair.awayLine.provider)}
                            alt={bestMoneylinePair.awayLine.provider}
                            className="arbmodal-sportsbook-logo"
                          />
                          <h4>{bestMoneylinePair.awayLine.provider}</h4>
                        </div>
                        <div className="arbmodal-team-bet">
                          <img
                            src={getTeamLogo(awayAbbr)}
                            alt={awayAbbr}
                            className="arbmodal-team-logo-small"
                          />
                          <span>{awayAbbr}</span>
                        </div>
                        <div className="arbmodal-odds-info">
                          <div className="arbmodal-odds-row">
                            <span className="arbmodal-odds-label">American:</span>
                            <span className="arbmodal-odds-value">{bestMoneylinePair.awayLine.awayMoneyline}</span>
                          </div>
                          <div className="arbmodal-odds-row">
                            <span className="arbmodal-odds-label">Decimal:</span>
                            <span className="arbmodal-odds-value">{bestMoneylinePair.decimalAway.toFixed(2)}</span>
                          </div>
                          <div className="arbmodal-odds-row">
                            <span className="arbmodal-odds-label">Implied %:</span>
                            <span className="arbmodal-odds-value">
                              {(100 / bestMoneylinePair.decimalAway).toFixed(2)}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="arbmodal-stake-calculator">
                      <h4>Calculate Your Returns</h4>
                      
                      <div className="arbmodal-stake-input">
                        <label>Total Stake ($):</label>
                        <input
                          type="number"
                          value={totalStake}
                          onChange={handleStakeChange}
                          min="10"
                          step="10"
                        />
                      </div>
                      
                      <div className="arbmodal-calculation-results">
                        <div className="arbmodal-result-row">
                          <span className="arbmodal-result-label">
                            Stake on {homeAbbr}:
                          </span>
                          <span className="arbmodal-result-value">
                            ${moneylineCalc.stakeHome.toFixed(2)}
                          </span>
                        </div>
                        <div className="arbmodal-result-row">
                          <span className="arbmodal-result-label">
                            Stake on {awayAbbr}:
                          </span>
                          <span className="arbmodal-result-value">
                            ${moneylineCalc.stakeAway.toFixed(2)}
                          </span>
                        </div>
                        <div className="arbmodal-result-divider"></div>
                        <div className="arbmodal-result-row">
                          <span className="arbmodal-result-label">
                            Guaranteed Return:
                          </span>
                          <span className="arbmodal-result-value highlighted">
                            ${moneylineCalc.guaranteedReturn.toFixed(2)}
                          </span>
                        </div>
                        <div className="arbmodal-result-row">
                          <span className="arbmodal-result-label">
                            Profit:
                          </span>
                          <span className="arbmodal-result-value profit">
                            ${moneylineCalc.profit.toFixed(2)}
                          </span>
                        </div>
                        <div className="arbmodal-result-row">
                          <span className="arbmodal-result-label">
                            ROI:
                          </span>
                          <span className="arbmodal-result-value profit">
                            {moneylineCalc.calculatedProfitMargin.toFixed(2)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="arbmodal-no-arbitrage-message">
                  <FaInfoCircle className="info-icon" />
                  <p>No guaranteed moneyline arbitrage found for this game.</p>
                  <p>This means the combined implied probabilities from different sportsbooks exceed 100%.</p>
                </div>
              )}
            </div>
          )}

          {/* Spread Arbitrage Tab */}
          {activeTab === 'spread' && (
            <div className="arbmodal-spread-tab">
              <h3>Spread Arbitrage</h3>
              
              {bestSpreadPair ? (
                <div className="arbmodal-arbitrage-calculator">
                  <div className="arbmodal-profit-banner">
                    <FaMoneyBillWave className="arbmodal-profit-icon" />
                    <span className="arbmodal-profit-label">Guaranteed Profit:</span>
                    <span className="arbmodal-profit-value">{bestSpreadPair.profitMargin.toFixed(2)}%</span>
                  </div>

                  <div className="arbmodal-arbitrage-details">
                    <div className="arbmodal-arbitrage-bookmakers">
                      <div className="arbmodal-bookmaker-card">
                        <div className="arbmodal-bookmaker-header">
                          <img
                            src={getSportsbookLogo(bestSpreadPair.homeLine.provider)}
                            alt={bestSpreadPair.homeLine.provider}
                            className="arbmodal-sportsbook-logo"
                          />
                          <h4>{bestSpreadPair.homeLine.provider}</h4>
                        </div>
                        <div className="arbmodal-team-bet">
                          <img
                            src={getTeamLogo(homeAbbr)}
                            alt={homeAbbr}
                            className="arbmodal-team-logo-small"
                          />
                          <span>{homeAbbr} {bestSpreadPair.homeLine.homeSpread}</span>
                        </div>
                        <div className="arbmodal-odds-info">
                        <div className="arbmodal-odds-row">
                            <span className="arbmodal-odds-label">Spread:</span>
                            <span className="arbmodal-odds-value">{bestSpreadPair.homeLine.homeSpread}</span>
                          </div>
                          <div className="arbmodal-odds-row">
                            <span className="arbmodal-odds-label">American:</span>
                            <span className="arbmodal-odds-value">{bestSpreadPair.homeLine.homeSpreadOdds}</span>
                          </div>
                          <div className="arbmodal-odds-row">
                            <span className="arbmodal-odds-label">Decimal:</span>
                            <span className="arbmodal-odds-value">{bestSpreadPair.decimalHome.toFixed(2)}</span>
                          </div>
                          <div className="arbmodal-odds-row">
                            <span className="arbmodal-odds-label">Implied %:</span>
                            <span className="arbmodal-odds-value">
                              {(100 / bestSpreadPair.decimalHome).toFixed(2)}%
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="arbmodal-allocation-diagram">
                        <div className="arbmodal-stake-bar">
                          <div 
                            className="arbmodal-home-stake" 
                            style={{width: `${spreadCalc.homePercentage}%`}}
                          >
                            {spreadCalc.homePercentage.toFixed(0)}%
                          </div>
                          <div 
                            className="arbmodal-away-stake"
                            style={{width: `${spreadCalc.awayPercentage}%`}}
                          >
                            {spreadCalc.awayPercentage.toFixed(0)}%
                          </div>
                        </div>
                        <div className="arbmodal-stake-labels">
                          <span>Stake Allocation</span>
                        </div>
                      </div>
                      
                      <div className="arbmodal-bookmaker-card">
                        <div className="arbmodal-bookmaker-header">
                          <img
                            src={getSportsbookLogo(bestSpreadPair.awayLine.provider)}
                            alt={bestSpreadPair.awayLine.provider}
                            className="arbmodal-sportsbook-logo"
                          />
                          <h4>{bestSpreadPair.awayLine.provider}</h4>
                        </div>
                        <div className="arbmodal-team-bet">
                          <img
                            src={getTeamLogo(awayAbbr)}
                            alt={awayAbbr}
                            className="arbmodal-team-logo-small"
                          />
                          <span>{awayAbbr} {bestSpreadPair.awayLine.awaySpread}</span>
                        </div>
                        <div className="arbmodal-odds-info">
                          <div className="arbmodal-odds-row">
                            <span className="arbmodal-odds-label">Spread:</span>
                            <span className="arbmodal-odds-value">{bestSpreadPair.awayLine.awaySpread}</span>
                          </div>
                          <div className="arbmodal-odds-row">
                            <span className="arbmodal-odds-label">American:</span>
                            <span className="arbmodal-odds-value">{bestSpreadPair.awayLine.awaySpreadOdds}</span>
                          </div>
                          <div className="arbmodal-odds-row">
                            <span className="arbmodal-odds-label">Decimal:</span>
                            <span className="arbmodal-odds-value">{bestSpreadPair.decimalAway.toFixed(2)}</span>
                          </div>
                          <div className="arbmodal-odds-row">
                            <span className="arbmodal-odds-label">Implied %:</span>
                            <span className="arbmodal-odds-value">
                              {(100 / bestSpreadPair.decimalAway).toFixed(2)}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="arbmodal-stake-calculator">
                      <h4>Calculate Your Returns</h4>
                      
                      <div className="arbmodal-stake-input">
                        <label>Total Stake ($):</label>
                        <input
                          type="number"
                          value={totalStake}
                          onChange={handleStakeChange}
                          min="10"
                          step="10"
                        />
                      </div>
                      
                      <div className="arbmodal-calculation-results">
                        <div className="arbmodal-result-row">
                          <span className="arbmodal-result-label">
                            Stake on {homeAbbr}:
                          </span>
                          <span className="arbmodal-result-value">
                            ${spreadCalc.stakeHome.toFixed(2)}
                          </span>
                        </div>
                        <div className="arbmodal-result-row">
                          <span className="arbmodal-result-label">
                            Stake on {awayAbbr}:
                          </span>
                          <span className="arbmodal-result-value">
                            ${spreadCalc.stakeAway.toFixed(2)}
                          </span>
                        </div>
                        <div className="arbmodal-result-divider"></div>
                        <div className="arbmodal-result-row">
                          <span className="arbmodal-result-label">
                            Guaranteed Return:
                          </span>
                          <span className="arbmodal-result-value highlighted">
                            ${spreadCalc.guaranteedReturn.toFixed(2)}
                          </span>
                        </div>
                        <div className="arbmodal-result-row">
                          <span className="arbmodal-result-label">
                            Profit:
                          </span>
                          <span className="arbmodal-result-value profit">
                            ${spreadCalc.profit.toFixed(2)}
                          </span>
                        </div>
                        <div className="arbmodal-result-row">
                          <span className="arbmodal-result-label">
                            ROI:
                          </span>
                          <span className="arbmodal-result-value profit">
                            {spreadCalc.calculatedProfitMargin.toFixed(2)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="arbmodal-spread-note">
                    <FaInfoCircle className="info-icon" />
                    <p>
                      <strong>Note about spread bets:</strong> This calculation assumes both spread bets can't win simultaneously.
                      Depending on where the final score lands, there's a possibility of a "middle" where both bets win or a "push" 
                      where one bet wins and the other is refunded.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="arbmodal-no-arbitrage-message">
                  <FaInfoCircle className="info-icon" />
                  <p>No guaranteed spread arbitrage found for this game.</p>
                  <p>This means the combined implied probabilities from different sportsbooks exceed 100%.</p>
                </div>
              )}
            </div>
          )}

          {/* Advanced Calculator Tab */}
          {activeTab === 'calculator' && (
            <div className="arbmodal-calculator-tab">
              <h3>Arbitrage Calculator</h3>
              
              <div className="arbmodal-calculator-sections">
                <div className="arbmodal-calculator-left">
                  <h4>Standard Calculator</h4>
                  
                  {bestMoneylinePair ? (
                    <div className="arbmodal-standard-calculator">
                      <div className="arbmodal-calculator-card">
                        <div className="arbmodal-stake-input">
                          <label>Total Budget ($):</label>
                          <input
                            type="number"
                            value={totalStake}
                            onChange={handleStakeChange}
                            min="10"
                            step="10"
                          />
                        </div>
                        
                        <div className="arbmodal-calculator-results">
                          <h5>Optimal Moneyline Allocation</h5>
                          <div className="arbmodal-result-table">
                            <div className="arbmodal-result-row header">
                              <span>Team</span>
                              <span>Sportsbook</span>
                              <span>Stake</span>
                            </div>
                            <div className="arbmodal-result-row">
                              <span>{homeAbbr}</span>
                              <span>{bestMoneylinePair.homeLine.provider}</span>
                              <span>${moneylineCalc.stakeHome.toFixed(2)}</span>
                            </div>
                            <div className="arbmodal-result-row">
                              <span>{awayAbbr}</span>
                              <span>{bestMoneylinePair.awayLine.provider}</span>
                              <span>${moneylineCalc.stakeAway.toFixed(2)}</span>
                            </div>
                            <div className="arbmodal-result-row total">
                              <span>Total Profit</span>
                              <span>${moneylineCalc.profit.toFixed(2)}</span>
                              <span>{moneylineCalc.calculatedProfitMargin.toFixed(2)}%</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {bestSpreadPair && (
                        <div className="arbmodal-calculator-card">
                          <h5>Optimal Spread Allocation</h5>
                          <div className="arbmodal-result-table">
                            <div className="arbmodal-result-row header">
                              <span>Team</span>
                              <span>Sportsbook</span>
                              <span>Stake</span>
                            </div>
                            <div className="arbmodal-result-row">
                              <span>{homeAbbr} {bestSpreadPair.homeLine.homeSpread}</span>
                              <span>{bestSpreadPair.homeLine.provider}</span>
                              <span>${spreadCalc.stakeHome.toFixed(2)}</span>
                            </div>
                            <div className="arbmodal-result-row">
                              <span>{awayAbbr} {bestSpreadPair.awayLine.awaySpread}</span>
                              <span>{bestSpreadPair.awayLine.provider}</span>
                              <span>${spreadCalc.stakeAway.toFixed(2)}</span>
                            </div>
                            <div className="arbmodal-result-row total">
                              <span>Total Profit</span>
                              <span>${spreadCalc.profit.toFixed(2)}</span>
                              <span>{spreadCalc.calculatedProfitMargin.toFixed(2)}%</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="arbmodal-no-arb-message">
                      No arbitrage opportunities available for calculation.
                    </p>
                  )}
                </div>
                
                <div className="arbmodal-calculator-right">
                  <h4>Advanced Custom Allocation</h4>
                  
                  {bestMoneylinePair ? (
                    <div className="arbmodal-custom-calculator">
                      <p className="arbmodal-custom-intro">
                        Customize your bet allocation to create different scenarios.
                      </p>
                      
                      <div className="arbmodal-custom-inputs">
                        <div className="arbmodal-custom-stake-input">
                          <label>Stake on {homeAbbr} ({bestMoneylinePair.homeLine.provider}):</label>
                          <div className="arbmodal-input-with-controls">
                            <button 
                              onClick={() => handleCustomStakeChange('home', Math.max(0, stakeAllocation.home - 10))}
                              className="arbmodal-stake-control"
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
                              className="arbmodal-stake-control"
                            >
                              <FaArrowUp />
                            </button>
                          </div>
                        </div>
                        
                        <div className="arbmodal-custom-stake-input">
                          <label>Stake on {awayAbbr} ({bestMoneylinePair.awayLine.provider}):</label>
                          <div className="arbmodal-input-with-controls">
                            <button 
                              onClick={() => handleCustomStakeChange('away', Math.max(0, stakeAllocation.away - 10))}
                              className="arbmodal-stake-control"
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
                              className="arbmodal-stake-control"
                            >
                              <FaArrowUp />
                            </button>
                          </div>
                        </div>
                      </div>
                      
                      <div className="arbmodal-custom-results">
                        <h5>Scenario Analysis</h5>
                        
                        {customAllocationResults && (
                          <>
                            <div className="arbmodal-scenario-summary">
                              <div className="arbmodal-summary-item">
                                <span className="arbmodal-summary-label">Total Investment:</span>
                                <span className="arbmodal-summary-value">
                                  ${customAllocationResults.totalStake.toFixed(2)}
                                </span>
                              </div>
                            </div>
                            
                            <div className="arbmodal-scenario-table">
                              <div className="arbmodal-scenario-header">
                                <span>Scenario</span>
                                <span>Return</span>
                                <span>Net Profit</span>
                              </div>
                              
                              <div className="arbmodal-scenario-row">
                                <span className="arbmodal-scenario-name">
                                  If {homeAbbr} wins
                                </span>
                                <span className="arbmodal-scenario-return">
                                  ${customAllocationResults.homeReturn.toFixed(2)}
                                </span>
                                <span className={`arbmodal-scenario-profit ${customAllocationResults.homeProfit >= 0 ? 'positive' : 'negative'}`}>
                                  ${customAllocationResults.homeProfit.toFixed(2)}
                                </span>
                              </div>
                              
                              <div className="arbmodal-scenario-row">
                                <span className="arbmodal-scenario-name">
                                  If {awayAbbr} wins
                                </span>
                                <span className="arbmodal-scenario-return">
                                  ${customAllocationResults.awayReturn.toFixed(2)}
                                </span>
                                <span className={`arbmodal-scenario-profit ${customAllocationResults.awayProfit >= 0 ? 'positive' : 'negative'}`}>
                                  ${customAllocationResults.awayProfit.toFixed(2)}
                                </span>
                              </div>
                            </div>
                            
                            <div className="arbmodal-strategy-recommendation">
                              {customAllocationResults.homeProfit >= 0 && customAllocationResults.awayProfit >= 0 ? (
                                <div className="arbmodal-positive-strategy">
                                  <FaChartLine className="arbmodal-strategy-icon" />
                                  <span>Arbitrage Strategy: This allocation guarantees a profit regardless of outcome.</span>
                                </div>
                              ) : customAllocationResults.homeProfit >= 0 || customAllocationResults.awayProfit >= 0 ? (
                                <div className="arbmodal-partial-strategy">
                                  <FaExchangeAlt className="arbmodal-strategy-icon" />
                                  <span>Hedging Strategy: This allocation guarantees a win in one scenario but a loss in the other.</span>
                                </div>
                              ) : (
                                <div className="arbmodal-negative-strategy">
                                  <FaInfoCircle className="arbmodal-strategy-icon" />
                                  <span>Warning: This allocation results in a loss in all scenarios.</span>
                                </div>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  ) : (
                    <p className="arbmodal-no-arb-message">
                      No arbitrage opportunities available for custom calculation.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="arbmodal-footer">
          <button
            className="arbmodal-action-button arbmodal-save-button"
            onClick={onPlaceBet}
            disabled={!bestSpreadPair && !bestMoneylinePair}
          >
            <FaSave className="arbmodal-button-icon" />
            Save Bet
          </button>
          <button className="arbmodal-action-button arbmodal-close-button-footer" onClick={onClose}>
            <FaTimes className="arbmodal-button-icon" />
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ArbitrageModal;