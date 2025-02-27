import React, { useState, useEffect, useRef } from "react";
import * as d3 from "d3";
import teamsService from "../services/teamsService";

const PollsBumpChart = ({ width, height, data, pollType = "coaches" }) => {
  const chartRef = useRef();
  const [pollData, setPollData] = useState(null);

  // Fetch the Coaches Poll data if no data is provided via props
  useEffect(() => {
    if (!data) {
      // Assuming teamsService.getPolls returns season-long polls for a given poll type.
      // The "season" parameter (or similar) should fetch weeks 1-15.
      teamsService
        .getPolls(2024, pollType, "season")
        .then((fetchedData) => {
          setPollData(fetchedData);
        })
        .catch((error) => {
          console.error("Error fetching coaches poll data:", error);
          // Fallback sample data if fetching fails:
          setPollData([
            { team: "Georgia", ranks: [1, 1, 2, 1, 1, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1] },
            { team: "Michigan", ranks: [2, 2, 1, 2, 2, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2] },
          ]);
        });
    }
  }, [data, pollType]);

  useEffect(() => {
    // Use either the passed data, fetched pollData, or fallback sample data
    const chartData =
      data ||
      pollData || [
        { team: "Georgia", ranks: [1, 1, 2, 1, 1, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1] },
        { team: "Michigan", ranks: [2, 2, 1, 2, 2, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2] },
      ];

    // Clear any previous chart:
    d3.select(chartRef.current).selectAll("*").remove();

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

    // Define xScale (weeks 1-15):
    const xScale = d3.scaleLinear().domain([1, 15]).range([0, innerWidth]);

    // Define yScale (ranks 1 to 15, reversed):
    const yScale = d3.scaleLinear().domain([15, 1]).range([innerHeight, 0]);

    // Create axes:
    const xAxis = d3.axisBottom(xScale).ticks(15).tickFormat(d3.format("d"));
    const yAxis = d3.axisLeft(yScale).ticks(15);

    g.append("g")
      .attr("transform", `translate(0, ${innerHeight})`)
      .call(xAxis);
    g.append("g").call(yAxis);

    // Create line generator with a smooth curve:
    const line = d3
      .line()
      .x((d, i) => xScale(i + 1))
      .y((d) => yScale(d))
      .curve(d3.curveMonotoneX);

    // Draw a line for each team and animate its drawing:
    chartData.forEach((teamData, index) => {
      const path = g
        .append("path")
        .datum(teamData.ranks)
        .attr("fill", "none")
        .attr("stroke", () => {
          // For demonstration, alternate colors. Replace with team-specific colors.
          return index % 2 === 0 ? "steelblue" : "orange";
        })
        .attr("stroke-width", 2)
        .attr("d", line);

      // Animate the line drawing:
      const totalLength = path.node().getTotalLength();
      path
        .attr("stroke-dasharray", totalLength + " " + totalLength)
        .attr("stroke-dashoffset", totalLength)
        .transition()
        .duration(2000)
        .ease(d3.easeLinear)
        .attr("stroke-dashoffset", 0);
    });
  }, [data, pollData, height, width]);

  return <svg ref={chartRef}></svg>;
};

export default PollsBumpChart;