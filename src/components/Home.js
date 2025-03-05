import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FaTv, FaStar, FaCheckCircle, FaChevronRight, FaFootballBall, FaSearch } from "react-icons/fa";
import teamsService, { getAllRecruits } from "../services/teamsService";
import newsService from "../services/newsService"; // Import the news service
import "../styles/Home.css";
import { useWeek } from "../context/WeekContext"; // Global week state

const Home = () => {
  const { week, setWeek } = useWeek();

  const [polls, setPolls] = useState([]);
  const [games, setGames] = useState([]);
  const [teams, setTeams] = useState([]);
  const [topRecruits, setTopRecruits] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [featuredTeams] = useState([
    "Ohio State", "Notre Dame", "Oregon", "Texas", 
    "Penn State", "Georgia", "Arizona State", "Boise State"
  ]);
  const [newsArticles, setNewsArticles] = useState([]);
  
  // State for active poll tab
  const [activePollTab, setActivePollTab] = useState("ap");

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        setIsLoading(true);

        // Fetch polls (e.g., "ap" or "coaches")
        const pollsPromise = teamsService.getPolls(2024, activePollTab, week);

        // Determine the query param for games
        const queryParam =
          week === "postseason" ? { seasonType: "postseason" } : parseInt(week, 10);

        // Fetch teams, polls, games, recruits, and news in parallel
        const [teamsData, pollsData, gamesData, recruitsData, newsData] = await Promise.all([
          teamsService.getTeams(),
          pollsPromise,
          teamsService.getGames(queryParam),
          getAllRecruits(2025),
          newsService.fetchCollegeFootballNews()
        ]);

        setTeams(teamsData);
        setPolls(pollsData);
        setNewsArticles(newsData.articles || []);

        // Filter games to include only FBS vs. FBS matchups
        const fbsGames = gamesData.filter(
          (game) =>
            game.homeClassification === "fbs" &&
            game.awayClassification === "fbs"
        );
        setGames(fbsGames);

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
  }, [week, activePollTab]);

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

  // Inline helper to render stars for recruits
  const renderStars = (stars) => (
    <div className="stars-container">
      {[...Array(stars)].map((_, index) => (
        <FaStar key={index} className="star-icon" />
      ))}
    </div>
  );

  // Week selector handler
  const handleWeekChange = (e) => {
    setWeek(e.target.value);
  };

  if (isLoading) return <div className="loading-container">Loading...</div>;
  if (error) return <div className="error-container">Error: {error}</div>;

  return (
    <div className="home-container">
      {/* Main Header with Modern 3D Logo */}
      <header className="hero-header">
        <h1>GAMEDAY+</h1>
        <div className="week-selector">
          <label>Week:</label>
          <select value={week} onChange={handleWeekChange}>
            {[...Array(15).keys()].map((w) => (
              <option key={w + 1} value={w + 1}>Week {w + 1}</option>
            ))}
            <option value="postseason">Bowl Games</option>
          </select>
        </div>
      </header>

      {/* Main Content Grid (2 columns: Main + Sidebar) */}
      <div className="main-content-grid">
        {/* Main Content Column */}
        <div className="main-content-column">
          {/* Featured News Section */}
          <section className="featured-section">
            <h2 className="section-title">GAMEDAY+ NEWS</h2>
            
            <div className="featured-grid">
              {/* Big Hero Card */}
              <div className="featured-card big-card">
                <img src="/photos/Ostate.webp" alt="Ohio State Celebration" />
                <div className="featured-overlay">
                  <h2>Ohio State Triumph</h2>
                  <p>
                    Discover how Ohio State clinched the championship in a thrilling matchup.
                  </p>
                </div>
              </div>

              {/* Additional Featured Cards */}
              <div className="featured-card small-card">
                <img src="/photos/ArchTime.jpg" alt="Arch Manning" />
                <div className="featured-overlay">
                  <h3>Arch Manning Buzz</h3>
                  <p>
                    Arch Manning is poised for a breakout season as excitement builds.
                  </p>
                </div>
              </div>
              <div className="featured-card small-card">
                <img src="/photos/Oregon.jpg" alt="Oregon Ducks" />
                <div className="featured-overlay">
                  <h3>Oregon's Next Move</h3>
                  <p>
                    Get the latest on Oregon's strategic decisions for the future.
                  </p>
                </div>
              </div>
              <div className="featured-card small-card">
                <img src="/photos/CU.jpg" alt="Colorado" />
                <div className="featured-overlay">
                  <h3>Colorado on the Rise</h3>
                  <p>
                    A detailed look into Colorado's evolving game plan this season.
                  </p>
                </div>
              </div>
              <div className="featured-card small-card">
                <img src="/photos/Pennst.jpg" alt="Penn State" />
                <div className="featured-overlay">
                  <h3>Penn State Prospects</h3>
                  <p>
                    Explore roster insights for the future of the Nittany Lions.
                  </p>
                </div>
              </div>
              <div className="featured-card small-card">
                <img src="/photos/Ksmart.jpg" alt="Georgia Bulldogs" />
                <div className="featured-overlay">
                  <h3>Georgia's Offseason</h3>
                  <p>
                    An in-depth look at the Bulldogs' offseason adjustments.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* News Articles from API */}
          <section className="news-articles-section">
            <h2 className="section-title">LATEST UPDATES</h2>
            <div className="news-articles-container">
              {newsArticles.slice(0, 6).map((article, index) => (
                <a key={index} href={article.url} target="_blank" rel="noopener noreferrer" className="news-article-card">
                  {article.image && <img src={article.image} alt={article.title} className="news-article-image" />}
                  <div className="news-article-content">
                    <h3 className="news-article-title">{article.title}</h3>
                    <p className="news-article-source">{article.source.name}</p>
                  </div>
                </a>
              ))}
            </div>
            <div className="view-more-news">
              <Link to="/latest-news">View All News <FaChevronRight /></Link>
            </div>
          </section>

          {/* Games Section */}
          <section className="games-section">
            <h2 className="section-title">
              {week === "postseason" ? "BOWL GAMES" : `WEEK ${week} MATCHUPS`}
            </h2>
            <div className="games-slider">
              {games.map((game) => (
                <Link to={`/games/${game.id}`} key={game.id} className="game-card-link">
                  <div className="game-card">
                    <div className="game-header">
                      <div className="game-time">
                        {new Date(game.startDate).toLocaleDateString("en-US", {
                          weekday: "short",
                          month: "short",
                          day: "numeric"
                        })}
                      </div>
                      <div className="network">
                        {getNetworkLogo(game.network || "ESPN")}
                        <span className="network-name">
                          {game.network || "ESPN"}
                        </span>
                      </div>
                    </div>
                    <div className="teams-container">
                      <div className="team home-team">
                        <img src={getTeamLogo(game.homeTeam)} alt={game.homeTeam} />
                        <div className="team-info">
                          <span className="team-name">{game.homeTeam}</span>
                          <span className="team-record">
                            {game.homeRecord || "(N/A)"}
                          </span>
                        </div>
                      </div>
                      <div className="vs-container">
                        <div className="vs-circle">VS</div>
                        <div className="score-container">
                          <span className="score">{game.homePoints || "-"}</span>
                          <span className="score-divider">-</span>
                          <span className="score">{game.awayPoints || "-"}</span>
                        </div>
                      </div>
                      <div className="team away-team">
                        <img src={getTeamLogo(game.awayTeam)} alt={game.awayTeam} />
                        <div className="team-info">
                          <span className="team-name">{game.awayTeam}</span>
                          <span className="team-record">
                            {game.awayRecord || "(N/A)"}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="game-footer">
                      <div className="game-venue">
                        <span>🏟️ {game.venue}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        </div>

        {/* Sidebar Content Column */}
        <div className="sidebar-column">
          {/* Featured Teams Section */}
          <section className="featured-teams-section sidebar-section">
            <h2 className="sidebar-title">FEATURED TEAMS</h2>
            <div className="featured-teams-grid">
              {featuredTeams.slice(0, 8).map((teamName, index) => {
                const logo = getTeamLogo(teamName);
                return (
                  <div key={index} className="featured-team-item">
                    <img src={logo} alt={teamName} className="featured-team-logo" />
                  </div>
                );
              })}
            </div>
            <div className="find-team-button">
              <FaSearch className="search-icon" />
              <span>Find your team</span>
            </div>
          </section>

          {/* Polls Section */}
          <section className="polls-section sidebar-section">
            <div className="sidebar-header">
              <h2 className="sidebar-title">RANKINGS</h2>
              <div className="poll-tabs">
                <button 
                  className={`poll-tab ${activePollTab === 'ap' ? 'active' : ''}`}
                  onClick={() => setActivePollTab('ap')}
                >
                  AP Poll
                </button>
                <button 
                  className={`poll-tab ${activePollTab === 'coaches' ? 'active' : ''}`}
                  onClick={() => setActivePollTab('coaches')}
                >
                  Coaches
                </button>
              </div>
            </div>
            
            <div className="poll-card">
              {polls.length > 0 ? (
                <div className="rankings-list">
                  {polls[0]?.rankings?.slice(0, 10).map((team) => {
                    const teamData = teams.find(
                      (t) => t.school?.toLowerCase() === team.school?.toLowerCase()
                    );
                    const logo = getTeamLogo(team.school);
                    return (
                      <div key={team.school} className="ranking-item">
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
                        <span className="poll-points">{team.points}</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="no-data">No rankings available</p>
              )}
              <div className="view-all-link">
                <Link to="/rankings">View Full Rankings <FaChevronRight /></Link>
              </div>
            </div>
          </section>

          {/* Top Recruits Section */}
          <section className="recruits-section sidebar-section">
            <h2 className="sidebar-title">NCAAF CRYSTAL BALLS</h2>
            <div className="recruits-list">
              {topRecruits.slice(0, 5).map((prospect) => (
                <div key={prospect.id} className="recruit-item">
                  <div className="recruit-photo">
                    {prospect.photoUrl ? (
                      <img src={prospect.photoUrl} alt={prospect.name} />
                    ) : (
                      <div className="recruit-placeholder">
                        <FaFootballBall />
                      </div>
                    )}
                  </div>
                  <div className="recruit-details">
                    <div className="recruit-name-position">
                      <span className="recruit-name">{prospect.name}</span>
                      <span className="recruit-position">{prospect.position}</span>
                    </div>
                    {prospect.stars && renderStars(prospect.stars)}
                  </div>
                  {prospect.committedTo && (
                    <div className="recruit-commitment">
                      <img
                        src={getTeamLogo(prospect.committedTo)}
                        alt={`${prospect.committedTo} Logo`}
                        className="committed-team-logo"
                      />
                      <span className="commitment-rank">{prospect.ranking}</span>
                    </div>
                  )}
                </div>
              ))}
              <div className="view-all-link">
                <Link to="/top-prospects">View All Predictions <FaChevronRight /></Link>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Home;