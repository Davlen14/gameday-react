import React, { useState, useEffect } from "react";
import { FaUserTie } from "react-icons/fa";
import newsService from "../services/newsService";
import teamsService from "../services/teamsService"; // getCoaches is here
import youtubeService from "../services/youtubeService";
import "../styles/CoachOverview.css";

// Helper to aggregate season data for a coach
const aggregateCoachData = (seasons) => {
  return seasons.reduce(
    (acc, season) => {
      acc.games += season.games || 0;
      acc.wins += season.wins || 0;
      acc.losses += season.losses || 0;
      // Ties still counted internally but not displayed:
      acc.ties += season.ties || 0;

      acc.srs += season.srs || 0;
      acc.spOverall += season.spOverall || 0;
      acc.spOffense += season.spOffense || 0;
      acc.spDefense += season.spDefense || 0;
      acc.count++;
      return acc;
    },
    {
      games: 0,
      wins: 0,
      losses: 0,
      ties: 0,        // Not displayed, but included in aggregator
      srs: 0,
      spOverall: 0,
      spOffense: 0,
      spDefense: 0,
      count: 0,
    }
  );
};

// Determine coach status based on composite score 
// (average of SRS, SP Overall, SP Offense, SP Defense)
const getCoachStatus = (score) => {
  if (score >= 60) {
    return { text: "Premiere Coach", color: "green" };
  } else if (score < 40) {
    return { text: "On Hot Seat", color: "red" };
  } else {
    return { text: "Average", color: "blue" };
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
  const [selectedCoaches, setSelectedCoaches] = useState([]);

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const [
          teamsData,
          coachesData, // full career resume
          coachNewsData,
          footballNewsData,
          youtubeResponse1,
          youtubeResponse2,
        ] = await Promise.all([
          teamsService.getTeams(),
          teamsService.getCoaches(), // Removed the year parameter
          newsService.fetchCollegeCoachNews(),
          newsService.fetchCollegeFootballNews(),
          youtubeService.fetchYoutubeData("college coach interviews"),
          youtubeService.fetchYoutubeData("college football coach highlights"),
        ]);

        setTeams(teamsData);
        // Filter for active coaches only: at least one season with year 2024
        const activeCoaches = coachesData.filter((coach) =>
          coach.seasons.some((season) => season.year === 2024)
        );
        setCoachInfo(activeCoaches);

        const combinedNews = [
          ...(coachNewsData.articles || []),
          ...(footballNewsData.articles || []),
        ];
        setNews(combinedNews);

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

  // Helper: Get team logo based on school name (uses the most recent season's school)
  const getTeamLogo = (school) => {
    const team = teams.find(
      (t) => t.school.toLowerCase() === school?.toLowerCase()
    );
    return team?.logos?.[0] || "/photos/default_team.png";
  };

  // Toggle selection of a coach for comparison 
  // (Not displayed in table, but logic is kept if you want to re-add checkboxes)
  const handleSelectCoach = (coach) => {
    const coachKey = coach.firstName + coach.lastName;
    if (selectedCoaches.some((c) => (c.firstName + c.lastName) === coachKey)) {
      setSelectedCoaches(
        selectedCoaches.filter((c) => (c.firstName + c.lastName) !== coachKey)
      );
    } else {
      setSelectedCoaches([...selectedCoaches, coach]);
    }
  };

  const isCoachSelected = (coach) => {
    const coachKey = coach.firstName + coach.lastName;
    return selectedCoaches.some(
      (c) => (c.firstName + c.lastName) === coachKey
    );
  };

  // Sort active coaches by composite score (SRS + SP Overall + SP Offense + SP Defense)
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

    return scoreB - scoreA; // Highest composite score first
  });

  // Prepare comparison data for selected coaches
  const comparisonData = selectedCoaches.map((coach) => {
    const agg = aggregateCoachData(coach.seasons);

    const avgSrs =
      agg.count > 0 ? parseFloat((agg.srs / agg.count).toFixed(1)) : 0;
    const avgSpOverall =
      agg.count > 0 ? parseFloat((agg.spOverall / agg.count).toFixed(1)) : 0;
    const avgSpOffense =
      agg.count > 0 ? parseFloat((agg.spOffense / agg.count).toFixed(1)) : 0;
    const avgSpDefense =
      agg.count > 0 ? parseFloat((agg.spDefense / agg.count).toFixed(1)) : 0;

    return {
      coach,
      stats: {
        wins: agg.wins,
        losses: agg.losses,
        winPct:
          agg.games > 0
            ? parseFloat(((agg.wins / agg.games) * 100).toFixed(1))
            : 0,
        avgSrs,
        avgSpOverall,
        avgSpOffense,
        avgSpDefense,
      },
    };
  });

  // Define comparison categories and whether higher values are better
  const comparisonCategories = [
    { key: "wins", label: "Wins", better: "higher" },
    { key: "losses", label: "Losses", better: "lower" },
    { key: "winPct", label: "Win %", better: "higher" },
    { key: "avgSrs", label: "SRS", better: "higher" },
    { key: "avgSpOverall", label: "SP Overall", better: "higher" },
    { key: "avgSpOffense", label: "SP Offense", better: "higher" },
    { key: "avgSpDefense", label: "SP Defense", better: "higher" },
  ];

  // For each category, figure out best and worst among selected coaches
  const getBestWorst = (key, better) => {
    const values = comparisonData.map((data) => data.stats[key]);
    if (values.length === 0) return { best: null, worst: null };

    let best, worst;
    if (better === "higher") {
      best = Math.max(...values);
      worst = Math.min(...values);
    } else {
      best = Math.min(...values);
      worst = Math.max(...values);
    }
    return { best, worst };
  };

  return (
    <div className="coach-overview-container">
      {/* Hero Section */}
      <div className="coach-hero">
        <h1>
          <FaUserTie className="icon" /> Coach Overview
        </h1>
        <p>
          Stay updated with the latest coach profiles, news, and video highlights.
        </p>
      </div>

      {/* Coach Profiles Section (No Ties Column) */}
      <section className="coach-profiles-section">
        <h2>Coach Profiles (Full Career)</h2>
        {loadingCoaches ? (
          <p className="loading-text">Loading coach profiles...</p>
        ) : sortedCoaches.length > 0 ? (
          <>
            <div className="table-wrapper">
              <table className="coach-table">
                <thead>
                  <tr>
                    <th>Team</th>
                    <th>Coach Name</th>
                    <th>School</th>
                    <th>Hire Date</th>
                    <th>Games</th>
                    <th>Wins</th>
                    <th>Losses</th>
                    <th>Win %</th>
                    <th>SRS</th>
                    <th>SP Overall</th>
                    <th>SP Offense</th>
                    <th>SP Defense</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedCoaches.map((coach, index) => {
                    const agg = aggregateCoachData(coach.seasons);
                    // Use the most recent season for the school + logo
                    const lastSeason =
                      coach.seasons[coach.seasons.length - 1] || {};

                    // Averages for the 4 advanced stats
                    const avgSrs =
                      agg.count > 0 ? (agg.srs / agg.count).toFixed(1) : "N/A";
                    const avgSpOverall =
                      agg.count > 0
                        ? (agg.spOverall / agg.count).toFixed(1)
                        : "N/A";
                    const avgSpOffense =
                      agg.count > 0
                        ? (agg.spOffense / agg.count).toFixed(1)
                        : "N/A";
                    const avgSpDefense =
                      agg.count > 0
                        ? (agg.spDefense / agg.count).toFixed(1)
                        : "N/A";

                    // Win percentage
                    const winPct =
                      agg.games > 0
                        ? ((agg.wins / agg.games) * 100).toFixed(1)
                        : "N/A";

                    // Composite score: sum of the 4 average stats
                    const compositeScore =
                      agg.count > 0
                        ? parseFloat(avgSrs) +
                          parseFloat(avgSpOverall) +
                          parseFloat(avgSpOffense) +
                          parseFloat(avgSpDefense)
                        : 0;
                    const status = getCoachStatus(compositeScore);

                    // Format hire date to MM/YYYY
                    const hireDate = coach.hireDate
                      ? new Date(coach.hireDate).toLocaleDateString("en-US", {
                          month: "2-digit",
                          year: "numeric",
                        })
                      : "N/A";

                    return (
                      <tr key={index}>
                        <td>
                          <img
                            src={getTeamLogo(lastSeason.school)}
                            alt={lastSeason.school}
                            className="coach-team-logo"
                          />
                        </td>
                        <td>{coach.firstName} {coach.lastName}</td>
                        <td>{lastSeason.school}</td>
                        <td>{hireDate}</td>
                        <td>{agg.games}</td>
                        <td>{agg.wins}</td>
                        <td>{agg.losses}</td>
                        <td>
                          {winPct !== "N/A" ? `${winPct}%` : "N/A"}
                        </td>
                        <td>{avgSrs}</td>
                        <td>{avgSpOverall}</td>
                        <td>{avgSpOffense}</td>
                        <td>{avgSpDefense}</td>
                        <td
                          style={{
                            color: status.color,
                            fontWeight: "bold",
                          }}
                        >
                          {status.text}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Stat Definitions */}
            <div className="stats-info-card">
              <h3>Stat Definitions</h3>
              <ul>
                <li>
                  <strong>SRS:</strong> A measure of a team's performance
                  relative to its opponents.
                </li>
                <li>
                  <strong>SP Overall:</strong> The overall statistical rating.
                </li>
                <li>
                  <strong>SP Offense:</strong> A rating of the team's offensive performance.
                </li>
                <li>
                  <strong>SP Defense:</strong> A rating of the team's defensive performance.
                </li>
                <li>
                  <strong>Win %:</strong> The percentage of games won.
                </li>
              </ul>
            </div>
          </>
        ) : (
          <p>No coach profiles available.</p>
        )}
      </section>

      {/* Comparison Section (Now includes SP columns) */}
      {selectedCoaches.length > 1 && (
        <section className="coach-comparison-section">
          <h2>Coach Comparison</h2>
          <div className="table-wrapper">
            <table className="coach-table">
              <thead>
                <tr>
                  <th>Category</th>
                  {comparisonData.map((data, idx) => (
                    <th key={idx}>
                      {data.coach.firstName} {data.coach.lastName}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {comparisonCategories.map((cat) => {
                  const { best, worst } = getBestWorst(cat.key, cat.better);
                  return (
                    <tr key={cat.key}>
                      <td>{cat.label}</td>
                      {comparisonData.map((data, idx) => {
                        const value = data.stats[cat.key];
                        let style = {};
                        if (value === best) {
                          style = { color: "green", fontWeight: "bold" };
                        } else if (value === worst) {
                          style = { color: "red", fontWeight: "bold" };
                        }
                        return (
                          <td key={idx} style={style}>
                            {value}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Coach News Section */}
      <section className="coach-news-section">
        <h2>Coach News</h2>
        {loadingNews ? (
          <p className="loading-text">Loading news...</p>
        ) : news.length > 0 ? (
          <>
            {/* Featured Article */}
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
                  <span className="news-source">
                    {news[0].source.name}
                  </span>
                </div>
              </a>
            </div>
            {/* Additional News List */}
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
                    <span className="news-source">
                      {article.source.name}
                    </span>
                  </div>
                </a>
              ))}
            </div>
          </>
        ) : (
          <p>No news available.</p>
        )}
      </section>

      {/* Coach Videos Section */}
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