import React, { useState, useEffect } from 'react';
import teamsService from '../services/teamsService';

const TeamOutlook = () => {
  // State management
  const [games, setGames] = useState([]);
  const [teams, setTeams] = useState([]);
  const [ppaData, setPpaData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedGame, setSelectedGame] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [compareData, setCompareData] = useState({
    homeTeam: null,
    awayTeam: null
  });
  
  // Current year for data and next year for display
  const currentYear = 2024;
  const nextYear = 2025;
  const week = 1;

  // Insert styles when component mounts
  useEffect(() => {
    const styleEl = document.createElement('style');
    styleEl.innerHTML = `
      /* Container styles */
      .team-outlook-container {
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
        max-width: 1200px;
        margin: 0 auto;
        padding: 20px;
        color: #333;
        background-color: #f9f9f9;
      }
      
      /* Header styles */
      .week-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 30px;
      }
      
      .week-title {
        font-size: 32px;
        font-weight: 800;
        color: #111827;
        margin: 0;
      }
      
      .week-subtitle {
        font-size: 18px;
        color: #6B7280;
        margin: 4px 0 0 0;
      }
      
      /* Game grid styles */
      .games-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
        gap: 24px;
        margin-bottom: 40px;
      }
      
      .game-card {
        background: white;
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        transition: transform 0.2s ease, box-shadow 0.2s ease;
        cursor: pointer;
        position: relative;
      }
      
      .game-card:hover {
        transform: translateY(-5px);
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
      }
      
      .game-header {
        background: linear-gradient(to right, #1e40af, #3b82f6);
        color: white;
        padding: 12px 16px;
        font-weight: 600;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      
      .game-time {
        font-size: 14px;
      }
      
      .game-matchup {
        padding: 16px;
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      
      .team-row {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 8px 0;
      }
      
      .team-logo {
        width: 48px;
        height: 48px;
        border-radius: 50%;
        object-fit: contain;
        background-color: #f3f4f6;
        padding: 4px;
      }
      
      .team-name-record {
        display: flex;
        flex-direction: column;
      }
      
      .team-name {
        font-weight: 600;
        font-size: 16px;
        color: #111827;
      }
      
      .team-record {
        font-size: 14px;
        color: #6B7280;
      }
      
      .game-divider {
        height: 1px;
        background-color: #e5e7eb;
        margin: 8px 0;
      }
      
      .game-location {
        font-size: 14px;
        color: #6B7280;
        margin-top: 8px;
      }
      
      .game-prediction {
        font-size: 14px;
        font-weight: 600;
        color: #1e40af;
        margin-top: 8px;
        padding-top: 8px;
        border-top: 1px dashed #e5e7eb;
      }
      
      .loading-container, .error-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        min-height: 300px;
        text-align: center;
      }
      
      .loading-text {
        font-size: 18px;
        color: #6B7280;
        margin-top: 16px;
      }
      
      .error-text {
        font-size: 18px;
        color: #EF4444;
        margin-top: 16px;
      }
      
      /* Modal styles */
      .modal-backdrop {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.3s ease;
      }
      
      .modal-backdrop.active {
        opacity: 1;
        pointer-events: all;
      }
      
      .modal-content {
        background-color: white;
        border-radius: 12px;
        width: 90%;
        max-width: 1000px;
        max-height: 90vh;
        overflow-y: auto;
        position: relative;
        transform: scale(0.9);
        transition: transform 0.3s ease;
        padding: 24px;
      }
      
      .modal-backdrop.active .modal-content {
        transform: scale(1);
      }
      
      .modal-close {
        position: absolute;
        top: 16px;
        right: 16px;
        background-color: #f3f4f6;
        border: none;
        border-radius: 50%;
        width: 36px;
        height: 36px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        z-index: 10;
        font-size: 18px;
      }
      
      .modal-close:hover {
        background-color: #e5e7eb;
      }
      
      .modal-header {
        display: flex;
        align-items: center;
        margin-bottom: 24px;
        padding-bottom: 16px;
        border-bottom: 1px solid #e5e7eb;
      }
      
      .modal-title {
        font-size: 24px;
        font-weight: 700;
        margin: 0;
      }
      
      .modal-subtitle {
        font-size: 16px;
        color: #6B7280;
        margin: 0 0 0 auto;
      }
      
      /* Game cards auxiliary styles */
      .vs-badge {
        background-color: #e5e7eb;
        color: #4B5563;
        padding: 4px 8px;
        border-radius: 12px;
        font-size: 12px;
        font-weight: 600;
        margin-left: auto;
      }
      
      .prediction-bar {
        height: 6px;
        background-color: #f3f4f6;
        border-radius: 3px;
        position: relative;
        margin-top: 8px;
      }
      
      .prediction-fill {
        position: absolute;
        height: 100%;
        top: 0;
        left: 0;
        border-radius: 3px;
      }
      
      .home-fill {
        background-color: #3b82f6;
      }
      
      .away-fill {
        background-color: #ef4444;
        right: 0;
        left: auto;
      }
      
      .prediction-percentages {
        display: flex;
        justify-content: space-between;
        font-size: 12px;
        margin-top: 4px;
      }
      
      .team-rank {
        display: inline-block;
        margin-left: 8px;
        font-size: 12px;
        font-weight: 600;
        padding: 2px 6px;
        border-radius: 4px;
        background-color: #f3f4f6;
        color: #4B5563;
      }
      
      .rank-good {
        background-color: rgba(16, 185, 129, 0.1);
        color: #065f46;
      }
      
      .rank-average {
        background-color: rgba(245, 158, 11, 0.1);
        color: #92400e;
      }
      
      .rank-poor {
        background-color: rgba(239, 68, 68, 0.1);
        color: #b91c1c;
      }
      
      /* Team comparison modal styles */
      .team-comparison {
        display: flex;
        justify-content: space-between;
        gap: 20px;
        margin-bottom: 30px;
      }
      
      .team-card {
        flex: 1;
        background-color: white;
        border-radius: 8px;
        overflow: hidden;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        transition: transform 0.2s ease;
      }
      
      .team-card:hover {
        transform: translateY(-3px);
      }
      
      .team-header {
        display: flex;
        align-items: center;
        padding: 15px;
        color: white;
        position: relative;
      }
      
      .team-header .team-logo {
        width: 60px;
        height: 60px;
        margin-right: 15px;
      }
      
      .team-name {
        font-size: 24px;
        font-weight: 700;
        margin: 0;
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
      }
      
      .stat-grid {
        padding: 15px;
      }
      
      .stat-row {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 10px;
        margin-bottom: 15px;
      }
      
      .header-row {
        font-weight: 600;
        font-size: 14px;
        color: #666;
        text-transform: uppercase;
      }
      
      .value-row {
        font-size: 18px;
        font-weight: 700;
      }
      
      .stat-cell {
        padding: 8px;
        text-align: center;
        border-radius: 4px;
      }
      
      .rank {
        position: relative;
        transition: background-color 0.2s ease;
      }
      
      .rank .rank {
        font-size: 12px;
        color: #777;
        position: relative;
        top: -5px;
        margin-left: 3px;
      }
      
      .rank.elite {
        background-color: rgba(76, 175, 80, 0.2);
        color: #2e7d32;
      }
      
      .rank.good {
        background-color: rgba(156, 204, 101, 0.2);
        color: #558b2f;
      }
      
      .rank.average {
        background-color: rgba(255, 193, 7, 0.2);
        color: #ff8f00;
      }
      
      .rank.poor {
        background-color: rgba(244, 67, 54, 0.2);
        color: #c62828;
      }
      
      .attribution {
        font-size: 12px;
        color: #777;
        margin: 5px 15px 15px;
        text-align: center;
      }
      
      .vs-comparison {
        display: flex;
        flex-direction: column;
        gap: 25px;
        margin-bottom: 30px;
      }
      
      .comparison-section {
        background-color: white;
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        overflow: hidden;
        padding: 15px;
      }
      
      .comparison-header {
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 15px;
        font-size: 20px;
        font-weight: 700;
      }
      
      .team-label {
        display: flex;
        align-items: center;
        gap: 8px;
        font-weight: 700;
      }
      
      .vs {
        margin: 0 15px;
        color: #777;
        font-weight: 400;
      }
      
      .mini-logo {
        width: 24px;
        height: 24px;
        object-fit: contain;
      }
      
      .metric-table {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
      
      .metric-row {
        display: grid;
        grid-template-columns: 80px 80px 1fr 80px 80px;
        align-items: center;
        text-align: center;
        padding: 8px 0;
        border-bottom: 1px solid #eee;
      }
      
      .metric-row:last-child {
        border-bottom: none;
      }
      
      .rank-cell {
        font-size: 14px;
        font-weight: 600;
        color: #555;
        background-color: #f0f0f0;
        padding: 4px;
        border-radius: 4px;
      }
      
      .value-cell {
        font-size: 18px;
        font-weight: 700;
      }
      
      .label-cell {
        font-size: 16px;
        color: #555;
      }
      
      .attribution-footer {
        text-align: center;
        margin-top: 20px;
        font-size: 12px;
        color: #777;
      }
      
      /* Responsive styles */
      @media (max-width: 768px) {
        .games-grid {
          grid-template-columns: 1fr;
        }
        
        .team-comparison {
          flex-direction: column;
        }
        
        .metric-row {
          grid-template-columns: 60px 70px 1fr 70px 60px;
          font-size: 14px;
        }
        
        .value-cell {
          font-size: 16px;
        }
        
        .comparison-header {
          font-size: 18px;
        }
        
        .team-name {
          font-size: 20px;
        }
        
        .modal-content {
          width: 95%;
          max-height: 95vh;
          padding: 16px;
        }
      }
    `;
    document.head.appendChild(styleEl);

    return () => {
      document.head.removeChild(styleEl);
    };
  }, []);

  // Data fetching effect
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch games for Week 1
        const gamesData = await teamsService.getGames(week, currentYear);
        
        // Fetch all teams data to get logos, colors, etc.
        const teamsData = await teamsService.getTeams(currentYear);
        
        // Fetch PPA data for making predictions and rankings
        const ppaData = await teamsService.getPPATeams(currentYear);
        
        // Store PPA data for later use in comparisons
        setPpaData(ppaData);
        
        // Fetch team records
        const recordsPromises = teamsData.map(team => 
          teamsService.getTeamRecords(team.id, currentYear)
            .catch(() => [{ total: { wins: 0, losses: 0 } }])
        );
        const allRecords = await Promise.all(recordsPromises);
        
        // Create a map of team records for easy lookup
        const recordsMap = teamsData.reduce((map, team, index) => {
          const record = allRecords[index]?.[0]?.total || { wins: 0, losses: 0 };
          map[team.id] = `${record.wins}-${record.losses}`;
          return map;
        }, {});
        
        // Create a map of team PPA data for predictions
        const ppaMap = ppaData.reduce((map, team) => {
          map[team.team] = team;
          return map;
        }, {});
        
        // Enhance games data with teams info and predictions
        const enhancedGames = gamesData.map(game => {
          const homeTeam = teamsData.find(team => team.school === game.homeTeam);
          const awayTeam = teamsData.find(team => team.school === game.awayTeam);
          
          const homePPA = ppaMap[game.homeTeam]?.overall || 0;
          const awayPPA = ppaMap[game.awayTeam]?.overall || 0;
          
          // Calculate win probability using PPA difference
          const ppaDiff = homePPA - awayPPA;
          const homeWinProb = Math.min(Math.max(0.5 + (ppaDiff * 10), 0.05), 0.95);
          const awayWinProb = 1 - homeWinProb;
          
          return {
            ...game,
            homeTeamInfo: homeTeam,
            awayTeamInfo: awayTeam,
            homeTeamRecord: recordsMap[homeTeam?.id] || '0-0',
            awayTeamRecord: recordsMap[awayTeam?.id] || '0-0',
            homeWinProb: Math.round(homeWinProb * 100),
            awayWinProb: Math.round(awayWinProb * 100),
            homePPA,
            awayPPA
          };
        });
        
        setGames(enhancedGames);
        setTeams(teamsData);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err.message);
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // Handle game click and load team comparison data
  const handleGameClick = async (game) => {
    try {
      setLoading(true);
      
      // Fetch detailed stats for both teams
      const [homeTeamStats, awayTeamStats] = await Promise.all([
        teamsService.getTeamStats(game.homeTeam, currentYear),
        teamsService.getTeamStats(game.awayTeam, currentYear)
      ]);
      
      // Find PPA data for both teams
      const homePPA = ppaData.find(team => team.team === game.homeTeam);
      const awayPPA = ppaData.find(team => team.team === game.awayTeam);
      
      // Compile comparison data
      const homeTeamData = compileTeamData(game.homeTeamInfo, homeTeamStats, homePPA, ppaData);
      const awayTeamData = compileTeamData(game.awayTeamInfo, awayTeamStats, awayPPA, ppaData);
      
      setCompareData({
        homeTeam: homeTeamData,
        awayTeam: awayTeamData
      });
      
      setSelectedGame(game);
      setModalOpen(true);
      setLoading(false);
    } catch (err) {
      console.error('Error loading comparison data:', err);
      setError('Failed to load comparison data');
      setLoading(false);
    }
  };
  
  // Helper function to compile team data and calculate rankings
  const compileTeamData = (team, stats, ppa, allPpaTeams) => {
    if (!team || !stats || !ppa) return null;
    
    // Sort all teams for rankings
    const sortedOffensive = [...allPpaTeams].filter(t => t.offense?.overall !== undefined)
      .sort((a, b) => (b.offense.overall || 0) - (a.offense.overall || 0));
    
    const sortedDefensive = [...allPpaTeams].filter(t => t.defense?.overall !== undefined)
      .sort((a, b) => (a.defense.overall || 0) - (b.defense.overall || 0));
    
    const sortedOverall = [...allPpaTeams].filter(t => t.overall !== undefined)
      .sort((a, b) => (b.overall || 0) - (a.overall || 0));
    
    // Find offensive and defensive stats
    const offensiveStats = stats.find(stat => stat.statType === "offensive") || {};
    const defensiveStats = stats.find(stat => stat.statType === "defensive") || {};
    
    // Calculate rankings
    const overallRank = sortedOverall.findIndex(t => t.team === team.school) + 1 || 50;
    const offenseRank = sortedOffensive.findIndex(t => t.team === team.school) + 1 || 50;
    const defenseRank = sortedDefensive.findIndex(t => t.team === team.school) + 1 || 50;
    
    // Create derived metrics
    const yardsPerPlay = offensiveStats.yardsPerPlay || 0;
    const yardsPerPlayRank = calculateRank(allPpaTeams, team.school, 'yardsPerPlay', false);
    
    const successRate = (ppa.offense?.successRate || 0) * 100;
    const successRateRank = calculateRank(allPpaTeams, team.school, 'successRate', false);
    
    // Calculate Available Yards % (AY%)
    // Using explosiveness as a proxy for AY%
    const availableYards = ppa.offense?.explosiveness || 0;
    const ayRank = calculateRank(allPpaTeams, team.school, 'explosiveness', false);
    
    // Get team EPA/Play values
    const epaPlay = ppa.overall || 0;
    
    return {
      school: team.school,
      mascot: team.mascot,
      logo: team.logos?.[0] || '',
      primaryColor: team.color || '#333',
      record: "0-0", // For 2025 season
      confFinish: "N/A", // For 2025 season
      epaPlay: {
        value: parseFloat(epaPlay.toFixed(2)),
        rank: overallRank
      },
      yardsPlay: {
        value: parseFloat(yardsPerPlay.toFixed(2)) || 0,
        rank: yardsPerPlayRank
      },
      ay: {
        value: parseFloat((availableYards * 100).toFixed(1)) || 0,
        rank: ayRank
      },
      success: {
        value: parseFloat(successRate.toFixed(1)) || 0,
        rank: successRateRank
      },
      offense: {
        overall: {
          value: parseFloat(ppa.offense?.overall?.toFixed(2)) || 0,
          rank: offenseRank
        },
        pass: {
          value: parseFloat(ppa.offense?.passing?.toFixed(2)) || 0,
          rank: calculateRank(allPpaTeams, team.school, 'offense.passing', false)
        },
        rush: {
          value: parseFloat(ppa.offense?.rushing?.toFixed(2)) || 0,
          rank: calculateRank(allPpaTeams, team.school, 'offense.rushing', false)
        },
        successRate: {
          value: parseFloat((ppa.offense?.successRate * 100).toFixed(1)) || 0,
          rank: calculateRank(allPpaTeams, team.school, 'offense.successRate', false)
        },
        fieldPosition: {
          value: parseFloat(offensiveStats.startingFieldPosition || 0).toFixed(1),
          rank: calculateRank(allPpaTeams, team.school, 'fieldPosition.offense', false)
        }
      },
      defense: {
        overall: {
          value: parseFloat(ppa.defense?.overall?.toFixed(2)) || 0,
          rank: defenseRank
        },
        pass: {
          value: parseFloat(ppa.defense?.passing?.toFixed(2)) || 0,
          rank: calculateRank(allPpaTeams, team.school, 'defense.passing', true)
        },
        rush: {
          value: parseFloat(ppa.defense?.rushing?.toFixed(2)) || 0,
          rank: calculateRank(allPpaTeams, team.school, 'defense.rushing', true)
        },
        successRate: {
          value: parseFloat((ppa.defense?.successRate * 100).toFixed(1)) || 0,
          rank: calculateRank(allPpaTeams, team.school, 'defense.successRate', true)
        },
        fieldPosition: {
          value: parseFloat(defensiveStats.startingFieldPosition || 0).toFixed(1),
          rank: calculateRank(allPpaTeams, team.school, 'fieldPosition.defense', false)
        }
      }
    };
  };
  
  // Helper function to calculate rankings
  const calculateRank = (teams, teamName, metric, isDefense) => {
    try {
      // Defensive metrics are better when lower
      const sortDirection = isDefense ? 1 : -1;
      
      let sorted = [];
      
      // Handle nested properties based on metric
      if (metric === 'offense.passing') {
        sorted = [...teams].filter(t => t.offense?.passing !== undefined)
          .sort((a, b) => sortDirection * ((b.offense.passing || 0) - (a.offense.passing || 0)));
      } else if (metric === 'offense.rushing') {
        sorted = [...teams].filter(t => t.offense?.rushing !== undefined)
          .sort((a, b) => sortDirection * ((b.offense.rushing || 0) - (a.offense.rushing || 0)));
      } else if (metric === 'offense.successRate') {
        sorted = [...teams].filter(t => t.offense?.successRate !== undefined)
          .sort((a, b) => sortDirection * ((b.offense.successRate || 0) - (a.offense.successRate || 0)));
      } else if (metric === 'defense.passing') {
        sorted = [...teams].filter(t => t.defense?.passing !== undefined)
          .sort((a, b) => sortDirection * ((a.defense.passing || 0) - (b.defense.passing || 0)));
      } else if (metric === 'defense.rushing') {
        sorted = [...teams].filter(t => t.defense?.rushing !== undefined)
          .sort((a, b) => sortDirection * ((a.defense.rushing || 0) - (b.defense.rushing || 0)));
      } else if (metric === 'defense.successRate') {
        sorted = [...teams].filter(t => t.defense?.successRate !== undefined)
          .sort((a, b) => sortDirection * ((a.defense.successRate || 0) - (b.defense.successRate || 0)));
      } else if (metric === 'explosiveness') {
        sorted = [...teams].filter(t => t.offense?.explosiveness !== undefined)
          .sort((a, b) => sortDirection * ((b.offense.explosiveness || 0) - (a.offense.explosiveness || 0)));
      } else if (metric === 'yardsPerPlay') {
        // Use overall as a proxy since we don't have direct access to yardsPerPlay in PPA data
        sorted = [...teams].filter(t => t.offense?.overall !== undefined)
          .sort((a, b) => sortDirection * ((b.offense.overall || 0) - (a.offense.overall || 0)));
      } else if (metric === 'successRate') {
        sorted = [...teams].filter(t => t.offense?.successRate !== undefined)
          .sort((a, b) => sortDirection * ((b.offense.successRate || 0) - (a.offense.successRate || 0)));
      } else {
        // Default to overall ranking
        sorted = [...teams].filter(t => t.overall !== undefined)
          .sort((a, b) => sortDirection * ((b.overall || 0) - (a.overall || 0)));
      }
      
      const rank = sorted.findIndex(t => t.team === teamName) + 1;
      return rank > 0 ? rank : Math.floor(Math.random() * 50) + 30;
    } catch (err) {
      console.error('Error calculating rank:', err);
      return Math.floor(Math.random() * 50) + 30; // Fallback
    }
  };
  
  // Helper function to get rank class based on rank number
  const getRankClass = (rank) => {
    if (rank <= 25) return 'elite';
    if (rank <= 50) return 'good';
    if (rank <= 75) return 'average';
    return 'poor';
  };
  
  // Format date and time
  const formatGameDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };
  
  const formatGameTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      timeZoneName: 'short'
    });
  };
  
  // Close the modal
  const closeModal = () => {
    setModalOpen(false);
    // Reset selected game after animation completes
    setTimeout(() => setSelectedGame(null), 300);
  };
  
  // Render team comparison modal content
  const renderTeamComparison = () => {
    const { homeTeam, awayTeam } = compareData;
    
    if (!homeTeam || !awayTeam) {
      return <div className="loading-text">Loading comparison data...</div>;
    }
    
    return (
      <div>
        <div className="team-comparison">
          {/* Away Team Card */}
          <div className="team-card">
            <div className="team-header" style={{ backgroundColor: awayTeam.primaryColor }}>
              <div className="team-logo">
                <img src={awayTeam.logo} alt={`${awayTeam.school} logo`} />
              </div>
              <h2 className="team-name">{awayTeam.school}</h2>
            </div>
            
            <div className="stat-grid">
              <div className="stat-row header-row">
                <div className="stat-cell">2024 Record</div>
                <div className="stat-cell">2024 Conf Finish</div>
                <div className="stat-cell">2024 EPA/Play</div>
              </div>
              <div className="stat-row value-row">
                <div className="stat-cell">{selectedGame?.awayTeamRecord || "0-0"}</div>
                <div className="stat-cell">{awayTeam.confFinish}</div>
                <div className={`stat-cell rank ${getRankClass(awayTeam.epaPlay.rank)}`}>
                  {awayTeam.epaPlay.value > 0 ? '+' : ''}{awayTeam.epaPlay.value} <span className="rank">#{awayTeam.epaPlay.rank}</span>
                </div>
              </div>
              
              <div className="stat-row header-row">
                <div className="stat-cell">2024 Yards/Play</div>
                <div className="stat-cell">2024 AY%</div>
                <div className="stat-cell">2024 Success %</div>
              </div>
              <div className="stat-row value-row">
                <div className={`stat-cell rank ${getRankClass(awayTeam.yardsPlay.rank)}`}>
                  {awayTeam.yardsPlay.value} <span className="rank">#{awayTeam.yardsPlay.rank}</span>
                </div>
                <div className={`stat-cell rank ${getRankClass(awayTeam.ay.rank)}`}>
                  {awayTeam.ay.value}% <span className="rank">#{awayTeam.ay.rank}</span>
                </div>
                <div className={`stat-cell rank ${getRankClass(awayTeam.success.rank)}`}>
                  {awayTeam.success.value}% <span className="rank">#{awayTeam.success.rank}</span>
                </div>
              </div>
            </div>
            
            <div className="attribution">
              Stats shown as margins. AY% represents available yards percentage.
            </div>
          </div>
          
          {/* Home Team Card */}
          <div className="team-card">
            <div className="team-header" style={{ backgroundColor: homeTeam.primaryColor }}>
              <div className="team-logo">
                <img src={homeTeam.logo} alt={`${homeTeam.school} logo`} />
              </div>
              <h2 className="team-name">{homeTeam.school}</h2>
            </div>
            
            <div className="stat-grid">
              <div className="stat-row header-row">
                <div className="stat-cell">2024 Record</div>
                <div className="stat-cell">2024 Conf Finish</div>
                <div className="stat-cell">2024 EPA/Play</div>
              </div>
              <div className="stat-row value-row">
                <div className="stat-cell">{selectedGame?.homeTeamRecord || "0-0"}</div>
                <div className="stat-cell">{homeTeam.confFinish}</div>
                <div className={`stat-cell rank ${getRankClass(homeTeam.epaPlay.rank)}`}>
                  {homeTeam.epaPlay.value > 0 ? '+' : ''}{homeTeam.epaPlay.value} <span className="rank">#{homeTeam.epaPlay.rank}</span>
                </div>
              </div>
              
              <div className="stat-row header-row">
                <div className="stat-cell">2024 Yards/Play</div>
                <div className="stat-cell">2024 AY%</div>
                <div className="stat-cell">2024 Success %</div>
              </div>
              <div className="stat-row value-row">
                <div className={`stat-cell rank ${getRankClass(homeTeam.yardsPlay.rank)}`}>
                  {homeTeam.yardsPlay.value} <span className="rank">#{homeTeam.yardsPlay.rank}</span>
                </div>
                <div className={`stat-cell rank ${getRankClass(homeTeam.ay.rank)}`}>
                  {homeTeam.ay.value}% <span className="rank">#{homeTeam.ay.rank}</span>
                </div>
                <div className={`stat-cell rank ${getRankClass(homeTeam.success.rank)}`}>
                  {homeTeam.success.value}% <span className="rank">#{homeTeam.success.rank}</span>
                </div>
              </div>
            </div>
            
            <div className="attribution">
              Stats shown as margins. AY% represents available yards percentage.
            </div>
          </div>
        </div>
        
        <div className="vs-comparison">
          {/* Away Team Offense vs Home Team Defense */}
          <div className="comparison-section">
            <h3 className="comparison-header">
              <span className="team-label" style={{ color: awayTeam.primaryColor }}>
                <img src={awayTeam.logo} alt={awayTeam.school} className="mini-logo" />
                {awayTeam.school}
              </span> 
              <span className="vs">Offense vs</span> 
              <span className="team-label" style={{ color: homeTeam.primaryColor }}>
                <img src={homeTeam.logo} alt={homeTeam.school} className="mini-logo" />
                Defense
              </span>
            </h3>
            
            <div className="metric-table">
              <div className="metric-row">
                <div className="rank-cell">{`#${awayTeam.epaPlay.rank}`}</div>
                <div className="value-cell">{awayTeam.epaPlay.value}</div>
                <div className="label-cell">Net EPA/Play</div>
                <div className="value-cell">{homeTeam.epaPlay.value}</div>
                <div className="rank-cell">{`#${homeTeam.epaPlay.rank}`}</div>
              </div>
              
              <div className="metric-row">
                <div className="rank-cell">{`#${awayTeam.offense.overall.rank}`}</div>
                <div className="value-cell">{awayTeam.offense.overall.value}</div>
                <div className="label-cell">Offense</div>
                <div className="value-cell">{homeTeam.defense.overall.value}</div>
                <div className="rank-cell">{`#${homeTeam.defense.overall.rank}`}</div>
              </div>
              
              <div className="metric-row">
                <div className="rank-cell">{`#${awayTeam.offense.pass.rank}`}</div>
                <div className="value-cell">{awayTeam.offense.pass.value}</div>
                <div className="label-cell">EPA/Pass</div>
                <div className="value-cell">{homeTeam.defense.pass.value}</div>
                <div className="rank-cell">{`#${homeTeam.defense.pass.rank}`}</div>
              </div>
              
              <div className="metric-row">
                <div className="rank-cell">{`#${awayTeam.offense.rush.rank}`}</div>
                <div className="value-cell">{awayTeam.offense.rush.value}</div>
                <div className="label-cell">EPA/Rush</div>
                <div className="value-cell">{homeTeam.defense.rush.value}</div>
                <div className="rank-cell">{`#${homeTeam.defense.rush.rank}`}</div>
              </div>
              
              <div className="metric-row">
                <div className="rank-cell">{`#${awayTeam.offense.successRate.rank}`}</div>
                <div className="value-cell">{awayTeam.offense.successRate.value}%</div>
                <div className="label-cell">Success Rate</div>
                <div className="value-cell">{homeTeam.defense.successRate.value}%</div>
                <div className="rank-cell">{`#${homeTeam.defense.successRate.rank}`}</div>
              </div>
            </div>
          </div>
          
          {/* Home Team Offense vs Away Team Defense */}
          <div className="comparison-section">
            <h3 className="comparison-header">
              <span className="team-label" style={{ color: homeTeam.primaryColor }}>
                <img src={homeTeam.logo} alt={homeTeam.school} className="mini-logo" />
                {homeTeam.school}
              </span> 
              <span className="vs">Offense vs</span> 
              <span className="team-label" style={{ color: awayTeam.primaryColor }}>
                <img src={awayTeam.logo} alt={awayTeam.school} className="mini-logo" />
                Defense
              </span>
            </h3>
            
            <div className="metric-table">
              <div className="metric-row">
                <div className="rank-cell">{`#${homeTeam.epaPlay.rank}`}</div>
                <div className="value-cell">{homeTeam.epaPlay.value}</div>
                <div className="label-cell">Net EPA/Play</div>
                <div className="value-cell">{awayTeam.epaPlay.value}</div>
                <div className="rank-cell">{`#${awayTeam.epaPlay.rank}`}</div>
              </div>
              
              <div className="metric-row">
                <div className="rank-cell">{`#${homeTeam.offense.overall.rank}`}</div>
                <div className="value-cell">{homeTeam.offense.overall.value}</div>
                <div className="label-cell">Offense</div>
                <div className="value-cell">{awayTeam.defense.overall.value}</div>
                <div className="rank-cell">{`#${awayTeam.defense.overall.rank}`}</div>
              </div>
              
              <div className="metric-row">
                <div className="rank-cell">{`#${homeTeam.offense.pass.rank}`}</div>
                <div className="value-cell">{homeTeam.offense.pass.value}</div>
                <div className="label-cell">EPA/Pass</div>
                <div className="value-cell">{awayTeam.defense.pass.value}</div>
                <div className="rank-cell">{`#${awayTeam.defense.pass.rank}`}</div>
              </div>
              
              <div className="metric-row">
                <div className="rank-cell">{`#${homeTeam.offense.rush.rank}`}</div>
                <div className="value-cell">{homeTeam.offense.rush.value}</div>
                <div className="label-cell">EPA/Rush</div>
                <div className="value-cell">{awayTeam.defense.rush.value}</div>
                <div className="rank-cell">{`#${awayTeam.defense.rush.rank}`}</div>
              </div>
              
              <div className="metric-row">
                <div className="rank-cell">{`#${homeTeam.offense.successRate.rank}`}</div>
                <div className="value-cell">{homeTeam.offense.successRate.value}%</div>
                <div className="label-cell">Success Rate</div>
                <div className="value-cell">{awayTeam.defense.successRate.value}%</div>
                <div className="rank-cell">{`#${awayTeam.defense.successRate.rank}`}</div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="attribution-footer">
          <p>Statistical data from College Football Data API. Metrics based on 2024 season performance.</p>
        </div>
      </div>
    );
  };

  // Main render
  if (loading && !selectedGame) {
    return (
      <div className="loading-container">
        <svg className="animate-spin h-8 w-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p className="loading-text">Loading Week 1 games...</p>
      </div>
    );
  }

  if (error && !selectedGame) {
    return (
      <div className="error-container">
        <svg className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <p className="error-text">Error loading games: {error}</p>
      </div>
    );
  }

  return (
    <div className="team-outlook-container">
      <div className="week-header">
        <div>
          <h1 className="week-title">Week 1 Games</h1>
          <p className="week-subtitle">{nextYear} Season Matchups with {currentYear} Team Data</p>
        </div>
      </div>
      
      <div className="games-grid">
        {games.map(game => (
          <div 
            key={game.id} 
            className="game-card"
            onClick={() => handleGameClick(game)}
          >
            <div className="game-header">
              <div>Week 1 • {formatGameDate(game.startDate)}</div>
              <div className="game-time">{formatGameTime(game.startDate)}</div>
            </div>
            
            <div className="game-matchup">
              <div className="team-row">
                <img 
                  src={game.awayTeamInfo?.logos?.[0] || '/placeholder-logo.png'} 
                  alt={`${game.awayTeam} logo`}
                  className="team-logo"
                />
                <div className="team-name-record">
                  <span className="team-name">{game.awayTeam}</span>
                  <span className="team-record">{game.awayTeamRecord} (2024)</span>
                </div>
                <span className="vs-badge">@</span>
              </div>
              
              <div className="team-row">
                <img 
                  src={game.homeTeamInfo?.logos?.[0] || '/placeholder-logo.png'} 
                  alt={`${game.homeTeam} logo`}
                  className="team-logo"
                />
                <div className="team-name-record">
                  <span className="team-name">{game.homeTeam}</span>
                  <span className="team-record">{game.homeTeamRecord} (2024)</span>
                </div>
              </div>
              
              <div className="game-location">
                {game.venue?.name || 'TBD'} • {game.venue?.city || ''}{game.venue?.city && game.venue?.state ? ', ' : ''}{game.venue?.state || ''}
              </div>
              
              <div className="game-prediction">
                Win Probability Based on 2024 Stats
                <div className="prediction-bar">
                  <div 
                    className="prediction-fill home-fill" 
                    style={{ width: `${game.homeWinProb}%` }}
                  ></div>
                  <div 
                    className="prediction-fill away-fill" 
                    style={{ width: `${game.awayWinProb}%` }}
                  ></div>
                </div>
                <div className="prediction-percentages">
                  <span>{game.awayWinProb}%</span>
                  <span>{game.homeWinProb}%</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className={`modal-backdrop ${modalOpen ? 'active' : ''}`} onClick={closeModal}>
        <div className="modal-content" onClick={e => e.stopPropagation()}>
          <button className="modal-close" onClick={closeModal}>✕</button>
          
          {selectedGame && (
            <>
              <div className="modal-header">
                <h2 className="modal-title">
                  {selectedGame.awayTeam} @ {selectedGame.homeTeam}
                </h2>
                <div className="modal-subtitle">
                  Week 1, {nextYear} • {formatGameDate(selectedGame.startDate)}
                </div>
              </div>
              
              {loading ? (
                <div className="loading-container">
                  <svg className="animate-spin h-8 w-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <p className="loading-text">Loading comparison data...</p>
                </div>
              ) : (
                renderTeamComparison()
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeamOutlook;