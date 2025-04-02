import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import teamsService from "../services/teamsService";
import graphqlTeamsService from "../services/graphqlTeamsService";
import youtubeService from "../services/youtubeService";
import WinProb from "./WinProb";
import "../styles/AdvancedGameDetailView.css";
import AdvancedStatistics from "./AdvancedStatistics";

// Modern WeatherIcon component
const WeatherIcon = ({ condition, temperature }) => {
  let icon;
  const conditionLower = condition ? condition.toLowerCase() : "";
  
  if (!condition || conditionLower.includes("clear") || conditionLower.includes("sun")) {
    icon = (
      <svg width="48" height="48" viewBox="0 0 24 24">
        <defs>
          <linearGradient id="sunGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFD700" />
            <stop offset="100%" stopColor="#FFA500" />
          </linearGradient>
        </defs>
        <circle cx="12" cy="12" r="5" fill="url(#sunGradient)">
          <animate attributeName="r" values="4.5;5;4.5" dur="3s" repeatCount="indefinite" />
        </circle>
        <g stroke="#FFA000" strokeWidth="2" strokeLinecap="round">
          <line x1="12" y1="1" x2="12" y2="3">
            <animate attributeName="y2" values="3;4;3" dur="3s" repeatCount="indefinite" />
          </line>
          <line x1="12" y1="21" x2="12" y2="23">
            <animate attributeName="y1" values="21;20;21" dur="3s" repeatCount="indefinite" />
          </line>
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64">
            <animate attributeName="x2" values="5.64;6.34;5.64" dur="3s" repeatCount="indefinite" />
            <animate attributeName="y2" values="5.64;6.34;5.64" dur="3s" repeatCount="indefinite" />
          </line>
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78">
            <animate attributeName="x1" values="18.36;17.66;18.36" dur="3s" repeatCount="indefinite" />
            <animate attributeName="y1" values="18.36;17.66;18.36" dur="3s" repeatCount="indefinite" />
          </line>
          <line x1="1" y1="12" x2="4" y2="12">
            <animate attributeName="x2" values="4;5;4" dur="3s" repeatCount="indefinite" />
          </line>
          <line x1="20" y1="12" x2="23" y2="12">
            <animate attributeName="x1" values="20;19;20" dur="3s" repeatCount="indefinite" />
          </line>
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36">
            <animate attributeName="x2" values="5.64;6.34;5.64" dur="3s" repeatCount="indefinite" />
            <animate attributeName="y2" values="18.36;17.66;18.36" dur="3s" repeatCount="indefinite" />
          </line>
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22">
            <animate attributeName="x1" values="18.36;17.66;18.36" dur="3s" repeatCount="indefinite" />
            <animate attributeName="y1" values="5.64;6.34;5.64" dur="3s" repeatCount="indefinite" />
          </line>
        </g>
      </svg>
    );
  } else if (conditionLower.includes("cloud") || conditionLower.includes("overcast")) {
    icon = (
      <svg width="48" height="48" viewBox="0 0 24 24">
        <defs>
          <linearGradient id="cloudGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#E6E6FA" />
            <stop offset="100%" stopColor="#B0C4DE" />
          </linearGradient>
        </defs>
        <path d="M6,12 Q6,9 9,9 Q9,6 12,6 Q16,6 16,9 Q19,9 19,12 Q19,15 16,15 L6,15 Q3,15 3,12 Z" fill="url(#cloudGradient)" stroke="#A9A9A9" strokeWidth="0.5" />
      </svg>
    );
  } else if (conditionLower.includes("rain") || conditionLower.includes("drizzle")) {
    icon = (
      <svg width="48" height="48" viewBox="0 0 24 24">
        <defs>
          <linearGradient id="rainCloudGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#E6E6FA" />
            <stop offset="100%" stopColor="#B0C4DE" />
          </linearGradient>
          <linearGradient id="rainDropGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#87CEFA" />
            <stop offset="100%" stopColor="#4682B4" />
          </linearGradient>
        </defs>
        <path d="M6,10 Q6,7 9,7 Q9,4 12,4 Q16,4 16,7 Q19,7 19,10 Q19,13 16,13 L6,13 Q3,13 3,10 Z" fill="url(#rainCloudGradient)" stroke="#A9A9A9" strokeWidth="0.5" />
        <line x1="8" y1="15" x2="8" y2="17" stroke="url(#rainDropGradient)" strokeWidth="1.5" strokeLinecap="round">
          <animate attributeName="y1" values="15;16;15" dur="1.5s" repeatCount="indefinite" />
          <animate attributeName="y2" values="17;19;17" dur="1.5s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="1;0;1" dur="1.5s" repeatCount="indefinite" />
        </line>
        <line x1="12" y1="14" x2="12" y2="16" stroke="url(#rainDropGradient)" strokeWidth="1.5" strokeLinecap="round">
          <animate attributeName="y1" values="14;15;14" dur="1.5s" begin="0.2s" repeatCount="indefinite" />
          <animate attributeName="y2" values="16;18;16" dur="1.5s" begin="0.2s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="1;0;1" dur="1.5s" begin="0.2s" repeatCount="indefinite" />
        </line>
        <line x1="16" y1="15" x2="16" y2="17" stroke="url(#rainDropGradient)" strokeWidth="1.5" strokeLinecap="round">
          <animate attributeName="y1" values="15;16;15" dur="1.5s" begin="0.4s" repeatCount="indefinite" />
          <animate attributeName="y2" values="17;19;17" dur="1.5s" begin="0.4s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="1;0;1" dur="1.5s" begin="0.4s" repeatCount="indefinite" />
        </line>
      </svg>
    );
  } else if (conditionLower.includes("snow")) {
    icon = (
      <svg width="48" height="48" viewBox="0 0 24 24">
        <defs>
          <linearGradient id="snowCloudGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#E6E6FA" />
            <stop offset="100%" stopColor="#B0C4DE" />
          </linearGradient>
        </defs>
        <path d="M6,10 Q6,7 9,7 Q9,4 12,4 Q16,4 16,7 Q19,7 19,10 Q19,13 16,13 L6,13 Q3,13 3,10 Z" fill="url(#snowCloudGradient)" stroke="#A9A9A9" strokeWidth="0.5" />
        <circle cx="8" cy="16" r="0.5" fill="white">
          <animate attributeName="cy" values="15;17;15" dur="2s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="1;0;1" dur="2s" repeatCount="indefinite" />
        </circle>
        <circle cx="12" cy="15" r="0.5" fill="white">
          <animate attributeName="cy" values="14;16;14" dur="2s" begin="0.3s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="1;0;1" dur="2s" begin="0.3s" repeatCount="indefinite" />
        </circle>
        <circle cx="16" cy="16" r="0.5" fill="white">
          <animate attributeName="cy" values="15;17;15" dur="2s" begin="0.6s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="1;0;1" dur="2s" begin="0.6s" repeatCount="indefinite" />
        </circle>
      </svg>
    );
  } else if (conditionLower.includes("thunder") || conditionLower.includes("lightning")) {
    icon = (
      <svg width="48" height="48" viewBox="0 0 24 24">
        <defs>
          <linearGradient id="stormCloudGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#708090" />
            <stop offset="100%" stopColor="#4B5363" />
          </linearGradient>
          <linearGradient id="lightningGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFD700" />
            <stop offset="100%" stopColor="#FFA500" />
          </linearGradient>
        </defs>
        <path d="M6,10 Q6,7 9,7 Q9,4 12,4 Q16,4 16,7 Q19,7 19,10 Q19,13 16,13 L6,13 Q3,13 3,10 Z" fill="url(#stormCloudGradient)" stroke="#A9A9A9" strokeWidth="0.5" />
        <path d="M11,13 L9,17 L12,17 L10,21" fill="none" stroke="url(#lightningGradient)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <animate attributeName="opacity" values="0;1;0.6;0.8;0.3;1;0" dur="3s" repeatCount="indefinite" />
        </path>
        <path d="M15,13 L14,15 L16,15 L15,17" fill="none" stroke="url(#lightningGradient)" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
          <animate attributeName="opacity" values="0;0.6;1;0.3;0.8;0" dur="3s" begin="1s" repeatCount="indefinite" />
        </path>
      </svg>
    );
  } else if (conditionLower.includes("fog") || conditionLower.includes("mist")) {
    icon = (
      <svg width="48" height="48" viewBox="0 0 24 24">
        <defs>
          <linearGradient id="fogGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#E6E6FA" />
            <stop offset="100%" stopColor="#B0C4DE" />
          </linearGradient>
        </defs>
        <path d="M6,8 Q6,5 9,5 Q9,2 12,2 Q16,2 16,5 Q19,5 19,8 Q19,11 16,11 L6,11 Q3,11 3,8 Z" fill="url(#fogGradient)" stroke="#A9A9A9" strokeWidth="0.5" />
        <line x1="4" y1="14" x2="20" y2="14" stroke="#B0C4DE" strokeWidth="1.5" opacity="0.7">
          <animate attributeName="y1" values="14;14.5;14" dur="3s" repeatCount="indefinite" />
          <animate attributeName="y2" values="14;14.5;14" dur="3s" repeatCount="indefinite" />
        </line>
      </svg>
    );
  } else if (conditionLower.includes("wind")) {
    icon = (
      <svg width="48" height="48" viewBox="0 0 24 24">
        <path d="M3,8 Q5,6 7,8" fill="none" stroke="#A9A9A9" strokeWidth="1.5" strokeLinecap="round">
          <animate attributeName="d" values="M3,8 Q5,6 7,8;M3,8 Q5,7 7,8;M3,8 Q5,6 7,8" dur="3s" repeatCount="indefinite" />
        </path>
        <path d="M3,12 Q8,9 13,12 Q16,14 20,12" fill="none" stroke="#A9A9A9" strokeWidth="1.5" strokeLinecap="round">
          <animate attributeName="d" values="M3,12 Q8,9 13,12 Q16,14 20,12;M3,12 Q8,11 13,12 Q16,13 20,12;M3,12 Q8,9 13,12 Q16,14 20,12" dur="5s" repeatCount="indefinite" />
        </path>
        <path d="M5,16 Q10,13 15,16" fill="none" stroke="#A9A9A9" strokeWidth="1.5" strokeLinecap="round">
          <animate attributeName="d" values="M5,16 Q10,13 15,16;M5,16 Q10,15 15,16;M5,16 Q10,13 15,16" dur="4s" repeatCount="indefinite" />
        </path>
      </svg>
    );
  } else {
    // Default icon for unknown conditions
    icon = (
      <svg width="48" height="48" viewBox="0 0 24 24">
        <defs>
          <linearGradient id="defaultGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#87CEEB" />
            <stop offset="100%" stopColor="#4682B4" />
          </linearGradient>
        </defs>
        <circle cx="12" cy="12" r="5" fill="url(#defaultGradient)" />
      </svg>
    );
  }
  
  return (
    <div className="weather-icon-container">
      {icon}
      {temperature && (
        <div className="temp-label">
          <span className="temp-value">{temperature}°F</span>
        </div>
      )}
    </div>
  );
};

