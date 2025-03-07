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

  // Parse year range
  const startYear = parseInt(yearRange.split('-')[0]);
  const endYear = parseInt(yearRange.split('-')[1]);

  // Helper function to get team logo
  const getTeamLogo = (teamName) => {
    if (!teamName) return "/logos/default.png";
    const team = teams.find(
      (t) => t.school?.toLowerCase().replace(/[^a-z]/g, "") === teamName.toLowerCase().replace(/[^a-z]/g, "")
    );
    return team?.logos?.[0] || "/logos/default.png";
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
  }, [yearRange, startYear, endYear]); // Only re-fetch when year range changes

  // Create filtered data based on current props
  const getFilteredData = (year) => {
    if (!year || isLoading || teamData.length === 0) return [];

    let filteredData = [...teamData];
    
    // Filter by conference if needed
    if (conference !== "All Conferences") {
      filteredData = filteredData.filter(team => team.conference === conference);
    }

    // Filter for FBS teams only (could be made configurable)
    filteredData = filteredData.filter(team => {
      // Find the team in original teams array to check if it's FBS
      const teamInfo = teams.find(t => t.school === team.team);
      return teamInfo?.division === "FBS" || !teamInfo?.division; // Include if FBS or division not specified
    });

    // Filter out teams with no wins
    filteredData = filteredData.filter(team => (team.wins[year] || 0) > 0);

    // Get win data for the specific year
    const dataForYear = filteredData.map(team => ({
      team: team.team,
      logo: team.logo,
      abbreviation: team.abbreviation,
      color: team.color,
      alt_color: team.alt_color,
      wins: team.wins[year] || 0
    }));

    // Sort by wins
    dataForYear.sort((a, b) => b.wins - a.wins);

    // Limit to top N teams
    return dataForYear.slice(0, parseInt(topTeamCount));
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
  }, [teamData, currentYear, conference, topTeamCount, width, height, isLoading]);

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
      let nextYear = currentYear;
      if (nextYear >= endYear) {
        nextYear = startYear; // Loop back to start
      } else {
        nextYear++;
      }
      
      let lastTimestamp = performance.now();
      const animate = (timestamp) => {
        const elapsed = timestamp - lastTimestamp;
        
        if (elapsed > animationSpeed) {
          setCurrentYear(nextYear);
          lastTimestamp = timestamp;
          
          if (nextYear < endYear) {
            nextYear++;
            animationRef.current = requestAnimationFrame(animate);
          } else {
            setIsPlaying(false);
          }
        } else {
          animationRef.current = requestAnimationFrame(animate);
        }
      };
      
      animationRef.current = requestAnimationFrame(animate);
      setIsPlaying(true);
    }
  };

  // Draw the chart for a specific year
  const drawChart = (year) => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // Clear previous content

    const margin = { top: 20, right: 120, bottom: 30, left: 150 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const filteredData = getFilteredData(year);
    
    if (filteredData.length === 0) return;

    // Create scales
    const xScale = d3.scaleLinear()
      .domain([0, d3.max(filteredData, d => d.wins) * 1.1]) // Add 10% padding
      .range([0, innerWidth]);

    const yScale = d3.scaleBand()
      .domain(filteredData.map(d => d.team))
      .range([0, innerHeight])
      .padding(0.2);

    // Create container with margins
    const g = svg.append("g")
      .attr("transform", `translate(${margin.left}, ${margin.top})`);

    // Add x-axis
    g.append("g")
      .attr("transform", `translate(0, ${innerHeight})`)
      .call(d3.axisBottom(xScale).ticks(5))
      .selectAll("text")
      .attr("font-size", "12px");

    // Add x-axis label
    g.append("text")
      .attr("x", innerWidth / 2)
      .attr("y", innerHeight + margin.bottom - 5)
      .attr("text-anchor", "middle")
      .attr("font-size", "12px")
      .attr("fill", "#666")
      .text("Total Wins");

    // Add y-axis
    g.append("g")
      .call(d3.axisLeft(yScale))
      .selectAll("text")
      .attr("font-size", "14px")
      .attr("font-weight", "bold");

    // Add bars
    const bars = g.selectAll(".bar")
      .data(filteredData)
      .enter()
      .append("g");

    bars.append("rect")
      .attr("class", "bar")
      .attr("y", d => yScale(d.team))
      .attr("height", yScale.bandwidth())
      .attr("x", 0)
      .attr("width", d => xScale(d.wins))
      .attr("fill", d => d.color)
      .attr("rx", 4) // Rounded corners
      .attr("ry", 4);

    // Define SVG patterns for team logos
    const defs = svg.append("defs");
    
    filteredData.forEach((d, i) => {
      defs.append("pattern")
        .attr("id", `logo-${i}`)
        .attr("width", 1)
        .attr("height", 1)
        .attr("patternContentUnits", "objectBoundingBox")
        .append("image")
        .attr("href", d.logo)
        .attr("width", 1)
        .attr("height", 1)
        .attr("preserveAspectRatio", "xMidYMid slice");
    });

    // Add team logos as circles with patterns
    bars.append("circle")
      .attr("class", "team-logo-circle")
      .attr("cx", d => Math.min(xScale(d.wins) - 30, xScale(d.wins) * 0.8))
      .attr("cy", d => yScale(d.team) + yScale.bandwidth() / 2)
      .attr("r", Math.min(yScale.bandwidth() / 2.5, 20))
      .attr("fill", (d, i) => `url(#logo-${i})`)
      .attr("stroke", "white")
      .attr("stroke-width", 2);

    // Add win values
    bars.append("text")
      .attr("x", d => xScale(d.wins) + 10)
      .attr("y", d => yScale(d.team) + yScale.bandwidth() / 2)
      .attr("dy", ".35em")
      .attr("fill", "#333")
      .attr("font-size", "14px")
      .attr("font-weight", "bold")
      .text(d => d.wins);

    // Add year label
    svg.append("text")
      .attr("x", width - 80)
      .attr("y", height / 2)
      .attr("text-anchor", "middle")
      .attr("font-size", "60px")
      .attr("font-weight", "bold")
      .attr("opacity", 0.5)
      .text(year);
      
    // Add title
    svg.append("text")
      .attr("x", width / 2)
      .attr("y", 20)
      .attr("text-anchor", "middle")
      .attr("font-size", "18px")
      .attr("font-weight", "bold")
      .text(`Cumulative Football Wins (${startYear}-${year})`);
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
        <button onClick={togglePlayPause} disabled={isLoading}>
          {isPlaying ? "Pause" : "Play"}
        </button>
        <input
          type="range"
          min={startYear}
          max={endYear}
          value={currentYear || startYear}
          onChange={(e) => setCurrentYear(parseInt(e.target.value))}
          disabled={isLoading}
        />
        <span className="year-display">{currentYear}</span>
        <select 
          value={animationSpeed} 
          onChange={(e) => setAnimationSpeed(parseInt(e.target.value))}
          disabled={isLoading}
        >
          <option value="2000">Slow</option>
          <option value="1000">Medium</option>
          <option value="500">Fast</option>
        </select>
      </div>
      <svg ref={svgRef} width={width} height={height}></svg>
    </div>
  );
};

export default TeamWinsTimeline;