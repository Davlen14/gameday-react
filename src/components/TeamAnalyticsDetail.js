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
  if (error) return <p className="error-analyticlsdetail">{error}</p>;

  return (
    <div className="team-analytics-detail-container-analyticlsdetail">
      <h2 className="detail-title-analyticlsdetail">{teamName} 2024 Game Details</h2>
      {schedule.map((game) => (
        <div key={game.gameId} className="game-detail-card-analyticlsdetail">
          <div className="game-header-analyticlsdetail">
            <div className="team-info-analyticlsdetail">
              <img
                src={`/logos/${game.homeTeam}.png`}
                alt={game.homeTeam}
                className="team-logo-detail-analyticlsdetail"
              />
              <span className="team-name-analyticlsdetail">{game.homeTeam}</span>
            </div>
            <span className="vs-analyticlsdetail">VS</span>
            <div className="team-info-analyticlsdetail">
              <img
                src={`/logos/${game.awayTeam}.png`}
                alt={game.awayTeam}
                className="team-logo-detail-analyticlsdetail"
              />
              <span className="team-name-analyticlsdetail">{game.awayTeam}</span>
            </div>
          </div>

          <div className="game-meta-analyticlsdetail">
            <p>
              <strong>Date:</strong> {new Date(game.date).toLocaleDateString()}
            </p>
            <p>
              <strong>Venue:</strong> {game.venue}
            </p>
          </div>

          <div className="game-stats-analyticlsdetail">
            <div className="stat-box-analyticlsdetail">
              <span className="stat-label-analyticlsdetail">{game.homeTeam} Points</span>
              <span className="stat-value-analyticlsdetail">{game.homePoints}</span>
            </div>
            <div className="stat-box-analyticlsdetail">
              <span className="stat-label-analyticlsdetail">{game.awayTeam} Points</span>
              <span className="stat-value-analyticlsdetail">{game.awayPoints}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default TeamAnalyticsDetail;