// Modern TvIcon component
const TvIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24">
    <defs>
      <linearGradient id="tvGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#555" />
        <stop offset="100%" stopColor="#333" />
      </linearGradient>
    </defs>
    <rect x="2" y="3" width="20" height="14" rx="2" fill="url(#tvGradient)" />
    <rect x="3" y="4" width="18" height="12" rx="1" fill="#111" />
    <path d="M10 17h4v3a1 1 0 01-1 1h-2a1 1 0 01-1-1v-3z" fill="#444" />
    <rect x="4" y="5" width="16" height="10" rx="1" fill="#1a1a1a" />
    <circle cx="19" cy="4.5" r="0.5" fill="#ff3333" />
  </svg>
);

// New ExcitementRating component with stars
const ExcitementRating = ({ value }) => {
  const normalizedValue = value ? Math.min(5, Math.max(0, (value / 10) * 5)) : 0;
  const fullStars = Math.floor(normalizedValue);
  const partialStar = normalizedValue % 1;
  const emptyStars = 5 - fullStars - (partialStar > 0 ? 1 : 0);
  
  return (
    <div className="excitement-rating">
      {[...Array(fullStars)].map((_, i) => (
        <Star key={`full-${i}`} fill="#FFD700" />
      ))}
      {partialStar > 0 && <PartialStar fill="#FFD700" percentage={partialStar * 100} />}
      {[...Array(emptyStars)].map((_, i) => (
        <Star key={`empty-${i}`} fill="#D3D3D3" />
      ))}
      <span className="excitement-value">{value ? `${value}/10` : 'N/A'}</span>
    </div>
  );
};

const Star = ({ fill }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" className="star-icon">
    <path
      d="M12 2l2.4 7.4H22l-6 4.4 2.3 7.1-6.3-4.6-6.3 4.6 2.3-7.1-6-4.4h7.6z"
      fill={fill}
      stroke="#FFA500"
      strokeWidth="0.5"
    />
  </svg>
);

const PartialStar = ({ fill, percentage }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" className="star-icon">
    <defs>
      <linearGradient id="partialFill" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset={`${percentage}%`} stopColor={fill} />
        <stop offset={`${percentage}%`} stopColor="#D3D3D3" />
      </linearGradient>
    </defs>
    <path
      d="M12 2l2.4 7.4H22l-6 4.4 2.3 7.1-6.3-4.6-6.3 4.6 2.3-7.1-6-4.4h7.6z"
      fill="url(#partialFill)"
      stroke="#FFA500"
      strokeWidth="0.5"
    />
  </svg>
);

