import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import teamsService from "../services/teamsService";
import { RadialBarChart, RadialBar, Legend } from "recharts";
import "../styles/TeamDetail.css"; // Update/add styles as needed

// A reusable Gauge component
const Gauge = ({ label, value, min, max, fill }) => {
  // For a gauge effect, we use a RadialBarChart that spans 180° (from 180 to 0)
  // We'll transform the value to a percentage relative to the provided min/max.
  const normalizedValue = Math.max(min, Math.min(value, max));
  const percent = ((normalizedValue - min) / (max - min)) * 100;
  
  // Create data that the chart will render.
  const data = [
    {
      name: label,
      // For the gauge, use the percentage value.
      value: percent,
    },
  ];

  return (
    <div className="gauge">
      <RadialBarChart
        width={150}
        height={150}
        cx={75}
        cy={75}
        innerRadius={30}
        outerRadius={70}
        startAngle={180}
        endAngle={0}
        data={data}
      >
        <RadialBar
          minAngle={15}
          background
          clockWise
          dataKey="value"
          fill={fill}
        />
        {/* Center text showing the raw value */}
        <text
          x={75}
          y={75}
          textAnchor="middle"
          dominantBaseline="middle"
          className="gauge-label"
        >
          {value}
        </text>
      </RadialBarChart>
      <div className="gauge-title">{label}</div>
    </div>
  );
};

const TeamDetail = () => {
  const { teamId } = useParams();
  const [allTeams, setAllTeams] = useState([]); 
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

  // Helper to lookup team logo
  const getTeamLogo = (teamName) => {
    const foundTeam = allTeams.find(
      (t) => t.school.toLowerCase() === teamName?.toLowerCase()
    );
    return foundTeam?.logos?.[0] || "/photos/default_team.png";
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading((prev) => ({ ...prev, team: true }));
        const teamsData = await teamsService.getTeams();
        setAllTeams(teamsData);

        const foundTeam = teamsData.find(
          (t) => t.id === parseInt(teamId, 10)
        );
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

  if (isLoading.team) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;
  if (!team) return <div>Team not found</div>;

  // Use the team's color if available; fallback to something neutral
  const sidebarStyle = {
    backgroundColor: team.color || "#f0f0f0",
  };

  return (
    <div className="team-dashboard">
      {/* Sidebar / Header area */}
      <aside className="team-sidebar" style={sidebarStyle}>
        <Link to="/teams" className="back-to-teams">
          ← Back to All Teams
        </Link>

        {/* Team Logo */}
        <img
          src={team.logos?.[0] || "/photos/default_team.png"}
          alt={team.school}
          className="team-logo-large"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = "/photos/default_team.png";
          }}
        />

        {/* Basic Team Info */}
        <h1 className="team-name">{team.school}</h1>
        <p className="team-mascot">{team.mascot}</p>
      </aside>

      {/* Main content area */}
      <main className="team-main-content">
        {/* Ratings Section */}
        <section className="team-ratings">
          <h2>Ratings</h2>
          <div className="gauges-container">
            {/* Using the thresholds we discussed:
                - Overall: scale -5 to 35
                - Offense: scale 20 to 45
                - Defense: scale 5 to 35 */}
            <Gauge
              label="Overall"
              value={ratings.overall || 0}
              min={-5}
              max={35}
              fill="#8884d8"
            />
            <Gauge
              label="Offense"
              value={ratings.offense || 0}
              min={20}
              max={45}
              fill="#82ca9d"
            />
            <Gauge
              label="Defense"
              value={ratings.defense || 0}
              min={5}
              max={35}
              fill="#ff7300"
            />
          </div>
        </section>

        {/* Schedule Section */}
        <section className="team-schedule">
          <h2>Schedule</h2>
          {schedule.map((game, index) => (
            <div key={index} className="schedule-item">
              <div className="teams-playing">
                <img
                  src={game.homeLogo || getTeamLogo(game.homeTeam)}
                  alt={game.homeTeam}
                  className="schedule-team-logo"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "/photos/default_team.png";
                  }}
                />
                <span>
                  {game.homeTeam} vs. {game.awayTeam}
                </span>
                <img
                  src={game.awayLogo || getTeamLogo(game.awayTeam)}
                  alt={game.awayTeam}
                  className="schedule-team-logo"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "/photos/default_team.png";
                  }}
                />
              </div>
              <p>
                Score: {game.homePoints} - {game.awayPoints}
              </p>
              <p>Venue: {game.venue || "TBD"}</p>
            </div>
          ))}
        </section>

        {/* Roster Section */}
        <section className="team-roster">
          <h2>Roster</h2>
          <ul>
            {roster.map((player, index) => (
              <li key={index}>
                {player.fullName} — {player.position || "N/A"} — Height:{" "}
                {player.height} — Year: {player.year || "N/A"}
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  );
};

export default TeamDetail;
