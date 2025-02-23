import React, { useState, useEffect } from "react";
import { FaUserTie } from "react-icons/fa";
import newsService from "../services/newsService";
import teamsService from "../services/teamsService"; // getCoaches is here
import youtubeService from "../services/youtubeService";
import "../styles/CoachOverview.css";

// 1. Aggregator function for all seasons
const aggregateCoachData = (seasons) => {
  return seasons.reduce(
    (acc, season) => {
      acc.games += season.games || 0;
      acc.wins += season.wins || 0;
      acc.losses += season.losses || 0;
      acc.ties += season.ties || 0;
      acc.srs += season.srs || 0;
      acc.spOverall += season.spOverall || 0;
      acc.spOffense += season.spOffense || 0;
      acc.spDefense += season.spDefense || 0;

      // Keep track of Pre/Post for display
      if (season.preseasonRank != null) {
        acc.preseasonSum += season.preseasonRank;
        acc.preseasonCount++;
      }
      if (season.postseasonRank != null) {
        acc.postseasonSum += season.postseasonRank;
        acc.postseasonCount++;
      }
      acc.count++;
      return acc;
    },
    {
      games: 0,
      wins: 0,
      losses: 0,
      ties: 0,
      srs: 0,
      spOverall: 0,
      spOffense: 0,
      spDefense: 0,
      preseasonSum: 0,
      preseasonCount: 0,
      postseasonSum: 0,
      postseasonCount: 0,
      count: 0,
    }
  );
};

// 2. Coach status logic
const getCoachStatus = (score) => {
  if (score >= 60) return { text: "Premiere Coach", color: "green" };
  if (score < 40) return { text: "On Hot Seat", color: "red" };
  return { text: "Average", color: "blue" };
};

// 3. Improvement notes
const generateImprovementNotes = (avgSrs, avgSpOverall, avgSpOffense, avgSpDefense) => {
  const notes = [];
  if (avgSrs !== "N/A" && parseFloat(avgSrs) < 15) notes.push("Improve SRS");
  if (avgSpOverall !== "N/A" && parseFloat(avgSpOverall) < 15) notes.push("Boost Overall Performance");
  if (avgSpOffense !== "N/A" && parseFloat(avgSpOffense) < 30) notes.push("Enhance Offensive Production");
  if (avgSpDefense !== "N/A" && parseFloat(avgSpDefense) < 30) notes.push("Strengthen Defensive Efficiency");
  return notes.length > 0 ? notes.join(", ") : "Excellent performance across all categories";
};

// 4. Metric helper for comparison
const getMetricValue = (coach, metricKey) => {
  const agg = aggregateCoachData(coach.seasons);
  switch (metricKey) {
    case "games":       return agg.games;
    case "wins":        return agg.wins;
    case "losses":      return agg.losses;
    case "ties":        return agg.ties;
    case "winPct":      return agg.games > 0 ? Number(((agg.wins / agg.games) * 100).toFixed(1)) : null;
    case "preseason":   return agg.preseasonCount > 0 ? Number((agg.preseasonSum / agg.preseasonCount).toFixed(1)) : null;
    case "postseason":  return agg.postseasonCount > 0 ? Number((agg.postseasonSum / agg.postseasonCount).toFixed(1)) : null;
    case "srs":         return agg.count > 0 ? Number((agg.srs / agg.count).toFixed(1)) : null;
    case "spOverall":   return agg.count > 0 ? Number((agg.spOverall / agg.count).toFixed(1)) : null;
    case "spOffense":   return agg.count > 0 ? Number((agg.spOffense / agg.count).toFixed(1)) : null;
    case "spDefense":   return agg.count > 0 ? Number((agg.spDefense / agg.count).toFixed(1)) : null;
    default:            return null;
  }
};

const CoachOverview = () => {
  const [coachInfo, setCoachInfo] = useState([]);
  const [news, setNews] = useState([]);
  const [teams, setTeams] = useState([]);
  const [videos, setVideos] = useState([]);
  const [loadingCoaches, setLoadingCoaches] = useState(true);
  const [loadingNews, setLoadingNews] = useState(true);
  const [loadingVideos, setLoadingVideos] = useState(true);
  const [filterText, setFilterText] = useState("");
  const [selectedCoaches, setSelectedCoaches] = useState([]);

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const [
          teamsData,
          coachesData,
          coachNewsData,
          footballNewsData,
          youtubeResponse1,
          youtubeResponse2,
        ] = await Promise.all([
          teamsService.getTeams(),
          teamsService.getCoaches(),
          newsService.fetchCollegeCoachNews(),
          newsService.fetchCollegeFootballNews(),
          youtubeService.fetchYoutubeData("college coach interviews"),
          youtubeService.fetchYoutubeData("college football coach highlights"),
        ]);

        setTeams(teamsData);
        // Only show coaches with at least one season in 2024
        const activeCoaches = coachesData.filter((coach) =>
          coach.seasons.some((s) => s.year === 2024)
        );
        setCoachInfo(activeCoaches);

        // Merge coach news + general football news
        const combinedNews = [
          ...(coachNewsData.articles || []),
          ...(footballNewsData.articles || []),
        ];
        setNews(combinedNews);

        // Merge both sets of YT videos
        const combinedVideos = [
          ...(youtubeResponse1.items || []),
          ...(youtubeResponse2.items || []),
        ];
        setVideos(combinedVideos);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoadingCoaches(false);
        setLoadingNews(false);
        setLoadingVideos(false);
      }
    };
    fetchAllData();
  }, []);

  // Team logo helper
  const getTeamLogo = (school) => {
    const team = teams.find((t) => t.school.toLowerCase() === school?.toLowerCase());
    return team?.logos?.[0] || "/photos/default_team.png";
  };

  // Sort coaches by composite
  const sortedCoaches = [...coachInfo].sort((a, b) => {
    const aggA = aggregateCoachData(a.seasons);
    const aggB = aggregateCoachData(b.seasons);
    const scoreA =
      aggA.count > 0
        ? (aggA.srs + aggA.spOverall + aggA.spOffense + aggA.spDefense) / aggA.count
        : 0;
    const scoreB =
      aggB.count > 0
        ? (aggB.srs + aggB.spOverall + aggB.spOffense + aggB.spDefense) / aggB.count
        : 0;
    return scoreB - scoreA;
  });

  // Filter
  const filteredCoaches = sortedCoaches.filter((coach) => {
    const fullName = `${coach.firstName} ${coach.lastName}`.toLowerCase();
    const currentTeam = coach.seasons[coach.seasons.length - 1]?.school.toLowerCase() || "";
    return (
      fullName.includes(filterText.toLowerCase()) ||
      currentTeam.includes(filterText.toLowerCase())
    );
  });

  // Checkbox
  const handleCheckboxChange = (coach, isChecked) => {
    if (isChecked) setSelectedCoaches([...selectedCoaches, coach]);
    else setSelectedCoaches(selectedCoaches.filter((c) => c !== coach));
  };

  // Lower is better for these metrics
  const lowerBetter = {
    losses: true,
    ties: true,
    spDefense: true,
  };

  // Comparison table
  const renderComparisonTable = () => {
    const metrics = [
      { key: "games", label: "Games" },
      { key: "wins", label: "Wins" },
      { key: "losses", label: "Losses" },
      { key: "ties", label: "Ties" },
      { key: "winPct", label: "Win %" },
      { key: "preseason", label: "Preseason" },
      { key: "postseason", label: "Postseason" },
      { key: "srs", label: "SRS" },
      { key: "spOverall", label: "SP Overall" },
      { key: "spOffense", label: "SP Offense" },
      { key: "spDefense", label: "SP Defense" },
      { key: "status", label: "Status" },
      { key: "notes", label: "Notes" },
    ];

    // Compute best values
    const bestValues = {};
    metrics.forEach((metric) => {
      if (metric.key === "status" || metric.key === "notes") return;
      const values = selectedCoaches
        .map((coach) => getMetricValue(coach, metric.key))
        .filter((val) => val !== null);
      if (values.length > 0) {
        bestValues[metric.key] = lowerBetter[metric.key]
          ? Math.min(...values)
          : Math.max(...values);
      }
    });

    return (
      <div className="comparison-section">
        <h2>Coach Comparison</h2>
        <div className="table-container">
          <table className="comparison-table">
            <thead>
              <tr>
                <th>Metric</th>
                {selectedCoaches.map((coach, i) => (
                  <th key={i}>{coach.firstName} {coach.lastName}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {metrics.map((metric) => (
                <tr key={metric.key}>
                  <td style={{ fontWeight: "bold", textTransform: "capitalize" }}>
                    {metric.label}
                  </td>
                  {selectedCoaches.map((coach, idx) => {
                    const numericValue = getMetricValue(coach, metric.key);
                    let displayValue = numericValue;

                    // Display "Win %" properly
                    if (metric.key === "winPct" && numericValue !== null) {
                      displayValue = numericValue.toFixed(1) + "%";
                    }

                    // Status/Notes handle differently
                    if (metric.key === "status") {
                      const agg = aggregateCoachData(coach.seasons);
                      const avgSrs =
                        agg.count > 0 ? (agg.srs / agg.count).toFixed(1) : "0";
                      const avgSpOverall =
                        agg.count > 0 ? (agg.spOverall / agg.count).toFixed(1) : "0";
                      const avgSpOffense =
                        agg.count > 0 ? (agg.spOffense / agg.count).toFixed(1) : "0";
                      const avgSpDefense =
                        agg.count > 0 ? (agg.spDefense / agg.count).toFixed(1) : "0";
                      const compositeScore =
                        parseFloat(avgSrs) +
                        parseFloat(avgSpOverall) +
                        parseFloat(avgSpOffense) +
                        parseFloat(avgSpDefense);
                      const st = getCoachStatus(compositeScore);
                      return (
                        <td key={idx} style={{ color: st.color, fontWeight: "bold" }}>
                          {st.text}
                        </td>
                      );
                    } else if (metric.key === "notes") {
                      const agg = aggregateCoachData(coach.seasons);
                      const asrs =
                        agg.count > 0 ? (agg.srs / agg.count).toFixed(1) : "N/A";
                      const aOvr =
                        agg.count > 0 ? (agg.spOverall / agg.count).toFixed(1) : "N/A";
                      const aOff =
                        agg.count > 0 ? (agg.spOffense / agg.count).toFixed(1) : "N/A";
                      const aDef =
                        agg.count > 0 ? (agg.spDefense / agg.count).toFixed(1) : "N/A";
                      const notes = generateImprovementNotes(asrs, aOvr, aOff, aDef);
                      return <td key={idx}>{notes}</td>;
                    }

                    // For numeric metrics, color best/worst
                    const cellStyle = {};
                    if (numericValue !== null && bestValues[metric.key] !== undefined) {
                      if (numericValue === bestValues[metric.key]) {
                        cellStyle.color = "green";
                      } else {
                        cellStyle.color = "red";
                      }
                    }

                    return (
                      <td key={idx} style={cellStyle}>
                        {displayValue !== null && displayValue !== undefined
                          ? displayValue
                          : "N/A"}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="coach-overview-container">
      {/* Hero */}
      <div className="coach-hero">
        <h1><FaUserTie className="icon" /> Coach Overview</h1>
        <p>Stay updated with the latest coach profiles, news, and video highlights.</p>
      </div>

      {/* Filter */}
      <div className="filter-section">
        <input
          type="text"
          placeholder="Filter by coach name or current team..."
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
        />
      </div>

      {/* Comparison Table (if 2+ selected) */}
      {selectedCoaches.length >= 2 && renderComparisonTable()}

      {/* Main Coach Profiles */}
      <section className="coach-profiles-section">
        <h2>Coach Profiles (Full Career)</h2>
        {loadingCoaches ? (
          <p className="loading-text">Loading coach profiles...</p>
        ) : filteredCoaches.length > 0 ? (
          <div className="table-container">
            <table className="coach-table">
              <thead>
                <tr>
                  <th>Select</th>
                  <th>Current Team</th>
                  <th>Coach Name</th>
                  <th>Games</th>
                  <th>Wins</th>
                  <th>Losses</th>
                  <th>Ties</th>
                  <th>Win %</th>
                  <th>Preseason</th>
                  <th>Postseason</th>
                  <th>SRS</th>
                  <th>SP Overall</th>
                  <th>SP Offense</th>
                  <th>SP Defense</th>
                  <th>Status</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {filteredCoaches.map((coach, index) => {
                  const agg = aggregateCoachData(coach.seasons);
                  const lastSeason = coach.seasons[coach.seasons.length - 1] || {};

                  // Quick calculations
                  const avgSrs = agg.count > 0 ? (agg.srs / agg.count).toFixed(1) : "N/A";
                  const avgSpOverall = agg.count > 0 ? (agg.spOverall / agg.count).toFixed(1) : "N/A";
                  const avgSpOffense = agg.count > 0 ? (agg.spOffense / agg.count).toFixed(1) : "N/A";
                  const avgSpDefense = agg.count > 0 ? (agg.spDefense / agg.count).toFixed(1) : "N/A";
                  const avgPreseason = agg.preseasonCount > 0
                    ? (agg.preseasonSum / agg.preseasonCount).toFixed(1)
                    : "N/A";
                  const avgPostseason = agg.postseasonCount > 0
                    ? (agg.postseasonSum / agg.postseasonCount).toFixed(1)
                    : "N/A";
                  const winPct = agg.games > 0
                    ? ((agg.wins / agg.games) * 100).toFixed(1) + "%"
                    : "N/A";

                  const compositeScore =
                    (parseFloat(avgSrs) || 0) +
                    (parseFloat(avgSpOverall) || 0) +
                    (parseFloat(avgSpOffense) || 0) +
                    (parseFloat(avgSpDefense) || 0);
                  const status = getCoachStatus(compositeScore);
                  const notes = generateImprovementNotes(avgSrs, avgSpOverall, avgSpOffense, avgSpDefense);

                  return (
                    <tr key={index}>
                      <td>
                        <input
                          type="checkbox"
                          onChange={(e) => handleCheckboxChange(coach, e.target.checked)}
                          checked={selectedCoaches.includes(coach)}
                        />
                      </td>
                      <td>
                        <div className="current-team-cell">
                          <img
                            src={getTeamLogo(lastSeason.school)}
                            alt={lastSeason.school}
                            className="coach-team-logo"
                          />
                        </div>
                      </td>
                      <td>{coach.firstName} {coach.lastName}</td>
                      <td>{agg.games}</td>
                      <td>{agg.wins}</td>
                      <td>{agg.losses}</td>
                      <td>{agg.ties}</td>
                      <td>{winPct}</td>
                      <td>{avgPreseason}</td>
                      <td>{avgPostseason}</td>
                      <td>{avgSrs}</td>
                      <td>{avgSpOverall}</td>
                      <td>{avgSpOffense}</td>
                      <td>{avgSpDefense}</td>
                      <td style={{ color: status.color, fontWeight: "bold" }}>
                        {status.text}
                      </td>
                      <td>{notes}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p>No coach profiles available.</p>
        )}

        {/* Definitions Card */}
        {!loadingCoaches && filteredCoaches.length > 0 && (
          <div className="stats-info-card">
            <h3>Stat Definitions</h3>
            <ul>
              <li><strong>SRS:</strong> A measure of a team's performance relative to opponents.</li>
              <li><strong>SP Overall:</strong> The overall statistical performance rating.</li>
              <li><strong>SP Offense:</strong> A rating of the team's offensive performance.</li>
              <li><strong>SP Defense:</strong> A rating of the team's defensive performance.</li>
              <li><strong>Win %:</strong> Percentage of games won.</li>
              <li><strong>Preseason:</strong> Average preseason ranking across seasons (if available).</li>
              <li><strong>Postseason:</strong> Average postseason ranking across seasons (if available).</li>
            </ul>
          </div>
        )}
      </section>

      {/* News Section */}
      <section className="coach-news-section">
        <h2>Coach News</h2>
        {loadingNews ? (
          <p className="loading-text">Loading news...</p>
        ) : news.length > 0 ? (
          <>
            <div className="featured-news">
              <a
                href={news[0].url}
                target="_blank"
                rel="noopener noreferrer"
                className="featured-news-card"
              >
                {news[0].image && (
                  <img
                    src={news[0].image}
                    alt={news[0].title}
                    className="featured-image"
                  />
                )}
                <div className="featured-news-details">
                  <h3>{news[0].title}</h3>
                  <p>{news[0].description}</p>
                  <span className="news-source">{news[0].source.name}</span>
                </div>
              </a>
            </div>
            <div className="news-list">
              {news.slice(1, 5).map((article, idx) => (
                <a
                  key={idx}
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="news-card"
                >
                  {article.image && (
                    <img
                      src={article.image}
                      alt={article.title}
                      className="news-image"
                    />
                  )}
                  <div className="news-details">
                    <h4>{article.title}</h4>
                    <span className="news-source">{article.source.name}</span>
                  </div>
                </a>
              ))}
            </div>
          </>
        ) : (
          <p>No news available.</p>
        )}
      </section>

      {/* Videos */}
      <section className="coach-videos-section">
        <h2>Coach Videos</h2>
        {loadingVideos ? (
          <p className="loading-text">Loading videos...</p>
        ) : videos.length > 0 ? (
          <div className="video-grid">
            {videos.map((video) => (
              <div key={video.id.videoId} className="video-card">
                <iframe
                  width="100%"
                  height="200"
                  src={`https://www.youtube.com/embed/${video.id.videoId}`}
                  title={video.snippet.title}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              </div>
            ))}
          </div>
        ) : (
          <p>No videos available.</p>
        )}
      </section>
    </div>
  );
};

export default CoachOverview;