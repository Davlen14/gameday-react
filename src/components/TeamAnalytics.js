import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
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
      navigate(`/team-analytics-detail/${selectedTeam}`);
    }
  };

  const getTeamLogo = (teamName) => {
    const team = availableTeams.find((t) => t.school.toLowerCase() === teamName.toLowerCase());
    return team?.logos ? team.logos[0] : "/photos/default_team.png";
  };

  if (!teamId) {
    return (
      <div className="team-analytics-container">
        <h2>Select a Team to View Analytics</h2>
        <select value={selectedTeam} onChange={(e) => setSelectedTeam(e.target.value)} className="team-dropdown">
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

  // Prepare chart data from schedule
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
          <ul className="game-list">
            {schedule.map((game) => (
              <li key={game.id} className="game-item">
                <Link 
                  to={`/team-analytics-detail/${teamInfo.school}?gameId=${game.id}`}
                  className="game-link"
                >
                  <div className="game-teams">
                    <div className="team">
                      <img src={getTeamLogo(game.awayTeam)} alt={game.awayTeam} className="team-logo" />
                      <span>{game.awayTeam}</span>
                    </div>
                    <span className="vs"> @ </span>
                    <div className="team">
                      <img src={getTeamLogo(game.homeTeam)} alt={game.homeTeam} className="team-logo" />
                      <span>{game.homeTeam}</span>
                    </div>
                  </div>
                  <div className="game-info">
                    <span>{new Date(game.date).toLocaleDateString()}</span>
                    <span className="venue">Venue: {game.venue}</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};

export default TeamAnalytics;