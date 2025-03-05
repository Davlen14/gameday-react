import React, { useState, useEffect } from "react";
import newsService from "../services/newsService";

const SECPage = () => {
  const [news, setNews] = useState([]);
  const [loadingNews, setLoadingNews] = useState(true);
  const [newsError, setNewsError] = useState(null);

  useEffect(() => {
    const fetchSecNews = async () => {
      try {
        setLoadingNews(true);
        // Query for SEC-specific college football news
        const data = await newsService.fetchNews("SEC conference news");
        // Depending on your API, news data might be in an "articles" array or directly returned
        setNews(data.articles || data);
      } catch (error) {
        setNewsError(error.message);
      } finally {
        setLoadingNews(false);
      }
    };
    fetchSecNews();
  }, []);

  return (
    <div className="sec-page">
      {/* Hero Section */}
      <div className="hero">
        <img src="/photos/SEC.png" alt="SEC Logo" className="sec-logo" />
        <h1>SEC Conference</h1>
        <p>Experience the passion and intensity of SEC college football.</p>
      </div>

      {/* News Section */}
      <div className="news-section">
        <h2>Latest SEC News</h2>
        {loadingNews ? (
          <p>Loading news...</p>
        ) : newsError ? (
          <p className="error">Error: {newsError}</p>
        ) : (
          <div className="news-grid">
            {news.map((article, index) => (
              <div key={index} className="news-card">
                {article.image ? (
                  <img
                    src={article.image}
                    alt={article.title}
                    className="news-image"
                  />
                ) : null}
                <h3>{article.title}</h3>
                <p>{article.description}</p>
                <a
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Read more
                </a>
              </div>
            ))}
          </div>
        )}
      </div>

      <style jsx>{`
        .sec-page {
          font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
          color: #333;
        }

        .hero {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px 20px;
          text-align: center;
          background: url('/photos/sec-background.jpg') no-repeat center center/cover;
          color: #fff;
        }

        .sec-logo {
          width: 150px;
          height: 150px;
          object-fit: contain;
          margin-bottom: 20px;
        }

        .hero h1 {
          font-size: 3rem;
          margin-bottom: 10px;
        }

        .hero p {
          font-size: 1.5rem;
          margin-bottom: 0;
        }

        .news-section {
          padding: 40px 20px;
          background: #f5f5f5;
        }

        .news-section h2 {
          text-align: center;
          margin-bottom: 30px;
          font-size: 2rem;
        }

        .error {
          color: red;
          text-align: center;
        }

        .news-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 20px;
          max-width: 1400px;
          margin: 0 auto;
        }

        .news-card {
          background: #fff;
          border-radius: 8px;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
          padding: 20px;
          transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
        }

        .news-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
        }

        .news-image {
          width: 100%;
          height: 150px;
          object-fit: cover;
          border-radius: 8px;
          margin-bottom: 15px;
        }

        .news-card h3 {
          font-size: 1.25rem;
          margin-bottom: 10px;
        }

        .news-card p {
          font-size: 1rem;
          margin-bottom: 10px;
          line-height: 1.4;
        }

        .news-card a {
          color: #D4001C;
          text-decoration: none;
          font-weight: bold;
        }

        @media (max-width: 768px) {
          .hero h1 {
            font-size: 2.5rem;
          }
          .hero p {
            font-size: 1.2rem;
          }
          .sec-logo {
            width: 120px;
            height: 120px;
          }
        }
      `}</style>
    </div>
  );
};

export default SECPage;