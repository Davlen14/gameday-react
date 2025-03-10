import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import teamsService from "../services/teamsService";

const AdvancedGameDetailView = () => {
  const { id } = useParams(); // Get game ID from URL
  const [game, setGame] = useState(null);
  const [teams, setTeams] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch teams and specific game data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch teams data
        const teamsData = await teamsService.getTeams();
        setTeams(teamsData);

        // Fetch all games (we'll filter for the specific one)
        // In a real app, you might have a getGameById endpoint
        const gamesData = await teamsService.getGames(1); // Assuming week 1 for now
        
        // Find the specific game by ID
        const selectedGame = gamesData.find(g => g.id === parseInt(id) || g.id === id);
        
        if (selectedGame) {
          setGame(selectedGame);
        } else {
          setError("Game not found");
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id]);

  // Get team logo from team data (fallback if not found)
  const getTeamLogo = (teamName) => {
    const team = teams.find(
      (t) => t.school.toLowerCase() === teamName.toLowerCase()
    );
    return team && team.logos && team.logos.length > 0
      ? team.logos[0]
      : "/photos/default_team.png";
  };

  // Get team details (record, ranking, etc)
  const getTeamDetails = (teamName) => {
    const team = teams.find(
      (t) => t.school.toLowerCase() === teamName.toLowerCase()
    );
    return team || {};
  };

  if (isLoading) return <div>Loading game details...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!game) return <div>Game not found</div>;

  const homeTeamDetails = getTeamDetails(game.homeTeam);
  const awayTeamDetails = getTeamDetails(game.awayTeam);

  return (
    <div className="advanced-game-detail">
      {/* Inline CSS for the component */}
      <style>{`
        .advanced-game-detail {
          padding: 20px;
          font-family: Arial, sans-serif;
          max-width: 1000px;
          margin: 0 auto;
        }
        .game-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 1px solid #eee;
        }
        .teams-comparison {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
        }
        .team-column {
          flex: 1;
          text-align: center;
          padding: 20px;
        }
        .vs-column {
          width: 100px;
          text-align: center;
          font-size: 24px;
          font-weight: bold;
        }
        .team-logo {
          width: 100px;
          height: 100px;
          object-fit: contain;
          margin-bottom: 15px;
        }
        .team-name {
          font-size: 24px;
          font-weight: bold;
          margin-bottom: 5px;
        }
        .team-record {
          color: #666;
          margin-bottom: 10px;
        }
        .score {
          font-size: 42px;
          font-weight: bold;
          margin: 15px 0;
        }
        .game-status {
          font-size: 18px;
          color: #555;
          margin-bottom: 20px;
        }
        .detail-section {
          background-color: #f9f9f9;
          border-radius: 8px;
          padding: 20px;
          margin-bottom: 20px;
        }
        .detail-section h2 {
          margin-top: 0;
          border-bottom: 1px solid #eee;
          padding-bottom: 10px;
          margin-bottom: 15px;
        }
        .stat-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 10px;
        }
        .stat-label {
          font-weight: bold;
        }
        .game-info-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 20px;
          margin-bottom: 30px;
        }
        .info-card {
          background-color: #f9f9f9;
          border-radius: 8px;
          padding: 15px;
        }
        .info-card h3 {
          margin-top: 0;
          margin-bottom: 10px;
          border-bottom: 1px solid #eee;
          padding-bottom: 8px;
        }
        @media (max-width: 768px) {
          .teams-comparison {
            flex-direction: column;
          }
          .team-column {
            width: 100%;
          }
          .vs-column {
            margin: 15px 0;
          }
          .game-info-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="game-header">
        <h1>Game Details</h1>
        <div className="game-status">
          {game.status === 'final' 
            ? 'Final Score' 
            : game.startTime 
              ? new Date(game.startTime).toLocaleString() 
              : 'Upcoming Game'}
        </div>
      </div>

      <div className="teams-comparison">
        <div className="team-column">
          <img
            src={getTeamLogo(game.homeTeam)}
            alt={game.homeTeam}
            className="team-logo"
          />
          <div className="team-name">{game.homeTeam}</div>
          <div className="team-record">
            {homeTeamDetails.record ? `Record: ${homeTeamDetails.record}` : ''}
            {homeTeamDetails.rank ? ` • Rank: #${homeTeamDetails.rank}` : ''}
          </div>
          <div className="score">{game.homePoints || '0'}</div>
        </div>

        <div className="vs-column">VS</div>

        <div className="team-column">
          <img
            src={getTeamLogo(game.awayTeam)}
            alt={game.awayTeam}
            className="team-logo"
          />
          <div className="team-name">{game.awayTeam}</div>
          <div className="team-record">
            {awayTeamDetails.record ? `Record: ${awayTeamDetails.record}` : ''}
            {awayTeamDetails.rank ? ` • Rank: #${awayTeamDetails.rank}` : ''}
          </div>
          <div className="score">{game.awayPoints || '0'}</div>
        </div>
      </div>

      <div className="game-info-grid">
        <div className="info-card">
          <h3>Venue Information</h3>
          <p><strong>Stadium:</strong> {game.venue || 'TBD'}</p>
          <p><strong>Location:</strong> {game.location || 'TBD'}</p>
          <p><strong>Capacity:</strong> {game.venueCapacity || 'N/A'}</p>
        </div>

        <div className="info-card">
          <h3>Broadcast Information</h3>
          <p><strong>Network:</strong> {game.network || 'TBD'}</p>
          <p><strong>Announcers:</strong> {game.announcers || 'TBD'}</p>
        </div>
      </div>

      {game.status === 'final' && (
        <div className="detail-section">
          <h2>Game Statistics</h2>
          
          <h3>Team Stats</h3>
          <div className="stat-row">
            <span className="stat-label">First Downs</span>
            <span>{game.homeFirstDowns || '0'} - {game.awayFirstDowns || '0'}</span>
          </div>
          <div className="stat-row">
            <span className="stat-label">Total Yards</span>
            <span>{game.homeTotalYards || '0'} - {game.awayTotalYards || '0'}</span>
          </div>
          <div className="stat-row">
            <span className="stat-label">Passing Yards</span>
            <span>{game.homePassingYards || '0'} - {game.awayPassingYards || '0'}</span>
          </div>
          <div className="stat-row">
            <span className="stat-label">Rushing Yards</span>
            <span>{game.homeRushingYards || '0'} - {game.awayRushingYards || '0'}</span>
          </div>
          <div className="stat-row">
            <span className="stat-label">Turnovers</span>
            <span>{game.homeTurnovers || '0'} - {game.awayTurnovers || '0'}</span>
          </div>
        </div>
      )}

      {/* You can add more sections here for player stats, play-by-play, etc. */}
    </div>
  );
};

export default AdvancedGameDetailView;
