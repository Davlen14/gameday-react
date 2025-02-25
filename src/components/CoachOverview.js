import React, { useState, useEffect } from "react";
import { FaUserTie } from "react-icons/fa";
import newsService from "../services/newsService";
import teamsService from "../services/teamsService"; // getCoaches is here
import youtubeService from "../services/youtubeService";
import "../styles/CoachOverview.css";

// Helper to aggregate season data for a coach
const aggregateCoachData = (seasons) => {
  return seasons.reduce(
    (acc, season) => {
      acc.games += season.games || 0;
      acc.wins += season.wins || 0;
      acc.losses += season.losses || 0;
      // Ties are still counted internally but not displayed:
      acc.ties += season.ties || 0;
      acc.srs += season.srs || 0;
      acc.spOverall += season.spOverall || 0;
      acc.spOffense += season.spOffense || 0;
      acc.spDefense += season.spDefense || 0;
      acc.count++;
      return acc;
    },
    {
      games: 0,
      wins: 0,
      losses: 0,
      ties: 0,
      srs: 0,
      spOverall: 0,
      spOffense: 0,
      spDefense: 0,
      count: 0,
    }
  );
};

// Determine coach status based on composite score 
// (average of SRS, SP Overall, SP Offense, SP Defense)
const getCoachStatus = (score) => {
  if (score >= 60) {
    return { text: "Premiere Coach", color: "green" };
  } else if (score < 40) {
    return { text: "On Hot Seat", color: "red" };
  } else {
    return { text: "Average", color: "blue" };
  }
};

