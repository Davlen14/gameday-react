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

  // Use the same logic as in TeamAnalytics to get a team's logo.
  const getTeamLogo = (teamName) => {
    const team = teamsList.find(
      (t) => t.school.toLowerCase() === teamName.toLowerCase()
    );
    return team && team.logos ? team.logos[0] : "/photos/default_team.png";
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch all teams and store them in state.
        const teamsData = await teamsService.getTeams();
        setTeamsList(teamsData);

        // Find the selected team by ID.
        const foundTeam = teamsData.find(
          (t) => t.id === parseInt(teamId, 10)
        );
        if (!foundTeam) {
          throw new Error("Team not found");
        }
        setSelectedTeam(foundTeam);

        // Fetch the schedule for the selected team.
        const scheduleData = await teamsService.getTeamSchedule(foundTeam.school, 2024);
        // Find the specific game using the gameId from the query string.
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

  if (isLoading)
    return (
      <div className="flex items-center justify-center h-screen">
        Loading...
      </div>
    );
  if (error)
    return (
      <div className="flex items-center justify-center h-screen text-red-500">
        {error}
      </div>
    );
  if (!game)
    return (
      <div className="flex items-center justify-center h-screen">
        Game not found
      </div>
    );

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
      <div className="flex items-center space-x-4 p-4 bg-white rounded shadow">
        <img
          src={getTeamLogo(game.homeTeam)}
          alt={game.homeTeam}
          className="w-20 h-20"
        />
        <span className="text-2xl font-bold">
          {game.homePoints} - {game.awayPoints}
        </span>
        <img
          src={getTeamLogo(game.awayTeam)}
          alt={game.awayTeam}
          className="w-20 h-20"
        />
      </div>
    </div>
  );
};

export default TeamAnalyticsDetail;



