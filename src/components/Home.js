import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { 
  FaChartLine, FaFootballBall, FaChessBoard, FaUsers, FaUserGraduate, FaChartBar, 
  FaExchangeAlt, FaTrophy, FaPercentage, FaSearchDollar, FaRegChartBar, FaChartPie,
  FaRegNewspaper, FaMapMarkedAlt, FaUserAlt, FaDesktop, FaDatabase, FaCog, FaRegLightbulb,
  FaStar, FaUniversity, FaFilter, FaTachometerAlt, FaMoneyBillWave, FaHistory, FaNetworkWired,
  FaBell, FaComments
} from "react-icons/fa";

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
          --circle-border: rgba(212, 0, 28, 0.2);
          --circle-opacity: 0.7;
          --card-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
          --hover-shadow: 0 15px 45px rgba(0, 0, 0, 0.4);
        }
        
        /* Light theme if needed */
        [data-theme="light"] {
          --dark: #f0f3f8;
          --darker: #e0e5ee;
          --text: #232730;
          --text-muted: rgba(35, 39, 48, 0.8);
          --text-subtle: rgba(35, 39, 48, 0.6);
          --text-faint: rgba(35, 39, 48, 0.4);
          --accent-dark: #B80017;
          --card-bg: rgba(255, 255, 255, 0.7);
          --section-bg: rgba(255, 255, 255, 0.5);
          --circle-border: rgba(212, 0, 28, 0.3);
          --circle-opacity: 0.5;
          --card-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
          --hover-shadow: 0 15px 45px rgba(0, 0, 0, 0.15);
        }
        
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        .gameday-home {
          font-family: "Titillium Web", sans-serif;
          background-color: var(--dark);
          color: var(--text);
          background: linear-gradient(135deg, var(--darker) 0%, var(--dark) 100%);
          min-height: 100vh;
          width: 100%;
          overflow-x: hidden;
          position: relative;
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
          opacity: 0.05;
          z-index: -1;
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
        
        .hero {
          height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: hidden;
          width: 100%;
        }
        
        .hero-content {
          text-align: center;
          z-index: 2;
          max-width: 1200px;
          padding: 0 2rem;
          position: relative;
        }
        
        /* Quantum circle visualization */
        .quantum-circle {
          position: absolute;
          width: 500px;
          height: 500px;
          border-radius: 50%;
          border: 2px solid var(--circle-border);
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          box-shadow: 0 0 50px var(--circle-border);
          opacity: var(--circle-opacity);
          animation: rotate 20s linear infinite;
          z-index: 1;
        }
        
        .quantum-circle::before,
        .quantum-circle::after {
          content: '';
          position: absolute;
          width: 100%;
          height: 100%;
          border-radius: 50%;
          border: 2px solid var(--circle-border);
          top: 0;
          left: 0;
          animation: pulse 4s ease-in-out infinite alternate;
        }
        
        .quantum-circle::after {
          animation-delay: 2s;
        }
        
        @keyframes rotate {
          from {
            transform: translate(-50%, -50%) rotate(0deg);
          }
          to {
            transform: translate(-50%, -50%) rotate(360deg);
          }
        }
        
        @keyframes pulse {
          from {
            transform: scale(0.8);
            opacity: 0.2;
          }
          to {
            transform: scale(1.2);
            opacity: 0.8;
          }
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
          text-transform: uppercase;
          position: relative;
          z-index: 2;
        }
        
        .hero-subtitle {
          font-size: 1.8rem;
          font-weight: 300;
          margin-bottom: 3rem;
          max-width: 800px;
          margin-left: auto;
          margin-right: auto;
          color: var(--text-muted);
          position: relative;
          z-index: 2;
        }
        
        .explore-btn {
          display: inline-block;
          padding: 1rem 2.5rem;
          background: var(--accent-color);
          color: #ffffff;
          font-family: "Orbitron", sans-serif;
          font-weight: 600;
          text-decoration: none;
          text-transform: uppercase;
          border-radius: 50px;
          letter-spacing: 0.1rem;
          transition: all 0.3s ease;
          position: relative;
          z-index: 2;
          border: none;
          cursor: pointer;
          font-size: 1rem;
          box-shadow: 0 0 20px rgba(212, 0, 28, 0.5);
        }
        
        .explore-btn:hover {
          transform: translateY(-3px);
          box-shadow: 0 0 30px rgba(212, 0, 28, 0.7);
        }
        
        .explore-btn::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
          transition: 0.5s;
        }
        
        .explore-btn:hover::before {
          left: 100%;
        }
        
        /* Sections styling */
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
          transition: color 0.5s ease;
        }
        
        .section-title::after {
          content: '';
          position: absolute;
          width: 50%;
          height: 3px;
          background: linear-gradient(to right, transparent, var(--accent-color), transparent);
          bottom: -10px;
          left: 25%;
          transition: background 0.5s ease;
        }
        
        .glass-section {
          background: var(--section-bg);
          backdrop-filter: blur(10px);
          border-radius: 20px;
          padding: 3rem;
          margin: 5rem 0;
          border: 1px solid rgba(212, 0, 28, 0.2);
          box-shadow: var(--card-shadow);
          transition: background-color 0.5s ease, border-color 0.5s ease, box-shadow 0.5s ease;
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
          transition: color 0.5s ease;
        }
        
        .card-title {
          font-family: "Orbitron", sans-serif;
          font-size: 1.5rem;
          margin-bottom: 1rem;
          color: var(--accent-light);
          text-align: center;
          transition: color 0.5s ease;
        }
        
        [data-theme="light"] .card-title {
          color: var(--accent-color);
        }
        
        .card-content {
          font-size: 1rem;
          line-height: 1.6;
          color: var(--text-muted);
          transition: color 0.5s ease;
        }
        
        .feature-item {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1rem;
          color: var(--text-muted);
        }
        
        .feature-icon {
          color: var(--accent-color);
          font-size: 1.2rem;
          flex-shrink: 0;
        }
        
        .feature-section {
          margin-bottom: 4rem;
        }
        
        .feature-section-title {
          font-family: "Orbitron", sans-serif;
          font-size: 1.8rem;
          margin-bottom: 2rem;
          color: var(--accent-color);
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        
        .feature-section-icon {
          font-size: 2rem;
        }
        
        .feature-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
          gap: 1.5rem;
        }
        
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
        
        .footer {
          padding: 3rem 5%;
          text-align: center;
          color: var(--text-faint);
          margin-top: 4rem;
          background-color: var(--section-bg);
          backdrop-filter: blur(10px);
          border-top: 1px solid rgba(212, 0, 28, 0.2);
        }
        
        /* Responsive adjustments */
        @media (max-width: 768px) {
          .hero-title {
            font-size: 3.5rem;
          }
          
          .hero-subtitle {
            font-size: 1.4rem;
          }
          
          .quantum-circle {
            width: 400px;
            height: 400px;
          }
          
          .sections {
            padding: 3rem 5%;
          }
          
          .feature-grid {
            grid-template-columns: 1fr;
          }
        }
        
        @media (max-width: 480px) {
          .hero-title {
            font-size: 2.5rem;
          }
          
          .hero-subtitle {
            font-size: 1.2rem;
          }
          
          .quantum-circle {
            width: 300px;
            height: 300px;
          }
          
          .glass-section {
            padding: 2rem 1.5rem;
          }
        }
      `}</style>
      
      {/* Hero section with particles and quantum circle */}
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
          {/* Quantum circle animation */}
          <div className="quantum-circle"></div>
          
          <h1 className="hero-title">Welcome to Gameday+</h1>
          <p className="hero-subtitle">The Ultimate College Football Intelligence Platform</p>
          <Link to="/explore" className="explore-btn">Explore Features</Link>
        </div>
      </section>
      
      {/* Main Features Overview Section */}
      <section id="features" className="sections">
        <h2 className="section-title">Core Platform</h2>
        <div className="cards">
          <div className="card">
            <div className="card-icon">
              <FaChartLine />
            </div>
            <h3 className="card-title">Advanced Analytics</h3>
            <p className="card-content">
              Powerful data processing engine analyzing 24 years of football data to reveal insights across teams, players, and conferences.
            </p>
          </div>
          
          <div className="card">
            <div className="card-icon">
              <FaSearchDollar />
            </div>
            <h3 className="card-title">Betting Intelligence</h3>
            <p className="card-content">
              Real-time arbitrage calculation and line movement analysis to identify profitable betting opportunities instantly.
            </p>
          </div>
          
          <div className="card">
            <div className="card-icon">
              <FaMapMarkedAlt />
            </div>
            <h3 className="card-title">Recruiting Visualization</h3>
            <p className="card-content">
              Interactive mapping of talent by position, region, and star rating with scheme-specific matching algorithms.
            </p>
          </div>
          
          <div className="card">
            <div className="card-icon">
              <FaChessBoard />
            </div>
            <h3 className="card-title">Coaching Insights</h3>
            <p className="card-content">
              Performance matrices measuring true coaching impact separate from talent advantages and team history.
            </p>
          </div>
          
          <div className="card">
            <div className="card-icon">
              <FaExchangeAlt />
            </div>
            <h3 className="card-title">Transfer Portal Tools</h3>
            <p className="card-content">
              Comprehensive tracking and compatibility analysis to identify optimal program fits for players in the portal.
            </p>
          </div>
        </div>
      </section>
      
      {/* Detailed Features Sections */}
      <section id="detailed-features" className="sections">
        <div className="glass-section">
          {/* For Bettors Section */}
          <div className="feature-section">
            <h3 className="feature-section-title">
              <FaPercentage className="feature-section-icon" />
              For Bettors
            </h3>
            <div className="feature-grid">
              <div className="feature-item">
                <FaRegChartBar className="feature-icon" />
                <div>
                  <strong>Real-time Arbitrage Calculator</strong>
                  <p>Instantly identify profitable discrepancies between sportsbooks</p>
                </div>
              </div>
              
              <div className="feature-item">
                <FaHistory className="feature-icon" />
                <div>
                  <strong>Historical ATS Performance</strong>
                  <p>Searchable by team, coach, weather, time and matchup conditions</p>
                </div>
              </div>
              
              <div className="feature-item">
                <FaTachometerAlt className="feature-icon" />
                <div>
                  <strong>Situational Betting Trends</strong>
                  <p>Visualize how teams perform as home/away favorites/underdogs</p>
                </div>
              </div>
              
              <div className="feature-item">
                <FaFilter className="feature-icon" />
                <div>
                  <strong>Coverage Consistency Metrics</strong>
                  <p>Identify which teams reliably cover in specific situations</p>
                </div>
              </div>
              
              <div className="feature-item">
                <FaChartPie className="feature-icon" />
                <div>
                  <strong>Line Movement Analysis</strong>
                  <p>Predictive indicators for sharp money influence and value spots</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* For Coaches Section */}
          <div className="feature-section">
            <h3 className="feature-section-title">
              <FaChessBoard className="feature-section-icon" />
              For Coaches & Recruiters
            </h3>
            <div className="feature-grid">
              <div className="feature-item">
                <FaMapMarkedAlt className="feature-icon" />
                <div>
                  <strong>Interactive Recruiting Map</strong>
                  <p>Visualize available talent by position, region, and star rating</p>
                </div>
              </div>
              
              <div className="feature-item">
                <FaExchangeAlt className="feature-icon" />
                <div>
                  <strong>Transfer Portal Tracker</strong>
                  <p>Real-time updates and player compatibility analysis</p>
                </div>
              </div>
              
              <div className="feature-item">
                <FaUserAlt className="feature-icon" />
                <div>
                  <strong>Scheme-Specific Talent Matching</strong>
                  <p>Identify recruits who align with specific offensive/defensive systems</p>
                </div>
              </div>
              
              <div className="feature-item">
                <FaCog className="feature-icon" />
                <div>
                  <strong>Opponent Tendency Breakdowns</strong>
                  <p>Play-calling patterns by down, distance, and game situation</p>
                </div>
              </div>
              
              <div className="feature-item">
                <FaRegLightbulb className="feature-icon" />
                <div>
                  <strong>Development Metrics</strong>
                  <p>Track how effectively programs develop 3-star talent into NFL prospects</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* For Analysts Section */}
          <div className="feature-section">
            <h3 className="feature-section-title">
              <FaChartBar className="feature-section-icon" />
              For Analysts & Media
            </h3>
            <div className="feature-grid">
              <div className="feature-item">
                <FaDesktop className="feature-icon" />
                <div>
                  <strong>Custom Visualization Tools</strong>
                  <p>Present complex statistics in compelling, shareable formats</p>
                </div>
              </div>
              
              <div className="feature-item">
                <FaDatabase className="feature-icon" />
                <div>
                  <strong>Advanced Statistical Modeling</strong>
                  <p>Predict game outcomes beyond simple win probabilities</p>
                </div>
              </div>
              
              <div className="feature-item">
                <FaUniversity className="feature-icon" />
                <div>
                  <strong>Coaching Impact Analysis</strong>
                  <p>Measure the true value of coaching changes across programs</p>
                </div>
              </div>
              
              <div className="feature-item">
                <FaTrophy className="feature-icon" />
                <div>
                  <strong>Conference Strength Metrics</strong>
                  <p>Evaluate cross-conference performance adjusted for talent disparity</p>
                </div>
              </div>
              
              <div className="feature-item">
                <FaRegChartBar className="feature-icon" />
                <div>
                  <strong>Program Trajectory Visualization</strong>
                  <p>Track multi-year trends in performance and recruiting</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* For Fans Section */}
          <div className="feature-section">
            <h3 className="feature-section-title">
              <FaUsers className="feature-section-icon" />
              For Fans
            </h3>
            <div className="feature-grid">
              <div className="feature-item">
                <FaFootballBall className="feature-icon" />
                <div>
                  <strong>Personalized Team Dashboards</strong>
                  <p>Stats and analysis specific to your favorite teams</p>
                </div>
              </div>
              
              <div className="feature-item">
                <FaComments className="feature-icon" />
                <div>
                  <strong>Live Game Threads</strong>
                  <p>Real-time metrics and data-driven discussion</p>
                </div>
              </div>
              
              <div className="feature-item">
                <FaHistory className="feature-icon" />
                <div>
                  <strong>Rivalry Performance Breakdowns</strong>
                  <p>Historical analysis by coach, venue, and situation</p>
                </div>
              </div>
              
              <div className="feature-item">
                <FaRegNewspaper className="feature-icon" />
                <div>
                  <strong>Program Comparison Tools</strong>
                  <p>Debate team quality across eras with objective metrics</p>
                </div>
              </div>
              
              <div className="feature-item">
                <FaBell className="feature-icon" />
                <div>
                  <strong>Custom Alerts</strong>
                  <p>Notifications for recruiting news, transfer updates, and coaching changes</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* For Players Section */}
          <div className="feature-section">
            <h3 className="feature-section-title">
              <FaUserGraduate className="feature-section-icon" />
              For Players
            </h3>
            <div className="feature-grid">
              <div className="feature-item">
                <FaExchangeAlt className="feature-icon" />
                <div>
                  <strong>Transfer Destination Analysis</strong>
                  <p>Find how your metrics fit potential programs</p>
                </div>
              </div>
              
              <div className="feature-item">
                <FaChartBar className="feature-icon" />
                <div>
                  <strong>Position Group Comparison</strong>
                  <p>Reveal depth chart opportunities across programs</p>
                </div>
              </div>
              
              <div className="feature-item">
                <FaRegLightbulb className="feature-icon" />
                <div>
                  <strong>Development Trajectory Metrics</strong>
                  <p>Discover programs that excel at developing specific positions</p>
                </div>
              </div>
              
              <div className="feature-item">
                <FaMoneyBillWave className="feature-icon" />
                <div>
                  <strong>NIL Opportunity Insights</strong>
                  <p>Analyze market potential across different programs</p>
                </div>
              </div>
              
              <div className="feature-item">
                <FaChessBoard className="feature-icon" />
                <div>
                  <strong>Scheme Fit Analysis</strong>
                  <p>Identify programs where your skill set is most valuable</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Call to Action section */}
      <section id="cta" className="sections">
        <div className="glass-section" style={{ textAlign: 'center' }}>
          <h2 style={{ color: 'var(--accent-color)', marginBottom: '1.5rem', fontFamily: '"Orbitron", sans-serif', fontSize: '2rem' }}>
            Join the Intelligence Revolution
          </h2>
          <p style={{ fontSize: '1.2rem', marginBottom: '2rem', color: 'var(--text-muted)', maxWidth: '800px', margin: '0 auto 2rem' }}>
            Experience the most comprehensive college football platform ever built - bringing together fans, bettors, analysts, coaches, and players in ways never before possible.
          </p>
          <Link to="/signup" className="explore-btn">Get Started</Link>
        </div>
      </section>
      
      <footer className="footer">
        © 2025 GAMEDAY+ | The Ultimate College Football Intelligence Platform
      </footer>
    </div>
  );
};

export default Home;