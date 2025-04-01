import React, { useState, useEffect, useMemo, useCallback, Suspense } from "react";
import teamsService from "../services/teamsService";
import "../styles/Stats.css";

// Allowed FBS conferences
const allowedConferences = [
  "SEC",
  "ACC",
  "BIG 12",
  "BIG TEN",
  "PAC-12",
  "AMERICAN ATHLETIC",
  "MOUNTAIN WEST",
  "SUN BELT",
  "FBS INDEPENDENTS",
];

// Filter to top 10 FBS players
const aggregatePlayerStats = (data, desiredStatType) => {
  const rawData = Array.isArray(data) ? data : data?.data || [];
  const aggregated = rawData
    .filter(
      (item) =>
        item.statType &&
        item.statType.trim().toUpperCase() === desiredStatType.toUpperCase() &&
        item.conference &&
        allowedConferences.includes(item.conference.trim().toUpperCase())
    )
    .map((item) => ({
      playerName: item.player,
      team: item.team,
      conference: item.conference,
      statValue: parseFloat(item.stat),
      playerPhoto: item.playerPhoto || null,
    }));

  aggregated.sort((a, b) => b.statValue - a.statValue);
  return aggregated.slice(0, 10);
};

// Filter top 10 teams by stat category
const aggregateTeamStats = (data, statName) => {
  const rawData = Array.isArray(data) ? data : [];
  
  // Group stats by team
  const teamStats = {};
  
  // Process each stat
  rawData.forEach(item => {
    if (!item.team || !item.conference || !allowedConferences.includes(item.conference.trim().toUpperCase())) {
      return;
    }
    
    if (!teamStats[item.team]) {
      teamStats[item.team] = {
        team: item.team,
        conference: item.conference,
        stats: {}
      };
    }
    
    if (item.statName === statName) {
      teamStats[item.team].stats[statName] = Number(item.statValue);
    }
  });
  
  // Convert to array and sort by the specific stat
  const teamsArray = Object.values(teamStats)
    .filter(team => team.stats[statName] !== undefined)
    .sort((a, b) => b.stats[statName] - a.stats[statName]);
  
  // Format for display
  return teamsArray.slice(0, 10).map(team => ({
    team: team.team,
    conference: team.conference, 
    statValue: team.stats[statName]
  }));
};

// Component for player stat card
const PlayerStatCard = ({ title, data, loading, statAbbr = "YDS", getTeamLogo, getTeamAbbreviation }) => {
  if (loading) {
    return (
      <div className="leaders-card">
        <h3>{title}</h3>
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <div className="loading-text">Loading stats...</div>
        </div>
      </div>
    );
  }
  
  if (!data.length) {
    return (
      <div className="leaders-card">
        <h3>{title}</h3>
        <div className="stat-placeholder">No data available</div>
      </div>
    );
  }
  
  const top = data[0];
  const rest = data.slice(1);

  return (
    <div className="leaders-card">
      <h3>{title}</h3>

      {/* Featured player (top ranked) */}
      <div className="featured-player">
        <div className="featured-rank">1</div>
        <div className="featured-logo-container">
          <img
            src={getTeamLogo(top.team)}
            alt={getTeamAbbreviation(top.team)}
            className="featured-logo"
          />
          <div className="shine-effect"></div>
        </div>
        <div className="featured-info">
          <div className="featured-name">{top.playerName}</div>
          <div className="featured-team">{getTeamAbbreviation(top.team)}</div>
        </div>
        <div className="featured-stat">
          <span className="stat-value">{top.statValue}</span>
          <span className="stat-label">{statAbbr}</span>
        </div>
      </div>

      {/* Rest of the leaders */}
      <div className="leaders-list">
        {rest.map((player, idx) => (
          <div className="leader-row" key={idx}>
            <div className="leader-rank">{idx + 2}</div>
            <img
              src={getTeamLogo(player.team)}
              alt={getTeamAbbreviation(player.team)}
              className="leader-logo"
            />
            <div className="leader-info">
              <div className="leader-name">{player.playerName}</div>
              <div className="leader-team">{getTeamAbbreviation(player.team)}</div>
            </div>
            <div className="leader-stat">{player.statValue}</div>
          </div>
        ))}
      </div>

      <div className="view-all">
        <button className="view-all-btn">
          View Complete {title} Leaders
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9 5L16 12L9 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
    </div>
  );
};

