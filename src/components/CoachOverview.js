import React, { useState, useEffect } from "react";
import { FaUserTie } from "react-icons/fa";
import newsService from "../services/newsService";
import teamsService from "../services/teamsService";
import youtubeService from "../services/youtubeService";
import "../styles/CoachOverview.css";

const CoachOverview = () => {
  const [news, setNews] = useState([]);
  const [teams, setTeams] = useState([]);
  const [videos, setVideos] = useState([]);
  const [loadingNews, setLoadingNews] = useState(true);
  const [loadingVideos, setLoadingVideos] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [
          teamsData,
          coachNewsData,
          footballNewsData,
          youtubeResponse1,
          youtubeResponse2,
        ] = await Promise.all([
          teamsService.getTeams(),
          newsService.fetchCollegeCoachNews(),
          newsService.fetchCollegeFootballNews(),
          youtubeService.fetchYoutubeData("college coach interviews"),
          youtubeService.fetchYoutubeData("college football coach highlights"),
        ]);

        setTeams(teamsData);

        // Combine news articles from both coach and football news
        const combinedNews = [
          ...(coachNewsData.articles || []),
          ...(footballNewsData.articles || []),
        ];
        setNews(combinedNews);

        // Combine videos from both YouTube queries
        const combinedVideos = [
          ...(youtubeResponse1.items || []),
          ...(youtubeResponse2.items || []),
        ];
        setVideos(combinedVideos);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoadingNews(false);
        setLoadingVideos(false);
      }
    };

    fetchData();
  }, []);

  // Helper: Get team logo based on team name (if available)
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
          Stay updated with the latest coach news, insights, and video highlights.
        </p>
      </div>

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