import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import teamsService from "../services/teamsService";
import "../styles/TeamAnalytics.css";

function TeamAnalytics() {
  const { teamId } = useParams();
  const navigate = useNavigate();

  // State for team selection when no teamId is provided
  const [availableTeams, setAvailableTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState("");

  // State for team info and schedule
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [teamInfo, setTeamInfo] = useState(null);
  const [teamSchedule, setTeamSchedule] = useState([]);

  // Fetch available teams if no team is selected
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

  // Fetch team info and schedule if teamId exists
  useEffect(() => {
    if (!teamId) return;
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        // Get team info (includes logo and school name)
        const teamData = await teamsService.getTeamById(teamId);
        if (!teamData) throw new Error("Team not found");
        setTeamInfo(teamData);

        // Get team schedule using the team name (adjust parameters as needed)
        const schedule = await teamsService.getTeamSchedule(teamData.school, 2024);
        setTeamSchedule(schedule);
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

  // Render team selection if no team is chosen
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

  return (
    <div className="team-analytics-container">
      {/* Basic Header Section: Display team logo and school name */}
      <section className="team-analytics-header">
        <div className="team-info">
          <img
            src={teamInfo?.logo || "/placeholder-logo.png"}
            alt={`${teamInfo?.school} logo`}
            className="team-logo"
          />
          <h1>{teamInfo?.school}</h1>
        </div>
      </section>

      {/* Team Schedule Section */}
      <section className="team-schedule">
        <h2>Team Schedule</h2>
        {teamSchedule.length === 0 ? (
          <p>No schedule available.</p>
        ) : (
          <ul>
            {teamSchedule.map((game) => (
              <li key={game.id}>
                Week {game.week} - {game.homeTeam} vs. {game.awayTeam} on{" "}
                {new Date(game.date).toLocaleDateString()}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

export default TeamAnalytics;