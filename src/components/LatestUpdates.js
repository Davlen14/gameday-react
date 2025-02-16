import React, { useEffect, useState } from "react";
import newsService from "../services/newsService"; // Import the news API service
import "../styles/LatestUpdates.css"; // Import the updated styles

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
            {/* Hero Section */}
            <div className="hero">
                <h1>Latest College Football News</h1>
                <p>Stay updated with the most recent headlines and stories.</p>
            </div>

            {/* News Grid */}
            {loading ? (
                <p className="loading-text">Loading news...</p>
            ) : (
                <div className="news-grid">
                    {news.length > 0 ? (
                        news.map((article, index) => (
                            <a 
                                key={index} 
                                href={article.url} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="news-card"
                            >
                                {article.image && <img src={article.image} alt={article.title} className="news-image" />}
                                <div className="news-content">
                                    <h3>{article.title}</h3>
                                    <p>{article.description}</p>
                                    <span className="news-source">{article.source.name}</span>
                                </div>
                            </a>
                        ))
                    ) : (
                        <p className="no-news">No news found.</p>
                    )}
                </div>
            )}
        </div>
    );
};

export default LatestUpdates;

