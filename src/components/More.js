import React, { useState, useEffect } from "react";
import teamsService from "../services/teamsService";

const More = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Data states
  const [teams, setTeams] = useState([]);
  const [games, setGames] = useState([]);
  const [rankings, setRankings] = useState([]);
  const [playerStats, setPlayerStats] = useState({
    passing: [],
    rushing: [],
    receiving: []
  });
  const [selectedStatCategory, setSelectedStatCategory] = useState("passing");
  const [teamRatings, setTeamRatings] = useState([]);
  const [eloRatings, setEloRatings] = useState([]);
  const [calendar, setCalendar] = useState([]);
  const currentWeek = 10; // You would dynamically determine this based on current date

  // Fetch data on component mount
  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      try {
        // Fetch teams
        const teamsData = await teamsService.getTeams();
        setTeams(teamsData);
        
        // Fetch upcoming games (for current week)
        const gamesData = await teamsService.getGames(currentWeek);
        setGames(gamesData);
        
        // Fetch AP Poll rankings
        const pollsData = await teamsService.getPolls(2024, "ap", currentWeek);
        setRankings(pollsData.length > 0 ? pollsData[0].rankings : []);
        
        // Fetch player stats for passing, rushing, and receiving
        const [passingStats, rushingStats, receivingStats] = await Promise.all([
          teamsService.getPlayerSeasonStats(2024, "passing"),
          teamsService.getPlayerSeasonStats(2024, "rushing"),
          teamsService.getPlayerSeasonStats(2024, "receiving")
        ]);
        
        setPlayerStats({
          passing: passingStats,
          rushing: rushingStats,
          receiving: receivingStats
        });
        
        // Get game calendar
        const calendarData = await teamsService.getCalendar(2024);
        setCalendar(calendarData);

        setIsLoading(false);
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        setError("Failed to load dashboard data");
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Fetch analytics data when analytics tab is selected
  useEffect(() => {
    if (activeTab === "analytics") {
      const fetchAnalyticsData = async () => {
        try {
          // Fetch team SP+ ratings
          const ratingsData = await teamsService.getRatingsSPConferences(2024);
          setTeamRatings(ratingsData);

          // Fetch Elo ratings
          const eloData = await teamsService.getRatingsElo(2024);
          setEloRatings(eloData);
        } catch (err) {
          console.error("Error fetching analytics data:", err);
        }
      };

      fetchAnalyticsData();
    }
  }, [activeTab]);

  // Helper function to format date
  const formatDate = (dateString) => {
    if (!dateString) return "TBD";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Helper function to get team logo
  const getTeamLogo = (teamName) => {
    if (!teamName || !teams.length) return "/photos/default_team.png";
    const team = teams.find(t => t.school && t.school.toLowerCase() === teamName.toLowerCase());
    return team && team.logos && team.logos.length > 0 ? team.logos[0] : "/photos/default_team.png";
  };

  // Helper function to get team rank
  const getTeamRank = (teamName) => {
    if (!teamName || !rankings.length) return null;
    const ranking = rankings.find(r => r.school && r.school.toLowerCase() === teamName.toLowerCase());
    return ranking ? ranking.rank : null;
  };

  // Dashboard content with real data
  const renderDashboard = () => {
    if (isLoading) {
      return (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading data...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="error-container">
          <p>Error: {error}</p>
          <button onClick={() => window.location.reload()}>Retry</button>
        </div>
      );
    }

    // Top 5 teams from AP Poll
    const topTeams = rankings.slice(0, 5);
    
    // Get upcoming games, sorted by team ranking
    const upcomingGames = games
      .filter(game => game.startDate && new Date(game.startDate) > new Date())
      .sort((a, b) => {
        const rankA = Math.min(
          getTeamRank(a.homeTeam) || 999, 
          getTeamRank(a.awayTeam) || 999
        );
        const rankB = Math.min(
          getTeamRank(b.homeTeam) || 999, 
          getTeamRank(b.awayTeam) || 999
        );
        return rankA - rankB;
      })
      .slice(0, 5);

    // Get top 5 players from selected stat category
    const getStatLeaders = () => {
      const statData = playerStats[selectedStatCategory] || [];
      if (selectedStatCategory === "passing") {
        return statData
          .sort((a, b) => (b.passingYards || 0) - (a.passingYards || 0))
          .slice(0, 5)
          .map(player => ({
            name: player.athlete ? `${player.athlete.firstName} ${player.athlete.lastName}` : "Unknown Player",
            team: player.team,
            stat: `${player.passingYards || 0} yds`,
            statValue: player.passingYards || 0
          }));
      } else if (selectedStatCategory === "rushing") {
        return statData
          .sort((a, b) => (b.rushingYards || 0) - (a.rushingYards || 0))
          .slice(0, 5)
          .map(player => ({
            name: player.athlete ? `${player.athlete.firstName} ${player.athlete.lastName}` : "Unknown Player",
            team: player.team,
            stat: `${player.rushingYards || 0} yds`,
            statValue: player.rushingYards || 0
          }));
      } else {
        return statData
          .sort((a, b) => (b.receivingYards || 0) - (a.receivingYards || 0))
          .slice(0, 5)
          .map(player => ({
            name: player.athlete ? `${player.athlete.firstName} ${player.athlete.lastName}` : "Unknown Player",
            team: player.team,
            stat: `${player.receivingYards || 0} yds`,
            statValue: player.receivingYards || 0
          }));
      }
    };

    const statLeaders = getStatLeaders();

    return (
      <div className="stats-dashboard">
        <div className="dashboard-grid">
          <div className="dashboard-card trending">
            <h3>Top Ranked Teams</h3>
            <div className="trending-list">
              {topTeams.map((team, index) => (
                <div className="trending-item" key={`team-${index}`}>
                  <div className="trend-rank">{team.rank}</div>
                  <div className="trend-team-container">
                    <img 
                      src={getTeamLogo(team.school)} 
                      alt={team.school}
                      className="trend-team-logo" 
                    />
                    <div className="trend-team">{team.school}</div>
                  </div>
                  <div className="trend-conference">{team.conference}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="dashboard-card highlights">
            <h3>Recent Highlights</h3>
            <div className="highlights-list">
              {games
                .filter(game => game.startDate && new Date(game.startDate) < new Date() && game.homePoints && game.awayPoints)
                .sort((a, b) => new Date(b.startDate) - new Date(a.startDate))
                .slice(0, 3)
                .map((game, index) => {
                  const isClose = Math.abs((game.homePoints || 0) - (game.awayPoints || 0)) <= 7;
                  const isHighScoring = ((game.homePoints || 0) + (game.awayPoints || 0)) > 60;
                  
                  let highlightTitle = "";
                  
                  if (isClose && isHighScoring) {
                    highlightTitle = "Thrilling shootout";
                  } else if (isClose) {
                    highlightTitle = "Nail-biting finish";
                  } else if (isHighScoring) {
                    highlightTitle = "Offensive explosion";
                  } else {
                    highlightTitle = "Game highlights";
                  }
                  
                  return (
                    <div className="highlight-item" key={`highlight-${index}`}>
                      <div className="highlight-image" style={{ backgroundColor: "#f0f0f0" }}>
                        <div className="play-icon">▶</div>
                      </div>
                      <div className="highlight-info">
                        <div className="highlight-title">{highlightTitle}</div>
                        <div className="highlight-teams">
                          {game.homeTeam} {game.homePoints} - {game.awayPoints} {game.awayTeam}
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          <div className="dashboard-card stat-leaders">
            <h3>Statistical Leaders</h3>
            <div className="stats-tabs">
              <button 
                className={`stat-tab ${selectedStatCategory === "passing" ? "active" : ""}`}
                onClick={() => setSelectedStatCategory("passing")}
              >
                Passing
              </button>
              <button 
                className={`stat-tab ${selectedStatCategory === "rushing" ? "active" : ""}`}
                onClick={() => setSelectedStatCategory("rushing")}
              >
                Rushing
              </button>
              <button 
                className={`stat-tab ${selectedStatCategory === "receiving" ? "active" : ""}`}
                onClick={() => setSelectedStatCategory("receiving")}
              >
                Receiving
              </button>
            </div>
            <div className="stat-leaders-list">
              {statLeaders.map((player, index) => (
                <div className="stat-leader-item" key={`leader-${index}`}>
                  <div className="leader-rank">{index + 1}</div>
                  <div className="leader-info">
                    <div className="leader-name">{player.name}</div>
                    <div className="leader-team">{player.team}</div>
                  </div>
                  <div className="leader-stat">{player.stat}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="dashboard-card upcoming-games">
            <h3>Top Upcoming Games</h3>
            <div className="games-list">
              {upcomingGames.map((game, index) => {
                const homeRank = getTeamRank(game.homeTeam);
                const awayRank = getTeamRank(game.awayTeam);
                const homeDisplay = homeRank ? `#${homeRank} ${game.homeTeam}` : game.homeTeam;
                const awayDisplay = awayRank ? `#${awayRank} ${game.awayTeam}` : game.awayTeam;
                
                return (
                  <div className="game-item" key={`game-${index}`}>
                    <div className="game-teams">
                      <span className="game-team">{homeDisplay}</span>
                      <span className="game-vs">vs</span>
                      <span className="game-team">{awayDisplay}</span>
                    </div>
                    <div className="game-info">
                      <div className="game-time">{formatDate(game.startDate)}</div>
                      <div className="game-channel">
                        {game.tv || "TV TBD"}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Analytics content with real data
  const renderAnalytics = () => {
    if (!teamRatings.length && !eloRatings.length) {
      return (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading analytics data...</p>
        </div>
      );
    }

    // Find top 5 teams by offense, defense, and overall ratings
    const topOffenseTeams = teamRatings
      .flatMap(conf => conf.teams || [])
      .sort((a, b) => (b.offense?.rating || 0) - (a.offense?.rating || 0))
      .slice(0, 3);

    const topDefenseTeams = teamRatings
      .flatMap(conf => conf.teams || [])
      .sort((a, b) => (b.defense?.rating || 0) - (a.defense?.rating || 0))
      .slice(0, 3);

    // Get top 5 teams by ELO rating
    const topEloTeams = eloRatings
      .sort((a, b) => (b.elo || 0) - (a.elo || 0))
      .slice(0, 5);

    return (
      <div className="analytics-section">
        <div className="analytics-header">
          <h3>Advanced Football Analytics</h3>
          <p>Gain insights from cutting-edge analytics to understand team performance beyond traditional stats.</p>
        </div>

        <div className="analytics-grid">
          <div className="analytics-card">
            <div className="analytics-card-header">
              <h4>Win Probability Model</h4>
              <div className="analytics-icon">
                <svg viewBox="0 0 24 24" width="24" height="24">
                  <path fill="currentColor" d="M3,14L3.5,14.07L8.07,9.5C7.89,8.85 8.06,8.11 8.56,7.56C9.37,6.76 10.62,6.76 11.43,7.56C11.93,8.06 12.1,8.8 11.93,9.45L15.93,13.45C16.58,13.28 17.32,13.45 17.82,13.95C18.63,14.75 18.63,16 17.82,16.81C17.32,17.31 16.58,17.48 15.93,17.31L11.93,21.31L12,21.5C10.5,20 10.5,18 12,16.5C12.68,17.18 12.68,18.32 12,19L15.56,15.44C14.11,15.44 12.61,14.79 11.75,13.44L9.73,15.46L9.5,15.25C9.5,16.75 8.5,18 7,18.5L11,14.5L8.07,11.57C7.46,12.61 6.33,13.24 5.22,13.24L9.5,17.5C8,19 6,19 4.5,17.5C3,16 3,14 4.5,12.5C5.21,13.21 6.3,13.2 7,12.5L10.5,9L9.4,7.9C8.75,8.57 7.68,8.57 7,7.9C6.3,7.2 6.3,6.1 7,5.4C7.7,4.7 8.8,4.7 9.5,5.4C10.2,6.1 10.2,7.17 9.53,7.9L10.6,9L14,5.5C14,4 15,3 16.5,2.5L12.45,6.55C12.63,7.2 12.46,7.94 11.96,8.44C11.16,9.24 9.91,9.24 9.1,8.44C8.6,7.94 8.43,7.2 8.6,6.55L4.5,10.65C3,9 3,7 4.5,5.5C6,4 8,4 9.5,5.5L9.4,5.6L9.5,5.5C9.78,5.79 10,6.14 10.1,6.5L14.5,2.1C16,3.5 16,5.5 14.5,7L14.4,7.1C14.21,7.28 14,7.45 13.75,7.6L13.74,7.61L18.74,12.61C19.39,12.43 20.13,12.6 20.63,13.1C21.44,13.91 21.44,15.16 20.63,15.97C20.13,16.47 19.39,16.64 18.74,16.47L13.69,21.52C13.5,21.72 13.28,21.9 13,22H12.7C12.08,22 11.5,21.73 11.1,21.28L3.72,13.9C3.28,13.5 3,12.92 3,12.3V12C3.04,11.71 3.22,11.5 3.42,11.3L7.11,7.6C7.45,7.26 7.84,7 8.27,6.91C8.87,6.77 9.5,6.97 10,7.47C10.8,8.27 10.8,9.53 10,10.33C9.5,10.83 8.76,11 8.11,10.83L3.58,15.36C3.22,15.73 3,16.22 3,16.72V17C3,17.33 3.11,17.67 3.33,17.93L3.5,18.1C3,16.6 3,15 4.5,13.5L3,14Z" />
                </svg>
              </div>
            </div>
            <div className="analytics-preview">
              <div className="win-prob-chart">
                <div className="chart-axis-y"></div>
                <div className="chart-line">
                  <div className="chart-point" style={{ left: "0%", bottom: "50%" }}></div>
                  <div className="chart-point" style={{ left: "20%", bottom: "60%" }}></div>
                  <div className="chart-point" style={{ left: "40%", bottom: "45%" }}></div>
                  <div className="chart-point" style={{ left: "60%", bottom: "70%" }}></div>
                  <div className="chart-point" style={{ left: "80%", bottom: "80%" }}></div>
                  <div className="chart-point" style={{ left: "100%", bottom: "85%" }}></div>
                </div>
                <div className="chart-axis-x"></div>
              </div>
            </div>
            <div className="analytics-footer">
              <button className="analytics-button" onClick={() => alert("This would navigate to the Win Probability Explorer tool")}>
                Explore Model
              </button>
            </div>
          </div>

          <div className="analytics-card">
            <div className="analytics-card-header">
              <h4>Team Efficiency Ratings</h4>
              <div className="analytics-icon">
                <svg viewBox="0 0 24 24" width="24" height="24">
                  <path fill="currentColor" d="M19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3M9 17H7V10H9V17M13 17H11V7H13V17M17 17H15V13H17V17Z" />
                </svg>
              </div>
            </div>
            <div className="efficiency-metrics">
              <div className="efficiency-category">
                <div className="efficiency-label">Offense</div>
                <div className="efficiency-bars">
                  {topOffenseTeams.map((team, index) => {
                    const rating = team.offense?.rating || 0;
                    const maxRating = topOffenseTeams[0].offense?.rating || 1;
                    const percentage = (rating / maxRating) * 100;
                    
                    return (
                      <div className="efficiency-team" key={`offense-${index}`}>
                        <span>{team.team}</span>
                        <div className="efficiency-bar">
                          <div className="efficiency-fill" style={{ width: `${percentage}%` }}></div>
                        </div>
                        <span>{rating.toFixed(1)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="efficiency-category">
                <div className="efficiency-label">Defense</div>
                <div className="efficiency-bars">
                  {topDefenseTeams.map((team, index) => {
                    const rating = team.defense?.rating || 0;
                    const maxRating = topDefenseTeams[0].defense?.rating || 1;
                    const percentage = (rating / maxRating) * 100;
                    
                    return (
                      <div className="efficiency-team" key={`defense-${index}`}>
                        <span>{team.team}</span>
                        <div className="efficiency-bar">
                          <div className="efficiency-fill defense" style={{ width: `${percentage}%` }}></div>
                        </div>
                        <span>{rating.toFixed(1)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            <div className="analytics-footer">
              <button className="analytics-button" onClick={() => alert("This would navigate to the Team Efficiency Explorer")}>
                View All Teams
              </button>
            </div>
          </div>

          <div className="analytics-card">
            <div className="analytics-card-header">
              <h4>ELO Rankings</h4>
              <div className="analytics-icon">
                <svg viewBox="0 0 24 24" width="24" height="24">
                  <path fill="currentColor" d="M7,13H21V11H7M7,19H21V17H7M7,7H21V5H7M2,11H5.5L2,13.5V15H6V13H2.5L6,10.5V9H2M2,19H6V17H2M2,7H6V5H2V7Z" />
                </svg>
              </div>
            </div>
            <div className="predictive-preview">
              <div className="ranking-list">
                {topEloTeams.map((team, index) => (
                  <div className="ranking-item" key={`elo-${index}`}>
                    <div className="ranking-number">{index + 1}</div>
                    <div className="ranking-team">{team.team}</div>
                    <div className="ranking-score">{team.elo.toFixed(1)}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="analytics-footer">
              <button className="analytics-button" onClick={() => alert("This would navigate to the ELO Rankings page")}>
                Full Rankings
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Tools content with real data integration hooks
  const renderTools = () => {
    // This section still uses placeholder UI but with functional hooks for real data
    return (
      <div className="tools-section">
        <div className="tools-header">
          <h3>Interactive Tools</h3>
          <p>Customizable tools to enhance your football analysis experience</p>
        </div>

        <div className="tools-grid">
          <div className="tool-card">
            <div className="tool-icon-container">
              <svg className="tool-icon" viewBox="0 0 24 24" width="40" height="40">
                <path fill="currentColor" d="M20 4H4A2 2 0 0 0 2 6V18A2 2 0 0 0 4 20H20A2 2 0 0 0 22 18V6A2 2 0 0 0 20 4M20 18H4V6H20V18M5 7H19V9H5V7M5 11H19V13H5V11M5 15H14V17H5V15Z" />
              </svg>
            </div>
            <h4>Team Comparison</h4>
            <p>Compare head-to-head statistics between any two teams</p>
            <button 
              className="tool-button" 
              onClick={() => alert("This would use teamsService.getTeamMatchup to compare teams")}
            >
              Compare Teams
            </button>
          </div>

          <div className="tool-card">
            <div className="tool-icon-container">
              <svg className="tool-icon" viewBox="0 0 24 24" width="40" height="40">
                <path fill="currentColor" d="M7,13V11H21V13H7M7,19V17H21V19H7M7,7V5H21V7H7M3,8V5H2V4H4V8H3M2,17V16H5V20H2V19H4V18.5H3V17.5H4V17H2M4.25,10A0.75,0.75 0 0,1 5,10.75C5,10.95 4.92,11.14 4.79,11.27L3.12,13H5V14H2V13.08L4,11H2V10H4.25Z" />
              </svg>
            </div>
            <h4>Playoff Calculator</h4>
            <p>Simulate scenarios to see your team's playoff chances</p>
            <button 
              className="tool-button"
              onClick={() => alert("This would use rankings and game data to calculate playoff scenarios")}
            >
              Calculate Scenarios
            </button>
          </div>

          <div className="tool-card">
            <div className="tool-icon-container">
              <svg className="tool-icon" viewBox="0 0 24 24" width="40" height="40">
                <path fill="currentColor" d="M3,14L3.5,14.07L8.07,9.5C7.89,8.85 8.06,8.11 8.56,7.56C9.37,6.76 10.62,6.76 11.43,7.56C11.93,8.06 12.1,8.8 11.93,9.45L15.93,13.45C16.58,13.28 17.32,13.45 17.82,13.95C18.63,14.75 18.63,16 17.82,16.81C17.32,17.31 16.58,17.48 15.93,17.31L11.93,21.31L12,21.5C10.5,20 10.5,18 12,16.5C12.68,17.18 12.68,18.32 12,19L15.56,15.44C14.11,15.44 12.61,14.79 11.75,13.44L9.73,15.46L9.5,15.25C9.5,16.75 8.5,18 7,18.5L11,14.5L8.07,11.57C7.46,12.61 6.33,13.24 5.22,13.24L9.5,17.5C8,19 6,19 4.5,17.5C3,16 3,14 4.5,12.5C5.21,13.21 6.3,13.2 7,12.5L10.5,9L9.4,7.9C8.75,8.57 7.68,8.57 7,7.9C6.3,7.2 6.3,6.1 7,5.4C7.7,4.7 8.8,4.7 9.5,5.4C10.2,6.1 10.2,7.17 9.53,7.9L10.6,9L14,5.5C14,4 15,3 16.5,2.5L12.45,6.55C12.63,7.2 12.46,7.94 11.96,8.44C11.16,9.24 9.91,9.24 9.1,8.44C8.6,7.94 8.43,7.2 8.6,6.55L4.5,10.65C3,9 3,7 4.5,5.5C6,4 8,4 9.5,5.5L9.4,5.6L9.5,5.5C9.78,5.79 10,6.14 10.1,6.5L14.5,2.1C16,3.5 16,5.5 14.5,7L14.4,7.1C14.21,7.28 14,7.45 13.75,7.6L13.74,7.61L18.74,12.61C19.39,12.43 20.13,12.6 20.63,13.1C21.44,13.91 21.44,15.16 20.63,15.97C20.13,16.47 19.39,16.6418.74,16.47L13.69,21.52C13.5,21.72 13.28,21.9 13,22H12.7C12.08,22 11.5,21.73 11.1,21.28L3.72,13.9C3.28,13.5 3,12.92 3,12.3V12C3.04,11.71 3.22,11.5 3.42,11.3L7.11,7.6C7.45,7.26 7.84,7 8.27,6.91C8.87,6.77 9.5,6.97 10,7.47C10.8,8.27 10.8,9.53 10,10.33C9.5,10.83 8.76,11 8.11,10.83L3.58,15.36C3.22,15.73 3,16.22 3,16.72V17C3,17.33 3.11,17.67 3.33,17.93L3.5,18.1C3,16.6 3,15 4.5,13.5L3,14Z" />
              </svg>
            </div>
            <h4>Strength of Schedule</h4>
            <p>Analyze and compare the difficulty of team schedules</p>
            <button 
              className="tool-button"
              onClick={() => alert("This would use teamsService.getTeamSchedule to analyze strength of schedules")}
            >
              Analyze Schedules
            </button>
          </div>

          <div className="tool-card">
            <div className="tool-icon-container">
              <svg className="tool-icon" viewBox="0 0 24 24" width="40" height="40">
                <path fill="currentColor" d="M17.45,15.18L22,7.31V19L22,21H2V3H4V15.54L9.5,6L16,9.78L20.24,2.45L21.97,3.45L16.74,12.5L10.23,8.75L4.31,19H6.57L10.96,11.44L17.45,15.18Z" />
              </svg>
            </div>
            <h4>Statistical Explorer</h4>
            <p>Create custom filters to find the data that matters most to you</p>
            <button 
              className="tool-button"
              onClick={() => alert("This would use teamsService.getPlayerSeasonStats and team stats endpoints")}
            >
              Explore Stats
            </button>
          </div>

          <div className="tool-card">
            <div className="tool-icon-container">
              <svg className="tool-icon" viewBox="0 0 24 24" width="40" height="40">
                <path fill="currentColor" d="M21,16.5C21,16.88 20.79,17.21 20.47,17.38L12.57,21.82C12.41,21.94 12.21,22 12,22C11.79,22 11.59,21.94 11.43,21.82L3.53,17.38C3.21,17.21 3,16.88 3,16.5V7.5C3,7.12 3.21,6.79 3.53,6.62L11.43,2.18C11.59,2.06 11.79,2 12,2C12.21,2 12.41,2.06 12.57,2.18L20.47,6.62C20.79,6.79 21,7.12 21,7.5V16.5M12,4.15L5,8.09V15.91L12,19.85L19,15.91V8.09L12,4.15M12,6.23L16.9,9.06L12,11.89L7.1,9.06L12,6.23M17,14.89L13,17.2V13.62L17,11.31V14.89M11,17.2L7,14.89V11.31L11,13.62V17.2Z" />
              </svg>
            </div>
            <h4>Matchup Analyzer</h4>
            <p>Deep dive into historical matchups between two teams</p>
            <button 
              className="tool-button"
              onClick={() => alert("This would use teamsService.getTeamMatchup for historical data")}
            >
              Analyze Matchups
            </button>
          </div>

          <div className="tool-card">
            <div className="tool-icon-container">
              <svg className="tool-icon" viewBox="0 0 24 24" width="40" height="40">
                <path fill="currentColor" d="M12,10A2,2 0 0,0 10,12C10,13.11 10.9,14 12,14C13.11,14 14,13.11 14,12A2,2 0 0,0 12,10Z" />
                <path fill="currentColor" d="M5,5A7,7 0 0,1 12,12A7,7 0 0,1 5,19A7,7 0 0,1 12,26A7,7 0 0,1 19,19A7,7 0 0,1 12,12A7,7 0 0,1 19,5A7,7 0 0,1 12,12A7,7 0 0,1 5,5Z" />
              </svg>
            </div>
            <h4>Bowl Projections</h4>
            <p>See the latest projections for college football bowl games</p>
            <button 
              className="tool-button"
              onClick={() => alert("This would use teamsService.getPolls and other ranking data for projections")}
            >
              View Projections
            </button>
          </div>
        </div>
      </div>
    );
  };

  // History content with integration for historical data
  const renderHistory = () => {
    // This section uses mostly placeholder UI with some real data integration hooks
    return (
      <div className="history-section">
        <div className="history-header">
          <h3>Football History</h3>
          <p>Explore the rich tradition and history of college football</p>
        </div>

        <div className="history-featured">
          <div className="history-featured-image">
            <div className="history-featured-overlay">
              <h4>On This Day in Football History</h4>
              <p>November 20, 1982: The Play - California defeats Stanford on a kickoff return featuring five laterals and the Stanford band on the field</p>
              <button 
                className="history-button"
                onClick={() => window.open("https://www.youtube.com/watch?v=mfebpLfAt8g", "_blank")}
              >
                Watch the Play
              </button>
            </div>
          </div>
        </div>

        <div className="history-grid">
          <div className="history-card">
            <h4>Historical Champions</h4>
            <p>Browse through the history of national championship teams</p>
            <button 
              className="history-button"
              onClick={() => alert("This would use historical champions data from the API")}
            >
              View Champions
            </button>
          </div>

          <div className="history-card">
            <h4>Record Books</h4>
            <p>Explore individual and team records throughout college football history</p>
            <button 
              className="history-button"
              onClick={() => alert("This would use teamsService.getStatsCategories for record book data")}
            >
              Browse Records
            </button>
          </div>

          <div className="history-card">
            <h4>Historic Rivalries</h4>
            <p>Dive into the stories behind college football's greatest rivalries</p>
            <button 
              className="history-button"
              onClick={() => alert("This would use teamsService.getTeamMatchup for rivalry data")}
            >
              Explore Rivalries
            </button>
          </div>

          <div className="history-card">
            <h4>Hall of Fame</h4>
            <p>Learn about the legends of the game in the College Football Hall of Fame</p>
            <button 
              className="history-button"
              onClick={() => alert("This would link to Hall of Fame information")}
            >
              Visit Hall of Fame
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Render the main content based on active tab
  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return renderDashboard();
      case "analytics":
        return renderAnalytics();
      case "tools":
        return renderTools();
      case "history":
        return renderHistory();
      default:
        return renderDashboard();
    }
  };

  return (
    <div className="more-container">
      <div className="more-header">
        <h2>Football Central</h2>
        <p>Your comprehensive hub for college football insights, tools, and analysis</p>
      </div>

      <div className="more-tabs">
        <button 
          className={`more-tab ${activeTab === "dashboard" ? "active" : ""}`}
          onClick={() => setActiveTab("dashboard")}
        >
          <svg viewBox="0 0 24 24" width="20" height="20">
            <path fill="currentColor" d="M13,3V9H21V3M13,21H21V11H13M3,21H11V15H3M3,13H11V3H3V13Z" />
          </svg>
          Dashboard
        </button>
        <button 
          className={`more-tab ${activeTab === "analytics" ? "active" : ""}`}
          onClick={() => setActiveTab("analytics")}
        >
          <svg viewBox="0 0 24 24" width="20" height="20">
            <path fill="currentColor" d="M19,3H5C3.9,3 3,3.9 3,5V19C3,20.1 3.9,21 5,21H19C20.1,21 21,20.1 21,19V5C21,3.9 20.1,3 19,3M9,17H7V10H9V17M13,17H11V7H13V17M17,17H15V13H17V17Z" />
          </svg>
          Analytics
        </button>
        <button 
          className={`more-tab ${activeTab === "tools" ? "active" : ""}`}
          onClick={() => setActiveTab("tools")}
        >
          <svg viewBox="0 0 24 24" width="20" height="20">
            <path fill="currentColor" d="M22.7,19L13.6,9.9C14.5,7.6 14,4.9 12.1,3C10.1,1 7.1,0.6 4.7,1.7L9,6L6,9L1.6,4.7C0.4,7.1 0.9,10.1 2.9,12.1C4.8,14 7.5,14.5 9.8,13.6L18.9,22.7C19.3,23.1 19.9,23.1 20.3,22.7L22.6,20.4C23.1,20 23.1,19.3 22.7,19Z" />
          </svg>
          Tools
        </button>
        <button 
          className={`more-tab ${activeTab === "history" ? "active" : ""}`}
          onClick={() => setActiveTab("history")}
        >
          <svg viewBox="0 0 24 24" width="20" height="20">
            <path fill="currentColor" d="M13,3A9,9 0 0,0 4,12H1L4.89,15.89L4.96,16.03L9,12H6A7,7 0 0,1 13,5A7,7 0 0,1 20,12A7,7 0 0,1 13,19C11.07,19 9.32,18.21 8.06,16.94L6.64,18.36C8.27,20 10.5,21 13,21A9,9 0 0,0 22,12A9,9 0 0,0 13,3M12,8V13L16.28,15.54L17,14.33L13.5,12.25V8H12Z" />
          </svg>
          History
        </button>
      </div>

      <div className="more-content">
        {renderContent()}
      </div>

      {/* CSS Styles */}
      <style jsx>{`
        .more-container {
          width: 100%;
          max-width: 1400px;
          margin: 0 auto;
          padding: 24px;
          color: #333;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
          background-color: #f8f9fa;
          min-height: calc(100vh - 200px);
        }

        .more-header {
          text-align: center;
          margin-bottom: 32px;
        }

        .more-header h2 {
          font-size: 2.5rem;
          font-weight: 700;
          margin-bottom: 8px;
          color: #D4001C; /* GameDay red color */
        }

        .more-header p {
          font-size: 1.2rem;
          color: #666;
          max-width: 700px;
          margin: 0 auto;
        }

        .more-tabs {
          display: flex;
          justify-content: center;
          gap: 12px;
          margin-bottom: 32px;
          flex-wrap: wrap;
        }

        .more-tab {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
          border-radius: 50px;
          border: none;
          background-color: #fff;
          color: #555;
          font-weight: 500;
          font-size: 1rem;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }

        .more-tab:hover {
          background-color: #f0f0f0;
          transform: translateY(-2px);
        }

        .more-tab.active {
          background-color: #D4001C;
          color: white;
        }

        .more-content {
          background-color: white;
          border-radius: 12px;
          box-shadow: 0 4px 16px rgba(0,0,0,0.1);
          padding: 32px;
          min-height: 600px;
        }

        /* Loading and Error States */
        .loading-container, .error-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 400px;
          text-align: center;
        }

        .loading-spinner {
          width: 50px;
          height: 300px;
          border-radius: 12px;
          background-color: #333;
          background-image: url('https://via.placeholder.com/1200x300');
          background-size: cover;
          background-position: center;
          position: relative;
          overflow: hidden;
        }

        .history-featured-overlay {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          padding: 24px;
          background: linear-gradient(to top, rgba(0,0,0,0.8), transparent);
          color: white;
        }

        .history-featured-overlay h4 {
          font-size: 1.5rem;
          font-weight: 700;
          margin-bottom: 8px;
        }

        .history-featured-overlay p {
          margin-bottom: 16px;
          max-width: 800px;
        }

        .history-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 24px;
        }

        .history-card {
          background-color: #fff;
          border-radius: 12px;
          padding: 24px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.05);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .history-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 5px 15px rgba(0,0,0,0.1);
        }

        .history-card h4 {
          font-size: 1.2rem;
          font-weight: 600;
          margin-bottom: 8px;
          color: #333;
        }

        .history-card p {
          color: #666;
          margin-bottom: 20px;
          font-size: 0.95rem;
        }

        .history-button {
          padding: 8px 16px;
          background-color: #D4001C;
          color: white;
          border: none;
          border-radius: 4px;
          font-weight: 500;
          cursor: pointer;
          transition: background-color 0.2s ease;
        }

        .history-button:hover {
          background-color: #b3001a;
        }

        /* Responsive Adjustments */
        @media (max-width: 1200px) {
          .dashboard-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 768px) {
          .more-container {
            padding: 16px;
          }

          .more-header h2 {
            font-size: 2rem;
          }

          .more-content {
            padding: 20px;
          }

          .analytics-grid, .tools-grid, .history-grid {
            grid-template-columns: 1fr;
          }

          .history-featured-image {
            height: 220px;
          }

          .history-featured-overlay h4 {
            font-size: 1.2rem;
          }

          .history-featured-overlay p {
            font-size: 0.9rem;
          }
        }

        @media (max-width: 480px) {
          .more-header h2 {
            font-size: 1.5rem;
          }

          .more-header p {
            font-size: 0.9rem;
          }

          .more-tabs {
            gap: 8px;
          }

          .more-tab {
            padding: 8px 12px;
            font-size: 0.85rem;
          }

          .more-content {
            padding: 16px;
          }

          .tool-card, .history-card {
            padding: 16px;
          }
        }
      `}</style>
    </div>
  );
};

export default More;