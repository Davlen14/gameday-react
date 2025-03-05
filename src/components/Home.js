import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { FaTv, FaStar, FaCheckCircle, FaClock, FaMapMarkerAlt, FaChevronLeft, FaChevronRight, FaArrowRight } from "react-icons/fa";
import teamsService, { getAllRecruits } from "../services/teamsService";
import "../styles/Home.css";
import { useWeek } from "../context/WeekContext"; // Global week state
import { motion } from "framer-motion"; // Add framer-motion for animations

const Home = () => {
  const { week, setWeek } = useWeek();
  
  const [polls, setPolls] = useState([]);
  const [games, setGames] = useState([]);
  const [teams, setTeams] = useState([]);
  const [topRecruits, setTopRecruits] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("ap"); // For poll tabs
  const [hoveredGameId, setHoveredGameId] = useState(null);
  
  // Refs for scrolling
  const gamesSliderRef = useRef(null);
  const featuredRef = useRef(null);

  // Weeks for week selector
  const weeks = Array.from({ length: 15 }, (_, i) => i + 1).concat(["postseason"]);

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        setIsLoading(true);

        // Fetch polls (e.g., "ap" or "coaches")
        const pollsPromise = teamsService.getPolls(2024, activeTab, week);

        // Determine the query param for games
        const queryParam =
          week === "postseason" ? { seasonType: "postseason" } : parseInt(week, 10);

        // Fetch teams, polls, games, and recruits in parallel
        const [teamsData, pollsData, gamesData, recruitsData] = await Promise.all([
          teamsService.getTeams(),
          pollsPromise,
          teamsService.getGames(queryParam),
          getAllRecruits(2025)
        ]);

        setTeams(teamsData);
        setPolls(pollsData);

        // Filter games to include only FBS vs. FBS matchups
        const fbsGames = gamesData.filter(
          (game) =>
            game.homeClassification === "fbs" &&
            game.awayClassification === "fbs"
        );
        
        // Sort games by time
        const sortedGames = fbsGames.sort((a, b) => 
          new Date(a.startDate) - new Date(b.startDate)
        );
        
        setGames(sortedGames);

        // Sort recruits by ranking and keep top 20
        const sortedRecruits = recruitsData.sort((a, b) => a.ranking - b.ranking);
        setTopRecruits(sortedRecruits.slice(0, 20));
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHomeData();
  }, [week, activeTab]);

  // Helper functions
  const getTeamLogo = (teamName) => {
    const team = teams.find(
      (t) => t.school?.toLowerCase() === teamName?.toLowerCase()
    );
    return team?.logos?.[0] || "/photos/default_team.png";
  };

  const getTeamAbbreviation = (teamName) => {
    const team = teams.find(
      (t) => t.school?.toLowerCase() === teamName?.toLowerCase()
    );
    return team?.abbreviation || teamName;
  };

  const getNetworkLogo = (network) => {
    const networks = {
      ESPN: <FaTv className="network-icon espn" />,
      FOX: <FaTv className="network-icon fox" />,
      ABC: <FaTv className="network-icon abc" />,
      CBS: <FaTv className="network-icon cbs" />
    };
    return networks[network] || <FaTv className="network-icon default" />;
  };

  // Scroll handlers for games slider
  const scrollLeft = () => {
    if (gamesSliderRef.current) {
      gamesSliderRef.current.scrollBy({ left: -300, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (gamesSliderRef.current) {
      gamesSliderRef.current.scrollBy({ left: 300, behavior: 'smooth' });
    }
  };

  // Inline helper to render stars for recruits
  const renderStars = (stars) => (
    <div className="stars-container">
      {[...Array(stars)].map((_, index) => (
        <FaStar key={index} className="star-icon" />
      ))}
    </div>
  );

  // Format date for games
  const formatGameDate = (dateString) => {
    const date = new Date(dateString);
    return {
      weekday: date.toLocaleDateString("en-US", { weekday: "short" }),
      month: date.toLocaleDateString("en-US", { month: "short" }),
      day: date.toLocaleDateString("en-US", { day: "numeric" }),
      time: date.toLocaleTimeString("en-US", { 
        hour: "numeric", 
        minute: "2-digit",
        hour12: true 
      })
    };
  };

  if (isLoading) return (
    <div className="loading-container">
      <div className="loading-spinner"></div>
      <p>Loading GAMEDAY+</p>
    </div>
  );
  
  if (error) return (
    <div className="error-container">
      <h2>Something went wrong</h2>
      <p>{error}</p>
      <button onClick={() => window.location.reload()} className="reload-btn">
        Try Again
      </button>
    </div>
  );

  return (
    <div className="home-container">
      {/* Hero Header with Animation */}
      <motion.header 
        className="hero-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="logo-wrapper">
          <h1>GAMEDAY<span className="plus-logo">+</span></h1>
          <div className="week-selector-container">
            <label htmlFor="week-select">WEEK</label>
            <select 
              id="week-select"
              value={week}
              onChange={(e) => setWeek(e.target.value)}
              className="week-select"
            >
              {weeks.map((w) => (
                <option key={w} value={w}>
                  {w === "postseason" ? "Bowl Games" : `Week ${w}`}
                </option>
              ))}
            </select>
          </div>
        </div>
      </motion.header>

      {/* Featured Section with Hover Effects */}
      <motion.section 
        className="featured-section"
        ref={featuredRef}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.7, delay: 0.2 }}
      >
        <div className="featured-grid">
          {/* Big Hero Card */}
          <div className="featured-card big-card">
            <div className="card-image-container">
              <img src="/photos/Ostate.webp" alt="Ohio State Celebration" />
              <div className="featured-overlay">
                <h2>Ohio State Triumph</h2>
                <p>
                  Discover how Ohio State clinched the championship in a thrilling matchup.
                </p>
                <button className="read-more-btn">
                  Read More <FaArrowRight className="arrow-icon" />
                </button>
              </div>
            </div>
          </div>

          {/* Additional Featured Cards */}
          <div className="featured-card small-card">
            <div className="card-image-container">
              <img src="/photos/ArchTime.jpg" alt="Arch Manning" />
              <div className="featured-overlay">
                <h3>Arch Manning Buzz</h3>
                <p>
                  Arch Manning is poised for a breakout season as excitement builds.
                </p>
                <button className="read-more-btn small">
                  Read More <FaArrowRight className="arrow-icon" />
                </button>
              </div>
            </div>
          </div>
          <div className="featured-card small-card">
            <div className="card-image-container">
              <img src="/photos/Oregon.jpg" alt="Oregon Ducks" />
              <div className="featured-overlay">
                <h3>Oregon's Next Move</h3>
                <p>
                  Get the latest on Oregon's strategic decisions for the future.
                </p>
                <button className="read-more-btn small">
                  Read More <FaArrowRight className="arrow-icon" />
                </button>
              </div>
            </div>
          </div>
          <div className="featured-card small-card">
            <div className="card-image-container">
              <img src="/photos/CU.jpg" alt="Colorado" />
              <div className="featured-overlay">
                <h3>Colorado on the Rise</h3>
                <p>
                  A detailed look into Colorado's evolving game plan this season.
                </p>
                <button className="read-more-btn small">
                  Read More <FaArrowRight className="arrow-icon" />
                </button>
              </div>
            </div>
          </div>
          <div className="featured-card small-card">
            <div className="card-image-container">
              <img src="/photos/Pennst.jpg" alt="Penn State" />
              <div className="featured-overlay">
                <h3>Penn State Prospects</h3>
                <p>
                  Explore roster insights for the future of the Nittany Lions.
                </p>
                <button className="read-more-btn small">
                  Read More <FaArrowRight className="arrow-icon" />
                </button>
              </div>
            </div>
          </div>
          <div className="featured-card small-card">
            <div className="card-image-container">
              <img src="/photos/Ksmart.jpg" alt="Georgia Bulldogs" />
              <div className="featured-overlay">
                <h3>Georgia's Offseason</h3>
                <p>
                  An in-depth look at the Bulldogs' offseason adjustments.
                </p>
                <button className="read-more-btn small">
                  Read More <FaArrowRight className="arrow-icon" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Two-Column Layout for Polls & Top Recruits */}
      <motion.div 
        className="polls-recruits-container"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.4 }}
      >
        {/* Left Column: Polls with Tabs */}
        <section className="polls-section left-column">
          <div className="section-header">
            <h2 className="section-title">Rankings</h2>
            <div className="poll-tabs">
              <button 
                className={`poll-tab ${activeTab === 'ap' ? 'active' : ''}`}
                onClick={() => setActiveTab('ap')}
              >
                AP Poll
              </button>
              <button 
                className={`poll-tab ${activeTab === 'coaches' ? 'active' : ''}`}
                onClick={() => setActiveTab('coaches')}
              >
                Coaches
              </button>
            </div>
          </div>
          
          <div className="polls-grid">
            {polls.map((poll) => (
              <motion.div 
                key={poll.id} 
                className="poll-card"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                <h3 className="poll-title">
                  <img
                    src="/photos/committee.png"
                    alt="Committee Logo"
                    className="poll-logo"
                  />
                  {poll.name}
                </h3>
                <div className="rankings-list">
                  {poll.rankings.slice(0, 25).map((team, index) => {
                    const teamData = teams.find(
                      (t) => t.school?.toLowerCase() === team.school?.toLowerCase()
                    );
                    const logo = getTeamLogo(team.school);
                    return (
                      <motion.div 
                        key={team.school} 
                        className="ranking-item"
                        whileHover={{ 
                          backgroundColor: 'rgba(212, 0, 28, 0.05)',
                          scale: 1.01
                        }}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.2, delay: index * 0.02 }}
                      >
                        <span className="poll-rank">#{team.rank}</span>
                        {teamData ? (
                          <Link to={`/teams/${teamData.id}`} className="team-logo-link">
                            <img
                              src={logo}
                              alt={team.school}
                              className="team-poll-logo"
                            />
                          </Link>
                        ) : (
                          <img
                            src={logo}
                            alt={team.school}
                            className="team-poll-logo"
                          />
                        )}
                        <span className="poll-team-name">{team.school}</span>
                        <span className="poll-record">{team.record || ""}</span>
                        <span className="poll-points">{team.points} pts</span>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Right Column: Top 20 Recruits */}
        <section className="recruits-section right-column">
          <h2 className="section-title">Top 20 Recruits</h2>
          <div className="recruits-list">
            {topRecruits.slice(0, 20).map((prospect, index) => (
              <motion.div 
                key={prospect.id} 
                className="recruit-item"
                whileHover={{ 
                  backgroundColor: 'rgba(212, 0, 28, 0.05)',
                  scale: 1.02,
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)' 
                }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.03 }}
              >
                <span className="recruit-rank">#{prospect.ranking}</span>
                <span className="recruit-name">{prospect.name}</span>
                <span className="recruit-position">({prospect.position})</span>
                {prospect.stars && renderStars(prospect.stars)}
                {prospect.committedTo ? (
                  <div className="recruit-commit">
                    <img
                      src={getTeamLogo(prospect.committedTo)}
                      alt={`${prospect.committedTo} Logo`}
                      className="committed-team-logo"
                    />
                    <span className="committed-to">{prospect.committedTo}</span>
                    <FaCheckCircle className="commit-check" />
                  </div>
                ) : (
                  <span className="uncommitted-tag">Uncommitted</span>
                )}
              </motion.div>
            ))}
          </div>
        </section>
      </motion.div>

      {/* Games Section with Custom Navigation */}
      <motion.section 
        className="games-section"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.6 }}
      >
        <div className="section-header games-header">
          <h2 className="section-title">
            {week === "postseason" ? "Bowl Games" : `Week ${week} Matchups`}
          </h2>
          <div className="slider-controls">
            <button className="nav-button prev" onClick={scrollLeft}>
              <FaChevronLeft />
            </button>
            <button className="nav-button next" onClick={scrollRight}>
              <FaChevronRight />
            </button>
          </div>
        </div>

        <div className="games-slider" ref={gamesSliderRef}>
          {games.map((game) => {
            const formattedDate = formatGameDate(game.startDate);
            const isHovered = hoveredGameId === game.id;
            
            return (
              <Link 
                to={`/games/${game.id}`} 
                key={game.id} 
                className="game-card-link"
                onMouseEnter={() => setHoveredGameId(game.id)}
                onMouseLeave={() => setHoveredGameId(null)}
              >
                <motion.div 
                  className="game-card"
                  whileHover={{ y: -8 }}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="game-header">
                    <div className="game-date">
                      <span className="weekday">{formattedDate.weekday}</span>
                      <span className="date">{formattedDate.month} {formattedDate.day}</span>
                    </div>
                    <div className="network">
                      {getNetworkLogo(game.network || "ESPN")}
                      <span className="network-name">{game.network || "ESPN"}</span>
                    </div>
                  </div>
                  
                  <div className="teams-container">
                    <div className="team home-team">
                      <div className="team-logo-container">
                        <motion.img 
                          src={getTeamLogo(game.homeTeam)} 
                          alt={game.homeTeam}
                          whileHover={{ scale: 1.1 }}
                        />
                      </div>
                      <div className="team-info">
                        <span className="team-name">{game.homeTeam}</span>
                        <span className="team-record">{game.homeRecord || "(0-0)"}</span>
                        {game.homeRank && <span className="team-rank">#{game.homeRank}</span>}
                      </div>
                    </div>
                    
                    <div className="vs-container">
                      {game.homePoints !== null && game.awayPoints !== null ? (
                        <div className="score-container">
                          <span className="score">{game.homePoints}</span>
                          <span className="score-divider">-</span>
                          <span className="score">{game.awayPoints}</span>
                          <span className="game-status">Final</span>
                        </div>
                      ) : (
                        <>
                          <div className="vs-circle">VS</div>
                          <div className="game-time">
                            <FaClock className="time-icon" />
                            <span>{formattedDate.time}</span>
                          </div>
                        </>
                      )}
                    </div>
                    
                    <div className="team away-team">
                      <div className="team-logo-container">
                        <motion.img 
                          src={getTeamLogo(game.awayTeam)} 
                          alt={game.awayTeam}
                          whileHover={{ scale: 1.1 }}
                        />
                      </div>
                      <div className="team-info">
                        <span className="team-name">{game.awayTeam}</span>
                        <span className="team-record">{game.awayRecord || "(0-0)"}</span>
                        {game.awayRank && <span className="team-rank">#{game.awayRank}</span>}
                      </div>
                    </div>
                  </div>
                  
                  <div className="game-footer">
                    <div className="game-venue">
                      <FaMapMarkerAlt className="venue-icon" />
                      <span>{game.venue || "TBD"}</span>
                    </div>
                    <motion.button 
                      className="view-details-btn"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: isHovered ? 1 : 0 }}
                    >
                      Game Details
                    </motion.button>
                  </div>
                </motion.div>
              </Link>
            );
          })}
        </div>
      </motion.section>
    </div>
  );
};

export default Home;