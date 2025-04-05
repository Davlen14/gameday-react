import React, { useState } from 'react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  CartesianGrid 
} from 'recharts';
import { 
  Award, 
  Running, 
  Touchdown, 
  ArrowUpRight 
} from 'lucide-react';

// Styled CSS as a template literal
const styles = `
.top-performers-modern {
  background-color: #ffffff;
  border-radius: 12px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  padding: 25px;
  margin: 20px 0;
}

.top-performers-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  border-bottom: 2px solid #f0f0f0;
  padding-bottom: 15px;
}

.top-performers-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 24px;
  font-weight: 700;
  color: #333;
}

.top-performers-tabs {
  display: flex;
  gap: 10px;
}

.top-performers-tab {
  padding: 8px 15px;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 5px;
  font-weight: 500;
}

.top-performers-tab.active {
  background-color: #007bff;
  color: white;
}

.top-performers-content {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 20px;
}

.top-performers-chart {
  height: 350px;
  background-color: #f9f9f9;
  border-radius: 10px;
  padding: 15px;
}

.top-performers-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.top-performer-card {
  background-color: #f0f0f0;
  border-radius: 8px;
  padding: 15px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: transform 0.3s ease;
}

.top-performer-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
}

.top-performer-info {
  display: flex;
  flex-direction: column;
}

.top-performer-name {
  font-weight: 600;
  font-size: 16px;
  color: #333;
}

.top-performer-stats {
  display: flex;
  gap: 10px;
  margin-top: 5px;
  color: #666;
}

.top-performer-rank {
  font-size: 32px;
  font-weight: 700;
  color: #007bff;
  opacity: 0.7;
}

@media (max-width: 768px) {
  .top-performers-content {
    grid-template-columns: 1fr;
  }
}
`;

const TopPerformers = ({ 
  passingPlayers, 
  rushingPlayers, 
  receivingPlayers, 
  homeTeam, 
  awayTeam 
}) => {
  const [activeCategory, setActiveCategory] = useState('passing');

  // Prepare data for charts
  const prepareChartData = (players) => {
    return players
      ?.filter(player => player.team === homeTeam || player.team === awayTeam)
      .slice(0, 4)
      .map(player => ({
        name: player.name,
        yards: player.statYards,
        touchdowns: player.statTouchdowns,
        team: player.team
      })) || [];
  };

  // Get current category players
  const getCurrentPlayers = () => {
    switch (activeCategory) {
      case 'passing': return passingPlayers;
      case 'rushing': return rushingPlayers;
      case 'receiving': return receivingPlayers;
      default: return passingPlayers;
    }
  };

  // Render top performers list
  const renderTopPerformersList = () => {
    const players = getCurrentPlayers()
      ?.filter(player => player.team === homeTeam || player.team === awayTeam)
      .slice(0, 3) || [];

    return players.map((player, index) => (
      <div key={player.name} className="top-performer-card">
        <div className="top-performer-info">
          <span className="top-performer-name">{player.name}</span>
          <div className="top-performer-stats">
            {activeCategory === 'passing' && (
              <>
                <span>YDS: {player.statYards}</span>
                <span>TD: {player.statTouchdowns}</span>
                <span>INT: {player.statInterceptions}</span>
              </>
            )}
            {activeCategory === 'rushing' && (
              <>
                <span>CAR: {player.statCarries}</span>
                <span>YDS: {player.statYards}</span>
                <span>TD: {player.statTouchdowns}</span>
              </>
            )}
            {activeCategory === 'receiving' && (
              <>
                <span>REC: {player.statReceptions}</span>
                <span>YDS: {player.statYards}</span>
                <span>TD: {player.statTouchdowns}</span>
              </>
            )}
          </div>
        </div>
        <div className="top-performer-rank">
          {index + 1}
          <ArrowUpRight size={20} color="#007bff" />
        </div>
      </div>
    ));
  };

  return (
    <div className="top-performers-modern">
      {/* Inject styles */}
      <style>{styles}</style>

      <div className="top-performers-header">
        <div className="top-performers-title">
          <Award size={30} /> Top Performers
        </div>
        <div className="top-performers-tabs">
          <button
            className={`top-performers-tab ${activeCategory === 'passing' ? 'active' : ''}`}
            onClick={() => setActiveCategory('passing')}
          >
            <Touchdown size={18} /> Passing
          </button>
          <button
            className={`top-performers-tab ${activeCategory === 'rushing' ? 'active' : ''}`}
            onClick={() => setActiveCategory('rushing')}
          >
            <Running size={18} /> Rushing
          </button>
          <button
            className={`top-performers-tab ${activeCategory === 'receiving' ? 'active' : ''}`}
            onClick={() => setActiveCategory('receiving')}
          >
            <Award size={18} /> Receiving
          </button>
        </div>
      </div>

      <div className="top-performers-content">
        <div className="top-performers-chart">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={prepareChartData(getCurrentPlayers())}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="name" 
                angle={-45} 
                textAnchor="end" 
                interval={0} 
                height={70} 
              />
              <YAxis />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #ddd',
                  borderRadius: '8px'
                }}
              />
              <Legend />
              <Bar 
                dataKey="yards" 
                name={`${activeCategory.charAt(0).toUpperCase() + activeCategory.slice(1)} Yards`} 
                fill="#007bff" 
                radius={[10, 10, 0, 0]}
              />
              <Bar 
                dataKey="touchdowns" 
                name="Touchdowns" 
                fill="#28a745" 
                radius={[10, 10, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        <div className="top-performers-list">
          {renderTopPerformersList()}
        </div>
      </div>
    </div>
  );
};

export default TopPerformers;