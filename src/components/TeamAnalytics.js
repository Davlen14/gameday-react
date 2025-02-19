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

  // State for team selection (when no team is specified)
  const [availableTeams, setAvailableTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState("");

  // Analytics state hooks (always declared)
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [teamInfo, setTeamInfo] = useState(null);
  const [teamRecord, setTeamRecord] = useState({ overallWins: 0, overallLosses: 0 });
  const [pollData, setPollData] = useState([]);
  const [recentGames, setRecentGames] = useState([]);
  const [selectedFilter, setSelectedFilter] = useState("L5");

  const [basicStats, setBasicStats] = useState(null);
  const [ratings, setRatings] = useState(null);
  const [advancedStats, setAdvancedStats] = useState(null);

  const [matchupData, setMatchupData] = useState(null);
  const [bettingLines, setBettingLines] = useState([]);
  const [playerStats, setPlayerStats] = useState([]);

  // -----------------------------
  // Fetch available teams if no team is selected
  // -----------------------------
  useEffect(() => {
    if (!teamId) {
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

  // -----------------------------
  // Fetch analytics data if teamId exists
  // -----------------------------
  useEffect(() => {
    if (!teamId) return;

    setLoading(true);
    setError(null);
    let isMounted = true;

    async function fetchAllData() {
      // We'll store the teamData locally so we can use it later
      let teamData = null;
      try {
        teamData = await teamsService.getTeamById(teamId);
        if (!teamData) throw new Error("Team not found");
        if (isMounted) setTeamInfo(teamData);
      } catch (err) {
        if (isMounted) {
          setError(err.message || "Error fetching team data");
          setLoading(false);
        }
        return; // Cannot proceed without team data
      }

      // Use teamData.school for subsequent calls
      try {
        const record = await teamsService.getTeamRecords(teamId, 2024);
        if (isMounted) setTeamRecord(record);
      } catch (err) {
        console.error("Error fetching team record:", err);
        if (isMounted) setTeamRecord({ overallWins: 0, overallLosses: 0 });
      }

      try {
        const polls = await teamsService.getPolls(2024, "ap");
        if (isMounted) setPollData(polls);
      } catch (err) {
        console.error("Error fetching polls:", err);
        if (isMounted) setPollData([]);
      }

      try {
        const stats = await teamsService.getTeamStats(teamData.school, 2024);
        if (isMounted) setBasicStats(stats);
      } catch (err) {
        console.error("Error fetching team stats:", err);
        if (isMounted) setBasicStats(null);
      }

      try {
        const ratingData = await teamsService.getTeamRatings(teamData.school, 2024);
        if (isMounted) setRatings(ratingData);
      } catch (err) {
        console.error("Error fetching team ratings:", err);
        if (isMounted) setRatings(null);
      }

      try {
        const advStats = await teamsService.getAdvancedStats(teamId);
        if (isMounted) setAdvancedStats(advStats);
      } catch (err) {
        console.error("Error fetching advanced stats:", err);
        if (isMounted) setAdvancedStats(null);
      }

      try {
        const recent = await teamsService.getTeamSchedule(teamData.school, 2024);
        if (isMounted) setRecentGames(recent);
      } catch (err) {
        console.error("Error fetching recent games:", err);
        if (isMounted) setRecentGames([]);
      }

      try {
        const lines = await teamsService.getGameLines(2024, teamData.school);
        if (isMounted) setBettingLines(lines);
      } catch (err) {
        console.error("Error fetching betting lines:", err);
        if (isMounted) setBettingLines([]);
      }

      try {
        const matchup = await teamsService.getTeamMatchup(teamData.school, "Ohio State");
        if (isMounted) setMatchupData(matchup);
      } catch (err) {
        console.error("Error fetching matchup data:", err);
        if (isMounted) setMatchupData(null);
      }

      try {
        const pStats = await teamsService.getPlayerSeasonStats(2024, "passing");
        if (isMounted) setPlayerStats(pStats);
      } catch (err) {
        console.error("Error fetching player stats:", err);
        if (isMounted) setPlayerStats([]);
      }

      if (isMounted) setLoading(false);
    }

    fetchAllData();
    return () => {
      isMounted = false;
    };
  }, [teamId]);

  // -----------------------------
  // Handlers & Helpers
  // -----------------------------
  const handleTeamSelect = () => {
    if (selectedTeam) {
      navigate(`/team-metrics/${selectedTeam}`);
    }
  };

  const handleFilterChange = (filterOption) => {
    setSelectedFilter(filterOption);
  };

  const filteredGames = React.useMemo(() => {
    if (!recentGames || recentGames.length === 0) return [];
    if (selectedFilter === "Season") return recentGames;
    const count = parseInt(selectedFilter.replace("L", ""), 10);
    return recentGames.slice(-count);
  }, [recentGames, selectedFilter]);

  const recentGameChartData = filteredGames.map((game) => ({
    week: game.week,
    pointsFor:
      game.homeTeam === teamInfo?.school ? game.homePoints : game.awayPoints,
    pointsAgainst:
      game.homeTeam === teamInfo?.school ? game.awayPoints : game.homePoints,
  }));

  // -----------------------------
  // Render team selection UI if no team is chosen
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

  if (loading)
    return <div className="team-analytics-loading">Loading Team Analytics...</div>;
  if (error)
    return <div className="team-analytics-error">Error: {error}</div>;

  // -----------------------------
  // Render Analytics UI
  // -----------------------------
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
            <p>Offense Rank: {ratings?.offenseRank || "N/A"}</p>
            <p>Defense Rank: {ratings?.defenseRank || "N/A"}</p>
          </div>
        </div>
      </section>

      {/* 2️⃣ RECENT GAME PERFORMANCE */}
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

      {/* 3️⃣ KEY TEAM METRICS (Cards UI) */}
      <section className="key-team-metrics">
        <h2>Key Team Metrics</h2>
        <div className="metrics-cards">
          <div className="metric-card">
            <h3>Offensive Rating</h3>
            <p>{ratings?.offense || "N/A"}</p>
          </div>
          <div className="metric-card">
            <h3>Defensive Rating</h3>
            <p>{ratings?.defense || "N/A"}</p>
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
            <p>Team A Points Scored: {matchupData.team1PointsPerGame || "N/A"}</p>
            <p>Team B Points Allowed: {matchupData.team2PointsAllowedPerGame || "N/A"}</p>
            <p>
              Rushing vs. Passing Tendencies: {matchupData.team1RunPassRatio || "N/A"} vs.{" "}
              {matchupData.team2RunPassRatio || "N/A"}
            </p>
            <p>
              Defensive Strengths: {matchupData.team1DefensiveStrength || "N/A"} vs.{" "}
              {matchupData.team2DefensiveStrength || "N/A"}
            </p>
            <p>Key Players: {matchupData.keyPlayers ? matchupData.keyPlayers.join(", ") : "N/A"}</p>
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
                <Line type="monotone" dataKey="spreadOpen" stroke="#8884d8" name="Open Spread" />
                <Line type="monotone" dataKey="spreadCurrent" stroke="#82ca9d" name="Current Spread" />
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
                  <td>{player.fullName || "N/A"}</td>
                  <td>{player.position || "N/A"}</td>
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