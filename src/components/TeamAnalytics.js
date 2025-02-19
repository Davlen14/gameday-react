import React, { useState, useEffect, lazy, Suspense } from "react";
import { useParams, useNavigate } from "react-router-dom";
import teamsService from "../services/teamsService";
import "../styles/TeamAnalytics.css";

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
  ResponsiveContainer,
} = lazy(() => import("recharts"));

function TeamAnalytics() {
  const { teamId } = useParams();
  const navigate = useNavigate();

  // State for when no team is selected via URL
  const [availableTeams, setAvailableTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState("");

  // -----------------------------
  // If no teamId in URL, show team selection dropdown
  // -----------------------------
  useEffect(() => {
    if (!teamId) {
      // Fetch list of teams for the dropdown
      async function fetchTeams() {
        try {
          const teams = await teamsService.getTeams();
          setAvailableTeams(teams);
        } catch (err) {
          console.error("Error fetching teams:", err);
        }
      }
      fetchTeams();
    }
  }, [teamId]);

  const handleTeamSelect = () => {
    if (selectedTeam) {
      // Navigate to the team analytics page with the selected team ID in the URL
      navigate(`/team-metrics/${selectedTeam}`);
    }
  };

  // -----------------------------
  // If no teamId, render the dropdown UI
  // -----------------------------
  if (!teamId) {
    return (
      <div className="team-analytics-container">
        <h2>Select a Team to View Analytics</h2>
        <select
          value={selectedTeam}
          onChange={(e) => setSelectedTeam(e.target.value)}
        >
          <option value="">-- Select a Team --</option>
          {availableTeams.map((team) => (
            <option key={team.id} value={team.id}>
              {team.school}
            </option>
          ))}
        </select>
        <button onClick={handleTeamSelect} disabled={!selectedTeam}>
          View Analytics
        </button>
      </div>
    );
  }

  // -----------------------------
  // 1) State Variables for Analytics Data
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
  const [ratings, setRatings] = useState(null); // e.g. from getTeamRatings()
  const [advancedStats, setAdvancedStats] = useState(null); // e.g. from getAdvancedStats()

  // Matchup Insights
  const [matchupData, setMatchupData] = useState(null);

  // Line Movements & Betting Trends
  const [bettingLines, setBettingLines] = useState(null);

  // Player Performance
  const [playerStats, setPlayerStats] = useState([]);

  // -----------------------------
  // 2) Fetch Data on Mount (when teamId exists)
  // -----------------------------
  useEffect(() => {
    let isMounted = true;

    async function fetchAllData() {
      setLoading(true);
      setError(null);

      try {
        // 1. Basic Team Info (by ID)
        const teamData = await teamsService.getTeamById(teamId);
        if (!teamData) throw new Error("Team not found");

        // 2. Team Record
        const record = await teamsService.getTeamRecords(teamId, 2024);

        // 3. Poll / Rankings data (placeholder call)
        const polls = await teamsService.getPolls(2024, "ap");

        // 4. Basic Stats (might need team name from teamData.school)
        const stats = await teamsService.getTeamStats(teamData.school, 2024);

        // 5. SP+ or advanced rating data
        const ratingData = await teamsService.getTeamRatings(teamData.school, 2024);

        // 6. Additional advanced stats
        const advStats = await teamsService.getAdvancedStats(teamId);

        // 7. Recent Games
        const recent = await teamsService.getTeamSchedule(teamData.school, 2024);

        // 8. Betting Lines
        const lines = await teamsService.getGameLines(2024, teamData.school);

        // 9. Upcoming Matchup (example with "Ohio State")
        const matchup = await teamsService.getTeamMatchup(teamData.school, "Ohio State");

        // 10. Player Performance (example: passing stats)
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
  };

  // Filter the recent games based on the selected filter
  const filteredGames = React.useMemo(() => {
    if (!recentGames || recentGames.length === 0) return [];
    if (selectedFilter === "Season") return recentGames;
    const count = parseInt(selectedFilter.replace("L", ""), 10);
    return recentGames.slice(-count);
  }, [recentGames, selectedFilter]);

  // Build chart data for Recharts
  const recentGameChartData = filteredGames.map((game) => ({
    week: game.week,
    pointsFor:
      game.homeTeam === teamInfo?.school ? game.homePoints : game.awayPoints,
    pointsAgainst:
      game.homeTeam === teamInfo?.school ? game.awayPoints : game.homePoints,
  }));

  // -----------------------------
  // 4) Render Analytics UI
  // -----------------------------
  if (loading)
    return (
      <div className="team-analytics-loading">
        Loading Team Analytics...
      </div>
    );
  if (error)
    return <div className="team-analytics-error">Error: {error}</div>;

  return (
    <div className="team-analytics-container">
      {/* 1️⃣ HEADER SECTION */}
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
              Record: {teamRecord?.overallWins || 0}-
              {teamRecord?.overallLosses || 0}
            </p>
            <p>
              Rank:{" "}
              {pollData?.[0]?.rankings.find(
                (r) => r.school === teamInfo?.school
              )?.rank || "N/A"}
            </p>
            <p>Offense Rank: {ratings?.offenseRank}</p>
            <p>Defense Rank: {ratings?.defenseRank}</p>
          </div>
        </div>
      </section>

      {/* 2️⃣ RECENT GAME PERFORMANCE */}
      <section className="recent-game-performance">
        <div className="filters">
          <button onClick={() => handleFilterChange("L5")}>Last 5</button>
          <button onClick={() => handleFilterChange("L10")}>Last 10</button>
          <button onClick={() => handleFilterChange("L20")}>Last 20</button>
          <button onClick={() => handleFilterChange("Season")}>
            Season
          </button>
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
                <Bar
                  dataKey="pointsFor"
                  fill="#8884d8"
                  name="Points For"
                />
                <Bar
                  dataKey="pointsAgainst"
                  fill="#82ca9d"
                  name="Points Against"
                />
              </BarChart>
            </ResponsiveContainer>
          </Suspense>
        </div>
      </section>

      {/* 3️⃣ KEY TEAM METRICS (Cards UI) */}
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

      {/* 4️⃣ MATCHUP INSIGHTS */}
      <section className="matchup-insights">
        <h2>Upcoming Matchup Insights</h2>
        {matchupData ? (
          <div className="matchup-stats">
            <p>Team A Points Scored: {matchupData.team1PointsPerGame}</p>
            <p>Team B Points Allowed: {matchupData.team2PointsAllowedPerGame}</p>
            <p>
              Rushing vs. Passing Tendencies:{" "}
              {matchupData.team1RunPassRatio} vs.{" "}
              {matchupData.team2RunPassRatio}
            </p>
            <p>
              Defensive Strengths: {matchupData.team1DefensiveStrength} vs.{" "}
              {matchupData.team2DefensiveStrength}
            </p>
            <p>
              Key Players:{" "}
              {matchupData.keyPlayers?.join(", ")}
            </p>
          </div>
        ) : (
          <p>No matchup data available.</p>
        )}
      </section>

      {/* 5️⃣ LINE MOVEMENTS & BETTING TRENDS */}
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
                <Line
                  type="monotone"
                  dataKey="spreadOpen"
                  stroke="#8884d8"
                  name="Open Spread"
                />
                <Line
                  type="monotone"
                  dataKey="spreadCurrent"
                  stroke="#82ca9d"
                  name="Current Spread"
                />
              </LineChart>
            </ResponsiveContainer>
          </Suspense>
        </div>
      </section>

      {/* 6️⃣ PLAYER PERFORMANCE BREAKDOWN */}
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