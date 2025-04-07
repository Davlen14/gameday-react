import React, { useState, useMemo } from "react";
import { 
  FaChartLine, 
  FaSortAmountUp, 
  FaSortAmountDown, 
  FaFilter, 
  FaInfoCircle,
  FaArrowRight,
  FaPercentage,
  FaDollarSign,
  FaAngleDown,
  FaAngleUp,
  FaCalculator
} from "react-icons/fa";
import { Tooltip } from "react-tooltip";

// Utility to convert American odds to decimal
const convertToDecimal = (odds) => {
  if (!odds) return null;
  const o = parseFloat(odds);
  if (isNaN(o)) return null;
  return o > 0 ? (o / 100) + 1 : (100 / Math.abs(o)) + 1;
};

// Calculate implied probability from decimal odds
const calculateImpliedProbability = (decimalOdds) => {
  if (!decimalOdds) return null;
  return (1 / decimalOdds) * 100;
};

// Calculate fair value odds
const calculateFairValueOdds = (probabilities) => {
  // Filter out null values
  const validProbs = probabilities.filter(p => p !== null);
  if (validProbs.length === 0) return null;
  
  // Average the implied probabilities
  const avgProb = validProbs.reduce((sum, prob) => sum + prob, 0) / validProbs.length;
  
  // Convert back to decimal odds
  return 100 / avgProb;
};

// Calculate EV (Expected Value) percentage
const calculateEV = (decimalOdds, fairOdds) => {
  if (!decimalOdds || !fairOdds) return null;
  // EV = (decimal odds / fair odds - 1) * 100
  return (decimalOdds / fairOdds - 1) * 100;
};

