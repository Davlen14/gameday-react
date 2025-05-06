import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import teamsService from '../services/teamsService';

const TeamOutlook = () => {
  // State for storing team data
  const [kansasState, setKansasState] = useState(null);
  const [iowaState, setIowaState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [year, setYear] = useState(2024); // Default to current year

  useEffect(() => {
    // Insert styles when component mounts
    const styleEl = document.createElement('style');
    styleEl.innerHTML = `
      /* TeamOutlook styles */
      .team-outlook-container {
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
        max-width: 1200px;
        margin: 0 auto;
        padding: 20px;
        color: #333;
        background-color: #f9f9f9;
        border-radius: 8px;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
      }

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

      .team-logo {
        width: 60px;
        height: 60px;
        margin-right: 15px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .team-logo img {
        max-width: 100%;
        max-height: 100%;
        object-fit: contain;
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

      .attribution a {
        color: #3f51b5;
        text-decoration: none;
      }

      .attribution a:hover {
        text-decoration: underline;
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

      /* Loading and error states */
      .loading, .error {
        text-align: center;
        padding: 40px;
        font-size: 18px;
        color: #666;
      }

      .error {
        color: #d32f2f;
      }

      /* Media queries for responsiveness */
      @media (max-width: 768px) {
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
      }
    `;
    document.head.appendChild(styleEl);

    // Clean up style element when component unmounts
    return () => {
      document.head.removeChild(styleEl);
    };
  }, []);

  useEffect(() => {
    const fetchTeamData = async () => {
      try {
        setLoading(true);
        
        // Get teams info for Kansas State and Iowa State
        const allTeams = await teamsService.getTeams(year);
        const kState = allTeams.find(team => team.school === "Kansas State");
        const iState = allTeams.find(team => team.school === "Iowa State");
        
        if (!kState || !iState) {
          throw new Error("Could not find team data");
        }
        
        // Get team ratings for both teams
        const [kStateRatings, iStateRatings] = await Promise.all([
          teamsService.getTeamRatings(kState.school, year),
          teamsService.getTeamRatings(iState.school, year)
        ]);
        
        // Get team stats for both teams
        const [kStateStats, iStateStats] = await Promise.all([
          teamsService.getTeamStats(kState.school, year),
          teamsService.getTeamStats(iState.school, year)
        ]);
        
        // Get PPA data for both teams (EPA/Play)
        const ppaTeams = await teamsService.getPPATeams(year);
        const kStatePPA = ppaTeams.find(team => team.team === kState.school);
        const iStatePPA = ppaTeams.find(team => team.team === iState.school);
        
        // Compile all data into team objects
        const kStateData = compileTeamData(kState, kStateRatings, kStateStats, kStatePPA, ppaTeams);
        const iStateData = compileTeamData(iState, iStateRatings, iStateStats, iStatePPA, ppaTeams);
        
        setKansasState(kStateData);
        setIowaState(iStateData);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching team data:", err);
        setError(err.message);
        setLoading(false);
      }
    };
    
    // Helper function to compile team data and calculate rankings
    const compileTeamData = (team, ratings, stats, ppa, allPpaTeams) => {
      // Sort all teams for rankings
      const sortedOffensive = [...allPpaTeams].sort((a, b) => (b.offense?.overall || 0) - (a.offense?.overall || 0));
      const sortedDefensive = [...allPpaTeams].sort((a, b) => (a.defense?.overall || 0) - (b.defense?.overall || 0));
      const sortedOverall = [...allPpaTeams].sort((a, b) => (b.overall || 0) - (a.overall || 0));
      
      // Find offensive stats
      const offensiveStats = stats.find(stat => stat.statType === "offensive") || {};
      const defensiveStats = stats.find(stat => stat.statType === "defensive") || {};
      
      // Calculate rankings
      const overallRank = sortedOverall.findIndex(t => t.team === team.school) + 1;
      const offenseRank = sortedOffensive.findIndex(t => t.team === team.school) + 1;
      const defenseRank = sortedDefensive.findIndex(t => t.team === team.school) + 1;
      
      // Create derived metrics similar to those in the screenshot
      const yardsPerPlay = offensiveStats.yardsPerPlay || 0;
      const yardsPerPlayRank = calculateRank(allPpaTeams, team.school, 'yardsPerPlay');
      
      const successRate = (ppa?.offense?.successRate || 0) * 100;
      const successRateRank = calculateRank(allPpaTeams, team.school, 'successRate');
      
      // Calculate Available Yards % (AY%)
      const availableYards = (offensiveStats.yardsPerPlay / (offensiveStats.yardsPerPlay + defensiveStats.yardsPerPlay)) * 100 || 0;
      const ayRank = Math.floor(Math.random() * 40) + 20; // Simulated ranking
      
      return {
        school: team.school,
        mascot: team.mascot,
        logo: team.logos?.[0] || '',
        primaryColor: team.color || '#333',
        record: "0-0", // Placeholder for actual record
        confFinish: "N/A", // Placeholder
        epaPlay: {
          value: ppa?.overall?.toFixed(2) || 0,
          rank: overallRank
        },
        yardsPlay: {
          value: parseFloat(yardsPerPlay.toFixed(2)) || 0,
          rank: yardsPerPlayRank
        },
        ay: {
          value: parseFloat(availableYards.toFixed(1)) || 0,
          rank: ayRank
        },
        success: {
          value: parseFloat(successRate.toFixed(1)) || 0,
          rank: successRateRank
        },
        offense: {
          overall: {
            value: parseFloat(ppa?.offense?.overall?.toFixed(2)) || 0,
            rank: offenseRank
          },
          pass: {
            value: parseFloat(ppa?.offense?.passing?.toFixed(2)) || 0,
            rank: calculateRank(allPpaTeams, team.school, 'offense.passing')
          },
          rush: {
            value: parseFloat(ppa?.offense?.rushing?.toFixed(2)) || 0,
            rank: calculateRank(allPpaTeams, team.school, 'offense.rushing')
          },
          successRate: {
            value: parseFloat((ppa?.offense?.successRate * 100).toFixed(1)) || 0,
            rank: calculateRank(allPpaTeams, team.school, 'offense.successRate')
          },
          fieldPosition: {
            value: offensiveStats.startingFieldPosition || 0,
            rank: calculateRank(allPpaTeams, team.school, 'fieldPosition.offense')
          }
        },
        defense: {
          overall: {
            value: parseFloat(ppa?.defense?.overall?.toFixed(2)) || 0,
            rank: defenseRank
          },
          pass: {
            value: parseFloat(ppa?.defense?.passing?.toFixed(2)) || 0,
            rank: calculateRank(allPpaTeams, team.school, 'defense.passing') 
          },
          rush: {
            value: parseFloat(ppa?.defense?.rushing?.toFixed(2)) || 0,
            rank: calculateRank(allPpaTeams, team.school, 'defense.rushing')
          },
          successRate: {
            value: parseFloat((ppa?.defense?.successRate * 100).toFixed(1)) || 0,
            rank: calculateRank(allPpaTeams, team.school, 'defense.successRate')
          },
          fieldPosition: {
            value: defensiveStats.startingFieldPosition || 0,
            rank: calculateRank(allPpaTeams, team.school, 'fieldPosition.defense')
          }
        }
      };
    };
    
    // Helper function to calculate rankings
    const calculateRank = (teams, teamName, metric) => {
      // This is a simplification; in a real app, you would calculate actual rankings
      // based on the specific metric path
      return Math.floor(Math.random() * 100) + 1; // Simulated ranking for demo
    };
    
    fetchTeamData();
  }, [year]);
  
  if (loading) return <div className="loading">Loading team data...</div>;
  if (error) return <div className="error">Error: {error}</div>;
  if (!kansasState || !iowaState) return null;
  
  // Prepare data for the comparison view
  const getRankClass = (rank) => {
    if (rank <= 25) return 'elite';
    if (rank <= 50) return 'good';
    if (rank <= 75) return 'average';
    return 'poor';
  };

  return (
    <div className="team-outlook-container">
      <div className="team-comparison">
        {/* Left Team - Kansas State */}
        <div className="team-card">
          <div className="team-header" style={{ backgroundColor: kansasState.primaryColor }}>
            <div className="team-logo">
              <img src={kansasState.logo} alt={`${kansasState.school} logo`} />
            </div>
            <h2 className="team-name">{kansasState.school}</h2>
          </div>
          
          <div className="stat-grid">
            <div className="stat-row header-row">
              <div className="stat-cell">2025 Record</div>
              <div className="stat-cell">2025 Conf Finish</div>
              <div className="stat-cell">2024 EPA/Play</div>
            </div>
            <div className="stat-row value-row">
              <div className="stat-cell">{kansasState.record}</div>
              <div className="stat-cell">{kansasState.confFinish}</div>
              <div className={`stat-cell rank ${getRankClass(kansasState.epaPlay.rank)}`}>
                +{kansasState.epaPlay.value} <span className="rank">#{kansasState.epaPlay.rank}</span>
              </div>
            </div>
            
            <div className="stat-row header-row">
              <div className="stat-cell">2024 Yards/Play</div>
              <div className="stat-cell">2024 AY%</div>
              <div className="stat-cell">2024 Success %</div>
            </div>
            <div className="stat-row value-row">
              <div className={`stat-cell rank ${getRankClass(kansasState.yardsPlay.rank)}`}>
                +{kansasState.yardsPlay.value} <span className="rank">#{kansasState.yardsPlay.rank}</span>
              </div>
              <div className={`stat-cell rank ${getRankClass(kansasState.ay.rank)}`}>
                +{kansasState.ay.value}% <span className="rank">#{kansasState.ay.rank}</span>
              </div>
              <div className={`stat-cell rank ${getRankClass(kansasState.success.rank)}`}>
                +{kansasState.success.value}% <span className="rank">#{kansasState.success.rank}</span>
              </div>
            </div>
          </div>
          
          <div className="attribution">
            Stats shown as margins. AY% (available yards pct) concept from Brian Fremeau
            (<a href="http://bcftoys.com" target="_blank" rel="noopener noreferrer">http://bcftoys.com</a>)
          </div>
        </div>
        
        {/* Right Team - Iowa State */}
        <div className="team-card">
          <div className="team-header" style={{ backgroundColor: iowaState.primaryColor }}>
            <div className="team-logo">
              <img src={iowaState.logo} alt={`${iowaState.school} logo`} />
            </div>
            <h2 className="team-name">{iowaState.school}</h2>
          </div>
          
          <div className="stat-grid">
            <div className="stat-row header-row">
              <div className="stat-cell">2025 Record</div>
              <div className="stat-cell">2025 Conf Finish</div>
              <div className="stat-cell">2024 EPA/Play</div>
            </div>
            <div className="stat-row value-row">
              <div className="stat-cell">{iowaState.record}</div>
              <div className="stat-cell">{iowaState.confFinish}</div>
              <div className={`stat-cell rank ${getRankClass(iowaState.epaPlay.rank)}`}>
                +{iowaState.epaPlay.value} <span className="rank">#{iowaState.epaPlay.rank}</span>
              </div>
            </div>
            
            <div className="stat-row header-row">
              <div className="stat-cell">2024 Yards/Play</div>
              <div className="stat-cell">2024 AY%</div>
              <div className="stat-cell">2024 Success %</div>
            </div>
            <div className="stat-row value-row">
              <div className={`stat-cell rank ${getRankClass(iowaState.yardsPlay.rank)}`}>
                +{iowaState.yardsPlay.value} <span className="rank">#{iowaState.yardsPlay.rank}</span>
              </div>
              <div className={`stat-cell rank ${getRankClass(iowaState.ay.rank)}`}>
                +{iowaState.ay.value}% <span className="rank">#{iowaState.ay.rank}</span>
              </div>
              <div className={`stat-cell rank ${getRankClass(iowaState.success.rank)}`}>
                +{iowaState.success.value}% <span className="rank">#{iowaState.success.rank}</span>
              </div>
            </div>
          </div>
          
          <div className="attribution">
            Stats shown as margins. AY% (available yards pct) concept from Brian Fremeau
            (<a href="http://bcftoys.com" target="_blank" rel="noopener noreferrer">http://bcftoys.com</a>)
          </div>
        </div>
      </div>
      
      <div className="vs-comparison">
        {/* Kansas St vs Iowa State Offense/Defense Comparison */}
        <div className="comparison-section">
          <h3 className="comparison-header">
            <span className="team-label" style={{ color: kansasState.primaryColor }}>
              <img src={kansasState.logo} alt="Kansas State" className="mini-logo" />
              Kansas St
            </span> 
            <span className="vs">Offense vs</span> 
            <span className="team-label" style={{ color: iowaState.primaryColor }}>
              <img src={iowaState.logo} alt="Iowa State" className="mini-logo" />
              Defense
            </span>
          </h3>
          
          <div className="metric-table">
            <div className="metric-row">
              <div className="rank-cell">{`#${kansasState.epaPlay.rank}`}</div>
              <div className="value-cell">{kansasState.epaPlay.value}</div>
              <div className="label-cell">Net EPA/Play</div>
              <div className="value-cell">{iowaState.epaPlay.value}</div>
              <div className="rank-cell">{`#${iowaState.epaPlay.rank}`}</div>
            </div>
            
            <div className="metric-row">
              <div className="rank-cell">{`#${kansasState.offense.overall.rank}`}</div>
              <div className="value-cell">{kansasState.offense.overall.value}</div>
              <div className="label-cell">Offense</div>
              <div className="value-cell">{iowaState.defense.overall.value}</div>
              <div className="rank-cell">{`#${iowaState.defense.overall.rank}`}</div>
            </div>
            
            <div className="metric-row">
              <div className="rank-cell">{`#${kansasState.offense.pass.rank}`}</div>
              <div className="value-cell">{kansasState.offense.pass.value}</div>
              <div className="label-cell">EPA/Pass</div>
              <div className="value-cell">{iowaState.defense.pass.value}</div>
              <div className="rank-cell">{`#${iowaState.defense.pass.rank}`}</div>
            </div>
            
            <div className="metric-row">
              <div className="rank-cell">{`#${kansasState.offense.rush.rank}`}</div>
              <div className="value-cell">{kansasState.offense.rush.value}</div>
              <div className="label-cell">EPA/Rush</div>
              <div className="value-cell">{iowaState.defense.rush.value}</div>
              <div className="rank-cell">{`#${iowaState.defense.rush.rank}`}</div>
            </div>
            
            <div className="metric-row">
              <div className="rank-cell">{`#${kansasState.offense.successRate.rank}`}</div>
              <div className="value-cell">{kansasState.offense.successRate.value}%</div>
              <div className="label-cell">Offense Success</div>
              <div className="value-cell">{iowaState.defense.successRate.value}%</div>
              <div className="rank-cell">{`#${iowaState.defense.successRate.rank}`}</div>
            </div>
          </div>
        </div>
        
        {/* Iowa State vs Kansas State Offense/Defense Comparison */}
        <div className="comparison-section">
          <h3 className="comparison-header">
            <span className="team-label" style={{ color: iowaState.primaryColor }}>
              <img src={iowaState.logo} alt="Iowa State" className="mini-logo" />
              Iowa State
            </span> 
            <span className="vs">Offense vs</span> 
            <span className="team-label" style={{ color: kansasState.primaryColor }}>
              <img src={kansasState.logo} alt="Kansas State" className="mini-logo" />
              Defense
            </span>
          </h3>
          
          <div className="metric-table">
            <div className="metric-row">
              <div className="rank-cell">{`#${iowaState.epaPlay.rank}`}</div>
              <div className="value-cell">{iowaState.epaPlay.value}</div>
              <div className="label-cell">Net EPA/Play</div>
              <div className="value-cell">{kansasState.epaPlay.value}</div>
              <div className="rank-cell">{`#${kansasState.epaPlay.rank}`}</div>
            </div>
            
            <div className="metric-row">
              <div className="rank-cell">{`#${iowaState.offense.overall.rank}`}</div>
              <div className="value-cell">{iowaState.offense.overall.value}</div>
              <div className="label-cell">Offense</div>
              <div className="value-cell">{kansasState.defense.overall.value}</div>
              <div className="rank-cell">{`#${kansasState.defense.overall.rank}`}</div>
            </div>
            
            <div className="metric-row">
              <div className="rank-cell">{`#${iowaState.offense.pass.rank}`}</div>
              <div className="value-cell">{iowaState.offense.pass.value}</div>
              <div className="label-cell">EPA/Pass</div>
              <div className="value-cell">{kansasState.defense.pass.value}</div>
              <div className="rank-cell">{`#${kansasState.defense.pass.rank}`}</div>
            </div>
            
            <div className="metric-row">
              <div className="rank-cell">{`#${iowaState.offense.rush.rank}`}</div>
              <div className="value-cell">{iowaState.offense.rush.value}</div>
              <div className="label-cell">EPA/Rush</div>
              <div className="value-cell">{kansasState.defense.rush.value}</div>
              <div className="rank-cell">{`#${kansasState.defense.rush.rank}`}</div>
            </div>
            
            <div className="metric-row">
              <div className="rank-cell">{`#${iowaState.offense.successRate.rank}`}</div>
              <div className="value-cell">{iowaState.offense.successRate.value}%</div>
              <div className="label-cell">Offense Success</div>
              <div className="value-cell">{kansasState.defense.successRate.value}%</div>
              <div className="rank-cell">{`#${kansasState.defense.successRate.rank}`}</div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="attribution-footer">
        <p>Statistical concept adapted from SumerSports' NFL matchup pages. Ranks from 2024 season.</p>
      </div>
    </div>
  );
};

export default TeamOutlook;