const WinProbabilityCircle = ({ probability, teamName, teamColor, teamLogo }) => {
  const normalizedProb = probability ? Math.min(100, Math.max(0, probability)) : 0;
  const circumference = 2 * Math.PI * 40;
  const dashOffset = circumference * (1 - normalizedProb / 100);
  const color = teamColor || "#4682B4";
  
  return (
    <div className="win-probability-container">
      <svg width="100" height="100" viewBox="0 0 100 100" className="win-probability-circle">
        <circle cx="50" cy="50" r="40" fill="transparent" stroke="#e9ecef" strokeWidth="8" />
        <circle
          cx="50"
          cy="50"
          r="40"
          fill="transparent"
          stroke={color}
          strokeWidth="8"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          transform="rotate(-90 50 50)"
        >
          <animate 
            attributeName="stroke-dashoffset" 
            from={circumference} 
            to={dashOffset} 
            dur="1.5s" 
            fill="freeze" 
            calcMode="spline"
            keySplines="0.42 0 0.58 1"
          />
        </circle>
        {teamLogo && (
          <image
            href={teamLogo}
            x="25"
            y="25"
            width="50"
            height="50"
            clipPath="circle(25px at center)"
          />
        )}
        <text
          x="50"
          y="55"
          textAnchor="middle"
          dominantBaseline="middle"
          fill={teamLogo ? "transparent" : "#333"}
          fontSize="16"
          fontWeight="bold"
        >
          {normalizedProb ? `${Math.round(normalizedProb)}%` : 'N/A'}
        </text>
      </svg>
      <div className="win-probability-label">
        <span>{teamName || "Team"}</span>
        <span className="win-prob-value">{normalizedProb ? `${Math.round(normalizedProb)}%` : 'N/A'}</span>
      </div>
    </div>
  );
};

const EloRating = ({ startElo, endElo, label }) => {
  const hasData = startElo !== undefined && endElo !== undefined;
  const change = hasData ? endElo - startElo : 0;
  const changeColor = change > 0 ? "#4CAF50" : change < 0 ? "#F44336" : "#757575";
  
  return (
    <div className="elo-rating">
      <div className="elo-label">{label || "Elo Rating"}</div>
      <div className="elo-values">
        {hasData ? (
          <>
            <span className="elo-start">{startElo}</span>
            <span className="elo-arrow">
              <svg width="24" height="24" viewBox="0 0 24 24">
                <line x1="6" y1="12" x2="18" y2="12" stroke={changeColor} strokeWidth="2" strokeLinecap="round" />
                <polyline 
                  points={change > 0 ? "14,8 18,12 14,16" : change < 0 ? "10,8 6,12 10,16" : ""}
                  fill="none" 
                  stroke={changeColor} 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <span className="elo-end">{endElo}</span>
            <span className="elo-change" style={{ color: changeColor }}>
              ({change > 0 ? "+" : ""}{change})
            </span>
          </>
        ) : (
          <span className="elo-na">N/A</span>
        )}
      </div>
    </div>
  );
};

const sportsbookLogos = {
  "DraftKings": "/photos/draftkings.png",
  "ESPN Bet": "/photos/espnbet.png",
  "Bovada": "/photos/bovada.jpg",
};

const getSportsbookLogo = (provider) => {
  return sportsbookLogos[provider] || "/photos/default_sportsbook.png";
};

const getRandomLineForGame = (gameId, lines) => {
  const gameLines = lines.filter((line) => line.gameId === gameId);
  if (gameLines.length === 0) return null;
  return gameLines[Math.floor(Math.random() * gameLines.length)];
};

// Video card component for displaying YouTube videos
const VideoCard = ({ video, onClick }) => {
  const { snippet, id } = video;
  
  return (
    <div className="video-card" onClick={onClick}>
      <div className="video-thumbnail">
        <img 
          src={snippet.thumbnails.medium.url} 
          alt={snippet.title} 
        />
        <div className="play-button">
          <svg width="48" height="48" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="11" fill="rgba(0,0,0,0.6)" />
            <path fill="#fff" d="M10,8L16,12L10,16V8Z" />
          </svg>
        </div>
      </div>
      <div className="video-info">
        <h3 className="video-title">{snippet.title}</h3>
        <div className="video-channel">{snippet.channelTitle}</div>
        <div className="video-published">
          {new Date(snippet.publishedAt).toLocaleDateString()}
        </div>
      </div>
    </div>
  );
};

