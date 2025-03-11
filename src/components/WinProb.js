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

const WinProb = ({ gameId }) => {
  const [wpData, setWpData] = useState([]);
  const [teams, setTeams] = useState({ home: {}, away: {} });
  const [loading, setLoading] = useState(true);
  const [selectedPlay, setSelectedPlay] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch win probability metrics for the specific game
        const data = await teamsService.getMetricsWP(gameId);
        
        // Filter out duplicate play numbers if they exist
        // We want to ensure we have unique play numbers to avoid chart issues
        const uniquePlays = [];
        const playNumbersSeen = {};
        
        data.forEach(play => {
          if (!playNumbersSeen[play.playNumber]) {
            playNumbersSeen[play.playNumber] = true;
            uniquePlays.push(play);
          }
        });
        
        setWpData(uniquePlays);
        
        // Get team information from the first play data
        if (uniquePlays.length > 0) {
          const homeTeamData = await teamsService.getTeam(uniquePlays[0].homeId);
          const awayTeamData = await teamsService.getTeam(uniquePlays[0].awayId);
          
          // Set default colors in case actual colors aren't available
          const homeColor = homeTeamData.color ? `#${homeTeamData.color}` : "#007bff";
          const awayColor = awayTeamData.color ? `#${awayTeamData.color}` : "#28a745";
          
          setTeams({ 
            home: { 
              name: uniquePlays[0].home || homeTeamData.school || "Home", 
              color: homeColor,
              id: uniquePlays[0].homeId
            }, 
            away: { 
              name: uniquePlays[0].away || awayTeamData.school || "Away", 
              color: awayColor,
              id: uniquePlays[0].awayId
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

  // Prepare data for Chart.js
  const chartData = {
    labels: wpData.map((d) => d.playNumber),
    datasets: [
      {
        label: `Win Probability`,
        data: wpData.map((d) => d.homeWinProbability * 100),
        borderWidth: 2,
        pointRadius: 0,
        tension: 0.1,
        fill: false,
        borderColor: (ctx) => {
          if (!ctx.p0DataIndex || !wpData[ctx.p0DataIndex]) return teams.home.color;
          return wpData[ctx.p0DataIndex].homeBall ? teams.home.color : teams.away.color;
        },
      }
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
            const homeProb = (play.homeWinProbability * 100).toFixed(1);
            const awayProb = (100 - parseFloat(homeProb)).toFixed(1);
            
            return [
              `${teams.home.name}: ${homeProb}%`,
              `${teams.away.name}: ${awayProb}%`,
              `${play.playText}`,
              `Score: ${play.homeScore}-${play.awayScore}`
            ];
          },
          afterLabel: (tooltipItem) => {
            const idx = tooltipItem.dataIndex;
            if (!wpData[idx]) return "";
            
            const play = wpData[idx];
            const possession = play.homeBall ? teams.home.name : teams.away.name;
            let result = [];
            
            if (play.down > 0) {
              result.push(`${getDownString(play.down)} & ${play.distance}`);
            }
            
            result.push(`Possession: ${possession}`);
            return result;
          }
        },
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleFont: { size: 14 },
        bodyFont: { size: 13 },
        padding: 10,
        displayColors: false,
      },
      legend: {
        display: false, // Hide default legend since we use custom legend
      },
    },
    interaction: {
      mode: 'index',
      intersect: false,
    },
    onClick: (event, elements, chart) => {
      // Handle click on chart to show details for a specific play
      if (elements && elements.length > 0) {
        const index = elements[0].index;
        setSelectedPlay(index);
      } else if (chart && chart.scales && chart.scales.x) {
        // If clicked on empty area, try to find closest point
        const canvasPosition = Chart.getRelativePosition(event, chart);
        const dataX = chart.scales.x.getValueForPixel(canvasPosition.x);
        
        // Find closest point if clicked between points
        if (dataX !== undefined && wpData.length > 0) {
          const closestIdx = Math.min(
            Math.max(0, Math.round(dataX)), 
            wpData.length - 1
          );
          setSelectedPlay(closestIdx);
        }
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

  // Display selected play details
  const renderPlayDetails = () => {
    if (!selectedPlay || !wpData[selectedPlay]) return null;
    
    const play = wpData[selectedPlay];
    const homeProb = (play.homeWinProbability * 100).toFixed(1);
    const awayProb = (100 - parseFloat(homeProb)).toFixed(1);
    
    return (
      <div className="play-details">
        <h3>Play #{play.playNumber}</h3>
        <p className="play-text">{play.playText}</p>
        <div className="play-meta">
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
          <p className="possession">
            <strong>Possession:</strong> {play.homeBall ? teams.home.name : teams.away.name}
          </p>
          <div className="win-probabilities">
            <p className="home-prob" style={{ color: teams.home.color }}>
              <strong>{teams.home.name}:</strong> {homeProb}%
            </p>
            <p className="away-prob" style={{ color: teams.away.color }}>
              <strong>{teams.away.name}:</strong> {awayProb}%
            </p>
          </div>
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
      {wpData.length > 0 ? (
        <>
          <h2>
            {teams.home.name} {wpData[wpData.length - 1].homeScore}, {teams.away.name} {wpData[wpData.length - 1].awayScore}
          </h2>
          
          <div className="view-advanced">
            <a href="#">View Advanced Box Score</a>
          </div>
          
          <div className="chart-legend">
            <div className="legend-item">
              <span className="color-box" style={{ backgroundColor: teams.home.color }}></span>
              <span>{teams.home.name} possession</span>
            </div>
            <div className="legend-item">
              <span className="color-box" style={{ backgroundColor: teams.away.color }}></span>
              <span>{teams.away.name} possession</span>
            </div>
          </div>
          
          <div className="chart-container">
            <Line data={chartData} options={options} height={400} />
          </div>
          
          {selectedPlay !== null && renderPlayDetails()}
        </>
      ) : (
        <div className="no-data-message">
          <p>No win probability data available for this game.</p>
        </div>
      )}
      
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
          margin-bottom: 10px;
          font-size: 1.8rem;
          color: #333;
          font-weight: bold;
        }
        
        .view-advanced {
          text-align: center;
          margin-bottom: 20px;
        }
        
        .view-advanced a {
          color: #0275d8;
          text-decoration: none;
          font-size: 0.9rem;
        }
        
        .view-advanced a:hover {
          text-decoration: underline;
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
          max-width: 800px;
          margin-left: auto;
          margin-right: auto;
        }
        
        .play-details h3 {
          margin-top: 0;
          font-size: 1.2rem;
          color: #333;
          margin-bottom: 15px;
        }
        
        .play-text {
          font-size: 1rem;
          line-height: 1.5;
          margin-bottom: 15px;
          color: #333;
        }
        
        .play-meta {
          background: #f1f1f1;
          padding: 12px;
          border-radius: 4px;
          font-size: 0.95rem;
        }
        
        .play-meta p {
          margin: 5px 0;
        }
        
        .win-probabilities {
          display: flex;
          justify-content: space-between;
          margin-top: 10px;
          padding-top: 10px;
          border-top: 1px solid #e0e0e0;
        }
        
        .home-prob, .away-prob {
          font-weight: 500;
        }
        
        .possession {
          font-style: italic;
        }
        
        .no-data-message, .loading-indicator {
          text-align: center;
          padding: 40px;
          font-size: 1.1rem;
          color: #666;
        }
        
        .loading-indicator {
          color: #0275d8;
        }
      `}</style>
    </div>
  );
};

export default WinProb;