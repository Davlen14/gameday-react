import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FaTv, FaStar, FaCheckCircle } from "react-icons/fa";
import teamsService, { getAllRecruits } from "../services/teamsService";
import "../styles/Home.css";
import { useWeek } from "../context/WeekContext"; // Global week state

const Home = () => {
  const { week } = useWeek();

  const [polls, setPolls] = useState([]);
  const [games, setGames] = useState([]);
  const [teams, setTeams] = useState([]);
  const [topRecruits, setTopRecruits] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        setIsLoading(true);

        // Fetch polls (e.g., "ap" or "coaches")
        const pollsPromise = teamsService.getPolls(2024, "ap", week);

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
  }, [week]);

  // Helper functions
  const getTeamLogo = (teamName) => {
    const team = teams.find(
      (t) => t.school.toLowerCase() === teamName?.toLowerCase()
    );
    return team?.logos?.[0] || "/photos/default_team.png";
  };

  const getTeamAbbreviation = (teamName) => {
    const team = teams.find(
      (t) => t.school.toLowerCase() === teamName?.toLowerCase()
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

  if (isLoading) return <div className="loading-container">Loading...</div>;
  if (error) return <div className="error-container">Error: {error}</div>;

  return (
    <div className="home-container">
      <header className="hero-header">
        <h1 style={{ fontFamily: '"Orbitron", "Titillium Web", sans-serif' }}>GAMEDAY+</h1>
      </header>

      {/* Featured Section */}
      <section className="featured-section">
        <div className="featured-grid">
          {/* Big Hero Card */}
          <div className="featured-card big-card">
            <img src="/photos/Ostate.webp" alt="Ohio State Celebration" />
            <div className="featured-overlay">
              <h2>Ohio State Triumph</h2>
              <p>
                Discover how Ohio State clinched the championship in a thrilling matchup. Read more
              </p>
            </div>
          </div>

          {/* Additional Featured Cards */}
          <div className="featured-card small-card">
            <img src="/photos/ArchTime.jpg" alt="Arch Manning" />
            <div className="featured-overlay">
              <h3>Arch Manning Buzz</h3>
              <p>
                Arch Manning is poised for a breakout season as excitement builds around his potential. Read more
              </p>
            </div>
          </div>
          <div className="featured-card small-card">
            <img src="/photos/Oregon.jpg" alt="Oregon Ducks" />
            <div className="featured-overlay">
              <h3>Oregon's Next Move</h3>
              <p>
                Get the latest on Oregon's strategic decisions that could reshape the program's future. Read more
              </p>
            </div>
          </div>
          <div className="featured-card small-card">
            <img src="/photos/CU.jpg" alt="Colorado" />
            <div className="featured-overlay">
              <h3>Colorado on the Rise</h3>
              <p>
                A detailed look into Colorado's evolving game plan and rising expectations this season. Read more
              </p>
            </div>
          </div>
          <div className="featured-card small-card">
            <img src="/photos/Pennst.jpg" alt="Penn State" />
            <div className="featured-overlay">
              <h3>Penn State Prospects</h3>
              <p>
                Explore early roster insights and what they mean for the future of the Nittany Lions. Read more
              </p>
            </div>
          </div>
          <div className="featured-card small-card">
            <img src="/photos/Ksmart.jpg" alt="Georgia Bulldogs" />
            <div className="featured-overlay">
              <h3>Georgia's Offseason</h3>
              <p>
                An in-depth look at the Bulldogs' offseason adjustments and their plans moving forward. Read more
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Two-Column Layout for Polls & Top Recruits */}
      <div className="polls-recruits-container">
        {/* Left Column: Polls */}
        <section className="polls-section left-column">
          <div className="polls-grid">
            {polls.map((poll) => (
              <div key={poll.id} className="poll-card">
                <h3 className="poll-title" style={{ fontFamily: '"Orbitron", "Titillium Web", sans-serif' }}>
                  <img
                    src="/photos/committee.png"
                    alt="Committee Logo"
                    className="poll-logo"
                  />
                  {poll.name}
                </h3>
                <div className="rankings-list">
                  {/* Display top teams inline */}
                  {poll.rankings.slice(0, 25).map((team) => {
                    const teamData = teams.find(
                      (t) => t.school.toLowerCase() === team.school.toLowerCase()
                    );
                    const logo = getTeamLogo(team.school);
                    return (
                      <div key={team.school} className="ranking-item">
                        <span className="poll-rank">#{team.rank}</span>
                        {teamData ? (
                          <Link to={`/teams/${teamData.id}`}>
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
                        <span className="poll-points">{team.points} pts</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Right Column: Top 20 Recruits */}
        <section className="recruits-section right-column">
          <h2 className="section-title" style={{ fontFamily: '"Orbitron", "Titillium Web", sans-serif' }}>Top 20 Recruits</h2>
          <div className="recruits-list">
            {topRecruits.slice(0, 20).map((prospect) => (
              <div key={prospect.id} className="recruit-item">
                <span className="recruit-rank">#{prospect.ranking}</span>
                <span className="recruit-name">{prospect.name}</span>
                <span className="recruit-position">({prospect.position})</span>
                {prospect.stars && renderStars(prospect.stars)}
                {prospect.committedTo && (
                  <span className="recruit-commit">
                    <img
                      src={getTeamLogo(prospect.committedTo)}
                      alt={`${prospect.committedTo} Logo`}
                      className="committed-team-logo"
                    />
                    <FaCheckCircle className="commit-check" />
                  </span>
                )}
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Home;