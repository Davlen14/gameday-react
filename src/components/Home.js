import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FaTv, FaStar } from "react-icons/fa";
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

        // Fetch polls (Coaches Poll)
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

        // Filter games to include only FBS vs. FBS matchup
        const fbsGames = gamesData.filter(
          (game) =>
            game.homeClassification === "fbs" &&
            game.awayClassification === "fbs"
        );
        setGames(fbsGames);

        // Sort recruits by ranking and keep top 10
        const sortedRecruits = recruitsData.sort((a, b) => a.ranking - b.ranking);
        setTopRecruits(sortedRecruits.slice(0, 10));
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

  // Inline helper to render stars
  const renderStars = (stars) => {
    return (
      <div className="stars-container">
        {[...Array(stars)].map((_, index) => (
          <FaStar key={index} className="star-icon" />
        ))}
      </div>
    );
  };

  if (isLoading) return <div className="loading-container">Loading...</div>;
  if (error) return <div className="error-container">Error: {error}</div>;

  return (
    <div className="home-container">
      <header className="hero-header">
        <h1>GAMEDAY+</h1>
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

          {/* Featured Card: Arch Manning Buzz */}
          <div className="featured-card small-card">
            <img src="/photos/ArchTime.jpg" alt="Arch Manning" />
            <div className="featured-overlay">
              <h3>Arch Manning Buzz</h3>
              <p>
                Arch Manning is poised for a breakout season as excitement builds around his potential. Read more
              </p>
            </div>
          </div>

          {/* Featured Card: Oregon's Next Move */}
          <div className="featured-card small-card">
            <img src="/photos/Oregon.jpg" alt="Oregon Ducks" />
            <div className="featured-overlay">
              <h3>Oregon's Next Move</h3>
              <p>
                Get the latest on Oregon's strategic decisions that could reshape the program’s future. Read more
              </p>
            </div>
          </div>

          {/* Featured Card: Colorado on the Rise */}
          <div className="featured-card small-card">
            <img src="/photos/CU.jpg" alt="Colorado" />
            <div className="featured-overlay">
              <h3>Colorado on the Rise</h3>
              <p>
                A detailed look into Colorado's evolving game plan and rising expectations this season. Read more
              </p>
            </div>
          </div>

          {/* Featured Card: Penn State Prospects */}
          <div className="featured-card small-card">
            <img src="/photos/Pennst.jpg" alt="Penn State" />
            <div className="featured-overlay">
              <h3>Penn State Prospects</h3>
              <p>
                Explore early roster insights and what they mean for the future of the Nittany Lions. Read more
              </p>
            </div>
          </div>

          {/* Featured Card: Georgia Article */}
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
        {/* Left Column: Coaches Poll */}
        <section className="polls-section left-column">
          <div className="polls-grid">
            {polls.map((poll) => (
              <div key={poll.id} className="poll-card">
                <h3 className="poll-title">
                  <img src="/photos/committee.png" alt="Committee Logo" className="poll-logo" />
                  {poll.name}
                </h3>
                <div className="rankings-list">
                  {poll.rankings.slice(0, 5).map((team) => (
                    <div key={team.school} className="ranking-item">
                      <img src={getTeamLogo(team.school)} alt={team.school} className="team-logo" />
                      <div className="team-info">
                        <span className="rank">#{team.rank}</span>
                        <span className="team-name">{team.school}</span>
                        <span className="points">{team.points} pts</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Right Column: Top 10 Recruits */}
        <section className="recruits-section right-column">
          <h2 className="section-title">Top 10 Recruits</h2>
          <div className="recruits-list">
            {topRecruits.map((prospect) => (
              <div key={prospect.id} className="recruit-item">
                <span className="recruit-rank">#{prospect.ranking}</span>
                <span className="recruit-name">{prospect.name}</span>
                <span className="recruit-position">({prospect.position})</span>
                {prospect.stars && renderStars(prospect.stars)}
                {prospect.committedTo && (
                  <span className="recruit-commit">→ {prospect.committedTo}</span>
                )}
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Games Section */}
      <section className="games-section">
        <h2 className="section-title">
          {week === "postseason" ? "Postseason Matchups" : `Week ${week} Matchups`}
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
                    <span className="network-name">{game.network || "ESPN"}</span>
                  </div>
                </div>
                <div className="teams-container">
                  <div className="team home-team">
                    <img src={getTeamLogo(game.homeTeam)} alt={game.homeTeam} />
                    <div className="team-info">
                      <span className="team-name">{game.homeTeam}</span>
                      <span className="team-record">(8-2)</span>
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
                      <span className="team-record">(7-3)</span>
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
  );
};

export default Home;