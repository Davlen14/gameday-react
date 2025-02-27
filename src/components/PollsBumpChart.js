import React, { useState, useEffect } from "react";
import ReactECharts from "echarts-for-react";
import teamsService from "../services/teamsService";

/** Helper: Convert pollType string to API value */
const mapPollType = (type) => {
  if (type === "AP Poll") return "ap";
  if (type === "Coaches Poll") return "coaches";
  if (type === "Playoff Rankings") return "cfp";
  return "ap";
};

/** Helper: Convert weekRange string to numeric start/end weeks */
const mapWeekRange = (rangeStr) => {
  switch (rangeStr) {
    case "Week 1 - 5":
      return { startWeek: 1, endWeek: 5 };
    case "Week 1 - 10":
      return { startWeek: 1, endWeek: 10 };
    case "Week 1 - 15":
      return { startWeek: 1, endWeek: 15 };
    default:
      return { startWeek: 1, endWeek: 5 };
  }
};

const PollsBumpChart = ({ width, height, pollType, weekRange }) => {
  const [chartData, setChartData] = useState([]);
  const [teams, setTeams] = useState([]);
  const [option, setOption] = useState({});

  // Fetch teams data on mount
  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const teamsData = await teamsService.getTeams();
        setTeams(teamsData);
      } catch (error) {
        console.error("Error fetching teams:", error);
      }
    };
    fetchTeams();
  }, []);

  // Helper: Look up team info (color, logo) from the fetched teams data
  const getTeamInfo = (teamName) => {
    const foundTeam = teams.find(
      (t) => t.school.toLowerCase() === teamName.toLowerCase()
    );
    if (foundTeam) {
      return {
        color: foundTeam.color || "gray",
        logo:
          foundTeam.logos && foundTeam.logos[0]
            ? foundTeam.logos[0]
            : "/photos/default_team.png",
      };
    }
    return { color: "gray", logo: "/photos/default_team.png" };
  };

  // Fetch poll data for each week in the selected range
  useEffect(() => {
    const fetchPollData = async () => {
      try {
        const { startWeek, endWeek } = mapWeekRange(weekRange);
        const apiPollType = mapPollType(pollType);
        const weeks = [];

        // For each week in the range, fetch poll data
        for (let w = startWeek; w <= endWeek; w++) {
          const pollForWeek = await teamsService.getPolls(2024, apiPollType, w);
          // Assume pollForWeek[0] is the poll group for that week
          weeks.push(pollForWeek[0]);
        }

        // Transform weekly polls into a team-centric structure
        const teamsMap = {};
        weeks.forEach((pollGroup, i) => {
          pollGroup.rankings.forEach((team) => {
            if (!teamsMap[team.school]) {
              teamsMap[team.school] = new Array(weeks.length).fill(null);
            }
            teamsMap[team.school][i] = team.rank;
          });
        });

        const transformedData = Object.keys(teamsMap).map((teamName) => ({
          team: teamName,
          ranks: teamsMap[teamName],
        }));

        setChartData(transformedData);
      } catch (error) {
        console.error("Error fetching poll data:", error);
        // Fallback sample data
        setChartData([
          { team: "Georgia", ranks: [1, 1, 2, 1, 1] },
          { team: "Michigan", ranks: [2, 2, 1, 2, 2] },
        ]);
      }
    };

    fetchPollData();
  }, [pollType, weekRange]);

  // Build ECharts option whenever chartData updates
  useEffect(() => {
    if (!chartData.length) return;

    const { startWeek, endWeek } = mapWeekRange(weekRange);
    // Create an array of week numbers for the x-axis
    const weeks = [];
    for (let w = startWeek; w <= endWeek; w++) {
      weeks.push(w);
    }

    // Build a line series for each team
    const series = chartData.map((teamData) => {
      const teamInfo = getTeamInfo(teamData.team);
      const data = teamData.ranks;

      // Find the index of the last valid data point
      const validPoints = data
        .map((val, idx) => ({ val, idx }))
        .filter((p) => p.val !== null);

      // Create a mark point with the team's logo at the final data point
      let markPoints = [];
      if (validPoints.length > 0) {
        const lastPoint = validPoints[validPoints.length - 1];
        markPoints.push({
          coord: [weeks[lastPoint.idx], lastPoint.val],
          symbol: `image://${teamInfo.logo}`,
          symbolSize: 20,
          itemStyle: { color: teamInfo.color },
        });
      }

      return {
        name: teamData.team,
        type: "line",
        smooth: true,
        symbol: "none", // no normal symbols along the line
        lineStyle: {
          color: teamInfo.color,
          width: 2,
        },
        data,
        // Show the final team logo as a mark point
        markPoint: {
          data: markPoints,
        },
      };
    });

    // ECharts option
    const newOption = {
      // No legend (like the simpler D3 version)
      legend: {
        show: false,
      },
      tooltip: {
        trigger: "axis",
        formatter: (params) => {
          let tooltip = `Week: ${params[0].axisValue}<br/>`;
          params.forEach((p) => {
            tooltip += `<span style="color:${p.color};">●</span> ${p.seriesName}: ${p.data}<br/>`;
          });
          return tooltip;
        },
      },
      grid: {
        left: "5%",
        right: "10%",
        bottom: "10%",
        containLabel: true,
      },
      // X-axis: from startWeek to endWeek, no boundary gap for line
      xAxis: {
        type: "category",
        boundaryGap: false,
        data: weeks,
        name: "Week",
        axisLine: {
          lineStyle: { color: "#888" },
        },
      },
      // Y-axis: rank #1 at top, no label name for simplicity
      yAxis: {
        type: "value",
        inverse: true,
        min: 1,
        max: 25,
        axisLine: {
          lineStyle: { color: "#888" },
        },
        name: "",
      },
      series,
    };

    setOption(newOption);
  }, [chartData, weekRange]);

  return (
    <ReactECharts
      option={option}
      style={{ width, height }}
      opts={{ renderer: "svg" }}
    />
  );
};

export default PollsBumpChart;