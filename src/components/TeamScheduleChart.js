import React, { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
} from "recharts";
import teamsService from "../services/teamsService";
import "../styles/TeamAnalytics.css";

const TeamScheduleChart = ({ teamName }) => {
  const [schedule, setSchedule] = useState([]);
  const [teams, setTeams] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        const teamsData = await teamsService.getTeams();
        setTeams(teamsData);

        const scheduleData = await teamsService.getTeamSchedule(teamName, 2024);
        setSchedule(scheduleData);
      } catch (err) {
        setError("Failed to load schedule.");
      } finally {
        setIsLoading(false);
      }
    };

    if (teamName) {
      fetchSchedule();
    }
  }, [teamName]);

  const getTeamData = (team) => {
    return teams.find((t) => t.school.toLowerCase() === team.toLowerCase()) || {};
  };

  const formattedData = schedule.map((game) => ({
    week: `Week ${game.week}`,
    homeTeam: game.homeTeam,
    awayTeam: game.awayTeam,
    homePoints: game.homePoints || 0,
    awayPoints: game.awayPoints || 0,
    homeColor: getTeamData(game.homeTeam).color || "#999999",
    awayColor: getTeamData(game.awayTeam).color || "#888888",
    homeLogo:
      getTeamData(game.homeTeam).logos?.[0] || "/photos/default_team.png",
    awayLogo:
      getTeamData(game.awayTeam).logos?.[0] || "/photos/default_team.png",
  }));

  // Custom label function for home team logos
  const renderHomeLogoLabel = (props) => {
    const { x, y, width, payload } = props;
    const logoSrc = payload.homeLogo;
    const logoSize = 28; // Adjust size as needed
    const xPos = x + width / 2 - logoSize / 2;
    const yPos = y - logoSize - 5; // place logo above the bar
    return (
      <image
        href={logoSrc}
        x={xPos}
        y={yPos}
        width={logoSize}
        height={logoSize}
      />
    );
  };

  // Custom label function for away team logos
  const renderAwayLogoLabel = (props) => {
    const { x, y, width, payload } = props;
    const logoSrc = payload.awayLogo;
    const logoSize = 28;
    const xPos = x + width / 2 - logoSize / 2;
    const yPos = y - logoSize - 5;
    return (
      <image
        href={logoSrc}
        x={xPos}
        y={yPos}
        width={logoSize}
        height={logoSize}
      />
    );
  };

  if (isLoading) return <p>Loading schedule...</p>;
  if (error) return <p className="error">{error}</p>;

  return (
    <div className="chart-container">
      <h2 className="chart-title">
        {teamName} 2024 Schedule - Points Scored
      </h2>
      <div className="chart-wrapper">
        <ResponsiveContainer width="100%" height={400}>
          <BarChart
            data={formattedData}
            margin={{ top: 60, right: 30, left: 20, bottom: 50 }}
          >
            <XAxis dataKey="week" tick={{ fill: "#333" }} />
            <YAxis tick={{ fill: "#333" }} />
            <Tooltip cursor={{ fill: "rgba(0, 0, 0, 0.1)" }} />

            {/* Home Team Bar */}
            <Bar dataKey="homePoints" name="Home">
              {formattedData.map((game, index) => (
                <Cell key={`home-${index}`} fill={game.homeColor} />
              ))}
              <LabelList
                dataKey="homePoints"
                content={renderHomeLogoLabel}
              />
            </Bar>

            {/* Away Team Bar */}
            <Bar dataKey="awayPoints" name="Away">
              {formattedData.map((game, index) => (
                <Cell key={`away-${index}`} fill={game.awayColor} />
              ))}
              <LabelList
                dataKey="awayPoints"
                content={renderAwayLogoLabel}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default TeamScheduleChart;