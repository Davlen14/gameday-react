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
          wins: {}
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
              currentWins: team.wins[year]
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
        }
      } catch (err) {
        console.error("Error fetching team data:", err);
        setError("Failed to load team data. Please try again later.");
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [yearRange, startYear, endYear, conference, topTeamCount]);

  // Get filtered data for a specific year
  const getFilteredData = (year) => {
    if (!year || isLoading || !yearlyRankings[year]) return [];
    return yearlyRankings[year];
  };

  // Draw the chart for a specific year with animations
  const drawChart = (year) => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    
    // Only clear if we're not animating between years
    if (!isPlaying) {
      svg.selectAll("*").remove();
    }

    const margin = { top: 30, right: 120, bottom: 30, left: 150 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const filteredData = getFilteredData(year);
    
    if (filteredData.length === 0) return;

    // Create scales
    const xScale = d3.scaleLinear()
      .domain([0, d3.max(filteredData, d => d.currentWins) * 1.1]) // Add 10% padding
      .range([0, innerWidth]);

    const yScale = d3.scaleBand()
      .domain(filteredData.map(d => d.team))
      .range([0, innerHeight])
      .padding(0.3);

    // Create or select container with margins
    let g = svg.select(".chart-container");
    
    if (g.empty()) {
      g = svg.append("g")
        .attr("class", "chart-container")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);
        
      // Add x-axis - only once
      g.append("g")
        .attr("class", "x-axis")
        .attr("transform", `translate(0, ${innerHeight})`)
        .call(d3.axisBottom(xScale).ticks(5))
        .selectAll("text")
        .attr("font-size", "12px");

      // Add x-axis label - only once
      g.append("text")
        .attr("class", "x-axis-label")
        .attr("x", innerWidth / 2)
        .attr("y", innerHeight + margin.bottom - 5)
        .attr("text-anchor", "middle")
        .attr("font-size", "12px")
        .attr("fill", "#666")
        .text("Total Wins");

      // Add y-axis container - only once
      g.append("g")
        .attr("class", "y-axis");
    }
    
    // Update x-axis with animation
    g.select(".x-axis")
      .transition()
      .duration(750)
      .call(d3.axisBottom(xScale).ticks(5));
    
    // Update y-axis with animation
    g.select(".y-axis")
      .transition()
      .duration(750)
      .call(d3.axisLeft(yScale))
      .selectAll("text")
      .attr("font-size", "14px")
      .attr("font-weight", "bold");

    // Update or create bar groups with data join pattern
    const barGroups = g.selectAll(".bar-group")
      .data(filteredData, d => d.team);
    
    // Remove exiting bars with animation
    barGroups.exit()
      .transition()
      .duration(500)
      .attr("transform", "translate(0, 50)")
      .style("opacity", 0)
      .remove();
    
    // Add new bar groups
    const enterGroups = barGroups.enter()
      .append("g")
      .attr("class", "bar-group")
      .style("opacity", 0)
      .attr("transform", "translate(0, -20)");
    
    // Add bars to new groups
    enterGroups.append("rect")
      .attr("class", "bar")
      .attr("y", d => yScale(d.team))
      .attr("height", yScale.bandwidth())
      .attr("x", 0)
      .attr("width", 0) // Start with zero width
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
      .text(d => d.currentWins);
    
    // Define or update SVG patterns for team logos
    let defs = svg.select("defs");
    if (defs.empty()) {
      defs = svg.append("defs");
    }
    
    // Update existing patterns and add new ones
    filteredData.forEach((d, i) => {
      let pattern = defs.select(`#logo-${d.team.replace(/\s+/g, '-')}`);
      
      if (pattern.empty()) {
        pattern = defs.append("pattern")
          .attr("id", `logo-${d.team.replace(/\s+/g, '-')}`)
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
    
    // Apply entrance animation to new elements
    enterGroups
      .transition()
      .duration(750)
      .style("opacity", 1)
      .attr("transform", "translate(0, 0)");
    
    // Update all bars (new and existing)
    const allGroups = enterGroups.merge(barGroups);
    
    // Update bar positions and dimensions
    allGroups.select("rect")
      .transition()
      .duration(750)
      .attr("y", d => yScale(d.team))
      .attr("height", yScale.bandwidth())
      .attr("width", d => xScale(d.currentWins));
    
    // Update logo positions and patterns
    allGroups.select("circle")
      .transition()
      .duration(750)
      .attr("cx", d => Math.min(xScale(d.currentWins) - 30, xScale(d.currentWins) * 0.8))
      .attr("cy", d => yScale(d.team) + yScale.bandwidth() / 2)
      .attr("fill", d => `url(#logo-${d.team.replace(/\s+/g, '-')})`);
    
    // Update win value text positions
    allGroups.select("text")
      .transition()
      .duration(750)
      .attr("x", d => xScale(d.currentWins) + 10)
      .attr("y", d => yScale(d.team) + yScale.bandwidth() / 2)
      .tween("text", function(d) {
        // Only animate text if not the initial render
        if (isPlaying) {
          const node = this;
          const i = d3.interpolateNumber(+node.textContent, d.currentWins);
          return function(t) {
            node.textContent = Math.round(i(t));
          };
        }
      });
    
    // Update or create year label
    let yearLabel = svg.select(".year-label");
    
    if (yearLabel.empty()) {
      yearLabel = svg.append("text")
        .attr("class", "year-label")
        .attr("x", width - 80)
        .attr("y", height / 2)
        .attr("text-anchor", "middle")
        .attr("font-size", "60px")
        .attr("font-weight", "bold")
        .attr("opacity", 0.5)
        .text(year);
    } else {
      yearLabel
        .transition()
        .duration(400)
        .attr("opacity", 0)
        .transition()
        .duration(10)
        .text(year)
        .transition()
        .duration(400)
        .attr("opacity", 0.5);
    }
    
    // Update or create title
    let title = svg.select(".chart-title");
    
    if (title.empty()) {
      title = svg.append("text")
        .attr("class", "chart-title")
        .attr("x", width / 2)
        .attr("y", 20)
        .attr("text-anchor", "middle")
        .attr("font-size", "18px")
        .attr("font-weight", "bold")
        .text(`Cumulative Football Wins (${startYear}-${year})`);
    } else {
      title
        .transition()
        .duration(500)
        .text(`Cumulative Football Wins (${startYear}-${year})`);
    }
    
    // Add "Presented by GAMEDAY+" text at bottom right
    if (svg.select(".presented-by").empty()) {
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
  };

  // Effect to handle animation
  useEffect(() => {
    if (!currentYear) {
      setCurrentYear(startYear);
    }
    
    // Cancel any ongoing animation when props change
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
      setIsPlaying(false);
    }
    
    // Only draw the chart if we have data and a current year
    if (!isLoading && currentYear) {
      drawChart(currentYear);
    }
  }, [teamData, currentYear, width, height, isLoading]);

  // Animation control function
  const togglePlayPause = () => {
    if (isPlaying) {
      // Pause animation
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      setIsPlaying(false);
    } else {
      // Start or resume animation
      setIsPlaying(true);
      
      // Always restart from the beginning when Play is clicked
      setCurrentYear(startYear);
      
      // Set a slight delay before starting animation
      setTimeout(() => {
        let currentYr = startYear;
        const animateYears = () => {
          if (currentYr <= endYear) {
            setCurrentYear(currentYr);
            
            setTimeout(() => {
              currentYr++;
              if (currentYr <= endYear) {
                animationRef.current = requestAnimationFrame(animateYears);
              } else {
                setIsPlaying(false);
              }
            }, animationSpeed);
          } else {
            setIsPlaying(false);
          }
        };
        
        animationRef.current = requestAnimationFrame(animateYears);
      }, 500);
    }
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
          value={currentYear || startYear}
          onChange={(e) => setCurrentYear(parseInt(e.target.value))}
          disabled={isPlaying || isLoading}
          className="timeline-slider"
        />
        <span className="year-display">{currentYear}</span>
        <select 
          value={animationSpeed} 
          onChange={(e) => setAnimationSpeed(parseInt(e.target.value))}
          disabled={isPlaying || isLoading}
          className="timeline-speed-select"
        >
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