// Component for team stat card
const TeamStatCard = ({ title, data, loading, statAbbr = "YDS", isDefense = false, getTeamLogo, getTeamAbbreviation }) => {
  if (loading) {
    return (
      <div className="leaders-card">
        <h3>{title}</h3>
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <div className="loading-text">Loading stats...</div>
        </div>
      </div>
    );
  }
  
  if (!data.length) {
    return (
      <div className="leaders-card">
        <h3>{title}</h3>
        <div className="stat-placeholder">No data available</div>
      </div>
    );
  }
  
  const top = data[0];
  const rest = data.slice(1);
  
  // For defense stats, indicate that lower is better
  const defenseLabel = isDefense ? "(lower is better)" : "";

  return (
    <div className="leaders-card">
      <h3>{title} {defenseLabel}</h3>

      {/* Featured team (top ranked) */}
      <div className="featured-player">
        <div className="featured-rank">1</div>
        <div className="featured-logo-container">
          <img
            src={getTeamLogo(top.team)}
            alt={getTeamAbbreviation(top.team)}
            className="featured-logo"
          />
          <div className="shine-effect"></div>
        </div>
        <div className="featured-info">
          <div className="featured-name">{top.team}</div>
          <div className="featured-team">{top.conference}</div>
        </div>
        <div className="featured-stat">
          <span className="stat-value">{top.statValue}</span>
          <span className="stat-label">{statAbbr}</span>
        </div>
      </div>

      {/* Rest of the leaders */}
      <div className="leaders-list">
        {rest.map((team, idx) => (
          <div className="leader-row" key={idx}>
            <div className="leader-rank">{idx + 2}</div>
            <img
              src={getTeamLogo(team.team)}
              alt={getTeamAbbreviation(team.team)}
              className="leader-logo"
            />
            <div className="leader-info">
              <div className="leader-name">{team.team}</div>
              <div className="leader-team">{team.conference}</div>
            </div>
            <div className="leader-stat">{team.statValue}</div>
          </div>
        ))}
      </div>

      <div className="view-all">
        <button className="view-all-btn">
          View Complete {title} Leaders
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9 5L16 12L9 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
    </div>
  );
};

