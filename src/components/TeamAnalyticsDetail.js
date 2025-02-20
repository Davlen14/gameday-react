import React, { useState, useEffect } from "react";
import teamsService from "../services/teamsService";
import { useParams } from "react-router-dom";
import "../styles/TeamAnalyticsDetail.css"; // Import your custom CSS

const TeamAnalyticsDetail = () => {
  const { teamId } = useParams();
  const [team, setTeam] = useState(null);
  const [schedule, setSchedule] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const getTeamLogo = (teamName) => {
    // Assuming team logos are stored in a way where the logo is the same as the team name
    return `/logos/${teamName}.png`; // Adjust as needed if your logo structure differs
  };

  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        const teamData = await teamsService.getTeams();
        const foundTeam = teamData.find((t) => t.id === parseInt(teamId, 10));
        if (!foundTeam) {
          throw new Error("Team not found");
        }
        setTeam(foundTeam);
        
        const scheduleData = await teamsService.getTeamSchedule(foundTeam.school, 2024);
        setSchedule(scheduleData);
      } catch (err) {
        setError(`Error: ${err.message}`);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSchedule();
  }, [teamId]);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div className="error-analyticlsdetail">{error}</div>;
  if (!team) return <div>Team not found</div>;

  return (
    <div className="team-analytics-detail-container-analyticlsdetail">
      <h2 className="detail-title-analyticlsdetail">{team.school} 2024 Game Schedule</h2>
      {schedule.length > 0 ? (
        schedule.map((game, index) => (
          <div key={index} className="game-detail-card-analyticlsdetail">
            <div className="game-header-analyticlsdetail">
              <div className="team-info-analyticlsdetail">
                <img
                  src={getTeamLogo(game.homeTeam)}
                  alt={game.homeTeam}
                  className="team-logo-detail-analyticlsdetail"
                />
                <span className="team-name-analyticlsdetail">{game.homeTeam}</span>
              </div>
              <span className="vs-analyticlsdetail">VS</span>
              <div className="team-info-analyticlsdetail">
                <img
                  src={getTeamLogo(game.awayTeam)}
                  alt={game.awayTeam}
                  className="team-logo-detail-analyticlsdetail"
                />
                <span className="team-name-analyticlsdetail">{game.awayTeam}</span>
              </div>
            </div>
            <div className="game-meta-analyticlsdetail">
              <p><strong>Date:</strong> {new Date(game.date).toLocaleDateString()}</p>
              <p><strong>Venue:</strong> {game.venue}</p>
              <p><strong>Score:</strong> {game.homePoints} - {game.awayPoints}</p>
            </div>
          </div>
        ))
      ) : (
        <p>No games found for this team in 2024.</p>
      )}
    </div>
  );
};

export default TeamAnalyticsDetail;

