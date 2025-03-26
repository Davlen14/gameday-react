import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FaChartLine, FaFootballBall, FaChessBoard, FaUsers, FaUserGraduate, FaChartBar, FaStar, FaExchangeAlt } from "react-icons/fa";
import "../styles/Home.css"; // You can keep this import for any existing styles

const Home = () => {
  // State for particle animation
  const [particles, setParticles] = useState([]);
  
  // Generate particles on component mount
  useEffect(() => {
    const generateParticles = () => {
      const particleCount = 50;
      const newParticles = [];
      
      for (let i = 0; i < particleCount; i++) {
        newParticles.push({
          id: i,
          left: Math.random() * 100 + '%',
          top: Math.random() * 100 + '%',
          size: Math.random() * 3 + 1,
          duration: Math.random() * 20 + 10,
          delay: Math.random() * 10,
        });
      }
      
      setParticles(newParticles);
    };
    
    generateParticles();
  }, []);

  // Function to handle theme toggle
  const toggleTheme = () => {
    const htmlElement = document.documentElement;
    const currentTheme = htmlElement.getAttribute('data-theme') || 'dark';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    htmlElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    
    // Update theme icon
    const themeIcon = document.getElementById('themeIcon');
    if (themeIcon) {
      themeIcon.className = newTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    }
  };
  
  // Check saved theme on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme) {
      document.documentElement.setAttribute('data-theme', savedTheme);
    } else if (prefersDark) {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.setAttribute('data-theme', 'light');
    }
  }, []);

  return (
    <div className="gameday-home">
      <style jsx="true">{`
        /* Modern styling for GAMEDAY+ */
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400..900&family=Titillium+Web:ital,wght@0,200;0,300;0,400;0,600;0,700;0,900;1,200;1,300;1,400;1,600;1,700&display=swap');
        
        :root {
          /* Primary color scheme - Red */
          --accent-color: #D4001C;
          --accent-light: #FF3F58;
          --accent-dark: #990014;
          --accent-glow: rgba(212, 0, 28, 0.5);
          
          /* Dark theme colors (default) */
          --dark: #0C0F16;
          --darker: #060910;
          --text: #ffffff;
          --text-muted: rgba(255, 255, 255, 0.8);
          --text-subtle: rgba(255, 255, 255, 0.6);
          --text-faint: rgba(255, 255, 255, 0.4);
          --card-bg: rgba(12, 15, 22, 0.5);
          --section-bg: rgba(12, 15, 22, 0.4);
          --header-bg: rgba(12, 15, 22, 0.8);
          --footer-bg: rgba(6, 9, 16, 0.8);
          
          /* UI effects */
          --card-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
          --hover-shadow: 0 15px 45px rgba(0, 0, 0, 0.4);
        }
        
        /* Light theme */
        [data-theme="light"] {
          --dark: #f0f3f8;
          --darker: #e0e5ee;
          --text: #232730;
          --text-muted: rgba(35, 39, 48, 0.8);
          --text-subtle: rgba(35, 39, 48, 0.6);
          --text-faint: rgba(35, 39, 48, 0.4);
          --card-bg: rgba(255, 255, 255, 0.7);
          --section-bg: rgba(255, 255, 255, 0.5);
          --header-bg: rgba(255, 255, 255, 0.9);
          --footer-bg: rgba(240, 243, 248, 0.9);
          --accent-dark: #B80017; /* Darker red for better contrast on light bg */
          --card-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
          --hover-shadow: 0 15px 45px rgba(0, 0, 0, 0.15);
        }
        
        .gameday-home {
          font-family: "Titillium Web", sans-serif;
          background-color: var(--dark);
          color: var(--text);
          background: linear-gradient(135deg, var(--darker) 0%, var(--dark) 100%);
          min-height: 100vh;
          overflow-x: hidden;
          position: relative;
          transition: background-color 0.5s ease, color 0.5s ease;
        }
        
        .gameday-home::before {
          content: '';
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-image: 
              radial-gradient(circle at 20% 30%, var(--accent-color), transparent 20%),
              radial-gradient(circle at 80% 70%, var(--accent-color), transparent 20%);
          opacity: 0.1;
          z-index: -1;
        }
        
        .header {
          padding: 2rem 5%;
          display: flex;
          justify-content: space-between;
          align-items: center;
          backdrop-filter: blur(5px);
          border-bottom: 1px solid rgba(212, 0, 28, 0.2);
          position: fixed;
          width: 100%;
          z-index: 100;
          background-color: var(--header-bg);
        }
        
        .logo {
          font-family: "Orbitron", sans-serif;
          font-size: 2.5rem;
          font-weight: 700;
          color: var(--accent-color);
          text-transform: uppercase;
          letter-spacing: 0.2rem;
          background: linear-gradient(to right, #D4001C, #FF3F58, #D4001C, #FF3F58);
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          text-shadow: 0 0 10px rgba(212, 0, 28, 0.3);
        }
        
        [data-theme="light"] .logo {
          background: linear-gradient(to right, #B80017, #D4001C, #FF3F58, #D4001C);
          text-shadow: 0 0 10px rgba(184, 0, 23, 0.3);
        }
        
        .mode-toggle {
          position: fixed;
          top: 20px;
          right: 20px;
          z-index: 1000;
          display: flex;
          align-items: center;
          background: rgba(12, 15, 22, 0.7);
          padding: 8px 15px;
          border-radius: 30px;
          backdrop-filter: blur(5px);
          border: 1px solid rgba(212, 0, 28, 0.3);
        }
        
        [data-theme="light"] .mode-toggle {
          background: rgba(255, 255, 255, 0.7);
          border: 1px solid rgba(184, 0, 23, 0.3);
        }
        
        .mode-btn {
          background: none;
          border: none;
          color: var(--accent-color);
          cursor: pointer;
          font-size: 1.5rem;
        }
        
        .hero {
          height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: hidden;
        }
        
        .particle-visual {
          position: absolute;
          width: 100%;
          height: 100%;
          top: 0;
          left: 0;
          z-index: 1;
          pointer-events: none;
        }
        
        .particle {
          position: absolute;
          width: 2px;
          height: 2px;
          background-color: var(--accent-light);
          border-radius: 50%;
          box-shadow: 0 0 10px var(--accent-color), 0 0 20px var(--accent-color);
        }
        
        .hero-content {
          text-align: center;
          z-index: 2;
          max-width: 1200px;
          padding: 0 2rem;
        }
        
        .hero-title {
          font-family: "Orbitron", sans-serif;
          font-size: 5rem;
          font-weight: 800;
          margin-bottom: 1.5rem;
          line-height: 1.1;
          background: linear-gradient(to right, #D4001C, #FF3F58, #D4001C, #FF3F58);
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          text-shadow: 0 0 15px rgba(212, 0, 28, 0.3);
        }
        
        [data-theme="light"] .hero-title {
          background: linear-gradient(to right, #B80017, #D4001C, #FF3F58, #D4001C);
          text-shadow: 0 0 15px rgba(184, 0, 23, 0.3);
        }
        
        .hero-subtitle {
          font-size: 1.8rem;
          font-weight: 300;
          margin-bottom: 2rem;
          max-width: 800px;
          margin-left: auto;
          margin-right: auto;
          color: var(--text-muted);
        }
        
        .btn {
          display: inline-block;
          padding: 1rem 2.5rem;
          background: linear-gradient(45deg, var(--accent-dark) 0%, var(--accent-color) 100%);
          color: #ffffff;
          font-family: "Orbitron", sans-serif;
          font-weight: 600;
          text-decoration: none;
          text-transform: uppercase;
          border-radius: 50px;
          letter-spacing: 0.1rem;
          margin: 1rem;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
          box-shadow: 0 0 20px rgba(212, 0, 28, 0.5);
        }
        
        .btn:hover {
          transform: translateY(-3px);
          box-shadow: 0 0 30px rgba(212, 0, 28, 0.7);
        }
        
        .btn::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
          transition: 0.5s;
        }
        
        .btn:hover::before {
          left: 100%;
        }
        
        .sections {
          padding: 5rem 10%;
        }
        
        .section-title {
          font-family: "Orbitron", sans-serif;
          font-size: 2.5rem;
          margin-bottom: 2rem;
          text-align: center;
          color: var(--accent-color);
          position: relative;
          display: inline-block;
          left: 50%;
          transform: translateX(-50%);
        }
        
        .section-title::after {
          content: '';
          position: absolute;
          width: 50%;
          height: 3px;
          background: linear-gradient(to right, transparent, var(--accent-color), transparent);
          bottom: -10px;
          left: 25%;
        }
        
        .cards {
          display: flex;
          flex-wrap: wrap;
          gap: 2rem;
          justify-content: center;
          margin-top: 3rem;
        }
        
        .card {
          background: var(--card-bg);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(212, 0, 28, 0.2);
          border-radius: 10px;
          padding: 2rem;
          width: 300px;
          transition: all 0.3s ease, background 0.5s ease, border-color 0.5s ease;
          box-shadow: var(--card-shadow);
        }
        
        .card:hover {
          transform: translateY(-10px);
          box-shadow: var(--hover-shadow);
          border-color: var(--accent-color);
        }
        
        .card-icon {
          font-size: 3rem;
          color: var(--accent-color);
          margin-bottom: 1.5rem;
          text-align: center;
        }
        
        .card-title {
          font-family: "Orbitron", sans-serif;
          font-size: 1.5rem;
          margin-bottom: 1rem;
          color: var(--accent-light);
          text-align: center;
        }
        
        [data-theme="light"] .card-title {
          color: var(--accent-color);
        }
        
        .card-content {
          font-size: 1rem;
          line-height: 1.6;
          color: var(--text-muted);
        }
        
        .glass-section {
          background: var(--section-bg);
          backdrop-filter: blur(10px);
          border-radius: 20px;
          padding: 3rem;
          margin: 5rem 0;
          border: 1px solid rgba(212, 0, 28, 0.2);
          box-shadow: var(--card-shadow);
        }
        
        [data-theme="light"] .glass-section {
          border: 1px solid rgba(184, 0, 23, 0.2);
        }
        
        .footer {
          padding: 3rem 5%;
          text-align: center;
          background-color: var(--footer-bg);
          backdrop-filter: blur(10px);
          border-top: 1px solid rgba(212, 0, 28, 0.2);
        }
        
        .footer-links {
          display: flex;
          justify-content: center;
          gap: 2rem;
          margin-bottom: 2rem;
        }
        
        .footer-links a {
          color: var(--text-subtle);
          text-decoration: none;
          transition: color 0.3s ease;
        }
        
        .footer-links a:hover {
          color: var(--accent-color);
        }
        
        .copyright {
          color: var(--text-faint);
          font-size: 0.9rem;
        }
        
        /* Responsive adjustments */
        @media (max-width: 768px) {
          .hero-title {
            font-size: 3rem;
          }
          
          .hero-subtitle {
            font-size: 1.4rem;
          }
          
          .sections {
            padding: 3rem 5%;
          }
        }
        
        @media (max-width: 480px) {
          .hero-title {
            font-size: 2.5rem;
          }
          
          .hero-subtitle {
            font-size: 1.2rem;
          }
          
          .logo {
            font-size: 2rem;
          }
          
          .card {
            width: 100%;
          }
        }
      `}</style>
      
      {/* Mode toggle */}
      <div className="mode-toggle">
        <button className="mode-btn" onClick={toggleTheme}>
          <i id="themeIcon" className="fas fa-moon"></i>
        </button>
      </div>
      
      {/* Header */}
      <header className="header">
        <div className="logo">GAMEDAY+</div>
      </header>
      
      {/* Hero section with particles */}
      <section className="hero">
        {/* Particle visual effect */}
        <div className="particle-visual">
          {particles.map(particle => (
            <div
              key={particle.id}
              className="particle"
              style={{
                left: particle.left,
                top: particle.top,
                width: `${particle.size}px`,
                height: `${particle.size}px`,
                animation: `float ${particle.duration}s linear ${particle.delay}s infinite`
              }}
            />
          ))}
        </div>
        
        <div className="hero-content">
          <h1 className="hero-title">GAMEDAY+</h1>
          <p className="hero-subtitle">The Ultimate College Football Intelligence Platform</p>
          <Link to="/explore" className="btn">Explore Features</Link>
        </div>
      </section>
      
      {/* Features section */}
      <section id="features" className="sections">
        <h2 className="section-title">Core Features</h2>
        <div className="cards">
          <div className="card">
            <div className="card-icon">
              <FaChartLine />
            </div>
            <h3 className="card-title">Betting Edge</h3>
            <p className="card-content">
              Real-time arbitrage calculations between sportsbooks, catching profitable discrepancies instantly with historical ATS performance by team, coach, and conditions.
            </p>
          </div>
          
          <div className="card">
            <div className="card-icon">
              <FaChessBoard />
            </div>
            <h3 className="card-title">Coaching Insights</h3>
            <p className="card-content">
              Opponent tendency breakdowns showing play-calling patterns by down, distance, and game situation with advanced scheme analysis.
            </p>
          </div>
          
          <div className="card">
            <div className="card-icon">
              <FaUserGraduate />
            </div>
            <h3 className="card-title">Recruiting Intelligence</h3>
            <p className="card-content">
              Interactive recruiting map showing available talent by position, region, and star rating with scheme-specific talent matching algorithms.
            </p>
          </div>
          
          <div className="card">
            <div className="card-icon">
              <FaChartBar />
            </div>
            <h3 className="card-title">Advanced Analytics</h3>
            <p className="card-content">
              Custom visualization tools presenting complex statistics in compelling, shareable formats with advanced statistical modeling.
            </p>
          </div>
          
          <div className="card">
            <div className="card-icon">
              <FaFootballBall />
            </div>
            <h3 className="card-title">Fan Experience</h3>
            <p className="card-content">
              Personalized team dashboards delivering stats and analysis specific to favorite teams with live game threads and metrics.
            </p>
          </div>
          
          <div className="card">
            <div className="card-icon">
              <FaExchangeAlt />
            </div>
            <h3 className="card-title">Transfer Portal</h3>
            <p className="card-content">
              Transfer portal tracker with real-time updates, player compatibility analysis and destination recommendations based on fit.
            </p>
          </div>
        </div>
      </section>
      
      {/* Call to Action section */}
      <section id="cta" className="sections">
        <div className="glass-section" style={{ textAlign: 'center' }}>
          <h2 style={{ color: 'var(--accent-color)', marginBottom: '1.5rem', fontFamily: '"Orbitron", sans-serif', fontSize: '2rem' }}>
            Ready to Transform Your College Football Experience?
          </h2>
          <p style={{ fontSize: '1.2rem', marginBottom: '2rem', color: 'var(--text-muted)', maxWidth: '800px', margin: '0 auto 2rem' }}>
            Join thousands of fans, analysts, coaches, and bettors who are gaining the edge with the most comprehensive college football platform ever built.
          </p>
          <Link to="/signup" className="btn">Get Started</Link>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="footer">
        <div className="footer-links">
          <a href="#">About</a>
          <a href="#">Features</a>
          <a href="#">Pricing</a>
          <a href="#">Support</a>
          <a href="#">Privacy</a>
        </div>
        <div className="copyright">
          © 2025 GAMEDAY+ | The Ultimate College Football Intelligence Platform
        </div>
      </footer>
      
      {/* Add keyframes for particle animation */}
      <style jsx="true">{`
        @keyframes float {
          0% {
            transform: translateY(0) translateX(0);
            opacity: 0;
          }
          50% {
            opacity: 1;
          }
          100% {
            transform: translateY(-100vh) translateX(100vw);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default Home;