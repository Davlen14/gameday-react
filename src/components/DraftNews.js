import React from 'react';
import { FaFootballBall, FaExternalLinkAlt, FaUserGraduate } from 'react-icons/fa';
import { Link } from 'react-router-dom';

const DraftNews = () => {
  return (
    <div className="draft-news-container">
      {/* CSS Styles */}
      <style>
        {`
          .draft-news-container {
            max-width: 1200px;
            margin: 2rem auto;
            padding: 0 1rem;
            font-family: 'Inter', 'Roboto', sans-serif;
          }
          
          .draft-news-header {
            text-align: center;
            margin-bottom: 2rem;
            position: relative;
          }
          
          .draft-news-header h1 {
            font-size: 2.5rem;
            color: #333;
            margin-bottom: 0.5rem;
            font-weight: 700;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.75rem;
          }
          
          .draft-news-header p {
            color: #666;
            font-size: 1.1rem;
            max-width: 700px;
            margin: 0 auto;
          }
          
          .coming-soon-container {
            background-color: white;
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
            padding: 4rem 2rem;
            text-align: center;
            margin: 2rem 0;
            display: flex;
            flex-direction: column;
            align-items: center;
            border: 1px solid #eee;
          }
          
          .coming-soon-icon {
            font-size: 5rem;
            color: #D4001C;
            margin-bottom: 1.5rem;
            animation: pulse 2s infinite;
          }
          
          @keyframes pulse {
            0% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.1); opacity: 0.8; }
            100% { transform: scale(1); opacity: 1; }
          }
          
          .coming-soon-container h2 {
            font-size: 2.5rem;
            color: #333;
            margin-bottom: 1rem;
          }
          
          .coming-soon-container p {
            color: #666;
            font-size: 1.2rem;
            max-width: 600px;
            margin: 0 auto 2rem;
            line-height: 1.6;
          }
          
          .notify-button {
            padding: 0.75rem 1.5rem;
            background-color: #D4001C;
            color: white;
            border: none;
            border-radius: 30px;
            font-size: 1rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s ease;
            box-shadow: 0 4px 6px rgba(212, 0, 28, 0.2);
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
          }
          
          .notify-button:hover {
            background-color: #b80018;
            transform: translateY(-2px);
            box-shadow: 0 6px 12px rgba(212, 0, 28, 0.25);
          }
          
          @media (max-width: 768px) {
            .draft-news-header h1 {
              font-size: 2rem;
            }
            
            .coming-soon-container {
              padding: 3rem 1.5rem;
            }
            
            .coming-soon-container h2 {
              font-size: 2rem;
            }
          }
        `}
      </style>

      {/* Header */}
      <header className="draft-news-header">
        <h1>
          <FaUserGraduate />
          NFL Draft News & Projections
        </h1>
        <p>Track college football prospects, mock drafts, and player evaluations as they prepare for the NFL</p>
      </header>

      {/* Coming Soon Content */}
      <div className="coming-soon-container">
        <FaFootballBall className="coming-soon-icon" />
        <h2>Coming Soon!</h2>
        <p>
          Our draft analysis center is under construction. Soon you'll be able to explore mock drafts, 
          player profiles, and team needs all in one place. Stay tuned for comprehensive draft coverage 
          and prospect evaluations.
        </p>
        <button className="notify-button">
          Get Draft Alerts
          <FaExternalLinkAlt />
        </button>
      </div>
    </div>
  );
};

export default DraftNews;