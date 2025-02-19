import React, { useState, useEffect, lazy, Suspense } from "react";
import { useParams } from "react-router-dom";
import teamsService from "../services/teamsService";
import "./TeamAnalytics.css";

// Lazy-load Recharts components for performance
const {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} = lazy(() => import("recharts"));

function TeamAnalytics() {
  const { teamId } = useParams(); 
  // If you're passing a numeric `teamId` in the URL (e.g., /team-metrics/:teamId),
  // be sure to convert it to an integer if needed.

  // -----------------------------
  // 1) State Variables
  // -----------------------------
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Header / Basic Team Info
  const [teamInfo, setTeamInfo] = useState(null);
  const [teamRecord, setTeamRecord] = useState(null);
  const [pollData, setPollData] = useState(null);

  // Recent Games
  const [recentGames, setRecentGames] = useState([]);
  const [selectedFilter, setSelectedFilter] = useState("L5"); // "L5", "L10", "L20", "Season"

  // Key Metrics
  const [basicStats, setBasicStats] = useState(null); // e.g. from getTeamStats()
  const [ratings, setRatings] = useState(null);        // e.g. from getTeamRatings()
  const [advancedStats, setAdvancedStats] = useState(null); // e.g. from getAdvancedStats()

  // Matchup Insights
  const [matchupData, setMatchupData] = useState(null);

  // Line Movements & Betting Trends
  const [bettingLines, setBettingLines] = useState(null);

  // Player Performance
  const [playerStats, setPlayerStats] = useState([]);

  // -----------------------------
  // 2) Fetch Data on Mount
  // -----------------------------
  useEffect(() => {
    let isMounted = true;

    async function fetchAllData() {
      setLoading(true);
      setError(null);

      try {
        // 1. Basic Team Info (by ID)
        //    NOTE: If your endpoints need the team "name" instead of ID,
        //    you may need to fetch the team object first, then call subsequent endpoints with the name.
        const teamData = await teamsService.getTeamById(teamId); 
        if (!teamData) throw new Error("Team not found");

        // 2. Team Record (optional: pass year or other params if needed)
        const record = await teamsService.getTeamRecords(teamId, 2024);

        // 3. Poll / Rankings data (e.g. AP, Coaches) - if relevant
        //    This is just a placeholder call. You can filter for the specific team after you get the poll data.
        const polls = await teamsService.getPolls(2024, "ap");

        // 4. Basic Stats (like total yards, passing yards, etc.)
        //    Might need the "team name" from teamData.school or teamData.name
        const stats = await teamsService.getTeamStats(teamData.school, 2024);

        // 5. SP+ or advanced rating data
        const ratingData = await teamsService.getTeamRatings(teamData.school, 2024);

        // 6. Additional advanced stats
        //    This endpoint is presumably newly added. Adjust params as needed.
        const advStats = await teamsService.getAdvancedStats(teamId);

        // 7. Recent Games (you might fetch all and then slice to last 5, 10, etc.)
        //    You can store them in state, then filter by user selection.
        const recent = await teamsService.getTeamSchedule(teamData.school, 2024);

        // 8. Betting Lines (for line movements & trends)
        const lines = await teamsService.getGameLines(2024, teamData.school);

        // 9. Upcoming Matchup (if there's a next scheduled game, you can pass the next opponent)
        //    For demonstration, let's say the next opponent is "Ohio State".
        //    Replace with dynamic logic if you have the next scheduled game from `recent` or another source.
        const matchup = await teamsService.getTeamMatchup(teamData.school, "Ohio State");

        // 10. Player Performance
        //     Example: get last 5 games for QBs or top skill players
        //     This is just an example call. Adjust the params for your real usage.
        const pStats = await teamsService.getPlayerSeasonStats(2024, "passing");

        if (isMounted) {
          setTeamInfo(teamData);
          setTeamRecord(record);
          setPollData(polls);
          setBasicStats(stats);
          setRatings(ratingData);
          setAdvancedStats(advStats);
          setRecentGames(recent);
          setBettingLines(lines);
          setMatchupData(matchup);
          setPlayerStats(pStats);
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || "Error fetching data");
          setLoading(false);
        }
      }
    }

    fetchAllData();
    return () => {
      isMounted = false;
    };
  }, [teamId]);

  // -----------------------------
  // 3) Handlers & Helpers
  // -----------------------------
  const handleFilterChange = (filterOption) => {
    setSelectedFilter(filterOption);
    // For example, if you have all games in `recentGames`, 
    // you can filter them in a memoized selector or directly here.
  };

  // Example: Filter the recent games based on selectedFilter
  const filteredGames = React.useMemo(() => {
    if (!recentGames || recentGames.length === 0) return [];
    if (selectedFilter === "Season") return recentGames;
    
    const count = parseInt(selectedFilter.replace("L", ""), 10); // e.g. "L5" -> 5
    return recentGames.slice(-count); // last N games
  }, [recentGames, selectedFilter]);

  // Build chart data from `filteredGames`, `basicStats`, etc.
  const recentGameChartData = filteredGames.map((game) => ({
    week: game.week,
    pointsFor: game.homeTeam === teamInfo?.school ? game.homePoints : game.awayPoints,
    pointsAgainst: game.homeTeam === teamInfo?.school ? game.awayPoints : game.homePoints,
    // Add more stats if you have them
  }));

  // -----------------------------
  // 4) Render
  // -----------------------------
  if (loading) return <div className="team-analytics-loading">Loading Team Analytics...</div>;
  if (error) return <div className="team-analytics-error">Error: {error}</div>;

  return (
    <div className="team-analytics-container">
      {/* 
        1️⃣ HEADER SECTION 
      */}
      <section className="team-analytics-header">
        <div className="team-info">
          <img
            src={teamInfo?.logo || "/placeholder-logo.png"}
            alt={`${teamInfo?.school} logo`}
            className="team-logo"
          />
          <div>
            <h1>{teamInfo?.school}</h1>
            <p>Conference: {teamInfo?.conference || "N/A"}</p>
            <p>
              Record: {teamRecord?.overallWins || 0}-{teamRecord?.overallLosses || 0}
            </p>
            {/* If pollData includes ranking info for this team, display it */}
            <p>Rank: 
              {/* example: if pollData[0] is AP poll, find the rank for this team */}
              {pollData?.[0]?.rankings.find((r) => r.school === teamInfo?.school)?.rank || "N/A"}
            </p>
            {/* Offensive & Defensive Ranks from SP+ or your custom rating system */}
            <p>Offense Rank: {ratings?.offenseRank}</p>
            <p>Defense Rank: {ratings?.defenseRank}</p>
          </div>
        </div>
      </section>

      {/* 
        2️⃣ RECENT GAME PERFORMANCE 
      */}
      <section className="recent-game-performance">
        <div className="filters">
          <button onClick={() => handleFilterChange("L5")}>Last 5</button>
          <button onClick={() => handleFilterChange("L10")}>Last 10</button>
          <button onClick={() => handleFilterChange("L20")}>Last 20</button>
          <button onClick={() => handleFilterChange("Season")}>Season</button>
        </div>

        <div className="chart-container">
          <Suspense fallback={<div>Loading Charts...</div>}>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={recentGameChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="pointsFor" fill="#8884d8" name="Points For" />
                <Bar dataKey="pointsAgainst" fill="#82ca9d" name="Points Against" />
              </BarChart>
            </ResponsiveContainer>
          </Suspense>
        </div>
      </section>

      {/* 
        3️⃣ KEY TEAM METRICS (Cards UI)
      */}
      <section className="key-team-metrics">
        <h2>Key Team Metrics</h2>
        <div className="metrics-cards">
          <div className="metric-card">
            <h3>Offensive Rating</h3>
            <p>{ratings?.offense}</p>
          </div>
          <div className="metric-card">
            <h3>Defensive Rating</h3>
            <p>{ratings?.defense}</p>
          </div>
          <div className="metric-card">
            <h3>Pace (plays per game)</h3>
            <p>{advancedStats?.pace || "N/A"}</p>
          </div>
          <div className="metric-card">
            <h3>Turnover %</h3>
            <p>{advancedStats?.turnoverRate || "N/A"}</p>
          </div>
          <div className="metric-card">
            <h3>Red Zone Success Rate</h3>
            <p>{advancedStats?.redZoneSuccess || "N/A"}</p>
          </div>
          <div className="metric-card">
            <h3>Explosive Plays %</h3>
            <p>{advancedStats?.explosivePlayRate || "N/A"}</p>
          </div>
        </div>
      </section>

      {/* 
        4️⃣ MATCHUP INSIGHTS
      */}
      <section className="matchup-insights">
        <h2>Upcoming Matchup Insights</h2>
        {matchupData ? (
          <div className="matchup-stats">
            <p>Team A Points Scored: {matchupData.team1PointsPerGame}</p>
            <p>Team B Points Allowed: {matchupData.team2PointsAllowedPerGame}</p>
            <p>Rushing vs. Passing Tendencies: {matchupData.team1RunPassRatio} vs. {matchupData.team2RunPassRatio}</p>
            <p>Defensive Strengths: {matchupData.team1DefensiveStrength} vs. {matchupData.team2DefensiveStrength}</p>
            <p>Key Players: {matchupData.keyPlayers?.join(", ")}</p>
            {/* Add more as needed */}
          </div>
        ) : (
          <p>No matchup data available.</p>
        )}
      </section>

      {/* 
        5️⃣ LINE MOVEMENTS & BETTING TRENDS
      */}
      <section className="line-movements">
        <h2>Line Movements & Betting Trends</h2>
        <div className="chart-container">
          <Suspense fallback={<div>Loading Charts...</div>}>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={bettingLines || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="gameId" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="spreadOpen" stroke="#8884d8" name="Open Spread" />
                <Line type="monotone" dataKey="spreadCurrent" stroke="#82ca9d" name="Current Spread" />
              </LineChart>
            </ResponsiveContainer>
          </Suspense>
        </div>
        {/* You can also add public betting % bar charts, ATS record, etc. */}
      </section>

      {/* 
        6️⃣ PLAYER PERFORMANCE BREAKDOWN
      */}
      <section className="player-performance">
        <h2>Player Performance (Last 5 Games)</h2>
        <div className="player-stats-table">
          <table>
            <thead>
              <tr>
                <th>Player</th>
                <th>Position</th>
                <th>Passing Yds</th>
                <th>Rushing Yds</th>
                <th>Receiving Yds</th>
                <th>TDs</th>
              </tr>
            </thead>
            <tbody>
              {playerStats.slice(0, 5).map((player) => (
                <tr key={player.id}>
                  <td>{player.fullName}</td>
                  <td>{player.position}</td>
                  <td>{player.passingYards || 0}</td>
                  <td>{player.rushingYards || 0}</td>
                  <td>{player.receivingYards || 0}</td>
                  <td>{player.touchdowns || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export default TeamAnalytics;