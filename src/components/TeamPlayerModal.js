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
  LineElement,
  PointElement,
} from "chart.js";
import teamsService from "../services/teamsService";

// Register required Chart.js components including LineElement for line charts
ChartJS.register(
  CategoryScale, 
  LinearScale, 
  BarElement, 
  ArcElement, 
  Tooltip, 
  Legend, 
  LineElement, 
  PointElement
);

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
   * CHART DATA (with modern styling)
   *********************************************************/
  // Current year for season labels
  const currentYear = new Date().getFullYear();
  
  // Season Grades (Horizontal bar-like representation)
  const seasonGrades = [
    { label: "OFFENSE GRADE", value: 92.9, color: "rgba(59, 130, 246, 0.9)" }, // Blue with opacity
    { label: "PASS GRADE", value: 91.7, color: "rgba(59, 130, 246, 0.85)" }, // Blue with opacity
    { label: "RUSH GRADE", value: 77.8, color: "rgba(101, 163, 13, 0.85)" }, // Green with opacity
    { label: "RATING", value: 88.2, color: "rgba(59, 130, 246, 0.8)" }, // Blue with opacity
  ];

  // Career Grades with modern color scheme
  const careerGrades = [
    { label: "2020", value: 67.0, color: "rgba(132, 204, 22, 0.8)" }, // Light green
    { label: "2021", value: 66.9, color: "rgba(132, 204, 22, 0.85)" }, // Light green
    { label: "2022", value: 59.9, color: "rgba(250, 204, 21, 0.85)" }, // Yellow
    { label: "2023", value: 80.2, color: "rgba(74, 222, 128, 0.85)" }, // Green
    { label: `${currentYear}`, value: 92.9, color: "rgba(59, 130, 246, 0.85)" }, // Blue
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
  
  // Modern doughnut chart with translucent, glassy colors
  const doughnutData = {
    labels: ["Passing Snaps", "Running Snaps"],
    datasets: [
      {
        data: [snapsData.passSnaps, snapsData.runSnaps],
        backgroundColor: [
          "rgba(30, 58, 138, 0.85)", // Dark blue with transparency
          "rgba(37, 99, 235, 0.75)", // Royal blue with transparency
        ],
        hoverBackgroundColor: [
          "rgba(30, 77, 138, 0.95)", 
          "rgba(51, 115, 251, 0.95)"
        ],
        borderWidth: 1,
        borderColor: [
          "rgba(30, 58, 138, 0.3)",
          "rgba(37, 99, 235, 0.3)"
        ],
        borderRadius: 5,
        hoverOffset: 6,
        cutout: "75%"
      },
    ],
  };
  
  // Doughnut options for glassy modern look
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
          },
          color: "rgba(55, 65, 81, 0.9)",
        }
      },
      tooltip: {
        backgroundColor: "rgba(17, 24, 39, 0.75)",
        padding: 12,
        titleFont: {
          size: 14,
          weight: "600",
        },
        bodyFont: {
          size: 13,
        },
        bodySpacing: 6,
        boxPadding: 6,
        usePointStyle: true,
        borderColor: "rgba(255, 255, 255, 0.1)",
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        boxWidth: 8,
        boxHeight: 8,
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
  
  // Modern bar chart data with glassy effects
  const barData = {
    labels: weeklySnaps.map((d) => `${d.week}`),
    datasets: [
      {
        label: "Passing Snaps",
        data: weeklySnaps.map((d) => d.pass),
        backgroundColor: "rgba(30, 58, 138, 0.75)", // Dark blue with transparency
        borderWidth: 1,
        borderColor: "rgba(30, 58, 138, 0.3)", // Subtle border
        borderRadius: 5,
        barPercentage: 0.8,
        categoryPercentage: 0.85
      },
      {
        label: "Running Snaps",
        data: weeklySnaps.map((d) => d.run),
        backgroundColor: "rgba(37, 99, 235, 0.65)", // Royal blue with transparency
        borderWidth: 1,
        borderColor: "rgba(37, 99, 235, 0.3)", // Subtle border
        borderRadius: 5,
        barPercentage: 0.8,
        categoryPercentage: 0.85
      },
    ],
  };
  
  // Modern bar chart options with improved axis styling and glass effects
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
          },
          color: "rgba(55, 65, 81, 0.9)",
          usePointStyle: true,
        }
      },
      tooltip: {
        backgroundColor: "rgba(17, 24, 39, 0.75)",
        padding: 12,
        titleFont: {
          size: 14,
          weight: "600",
        },
        bodyFont: {
          size: 13,
        },
        bodySpacing: 6,
        boxPadding: 6,
        usePointStyle: true,
        borderColor: "rgba(255, 255, 255, 0.1)",
        borderWidth: 1,
        cornerRadius: 8,
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
        grid: { 
          display: false,
          drawBorder: false,
        },
        border: { display: false },
        ticks: { 
          font: { 
            size: 11, 
            family: "'Inter', 'Helvetica', 'Arial', sans-serif",
            weight: 500 
          },
          color: "rgba(55, 65, 81, 0.8)",
        },
      },
      y: {
        stacked: true,
        grid: { 
          color: "rgba(0, 0, 0, 0.03)",
          lineWidth: 1,
          drawBorder: false,
        },
        border: { display: false },
        ticks: { 
          font: { 
            size: 11, 
            family: "'Inter', 'Helvetica', 'Arial', sans-serif" 
          },
          stepSize: 10,
          padding: 8,
          color: "rgba(55, 65, 81, 0.7)",
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
          borderRadius: "12px",
          overflow: "hidden",
          boxShadow: "0 10px 30px rgba(0,0,0,0.2), 0 20px 60px rgba(0,0,0,0.1)",
          backgroundColor: "#fff",
        },
        overlay: {
          backgroundColor: "rgba(0, 0, 0, 0.6)",
          backdropFilter: "blur(3px)",
          zIndex: 9999,
        },
      }}
    >
      {/* Inline styling to match the screenshot with modern updates */}
      <style>
        {`
          .modal-container {
            display: flex;
            flex-direction: column;
            background: #fff;
            height: 100%;
          }
          /* -----------------------------------
           * Header: angled backgrounds, logos, & player info (kept as is)
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
           * NEW MODERN BODY: Glassy Cards with Shadows
           * -----------------------------------
           */
          .modal-body {
            display: flex;
            padding: 1.5rem;
            gap: 1.5rem;
            background-color: #f9fafc;
            border-top: 1px solid rgba(0, 0, 0, 0.05);
            height: calc(100% - 200px);
          }
          
          /* Shared card styling for all sections */
          .card {
            background: rgba(255, 255, 255, 0.85);
            backdrop-filter: blur(12px);
            border-radius: 12px;
            box-shadow: 
              0 4px 15px rgba(0, 0, 0, 0.05), 
              0 1px 3px rgba(0, 0, 0, 0.03),
              inset 0 1px 1px rgba(255, 255, 255, 0.8);
            border: 1px solid rgba(255, 255, 255, 0.7);
            padding: 1.25rem;
            transition: all 0.2s ease;
            overflow: hidden;
          }
          
          .card:hover {
            box-shadow: 
              0 6px 20px rgba(0, 0, 0, 0.08), 
              0 2px 5px rgba(0, 0, 0, 0.04),
              inset 0 1px 1px rgba(255, 255, 255, 0.8);
            transform: translateY(-2px);
          }
          
          .card-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 1rem;
            padding-bottom: 0.5rem;
            border-bottom: 1px solid rgba(0, 0, 0, 0.05);
          }
          
          .card-title {
            font-size: 1.1rem;
            font-weight: 600;
            color: rgba(17, 24, 39, 0.9);
            margin: 0;
            letter-spacing: -0.01em;
          }
          
          /* Grades Column for Season & Career Grades */
          .grades-column {
            flex: 0 0 220px;
            display: flex;
            flex-direction: column;
            gap: 1.5rem;
          }
          
          .grades-section {
            height: calc(50% - 0.75rem);
            display: flex;
            flex-direction: column;
          }
          
          .grades-content {
            flex: 1;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            padding-top: 0.5rem;
          }
          
          .grade-list {
            display: flex;
            flex-direction: column;
            gap: 12px;
            flex: 1;
          }
          
          .grade-item {
            display: flex;
            align-items: center;
            justify-content: space-between;
            font-size: 0.9rem;
          }
          
          .grade-item .label {
            flex: 0 0 100px;
            color: rgba(55, 65, 81, 0.8);
            font-weight: 500;
            text-transform: uppercase;
            font-size: 0.8rem;
            letter-spacing: 0.03em;
          }
          
          .grade-bar-container {
            flex: 1;
            background-color: rgba(0, 0, 0, 0.05);
            height: 8px;
            border-radius: 6px;
            position: relative;
            margin-right: 10px;
            overflow: hidden;
            box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.05);
          }
          
          .grade-bar-fill {
            position: absolute;
            top: 0;
            left: 0;
            height: 8px;
            border-radius: 6px;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
            /* Colors set individually in the style prop */
          }
          
          .grade-value {
            width: 40px;
            text-align: right;
            color: rgba(17, 24, 39, 0.9);
            font-weight: 600;
          }
          
          /* Doughnut Chart Column for 2024 Snaps */
          .snaps-column {
            flex: 0 0 280px;
            text-align: center;
            display: flex;
            flex-direction: column;
          }
          
          .doughnut-container {
            flex: 1;
            display: flex;
            flex-direction: column;
            justify-content: center;
            position: relative;
            padding: 0.5rem 0;
          }
          
          .snaps-total {
            margin-top: 1rem;
            font-size: 1rem;
            color: rgba(55, 65, 81, 0.9);
            font-weight: 600;
            padding: 0.5rem;
            border-radius: 8px;
            background: rgba(0, 0, 0, 0.02);
            margin-bottom: 1rem;
          }
          
          /* Position breakdown table */
          .positions-table-container {
            margin-top: auto;
          }
          
          .positions-table {
            width: 100%;
            border-collapse: separate;
            border-spacing: 0;
          }
          
          .positions-table th {
            font-size: 0.75rem;
            font-weight: 600;
            color: rgba(55, 65, 81, 0.7);
            text-transform: uppercase;
            letter-spacing: 0.5px;
            text-align: left;
            padding: 0.5rem 0;
          }
          
          .positions-table td {
            font-size: 0.9rem;
            color: rgba(17, 24, 39, 0.9);
            padding: 0.5rem 0;
            border-bottom: 1px solid rgba(0, 0, 0, 0.05);
          }
          
          .positions-table td:last-child {
            text-align: right;
            font-weight: 500;
          }
          
          .positions-table tr:last-child td {
            border-bottom: none;
          }
          
          /* Weekly Stacked Bar Column */
          .weekly-column {
            flex: 1 1 auto;
            display: flex;
            flex-direction: column;
          }
          
          .chart-container {
            flex: 1;
            display: flex;
            flex-direction: column;
            justify-content: center;
            position: relative;
            min-height: 300px;
          }
          
          /* -----------------------------------
           * Close Button
           * -----------------------------------
           */
          .close-button {
            position: absolute;
            top: 15px;
            right: 15px;
            background: rgba(255, 255, 255, 0.2);
            border: none;
            color: rgba(0, 0, 0, 0.6);
            padding: 0;
            cursor: pointer;
            font-size: 1.25rem;
            font-weight: bold;
            z-index: 10;
            display: flex;
            align-items: center;
            justify-content: center;
            width: 32px;
            height: 32px;
            border-radius: 50%;
            backdrop-filter: blur(4px);
            transition: all 0.2s ease;
          }
          
          .close-button:hover {
            background: rgba(255, 255, 255, 0.3);
            color: rgba(0, 0, 0, 0.8);
            transform: scale(1.1);
          }
        `}
      </style>

      <div className="modal-container">
        {/* Close Button */}
        <button className="close-button" onClick={onClose}>×</button>
        
        {/* HEADER - kept as is */}
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

        {/* MODERNIZED BODY WITH GLASS CARDS */}
        <div className="modal-body">
          {/* Grades Column */}
          <div className="grades-column">
            {/* 2024 Season Grades */}
            <div className="grades-section card">
              <div className="card-header">
                <h3 className="card-title">2024 Season Grades</h3>
              </div>
              <div className="grades-content">
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
            </div>
            
  {/* Career Grades */}
  <div className="grades-section card">
              <div className="card-header">
                <h3 className="card-title">Career Grades</h3>
              </div>
              <div className="grades-content">
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
          </div>
          
          {/* Snaps Column with Doughnut Chart */}
          <div className="snaps-column">
            <div className="card" style={{ height: "100%" }}>
              <div className="card-header">
                <h3 className="card-title">2024 Snaps</h3>
              </div>
              
              <div className="doughnut-container">
                <Doughnut data={doughnutData} options={doughnutOptions} />
              </div>
              
              <div className="snaps-total">
                <strong>TOTAL SNAPS</strong>
                <div>{totalSnaps}</div>
              </div>
              
              <div className="positions-table-container">
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
          </div>
          
          {/* Weekly Snaps Column with Bar Chart */}
          <div className="weekly-column">
            <div className="card" style={{ height: "100%" }}>
              <div className="card-header">
                <h3 className="card-title">Weekly Snap Distribution</h3>
              </div>
              
              <div className="chart-container">
                <Bar data={barData} options={barOptions} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default TeamPlayerModal;