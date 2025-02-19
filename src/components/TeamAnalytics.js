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

  // Analytics state (we'll add more data later)
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [teamInfo, setTeamInfo] = useState(null);

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

  // Fetch basic team info if teamId exists
  useEffect(() => {
    if (!teamId) return;
    async function fetchTeamInfo() {
      setLoading(true);
      setError(null);
      try {
        const teamData = await teamsService.getTeamById(teamId);
        if (!teamData) throw new Error("Team not found");
        setTeamInfo(teamData);
      } catch (err) {
        setError(err.message);
      }
      setLoading(false);
    }
    fetchTeamInfo();
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
      {/* Basic Header Section */}
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
          </div>
        </div>
      </section>

      {/* More sections will be added here step by step */}
    </div>
  );
}

export default TeamAnalytics;