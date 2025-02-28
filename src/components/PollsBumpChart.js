import React, { useState, useEffect, useRef } from "react";
import * as d3 from "d3";
import teamsService from "../services/teamsService";

const PollsBumpChart = ({ width, height, pollType, weekRange }) => {
  const chartRef = useRef();
  const [chartData, setChartData] = useState([]);
  const [teams, setTeams] = useState([]);

  // PHASE DURATIONS
  const mainDuration = 8000;        // Time to animate the initial lines
  const finalTransitionDuration = 5000; // Time to slide axis & show only weeks 10-15
  const totalDuration = mainDuration + finalTransitionDuration;

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
  // For simplicity, we assume 1–15 is your overall range.
  const mapWeekRange = (rangeStr) => {
    // You can adapt these as needed.
    switch (rangeStr) {
      case "Week 1 - 15":
        return { startWeek: 1, endWeek: 15 };
      default:
        return { startWeek: 1, endWeek: 15 };
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

  // Check if a team is ranked in the final weeks (10–15).
  // If they're always 25 (or unranked) in that period, we can hide them at the end.
  const isRankedInFinalWeeks = (ranks) => {
    // Weeks 10–15 means array indices 9–14 (if weeks start at 1).
    // If any rank < 25 in that range, we consider them "ranked" in the final period.
    for (let i = 9; i < 15 && i < ranks.length; i++) {
      if (ranks[i] !== null && ranks[i] < 25) {
        return true;
      }
    }
    return false;
  };

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
        // Fallback sample data for 5 weeks (adjust to 15 if needed).
        setChartData([
          { team: "Georgia", ranks: [1, 1, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1] },
          { team: "Michigan", ranks: [2, 2, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2] },
        ]);
      }
    };

    fetchPollData();
  }, [pollType, weekRange]);

  // Render / update the chart with:
  // 1) Animated lines (phase 1)
  // 2) Slower axis slide to show only weeks 10–15 (phase 2)
  // 3) Filter out teams not ranked in final weeks
  useEffect(() => {
    // Clear previous chart
    d3.select(chartRef.current).selectAll("*").remove();
    if (!chartData || chartData.length === 0) return;

    const { startWeek, endWeek } = mapWeekRange(weekRange); // e.g. 1, 15
    const mainSvg = d3
      .select(chartRef.current)
      .attr("width", "100%")
      .attr("height", "100%")
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("preserveAspectRatio", "none");

    // Margins & inner dimensions
    const margin = { top: 40, right: 80, bottom: 40, left: 50 },
      innerWidth = width - margin.left - margin.right,
      innerHeight = height - margin.top - margin.bottom;

    // Main group
    const g = mainSvg
      .append("g")
      .attr("transform", `translate(${margin.left}, ${margin.top})`);

    // X scale: start with full domain [1,15]
    const xScale = d3
      .scaleLinear()
      .domain([startWeek, endWeek]) // e.g. [1,15]
      .range([0, innerWidth]);

    // Y scale (1 is top, 25 is bottom)
    const yScale = d3
      .scaleLinear()
      .domain([25, 1])
      .range([innerHeight, 0]);

    // Axes
    const xAxis = d3.axisBottom(xScale).ticks(endWeek - startWeek + 1).tickFormat(d3.format("d"));
    const yAxis = d3.axisLeft(yScale).ticks(25);

    // Append x-axis, y-axis
    const xAxisG = g
      .append("g")
      .attr("transform", `translate(0, ${innerHeight})`)
      .call(xAxis);
    g.append("g").call(yAxis);

    // LINE GENERATOR
    const animatedLine = d3
      .line()
      .x((d) => xScale(d.week))
      .y((d) => yScale(d.rank))
      .curve(d3.curveMonotoneX);

    // PHASE 1: Animate lines from weeks 1–15
    // Store references to each path & logo so we can do a second transition later.
    const pathSelection = [];
    const logoSelection = [];

    chartData.forEach((teamData) => {
      const teamInfo = getTeamInfo(teamData.team);

      // Create path
      const path = g.append("path")
        .datum(teamData.ranks)
        .attr("fill", "none")
        .attr("stroke", teamInfo.color)
        .attr("stroke-width", 2);

      // Animate path with attrTween
      path
        .transition()
        .duration(mainDuration)
        .ease(d3.easeLinear)
        .attrTween("d", function (d) {
          return function (t) {
            const totalSegments = d.length - 1;
            const segmentDuration = 1 / totalSegments;
            let segmentIndex = Math.floor(t / segmentDuration);
            let segmentProgress = (t - segmentIndex * segmentDuration) / segmentDuration;
            if (segmentIndex >= totalSegments) {
              segmentIndex = totalSegments - 1;
              segmentProgress = 1;
            }
            // Build partial array up to current animated segment
            const points = [];
            for (let i = 0; i <= segmentIndex; i++) {
              points.push({ week: startWeek + i, rank: normalizeRank(d[i]) });
            }
            // Add an interpolated point for the current segment
            if (segmentIndex < totalSegments) {
              const currentRank = normalizeRank(d[segmentIndex]);
              const nextRank = normalizeRank(d[segmentIndex + 1]);
              const interpRank = currentRank + (nextRank - currentRank) * segmentProgress;
              const interpWeek = startWeek + segmentIndex + segmentProgress;
              points.push({ week: interpWeek, rank: interpRank });
            }
            return animatedLine(points);
          };
        });

      // Create logo
      const logo = g.append("image")
        .attr("xlink:href", teamInfo.logo)
        .attr("width", 20)
        .attr("height", 20)
        .style("opacity", 1);

      // Timer to move the logo along the line
      d3.timer((elapsed) => {
        const t = Math.min(elapsed / mainDuration, 1);
        if (t >= 1) return true; // Stop this timer at the end of Phase 1

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

        // Fade out if near 25
        if (interpolatedRank >= 24.5) {
          const fade = (interpolatedRank - 24.5) / 0.5;
          logo.style("opacity", 1 - fade);
        } else {
          logo.style("opacity", 1);
        }
      });

      // Store references for Phase 2
      pathSelection.push({ teamData, path });
      logoSelection.push({ teamData, logo });
    });

    // PHASE 2: After mainDuration, show only weeks 10–15, remove unranked teams
    // We do a delayed transition triggered once Phase 1 finishes.
    d3.timeout(() => {
      // 1) Filter out teams not ranked in weeks 10–15
      const finalChartData = chartData.filter((d) => isRankedInFinalWeeks(d.ranks));

      // 2) Update the xScale domain to [10,15]
      const finalDomain = [10, endWeek];
      xScale.domain(finalDomain);

      // 3) Animate the x-axis to show only [10,15]
      xAxisG
        .transition()
        .duration(finalTransitionDuration)
        .ease(d3.easeCubicInOut)
        .call(xAxis);

      // 4) For each path: if the team is in finalChartData, re-draw it with the new domain
      //    otherwise fade it out or remove it.
      pathSelection.forEach(({ teamData, path }) => {
        const keep = finalChartData.includes(teamData);
        if (!keep) {
          // fade out
          path
            .transition()
            .duration(finalTransitionDuration / 2)
            .style("opacity", 0)
            .remove();
        } else {
          // Re-draw line for the new domain (weeks 10–15).
          path
            .transition()
            .duration(finalTransitionDuration)
            .ease(d3.easeCubicInOut)
            .attr("d", function () {
              // Build new data points for weeks 10–15 only
              const newPoints = teamData.ranks
                .map((r, i) => ({ week: startWeek + i, rank: normalizeRank(r) }))
                .filter((p) => p.week >= 10 && p.week <= endWeek);
              return animatedLine(newPoints);
            });
        }
      });

      // 5) Do the same for logos
      logoSelection.forEach(({ teamData, logo }) => {
        const keep = finalChartData.includes(teamData);
        if (!keep) {
          // fade out
          logo
            .transition()
            .duration(finalTransitionDuration / 2)
            .style("opacity", 0)
            .remove();
        } else {
          // Move the logo to the final position in the new domain
          logo
            .transition()
            .duration(finalTransitionDuration)
            .ease(d3.easeCubicInOut)
            .attrTween("transform", function () {
              // We'll just place the logo at the last known rank in weeks 10–15
              // or we could animate it along the line. For simplicity, we jump to the last position.
              const newPoints = teamData.ranks
                .map((r, i) => ({ week: startWeek + i, rank: normalizeRank(r) }))
                .filter((p) => p.week >= 10 && p.week <= endWeek);

              // The final point is the last element in newPoints
              const finalPoint = newPoints[newPoints.length - 1];
              const finalX = xScale(finalPoint.week);
              const finalY = yScale(finalPoint.rank);

              const [startX, startY] = [+logo.attr("x"), +logo.attr("y")];
              return function (u) {
                const cx = startX + (finalX - startX) * u;
                const cy = startY + (finalY - startY) * u;
                return `translate(${cx}, ${cy})`;
              };
            });
        }
      });
    }, mainDuration); // start Phase 2 after Phase 1’s duration

    // TOOLTIP (unchanged)
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

        let hoveredWeek = Math.round(xScale.invert(mouseX));
        hoveredWeek = Math.max(startWeek, Math.min(hoveredWeek, endWeek));
        const hoveredIndex = hoveredWeek - startWeek;

        const sortedTeams = chartData
          .map((td) => ({
            ...td,
            currentRank: td.ranks[hoveredIndex] === null ? 25 : td.ranks[hoveredIndex],
            prevRank:
              hoveredIndex > 0
                ? td.ranks[hoveredIndex - 1] === null
                  ? 25
                  : td.ranks[hoveredIndex - 1]
                : null,
          }))
          .filter((d) => d.currentRank !== null)
          .sort((a, b) => a.currentRank - b.currentRank);

        let html = `<strong style="font-size:0.9rem;">Week ${hoveredWeek}</strong><br/><br/>`;
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