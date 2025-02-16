import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import teamsService from "../services/teamsService";
import { RadialBarChart, RadialBar } from "recharts";
import "../styles/TeamDetail.css"; // Update/add styles as needed

// Define static thresholds based on SP+ ratings research
const THRESHOLDS = {
  overall: { min: -5, max: 35 },
  offense: { min: 20, max: 45 },
  defense: { min: 5, max: 35 },
};

// A reusable Gauge component with markers and a pointer arrow
const Gauge = ({ label, value, min, max, fill }) => {
  // Clamp value between min and max and compute percentage for the gauge (0-100)
  const clampedValue = Math.max(min, Math.min(value, max));
  const percent = ((clampedValue - min) / (max - min)) * 100;
  
  // For the gauge, we use a RadialBarChart spanning 180° (from 180 to 0)
  const centerX = 75;
  const centerY = 75;
  // Pointer length (roughly at the middle of the arc)
  const pointerLength = 50;
  // Compute the pointer angle (180 deg corresponds to min; 0 deg is max)
  const pointerAngle = 180 - (percent / 100) * 180; // in degrees
  const pointerX = centerX + pointerLength * Math.cos((pointerAngle * Math.PI) / 180);
  const pointerY = centerY - pointerLength * Math.sin((pointerAngle * Math.PI) / 180);

  // Markers positions at min (180°), mid (90°), and max (0°)
  const markerRadius = 5;
  const markers = [
    {
      angle: 180,
      color: "#FF0000", // bright red for min
    },
    {
      angle: 90,
      color: "#FFFF00", // bright yellow for mid
    },
    {
      angle: 0,
      color: "#39FF14", // neon green for max
    },
  ];

  // Calculate marker positions (using same pointerLength for consistency)
  const markerPositions = markers.map((marker) => {
    const x = centerX + pointerLength * Math.cos((marker.angle * Math.PI) / 180);
    const y = centerY - pointerLength * Math.sin((marker.angle * Math.PI) / 180);
    return { x, y, color: marker.color };
  });

  // Data for the gauge (only one segment representing the percent filled)
  const data = [
    {
      name: label,
      value: percent,
    },
  ];

  return (
    <div className="gauge">
      <RadialBarChart
        width={150}
        height={150}
        cx={centerX}
        cy={centerY}
        innerRadius={30}
        outerRadius={70}
        startAngle={180}
        endAngle={0}
        data={data}
      >
        {/* Define an arrow marker for the pointer */}
        <defs>
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="7"
            refX="0"
            refY="3.5"
            orient="auto"
          >
            <polygon points="0 0, 10 3.5, 0 7" fill="black" />
          </marker>
        </defs>
        <RadialBar
          minAngle={15}
          background
          clockWise
          dataKey="value"
          fill={fill}
        />
        {/* Render pointer arrow */}
        <line
          x1={centerX}
          y1={centerY}
          x2={pointerX}
          y2={pointerY}
          stroke="black"
          strokeWidth={2}
          markerEnd="url(#arrowhead)"
        />
        {/* Render markers for min, mid, and max */}
        {markerPositions.map((marker, idx) => (
          <circle
            key={idx}
            cx={marker.x}
            cy={marker.y}
            r={markerRadius}
            fill={marker.color}
          />
        ))}
        {/* Center text showing the raw rating value */}
        <text
          x={centerX}
          y={centerY}
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

  // Use the team's color if available; fallback to neutral
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
          <h2>SP+ Ratings</h2>
          <div className="gauges-container">
            {/* Overall gauge: scale -5 to 35 */}
            <Gauge
              label="Overall"
              value={ratings.overall || 0}
              min={THRESHOLDS.overall.min}
              max={THRESHOLDS.overall.max}
              fill="#8884d8"
            />
            {/* Offense gauge: scale 20 to 45 */}
            <Gauge
              label="Offense"
              value={ratings.offense || 0}
              min={THRESHOLDS.offense.min}
              max={THRESHOLDS.offense.max}
              fill="#82ca9d"
            />
            {/* Defense gauge: scale 5 to 35 */}
            <Gauge
              label="Defense"
              value={ratings.defense || 0}
              min={THRESHOLDS.defense.min}
              max={THRESHOLDS.defense.max}
              fill="#ff7300"
            />
          </div>
          {/* Explanation Section */}
          <div className="ratings-explanation">
            <h3>How SP+ Ratings Work</h3>
            <p>
              The SP+ ratings combine multiple aspects of team performance into a single composite metric.
              <br />
              <strong>Overall:</strong> Combines offense, defense, and special teams.
              <br />
              <strong>Offense:</strong> Measures scoring efficiency and ball movement.
              <br />
              <strong>Defense:</strong> Lower values indicate a stronger defense.
            </p>
            <p>
              The markers on each gauge indicate the minimum (bright red), mid-range (bright yellow),
              and maximum (neon green) expected ratings.
            </p>
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
                {player.fullName} — {player.position || "N/A"} — Height: {player.height} — Year: {player.year || "N/A"}
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  );
};

export default TeamDetail;

