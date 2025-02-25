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
      // Ties still counted internally but not displayed:
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

// Helper: returns sortable value for a given field
const getSortableValue = (coach, field) => {
  const agg = aggregateCoachData(coach.seasons);
  const lastSeason = coach.seasons[coach.seasons.length - 1] || {};
  switch (field) {
    case "team":
      return lastSeason.school ? lastSeason.school.toLowerCase() : "";
    case "coachName":
      return (coach.firstName + " " + coach.lastName).toLowerCase();
    case "school":
      return lastSeason.school ? lastSeason.school.toLowerCase() : "";
    case "hireDate":
      return coach.hireDate ? new Date(coach.hireDate).getTime() : 0;
    case "games":
      return agg.games;
    case "wins":
      return agg.wins;
    case "losses":
      return agg.losses;
    case "winPct":
      return agg.games > 0 ? (agg.wins / agg.games) * 100 : 0;
    case "srs":
      return agg.count > 0 ? agg.srs / agg.count : 0;
    case "spOverall":
      return agg.count > 0 ? agg.spOverall / agg.count : 0;
    case "spOffense":
      return agg.count > 0 ? agg.spOffense / agg.count : 0;
    case "spDefense":
      return agg.count > 0 ? agg.spDefense / agg.count : 0;
    case "status":
      return agg.count > 0
        ? agg.srs / agg.count +
          agg.spOverall / agg.count +
          agg.spOffense / agg.count +
          agg.spDefense / agg.count
        : 0;
    default:
      return 0;
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
  const [sortField, setSortField] = useState(null);
  const [sortDirection, setSortDirection] = useState("asc");

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
          teamsService.getCoaches(), // Removed the year parameter
          newsService.fetchCollegeCoachNews(),
          newsService.fetchCollegeFootballNews(),
          youtubeService.fetchYoutubeData("college coach interviews"),
          youtubeService.fetchYoutubeData("college football coach highlights"),
        ]);

        setTeams(teamsData);
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

  // Build processedCoaches array with computed fields for display and sorting
  const processedCoaches = coachInfo.map((coach) => {
    const agg = aggregateCoachData(coach.seasons);
    const lastSeason = coach.seasons[coach.seasons.length - 1] || {};
    const avgSrs = agg.count > 0 ? (agg.srs / agg.count).toFixed(1) : "N/A";
    const avgSpOverall = agg.count > 0 ? (agg.spOverall / agg.count).toFixed(1) : "N/A";
    const avgSpOffense = agg.count > 0 ? (agg.spOffense / agg.count).toFixed(1) : "N/A";
    const avgSpDefense = agg.count > 0 ? (agg.spDefense / agg.count).toFixed(1) : "N/A";
    const winPct = agg.games > 0 ? ((agg.wins / agg.games) * 100).toFixed(1) : "N/A";
    const composite = agg.count > 0
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
      hireDateFormatted: coach.hireDate
        ? new Date(coach.hireDate).toLocaleDateString("en-US", { month: "2-digit", year: "numeric" })
        : "N/A",
    };
  });

  // Sorting: sort processedCoaches based on sortField and sortDirection
  let displayedCoaches = [...processedCoaches];
  if (sortField) {
    displayedCoaches.sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];
      if (sortField === "hireDate") {
        aValue = aValue ? aValue.getTime() : 0;
        bValue = bValue ? bValue.getTime() : 0;
      }
      if (typeof aValue === "string") {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }
      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  } else {
    displayedCoaches.sort((a, b) => b.composite - a.composite);
  }

  // Build ranking maps for each category among all processed coaches
  const categoriesForRanking = [
    { key: "wins", better: "higher" },
    { key: "losses", better: "lower" },
    { key: "winPct", better: "higher" },
    { key: "srs", better: "higher" },
    { key: "spOverall", better: "higher" },
    { key: "spOffense", better: "higher" },
    { key: "spDefense", better: "higher" },
  ];
  const rankingMap = {};
  categoriesForRanking.forEach((cat) => {
    const sorted = [...processedCoaches].sort((a, b) => {
      if (cat.better === "higher") {
        return b[cat.key] - a[cat.key];
      } else {
        return a[cat.key] - b[cat.key];
      }
    });
    rankingMap[cat.key] = {};
    sorted.forEach((coach, index) => {
      rankingMap[cat.key][coach.coachName] = index + 1;
    });
  });
  const totalCoaches = processedCoaches.length;

  // Comparison data for selected coaches
  const comparisonData = selectedCoaches.map((coach) => {
    const agg = aggregateCoachData(coach.seasons);
    const avgSrs = agg.count > 0 ? parseFloat((agg.srs / agg.count).toFixed(1)) : 0;
    const avgSpOverall = agg.count > 0 ? parseFloat((agg.spOverall / agg.count).toFixed(1)) : 0;
    const avgSpOffense = agg.count > 0 ? parseFloat((agg.spOffense / agg.count).toFixed(1)) : 0;
    const avgSpDefense = agg.count > 0 ? parseFloat((agg.spDefense / agg.count).toFixed(1)) : 0;
    return {
      coach,
      stats: {
        wins: agg.wins,
        losses: agg.losses,
        winPct: agg.games > 0 ? parseFloat(((agg.wins / agg.games) * 100).toFixed(1)) : 0,
        srs: avgSrs,
        spOverall: avgSpOverall,
        spOffense: avgSpOffense,
        spDefense: avgSpDefense,
      },
    };
  });

  // Define comparison categories (for the comparison table)
  const comparisonCategories = [
    { key: "wins", label: "Wins", better: "higher" },
    { key: "losses", label: "Losses", better: "lower" },
    { key: "winPct", label: "Win %", better: "higher" },
    { key: "srs", label: "SRS", better: "higher" },
    { key: "spOverall", label: "SP Overall", better: "higher" },
    { key: "spOffense", label: "SP Offense", better: "higher" },
    { key: "spDefense", label: "SP Defense", better: "higher" },
  ];

  // For each category, determine best and worst among selected coaches
  const getBestWorst = (key, better) => {
    const values = comparisonData.map((data) => data.stats[key]);
    if (values.length === 0) return { best: null, worst: null };

    let best, worst;
    if (better === "higher") {
      best = Math.max(...values);
      worst = Math.min(...values);
    } else {
      best = Math.min(...values);
      worst = Math.max(...values);
    }
    return { best, worst };
  };

  return (
    <div className="coach-overview-container">
      {/* Hero Section */}
      <div className="coach-hero">
        <h1>
          <FaUserTie className="icon" /> Coach Overview
        </h1>
        <p>
          Stay updated with the latest coach profiles, news, and video highlights.
        </p>
      </div>

      {/* Display selected coaches for comparison */}
      {selectedCoaches.length > 0 && (
        <div className="selected-coaches">
          <h3>Selected for Comparison:</h3>
          <ul>
            {selectedCoaches.map((coach, idx) => (
              <li key={idx}>
                {coach.firstName} {coach.lastName}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Coach Profiles Section */}
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
                    <th onClick={() => handleSort("srs")}>
                      SRS <span title="Simple Rating System">[?]</span>
                    </th>
                    <th onClick={() => handleSort("spOverall")}>SP Overall</th>
                    <th onClick={() => handleSort("spOffense")}>SP Offense</th>
                    <th onClick={() => handleSort("spDefense")}>SP Defense</th>
                    <th onClick={() => handleSort("status")}>Status</th>
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
                      <td>
                        {item.wins}
                        {(() => {
                          const rank = rankingMap["wins"][item.coachName];
                          if (rank === 1) return <div className="extra-info">League best</div>;
                          if (rank === totalCoaches) return <div className="extra-info">League worst</div>;
                          if (rank <= 5) return <div className="extra-info">Top 5</div>;
                          return null;
                        })()}
                      </td>
                      <td>
                        {item.losses}
                        {(() => {
                          const rank = rankingMap["losses"][item.coachName];
                          if (rank === 1) return <div className="extra-info">League best</div>;
                          if (rank === totalCoaches) return <div className="extra-info">League worst</div>;
                          if (rank <= 5) return <div className="extra-info">Top 5</div>;
                          return null;
                        })()}
                      </td>
                      <td>
                        {item.winPct !== 0 ? `${item.winPct}%` : "N/A"}
                        {(() => {
                          const rank = rankingMap["winPct"][item.coachName];
                          if (rank === 1) return <div className="extra-info">League best</div>;
                          if (rank === totalCoaches) return <div className="extra-info">League worst</div>;
                          if (rank <= 5) return <div className="extra-info">Top 5</div>;
                          return null;
                        })()}
                      </td>
                      <td>
                        {item.srs}
                        {(() => {
                          const rank = rankingMap["srs"][item.coachName];
                          if (rank === 1) return <div className="extra-info">League best</div>;
                          if (rank === totalCoaches) return <div className="extra-info">League worst</div>;
                          if (rank <= 5) return <div className="extra-info">Top 5</div>;
                          return null;
                        })()}
                      </td>
                      <td>
                        {item.spOverall}
                        {(() => {
                          const rank = rankingMap["spOverall"][item.coachName];
                          if (rank === 1) return <div className="extra-info">League best</div>;
                          if (rank === totalCoaches) return <div className="extra-info">League worst</div>;
                          if (rank <= 5) return <div className="extra-info">Top 5</div>;
                          return null;
                        })()}
                      </td>
                      <td>
                        {item.spOffense}
                        {(() => {
                          const rank = rankingMap["spOffense"][item.coachName];
                          if (rank === 1) return <div className="extra-info">League best</div>;
                          if (rank === totalCoaches) return <div className="extra-info">League worst</div>;
                          if (rank <= 5) return <div className="extra-info">Top 5</div>;
                          return null;
                        })()}
                      </td>
                      <td>
                        {item.spDefense}
                        {(() => {
                          const rank = rankingMap["spDefense"][item.coachName];
                          if (rank === 1) return <div className="extra-info">League best</div>;
                          if (rank === totalCoaches) return <div className="extra-info">League worst</div>;
                          if (rank <= 5) return <div className="extra-info">Top 5</div>;
                          return null;
                        })()}
                      </td>
                      <td className="status-label" style={{
                          fontStyle: "italic",
                          fontWeight: "normal",
                          fontFamily: '"Orbitron", "Titillium Web", sans-serif'
                        }}>
                        {item.status.text === "Premiere Coach" ? "Premiere" : item.status.text}
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