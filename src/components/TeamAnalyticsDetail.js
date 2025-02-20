import React, { useState, useEffect } from "react";
import teamsService from "../services/teamsService";
import { useParams, useLocation } from "react-router-dom";

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

  // Same logo lookup logic as in TeamAnalytics
  const getTeamLogo = (teamName) => {
    const team = teamsList.find(
      (t) => t.school.toLowerCase() === teamName.toLowerCase()
    );
    return team && team.logos ? team.logos[0] : "/photos/default_team.png";
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch all teams
        const teamsData = await teamsService.getTeams();
        setTeamsList(teamsData);

        // Find the selected team
        const foundTeam = teamsData.find((t) => t.id === parseInt(teamId, 10));
        if (!foundTeam) {
          throw new Error("Team not found");
        }
        setSelectedTeam(foundTeam);

        // Fetch that team's schedule
        const scheduleData = await teamsService.getTeamSchedule(
          foundTeam.school,
          2024
        );
        // Find the specific game by gameId
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
    return (
      <div className="flex items-center justify-center h-screen">
        Loading...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen text-red-500">
        {error}
      </div>
    );
  }

  if (!game) {
    return (
      <div className="flex items-center justify-center h-screen">
        Game not found
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-100 to-gray-200">
      {/* Card Container */}
      <div className="bg-white shadow-lg rounded-lg p-8 flex flex-col items-center space-y-6 max-w-xl w-full mx-4">
        {/* Teams and Score */}
        <div className="flex flex-col sm:flex-row items-center sm:space-x-8 space-y-4 sm:space-y-0">
          {/* Home Team */}
          <div className="flex flex-col items-center">
            <img
              src={getTeamLogo(game.homeTeam)}
              alt={game.homeTeam}
              className="w-20 h-20 object-contain"
            />
            <span className="mt-2 text-lg font-semibold">
              {game.homeTeam}
            </span>
          </div>

          {/* Score */}
          <div className="text-4xl font-bold text-gray-800">
            {game.homePoints} - {game.awayPoints}
          </div>

          {/* Away Team */}
          <div className="flex flex-col items-center">
            <img
              src={getTeamLogo(game.awayTeam)}
              alt={game.awayTeam}
              className="w-20 h-20 object-contain"
            />
            <span className="mt-2 text-lg font-semibold">
              {game.awayTeam}
            </span>
          </div>
        </div>

        {/* Venue */}
        <div className="text-gray-600 text-sm font-medium">
          Venue: {game.venue}
        </div>
      </div>
    </div>
  );
};

export default TeamAnalyticsDetail;



