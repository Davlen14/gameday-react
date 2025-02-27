import React, { useState, useEffect, useRef } from "react";
import * as d3 from "d3";
import teamsService from "../services/teamsService";

const PollsBumpChart = ({ width, height, pollType, weekRange }) => {
  const chartRef = useRef();
  const [chartData, setChartData] = useState([]);
  const [teams, setTeams] = useState([]);

  // NEW: State for dropped-out teams
  const [droppedOutTeams, setDroppedOutTeams] = useState([]);

  // Fetch teams data on mount
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

  // Convert pollType from dropdown to API value
  const mapPollType = (type) => {
    if (type === "AP Poll") return "ap";
    if (type === "Coaches Poll") return "coaches";
    if (type === "Playoff Rankings") return "cfp";
    return "ap";
  };

  // Convert weekRange string to numeric start/end weeks
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

  // Helper: Look up team info (logo/color)
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

  // Fetch poll data & transform
  useEffect(() => {
    const fetchPollData = async () => {
      try {
        const { startWeek, endWeek } = mapWeekRange(weekRange);
        const apiPollType = mapPollType(pollType);
        const weeks = [];

        for (let w = startWeek; w <= endWeek; w++) {
          const pollForWeek = await teamsService.getPolls(2024, apiPollType, w);
          // Assume pollForWeek[0] is the poll group for that week
          weeks.push(pollForWeek[0]);
        }

        // Build team-centric data: each team => array of ranks or null
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

        // After we have data, compute which teams dropped out
        const droppedOut = findDroppedOutTeams(transformedData, startWeek);
        setDroppedOutTeams(droppedOut);
      } catch (error) {
        console.error("Error fetching poll data:", error);
        // Fallback sample data
        const fallback = [
          { team: "Georgia", ranks: [1, 1, 2, 1, 1] },
          { team: "Michigan", ranks: [2, 2, 1, 2, 2] },
        ];
        setChartData(fallback);

        // Also compute fallback "dropped out"
        const droppedOut = findDroppedOutTeams(fallback, 1);
        setDroppedOutTeams(droppedOut);
      }
    };

    fetchPollData();
  }, [pollType, weekRange]);

  // D3 chart effect
  useEffect(() => {
    d3.select(chartRef.current).selectAll("*").remove();
    if (!chartData || chartData.length === 0) return;

    const { startWeek, endWeek } = mapWeekRange(weekRange);
    const totalWeeks = endWeek - startWeek + 1;

    const margin = { top: 40, right: 100, bottom: 40, left: 50 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

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

    // Y scale
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

    // line generator
    const line = d3
      .line()
      .defined((d) => d !== null)
      .x((d, i) => xScale(i + startWeek))
      .y((d) => yScale(d))
      .curve(d3.curveMonotoneX);

    // For each team, draw line & animate
    chartData.forEach((teamData) => {
      const teamInfo = getTeamInfo(teamData.team);

      const path = g
        .append("path")
        .datum(teamData.ranks)
        .attr("fill", "none")
        .attr("stroke", teamInfo.color)
        .attr("stroke-width", 2)
        .attr("d", line);

      const totalLength = path.node().getTotalLength();
      path
        .attr("stroke-dasharray", `${totalLength} ${totalLength}`)
        .attr("stroke-dashoffset", totalLength)
        .transition()
        .duration(13000)
        .ease(d3.easeLinear)
        .attr("stroke-dashoffset", 0);

      // Animate the team logo along the line
      const logo = g
        .append("image")
        .attr("xlink:href", teamInfo.logo)
        .attr("width", 20)
        .attr("height", 20);

      d3.timer((elapsed) => {
        const t = Math.min(elapsed / 13000, 1);
        const currentLength = totalLength * t;
        const point = path.node().getPointAtLength(currentLength);
        logo.attr("x", point.x - 10).attr("y", point.y - 10);
        return t === 1;
      });
    });

    // Tooltip
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

        let week = Math.round(xScale.invert(mouseX));
        week = Math.max(startWeek, Math.min(week, endWeek));
        const weekIndex = week - startWeek;

        let html = `<strong style="font-size:0.9rem;">Week ${week}</strong><br/><br/>`;
        chartData.forEach((teamData) => {
          const teamInfo = getTeamInfo(teamData.team);
          const currentRank = teamData.ranks[weekIndex];
          if (currentRank === null) return;

          let diffHTML = "";
          if (weekIndex > 0) {
            const prevRank = teamData.ranks[weekIndex - 1];
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
          }
          html += `<div style="display:flex; align-items:center; margin-bottom:4px;">
                     <img src="${teamInfo.logo}" width="16" height="16" style="margin-right:4px;" />
                     <span style="font-size:0.8rem; margin-right:4px;">${teamData.team}:</span>
                     <strong style="font-size:0.8rem;">${currentRank}</strong>
                     ${diffHTML}
                   </div>`;
        });

        // Position the tooltip
        let left = event.clientX - rect.left + 15;
        let top = event.clientY - rect.top + 15;
        const ttWidth = tooltip.node().offsetWidth;
        const ttHeight = tooltip.node().offsetHeight;

        // Adjust to prevent overflow
        if (left + ttWidth > rect.width) left = rect.width - ttWidth - 15;
        if (top + ttHeight > rect.height) top = rect.height - ttHeight - 15;

        tooltip
          .html(html)
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

  // ---------------
  // RENDER
  // ---------------
  return (
    <div className="chart-container">
      {/* Left side: the D3 SVG */}
      <div className="chart-wrapper" style={{ flex: 1 }}>
        <svg ref={chartRef}></svg>
      </div>

      {/* Right side: Dropped-Out Teams */}
      <div className="dropped-out-panel">
        <h3 style={{ marginBottom: "0.5rem" }}>Dropped Out Teams</h3>
        {droppedOutTeams.length === 0 ? (
          <div style={{ fontSize: "0.9rem", fontStyle: "italic" }}>
            None dropped out
          </div>
        ) : (
          droppedOutTeams.map((item) => (
            <div
              key={item.team}
              style={{ fontSize: "0.9rem", marginBottom: "6px" }}
            >
              <strong>{item.team}</strong> <br />
              Dropped after Week {item.droppedWeek}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

/**
 * Determine which teams dropped out, and the week they dropped out.
 * A team is considered "dropped out" if its last non-null rank is NOT in
 * the final index of the array. We'll say they dropped out the next week.
 */
function findDroppedOutTeams(chartData, startWeek) {
  const results = [];

  chartData.forEach((teamObj) => {
    const ranks = teamObj.ranks; // e.g. [1, 2, null, null, ...]
    // lastNonNullIndex => index of last rank that isn't null
    let lastNonNullIndex = -1;
    for (let i = ranks.length - 1; i >= 0; i--) {
      if (ranks[i] !== null) {
        lastNonNullIndex = i;
        break;
      }
    }
    // If lastNonNullIndex < ranks.length - 1 => they dropped out before final week
    if (lastNonNullIndex !== -1 && lastNonNullIndex < ranks.length - 1) {
      // They dropped out on the next week => startWeek + lastNonNullIndex + 1
      const droppedWeek = startWeek + lastNonNullIndex + 1;
      results.push({ team: teamObj.team, droppedWeek });
    }
  });

  return results;
}

export default PollsBumpChart;