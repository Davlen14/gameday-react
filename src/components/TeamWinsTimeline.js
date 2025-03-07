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
      (t) => t.school?.toLowerCase().replace(/[^a-z]/g, "") === teamName.toLowerCase().replace(/[^a-z]/g, "")
    );
    return team?.logos?.[0] || "/photos/default-team.png";
  };
  
  // Effect to fetch data from the API
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // First get all teams to have team info (colors, logos, etc.)
        const teamsResponse = await teamsService.getTeams();
        setTeams(teamsResponse);
        
        // Process teams to get the color, logo, etc.
        const processedTeams = teamsResponse.map(team => ({
          id: team.id,
          team: team.school,
          logo: getTeamLogo(team.school),
          abbreviation: team.abbreviation || team.school.substring(0, 4).toUpperCase(),
          color: team.color || '#333333',
          alt_color: team.alt_color || '#999999',
          conference: team.conference,
          wins: {},
          yearlyWins: {} // Add property to store yearly wins (not cumulative)
        }));
        
        // Temporary object to store annual wins data
        const annualWinsData = {};
        
        // Fetch records data for each year in the range
        for (let year = startYear; year <= endYear; year++) {
          // Use the records endpoint to get win/loss data
          const recordsResponse = await teamsService.getTeamRecords(null, year);
          
          // Create a map of team to wins for this year
          const teamWins = {};
          
          // Process records response which contains data like:
          // { team: "Alabama", total: { wins: 10, losses: 2 } }
          recordsResponse.forEach(record => {
            // Get wins from the total section of the record
            const wins = record.total?.wins || 0;
            teamWins[record.team] = wins;
          });
          
          annualWinsData[year] = teamWins;
        }
        
        // Calculate cumulative wins for each team across years
        processedTeams.forEach(team => {
          let cumulativeWins = 0;
          for (let year = startYear; year <= endYear; year++) {
            const winsThisYear = annualWinsData[year][team.team] || 0;
            team.yearlyWins[year] = winsThisYear; // Store individual year wins
            cumulativeWins += winsThisYear;
            team.wins[year] = cumulativeWins;
          }
        });
        
        // Create yearly rankings data structure to use for animations
        const rankings = {};
        for (let year = startYear; year <= endYear; year++) {
          // Get all teams with wins for this year
          const teamsWithWins = processedTeams
            .filter(team => {
              // Filter by conference if needed
              if (conference !== "All Conferences" && team.conference !== conference) {
                return false;
              }
              // Filter for FBS teams only
              const teamInfo = teamsResponse.find(t => t.school === team.team);
              const isFBS = teamInfo?.division === "FBS" || !teamInfo?.division;
              
              return isFBS && team.wins[year] > 0;
            })
            .map(team => ({
              ...team,
              currentWins: team.wins[year],
              winsThisYear: team.yearlyWins[year]
            }))
            .sort((a, b) => b.currentWins - a.currentWins)
            .slice(0, parseInt(topTeamCount));
          
          rankings[year] = teamsWithWins;
        }
        
        setYearlyRankings(rankings);
        setTeamData(processedTeams);
        setIsLoading(false);
        
        // Set initial year to start year
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
  }, [yearRange, startYear, endYear, conference, topTeamCount]);

  // Function to interpolate team data between years
  const getInterpolatedData = (year) => {
    if (!yearlyRankings[Math.floor(year)] || !yearlyRankings[Math.ceil(year)]) {
      return yearlyRankings[Math.floor(year)] || [];
    }
    
    // If the year is an integer, just return that year's data
    if (year === Math.floor(year)) {
      return yearlyRankings[year];
    }
    
    const lowerYear = Math.floor(year);
    const upperYear = Math.ceil(year);
    const fraction = year - lowerYear;
    
    // Get data for the lower and upper years
    const lowerData = yearlyRankings[lowerYear];
    const upperData = yearlyRankings[upperYear];
    
    // Create a set of all teams in either year
    const allTeams = new Set([
      ...lowerData.map(d => d.team),
      ...upperData.map(d => d.team)
    ]);
    
    // Create interpolated data for each team
    const interpolatedData = Array.from(allTeams).map(teamName => {
      const lowerTeam = lowerData.find(d => d.team === teamName);
      const upperTeam = upperData.find(d => d.team === teamName);
      
      // If team isn't in one of the years, use the data from the year it's in
      if (!lowerTeam) return upperTeam;
      if (!upperTeam) return lowerTeam;
      
      // Calculate interpolated wins
      const interpolatedWins = lowerTeam.currentWins + 
        (upperTeam.currentWins - lowerTeam.currentWins) * fraction;
      
      return {
        ...lowerTeam,
        currentWins: interpolatedWins
      };
    })
    .sort((a, b) => b.currentWins - a.currentWins)
    .slice(0, parseInt(topTeamCount));
    
    return interpolatedData;
  };

  // Draw the chart with interpolation between years
  const drawChart = (year) => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    
    // Initialize the chart container if it doesn't exist
    if (svg.select(".chart-container").empty()) {
      svg.selectAll("*").remove();
      
      const margin = { top: 30, right: 120, bottom: 30, left: 150 };
      
      // Create container with margins
      svg.append("g")
        .attr("class", "chart-container")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);
        
      // Create defs for patterns
      svg.append("defs");
      
      // Create year label
      svg.append("text")
        .attr("class", "year-label")
        .attr("x", width - 80)
        .attr("y", height / 2)
        .attr("text-anchor", "middle")
        .attr("font-size", "60px")
        .attr("font-weight", "bold")
        .attr("opacity", 0.4)
        .text(Math.floor(year));
        
      // Create chart title
      svg.append("text")
        .attr("class", "chart-title")
        .attr("x", width / 2)
        .attr("y", 20)
        .attr("text-anchor", "middle")
        .attr("font-size", "18px")
        .attr("font-weight", "bold")
        .text(`Cumulative Football Wins (${startYear}-${Math.floor(year)})`);
        
      // Add "Presented by GAMEDAY+" text
      const textGroup = svg.append("g")
        .attr("class", "presented-by")
        .attr("transform", `translate(${width - 20}, ${height - 20})`);
        
      textGroup.append("text")
        .text("Presented by")
        .attr("x", 0)
        .attr("y", 0)
        .style("font-size", "12px")
        .style("fill", "#000")
        .style("font-weight", "normal")
        .style("text-anchor", "end")
        .style("font-family", "sans-serif");
        
      textGroup.append("text")
        .text("GAMEDAY+")
        .attr("x", 0)
        .attr("y", 16)
        .style("font-size", "12px")
        .style("fill", "#D4001C")
        .style("font-style", "italic")
        .style("font-family", "'Orbitron', 'Titillium Web', sans-serif")
        .style("text-anchor", "end");
    }
    
    const margin = { top: 30, right: 120, bottom: 30, left: 150 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;
    
    // Get interpolated data for the current fractional year
    const interpolatedData = getInterpolatedData(year);
    
    if (interpolatedData.length === 0) return;
    
    // Create scales
    const xScale = d3.scaleLinear()
      .domain([0, d3.max(interpolatedData, d => d.currentWins) * 1.1]) // Add 10% padding
      .range([0, innerWidth]);

    const yScale = d3.scaleBand()
      .domain(interpolatedData.map(d => d.team))
      .range([0, innerHeight])
      .padding(0.3);
      
    const g = svg.select(".chart-container");
    
    // Create or update axes
    if (g.select(".x-axis").empty()) {
      g.append("g")
        .attr("class", "x-axis")
        .attr("transform", `translate(0, ${innerHeight})`)
        .call(d3.axisBottom(xScale).ticks(5))
        .selectAll("text")
        .attr("font-size", "12px");
      
      g.append("text")
        .attr("class", "x-axis-label")
        .attr("x", innerWidth / 2)
        .attr("y", innerHeight + margin.bottom - 5)
        .attr("text-anchor", "middle")
        .attr("font-size", "12px")
        .attr("fill", "#666")
        .text("Total Wins");
        
      g.append("g")
        .attr("class", "y-axis");
    } else {
      // Update x-axis smoothly
      g.select(".x-axis")
        .transition()
        .duration(100) // Shorter to feel more responsive
        .call(d3.axisBottom(xScale).ticks(5));
    }
    
    // Update y-axis with animation
    g.select(".y-axis")
      .transition()
      .duration(300) // Shorter for smoother feel
      .call(d3.axisLeft(yScale))
      .selectAll("text")
      .attr("font-size", "14px")
      .attr("font-weight", "bold");
    
    // Define or update SVG patterns for team logos
    let defs = svg.select("defs");
    
    // Update existing patterns and add new ones
    interpolatedData.forEach((d) => {
      let patternId = `logo-${d.team.replace(/\s+/g, '-')}`;
      let pattern = defs.select(`#${patternId}`);
      
      if (pattern.empty()) {
        pattern = defs.append("pattern")
          .attr("id", patternId)
          .attr("width", 1)
          .attr("height", 1)
          .attr("patternContentUnits", "objectBoundingBox");
          
        pattern.append("image")
          .attr("href", d.logo)
          .attr("width", 1)
          .attr("height", 1)
          .attr("preserveAspectRatio", "xMidYMid slice");
      }
    });
    
    // Update bar groups with data join pattern
    const barGroups = g.selectAll(".bar-group")
      .data(interpolatedData, d => d.team);
      
    // Remove exiting bars with smooth animation
    barGroups.exit()
      .transition()
      .duration(300)
      .style("opacity", 0)
      .attr("transform", "translate(0, 30)")
      .remove();
      
    // Add new bar groups with smooth entrance
    const enterGroups = barGroups.enter()
      .append("g")
      .attr("class", "bar-group")
      .style("opacity", 0)
      .attr("transform", "translate(0, -10)");
      
    // Add bars to new groups
    enterGroups.append("rect")
      .attr("class", "bar")
      .attr("y", d => yScale(d.team))
      .attr("height", yScale.bandwidth())
      .attr("x", 0)
      .attr("width", 0)
      .attr("fill", d => d.color)
      .attr("rx", 4)
      .attr("ry", 4);
      
    // Add team logos to new groups
    enterGroups.append("circle")
      .attr("class", "team-logo-circle")
      .attr("cx", 0)
      .attr("cy", d => yScale(d.team) + yScale.bandwidth() / 2)
      .attr("r", Math.min(yScale.bandwidth() / 2.5, 20))
      .attr("stroke", "white")
      .attr("stroke-width", 2);
      
    // Add win values text to new groups
    enterGroups.append("text")
      .attr("class", "win-value")
      .attr("x", 10)
      .attr("y", d => yScale(d.team) + yScale.bandwidth() / 2)
      .attr("dy", ".35em")
      .attr("fill", "#333")
      .attr("font-size", "14px")
      .attr("font-weight", "bold")
      .text(d => Math.round(d.currentWins));
      
    // Apply entrance animation to new elements
    enterGroups
      .transition()
      .duration(300)
      .style("opacity", 1)
      .attr("transform", "translate(0, 0)");
      
    // Update all bars (new and existing)
    const allGroups = enterGroups.merge(barGroups);
    
    // Update bar positions and dimensions
    allGroups.select("rect")
      .transition()
      .duration(100) // Very short for smooth real-time feel
      .attr("y", d => yScale(d.team))
      .attr("height", yScale.bandwidth())
      .attr("width", d => xScale(d.currentWins));
      
    // Update logo positions and patterns
    allGroups.select("circle")
      .transition()
      .duration(100) // Very short for smooth real-time feel
      .attr("cy", d => yScale(d.team) + yScale.bandwidth() / 2)
      .attr("cx", d => Math.min(xScale(d.currentWins) - 30, xScale(d.currentWins) * 0.8))
      .attr("fill", d => `url(#logo-${d.team.replace(/\s+/g, '-')})`);
      
    // Update win value text positions and values
    allGroups.select("text")
      .transition()
      .duration(100) // Very short for smooth real-time feel
      .attr("x", d => xScale(d.currentWins) + 10)
      .attr("y", d => yScale(d.team) + yScale.bandwidth() / 2)
      .textTween(function(d) {
        const node = this;
        const currentValue = parseFloat(node.textContent) || 0;
        const targetValue = Math.round(d.currentWins * 10) / 10; // Round to 1 decimal
        const i = d3.interpolateNumber(currentValue, targetValue);
        return function(t) {
          return Math.round(i(t) * 10) / 10;
        };
      });
      
    // Update year label with smooth transition
    svg.select(".year-label")
      .transition()
      .duration(100)
      .text(year.toFixed(1))
      .attr("opacity", 0.4);
      
    // Update title with smooth transition
    svg.select(".chart-title")
      .transition()
      .duration(300)
      .text(`Cumulative Football Wins (${startYear}-${year.toFixed(1)})`);
  };

  // Effect to handle animation
  useEffect(() => {
    if (!currentYear) {
      setCurrentYear(startYear);
      setInterpolatedYear(startYear);
    }
    
    // Draw chart on data or size changes
    if (!isLoading && interpolatedYear !== null) {
      drawChart(interpolatedYear);
    }
  }, [teamData, interpolatedYear, width, height, isLoading]);
  
  // Separate effect to handle smooth year interpolation
  useEffect(() => {
    if (isPlaying) {
      // Clear any existing animation
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      
      let lastTimestamp = null;
      const yearDuration = animationSpeed; // ms per year
      const fps = 60; // target frames per second
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
          
          // Calculate new interpolated year
          const newYear = Math.min(
            endYear, 
            interpolatedYear + yearPerFrame * (elapsed / msPerFrame)
          );
          
          setInterpolatedYear(newYear);
          
          // Update integer current year for UI
          if (Math.floor(newYear) !== Math.floor(interpolatedYear)) {
            setCurrentYear(Math.floor(newYear));
          }
          
          // Stop animation if we've reached the end
          if (newYear >= endYear) {
            setIsPlaying(false);
            return;
          }
        }
        
        animationRef.current = requestAnimationFrame(animate);
      };
      
      animationRef.current = requestAnimationFrame(animate);
      
      // Cleanup function
      return () => {
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
      };
    }
  }, [isPlaying, interpolatedYear, endYear, animationSpeed]);

  // Animation control function
  const togglePlayPause = () => {
    if (isPlaying) {
      // Pause animation
      setIsPlaying(false);
    } else {
      // Start or resume animation
      if (interpolatedYear >= endYear) {
        // If at the end, restart from beginning
        setInterpolatedYear(startYear);
        setCurrentYear(startYear);
      }
      setIsPlaying(true);
    }
  };
  
  // Handle slider change
  const handleSliderChange = (e) => {
    const year = parseInt(e.target.value);
    setCurrentYear(year);
    setInterpolatedYear(year);
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
          {interpolatedYear ? interpolatedYear.toFixed(1) : startYear}
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
        style={{ background: "transparent" }}
      ></svg>
    </div>
  );
};

export default TeamWinsTimeline;