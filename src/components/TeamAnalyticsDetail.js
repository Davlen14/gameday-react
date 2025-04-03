// TeamAnalyticsDetail.js
import React, { useState, useEffect } from "react";
import teamsService from "../services/teamsService";
import { useParams, useLocation } from "react-router-dom";
import "../styles/TeamAnalyticsDetail.css";
// Import Recharts components
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
  Cell,
} from "recharts";
// Import the TopPerformers component
import TopPerformers from "./TopPerformers";

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

  // Helper to get team color
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

        // 5. Fetch advanced box score stats
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
      position: player.position,
    })) || [];

  // Prepare team stats data (mock data if not available from API)
  const teamStats = [
    {
      label: "Total yards",
      homeValue: game.homeStats?.totalYards || 467,
      awayValue: game.awayStats?.totalYards || 496
    },
    {
      label: "Passing yards",
      homeValue: game.homeStats?.passingYards || 326,
      awayValue: game.awayStats?.passingYards || 341
    },
    {
      label: "Rushing yards",
      homeValue: game.homeStats?.rushingYards || 141,
      awayValue: game.awayStats?.rushingYards || 155
    },
    {
      label: "Yards per play",
      homeValue: game.homeStats?.yardsPerPlay || 6.9,
      awayValue: game.awayStats?.yardsPerPlay || 7.6
    },
    {
      label: "First downs",
      homeValue: game.homeStats?.firstDowns || 22,
      awayValue: game.awayStats?.firstDowns || 18
    },
    {
      label: "3rd down efficiency",
      homeValue: game.homeStats?.thirdDownEff || "4/12",
      awayValue: game.awayStats?.thirdDownEff || "6/14",
      isText: true
    },
    {
      label: "4th down efficiency",
      homeValue: game.homeStats?.fourthDownEff || "2/2",
      awayValue: game.awayStats?.fourthDownEff || "1/2",
      isText: true
    },
    {
      label: "Total plays",
      homeValue: game.homeStats?.totalPlays || 68,
      awayValue: game.awayStats?.totalPlays || 65
    },
    {
      label: "Punts",
      homeValue: game.homeStats?.punts || 3,
      awayValue: game.awayStats?.punts || 3
    },
    {
      label: "Penalties (Yards)",
      homeValue: game.homeStats?.penalties || "8 (70)",
      awayValue: game.awayStats?.penalties || "3 (25)",
      isText: true
    },
    {
      label: "Fumbles lost",
      homeValue: game.homeStats?.fumblesLost || 2,
      awayValue: game.awayStats?.fumblesLost || 0
    },
    {
      label: "Interceptions thrown",
      homeValue: game.homeStats?.interceptionsThrown || 0,
      awayValue: game.awayStats?.interceptionsThrown || 0
    },
    {
      label: "Time of possession",
      homeValue: game.homeStats?.timeOfPossession || "33:09",
      awayValue: game.awayStats?.timeOfPossession || "26:51",
      isText: true
    }
  ];

  // Helper function to calculate bar widths for the team stats
  const calculateWidth = (home, away, isText) => {
    if (isText) return { homeWidth: 50, awayWidth: 50 };
    
    const total = home + away;
    if (total === 0) return { homeWidth: 50, awayWidth: 50 };
    
    const homeWidth = Math.round((home / total) * 100);
    const awayWidth = 100 - homeWidth;
    
    return { homeWidth, awayWidth };
  };

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

      {/* Team Stats Comparison */}
      <div className="team-stats-section">
        <h2>TEAM STATS</h2>
        <div className="team-stats-container">
          <div className="team-stats-header">
            <div className="team-stats-team team-stats-home">
              <img src={homeLogo} alt={game.homeTeam} className="team-stats-logo" />
              <span>{game.homePoints !== undefined ? game.homePoints : ""}</span>
            </div>
            <div className="team-stats-labels"></div>
            <div className="team-stats-team team-stats-away">
              <span>{game.awayPoints !== undefined ? game.awayPoints : ""}</span>
              <img src={awayLogo} alt={game.awayTeam} className="team-stats-logo" />
            </div>
          </div>
          
          <div className="team-stats-metrics">
            {teamStats.map((stat, index) => {
              const { homeWidth, awayWidth } = calculateWidth(stat.homeValue, stat.awayValue, stat.isText);
              const homeTextValue = typeof stat.homeValue === 'string' ? stat.homeValue : stat.homeValue.toLocaleString();
              const awayTextValue = typeof stat.awayValue === 'string' ? stat.awayValue : stat.awayValue.toLocaleString();
              
              return (
                <div key={index} className="team-stats-row">
                  <div className="team-stats-home-value">{homeTextValue}</div>
                  
                  <div className="team-stats-bar-container">
                    <div className="team-stats-bar-label">{stat.label}</div>
                    <div className="team-stats-bars">
                      <div 
                        className="team-stats-bar team-stats-bar-home" 
                        style={{ 
                          width: `${homeWidth}%`,
                          backgroundColor: homeTeamColor || '#CC0000'
                        }}
                      ></div>
                      <div 
                        className="team-stats-bar team-stats-bar-away" 
                        style={{ 
                          width: `${awayWidth}%`,
                          backgroundColor: awayTeamColor || '#009900'
                        }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="team-stats-away-value">{awayTextValue}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Top Performers Section (imported from TopPerformers.js) */}
      <TopPerformers
        game={game}
        topPerformersPassing={topPerformersPassing}
        topPerformersRushing={topPerformersRushing}
        topPerformersReceiving={topPerformersReceiving}
        getTeamAbbreviation={getTeamAbbreviation}
      />

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