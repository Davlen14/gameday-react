import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const TopPerformers = ({
  game,
  topPerformersPassing,
  topPerformersRushing,
  topPerformersReceiving,
  getTeamAbbreviation,
}) => {
  // Utility function to extract top performers
  const extractTopPerformers = (category, statTypes) => {
    if (!category) return [];
    
    return statTypes.flatMap(statType => {
      const matchingStat = category.types.find(type => type.name === statType);
      return matchingStat ? matchingStat.athletes.slice(0, 2) : [];
    });
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
      name: athlete.name,
      [statType]: parseFloat(athlete.stat)
    }));
  };

  return (
    <div className="top-performers" style={styles.container}>
      <h2 style={styles.heading}>Top Performers</h2>
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

          return (
            <div key={side.team} className="top-performers__team" style={styles.teamSection}>
              <h3 style={styles.teamHeading}>{side.label}</h3>
              
              {/* Passing Performance Chart */}
              <div className="top-performers__passing" style={styles.categorySection}>
                <h4 style={styles.categoryHeading}>Passing Performance</h4>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart 
                    data={prepareChartData(passingPerformers, 'yards')}
                    layout="vertical"
                    margin={{ left: 20, right: 10, top: 10, bottom: 10 }}
                  >
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" />
                    <Tooltip />
                    <Bar dataKey="yards" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
                
                {/* Detailed Passing Stats */}
                <div style={styles.statsDetails}>
                  {passingPerformers.map(athlete => (
                    <div key={athlete.id} style={styles.statItem}>
                      <span style={styles.athleteName}>{athlete.name}</span>
                      <span style={styles.athleteStat}>({athlete.stat})</span>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Rushing Performance Chart */}
              <div className="top-performers__rushing" style={styles.categorySection}>
                <h4 style={styles.categoryHeading}>Rushing Performance</h4>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart 
                    data={prepareChartData(rushingPerformers, 'yards')}
                    layout="vertical"
                    margin={{ left: 20, right: 10, top: 10, bottom: 10 }}
                  >
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" />
                    <Tooltip />
                    <Bar dataKey="yards" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
                
                {/* Detailed Rushing Stats */}
                <div style={styles.statsDetails}>
                  {rushingPerformers.map(athlete => (
                    <div key={athlete.id} style={styles.statItem}>
                      <span style={styles.athleteName}>{athlete.name}</span>
                      <span style={styles.athleteStat}>({athlete.stat})</span>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Receiving Performance Chart */}
              <div className="top-performers__receiving" style={styles.categorySection}>
                <h4 style={styles.categoryHeading}>Receiving Performance</h4>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart 
                    data={prepareChartData(receivingPerformers, 'yards')}
                    layout="vertical"
                    margin={{ left: 20, right: 10, top: 10, bottom: 10 }}
                  >
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" />
                    <Tooltip />
                    <Bar dataKey="yards" fill="#ffc658" />
                  </BarChart>
                </ResponsiveContainer>
                
                {/* Detailed Receiving Stats */}
                <div style={styles.statsDetails}>
                  {receivingPerformers.map(athlete => (
                    <div key={athlete.id} style={styles.statItem}>
                      <span style={styles.athleteName}>{athlete.name}</span>
                      <span style={styles.athleteStat}>({athlete.stat})</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Inline styles object
const styles = {
  container: {
    width: '96%',
    margin: '2% auto',
    background: '#f4f4f4',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 6px 12px rgba(0,0,0,0.1)',
  },
  heading: {
    textAlign: 'center',
    marginBottom: '20px',
    color: '#333',
    fontSize: '1.8em',
    fontWeight: '600',
  },
  teamContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '2%',
  },
  teamSection: {
    flex: '1 1 48%',
    background: 'white',
    border: '1px solid #e0e0e0',
    borderRadius: '10px',
    padding: '15px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
  },
  teamHeading: {
    textAlign: 'center',
    marginBottom: '15px',
    color: '#444',
    fontSize: '1.4em',
  },
  categorySection: {
    marginBottom: '20px',
  },
  categoryHeading: {
    textAlign: 'left',
    marginBottom: '10px',
    color: '#666',
    fontSize: '1.2em',
    borderBottom: '2px solid #f0f0f0',
    paddingBottom: '5px',
  },
  statsDetails: {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: '10px',
  },
  statItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  athleteName: {
    fontWeight: '600',
    color: '#333',
  },
  athleteStat: {
    color: '#666',
    fontSize: '0.9em',
  },
};

export default TopPerformers;