const AdvancedGameDetailView = () => {
  const { id } = useParams();
  const [gameData, setGameData] = useState(null);
  const [teams, setTeams] = useState([]);
  const [fcsTeams, setFcsTeams] = useState([]);
  const [lines, setLines] = useState([]);
  const [activeTab, setActiveTab] = useState("overview");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [advancedStats, setAdvancedStats] = useState(null);
  
  // States for video content
  const [videos, setVideos] = useState([]);
  const [videosLoading, setVideosLoading] = useState(false);
  const [videosError, setVideosError] = useState(null);

  // Helper to find a team from either FBS or FCS
  const findTeam = (teamName) => {
    return (
      teams.find(
        (t) => t.school && t.school.toLowerCase() === teamName.toLowerCase()
      ) ||
      fcsTeams.find(
        (t) => t.school && t.school.toLowerCase() === teamName.toLowerCase()
      ) ||
      {}
    );
  };

  const getTeamLogo = (teamName) => {
    const team = findTeam(teamName);
    return team && team.logos && team.logos.length > 0
      ? team.logos[0]
      : "/photos/default_team.png";
  };

  const getTeamDetails = (teamName) => {
    return findTeam(teamName);
  };

  const getTeamColor = (teamName) => {
    const team = findTeam(teamName);
    return team && team.color ? `#${team.color}` : "#666666";
  };

  // Function to build a search query for YouTube based on game data
  const buildVideoSearchQuery = () => {
    if (!gameData) return "";
    
    const { homeTeam, awayTeam, season } = gameData;
    let query = `${homeTeam} vs ${awayTeam}`;
    
    if (season) {
      query += ` ${season}`;
    }
    
    if (gameData.status === "final") {
      query += " football highlights";
    } else {
      query += " football preview";
    }
    
    return query;
  };

  // Function to fetch videos from YouTube
  const fetchVideos = async () => {
    if (videos.length > 0 || videosError) return; // Don't fetch if we already have videos or an error
    
    try {
      setVideosLoading(true);
      const searchQuery = buildVideoSearchQuery();
      console.log(`Fetching videos for query: ${searchQuery}`);
      
      const response = await youtubeService.fetchYoutubeData(searchQuery);
      
      if (response.error) {
        setVideosError(response.error);
      } else if (response && response.items) {
        setVideos(response.items);
      } else {
        setVideos([]);
      }
    } catch (error) {
      console.error("Error fetching videos:", error);
      setVideosError("Failed to load videos. Please try again later.");
    } finally {
      setVideosLoading(false);
    }
  };

  // Effect to load game data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const teamsData = await teamsService.getTeams();
        setTeams(teamsData);
        // Load FCS teams as well for logos, colors, etc.
        const fcsTeamsData = await teamsService.getFCSTeams();
        setFcsTeams(fcsTeamsData);
        const restGameData = await teamsService.getGameById(id);
        const scoreboardData = await graphqlTeamsService.getGameScoreboard(id);
        const gameInfoData = await graphqlTeamsService.getGameInfo(id);
        const linesData = await teamsService.getGameLines(2024);
        setLines(linesData);
        const mergedData = { ...scoreboardData, ...gameInfoData, ...restGameData };
        if (mergedData) {
          setGameData(mergedData);
        } else {
          setError("Game not found");
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [id]);

  // Effect to fetch videos when the videos tab is selected
  useEffect(() => {
    if (activeTab === "videos" && gameData && !videos.length && !videosLoading && !videosError) {
      fetchVideos();
    }
  }, [activeTab, gameData]);

  if (isLoading)
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading game details...</p>
      </div>
    );

  if (error)
    return (
      <div className="error-container">
        <div className="error-icon">⚠️</div>
        <h2>Error</h2>
        <p>{error}</p>
      </div>
    );

  if (!gameData)
    return (
      <div className="not-found-container">
        <div className="not-found-icon">🔍</div>
        <h2>Game Not Found</h2>
        <p>The requested game information could not be found.</p>
      </div>
    );

  const {
    id: gameId,
    attendance,
    awayClassification,
    awayConference,
    awayConferenceId,
    awayEndElo,
    awayLineScores,
    awayPoints,
    awayPostgameWinProb,
    awayStartElo,
    awayTeam,
    awayTeamId,
    conferenceGame,
    excitement,
    homeClassification,
    homeConference,
    homeConferenceId,
    homeEndElo,
    homeLineScores,
    homePoints,
    homePostgameWinProb,
    homeStartElo,
    homeTeam,
    homeTeamId,
    neutralSite,
    notes,
    season,
    seasonType,
    startDate,
    startTimeTbd,
    status,
    venue,
    city,
    state,
    week,
    currentClock,
    currentPeriod,
    lastPlay,
    moneylineAway,
    moneylineHome,
    overUnder,
    spread,
    temperature,
    windDirection,
    windSpeed,
    tv,
    weather,
  } = gameData;

  const homeTeamDetails = getTeamDetails(homeTeam);
  const awayTeamDetails = getTeamDetails(awayTeam);
  const homeTeamColor = getTeamColor(homeTeam);
  const awayTeamColor = getTeamColor(awayTeam);
  const homeLogo = getTeamLogo(homeTeam);
  const awayLogo = getTeamLogo(awayTeam);
  const randomLine = getRandomLineForGame(gameId, lines);

  const renderLineScores = () => {
    const periods = homeLineScores && homeLineScores.length;
    if (!periods)
      return <p className="no-data">No line score data available.</p>;
    const homeTotalPoints = homeLineScores.reduce((sum, score) => sum + (score || 0), 0);
    const awayTotalPoints = awayLineScores ? awayLineScores.reduce((sum, score) => sum + (score || 0), 0) : 0;

    return (
      <div className="line-scores-container">
        <h3>Quarter by Quarter</h3>
        <div className="line-scores-card">
          <table className="line-scores-table">
            <thead>
              <tr>
                <th className="team-cell">Team</th>
                {Array.from({ length: periods }).map((_, index) => (
                  <th key={`period-${index}`} className="period-header">
                    Q{index + 1}
                  </th>
                ))}
                <th className="total-header">Total</th>
              </tr>
            </thead>
            <tbody>
              <tr className="home-team-row" style={{ borderLeft: `4px solid ${homeTeamColor}` }}>
                <td className="team-cell">
                  <div className="team-info-cell">
                    <img src={homeLogo} alt={homeTeam} className="team-logo-small" />
                    <span className="team-abbr">{homeTeam}</span>
                  </div>
                </td>
                {Array.from({ length: periods }).map((_, index) => (
                  <td key={`home-${index}`} className="score-cell">
                    {homeLineScores[index] !== null ? homeLineScores[index] : "-"}
                  </td>
                ))}
                <td className="total-cell">{homeTotalPoints}</td>
              </tr>
              <tr className="away-team-row" style={{ borderLeft: `4px solid ${awayTeamColor}` }}>
                <td className="team-cell">
                  <div className="team-info-cell">
                    <img src={awayLogo} alt={awayTeam} className="team-logo-small" />
                    <span className="team-abbr">{awayTeam}</span>
                  </div>
                </td>
                {Array.from({ length: periods }).map((_, index) => (
                  <td key={`away-${index}`} className="score-cell">
                    {awayLineScores && awayLineScores[index] !== undefined ? awayLineScores[index] : "-"}
                  </td>
                ))}
                <td className="total-cell">{awayTotalPoints}</td>
              </tr>
            </tbody>
          </table>
        </div>
        {currentClock && (
          <div className="current-game-state">
            <div className="clock-container">
              <span className="clock-label">CURRENT</span>
              <span className="clock-value">{currentClock}</span>
              <span className="period-value">Q{currentPeriod || "?"}</span>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderOverview = () => (
    <div className="tab-content overview">
      <div className="scoreboard-container">
        <div className="team-column home-team">
          <div className="team-header" style={{ backgroundColor: homeTeamColor }}>
            <img src={homeLogo} alt={homeTeam} className="team-logo-large" />
          </div>
          <div className="team-info">
            <div className="team-name">{homeTeam}</div>
            <div className="team-record">
              {homeTeamDetails.record ? homeTeamDetails.record : ""}
              {homeTeamDetails.rank ? (
                <span className="team-rank">#{homeTeamDetails.rank}</span>
              ) : (
                ""
              )}
            </div>
            <div className="score-display">{homePoints || "0"}</div>
          </div>
        </div>
        <div className="game-status-column">
          <div className="game-status-indicator">
            {status === "final" ? (
              <span className="status-final">FINAL</span>
            ) : status === "in_progress" ? (
              <span className="status-live">LIVE</span>
            ) : (
              <span className="status-upcoming"> </span>
            )}
          </div>
          <div className="versus-text">VS</div>
          {startDate && status !== "final" && status !== "in_progress" && (
            <div className="start-time">
              {new Date(startDate).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
          )}
        </div>
        <div className="team-column away-team">
          <div className="team-header" style={{ backgroundColor: awayTeamColor }}>
            <img src={awayLogo} alt={awayTeam} className="team-logo-large" />
          </div>
          <div className="team-info">
            <div className="team-name">{awayTeam}</div>
            <div className="team-record">
              {awayTeamDetails.record ? awayTeamDetails.record : ""}
              {awayTeamDetails.rank ? (
                <span className="team-rank">#{awayTeamDetails.rank}</span>
              ) : (
                ""
              )}
            </div>
            <div className="score-display">{awayPoints || "0"}</div>
          </div>
        </div>
      </div>
      <div className="game-meta-info">
        <div className="meta-row">
          <div className="meta-item">
            <div className="meta-icon">
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M12,11.5A2.5,2.5 0 0,1 9.5,9A2.5,2.5 0 0,1 12,6.5A2.5,2.5 0 0,1 14.5,9A2.5,2.5 0 0,1 12,11.5M12,2A7,7 0 0,0 5,9C5,14.25 12,22 12,22C12,22 19,14.25 19,9A7,7 0 0,0 12,2M12.5,7V12.25L17,14.92L16.25,16.15L11,13V7H12.5Z"
                />
              </svg>
            </div>
            <div className="meta-content">
              <div className="meta-label">Game Time</div>
              <div className="meta-value">
                {startDate
                  ? new Date(startDate).toLocaleString([], {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "TBD"}
              </div>
            </div>
          </div>
          <div className="meta-item">
            <div className="meta-icon">
              <TvIcon />
            </div>
            <div className="meta-content">
              <div className="meta-label">Broadcast</div>
              <div className="meta-value">ESPN</div>
            </div>
          </div>
          <div className="meta-item">
            <div className="meta-icon">
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path fill="currentColor" d="M12,11.5A2.5,2.5 0 0,1 9.5,9A2.5,2.5 0 0,1 12,6.5A2.5,2.5 0 0,1 14.5,9A2.5,2.5 0 0,1 12,11.5Z" />
              </svg>
            </div>
            <div className="meta-content">
              <div className="meta-label">Venue</div>
              <div className="meta-value">{venue || "TBD"}</div>
            </div>
          </div>
        </div>
        <div className="meta-row">
          <div className="meta-item excitement-container">
            <div className="meta-label">Game Excitement Index</div>
            <ExcitementRating value={excitement} />
          </div>
        </div>
      </div>
      {lastPlay && (
        <div className="last-play-container">
          <div className="last-play-label">Last Play</div>
          <div className="last-play-text">{lastPlay}</div>
        </div>
      )}
      {renderLineScores()}
      <div className="win-probability-section">
        <h3>Win Probability</h3>
        <div className="win-prob-container">
          <WinProbabilityCircle
            probability={homePostgameWinProb * 100}
            teamName={homeTeam}
            teamColor={homeTeamColor}
            teamLogo={homeLogo}
          />
          <WinProbabilityCircle
            probability={awayPostgameWinProb * 100}
            teamName={awayTeam}
            teamColor={awayTeamColor}
            teamLogo={awayLogo}
          />
        </div>
      </div>
    </div>
  );

  const renderStatisticsTab = () => (
    <div className="tab-content statistics">
      <div className="stat-section">
        <h2>Scoring by Quarter</h2>
        {renderLineScores()}
      </div>
      <div className="elo-section">
        <h2>Elo Ratings</h2>
        <div className="elo-container">
          <div className="elo-team-container" style={{ borderTop: `4px solid ${homeTeamColor}` }}>
            <div className="elo-team-header">
              <img src={homeLogo} alt={homeTeam} className="team-logo-small" />
              <span>{homeTeam}</span>
            </div>
            <EloRating startElo={homeStartElo} endElo={homeEndElo} label="Elo Change" />
          </div>
          <div className="elo-team-container" style={{ borderTop: `4px solid ${awayTeamColor}` }}>
            <div className="elo-team-header">
              <img src={awayLogo} alt={awayTeam} className="team-logo-small" />
              <span>{awayTeam}</span>
            </div>
            <EloRating startElo={awayStartElo} endElo={awayEndElo} label="Elo Change" />
          </div>
        </div>
      </div>
      {lastPlay && (
        <div className="last-play-container">
          <div className="last-play-label">Last Play</div>
          <div className="last-play-text">{lastPlay}</div>
        </div>
      )}
    </div>
  );

  const renderVideos = () => (
    <div className="tab-content videos">
      <h2>Game Videos</h2>
      
      {videosLoading ? (
        <div className="video-loading">
          <div className="loading-spinner"></div>
          <p>Loading game videos...</p>
        </div>
      ) : videosError ? (
        <div className="video-error">
          <div className="error-icon">⚠️</div>
          <h3>Error Loading Videos</h3>
          <p>{videosError}</p>
          <button 
            className="retry-button"
            onClick={() => {
              setVideosError(null);
              fetchVideos();
            }}
          >
            Try Again
          </button>
        </div>
      ) : videos.length === 0 ? (
        <div className="no-videos">
          <svg width="64" height="64" viewBox="0 0 24 24">
            <path
              fill="#888"
              d="M17,10.5V7A1,1 0 0,0 16,6H4A1,1 0 0,0 3,7V17A1,1 0 0,0 4,18H16A1,1 0 0,0 17,17V13.5L21,17.5V6.5L17,10.5Z"
            />
          </svg>
          <h3>No Videos Found</h3>
          <p>We couldn't find any videos for this game.</p>
        </div>
      ) : (
        <div className="video-grid">
          {videos.map((video) => (
            <VideoCard 
              key={video.id.videoId} 
              video={video} 
              onClick={() => window.open(`https://www.youtube.com/watch?v=${video.id.videoId}`, '_blank')}
            />
          ))}
        </div>
      )}
    </div>
  );

  const renderBetting = () => {
    const randomLine = getRandomLineForGame(gameId, lines);
    return (
      <div className="tab-content betting">
        <h2>Betting Information</h2>
        {randomLine ? (
          <div className="betting-section">
            <div className="sportsbook">
              <img
                src={getSportsbookLogo(randomLine.provider)}
                alt={randomLine.provider}
                className="sportsbook-logo"
              />
              <div className="betting-odds">
                <div className="odds-item">
                  <span className="odds-label">Spread:</span>
                  <span className="odds-value">{randomLine.spread || "N/A"}</span>
                </div>
                <div className="odds-item">
                  <span className="odds-label">O/U:</span>
                  <span className="odds-value">{randomLine.overUnder || "N/A"}</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <p className="no-data">No betting lines available</p>
        )}
        <div className="betting-disclaimer">
          <p>Odds displayed are for informational purposes only. Please check with sportsbooks for current odds.</p>
        </div>
      </div>
    );
  };

  const renderWeatherTab = () => (
    <div className="tab-content weather">
      <h2>Weather Conditions</h2>
      <div className="weather-card">
        <div className="weather-main">
          <WeatherIcon
            condition={weather && weather.condition && weather.condition.description ? weather.condition.description : ""}
            temperature={temperature || (weather && weather.temperature)}
          />
          <div className="weather-info">
            <div className="weather-temp">
              {temperature || (weather && weather.temperature) || "N/A"}°F
            </div>
            <div className="weather-desc">
              {weather && weather.condition && weather.condition.description ? weather.condition.description : "N/A"}
            </div>
          </div>
        </div>
        <div className="weather-details-grid">
          <div className="weather-detail-item">
            <div className="detail-icon">
              <svg width="24" height="24" viewBox="0 0 24 24">
                <path fill="currentColor" d="M4,10A1,1 0 0,1 3,9A1,1 0 0,1 4,8H12A2,2 0 0,0 14,6A2,2 0 0,0 12,4C11.45,4 10.95,4.22 10.59,4.59C10.2,5 9.56,5 9.17,4.59C8.78,4.2 8.78,3.56 9.17,3.17C9.9,2.45 10.9,2 12,2A4,4 0 0,1 16,6A4,4 0 0,1 12,10H4M12,6A1,1 0 0,1 13,7V8H11V7A1,1 0 0,1 12,6Z" />
              </svg>
            </div>
            <div className="detail-content">
              <div className="detail-label">Wind</div>
              <div className="detail-value">
                {windSpeed || (weather && weather.windSpeed)
                  ? `${windSpeed || weather.windSpeed} mph`
                  : "N/A"}{" "}
                {windDirection || (weather && weather.windDirection)
                  ? `${windDirection || weather.windDirection}°`
                  : ""}
              </div>
            </div>
          </div>
          {weather && weather.dewpoint && (
            <div className="weather-detail-item">
              <div className="detail-icon">
                <svg width="24" height="24" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M12,20A6,6 0 0,1 6,14C6,10 12,3.25 12,3.25C12,3.25 18,10 18,14A6,6 0 0,1 12,20Z" />
                </svg>
              </div>
              <div className="detail-content">
                <div className="detail-label">Dewpoint</div>
                <div className="detail-value">{weather.dewpoint}°F</div>
              </div>
            </div>
          )}
          <div className="weather-detail-item">
            <div className="detail-icon">
              <svg width="24" height="24" viewBox="0 0 24 24">
                <path fill="currentColor" d="M15,13V5A3,3 0 0,0 12,2A3,3 0 0,0 9,5V13A5,5 0 1,0 15,13M12,4A1,1 0 0,1 13,5V8H11V5A1,1 0 0,1 12,4Z" />
              </svg>
            </div>
            <div className="detail-content">
              <div className="detail-label">Temperature</div>
              <div className="detail-value">{temperature || (weather && weather.temperature) || "N/A"}°F</div>
            </div>
          </div>
          <div className="weather-detail-item">
            <div className="detail-icon">
              <svg width="24" height="24" viewBox="0 0 24 24">
                <path fill="currentColor" d="M5,16H19A1,1 0 0,1 20,17A1,1 0 0,1 19,18H5A1,1 0 0,1 4,17A1,1 0 0,1 5,16Z" />
              </svg>
            </div>
            <div className="detail-content">
              <div className="detail-label">Humidity</div>
              <div className="detail-value">{weather && weather.humidity ? `${weather.humidity}%` : "N/A"}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderVenue = () => (
    <div className="tab-content venue">
      <h2>Venue Information</h2>
      <div className="venue-card">
        <div className="venue-header">
          <svg width="32" height="32" viewBox="0 0 24 24">
            <path fill="currentColor" d="M12,11.5A2.5,2.5 0 0,1 9.5,9A2.5,2.5 0 0,1 12,6.5A2.5,2.5 0 0,1 14.5,9A2.5,2.5 0 0,1 12,11.5M12,2A7,7 0 0,0 5,9C5,14.25 12,22 12,22C12,22 19,14.25 19,9A7,7 0 0,0 12,2Z" />
          </svg>
          <h3>{venue || "TBD"}</h3>
        </div>
        <div className="venue-content">
          <div className="venue-detail">
            <div className="venue-icon">
              <svg width="24" height="24" viewBox="0 0 24 24">
                <path fill="currentColor" d="M12,2C15.31,2 18,4.66 18,7.95C18,12.41 12,19 12,19C12,19 6,12.41 6,7.95C6,4.66 8.69,2 12,2M12,6A2,2 0 0,0 10,8A2,2 0 0,0 12,10A2,2 0 0,0 14,8A2,2 0 0,0 12,6Z" />
              </svg>
            </div>
            <div className="venue-detail-content">
              <div className="detail-label">Location</div>
              <div className="detail-value">{city || "TBD"}{state ? `, ${state}` : ""}</div>
            </div>
          </div>
          <div className="venue-detail">
            <div className="venue-icon">
              <svg width="24" height="24" viewBox="0 0 24 24">
                <path fill="currentColor" d="M4,2H14V4H4V14H2V4C2,2.89 2.89,2 4,2M8,6H18V8H8V18H6V8C6,6.89 6.89,6 8,6M12,10H20C21.11,10 22,10.89 22,12V20C22,21.11 21.11,22 20,22H12C10.89,22 10,21.11 10,20V12C10,10.89 10.89,10 12,10M14,12V20H20V12H14Z" />
              </svg>
            </div>
            <div className="venue-detail-content">
              <div className="detail-label">Capacity</div>
              <div className="detail-value">
                {attendance ? `${Number(attendance).toLocaleString()} (Attendance)` : "N/A"}
              </div>
            </div>
          </div>
          <div className="venue-detail">
            <div className="venue-icon">
              <svg width="24" height="24" viewBox="0 0 24 24">
                <path fill="currentColor" d="M6,2H18A2,2 0 0,1 20,4V20A2,2 0 0,1 18,22H6A2,2 0 0,1 4,20V4A2,2 0 0,1 6,2M14,8A2,2 0 0,0 12,6A2,2 0 0,0 10,8A2,2 0 0,0 12,10A2,2 0 0,0 14,8M8,17H16V16C16,14.67 13.33,14 12,14C10.67,14 8,14.67 8,16V17M16,3H8A1,1 0 0,0 7,4A1,1 0 0,0 8,5H16A1,1 0 0,0 17,4A1,1 0 0,0 16,3Z" />
              </svg>
            </div>
            <div className="venue-detail-content">
              <div className="detail-label">Neutral Site</div>
              <div className="detail-value">{neutralSite !== undefined ? (neutralSite ? "Yes" : "No") : "N/A"}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderDetails = () => (
    <div className="tab-content details">
      <h2>Additional Game Details</h2>
      <div className="details-grid">
        <div className="detail-card">
          <div className="detail-card-header">
            <svg width="24" height="24" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M19,19H5V8H19M16,1V3H8V1H6V3H5C3.89,3 3,3.89 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5C21,3.89 20.1,3 19,3H18V1H16M19,5V7H5V5H19Z"
              />
            </svg>
            <span>Season Information</span>
          </div>
          <div className="detail-card-content">
            <div className="detail-item">
              <div className="detail-label">Season</div>
              <div className="detail-value">{season || "N/A"}</div>
            </div>
            <div className="detail-item">
              <div className="detail-label">Season Type</div>
              <div className="detail-value">{seasonType || "N/A"}</div>
            </div>
            <div className="detail-item">
              <div className="detail-label">Week</div>
              <div className="detail-value">{week || "N/A"}</div>
            </div>
          </div>
        </div>
        
        <div className="detail-card">
          <div className="detail-card-header">
            <svg width="24" height="24" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M6,2H18A2,2 0 0,1 20,4V20A2,2 0 0,1 18,22H6A2,2 0 0,1 4,20V4A2,2 0 0,1 6,2M14,8A2,2 0 0,0 12,6A2,2 0 0,0 10,8A2,2 0 0,0 12,10A2,2 0 0,0 14,8M8,17H16V16C16,14.67 13.33,14 12,14C10.67,14 8,14.67 8,16V17M16,3H8A1,1 0 0,0 7,4A1,1 0 0,0 8,5H16A1,1 0 0,0 17,4A1,1 0 0,0 16,3Z"
              />
            </svg>
            <span>Game Type</span>
          </div>
          <div className="detail-card-content">
            <div className="detail-item">
              <div className="detail-label">Conference Game</div>
              <div className="detail-value">
                {conferenceGame !== undefined ? (conferenceGame ? "Yes" : "No") : "N/A"}
              </div>
            </div>
            <div className="detail-item">
              <div className="detail-label">Neutral Site</div>
              <div className="detail-value">
                {neutralSite !== undefined ? (neutralSite ? "Yes" : "No") : "N/A"}
              </div>
            </div>
          </div>
        </div>
        
        <div className="detail-card">
          <div className="detail-card-header">
            <svg width="24" height="24" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M6,2H18A2,2 0 0,1 20,4V20A2,2 0 0,1 18,22H6A2,2 0 0,1 4,20V4A2,2 0 0,1 6,2M14,8A2,2 0 0,0 12,6A2,2 0 0,0 10,8A2,2 0 0,0 12,10A2,2 0 0,0 14,8M8,17H16V16C16,14.67 13.33,14 12,14C10.67,14 8,14.67 8,16V17M16,3H8A1,1 0 0,0 7,4A1,1 0 0,0 8,5H16A1,1 0 0,0 17,4A1,1 0 0,0 16,3Z"
              />
            </svg>
            <span>Home Team Details</span>
          </div>
          <div className="detail-card-content">
            <div className="detail-team-header">
              <img src={homeLogo} alt={homeTeam} className="team-logo-tiny" />
              <span>{homeTeam}</span>
            </div>
            <div className="detail-item">
              <div className="detail-label">Classification</div>
              <div className="detail-value">{homeClassification || "N/A"}</div>
            </div>
            <div className="detail-item">
              <div className="detail-label">Conference</div>
              <div className="detail-value">{homeConference || "N/A"}</div>
            </div>
            <div className="detail-item">
              <div className="detail-label">Team ID</div>
              <div className="detail-value">{homeTeamId || "N/A"}</div>
            </div>
            <div className="detail-item">
              <div className="detail-label">Conference ID</div>
              <div className="detail-value">{homeConferenceId || "N/A"}</div>
            </div>
          </div>
        </div>
        
        <div className="detail-card">
          <div className="detail-card-header">
            <svg width="24" height="24" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M6,2H18A2,2 0 0,1 20,4V20A2,2 0 0,1 18,22H6A2,2 0 0,1 4,20V4A2,2 0 0,1 6,2M14,8A2,2 0 0,0 12,6A2,2 0 0,0 10,8A2,2 0 0,0 12,10A2,2 0 0,0 14,8M8,17H16V16C16,14.67 13.33,14 12,14C10.67,14 8,14.67 8,16V17M16,3H8A1,1 0 0,0 7,4A1,1 0 0,0 8,5H16A1,1 0 0,0 17,4A1,1 0 0,0 16,3Z"
              />
            </svg>
            <span>Away Team Details</span>
          </div>
          <div className="detail-card-content">
            <div className="detail-team-header">
              <img src={awayLogo} alt={awayTeam} className="team-logo-tiny" />
              <span>{awayTeam}</span>
            </div>
            <div className="detail-item">
              <div className="detail-label">Classification</div>
              <div className="detail-value">{awayClassification || "N/A"}</div>
            </div>
            <div className="detail-item">
              <div className="detail-label">Conference</div>
              <div className="detail-value">{awayConference || "N/A"}</div>
            </div>
            <div className="detail-item">
              <div className="detail-label">Team ID</div>
              <div className="detail-value">{awayTeamId || "N/A"}</div>
            </div>
            <div className="detail-item">
              <div className="detail-label">Conference ID</div>
              <div className="detail-value">{awayConferenceId || "N/A"}</div>
            </div>
          </div>
        </div>
      </div>
      {notes && (
        <div className="notes-container">
          <div className="notes-header">Game Notes</div>
          <div className="notes-content">{notes}</div>
        </div>
      )}
    </div>
  );

  const renderWinMetrics = () => (
    <div className="tab-content win-metrics">
      <WinProb gameId={id} />
    </div>
  );

  const renderAdvancedStats = () => (
    <div className="tab-content advanced-stats">
      <h2>Advanced Statistics</h2>
      {gameData ? (
        <AdvancedStatistics 
          gameData={gameData} 
          homeTeam={homeTeam} 
          awayTeam={awayTeam} 
          homeTeamColor={homeTeamColor} 
          awayTeamColor={awayTeamColor} 
          homeLogo={homeLogo} 
          awayLogo={awayLogo} 
        />
      ) : (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading advanced statistics...</p>
        </div>
      )}
    </div>
  );

  const renderTabs = () => (
    <div className="tabs">
      <button className={`tab-button ${activeTab === "overview" ? "active" : ""}`} onClick={() => setActiveTab("overview")}>
        <svg width="18" height="18" viewBox="0 0 24 24">
          <path
            fill="currentColor"
            d="M12,5.5A3.5,3.5 0 0,1 15.5,9A3.5,3.5 0 0,1 12,12.5A3.5,3.5 0 0,1 8.5,9A3.5,3.5 0 0,1 12,5.5M5,8C5.56,8 6.08,8.15 6.53,8.42C6.38,9.85 6.8,11.27 7.66,12.38C7.16,13.34 6.16,14 5,14A3,3 0 0,1 2,11A3,3 0 0,1 5,8M19,8A3,3 0 0,1 22,11A3,3 0 0,1 19,14C17.84,14 16.84,13.34 16.34,12.38C17.2,11.27 17.62,9.85 17.47,8.42C17.92,8.15 18.44,8 19,8M5.5,18.25C5.5,16.18 8.41,14.5 12,14.5C15.59,14.5 18.5,16.18 18.5,18.25V20H5.5V18.25M0,20V18.5C0,17.11 1.89,15.94 4.45,15.6C3.86,16.28 3.5,17.22 3.5,18.25V20H0M24,20H20.5V18.25C20.5,17.22 20.14,16.28 19.55,15.6C22.11,15.94 24,17.11 24,18.5V20Z"
          />
        </svg>
        <span>Overview</span>
      </button>
      <button className={`tab-button ${activeTab === "statistics" ? "active" : ""}`} onClick={() => setActiveTab("statistics")}>
        <svg width="18" height="18" viewBox="0 0 24 24">
          <path
            fill="currentColor"
            d="M22,21H2V3H4V19H6V10H10V19H12V6H16V19H18V14H22V21Z"
          />
        </svg>
        <span>Statistics</span>
      </button>
      <button className={`tab-button ${activeTab === "videos" ? "active" : ""}`} onClick={() => setActiveTab("videos")}>
        <svg width="18" height="18" viewBox="0 0 24 24">
          <path
            fill="currentColor"
            d="M17,10.5V7A1,1 0 0,0 16,6H4A1,1 0 0,0 3,7V17A1,1 0 0,0 4,18H16A1,1 0 0,0 17,17V13.5L21,17.5V6.5L17,10.5Z"
          />
        </svg>
        <span>Videos</span>
      </button>
      <button className={`tab-button ${activeTab === "betting" ? "active" : ""}`} onClick={() => setActiveTab("betting")}>
        <svg width="18" height="18" viewBox="0 0 24 24">
          <path
            fill="currentColor"
            d="M3.5,3H20.5C21.33,3 22,3.67 22,4.5V7.5C22,8.33 21.33,9 20.5,9H3.5C2.67,9 2,8.33 2,7.5V4.5C2,3.67 2.67,3 3.5,3M3.5,11H20.5C21.33,11 22,11.67 22,12.5V15.5C22,16.33 21.33,17 20.5,17H3.5C2.67,17 2,16.33 2,15.5V12.5C2,11.67 2.67,11 3.5,11M3.5,19H20.5C21.33,19 22,19.67 22,20.5V21H2V20.5C2,19.67 2.67,19 3.5,19Z"
          />
        </svg>
        <span>Betting</span>
      </button>
      <button className={`tab-button ${activeTab === "weather" ? "active" : ""}`} onClick={() => setActiveTab("weather")}>
        <svg width="18" height="18" viewBox="0 0 24 24">
          <path
            fill="currentColor"
            d="M6,19A5,5 0 0,1 1,14A5,5 0 0,1 6,9C7,6.65 9.3,5 12,5C15.43,5 18.24,7.66 18.5,11.03L19,11A4,4 0 0,1 23,15A4,4 0 0,1 19,19H6M19,13H17V12A5,5 0 0,0 12,7C9.5,7 7.45,8.82 7.06,11.19C6.73,11.07 6.37,11 6,11A3,3 0 0,0 3,14A3,3 0 0,0 6,17H19A2,2 0 0,0 21,15A2,2 0 0,0 19,13Z"
          />
        </svg>
        <span>Weather</span>
      </button>
      <button className={`tab-button ${activeTab === "venue" ? "active" : ""}`} onClick={() => setActiveTab("venue")}>
        <svg width="18" height="18" viewBox="0 0 24 24">
          <path
            fill="currentColor"
            d="M12,11.5A2.5,2.5 0 0,1 9.5,9A2.5,2.5 0 0,1 12,6.5A2.5,2.5 0 0,1 14.5,9A2.5,2.5 0 0,1 12,11.5M12,2A7,7 0 0,0 5,9C5,14.25 12,22 12,22C12,22 19,14.25 19,9A7,7 0 0,0 12,2Z"
          />
        </svg>
        <span>Venue</span>
      </button>
      <button className={`tab-button ${activeTab === "details" ? "active" : ""}`} onClick={() => setActiveTab("details")}>
        <svg width="18" height="18" viewBox="0 0 24 24">
          <path
            fill="currentColor"
            d="M13,9H11V7H13M13,17H11V11H13M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z"
          />
        </svg>
        <span>Details</span>
      </button>
      <button className={`tab-button ${activeTab === "winMetrics" ? "active" : ""}`} onClick={() => setActiveTab("winMetrics")}>
        <svg width="18" height="18" viewBox="0 0 24 24">
          <path
            fill="currentColor"
            d="M3.5,18.5L9.5,12.5L13.5,16.5L22,6.92L20.59,5.5L13.5,13.5L9.5,9.5L2,17L3.5,18.5Z"
          />
        </svg>
        <span>Metrics</span>
      </button>
      <button className={`tab-button ${activeTab === "advancedStats" ? "active" : ""}`} onClick={() => setActiveTab("advancedStats")}>
        <svg width="18" height="18" viewBox="0 0 24 24">
          <path
            fill="currentColor"
            d="M16,11.78L20.24,4.45L21.97,5.45L16.74,14.5L10.23,10.75L5.46,19H22V21H2V3H4V17.54L9.5,8L16,11.78Z"
          />
        </svg>
        <span>Advanced Stats</span>
      </button>
    </div>
  );

  return (
    <div className="advanced-game-detail">
      <div className="game-header">
        <h1>Game Details</h1>
        <div className="game-status">
          {status === "final"
            ? "Final Score"
            : status === "in_progress"
            ? "Live"
            : startDate
            ? new Date(startDate).toLocaleDateString()
            : "Upcoming Game"}
        </div>
      </div>
      {renderTabs()}
      {activeTab === "overview" && renderOverview()}
      {activeTab === "statistics" && renderStatisticsTab()}
      {activeTab === "videos" && renderVideos()}
      {activeTab === "betting" && renderBetting()}
      {activeTab === "weather" && renderWeatherTab()}
      {activeTab === "venue" && renderVenue()}
      {activeTab === "details" && renderDetails()}
      {activeTab === "winMetrics" && renderWinMetrics()}
      {activeTab === "advancedStats" && renderAdvancedStats()}
    </div>
  );
};

export default AdvancedGameDetailView;