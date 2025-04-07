import React, { useState, useMemo } from "react";
import ArbitrageModal from "./ArbitrageModal";
import { FaTrophy, FaChartLine, FaInfo } from "react-icons/fa";
import { Tooltip } from "react-tooltip";

const Arbitrage = ({ oddsData, getSportsbookLogo, getTeamLogo }) => {
  const [selectedGame, setSelectedGame] = useState(null);
  const [sortBy, setSortBy] = useState("profit"); // profit, homeTeam, awayTeam
  const [filterBy, setFilterBy] = useState("all"); // all, guaranteed

  // Find arbitrage opportunities for all games
  const gamesWithArbitrage = useMemo(() => {
    if (!oddsData) return [];
    
    return oddsData.map(game => {
      // Check for moneyline arbitrage
      const moneylineArb = findMoneylineArbitrageOpportunities(game.lines);
      // We can add more types like spread arbitrage later
      
      return {
        ...game,
        hasArbitrage: moneylineArb.length > 0,
        arbitrageOpportunities: moneylineArb,
        bestProfit: moneylineArb.length > 0 
          ? Math.max(...moneylineArb.map(arb => arb.profitMargin))
          : 0
      };
    });
  }, [oddsData]);

  // Filter and sort games
  const displayedGames = useMemo(() => {
    let filtered = [...gamesWithArbitrage];
    
    // Apply filters
    if (filterBy === "guaranteed") {
      filtered = filtered.filter(game => game.hasArbitrage);
    }
    
    // Apply sorting
    if (sortBy === "profit") {
      filtered.sort((a, b) => b.bestProfit - a.bestProfit);
    } else if (sortBy === "homeTeam") {
      filtered.sort((a, b) => a.homeTeam.localeCompare(b.homeTeam));
    } else if (sortBy === "awayTeam") {
      filtered.sort((a, b) => a.awayTeam.localeCompare(b.awayTeam));
    }
    
    return filtered;
  }, [gamesWithArbitrage, sortBy, filterBy]);

  const openModal = (game) => {
    setSelectedGame(game);
  };

  const closeModal = () => {
    setSelectedGame(null);
  };

  // Function to find moneyline arbitrage opportunities
  function findMoneylineArbitrageOpportunities(lines) {
    if (!lines || lines.length < 2) return [];
    
    const opportunities = [];
    
    for (let i = 0; i < lines.length; i++) {
      for (let j = 0; j < lines.length; j++) {
        if (i === j) continue;
        if (lines[i].provider === lines[j].provider) continue;
        
        const homeOdds = convertOddsToDecimal(lines[i].homeMoneyline);
        const awayOdds = convertOddsToDecimal(lines[j].awayMoneyline);
        
        if (!homeOdds || !awayOdds) continue;
        
        const impliedProbability = (1 / homeOdds) + (1 / awayOdds);
        
        if (impliedProbability < 1) {
          opportunities.push({
            homeBookmaker: lines[i].provider,
            homeOdds: lines[i].homeMoneyline,
            homeDecimal: homeOdds,
            awayBookmaker: lines[j].provider,
            awayOdds: lines[j].awayMoneyline,
            awayDecimal: awayOdds,
            impliedProbability: impliedProbability,
            profitMargin: (1 - impliedProbability) * 100
          });
        }
      }
    }
    
    // Sort by profit margin (highest first)
    return opportunities.sort((a, b) => b.profitMargin - a.profitMargin);
  }

  function convertOddsToDecimal(odds) {
    if (!odds) return null;
    const o = parseFloat(odds);
    if (isNaN(o)) return null;
    return o > 0 ? (o / 100) + 1 : (100 / Math.abs(o)) + 1;
  }

  if (!oddsData || oddsData.length === 0) {
    return (
      <div className="arb-ev-arbitrage-empty-state">
        <FaChartLine size={48} className="arb-ev-empty-icon" />
        <p>No arbitrage opportunities available.</p>
        <p className="arb-ev-empty-subtext">Try changing your filters or check back later for new odds.</p>
      </div>
    );
  }

  return (
    <div className="arb-ev-arbitrage-container">
      {/* Filters and Controls */}
      <div className="arb-ev-arbitrage-controls">
        <div className="arb-ev-filter-group">
          <label>Filter:</label>
          <select 
            value={filterBy} 
            onChange={(e) => setFilterBy(e.target.value)}
            className="arb-ev-filter-select"
          >
            <option value="all">All Games</option>
            <option value="guaranteed">Guaranteed Profit Only</option>
          </select>
        </div>
        
        <div className="arb-ev-filter-group">
          <label>Sort By:</label>
          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value)}
            className="arb-ev-filter-select"
          >
            <option value="profit">Best Profit</option>
            <option value="homeTeam">Home Team</option>
            <option value="awayTeam">Away Team</option>
          </select>
        </div>
      </div>
      
      {/* Summary Stats */}
      <div className="arb-ev-arbitrage-summary">
        <div className="arb-ev-summary-stat">
          <span className="arb-ev-stat-value">{displayedGames.length}</span>
          <span className="arb-ev-stat-label">Games</span>
        </div>
        <div className="arb-ev-summary-stat">
          <span className="arb-ev-stat-value">{displayedGames.filter(g => g.hasArbitrage).length}</span>
          <span className="arb-ev-stat-label">With Arbitrage</span>
        </div>
        <div className="arb-ev-summary-stat">
          <span className="arb-ev-stat-value">
            {displayedGames.some(g => g.hasArbitrage) ? 
              displayedGames.reduce((max, game) => Math.max(max, game.bestProfit), 0).toFixed(2) + '%' : 
              'N/A'}
          </span>
          <span className="arb-ev-stat-label">Best Profit</span>
        </div>
      </div>
      
      {/* Game Cards */}
      <div className="arb-ev-game-grid">
        {displayedGames.map((game) => (
          <div
            key={game.id}
            className={`arb-ev-game-card ${game.hasArbitrage ? 'has-arbitrage' : ''}`}
            onClick={() => openModal(game)}
          >
            {game.hasArbitrage && (
              <div className="arb-ev-arbitrage-badge">
                <FaTrophy className="arb-ev-trophy-icon" />
                <span>{game.bestProfit.toFixed(2)}% Profit</span>
              </div>
            )}
            
            {/* Game Header with Team Logos */}
            <div className="arb-ev-game-header">
              <div className="arb-ev-teams-container">
                <div className="arb-ev-team-info">
                  <img
                    src={getTeamLogo(game.homeTeam)}
                    alt={game.homeTeam}
                    className="arb-ev-team-logo"
                  />
                  <span className="arb-ev-team-name">{game.homeTeam}</span>
                </div>
                <span className="arb-ev-versus">vs</span>
                <div className="arb-ev-team-info">
                  <img
                    src={getTeamLogo(game.awayTeam)}
                    alt={game.awayTeam}
                    className="arb-ev-team-logo"
                  />
                  <span className="arb-ev-team-name">{game.awayTeam}</span>
                </div>
              </div>
              <div className="arb-ev-game-meta">
                <div className="arb-ev-game-week">Week {game.week}</div>
                <div 
                  className="arb-ev-info-icon-container"
                  data-tooltip-id={`game-info-${game.id}`}
                >
                  <FaInfo className="arb-ev-info-icon" />
                </div>
                <Tooltip id={`game-info-${game.id}`} place="top" effect="solid">
                  <div>
                    <p>Click to see detailed arbitrage opportunities</p>
                    {game.hasArbitrage ? (
                      <p>Best profit: {game.bestProfit.toFixed(2)}%</p>
                    ) : (
                      <p>No guaranteed arbitrage found</p>
                    )}
                  </div>
                </Tooltip>
              </div>
            </div>

            {/* Compare Sportsbooks in a Table */}
            <div className="arb-ev-odds-comparison">
              {game.lines.length > 0 ? (
                <table className="arb-ev-odds-table">
                  <thead>
                    <tr>
                      <th>Sportsbook</th>
                      <th>Home ML</th>
                      <th>Away ML</th>
                    </tr>
                  </thead>
                  <tbody>
                    {game.lines.slice(0, 3).map((line, index) => (
                      <tr key={index}>
                        <td className="arb-ev-sportsbook">
                          <img
                            src={getSportsbookLogo(line.provider)}
                            alt={line.provider}
                            className="arb-ev-sportsbook-logo"
                          />
                          <span>{line.provider}</span>
                        </td>
                        <td className={line.provider === game.arbitrageOpportunities[0]?.homeBookmaker ? 'arb-ev-highlighted-odds' : ''}>
                          {line.homeMoneyline}
                        </td>
                        <td className={line.provider === game.arbitrageOpportunities[0]?.awayBookmaker ? 'arb-ev-highlighted-odds' : ''}>
                          {line.awayMoneyline}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p>No lines available from selected sportsbooks.</p>
              )}
            </div>
            
            {/* View Details Button */}
            <button className="arb-ev-view-details-button">
              View Arbitrage Details
            </button>
          </div>
        ))}
      </div>
      
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