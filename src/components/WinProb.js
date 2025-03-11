// WinProb.js
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

const WinProb = ({ year, week }) => {
  const [wpData, setWpData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWinMetrics = async () => {
      try {
        // Fetch win probability metrics using year and week
        const data = await teamsService.getMetricsWP(year, week);
        setWpData(data);
      } catch (error) {
        console.error("Error fetching win probability metrics:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchWinMetrics();
  }, [year, week]);

  // Prepare data for Chart.js
  const chartData = {
    // Use playNumber if available, otherwise index+1
    labels: wpData.map((d, idx) => `Play ${d.playNumber || idx + 1}`),
    datasets: [
      {
        label: "Home Win Probability (%)",
        data: wpData.map((d) =>
          d.homeWinProbability ? d.homeWinProbability * 100 : 0
        ),
        fill: true,
        borderColor: "#007bff",
        backgroundColor: "rgba(0,123,255,0.2)",
        tension: 0.4, // curve the line a bit
      },
    ],
  };

  // Chart options with interactive tooltips
  const options = {
    responsive: true,
    plugins: {
      tooltip: {
        callbacks: {
          title: (tooltipItems) => {
            const idx = tooltipItems[0].dataIndex;
            // Show play text if available
            return wpData[idx].playText || `Play ${idx + 1}`;
          },
          label: (tooltipItem) => {
            return `Win Prob: ${tooltipItem.parsed.y.toFixed(1)}%`;
          },
        },
      },
      legend: {
        display: true,
        position: "bottom",
      },
    },
    hover: {
      mode: "index",
      intersect: false,
    },
    scales: {
      x: {
        title: {
          display: true,
          text: "Play Number",
        },
      },
      y: {
        min: 0,
        max: 100,
        title: {
          display: true,
          text: "Win Probability (%)",
        },
        ticks: {
          callback: (value) => `${value}%`,
        },
      },
    },
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
      <h2>Win Probability Metrics</h2>
      <Line data={chartData} options={options} />
      {/* CSS for this component */}
      <style jsx>{`
        .winprob-container {
          width: 100%;
          max-width: 800px;
          margin: 20px auto;
          padding: 20px;
          background: #f9f9f9;
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
      `}</style>
    </div>
  );
};

export default WinProb;
