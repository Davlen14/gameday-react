import React, { useState, useEffect } from "react";
import teamsService from "../services/teamsService";
import "../styles/TeamAnalyticsDetail.css";

const TeamAnalyticsDetail = ({ teamName }) => {
  const [schedule, setSchedule] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        const scheduleData = await teamsService.getTeamSchedule(teamName, 2024);
        console.log("Schedule Data:", scheduleData);
        setSchedule(scheduleData);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to load data.");
      } finally {
        setIsLoading(false);
      }
    };

    if (teamName) {
      fetchSchedule();
    }
  }, [teamName]);

  if (isLoading) return <p>Loading game details...</p>;
  if (error) return <p className="error">{error}</p>;

  return (
    <div className="team-analytics-detail-container">
      <h2 className="detail-title">{teamName} 2024 Game Details</h2>
      {schedule.map((game) => (
        <div key={game.gameId} className="game-detail-card">
          <div className="game-header">
            <div className="team-info">
              <img
                src={`/logos/${game.homeTeam}.png`}
                alt={game.homeTeam}
                className="team-logo-detail"
              />
              <span className="team-name">{game.homeTeam}</span>
            </div>
            <span className="vs">VS</span>
            <div className="team-info">
              <img
                src={`/logos/${game.awayTeam}.png`}
                alt={game.awayTeam}
                className="team-logo-detail"
              />
              <span className="team-name">{game.awayTeam}</span>
            </div>
          </div>

          <div className="game-meta">
            <p>
              <strong>Date:</strong> {new Date(game.date).toLocaleDateString()}
            </p>
            <p>
              <strong>Venue:</strong> {game.venue}
            </p>
          </div>

          <div className="game-stats">
            <div className="stat-box">
              <span className="stat-label">{game.homeTeam} Points</span>
              <span className="stat-value">{game.homePoints}</span>
            </div>
            <div className="stat-box">
              <span className="stat-label">{game.awayTeam} Points</span>
              <span className="stat-value">{game.awayPoints}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default TeamAnalyticsDetail;