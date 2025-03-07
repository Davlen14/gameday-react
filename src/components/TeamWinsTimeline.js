import React, { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';
import teamsService from '../services/teamsService';

const TeamWinsTimeline = ({ width, height, yearRange, conference, topTeamCount }) => {
  const svgRef = useRef();
  const [currentYear, setCurrentYear] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [animationSpeed, setAnimationSpeed] = useState(1000); // milliseconds per year
  const animationRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [teamData, setTeamData] = useState([]);
  const [teams, setTeams] = useState([]);
  const [yearlyRankings, setYearlyRankings] = useState({});
  const [interpolatedYear, setInterpolatedYear] = useState(null);

  // Parse year range
  const startYear = parseInt(yearRange.split('-')[0]);
  const endYear = parseInt(yearRange.split('-')[1]);

  // Helper function to get team logo
  const getTeamLogo = (teamName) => {
    if (!teamName) return "/photos/default-team.png";
    const team = teams.find(
      (t) =>
        t.school?.toLowerCase().replace(/[^a-z]/g, "") ===
        teamName.toLowerCase().replace(/[^a-z]/g, "")
    );
    return team?.logos?.[0] || "/photos/default-team.png";
  };

  // Fetch data on mount or whenever props change
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // 1. Get all teams
        const teamsResponse = await teamsService.getTeams();
        setTeams(teamsResponse);

        // 2. Process them for color, logo, etc.
        const processedTeams = teamsResponse.map((team) => ({
          id: team.id,
          team: team.school,
          logo: getTeamLogo(team.school),
          abbreviation:
            team.abbreviation || team.school.substring(0, 4).toUpperCase(),
          color: team.color || "#333333",
          alt_color: team.alt_color || "#999999",
          conference: team.conference,
          wins: {},
          yearlyWins: {},
        }));

        // 3. For each year in the range, fetch records and store wins
        const annualWinsData = {};
        for (let year = startYear; year <= endYear; year++) {
          const recordsResponse = await teamsService.getTeamRecords(null, year);
          const teamWins = {};
          recordsResponse.forEach((record) => {
            const wins = record.total?.wins || 0;
            teamWins[record.team] = wins;
          });
          annualWinsData[year] = teamWins;
        }

        // 4. Calculate cumulative wins for each team across all years
        processedTeams.forEach((t) => {
          let cumulativeWins = 0;
          for (let year = startYear; year <= endYear; year++) {
            const winsThisYear = annualWinsData[year][t.team] || 0;
            t.yearlyWins[year] = winsThisYear;
            cumulativeWins += winsThisYear;
            t.wins[year] = cumulativeWins;
          }
        });

        // 5. Build a "yearlyRankings" object for quick access
        const rankings = {};
        for (let year = startYear; year <= endYear; year++) {
          const teamsWithWins = processedTeams
            .filter((t) => {
              // Filter by conference if specified
              if (
                conference !== "All Conferences" &&
                t.conference !== conference
              ) {
                return false;
              }
              // Filter for FBS or unknown (treat unknown as FBS)
              const teamInfo = teamsResponse.find((x) => x.school === t.team);
              const isFBS =
                teamInfo?.division === "FBS" || !teamInfo?.division;

              return isFBS && t.wins[year] > 0;
            })
            .map((t) => ({
              ...t,
              currentWins: t.wins[year],
              winsThisYear: t.yearlyWins[year],
            }))
            .sort((a, b) => b.currentWins - a.currentWins)
            .slice(0, parseInt(topTeamCount));

          rankings[year] = teamsWithWins;
        }

        setYearlyRankings(rankings);
        setTeamData(processedTeams);
        setIsLoading(false);

        // Set initial year if not set
        if (!currentYear) {
          setCurrentYear(startYear);
          setInterpolatedYear(startYear);
        }
      } catch (err) {
        console.error("Error fetching team data:", err);
        setError("Failed to load team data. Please try again later.");
        setIsLoading(false);
      }
    };

    fetchData();
  }, [yearRange, startYear, endYear, conference, topTeamCount, currentYear]);

  // Interpolate data between two integer years for a smooth animation
  const getInterpolatedData = (year) => {
    if (
      !yearlyRankings[Math.floor(year)] ||
      !yearlyRankings[Math.ceil(year)]
    ) {
      return yearlyRankings[Math.floor(year)] || [];
    }

    // If "year" is an integer, just return that year's data
    if (year === Math.floor(year)) {
      return yearlyRankings[year];
    }

    const lowerYear = Math.floor(year);
    const upperYear = Math.ceil(year);
    const fraction = year - lowerYear;

    const lowerData = yearlyRankings[lowerYear];
    const upperData = yearlyRankings[upperYear];

    // Gather all teams in both sets
    const allTeams = new Set([
      ...lowerData.map((d) => d.team),
      ...upperData.map((d) => d.team),
    ]);

    // For each team, interpolate the currentWins between the two years
    const interpolatedData = Array.from(allTeams)
      .map((teamName) => {
        const lowerTeam = lowerData.find((d) => d.team === teamName);
        const upperTeam = upperData.find((d) => d.team === teamName);

        if (!lowerTeam) return upperTeam;
        if (!upperTeam) return lowerTeam;

        const winsInterpolated =
          lowerTeam.currentWins +
          (upperTeam.currentWins - lowerTeam.currentWins) * fraction;

        return {
          ...lowerTeam,
          currentWins: winsInterpolated,
        };
      })
      .sort((a, b) => b.currentWins - a.currentWins)
      .slice(0, parseInt(topTeamCount));

    return interpolatedData;
  };

  // Draw the chart (or update it) for a given fractional year
  const drawChart = (year) => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);

    // Smaller margins so the chart is wider
    const margin = { top: 20, right: 20, bottom: 40, left: 60 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // If no chart-container yet, create initial elements
    if (svg.select(".chart-container").empty()) {
      svg.selectAll("*").remove();

      // Chart container
      svg
        .append("g")
        .attr("class", "chart-container")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);

      // "defs" if needed
      svg.append("defs");

      // Large year label (upper-right)
      svg
        .append("text")
        .attr("class", "year-label")
        .attr("x", width - 80)
        .attr("y", height / 2)
        .attr("text-anchor", "middle")
        .attr("font-size", "80px")
        .attr("font-weight", "800")
        .attr("opacity", 0.15)
        .text(Math.floor(year));

      // Chart title (top-center)
      svg
        .append("text")
        .attr("class", "chart-title")
        .attr("x", width / 2)
        .attr("y", 20)
        .attr("text-anchor", "middle")
        .attr("font-size", "20px")
        .attr("font-weight", "bold")
        .text(`Cumulative Football Wins (${startYear}-${Math.floor(year)})`);

      // "Presented by GAMEDAY+"
      const textGroup = svg
        .append("g")
        .attr("class", "presented-by")
        .attr("transform", `translate(${width - 20}, ${height - 20})`);

      textGroup
        .append("text")
        .text("Presented by")
        .attr("x", 0)
        .attr("y", 0)
        .style("font-size", "12px")
        .style("fill", "#000")
        .style("font-weight", "normal")
        .style("text-anchor", "end")
        .style("font-family", "'Inter', system-ui, sans-serif");

      textGroup
        .append("text")
        .text("GAMEDAY+")
        .attr("x", 0)
        .attr("y", 16)
        .style("font-size", "14px")
        .style("fill", "#D4001C")
        .style("font-style", "italic")
        .style("font-weight", "700")
        .style("font-family", "'Orbitron', 'Titillium Web', sans-serif")
        .style("text-anchor", "end");
    }

    // Get the current data
    const interpolatedData = getInterpolatedData(year);
    if (interpolatedData.length === 0) return;

    // Calculate bar height so it fills the vertical space
    const teamCount = interpolatedData.length;
    const bandHeight = innerHeight / teamCount;

    // Scales
    const xScale = d3
      .scaleLinear()
      .domain([
        0,
        d3.max(interpolatedData, (d) => d.currentWins) * 1.05, // slight padding
      ])
      .range([0, innerWidth]);

    const yScale = d3
      .scaleBand()
      .domain(interpolatedData.map((d) => d.team))
      .range([0, bandHeight * teamCount])
      .padding(0.25);

    const g = svg.select(".chart-container");

    // If no x-axis yet, create it. Otherwise, update it.
    if (g.select(".x-axis").empty()) {
      g.append("g")
        .attr("class", "x-axis")
        .attr("transform", `translate(0, ${yScale.range()[1]})`)
        .call(d3.axisBottom(xScale).ticks(5))
        .selectAll("text")
        .attr("font-size", "12px");

      // X-axis label
      g.append("text")
        .attr("class", "x-axis-label")
        .attr("x", innerWidth / 2)
        .attr("y", yScale.range()[1] + 30) // a bit below the axis
        .attr("text-anchor", "middle")
        .attr("font-size", "12px")
        .attr("fill", "#666")
        .text("Total Wins");

      // Y-axis group
      g.append("g").attr("class", "y-axis");
    } else {
      // Update the x-axis
      g.select(".x-axis")
        .transition()
        .duration(200)
        .attr("transform", `translate(0, ${yScale.range()[1]})`)
        .call(d3.axisBottom(xScale).ticks(5));

      // Update x-axis label position
      g.select(".x-axis-label")
        .transition()
        .duration(200)
        .attr("y", yScale.range()[1] + 30);
    }

    // Update y-axis
    g.select(".y-axis")
      .transition()
      .duration(300)
      .call(d3.axisLeft(yScale))
      .selectAll("text")
      .attr("font-size", "14px")
      .attr("font-weight", "bold");

    // Data join for bar groups
    const barGroups = g.selectAll(".bar-group").data(interpolatedData, (d) => d.team);

    // Remove old
    barGroups
      .exit()
      .transition()
      .duration(300)
      .style("opacity", 0)
      .attr("transform", "translate(0, 30)")
      .remove();

    // Enter new
    const enterGroups = barGroups
      .enter()
      .append("g")
      .attr("class", "bar-group")
      .style("opacity", 0)
      .attr("transform", "translate(0, -10)");

    // The bar
    enterGroups
      .append("rect")
      .attr("class", "bar")
      .attr("y", (d) => yScale(d.team))
      .attr("height", yScale.bandwidth())
      .attr("x", 0)
      .attr("width", 0)
      .attr("fill", (d) => d.color)
      .attr("rx", 6)
      .attr("ry", 6);

    // Logo on the right side of the bar
    enterGroups
      .append("svg:image")
      .attr("class", "team-logo")
      .attr("x", (d) => xScale(d.currentWins) + 5)
      .attr("y", (d) =>
        yScale(d.team) + (yScale.bandwidth() - Math.min(yScale.bandwidth() * 1.3, 40)) / 2
      )
      .attr("width", (d) => Math.min(yScale.bandwidth() * 1.3, 40))
      .attr("height", (d) => Math.min(yScale.bandwidth() * 1.3, 40))
      .attr("href", (d) => d.logo);

    // Win value text
    enterGroups
      .append("text")
      .attr("class", "win-value")
      .attr("x", (d) =>
        Math.min(xScale(d.currentWins) / 2, xScale(d.currentWins) - 40)
      )
      .attr("y", (d) => yScale(d.team) + yScale.bandwidth() / 2)
      .attr("dy", ".35em")
      .attr("text-anchor", "middle")
      .attr("fill", "#fff")
      .attr("font-size", "14px")
      .attr("font-weight", "bold")
      .text((d) => Math.round(d.currentWins));

    // Animate entrance
    enterGroups
      .transition()
      .duration(300)
      .style("opacity", 1)
      .attr("transform", "translate(0, 0)");

    // Merge new + existing
    const allGroups = enterGroups.merge(barGroups);

    // Update bar
    allGroups
      .select(".bar")
      .transition()
      .duration(200)
      .attr("y", (d) => yScale(d.team))
      .attr("height", yScale.bandwidth())
      .attr("width", (d) => xScale(d.currentWins));

    // Update logo
    allGroups
      .select(".team-logo")
      .transition()
      .duration(200)
      .attr("x", (d) => xScale(d.currentWins) + 5)
      .attr("y", (d) =>
        yScale(d.team) + (yScale.bandwidth() - Math.min(yScale.bandwidth() * 1.3, 40)) / 2
      );

    // Update win-value text
    allGroups
      .select(".win-value")
      .transition()
      .duration(200)
      .attr(
        "x",
        (d) =>
          Math.min(xScale(d.currentWins) / 2, xScale(d.currentWins) - 40)
      )
      .attr("y", (d) => yScale(d.team) + yScale.bandwidth() / 2)
      .textTween(function (d) {
        const node = this;
        const currentValue = parseFloat(node.textContent) || 0;
        const targetValue = Math.round(d.currentWins);
        const i = d3.interpolateNumber(currentValue, targetValue);
        return function (t) {
          return Math.round(i(t));
        };
      });

    // Update year label (no decimals)
    svg
      .select(".year-label")
      .transition()
      .duration(200)
      .text(Math.floor(year))
      .attr("opacity", 0.15);

    // Update title (no decimals)
    svg
      .select(".chart-title")
      .transition()
      .duration(300)
      .text(`Cumulative Football Wins (${startYear}-${Math.floor(year)})`);
  };

  // Redraw whenever data or size changes
  useEffect(() => {
    if (!currentYear) {
      setCurrentYear(startYear);
      setInterpolatedYear(startYear);
    }
    if (!isLoading && interpolatedYear !== null) {
      drawChart(interpolatedYear);
    }
  }, [teamData, interpolatedYear, width, height, isLoading, drawChart]);

  // Smooth interpolation for the "Play" animation
  useEffect(() => {
    if (isPlaying) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }

      let lastTimestamp = null;
      const yearDuration = animationSpeed; // ms per year
      const fps = 60;
      const msPerFrame = 1000 / fps;
      const yearPerFrame = 1 / (yearDuration / msPerFrame);

      const animate = (timestamp) => {
        if (!lastTimestamp) {
          lastTimestamp = timestamp;
          animationRef.current = requestAnimationFrame(animate);
          return;
        }

        const elapsed = timestamp - lastTimestamp;
        if (elapsed > msPerFrame) {
          lastTimestamp = timestamp;

          const newYear = Math.min(
            endYear,
            interpolatedYear + yearPerFrame * (elapsed / msPerFrame)
          );

          setInterpolatedYear(newYear);
          if (Math.floor(newYear) !== Math.floor(interpolatedYear)) {
            setCurrentYear(Math.floor(newYear));
          }

          if (newYear >= endYear) {
            setIsPlaying(false);
            return;
          }
        }
        animationRef.current = requestAnimationFrame(animate);
      };

      animationRef.current = requestAnimationFrame(animate);

      return () => {
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
      };
    }
  }, [isPlaying, interpolatedYear, endYear, animationSpeed]);

  // Play/Pause
  const togglePlayPause = () => {
    if (isPlaying) {
      setIsPlaying(false);
    } else {
      if (interpolatedYear >= endYear) {
        setInterpolatedYear(startYear);
        setCurrentYear(startYear);
      }
      setIsPlaying(true);
    }
  };

  // Slider
  const handleSliderChange = (e) => {
    const yearVal = parseFloat(e.target.value);
    setCurrentYear(Math.floor(yearVal));
    setInterpolatedYear(yearVal);
  };

  if (isLoading) {
    return <div className="loading-indicator">Loading team data...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="team-wins-chart-container">
      <div className="chart-controls">
        <button
          onClick={togglePlayPause}
          disabled={isLoading}
          className="timeline-control-button"
        >
          {isPlaying ? "Pause" : "Play"}
        </button>
        <input
          type="range"
          min={startYear}
          max={endYear}
          step="0.1"
          value={interpolatedYear || startYear}
          onChange={handleSliderChange}
          disabled={isPlaying || isLoading}
          className="timeline-slider"
        />
        <span className="year-display">
          {interpolatedYear ? Math.floor(interpolatedYear) : startYear}
        </span>
        <select
          value={animationSpeed}
          onChange={(e) => setAnimationSpeed(parseInt(e.target.value))}
          disabled={isPlaying || isLoading}
          className="timeline-speed-select"
        >
          <option value="5000">Very Slow</option>
          <option value="2000">Slow</option>
          <option value="1000">Medium</option>
          <option value="500">Fast</option>
          <option value="250">Very Fast</option>
        </select>
      </div>
      <svg
        ref={svgRef}
        width={width}
        height={height}
        style={{ background: "transparent", maxWidth: "100%" }}
      ></svg>
    </div>
  );
};

export default TeamWinsTimeline;