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
    return "ap"; // fallback.
  };

  // Convert weekRange string to numeric start and end weeks.
  // Options: "Week 1 - 5", "Week 1 - 10", "Week 1 - 15"
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

  useEffect(() => {
    // Fetch polls for each week in the selected range and transform data.
    const fetchPollData = async () => {
      try {
        const { startWeek, endWeek } = mapWeekRange(weekRange);
        const apiPollType = mapPollType(pollType);
        const weeks = [];
        for (let w = startWeek; w <= endWeek; w++) {
          // Fetch poll data for week w (regular season).
          const pollForWeek = await teamsService.getPolls(2024, apiPollType, w);
          // Assume pollForWeek[0] is the poll group for that week.
          weeks.push(pollForWeek[0]);
        }

        // Transform weekly polls into a team-centric format.
        const teamsMap = {};
        weeks.forEach((pollGroup, i) => {
          // For each week, iterate over rankings.
          pollGroup.rankings.forEach((team) => {
            if (!teamsMap[team.school]) {
              // Initialize an array of length equal to number of weeks with null.
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

  useEffect(() => {
    // Clear previous chart.
    d3.select(chartRef.current).selectAll("*").remove();

    if (!chartData || chartData.length === 0) return;

    const { startWeek, endWeek } = mapWeekRange(weekRange);
    const totalWeeks = endWeek - startWeek + 1;

    // Increase right margin to give space for logos and top/bottom margins for better spacing.
    const margin = { top: 40, right: 100, bottom: 40, left: 50 },
      innerWidth = width - margin.left - margin.right,
      innerHeight = height - margin.top - margin.bottom;

    const svg = d3
      .select(chartRef.current)
      .attr("width", "100%")
      .attr("height", "100%")
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("preserveAspectRatio", "xMidYMid meet");

    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left}, ${margin.top})`);

    // X scale: domain from startWeek to endWeek.
    const xScale = d3
      .scaleLinear()
      .domain([startWeek, endWeek])
      .range([0, innerWidth]);

    // Y scale: ranking from 1 (best) to 25.
    const yScale = d3
      .scaleLinear()
      .domain([25, 1])
      .range([innerHeight, 0]);

    const xAxis = d3
      .axisBottom(xScale)
      .ticks(totalWeeks)
      .tickFormat(d3.format("d"));
    const yAxis = d3.axisLeft(yScale).ticks(25);

    g.append("g")
      .attr("transform", `translate(0, ${innerHeight})`)
      .call(xAxis);
    g.append("g").call(yAxis);

    // Define line generator that ignores null values.
    const line = d3
      .line()
      .defined((d) => d !== null)
      .x((d, i) => xScale(i + startWeek))
      .y((d) => yScale(d))
      .curve(d3.curveMonotoneX);

    // Draw a line for each team.
    chartData.forEach((teamData) => {
      const teamInfo = getTeamInfo(teamData.team);

      const path = g
        .append("path")
        .datum(teamData.ranks)
        .attr("fill", "none")
        .attr("stroke", teamInfo.color)
        .attr("stroke-width", 2)
        .attr("d", line);

      // Animate the line drawing (5 seconds).
      const totalLength = path.node().getTotalLength();
      path
        .attr("stroke-dasharray", totalLength + " " + totalLength)
        .attr("stroke-dashoffset", totalLength)
        .transition()
        .duration(5000)
        .ease(d3.easeLinear)
        .attr("stroke-dashoffset", 0);

      // Append team logo image at the end of the line.
      const lastIndex = teamData.ranks
        .map((d, i) => ({ d, i }))
        .filter((item) => item.d !== null)
        .pop()?.i;
      if (lastIndex !== undefined) {
        const lastRank = teamData.ranks[lastIndex];
        // Center the logo: subtract half of logo width/height (20px).
        g.append("image")
          .attr("xlink:href", teamInfo.logo)
          .attr("width", 20)
          .attr("height", 20)
          .attr("x", xScale(lastIndex + startWeek) - 10)
          .attr("y", yScale(lastRank) - 10);
      }
    });

    // NEW: Add hover overlay to show week and team ranks with logos.
    const tooltip = d3
      .select("body")
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

    // Overlay rectangle to capture mouse events.
    g.append("rect")
      .attr("width", innerWidth)
      .attr("height", innerHeight)
      .attr("fill", "none")
      .attr("pointer-events", "all")
      .on("mousemove", (event) => {
        const pointer = d3.pointer(event, g.node());
        const mouseX = pointer[0];
        // Determine the week based on mouse x position.
        let week = Math.round(xScale.invert(mouseX));
        week = Math.max(startWeek, Math.min(week, endWeek));
        const weekIndex = week - startWeek;

        // Build tooltip content.
        let html = `<strong style="font-size:0.9rem;">Week ${week}</strong><br/><br/>`;
        chartData.forEach((teamData) => {
          const teamInfo = getTeamInfo(teamData.team);
          const currentRank = teamData.ranks[weekIndex];
          if (currentRank === null) return; // Skip if not ranked this week

          let diffHTML = "";
          if (weekIndex > 0) {
            const prevRank = teamData.ranks[weekIndex - 1];
            if (prevRank === null) {
              diffHTML = ` <span style="color:green; font-size:0.8rem;">(newly ranked)</span>`;
            } else {
              const change = prevRank - currentRank; // positive if improved
              if (change > 0) {
                diffHTML = ` <span style="color:green; font-size:0.8rem;">↑ ${change}</span>`;
              } else if (change < 0) {
                diffHTML = ` <span style="color:red; font-size:0.8rem;">↓ ${Math.abs(change)}</span>`;
              }
            }
          }
          html += `<div style="display:flex; align-items:center; margin-bottom:4px;">
                     <img src="${teamInfo.logo}" width="16" height="16" style="margin-right:4px;" />
                     <span style="font-size:0.8rem; margin-right:4px;">${teamData.team}:</span>
                     <strong style="font-size:0.8rem;">${currentRank}</strong>
                     ${diffHTML}
                   </div>`;
        });

        tooltip
          .html(html)
          .style("left", event.pageX + 15 + "px")
          .style("top", event.pageY + 15 + "px")
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