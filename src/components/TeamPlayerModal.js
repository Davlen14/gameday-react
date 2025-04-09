import React, { useState, useEffect } from "react";
import Modal from "react-modal";
import { Bar, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";
import teamsService from "../services/teamsService";

// Register required Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

// For accessibility (set to your app root if needed)
Modal.setAppElement("body");

// Helper function to convert a numeric year into a class string
const convertYearToText = (yearNumber) => {
  switch (yearNumber) {
    case 1:
      return "Freshman";
    case 2:
      return "Sophomore";
    case 3:
      return "Junior";
    case 4:
      return "Senior";
    case 5:
      return "5th Year";
    default:
      return "N/A";
  }
};

const TeamPlayerModal = ({
  isOpen,
  onClose,
  player = {},            // Real data: fullName, year, weight, height, draftEligibleYear
  teamName = "",          // Team name to fetch logo if teamLogo is not provided
  teamLogo = "",          // Real team logo URL (the same logo is used in two places)
  teamColor = "",         // Primary team color (from team data)
  altColor = "",          // Alternate team color (if not provided, falls back to teamColor)
}) => {
  // State for team logo - MOVED BEFORE CONDITIONAL
  const [logo, setLogo] = useState(teamLogo);
  
  // Fetch team logo if not provided - MOVED BEFORE CONDITIONAL
  useEffect(() => {
    const fetchTeamLogo = async () => {
      if (!teamLogo && teamName) {
        try {
          // Fetch all teams to get the logo
          const teams = await teamsService.getTeams();
          const foundTeam = teams.find(t => t.school.toLowerCase() === teamName.toLowerCase());
          if (foundTeam && foundTeam.logos && foundTeam.logos.length > 0) {
            setLogo(foundTeam.logos[0]);
          }
        } catch (error) {
          console.error("Error fetching team logo:", error);
        }
      } else {
        setLogo(teamLogo);
      }
    };
    
    fetchTeamLogo();
  }, [teamLogo, teamName]);

  // Early return AFTER hooks are declared
  if (!player) return null;

  // Fallback: if no altColor is provided, use teamColor
  const effectiveAltColor = altColor || teamColor;

  // Convert numeric year to text for class designation
  const playerClass = convertYearToText(player.year || 1);

  // Determine draft eligibility (for mock purposes, using draftEligibleYear from player)
  const isDraftEligible =
    player.draftEligibleYear && player.draftEligibleYear <= new Date().getFullYear();

  /*********************************************************
   * MOCK CHART DATA (these stats are placeholders)
   * Replace these with real stats when available.
   *********************************************************/
  // Current year for season labels
  const currentYear = new Date().getFullYear();
  
  // Season Grades (Horizontal bar-like representation)
  const seasonGrades = [
    { label: "OFFENSE GRADE", value: 92.9, color: "#3B82F6" }, // Blue
    { label: "PASS GRADE", value: 91.7, color: "#3B82F6" }, // Blue
    { label: "RUSH GRADE", value: 77.8, color: "#65A30D" }, // Green
    { label: "RATING", value: 88.2, color: "#3B82F6" }, // Blue
  ];

  // Career Grades with modern color scheme
  const careerGrades = [
    { label: "2020", value: 67.0, color: "#84CC16" }, // Light green
    { label: "2021", value: 66.9, color: "#84CC16" }, // Light green
    { label: "2022", value: 59.9, color: "#FACC15" }, // Yellow
    { label: "2023", value: 80.2, color: "#4ADE80" }, // Green
    { label: `${currentYear}`, value: 92.9, color: "#3B82F6" }, // Blue
  ];

  // Current year Snaps (passing vs. running)
  const snapsData = {
    passSnaps: 313,
    runSnaps: 555,
  };
  
  // Modern doughnut chart with vibrant colors
  const doughnutData = {
    labels: ["Passing Snaps", "Running Snaps"],
    datasets: [
      {
        data: [snapsData.passSnaps, snapsData.runSnaps],
        backgroundColor: ["#1E3A8A", "#2563EB"], // Dark blue, Royal blue
        hoverBackgroundColor: ["#1E4D8A", "#3373FB"],
        borderWidth: 0,
        borderRadius: 3,
        hoverOffset: 5,
        cutout: "70%"
      },
    ],
  };
  
  // Doughnut options for modern look
  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          boxWidth: 12,
          padding: 15,
          font: {
            size: 12,
            family: "'Inter', 'Helvetica', 'Arial', sans-serif",
            weight: 500
          }
        }
      },
      tooltip: {
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        padding: 10,
        bodyFont: {
          size: 13,
        },
        bodySpacing: 4,
        boxPadding: 5
      }
    },
  };

  // Weekly stacked bar data with more weeks and varied data
  const weeklySnaps = [
    { week: 1, pass: 41, run: 28 },
    { week: 2, pass: 33, run: 16 },
    { week: 3, pass: 30, run: 11 },
    { week: 4, pass: 43, run: 20 },
    { week: 5, pass: 52, run: 22 },
    { week: 6, pass: 63, run: 28 },
    { week: 8, pass: 40, run: 33 },
    { week: 9, pass: 51, run: 32 },
    { week: 10, pass: 45, run: 29 },
    { week: 11, pass: 48, run: 19 },
    { week: 13, pass: 44, run: 30 },
    { week: 14, pass: 44, run: 27 },
    { week: "BG", pass: 21, run: 18 },
  ];
  
  // Modern bar chart data
  const barData = {
    labels: weeklySnaps.map((d) => `${d.week}`),
    datasets: [
      {
        label: "Passing Snaps",
        data: weeklySnaps.map((d) => d.pass),
        backgroundColor: "#1E3A8A", // Dark blue
        borderRadius: 3,
        barPercentage: 0.8,
        categoryPercentage: 0.9
      },
      {
        label: "Running Snaps",
        data: weeklySnaps.map((d) => d.run),
        backgroundColor: "#2563EB", // Royal blue
        borderRadius: 3,
        barPercentage: 0.8,
        categoryPercentage: 0.9
      },
    ],
  };
  
  // Modern bar chart options
  const barOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: { 
        position: "bottom",
        labels: {
          boxWidth: 12,
          padding: 15,
          font: {
            size: 12,
            family: "'Inter', 'Helvetica', 'Arial', sans-serif",
            weight: 500
          }
        }
      },
      tooltip: {
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        padding: 10,
        bodyFont: {
          size: 13,
        },
        bodySpacing: 4,
        boxPadding: 5,
        callbacks: {
          label: function(context) {
            return `${context.dataset.label}: ${context.parsed.y}`;
          }
        }
      }
    },
    scales: {
      x: {
        stacked: true,
        grid: { display: false },
        border: { display: false },
        ticks: { 
          font: { 
            size: 11, 
            family: "'Inter', 'Helvetica', 'Arial', sans-serif",
            weight: 500 
          } 
        },
      },
      y: {
        stacked: true,
        grid: { color: "rgba(0, 0, 0, 0.05)" },
        border: { display: false },
        ticks: { 
          font: { 
            size: 11, 
            family: "'Inter', 'Helvetica', 'Arial', sans-serif" 
          },
          stepSize: 10,
          padding: 5
        },
        suggestedMax: 90,
        beginAtZero: true,
      },
    },
  };

  /********************************************
   * Render the Modal Layout with Dynamic Styling
   ********************************************/
  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      contentLabel="Team Player Modal"
      style={{
        content: {
          width: "90%",
          maxWidth: "1300px",
          margin: "auto",
          padding: 0,
          border: "none",
          borderRadius: "6px",
          overflow: "hidden",
          boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
          backgroundColor: "#fff",
        },
        overlay: {
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          zIndex: 9999,
        },
      }}
    >
      {/* Inline styling to match the screenshot */}
      <style>
        {`
          .modal-container {
            display: flex;
            flex-direction: column;
            background: #fff;
          }
          /* -----------------------------------
           * Header: angled backgrounds, logos, & player info
           * -----------------------------------
           */
          .modal-header {
            position: relative;
            padding: 1.5rem 1.5rem 1rem 1.5rem;
            overflow: hidden;
            background-color: #f9f9f9;
          }
          .angled-block-main {
            position: absolute;
            top: 0;
            left: 0;
            width: 220px;
            height: 100%;
            background-color: ${teamColor};
            transform: skewX(-20deg);
            transform-origin: top left;
          }
          .angled-block-secondary {
            position: absolute;
            top: 0;
            left: 170px;
            width: 220px;
            height: 100%;
            background-color: ${effectiveAltColor};
            transform: skewX(-20deg);
            transform-origin: top left;
          }
          /* Big team logo on the left */
          .big-team-logo {
            position: relative;
            width: 100px;
            height: auto;
            object-fit: contain;
            margin-right: 1rem;
            z-index: 2;
          }
          /* The same logo, but smaller, in the top-right corner */
          .top-right-team-logo {
            position: absolute;
            top: 1rem;
            right: 1rem;
            width: 80px;
            height: auto;
            object-fit: contain;
            z-index: 2;
          }
          /* Player info to the right of the big logo */
          .player-header-content {
            margin-left: 120px;
            position: relative;
            z-index: 2;
          }
          .player-name {
            font-size: 1.6rem;
            font-weight: 700;
            margin: 0;
            color: #333;
          }
          .player-info-row {
            display: flex;
            gap: 1.5rem;
            margin-top: 0.5rem;
            font-size: 0.95rem;
            color: #555;
          }
          .player-info-row div strong {
            color: #333;
          }
          /* -----------------------------------
           * Body: Grades, Doughnut, and Weekly Bar Charts
           * -----------------------------------
           */
          .modal-body {
            display: flex;
            padding: 1.5rem;
            gap: 2rem;
          }
          /* Grades Column for Season & Career Grades */
          .grades-column {
            flex: 0 0 220px;
            display: flex;
            flex-direction: column;
            gap: 2rem;
          }
          .grades-section h3 {
            margin: 0 0 0.5rem;
            font-size: 1.1rem;
            color: #333;
            font-weight: 600;
          }
          .grade-list {
            display: flex;
            flex-direction: column;
            gap: 8px;
          }
          .grade-item {
            display: flex;
            align-items: center;
            justify-content: space-between;
            font-size: 0.9rem;
          }
          .grade-item .label {
            flex: 0 0 110px;
            color: #555;
          }
          .grade-bar-container {
            flex: 1;
            background-color: #e0e0e0;
            height: 8px;
            border-radius: 4px;
            position: relative;
            margin-right: 8px;
          }
          .grade-bar-fill {
            position: absolute;
            top: 0;
            left: 0;
            height: 8px;
            border-radius: 4px;
            /* Colors set individually in the style prop */
          }
          .grade-value {
            width: 40px;
            text-align: right;
            color: #333;
          }
          /* Doughnut Chart Column for 2024 Snaps */
          .snaps-column {
            flex: 0 0 260px;
            text-align: center;
          }
          .snaps-column h3 {
            font-size: 1.1rem;
            margin-bottom: 1rem;
            color: #333;
          }
          .snaps-total {
            margin-top: 1rem;
            font-size: 0.95rem;
            color: #444;
          }
          /* Weekly Stacked Bar Column */
          .weekly-column {
            flex: 1 1 auto;
          }
          .weekly-column h3 {
            font-size: 1.1rem;
            margin-bottom: 1rem;
            color: #333;
          }
          /* -----------------------------------
           * Close Button
           * -----------------------------------
           */
          .close-button {
            position: absolute;
            top: 1rem;
            right: 1rem;
            background-color: ${teamColor};
            border: none;
            color: #fff;
            padding: 0.5rem 1rem;
            border-radius: 4px;
            cursor: pointer;
            font-size: 0.85rem;
            z-index: 10;
          }
          .close-button:hover {
            opacity: 0.85;
          }
        `}
      </style>

      <div className="modal-container">
        {/* Close Button */}
        <button className="close-button" onClick={onClose}>Close</button>
        {/* HEADER */}
        <div className="modal-header">
          <div className="angled-block-main"></div>
          <div className="angled-block-secondary"></div>
          {logo ? (
            <img src={logo} alt="Team Logo" className="big-team-logo" />
          ) : (
            <img src="https://via.placeholder.com/100" alt="Team Logo" className="big-team-logo" />
          )}
          {logo ? (
            <img src={logo} alt="Team Logo" className="top-right-team-logo" />
          ) : (
            <img src="https://via.placeholder.com/80" alt="Team Logo" className="top-right-team-logo" />
          )}
          <div className="player-header-content">
            <h2 className="player-name">{player.fullName || "Player Name"}</h2>
            <div className="player-info-row">
              <div><strong>Height:</strong> {player.height || "N/A"}</div>
              <div><strong>Weight:</strong> {player.weight || "N/A"} lbs</div>
              <div><strong>Class:</strong> {playerClass}</div>
              <div><strong>Draft Eligible:</strong> {player.draftEligibleYear || "N/A"}</div>
            </div>
          </div>
        </div>

        {/* BODY */}
        <div className="modal-body">
          {/* Grades Column */}
          <div className="grades-column">
            {/* 2024 Season Grades */}
            <div className="grades-section">
              <h3>2024 Season Grades</h3>
              <div className="grade-list">
                {seasonGrades.map((grade, idx) => {
                  const fillPercent = (grade.value / 100) * 100;
                  return (
                    <div className="grade-item" key={idx}>
                      <div className="label">{grade.label}</div>
                      <div className="grade-bar-container">
                        <div className="grade-bar-fill" style={{ width: `${fillPercent}%`, backgroundColor: grade.color }}></div>
                      </div>
                      <div className="grade-value">{grade.value}</div>
                    </div>
                  );
                })}
              </div>
            </div>
            {/* Career Grades */}
            <div className="grades-section">
              <h3>Career Grades</h3>
              <div className="grade-list">
                {careerGrades.map((grade, idx) => {
                  const fillPercent = (grade.value / 100) * 100;
                  return (
                    <div className="grade-item" key={idx}>
                      <div className="label">{grade.label}</div>
                      <div className="grade-bar-container">
                        <div className="grade-bar-fill" style={{ width: `${fillPercent}%`, backgroundColor: grade.color }}></div>
                      </div>
                      <div className="grade-value">{grade.value}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          {/* Doughnut Chart Column */}
          <div className="snaps-column">
            <h3>2024 Snaps</h3>
            <Doughnut data={doughnutData} />
            <div className="snaps-total">
              <strong>Total Snaps:</strong> {snapsData.passSnaps + snapsData.runSnaps}
            </div>
            {/* Additional label to match the screenshot */}
            <div style={{ marginTop: "0.75rem", fontSize: "0.9rem", color: "#444" }}>
              <div style={{ fontWeight: 600, marginBottom: "0.25rem" }}>BY POSITION</div>
              <div>QB • 868</div>
            </div>
          </div>
          {/* Weekly Column */}
          <div className="weekly-column">
            <h3>Weekly</h3>
            <Bar data={barData} options={barOptions} />
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default TeamPlayerModal;