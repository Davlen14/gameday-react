import React, { useState, useEffect, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import teamsService from "../services/teamsService";
import { ResponsiveContainer } from "recharts";
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
import "../styles/TeamDetail.css";

// --- National Averages from the data ---
const NATIONAL_AVERAGES = {
  overall: 0.55, // Overall is on a different scale
  offense: 27.14,
  defense: 26.61
};

// --- New Gauge Component for Ratings ---
const GaugeNew = ({ label, rawValue, metricType }) => {
  // Get ranges based on metric type (offense, defense, overall)
  const isDefense = metricType === "defense";
  
  // Set min and max values based on national averages
  const avg = NATIONAL_AVERAGES[metricType || "overall"];
  
  // For defense lower is better, for offense higher is better
  const min = isDefense ? Math.max(1, avg - 15) : 1;
  const max = isDefense ? 45 : Math.min(45, avg + 15);
  
  // Determine the range size for proper scaling
  const totalRange = max - min;
  
  // Calculate normalized value between min and max
  const clampedValue = Math.max(min, Math.min(rawValue, max));
  const valuePercentage = (clampedValue - min) / totalRange;
  
  // For defense, invert the needle position (lower is better)
  const needleRotation = isDefense ? 
    180 - (valuePercentage * 180) : 
    valuePercentage * 180;
  
  // Determine zone color based on value
  let zone;
  if (isDefense) {
    zone = clampedValue <= avg - (avg - min) / 2 ? "green" :
           clampedValue >= avg + (max - avg) / 2 ? "red" : "yellow";
  } else {
    zone = clampedValue >= avg + (max - avg) / 2 ? "green" :
           clampedValue <= avg - (avg - min) / 2 ? "red" : "yellow";
  }
  
  // Get needle color based on zone
  const needleColor = zone === "red" ? "#ff4d4d" : 
                      zone === "yellow" ? "#ffc700" : 
                      "#04aa6d";
                      
  // Format value for display
  const displayValue = Math.round(clampedValue);
  
  // Create a unique ID for this gauge's gradients
  const uniqueId = `${label.toLowerCase().replace(/\s/g, '')}`;

  // Calculate the angle positions for the gauge segments
  const startAngle = 180; // Start at bottom left
  const endAngle = 0;     // End at bottom right
  
  // Calculate angles for color transitions based on value ranges
  // For normal gauges (offense, overall): red->yellow->green from left to right
  // For defense gauge: green->yellow->red from left to right (low numbers are better)
  let redStartAngle, redEndAngle, yellowStartAngle, yellowEndAngle, greenStartAngle, greenEndAngle;
  
  if (isDefense) {
    // For defense: green (left) -> yellow (middle) -> red (right)
    greenStartAngle = startAngle;
    greenEndAngle = startAngle - 60;
    yellowStartAngle = greenEndAngle;
    yellowEndAngle = yellowStartAngle - 60;
    redStartAngle = yellowEndAngle;
    redEndAngle = endAngle;
  } else {
    // For offense/overall: red (left) -> yellow (middle) -> green (right)
    redStartAngle = startAngle;
    redEndAngle = startAngle - 60;
    yellowStartAngle = redEndAngle;
    yellowEndAngle = yellowStartAngle - 60;
    greenStartAngle = yellowEndAngle;
    greenEndAngle = endAngle;
  }

  // Helpers for drawing SVG arcs
  const polarToCartesian = (centerX, centerY, radius, angleInDegrees) => {
    const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
    return {
      x: centerX + (radius * Math.cos(angleInRadians)),
      y: centerY + (radius * Math.sin(angleInRadians))
    };
  };

  const describeArc = (x, y, radius, startAngle, endAngle) => {
    const start = polarToCartesian(x, y, radius, endAngle);
    const end = polarToCartesian(x, y, radius, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
    
    return [
      "M", start.x, start.y, 
      "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y,
      "L", x, y,
      "Z"
    ].join(" ");
  };

  return (
    <div className="gauge">
      <div style={{ position: 'relative', width: '160px', height: '100px' }}>
        <svg 
          viewBox="0 0 200 120" 
          style={{ width: '100%', height: '100%', filter: 'drop-shadow(0px 4px 6px rgba(0, 0, 0, 0.15))' }}
        >
          {/* Gradient definitions */}
          <defs>
            <linearGradient id={`redGradient-${uniqueId}`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ff6b6b" />
              <stop offset="100%" stopColor="#ff4d4d" />
            </linearGradient>
            <linearGradient id={`yellowGradient-${uniqueId}`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ffd166" />
              <stop offset="100%" stopColor="#ffc700" />
            </linearGradient>
            <linearGradient id={`greenGradient-${uniqueId}`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#06d6a0" />
              <stop offset="100%" stopColor="#04aa6d" />
            </linearGradient>
            <filter id={`shadow-${uniqueId}`} x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.3" />
            </filter>
            <linearGradient id={`metalNeedle-${uniqueId}`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#888" />
              <stop offset="50%" stopColor="#eee" />
              <stop offset="100%" stopColor="#888" />
            </linearGradient>
          </defs>
          
          {/* Gauge background - Create the three color zones as distinct arc segments */}
          {/* Red Zone */}
          <path 
            d={describeArc(100, 100, 60, redStartAngle, redEndAngle)}
            fill={`url(#redGradient-${uniqueId})`}
            stroke="#ddd" 
            strokeWidth="0.5"
          />
          
          {/* Yellow Zone */}
          <path 
            d={describeArc(100, 100, 60, yellowStartAngle, yellowEndAngle)}
            fill={`url(#yellowGradient-${uniqueId})`}
            stroke="#ddd" 
            strokeWidth="0.5"
          />
          
          {/* Green Zone */}
          <path 
            d={describeArc(100, 100, 60, greenStartAngle, greenEndAngle)}
            fill={`url(#greenGradient-${uniqueId})`}
            stroke="#ddd" 
            strokeWidth="0.5"
          />
          
          {/* Gauge outer border */}
          <path 
            d="M 40 100 A 60 60 0 1 1 160 100"
            fill="none"
            stroke="#aaa"
            strokeWidth="1"
          />
          
          {/* Tick marks and labels */}
          {/* Min value */}
          <text x="40" y="110" textAnchor="middle" fontSize="9" fill="#666" fontWeight="bold">
            {Math.round(min)}
          </text>
          <line x1="40" y1="100" x2="40" y2="95" stroke="#666" strokeWidth="1" />
          
          {/* Average value */}
          <text x="100" y="130" textAnchor="middle" fontSize="9" fill="#666" fontWeight="bold">
            {Math.round(avg)} (Avg)
          </text>
          <line x1="100" y1="100" x2="100" y2="90" stroke="#666" strokeWidth="1" />
          
          {/* Max value */}
          <text x="160" y="110" textAnchor="middle" fontSize="9" fill="#666" fontWeight="bold">
            {Math.round(max)}
          </text>
          <line x1="160" y1="100" x2="160" y2="95" stroke="#666" strokeWidth="1" />
          
          {/* Needle */}
          <g transform={`rotate(${needleRotation}, 100, 100)`}>
            <line 
              x1="100" 
              y1="100" 
              x2="100" 
              y2="50" 
              stroke={`url(#metalNeedle-${uniqueId})`}
              strokeWidth="2"
              filter={`url(#shadow-${uniqueId})`}
            />
            <circle cx="100" cy="100" r="5" fill="#666" stroke="#fff" strokeWidth="1" />
            <circle cx="100" cy="50" r="3" fill={needleColor} stroke="#fff" strokeWidth="1" />
          </g>
        </svg>
        
        {/* Value display */}
        <div 
          style={{ 
            position: 'absolute', 
            bottom: '-25px', 
            left: '0', 
            right: '0', 
            textAlign: 'center',
            fontSize: '18px',
            fontWeight: 'bold',
            color: needleColor
          }}
        >
          {displayValue}
        </div>
      </div>
      
      <div className="gauge-title">
        {label}
      </div>
    </div>
  );
};

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
              <GaugeNew label="Overall" rawValue={ratings.overall || 1} metricType="overall" />
              <GaugeNew label="Offense" rawValue={ratings.offense || 1} metricType="offense" />
              <GaugeNew label="Defense" rawValue={ratings.defense || 1} metricType="defense" />
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
                Offense: 27.1 | Defense: 26.6
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