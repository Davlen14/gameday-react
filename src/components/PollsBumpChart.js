import React, { useState, useEffect, useRef } from "react";
import * as d3 from "d3";
import teamsService from "../services/teamsService";

const PollsBumpChart = ({ width, height, pollType, weekRange }) => {
  const chartRef = useRef();
  const [chartData, setChartData] = useState([]);
  const [teams, setTeams] = useState([]);

  // Fetch teams data on mount so we can look up team info.
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

  // Convert pollType string from dropdown to API value.
  const mapPollType = (type) => {
    if (type === "AP Poll") return "ap";
    if (type === "Coaches Poll") return "coaches";
    if (type === "Playoff Rankings") return "cfp";
    return "ap"; // fallback.
  };

  // Convert weekRange string to numeric start and end weeks.
  // Options: "Week 1 - 5", "Week 1 - 10", "Week 1 - 15"
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

  // Helper function to look up team info from the fetched teams data.
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

  useEffect(() => {
    // Fetch polls for each week in the selected range and transform data.
    const fetchPollData = async () => {
      try {
        const { startWeek, endWeek } = mapWeekRange(weekRange);
        const apiPollType = mapPollType(pollType);
        const weeks = [];
        for (let w = startWeek; w <= endWeek; w++) {
          // Fetch poll data for week w (regular season).
          const pollForWeek = await teamsService.getPolls(2024, apiPollType, w);
          // Assume pollForWeek[0] is the poll group for that week.
          weeks.push(pollForWeek[0]);
        }

        // Transform weekly polls into a team-centric format.
        const teamsMap = {};
        weeks.forEach((pollGroup, i) => {
          // For each week, iterate over rankings.
          pollGroup.rankings.forEach((team) => {
            if (!teamsMap[team.school]) {
              // Initialize an array of length equal to number of weeks with null.
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
        // Fallback sample data for 5 weeks.
        setChartData([
          { team: "Georgia", ranks: [1, 1, 2, 1, 1] },
          { team: "Michigan", ranks: [2, 2, 1, 2, 2] },
        ]);
      }
    };

    fetchPollData();
  }, [pollType, weekRange]);

  useEffect(() => {
    // Clear previous chart.
    d3.select(chartRef.current).selectAll("*").remove();

    if (!chartData || chartData.length === 0) return;

    const { startWeek, endWeek } = mapWeekRange(weekRange);
    const totalWeeks = endWeek - startWeek + 1;

    // Increase right margin to give space for logos.
    const margin = { top: 20, right: 100, bottom: 30, left: 40 },
      innerWidth = width - margin.left - margin.right,
      innerHeight = height - margin.top - margin.bottom;

    const svg = d3
      .select(chartRef.current)
      .attr("width", width)
      .attr("height", height);
      // Removed explicit background styling to let the modal's CSS apply

    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left}, ${margin.top})`);

    // X scale: domain from startWeek to endWeek.
    const xScale = d3
      .scaleLinear()
      .domain([startWeek, endWeek])
      .range([0, innerWidth]);

    // Y scale: ranking from 1 (best) to 25.
    const yScale = d3
      .scaleLinear()
      .domain([25, 1])
      .range([innerHeight, 0]);

    const xAxis = d3
      .axisBottom(xScale)
      .ticks(totalWeeks)
      .tickFormat(d3.format("d"));
    const yAxis = d3.axisLeft(yScale).ticks(25);

    g.append("g")
      .attr("transform", `translate(0, ${innerHeight})`)
      .call(xAxis);
    g.append("g").call(yAxis);

    // Define line generator that ignores null values.
    const line = d3
      .line()
      .defined((d) => d !== null)
      .x((d, i) => xScale(i + startWeek))
      .y((d) => yScale(d))
      .curve(d3.curveMonotoneX);

    // Draw a line for each team.
    chartData.forEach((teamData) => {
      const teamInfo = getTeamInfo(teamData.team);

      const path = g
        .append("path")
        .datum(teamData.ranks)
        .attr("fill", "none")
        .attr("stroke", teamInfo.color)
        .attr("stroke-width", 2)
        .attr("d", line);

      // Animate the line drawing (5 seconds).
      const totalLength = path.node().getTotalLength();
      path
        .attr("stroke-dasharray", totalLength + " " + totalLength)
        .attr("stroke-dashoffset", totalLength)
        .transition()
        .duration(5000)
        .ease(d3.easeLinear)
        .attr("stroke-dashoffset", 0);

      // Append team logo image at the end of the line.
      const lastIndex = teamData.ranks
        .map((d, i) => ({ d, i }))
        .filter((item) => item.d !== null)
        .pop()?.i;
      if (lastIndex !== undefined) {
        const lastRank = teamData.ranks[lastIndex];
        // Center the logo: subtract half of logo width/height (assume 20px).
        g.append("image")
          .attr("xlink:href", teamInfo.logo)
          .attr("width", 20)
          .attr("height", 20)
          .attr("x", xScale(lastIndex + startWeek) - 10)
          .attr("y", yScale(lastRank) - 10);
      }
    });
  }, [chartData, height, width, weekRange]);

  return <svg ref={chartRef}></svg>;
};

export default PollsBumpChart;