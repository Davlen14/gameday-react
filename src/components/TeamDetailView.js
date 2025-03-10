import React, { useState, useEffect, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import teamsService from "../services/teamsService";

import { 
  FaMapMarkerAlt, 
  FaTrophy, 
  FaUsers, 
  FaArrowLeft, 
  FaCalendarAlt, 
  FaInfoCircle,
  FaChartLine,
  FaUserFriends
} from "react-icons/fa";
import GaugeComponent from "./GaugeComponent"; // Import the separated gauge component
import RatingsComponent from "./RatingsComponent"; // Import the RatingsComponent
import "../styles/TeamDetail.css";

// Loading animation component
const LoadingSpinner = () => (
  <div className="loading-spinner">
    <svg width="50" height="50" viewBox="0 0 50 50">
      <circle 
        cx="25" 
        cy="25" 
        r="20" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="5"
        strokeDasharray="31.4 31.4"
      >
        <animateTransform 
          attributeName="transform" 
          type="rotate"
          from="0 25 25"
          to="360 25 25"
          dur="1s"
          repeatCount="indefinite" />
      </circle>
    </svg>
  </div>
);

const TeamDetail = () => {
  const { teamId } = useParams();
  const navigate = useNavigate();
  const [allTeams, setAllTeams] = useState([]);
  const [team, setTeam] = useState(null);
  const [ratings, setRatings] = useState({});
  const [roster, setRoster] = useState([]);
  const [schedule, setSchedule] = useState([]);
  const [isLoading, setIsLoading] = useState({
    team: false,
    ratings: false,
    roster: false,
    schedule: false,
  });
  const [error, setError] = useState(null);
  
  // Refs for animation
  const headerRef = useRef(null);
  const contentRef = useRef(null);
  
  // Animation timing
  useEffect(() => {
    if (headerRef.current && contentRef.current) {
      headerRef.current.style.opacity = "0";
      contentRef.current.style.opacity = "0";
      
      setTimeout(() => {
        headerRef.current.style.opacity = "1";
        headerRef.current.style.transition = "opacity 0.5s ease-in-out";
      }, 100);
      
      setTimeout(() => {
        contentRef.current.style.opacity = "1";
        contentRef.current.style.transition = "opacity 0.5s ease-in-out";
      }, 300);
    }
  }, [team]);

  const getTeamLogo = (teamName) => {
    const foundTeam = allTeams.find(
      (t) => t.school.toLowerCase() === teamName?.toLowerCase()
    );
    return foundTeam?.logos?.[0] || "/photos/default_team.png";
  };

  const handleTeamChange = (e) => {
    const newTeamId = e.target.value;
    if (newTeamId) {
      navigate(`/teams/${newTeamId}`);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading((prev) => ({ ...prev, team: true }));
        const teamsData = await teamsService.getTeams();
        setAllTeams(teamsData);

        const foundTeam = teamsData.find(
          (t) => t.id === parseInt(teamId, 10)
        );
        if (!foundTeam) throw new Error("Team not found");
        setTeam(foundTeam);

        await Promise.all([
          fetchRatings(foundTeam.school),
          fetchRoster(foundTeam.school),
          fetchSchedule(foundTeam.school),
        ]);
      } catch (err) {
        setError(`Error: ${err.message}`);
      } finally {
        setIsLoading((prev) => ({ ...prev, team: false }));
      }
    };

    const fetchRatings = async (teamName) => {
      try {
        setIsLoading((prev) => ({ ...prev, ratings: true }));
        const data = await teamsService.getTeamRatings(teamName, 2024);
        setRatings(data);
      } catch (err) {
        console.error("Error fetching ratings:", err.message);
      } finally {
        setIsLoading((prev) => ({ ...prev, ratings: false }));
      }
    };

    const fetchRoster = async (teamName) => {
      try {
        setIsLoading((prev) => ({ ...prev, roster: true }));
        const data = await teamsService.getTeamRoster(teamName, 2024);
        setRoster(data);
      } catch (err) {
        console.error("Error fetching roster:", err.message);
      } finally {
        setIsLoading((prev) => ({ ...prev, roster: false }));
      }
    };

    const fetchSchedule = async (teamName) => {
      try {
        setIsLoading((prev) => ({ ...prev, schedule: true }));
        const data = await teamsService.getTeamSchedule(teamName, 2024);
        setSchedule(data);
      } catch (err) {
        console.error("Error fetching schedule:", err.message);
      } finally {
        setIsLoading((prev) => ({ ...prev, schedule: false }));
      }
    };

    fetchData();
  }, [teamId]);

  if (isLoading.team) return (
    <div className="loading-screen">
      <LoadingSpinner />
      <div>Loading team information...</div>
    </div>
  );
  
  if (error) return (
    <div className="error-screen">
      <FaInfoCircle size={40} />
      <div>{error}</div>
    </div>
  );
  
  if (!team) return (
    <div className="not-found-screen">
      <svg width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <line x1="8" y1="12" x2="16" y2="12" />
      </svg>
      <div>Team not found</div>
    </div>
  );

  // Get team conference
  const teamConference = team.conference || "Independent";

  // Get contrast color for text based on background color
  const getContrastColor = (hexColor) => {
    // Default to white if no color is provided
    if (!hexColor) return "#ffffff";
    
    // Remove the hash if it exists
    hexColor = hexColor.replace('#', '');
    
    // Convert to RGB
    const r = parseInt(hexColor.substr(0, 2), 16);
    const g = parseInt(hexColor.substr(2, 2), 16);
    const b = parseInt(hexColor.substr(4, 2), 16);
    
    // Calculate contrast (YIQ formula)
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    
    return (yiq >= 128) ? '#000000' : '#ffffff';
  };
  
  // Generate team color gradient for metallic effect
  const getTeamColorGradient = (hexColor) => {
    if (!hexColor) return "linear-gradient(145deg, #1a1a1a, #333333)";
    
    // Create a slightly lighter version for gradient
    const lighterColor = lightenColor(hexColor, 20);
    
    return `linear-gradient(145deg, ${hexColor}, ${lighterColor})`;
  };
  
  // Helper function to lighten a color
  const lightenColor = (color, percent) => {
    const num = parseInt(color.replace('#', ''), 16),
          amt = Math.round(2.55 * percent),
          R = (num >> 16) + amt,
          G = (num >> 8 & 0x00FF) + amt,
          B = (num & 0x0000FF) + amt;
          
    return '#' + (0x1000000 + (R < 255 ? R : 255) * 0x10000 +
                  (G < 255 ? G : 255) * 0x100 +
                  (B < 255 ? B : 255)).toString(16).slice(1);
  };

  // Top bar style using team color with glass effect
  const topBarStyle = {
    background: getTeamColorGradient(team.color || "#1a1a1a"),
    color: getContrastColor(team.color || "#1a1a1a"),
    boxShadow: `0 4px 20px ${team.color ? team.color + '50' : 'rgba(0, 0, 0, 0.2)'}`
  };

  return (
    <div className="team-dashboard">
      {/* Top Bar */}
      <div className="team-top-bar" style={topBarStyle}>
        <Link to="/teams" className="back-button" style={{ color: getContrastColor(team.color || "#1a1a1a") }}>
          <FaArrowLeft style={{ marginRight: "8px" }} /> Back
        </Link>
        <div className="team-selector">
          <div className="team-selector-label">Team Select:</div>
          <select 
            className="team-select" 
            value={teamId} 
            onChange={handleTeamChange}
          >
            {allTeams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.school}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Team Header with animation */}
      <div className="team-header" ref={headerRef}>
        <div className="team-logo-container">
          <img
            src={getTeamLogo(team.school)}
            alt={team.school}
            className="team-logo-large"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = "/photos/default_team.png";
            }}
          />
        </div>
        <div className="team-info">
          <h1 className="team-name">{team.school} {team.mascot}</h1>
          <div className="team-meta">
            <div className="meta-item">
              <FaMapMarkerAlt size={18} />
              <span>{team.location?.city}, {team.location?.state}</span>
            </div>
            <div className="meta-item">
              <FaTrophy size={18} />
              <span>{teamConference}</span>
            </div>
            <div className="meta-item">
              <FaUsers size={18} />
              <span>Division I ({team.classification})</span>
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard Content with animation */}
      <div className="dashboard-content" ref={contentRef}>
        {/* SP+ Ratings Card */}
        <div className="dashboard-card team-ratings-card">
          <div className="card-header">
            <FaChartLine style={{ marginRight: "12px" }} /> 
            SP+ Ratings
          </div>
          <div className="card-body">
            <div className="gauges-container">
              <GaugeComponent 
                label="Overall" 
                rawValue={ratings.rating} 
                metricType="overall" 
                teamData={ratings}
              />
              <GaugeComponent 
                label="Offense" 
                rawValue={ratings.offense?.rating} 
                metricType="offense" 
                teamData={ratings}
              />
              <GaugeComponent 
                label="Defense" 
                rawValue={ratings.defense?.rating} 
                metricType="defense" 
                teamData={ratings}
              />
            </div>
            <div className="ratings-explanation">
              <h3>How SP+ Ratings Work</h3>
              <p>
                The SP+ ratings combine multiple aspects of team performance into a single composite metric.
                <br />
                <strong>Overall:</strong> Combines offense, defense, and special teams.
                <br />
                <strong>Offense:</strong> Measures scoring efficiency and ball movement. Higher values indicate better offense.
                <br />
                <strong>Defense:</strong> Measures defensive efficiency. Lower values indicate a stronger defense.
              </p>
              <p>
                <strong>Color zones indicate performance relative to national average:</strong><br />
                <span style={{ color: "#ff4d4d" }}><strong>Red:</strong> Below Average</span> | 
                <span style={{ color: "#ffc700" }}><strong>Yellow:</strong> Average</span> | 
                <span style={{ color: "#04aa6d" }}><strong>Green:</strong> Above Average</span>
              </p>
              <p>
                <strong>National Averages (2024):</strong><br />
                Overall: 0.55 | Offense: 27.14 | Defense: 26.61
              </p>
            </div>
          </div>
        </div>

        {/* Team Info Card */}
        <div className="dashboard-card team-info-card">
          <div className="card-header">
            <FaInfoCircle style={{ marginRight: "12px" }} />
            About {team.school} {team.mascot}
          </div>
          <div className="card-body">
            <table className="info-table">
              <tbody>
                <tr>
                  <td>Location:</td>
                  <td><strong>{team.location?.city}, {team.location?.state}</strong></td>
                </tr>
                <tr>
                  <td>Conference:</td>
                  <td><strong>{teamConference}</strong></td>
                </tr>
                <tr>
                  <td>Division:</td>
                  <td><strong>Division I ({team.classification})</strong></td>
                </tr>
                <tr>
                  <td>Team Colors:</td>
                  <td>
                    <div style={{
                      display: 'flex',
                      gap: '8px',
                      alignItems: 'center'
                    }}>
                      <div style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        background: team.color || "#1a1a1a",
                        border: '1px solid rgba(0,0,0,0.1)'
                      }}></div>
                      <strong>{team.color || "Not available"}</strong>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Schedule Card */}
        <div className="dashboard-card team-schedule-card">
          <div className="card-header">
            <FaCalendarAlt style={{ marginRight: "12px" }} />
            Schedule
          </div>
          <div className="card-body">
            {isLoading.schedule ? (
              <div className="loading-indicator">
                <LoadingSpinner />
                <p>Loading schedule...</p>
              </div>
            ) : (
              <>
                {schedule.map((game, index) => (
                  <div key={index} className="schedule-item">
                    <div className="schedule-game">
                      <img
                        src={game.homeLogo || getTeamLogo(game.homeTeam)}
                        alt={game.homeTeam}
                        className="schedule-team-logo"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = "/photos/default_team.png";
                        }}
                      />
                      <span>
                        {game.homeTeam} vs. {game.awayTeam}
                      </span>
                      <img
                        src={game.awayLogo || getTeamLogo(game.awayTeam)}
                        alt={game.awayTeam}
                        className="schedule-team-logo"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = "/photos/default_team.png";
                        }}
                      />
                    </div>
                    <div className="schedule-details">
                      <p>
                        Score: {game.homePoints || "-"} - {game.awayPoints || "-"}
                      </p>
                      <p>Venue: {game.venue || "TBD"}</p>
                    </div>
                  </div>
                ))}
                {schedule.length === 0 && !isLoading.schedule && (
                  <div className="no-data-message">
                    No schedule information available
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Detailed Ratings Card - Moved below Schedule */}
        <div className="dashboard-card team-detailed-ratings-card">
          <div className="card-header">
            <FaChartLine style={{ marginRight: "12px" }} />
            Detailed Ratings
          </div>
          <div className="card-body">
            {isLoading.ratings ? (
              <div className="loading-indicator">
                <LoadingSpinner />
                <p>Loading detailed ratings...</p>
              </div>
            ) : (
              <RatingsComponent teamName={team.school} year={2024} />
            )}
          </div>
        </div>

        {/* Team Roster Card */}
        <div className="dashboard-card team-roster-card">
          <div className="card-header">
            <FaUserFriends style={{ marginRight: "12px" }} />
            Team Roster
          </div>
          <div className="card-body">
            {isLoading.roster ? (
              <div className="loading-indicator">
                <LoadingSpinner />
                <p>Loading roster...</p>
              </div>
            ) : (
              <table className="roster-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Position</th>
                    <th>Height</th>
                    <th>Year</th>
                  </tr>
                </thead>
                <tbody>
                  {roster.map((player, index) => (
                    <tr key={index}>
                      <td>{player.fullName}</td>
                      <td>{player.position || "N/A"}</td>
                      <td>{player.height || "N/A"}</td>
                      <td>{player.year || "N/A"}</td>
                    </tr>
                  ))}
                  {roster.length === 0 && !isLoading.roster && (
                    <tr>
                      <td colSpan="4" style={{ textAlign: "center" }}>
                        No roster information available
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamDetail;