import React, { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';

const TeamWinsTimeline = ({ width, height, yearRange, conference, topTeamCount }) => {
  const svgRef = useRef();
  const [currentYear, setCurrentYear] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [animationSpeed, setAnimationSpeed] = useState(1000); // milliseconds per year
  const animationRef = useRef(null);

  // Parse year range
  const startYear = parseInt(yearRange.split('-')[0]);
  const endYear = parseInt(yearRange.split('-')[1]);
  
  // Mock data - you would replace this with real data from your API
  // Format: { team: string, logo: string, color: string, wins: { [year: number]: number } }
  const generateMockData = () => {
    const teams = [
      { team: 'Alabama', logo: 'ALA', color: '#A50F31', wins: {} },
      { team: 'Ohio State', logo: 'OSU', color: '#BB0000', wins: {} },
      { team: 'Clemson', logo: 'CLEM', color: '#F56600', wins: {} },
      { team: 'Georgia', logo: 'UGA', color: '#BA0C2F', wins: {} },
      { team: 'Oklahoma', logo: 'OKLA', color: '#841617', wins: {} },
      { team: 'LSU', logo: 'LSU', color: '#461D7C', wins: {} },
      { team: 'Michigan', logo: 'MICH', color: '#00274C', wins: {} },
      { team: 'Notre Dame', logo: 'ND', color: '#0C2340', wins: {} },
      { team: 'Penn State', logo: 'PSU', color: '#041E42', wins: {} },
      { team: 'Florida', logo: 'FLA', color: '#0021A5', wins: {} },
      { team: 'USC', logo: 'USC', color: '#990000', wins: {} },
      { team: 'Texas', logo: 'TEX', color: '#BF5700', wins: {} },
      { team: 'Oregon', logo: 'ORE', color: '#154733', wins: {} },
      { team: 'Wisconsin', logo: 'WIS', color: '#C5050C', wins: {} },
      { team: 'Auburn', logo: 'AUB', color: '#0C2340', wins: {} },
      { team: 'Miami', logo: 'MIA', color: '#F47321', wins: {} },
      { team: 'Washington', logo: 'WASH', color: '#4B2E83', wins: {} },
      { team: 'Florida State', logo: 'FSU', color: '#782F40', wins: {} },
      { team: 'Texas A&M', logo: 'TAMU', color: '#500000', wins: {} },
      { team: 'Iowa', logo: 'IOWA', color: '#000000', wins: {} },
    ];

    // Generate random win data for each team for each year
    for (let team of teams) {
      let cumulativeWins = 0;
      for (let year = startYear; year <= endYear; year++) {
        const winsThisYear = Math.floor(Math.random() * 10) + 1; // 1-10 wins per year
        cumulativeWins += winsThisYear;
        team.wins[year] = cumulativeWins;
      }
    }

    return teams;
  };

  const data = generateMockData();

  // Create filtered data based on current props
  const getFilteredData = (year) => {
    if (!year) return [];

    let filteredData = [...data];
    
    // Filter by conference if needed
    if (conference !== "All Conferences") {
      // This would use real conference data from your API
      // For now, we'll just simulate filtering
      filteredData = filteredData.slice(0, 15); // Simulated conference filter
    }

    // Get win data for the specific year
    const dataForYear = filteredData.map(team => ({
      team: team.team,
      logo: team.logo,
      color: team.color,
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
    
    // Draw the chart
    drawChart(currentYear || startYear);
  }, [yearRange, conference, topTeamCount, currentYear, width, height]);

  // Animation control function
  const togglePlayPause = () => {
    if (isPlaying) {
      // Pause animation
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    } else {
      // Start or resume animation
      let nextYear = currentYear;
      if (nextYear >= endYear) {
        nextYear = startYear; // Loop back to start
      } else {
        nextYear++;
      }
      
      const lastTimestamp = performance.now();
      const animate = (timestamp) => {
        const elapsed = timestamp - lastTimestamp;
        
        if (elapsed > animationSpeed) {
          setCurrentYear(nextYear);
          
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
    }
    
    setIsPlaying(!isPlaying);
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

    // Add team logos
    bars.append("text")
      .attr("x", d => xScale(d.wins) - 30)
      .attr("y", d => yScale(d.team) + yScale.bandwidth() / 2)
      .attr("dy", ".35em")
      .attr("text-anchor", "end")
      .attr("fill", "white")
      .attr("font-size", "16px")
      .attr("font-weight", "bold")
      .text(d => d.logo);

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
  };

  return (
    <div className="team-wins-chart-container">
      <div className="chart-controls">
        <button onClick={togglePlayPause}>
          {isPlaying ? "Pause" : "Play"}
        </button>
        <input
          type="range"
          min={startYear}
          max={endYear}
          value={currentYear || startYear}
          onChange={(e) => setCurrentYear(parseInt(e.target.value))}
        />
        <span className="year-display">{currentYear}</span>
        <select 
          value={animationSpeed} 
          onChange={(e) => setAnimationSpeed(parseInt(e.target.value))}
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