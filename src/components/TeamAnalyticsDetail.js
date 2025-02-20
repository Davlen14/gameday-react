import React, { useState, useEffect } from "react";
import teamsService from "../services/teamsService";
import { useParams } from "react-router-dom";
import "../styles/TeamAnalyticsDetail.css"; // Import your custom CSS

const TeamAnalyticsDetail = () => {
    const { teamId } = useParams();
    const { search } = useLocation();
    const queryParams = new URLSearchParams(search);
    const gameId = queryParams.get("gameId");
  
    const [teamsList, setTeamsList] = useState([]);
    const [selectedTeam, setSelectedTeam] = useState(null);
    const [game, setGame] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
  
    // Fetch the correct logo for a given team name
    const getTeamLogo = (teamName) => {
      const team = teamsList.find(
        (t) => t.school.toLowerCase() === teamName.toLowerCase()
      );
      return team && team.logos ? team.logos[0] : "/photos/default_team.png";
    };
  
    useEffect(() => {
      const fetchData = async () => {
        try {
          // 1. Fetch all teams
          const teamsData = await teamsService.getTeams();
          setTeamsList(teamsData);
  
          // 2. Find the selected team by ID
          const foundTeam = teamsData.find((t) => t.id === parseInt(teamId, 10));
          if (!foundTeam) {
            throw new Error("Team not found");
          }
          setSelectedTeam(foundTeam);
  
          // 3. Fetch that team's schedule
          const scheduleData = await teamsService.getTeamSchedule(
            foundTeam.school,
            2024
          );
  
          // 4. Find the specific game by gameId
          const foundGame = scheduleData.find(
            (g) => g.id === parseInt(gameId, 10)
          );
          if (!foundGame) {
            throw new Error("Game not found");
          }
          setGame(foundGame);
        } catch (err) {
          setError(err.message);
        } finally {
          setIsLoading(false);
        }
      };
  
      fetchData();
    }, [teamId, gameId]);
  
    if (isLoading) {
      return <div className="centered-fullscreen">Loading...</div>;
    }
  
    if (error) {
      return <div className="centered-fullscreen error">{error}</div>;
    }
  
    if (!game) {
      return <div className="centered-fullscreen">Game not found</div>;
    }
  
    // Pull colors from the game object
    const homeColor = game.homeColor;
    const awayColor = game.awayColor;
  
    // Prepare logos and date/time
    const homeLogo = getTeamLogo(game.homeTeam);
    const awayLogo = getTeamLogo(game.awayTeam);
    const gameDate = new Date(game.date).toLocaleDateString();
    const gameTime = game.time || "TBD"; // Adjust if your API uses a different property
  
    return (
      <div className="team-analytics-page">
        {/* Scoreboard Section */}
        <div className="scoreboard">
          {/* Away Color Bar */}
          <div
            className="scoreboard__color-bar scoreboard__color-bar--left"
            style={{ backgroundColor: awayColor }}
          />
  
          {/* Home Color Bar */}
          <div
            className="scoreboard__color-bar scoreboard__color-bar--right"
            style={{ backgroundColor: homeColor }}
          />
  
          {/* Away Team */}
          <div className="scoreboard__team scoreboard__team--away">
            <img
              src={awayLogo}
              alt={game.awayTeam}
              className="scoreboard__logo"
            />
            <div className="scoreboard__team-info">
              <span className="scoreboard__team-name">{game.awayTeam}</span>
              {game.awayPoints !== undefined && (
                <span className="scoreboard__team-score">
                  {game.awayPoints}
                </span>
              )}
            </div>
          </div>
  
          {/* Game Info (Center) */}
          <div className="scoreboard__center">
            <div className="scoreboard__date">{gameDate}</div>
            <div className="scoreboard__time">{gameTime}</div>
            <div className="scoreboard__venue">{game.venue}</div>
          </div>
  
          {/* Home Team */}
          <div className="scoreboard__team scoreboard__team--home">
            <div className="scoreboard__team-info">
              <span className="scoreboard__team-name">{game.homeTeam}</span>
              {game.homePoints !== undefined && (
                <span className="scoreboard__team-score">
                  {game.homePoints}
                </span>
              )}
            </div>
            <img
              src={homeLogo}
              alt={game.homeTeam}
              className="scoreboard__logo"
            />
          </div>
        </div>
  
        {/* Additional Dashboard Content */}
        <div className="dashboard-content">
          <div className="dashboard-stats">
            <h2>Additional Dashboard Stats</h2>
            <p>Add your content here...</p>
          </div>
        </div>
      </div>
    );
  };
  
  export default TeamAnalyticsDetail;
  