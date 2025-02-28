import React, { useState, useEffect, useRef } from "react";
import * as d3 from "d3";
import teamsService from "../services/teamsService";

const PollsBumpChart = ({ width, height, pollType, weekRange }) => {
  const chartRef = useRef();
  const [chartData, setChartData] = useState([]);
  const [teams, setTeams] = useState([]);

  // Fetch teams data on mount so we can look up team info.
  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const teamsData = await teamsService.getTeams();
        setTeams(teamsData);
      } catch (error) {
        console.error("Error fetching teams:", error);
      }
    };
    fetchTeams();
  }, []);

  // Convert pollType string from dropdown to API value.
  const mapPollType = (type) => {
    if (type === "AP Poll") return "ap";
    if (type === "Coaches Poll") return "coaches";
    if (type === "Playoff Rankings") return "cfp";
    return "ap"; // fallback
  };

  // Convert weekRange string to numeric start and end weeks.
  const mapWeekRange = (rangeStr) => {
    switch (rangeStr) {
      case "Week 1 - 5":
        return { startWeek: 1, endWeek: 5 };
      case "Week 1 - 10":
        return { startWeek: 1, endWeek: 10 };
      case "Week 1 - 15":
        return { startWeek: 1, endWeek: 15 };
      default:
        return { startWeek: 1, endWeek: 5 };
    }
  };

  // Helper function to look up team info from the fetched teams data.
  const getTeamInfo = (teamName) => {
    const foundTeam = teams.find(
      (t) => t.school.toLowerCase() === teamName.toLowerCase()
    );
    if (foundTeam) {
      return {
        color: foundTeam.color || "gray",
        logo:
          foundTeam.logos && foundTeam.logos[0]
            ? foundTeam.logos[0]
            : "/photos/default_team.png",
      };
    }
    return { color: "gray", logo: "/photos/default_team.png" };
  };

  // Helper: if a rank is null (i.e. unranked), treat it as 25 (the bottom of the chart)
  const normalizeRank = (rank) => (rank === null ? 25 : rank);

  // Fetch poll data for the given pollType and weekRange
  useEffect(() => {
    const fetchPollData = async () => {
      try {
        const { startWeek, endWeek } = mapWeekRange(weekRange);
        const apiPollType = mapPollType(pollType);
        const weeks = [];

        for (let w = startWeek; w <= endWeek; w++) {
          const pollForWeek = await teamsService.getPolls(2024, apiPollType, w);
          // Assume pollForWeek[0] is the poll group for that week.
          weeks.push(pollForWeek[0]);
        }

        // Transform weekly polls into a team-centric format.
        const teamsMap = {};
        weeks.forEach((pollGroup, i) => {
          pollGroup.rankings.forEach((team) => {
            if (!teamsMap[team.school]) {
              teamsMap[team.school] = new Array(weeks.length).fill(null);
            }
            teamsMap[team.school][i] = team.rank;
          });
        });

        const transformedData = Object.keys(teamsMap).map((teamName) => ({
          team: teamName,
          ranks: teamsMap[teamName],
        }));

        setChartData(transformedData);
      } catch (error) {
        console.error("Error fetching poll data:", error);
        // Fallback sample data for 5 weeks.
        setChartData([
          { team: "Georgia", ranks: [1, 1, 2, 1, 1] },
          { team: "Michigan", ranks: [2, 2, 1, 2, 2] },
        ]);
      }
    };

    fetchPollData();
  }, [pollType, weekRange]);

  // Render / update the chart with smooth week-to-week transitions and moving weeks.
  useEffect(() => {
    // Clear previous chart
    d3.select(chartRef.current).selectAll("*").remove();

    if (!chartData || chartData.length === 0) return;

    const { startWeek, endWeek } = mapWeekRange(weekRange);
    const totalWeeks = endWeek - startWeek + 1;
    const totalDuration = 13000; // total animation duration in ms

    // Margins & inner dimensions
    const margin = { top: 40, right: 100, bottom: 40, left: 50 },
      innerWidth = width - margin.left - margin.right,
      innerHeight = height - margin.top - margin.bottom;

    // Create the responsive SVG
    const svg = d3
      .select(chartRef.current)
      .attr("width", "100%")
      .attr("height", "100%")
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("preserveAspectRatio", "none");

    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left}, ${margin.top})`);

    // X scale
    const xScale = d3
      .scaleLinear()
      .domain([startWeek, endWeek])
      .range([0, innerWidth]);

    // Y scale (1 is top, 25 is bottom)
    const yScale = d3
      .scaleLinear()
      .domain([25, 1])
      .range([innerHeight, 0]);

    // Axes
    const xAxis = d3.axisBottom(xScale).ticks(totalWeeks).tickFormat(d3.format("d"));
    const yAxis = d3.axisLeft(yScale).ticks(25);

    g.append("g")
      .attr("transform", `translate(0, ${innerHeight})`)
      .call(xAxis);
    g.append("g").call(yAxis);

    // Define a line generator that accepts objects with { week, rank }
    const animatedLine = d3
      .line()
      .x((d) => xScale(d.week))
      .y((d) => yScale(d.rank))
      .curve(d3.curveMonotoneX);

    // Draw a line for each team with smooth transitions and moving weeks.
    chartData.forEach((teamData) => {
      const teamInfo = getTeamInfo(teamData.team);

      // Append path element for team line.
      const path = g.append("path")
        .datum(teamData.ranks)
        .attr("fill", "none")
        .attr("stroke", teamInfo.color)
        .attr("stroke-width", 2);

      // Animate the line using attrTween to interpolate between week data.
      path.transition()
        .duration(totalDuration)
        .ease(d3.easeLinear)
        .attrTween("d", function(d) {
          return function(t) {
            const totalSegments = d.length - 1;
            const segmentDuration = 1 / totalSegments;
            let segmentIndex = Math.floor(t / segmentDuration);
            let segmentProgress = (t - segmentIndex * segmentDuration) / segmentDuration;
            if (segmentIndex >= totalSegments) {
              segmentIndex = totalSegments - 1;
              segmentProgress = 1;
            }
            // Build points up to the current animated segment using normalized ranks.
            const points = [];
            for (let i = 0; i <= segmentIndex; i++) {
              points.push({ week: startWeek + i, rank: normalizeRank(d[i]) });
            }
            // Add an interpolated point for the current segment.
            if (segmentIndex < totalSegments) {
              const current = normalizeRank(d[segmentIndex]);
              const next = normalizeRank(d[segmentIndex + 1]);
              const interpolatedRank = current + (next - current) * segmentProgress;
              const interpolatedWeek = startWeek + segmentIndex + segmentProgress;
              points.push({ week: interpolatedWeek, rank: interpolatedRank });
            }
            return animatedLine(points);
          };
        });

      // Attach the team logo and animate its movement along the line.
      const logo = g.append("image")
        .attr("xlink:href", teamInfo.logo)
        .attr("width", 20)
        .attr("height", 20)
        .style("opacity", 1);

      // Timer to update the logo's position in sync with the line animation.
      d3.timer((elapsed) => {
        const t = Math.min(elapsed / totalDuration, 1);
        const totalSegments = teamData.ranks.length - 1;
        const segmentDuration = 1 / totalSegments;
        let segmentIndex = Math.floor(t / segmentDuration);
        let segmentProgress = (t - segmentIndex * segmentDuration) / segmentDuration;
        if (segmentIndex >= totalSegments) {
          segmentIndex = totalSegments - 1;
          segmentProgress = 1;
        }
        const current = normalizeRank(teamData.ranks[segmentIndex]);
        const next = normalizeRank(teamData.ranks[segmentIndex + 1]);
        const interpolatedRank = current + (next - current) * segmentProgress;
        const interpolatedWeek = startWeek + segmentIndex + segmentProgress;
        const x = xScale(interpolatedWeek);
        const y = yScale(interpolatedRank);
        logo.attr("x", x - 10).attr("y", y - 10);
        if (t === 1) return true; // Stop timer when animation completes.
      });
    });

    // Tooltip logic: positions the tooltip so it never overflows the container.
    const container = d3.select(chartRef.current.closest(".chart-wrapper"));
    const tooltip = container
      .append("div")
      .attr("class", "tooltip")
      .style("position", "absolute")
      .style("padding", "8px")
      .style("background", "rgba(255, 255, 255, 0.9)")
      .style("border", "1px solid #ccc")
      .style("border-radius", "4px")
      .style("pointer-events", "none")
      .style("opacity", 0)
      .style("z-index", "10000");

    g.append("rect")
      .attr("width", innerWidth)
      .attr("height", innerHeight)
      .attr("fill", "none")
      .attr("pointer-events", "all")
      .on("mousemove", (event) => {
        const rect = container.node().getBoundingClientRect();
        const [mouseX, mouseY] = d3.pointer(event, g.node());

        // Determine the hovered week based on mouse position.
        let week = Math.round(xScale.invert(mouseX));
        week = Math.max(startWeek, Math.min(week, endWeek));
        const weekIndex = week - startWeek;

        // SORTING: Build a sorted list of teams by their current rank.
        const sortedTeams = chartData
          .map((teamData) => ({
            ...teamData,
            currentRank: teamData.ranks[weekIndex] === null ? 25 : teamData.ranks[weekIndex],
            prevRank:
              weekIndex > 0
                ? teamData.ranks[weekIndex - 1] === null
                  ? 25
                  : teamData.ranks[weekIndex - 1]
                : null,
          }))
          .filter((d) => d.currentRank !== null)
          .sort((a, b) => a.currentRank - b.currentRank);

        let html = `<strong style="font-size:0.9rem;">Week ${week}</strong><br/><br/>`;
        sortedTeams.forEach((teamData) => {
          const teamInfo = getTeamInfo(teamData.team);
          const { currentRank, prevRank } = teamData;
          let diffHTML = "";
          if (prevRank === null) {
            diffHTML = ` <span style="color:green; font-size:0.8rem;">(newly ranked)</span>`;
          } else {
            const change = prevRank - currentRank;
            if (change > 0) {
              diffHTML = ` <span style="color:green; font-size:0.8rem;">↑ ${change}</span>`;
            } else if (change < 0) {
              diffHTML = ` <span style="color:red; font-size:0.8rem;">↓ ${Math.abs(change)}</span>`;
            }
          }
          html += `<div style="display:flex; align-items:center; margin-bottom:4px;">
                     <img src="${teamInfo.logo}" width="16" height="16" style="margin-right:4px;" />
                     <span style="font-size:0.8rem; margin-right:4px;">${teamData.team}:</span>
                     <strong style="font-size:0.8rem;">${currentRank}</strong>
                     ${diffHTML}
                   </div>`;
        });

        let left = event.clientX - rect.left + 15;
        let top = event.clientY - rect.top + 15;

        tooltip.html(html);
        const ttWidth = tooltip.node().offsetWidth;
        const ttHeight = tooltip.node().offsetHeight;

        if (left + ttWidth > rect.width) {
          left = rect.width - ttWidth - 15;
        }
        if (top + ttHeight > rect.height) {
          top = rect.height - ttHeight - 15;
        }

        tooltip
          .style("left", left + "px")
          .style("top", top + "px")
          .transition()
          .duration(200)
          .style("opacity", 1);
      })
      .on("mouseout", () => {
        tooltip.transition().duration(200).style("opacity", 0);
      });
  }, [chartData, height, width, weekRange]);

  return <svg ref={chartRef}></svg>;
};

export default PollsBumpChart;