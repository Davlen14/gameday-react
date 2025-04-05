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
    <div className="top-performers">
      <h2>Top Performers</h2>
      <div className="top-performers__container">
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
            <div key={side.team} className="top-performers__team">
              <h3>{side.label}</h3>
              
              {/* Passing Performance Chart */}
              <div className="top-performers__category">
                <h4>Passing Performance</h4>
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
                <div>
                  {passingPerformers.map(athlete => (
                    <div key={athlete.id}>
                      <span>{athlete.name}</span>
                      <span>({athlete.stat})</span>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Rushing Performance Chart */}
              <div className="top-performers__category">
                <h4>Rushing Performance</h4>
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
                <div>
                  {rushingPerformers.map(athlete => (
                    <div key={athlete.id}>
                      <span>{athlete.name}</span>
                      <span>({athlete.stat})</span>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Receiving Performance Chart */}
              <div className="top-performers__category">
                <h4>Receiving Performance</h4>
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
                <div>
                  {receivingPerformers.map(athlete => (
                    <div key={athlete.id}>
                      <span>{athlete.name}</span>
                      <span>({athlete.stat})</span>
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

export default TopPerformers;