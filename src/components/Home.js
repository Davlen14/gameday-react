import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FaTv, FaFootballBall, FaChessBoard, FaUsers, FaUserGraduate, FaChartBar } from "react-icons/fa";

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

  // Function to handle theme toggle (if needed)
  const toggleTheme = () => {
    const htmlElement = document.documentElement;
    const currentTheme = htmlElement.getAttribute('data-theme') || 'dark';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    htmlElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
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
          --circle-border: rgba(212, 0, 28, 0.2);
          --circle-opacity: 0.7;
        }
        
        /* Light theme if needed */
        [data-theme="light"] {
          --dark: #f0f3f8;
          --darker: #e0e5ee;
          --text: #232730;
          --text-muted: rgba(35, 39, 48, 0.8);
          --accent-dark: #B80017;
          --circle-border: rgba(212, 0, 28, 0.3);
          --circle-opacity: 0.5;
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
          overflow: hidden;
          position: relative;
          display: flex;
          justify-content: center;
          align-items: center;
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
        }
        
        .explore-btn:hover {
          background: var(--accent-light);
          transform: translateY(-3px);
          box-shadow: 0 10px 20px rgba(212, 0, 28, 0.3);
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
    </div>
  );
};

export default Home;