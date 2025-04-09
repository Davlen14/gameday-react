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
  const containerRef = useRef(null);

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

    // Dynamic margins based on the container size
    const margin = { 
      top: Math.max(20, height * 0.05), 
      right: Math.max(30, width * 0.05), 
      bottom: Math.max(40, height * 0.08), 
      left: Math.max(60, width * 0.1) 
    };
    
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // If no chart-container yet, create initial elements
    if (svg.select(".vtchart-container").empty()) {
      svg.selectAll("*").remove();

      // Add a subtle gradient background
      svg.append("rect")
        .attr("width", width)
        .attr("height", height)
        .attr("fill", "url(#vtchart-gradient)")
        .attr("rx", 12)
        .attr("ry", 12)
        .attr("opacity", 0.04);

      // Create gradients
      const defs = svg.append("defs");
      
      // Background gradient
      const gradient = defs.append("linearGradient")
        .attr("id", "vtchart-gradient")
        .attr("x1", "0%")
        .attr("y1", "0%")
        .attr("x2", "100%")
        .attr("y2", "100%");
        
      gradient.append("stop")
        .attr("offset", "0%")
        .attr("stop-color", "#f8f9fd");
        
      gradient.append("stop")
        .attr("offset", "100%")
        .attr("stop-color", "#e5e7ec");

      // Chart container
      svg
        .append("g")
        .attr("class", "vtchart-container")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);

      // Large year label (upper-right)
      svg
        .append("text")
        .attr("class", "vtyear-label")
        .attr("x", width - 80)
        .attr("y", height / 2)
        .attr("text-anchor", "middle")
        .attr("font-size", "80px")
        .attr("font-weight", "800")
        .attr("opacity", 0.12)
        .style("font-family", "'Orbitron', 'Titillium Web', sans-serif")
        .text(Math.floor(year));

      // Chart title (top-center)
      svg
        .append("text")
        .attr("class", "vtchart-title")
        .attr("x", width / 2)
        .attr("y", margin.top / 2)
        .attr("text-anchor", "middle")
        .attr("font-size", "18px")
        .attr("font-weight", "bold")
        .style("font-family", "'Titillium Web', system-ui, sans-serif")
        .text(`Cumulative Football Wins (${startYear}-${Math.floor(year)})`);

      // "Presented by GAMEDAY+"
      const textGroup = svg
        .append("g")
        .attr("class", "vtpresented-by")
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
        .style("font-family", "'Titillium Web', system-ui, sans-serif");

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

    // Dynamically calculate optimal bar height based on data size and container height
    const teamCount = interpolatedData.length;
    
    // Set a minimum and maximum bar height for aesthetics
    let optimalBandHeight = innerHeight / teamCount;
    const minBarHeight = 28; // Minimum height for readability
    const maxBarHeight = 60; // Maximum height to prevent oversized bars
    
    // Clamp the bar height
    const bandHeight = Math.max(minBarHeight, Math.min(maxBarHeight, optimalBandHeight));
    
    // If content exceeds container, adjust the height to maintain proportions
    const contentHeight = bandHeight * teamCount;
    const useHeight = Math.max(innerHeight, contentHeight);

    // Scales
    const xScale = d3
      .scaleLinear()
      .domain([
        0,
        d3.max(interpolatedData, (d) => d.currentWins) * 1.1, // more padding
      ])
      .range([0, innerWidth]);

    const yScale = d3
      .scaleBand()
      .domain(interpolatedData.map((d) => d.team))
      .range([0, Math.min(useHeight, bandHeight * teamCount)])
      .padding(0.3); // Increased padding for more space between bars

    const g = svg.select(".vtchart-container");

    // Update/create x-axis
    if (g.select(".x-axis").empty()) {
      g.append("g")
        .attr("class", "x-axis")
        .attr("transform", `translate(0, ${yScale.range()[1]})`)
        .call(d3.axisBottom(xScale).ticks(5)
          .tickFormat(d => d3.format(",")(d))) // Add thousands separators
        .selectAll("text")
        .attr("font-size", "12px")
        .attr("font-family", "'Titillium Web', system-ui, sans-serif");

      // X-axis label
      g.append("text")
        .attr("class", "x-axis-label")
        .attr("x", innerWidth / 2)
        .attr("y", yScale.range()[1] + 35) // a bit more below the axis
        .attr("text-anchor", "middle")
        .attr("font-size", "13px")
        .attr("fill", "#666")
        .attr("font-family", "'Titillium Web', system-ui, sans-serif")
        .text("Total Wins");

      // Y-axis group
      g.append("g")
        .attr("class", "y-axis")
        .attr("font-family", "'Titillium Web', system-ui, sans-serif");
    } else {
      // Update the x-axis
      g.select(".x-axis")
        .transition()
        .duration(300)
        .ease(d3.easePolyOut)
        .attr("transform", `translate(0, ${yScale.range()[1]})`)
        .call(d3.axisBottom(xScale).ticks(5)
          .tickFormat(d => d3.format(",")(d))); // Add thousands separators

      // Update x-axis label position
      g.select(".x-axis-label")
        .transition()
        .duration(300)
        .ease(d3.easePolyOut)
        .attr("y", yScale.range()[1] + 35);
    }

    // Update y-axis with softer animation
    g.select(".y-axis")
      .transition()
      .duration(400)
      .ease(d3.easePolyOut)
      .call(d3.axisLeft(yScale))
      .selectAll("text")
      .attr("font-size", "13px")
      .attr("font-weight", "600")
      .attr("font-family", "'Titillium Web', system-ui, sans-serif");

    // Add subtle grid lines for better readability
    g.selectAll(".vt-grid-line").remove();
    xScale.ticks(5).forEach(tick => {
      g.append("line")
        .attr("class", "vt-grid-line")
        .attr("x1", xScale(tick))
        .attr("x2", xScale(tick))
        .attr("y1", 0)
        .attr("y2", yScale.range()[1])
        .attr("stroke", "#e0e0e0")
        .attr("stroke-dasharray", "2,2")
        .attr("opacity", 0.5);
    });

    // Data join for bar groups with key function for better transitions
    const barGroups = g.selectAll(".vt-bar-group").data(
      interpolatedData, 
      d => d.team // Use team name as key for stable animations
    );

    // Remove old with smooth exit animation
    barGroups
      .exit()
      .transition()
      .duration(400)
      .ease(d3.easePolyOut)
      .style("opacity", 0)
      .attr("transform", "translate(-30, 0)")
      .remove();

    // Enter new bar groups with improved entrance animation
    const enterGroups = barGroups
      .enter()
      .append("g")
      .attr("class", "vt-bar-group")
      .style("opacity", 0)
      .attr("transform", "translate(20, 0)");

    // The bar with improved aesthetics
    enterGroups
      .append("rect")
      .attr("class", "vt-bar")
      .attr("y", (d) => yScale(d.team))
      .attr("height", yScale.bandwidth())
      .attr("x", 0)
      .attr("width", 0)
      .attr("rx", 6)
      .attr("ry", 6)
      .style("filter", "drop-shadow(0px 3px 3px rgba(0,0,0,0.1))")
      .style("fill", (d) => {
        // Create gradient for each bar based on team color
        const id = `vt-bar-gradient-${d.team.replace(/\s+/g, '-').toLowerCase()}`;
        
        // Check if gradient already exists
        if (svg.select(`#${id}`).empty()) {
          const barGradient = svg.select("defs")
            .append("linearGradient")
            .attr("id", id)
            .attr("x1", "0%")
            .attr("y1", "0%")
            .attr("x2", "100%")
            .attr("y2", "0%");
            
          // Lighten the team color slightly for gradient end
          const color = d3.color(d.color);
          const lighterColor = d3.color(d.color);
          if (lighterColor) {
            lighterColor.opacity = 0.85;
          }
            
          barGradient.append("stop")
            .attr("offset", "0%")
            .attr("stop-color", color);
            
          barGradient.append("stop")
            .attr("offset", "100%")
            .attr("stop-color", lighterColor);
        }
        
        return `url(#${id})`;
      });

    // Add subtle highlight to the top of each bar for 3D effect
    enterGroups
      .append("rect")
      .attr("class", "vt-bar-highlight")
      .attr("y", (d) => yScale(d.team))
      .attr("height", 4)
      .attr("x", 0)
      .attr("width", 0)
      .attr("rx", 6)
      .attr("ry", 6)
      .attr("fill", "rgba(255,255,255,0.3)");

    // Logo on the right side of the bar with improved positioning
    enterGroups
      .append("svg:image")
      .attr("class", "vt-team-logo")
      .attr("x", (d) => xScale(d.currentWins) + 10)
      .attr("y", (d) => yScale(d.team) + (yScale.bandwidth() - Math.min(yScale.bandwidth() * 1.1, 36)) / 2)
      .attr("width", (d) => Math.min(yScale.bandwidth() * 1.1, 36))
      .attr("height", (d) => Math.min(yScale.bandwidth() * 1.1, 36))
      .attr("href", (d) => d.logo)
      .style("filter", "drop-shadow(0px 2px 2px rgba(0,0,0,0.15))");

    // Win value text - more legible
    enterGroups
      .append("text")
      .attr("class", "vt-win-value")
      .attr("x", (d) => Math.min(xScale(d.currentWins) - 40, xScale(d.currentWins) / 2))
      .attr("y", (d) => yScale(d.team) + yScale.bandwidth() / 2)
      .attr("dy", ".35em")
      .attr("text-anchor", "middle")
      .attr("fill", "white")
      .attr("font-size", () => yScale.bandwidth() < 40 ? "13px" : "15px")
      .attr("font-weight", "bold")
      .attr("font-family", "'Titillium Web', system-ui, sans-serif")
      .style("text-shadow", "0px 1px 2px rgba(0,0,0,0.2)")
      .text((d) => d3.format(",")(Math.round(d.currentWins)));

    // Animate entrance with improved easing
    enterGroups
      .transition()
      .duration(500)
      .ease(d3.easePolyOut)
      .style("opacity", 1)
      .attr("transform", "translate(0, 0)");

    // Merge new + existing for updates
    const allGroups = enterGroups.merge(barGroups);

    // Update bar with smoother animation
    allGroups
      .select(".vt-bar")
      .transition()
      .duration(500)
      .ease(d3.easePolyOut)
      .attr("y", (d) => yScale(d.team))
      .attr("height", yScale.bandwidth())
      .attr("width", (d) => xScale(d.currentWins));

    // Update bar highlight to match bar width
    allGroups
      .select(".vt-bar-highlight")
      .transition()
      .duration(500)
      .ease(d3.easePolyOut)
      .attr("y", (d) => yScale(d.team))
      .attr("width", (d) => xScale(d.currentWins));

    // Update logo with smoother movement
    allGroups
      .select(".vt-team-logo")
      .transition()
      .duration(500)
      .ease(d3.easePolyOut)
      .attr("x", (d) => xScale(d.currentWins) + 10)
      .attr("y", (d) => yScale(d.team) + (yScale.bandwidth() - Math.min(yScale.bandwidth() * 1.1, 36)) / 2);

    // Update win-value text with number animation
    allGroups
      .select(".vt-win-value")
      .transition()
      .duration(500)
      .ease(d3.easePolyOut)
      .attr("x", (d) => Math.min(xScale(d.currentWins) - 40, xScale(d.currentWins) / 2))
      .attr("y", (d) => yScale(d.team) + yScale.bandwidth() / 2)
      .attr("font-size", () => yScale.bandwidth() < 40 ? "13px" : "15px")
      .textTween(function (d) {
        const node = this;
        const currentValue = parseFloat(node.textContent.replace(/,/g, '')) || 0;
        const targetValue = Math.round(d.currentWins);
        const i = d3.interpolateNumber(currentValue, targetValue);
        return function (t) {
          return d3.format(",")(Math.round(i(t)));
        };
      });

    // Update year label with smoother animation
    svg
      .select(".vtyear-label")
      .transition()
      .duration(400)
      .ease(d3.easePolyOut)
      .text(Math.floor(year))
      .attr("opacity", 0.12);

    // Update title with smoother animation
    svg
      .select(".vtchart-title")
      .transition()
      .duration(400)
      .ease(d3.easePolyOut)
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
  }, [teamData, interpolatedYear, width, height, isLoading]);

  // Smooth interpolation for the "Play" animation with improved timing
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

          // Use easeInOutCubic for smoother year transitions
          const easingFactor = 0.3 * Math.sin((interpolatedYear - startYear) / (endYear - startYear) * Math.PI);
          const adjustedYearPerFrame = yearPerFrame * (1 + easingFactor);
          
          const newYear = Math.min(
            endYear,
            interpolatedYear + adjustedYearPerFrame * (elapsed / msPerFrame)
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
  }, [isPlaying, interpolatedYear, endYear, animationSpeed, startYear]);

  // Play/Pause with improved state management
  const togglePlayPause = () => {
    if (isPlaying) {
      setIsPlaying(false);
    } else {
      // If at the end, reset to start
      if (interpolatedYear >= endYear - 0.1) {
        setInterpolatedYear(startYear);
        setCurrentYear(startYear);
      }
      setIsPlaying(true);
    }
  };

  // Slider with improved handling
  const handleSliderChange = (e) => {
    const yearVal = parseFloat(e.target.value);
    setCurrentYear(Math.floor(yearVal));
    setInterpolatedYear(yearVal);
    // Update chart immediately for responsive feel
    drawChart(yearVal);
  };

  // Rendering with improved loading and error states
  if (isLoading) {
    return (
      <div className="vtloading-spinner">
        <div className="vtspinner"></div>
        <p style={{ marginTop: '20px', color: 'var(--text-muted)' }}>Loading team data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="vtempty-state">
        <div className="vtempty-state-icon">⚠️</div>
        <h3 className="vtempty-state-title">Data Error</h3>
        <p className="vtempty-state-text">{error}</p>
      </div>
    );
  }

  return (
    <div className="vtteam-wins-chart-container" ref={containerRef}>
      <div className="vtchart-controls">
        <button
          onClick={togglePlayPause}
          disabled={isLoading}
          className="vttimeline-control-button"
          aria-label={isPlaying ? "Pause animation" : "Play animation"}
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
          className="vttimeline-slider"
          aria-label="Year slider"
        />
        <span className="vtyear-display">
          {interpolatedYear ? Math.floor(interpolatedYear) : startYear}
        </span>
        <select
          value={animationSpeed}
          onChange={(e) => setAnimationSpeed(parseInt(e.target.value))}
          disabled={isPlaying || isLoading}
          className="vttimeline-speed-select"
          aria-label="Animation speed"
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
        style={{ 
          background: "transparent", 
          maxWidth: "100%",
          borderRadius: "12px",
          transition: "all 0.3s ease"
        }}
        aria-label="Team wins timeline chart"
        role="img"
      ></svg>
    </div>
  );
};

export default TeamWinsTimeline;