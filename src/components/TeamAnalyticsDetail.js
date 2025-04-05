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
// Now implementing TopPerformers directly in this component
// import TopPerformers from "./TopPerformers";

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
        
        // 6. Fetch team game stats
        try {
          const gameStatsData = await teamsService.getTeamGameStats({
            year: 2024,
            week: foundGame.week // Added the week parameter
          });
          
          console.log('Team game stats response:', gameStatsData);
          
          if (gameStatsData && Array.isArray(gameStatsData)) {
            // Filter only the game we're looking for by gameId
            const gameData = gameStatsData.find(g => g.id === parseInt(gameId, 10));
            
            if (gameData) {
              console.log('Found exact match for game ID:', gameId);
              setTeamGameStats([gameData]); // Set only the matching game data
            } else {
              console.log('Game ID not found in response, searching by teams...');
              
              // Try to find by team names
              const possibleMatches = gameStatsData.filter(g => {
                if (!g.teams) return false;
                
                // Check if both home and away teams are in this game
                const teamsInGame = g.teams.map(t => t.team.toLowerCase());
                const homeTeamMatches = teamsInGame.some(t => 
                  foundGame.homeTeam.toLowerCase().includes(t) || 
                  t.includes(foundGame.homeTeam.toLowerCase())
                );
                
                const awayTeamMatches = teamsInGame.some(t => 
                  foundGame.awayTeam.toLowerCase().includes(t) || 
                  t.includes(foundGame.awayTeam.toLowerCase())
                );
                
                return homeTeamMatches && awayTeamMatches;
              });
              
              if (possibleMatches.length > 0) {
                console.log('Found possible matches by team names:', possibleMatches.length);
                setTeamGameStats(possibleMatches);
              } else {
                console.log('No matches found by team names either');
                setTeamGameStats(null);
              }
            }
          } else {
            console.warn('Invalid data format from getTeamGameStats');
            setTeamGameStats(null);
          }
        } catch (error) {
          console.error('Error fetching team stats:', error);
          // Continue execution for other data even if team stats fail
        }

        // 7. Fetch Top Performers for Passing, Rushing, Receiving
        const passingPlayers = await teamsService.getPlayerGameStats(
          gameId,
          2024,
          foundGame.week, // Use the actual week from the game data
          "regular",
          foundTeam.school,
          "passing"
        );
        const rushingPlayers = await teamsService.getPlayerGameStats(
          gameId,
          2024,
          foundGame.week, // Use the actual week from the game data
          "regular",
          foundTeam.school,
          "rushing"
        );
        const receivingPlayers = await teamsService.getPlayerGameStats(
          gameId,
          2024,
          foundGame.week, // Use the actual week from the game data
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

  // Find the correct game data from the teamGameStats array
  const findCorrectGameData = () => {
    if (!teamGameStats || teamGameStats.length === 0) {
      return null;
    }
    
    // Try to find exact match by gameId first
    const exactMatch = teamGameStats.find(g => g.id === parseInt(gameId, 10));
    if (exactMatch) {
      return exactMatch;
    }
    
    // If no exact match, try to find by matching both teams
    for (const gameData of teamGameStats) {
      if (!gameData.teams || gameData.teams.length < 2) continue;
      
      const teamNames = gameData.teams.map(t => t.team.toLowerCase());
      const homeTeamMatch = teamNames.some(name => 
        name === game.homeTeam.toLowerCase() || 
        game.homeTeam.toLowerCase().includes(name) || 
        name.includes(game.homeTeam.toLowerCase())
      );
      
      const awayTeamMatch = teamNames.some(name => 
        name === game.awayTeam.toLowerCase() || 
        game.awayTeam.toLowerCase().includes(name) || 
        name.includes(game.awayTeam.toLowerCase())
      );
      
      if (homeTeamMatch && awayTeamMatch) {
        return gameData;
      }
    }
    
    return null;
  };

  // Get the correct game data
  const correctGameData = findCorrectGameData();
  
  // Find home and away team data from the correct game
  const findTeamData = (teamName, isHome) => {
    if (!correctGameData || !correctGameData.teams) {
      console.log(`No game data found for ${teamName}`);
      return null;
    }
    
    // Try to match by team name first
    let teamData = correctGameData.teams.find(team => 
      team.team.toLowerCase() === teamName.toLowerCase() ||
      teamName.toLowerCase().includes(team.team.toLowerCase()) || 
      team.team.toLowerCase().includes(teamName.toLowerCase())
    );
    
    // If not found, try matching by homeAway property
    if (!teamData) {
      teamData = correctGameData.teams.find(team => 
        team.homeAway === (isHome ? "home" : "away")
      );
    }
    
    if (teamData) {
      console.log(`Found stats for ${teamName}:`, teamData);
      return teamData;
    }
    
    console.log(`No stats found for ${teamName}`);
    return null;
  };
  
  // Get home and away team data
  const homeTeamData = findTeamData(game.homeTeam, true);
  const awayTeamData = findTeamData(game.awayTeam, false);
  
  // Helper function to create mock data when API data is not available
  function createMockTeamData(teamName, isHome) {
    console.log(`Creating mock data for ${teamName} as API data is not available`);
    return {
      team: teamName,
      stats: [
        { category: "totalYards", stat: isHome ? "450" : "350" },
        { category: "netPassingYards", stat: isHome ? "270" : "220" },
        { category: "rushingYards", stat: isHome ? "180" : "130" },
        { category: "yardsPerRushAttempt", stat: isHome ? "5.2" : "4.1" },
        { category: "firstDowns", stat: isHome ? "22" : "18" },
        { category: "thirdDownEff", stat: isHome ? "7-12" : "5-13" },
        { category: "fourthDownEff", stat: isHome ? "1-1" : "1-2" },
        { category: "totalPenaltiesYards", stat: isHome ? "5-45" : "6-50" },
        { category: "fumblesLost", stat: isHome ? "0" : "1" },
        { category: "interceptions", stat: isHome ? "1" : "0" },
        { category: "possessionTime", stat: isHome ? "32:15" : "27:45" }
      ]
    };
  }
  
  // Use actual data or fall back to mock data if needed
  const finalHomeTeamData = homeTeamData || createMockTeamData(game.homeTeam, true);
  const finalAwayTeamData = awayTeamData || createMockTeamData(game.awayTeam, false);
  
  // Helper function to get a specific stat value from a team's stats array
  const getStatValue = (teamData, category) => {
    if (!teamData || !teamData.stats) {
      return '-';
    }
    const statItem = teamData.stats.find(stat => stat.category === category);
    return statItem ? statItem.stat : '-';
  };
  
  // Prepare team stats data from API
  const teamStats = [
    {
      label: "Total yards",
      homeValue: getStatValue(finalHomeTeamData, "totalYards"),
      awayValue: getStatValue(finalAwayTeamData, "totalYards")
    },
    {
      label: "Passing yards",
      homeValue: getStatValue(finalHomeTeamData, "netPassingYards"),
      awayValue: getStatValue(finalAwayTeamData, "netPassingYards")
    },
    {
      label: "Rushing yards",
      homeValue: getStatValue(finalHomeTeamData, "rushingYards"),
      awayValue: getStatValue(finalAwayTeamData, "rushingYards")
    },
    {
      label: "Yards per rush",
      homeValue: getStatValue(finalHomeTeamData, "yardsPerRushAttempt"),
      awayValue: getStatValue(finalAwayTeamData, "yardsPerRushAttempt")
    },
    {
      label: "First downs",
      homeValue: getStatValue(finalHomeTeamData, "firstDowns"),
      awayValue: getStatValue(finalAwayTeamData, "firstDowns")
    },
    {
      label: "3rd down efficiency",
      homeValue: getStatValue(finalHomeTeamData, "thirdDownEff"),
      awayValue: getStatValue(finalAwayTeamData, "thirdDownEff"),
      isText: true
    },
    {
      label: "4th down efficiency",
      homeValue: getStatValue(finalHomeTeamData, "fourthDownEff"),
      awayValue: getStatValue(finalAwayTeamData, "fourthDownEff"),
      isText: true
    },
    {
      label: "Penalties (Yards)",
      homeValue: getStatValue(finalHomeTeamData, "totalPenaltiesYards"),
      awayValue: getStatValue(finalAwayTeamData, "totalPenaltiesYards"),
      isText: true
    },
    {
      label: "Fumbles lost",
      homeValue: getStatValue(finalHomeTeamData, "fumblesLost"),
      awayValue: getStatValue(finalAwayTeamData, "fumblesLost")
    },
    {
      label: "Interceptions",
      homeValue: getStatValue(finalHomeTeamData, "interceptions"),
      awayValue: getStatValue(finalAwayTeamData, "interceptions")
    },
    {
      label: "Time of possession",
      homeValue: getStatValue(finalHomeTeamData, "possessionTime"),
      awayValue: getStatValue(finalAwayTeamData, "possessionTime"),
      isText: true
    }
  ];

  // Helper function to calculate bar widths for the team stats
  const calculateWidth = (home, away, isText) => {
    if (isText) return { homeWidth: 50, awayWidth: 50 };
    
    // Handle cases when values are missing or just dashes
    if (home === '-' || away === '-') return { homeWidth: 50, awayWidth: 50 };
    
    // Handle string values that need to be converted to numbers
    const homeNum = typeof home === 'string' ? parseFloat(home) : home;
    const awayNum = typeof away === 'string' ? parseFloat(away) : away;
    
    // Handle non-numeric values
    if (isNaN(homeNum) || isNaN(awayNum)) return { homeWidth: 50, awayWidth: 50 };
    
    const total = homeNum + awayNum;
    if (total === 0) return { homeWidth: 50, awayWidth: 50 };
    
    const homeWidth = Math.round((homeNum / total) * 100);
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

      {/* Top Performers Section */}
      <div className="top-performers-section">
        <h2>Top Performers</h2>
        
        <div className="top-performers-container">
          {/* Passing Stats */}
          <div className="top-performers-category">
            <h3>Passing Leaders</h3>
            <div className="top-performers-chart-container">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={[
                    ...topPerformersPassing?.filter(player => player.team === game.homeTeam)
                      .slice(0, 2)
                      .map(player => ({
                        name: player.name,
                        yards: player.statYards,
                        touchdowns: player.statTouchdowns,
                        team: player.team,
                        color: homeTeamColor || '#D4001C'
                      })) || [],
                    ...topPerformersPassing?.filter(player => player.team === game.awayTeam)
                      .slice(0, 2)
                      .map(player => ({
                        name: player.name,
                        yards: player.statYards,
                        touchdowns: player.statTouchdowns,
                        team: player.team,
                        color: awayTeamColor || '#009900'
                      })) || []
                  ]}
                  margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name" 
                    angle={-45} 
                    textAnchor="end" 
                    height={70} 
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                  <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const player = payload[0].payload;
                        return (
                          <div className="custom-tooltip">
                            <p className="tooltip-name">{player.name}</p>
                            <p className="tooltip-team">{player.team}</p>
                            <p className="tooltip-stat">Yards: {player.yards}</p>
                            <p className="tooltip-stat">TDs: {player.touchdowns}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend />
                  <Bar yAxisId="left" dataKey="yards" name="Passing Yards" radius={[5, 5, 0, 0]}>
                    {topPerformersPassing?.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.team === game.homeTeam ? homeTeamColor || '#D4001C' : awayTeamColor || '#009900'} />
                    ))}
                  </Bar>
                  <Bar yAxisId="right" dataKey="touchdowns" name="Touchdowns" radius={[5, 5, 0, 0]}>
                    {topPerformersPassing?.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.team === game.homeTeam ? '#8884d8' : '#82ca9d'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            <div className="top-performers-details">
              <div className="team-column">
                <div className="team-header" style={{ backgroundColor: homeTeamColor || '#D4001C' }}>
                  <img src={homeLogo} alt={game.homeTeam} className="team-logo" />
                  <h4>{game.homeTeam}</h4>
                </div>
                <div className="player-stats-list">
                  {topPerformersPassing
                    ?.filter(player => player.team === game.homeTeam)
                    .slice(0, 3)
                    .map((player, index) => (
                      <div key={index} className="player-stat-item">
                        <div className="player-name">{player.name}</div>
                        <div className="player-stat-details">
                          <span className="stat">YDS: {player.statYards}</span>
                          <span className="stat">TD: {player.statTouchdowns}</span>
                          <span className="stat">INT: {player.statInterceptions}</span>
                        </div>
                      </div>
                    )) || <div className="no-data">No passing data available</div>}
                </div>
              </div>
              
              <div className="team-column">
                <div className="team-header" style={{ backgroundColor: awayTeamColor || '#009900' }}>
                  <img src={awayLogo} alt={game.awayTeam} className="team-logo" />
                  <h4>{game.awayTeam}</h4>
                </div>
                <div className="player-stats-list">
                  {topPerformersPassing
                    ?.filter(player => player.team === game.awayTeam)
                    .slice(0, 3)
                    .map((player, index) => (
                      <div key={index} className="player-stat-item">
                        <div className="player-name">{player.name}</div>
                        <div className="player-stat-details">
                          <span className="stat">YDS: {player.statYards}</span>
                          <span className="stat">TD: {player.statTouchdowns}</span>
                          <span className="stat">INT: {player.statInterceptions}</span>
                        </div>
                      </div>
                    )) || <div className="no-data">No passing data available</div>}
                </div>
              </div>
            </div>
          </div>
          
          {/* Rushing Stats */}
          <div className="top-performers-category">
            <h3>Rushing Leaders</h3>
            <div className="top-performers-chart-container">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={[
                    ...topPerformersRushing?.filter(player => player.team === game.homeTeam)
                      .slice(0, 2)
                      .map(player => ({
                        name: player.name,
                        yards: player.statYards,
                        touchdowns: player.statTouchdowns,
                        team: player.team,
                        color: homeTeamColor || '#D4001C'
                      })) || [],
                    ...topPerformersRushing?.filter(player => player.team === game.awayTeam)
                      .slice(0, 2)
                      .map(player => ({
                        name: player.name,
                        yards: player.statYards,
                        touchdowns: player.statTouchdowns,
                        team: player.team,
                        color: awayTeamColor || '#009900'
                      })) || []
                  ]}
                  margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name" 
                    angle={-45} 
                    textAnchor="end" 
                    height={70} 
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                  <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const player = payload[0].payload;
                        return (
                          <div className="custom-tooltip">
                            <p className="tooltip-name">{player.name}</p>
                            <p className="tooltip-team">{player.team}</p>
                            <p className="tooltip-stat">Yards: {player.yards}</p>
                            <p className="tooltip-stat">TDs: {player.touchdowns}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend />
                  <Bar yAxisId="left" dataKey="yards" name="Rushing Yards" radius={[5, 5, 0, 0]}>
                    {topPerformersRushing?.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.team === game.homeTeam ? homeTeamColor || '#D4001C' : awayTeamColor || '#009900'} />
                    ))}
                  </Bar>
                  <Bar yAxisId="right" dataKey="touchdowns" name="Touchdowns" radius={[5, 5, 0, 0]}>
                    {topPerformersRushing?.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.team === game.homeTeam ? '#8884d8' : '#82ca9d'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            <div className="top-performers-details">
              <div className="team-column">
                <div className="team-header" style={{ backgroundColor: homeTeamColor || '#D4001C' }}>
                  <img src={homeLogo} alt={game.homeTeam} className="team-logo" />
                  <h4>{game.homeTeam}</h4>
                </div>
                <div className="player-stats-list">
                  {topPerformersRushing
                    ?.filter(player => player.team === game.homeTeam)
                    .slice(0, 3)
                    .map((player, index) => (
                      <div key={index} className="player-stat-item">
                        <div className="player-name">{player.name}</div>
                        <div className="player-stat-details">
                          <span className="stat">CAR: {player.statCarries}</span>
                          <span className="stat">YDS: {player.statYards}</span>
                          <span className="stat">TD: {player.statTouchdowns}</span>
                        </div>
                      </div>
                    )) || <div className="no-data">No rushing data available</div>}
                </div>
              </div>
              
              <div className="team-column">
                <div className="team-header" style={{ backgroundColor: awayTeamColor || '#009900' }}>
                  <img src={awayLogo} alt={game.awayTeam} className="team-logo" />
                  <h4>{game.awayTeam}</h4>
                </div>
                <div className="player-stats-list">
                  {topPerformersRushing
                    ?.filter(player => player.team === game.awayTeam)
                    .slice(0, 3)
                    .map((player, index) => (
                      <div key={index} className="player-stat-item">
                        <div className="player-name">{player.name}</div>
                        <div className="player-stat-details">
                          <span className="stat">CAR: {player.statCarries}</span>
                          <span className="stat">YDS: {player.statYards}</span>
                          <span className="stat">TD: {player.statTouchdowns}</span>
                        </div>
                      </div>
                    )) || <div className="no-data">No rushing data available</div>}
                </div>
              </div>
            </div>
          </div>
          
          {/* Receiving Stats */}
          <div className="top-performers-category">
            <h3>Receiving Leaders</h3>
            <div className="top-performers-chart-container">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={[
                    ...topPerformersReceiving?.filter(player => player.team === game.homeTeam)
                      .slice(0, 2)
                      .map(player => ({
                        name: player.name,
                        yards: player.statYards,
                        receptions: player.statReceptions,
                        touchdowns: player.statTouchdowns,
                        team: player.team,
                        color: homeTeamColor || '#D4001C'
                      })) || [],
                    ...topPerformersReceiving?.filter(player => player.team === game.awayTeam)
                      .slice(0, 2)
                      .map(player => ({
                        name: player.name,
                        yards: player.statYards,
                        receptions: player.statReceptions,
                        touchdowns: player.statTouchdowns,
                        team: player.team,
                        color: awayTeamColor || '#009900'
                      })) || []
                  ]}
                  margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name" 
                    angle={-45} 
                    textAnchor="end" 
                    height={70} 
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                  <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const player = payload[0].payload;
                        return (
                          <div className="custom-tooltip">
                            <p className="tooltip-name">{player.name}</p>
                            <p className="tooltip-team">{player.team}</p>
                            <p className="tooltip-stat">Yards: {player.yards}</p>
                            <p className="tooltip-stat">Rec: {player.receptions}</p>
                            <p className="tooltip-stat">TDs: {player.touchdowns}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend />
                  <Bar yAxisId="left" dataKey="yards" name="Receiving Yards" radius={[5, 5, 0, 0]}>
                    {topPerformersReceiving?.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.team === game.homeTeam ? homeTeamColor || '#D4001C' : awayTeamColor || '#009900'} />
                    ))}
                  </Bar>
                  <Bar yAxisId="right" dataKey="receptions" name="Receptions" radius={[5, 5, 0, 0]}>
                    {topPerformersReceiving?.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.team === game.homeTeam ? '#8884d8' : '#82ca9d'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            <div className="top-performers-details">
              <div className="team-column">
                <div className="team-header" style={{ backgroundColor: homeTeamColor || '#D4001C' }}>
                  <img src={homeLogo} alt={game.homeTeam} className="team-logo" />
                  <h4>{game.homeTeam}</h4>
                </div>
                <div className="player-stats-list">
                  {topPerformersReceiving
                    ?.filter(player => player.team === game.homeTeam)
                    .slice(0, 3)
                    .map((player, index) => (
                      <div key={index} className="player-stat-item">
                        <div className="player-name">{player.name}</div>
                        <div className="player-stat-details">
                          <span className="stat">REC: {player.statReceptions}</span>
                          <span className="stat">YDS: {player.statYards}</span>
                          <span className="stat">TD: {player.statTouchdowns}</span>
                        </div>
                      </div>
                    )) || <div className="no-data">No receiving data available</div>}
                </div>
              </div>
              
              <div className="team-column">
                <div className="team-header" style={{ backgroundColor: awayTeamColor || '#009900' }}>
                  <img src={awayLogo} alt={game.awayTeam} className="team-logo" />
                  <h4>{game.awayTeam}</h4>
                </div>
                <div className="player-stats-list">
                  {topPerformersReceiving
                    ?.filter(player => player.team === game.awayTeam)
                    .slice(0, 3)
                    .map((player, index) => (
                      <div key={index} className="player-stat-item">
                        <div className="player-name">{player.name}</div>
                        <div className="player-stat-details">
                          <span className="stat">REC: {player.statReceptions}</span>
                          <span className="stat">YDS: {player.statYards}</span>
                          <span className="stat">TD: {player.statTouchdowns}</span>
                        </div>
                      </div>
                    )) || <div className="no-data">No receiving data available</div>}
                </div>
              </div>
            </div>
          </div>
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