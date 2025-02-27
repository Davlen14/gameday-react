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

  // Convert "Week 1 - 5" to actual numeric range or param your API can handle
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
    // Example: fetch poll data each time user changes pollType or weekRange
    const fetchPollData = async () => {
      try {
        const { startWeek, endWeek } = mapWeekRange(weekRange);
        const apiPollType = mapPollType(pollType);

        // This is a hypothetical service call: adjust to match your actual API
        const response = await teamsService.getPollsRange(
          2024, 
          apiPollType, 
          startWeek, 
          endWeek
        );

        // Transform response data to a format suitable for the bump chart
        // e.g., [{ team: 'Georgia', ranks: [1,2,1, ...] }, { team: 'Michigan', ... }, ...]
        const transformed = transformPollsToBumpData(response);
        setChartData(transformed);
      } catch (error) {
        console.error("Error fetching poll data:", error);
        setChartData([
          // fallback sample data
          { team: "Georgia", ranks: [1, 1, 2, 1, 1] },
          { team: "Michigan", ranks: [2, 2, 1, 2, 2] },
        ]);
      }
    };

    fetchPollData();
  }, [pollType, weekRange]);

  // Example transform function, adapt to your actual data structure
  const transformPollsToBumpData = (apiData) => {
    // Suppose apiData is an array of objects, each with { week, rankings: [...] }
    // You'd group by team and build the "ranks" array in order
    // For brevity, here's a mock example:
    return apiData;
  };

  useEffect(() => {
    // Clear any previous chart:
    d3.select(chartRef.current).selectAll("*").remove();

    if (!chartData || chartData.length === 0) return;

    // Set up margins:
    const margin = { top: 20, right: 40, bottom: 30, left: 40 },
      innerWidth = width - margin.left - margin.right,
      innerHeight = height - margin.top - margin.bottom;

    // Create the SVG container:
    const svg = d3
      .select(chartRef.current)
      .attr("width", width)
      .attr("height", height)
      .style("background", "#f5f5f5");

    // Append group element:
    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left}, ${margin.top})`);

    // Suppose each "ranks" array has (endWeek - startWeek + 1) items
    // X scale domain is # of weeks
    const totalWeeks = chartData[0].ranks.length;
    const xScale = d3.scaleLinear().domain([1, totalWeeks]).range([0, innerWidth]);

    // Y scale: rank 1 at top, rank ~25 at bottom
    const yScale = d3.scaleLinear().domain([25, 1]).range([innerHeight, 0]);

    // Axes
    const xAxis = d3.axisBottom(xScale).ticks(totalWeeks).tickFormat(d3.format("d"));
    const yAxis = d3.axisLeft(yScale).ticks(25);

    g.append("g")
      .attr("transform", `translate(0, ${innerHeight})`)
      .call(xAxis);

    g.append("g").call(yAxis);

    // D3 line generator
    const line = d3
      .line()
      .x((d, i) => xScale(i + 1))
      .y((d) => yScale(d))
      .curve(d3.curveMonotoneX);

    // Draw lines
    chartData.forEach((teamData, index) => {
      const path = g
        .append("path")
        .datum(teamData.ranks)
        .attr("fill", "none")
        .attr("stroke", index % 2 === 0 ? "steelblue" : "orange")
        .attr("stroke-width", 2)
        .attr("d", line);

      // Animate the line drawing
      const totalLength = path.node().getTotalLength();
      path
        .attr("stroke-dasharray", totalLength + " " + totalLength)
        .attr("stroke-dashoffset", totalLength)
        .transition()
        .duration(1500)
        .ease(d3.easeLinear)
        .attr("stroke-dashoffset", 0);
    });
  }, [chartData, height, width]);

  return <svg ref={chartRef}></svg>;
};

export default PollsBumpChart;