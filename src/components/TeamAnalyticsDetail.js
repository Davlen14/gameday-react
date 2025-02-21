import React, { useState, useEffect } from "react";
import teamsService from "../services/teamsService";
import { useParams, useLocation } from "react-router-dom"; // Fixed import for useLocation
import "../styles/TeamAnalyticsDetail.css"; // Import your custom CSS

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

        // 4. Find the specific game by gameId
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
  const cumulativeOverallHome =
    homeTeamCumulativeStats?.overall?.total ?? "N/A";
  const cumulativeOverallAway =
    awayTeamCumulativeStats?.overall?.total ?? "N/A";

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
              <span className="scoreboard__conference">
                {game.awayConference}
              </span>
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
              <span className="scoreboard__conference">
                {game.homeConference}
              </span>
            )}
            {game.homePoints !== undefined && (
              <span className="scoreboard__team-score">{game.homePoints}</span>
            )}
          </div>
          <img src={homeLogo} alt={game.homeTeam} className="scoreboard__logo" />
        </div>
      </div>

      {/* Advanced Box Score Section */}
      <div className="advanced-box-score">
        <h2>Advanced Box Score</h2>
        <table className="advanced-box-score__table">
          <thead>
            <tr>
              <th>Category</th>
              <th>{game.homeTeam}</th>
              <th>{game.awayTeam}</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Overall PPA</td>
              <td>{overallPpaHome}</td>
              <td>{overallPpaAway}</td>
            </tr>
            <tr>
              <td>Passing PPA</td>
              <td>{passingPpaHome}</td>
              <td>{passingPpaAway}</td>
            </tr>
            <tr>
              <td>Rushing PPA</td>
              <td>{rushingPpaHome}</td>
              <td>{rushingPpaAway}</td>
            </tr>
            <tr>
              <td>Cumulative Overall PPA</td>
              <td>{cumulativeOverallHome}</td>
              <td>{cumulativeOverallAway}</td>
            </tr>
            {/* Add additional rows here for more advanced metrics */}
          </tbody>
        </table>
      </div>

      {/* Additional Dashboard Content */}
      <div className="dashboard-content">
        <div className="dashboard-stats">
          <h2>Additional Dashboard Stats</h2>
          <p>Add your content here...</p>
        </div>
      </div>
    </div>
  );
};

export default TeamAnalyticsDetail;
