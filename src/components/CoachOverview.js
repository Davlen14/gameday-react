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
      acc.ties += season.ties || 0;
      acc.srs += season.srs || 0;
      acc.spOverall += season.spOverall || 0;
      acc.spOffense += season.spOffense || 0;
      acc.spDefense += season.spDefense || 0;
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

// Determine coach status based on composite score (average of SRS, SP Overall, SP Offense, SP Defense)
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

  // Sort active coaches by composite score (average of SRS, SP Overall, SP Offense, SP Defense)
  const sortedCoaches = [...coachInfo].sort((a, b) => {
    const aggA = aggregateCoachData(a.seasons);
    const aggB = aggregateCoachData(b.seasons);
    const scoreA =
      aggA.count > 0
        ? aggA.srs / aggA.count +
          aggA.spOverall / aggA.count +
          aggA.spOffense / aggA.count +
          aggA.spDefense / aggA.count
        : 0;
    const scoreB =
      aggB.count > 0
        ? aggB.srs / aggB.count +
          aggB.spOverall / aggB.count +
          aggB.spOffense / aggB.count +
          aggB.spDefense / aggB.count
        : 0;
    return scoreB - scoreA;
  });

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

      {/* Coach Profiles Section (Table View) */}
      <section className="coach-profiles-section">
        <h2>Coach Profiles (Full Career)</h2>
        {loadingCoaches ? (
          <p className="loading-text">Loading coach profiles...</p>
        ) : sortedCoaches.length > 0 ? (
          <>
            <table className="coach-table">
              <thead>
                <tr>
                  <th>Current Team</th>
                  <th>Coach Name</th>
                  <th>Games</th>
                  <th>Wins</th>
                  <th>Losses</th>
                  <th>Ties</th>
                  <th>Preseason</th>
                  <th>Postseason</th>
                  <th>SRS</th>
                  <th>SP Overall</th>
                  <th>SP Offense</th>
                  <th>SP Defense</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {sortedCoaches.map((coach, index) => {
                  // Aggregate all season data from the coach's full career
                  const agg = aggregateCoachData(coach.seasons);
                  // Use the most recent season for the current team info
                  const lastSeason =
                    coach.seasons[coach.seasons.length - 1] || {};
                  const avgSrs =
                    agg.count > 0 ? (agg.srs / agg.count).toFixed(1) : "N/A";
                  const avgSpOverall =
                    agg.count > 0 ? (agg.spOverall / agg.count).toFixed(1) : "N/A";
                  const avgSpOffense =
                    agg.count > 0 ? (agg.spOffense / agg.count).toFixed(1) : "N/A";
                  const avgSpDefense =
                    agg.count > 0 ? (agg.spDefense / agg.count).toFixed(1) : "N/A";
                  const avgPreseason =
                    agg.preseasonCount > 0
                      ? (agg.preseasonSum / agg.preseasonCount).toFixed(1)
                      : "N/A";
                  const avgPostseason =
                    agg.postseasonCount > 0
                      ? (agg.postseasonSum / agg.postseasonCount).toFixed(1)
                      : "N/A";
                  // Composite score is the sum of averages of the four stat categories
                  const compositeScore =
                    agg.count > 0
                      ? parseFloat(avgSrs) +
                        parseFloat(avgSpOverall) +
                        parseFloat(avgSpOffense) +
                        parseFloat(avgSpDefense)
                      : 0;
                  const status = getCoachStatus(compositeScore);

                  return (
                    <tr key={index}>
                      <td>
                        <div className="current-team-cell">
                          <img
                            src={getTeamLogo(lastSeason.school)}
                            alt={lastSeason.school}
                            className="coach-team-logo"
                          />
                        </div>
                      </td>
                      <td>
                        {coach.firstName} {coach.lastName}
                      </td>
                      <td>{agg.games}</td>
                      <td>{agg.wins}</td>
                      <td>{agg.losses}</td>
                      <td>{agg.ties}</td>
                      <td>{avgPreseason}</td>
                      <td>{avgPostseason}</td>
                      <td>{avgSrs}</td>
                      <td>{avgSpOverall}</td>
                      <td>{avgSpOffense}</td>
                      <td>{avgSpDefense}</td>
                      <td style={{ color: status.color, fontWeight: "bold" }}>
                        {status.text}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {/* Transparent Stat Definitions Card */}
            <div className="stats-info-card">
              <h3>Stat Definitions</h3>
              <ul>
                <li>
                  <strong>SRS:</strong> A measure of a team's performance relative to its opponents.
                </li>
                <li>
                  <strong>SP Overall:</strong> The overall statistical performance rating.
                </li>
                <li>
                  <strong>SP Offense:</strong> A rating of the team's offensive performance.
                </li>
                <li>
                  <strong>SP Defense:</strong> A rating of the team's defensive performance.
                </li>
              </ul>
            </div>
          </>
        ) : (
          <p>No coach profiles available.</p>
        )}
      </section>

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
                  <span className="news-source">{news[0].source.name}</span>
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