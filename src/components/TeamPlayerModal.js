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
  player = {},            // Player data with: firstName, lastName, year, weight, height, jersey, position
  teamName = "",          // Team name to fetch logo if teamLogo is not provided
  teamLogo = "",          // Real team logo URL (the same logo is used in two places)
  teamColor = "",         // Primary team color (from team data)
  altColor = "",          // Alternate team color (if not provided, falls back to teamColor)
}) => {
  // State for team logos - primary and secondary
  const [primaryLogo, setPrimaryLogo] = useState(teamLogo);
  const [secondaryLogo, setSecondaryLogo] = useState("");
  
  // Fetch team logos if not provided
  useEffect(() => {
    const fetchTeamLogos = async () => {
      if (!teamLogo && teamName) {
        try {
          const teams = await teamsService.getTeams();
          const foundTeam = teams.find(t => t.school.toLowerCase() === teamName.toLowerCase());
          if (foundTeam && foundTeam.logos) {
            if (foundTeam.logos.length > 0) {
              setPrimaryLogo(foundTeam.logos[0]);
            }
            if (foundTeam.logos.length > 1) {
              setSecondaryLogo(foundTeam.logos[1]);
            } else if (foundTeam.logos.length > 0) {
              setSecondaryLogo(foundTeam.logos[0]);
            }
          }
        } catch (error) {
          console.error("Error fetching team logos:", error);
        }
      } else {
        setPrimaryLogo(teamLogo);
        setSecondaryLogo(teamLogo);
      }
    };
    
    fetchTeamLogos();
  }, [teamLogo, teamName]);

  // Early return AFTER hooks are declared
  if (!player) return null;

  // Fallback: if no altColor is provided, use teamColor
  const effectiveAltColor = altColor || teamColor;

  // Convert numeric year to text for class designation
  const playerClass = convertYearToText(player.year || 1);
  
  // Get player's full name - handles different data formats
  const getPlayerName = () => {
    if (player.fullName) return player.fullName;
    else if (player.firstName && player.lastName) return `${player.firstName} ${player.lastName}`;
    else if (player.name) return player.name;
    return "Player Name";
  };
  
  const playerFullName = getPlayerName();
  
  // Get player's position and jersey number
  const getPlayerPosition = () => player.position || "";
  const getPlayerJerseyNumber = () => {
    if (player.number !== undefined) return player.number;
    else if (player.jersey !== undefined) return player.jersey;
    else if (player.jerseyNumber !== undefined) return player.jerseyNumber;
    return "";
  };
  
  const playerPosition = getPlayerPosition();
  const playerJerseyNumber = getPlayerJerseyNumber();
    
  // Format height from inches to feet and inches
  const formatHeight = (heightInches) => {
    if (!heightInches) return "N/A";
    const feet = Math.floor(heightInches / 12);
    const inches = heightInches % 12;
    return `${feet}'${inches}"`;  
  };
  
  const displayHeight = formatHeight(player.height);

  // Draft eligibility calculation based on class year
  const calculateDraftEligibility = (yearNumber) => {
    const currentYear = new Date().getFullYear();
    switch (yearNumber) {
      case 1: return currentYear + 3;
      case 2: return currentYear + 2;
      case 3: return currentYear + 1;
      case 4:
      case 5: return currentYear;
      default: return "N/A";
    }
  };

  const draftEligibleYear = player.draftEligibleYear || calculateDraftEligibility(player.year || 1);

  // MOCK CHART DATA (unchanged)
  const currentYear = new Date().getFullYear();
  const seasonGrades = [
    { label: "OFFENSE GRADE", value: 92.9, color: "#A5B4FC" }, // Pastel indigo
    { label: "PASS GRADE", value: 91.7, color: "#A5B4FC" },
    { label: "RUSH GRADE", value: 77.8, color: "#A5B4FC" },
    { label: "RATING", value: 88.2, color: "#A5B4FC" },
  ];

  const careerGrades = [
    { label: "2020", value: 67.0, color: "#F9A8D4" }, // Pastel pink
    { label: "2021", value: 66.9, color: "#F9A8D4" },
    { label: "2022", value: 59.9, color: "#F9A8D4" },
    { label: "2023", value: 80.2, color: "#F9A8D4" },
    { label: `${currentYear}`, value: 92.9, color: "#A5B4FC" },
  ];

  const snapsData = { passSnaps: 382, runSnaps: 502 };
  const positionBreakdown = [
    { position: "QB", snaps: 855 },
    { position: "Backfield", snaps: 20 },
    { position: "Slot", snaps: 5 },
    { position: "Wide", snaps: 4 },
  ];
  const totalSnaps = snapsData.passSnaps + snapsData.runSnaps;

  // Modern doughnut chart with pastel gradient colors
  const doughnutData = {
    labels: ["Passing Snaps", "Running Snaps"],
    datasets: [
      {
        data: [snapsData.passSnaps, snapsData.runSnaps],
        backgroundColor: [
          "rgba(165, 180, 252, 0.8)", // Pastel indigo
          "rgba(249, 168, 212, 0.8)", // Pastel pink
        ],
        hoverBackgroundColor: [
          "rgba(165, 180, 252, 1)",
          "rgba(249, 168, 212, 1)",
        ],
        borderWidth: 0,
        borderRadius: 5,
        hoverOffset: 10,
        cutout: "75%",
      },
    ],
  };

  // Updated doughnut options for a modern look
  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          boxWidth: 10,
          padding: 20,
          font: {
            size: 12,
            family: "'Inter', sans-serif",
            weight: 500,
          },
          color: "#64748B", // Slate gray for text
        },
      },
      tooltip: {
        backgroundColor: "rgba(30, 41, 59, 0.9)", // Dark slate
        padding: 12,
        cornerRadius: 8,
        bodyFont: { size: 13, family: "'Inter', sans-serif" },
        titleFont: { size: 14, family: "'Inter', sans-serif", weight: 600 },
        bodySpacing: 6,
        boxPadding: 6,
      },
    },
    animation: {
      animateScale: true,
      animateRotate: true,
      duration: 1000,
      easing: "easeOutQuart",
    },
  };

  // Weekly stacked bar data (unchanged)
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

  // Modern bar chart data with pastel colors
  const barData = {
    labels: weeklySnaps.map((d) => `${d.week}`),
    datasets: [
      {
        label: "Passing Snaps",
        data: weeklySnaps.map((d) => d.pass),
        backgroundColor: "rgba(165, 180, 252, 0.7)", // Pastel indigo
        hoverBackgroundColor: "rgba(165, 180, 252, 1)",
        borderRadius: 6,
        barPercentage: 0.7,
        categoryPercentage: 0.8,
      },
      {
        label: "Running Snaps",
        data: weeklySnaps.map((d) => d.run),
        backgroundColor: "rgba(249, 168, 212, 0.7)", // Pastel pink
        hoverBackgroundColor: "rgba(249, 168, 212, 1)",
        borderRadius: 6,
        barPercentage: 0.7,
        categoryPercentage: 0.8,
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
          boxWidth: 10,
          padding: 20,
          font: {
            size: 12,
            family: "'Inter', sans-serif",
            weight: 500,
          },
          color: "#64748B",
        },
      },
      tooltip: {
        backgroundColor: "rgba(30, 41, 59, 0.9)",
        padding: 12,
        cornerRadius: 8,
        bodyFont: { size: 13, family: "'Inter', sans-serif" },
        titleFont: { size: 14, family: "'Inter', sans-serif", weight: 600 },
        bodySpacing: 6,
        boxPadding: 6,
      },
    },
    scales: {
      x: {
        stacked: true,
        grid: { display: false },
        border: { display: false },
        ticks: {
          font: { size: 11, family: "'Inter', sans-serif", weight: 500 },
          color: "#64748B",
        },
      },
      y: {
        stacked: true,
        grid: { color: "rgba(203, 213, 225, 0.3)" }, // Light slate grid
        border: { display: false },
        ticks: {
          font: { size: 11, family: "'Inter', sans-serif" },
          color: "#64748B",
          stepSize: 10,
          padding: 8,
        },
        suggestedMax: 90,
        beginAtZero: true,
      },
    },
    animation: {
      duration: 1000,
      easing: "easeOutQuart",
    },
  };

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
          borderRadius: "12px",
          overflow: "hidden",
          boxShadow: "0 15px 40px rgba(0,0,0,0.15)",
          backgroundColor: "#F8FAFC", // Light slate background
        },
        overlay: {
          backgroundColor: "rgba(0, 0, 0, 0.6)",
          zIndex: 9999,
        },
      }}
    >
      {/* Updated Inline Styling */}
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

          .modal-container {
            display: flex;
            flex-direction: column;
            background: #F8FAFC;
            font-family: 'Inter', sans-serif;
          }

          /* -----------------------------------
           * Header (Unchanged)
           * -----------------------------------
           */
          .modal-header {
            position: relative;
            padding: 0;
            overflow: hidden;
            height: 200px;
            display: flex;
            flex-direction: column;
            justify-content: flex-end;
            background-color: #fff;
          }
          .angled-block-main {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            clip-path: polygon(0 0, 100% 0, 45% 100%, 0 100%);
            background-color: ${teamColor};
          }
          .angled-block-secondary {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            clip-path: polygon(45% 100%, 0 100%, 0 0, 25% 0);
            background-color: ${effectiveAltColor};
          }
          .big-team-logo {
            position: absolute;
            left: 30px;
            top: 50%;
            transform: translateY(-50%);
            width: 120px;
            height: auto;
            object-fit: contain;
            z-index: 2;
          }
          .top-right-team-logo {
            position: absolute;
            top: 15px;
            right: 15px;
            width: 50px;
            height: auto;
            object-fit: contain;
            z-index: 2;
          }
          .player-header-content {
            position: relative;
            z-index: 2;
            padding: 20px 30px;
            margin-left: 45%;
            display: flex;
            flex-direction: column;
          }
          .player-name {
            font-size: 2rem;
            font-weight: 700;
            margin: 0;
            color: #333;
            display: flex;
            flex-direction: column;
          }
          .player-position {
            font-size: 1rem;
            font-weight: 600;
            margin: 0 0 10px 0;
            color: #666;
          }
          .player-info-grid {
            display: grid;
            grid-template-columns: repeat(4, auto);
            gap: 30px;
            margin-top: 1rem;
          }
          .player-info-item {
            display: flex;
            flex-direction: column;
          }
          .player-info-label {
            font-size: 0.75rem;
            font-weight: 600;
            color: #777;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .player-info-value {
            font-size: 1.1rem;
            font-weight: 500;
            color: #333;
          }
          .team-name {
            position: absolute;
            top: 15px;
            right: 80px;
            font-size: 1rem;
            font-weight: 600;
            color: #333;
            z-index: 2;
          }

          /* -----------------------------------
           * Modernized Body: Card-based layout with pastel colors
           * -----------------------------------
           */
          .modal-body {
            display: flex;
            flex-wrap: wrap;
            padding: 2rem;
            gap: 1.5rem;
            background: linear-gradient(145deg, #F8FAFC, #E2E8F0); /* Subtle gradient background */
            min-height: 400px;
          }

          /* Grades Column */
          .grades-column {
            flex: 1 1 250px;
            display: flex;
            flex-direction: column;
            gap: 1.5rem;
          }
          .grades-section {
            background: #FFFFFF;
            border-radius: 12px;
            padding: 1.5rem;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
            transition: transform 0.3s ease, box-shadow 0.3s ease;
          }
          .grades-section:hover {
            transform: translateY(-3px);
            box-shadow: 0 6px 25px rgba(0, 0, 0, 0.1);
          }
          .grades-section h3 {
            margin: 0 0 1rem;
            font-size: 1.15rem;
            color: #1E293B; /* Dark slate */
            font-weight: 600;
            letter-spacing: 0.5px;
          }
          .grade-list {
            display: flex;
            flex-direction: column;
            gap: 12px;
          }
          .grade-item {
            display: flex;
            align-items: center;
            justify-content: space-between;
            font-size: 0.85rem;
            transition: background 0.3s ease;
            padding: 0.5rem;
            border-radius: 8px;
          }
          .grade-item:hover {
            background: rgba(165, 180, 252, 0.1); /* Pastel indigo hover */
          }
          .grade-item .label {
            flex: 0 0 120px;
            color: #64748B; /* Slate gray */
            font-weight: 500;
            text-transform: uppercase;
            font-size: 0.8rem;
            letter-spacing: 0.5px;
          }
          .grade-bar-container {
            flex: 1;
            background: #E2E8F0; /* Light slate */
            height: 6px;
            border-radius: 3px;
            position: relative;
            margin-right: 10px;
            overflow: hidden;
          }
          .grade-bar-fill {
            position: absolute;
            top: 0;
            left: 0;
            height: 6px;
            border-radius: 3px;
            background: linear-gradient(90deg, #A5B4FC, #F9A8D4); /* Gradient fill */
            transition: width 0.5s ease;
          }
          .grade-value {
            width: 40px;
            text-align: right;
            color: #1E293B;
            font-weight: 600;
            font-size: 0.9rem;
          }

          /* Doughnut Chart Column */
          .snaps-column {
            flex: 1 1 300px;
            background: #FFFFFF;
            border-radius: 12px;
            padding: 1.5rem;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
            text-align: center;
            transition: transform 0.3s ease, box-shadow 0.3s ease;
          }
          .snaps-column:hover {
            transform: translateY(-3px);
            box-shadow: 0 6px 25px rgba(0, 0, 0, 0.1);
          }
          .snaps-column h3 {
            font-size: 1.15rem;
            margin-bottom: 1.5rem;
            color: #1E293B;
            font-weight: 600;
            letter-spacing: 0.5px;
          }
          .snaps-total {
            margin-top: 1.5rem;
            font-size: 1.5rem;
            color: #1E293B;
            font-weight: 700;
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
          }
          .snaps-total strong {
            font-size: 0.85rem;
            color: #64748B;
            text-transform: uppercase;
            font-weight: 600;
            letter-spacing: 1px;
          }
          .positions-table {
            width: 100%;
            margin-top: 2rem;
            border-collapse: collapse;
            font-size: 0.9rem;
          }
          .positions-table th {
            font-size: 0.8rem;
            font-weight: 600;
            color: #64748B;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            text-align: left;
            padding: 0.75rem 0;
            border-bottom: 1px solid #E2E8F0;
          }
          .positions-table td {
            font-size: 0.9rem;
            color: #1E293B;
            padding: 0.75rem 0;
            border-bottom: 1px solid #E2E8F0;
            transition: background 0.3s ease;
          }
          .positions-table tr:hover td {
            background: rgba(165, 180, 252, 0.1);
          }
          .positions-table td:last-child {
            text-align: right;
            font-weight: 600;
          }

          /* Weekly Stacked Bar Column */
          .weekly-column {
            flex: 2 1 400px;
            background: #FFFFFF;
            border-radius: 12px;
            padding: 1.5rem;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
            transition: transform 0.3s ease, box-shadow 0.3s ease;
          }
          .weekly-column:hover {
            transform: translateY(-3px);
            box-shadow: 0 6px 25px rgba(0, 0, 0, 0.1);
          }
          .weekly-column h3 {
            font-size: 1.15rem;
            margin-bottom: 1.5rem;
            color: #1E293B;
            font-weight: 600;
            letter-spacing: 0.5px;
          }

          /* Close Button (Unchanged) */
          .close-button {
            position: absolute;
            top: 15px;
            right: 15px;
            background: none;
            border: none;
            color: #333;
            padding: 0;
            cursor: pointer;
            font-size: 1.5rem;
            font-weight: bold;
            z-index: 10;
            display: flex;
            align-items: center;
            justify-content: center;
            width: 30px;
            height: 30px;
          }
          .close-button:hover {
            color: #333;
          }

          /* Responsive Adjustments */
          @media (max-width: 1024px) {
            .modal-body {
              flex-direction: column;
              padding: 1.5rem;
            }
            .grades-column,
            .snaps-column,
            .weekly-column {
              flex: 1 1 100%;
            }
          }
          @media (max-width: 768px) {
            .modal-body {
              padding: 1rem;
            }
            .grades-section,
            .snaps-column,
            .weekly-column {
              padding: 1rem;
            }
            .player-info-grid {
              grid-template-columns: repeat(2, auto);
              gap: 20px;
            }
          }
        `}
      </style>

      <div className="modal-container">
        {/* Close Button */}
        <button className="close-button" onClick={onClose}>×</button>
        {/* HEADER (Unchanged) */}
        <div className="modal-header">
          <div className="angled-block-main"></div>
          <div className="angled-block-secondary"></div>
          {secondaryLogo ? (
            <img src={secondaryLogo} alt="Team Logo" className="big-team-logo" />
          ) : (
            <img src="https://via.placeholder.com/100" alt="Team Logo" className="big-team-logo" />
          )}
          {primaryLogo ? (
            <img src={primaryLogo} alt="Team Logo" className="top-right-team-logo" />
          ) : (
            <img src="https://via.placeholder.com/80" alt="Team Logo" className="top-right-team-logo" />
          )}
          <div className="team-name">{teamName}</div>
          <div className="player-header-content">
            <h2 className="player-name">{playerFullName}</h2>
            <div className="player-position">{playerPosition} #{playerJerseyNumber}</div>
            <div className="player-info-grid">
              <div className="player-info-item">
                <span className="player-info-label">Height</span>
                <span className="player-info-value">{displayHeight}</span>
              </div>
              <div className="player-info-item">
                <span className="player-info-label">Weight</span>
                <span className="player-info-value">{player.weight ? `${player.weight} lbs` : "N/A"}</span>
              </div>
              <div className="player-info-item">
                <span className="player-info-label">Class</span>
                <span className="player-info-value">{playerClass}</span>
              </div>
              <div className="player-info-item">
                <span className="player-info-label">Draft Eligible Year</span>
                <span className="player-info-value">{draftEligibleYear}</span>
              </div>
            </div>
          </div>
        </div>

        {/* BODY (Modernized) */}
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
            <h3>2024 Snaps</h3>
            <Doughnut data={doughnutData} options={doughnutOptions} />
            <div className="snaps-total">
              <strong>TOTAL</strong>
              <div>{totalSnaps}</div>
            </div>
            <div className="position-breakdown">
              <table className="positions-table">
                <thead>
                  <tr>
                    <th>BY POSITION</th>
                    <th>SNAPS</th>
                  </tr>
                </thead>
                <tbody>
                  {positionBreakdown.map((pos, idx) => (
                    <tr key={idx}>
                      <td>{pos.position}</td>
                      <td>{pos.snaps}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
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