import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import teamsService from "../services/teamsService";
import { RadialBarChart, RadialBar } from "recharts";
import "../styles/TeamDetail.css";

// --- Gauge Component for Ratings ---
const GAUGE_MIN = 1;
const GAUGE_MAX = 45;
const GAUGE_RANGE = GAUGE_MAX - GAUGE_MIN;

const RED_LENGTH = 15 - 1;    
const YELLOW_LENGTH = 30 - 15; 
const GREEN_LENGTH = 45 - 30;  

const redPercent = (RED_LENGTH / GAUGE_RANGE) * 100;
const yellowPercent = (YELLOW_LENGTH / GAUGE_RANGE) * 100;
const greenPercent = (GREEN_LENGTH / GAUGE_RANGE) * 100;

const gaugeData = [
  { name: "Red", value: redPercent, fill: "#ff0000" },
  { name: "Yellow", value: yellowPercent, fill: "#fdbf00" },
  { name: "Green", value: greenPercent, fill: "#00b300" },
];

const TICK_VALUES = [1, 15, 30, 45];

const Gauge = ({ label, rawValue }) => {
  const clampedValue = Math.max(GAUGE_MIN, Math.min(rawValue, GAUGE_MAX));
  const normalizedValue = ((clampedValue - GAUGE_MIN) / GAUGE_RANGE) * 100;
  const centerX = 75;
  const centerY = 75;
  const needleLength = 60;
  const angle = 180 - (normalizedValue * 180) / 100;
  const rad = (angle * Math.PI) / 180;
  const needleX = centerX + needleLength * Math.cos(rad);
  const needleY = centerY - needleLength * Math.sin(rad);

  const ticks = TICK_VALUES.map((tickVal) => {
    const tickPercent = ((tickVal - GAUGE_MIN) / GAUGE_RANGE) * 100;
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

      <text
        x={centerX}
        y={centerY + 100}
        textAnchor="middle"
        fontSize="18"
        fill="red"
      >
        {Math.round(clampedValue)}
      </text>

      <div className="gauge-title" style={{ marginTop: "1rem", fontSize: "14px" }}>
        {label}
      </div>
    </div>
  );
};

//
// TeamDetail Component
//
const TeamDetail = () => {
  const { teamId } = useParams();
  const navigate = useNavigate();
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
  if (error) return <div className="error">{error}</div>;
  if (!team) return <div>Team not found</div>;

  // Sidebar style using team color
  const sidebarStyle = {
    backgroundColor: team.color || "#f0f0f0",
  };

  return (
    <div className="team-dashboard">
      {/* Sidebar */}
      <aside className="team-sidebar" style={sidebarStyle}>
        <Link to="/teams" className="back-to-teams">
          ← Back to All Teams
        </Link>
        <img
          src={getTeamLogo(team.school)}
          alt={team.school}
          className="team-logo-large"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = "/photos/default_team.png";
          }}
        />
        <h1 className="team-name">{team.school}</h1>
        <p className="team-mascot">{team.mascot}</p>
      </aside>

      {/* Main Content */}
      <main className="team-main-content">
        {/* Ratings Section */}
        <section className="team-ratings">
          <h2>SP+ Ratings</h2>
          <div className="gauges-container">
            <Gauge label="Overall" rawValue={ratings.overall || 1} />
            <Gauge label="Offense" rawValue={ratings.offense || 1} />
            <Gauge label="Defense" rawValue={ratings.defense || 1} />
          </div>
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
              Here, each gauge is scaled from 1 to 45:
              <br />
              <strong>Red:</strong> 1–15, <strong>Yellow:</strong> 15–30, <strong>Green:</strong> 30–45
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