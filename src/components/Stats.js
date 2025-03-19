import React, { useState, useEffect } from "react";
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

// Fixed team stats data - based on realistic values for top programs
const fixedTeamStats = [
  // Realistic top tier programs typically in the top 10 of various categories
  { team: "Ohio State", conference: "Big Ten", totalYards: 6873, pointsFor: 38, rushingYards: 2665, netPassingYards: 4208, yardsAllowed: 3105, pointsAllowed: 14 },
  { team: "Oregon", conference: "Pac-12", totalYards: 6740, pointsFor: 42, rushingYards: 2340, netPassingYards: 4400, yardsAllowed: 3310, pointsAllowed: 16 },
  { team: "Georgia", conference: "SEC", totalYards: 6580, pointsFor: 39, rushingYards: 2450, netPassingYards: 4130, yardsAllowed: 3250, pointsAllowed: 15 },
  { team: "Alabama", conference: "SEC", totalYards: 6490, pointsFor: 37, rushingYards: 2520, netPassingYards: 3970, yardsAllowed: 3480, pointsAllowed: 18 },
  { team: "Michigan", conference: "Big Ten", totalYards: 6350, pointsFor: 35, rushingYards: 3050, netPassingYards: 3300, yardsAllowed: 3020, pointsAllowed: 13 },
  { team: "Texas", conference: "Big 12", totalYards: 6240, pointsFor: 36, rushingYards: 2380, netPassingYards: 3860, yardsAllowed: 3580, pointsAllowed: 19 },
  { team: "Florida State", conference: "ACC", totalYards: 6180, pointsFor: 35, rushingYards: 2580, netPassingYards: 3600, yardsAllowed: 3640, pointsAllowed: 20 },
  { team: "LSU", conference: "SEC", totalYards: 6090, pointsFor: 36, rushingYards: 2180, netPassingYards: 3910, yardsAllowed: 3750, pointsAllowed: 21 },
  { team: "Tennessee", conference: "SEC", totalYards: 5950, pointsFor: 34, rushingYards: 2760, netPassingYards: 3190, yardsAllowed: 3480, pointsAllowed: 19 },
  { team: "USC", conference: "Pac-12", totalYards: 5860, pointsFor: 37, rushingYards: 1980, netPassingYards: 3880, yardsAllowed: 3820, pointsAllowed: 24 },
  
  // Next tier of programs 
  { team: "Oklahoma", conference: "Big 12", totalYards: 5780, pointsFor: 33, rushingYards: 2420, netPassingYards: 3360, yardsAllowed: 3540, pointsAllowed: 20 },
  { team: "Clemson", conference: "ACC", totalYards: 5720, pointsFor: 32, rushingYards: 2670, netPassingYards: 3050, yardsAllowed: 3360, pointsAllowed: 18 },
  { team: "Penn State", conference: "Big Ten", totalYards: 5640, pointsFor: 31, rushingYards: 2520, netPassingYards: 3120, yardsAllowed: 3280, pointsAllowed: 17 },
  { team: "Notre Dame", conference: "FBS Independents", totalYards: 5580, pointsFor: 30, rushingYards: 2730, netPassingYards: 2850, yardsAllowed: 3420, pointsAllowed: 19 },
  { team: "Utah", conference: "Pac-12", totalYards: 5510, pointsFor: 29, rushingYards: 2980, netPassingYards: 2530, yardsAllowed: 3250, pointsAllowed: 17 },
  
  // Better defensive teams with less offense
  { team: "Iowa", conference: "Big Ten", totalYards: 4820, pointsFor: 24, rushingYards: 2270, netPassingYards: 2550, yardsAllowed: 2980, pointsAllowed: 12 },
  { team: "Wisconsin", conference: "Big Ten", totalYards: 4950, pointsFor: 26, rushingYards: 2850, netPassingYards: 2100, yardsAllowed: 3050, pointsAllowed: 14 },
  { team: "Cincinnati", conference: "American Athletic", totalYards: 5120, pointsFor: 28, rushingYards: 2540, netPassingYards: 2580, yardsAllowed: 3130, pointsAllowed: 16 },
  
  // Additional teams to ensure we have enough for the mock data
  { team: "Washington", conference: "Pac-12", totalYards: 5370, pointsFor: 31, rushingYards: 2150, netPassingYards: 3220, yardsAllowed: 3650, pointsAllowed: 22 },
  { team: "Ole Miss", conference: "SEC", totalYards: 5430, pointsFor: 32, rushingYards: 2490, netPassingYards: 2940, yardsAllowed: 3710, pointsAllowed: 23 },
  { team: "Miami", conference: "ACC", totalYards: 5280, pointsFor: 29, rushingYards: 2380, netPassingYards: 2900, yardsAllowed: 3590, pointsAllowed: 21 },
  { team: "Texas A&M", conference: "SEC", totalYards: 5150, pointsFor: 28, rushingYards: 2420, netPassingYards: 2730, yardsAllowed: 3470, pointsAllowed: 20 },
  { team: "Auburn", conference: "SEC", totalYards: 5080, pointsFor: 27, rushingYards: 2570, netPassingYards: 2510, yardsAllowed: 3520, pointsAllowed: 22 },
  { team: "Baylor", conference: "Big 12", totalYards: 5020, pointsFor: 28, rushingYards: 2360, netPassingYards: 2660, yardsAllowed: 3580, pointsAllowed: 23 },
  { team: "Pittsburgh", conference: "ACC", totalYards: 4980, pointsFor: 27, rushingYards: 2290, netPassingYards: 2690, yardsAllowed: 3490, pointsAllowed: 21 },
  { team: "UCF", conference: "American Athletic", totalYards: 5250, pointsFor: 30, rushingYards: 2620, netPassingYards: 2630, yardsAllowed: 3560, pointsAllowed: 22 },
  { team: "Boise State", conference: "Mountain West", totalYards: 5180, pointsFor: 29, rushingYards: 2540, netPassingYards: 2640, yardsAllowed: 3380, pointsAllowed: 20 },
  { team: "Houston", conference: "American Athletic", totalYards: 5050, pointsFor: 28, rushingYards: 2320, netPassingYards: 2730, yardsAllowed: 3640, pointsAllowed: 24 },
  { team: "Indiana", conference: "Big Ten", totalYards: 5558, pointsFor: 34, rushingYards: 2161, netPassingYards: 3397, yardsAllowed: 3530, pointsAllowed: 21 }
];

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

  // Helper for logos
  const getTeamLogo = (teamName) => {
    const foundTeam = teams.find(
      (t) => t.school?.toLowerCase() === teamName?.toLowerCase()
    );
    return foundTeam?.logos?.[0] || "/photos/default_team.png";
  };

  // Helper for team abbreviation
  const getTeamAbbreviation = (teamName) => {
    const foundTeam = teams.find(
      (t) => t.school?.toLowerCase() === teamName?.toLowerCase()
    );
    return foundTeam?.abbreviation
      ? foundTeam.abbreviation.toUpperCase()
      : teamName?.toUpperCase() || "";
  };

  // Helper for fetch player stats
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
    return () => controller.abort();
  };
  
  // Helper for fetch team stats - Now uses fixed data to ensure consistency
  const fetchTeamStats = async (year) => {
    try {
      setLoadingTeamStats(true);
      
      // Convert fixed data to the format expected by aggregateTeamStats
      const mockTeamStats = [];
      
      // Use the fixed stats data to ensure consistent results
      fixedTeamStats.forEach(team => {
        // Add stats with the same structure expected by aggregateTeamStats
        mockTeamStats.push({
          team: team.team,
          conference: team.conference,
          statName: "totalYards",
          statValue: team.totalYards
        });
        
        mockTeamStats.push({
          team: team.team,
          conference: team.conference,
          statName: "pointsFor",
          statValue: team.pointsFor
        });
        
        mockTeamStats.push({
          team: team.team,
          conference: team.conference,
          statName: "rushingYards",
          statValue: team.rushingYards
        });
        
        mockTeamStats.push({
          team: team.team,
          conference: team.conference,
          statName: "netPassingYards",
          statValue: team.netPassingYards
        });
        
        mockTeamStats.push({
          team: team.team,
          conference: team.conference,
          statName: "yardsAllowed",
          statValue: team.yardsAllowed
        });
        
        mockTeamStats.push({
          team: team.team,
          conference: team.conference,
          statName: "pointsAllowed",
          statValue: team.pointsAllowed
        });
      });
      
      // Process each stat category with the mock data
      const totalOffense = aggregateTeamStats(mockTeamStats, "totalYards");
      const scoringOffense = aggregateTeamStats(mockTeamStats, "pointsFor");
      const rushingOffense = aggregateTeamStats(mockTeamStats, "rushingYards");
      const passingOffense = aggregateTeamStats(mockTeamStats, "netPassingYards");
      const totalDefense = aggregateTeamStats(mockTeamStats, "yardsAllowed");
      const scoringDefense = aggregateTeamStats(mockTeamStats, "pointsAllowed");
      
      // For categories like scoring defense, sort differently (low is good)
      const sortedScoringDefense = [...scoringDefense].sort((a, b) => a.statValue - b.statValue);
      const sortedTotalDefense = [...totalDefense].sort((a, b) => a.statValue - b.statValue);
      
      setTeamStats({
        totalOffense,
        scoringOffense,
        rushingOffense,
        passingOffense,
        totalDefense: sortedTotalDefense,
        scoringDefense: sortedScoringDefense
      });
    } catch (error) {
      console.error(`Error processing team stats:`, error);
      setError("Failed to load team stats.");
    } finally {
      setLoadingTeamStats(false);
    }
  };

  // Fetch player data
  useEffect(() => {
    fetchCategory(2024, "passing", "YDS", setLoadingPassing, "passing");
  }, []);
  useEffect(() => {
    fetchCategory(2024, "rushing", "YDS", setLoadingRushing, "rushing");
  }, []);
  useEffect(() => {
    fetchCategory(2024, "receiving", "YDS", setLoadingReceiving, "receiving");
  }, []);
  useEffect(() => {
    fetchCategory(2024, "interceptions", "INT", setLoadingInterceptions, "interceptions");
  }, []);
  
  // Fetch team data
  useEffect(() => {
    if (activeTab === "teamLeaders") {
      fetchTeamStats(2024);
    }
  }, [activeTab]);

  // Render player stat card
  const renderPlayerStatCard = (title, data, loading, statAbbr = "YDS") => {
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
  
  // Render team stat card
  const renderTeamStatCard = (title, data, loading, statAbbr = "YDS", isDefense = false) => {
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

      {/* Content */}
      {activeTab === "playerLeaders" && (
        <div className="cards-container">
          {renderPlayerStatCard("Passing Yards", playerStats.passing, loadingPassing, "YDS")}
          {renderPlayerStatCard("Rushing Yards", playerStats.rushing, loadingRushing, "YDS")}
          {renderPlayerStatCard("Receiving Yards", playerStats.receiving, loadingReceiving, "YDS")}
          {renderPlayerStatCard("Interceptions", playerStats.interceptions, loadingInterceptions, "INT")}
        </div>
      )}
      
      {activeTab === "teamLeaders" && (
        <div className="cards-container">
          {renderTeamStatCard("Total Offense", teamStats.totalOffense, loadingTeamStats, "YDS")}
          {renderTeamStatCard("Scoring Offense", teamStats.scoringOffense, loadingTeamStats, "PPG")}
          {renderTeamStatCard("Rushing Offense", teamStats.rushingOffense, loadingTeamStats, "YDS")}
          {renderTeamStatCard("Passing Offense", teamStats.passingOffense, loadingTeamStats, "YDS")}
          {renderTeamStatCard("Total Defense", teamStats.totalDefense, loadingTeamStats, "YDS", true)}
          {renderTeamStatCard("Scoring Defense", teamStats.scoringDefense, loadingTeamStats, "PPG", true)}
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