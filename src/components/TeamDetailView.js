import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import teamsService from "../services/teamsService";
import { RadialBarChart, RadialBar } from "recharts";
import "../styles/TeamDetail.css"; // Update/add styles as needed

// Define static thresholds based on SP+ ratings research
const THRESHOLDS = {
  overall: { min: -5, max: 50 },
  offense: { min: 20, max: 45 },
  defense: { min: 5, max: 35 },
};

// A reusable Gauge component that renders an arc with red, yellow, green segments,
// black needle, custom tick marks for the domain [min..max], and a numeric label in red.
const Gauge = ({ label, value, min, max, fill }) => {
  // 1) Clamp the raw SP+ rating between min and max
  const clampedValue = Math.max(min, Math.min(value, max));
  
  // 2) Map [min..max] → [0..100] for internal "gauge" space
  const totalRange = max - min;  // e.g., 50 - (-5) = 55 for Overall
  const gaugeRange = 100;       
  const normalizedValue = ((clampedValue - min) / totalRange) * gaugeRange;

  // 3) Hard-code data for color segments in the gauge's internal 0..100 scale.
  //    Red:   0..20
  //    Yellow:20..60
  //    Green: 60..100
  const gaugeData = [
    { name: "Red", value: 20, fill: "#ff0000" },
    { name: "Yellow", value: 40, fill: "#fdbf00" },
    { name: "Green", value: 40, fill: "#00b300" },
  ];

  // 4) Needle calculation (the arc goes 180° to 0°).
  //    0 => angle=180°, 100 => angle=0°.
  const centerX = 75;
  const centerY = 75;
  const needleLength = 60;
  const angle = 180 - (normalizedValue * 180) / 100; // in degrees
  const rad = (angle * Math.PI) / 180;
  const needleX = centerX + needleLength * Math.cos(rad);
  const needleY = centerY - needleLength * Math.sin(rad);

  // 5) Tick marks at [-5, 0, 10, 20, 30, 40, 50].
  //    Each tick is mapped to [0..100] for angle calculation.
  const tickValues = [-5, 0, 10, 20, 30, 40, 50];
  const ticks = tickValues.map((tickVal) => {
    // Map tickVal to [0..100]
    const tickPercent = ((tickVal - min) / totalRange) * gaugeRange;
    const tickAngle = 180 - (tickPercent * 180) / 100;
    const tickRad = (tickAngle * Math.PI) / 180;
    const tickX = centerX + 65 * Math.cos(tickRad);
    const tickY = centerY - 65 * Math.sin(tickRad);
    return {
      label: tickVal,
      x: tickX,
      y: tickY,
    };
  });

  return (
    <div className="gauge">
      <RadialBarChart
        width={150}
        height={150}
        cx={centerX}
        cy={centerY}
        innerRadius={50}
        outerRadius={70}
        startAngle={180}
        endAngle={0}
        barSize={20}
        data={gaugeData}
      >
        <RadialBar dataKey="value" cornerRadius={0} clockWise stackId="gauge" />

        {/* Needle */}
        <line
          x1={centerX}
          y1={centerY}
          x2={needleX}
          y2={needleY}
          stroke="#000"
          strokeWidth={4}
        />
        {/* Needle pivot */}
        <circle cx={centerX} cy={centerY} r={4} fill="#000" />
        
        {/* Tick marks & labels */}
        {ticks.map((tick, i) => (
          <React.Fragment key={i}>
            <circle cx={tick.x} cy={tick.y} r={2} fill="#000" />
            <text
              x={tick.x}
              y={tick.y + 12}
              textAnchor="middle"
              fontSize="10"
              fill="#000"
            >
              {tick.label}
            </text>
          </React.Fragment>
        ))}
      </RadialBarChart>
      
      {/* Value in red below the gauge center */}
      <text
        x={centerX}
        y={centerY + 100}
        textAnchor="middle"
        fontSize="18"
        fill="red"
      >
        {Math.round(clampedValue)}
      </text>
      
      {/* Gauge label */}
      <div className="gauge-title" style={{ marginTop: "1rem", fontSize: "14px" }}>
        {label}
      </div>
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
            {/* Overall gauge: scale -5 to 50 */}
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