const EVBetting = ({ oddsData, getSportsbookLogo, getTeamLogo }) => {
  // State for sorting and filtering
  const [sortBy, setSortBy] = useState("ev"); // 'ev', 'team', 'odds'
  const [sortOrder, setSortOrder] = useState("desc"); // 'asc', 'desc'
  const [minEV, setMinEV] = useState(1); // Minimum EV percentage to display
  const [selectedTypes, setSelectedTypes] = useState(["moneyline", "spread", "overUnder"]);
  const [expandedGames, setExpandedGames] = useState({});
  
  // Calculate EV for all betting lines
  const evData = useMemo(() => {
    if (!oddsData || oddsData.length === 0) return [];
    
    return oddsData.map(game => {
      // Process moneyline odds
      const homeMoneylineOdds = game.lines.map(line => 
        convertToDecimal(line.homeMoneyline)
      );
      const awayMoneylineOdds = game.lines.map(line => 
        convertToDecimal(line.awayMoneyline)
      );
      
      // Calculate implied probabilities
      const homeImpliedProbs = homeMoneylineOdds.map(odds => 
        calculateImpliedProbability(odds)
      );
      const awayImpliedProbs = awayMoneylineOdds.map(odds => 
        calculateImpliedProbability(odds)
      );
      
      // Calculate fair odds
      const homeFairOdds = calculateFairValueOdds(homeImpliedProbs);
      const awayFairOdds = calculateFairValueOdds(awayImpliedProbs);
      
      // Calculate EV for each line
      const evLines = game.lines.map(line => {
        const homeMoneylineDecimal = convertToDecimal(line.homeMoneyline);
        const awayMoneylineDecimal = convertToDecimal(line.awayMoneyline);
        
        const homeSpreadDecimal = convertToDecimal(line.homeSpreadOdds);
        const awaySpreadDecimal = convertToDecimal(line.awaySpreadOdds);
        
        const overDecimal = convertToDecimal(line.overOdds);
        const underDecimal = convertToDecimal(line.underOdds);
        
        // Calculate fair odds for spread (simplified approach)
        // In a real implementation, you'd need more sophisticated models for spread fair odds
        const homeSpreadFairOdds = 1.95; // Typical fair odds after removing vig
        const awaySpreadFairOdds = 1.95;
        const overFairOdds = 1.95;
        const underFairOdds = 1.95;
        
        return {
          ...line,
          ev: {
            homeMoneyline: homeMoneylineDecimal ? calculateEV(homeMoneylineDecimal, homeFairOdds) : null,
            awayMoneyline: awayMoneylineDecimal ? calculateEV(awayMoneylineDecimal, awayFairOdds) : null,
            homeSpread: homeSpreadDecimal ? calculateEV(homeSpreadDecimal, homeSpreadFairOdds) : null,
            awaySpread: awaySpreadDecimal ? calculateEV(awaySpreadDecimal, awaySpreadFairOdds) : null,
            over: overDecimal ? calculateEV(overDecimal, overFairOdds) : null,
            under: underDecimal ? calculateEV(underDecimal, underFairOdds) : null
          },
          bestEV: Math.max(
            homeMoneylineDecimal ? calculateEV(homeMoneylineDecimal, homeFairOdds) || -Infinity : -Infinity,
            awayMoneylineDecimal ? calculateEV(awayMoneylineDecimal, awayFairOdds) || -Infinity : -Infinity,
            homeSpreadDecimal ? calculateEV(homeSpreadDecimal, homeSpreadFairOdds) || -Infinity : -Infinity,
            awaySpreadDecimal ? calculateEV(awaySpreadDecimal, awaySpreadFairOdds) || -Infinity : -Infinity,
            overDecimal ? calculateEV(overDecimal, overFairOdds) || -Infinity : -Infinity,
            underDecimal ? calculateEV(underDecimal, underFairOdds) || -Infinity : -Infinity
          )
        };
      });
      
      // Find highest EV for the game
      const maxEV = Math.max(...evLines.map(line => line.bestEV));
      
      return {
        ...game,
        evLines,
        maxEV
      };
    });
  }, [oddsData]);
  
  // Filter and sort the data
  const filteredAndSortedData = useMemo(() => {
    if (!evData || evData.length === 0) return [];
    
    // Filter out games with no positive EV opportunities
    let filtered = evData.filter(game => {
      // Find at least one bet with EV >= minEV
      return game.evLines.some(line => line.bestEV >= minEV);
    });
    
    // Sort the data
    return filtered.sort((a, b) => {
      if (sortBy === 'ev') {
        return sortOrder === 'desc' ? b.maxEV - a.maxEV : a.maxEV - b.maxEV;
      } else if (sortBy === 'team') {
        return sortOrder === 'desc' 
          ? b.homeTeam.localeCompare(a.homeTeam) 
          : a.homeTeam.localeCompare(b.homeTeam);
      }
      return 0;
    });
  }, [evData, sortBy, sortOrder, minEV]);
  
  // Toggle expanded view for a game
  const toggleExpanded = (gameId) => {
    setExpandedGames(prev => ({
      ...prev,
      [gameId]: !prev[gameId]
    }));
  };
  
  // Toggle bet type selection
  const toggleBetType = (type) => {
    if (selectedTypes.includes(type)) {
      if (selectedTypes.length > 1) { // Keep at least one type selected
        setSelectedTypes(selectedTypes.filter(t => t !== type));
      }
    } else {
      setSelectedTypes([...selectedTypes, type]);
    }
  };
  
  // Toggle sort order
  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc'); // Default to descending
    }
  };
  
  // Calculate the color based on EV percentage
  const getEVColor = (ev) => {
    if (ev === null) return 'var(--neutral-color)';
    if (ev < 0) return 'var(--negative-ev-color)';
    if (ev < 5) return 'var(--low-ev-color)';
    if (ev < 10) return 'var(--medium-ev-color)';
    return 'var(--high-ev-color)';
  };

  if (!oddsData || oddsData.length === 0) {
    return (
      <div className="ev-empty-state">
        <FaChartLine size={48} className="empty-icon" />
        <p>No betting odds available.</p>
        <p className="empty-subtext">Try changing your filters or check back later for new odds.</p>
      </div>
    );
  }
  
  if (filteredAndSortedData.length === 0) {
    return (
      <div className="ev-empty-state">
        <FaInfoCircle size={48} className="empty-icon" />
        <p>No positive EV bets found with current filters.</p>
        <p className="empty-subtext">Try lowering the minimum EV or selecting different bet types.</p>
        
        <div className="filter-controls">
          <div className="ev-filter">
            <label>Minimum EV %:</label>
            <input
              type="range"
              min="0"
              max="10"
              step="0.5"
              value={minEV}
              onChange={(e) => setMinEV(parseFloat(e.target.value))}
            />
            <span>{minEV}%</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="ev-container">
      {/* EV Filters and Controls */}
      <div className="ev-controls">
        <div className="ev-filter-section">
          <div className="ev-filter">
            <label>Minimum EV %:</label>
            <input
              type="range"
              min="0"
              max="10"
              step="0.5"
              value={minEV}
              onChange={(e) => setMinEV(parseFloat(e.target.value))}
            />
            <span>{minEV}%</span>
          </div>
          
          <div className="bet-type-filters">
            <label>Bet Types:</label>
            <div className="bet-type-options">
              <button 
                className={`bet-type-btn ${selectedTypes.includes('moneyline') ? 'selected' : ''}`}
                onClick={() => toggleBetType('moneyline')}
              >
                Moneyline
              </button>
              <button 
                className={`bet-type-btn ${selectedTypes.includes('spread') ? 'selected' : ''}`}
                onClick={() => toggleBetType('spread')}
              >
                Spread
              </button>
              <button 
                className={`bet-type-btn ${selectedTypes.includes('overUnder') ? 'selected' : ''}`}
                onClick={() => toggleBetType('overUnder')}
              >
                Over/Under
              </button>
            </div>
          </div>
        </div>
        
        <div className="ev-sort-section">
          <button 
            className={`sort-btn ${sortBy === 'ev' ? 'active' : ''}`}
            onClick={() => handleSort('ev')}
          >
            Sort by EV 
            {sortBy === 'ev' && (
              sortOrder === 'desc' ? <FaSortAmountDown className="sort-icon" /> : <FaSortAmountUp className="sort-icon" />
            )}
          </button>
          <button 
            className={`sort-btn ${sortBy === 'team' ? 'active' : ''}`}
            onClick={() => handleSort('team')}
          >
            Sort by Team
            {sortBy === 'team' && (
              sortOrder === 'desc' ? <FaSortAmountDown className="sort-icon" /> : <FaSortAmountUp className="sort-icon" />
            )}
          </button>
        </div>
      </div>
      
      {/* EV Stats Summary */}
      <div className="ev-summary">
        <div className="summary-stat">
          <FaChartLine className="summary-icon" />
          <div className="stat-content">
            <span className="stat-value">{filteredAndSortedData.length}</span>
            <span className="stat-label">Games with +EV</span>
          </div>
        </div>
        
        <div className="summary-stat">
          <FaPercentage className="summary-icon" />
          <div className="stat-content">
            <span className="stat-value">
              {Math.max(...filteredAndSortedData.map(g => g.maxEV)).toFixed(1)}%
            </span>
            <span className="stat-label">Best EV</span>
          </div>
        </div>
        
        <div className="summary-stat">
          <FaDollarSign className="summary-icon" />
          <div className="stat-content">
            <span className="stat-value">
              ${(100 * (1 + Math.max(...filteredAndSortedData.map(g => g.maxEV)) / 100)).toFixed(2)}
            </span>
            <span className="stat-label">Expected Value on $100</span>
          </div>
        </div>
      </div>

      {/* EV Game Cards */}
      <div className="ev-games">
        {filteredAndSortedData.map((game) => (
          <div key={game.id} className="ev-game-card">
            {/* Game Header with Best EV Badge */}
            <div className="ev-game-header" onClick={() => toggleExpanded(game.id)}>
              <div className="teams-container">
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
              </div>
              
              <div className="ev-meta">
                <div className="game-week">Week {game.week}</div>
                <div className="best-ev-badge" style={{ backgroundColor: getEVColor(game.maxEV) }}>
                  <span className="ev-value">+{game.maxEV.toFixed(1)}% EV</span>
                </div>
                <div className="expand-toggle">
                  {expandedGames[game.id] ? <FaAngleUp /> : <FaAngleDown />}
                </div>
              </div>
            </div>
            
            {/* Game Lines - Collapsed View */}
            {!expandedGames[game.id] && (
              <div className="ev-lines-preview">
                <table className="ev-table-preview">
                  <thead>
                    <tr>
                      <th>Sportsbook</th>
                      <th>Best Bet</th>
                      <th>EV%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {game.evLines.slice(0, 2).map((line, index) => {
                      // Find the best EV bet for this line
                      const evValues = [
                        { type: 'Home ML', value: line.ev.homeMoneyline, odds: line.homeMoneyline },
                        { type: 'Away ML', value: line.ev.awayMoneyline, odds: line.awayMoneyline },
                        { type: 'Home Spread', value: line.ev.homeSpread, odds: line.homeSpreadOdds, spread: line.homeSpread },
                        { type: 'Away Spread', value: line.ev.awaySpread, odds: line.awaySpreadOdds, spread: line.awaySpread },
                        { type: 'Over', value: line.ev.over, odds: line.overOdds, total: line.overUnder },
                        { type: 'Under', value: line.ev.under, odds: line.underOdds, total: line.overUnder }
                      ].filter(item => item.value !== null && item.value >= minEV);
                      
                      // Sort by EV value
                      evValues.sort((a, b) => b.value - a.value);
                      
                      // Skip if no positive EV bets for this sportsbook
                      if (evValues.length === 0) return null;
                      
                      const bestBet = evValues[0];
                      
                      return (
                        <tr key={index}>
                          <td className="sportsbook-cell">
                            <img
                              src={getSportsbookLogo(line.provider)}
                              alt={line.provider}
                              className="sportsbook-logo"
                            />
                            <span>{line.provider}</span>
                          </td>
                          <td className="best-bet-cell">
                            {bestBet.type === 'Home ML' && `${game.homeTeam} ML (${bestBet.odds})`}
                            {bestBet.type === 'Away ML' && `${game.awayTeam} ML (${bestBet.odds})`}
                            {bestBet.type === 'Home Spread' && `${game.homeTeam} ${bestBet.spread} (${bestBet.odds})`}
                            {bestBet.type === 'Away Spread' && `${game.awayTeam} ${bestBet.spread} (${bestBet.odds})`}
                            {bestBet.type === 'Over' && `Over ${bestBet.total} (${bestBet.odds})`}
                            {bestBet.type === 'Under' && `Under ${bestBet.total} (${bestBet.odds})`}
                          </td>
                          <td className="ev-value-cell" style={{ color: getEVColor(bestBet.value) }}>
                            +{bestBet.value.toFixed(1)}%
                          </td>
                        </tr>
                      );
                    }).filter(Boolean)}
                  </tbody>
                </table>
                
                {game.evLines.length > 2 && (
                  <div className="more-lines-prompt">
                    <FaInfoCircle className="info-icon" />
                    <span>Click to see {game.evLines.length - 2} more sportsbooks</span>
                  </div>
                )}
              </div>
            )}
            
            {/* Game Lines - Expanded View */}
            {expandedGames[game.id] && (
              <div className="ev-lines-expanded">
                <div className="ev-tabs">
                  {selectedTypes.includes('moneyline') && (
                    <button className="ev-tab active">Moneyline</button>
                  )}
                  {selectedTypes.includes('spread') && (
                    <button className="ev-tab">Spread</button>
                  )}
                  {selectedTypes.includes('overUnder') && (
                    <button className="ev-tab">Over/Under</button>
                  )}
                </div>
                
                {/* Moneyline Tab */}
                {selectedTypes.includes('moneyline') && (
                  <div className="ev-tab-content">
                    <table className="ev-table-detailed">
                      <thead>
                        <tr>
                          <th>Sportsbook</th>
                          <th>{game.homeTeam}</th>
                          <th>{game.awayTeam}</th>
                          <th>Best EV</th>
                        </tr>
                      </thead>
                      <tbody>
                        {game.evLines.map((line, index) => (
                          <tr key={index}>
                            <td className="sportsbook-cell">
                              <img
                                src={getSportsbookLogo(line.provider)}
                                alt={line.provider}
                                className="sportsbook-logo"
                              />
                              <span>{line.provider}</span>
                            </td>
                            <td 
                              className={`odds-cell ${line.ev.homeMoneyline >= minEV ? 'positive-ev' : ''}`}
                              data-tooltip-id={`home-ml-${game.id}-${index}`}
                            >
                              <div className="odds-main">{line.homeMoneyline}</div>
                              {line.ev.homeMoneyline !== null && (
                                <div 
                                  className="ev-indicator" 
                                  style={{ color: getEVColor(line.ev.homeMoneyline) }}
                                >
                                  {line.ev.homeMoneyline > 0 ? '+' : ''}{line.ev.homeMoneyline.toFixed(1)}%
                                </div>
                              )}
                              <Tooltip id={`home-ml-${game.id}-${index}`} place="top">
                                <div>
                                  <p>Decimal Odds: {convertToDecimal(line.homeMoneyline)?.toFixed(2)}</p>
                                  <p>Implied Probability: {calculateImpliedProbability(convertToDecimal(line.homeMoneyline))?.toFixed(1)}%</p>
                                  <p>EV: {line.ev.homeMoneyline?.toFixed(2)}%</p>
                                </div>
                              </Tooltip>
                            </td>
                            <td 
                              className={`odds-cell ${line.ev.awayMoneyline >= minEV ? 'positive-ev' : ''}`}
                              data-tooltip-id={`away-ml-${game.id}-${index}`}
                            >
                              <div className="odds-main">{line.awayMoneyline}</div>
                              {line.ev.awayMoneyline !== null && (
                                <div 
                                  className="ev-indicator" 
                                  style={{ color: getEVColor(line.ev.awayMoneyline) }}
                                >
                                  {line.ev.awayMoneyline > 0 ? '+' : ''}{line.ev.awayMoneyline.toFixed(1)}%
                                </div>
                              )}
                              <Tooltip id={`away-ml-${game.id}-${index}`} place="top">
                                <div>
                                  <p>Decimal Odds: {convertToDecimal(line.awayMoneyline)?.toFixed(2)}</p>
                                  <p>Implied Probability: {calculateImpliedProbability(convertToDecimal(line.awayMoneyline))?.toFixed(1)}%</p>
                                  <p>EV: {line.ev.awayMoneyline?.toFixed(2)}%</p>
                                </div>
                              </Tooltip>
                            </td>
                            <td className="best-ev-cell">
                              {line.bestEV >= minEV && (
                                <div
                                  className="best-ev-value"
                                  style={{ color: getEVColor(line.bestEV) }}
                                >
                                  +{line.bestEV.toFixed(1)}%
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                
                {/* Spread Tab (similar structure to Moneyline) */}
                {selectedTypes.includes('spread') && (
                  <div className="ev-tab-content">
                    <table className="ev-table-detailed">
                      <thead>
                        <tr>
                          <th>Sportsbook</th>
                          <th>{game.homeTeam}</th>
                          <th>{game.awayTeam}</th>
                          <th>Best EV</th>
                        </tr>
                      </thead>
                      <tbody>
                        {game.evLines.map((line, index) => (
                          <tr key={index}>
                            <td className="sportsbook-cell">
                              <img
                                src={getSportsbookLogo(line.provider)}
                                alt={line.provider}
                                className="sportsbook-logo"
                              />
                              <span>{line.provider}</span>
                            </td>
                            <td 
                              className={`odds-cell ${line.ev.homeSpread >= minEV ? 'positive-ev' : ''}`}
                              data-tooltip-id={`home-spread-${game.id}-${index}`}
                            >
                              <div className="odds-main">
                                {line.homeSpread} ({line.homeSpreadOdds})
                              </div>
                              {line.ev.homeSpread !== null && (
                                <div 
                                  className="ev-indicator" 
                                  style={{ color: getEVColor(line.ev.homeSpread) }}
                                >
                                  {line.ev.homeSpread > 0 ? '+' : ''}{line.ev.homeSpread.toFixed(1)}%
                                </div>
                              )}
                              <Tooltip id={`home-spread-${game.id}-${index}`} place="top">
                                <div>
                                  <p>Spread: {line.homeSpread}</p>
                                  <p>Decimal Odds: {convertToDecimal(line.homeSpreadOdds)?.toFixed(2)}</p>
                                  <p>Implied Probability: {calculateImpliedProbability(convertToDecimal(line.homeSpreadOdds))?.toFixed(1)}%</p>
                                  <p>EV: {line.ev.homeSpread?.toFixed(2)}%</p>
                                </div>
                              </Tooltip>
                            </td>
                            <td 
                              className={`odds-cell ${line.ev.awaySpread >= minEV ? 'positive-ev' : ''}`}
                              data-tooltip-id={`away-spread-${game.id}-${index}`}
                            >
                              <div className="odds-main">
                                {line.awaySpread} ({line.awaySpreadOdds})
                              </div>
                              {line.ev.awaySpread !== null && (
                                <div 
                                  className="ev-indicator" 
                                  style={{ color: getEVColor(line.ev.awaySpread) }}
                                >
                                  {line.ev.awaySpread > 0 ? '+' : ''}{line.ev.awaySpread.toFixed(1)}%
                                </div>
                              )}
                              <Tooltip id={`away-spread-${game.id}-${index}`} place="top">
                                <div>
                                  <p>Spread: {line.awaySpread}</p>
                                  <p>Decimal Odds: {convertToDecimal(line.awaySpreadOdds)?.toFixed(2)}</p>
                                  <p>Implied Probability: {calculateImpliedProbability(convertToDecimal(line.awaySpreadOdds))?.toFixed(1)}%</p>
                                  <p>EV: {line.ev.awaySpread?.toFixed(2)}%</p>
                                </div>
                              </Tooltip>
                            </td>
                            <td className="best-ev-cell">
                              {Math.max(
                                line.ev.homeSpread || -Infinity,
                                line.ev.awaySpread || -Infinity
                              ) >= minEV && (
                                <div
                                  className="best-ev-value"
                                  style={{ 
                                    color: getEVColor(
                                      Math.max(
                                        line.ev.homeSpread || -Infinity, 
                                        line.ev.awaySpread || -Infinity
                                      )
                                    ) 
                                  }}
                                >
                                  +{Math.max(
                                    line.ev.homeSpread || -Infinity,
                                    line.ev.awaySpread || -Infinity
                                  ).toFixed(1)}%
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                
                {/* Over/Under Tab (similar structure) */}
                {selectedTypes.includes('overUnder') && (
                  <div className="ev-tab-content">
                    <table className="ev-table-detailed">
                      <thead>
                        <tr>
                          <th>Sportsbook</th>
                          <th>Total</th>
                          <th>Over</th>
                          <th>Under</th>
                          <th>Best EV</th>
                        </tr>
                      </thead>
                      <tbody>
                        {game.evLines.map((line, index) => (
                          <tr key={index}>
                            <td className="sportsbook-cell">
                              <img
                                src={getSportsbookLogo(line.provider)}
                                alt={line.provider}
                                className="sportsbook-logo"
                              />
                              <span>{line.provider}</span>
                            </td>
                            <td className="total-cell">
                              {line.overUnder || "N/A"}
                            </td>
                            <td 
                              className={`odds-cell ${line.ev.over >= minEV ? 'positive-ev' : ''}`}
                              data-tooltip-id={`over-${game.id}-${index}`}
                            >
                              <div className="odds-main">{line.overOdds}</div>
                              {line.ev.over !== null && (
                                <div 
                                  className="ev-indicator" 
                                  style={{ color: getEVColor(line.ev.over) }}
                                >
                                  {line.ev.over > 0 ? '+' : ''}{line.ev.over.toFixed(1)}%
                                </div>
                              )}
                              <Tooltip id={`over-${game.id}-${index}`} place="top">
                                <div>
                                  <p>Decimal Odds: {convertToDecimal(line.overOdds)?.toFixed(2)}</p>
                                  <p>Implied Probability: {calculateImpliedProbability(convertToDecimal(line.overOdds))?.toFixed(1)}%</p>
                                  <p>EV: {line.ev.over?.toFixed(2)}%</p>
                                </div>
                              </Tooltip>
                            </td>
                            <td 
                              className={`odds-cell ${line.ev.under >= minEV ? 'positive-ev' : ''}`}
                              data-tooltip-id={`under-${game.id}-${index}`}
                            >
                              <div className="odds-main">{line.underOdds}</div>
                              {line.ev.under !== null && (
                                <div 
                                  className="ev-indicator" 
                                  style={{ color: getEVColor(line.ev.under) }}
                                >
                                  {line.ev.under > 0 ? '+' : ''}{line.ev.under.toFixed(1)}%
                                </div>
                              )}
                              <Tooltip id={`under-${game.id}-${index}`} place="top">
                                <div>
                                  <p>Decimal Odds: {convertToDecimal(line.underOdds)?.toFixed(2)}</p>
                                  <p>Implied Probability: {calculateImpliedProbability(convertToDecimal(line.underOdds))?.toFixed(1)}%</p>
                                  <p>EV: {line.ev.under?.toFixed(2)}%</p>
                                </div>
                              </Tooltip>
                            </td>
                            <td className="best-ev-cell">
                              {Math.max(
                                line.ev.over || -Infinity,
                                line.ev.under || -Infinity
                              ) >= minEV && (
                                <div
                                  className="best-ev-value"
                                  style={{ 
                                    color: getEVColor(
                                      Math.max(
                                        line.ev.over || -Infinity, 
                                        line.ev.under || -Infinity
                                      )
                                    ) 
                                  }}
                                >
                                  +{Math.max(
                                    line.ev.over || -Infinity,
                                    line.ev.under || -Infinity
                                  ).toFixed(1)}%
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                
                {/* EV Calculator */}
                <div className="ev-calculator">
                  <h4>EV Calculator <FaCalculator className="calc-icon" /></h4>
                  <p className="ev-calculator-description">
                    Expected Value (EV) represents the average amount you can expect to win (or lose) 
                    per bet placed if you were to place the same bet on this game many times.
                  </p>
                  
                  <div className="expected-returns-table">
                    <div className="return-header">
                      <span>Stake</span>
                      <span>Expected Return</span>
                      <span>Expected Profit</span>
                    </div>
                    {[50, 100, 200, 500, 1000].map(stake => (
                      <div className="return-row" key={stake}>
                        <span className="stake-amount">${stake}</span>
                        <span className="expected-return">
                          ${(stake * (1 + game.maxEV / 100)).toFixed(2)}
                        </span>
                        <span className="expected-profit" style={{ color: getEVColor(game.maxEV) }}>
                          ${(stake * game.maxEV / 100).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default EVBetting;