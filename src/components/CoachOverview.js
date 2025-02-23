import React, { useState, useEffect } from "react";
import { FaUserTie } from "react-icons/fa";
import newsService from "../services/newsService";
import teamsService from "../services/teamsService"; // getCoaches is here
import youtubeService from "../services/youtubeService";
import "../styles/CoachOverview.css";

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
          coachesData,
          coachNewsData,
          footballNewsData,
          youtubeResponse1,
          youtubeResponse2,
        ] = await Promise.all([
          teamsService.getTeams(),
          teamsService.getCoaches(2023),
          newsService.fetchCollegeCoachNews(),
          newsService.fetchCollegeFootballNews(),
          youtubeService.fetchYoutubeData("college coach interviews"),
          youtubeService.fetchYoutubeData("college football coach highlights"),
        ]);

        setTeams(teamsData);
        setCoachInfo(coachesData);

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

  // Helper: Get team logo based on school name
  const getTeamLogo = (teamName) => {
    const team = teams.find(
      (t) => t.school.toLowerCase() === teamName?.toLowerCase()
    );
    return team?.logos?.[0] || "/photos/default_team.png";
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

      {/* Coach Profiles Section (Table View) */}
      <section className="coach-profiles-section">
        <h2>Coach Profiles</h2>
        {loadingCoaches ? (
          <p className="loading-text">Loading coach profiles...</p>
        ) : coachInfo.length > 0 ? (
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
                <th>Ties</th>
                <th>Preseason</th>
                <th>Postseason</th>
                <th>SRS</th>
                <th>SP Overall</th>
                <th>SP Offense</th>
                <th>SP Defense</th>
              </tr>
            </thead>
            <tbody>
              {coachInfo.map((coach, index) => {
                const season = coach.seasons?.[0] || {};
                return (
                  <tr key={index}>
                    <td>
                      <img
                        src={getTeamLogo(season.school)}
                        alt={season.school}
                        className="coach-team-logo"
                      />
                    </td>
                    <td>
                      {coach.firstName} {coach.lastName}
                    </td>
                    <td>{season.school}</td>
                    <td>
                      {coach.hireDate
                        ? new Date(coach.hireDate).toLocaleDateString()
                        : "N/A"}
                    </td>
                    <td>{season.games}</td>
                    <td>{season.wins}</td>
                    <td>{season.losses}</td>
                    <td>{season.ties}</td>
                    <td>{season.preseasonRank ?? "N/A"}</td>
                    <td>{season.postseasonRank ?? "N/A"}</td>
                    <td>{season.srs}</td>
                    <td>{season.spOverall}</td>
                    <td>{season.spOffense}</td>
                    <td>{season.spDefense}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <p>No coach profiles available.</p>
        )}
        {/* Transparent Stat Definitions Card */}
        <div className="stats-info-card">
          <h3>Stat Definitions</h3>
          <ul>
            <li>
              <strong>SRS:</strong> A measure of a team's performance relative to
              its opponents.
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