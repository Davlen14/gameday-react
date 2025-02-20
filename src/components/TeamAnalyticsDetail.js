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

  // Logo lookup logic, matching what's used in TeamAnalytics
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

        // 2. Find the selected team
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

  // Destructure color properties directly from the game object
  // (Adjust property names if your API uses something different)
  const homeColor = game.homeColor;
  const awayColor = game.awayColor;

  // Prepare logos and date/time
  const homeLogo = getTeamLogo(game.homeTeam);
  const awayLogo = getTeamLogo(game.awayTeam);
  const gameDate = new Date(game.date).toLocaleDateString();
  const gameTime = game.time || "TBD"; // Adjust if your data has a different time property

  return (
    <div className="min-h-screen w-full bg-gray-100 flex flex-col">
      {/* Hero Section with diagonal split */}
      <div className="relative w-full h-44 flex items-center justify-center text-white overflow-hidden">
        {/* Left diagonal background (Away) */}
        <div
          className="absolute left-0 top-0 w-1/2 h-full"
          style={{
            backgroundColor: awayColor,
            clipPath: "polygon(0 0, 100% 0, 85% 100%, 0 100%)",
          }}
        ></div>

        {/* Right diagonal background (Home) */}
        <div
          className="absolute right-0 top-0 w-1/2 h-full"
          style={{
            backgroundColor: homeColor,
            clipPath: "polygon(15% 0, 100% 0, 100% 100%, 0 100%)",
          }}
        ></div>

        {/* Main content overlay */}
        <div className="relative z-10 flex items-center justify-between w-full max-w-4xl px-6">
          {/* Away Team */}
          <div className="flex items-center space-x-3">
            <img
              src={awayLogo}
              alt={game.awayTeam}
              className="w-16 h-16 object-contain"
            />
            <div className="text-left">
              <div className="text-lg font-bold">{game.awayTeam}</div>
              <div className="text-sm">{game.awayPoints} pts</div>
            </div>
          </div>

          {/* Date / Time / Venue */}
          <div className="flex flex-col items-center text-center">
            <div className="text-xl font-bold">{gameDate}</div>
            <div className="text-base">{gameTime}</div>
            <div className="text-sm font-medium mt-1">{game.venue}</div>
          </div>

          {/* Home Team */}
          <div className="flex items-center space-x-3">
            <div className="text-right">
              <div className="text-lg font-bold">{game.homeTeam}</div>
              <div className="text-sm">{game.homePoints} pts</div>
            </div>
            <img
              src={homeLogo}
              alt={game.homeTeam}
              className="w-16 h-16 object-contain"
            />
          </div>
        </div>
      </div>

      {/* Additional content for your dashboard */}
      <div className="flex-1 max-w-4xl w-full mx-auto p-6">
        {/* Put more stats, charts, or analytics here */}
        <div className="bg-white rounded shadow p-4">
          <h2 className="text-xl font-semibold mb-4">Additional Dashboard Stats</h2>
          <p className="text-sm text-gray-600">Add your content here...</p>
        </div>
      </div>
    </div>
  );
};

export default TeamAnalyticsDetail;






