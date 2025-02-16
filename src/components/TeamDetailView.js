import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import teamsService from "../services/teamsService";
import { RadialBarChart, RadialBar, Legend } from "recharts";

const TeamDetail = () => {
  const { teamId } = useParams();
  const [team, setTeam] = useState(null);
  const [ratings, setRatings] = useState({});
  const [roster, setRoster] = useState([]);
  const [schedule, setSchedule] = useState([]);
  const [isLoading, setIsLoading] = useState({
    team: false,
    ratings: false,
    roster: false,
    schedule: false,
  });
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading((prev) => ({ ...prev, team: true }));
        const teamsData = await teamsService.getTeams();
        const foundTeam = teamsData.find((t) => t.id === parseInt(teamId, 10));
        if (!foundTeam) throw new Error("Team not found");
        setTeam(foundTeam);

        await Promise.all([
          fetchRatings(foundTeam.school),
          fetchRoster(foundTeam.school),
          fetchSchedule(foundTeam.school),
        ]);
      } catch (err) {
        setError(`Error: ${err.message}`);
      } finally {
        setIsLoading((prev) => ({ ...prev, team: false }));
      }
    };

    const fetchRatings = async (teamName) => {
      try {
        const data = await teamsService.getTeamRatings(teamName, 2024);
        setRatings(data);
      } catch (err) {
        console.error("Error fetching ratings:", err.message);
      }
    };

    const fetchRoster = async (teamName) => {
      try {
        const data = await teamsService.getTeamRoster(teamName, 2024);
        setRoster(data);
      } catch (err) {
        console.error("Error fetching roster:", err.message);
      }
    };

    const fetchSchedule = async (teamName) => {
      try {
        const data = await teamsService.getTeamSchedule(teamName, 2024);
        setSchedule(data);
      } catch (err) {
        console.error("Error fetching schedule:", err.message);
      }
    };

    fetchData();
  }, [teamId]);

  const ratingData = [
    { name: "Overall", value: ratings.overall || 0, fill: "#8884d8" },
    { name: "Offense", value: ratings.offense || 0, fill: "#82ca9d" },
    { name: "Defense", value: ratings.defense || 0, fill: "#ff7300" },
  ];

  if (isLoading.team) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;
  if (!team) return <div>Team not found</div>;

  return (
    <div style={{ padding: "20px" }}>
      <Link to="/teams">← Back to All Teams</Link>

      {/* Team Header */}
      <div style={{ backgroundColor: "#004c8c", color: "white", padding: "20px", textAlign: "center" }}>
        <img
          src={team.logos?.[0] || "/photos/default_team.png"}
          alt={team.school}
          width="150"
          height="150"
          onError={(e) => (e.target.style.display = "none")}
        />
        <h1>{team.school}</h1>
        <p>{team.mascot}</p>
      </div>

      {/* Ratings Section with Charts */}
      <div>
        <h2>Ratings</h2>
        <RadialBarChart width={300} height={300} cx={150} cy={150} innerRadius={20} outerRadius={140} barSize={10} data={ratingData}>
          <RadialBar minAngle={15} label background clockWise dataKey="value" />
          <Legend iconSize={10} layout="horizontal" verticalAlign="bottom" align="center" />
        </RadialBarChart>
      </div>

      {/* Schedule Section */}
      <div>
        <h2>Schedule</h2>
        {schedule.map((game, index) => (
          <div key={index} style={{ border: "1px solid #ddd", padding: "10px", margin: "5px" }}>
            <p>
              <img src={game.homeLogo || "/photos/default_team.png"} alt={game.homeTeam} width="50" height="50" />
              {game.homeTeam} vs. {game.awayTeam}
              <img src={game.awayLogo || "/photos/default_team.png"} alt={game.awayTeam} width="50" height="50" />
            </p>
            <p>Score: {game.homePoints} - {game.awayPoints}</p>
            <p>Venue: {game.venue || "TBD"}</p>
          </div>
        ))}
      </div>

      {/* Roster Section */}
      <div>
        <h2>Roster</h2>
        <ul>
          {roster.map((player, index) => (
            <li key={index}>
              {player.fullName} - {player.position || "N/A"} - Height: {player.height} - Year: {player.year || "N/A"}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default TeamDetail;

