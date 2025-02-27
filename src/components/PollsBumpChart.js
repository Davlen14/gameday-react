import React, { useState, useEffect, useRef } from "react";
import * as d3 from "d3";
import teamsService from "../services/teamsService";

const PollsBumpChart = ({ width, height, pollType, weekRange }) => {
  const chartRef = useRef();
  const [chartData, setChartData] = useState([]);

  // Convert pollType string from dropdown to the one your API expects
  const mapPollType = (type) => {
    if (type === "AP Poll") return "ap";
    if (type === "Coaches Poll") return "coaches";
    if (type === "Playoff Rankings") return "cfp";
    return "ap"; // fallback
  };

  // Convert "Week 1 - 5" to an object with numeric ranges
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
    const fetchPollData = async () => {
      try {
        const { startWeek, endWeek } = mapWeekRange(weekRange);
        const apiPollType = mapPollType(pollType);

        // Adjust the API call as per your actual service contract.
        const response = await teamsService.getPollsRange(
          2024, 
          apiPollType, 
          startWeek, 
          endWeek
        );

        // Transform the API data into the bump chart format.
        const transformed = transformPollsToBumpData(response);
        setChartData(transformed);
      } catch (error) {
        console.error("Error fetching poll data:", error);
        setChartData([
          { team: "Georgia", ranks: [1, 1, 2, 1, 1] },
          { team: "Michigan", ranks: [2, 2, 1, 2, 2] },
        ]);
      }
    };

    fetchPollData();
  }, [pollType, weekRange]);

  // Example transform function, adapt to your actual data structure.
  const transformPollsToBumpData = (apiData) => {
    // For this demo, we'll assume the API returns data already in the correct format.
    return apiData;
  };

  useEffect(() => {
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

    // Set x-axis domain from startWeek to endWeek
    const xScale = d3
      .scaleLinear()
      .domain([startWeek, endWeek])
      .range([0, innerWidth]);

    // For y-axis, we assume a ranking range of 1 to 25 (or adjust as needed)
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

    // Create a line generator using i + startWeek for x values.
    const line = d3
      .line()
      .x((d, i) => xScale(i + startWeek))
      .y((d) => yScale(d))
      .curve(d3.curveMonotoneX);

    // Draw and animate a line for each team
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