import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { FaTrophy, FaMedal, FaRunning, FaRegHandPointUp, FaFootballBall, FaHandsReceiving } from 'react-icons/fa';

const TopPerformers = ({
  game,
  topPerformersPassing,
  topPerformersRushing,
  topPerformersReceiving,
  getTeamAbbreviation,
  getTeamColor,
  getTeamLogo,
}) => {


  // Utility function to extract top performers
  const extractTopPerformers = (category, statTypes) => {
    if (!category) return [];
    
    // Get all athletes with their stats
    const allAthletes = statTypes.flatMap(statType => {
      const matchingStat = category.types.find(type => type.name === statType);
      return matchingStat ? matchingStat.athletes.map(athlete => ({
        ...athlete,
        statType,
        statValue: parseFloat(athlete.stat)
      })) : [];
    });
    
    // First get top 2 performers by yards
    const topPerformers = allAthletes
      .filter(athlete => athlete.statType === "YDS")
      .sort((a, b) => b.statValue - a.statValue)
      .slice(0, 2);
    
    // Then add any athletes with over 75 yards who aren't already included
    const additionalPerformers = allAthletes
      .filter(athlete => 
        athlete.statType === "YDS" && 
        athlete.statValue >= 75 && 
        !topPerformers.some(p => p.id === athlete.id)
      );
    
    return [...topPerformers, ...additionalPerformers];
  };

  // Process top performers for each team
  const processTeamPerformers = (side) => {
    const passingCategory = topPerformersPassing?.[0]?.teams.find(
      t => t.team.toLowerCase() === side.team.toLowerCase()
    )?.categories.find(cat => cat.name === "passing");

    const rushingCategory = topPerformersRushing?.[0]?.teams.find(
      t => t.team.toLowerCase() === side.team.toLowerCase()
    )?.categories.find(cat => cat.name === "rushing");

    const receivingCategory = topPerformersReceiving?.[0]?.teams.find(
      t => t.team.toLowerCase() === side.team.toLowerCase()
    )?.categories.find(cat => cat.name === "receiving");

    return {
      passingPerformers: extractTopPerformers(passingCategory, ["YDS", "C/ATT", "QBR", "TD"]),
      rushingPerformers: extractTopPerformers(rushingCategory, ["YDS", "CAR", "TD"]),
      receivingPerformers: extractTopPerformers(receivingCategory, ["YDS", "REC", "TD"])
    };
  };

  // Prepare chart data
  const prepareChartData = (performers, statType) => {
    return performers.map(athlete => ({
      name: athlete.name.split(' ').pop(), // Just use last name for chart clarity
      fullName: athlete.name,
      yards: parseFloat(athlete.stat),
      id: athlete.id
    }));
  };

  // Dynamic color for performance
  const getPerformanceColor = (value) => {
    if (value >= 150) return "#0cce6b"; // Green for excellent
    if (value >= 100) return "#7cbb00"; // Light green for very good
    if (value >= 75) return "#ffaa00";  // Yellow/orange for good
    if (value >= 50) return "#ff7700";  // Orange for average
    return "#ff4e00";                   // Red-orange for below average
  };

  // Performance badge component
  const PerformanceBadge = ({ yards, category }) => {
    let Icon, bgColor, label;
    
    // Set icon based on category
    if (category === "passing") Icon = FaFootballBall;
    else if (category === "rushing") Icon = FaRunning;
    else Icon = FaRegHandPointUp;
    
    // Determine medal based on yards
    if (yards >= 150) {
      bgColor = "#FFD700"; // Gold
      label = "Elite";
    } else if (yards >= 100) {
      bgColor = "#C0C0C0"; // Silver
      label = "Star";
    } else {
      bgColor = "#CD7F32"; // Bronze
      label = "Solid";
    }
    
    return (
      <div className="performance-badge" style={{
        backgroundColor: bgColor,
        padding: '4px 8px',
        borderRadius: '12px',
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        fontSize: '0.75rem',
        fontWeight: 'bold',
        color: '#333',
        boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
      }}>
        <Icon style={{ fontSize: '0.9rem' }} />
        <span>{label}</span>
      </div>
    );
  };

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label, teamColor }) => {
    if (active && payload && payload.length > 0) {
      return (
        <div style={{
          backgroundColor: '#fff',
          border: `2px solid ${teamColor || '#8884d8'}`,
          padding: '10px',
          borderRadius: '8px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.15)'
        }}>
          <p style={{ fontWeight: 'bold', marginBottom: '4px' }}>{payload[0].payload.fullName}</p>
          <p style={{ margin: '0', color: getPerformanceColor(payload[0].value) }}>
            {payload[0].value} yards
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="top-performers" style={styles.container}>
      <h2 style={styles.heading}>
        <FaTrophy style={{ marginRight: '10px', color: '#FFD700' }} />
        Top Performers
      </h2>
      <div className="top-performers__container" style={styles.teamContainer}>
        {[
          { team: game.homeTeam, label: getTeamAbbreviation(game.homeTeam) },
          { team: game.awayTeam, label: getTeamAbbreviation(game.awayTeam) },
        ].map((side) => {
          const { 
            passingPerformers, 
            rushingPerformers, 
            receivingPerformers 
          } = processTeamPerformers(side);

          const teamColor = getTeamColor(side.team);
          const teamLogo = getTeamLogo(side.team);
          
          return (
            <div key={side.team} className="top-performers__team" style={styles.teamSection}>
              <div style={styles.teamHeader}>
                <img 
                  src={teamLogo} 
                  alt={side.label} 
                  style={styles.teamLogo} 
                />
                <h3 style={{
                  ...styles.teamHeading,
                  color: teamColor
                }}>{side.label}</h3>
              </div>
              
              {/* Passing Performance Section */}
              <div className="top-performers__passing" style={styles.categorySection}>
                <div style={styles.categoryHeader}>
                  <FaFootballBall style={{ color: teamColor, marginRight: '8px' }} />
                  <h4 style={styles.categoryHeading}>Passing Leaders</h4>
                </div>
                
                {passingPerformers.length > 0 ? (
                  <>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart 
                        data={prepareChartData(passingPerformers)}
                        layout="vertical"
                        margin={{ left: 20, right: 30, top: 20, bottom: 10 }}
                      >
                        <XAxis 
                          type="number" 
                          label={{ value: 'Yards', position: 'insideBottom', offset: -8 }} 
                        />
                        <YAxis 
                          dataKey="name" 
                          type="category" 
                          width={80}
                          style={{ fontWeight: 'bold' }}
                        />
                        <Tooltip content={<CustomTooltip teamColor={teamColor} />} />
                        <Bar 
                          dataKey="yards" 
                          barSize={20}
                          radius={[0, 4, 4, 0]}
                        >
                          {
                            prepareChartData(passingPerformers).map((entry, index) => (
                              <Cell 
                                key={`cell-${index}`} 
                                fill={getPerformanceColor(entry.yards)} 
                              />
                            ))
                          }
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                    
                    <div style={styles.statsDetails}>
                      {passingPerformers.map(athlete => (
                        <div key={athlete.id} style={styles.statItemDetailed}>
                          <div style={styles.athleteNameContainer}>
                            <span style={styles.athleteName}>{athlete.name}</span>
                            <PerformanceBadge yards={parseFloat(athlete.stat)} category="passing" />
                          </div>
                          <div style={styles.athleteStatContainer}>
                            <span style={{
                              ...styles.athleteStat,
                              color: getPerformanceColor(parseFloat(athlete.stat)),
                              fontWeight: 'bold'
                            }}>
                              {athlete.stat} YDS
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div style={styles.noDataMessage}>No passing data available</div>
                )}
              </div>
              
              {/* Rushing Performance Section */}
              <div className="top-performers__rushing" style={styles.categorySection}>
                <div style={styles.categoryHeader}>
                  <FaRunning style={{ color: teamColor, marginRight: '8px' }} />
                  <h4 style={styles.categoryHeading}>Rushing Leaders</h4>
                </div>
                
                {rushingPerformers.length > 0 ? (
                  <>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart 
                        data={prepareChartData(rushingPerformers)}
                        layout="vertical"
                        margin={{ left: 20, right: 30, top: 20, bottom: 10 }}
                      >
                        <XAxis 
                          type="number" 
                          label={{ value: 'Yards', position: 'insideBottom', offset: -8 }} 
                        />
                        <YAxis 
                          dataKey="name" 
                          type="category" 
                          width={80}
                          style={{ fontWeight: 'bold' }}
                        />
                        <Tooltip content={<CustomTooltip teamColor={teamColor} />} />
                        <Bar 
                          dataKey="yards" 
                          barSize={20}
                          radius={[0, 4, 4, 0]}
                        >
                          {
                            prepareChartData(rushingPerformers).map((entry, index) => (
                              <Cell 
                                key={`cell-${index}`} 
                                fill={getPerformanceColor(entry.yards)} 
                              />
                            ))
                          }
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                    
                    <div style={styles.statsDetails}>
                      {rushingPerformers.map(athlete => (
                        <div key={athlete.id} style={styles.statItemDetailed}>
                          <div style={styles.athleteNameContainer}>
                            <span style={styles.athleteName}>{athlete.name}</span>
                            <PerformanceBadge yards={parseFloat(athlete.stat)} category="rushing" />
                          </div>
                          <div style={styles.athleteStatContainer}>
                            <span style={{
                              ...styles.athleteStat,
                              color: getPerformanceColor(parseFloat(athlete.stat)),
                              fontWeight: 'bold'
                            }}>
                              {athlete.stat} YDS
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div style={styles.noDataMessage}>No rushing data available</div>
                )}
              </div>
              
              {/* Receiving Performance Section */}
              <div className="top-performers__receiving" style={styles.categorySection}>
                <div style={styles.categoryHeader}>
                  <FaRegHandPointUp style={{ color: teamColor, marginRight: '8px' }} />
                  <h4 style={styles.categoryHeading}>Receiving Leaders</h4>
                </div>
                
                {receivingPerformers.length > 0 ? (
                  <>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart 
                        data={prepareChartData(receivingPerformers)}
                        layout="vertical"
                        margin={{ left: 20, right: 30, top: 20, bottom: 10 }}
                      >
                        <XAxis 
                          type="number" 
                          label={{ value: 'Yards', position: 'insideBottom', offset: -8 }} 
                        />
                        <YAxis 
                          dataKey="name" 
                          type="category" 
                          width={80}
                          style={{ fontWeight: 'bold' }}
                        />
                        <Tooltip content={<CustomTooltip teamColor={teamColor} />} />
                        <Bar 
                          dataKey="yards" 
                          barSize={20}
                          radius={[0, 4, 4, 0]}
                        >
                          {
                            prepareChartData(receivingPerformers).map((entry, index) => (
                              <Cell 
                                key={`cell-${index}`} 
                                fill={getPerformanceColor(entry.yards)} 
                              />
                            ))
                          }
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                    
                    <div style={styles.statsDetails}>
                      {receivingPerformers.map(athlete => (
                        <div key={athlete.id} style={styles.statItemDetailed}>
                          <div style={styles.athleteNameContainer}>
                            <span style={styles.athleteName}>{athlete.name}</span>
                            <PerformanceBadge yards={parseFloat(athlete.stat)} category="receiving" />
                          </div>
                          <div style={styles.athleteStatContainer}>
                            <span style={{
                              ...styles.athleteStat,
                              color: getPerformanceColor(parseFloat(athlete.stat)),
                              fontWeight: 'bold'
                            }}>
                              {athlete.stat} YDS
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div style={styles.noDataMessage}>No receiving data available</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Enhanced styles object
const styles = {
  container: {
    width: '96%',
    margin: '2% auto',
    background: '#fff',
    borderRadius: '16px',
    padding: '24px',
    boxShadow: '0 8px 30px rgba(0,0,0,0.08)',
    border: '1px solid #eaeaea',
  },
  heading: {
    textAlign: 'center',
    marginBottom: '24px',
    color: '#333',
    fontSize: '2rem',
    fontWeight: '700',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  teamContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '24px',
  },
  teamSection: {
    flex: '1 1 48%',
    background: '#fcfcfc',
    border: '1px solid #f0f0f0',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    '&:hover': {
      transform: 'translateY(-4px)',
      boxShadow: '0 8px 16px rgba(0,0,0,0.08)',
    },
  },
  teamHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '20px',
    gap: '12px',
  },
  teamLogo: {
    width: '40px',
    height: '40px',
    objectFit: 'contain',
  },
  teamHeading: {
    textAlign: 'center',
    fontWeight: '600',
    fontSize: '1.6rem',
    margin: 0,
  },
  categorySection: {
    marginBottom: '28px',
    background: 'white',
    borderRadius: '10px',
    padding: '16px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
  },
  categoryHeader: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '12px',
  },
  categoryHeading: {
    margin: 0,
    color: '#444',
    fontSize: '1.2rem',
    fontWeight: '600',
  },
  statsDetails: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    marginTop: '16px',
    padding: '8px',
    background: '#f9f9f9',
    borderRadius: '8px',
  },
  statItemDetailed: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 12px',
    background: 'white',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.04)',
  },
  athleteNameContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  athleteName: {
    fontWeight: '600',
    color: '#333',
    fontSize: '0.95rem',
  },
  athleteStatContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  athleteStat: {
    fontSize: '1.1rem',
  },
  noDataMessage: {
    padding: '20px',
    textAlign: 'center',
    color: '#888',
    fontStyle: 'italic',
  }
};

export default TopPerformers;
