import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import newsService from "../services/newsService";
import teamsService from "../services/teamsService";
import { FaStar, FaSearch, FaInfoCircle, FaTrophy } from "react-icons/fa";
import "../styles/Teams.css";

const SEC = () => {
  // --------------------------
  // SEC Hub Data: News, Scores, Polls, Ratings, Teams
  // --------------------------
  const [secNews, setSecNews] = useState([]);
  const [secScores, setSecScores] = useState([]);
  const [secPolls, setSecPolls] = useState([]);
  const [secTeamRatings, setSecTeamRatings] = useState({});
  const [secTeams, setSecTeams] = useState([]);
  const [loading, setLoading] = useState(true);

  // --------------------------
  // Recruiting Data (for SEC recruits)
  // --------------------------
  const [prospects, setProspects] = useState([]);
  const [teams, setTeams] = useState([]); // For team logo lookup

  // --------------------------
  // Cache for team logos
  // --------------------------
  const teamLogoCache = useRef({});
  const getTeamLogo = useCallback(
    (teamName) => {
      if (!teamName) return "/logos/default.png";
      if (teamLogoCache.current[teamName]) return teamLogoCache.current[teamName];
      const normalizedTeamName = teamName.toLowerCase().replace(/[^a-z]/g, "");
      const foundTeam = teams.find((t) => {
        const normalizedSchool = t.school?.toLowerCase().replace(/[^a-z]/g, "");
        return normalizedSchool === normalizedTeamName;
      });
      const logo = foundTeam?.logos?.[0] || "/logos/default.png";
      teamLogoCache.current[teamName] = logo;
      return logo;
    },
    [teams]
  );

  // --------------------------
  // Fetch SEC and Recruiting Data
  // --------------------------
  useEffect(() => {
    const fetchSECData = async () => {
      try {
        setLoading(true);
        // Fetch all teams and filter for SEC teams
        const allTeams = await teamsService.getTeams();
        const filteredSECTeams = allTeams.filter(
          (team) => team.conference === "SEC"
        );
        setSecTeams(filteredSECTeams);
        const secTeamNames = filteredSECTeams.map((team) => team.school);

        // Fetch SEC news
        const newsData = await newsService.fetchNews("SEC conference news");
        setSecNews(newsData.articles || newsData);

        // Fetch recent games (using week 3 as an example) and filter for SEC games
        const gamesData = await teamsService.getGames(3);
        const filteredSECGameScores = gamesData.filter(
          (game) =>
            secTeamNames.includes(game.homeTeam) ||
            secTeamNames.includes(game.awayTeam)
        );
        setSecScores(filteredSECGameScores);

        // Fetch polls for 2024 (regular season, week 3) and filter for SEC teams
        const pollsData = await teamsService.getPolls(2024, "ap", 3);
        const filteredSECPolls = pollsData
          .map((pollGroup) => ({
            ...pollGroup,
            rankings: pollGroup.rankings.filter((rank) =>
              secTeamNames.includes(rank.school)
            ),
          }))
          .filter((pollGroup) => pollGroup.rankings.length > 0);
        setSecPolls(filteredSECPolls);

        // Fetch team ratings for SEC teams
        const ratings = {};
        for (const team of filteredSECTeams) {
          try {
            const ratingData = await teamsService.getTeamRatings(team.school, 2024);
            ratings[team.school] = ratingData;
          } catch (err) {
            ratings[team.school] = { overall: "N/A", offense: "N/A", defense: "N/A" };
          }
        }
        setSecTeamRatings(ratings);

        // Fetch all recruits for 2025 and only show those committed to SEC teams
        const recruitsData = await teamsService.getAllRecruits(2025);
        setProspects(
          recruitsData
            .filter((r) => r.committedTo && secTeamNames.includes(r.committedTo))
            .map((prospect, index) => ({
              ...prospect,
              id: prospect.id || `prospect-${index}`,
            }))
        );

        // Also store teams for logo lookup in recruiting.
        setTeams(allTeams);
      } catch (error) {
        console.error("Error fetching SEC hub data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSECData();
  }, []);

  // --------------------------
  // Group recruits by committed SEC team
  // --------------------------
  const recruitsByTeam = useMemo(() => {
    const groups = {};
    prospects.forEach((prospect) => {
      const team = prospect.committedTo;
      if (!groups[team]) {
        groups[team] = [];
      }
      groups[team].push(prospect);
    });
    return groups;
  }, [prospects]);

  if (loading) return <div className="loading">Loading SEC data...</div>;

  return (
    <div className="sec-page">
      {/* Hero Section */}
      <section className="hero">
        <img src="/photos/SEC.png" alt="SEC Logo" className="hero-logo" />
        <h1>SEC</h1>
        <p>Your hub for SEC news, scores, polls, recruiting, team ratings, and more.</p>
      </section>

      {/* News Section */}
      <section className="section news">
        <h2>Latest SEC News</h2>
        <div className="news-grid">
          {secNews.map((article, idx) => (
            <div key={idx} className="news-card">
              {article.image && (
                <img src={article.image} alt={article.title} className="news-image" />
              )}
              <h3>{article.title}</h3>
              <p>{article.description}</p>
              <a href={article.url} target="_blank" rel="noopener noreferrer">
                Read more
              </a>
            </div>
          ))}
        </div>
      </section>

      {/* Scores Section */}
      <section className="section scores">
        <h2>Recent SEC Scores</h2>
        {secScores.length === 0 ? (
          <p>No SEC game scores available.</p>
        ) : (
          <div className="scores-list">
            {secScores.map((game) => (
              <div key={game.id} className="game-card">
                <div className="game-card-header">
                  <img src={getTeamLogo(game.awayTeam)} alt={game.awayTeam} className="game-team-logo" />
                  <span>
                    <strong>{game.awayTeam}</strong> {game.awayPoints}
                  </span>
                </div>
                <div className="game-card-body">
                  <span>{new Date(game.startDate).toLocaleString()}</span>
                  <span>{game.venue}</span>
                </div>
                <div className="game-card-footer">
                  <img src={getTeamLogo(game.homeTeam)} alt={game.homeTeam} className="game-team-logo" />
                  <span>
                    <strong>{game.homeTeam}</strong> {game.homePoints}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Polls Section */}
      <section className="section polls">
        <h2>SEC Polls</h2>
        {secPolls.length === 0 ? (
          <p>No SEC poll data available.</p>
        ) : (
          secPolls.map((pollGroup) => (
            <div key={pollGroup.id} className="poll-group">
              <h3>{pollGroup.name}</h3>
              <table>
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>School</th>
                    <th>Points</th>
                    <th>1st Place Votes</th>
                  </tr>
                </thead>
                <tbody>
                  {pollGroup.rankings.map((rank, index) => (
                    <tr key={index}>
                      <td>{rank.rank}</td>
                      <td>{rank.school}</td>
                      <td>{rank.points}</td>
                      <td>{rank.firstPlaceVotes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))
        )}
      </section>

      {/* Team Ratings Section */}
      <section className="section ratings">
        <h2>SEC Team Ratings</h2>
        <table className="ratings-table">
          <thead>
            <tr>
              <th>Team</th>
              <th>Overall</th>
              <th>Offense</th>
              <th>Defense</th>
            </tr>
          </thead>
          <tbody>
            {secTeams.map((team) => (
              <tr key={team.id}>
                <td>{team.school}</td>
                <td>{secTeamRatings[team.school]?.overall || "N/A"}</td>
                <td>{secTeamRatings[team.school]?.offense || "N/A"}</td>
                <td>{secTeamRatings[team.school]?.defense || "N/A"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Recruiting Section */}
      <section className="section recruiting">
        <h2>2025 SEC Recruiting</h2>
        {Object.keys(recruitsByTeam).length === 0 ? (
          <p>No SEC recruiting data available.</p>
        ) : (
          Object.entries(recruitsByTeam).map(([team, recruits]) => (
            <div key={team} className="team-recruits">
              <div className="team-header">
                <img src={getTeamLogo(team)} alt={team} className="team-recruit-logo" />
                <h3>{team}</h3>
              </div>
              <div className="recruits-list">
                {recruits.map((recruit) => (
                  <div key={recruit.id} className="recruit-card minimal">
                    <div className="recruit-info">
                      <h4>{recruit.name}</h4>
                      <p>{recruit.position}</p>
                    </div>
                    <div className="recruit-stars">
                      {[...Array(5)].map((_, i) => (
                        <FaStar
                          key={i}
                          className={`star-icon ${i < recruit.stars ? "filled" : "empty"}`}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </section>

      {/* Quick Recruiting Stats */}
      <section className="section recruit-stats">
        <h2>Recruiting Quick Stats</h2>
        <div className="stat-grid">
          <div className="stat-box">
            <div className="stat-number">
              {prospects.filter((p) => p.stars === 5).length}
            </div>
            <div className="stat-label">5-Star Recruits</div>
          </div>
          <div className="stat-box">
            <div className="stat-number">
              {prospects.filter((p) => p.stars === 4).length}
            </div>
            <div className="stat-label">4-Star Recruits</div>
          </div>
          <div className="stat-box">
            <div className="stat-number">
              {
                new Set(
                  prospects
                    .filter((p) => p.stateProvince)
                    .map((p) => p.stateProvince)
                ).size
              }
            </div>
            <div className="stat-label">States with Recruits</div>
          </div>
          <div className="stat-box">
            <div className="stat-number">
              {
                new Set(
                  prospects
                    .filter((p) => p.committedTo)
                    .map((p) => p.committedTo)
                ).size
              }
            </div>
            <div className="stat-label">Schools with Commits</div>
          </div>
        </div>
      </section>

      <style jsx>{`
    /* Import Google Fonts: Orbitron and Titillium Web */
@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400..900&family=Titillium+Web:ital,wght@0,200;0,300;0,400;0,600;0,700;0,900;1,200;1,300;1,400;1,600;1,700&display=swap');

/* ===============================    COLOR SCHEME & GLOBALS =============================== */
:root {
  --primary-color: #ffffff;
  --accent-color: #D4001C;
  --text-color: #333333;
  --background-color: #f5f5f5;
  --border-color: #dddddd;
  --shadow-color: rgba(0, 0, 0, 0.1);
  --hover-shadow-color: rgba(0, 0, 0, 0.15);
}

@media (prefers-color-scheme: dark) {
  :root {
    --primary-color: #333333;
    --text-color: #ffffff;
    --background-color: #1e1e1e;
    --border-color: #444444;
    --shadow-color: rgba(255, 255, 255, 0.1);
    --hover-shadow-color: rgba(255, 255, 255, 0.15);
  }
}

/* ===============================    GLOBAL RESET & BASE STYLES =============================== */
.sec-page {
  font-family: "Orbitron", "Titillium Web", sans-serif;
  color: var(--text-color);
  background: var(--background-color);
  line-height: 1.6;
  letter-spacing: 0.5px;
}

/* ===============================    HERO SECTION =============================== */
.hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 1.25rem;
  text-align: center;
  background: linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), 
              url("/photos/sec-background.jpg") no-repeat center center/cover;
  color: var(--primary-color);
  margin-bottom: 2.5rem;
  position: relative;
  overflow: hidden;
}

.hero-logo {
  width: 9.375rem;
  height: 9.375rem;
  object-fit: contain;
  margin-bottom: 1.25rem;
  transition: transform 0.3s ease;
}

.hero-logo:hover {
  transform: scale(1.05);
}

.hero h1 {
  font-family: "Orbitron", sans-serif;
  font-size: 3rem;
  margin-bottom: 0.625rem;
  font-weight: 700;
  text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
}

.hero p {
  font-family: "Titillium Web", sans-serif;
  font-size: 1.5rem;
  max-width: 800px;
  margin: 0 auto;
}

/* ===============================    NEWS & CARD STYLES =============================== */
.news-grid, .scores-list, .recruits-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(17.5rem, 1fr));
  gap: 1.25rem;
  max-width: 87.5rem;
  margin: 0 auto;
  padding: 1rem;
}

.news-card, .game-card, .recruit-card {
  background: var(--primary-color);
  border-radius: 0.5rem;
  box-shadow: 0 0.25rem 0.5rem var(--shadow-color);
  padding: 1.25rem;
  transition: all 0.3s ease;
  border: 1px solid var(--border-color);
}

.news-card:hover, .game-card:hover, .recruit-card:hover {
  transform: translateY(-0.3125rem);
  box-shadow: 0 0.5rem 1rem var(--hover-shadow-color);
}

.news-image {
  width: 100%;
  height: 9.375rem;
  object-fit: cover;
  border-radius: 0.5rem;
  margin-bottom: 0.9375rem;
  transition: transform 0.3s ease;
}

.news-image:hover {
  transform: scale(1.05);
}

/* ===============================    TEAM & LOGO STYLES =============================== */
.game-team-logo, .team-recruit-logo {
  width: 2.5rem;
  height: 2.5rem;
  object-fit: contain;
  transition: transform 0.3s ease;
}

.game-team-logo:hover, .team-recruit-logo:hover {
  transform: rotate(10deg);
}

/* ===============================    TABLE STYLES =============================== */
table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  margin: 1.25rem auto;
  box-shadow: 0 0.25rem 0.5rem var(--shadow-color);
  border-radius: 0.5rem;
  overflow: hidden;
}

th, td {
  border: 1px solid var(--border-color);
  padding: 0.5rem;
  text-align: center;
  transition: background-color 0.3s ease;
}

th {
  background: var(--accent-color);
  color: var(--primary-color);
  font-family: "Orbitron", sans-serif;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
}

tr:nth-child(even) {
  background-color: rgba(212, 0, 28, 0.05);
}

tr:hover {
  background-color: rgba(212, 0, 28, 0.1);
}

/* ===============================    RECRUITING SECTION =============================== */
.team-recruits {
  margin-bottom: 2.5rem;
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 1.25rem;
}

.recruits-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(12.5rem, 1fr));
  gap: 1.25rem;
}

.recruit-card.minimal {
  background: var(--primary-color);
  border: 1px solid var(--border-color);
  border-radius: 0.375rem;
  padding: 0.625rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.3125rem;
  transition: all 0.3s ease;
}

.recruit-card.minimal:hover {
  transform: scale(1.05);
  box-shadow: 0 0.25rem 0.5rem var(--shadow-color);
}

.recruit-info h4 {
  font-family: "Orbitron", sans-serif;
  font-size: 1rem;
  margin: 0;
  color: var(--text-color);
}

.recruit-info p {
  font-family: "Titillium Web", sans-serif;
  font-size: 0.9rem;
  margin: 0;
  color: var(--text-color);
}

.recruit-stars {
  display: flex;
  gap: 0.125rem;
}

.star-icon {
  font-size: 0.9rem;
  color: var(--accent-color);
  transition: color 0.3s ease;
}

.star-icon:hover {
  color: darken(var(--accent-color), 10%);
}

.star-icon.empty {
  color: var(--border-color);
}

/* ===============================    STATS & METRICS =============================== */
.stat-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(12.5rem, 1fr));
  gap: 1.25rem;
  max-width: 50rem;
  margin: 1.25rem auto 0;
}

.stat-box {
  background: var(--primary-color);
  border-radius: 0.5rem;
  box-shadow: 0 0.25rem 0.5rem var(--shadow-color);
  padding: 1.25rem;
  text-align: center;
  transition: all 0.3s ease;
  border: 1px solid var(--border-color);
}

.stat-box:hover {
  transform: translateY(-0.3125rem);
  box-shadow: 0 0.5rem 1rem var(--hover-shadow-color);
}

.stat-number {
  font-family: "Orbitron", sans-serif;
  font-size: 2rem;
  font-weight: bold;
  color: var(--accent-color);
}

/* ===============================    RESPONSIVE DESIGN =============================== */
@media (max-width: 768px) {
  .hero h1 {
    font-size: 2.5rem;
  }

  .hero p {
    font-size: 1.2rem;
  }

  .hero-logo {
    width: 7.5rem;
    height: 7.5rem;
  }

  .news-grid, .scores-list, .recruits-grid {
    grid-template-columns: 1fr;
  }
}
      `}</style>
    </div>
  );
};

export default SEC;