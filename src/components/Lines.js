import React, { useEffect, useState, useMemo } from "react";
import teamsService from "../services/teamsService";
import "../styles/Lines.css"; // Your custom CSS file
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

// Modernized SVG Components
const CheckIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="12" fill="#00C853" />
    <path d="M7 12l3 3 6-6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const CrossIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="12" fill="#D50000" />
    <path d="M7 7l10 10M17 7l-10 10" stroke="white" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

/**
 * Converts a hex color (like "#981e32") to a rough brightness value (0-255).
 */
function getColorBrightness(hex) {
  const cleanHex = hex.replace(/^#/, "");
  const bigint = parseInt(cleanHex, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return (r * 299 + g * 587 + b * 114) / 1000;
}

/**
 * Lightens a dark color by a given amount.
 */
function lightenColor(hex, amount = 15) {
  const cleanHex = hex.replace(/^#/, "");
  let bigint = parseInt(cleanHex, 16);
  let r = (bigint >> 16) & 255;
  let g = (bigint >> 8) & 255;
  let b = bigint & 255;
  r = Math.min(255, r + amount);
  g = Math.min(255, g + amount);
  b = Math.min(255, b + amount);
  const newColor =
    "#" +
    ((1 << 24) + (r << 16) + (g << 8) + b)
      .toString(16)
      .slice(1)
      .toUpperCase();
  return newColor;
}

/** FILTERS COMPONENT **/
const FilterBar = ({ filters, setFilters, teams, lines }) => {
  // Unique years and weeks from lines data
  const years = useMemo(() => {
    const ys = new Set(lines.map((g) => new Date(g.startDate).getFullYear()));
    return Array.from(ys).sort();
  }, [lines]);

  const weeks = useMemo(() => {
    const ws = new Set(lines.map((g) => g.week));
    return Array.from(ws).sort((a, b) => a - b);
  }, [lines]);

  return (
    <div className="filter-bar">
      <label>
        Year:
        <select
          value={filters.year}
          onChange={(e) =>
            setFilters((prev) => ({ ...prev, year: e.target.value }))
          }
        >
          <option value="">All</option>
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </label>
      <label>
        Week:
        <select
          value={filters.week}
          onChange={(e) =>
            setFilters((prev) => ({ ...prev, week: e.target.value }))
          }
        >
          <option value="">All</option>
          {weeks.map((w) => (
            <option key={w} value={w}>
              {w}
            </option>
          ))}
        </select>
      </label>
      <label>
        Team:
        <select
          value={filters.team}
          onChange={(e) =>
            setFilters((prev) => ({ ...prev, team: e.target.value }))
          }
        >
          <option value="">All</option>
          {teams.map((t) => (
            <option key={t.id} value={t.school}>
              {t.school}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
};

/** GRAPH COMPONENT **/
const CoverageChart = ({ games, getTeamAbbreviation, hasCoveredSpread }) => {
  // Calculate coverage rates for each team from the given games.
  const coverageData = {};
  games.forEach((game) => {
    // For home team
    const home = game.homeTeam;
    if (!coverageData[home]) {
      coverageData[home] = { games: 0, covered: 0 };
    }
    coverageData[home].games += 1;
    if (hasCoveredSpread(
      game.lines[0]?.spread,
      game.homeScore,
      game.awayScore
    )) {
      coverageData[home].covered += 1;
    }
    // For away team
    const away = game.awayTeam;
    if (!coverageData[away]) {
      coverageData[away] = { games: 0, covered: 0 };
    }
    coverageData[away].games += 1;
    if (!hasCoveredSpread(
      game.lines[0]?.spread,
      game.homeScore,
      game.awayScore
    )) {
      // For away team, if home did not cover, away is considered to have "covered"
      coverageData[away].covered += 1;
    }
  });
  const data = Object.entries(coverageData).map(([team, stats]) => ({
    team: getTeamAbbreviation(team),
    coverage: ((stats.covered / stats.games) * 100).toFixed(1),
  }));

  return (
    <div className="coverage-chart">
      <h2>Team Coverage Rates (%)</h2>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <XAxis dataKey="team" />
          <YAxis label={{ value: "% Covered", angle: -90, position: "insideLeft" }} />
          <Tooltip />
          <Legend />
          <Bar dataKey="coverage" fill="#8884d8" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

/** BET SIMULATOR COMPONENT (Basic Placeholder) **/
const BetSimulator = ({ games }) => {
  const [selectedGames, setSelectedGames] = useState([]);
  const toggleGame = (gameId) => {
    setSelectedGames((prev) =>
      prev.includes(gameId)
        ? prev.filter((id) => id !== gameId)
        : [...prev, gameId]
    );
  };

  // For simplicity, assume each game has a fixed payout multiplier of 2x
  const payout =
    selectedGames.length > 0 ? (2 ** selectedGames.length).toFixed(2) : 0;

  return (
    <div className="bet-simulator">
      <h2>Bet Simulator</h2>
      <p>Select games to build a parlay. Each game doubles your payout!</p>
      <div className="bet-games">
        {games.map((game) => (
          <div key={game.id} className="bet-game">
            <label>
              <input
                type="checkbox"
                checked={selectedGames.includes(game.id)}
                onChange={() => toggleGame(game.id)}
              />
              {game.homeTeam} vs. {game.awayTeam} (Week {game.week})
            </label>
          </div>
        ))}
      </div>
      <div className="bet-payout">
        <strong>Potential Payout Multiplier: {payout}x</strong>
      </div>
    </div>
  );
};

const Lines = () => {
  const [lines, setLines] = useState([]);
  const [teams, setTeams] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  // Filters: year, week, team
  const [filters, setFilters] = useState({
    year: "",
    week: "",
    team: "",
  });

  // Fetch teams and lines data on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        if (teams.length === 0) {
          const teamsData = await teamsService.getTeams();
          setTeams(teamsData);
        }
        const response = await teamsService.getGameLines(2024, null, "regular");
        const sortedLines = response.sort((a, b) => a.week - b.week);
        setLines(sortedLines);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [teams.length]);

  /**
   * Returns a style object for a given team.
   */
  const getTeamStyle = (teamName) => {
    const matchedTeam = teams.find(
      (t) => t.school.toLowerCase() === teamName.toLowerCase()
    );
    if (!matchedTeam) {
      return {
        backgroundColor: "#ccc",
        textColor: "#fff",
        logo: "/photos/default_team.png",
      };
    }
    let { color, alternateColor, logos } = matchedTeam;
    if (!color) color = "#ccc";
    const brightness = getColorBrightness(color);
    let finalColor = color;
    if (brightness < 80) {
      if (alternateColor) {
        const altBrightness = getColorBrightness(alternateColor);
        finalColor = altBrightness > 100 ? alternateColor : lightenColor(color, 30);
      } else {
        finalColor = lightenColor(color, 30);
      }
    }
    const finalBrightness = getColorBrightness(finalColor);
    const textColor = finalBrightness < 130 ? "#fff" : "#3b1f00";
    let chosenLogo = "/photos/default_team.png";
    if (logos && logos.length > 0) {
      if (finalBrightness < 130 && logos.length > 1) {
        chosenLogo = logos[1];
      } else {
        chosenLogo = logos[0];
      }
    }
    return {
      backgroundColor: finalColor,
      textColor,
      logo: chosenLogo,
    };
  };

  const getTeamAbbreviation = (teamName) => {
    const matchedTeam = teams.find(
      (t) => t.school.toLowerCase() === teamName.toLowerCase()
    );
    return matchedTeam?.abbreviation || teamName;
  };

  const getSportsbookLogo = (provider) => {
    const logos = {
      DraftKings: "/photos/draftkings.png",
      "ESPN Bet": "/photos/espnbet.png",
      Bovada: "/photos/bovada.png",
    };
    return logos[provider] || "/photos/default_sportsbook.png";
  };

  // --- Betting Logic Helpers ---
  const hasCoveredSpread = (spread, homeScore, awayScore) => {
    if (spread == null) return false;
    const margin = homeScore - awayScore;
    if (spread < 0) {
      return margin > Math.abs(spread);
    } else if (spread > 0) {
      const awayMargin = awayScore - homeScore;
      return awayMargin > spread;
    } else {
      return homeScore !== awayScore;
    }
  };

  const isOver = (overUnder, homeScore, awayScore) => {
    if (overUnder == null) return false;
    const total = homeScore + awayScore;
    return total > overUnder;
  };

  const homeMlCovered = (homeScore, awayScore) => homeScore > awayScore;
  const awayMlCovered = (homeScore, awayScore) => awayScore > homeScore;

  // --- Filtering Logic ---
  const filteredLines = lines.filter((game) => {
    const gameYear = new Date(game.startDate).getFullYear().toString();
    const matchYear = filters.year ? gameYear === filters.year : true;
    const matchWeek = filters.week ? game.week.toString() === filters.week : true;
    const matchTeam =
      filters.team
        ? game.homeTeam.toLowerCase().includes(filters.team.toLowerCase()) ||
          game.awayTeam.toLowerCase().includes(filters.team.toLowerCase())
        : true;
    return matchYear && matchWeek && matchTeam;
  });

  // --- Render States ---
  if (isLoading) {
    return <div className="lines-loading">Loading lines for 2024...</div>;
  }
  if (error) {
    return <div className="lines-error">Error: {error}</div>;
  }
  if (lines.length === 0) {
    return <p className="lines-none">No lines data available for 2024.</p>;
  }

  return (
    <div className="lines-page">
      <h1 className="lines-title">2024 Betting Odds</h1>

      {/* Filter Bar */}
      <FilterBar filters={filters} setFilters={setFilters} teams={teams} lines={lines} />

      {/* Coverage Chart */}
      <CoverageChart
        games={filteredLines}
        getTeamAbbreviation={getTeamAbbreviation}
        hasCoveredSpread={hasCoveredSpread}
      />

      {/* Bet Simulator */}
      <BetSimulator games={filteredLines} />

      {/* Lines List */}
      {filteredLines.map((game) => {
        const homeStyle = getTeamStyle(game.homeTeam);
        const awayStyle = getTeamStyle(game.awayTeam);
        return (
          <div key={game.id} className="lines-card">
            <div className="game-header">
              <div
                className="team-home-panel"
                style={{
                  backgroundColor: homeStyle.backgroundColor,
                  color: homeStyle.textColor,
                }}
              >
                <img
                  src={homeStyle.logo}
                  alt={game.homeTeam}
                  className="team-logo-large"
                />
                <div className="team-text">
                  <span className="team-name">{game.homeTeam}</span>
                </div>
              </div>
              <div className="game-center">
                <div className="game-week">Week {game.week}</div>
                <div className="game-date">
                  {new Date(game.startDate).toLocaleString()}
                </div>
                <div className="score-block">
                  <span className="score home-score">{game.homeScore}</span>
                  <span className="score away-score">{game.awayScore}</span>
                </div>
              </div>
              <div
                className="team-away-panel"
                style={{
                  backgroundColor: awayStyle.backgroundColor,
                  color: awayStyle.textColor,
                }}
              >
                <img
                  src={awayStyle.logo}
                  alt={game.awayTeam}
                  className="team-logo-large"
                />
                <div className="team-text">
                  <span className="team-name">{game.awayTeam}</span>
                </div>
              </div>
            </div>
            <div className="lines-row">
              {game.lines && game.lines.length > 0 ? (
                game.lines.map((line, index) => (
                  <div key={index} className="line-item">
                    <img
                      src={getSportsbookLogo(line.provider)}
                      alt={line.provider}
                      className="sportsbook-logo"
                    />
                    <div className="line-details">
                      <span className="spread">
                        <span className="metric-label">
                          Spread: {line.spread ?? "N/A"}
                        </span>
                        <span className="status">
                          {hasCoveredSpread(
                            line.spread,
                            game.homeScore,
                            game.awayScore
                          ) ? (
                            <>
                              <CheckIcon /> Covered!
                            </>
                          ) : (
                            <>
                              <CrossIcon /> Not Covered!
                            </>
                          )}
                        </span>
                      </span>
                      <span className="over-under">
                        <span className="metric-label">
                          O/U: {line.overUnder ?? "N/A"}
                        </span>
                        <span className="status">
                          {isOver(line.overUnder, game.homeScore, game.awayScore) ? (
                            <>
                              <CheckIcon /> Over!
                            </>
                          ) : (
                            <>
                              <CrossIcon /> Under!
                            </>
                          )}
                        </span>
                      </span>
                      <span className="moneyline">
                        <span className="metric-label">
                          {getTeamAbbreviation(game.homeTeam)} ML:{" "}
                          {line.homeMoneyline ?? "N/A"}
                        </span>
                        <span className="status">
                          {homeMlCovered(game.homeScore, game.awayScore) ? (
                            <>
                              <CheckIcon />
                            </>
                          ) : (
                            <>
                              <CrossIcon />
                            </>
                          )}
                        </span>
                      </span>
                      <span className="moneyline">
                        <span className="metric-label">
                          {getTeamAbbreviation(game.awayTeam)} ML:{" "}
                          {line.awayMoneyline ?? "N/A"}
                        </span>
                        <span className="status">
                          {awayMlCovered(game.homeScore, game.awayScore) ? (
                            <>
                              <CheckIcon />
                            </>
                          ) : (
                            <>
                              <CrossIcon />
                            </>
                          )}
                        </span>
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="line-item">No lines available</div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default Lines;