import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
} from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import L from "leaflet";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaStar,
  FaSearch,
  FaInfoCircle,
  FaMapMarkedAlt,
  FaTrophy,
  FaFootballBall,
  FaSyncAlt,
  FaChartBar,
} from "react-icons/fa";
import newsService from "../services/newsService";
import teamsService from "../services/teamsService";
import "../styles/Teams.css";

// US boundaries (for map constraints)
const US_BOUNDS = [
  [24.396308, -125.0], // Southwest
  [49.384358, -66.93457], // Northeast
];

// Component to control the map (fit to bounds, restrict panning)
const MapControls = () => {
  const map = useMap();
  useEffect(() => {
    map.fitBounds(US_BOUNDS);
    map.setMinZoom(3);
    map.setMaxBounds([
      [15, -140],
      [55, -50],
    ]);
  }, [map]);
  return null;
};

// Create a custom marker icon with a star badge for a given star rating.
const createStarIcon = (starRating) => {
  const colors = {
    3: "#4287f5", // Blue
    4: "#f5a742", // Orange
    5: "#f54242", // Red
  };

  return L.divIcon({
    className: `star-marker star-${starRating}`,
    html: `
      <div class="marker-container">
        <div class="pulse-ring" style="background-color: ${colors[starRating] || "#888"}"></div>
        <div class="star-badge" style="background-color: ${colors[starRating] || "#888"}">
          ${starRating}★
        </div>
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });
};

const SEC = () => {
  // --------------------------
  // Data for News, Scores, Polls, Ratings
  // --------------------------
  const [secNews, setSecNews] = useState([]);
  const [secScores, setSecScores] = useState([]);
  const [secPolls, setSecPolls] = useState([]);
  const [secTeamRatings, setSecTeamRatings] = useState({});
  const [secTeams, setSecTeams] = useState([]);
  const [loading, setLoading] = useState(true);

  // --------------------------
  // Recruiting Map States (using your commits logic)
  // --------------------------
  const [prospects, setProspects] = useState([]);
  const [teams, setTeams] = useState([]); // For logo lookup in recruiting
  const [mapMode, setMapMode] = useState("markers"); // "markers" or "clusters"
  const [filters, setFilters] = useState({
    position: "All",
    stars: 0,
    team: "",
    committed: "all", // all, committed, uncommitted
    state: "All",
  });
  const [statsVisible, setStatsVisible] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const mapRef = useRef(null);

  // --------------------------
  // Team logo caching (for recruiting and game cards)
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
  // Fetch Data for the SEC Hub
  // --------------------------
  useEffect(() => {
    const fetchSECData = async () => {
      try {
        setLoading(true);
        // Fetch all teams and filter for SEC
        const allTeams = await teamsService.getTeams();
        const filteredSECTeams = allTeams.filter(
          (team) => team.conference === "SEC"
        );
        setSecTeams(filteredSECTeams);
        const secTeamNames = filteredSECTeams.map((team) => team.school);

        // Fetch SEC news
        const newsData = await newsService.fetchNews("SEC conference news");
        setSecNews(newsData.articles || newsData);

        // Fetch games (using week 3 as an example) and filter for SEC games
        const gamesData = await teamsService.getGames(3);
        const filteredSECGameScores = gamesData.filter(
          (game) =>
            secTeamNames.includes(game.homeTeam) ||
            secTeamNames.includes(game.awayTeam)
        );
        setSecScores(filteredSECGameScores);

        // Fetch polls for 2024, week 3, and filter for SEC teams
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

        // Fetch recruits for 2025 and filter for SEC (only those committed to SEC schools)
        const recruitsData = await teamsService.getAllRecruits(2025);
        const filteredSECRecruits = recruitsData.filter(
          (recruit) => recruit.committedTo && secTeamNames.includes(recruit.committedTo)
        );
        // Use filtered recruits for the recruiting section (or you can combine uncommitted if desired)
        setProspects(
          recruitsData
            .filter((r) => !r.committedTo || secTeamNames.includes(r.committedTo))
            .map((prospect, index) => ({
              ...prospect,
              id: prospect.id || `prospect-${index}`,
            }))
        );
        setSecRecruits(filteredSECRecruits);

        // Also set teams for recruiting map logo lookup.
        setTeams(allTeams);
        setMapReady(true);
      } catch (error) {
        console.error("Error fetching SEC hub data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSECData();
  }, []);

  // --------------------------
  // Recruiting Map Filter Logic
  // --------------------------
  const filteredProspects = useMemo(() => {
    return prospects.filter((prospect) => {
      if (filters.position !== "All" && prospect.position !== filters.position) {
        return false;
      }
      if (filters.stars > 0 && (prospect.stars || 0) < filters.stars) {
        return false;
      }
      if (
        filters.team &&
        (!prospect.committedTo ||
          !prospect.committedTo.toLowerCase().includes(filters.team.toLowerCase()))
      ) {
        return false;
      }
      if (
        (filters.committed === "committed" && !prospect.committedTo) ||
        (filters.committed === "uncommitted" && prospect.committedTo)
      ) {
        return false;
      }
      if (filters.state !== "All" && prospect.stateProvince !== filters.state) {
        return false;
      }
      return true;
    });
  }, [prospects, filters]);

  // Calculate team stats for recruits
  const teamStats = useMemo(() => {
    const stats = {};
    const committedProspects = prospects.filter((p) => p.committedTo);
    committedProspects.forEach((prospect) => {
      const team = prospect.committedTo;
      if (!stats[team]) {
        stats[team] = {
          name: team,
          count: 0,
          totalStars: 0,
          fiveStars: 0,
          fourStars: 0,
          threeStars: 0,
        };
      }
      stats[team].count++;
      stats[team].totalStars += prospect.stars || 0;
      if (prospect.stars === 5) stats[team].fiveStars++;
      if (prospect.stars === 4) stats[team].fourStars++;
      if (prospect.stars === 3) stats[team].threeStars++;
    });
    Object.keys(stats).forEach((team) => {
      stats[team].avgStars =
        stats[team].count > 0 ? stats[team].totalStars / stats[team].count : 0;
    });
    return Object.values(stats).sort((a, b) => {
      const diff = b.totalStars - a.totalStars;
      return diff !== 0 ? diff : b.avgStars - a.avgStars;
    });
  }, [prospects]);

  const handleFilterChange = useCallback((e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: name === "stars" ? parseInt(value, 10) : value,
    }));
  }, []);

  const handleMapModeChange = useCallback((mode) => setMapMode(mode), []);
  const resetMapView = useCallback(() => {
    if (mapRef.current) {
      mapRef.current.fitBounds(US_BOUNDS);
    }
  }, []);
  const toggleStats = useCallback(() => setStatsVisible((prev) => !prev), []);

  const createProspectPopup = useCallback(
    (prospect) => (
      <div className="prospect-popup-content">
        <div className="prospect-popup-header">
          <div className="prospect-popup-stars">
            {[...Array(5)].map((_, i) => (
              <FaStar
                key={i}
                className={`star-icon ${i < prospect.stars ? "filled" : "empty"}`}
              />
            ))}
          </div>
          <div className="prospect-popup-rating">
            {prospect.rating ? prospect.rating.toFixed(2) : "N/A"}
          </div>
        </div>
        <h3 className="prospect-popup-name">{prospect.name}</h3>
        <div className="prospect-popup-details">
          <div className="prospect-popup-rank">
            <FaTrophy /> Rank: #{prospect.ranking || "N/A"}
          </div>
          <div className="prospect-popup-position">
            {prospect.position || "Unknown"}
          </div>
          <div className="prospect-popup-hometown">
            {prospect.city || ""}
            {prospect.city && prospect.stateProvince ? ", " : ""}
            {prospect.stateProvince || ""}
          </div>
          <div className="prospect-popup-metrics">
            {prospect.height
              ? `${Math.floor(prospect.height / 12)}'${prospect.height % 12}"`
              : ""}
            {prospect.height && prospect.weight ? " · " : ""}
            {prospect.weight ? `${prospect.weight} lbs` : ""}
          </div>
        </div>
        {prospect.committedTo ? (
          <div className="prospect-popup-commitment">
            <img
              src={getTeamLogo(prospect.committedTo)}
              alt={`${prospect.committedTo} Logo`}
              className="popup-team-logo"
            />
            <span>Committed to {prospect.committedTo}</span>
          </div>
        ) : (
          <div className="prospect-popup-uncommitted">
            <span>Uncommitted</span>
          </div>
        )}
      </div>
    ),
    [getTeamLogo]
  );

  if (loading) return <div className="loading">Loading SEC data...</div>;

  return (
    <div className="sec-page">
      {/* Hero Section */}
      <section className="hero">
        <img src="/photos/SEC.png" alt="SEC Logo" className="hero-logo" />
        <h1>SEC</h1>
        <p>
          Your hub for SEC news, scores, polls, recruiting, team ratings, and
          more.
        </p>
      </section>

      {/* News Section */}
      <section className="section news">
        <h2>Latest SEC News</h2>
        <div className="news-grid">
          {secNews.map((article, idx) => (
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
              <a
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
              >
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
                  <img
                    src={getTeamLogo(game.awayTeam)}
                    alt={game.awayTeam}
                    className="game-team-logo"
                  />
                  <span>
                    <strong>{game.awayTeam}</strong> {game.awayPoints}
                  </span>
                </div>
                <div className="game-card-body">
                  <span>
                    {new Date(game.startDate).toLocaleString()}
                  </span>
                  <span>{game.venue}</span>
                </div>
                <div className="game-card-footer">
                  <img
                    src={getTeamLogo(game.homeTeam)}
                    alt={game.homeTeam}
                    className="game-team-logo"
                  />
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

      {/* Recruiting Map Section */}
      <section className="section recruiting">
        <h2>2025 SEC Recruiting Map</h2>
        <div className="map-controls">
          <div className="map-toolbar">
            <div className="map-modes">
              <button
                className={`mode-button ${
                  mapMode === "markers" ? "active" : ""
                }`}
                onClick={() => handleMapModeChange("markers")}
              >
                <FaMapMarkedAlt /> Markers
              </button>
              <button
                className={`mode-button ${
                  mapMode === "clusters" ? "active" : ""
                }`}
                onClick={() => handleMapModeChange("clusters")}
              >
                <FaFootballBall /> Clusters
              </button>
            </div>
            <div className="map-actions">
              <button className="action-button" onClick={resetMapView}>
                <FaSyncAlt /> Reset View
              </button>
              <button
                className={`action-button ${statsVisible ? "active" : ""}`}
                onClick={toggleStats}
              >
                <FaChartBar /> {statsVisible ? "Hide Stats" : "Show Stats"}
              </button>
            </div>
          </div>
          <div className="filter-controls">
            <div className="filter-group">
              <label htmlFor="position-select">Position:</label>
              <select
                id="position-select"
                name="position"
                value={filters.position}
                onChange={handleFilterChange}
                className="filter-select"
              >
                <option value="All">All Positions</option>
                {[...new Set(prospects.map((p) => p.position))]
                  .filter(Boolean)
                  .sort()
                  .map((pos) => (
                    <option key={pos} value={pos}>
                      {pos}
                    </option>
                  ))}
              </select>
            </div>
            <div className="filter-group">
              <label htmlFor="stars-select">Min Stars:</label>
              <select
                id="stars-select"
                name="stars"
                value={filters.stars}
                onChange={handleFilterChange}
                className="filter-select"
              >
                <option value="0">Any Rating</option>
                <option value="3">3+ Stars</option>
                <option value="4">4+ Stars</option>
                <option value="5">5 Stars</option>
              </select>
            </div>
            <div className="filter-group">
              <label htmlFor="commitment-select">Status:</label>
              <select
                id="commitment-select"
                name="committed"
                value={filters.committed}
                onChange={handleFilterChange}
                className="filter-select"
              >
                <option value="all">All Recruits</option>
                <option value="committed">Committed Only</option>
                <option value="uncommitted">Uncommitted Only</option>
              </select>
            </div>
            <div className="filter-group">
              <label htmlFor="state-select">State:</label>
              <select
                id="state-select"
                name="state"
                value={filters.state}
                onChange={handleFilterChange}
                className="filter-select"
              >
                <option value="All">All States</option>
                {[...new Set(prospects.map((p) => p.stateProvince))]
                  .filter(Boolean)
                  .sort()
                  .map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
              </select>
            </div>
            <div className="filter-group search-group">
              <label htmlFor="team-search">School:</label>
              <div className="search-input-container">
                <FaSearch className="search-icon" />
                <input
                  id="team-search"
                  type="text"
                  name="team"
                  value={filters.team}
                  onChange={handleFilterChange}
                  placeholder="Search school..."
                  className="team-search"
                />
              </div>
            </div>
          </div>
        </div>
        <div className="map-container">
          {mapReady && (
            <MapContainer
              center={[39.8283, -98.5795]}
              zoom={4}
              style={{ height: "70vh", width: "100%" }}
              ref={mapRef}
              scrollWheelZoom={true}
            >
              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>
                  contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
              />
              <MapControls />
              {mapMode === "markers" &&
                filteredProspects.map((prospect) => {
                  if (
                    !prospect.hometownInfo?.latitude ||
                    !prospect.hometownInfo?.longitude
                  ) {
                    return null;
                  }
                  return (
                    <Marker
                      key={prospect.id}
                      position={[
                        prospect.hometownInfo.latitude,
                        prospect.hometownInfo.longitude,
                      ]}
                      icon={createStarIcon(prospect.stars)}
                    >
                      <Popup className="prospect-popup">
                        {createProspectPopup(prospect)}
                      </Popup>
                    </Marker>
                  );
                })}
              {mapMode === "clusters" && (
                <MarkerClusterGroup
                  chunkedLoading
                  maxClusterRadius={50}
                  spiderfyOnMaxZoom
                  disableClusteringAtZoom={8}
                >
                  {filteredProspects.map((prospect) => {
                    if (
                      !prospect.hometownInfo?.latitude ||
                      !prospect.hometownInfo?.longitude
                    ) {
                      return null;
                    }
                    return (
                      <Marker
                        key={prospect.id}
                        position={[
                          prospect.hometownInfo.latitude,
                          prospect.hometownInfo.longitude,
                        ]}
                        icon={createStarIcon(prospect.stars)}
                      >
                        <Popup className="prospect-popup">
                          {createProspectPopup(prospect)}
                        </Popup>
                      </Marker>
                    );
                  })}
                </MarkerClusterGroup>
              )}
            </MapContainer>
          )}
          <AnimatePresence>
            {statsVisible && (
              <motion.div
                className="stats-panel"
                initial={{ opacity: 0, x: 300 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 300 }}
                transition={{ duration: 0.3 }}
              >
                <div className="stats-panel-header">
                  <h3>2025 Recruiting Stats</h3>
                  <button className="close-stats" onClick={toggleStats}>
                    ×
                  </button>
                </div>
                <div className="stats-panel-content">
                  <div className="stats-summary">
                    <div className="stat-card">
                      <div className="stat-value">
                        {filteredProspects.length}
                      </div>
                      <div className="stat-label">Recruits</div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-value">
                        {filteredProspects.filter((p) => p.stars === 5).length}
                      </div>
                      <div className="stat-label">5-Stars</div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-value">
                        {filteredProspects.filter((p) => p.committedTo).length}
                      </div>
                      <div className="stat-label">Committed</div>
                    </div>
                  </div>
                  <div className="top-teams-section">
                    <h4>Top Recruiting Teams</h4>
                    <div className="team-rankings">
                      {teamStats.slice(0, 10).map((team, index) => (
                        <div key={team.name} className="team-rank-card">
                          <div className="team-rank-position">{index + 1}</div>
                          <div className="team-rank-logo">
                            <img
                              src={getTeamLogo(team.name)}
                              alt={`${team.name} Logo`}
                              loading="lazy"
                            />
                          </div>
                          <div className="team-rank-info">
                            <div className="team-rank-name">{team.name}</div>
                            <div className="team-rank-stats">
                              <div className="team-rank-commits">
                                {team.count} commits
                              </div>
                              <div className="team-rank-stars">
                                {team.avgStars.toFixed(2)} avg ★
                              </div>
                            </div>
                            <div className="team-star-breakdown">
                              {team.fiveStars > 0 && (
                                <span className="five-star-count">
                                  {team.fiveStars} × 5★
                                </span>
                              )}
                              {team.fourStars > 0 && (
                                <span className="four-star-count">
                                  {team.fourStars} × 4★
                                </span>
                              )}
                              {team.threeStars > 0 && (
                                <span className="three-star-count">
                                  {team.threeStars} × 3★
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* Map Legend */}
      <div className="map-legend">
        <div className="legend-item">
          <div className="legend-marker five-star"></div>
          <span>5-Star Recruit</span>
        </div>
        <div className="legend-item">
          <div className="legend-marker four-star"></div>
          <span>4-Star Recruit</span>
        </div>
        <div className="legend-item">
          <div className="legend-marker three-star"></div>
          <span>3-Star Recruit</span>
        </div>
        <div className="legend-info">
          <FaInfoCircle />
          <span>Click on a marker to see recruit details</span>
        </div>
      </div>

      {/* Quick Stats Section */}
      <div className="recruit-stats">
        <h3>Quick Stats</h3>
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
      </div>

      <style jsx>{`
        .sec-page {
          font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
          color: #333;
          padding: 20px;
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
          margin-bottom: 40px;
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
        .section {
          padding: 40px 20px;
          margin-bottom: 40px;
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
        .game-card-header,
        .game-card-footer {
          display: flex;
          align-items: center;
          gap: 10px;
          justify-content: center;
          margin-bottom: 10px;
        }
        .game-team-logo {
          width: 40px;
          height: 40px;
          object-fit: contain;
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
        .map-legend {
          display: flex;
          flex-wrap: wrap;
          gap: 1rem;
          align-items: center;
          justify-content: center;
          margin-top: 20px;
        }
        .legend-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .legend-marker {
          width: 20px;
          height: 20px;
          border-radius: 50%;
        }
        .legend-marker.five-star {
          background-color: #f54242;
        }
        .legend-marker.four-star {
          background-color: #f5a742;
        }
        .legend-marker.three-star {
          background-color: #4287f5;
        }
        .legend-info {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .ratings-table {
          width: 100%;
          border-collapse: collapse;
          margin: 0 auto;
        }
        .ratings-table th,
        .ratings-table td {
          border: 1px solid #ddd;
          padding: 8px;
          text-align: center;
        }
        .ratings-table th {
          background: #d4001c;
          color: #fff;
        }
        .recruit-stats {
          text-align: center;
          margin-top: 40px;
        }
        .stat-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          max-width: 800px;
          margin: 20px auto 0 auto;
        }
        .stat-box {
          background: #fff;
          border-radius: 8px;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
          padding: 20px;
        }
        .stat-number {
          font-size: 2rem;
          font-weight: bold;
          color: #d4001c;
        }
        .stats-panel {
          position: absolute;
          top: 10%;
          right: 5%;
          background: rgba(255, 255, 255, 0.95);
          border-radius: 8px;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
          padding: 20px;
          z-index: 1000;
          max-width: 300px;
        }
        .stats-panel-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
        }
        .close-stats {
          background: transparent;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
        }
        @media (max-width: 768px) {
          .hero h1 {
            font-size: 2.5rem;
          }
          .hero p {
            font-size: 1.2rem;
          }
          .hero-logo {
            width: 120px;
            height: 120px;
          }
        }
      `}</style>
    </div>
  );
};

export default SEC;