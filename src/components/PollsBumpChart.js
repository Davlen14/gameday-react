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
      case "Week 1 - Postseason":
        // weeks 1..16, plus 1 more for postseason
        return { startWeek: 1, endWeek: 16 };
      default:
        return { startWeek: 1, endWeek: 5 };
    }
  };

  // Helper function to look up team info from fetched teams data.
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

  // Fetch poll data for the given pollType and weekRange
  useEffect(() => {
    const fetchPollData = async () => {
      try {
        const { startWeek, endWeek } = mapWeekRange(weekRange);
        const apiPollType = mapPollType(pollType);
        const weeks = [];

        // Fetch regular season polls
        for (let w = startWeek; w <= endWeek; w++) {
          const pollForWeek = await teamsService.getPolls(2024, apiPollType, w);
          if (!pollForWeek || pollForWeek.length === 0) continue;
          weeks.push(pollForWeek[0]); // assume pollForWeek[0] is the poll group
        }

        // If "Week 1 - Postseason", fetch postseason poll
        if (weekRange === "Week 1 - Postseason") {
          const postseasonPoll = await teamsService.getPolls(
            2024,
            apiPollType,
            "postseason"
          );
          if (postseasonPoll && postseasonPoll.length > 0) {
            weeks.push(postseasonPoll[0]);
          }
        }

        // Transform weekly polls into a team-centric format
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

  // Render / update the chart
  useEffect(() => {
    // Clear previous chart
    d3.select(chartRef.current).selectAll("*").remove();
    if (!chartData || chartData.length === 0) return;

    const { startWeek, endWeek } = mapWeekRange(weekRange);
    const finalWeek = weekRange === "Week 1 - Postseason" ? endWeek + 1 : endWeek;
    const totalWeeks = finalWeek - startWeek + 1;

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
      .domain([startWeek, finalWeek])
      .range([0, innerWidth]);

    // Y scale (1 is top, 25 is bottom) with increased spacing
    const yScale = d3
      .scaleLinear()
      .domain([25, 1])
      .range([innerHeight, 0]);

    // Axes
    const xAxis = d3
      .axisBottom(xScale)
      .ticks(totalWeeks)
      .tickFormat((d) => {
        if (weekRange === "Week 1 - Postseason" && d === finalWeek) {
          return "Postseason";
        }
        return d;
      });
    const yAxis = d3.axisLeft(yScale).ticks(25);

    // Draw axes
    g.append("g")
      .attr("transform", `translate(0, ${innerHeight})`)
      .call(xAxis);
    g.append("g").call(yAxis);

    // Poll logo top-right
    const pollLogos = {
      "AP Poll": "/photos/AP25.jpg",
      "Coaches Poll": "/photos/USA-Today-Logo.png",
      "Playoff Rankings": "/photos/committee.png",
    };
    const pollLogoPath = pollLogos[pollType] || pollLogos["AP Poll"];
    const logoWidth = 40;
    const logoHeight = 40;
    const logoPadding = 10;

    svg
      .append("image")
      .attr("xlink:href", pollLogoPath)
      .attr("width", logoWidth)
      .attr("height", logoHeight)
      .attr("x", width - logoWidth - logoPadding)
      .attr("y", logoPadding);

    // SHIFT BOTTOM TEXT so it's fully visible
    const bottomOffset = 20;
    const textGroup = svg.append("g")
      .attr("transform", `translate(${width - logoPadding}, ${height - bottomOffset})`);

    // 1) "Presented by" line
    textGroup
      .append("text")
      .text("Presented by")
      .attr("x", 0)
      .attr("y", 0)
      .style("font-size", "12px")
      .style("fill", "#000")
      .style("font-weight", "normal")
      .style("text-anchor", "end")
      .style("font-family", "sans-serif");

    // 2) "GAMEDAY+" line
    textGroup
      .append("text")
      .text("GAMEDAY+")
      .attr("x", 0)
      .attr("y", 16)
      .style("font-size", "12px")
      .style("fill", "#D4001C")
      .style("font-style", "italic")
      .style("font-family", "'Orbitron', 'Titillium Web', sans-serif")
      .style("text-anchor", "end");

    // Line generator
    const lineGen = d3
      .line()
      .x((d, i) => xScale(i + startWeek))
      .y((d) => yScale(d))
      .curve(d3.curveMonotoneX);

    // Shared tooltip
    const container = d3.select(chartRef.current.closest(".chart-wrapper"));
    let tooltip = container.select(".tooltip");
    if (tooltip.empty()) {
      tooltip = container
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
    }

    // Draw lines
    chartData.forEach((teamData) => {
      const teamInfo = getTeamInfo(teamData.team);
      const normalizedRanks = teamData.ranks.map((r) => (r === null ? 25 : r));

      const path = g
        .append("path")
        .datum(normalizedRanks)
        .attr("fill", "none")
        .attr("stroke", teamInfo.color)
        .attr("stroke-width", 2)
        .attr("d", lineGen);

      // Animate line
      const totalLength = path.node().getTotalLength();
      path
        .attr("stroke-dasharray", `${totalLength} ${totalLength}`)
        .attr("stroke-dashoffset", totalLength)
        .transition()
        .duration(13000)
        .ease(d3.easeLinear)
        .attr("stroke-dashoffset", 0);

      // Fade out if final rank is null
      const finalRank = teamData.ranks[teamData.ranks.length - 1];
      if (finalRank === null) {
        path.transition().delay(13000).duration(1000).style("opacity", 0);
      }

      // Team logo along the path
      const logo = g
        .append("image")
        .attr("xlink:href", teamInfo.logo)
        .attr("width", 20)
        .attr("height", 20)
        .style("opacity", 1);

      d3.timer((elapsed) => {
        const t = Math.min(elapsed / 13000, 1);
        const currentLength = totalLength * t;
        const point = path.node().getPointAtLength(currentLength);
        logo.attr("x", point.x - 10).attr("y", point.y - 10);

        // If final rank is 25, skip the fade logic near rank ~25
        if (finalRank !== 25) {
          const fadeThresholdY = yScale(24.5);
          if (point.y >= fadeThresholdY) {
            const bottomY = yScale(25);
            const fraction = (point.y - fadeThresholdY) / (bottomY - fadeThresholdY);
            logo.style("opacity", 1 - fraction);
          } else {
            logo.style("opacity", 1);
          }
        } else {
          // final rank == 25 => remain fully visible
          logo.style("opacity", 1);
        }

        return t === 1;
      });

      // Tooltip
      path
        .on("mousemove", function (event) {
          const [mx] = d3.pointer(event, g.node());
          let hoveredWeek = Math.round(xScale.invert(mx));
          hoveredWeek = Math.max(startWeek, Math.min(hoveredWeek, finalWeek));
          const hoverIndex = hoveredWeek - startWeek;

          let html = `<div style="display:flex; align-items:center; margin-bottom:8px;">
                        <img src="${teamInfo.logo}" width="20" height="20" style="margin-right:8px;" />
                        <span style="font-weight:bold;">${teamData.team}</span>
                      </div>`;
          html += `<div><strong>Ranking History (Weeks ${startWeek} - ${hoveredWeek})</strong></div>`;
          html += `<ul style="list-style:none; padding-left:0; margin:4px 0;">`;

          for (let i = 0; i <= hoverIndex; i++) {
            const weekNum = i + startWeek;
            const rank = teamData.ranks[i];
            const displayRank = rank === null ? "unranked" : rank;
            let indicator = "";
            if (i > 0) {
              const prev = teamData.ranks[i - 1];
              if (prev === null && rank !== null) {
                indicator = `<span style="color:orange; font-size:0.8rem;">snuck back in</span>`;
              } else if (prev !== null && rank !== null) {
                const change = prev - rank;
                if (change > 0) {
                  indicator = `<span style="color:green; font-size:0.8rem;">↑ ${change}</span>`;
                } else if (change < 0) {
                  indicator = `<span style="color:red; font-size:0.8rem;">↓ ${Math.abs(change)}</span>`;
                }
              }
            }
            html += `<li style="margin-bottom:4px;">Week ${weekNum}: <strong>${displayRank}</strong> ${indicator}</li>`;
          }
          html += `</ul>`;

          const rect = container.node().getBoundingClientRect();
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
            .duration(100)
            .style("opacity", 1);
        })
        .on("mouseout", function () {
          tooltip
            .transition()
            .duration(100)
            .style("opacity", 0);
        });
    });
  }, [chartData, height, width, weekRange]);

  return <svg ref={chartRef}></svg>;
};

export default PollsBumpChart;