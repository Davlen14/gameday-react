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
  const [teamGameStats, setTeamGameStats] = useState(null);
  const [topPerformersPassing, setTopPerformersPassing] = useState(null);
  const [topPerformersRushing, setTopPerformersRushing] = useState(null);
  const [topPerformersReceiving, setTopPerformersReceiving] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fetchErrors, setFetchErrors] = useState({});

  const getTeamLogo = (teamName) => {
    const team = teamsList.find(
      (t) => t.school.toLowerCase() === teamName.toLowerCase()
    );
    return team && team.logos ? team.logos[0] : "/photos/default_team.png";
  };

  const getTeamAbbreviation = (teamName) => {
    const team = teamsList.find(
      (t) => t.school.toLowerCase() === teamName.toLowerCase()
    );
    return team && team.abbreviation ? team.abbreviation : teamName;
  };

  const getTeamColor = (teamName) => {
    const team = teamsList.find(
      (t) => t.school.toLowerCase() === teamName.toLowerCase()
    );
    return team && team.color ? team.color : null;
  };

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

  const renderFetchErrors = () => {
    if (Object.keys(fetchErrors).length === 0) return null;

    return (
      <div className="fetch-errors" style={{ 
        backgroundColor: '#ffeeee', 
        padding: '15px', 
        margin: '10px 0', 
        borderRadius: '5px' 
      }}>
        <h3>Some data could not be loaded:</h3>
        {Object.entries(fetchErrors).map(([key, errorMsg]) => (
          <p key={key} style={{ margin: '5px 0' }}>
            <strong>{key}:</strong> {errorMsg}
          </p>
        ))}
      </div>
    );
  };

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

  const findTeamStats = (teamName) => {
    if (!teamGameStats || teamGameStats.length === 0) {
      console.log('No team game stats available');
      return null;
    }
    
    const gameData = teamGameStats[0];
    if (!gameData || !gameData.teams) {
      console.log('No teams data found in game stats');
      return null;
    }
    
    return gameData.teams.find(team => 
      team.team.toLowerCase() === teamName.toLowerCase());
  };

  function createMockTeamData(teamName, isHome) {
    console.log(`Creating mock data for ${teamName} as API data is not available`);
    return {
      team: teamName,
      stats: [
        { category: "totalYards", stat: isHome ? "600" : "145" },
        { category: "netPassingYards", stat: isHome ? "266" : "103" },
        { category: "rushingYards", stat: isHome ? "334" : "42" },
        { category: "yardsPerRushAttempt", stat: isHome ? "7.1" : "1.6" },
        { category: "firstDowns", stat: isHome ? "25" : "10" },
        { category: "thirdDownEff", stat: isHome ? "8-13" : "3-18" },
        { category: "fourthDownEff", stat: isHome ? "1-1" : "2-3" },
        { category: "totalPenaltiesYards", stat: isHome ? "7-59" : "4-40" },
        { category: "fumblesLost", stat: isHome ? "1" : "0" },
        { category: "interceptions", stat: isHome ? "0" : "2" },
        { category: "possessionTime", stat: isHome ? "30:35" : "29:25" }
      ]
    };
  }

  const getStatValue = (teamData, category) => {
    if (!teamData || !teamData.stats) {
      console.log(`No stats found for category: ${category}`);
      return '-';
    }
    const statItem = teamData.stats.find(stat => stat.category === category);
    console.log(`Stat for ${category}:`, statItem);
    return statItem ? statItem.stat : '-';
  };

  const calculateWidth = (home, away, isText) => {
    if (isText) return { homeWidth: 50, awayWidth: 50 };
    
    if (home === '-' || away === '-') return { homeWidth: 50, awayWidth: 50 };
    
    const homeNum = typeof home === 'string' ? parseFloat(home) : home;
    const awayNum = typeof away === 'string' ? parseFloat(away) : away;
    
    if (isNaN(homeNum) || isNaN(awayNum)) return { homeWidth: 50, awayWidth: 50 };
    
    const total = homeNum + awayNum;
    if (total === 0) return { homeWidth: 50, awayWidth: 50 };
    
    const homeWidth = Math.round((homeNum / total) * 100);
    const awayWidth = 100 - homeWidth;
    
    return { homeWidth, awayWidth };
  };

  useEffect(() => {
    const fetchData = async () => {
      const errors = {};
      try {
        try {
          const teamsData = await teamsService.getTeams();
          setTeamsList(teamsData);
        } catch (teamsError) {
          errors.teams = teamsError.message;
          console.error('Error fetching teams:', teamsError);
        }

        const foundTeam = teamsList.find((t) => t.id === parseInt(teamId, 10));
        if (!foundTeam) {
          throw new Error("Team not found");
        }
        setSelectedTeam(foundTeam);

        try {
          const scheduleData = await teamsService.getTeamSchedule(
            foundTeam.school,
            2024
          );

          const foundGame = scheduleData.find(
            (g) => g.id === parseInt(gameId, 10)
          );
          if (!foundGame) {
            throw new Error("Game not found");
          }
          setGame(foundGame);

          try {
            const advancedData = await teamsService.getAdvancedBoxScore(gameId);
            setAdvancedStats(advancedData);
          } catch (advancedStatsError) {
            errors.advancedStats = advancedStatsError.message;
            console.error('Error fetching advanced stats:', advancedStatsError);
          }
          
          try {
            const gameStatsData = await teamsService.getTeamGameStats({ 
              gameId: gameId, 
              year: 2024, 
            });
            console.log('Team game stats response:', gameStatsData);
            setTeamGameStats(gameStatsData);
          } catch (gameStatsError) {
            errors.teamGameStats = gameStatsError.message;
            console.error('Error fetching team stats:', gameStatsError);
          }

          try {
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
          } catch (playersError) {
            errors.topPerformers = playersError.message;
            console.error('Error fetching top performers:', playersError);
          }

        } catch (scheduleError) {
          errors.schedule = scheduleError.message;
          console.error('Error fetching schedule:', scheduleError);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        if (Object.keys(errors).length > 0) {
          setFetchErrors(errors);
        }
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

  const homeTeamColor = getTeamColor(game.homeTeam) || game.homeColor;
  const awayTeamColor = getTeamColor(game.awayTeam) || game.awayColor;

  const homeLogo = getTeamLogo(game.homeTeam);
  const awayLogo = getTeamLogo(game.awayTeam);
  const gameDate = new Date(game.date).toLocaleDateString();
  const gameTime = game.time || "TBD";

  const homeTeamData = findTeamStats(game.homeTeam) || createMockTeamData(game.homeTeam, true);
  const awayTeamData = findTeamStats(game.awayTeam) || createMockTeamData(game.awayTeam, false);

  const homeTeamStats = findTeamStatsByName(game.homeTeam);
  const awayTeamStats = findTeamStatsByName(game.awayTeam);
  const homeTeamCumulativeStats = findTeamCumulativeStatsByName(game.homeTeam);
  const awayTeamCumulativeStats = findTeamCumulativeStatsByName(game.awayTeam);

  const overallPpaHome = homeTeamStats?.overall?.total ?? "N/A";
  const overallPpaAway = awayTeamStats?.overall?.total ?? "N/A";
  const passingPpaHome = homeTeamStats?.passing?.total ?? "N/A";
  const passingPpaAway = awayTeamStats?.passing?.total ?? "N/A";
  const rushingPpaHome = homeTeamStats?.rushing?.total ?? "N/A";
  const rushingPpaAway = awayTeamStats?.rushing?.total ?? "N/A";
  const cumulativeOverallHome = homeTeamCumulativeStats?.overall?.total ?? "N/A";
  const cumulativeOverallAway = awayTeamCumulativeStats?.overall?.total ?? "N/A";

  const boxScoreData = [
    { metric: "Overall PPA", Home: overallPpaHome, Away: overallPpaAway },
    { metric: "Passing PPA", Home: passingPpaHome, Away: passingPpaAway },
    { metric: "Rushing PPA", Home: rushingPpaHome, Away: rushingPpaAway },
    { metric: "Cumulative PPA", Home: cumulativeOverallHome, Away: cumulativeOverallAway }
  ];

  const playerUsageData =
    advancedStats?.players?.usage?.map((player) => ({
      name: player.player,
      Usage: player.total,
      Rushing: player.rushing,
      Passing: player.passing,
      team: player.team,
      position: player.position,
    })) || [];

  const teamStats = [
    {
      label: "Total yards",
      homeValue: getStatValue(homeTeamData, "totalYards") || "-",
      awayValue: getStatValue(awayTeamData, "totalYards") || "-"
    },
    {
      label: "Passing yards",
      homeValue: getStatValue(homeTeamData, "netPassingYards") || "-",
      awayValue: getStatValue(awayTeamData, "netPassingYards") || "-"
    },
    {
      label: "Rushing yards",
      homeValue: getStatValue(homeTeamData, "rushingYards") || "-",
      awayValue: getStatValue(awayTeamData, "rushingYards") || "-"
    },
    {
      label: "Yards per rush",
      homeValue: getStatValue(homeTeamData, "yardsPerRushAttempt") || "-",
      awayValue: getStatValue(awayTeamData, "yardsPerRushAttempt") || "-"
    },
    {
      label: "First downs",
      homeValue: getStatValue(homeTeamData, "firstDowns") || "-",
      awayValue: getStatValue(awayTeamData, "firstDowns") || "-"
    },
    {
      label: "3rd down efficiency",
      homeValue: getStatValue(homeTeamData, "thirdDownEff") || "-",
      awayValue: getStatValue(awayTeamData, "thirdDownEff") || "-",
      isText: true
    },
    {
      label: "4th down efficiency",
      homeValue: getStatValue(homeTeamData, "fourthDownEff") || "-",
      awayValue: getStatValue(awayTeamData, "fourthDownEff") || "-",
      isText: true
    },
    {
      label: "Penalties (Yards)",
      homeValue: getStatValue(homeTeamData, "totalPenaltiesYards") || "-",
      awayValue: getStatValue(awayTeamData, "totalPenaltiesYards") || "-",
      isText: true
    },
    {
      label: "Fumbles lost",
      homeValue: getStatValue(homeTeamData, "fumblesLost") || "-",
      awayValue: getStatValue(awayTeamData, "fumblesLost") || "-"
    },
    {
      label: "Interceptions",
      homeValue: getStatValue(homeTeamData, "interceptions") || "-",
      awayValue: getStatValue(awayTeamData, "interceptions") || "-"
    },
    {
      label: "Time of possession",
      homeValue: getStatValue(homeTeamData, "possessionTime") || "-",
      awayValue: getStatValue(awayTeamData, "possessionTime") || "-",
      isText: true
    }
  ];

  return (
    <div className="team-analytics-page">
      {renderFetchErrors()}

      <div className="scoreboard">
        <div
          className="scoreboard__color-bar scoreboard__color-bar--left"
          style={{ backgroundColor: awayTeamColor }}
        />
        <div
          className="scoreboard__color-bar scoreboard__color-bar--right"
          style={{ backgroundColor: homeTeamColor }}
        />
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
              const homeTextValue = stat.homeValue;
              const awayTextValue = stat.awayValue;
              
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
                          backgroundColor: homeTeamColor || '#D4001C'
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

      <TopPerformers
        game={game}
        topPerformersPassing={topPerformersPassing}
        topPerformersRushing={topPerformersRushing}
        topPerformersReceiving={topPerformersReceiving}
        getTeamAbbreviation={getTeamAbbreviation}
      />

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

      <div className="dashboard-content">
        <div className="dashboard-stats">
          <h2>Additional Dashboard Stats</h2>
          <p>Add your content here...</p>
        </div>
      </div>

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