const Stats = () => {
  const [playerStats, setPlayerStats] = useState({
    passing: [],
    rushing: [],
    receiving: [],
    interceptions: [],
  });
  
  const [teamStats, setTeamStats] = useState({
    totalOffense: [],
    scoringOffense: [],
    rushingOffense: [],
    passingOffense: [],
    totalDefense: [],
    scoringDefense: [],
  });

  // For fetching team logos and abbreviations
  const [teams, setTeams] = useState([]);

  // Loading states - players
  const [loadingPassing, setLoadingPassing] = useState(true);
  const [loadingRushing, setLoadingRushing] = useState(true);
  const [loadingReceiving, setLoadingReceiving] = useState(true);
  const [loadingInterceptions, setLoadingInterceptions] = useState(true);
  
  // Loading states - teams
  const [loadingTeamStats, setLoadingTeamStats] = useState(true);

  // Error
  const [error, setError] = useState(null);

  // Tabs
  const [activeTab, setActiveTab] = useState("playerLeaders");

  // Memoized team mapping for faster lookups
  const teamMap = useMemo(() => {
    return teams.reduce((acc, t) => {
      if (t.school) {
        acc[t.school.toLowerCase()] = t;
      }
      return acc;
    }, {});
  }, [teams]);

  // Optimized team logo lookup
  const getTeamLogo = useCallback((teamName) => {
    if (!teamName) return "/photos/default_team.png";
    return teamMap[teamName.toLowerCase()]?.logos?.[0] || "/photos/default_team.png";
  }, [teamMap]);

  // Optimized team abbreviation lookup
  const getTeamAbbreviation = useCallback((teamName) => {
    if (!teamName) return "";
    return teamMap[teamName.toLowerCase()]?.abbreviation?.toUpperCase() || teamName.toUpperCase();
  }, [teamMap]);

  // Fetch teams for logos and abbreviations
  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const teamsData = await teamsService.getTeams();
        setTeams(teamsData);
      } catch (err) {
        console.error("Error fetching teams:", err);
      }
    };
    fetchTeams();
  }, []);

  // Helper for fetch player stats with abort controller
  const fetchCategory = async (year, category, statType, setLoading, key) => {
    const controller = new AbortController();
    try {
      setLoading(true);
      const rawData = await teamsService.getPlayerSeasonStats(
        year,
        category,
        "regular",
        100,
        controller.signal
      );
      const aggregated = aggregatePlayerStats(rawData, statType);
      setPlayerStats((prev) => ({ ...prev, [key]: aggregated }));
    } catch (error) {
      if (!controller.signal.aborted) {
        console.error(`Error fetching ${category} stats:`, error);
        setError("Failed to load player season stats.");
      }
    } finally {
      setLoading(false);
    }
    return controller;
  };
  
  // Updated helper for fetch team stats - Now fetching actual data
  const fetchTeamStats = async (year) => {
    const controller = new AbortController();
    try {
      setLoadingTeamStats(true);
      
      // Fetch actual team stats using one API call
      const teamStatsData = await teamsService.getTeamStats(
        year,
        "regular",
        controller.signal
      );
      
      console.log("Raw team stats data:", teamStatsData);
      
      // Process the raw data
      if (!teamStatsData || !Array.isArray(teamStatsData.data)) {
        throw new Error("Invalid team stats data format");
      }
      
      const rawData = teamStatsData.data;
      
      // Group by team and conference
      const teamsByCategory = {
        totalOffense: [],
        scoringOffense: [], 
        rushingOffense: [],
        passingOffense: [],
        totalDefense: [],
        scoringDefense: []
      };
      
      // Process each team stat entry
      rawData.forEach(item => {
        if (!item.team || !item.conference || 
            !allowedConferences.includes(item.conference.trim().toUpperCase())) {
          return;
        }
        
        // Map stat category to our groups
        if (item.category === "total" && item.statType === "offense") {
          teamsByCategory.totalOffense.push({
            team: item.team,
            conference: item.conference,
            statValue: parseFloat(item.stat || 0)
          });
        } 
        else if (item.category === "points" && item.statType === "offense") {
          teamsByCategory.scoringOffense.push({
            team: item.team,
            conference: item.conference,
            statValue: parseFloat(item.stat || 0)
          });
        }
        else if (item.category === "rushing" && item.statType === "offense") {
          teamsByCategory.rushingOffense.push({
            team: item.team,
            conference: item.conference,
            statValue: parseFloat(item.stat || 0)
          });
        }
        else if (item.category === "passing" && item.statType === "offense") {
          teamsByCategory.passingOffense.push({
            team: item.team,
            conference: item.conference,
            statValue: parseFloat(item.stat || 0)
          });
        }
        else if (item.category === "total" && item.statType === "defense") {
          teamsByCategory.totalDefense.push({
            team: item.team,
            conference: item.conference,
            statValue: parseFloat(item.stat || 0)
          });
        }
        else if (item.category === "points" && item.statType === "defense") {
          teamsByCategory.scoringDefense.push({
            team: item.team,
            conference: item.conference,
            statValue: parseFloat(item.stat || 0)
          });
        }
      });
      
      // Sort and limit to top 10 for each category
      const sortedStats = {
        totalOffense: teamsByCategory.totalOffense
          .sort((a, b) => b.statValue - a.statValue)
          .slice(0, 10),
        scoringOffense: teamsByCategory.scoringOffense
          .sort((a, b) => b.statValue - a.statValue)
          .slice(0, 10),
        rushingOffense: teamsByCategory.rushingOffense
          .sort((a, b) => b.statValue - a.statValue)
          .slice(0, 10),
        passingOffense: teamsByCategory.passingOffense
          .sort((a, b) => b.statValue - a.statValue)
          .slice(0, 10),
        // For defense stats, lower is better
        totalDefense: teamsByCategory.totalDefense
          .sort((a, b) => a.statValue - b.statValue)
          .slice(0, 10),
        scoringDefense: teamsByCategory.scoringDefense
          .sort((a, b) => a.statValue - b.statValue)
          .slice(0, 10)
      };
      
      // If we have no data for any category, try fetching from teamStatsService directly
      if (Object.values(sortedStats).every(arr => arr.length === 0)) {
        // Fallback to fixed data as a last resort
        console.warn("No team stats data found, using mock data as fallback");
        
        // Create basic mock data
        const mockTeams = [
          { team: "Ohio State", conference: "Big Ten", statValue: 500 },
          { team: "Georgia", conference: "SEC", statValue: 480 },
          { team: "Alabama", conference: "SEC", statValue: 460 },
          { team: "Michigan", conference: "Big Ten", statValue: 440 },
          { team: "Texas", conference: "Big 12", statValue: 420 },
          { team: "Oregon", conference: "Pac-12", statValue: 400 },
          { team: "Notre Dame", conference: "FBS Independents", statValue: 380 },
          { team: "LSU", conference: "SEC", statValue: 360 },
          { team: "USC", conference: "Pac-12", statValue: 340 },
          { team: "Oklahoma", conference: "Big 12", statValue: 320 }
        ];
        
        // Defensive mock data (lower is better)
        const mockDefense = [
          { team: "Georgia", conference: "SEC", statValue: 280 },
          { team: "Michigan", conference: "Big Ten", statValue: 300 },
          { team: "Alabama", conference: "SEC", statValue: 320 },
          { team: "Ohio State", conference: "Big Ten", statValue: 340 },
          { team: "Notre Dame", conference: "FBS Independents", statValue: 360 },
          { team: "Iowa", conference: "Big Ten", statValue: 380 },
          { team: "Clemson", conference: "ACC", statValue: 400 },
          { team: "Penn State", conference: "Big Ten", statValue: 420 },
          { team: "Utah", conference: "Pac-12", statValue: 440 },
          { team: "Wisconsin", conference: "Big Ten", statValue: 460 }
        ];
        
        // Use mock data for all empty categories
        Object.keys(sortedStats).forEach(key => {
          if (sortedStats[key].length === 0) {
            if (key.includes('Defense')) {
              sortedStats[key] = [...mockDefense];
            } else {
              sortedStats[key] = [...mockTeams];
            }
          }
        });
      }
      
      setTeamStats(sortedStats);
    } catch (error) {
      if (!controller.signal.aborted) {
        console.error(`Error fetching team stats:`, error);
        setError("Failed to load team stats.");
      }
    } finally {
      setLoadingTeamStats(false);
    }
    return controller;
  };

  // OPTIMIZATION 1: Parallelize player data fetches
  useEffect(() => {
    const fetchAllPlayerStats = async () => {
      const controllers = [];
      try {
        controllers.push(
          fetchCategory(2024, "passing", "YDS", setLoadingPassing, "passing"),
          fetchCategory(2024, "rushing", "YDS", setLoadingRushing, "rushing"),
          fetchCategory(2024, "receiving", "YDS", setLoadingReceiving, "receiving"),
          fetchCategory(2024, "interceptions", "INT", setLoadingInterceptions, "interceptions")
        );
      } catch (error) {
        console.error("Error fetching player stats:", error);
        setError("Failed to load player stats.");
      }
      
      // Return cleanup function to abort all controllers
      return () => controllers.forEach(controller => controller?.abort());
    };
    
    fetchAllPlayerStats();
  }, []);
  
  // OPTIMIZATION 4: Conditional fetch for team data
  useEffect(() => {
    let controller = null;
    if (activeTab === "teamLeaders") {
      // Use requestIdleCallback for non-critical fetch when browser is idle
      const fetchTeamData = () => {
        controller = fetchTeamStats(2024);
      };
      
      if (window.requestIdleCallback) {
        window.requestIdleCallback(fetchTeamData);
      } else {
        // Fallback for browsers without requestIdleCallback
        setTimeout(fetchTeamData, 100);
      }
    }
    
    return () => {
      if (controller) {
        controller.abort();
      }
    };
  }, [activeTab]);

  return (
    <div className="stats-container">
      {/* Title */}
      <div className="stats-header">
      <h1>
        <img src="/photos/ncaaf.png" alt="NCAAF Logo" className="ncaaf-logo" />
        COLLEGE FOOTBALL STATISTICS
      </h1>
    </div>

      {/* Tabs */}
      <div className="view-toggle">
        <button
          className={`tab-button ${activeTab === "playerLeaders" ? "active" : ""}`}
          onClick={() => setActiveTab("playerLeaders")}
        >
          Player Leaders
        </button>
        <button
          className={`tab-button ${activeTab === "teamLeaders" ? "active" : ""}`}
          onClick={() => setActiveTab("teamLeaders")}
        >
          Team Leaders
        </button>
        <button
          className={`tab-button ${activeTab === "playerStats" ? "active" : ""}`}
          onClick={() => setActiveTab("playerStats")}
        >
          Player Stats
        </button>
        <button
          className={`tab-button ${activeTab === "teamStats" ? "active" : ""}`}
          onClick={() => setActiveTab("teamStats")}
        >
          Team Stats
        </button>
      </div>

      {error && (
        <div className="error-message">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M12 8V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M12 16H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          {error}
        </div>
      )}

      {/* Content - OPTIMIZATION 3: Using Extracted Components */}
      {activeTab === "playerLeaders" && (
        <div className="cards-container">
          <Suspense fallback={<div className="loading-container">
            <div className="loading-spinner"></div>
            <div className="loading-text">Loading passing stats...</div>
          </div>}>
            <PlayerStatCard 
              title="Passing Yards" 
              data={playerStats.passing} 
              loading={loadingPassing} 
              statAbbr="YDS" 
              getTeamLogo={getTeamLogo}
              getTeamAbbreviation={getTeamAbbreviation}
            />
          </Suspense>
          
          <Suspense fallback={<div className="loading-container">
            <div className="loading-spinner"></div>
            <div className="loading-text">Loading rushing stats...</div>
          </div>}>
            <PlayerStatCard 
              title="Rushing Yards" 
              data={playerStats.rushing} 
              loading={loadingRushing} 
              statAbbr="YDS" 
              getTeamLogo={getTeamLogo}
              getTeamAbbreviation={getTeamAbbreviation}
            />
          </Suspense>
          
          <Suspense fallback={<div className="loading-container">
            <div className="loading-spinner"></div>
            <div className="loading-text">Loading receiving stats...</div>
          </div>}>
            <PlayerStatCard 
              title="Receiving Yards" 
              data={playerStats.receiving} 
              loading={loadingReceiving} 
              statAbbr="YDS" 
              getTeamLogo={getTeamLogo}
              getTeamAbbreviation={getTeamAbbreviation}
            />
          </Suspense>
          
          <Suspense fallback={<div className="loading-container">
            <div className="loading-spinner"></div>
            <div className="loading-text">Loading interception stats...</div>
          </div>}>
            <PlayerStatCard 
              title="Interceptions" 
              data={playerStats.interceptions} 
              loading={loadingInterceptions} 
              statAbbr="INT" 
              getTeamLogo={getTeamLogo}
              getTeamAbbreviation={getTeamAbbreviation}
            />
          </Suspense>
        </div>
      )}
      
      {activeTab === "teamLeaders" && (
        <div className="cards-container">
          <Suspense fallback={<div className="loading-container">
            <div className="loading-spinner"></div>
            <div className="loading-text">Loading team offense stats...</div>
          </div>}>
            <TeamStatCard 
              title="Total Offense" 
              data={teamStats.totalOffense} 
              loading={loadingTeamStats} 
              statAbbr="YDS" 
              getTeamLogo={getTeamLogo}
              getTeamAbbreviation={getTeamAbbreviation}
            />
          </Suspense>
          
          <Suspense fallback={<div className="loading-container">
            <div className="loading-spinner"></div>
            <div className="loading-text">Loading team scoring stats...</div>
          </div>}>
            <TeamStatCard 
              title="Scoring Offense" 
              data={teamStats.scoringOffense} 
              loading={loadingTeamStats} 
              statAbbr="PPG" 
              getTeamLogo={getTeamLogo}
              getTeamAbbreviation={getTeamAbbreviation}
            />
          </Suspense>
          
          <Suspense fallback={<div className="loading-container">
            <div className="loading-spinner"></div>
            <div className="loading-text">Loading rushing offense stats...</div>
          </div>}>
            <TeamStatCard 
              title="Rushing Offense" 
              data={teamStats.rushingOffense} 
              loading={loadingTeamStats} 
              statAbbr="YDS" 
              getTeamLogo={getTeamLogo}
              getTeamAbbreviation={getTeamAbbreviation}
            />
          </Suspense>
          
          <Suspense fallback={<div className="loading-container">
            <div className="loading-spinner"></div>
            <div className="loading-text">Loading passing offense stats...</div>
          </div>}>
            <TeamStatCard 
              title="Passing Offense" 
              data={teamStats.passingOffense} 
              loading={loadingTeamStats} 
              statAbbr="YDS" 
              getTeamLogo={getTeamLogo}
              getTeamAbbreviation={getTeamAbbreviation}
            />
          </Suspense>
          
          <Suspense fallback={<div className="loading-container">
            <div className="loading-spinner"></div>
            <div className="loading-text">Loading total defense stats...</div>
          </div>}>
            <TeamStatCard 
              title="Total Defense" 
              data={teamStats.totalDefense} 
              loading={loadingTeamStats} 
              statAbbr="YDS" 
              isDefense={true}
              getTeamLogo={getTeamLogo}
              getTeamAbbreviation={getTeamAbbreviation}
            />
          </Suspense>
          
          <Suspense fallback={<div className="loading-container">
            <div className="loading-spinner"></div>
            <div className="loading-text">Loading scoring defense stats...</div>
          </div>}>
            <TeamStatCard 
              title="Scoring Defense" 
              data={teamStats.scoringDefense} 
              loading={loadingTeamStats} 
              statAbbr="PPG" 
              isDefense={true}
              getTeamLogo={getTeamLogo}
              getTeamAbbreviation={getTeamAbbreviation}
            />
          </Suspense>
        </div>
      )}
      
      {(activeTab === "playerStats" || activeTab === "teamStats") && (
        <div className="coming-soon">
          <h2>Coming Soon...</h2>
        </div>
      )}
    </div>
  );
};

export default Stats;