const CoachOverview = () => {
  const [coachInfo, setCoachInfo] = useState([]);
  const [news, setNews] = useState([]);
  const [teams, setTeams] = useState([]);
  const [videos, setVideos] = useState([]);
  const [loadingCoaches, setLoadingCoaches] = useState(true);
  const [loadingNews, setLoadingNews] = useState(true);
  const [loadingVideos, setLoadingVideos] = useState(true);
  const [selectedCoaches, setSelectedCoaches] = useState([]);

  // Sorting configuration state:
  const [sortConfig, setSortConfig] = useState({
    key: "composite",
    direction: "descending",
  });

  // Fetch data on mount
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const [
          teamsData,
          coachesData,
          coachNewsData,
          footballNewsData,
          youtubeResponse1,
          youtubeResponse2,
        ] = await Promise.all([
          teamsService.getTeams(),
          teamsService.getCoaches(),
          newsService.fetchCollegeCoachNews(),
          newsService.fetchCollegeFootballNews(),
          youtubeService.fetchYoutubeData("college coach interviews"),
          youtubeService.fetchYoutubeData("college football coach highlights"),
        ]);

        setTeams(teamsData);

        // Filter for active coaches only: at least one season with year 2024
        const activeCoaches = coachesData.filter((coach) =>
          coach.seasons.some((season) => season.year === 2024)
        );
        setCoachInfo(activeCoaches);

        const combinedNews = [
          ...(coachNewsData.articles || []),
          ...(footballNewsData.articles || []),
        ];
        setNews(combinedNews);

        const combinedVideos = [
          ...(youtubeResponse1.items || []),
          ...(youtubeResponse2.items || []),
        ];
        setVideos(combinedVideos);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoadingCoaches(false);
        setLoadingNews(false);
        setLoadingVideos(false);
      }
    };

    fetchAllData();
  }, []);

  // Helper: Get team logo based on school name
  const getTeamLogo = (school) => {
    const team = teams.find(
      (t) => t.school.toLowerCase() === school?.toLowerCase()
    );
    return team?.logos?.[0] || "/photos/default_team.png";
  };

  // Toggle selection of a coach for comparison
  const handleSelectCoach = (coach) => {
    const coachKey = coach.firstName + " " + coach.lastName;
    if (
      selectedCoaches.some(
        (c) => c.firstName + " " + c.lastName === coachKey
      )
    ) {
      setSelectedCoaches(
        selectedCoaches.filter(
          (c) => c.firstName + " " + c.lastName !== coachKey
        )
      );
    } else {
      setSelectedCoaches([...selectedCoaches, coach]);
    }
  };

  // Master select/deselect for all coaches
  const handleSelectAll = () => {
    if (selectedCoaches.length === coachInfo.length) {
      setSelectedCoaches([]);
    } else {
      setSelectedCoaches([...coachInfo]);
    }
  };

  // Sorting handler for column headers
  const handleSort = (key) => {
    let direction = "ascending";
    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending";
    }
    setSortConfig({ key, direction });
  };

  // Process coaches into a new array with computed values for sorting and display
  const processedCoaches = coachInfo.map((coach) => {
    const agg = aggregateCoachData(coach.seasons);
    const lastSeason = coach.seasons[coach.seasons.length - 1] || {};
    const avgSrs = agg.count > 0 ? (agg.srs / agg.count).toFixed(1) : "N/A";
    const avgSpOverall =
      agg.count > 0 ? (agg.spOverall / agg.count).toFixed(1) : "N/A";
    const avgSpOffense =
      agg.count > 0 ? (agg.spOffense / agg.count).toFixed(1) : "N/A";
    const avgSpDefense =
      agg.count > 0 ? (agg.spDefense / agg.count).toFixed(1) : "N/A";
    const winPct =
      agg.games > 0 ? ((agg.wins / agg.games) * 100).toFixed(1) : "N/A";
    const composite =
      agg.count > 0
        ? parseFloat(avgSrs) +
          parseFloat(avgSpOverall) +
          parseFloat(avgSpOffense) +
          parseFloat(avgSpDefense)
        : 0;
    return {
      coach,
      team: lastSeason.school || "",
      coachName: coach.firstName + " " + coach.lastName,
      school: lastSeason.school || "",
      hireDate: coach.hireDate ? new Date(coach.hireDate) : null,
      games: agg.games,
      wins: agg.wins,
      losses: agg.losses,
      winPct: winPct === "N/A" ? 0 : parseFloat(winPct),
      srs: avgSrs === "N/A" ? 0 : parseFloat(avgSrs),
      spOverall: avgSpOverall === "N/A" ? 0 : parseFloat(avgSpOverall),
      spOffense: avgSpOffense === "N/A" ? 0 : parseFloat(avgSpOffense),
      spDefense: avgSpDefense === "N/A" ? 0 : parseFloat(avgSpDefense),
      composite,
      status: getCoachStatus(composite),
      // For display, format hireDate as MM/YYYY if available
      hireDateFormatted: coach.hireDate
        ? new Date(coach.hireDate).toLocaleDateString("en-US", {
            month: "2-digit",
            year: "numeric",
          })
        : "N/A",
    };
  });

  // Sort processed coaches based on sortConfig
  let displayedCoaches = [...processedCoaches];
  if (sortConfig.key !== null) {
    displayedCoaches.sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];
      // For hireDate, compare time values (if null, treat as 0)
      if (sortConfig.key === "hireDate") {
        aValue = aValue ? aValue.getTime() : 0;
        bValue = bValue ? bValue.getTime() : 0;
      }
      // For strings, compare case-insensitively
      if (typeof aValue === "string") {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }
      if (aValue < bValue) {
        return sortConfig.direction === "ascending" ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === "ascending" ? 1 : -1;
      }
      return 0;
    });
  }

  return (
    <div className="coach-overview-container">
      {/* Hero Section */}
      <div className="coach-hero">
        <h1>
          <FaUserTie className="icon" /> Coach Overview
        </h1>
        <p>
          Stay updated with the latest coach profiles, news, and video
          highlights.
        </p>
      </div>

      {/* Coach Profiles Section (With Checkbox column and Sorting) */}
      <section className="coach-profiles-section">
        <h2>Coach Profiles (Full Career)</h2>
        {loadingCoaches ? (
          <p className="loading-text">Loading coach profiles...</p>
        ) : displayedCoaches.length > 0 ? (
          <>
            <div className="table-wrapper">
              <table className="coach-table">
                <thead>
                  <tr>
                    {/* Master checkbox column */}
                    <th onClick={handleSelectAll}>
                      <input
                        type="checkbox"
                        checked={
                          selectedCoaches.length === coachInfo.length &&
                          coachInfo.length > 0
                        }
                        readOnly
                      />{" "}
                      Select
                    </th>
                    <th onClick={() => handleSort("team")}>Team</th>
                    <th onClick={() => handleSort("coachName")}>Coach Name</th>
                    <th onClick={() => handleSort("school")}>School</th>
                    <th onClick={() => handleSort("hireDate")}>Hire Date</th>
                    <th onClick={() => handleSort("games")}>Games</th>
                    <th onClick={() => handleSort("wins")}>Wins</th>
                    <th onClick={() => handleSort("losses")}>Losses</th>
                    <th onClick={() => handleSort("winPct")}>Win %</th>
                    <th onClick={() => handleSort("srs")}>SRS</th>
                    <th onClick={() => handleSort("spOverall")}>SP Overall</th>
                    <th onClick={() => handleSort("spOffense")}>SP Offense</th>
                    <th onClick={() => handleSort("spDefense")}>SP Defense</th>
                    <th onClick={() => handleSort("composite")}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedCoaches.map((item, index) => (
                    <tr key={index}>
                      <td>
                        <input
                          type="checkbox"
                          checked={selectedCoaches.some(
                            (c) =>
                              c.firstName + " " + c.lastName === item.coachName
                          )}
                          onChange={() => handleSelectCoach(item.coach)}
                        />
                      </td>
                      <td>
                        <img
                          src={getTeamLogo(item.school)}
                          alt={item.school}
                          className="coach-team-logo"
                        />
                      </td>
                      <td>{item.coachName}</td>
                      <td>{item.school}</td>
                      <td>{item.hireDateFormatted}</td>
                      <td>{item.games}</td>
                      <td>{item.wins}</td>
                      <td>{item.losses}</td>
                      <td>
                        {item.winPct !== 0 ? `${item.winPct}%` : "N/A"}
                      </td>
                      <td>{item.srs}</td>
                      <td>{item.spOverall}</td>
                      <td>{item.spOffense}</td>
                      <td>{item.spDefense}</td>
                      <td className={`status-label ${item.status.color}`}>
                        {item.status.text === "Premiere Coach"
                          ? "Premiere"
                          : item.status.text}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Stat Definitions Card */}
            <div className="stats-info-card">
              <h3>Stat Definitions</h3>
              <ul>
                <li>
                  <strong>SRS:</strong> A measure of a team's performance relative to its opponents.
                </li>
                <li>
                  <strong>SP Overall:</strong> The overall statistical rating.
                </li>
                <li>
                  <strong>SP Offense:</strong> A rating of the team's offensive performance.
                </li>
                <li>
                  <strong>SP Defense:</strong> A rating of the team's defensive performance.
                </li>
                <li>
                  <strong>Win %:</strong> The percentage of games won.
                </li>
              </ul>
            </div>
          </>
        ) : (
          <p>No coach profiles available.</p>
        )}
      </section>

      {/* Comparison Section */}
      {selectedCoaches.length > 1 && (
        <section className="coach-comparison-section">
          <h2>Coach Comparison</h2>
          <div className="table-wrapper">
            <table className="coach-table">
              <thead>
                <tr>
                  <th>Category</th>
                  {comparisonData.map((data, idx) => (
                    <th key={idx}>
                      {data.coach.firstName} {data.coach.lastName}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {comparisonCategories.map((cat) => {
                  const { best, worst } = getBestWorst(cat.key, cat.better);
                  return (
                    <tr key={cat.key}>
                      <td>{cat.label}</td>
                      {comparisonData.map((data, idx) => {
                        const value = data.stats[cat.key];
                        let style = {};
                        if (value === best) {
                          style = { color: "green", fontWeight: "bold" };
                        } else if (value === worst) {
                          style = { color: "red", fontWeight: "bold" };
                        }
                        return (
                          <td key={idx} style={style}>
                            {value}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Coach News Section */}
      <section className="coach-news-section">
        <h2>Coach News</h2>
        {loadingNews ? (
          <p className="loading-text">Loading news...</p>
        ) : news.length > 0 ? (
          <>
            <div className="featured-news">
              <a
                href={news[0].url}
                target="_blank"
                rel="noopener noreferrer"
                className="featured-news-card"
              >
                {news[0].image && (
                  <img
                    src={news[0].image}
                    alt={news[0].title}
                    className="featured-image"
                  />
                )}
                <div className="featured-news-details">
                  <h3>{news[0].title}</h3>
                  <p>{news[0].description}</p>
                  <span className="news-source">{news[0].source.name}</span>
                </div>
              </a>
            </div>
            <div className="news-list">
              {news.slice(1, 5).map((article, idx) => (
                <a
                  key={idx}
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="news-card"
                >
                  {article.image && (
                    <img
                      src={article.image}
                      alt={article.title}
                      className="news-image"
                    />
                  )}
                  <div className="news-details">
                    <h4>{article.title}</h4>
                    <span className="news-source">{article.source.name}</span>
                  </div>
                </a>
              ))}
            </div>
          </>
        ) : (
          <p>No news available.</p>
        )}
      </section>

      {/* Coach Videos Section */}
      <section className="coach-videos-section">
        <h2>Coach Videos</h2>
        {loadingVideos ? (
          <p className="loading-text">Loading videos...</p>
        ) : videos.length > 0 ? (
          <div className="video-grid">
            {videos.map((video) => (
              <div key={video.id.videoId} className="video-card">
                <iframe
                  width="100%"
                  height="200"
                  src={`https://www.youtube.com/embed/${video.id.videoId}`}
                  title={video.snippet.title}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              </div>
            ))}
          </div>
        ) : (
          <p>No videos available.</p>
        )}
      </section>
    </div>
  );
};

export default CoachOverview;