
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

      {/* Advanced Box Score Section */}
      <div className="advanced-box-score">
        <h2
          title={`Definitions:
Overall PPA: Average points per play (overall).
Passing PPA: Average points per play from passing.
Rushing PPA: Average points per play from rushing.
Cumulative Overall PPA: Cumulative overall points per play.
Success Rates: Overall, standard downs, and passing downs success.
Explosiveness: Explosive play metric.
Rushing Metrics: Includes power success, stuff rate, line yards, second level, and open field yards.
Havoc: Defensive disruption metrics.
Scoring Opportunities: Number, points, and efficiency.
Field Position: Average start and predicted points.`}
        >
          Advanced Box Score
        </h2>
        <table className="advanced-box-score__table">
          <thead>
            <tr>
              <th>Category</th>
              <th>{game.homeTeam}</th>
              <th>{game.awayTeam}</th>
            </tr>
          </thead>
          <tbody>
            <tr title="Average points per play (overall)">
              <td>Overall PPA</td>
              <td>{overallPpaHome}</td>
              <td>{overallPpaAway}</td>
            </tr>
            <tr title="Points per play from passing">
              <td>Passing PPA</td>
              <td>{passingPpaHome}</td>
              <td>{passingPpaAway}</td>
            </tr>
            <tr title="Points per play from rushing">
              <td>Rushing PPA</td>
              <td>{rushingPpaHome}</td>
              <td>{rushingPpaAway}</td>
            </tr>
            <tr title="Cumulative overall points per play">
              <td>Cumulative Overall PPA</td>
              <td>{cumulativeOverallHome}</td>
              <td>{cumulativeOverallAway}</td>
            </tr>
            <tr title="Overall success rate">
              <td>Success Rate (Overall)</td>
              <td>
                {advancedStats?.teams?.successRates?.find(
                  (item) =>
                    item.team.toLowerCase() === game.homeTeam.toLowerCase()
                )?.overall?.total ?? "N/A"}
              </td>
              <td>
                {advancedStats?.teams?.successRates?.find(
                  (item) =>
                    item.team.toLowerCase() === game.awayTeam.toLowerCase()
                )?.overall?.total ?? "N/A"}
              </td>
            </tr>
            <tr title="Standard downs success rate">
              <td>Standard Downs Success</td>
              <td>
                {advancedStats?.teams?.successRates?.find(
                  (item) =>
                    item.team.toLowerCase() === game.homeTeam.toLowerCase()
                )?.standardDowns?.total ?? "N/A"}
              </td>
              <td>
                {advancedStats?.teams?.successRates?.find(
                  (item) =>
                    item.team.toLowerCase() === game.awayTeam.toLowerCase()
                )?.standardDowns?.total ?? "N/A"}
              </td>
            </tr>
            <tr title="Passing downs success rate">
              <td>Passing Downs Success</td>
              <td>
                {advancedStats?.teams?.successRates?.find(
                  (item) =>
                    item.team.toLowerCase() === game.homeTeam.toLowerCase()
                )?.passingDowns?.total ?? "N/A"}
              </td>
              <td>
                {advancedStats?.teams?.successRates?.find(
                  (item) =>
                    item.team.toLowerCase() === game.awayTeam.toLowerCase()
                )?.passingDowns?.total ?? "N/A"}
              </td>
            </tr>
            <tr title="Explosive play metric (overall)">
              <td>Explosiveness</td>
              <td>{findTeamExplosiveness(game.homeTeam)}</td>
              <td>{findTeamExplosiveness(game.awayTeam)}</td>
            </tr>
            {(() => {
              const homeRushing = findTeamRushing(game.homeTeam);
              const awayRushing = findTeamRushing(game.awayTeam);
              return (
                <>
                  <tr title="Power success rate">
                    <td>Rushing - Power Success</td>
                    <td>{homeRushing?.powerSuccess ?? "N/A"}</td>
                    <td>{awayRushing?.powerSuccess ?? "N/A"}</td>
                  </tr>
                  <tr title="Stuff rate">
                    <td>Rushing - Stuff Rate</td>
                    <td>{homeRushing?.stuffRate ?? "N/A"}</td>
                    <td>{awayRushing?.stuffRate ?? "N/A"}</td>
                  </tr>
                  <tr title="Line yards">
                    <td>Rushing - Line Yards</td>
                    <td>{homeRushing?.lineYards ?? "N/A"}</td>
                    <td>{awayRushing?.lineYards ?? "N/A"}</td>
                  </tr>
                  <tr title="Line yards average">
                    <td>Rushing - Line Yards Average</td>
                    <td>{homeRushing?.lineYardsAverage ?? "N/A"}</td>
                    <td>{awayRushing?.lineYardsAverage ?? "N/A"}</td>
                  </tr>
                  <tr title="Second level yards">
                    <td>Rushing - Second Level Yards</td>
                    <td>{homeRushing?.secondLevelYards ?? "N/A"}</td>
                    <td>{awayRushing?.secondLevelYards ?? "N/A"}</td>
                  </tr>
                  <tr title="Second level yards average">
                    <td>Rushing - Second Level Yards Average</td>
                    <td>{homeRushing?.secondLevelYardsAverage ?? "N/A"}</td>
                    <td>{awayRushing?.secondLevelYardsAverage ?? "N/A"}</td>
                  </tr>
                  <tr title="Open field yards">
                    <td>Rushing - Open Field Yards</td>
                    <td>{homeRushing?.openFieldYards ?? "N/A"}</td>
                    <td>{awayRushing?.openFieldYards ?? "N/A"}</td>
                  </tr>
                  <tr title="Open field yards average">
                    <td>Rushing - Open Field Yards Average</td>
                    <td>{homeRushing?.openFieldYardsAverage ?? "N/A"}</td>
                    <td>{awayRushing?.openFieldYardsAverage ?? "N/A"}</td>
                  </tr>
                </>
              );
            })()}
            {(() => {
              const homeHavoc = findTeamHavoc(game.homeTeam);
              const awayHavoc = findTeamHavoc(game.awayTeam);
              return (
                <>
                  <tr title="Total havoc">
                    <td>Havoc - Total</td>
                    <td>{homeHavoc?.total ?? "N/A"}</td>
                    <td>{awayHavoc?.total ?? "N/A"}</td>
                  </tr>
                  <tr title="Front Seven havoc">
                    <td>Havoc - Front Seven</td>
                    <td>{homeHavoc?.frontSeven ?? "N/A"}</td>
                    <td>{awayHavoc?.frontSeven ?? "N/A"}</td>
                  </tr>
                  <tr title="DB havoc">
                    <td>Havoc - DB</td>
                    <td>{homeHavoc?.db ?? "N/A"}</td>
                    <td>{awayHavoc?.db ?? "N/A"}</td>
                  </tr>
                </>
              );
            })()}
            {(() => {
              const homeScoring = findTeamScoring(game.homeTeam);
              const awayScoring = findTeamScoring(game.awayTeam);
              return (
                <>
                  <tr title="Number of scoring opportunities">
                    <td>Scoring Opportunities</td>
                    <td>{homeScoring?.opportunities ?? "N/A"}</td>
                    <td>{awayScoring?.opportunities ?? "N/A"}</td>
                  </tr>
                  <tr title="Points scored from scoring opportunities">
                    <td>Points</td>
                    <td>{homeScoring?.points ?? "N/A"}</td>
                    <td>{awayScoring?.points ?? "N/A"}</td>
                  </tr>
                  <tr title="Points per opportunity">
                    <td>Points Per Opportunity</td>
                    <td>{homeScoring?.pointsPerOpportunity ?? "N/A"}</td>
                    <td>{awayScoring?.pointsPerOpportunity ?? "N/A"}</td>
                  </tr>
                </>
              );
            })()}
            {(() => {
              const homeField = findTeamFieldPosition(game.homeTeam);
              const awayField = findTeamFieldPosition(game.awayTeam);
              return (
                <>
                  <tr title="Average starting field position">
                    <td>Average Start</td>
                    <td>{homeField?.averageStart ?? "N/A"}</td>
                    <td>{awayField?.averageStart ?? "N/A"}</td>
                  </tr>
                  <tr title="Average starting predicted points">
                    <td>Starting Predicted Points</td>
                    <td>{homeField?.averageStartingPredictedPoints ?? "N/A"}</td>
                    <td>{awayField?.averageStartingPredictedPoints ?? "N/A"}</td>
                  </tr>
                </>
              );
            })()}
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

      {/* New Player Stats Section */}
      {advancedStats?.players && advancedStats.players.usage && (
        <div className="player-stats-section">
          <h2>Player Stats</h2>
          <table className="player-stats-table">
            <thead>
              <tr>
                <th>Player</th>
                <th>Team</th>
                <th>Position</th>
                <th>Total Usage</th>
                <th>Rushing</th>
                <th>Passing</th>
              </tr>
            </thead>
            <tbody>
              {advancedStats.players.usage.map((player, index) => (
                <tr key={index}>
                  <td>{player.player}</td>
                  <td>{player.team}</td>
                  <td>{player.position}</td>
                  <td>{player.total}</td>
                  <td>{player.rushing}</td>
                  <td>{player.passing}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default TeamAnalyticsDetail;