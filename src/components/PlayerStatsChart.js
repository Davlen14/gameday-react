import React, { useState, useEffect, useRef } from "react";
import teamsService from "../services/teamsService";
import "../styles/PlayerStatsChart.css";

const PlayerStatsChart = ({ searchTerm, teamFilter, positionFilter }) => {
  // State for fetched player stats
  const [players, setPlayers] = useState([]);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Reference to the SVG element
  const svgRef = useRef();

  // Fetch offensive player season stats on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const rawPlayers = await teamsService.getPlayerSeasonStats(
          2024,       // year
          "offense",  // category (assuming your API merges passing/rushing/receiving)
          "regular",  // seasonType
          10000       // limit
        );

        // Build a fullName field if missing
        const playersWithFullName = rawPlayers.map((p) => {
          let fullName = p.fullName;
          if (!fullName) {
            if (p.name) {
              fullName = p.name;
            } else {
              fullName = `${p.firstName || ""} ${p.lastName || ""}`.trim();
            }
          }
          return { ...p, fullName };
        });

        setPlayers(playersWithFullName);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Apply filters based on props passed from VisualizeTrends
  const filteredPlayers = players.filter((player) => {
    const name = player.fullName ? player.fullName.toLowerCase() : "";
    const matchesSearch = name.includes(searchTerm.toLowerCase());
    const matchesTeam =
      teamFilter === "All Teams" ||
      (player.team && player.team.toLowerCase() === teamFilter.toLowerCase());
    const matchesPosition =
      positionFilter === "All Positions" ||
      (player.position && player.position.toLowerCase() === positionFilter.toLowerCase());

    return matchesSearch && matchesTeam && matchesPosition;
  });

  // Calculate total offense for each player: sum of passing, rushing, receiving yards
  const dataForChart = filteredPlayers.map((player) => ({
    name: player.fullName,
    totalOffense:
      (Number(player.passingYards) || 0) +
      (Number(player.rushingYards) || 0) +
      (Number(player.receivingYards) || 0),
  }));

  // D3 Chart rendering: update chart when dataForChart changes
  useEffect(() => {
    // Set up dimensions and margins
    const margin = { top: 30, right: 20, bottom: 100, left: 60 };
    const width = 600 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    // Remove any previous chart
    const svgElement = svgRef.current;
    svgElement.innerHTML = "";

    // Create the SVG container
    const svg = window.d3
      .select(svgElement)
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left}, ${margin.top})`);

    // Set up x scale: ordinal scale for player names
    const x = window.d3
      .scaleBand()
      .domain(dataForChart.map((d) => d.name))
      .range([0, width])
      .padding(0.2);

    // Set up y scale: linear scale for totalOffense
    const y = window.d3
      .scaleLinear()
      .domain([0, window.d3.max(dataForChart, (d) => d.totalOffense) || 0])
      .nice()
      .range([height, 0]);

    // X Axis
    svg
      .append("g")
      .attr("transform", `translate(0, ${height})`)
      .call(window.d3.axisBottom(x))
      .selectAll("text")
      .attr("transform", "rotate(-45)")
      .style("text-anchor", "end");

    // Y Axis
    svg.append("g").call(window.d3.axisLeft(y));

    // Bars
    svg
      .selectAll(".bar")
      .data(dataForChart)
      .enter()
      .append("rect")
      .attr("class", "bar")
      .attr("x", (d) => x(d.name))
      .attr("width", x.bandwidth())
      .attr("y", (d) => y(d.totalOffense))
      .attr("height", (d) => height - y(d.totalOffense))
      .attr("fill", "#0077cc");
  }, [dataForChart]);

  if (isLoading) return <div>Loading offensive stats...</div>;
  if (error) return <div style={{ color: "red" }}>Error: {error}</div>;

  return (
    <div className="player-stats-chart">
      <h2>Offensive Player Stats - 2024</h2>
      {/* Note: The filters are handled in the parent modal, so this component only renders the chart */}
      <svg ref={svgRef}></svg>
    </div>
  );
};

export default PlayerStatsChart;