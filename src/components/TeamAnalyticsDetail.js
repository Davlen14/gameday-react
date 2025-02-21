import React, { useState, useEffect } from "react";
import teamsService from "../services/teamsService";
import { useParams, useLocation } from "react-router-dom"; // Fixed import for useLocation
import "../styles/TeamAnalyticsDetail.css"; // Import your custom CSS
// Import Recharts components (added Cell for custom fills)
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  Cell
} from "recharts";

const TeamAnalyticsDetail = () => {
  const { teamId } = useParams();
  const { search } = useLocation();
  const queryParams = new URLSearchParams(search);
  const gameId = queryParams.get("gameId");

  const [teamsList, setTeamsList] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [game, setGame] = useState(null);
  const [advancedStats, setAdvancedStats] = useState(null);
  const [topPerformersPassing, setTopPerformersPassing] = useState(null);
  const [topPerformersRushing, setTopPerformersRushing] = useState(null);
  const [topPerformersReceiving, setTopPerformersReceiving] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch the correct logo for a given team name
  const getTeamLogo = (teamName) => {
    const team = teamsList.find(
      (t) => t.school.toLowerCase() === teamName.toLowerCase()
    );
    return team && team.logos ? team.logos[0] : "/photos/default_team.png";
  };

  // Helper to get team abbreviation
  const getTeamAbbreviation = (teamName) => {
    const team = teamsList.find(
      (t) => t.school.toLowerCase() === teamName.toLowerCase()
    );
    return team && team.abbreviation ? team.abbreviation : teamName;
  };

  // New helper to get team color from teamsList data
  const getTeamColor = (teamName) => {
    const team = teamsList.find(
      (t) => t.school.toLowerCase() === teamName.toLowerCase()
    );
    return team && team.color ? team.color : null;
  };

  // Custom tooltip for Advanced Box Score showing logos and abbreviation
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div
          className="custom-tooltip"
          style={{ backgroundColor: "#fff", border: "1px solid #ddd", padding: "10px" }}
        >
          <p style={{ marginBottom: "5px", fontWeight: "bold" }}>{label}</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
              <img
                src={getTeamLogo(game.homeTeam)}
                alt={game.homeTeam}
                style={{ width: 20, height: 20, objectFit: "contain" }}
              />
              <span>
                {getTeamAbbreviation(game.homeTeam)}:{" "}
                {payload.find((item) => item.dataKey === "Home")?.value}
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
              <img
                src={getTeamLogo(game.awayTeam)}
                alt={game.awayTeam}
                style={{ width: 20, height: 20, objectFit: "contain" }}
              />
              <span>
                {getTeamAbbreviation(game.awayTeam)}:{" "}
                {payload.find((item) => item.dataKey === "Away")?.value}
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  // Custom Legend for Advanced Box Score showing logos and abbreviations
  const renderCustomLegend = () => {
    return (
      <div style={{ display: "flex", justifyContent: "center", gap: "1.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <img
            src={getTeamLogo(game.homeTeam)}
            alt={game.homeTeam}
            style={{ width: 20, height: 20, objectFit: "contain" }}
          />
          <span>{getTeamAbbreviation(game.homeTeam)}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <img
            src={getTeamLogo(game.awayTeam)}
            alt={game.awayTeam}
            style={{ width: 20, height: 20, objectFit: "contain" }}
          />
          <span>{getTeamAbbreviation(game.awayTeam)}</span>
        </div>
      </div>
    );
  };

  // Helper functions to match advanced stats by team name
  const findTeamStatsByName = (teamName) => {
    if (!advancedStats?.teams?.ppa) return null;
    return advancedStats.teams.ppa.find(
      (item) => item.team.toLowerCase() === teamName.toLowerCase()
    );
  };

  const findTeamCumulativeStatsByName = (teamName) => {
    if (!advancedStats?.teams?.cumulativePpa) return null;
    return advancedStats.teams.cumulativePpa.find(
      (item) => item.team.toLowerCase() === teamName.toLowerCase()
    );
  };

  const findTeamExplosiveness = (teamName) => {
    if (!advancedStats?.teams?.explosiveness) return "N/A";
    return (
      advancedStats.teams.explosiveness.find(
        (item) => item.team.toLowerCase() === teamName.toLowerCase()
      )?.overall?.total ?? "N/A"
    );
  };

  const findTeamRushing = (teamName) => {
    if (!advancedStats?.teams?.rushing) return null;
    return advancedStats.teams.rushing.find(
      (item) => item.team.toLowerCase() === teamName.toLowerCase()
    );
  };

  const findTeamHavoc = (teamName) => {
    if (!advancedStats?.teams?.havoc) return null;
    return advancedStats.teams.havoc.find(
      (item) => item.team.toLowerCase() === teamName.toLowerCase()
    );
  };

  const findTeamScoring = (teamName) => {
    if (!advancedStats?.teams?.scoringOpportunities) return null;
    return advancedStats.teams.scoringOpportunities.find(
      (item) => item.team.toLowerCase() === teamName.toLowerCase()
    );
  };

  const findTeamFieldPosition = (teamName) => {
    if (!advancedStats?.teams?.fieldPosition) return null;
    return advancedStats.teams.fieldPosition.find(
      (item) => item.team.toLowerCase() === teamName.toLowerCase()
    );
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1. Fetch all teams
        const teamsData = await teamsService.getTeams();
        setTeamsList(teamsData);

        // 2. Find the selected team by ID
        const foundTeam = teamsData.find((t) => t.id === parseInt(teamId, 10));
        if (!foundTeam) {
          throw new Error("Team not found");
        }
        setSelectedTeam(foundTeam);

        // 3. Fetch that team's schedule
        const scheduleData = await teamsService.getTeamSchedule(
          foundTeam.school,
          2024
        );

        // 4. Find the specific game by gameId (using g.id)
        const foundGame = scheduleData.find(
          (g) => g.id === parseInt(gameId, 10)
        );
        if (!foundGame) {
          throw new Error("Game not found");
        }
        setGame(foundGame);

        // 5. Fetch advanced box score stats using the correct endpoint
        const advancedData = await teamsService.getAdvancedBoxScore(gameId);
        setAdvancedStats(advancedData);

        // 6. Fetch Top Performers for Passing, Rushing, Receiving
        const passingPlayers = await teamsService.getPlayerGameStats(
          gameId,
          2024,
          1,
          "regular",
          foundTeam.school,
          "passing"
        );
        const rushingPlayers = await teamsService.getPlayerGameStats(
          gameId,
          2024,
          1,
          "regular",
          foundTeam.school,
          "rushing"
        );
        const receivingPlayers = await teamsService.getPlayerGameStats(
          gameId,
          2024,
          1,
          "regular",
          foundTeam.school,
          "receiving"
        );

        setTopPerformersPassing(passingPlayers);
        setTopPerformersRushing(rushingPlayers);
        setTopPerformersReceiving(receivingPlayers);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [teamId, gameId]);

  if (isLoading) {
    return <div className="centered-fullscreen">Loading...</div>;
  }

  if (error) {
    return <div className="centered-fullscreen error">{error}</div>;
  }

  if (!game) {
    return <div className="centered-fullscreen">Game not found</div>;
  }

  // Get team colors: try to fetch from teamsList and fallback to game object values
  const homeTeamColor = getTeamColor(game.homeTeam) || game.homeColor;
  const awayTeamColor = getTeamColor(game.awayTeam) || game.awayColor;

  // Prepare logos and date/time
  const homeLogo = getTeamLogo(game.homeTeam);
  const awayLogo = getTeamLogo(game.awayTeam);
  const gameDate = new Date(game.date).toLocaleDateString();
  const gameTime = game.time || "TBD";

  // Find advanced stats for home/away
  const homeTeamStats = findTeamStatsByName(game.homeTeam);
  const awayTeamStats = findTeamStatsByName(game.awayTeam);
  const homeTeamCumulativeStats = findTeamCumulativeStatsByName(game.homeTeam);
  const awayTeamCumulativeStats = findTeamCumulativeStatsByName(game.awayTeam);

  // Extract metrics (or 'N/A' if not found)
  const overallPpaHome = homeTeamStats?.overall?.total ?? "N/A";
  const overallPpaAway = awayTeamStats?.overall?.total ?? "N/A";
  const passingPpaHome = homeTeamStats?.passing?.total ?? "N/A";
  const passingPpaAway = awayTeamStats?.passing?.total ?? "N/A";
  const rushingPpaHome = homeTeamStats?.rushing?.total ?? "N/A";
  const rushingPpaAway = awayTeamStats?.rushing?.total ?? "N/A";
  const cumulativeOverallHome = homeTeamCumulativeStats?.overall?.total ?? "N/A";
  const cumulativeOverallAway = awayTeamCumulativeStats?.overall?.total ?? "N/A";

  // Create data array for Advanced Box Score Chart
  const boxScoreData = [
    { metric: "Overall PPA", Home: overallPpaHome, Away: overallPpaAway },
    { metric: "Passing PPA", Home: passingPpaHome, Away: passingPpaAway },
    { metric: "Rushing PPA", Home: rushingPpaHome, Away: rushingPpaAway },
    { metric: "Cumulative PPA", Home: cumulativeOverallHome, Away: cumulativeOverallAway }
  ];

  // Prepare data for Player Stats Chart using player usage stats
  const playerUsageData =
    advancedStats?.players?.usage?.map((player) => ({
      name: player.player,
      Usage: player.total,
      Rushing: player.rushing,
      Passing: player.passing,
      team: player.team,
      position: player.position
    })) || [];

  return (
    <div className="team-analytics-page">
      {/* Scoreboard Section */}
      <div className="scoreboard">
        {/* Away Color Bar */}
        <div
          className="scoreboard__color-bar scoreboard__color-bar--left"
          style={{ backgroundColor: awayTeamColor }}
        />
        {/* Home Color Bar */}
        <div
          className="scoreboard__color-bar scoreboard__color-bar--right"
          style={{ backgroundColor: homeTeamColor }}
        />
        {/* Away Team */}
        <div className="scoreboard__team scoreboard__team--away">
          <img src={awayLogo} alt={game.awayTeam} className="scoreboard__logo" />
          <div className="scoreboard__team-info">
            <span className="scoreboard__team-name">{game.awayTeam}</span>
            {game.awayConference && (
              <span className="scoreboard__conference">{game.awayConference}</span>
            )}
            {game.awayPoints !== undefined && (
              <span className="scoreboard__team-score">{game.awayPoints}</span>
            )}
          </div>
        </div>
        {/* Game Info (Center) */}
        <div className="scoreboard__center">
          <div className="scoreboard__date">{gameDate}</div>
          <div className="scoreboard__time">{gameTime}</div>
          <div className="scoreboard__venue">{game.venue}</div>
          {(game.mediaType || game.outlet) && (
            <div className="scoreboard__media">
              <span className="scoreboard__media-text">
                Media: {game.mediaType} | Outlet: {game.outlet}
              </span>
            </div>
          )}
          {(game.season || game.week || game.seasonType) && (
            <div className="scoreboard__season">
              <span>
                Season: {game.season} | Week: {game.week} ({game.seasonType})
              </span>
            </div>
          )}
        </div>
        {/* Home Team */}
        <div className="scoreboard__team scoreboard__team--home">
          <div className="scoreboard__team-info">
            <span className="scoreboard__team-name">{game.homeTeam}</span>
            {game.homeConference && (
              <span className="scoreboard__conference">{game.homeConference}</span>
            )}
            {game.homePoints !== undefined && (
              <span className="scoreboard__team-score">{game.homePoints}</span>
            )}
          </div>
          <img src={homeLogo} alt={game.homeTeam} className="scoreboard__logo" />
        </div>
      </div>

      {/* Top Performers Section */}
      <div
        className="top-performers"
        style={{
          width: "96%",
          margin: "2% auto",
          background: "#fff",
          borderRadius: "8px",
          padding: "20px",
          boxShadow: "0 4px 8px rgba(0,0,0,0.1)"
        }}
      >
        <h2 style={{ textAlign: "center", marginBottom: "15px" }}>Top Performers</h2>
        <div
          className="top-performers__container"
          style={{ display: "flex", flexWrap: "wrap", gap: "2%" }}
        >
          {[
            { team: game.homeTeam, label: getTeamAbbreviation(game.homeTeam) },
            { team: game.awayTeam, label: getTeamAbbreviation(game.awayTeam) }
          ].map((side) => {
            const passingCategory = topPerformersPassing &&
              topPerformersPassing[0]?.teams.find(
                (t) => t.team.toLowerCase() === side.team.toLowerCase()
              )?.categories.find((cat) => cat.name === "passing");
            const rushingCategory = topPerformersRushing &&
              topPerformersRushing[0]?.teams.find(
                (t) => t.team.toLowerCase() === side.team.toLowerCase()
              )?.categories.find((cat) => cat.name === "rushing");
            const receivingCategory = topPerformersReceiving &&
              topPerformersReceiving[0]?.teams.find(
                (t) => t.team.toLowerCase() === side.team.toLowerCase()
              )?.categories.find((cat) => cat.name === "receiving");

            return (
              <div
                key={side.team}
                className="top-performers__team"
                style={{
                  flex: "1 1 48%",
                  border: "1px solid #eee",
                  borderRadius: "8px",
                  padding: "10px"
                }}
              >
                <h3 style={{ textAlign: "center", marginBottom: "10px" }}>
                  {side.label}
                </h3>
                {/* Passing Section */}
                <div className="top-performers__category">
                  <h4>Passing</h4>
                  {passingCategory &&
                    passingCategory.types
                      .filter((type) => ["YDS", "C/ATT", "QBR", "TD"].includes(type.name))
                      .map((statType) => (
                        <div key={statType.name} style={{ marginBottom: "5px" }}>
                          <strong>{statType.name}:</strong>{" "}
                          {statType.athletes.slice(0, 2).map((athlete, i) => (
                            <span key={athlete.id}>
                              {athlete.name} ({athlete.stat})
                              {i === 0 ? ", " : ""}
                            </span>
                          ))}
                        </div>
                      ))}
                </div>
                {/* Rushing Section */}
                <div className="top-performers__category">
                  <h4>Rushing</h4>
                  {rushingCategory &&
                    rushingCategory.types
                      .filter((type) => ["YDS", "CAR", "TD"].includes(type.name))
                      .map((statType) => (
                        <div key={statType.name} style={{ marginBottom: "5px" }}>
                          <strong>{statType.name}:</strong>{" "}
                          {statType.athletes.slice(0, 2).map((athlete, i) => (
                            <span key={athlete.id}>
                              {athlete.name} ({athlete.stat})
                              {i === 0 ? ", " : ""}
                            </span>
                          ))}
                        </div>
                      ))}
                </div>
                {/* Receiving Section */}
                <div className="top-performers__category">
                  <h4>Receiving</h4>
                  {receivingCategory &&
                    receivingCategory.types
                      .filter((type) => ["YDS", "REC", "TD"].includes(type.name))
                      .map((statType) => (
                        <div key={statType.name} style={{ marginBottom: "5px" }}>
                          <strong>{statType.name}:</strong>{" "}
                          {statType.athletes.slice(0, 2).map((athlete, i) => (
                            <span key={athlete.id}>
                              {athlete.name} ({athlete.stat})
                              {i === 0 ? ", " : ""}
                            </span>
                          ))}
                        </div>
                      ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Advanced Box Score Section */}
      <div className="advanced-box-score">
        <h2
          title={`Definitions:
Overall PPA: Average points per play overall.
Passing PPA: Average points per play from passing.
Rushing PPA: Average points per play from rushing.
Cumulative PPA: Cumulative overall points per play.
Higher values generally indicate more efficient and effective plays.
(Note: Negative values or lower totals suggest underperformance.)`}
        >
          Advanced Box Score
        </h2>
        <div className="explanation-box">
          <p>
            <strong>Overall PPA:</strong> Measures average points per play overall. Higher values indicate more effective plays.
          </p>
          <p>
            <strong>Passing PPA:</strong> Represents points per play from passing. A higher value generally means better passing efficiency.
          </p>
          <p>
            <strong>Rushing PPA:</strong> Indicates points per play from rushing. Positive values are favorable, while negative values suggest inefficiency.
          </p>
          <p>
            <strong>Cumulative PPA:</strong> Reflects total accumulated points per play. Positive cumulative totals are desirable.
          </p>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={boxScoreData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="metric" />
            <YAxis />
            <Tooltip content={<CustomTooltip />} />
            <Legend content={renderCustomLegend} />
            <Bar dataKey="Home" fill={homeTeamColor ? homeTeamColor : "#002244"} />
            <Bar dataKey="Away" fill={awayTeamColor ? awayTeamColor : "#008E97"} />
            <Line type="monotone" dataKey="Home" stroke={homeTeamColor ? homeTeamColor : "#002244"} />
            <Line type="monotone" dataKey="Away" stroke={awayTeamColor ? awayTeamColor : "#008E97"} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Additional Dashboard Content */}
      <div className="dashboard-content">
        <div className="dashboard-stats">
          <h2>Additional Dashboard Stats</h2>
          <p>Add your content here...</p>
        </div>
      </div>

      {/* Player Stats Section */}
      {advancedStats?.players && advancedStats.players.usage && (
        <div className="player-stats-section">
          <h2>Player Stats</h2>
          <div className="explanation-box">
            <p>
              <strong>Usage:</strong> Represents the overall involvement of the player in the game. Higher usage typically indicates a key role.
            </p>
            <p>
              <strong>Rushing:</strong> Measures performance on rushing plays. Positive numbers are better.
            </p>
            <p>
              <strong>Passing:</strong> Indicates production from passing plays. Higher values point to effective passing involvement.
            </p>
          </div>
          <ResponsiveContainer width="100%" height={400}>
            <ComposedChart data={playerUsageData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="Usage" stackId="a">
                {playerUsageData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={
                      entry.team === game.homeTeam
                        ? homeTeamColor
                        : entry.team === game.awayTeam
                        ? awayTeamColor
                        : "#8884d8"
                    }
                  />
                ))}
              </Bar>
              <Bar dataKey="Rushing" stackId="a" fill="#82ca9d" />
              <Bar dataKey="Passing" stackId="a" fill="#ffc658" />
              <Line type="monotone" dataKey="Usage" stroke="#8884d8" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default TeamAnalyticsDetail;