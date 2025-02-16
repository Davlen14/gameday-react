import React, { useEffect, useState } from "react";
import newsService from "../services/newsService"; // Import API service
import "../styles/LatestUpdates.css"; // Import updated styles

const LatestUpdates = () => {
    const [news, setNews] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLatestNews = async () => {
            try {
                const newsData = await newsService.fetchNews();
                setNews(newsData.articles || []);
            } catch (error) {
                console.error("Error fetching news:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchLatestNews();
    }, []);

    return (
        <div className="latest-updates-container">
            {/* 🔹 Hero Section */}
            <div className="latest-hero">
                <h1>🏈 Gameday+ News</h1>
                <p>Stay updated with the latest college football headlines and analysis.</p>
            </div>

            {/* 🔹 Main Layout - Grid + Sidebar */}
            <div className="latest-news-layout">
                
                {/* 🔹 Left Column - Featured News */}
                <div className="latest-news-main">
                    {loading ? (
                        <p className="loading-text">Loading news...</p>
                    ) : news.length > 0 ? (
                        <>
                            {/* Featured Story */}
                            <div className="featured-story">
                                <a 
                                    href={news[0].url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="featured-story-card"
                                >
                                    {news[0].image && <img src={news[0].image} alt={news[0].title} className="featured-image" />}
                                    <div className="featured-details">
                                        <h2>{news[0].title}</h2>
                                        <p>{news[0].description}</p>
                                        <span className="latest-news-source">{news[0].source.name}</span>
                                    </div>
                                </a>
                            </div>

                            {/* Dual Story Row */}
                            <div className="dual-story-row">
                                {news.slice(1, 3).map((article, index) => (
                                    <a 
                                        key={index} 
                                        href={article.url} 
                                        target="_blank" 
                                        rel="noopener noreferrer" 
                                        className="dual-story-card"
                                    >
                                        {article.image && <img src={article.image} alt={article.title} className="dual-story-image" />}
                                        <div className="dual-story-details">
                                            <h3>{article.title}</h3>
                                            <span className="latest-news-source">{article.source.name}</span>
                                        </div>
                                    </a>
                                ))}
                            </div>

                            {/* Scrollable News Feed */}
                            <div className="scrollable-news">
                                {news.slice(3, 10).map((article, index) => (
                                    <a 
                                        key={index} 
                                        href={article.url} 
                                        target="_blank" 
                                        rel="noopener noreferrer" 
                                        className="scrollable-news-card"
                                    >
                                        {article.image && <img src={article.image} alt={article.title} className="scrollable-news-image" />}
                                        <div className="scrollable-news-details">
                                            <h4>{article.title}</h4>
                                            <span className="latest-news-source">{article.source.name}</span>
                                        </div>
                                    </a>
                                ))}
                            </div>
                        </>
                    ) : (
                        <p className="no-news">No news found.</p>
                    )}
                </div>

                {/* 🔹 Right Column - Sidebars */}
                <div className="latest-news-sidebar">
                    {/* Best of Gameday+ */}
                    <div className="best-of-gameday">
                        <h2>🏆 Best of Gameday+</h2>
                        <ul>
                            {news.slice(10, 15).map((article, index) => (
                                <li key={index}>
                                    <a href={article.url} target="_blank" rel="noopener noreferrer">
                                        {article.title}
                                    </a>
                                    <span className="latest-news-source">{article.source.name}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Trending Now */}
                    <div className="trending-news">
                        <h2>🔥 Trending Now</h2>
                        <ul>
                            {news.slice(15, 20).map((article, index) => (
                                <li key={index}>
                                    <a href={article.url} target="_blank" rel="noopener noreferrer">
                                        {article.title}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Trending Teams */}
                    <div className="trending-teams">
                        <h2>📈 Trending Teams</h2>
                        <ul>
                            <li>🏈 Alabama Crimson Tide</li>
                            <li>🏈 Ohio State Buckeyes</li>
                            <li>🏈 Georgia Bulldogs</li>
                            <li>🏈 Michigan Wolverines</li>
                            <li>🏈 Texas Longhorns</li>
                        </ul>
                    </div>

                    {/* CFB Video Highlights */}
                    <div className="cfb-highlights">
                        <h2>🎥 CFB Video Highlights</h2>
                        <iframe 
                            width="100%" 
                            height="200" 
                            src="https://www.youtube.com/embed/your-highlight-video-id" 
                            title="CFB Highlights"
                            frameBorder="0"
                            allowFullScreen
                        ></iframe>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LatestUpdates;



