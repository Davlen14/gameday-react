import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import teamsService from "../services/teamsService";
import { RadialBarChart, RadialBar } from "recharts";
import "../styles/TeamAnalytics.css";

// --------------------------
// Gauge Constants & Component
// --------------------------
const GAUGE_MIN = 1;
const GAUGE_MAX = 45;
const GAUGE_RANGE = GAUGE_MAX - GAUGE_MIN; // 44

const RED_LENGTH = 15 - 1;    // 14 units
const YELLOW_LENGTH = 30 - 15; // 15 units
const GREEN_LENGTH = 45 - 30;  // 15 units

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
  // Clamp and normalize value
  const clampedValue = Math.max(GAUGE_MIN, Math.min(rawValue, GAUGE_MAX));
  const normalizedValue = ((clampedValue - GAUGE_MIN) / GAUGE_RANGE) * 100;
  const centerX = 75, centerY = 75, needleLength = 60;
  const angle = 180 - (normalizedValue * 180) / 100;
  const rad = (angle * Math.PI) / 180;
  const needleX = centerX + needleLength * Math.cos(rad);
  const needleY = centerY - needleLength * Math.sin(rad);

  // Calculate tick positions
  const ticks = TICK_VALUES.map((tickVal) => {
    const tickPercent = ((tickVal - GAUGE_MIN) / GAUGE_RANGE) * 100;
    const tickAngle = 180 - (tickPercent * 180) / 100;
    const tickRad = (tickAngle * Math.PI) / 180;
    const tickX = centerX + 65 * Math.cos(tickRad);
    const tickY = centerY - 65 * Math.sin(tickRad);
    return { label: tickVal, x: tickX, y: tickY };
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
        <RadialBar dataKey="value" clockWise />
        <line
          x1={centerX}
          y1={centerY}
          x2={needleX}
          y2={needleY}
          stroke="#000"
          strokeWidth={4}
        />
        <circle cx={centerX} cy={centerY} r={4} fill="#000" />
        {ticks.map((tick, i) => (
          <React.Fragment key={i}>
            <circle cx={tick.x} cy={tick.y} r={2} fill="#000" />
            <text x={tick.x} y={tick.y + 12} textAnchor="middle" fontSize="10" fill="#000">
              {tick.label}
            </text>
          </React.Fragment>
        ))}
      </RadialBarChart>
      <div className="gauge-value">{Math.round(clampedValue)}</div>
      <div className="gauge-label">{label}</div>
    </div>
  );
};

// --------------------------
// TeamAnalytics Component
// --------------------------
const TeamAnalytics = () => {
  const { teamId } = useParams();
  const navigate = useNavigate();

  // State for team selection if no teamId is provided
  const [availableTeams, setAvailableTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState("");

  // Data states for team info, schedule, roster, and ratings
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [teamInfo, setTeamInfo] = useState(null);
  const [schedule, setSchedule] = useState([]);
  const [roster, setRoster] = useState([]);
  const [ratings, setRatings] = useState({});

  // Fetch teams if no team is selected
  useEffect(() => {
    if (!teamId) {
      async function fetchTeams() {
        try {
          const teams = await teamsService.getTeams();
          setAvailableTeams(teams);
        } catch (err) {
          console.error("Error fetching teams:", err);
        }
      }
      fetchTeams();
    }
  }, [teamId]);

  // Fetch team data if teamId exists
  useEffect(() => {
    if (!teamId) return;
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const teamData = await teamsService.getTeamById(teamId);
        if (!teamData) throw new Error("Team not found");
        setTeamInfo(teamData);

        const sched = await teamsService.getTeamSchedule(teamData.school, 2024);
        setSchedule(sched);

        const rost = await teamsService.getTeamRoster(teamData.school, 2024);
        setRoster(rost);

        const ratingData = await teamsService.getTeamRatings(teamData.school, 2024);
        setRatings(ratingData);
      } catch (err) {
        setError(err.message);
      }
      setLoading(false);
    }
    fetchData();
  }, [teamId]);

  const handleTeamSelect = () => {
    if (selectedTeam) {
      navigate(`/team-metrics/${selectedTeam}`);
    }
  };

  // Render team selection if no team is chosen
  if (!teamId) {
    return (
      <div className="team-analytics-container">
        <h2>Select a Team to View Analytics</h2>
        <select value={selectedTeam} onChange={(e) => setSelectedTeam(e.target.value)}>
          <option value="">-- Select a Team --</option>
          {availableTeams.map((team) => (
            <option key={team.id} value={team.id}>
              {team.school}
            </option>
          ))}
        </select>
        <button onClick={handleTeamSelect} disabled={!selectedTeam}>
          View Analytics
        </button>
      </div>
    );
  }

  if (loading) return <div className="team-analytics-loading">Loading team data...</div>;
  if (error) return <div className="team-analytics-error">Error: {error}</div>;

  return (
    <div className="team-analytics-container">
      {/* Header Section */}
      <section className="team-analytics-header">
        <div className="team-info">
          <img
            src={teamInfo?.logo || "/photos/default_team.png"}
            alt={`${teamInfo?.school} logo`}
            className="team-logo"
          />
          <h1>{teamInfo?.school}</h1>
        </div>
      </section>

      {/* SP+ Ratings Gauges */}
      <section className="team-ratings">
        <h2>SP+ Ratings</h2>
        <div className="gauges-container">
          <Gauge label="Overall" rawValue={ratings.overall || 1} />
          <Gauge label="Offense" rawValue={ratings.offense || 1} />
          <Gauge label="Defense" rawValue={ratings.defense || 1} />
        </div>
      </section>

      {/* Schedule Section */}
      <section className="team-schedule">
        <h2>Schedule</h2>
        {schedule.length === 0 ? (
          <p>No schedule available.</p>
        ) : (
          <ul>
            {schedule.map((game) => (
              <li key={game.id}>
                Week {game.week} - {game.homeTeam} vs. {game.awayTeam} on{" "}
                {new Date(game.date).toLocaleDateString()}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Roster Section */}
      <section className="team-roster">
        <h2>Roster</h2>
        {roster.length === 0 ? (
          <p>No roster available.</p>
        ) : (
          <ul>
            {roster.map((player) => (
              <li key={player.id}>
                {player.fullName} — {player.position || "N/A"} — Height: {player.height} — Year: {player.year || "N/A"}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};

export default TeamAnalytics;