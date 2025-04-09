import React from "react";
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
  teamLogo = "",          // Real team logo URL (the same logo is used in two places)
  teamColor = "",         // Primary team color (from team data)
  altColor = "",          // Alternate team color (if not provided, falls back to teamColor)
}) => {
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
  // 2026 Season Grades (Horizontal bar-like representation)
  const seasonGrades = [
    { label: "OFFENSE GRADE", value: 92.9 },
    { label: "PASS GRADE", value: 91.7 },
    { label: "RUSH GRADE", value: 88.2 },
    { label: "RATING", value: 77.8 },
  ];

  // Career Grades
  const careerGrades = [
    { label: "2020", value: 60.0 },
    { label: "2021", value: 75.6 },
    { label: "2022", value: 86.1 },
    { label: "2023", value: 90.2 },
  ];

  // 2026 Snaps (mock passing vs. running)
  const snapsData = {
    passSnaps: 373,
    runSnaps: 555,
  };
  const doughnutData = {
    labels: ["Passing Snaps", "Running Snaps"],
    datasets: [
      {
        data: [snapsData.passSnaps, snapsData.runSnaps],
        backgroundColor: [teamColor, effectiveAltColor],
        hoverBackgroundColor: [teamColor, effectiveAltColor],
        borderWidth: 0,
      },
    ],
  };

  // Weekly stacked bar data (mock numbers)
  const weeklySnaps = [
    { week: 1, pass: 20, run: 10 },
    { week: 2, pass: 28, run: 12 },
    { week: 3, pass: 30, run: 10 },
    { week: 4, pass: 33, run: 14 },
    { week: 5, pass: 25, run: 20 },
    { week: 6, pass: 35, run: 10 },
    { week: 7, pass: 38, run: 15 },
    { week: 8, pass: 40, run: 16 },
    { week: 9, pass: 37, run: 12 },
    { week: 10, pass: 42, run: 10 },
    { week: 11, pass: 33, run: 18 },
    { week: 12, pass: 42, run: 12 },
  ];
  const barData = {
    labels: weeklySnaps.map((d) => `${d.week}`),
    datasets: [
      {
        label: "Passing Snaps",
        data: weeklySnaps.map((d) => d.pass),
        backgroundColor: teamColor,
      },
      {
        label: "Running Snaps",
        data: weeklySnaps.map((d) => d.run),
        backgroundColor: effectiveAltColor,
      },
    ],
  };
  const barOptions = {
    responsive: true,
    plugins: {
      legend: { position: "bottom" },
    },
    scales: {
      x: {
        stacked: true,
        grid: { display: false },
        title: {
          display: true,
          text: "WEEK",
          font: { size: 12, family: "Arial" },
        },
        ticks: { font: { size: 12, family: "Arial" } },
      },
      y: {
        stacked: true,
        grid: { color: "#eee" },
        ticks: { font: { size: 12, family: "Arial" } },
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
            background-color: ${teamColor};
          }
          .grade-value {
            width: 40px;
            text-align: right;
            color: #333;
          }
          /* Doughnut Chart Column for 2026 Snaps */
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
          {teamLogo ? (
            <img src={teamLogo} alt="Team Logo" className="big-team-logo" />
          ) : (
            <img src="https://via.placeholder.com/100" alt="Team Logo" className="big-team-logo" />
          )}
          {teamLogo ? (
            <img src={teamLogo} alt="Team Logo" className="top-right-team-logo" />
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
            {/* 2026 Season Grades */}
            <div className="grades-section">
              <h3>2026 Season Grades</h3>
              <div className="grade-list">
                {seasonGrades.map((grade, idx) => {
                  const fillPercent = (grade.value / 100) * 100;
                  return (
                    <div className="grade-item" key={idx}>
                      <div className="label">{grade.label}</div>
                      <div className="grade-bar-container">
                        <div className="grade-bar-fill" style={{ width: `${fillPercent}%` }}></div>
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
                        <div className="grade-bar-fill" style={{ width: `${fillPercent}%` }}></div>
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
            <h3>2026 Snaps</h3>
            <Doughnut data={doughnutData} />
            <div className="snaps-total">
              <strong>Total Snaps:</strong> {snapsData.passSnaps + snapsData.runSnaps}
            </div>
            {/* Additional label to match the screenshot */}
            <div style={{ marginTop: "0.75rem", fontSize: "0.9rem", color: "#444" }}>
              <strong>By Position:</strong> QB • 868
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