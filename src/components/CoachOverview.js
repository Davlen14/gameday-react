import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
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

// Determine coach status based on composite score (average of SRS, SP Overall, SP Offense, SP Defense)
const getCoachStatus = (score) => {
  if (score >= 60) {
    return { text: "Premiere Coach", color: "green" };
  } else if (score < 40) {
    return { text: "On Hot Seat", color: "red" };
  } else {
    return { text: "Average", color: "blue" };
  }
};

// Helper: returns a sortable value for each column
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
        ? (agg.srs + agg.spOverall + agg.spOffense + agg.spDefense) / agg.count
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
          teamsService.getCoaches(),
          newsService.fetchCollegeCoachNews(),
          newsService.fetchCollegeFootballNews(),
          youtubeService.fetchYoutubeData("college coach interviews"),
          youtubeService.fetchYoutubeData("college football coach highlights"),
        ]);

        setTeams(teamsData);

        // Filter for active coaches only (must have a 2024 season)
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

  // Toggle selection of a single coach
  const handleSelectCoach = (coach) => {
    const coachKey = coach.firstName + " " + coach.lastName;
    if (selectedCoaches.some((c) => c.firstName + " " + c.lastName === coachKey)) {
      setSelectedCoaches(
        selectedCoaches.filter((c) => c.firstName + " " + c.lastName !== coachKey)
      );
    } else {
      setSelectedCoaches([...selectedCoaches, coach]);
    }
  };

  // Check if a coach is selected
  const isCoachSelected = (coach) => {
    const coachKey = coach.firstName + " " + coach.lastName;
    return selectedCoaches.some((c) => c.firstName + " " + c.lastName === coachKey);
  };

  // Sorting
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Process coaches for display
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
        ? new Date(coach.hireDate).toLocaleDateString("en-US", {
            month: "2-digit",
            year: "numeric",
          })
        : "N/A",
    };
  });

  // Sort processed coaches based on sortField/sortDirection or default composite descending
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

  // Build ranking maps for numeric categories (spDefense: lower is better)
  const categoriesForRanking = [
    { key: "wins", better: "higher" },
    { key: "losses", better: "lower" },
    { key: "winPct", better: "higher" },
    { key: "srs", better: "higher" },
    { key: "spOverall", better: "higher" },
    { key: "spOffense", better: "higher" },
    { key: "spDefense", better: "lower" },
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

  // Build comparison data for selected coaches
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

  // Define comparison categories for the comparison table
  const comparisonCategories = [
    { key: "wins", label: "Wins", better: "higher" },
    { key: "losses", label: "Losses", better: "lower" },
    { key: "winPct", label: "Win %", better: "higher" },
    { key: "srs", label: "SRS", better: "higher" },
    { key: "spOverall", label: "SP Overall", better: "higher" },
    { key: "spOffense", label: "SP Offense", better: "higher" },
    { key: "spDefense", label: "SP Defense", better: "lower" },
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
    <div
      className="coach-overview-container"
      style={{ fontFamily: '"Orbitron", "Titillium Web", sans-serif' }}
    >
      {/* Hero Section */}
      <div className="coach-hero">
        <h1>Coach Overview</h1>
        <p>Stay updated with the latest coach profiles, news, and video highlights.</p>
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
                    {/* Empty header cell for checkboxes */}
                    <th></th>
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
                    <th onClick={() => handleSort("status")}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedCoaches.map((item, index) => {
                    // Calculate extra ranking info per numeric category:
                    const rankWins = rankingMap["wins"][item.coachName];
                    const rankLosses = rankingMap["losses"][item.coachName];
                    const rankWinPct = rankingMap["winPct"][item.coachName];
                    const rankSrs = rankingMap["srs"][item.coachName];
                    const rankOverall = rankingMap["spOverall"][item.coachName];
                    const rankOffense = rankingMap["spOffense"][item.coachName];
                    const rankDefense = rankingMap["spDefense"][item.coachName];

                    return (
                      <tr key={index}>
                        {/* Row checkbox */}
                        <td>
                          <input
                            type="checkbox"
                            checked={isCoachSelected(item.coach)}
                            onChange={() => handleSelectCoach(item.coach)}
                          />
                        </td>
                        {/* Team logo clickable: if team data exists, wrap in Link */}
                        <td>
                          {(() => {
                            const teamData = teams.find(
                              (t) =>
                                t.school.toLowerCase() ===
                                item.school.toLowerCase()
                            );
                            const logo = getTeamLogo(item.school);
                            return teamData ? (
                              <Link to={`/teams/${teamData.id}`}>
                                <img
                                  src={logo}
                                  alt={item.school}
                                  className="coach-team-logo"
                                />
                              </Link>
                            ) : (
                              <img
                                src={logo}
                                alt={item.school}
                                className="coach-team-logo"
                              />
                            );
                          })()}
                        </td>
                        <td>{item.coachName}</td>
                        <td>{item.school}</td>
                        <td>{item.hireDateFormatted}</td>
                        <td>{item.games}</td>

                        {/* Wins */}
                        <td>
                          {item.wins}
                          {rankWins === 1 && (
                            <div className="extra-info" style={{ color: "gold" }}>
                              League Best 🏆
                            </div>
                          )}
                          {rankWins === totalCoaches && (
                            <div className="extra-info" style={{ color: "red" }}>
                              League Worst
                            </div>
                          )}
                          {rankWins > 1 && rankWins <= 5 && (
                            <div className="extra-info" style={{ color: "green" }}>
                              Top 5
                            </div>
                          )}
                        </td>

                        {/* Losses */}
                        <td>
                          {item.losses}
                          {rankLosses === 1 && (
                            <div className="extra-info" style={{ color: "gold" }}>
                              League Best 🏆
                            </div>
                          )}
                          {rankLosses === totalCoaches && (
                            <div className="extra-info" style={{ color: "red" }}>
                              League Worst
                            </div>
                          )}
                          {rankLosses > 1 && rankLosses <= 5 && (
                            <div className="extra-info" style={{ color: "green" }}>
                              Top 5
                            </div>
                          )}
                        </td>

                        {/* Win % */}
                        <td>
                          {item.winPct !== 0 ? `${item.winPct}%` : "N/A"}
                          {rankWinPct === 1 && (
                            <div className="extra-info" style={{ color: "gold" }}>
                              League Best 🏆
                            </div>
                          )}
                          {rankWinPct === totalCoaches && (
                            <div className="extra-info" style={{ color: "red" }}>
                              League Worst
                            </div>
                          )}
                          {rankWinPct > 1 && rankWinPct <= 5 && (
                            <div className="extra-info" style={{ color: "green" }}>
                              Top 5
                            </div>
                          )}
                        </td>

                        {/* SRS */}
                        <td>
                          {item.srs}
                          {rankSrs === 1 && (
                            <div className="extra-info" style={{ color: "gold" }}>
                              League Best 🏆
                            </div>
                          )}
                          {rankSrs === totalCoaches && (
                            <div className="extra-info" style={{ color: "red" }}>
                              League Worst
                            </div>
                          )}
                          {rankSrs > 1 && rankSrs <= 5 && (
                            <div className="extra-info" style={{ color: "green" }}>
                              Top 5
                            </div>
                          )}
                        </td>

                        {/* SP Overall */}
                        <td>
                          {item.spOverall}
                          {rankOverall === 1 && (
                            <div className="extra-info" style={{ color: "gold" }}>
                              League Best 🏆
                            </div>
                          )}
                          {rankOverall === totalCoaches && (
                            <div className="extra-info" style={{ color: "red" }}>
                              League Worst
                            </div>
                          )}
                          {rankOverall > 1 && rankOverall <= 5 && (
                            <div className="extra-info" style={{ color: "green" }}>
                              Top 5
                            </div>
                          )}
                        </td>

                        {/* SP Offense */}
                        <td>
                          {item.spOffense}
                          {rankOffense === 1 && (
                            <div className="extra-info" style={{ color: "gold" }}>
                              League Best 🏆
                            </div>
                          )}
                          {rankOffense === totalCoaches && (
                            <div className="extra-info" style={{ color: "red" }}>
                              League Worst
                            </div>
                          )}
                          {rankOffense > 1 && rankOffense <= 5 && (
                            <div className="extra-info" style={{ color: "green" }}>
                              Top 5
                            </div>
                          )}
                        </td>

                        {/* SP Defense (lower is better) */}
                        <td>
                          {item.spDefense}
                          {rankDefense === 1 && (
                            <div className="extra-info" style={{ color: "gold" }}>
                              League Best 🏆
                            </div>
                          )}
                          {rankDefense === totalCoaches && (
                            <div className="extra-info" style={{ color: "red" }}>
                              League Worst
                            </div>
                          )}
                          {rankDefense > 1 && rankDefense <= 5 && (
                            <div className="extra-info" style={{ color: "green" }}>
                              Top 5
                            </div>
                          )}
                        </td>

                        {/* Status */}
                        <td
                          className="status-label"
                          style={{
                            color: item.status.color,
                            fontStyle: "italic",
                            fontWeight: "normal",
                          }}
                        >
                          {item.status.text}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Stat Definitions */}
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
                  const values = comparisonData.map((d) => d.stats[cat.key]);
                  let best, worst;
                  if (values.length > 0) {
                    if (cat.better === "higher") {
                      best = Math.max(...values);
                      worst = Math.min(...values);
                    } else {
                      best = Math.min(...values);
                      worst = Math.max(...values);
                    }
                  } else {
                    best = null;
                    worst = null;
                  }

                  return (
                    <tr key={cat.key}>
                      <td>{cat.label}</td>
                      {comparisonData.map((data, idx2) => {
                        const value = data.stats[cat.key];
                        let style = {};
                        if (value === best) {
                          style = { color: "green", fontWeight: "bold" };
                        } else if (value === worst) {
                          style = { color: "red", fontWeight: "bold" };
                        }
                        return (
                          <td key={idx2} style={style}>
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