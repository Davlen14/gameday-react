import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList
} from "recharts";
import "../styles/TeamAnalytics.css";

const TeamScheduleChart = ({ teamName, schedule, getTeamLogo }) => {
  // Transform schedule into a format Recharts can read
  const formattedData = schedule.map((game) => ({
    week: `Week ${game.week}`,
    homeTeam: game.homeTeam,
    awayTeam: game.awayTeam,
    homePoints: game.homePoints || 0,
    awayPoints: game.awayPoints || 0,
    homeLogo: getTeamLogo(game.homeTeam),
    awayLogo: getTeamLogo(game.awayTeam),
  }));

  // Custom label for "home" bar
  const renderHomeLogoLabel = (props) => {
    const { x, y, width, payload } = props;
    const logoSrc = payload.homeLogo;
    const logoSize = 28; // adjust as desired

    // Position the logo in the horizontal center of the bar
    const xPos = x + width / 2 - logoSize / 2;
    // Position above the bar (slightly above y)
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

  // Custom label for "away" bar
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

  if (!schedule || schedule.length === 0) {
    return null;
  }

  return (
    <div className="chart-container">
      <h2 className="chart-title">{teamName} 2024 Schedule - Points Scored</h2>
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={formattedData} margin={{ top: 20, right: 30, left: 20, bottom: 50 }}>
          <XAxis dataKey="week" />
          <YAxis />
          <Tooltip cursor={{ fill: "rgba(0, 0, 0, 0.1)" }} />

          {/* Home Team Bar */}
          <Bar dataKey="homePoints" name="Home" fill="#8884d8">
            {formattedData.map((entry, index) => (
              <Cell key={`home-cell-${index}`} fill="#8884d8" />
            ))}
            <LabelList dataKey="homePoints" content={renderHomeLogoLabel} />
          </Bar>

          {/* Away Team Bar */}
          <Bar dataKey="awayPoints" name="Away" fill="#82ca9d">
            {formattedData.map((entry, index) => (
              <Cell key={`away-cell-${index}`} fill="#82ca9d" />
            ))}
            <LabelList dataKey="awayPoints" content={renderAwayLogoLabel} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default TeamScheduleChart;