import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import teamsService from "../services/teamsService";
import { RadialBarChart, RadialBar, Legend } from "recharts";
// Updated CSS import to use your custom stylesheet
import "../styles/TeamDetail.css";

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

  if (isLoading.team) return <div className="loading">Loading...</div>;
  if (error) return <div className="error-message">{error}</div>;
  if (!team) return <div className="error-message">Team not found</div>;

  return (
    <div className="team-detail-container">
      <Link to="/teams" className="back-link">
        ← Back to All Teams
      </Link>

      {/* Team Header */}
      <div className="team-header">
        <img
          src={team.logos?.[0] || "/photos/default_team.png"}
          alt={team.school}
          className="team-logo"
        />
        <h1>{team.school}</h1>
        <p>{team.mascot}</p>
      </div>

      {/* Ratings Section with Charts */}
      <div className="ratings-section">
        <h2>Ratings</h2>
        <RadialBarChart
          width={300}
          height={300}
          cx={150}
          cy={150}
          innerRadius={20}
          outerRadius={140}
          barSize={10}
          data={ratingData}
        >
          <RadialBar minAngle={15} label background clockWise dataKey="value" />
          <Legend
            iconSize={10}
            layout="horizontal"
            verticalAlign="bottom"
            align="center"
          />
        </RadialBarChart>
      </div>

      {/* Schedule Section */}
      <div className="schedule-section">
        <h2>Schedule</h2>
        {schedule.map((game, index) => (
          <div key={index} className="schedule-card">
            <p>
              <img
                src={game.homeLogo || "/photos/default_team.png"}
                alt={game.homeTeam}
                className="team-small-logo"
              />
              {game.homeTeam} vs. {game.awayTeam}
              <img
                src={game.awayLogo || "/photos/default_team.png"}
                alt={game.awayTeam}
                className="team-small-logo"
              />
            </p>
            <p>
              Score: {game.homePoints} - {game.awayPoints}
            </p>
            <p>Venue: {game.venue || "TBD"}</p>
          </div>
        ))}
      </div>

      {/* Roster Section */}
      <div className="roster-section">
        <h2>Roster</h2>
        <ul className="roster-list">
          {roster.map((player, index) => (
            <li key={index} className="roster-item">
              {player.fullName} - {player.position || "N/A"} - Height:{" "}
              {player.height} - Year: {player.year || "N/A"}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default TeamDetail;


