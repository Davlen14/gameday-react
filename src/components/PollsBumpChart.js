import React, { useState, useEffect, useRef } from "react";
import * as d3 from "d3";
import teamsService from "../services/teamsService";

const PollsBumpChart = ({ width, height, pollType, weekRange }) => {
  const chartRef = useRef();
  const [chartData, setChartData] = useState([]);

  // Convert pollType string from dropdown to API value
  const mapPollType = (type) => {
    if (type === "AP Poll") return "ap";
    if (type === "Coaches Poll") return "coaches";
    if (type === "Playoff Rankings") return "cfp";
    return "ap"; // fallback
  };

  // Convert weekRange string to numeric start and end weeks
  const mapWeekRange = (rangeStr) => {
    switch (rangeStr) {
      case "Week 1 - 5":
        return { startWeek: 1, endWeek: 5 };
      case "Week 6 - 10":
        return { startWeek: 6, endWeek: 10 };
      case "Week 11 - 15":
        return { startWeek: 11, endWeek: 15 };
      default:
        return { startWeek: 1, endWeek: 5 };
    }
  };

  useEffect(() => {
    // Fetch polls for each week in the selected range and transform data.
    const fetchPollData = async () => {
      try {
        const { startWeek, endWeek } = mapWeekRange(weekRange);
        const apiPollType = mapPollType(pollType);
        const weeks = [];
        for (let w = startWeek; w <= endWeek; w++) {
          // Fetch poll data for week w; using regular season.
          const pollForWeek = await teamsService.getPolls(2024, apiPollType, w);
          // Assume pollForWeek[0] is the poll group for that week.
          weeks.push(pollForWeek[0]);
        }

        // Transform weekly polls into a team-centric format:
        // Create a mapping from team name to an array of ranks (one per week)
        const teamsMap = {};
        weeks.forEach((pollGroup, i) => {
          // For each week, iterate over rankings.
          pollGroup.rankings.forEach((team) => {
            if (!teamsMap[team.school]) {
              // Initialize an array of length equal to the number of weeks, filled with null.
              teamsMap[team.school] = new Array(weeks.length).fill(null);
            }
            teamsMap[team.school][i] = team.rank;
          });
        });

        // Convert the mapping into an array.
        const transformedData = Object.keys(teamsMap).map((teamName) => ({
          team: teamName,
          ranks: teamsMap[teamName],
        }));

        setChartData(transformedData);
      } catch (error) {
        console.error("Error fetching poll data:", error);
        // Fallback sample data (for 5 weeks)
        setChartData([
          { team: "Georgia", ranks: [1, 1, 2, 1, 1] },
          { team: "Michigan", ranks: [2, 2, 1, 2, 2] },
        ]);
      }
    };

    fetchPollData();
  }, [pollType, weekRange]);

  useEffect(() => {
    // Clear previous chart
    d3.select(chartRef.current).selectAll("*").remove();

    if (!chartData || chartData.length === 0) return;

    const { startWeek, endWeek } = mapWeekRange(weekRange);
    const totalWeeks = endWeek - startWeek + 1;

    const margin = { top: 20, right: 40, bottom: 30, left: 40 },
      innerWidth = width - margin.left - margin.right,
      innerHeight = height - margin.top - margin.bottom;

    const svg = d3
      .select(chartRef.current)
      .attr("width", width)
      .attr("height", height)
      .style("background", "#f5f5f5");

    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left}, ${margin.top})`);

    // X scale: domain is from startWeek to endWeek
    const xScale = d3
      .scaleLinear()
      .domain([startWeek, endWeek])
      .range([0, innerWidth]);

    // Y scale: Assume ranking goes from 1 to 25 (1 is best)
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

    // Create a line generator; note that index i corresponds to week (startWeek + i)
    const line = d3
      .line()
      .x((d, i) => xScale(i + startWeek))
      .y((d) => yScale(d))
      .curve(d3.curveMonotoneX);

    // Draw a line for each team
    chartData.forEach((teamData, index) => {
      const path = g
        .append("path")
        .datum(teamData.ranks)
        .attr("fill", "none")
        .attr("stroke", index % 2 === 0 ? "steelblue" : "orange")
        .attr("stroke-width", 2)
        .attr("d", line);

      const totalLength = path.node().getTotalLength();
      path
        .attr("stroke-dasharray", totalLength + " " + totalLength)
        .attr("stroke-dashoffset", totalLength)
        .transition()
        .duration(1500)
        .ease(d3.easeLinear)
        .attr("stroke-dashoffset", 0);
    });
  }, [chartData, height, width, weekRange]);

  return <svg ref={chartRef}></svg>;
};

export default PollsBumpChart;