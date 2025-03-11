import React, { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import teamsService from "../services/teamsService";

// Register required Chart.js components
import {
  Chart,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from "chart.js";
Chart.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

const WinProb = ({ gameId, homeTeam, awayTeam }) => {
  const [wpData, setWpData] = useState([]);
  const [teams, setTeams] = useState({ home: {}, away: {} });
  const [loading, setLoading] = useState(true);
  const [selectedPlay, setSelectedPlay] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch win probability metrics for the specific game
        const data = await teamsService.getMetricsWP(gameId);
        setWpData(data);
        
        // Fetch team information for colors
        if (data.length > 0) {
          const homeTeamData = await teamsService.getTeam(data[0].homeId);
          const awayTeamData = await teamsService.getTeam(data[0].awayId);
          setTeams({ 
            home: { 
              name: homeTeamData.school, 
              color: homeTeamData.color || "#007bff"
            }, 
            away: {
              name: awayTeamData.school,
              color: awayTeamData.color || "#28a745"
            }
          });
        }
      } catch (error) {
        console.error("Error fetching win probability metrics:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [gameId]);

  // Set up data segment colors based on possession
  const getSegmentColors = () => {
    if (!wpData.length) return [];
    
    return wpData.map((d) => {
      return d.homeBall ? teams.home.color : teams.away.color;
    });
  };

  // Prepare data for Chart.js
  const chartData = {
    labels: wpData.map((d) => d.playNumber),
    datasets: [
      {
        label: "Win Probability",
        data: wpData.map((d) => d.homeWinProbability * 100),
        borderWidth: 2,
        pointRadius: 0,
        tension: 0.1,
        fill: false,
        segment: {
          borderColor: (ctx) => {
            const colors = getSegmentColors();
            return colors[ctx.p0DataIndex];
          }
        },
      },
    ],
  };

  // Enhanced chart options
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      tooltip: {
        mode: 'index',
        intersect: false,
        callbacks: {
          title: (tooltipItems) => {
            const idx = tooltipItems[0].dataIndex;
            if (!wpData[idx]) return "Play";
            return `Play ${wpData[idx].playNumber}`;
          },
          label: (tooltipItem) => {
            const idx = tooltipItem.dataIndex;
            if (!wpData[idx]) return "";
            
            const play = wpData[idx];
            const probText = `${teams.home.name} Win Prob: ${(play.homeWinProbability * 100).toFixed(1)}%`;
            
            return [
              probText,
              `${play.playText}`,
              `Score: ${play.homeScore}-${play.awayScore}`
            ];
          },
          afterLabel: (tooltipItem) => {
            const idx = tooltipItem.dataIndex;
            if (!wpData[idx]) return "";
            
            const play = wpData[idx];
            return `${play.down > 0 ? `${getDownString(play.down)} & ${play.distance}` : ""}`;
          }
        },
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleFont: { size: 14 },
        bodyFont: { size: 13 },
        padding: 10,
        displayColors: false,
      },
      legend: {
        display: false,
      },
      annotation: {
        annotations: selectedPlay ? {
          box1: {
            type: 'box',
            xMin: selectedPlay - 0.5,
            xMax: selectedPlay + 0.5,
            yMin: 0,
            yMax: 100,
            backgroundColor: 'rgba(0, 0, 0, 0.1)',
            borderWidth: 0,
          }
        } : {}
      }
    },
    interaction: {
      mode: 'index',
      intersect: false,
    },
    onClick: (e, elements) => {
      if (elements.length > 0) {
        const index = elements[0].index;
        setSelectedPlay(index);
      }
    },
    scales: {
      x: {
        title: {
          display: true,
          text: "Play Number",
          font: {
            size: 14,
            weight: 'bold',
          },
          padding: 10,
        },
        grid: {
          color: 'rgba(200, 200, 200, 0.3)',
          drawTicks: false,
        },
        ticks: {
          maxRotation: 0,
          autoSkip: true,
          maxTicksLimit: 20,
        },
      },
      y: {
        min: 0,
        max: 100,
        title: {
          display: true,
          text: "Win Percentage",
          font: {
            size: 14,
            weight: 'bold',
          },
          padding: 10,
        },
        grid: {
          color: 'rgba(200, 200, 200, 0.3)',
          drawTicks: false,
        },
        ticks: {
          callback: (value) => `${value}`,
          stepSize: 10,
        },
      },
    },
  };

  // Helper function to format down
  const getDownString = (down) => {
    switch (down) {
      case 1: return "1st Down";
      case 2: return "2nd Down";
      case 3: return "3rd Down";
      case 4: return "4th Down";
      default: return "";
    }
  };

  // Display selected play details
  const renderPlayDetails = () => {
    if (!selectedPlay || !wpData[selectedPlay]) return null;
    
    const play = wpData[selectedPlay];
    return (
      <div className="play-details">
        <h3>Play #{play.playNumber}</h3>
        <p>{play.playText}</p>
        <p>
          <strong>Score:</strong> {teams.home.name} {play.homeScore} - {teams.away.name} {play.awayScore}
        </p>
        {play.down > 0 && (
          <p>
            <strong>{getDownString(play.down)} & {play.distance}</strong> at the {
              play.yardLine <= 50 
                ? `${play.homeBall ? teams.home.name : teams.away.name} ${play.yardLine}` 
                : `${!play.homeBall ? teams.home.name : teams.away.name} ${100 - play.yardLine}`
            }
          </p>
        )}
        <p>
          <strong>Win Probability:</strong> {(play.homeWinProbability * 100).toFixed(1)}% for {teams.home.name}
        </p>
      </div>
    );
  };

  // Create legend items for home and away teams
  const renderLegend = () => {
    return (
      <div className="chart-legend">
        <div className="legend-item">
          <span 
            className="color-box" 
            style={{ backgroundColor: teams.home.color }}
          ></span>
          <span>{teams.home.name} has possession</span>
        </div>
        <div className="legend-item">
          <span 
            className="color-box" 
            style={{ backgroundColor: teams.away.color }}
          ></span>
          <span>{teams.away.name} has possession</span>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="winprob-container">
        <p>Loading win probability metrics...</p>
      </div>
    );
  }

  return (
    <div className="winprob-container">
      <h2>
        {teams.home.name} {wpData.length > 0 ? wpData[wpData.length - 1].homeScore : ''}, {teams.away.name} {wpData.length > 0 ? wpData[wpData.length - 1].awayScore : ''}
      </h2>
      
      {renderLegend()}
      
      <div className="chart-container">
        <Line data={chartData} options={options} height={400} />
      </div>
      
      {selectedPlay !== null && renderPlayDetails()}
      
      <style jsx>{`
        .winprob-container {
          width: 100%;
          max-width: 1200px;
          margin: 20px auto;
          padding: 20px;
          background: #ffffff;
          border: 1px solid #ddd;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        
        .winprob-container h2 {
          text-align: center;
          margin-bottom: 20px;
          font-size: 1.5rem;
          color: #333;
        }
        
        .chart-container {
          height: 400px;
          position: relative;
          margin-bottom: 20px;
          border: 1px solid #eee;
        }
        
        .chart-legend {
          display: flex;
          justify-content: center;
          margin-bottom: 15px;
          flex-wrap: wrap;
        }
        
        .legend-item {
          display: flex;
          align-items: center;
          margin: 0 15px;
        }
        
        .color-box {
          display: inline-block;
          width: 15px;
          height: 15px;
          margin-right: 5px;
          border-radius: 2px;
        }
        
        .play-details {
          background: #f8f9fa;
          padding: 15px;
          border-radius: 5px;
          margin-top: 20px;
          border-left: 4px solid #007bff;
        }
        
        .play-details h3 {
          margin-top: 0;
          font-size: 1.2rem;
        }
      `}</style>
    </div>
  );
};

export default WinProb;
