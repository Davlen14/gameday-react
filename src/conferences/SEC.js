import React, { useState, useEffect } from "react";
import newsService from "../services/newsService";
import teamsService from "../services/teamsService";

const SECHub = () => {
  const [news, setNews] = useState([]);
  const [scores, setScores] = useState([]);
  const [polls, setPolls] = useState([]);
  const [recruits, setRecruits] = useState([]);
  const [secTeams, setSecTeams] = useState([]);
  const [teamRatings, setTeamRatings] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        // 1. Fetch all teams and filter for SEC
        const allTeams = await teamsService.getTeams();
        const secTeams = allTeams.filter(team => team.conference === "SEC");
        setSecTeams(secTeams);
        const secTeamNames = secTeams.map(team => team.school);

        // 2. Fetch SEC news using a query targeting SEC-related coverage
        const newsData = await newsService.fetchNews("SEC conference football news");
        // API response may contain an articles array, or it may be the array itself
        setNews(newsData.articles || newsData);

        // 3. Fetch recent games (e.g. week 3 as an example) and filter for SEC games
        const gamesData = await teamsService.getGames(3);
        const secScores = gamesData.filter(
          game =>
            secTeamNames.includes(game.homeTeam) ||
            secTeamNames.includes(game.awayTeam)
        );
        setScores(secScores);

        // 4. Fetch polls for 2024 (regular season, week 3) and filter for SEC teams
        const pollsData = await teamsService.getPolls(2024, "ap", 3);
        const secPolls = pollsData.map(pollGroup => ({
          ...pollGroup,
          rankings: pollGroup.rankings.filter(rank =>
            secTeamNames.includes(rank.school)
          )
        })).filter(pollGroup => pollGroup.rankings.length > 0);
        setPolls(secPolls);

        // 5. Fetch all recruits (for 2025) and filter for SEC schools
        const recruitsData = await teamsService.getAllRecruits(2025);
        const secRecruits = recruitsData.filter(recruit =>
          secTeamNames.includes(recruit.school)
        );
        setRecruits(secRecruits);

        // 6. For each SEC team, fetch team ratings for 2024
        const ratings = {};
        for (const team of secTeams) {
          try {
            const ratingData = await teamsService.getTeamRatings(team.school, 2024);
            ratings[team.school] = ratingData;
          } catch (err) {
            ratings[team.school] = { overall: "N/A", offense: "N/A", defense: "N/A" };
          }
        }
        setTeamRatings(ratings);
      } catch (error) {
        console.error("Error fetching SEC hub data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, []);

  if (loading) return <div className="loading">Loading SEC Hub...</div>;

  return (
    <div className="sec-hub">
      {/* Hero Section */}
      <section className="hero">
        <img src="/photos/SEC.png" alt="SEC Logo" className="hero-logo" />
        <h1>SEC Hub</h1>
        <p>
          Your one-stop destination for everything SEC – news, scores, polls,
          recruiting, team ratings, and more.
        </p>
      </section>

      {/* News Section */}
      <section className="section news">
        <h2>Latest SEC News</h2>
        <div className="news-grid">
          {news.map((article, idx) => (
            <div key={idx} className="news-card">
              {article.image && (
                <img
                  src={article.image}
                  alt={article.title}
                  className="news-image"
                />
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
        {scores.length === 0 ? (
          <p>No SEC game scores available.</p>
        ) : (
          <div className="scores-list">
            {scores.map(game => (
              <div key={game.id} className="game-card">
                <p>
                  <strong>{game.awayTeam}</strong> {game.awayPoints} –{" "}
                  {game.homePoints} <strong>{game.homeTeam}</strong>
                </p>
                <p>{new Date(game.startDate).toLocaleString()}</p>
                <p>{game.venue}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Polls Section */}
      <section className="section polls">
        <h2>SEC Polls</h2>
        {polls.length === 0 ? (
          <p>No SEC poll data available.</p>
        ) : (
          polls.map(pollGroup => (
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

      {/* Recruiting Section */}
      <section className="section recruiting">
        <h2>SEC Recruiting</h2>
        {recruits.length === 0 ? (
          <p>No recruiting data available for SEC.</p>
        ) : (
          <div className="recruits-grid">
            {recruits.slice(0, 8).map((recruit, idx) => (
              <div key={idx} className="recruit-card">
                <p>
                  <strong>{recruit.fullName}</strong>
                </p>
                <p>{recruit.position}</p>
                <p>
                  {recruit.homeCity}, {recruit.homeState}
                </p>
              </div>
            ))}
          </div>
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
            {secTeams.map(team => (
              <tr key={team.id}>
                <td>{team.school}</td>
                <td>{teamRatings[team.school]?.overall || "N/A"}</td>
                <td>{teamRatings[team.school]?.offense || "N/A"}</td>
                <td>{teamRatings[team.school]?.defense || "N/A"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <style jsx>{`
        .sec-hub {
          font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
          color: #333;
        }
        .section {
          padding: 40px 20px;
          margin-bottom: 40px;
        }
        .hero {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px 20px;
          text-align: center;
          background: url("/photos/sec-background.jpg")
            no-repeat center center/cover;
          color: #fff;
        }
        .hero-logo {
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
          transition: transform 0.2s, box-shadow 0.2s;
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
        .scores-list,
        .recruits-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 20px;
          max-width: 1400px;
          margin: 0 auto;
        }
        .game-card,
        .recruit-card {
          background: #fff;
          border-radius: 8px;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
          padding: 20px;
          text-align: center;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 0 auto;
        }
        th,
        td {
          border: 1px solid #ddd;
          padding: 8px;
          text-align: center;
        }
        th {
          background: #d4001c;
          color: #fff;
        }
      `}</style>
    </div>
  );
};

export default SECHub;