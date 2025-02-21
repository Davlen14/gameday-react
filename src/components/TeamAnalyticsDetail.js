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
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch the correct logo for a given team name
  const getTeamLogo = (teamName) => {
    const team = teamsList.find(
      (t) => t.school.toLowerCase() === teamName.toLowerCase()
    );
    return team && team.logos ? team.logos[0] : "/photos/default_team.png";
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

        // 4. Find the specific game by gameId (using g.id, adjust if your JSON uses gameId)
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

  // Pull colors from the game object
  const homeColor = game.homeColor;
  const awayColor = game.awayColor;

  // Prepare logos and date/time
  const homeLogo = getTeamLogo(game.homeTeam);
  const awayLogo = getTeamLogo(game.awayTeam);
  const gameDate = new Date(game.date).toLocaleDateString();
  const gameTime = game.time || "TBD";

  // Find advanced stats for home/away by matching team names
  const homeTeamStats = findTeamStatsByName(game.homeTeam);
  const awayTeamStats = findTeamStatsByName(game.awayTeam);
  const homeTeamCumulativeStats = findTeamCumulativeStatsByName(game.homeTeam);
  const awayTeamCumulativeStats = findTeamCumulativeStatsByName(game.awayTeam);

  // Extract advanced box score metrics (or 'N/A' if not found)
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

  // Prepare data for Player Stats Chart, using player usage stats from advancedStats.players.usage
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
          style={{ backgroundColor: awayColor }}
        />
        {/* Home Color Bar */}
        <div
          className="scoreboard__color-bar scoreboard__color-bar--right"
          style={{ backgroundColor: homeColor }}
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

      {/* Advanced Box Score Section - Replaced Table with Chart */}
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
        {/* Explanation for Advanced Box Score */}
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
            <Tooltip />
            <Legend />
            <Bar dataKey="Home" fill={homeColor || "#002244"} />
            <Bar dataKey="Away" fill={awayColor || "#008E97"} />
            <Line type="monotone" dataKey="Home" stroke={homeColor || "#002244"} />
            <Line type="monotone" dataKey="Away" stroke={awayColor || "#008E97"} />
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

      {/* New Player Stats Section - Replaced Table with Chart */}
      {advancedStats?.players && advancedStats.players.usage && (
        <div className="player-stats-section">
          <h2>Player Stats</h2>
          {/* Explanation for Player Stats */}
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
            <ComposedChart
              data={playerUsageData}
              margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
            >
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
                        ? homeColor
                        : entry.team === game.awayTeam
                        ? awayColor
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