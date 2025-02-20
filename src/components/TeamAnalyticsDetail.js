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

  // Pull colors from the game object
  const homeColor = game.homeColor;
  const awayColor = game.awayColor;

  // Prepare logos and date/time
  const homeLogo = getTeamLogo(game.homeTeam);
  const awayLogo = getTeamLogo(game.awayTeam);
  const gameDate = new Date(game.date).toLocaleDateString();
  const gameTime = game.time || "TBD"; // Adjust as needed if your API uses a different property

  return (
    <div className="min-h-screen w-full bg-gray-100 flex flex-col">
      {/* --- Scoreboard Section --- */}
      <div className="relative flex items-center justify-between bg-white h-20 shadow">
        {/* Left diagonal color (Away color) */}
        <div
          className="absolute left-0 top-0 h-full w-8"
          style={{
            backgroundColor: awayColor,
            clipPath: "polygon(0 0, 100% 0, 80% 100%, 0 100%)",
          }}
        ></div>

        {/* Right diagonal color (Home color) */}
        <div
          className="absolute right-0 top-0 h-full w-8"
          style={{
            backgroundColor: homeColor,
            clipPath: "polygon(20% 0, 100% 0, 100% 100%, 0 100%)",
          }}
        ></div>

        {/* Away Team */}
        <div className="flex items-center pl-16 space-x-2">
          <img
            src={awayLogo}
            alt={game.awayTeam}
            className="w-8 h-8 object-contain"
          />
          <div className="text-left text-sm">
            <div className="font-semibold">{game.awayTeam}</div>
            {/* Points (if available) */}
            {game.awayPoints !== undefined && (
              <div className="text-xs">{game.awayPoints}</div>
            )}
          </div>
        </div>

        {/* Game Info (center) */}
        <div className="text-center text-sm">
          <div className="font-semibold">{gameDate}</div>
          <div>{gameTime}</div>
          <div className="text-xs mt-1">{game.venue}</div>
        </div>

        {/* Home Team */}
        <div className="flex items-center pr-16 space-x-2">
          <div className="text-right text-sm">
            <div className="font-semibold">{game.homeTeam}</div>
            {/* Points (if available) */}
            {game.homePoints !== undefined && (
              <div className="text-xs">{game.homePoints}</div>
            )}
          </div>
          <img
            src={homeLogo}
            alt={game.homeTeam}
            className="w-8 h-8 object-contain"
          />
        </div>
      </div>

      {/* --- Additional Content (stats, charts, etc.) --- */}
      <div className="flex-1 max-w-4xl w-full mx-auto p-6">
        <div className="bg-white rounded shadow p-4">
          <h2 className="text-xl font-semibold mb-4">Additional Dashboard Stats</h2>
          <p className="text-sm text-gray-600">Add your content here...</p>
        </div>
      </div>
    </div>
  );
};

export default TeamAnalyticsDetail;







