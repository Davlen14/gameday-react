import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import teamsService from "../services/teamsService";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";
import "../styles/TeamAnalytics.css";

const TeamAnalytics = () => {
  const { teamId } = useParams();
  const navigate = useNavigate();

  // State for team selection if no team is chosen
  const [availableTeams, setAvailableTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState("");

  // Data states for team info and schedule
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [teamInfo, setTeamInfo] = useState(null);
  const [schedule, setSchedule] = useState([]);

  // Fetch teams if no team is selected
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

  // Fetch team schedule data if teamId exists
  useEffect(() => {
    if (!teamId) return;
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const teamData = await teamsService.getTeamById(teamId);
        if (!teamData) throw new Error("Team not found");
        setTeamInfo(teamData);

        // Use the team schedule logic that works: pass the team school name and year,
        // and then set the schedule from the API response.
        const sched = await teamsService.getTeamSchedule(teamData.school, 2024);
        setSchedule(sched);
      } catch (err) {
        setError(err.message);
      }
      setLoading(false);
    }
    fetchData();
  }, [teamId]);

  const handleTeamSelect = () => {
    if (selectedTeam) {
      navigate(`/team-metrics/${selectedTeam}`);
    }
  };

  // If no team selected, show team selection UI
  if (!teamId) {
    return (
      <div className="team-analytics-container">
        <h2>Select a Team to View Analytics</h2>
        <select value={selectedTeam} onChange={(e) => setSelectedTeam(e.target.value)}>
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

  if (loading) return <div className="team-analytics-loading">Loading team data...</div>;
  if (error) return <div className="team-analytics-error">Error: {error}</div>;

  // Prepare chart data from schedule using the working logic:
  // Determine for each game whether the team is home or away, and record points accordingly.
  const chartData = schedule.map((game) => {
    const isHome = game.homeTeam === teamInfo.school;
    return {
      week: game.week,
      opponent: isHome ? game.awayTeam : game.homeTeam,
      teamPoints: isHome ? game.homePoints : game.awayPoints,
      opponentPoints: isHome ? game.awayPoints : game.homePoints
    };
  });

  return (
    <div className="team-analytics-container">
      {/* Header Section */}
      <section className="team-analytics-header">
        <div className="team-info">
          <img
            src={teamInfo?.logo || "/photos/default_team.png"}
            alt={`${teamInfo?.school} logo`}
            className="team-logo"
          />
          <h1>{teamInfo?.school}</h1>
        </div>
      </section>

      {/* Bar Chart Section */}
      <section className="team-points-chart">
        <h2>Points by Game</h2>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData} margin={{ top: 20, right: 20, left: 0, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="week" label={{ value: "Week", position: "insideBottom", offset: -5 }} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="teamPoints" name={`${teamInfo.school} Points`} fill="#82ca9d" />
              <Bar dataKey="opponentPoints" name="Opponent Points" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p>No game data available for chart.</p>
        )}
      </section>

      {/* Schedule Section */}
      <section className="team-schedule">
        <h2>Schedule</h2>
        {schedule.length === 0 ? (
          <p>No schedule available.</p>
        ) : (
          <ul>
            {schedule.map((game) => (
              <li key={game.id || game.week}>
                Week {game.week} - {game.homeTeam} vs. {game.awayTeam} on{" "}
                {new Date(game.date).toLocaleDateString()}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};

export default TeamAnalytics;