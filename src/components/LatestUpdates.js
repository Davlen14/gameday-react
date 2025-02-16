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
                <h1>Latest College Football News</h1>
                <p>Stay updated with the most recent headlines and stories.</p>
            </div>

            {/* 🔹 Main Layout - Grid + Sidebar */}
            <div className="latest-news-layout">
                {/* Left Column - Interactive News Grid */}
                <div className="latest-news-grid">
                    {loading ? (
                        <p className="loading-text">Loading news...</p>
                    ) : news.length > 0 ? (
                        news.slice(0, 6).map((article, index) => (
                            <a 
                                key={index} 
                                href={article.url} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className={`latest-news-card ${
                                    index === 0 
                                    ? "latest-big-card" 
                                    : index < 3 
                                    ? "latest-medium-card" 
                                    : "latest-small-card"
                                }`}
                            >
                                {article.image && <img src={article.image} alt={article.title} className="latest-news-image" />}
                                <div className="latest-news-overlay">
                                    <h3>{article.title}</h3>
                                    <p>{article.description}</p>
                                    <span className="latest-news-source">{article.source.name}</span>
                                </div>
                            </a>
                        ))
                    ) : (
                        <p className="no-news">No news found.</p>
                    )}
                </div>

                {/* 🔹 Right Column - Sidebar */}
                <div className="latest-news-sidebar">
                    <h2>Top Headlines</h2>
                    <ul>
                        {news.slice(6, 12).map((article, index) => (
                            <li key={index}>
                                <a href={article.url} target="_blank" rel="noopener noreferrer">
                                    {article.title}
                                </a>
                                <span className="latest-news-source">{article.source.name}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default LatestUpdates;


