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
          // Fetch all teams to get the logos
          const teams = await teamsService.getTeams();
          const foundTeam = teams.find(t => t.school.toLowerCase() === teamName.toLowerCase());
          if (foundTeam && foundTeam.logos) {
            // Set primary logo (index 0)
            if (foundTeam.logos.length > 0) {
              setPrimaryLogo(foundTeam.logos[0]);
            }
            
            // Set secondary logo (index 1 - dark version) if available
            if (foundTeam.logos.length > 1) {
              setSecondaryLogo(foundTeam.logos[1]);
            } else if (foundTeam.logos.length > 0) {
              // Fallback to primary logo if secondary doesn't exist
              setSecondaryLogo(foundTeam.logos[0]);
            }
          }
        } catch (error) {
          console.error("Error fetching team logos:", error);
        }
      } else {
        // If teamLogo is provided, set it as primary and use it for secondary as well
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
    // First check if we have a fullName property
    if (player.fullName) {
      return player.fullName;
    }
    // Then check firstName/lastName combination
    else if (player.firstName && player.lastName) {
      return `${player.firstName} ${player.lastName}`;
    }
    // Then check name property
    else if (player.name) {
      return player.name;
    }
    // Default fallback
    return "Player Name";
  };
  
  // Get player fullName using the flexible function
  const playerFullName = getPlayerName();
  
  // Get player's position - handles different data formats
  const getPlayerPosition = () => {
    return player.position || "";
  };
  
  // Get player's jersey number - handles different data formats
  const getPlayerJerseyNumber = () => {
    // First check number property
    if (player.number !== undefined) {
      return player.number;
    }
    // Then check jersey property
    else if (player.jersey !== undefined) {
      return player.jersey;
    }
    // Then check jerseyNumber property
    else if (player.jerseyNumber !== undefined) {
      return player.jerseyNumber;
    }
    // Default fallback
    return "";
  };
  
  // Get position and jersey number
  const playerPosition = getPlayerPosition();
  const playerJerseyNumber = getPlayerJerseyNumber();
    
  // Format height from inches to feet and inches
  const formatHeight = (heightInches) => {
    if (!heightInches) return "N/A";
    
    const feet = Math.floor(heightInches / 12);
    const inches = heightInches % 12;
    return `${feet}'${inches}"`;  
  };
  
  // Format height for display
  const displayHeight = formatHeight(player.height);

  // Draft eligibility calculation based on class year
  const calculateDraftEligibility = (yearNumber) => {
    const currentYear = new Date().getFullYear();
    
    switch (yearNumber) {
      case 1: // Freshman
        return currentYear + 3;
      case 2: // Sophomore
        return currentYear + 2;
      case 3: // Junior
        return currentYear + 1;
      case 4: // Senior
      case 5: // 5th Year
        return currentYear;
      default:
        return "N/A";
    }
  };

  // Draft eligibility year (calculated if not provided)
  const draftEligibleYear = player.draftEligibleYear || calculateDraftEligibility(player.year || 1);

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
    passSnaps: 382,
    runSnaps: 502,
  };
  
  // Position breakdown data
  const positionBreakdown = [
    { position: "QB", snaps: 855 },
    { position: "Backfield", snaps: 20 },
    { position: "Slot", snaps: 5 },
    { position: "Wide", snaps: 4 }
  ];
  
  // Total snaps calculation
  const totalSnaps = snapsData.passSnaps + snapsData.runSnaps;
  
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
  
  // Modern bar chart options with improved axis styling to match the screenshot
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
          /* Big team logo on the left */
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
          /* The standard logo in the top-right corner */
          .top-right-team-logo {
            position: absolute;
            top: 15px;
            right: 15px;
            width: 50px;
            height: auto;
            object-fit: contain;
            z-index: 2;
          }
          /* Player info on the right */
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
           * Body: Grades, Doughnut, and Weekly Bar Charts
           * -----------------------------------
           */
          .modal-body {
            display: flex;
            padding: 1.5rem;
            gap: 2rem;
            background-color: #fff;
            border-top: 1px solid #eee;
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
            font-weight: 500;
            text-transform: uppercase;
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
            font-weight: 600;
          }
          /* Doughnut Chart Column for 2024 Snaps */
          .snaps-column {
            flex: 0 0 280px;
            text-align: center;
            border-left: 1px solid #eee;
            border-right: 1px solid #eee;
            padding: 0 1.5rem;
          }
          .snaps-column h3 {
            font-size: 1.1rem;
            margin-bottom: 1rem;
            color: #333;
            font-weight: 600;
          }
          .snaps-total {
            margin-top: 1rem;
            font-size: 1rem;
            color: #444;
            font-weight: 600;
          }
          /* Position breakdown table */
          .positions-table {
            width: 100%;
            margin-top: 1.5rem;
            border-collapse: collapse;
          }
          .positions-table th {
            font-size: 0.75rem;
            font-weight: 600;
            color: #777;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            text-align: left;
            padding: 0.5rem 0;
          }
          .positions-table td {
            font-size: 0.9rem;
            color: #333;
            padding: 0.3rem 0;
            border-bottom: 1px solid #eee;
          }
          .positions-table td:last-child {
            text-align: right;
          }
          /* Weekly Stacked Bar Column */
          .weekly-column {
            flex: 1 1 auto;
          }
          .weekly-column h3 {
            font-size: 1.1rem;
            margin-bottom: 1rem;
            color: #333;
            font-weight: 600;
          }
          /* -----------------------------------
           * Close Button
           * -----------------------------------
           */
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
        `}
      </style>

      <div className="modal-container">
        {/* Close Button */}
        <button className="close-button" onClick={onClose}>×</button>
        {/* HEADER */}
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