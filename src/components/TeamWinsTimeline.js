import React, { useRef, useEffect, useState, useMemo } from 'react';
import * as d3 from 'd3';
import teamsService from '../services/teamsService';

const TeamWinsTimeline = ({ width: initialWidth, height: initialHeight, yearRange, conference, topTeamCount }) => {
  const svgRef = useRef();
  const containerRef = useRef(null);
  
  // Chart state
  const [currentYear, setCurrentYear] = useState(null);
  const [interpolatedYear, setInterpolatedYear] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [animationSpeed, setAnimationSpeed] = useState(1000); // milliseconds per year
  
  // Animation reference
  const animationRef = useRef(null);
  
  // Data state
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [teamData, setTeamData] = useState([]);
  const [teams, setTeams] = useState([]);
  const [yearlyRankings, setYearlyRankings] = useState({});
  const [allYearsDataLoaded, setAllYearsDataLoaded] = useState(false);
  
  // Chart dimensions
  const [dynamicHeight, setDynamicHeight] = useState(initialHeight);
  const [dynamicWidth, setDynamicWidth] = useState(initialWidth);
  const [containerWidth, setContainerWidth] = useState(0);
  
  // Parse year range
  const startYear = parseInt(yearRange.split('-')[0]);
  const endYear = parseInt(yearRange.split('-')[1]);
  
  // Measure container width for responsive sizing
  useEffect(() => {
    if (containerRef.current) {
      const resizeObserver = new ResizeObserver(entries => {
        for (let entry of entries) {
          setContainerWidth(entry.contentRect.width);
        }
      });
      
      resizeObserver.observe(containerRef.current);
      return () => {
        resizeObserver.disconnect();
      };
    }
  }, []);
  
  // Dynamic width calculation for better spread
  useEffect(() => {
    // Make chart take up full width of container
    if (containerWidth > 0) {
      setDynamicWidth(containerWidth);
    } else {
      // Fallback if container width measurement fails
      setDynamicWidth(Math.max(initialWidth, window.innerWidth * 0.9));
    }
  }, [containerWidth, initialWidth]);
  
  // Calculate dynamic height based on team count
  useEffect(() => {
    const teamCount = parseInt(topTeamCount);
    // Minimum height per team to ensure readability
    const heightPerTeam = 52; 
    // Calculate height based on team count with some padding
    const calculatedHeight = Math.max(initialHeight, teamCount * heightPerTeam + 120);
    setDynamicHeight(calculatedHeight);
  }, [topTeamCount, initialHeight]);

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

  // Pre-fetch ALL data for all years at once to avoid transition glitches
  useEffect(() => {
    const fetchAllData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // 1. Get all teams once
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

        // 3. Fetch ALL records for ALL years at once to avoid mid-animation fetches
        console.log("Preloading all years data...");
        const annualWinsData = {};
        const yearPromises = [];
        
        for (let year = startYear; year <= endYear; year++) {
          yearPromises.push(
            teamsService.getTeamRecords(null, year)
              .then(recordsResponse => {
                const teamWins = {};
                recordsResponse.forEach((record) => {
                  const wins = record.total?.wins || 0;
                  teamWins[record.team] = wins;
                });
                annualWinsData[year] = teamWins;
                console.log(`Loaded data for year ${year}`);
              })
          );
        }
        
        // Wait for all year data to be fetched before proceeding
        await Promise.all(yearPromises);
        console.log("All years data loaded!");

        // 4. Calculate cumulative wins for all teams across all years
        processedTeams.forEach((t) => {
          let cumulativeWins = 0;
          for (let year = startYear; year <= endYear; year++) {
            const winsThisYear = annualWinsData[year]?.[t.team] || 0;
            t.yearlyWins[year] = winsThisYear;
            cumulativeWins += winsThisYear;
            t.wins[year] = cumulativeWins;
          }
        });

        // 5. Pre-compute rankings for ALL years to avoid on-the-fly calculations
        const rankings = {};
        for (let year = startYear; year <= endYear; year++) {
          // Apply conference filter
          const filteredTeams = processedTeams.filter((t) => {
            if (conference !== "All Conferences" && t.conference !== conference) {
              return false;
            }
            // Filter for FBS or unknown (treat unknown as FBS)
            const teamInfo = teamsResponse.find((x) => x.school === t.team);
            const isFBS = teamInfo?.division === "FBS" || !teamInfo?.division;
            return isFBS && t.wins[year] > 0;
          });
          
          // Sort by wins and take top N teams
          const teamsWithWins = filteredTeams
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
        setAllYearsDataLoaded(true);
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

    fetchAllData();
  }, [yearRange, startYear, endYear, conference, topTeamCount]);

  // OPTIMIZATION: Memoize data interpolation to avoid unnecessary recalculations
  const getInterpolatedData = useMemo(() => {
    return (year) => {
      if (!allYearsDataLoaded) return [];
      
      if (!yearlyRankings[Math.floor(year)] ||
          !yearlyRankings[Math.ceil(year)]) {
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

      // Gather all teams in both sets for smooth transitions
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
  }, [yearlyRankings, allYearsDataLoaded, topTeamCount]);

  // Initial chart setup - Only done ONCE
  useEffect(() => {
    if (!svgRef.current || !allYearsDataLoaded) return;
    
    const svg = d3.select(svgRef.current);
    
    // Clear any existing content
    svg.selectAll("*").remove();
    
    // Add a subtle gradient background
    svg.append("rect")
      .attr("width", dynamicWidth)
      .attr("height", dynamicHeight)
      .attr("fill", "url(#vtchart-gradient)")
      .attr("rx", 0)
      .attr("ry", 0)
      .attr("opacity", 0.02);

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

    // Improved margins - less right margin, more width for bars
    const margin = { 
      top: 45, 
      right: 100,  // Reduced from 15%
      bottom: 50, 
      left: 140    // Increased for team names
    };
    
    // Main chart container
    svg.append("g")
      .attr("class", "vtchart-container")
      .attr("transform", `translate(${margin.left}, ${margin.top})`);

    // Large year label (centered)
    svg.append("text")
      .attr("class", "vtyear-label")
      .attr("x", dynamicWidth / 2)
      .attr("y", dynamicHeight / 2)
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "middle")
      .attr("font-size", "120px")
      .attr("font-weight", "800")
      .attr("opacity", 0.08)
      .style("font-family", "'Orbitron', 'Titillium Web', sans-serif")
      .text(startYear);

    // Chart title (top-center)
    svg.append("text")
      .attr("class", "vtchart-title")
      .attr("x", dynamicWidth / 2)
      .attr("y", 20)
      .attr("text-anchor", "middle")
      .attr("font-size", "18px")
      .attr("font-weight", "bold")
      .style("font-family", "'Titillium Web', system-ui, sans-serif")
      .text(`Cumulative Football Wins (${startYear}-${startYear})`);

    // "Presented by GAMEDAY+"
    const textGroup = svg
      .append("g")
      .attr("class", "vtpresented-by")
      .attr("transform", `translate(${dynamicWidth - 20}, ${dynamicHeight - 20})`);

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
      
  }, [dynamicWidth, dynamicHeight, allYearsDataLoaded, startYear]);

  // Update chart data without recreating entire chart structure
  const updateChart = () => {
    if (!svgRef.current || !allYearsDataLoaded || interpolatedYear === null) return;
    
    const year = interpolatedYear;
    const interpolatedData = getInterpolatedData(year);
    if (interpolatedData.length === 0) return;
    
    const svg = d3.select(svgRef.current);
    const g = svg.select(".vtchart-container");
    
    // If g is empty, wait for initial setup to complete
    if (g.empty()) return;
    
    // Improved margins - less right margin, more width for bars
    const margin = { 
      top: 45, 
      right: 100,  // Reduced from 15%
      bottom: 50, 
      left: 140    // Increased for team names
    };
    
    const innerWidth = dynamicWidth - margin.left - margin.right;
    const innerHeight = dynamicHeight - margin.top - margin.bottom;
    
    // Calculate team bar heights
    const teamCount = interpolatedData.length;
    const optimalBandHeight = Math.min(35, Math.max(innerHeight / teamCount, 25));
    const requiredHeight = optimalBandHeight * teamCount;
    
    // Scales
    const xScale = d3
      .scaleLinear()
      .domain([0, d3.max(interpolatedData, d => d.currentWins) * 1.05])
      .range([0, innerWidth]);
      
    const yScale = d3
      .scaleBand()
      .domain(interpolatedData.map(d => d.team))
      .range([0, requiredHeight])
      .padding(0.25);
      
    // Update/create x-axis
    if (g.select(".x-axis").empty()) {
      g.append("g")
        .attr("class", "x-axis")
        .attr("transform", `translate(0, ${requiredHeight})`)
        .call(d3.axisBottom(xScale).ticks(5)
          .tickFormat(d => d3.format(",")(d)))
        .selectAll("text")
        .attr("font-size", "12px")
        .attr("font-family", "'Titillium Web', system-ui, sans-serif");
          
      // X-axis label
      g.append("text")
        .attr("class", "x-axis-label")
        .attr("x", innerWidth / 2)
        .attr("y", requiredHeight + 35)
        .attr("text-anchor", "middle")
        .attr("font-size", "13px")
        .attr("fill", "#666")
        .attr("font-family", "'Titillium Web', system-ui, sans-serif")
        .text("Total Wins");
        
      // Y-axis
      g.append("g")
        .attr("class", "y-axis")
        .attr("font-family", "'Titillium Web', system-ui, sans-serif");
    } else {
      // Update axes with smooth transitions
      g.select(".x-axis")
        .transition()
        .duration(300)
        .ease(d3.easePolyOut)
        .attr("transform", `translate(0, ${requiredHeight})`)
        .call(d3.axisBottom(xScale).ticks(5)
          .tickFormat(d => d3.format(",")(d)));
          
      g.select(".x-axis-label")
        .transition()
        .duration(300)
        .attr("y", requiredHeight + 35);
    }
    
    // Update y-axis
    g.select(".y-axis")
      .transition()
      .duration(300)
      .call(d3.axisLeft(yScale))
      .selectAll("text")
      .attr("font-size", "13px")
      .attr("font-weight", "500");
      
    // Grid lines
    g.selectAll(".vt-grid-line").remove();
    xScale.ticks(5).forEach(tick => {
      g.append("line")
        .attr("class", "vt-grid-line")
        .attr("x1", xScale(tick))
        .attr("x2", xScale(tick))
        .attr("y1", 0)
        .attr("y2", requiredHeight)
        .attr("stroke", "#e0e0e0")
        .attr("stroke-dasharray", "2,2")
        .attr("opacity", 0.5);
    });
    
    // DATA JOIN FOR BARS
    // Use team name as key for stable animations
    const barGroups = g.selectAll(".vt-bar-group")
      .data(interpolatedData, d => d.team);
      
    // REMOVE
    barGroups.exit()
      .transition()
      .duration(500)
      .ease(d3.easePolyOut)
      .style("opacity", 0)
      .attr("transform", "translate(-30, 0)")
      .remove();
      
    // ENTER
    const enterGroups = barGroups
      .enter()
      .append("g")
      .attr("class", "vt-bar-group")
      .style("opacity", 0)
      .attr("transform", "translate(20, 0)");
      
    // Bar rectangles
    enterGroups
      .append("rect")
      .attr("class", "vt-bar")
      .attr("y", d => yScale(d.team))
      .attr("height", yScale.bandwidth())
      .attr("x", 0)
      .attr("width", 0)
      .attr("rx", 3)
      .attr("ry", 3)
      .style("fill", d => {
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
            
          // Use team color or fallback
          const color = d3.color(d.color || "#333333");
          const lighterColor = d3.color(d.color || "#333333");
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
      
    // Top highlight for 3D effect
    enterGroups
      .append("rect")
      .attr("class", "vt-bar-highlight")
      .attr("y", d => yScale(d.team))
      .attr("height", 3)
      .attr("x", 0)
      .attr("width", 0)
      .attr("rx", 3)
      .attr("ry", 3)
      .attr("fill", "rgba(255,255,255,0.3)");
      
    // Team logos
    enterGroups
      .append("svg:image")
      .attr("class", "vt-team-logo")
      .attr("x", d => xScale(d.currentWins) + 10)
      .attr("y", d => yScale(d.team) + (yScale.bandwidth() - Math.min(30, yScale.bandwidth())) / 2)
      .attr("width", d => Math.min(30, yScale.bandwidth()))
      .attr("height", d => Math.min(30, yScale.bandwidth()))
      .attr("href", d => d.logo);
      
    // Win values
    enterGroups
      .append("text")
      .attr("class", "vt-win-value")
      .attr("x", d => Math.min(xScale(d.currentWins) / 2, xScale(d.currentWins) - 30))
      .attr("y", d => yScale(d.team) + yScale.bandwidth() / 2)
      .attr("dy", ".35em")
      .attr("text-anchor", "middle")
      .attr("fill", "white")
      .attr("font-size", "14px")
      .attr("font-weight", "bold")
      .attr("font-family", "'Titillium Web', system-ui, sans-serif")
      .style("text-shadow", "0px 1px 2px rgba(0,0,0,0.2)")
      .text(d => Math.round(d.currentWins));
      
    // Animate entrance
    enterGroups
      .transition()
      .duration(500)
      .ease(d3.easePolyOut)
      .style("opacity", 1)
      .attr("transform", "translate(0, 0)");
      
    // UPDATE - merge and transition existing elements
    const allGroups = enterGroups.merge(barGroups);
    
    // Update bar rectangles
    allGroups.select(".vt-bar")
      .transition()
      .duration(300)
      .ease(d3.easePolyOut)
      .attr("y", d => yScale(d.team))
      .attr("height", yScale.bandwidth())
      .attr("width", d => xScale(d.currentWins));
      
    // Update bar highlights
    allGroups.select(".vt-bar-highlight")
      .transition()
      .duration(300)
      .ease(d3.easePolyOut)
      .attr("y", d => yScale(d.team))
      .attr("width", d => xScale(d.currentWins));
      
    // Update logos
    allGroups.select(".vt-team-logo")
      .transition()
      .duration(300)
      .ease(d3.easePolyOut)
      .attr("x", d => xScale(d.currentWins) + 10)
      .attr("y", d => yScale(d.team) + (yScale.bandwidth() - Math.min(30, yScale.bandwidth())) / 2);
      
    // Update win values with smooth counting animation
    allGroups.select(".vt-win-value")
      .transition()
      .duration(300)
      .ease(d3.easePolyOut)
      .attr("x", d => Math.min(xScale(d.currentWins) / 2, xScale(d.currentWins) - 30))
      .attr("y", d => yScale(d.team) + yScale.bandwidth() / 2)
      .textTween(function(d) {
        const node = this;
        const currentValue = parseFloat(node.textContent) || 0;
        const targetValue = Math.round(d.currentWins);
        const i = d3.interpolateNumber(currentValue, targetValue);
        return function(t) {
          return Math.round(i(t));
        };
      });
      
    // Update year label
    svg.select(".vtyear-label")
      .transition()
      .duration(300)
      .text(Math.floor(year))
      .attr("opacity", 0.08);
      
    // Update title
    svg.select(".vtchart-title")
      .transition()
      .duration(300)
      .text(`Cumulative Football Wins (${startYear}-${Math.floor(year)})`);
  };
  
  // Call updateChart whenever the interpolated year or dimensions change
  useEffect(() => {
    if (allYearsDataLoaded && interpolatedYear !== null) {
      updateChart();
    }
  }, [interpolatedYear, dynamicWidth, dynamicHeight, allYearsDataLoaded]);
  
  // Smooth animation with requestAnimationFrame
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
          
          // Smooth easing for year transitions
          const progress = (interpolatedYear - startYear) / (endYear - startYear);
          const easingFactor = Math.sin(progress * Math.PI) * 0.2;
          
          // Adjust speed based on progress (slower at beginning and end)
          const adjustedYearPerFrame = yearPerFrame * (1 - easingFactor);
          
          // Calculate new year value
          const newYear = Math.min(
            endYear,
            interpolatedYear + adjustedYearPerFrame * (elapsed / msPerFrame)
          );
          
          // Update state with new year
          setInterpolatedYear(newYear);
          
          // Only update current year display when crossing integer boundary
          if (Math.floor(newYear) !== Math.floor(interpolatedYear)) {
            setCurrentYear(Math.floor(newYear));
          }
          
          // Stop at end
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
  }, [isPlaying, interpolatedYear, startYear, endYear, animationSpeed]);
  
  // Play/Pause toggle
  const togglePlayPause = () => {
    if (isPlaying) {
      setIsPlaying(false);
    } else {
      // Reset to start if at end
      if (interpolatedYear >= endYear - 0.1) {
        setInterpolatedYear(startYear);
        setCurrentYear(startYear);
      }
      setIsPlaying(true);
    }
  };
  
  // Slider handler
  const handleSliderChange = (e) => {
    const yearVal = parseFloat(e.target.value);
    setCurrentYear(Math.floor(yearVal));
    setInterpolatedYear(yearVal);
  };
  
  // Loading state
  if (isLoading) {
    return (
      <div className="vtloading-spinner">
        <div className="vtspinner"></div>
        <p style={{ marginTop: '20px', color: 'var(--text-muted)' }}>
          Loading team data...
        </p>
      </div>
    );
  }
  
  // Error state
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
    <div 
      className="vtteam-wins-chart-container" 
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        overflow: 'visible'
      }}
    >
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
        width={dynamicWidth}
        height={dynamicHeight}
        style={{ 
          background: "transparent", 
          width: '100%',
          height: 'auto',
          maxWidth: '100%',
          transition: "all 0.3s ease"
        }}
        aria-label="Team wins timeline chart"
        role="img"
        preserveAspectRatio="xMinYMin meet"
      >
        <title>Cumulative Football Wins Chart</title>
        <desc>
          Interactive bar chart showing cumulative football wins for top teams across multiple years.
        </desc>
      </svg>

      {/* Teams count indicator */}
      <div 
        style={{ 
          textAlign: 'right', 
          padding: '10px', 
          fontSize: '0.85rem', 
          color: 'var(--text-muted)',
          fontFamily: "'Titillium Web', system-ui, sans-serif" 
        }}
      >
        Showing {yearlyRankings[currentYear || startYear]?.length || 0} of top {topTeamCount} teams
      </div>
    </div>
  );
};

export default TeamWinsTimeline;