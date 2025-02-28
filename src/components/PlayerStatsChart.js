import React, { useState, useEffect, useRef } from "react";
import * as d3 from "d3";
import teamsService from "../services/teamsService";

const PlayerStatsChart = ({ width, height, player, statType, weekRange }) => {
  const chartRef = useRef();
  const [chartData, setChartData] = useState([]);

  // Fetch player stats data based on the selected filters.
  useEffect(() => {
    const fetchPlayerStats = async () => {
      try {
        const data = await teamsService.getPlayerStats(2024, player, statType, weekRange);
        setChartData(data);
      } catch (error) {
        console.error("Error fetching player stats:", error);
        setChartData([]);
      }
    };
    fetchPlayerStats();
  }, [player, statType, weekRange]);

  useEffect(() => {
    // Clear previous chart
    d3.select(chartRef.current).selectAll("*").remove();
    if (!chartData || chartData.length === 0) return;

    // Define margins, width, height of inner chart
    const margin = { top: 40, right: 50, bottom: 40, left: 50 },
      innerWidth = width - margin.left - margin.right,
      innerHeight = height - margin.top - margin.bottom;

    // Create the SVG container
    const svg = d3
      .select(chartRef.current)
      .attr("width", "100%")
      .attr("height", "100%")
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("preserveAspectRatio", "none");

    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    // Assuming chartData is an array of objects where each has { week, statValue }
    const xScale = d3
      .scaleLinear()
      .domain(d3.extent(chartData, d => d.week))
      .range([0, innerWidth]);
    const yScale = d3
      .scaleLinear()
      .domain([0, d3.max(chartData, d => d.statValue)])
      .range([innerHeight, 0]);

    const xAxis = d3.axisBottom(xScale).ticks(weekRange === "Week 1 - Postseason" ? 17 : undefined);
    const yAxis = d3.axisLeft(yScale);

    g.append("g")
      .attr("transform", `translate(0, ${innerHeight})`)
      .call(xAxis);
    g.append("g").call(yAxis);

    // Line generator for player stats
    const line = d3
      .line()
      .x(d => xScale(d.week))
      .y(d => yScale(d.statValue))
      .curve(d3.curveMonotoneX);

    g.append("path")
      .datum(chartData)
      .attr("fill", "none")
      .attr("stroke", "#D4001C")
      .attr("stroke-width", 2)
      .attr("d", line);
  }, [chartData, height, width, weekRange]);

  return <svg ref={chartRef}></svg>;
};

export default PlayerStatsChart;