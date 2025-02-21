import React, { useEffect, useState } from "react";
import teamsService from "../services/teamsService";
import "../styles/Lines.css"; // Your custom CSS file

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
 * The higher the value, the lighter the color.
 */
function getColorBrightness(hex) {
  // Strip "#" if present
  const cleanHex = hex.replace(/^#/, "");

  // Parse r, g, b
  const bigint = parseInt(cleanHex, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;

  // Simple brightness formula
  // (There are more advanced formulas, but this is a good start)
  return (r * 299 + g * 587 + b * 114) / 1000;
}

/**
 * Lightens a dark color by a certain amount (0-100).
 * Very simplistic approach for demonstration.
 */
function lightenColor(hex, amount = 30) {
  // Convert hex to RGB
  const cleanHex = hex.replace(/^#/, "");
  let bigint = parseInt(cleanHex, 16);

  let r = (bigint >> 16) & 255;
  let g = (bigint >> 8) & 255;
  let b = bigint & 255;

  // Increase each channel by 'amount', clamp to 255
  r = Math.min(255, r + amount);
  g = Math.min(255, g + amount);
  b = Math.min(255, b + amount);

  // Reassemble into hex
  const newColor =
    "#" +
    ((1 << 24) + (r << 16) + (g << 8) + b)
      .toString(16)
      .slice(1)
      .toUpperCase();
  return newColor;
}

const Lines = () => {
  const [lines, setLines] = useState([]);
  const [teams, setTeams] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch teams and lines data on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);

        // Only fetch teams if we haven't loaded them yet
        if (teams.length === 0) {
          const teamsData = await teamsService.getTeams();
          setTeams(teamsData);
        }

        // Fetch lines for 2024 regular season
        const response = await teamsService.getGameLines(2024, null, "regular");
        // Sort games by week so they appear in ascending order
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
   * Returns a style object for a given team:
   * {
   *   backgroundColor: "#c4012f" or some adjusted color,
   *   textColor: "#fff" or "#000",
   *   logo: "logo_url.png" (maybe the secondary logo if color is dark)
   * }
   */
  const getTeamStyle = (teamName) => {
    // Find the team
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

    // Grab the primary color & alt color
    let { color, alternateColor, logos } = matchedTeam;
    if (!color) color = "#ccc";

    // Determine brightness
    const brightness = getColorBrightness(color);

    // If color is too dark (<128?), we can either lighten it or use alternateColor
    let finalColor = color;
    if (brightness < 80) {
      // Let's see if we have an alternateColor
      if (alternateColor) {
        // Check if alt color is lighter
        const altBrightness = getColorBrightness(alternateColor);
        // If alt is significantly brighter, use it, otherwise lighten the original
        finalColor = altBrightness > 100 ? alternateColor : lightenColor(color, 60);
      } else {
        // No alt color, so lighten the original
        finalColor = lightenColor(color, 60);
      }
    }

    // Now decide on text color based on finalColor
    const finalBrightness = getColorBrightness(finalColor);
    const textColor = finalBrightness < 130 ? "#fff" : "#000";

    // Decide which logo to use (if we have a second one for dark backgrounds, e.g. the '-dark' version)
    let chosenLogo = "/photos/default_team.png";
    if (logos && logos.length > 0) {
      // If finalColor is dark, maybe use logos[1] if it exists
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

  /**
   * Return a team's abbreviation or the full team name if abbreviation not found
   */
  const getTeamAbbreviation = (teamName) => {
    const matchedTeam = teams.find(
      (t) => t.school.toLowerCase() === teamName.toLowerCase()
    );
    return matchedTeam?.abbreviation || teamName;
  };

  /**
   * Return a sportsbook logo by provider name, or a default if not found
   */
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
    if (spread == null) return false; // No spread data
    const margin = homeScore - awayScore;

    if (spread < 0) {
      // Home favored by abs(spread)
      return margin > Math.abs(spread);
    } else if (spread > 0) {
      // Away favored
      const awayMargin = awayScore - homeScore;
      return awayMargin > spread;
    } else {
      // spread == 0 => "pick 'em"
      // Covered if there's a winner (not a tie)
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

  // --- Main Render ---
  return (
    <div className="lines-page">
      <h1 className="lines-title">2024 Betting Odds</h1>

      {lines.map((game) => {
        // Use getTeamStyle for both home & away
        const homeStyle = getTeamStyle(game.homeTeam);
        const awayStyle = getTeamStyle(game.awayTeam);

        return (
          <div key={game.id} className="lines-card">
            {/* 
              Game Header with 3 sections:
              1) Left angled color panel for Home
              2) Center neutral area for game date/time
              3) Right angled color panel for Away
            */}
            <div className="game-header">
              {/* Left Panel (Home Team) */}
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
                  <span className="team-score">{game.homeScore}</span>
                </div>
              </div>

              {/* Center Info (Neutral) */}
              <div className="game-center">
                <div className="game-week">Week {game.week}</div>
                <div className="game-date">
                  {new Date(game.startDate).toLocaleString()}
                </div>
              </div>

              {/* Right Panel (Away Team) */}
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
                  <span className="team-score">{game.awayScore}</span>
                </div>
              </div>
            </div>

            {/* Lines Section */}
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
                      {/* Spread */}
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

                      {/* Over/Under */}
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

                      {/* Home ML */}
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

                      {/* Away ML */}
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