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
  teamColor = "#1e3a8a",  // Primary team color (from team data)
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

  // Current year for season labels
  const currentYear = new Date().getFullYear();
  
  // Colors for the charts
  const chartColors = {
    blue: "#4778F5",       // Main blue for offense metrics
    darkBlue: "#1e3a8a",   // Dark blue for passing metrics
    green: "#73BD5F",      // Green for rush metrics
    yellow: "#F6CB45",     // Yellow for below average metrics
    lightGreen: "#A3DD89", // Light green for average metrics
    lightBlue: "#DDE8FC",  // Light gray-blue for background
    gray: "#F0F0F0",       // Light gray for background
  };
  
  // Season Grades
  const seasonGrades = [
    { 
      label: "OFFENSE GRADE", 
      value: 92.9, 
      color: chartColors.blue,
      rankInfo: "2nd / 306 QB" 
    },
    { 
      label: "PASS GRADE", 
      value: 91.7, 
      color: chartColors.blue,
      rankInfo: "2nd / 274 QB"  
    },
    { 
      label: "RUSH GRADE", 
      value: 77.8, 
      color: chartColors.green,
      rankInfo: "" 
    },
    { 
      label: "RATING", 
      value: 88.2, 
      color: chartColors.blue,
      rankInfo: "" 
    },
  ];

  // Career Grades with modern color scheme
  const careerGrades = [
    { 
      label: "2020", 
      value: 67.0, 
      color: chartColors.green,
      info: "38th/213" 
    },
    { 
      label: "2021", 
      value: 66.9, 
      color: chartColors.green,
      info: "12nd/294" 
    },
    { 
      label: "2022", 
      value: 59.9, 
      color: chartColors.yellow,
      info: "43rd/308" 
    },
    { 
      label: "2023", 
      value: 80.2, 
      color: chartColors.green,
      info: "70th/307" 
    },
    { 
      label: `${currentYear}`, 
      value: 92.9, 
      color: chartColors.blue,
      info: "2nd/306" 
    },
  ];

  // Current year Snaps (passing vs. running)
  const snapsData = {
    passSnaps: 555,
    runSnaps: 313,
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
  
  // Modern doughnut chart with vibrant colors matching the reference image
  const doughnutData = {
    labels: ["Passing Snaps", "Running Snaps"],
    datasets: [
      {
        data: [snapsData.passSnaps, snapsData.runSnaps],
        backgroundColor: [chartColors.darkBlue, chartColors.blue],
        hoverBackgroundColor: ["#162a66", "#3569e6"],
        borderWidth: 0,
        borderRadius: 0,
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
        display: false,
      },
      tooltip: {
        backgroundColor: "rgba(30, 41, 59, 0.9)",
        padding: 10,
        titleFont: {
          size: 14,
          weight: 'bold',
        },
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
        backgroundColor: chartColors.darkBlue,
        borderRadius: 0,
        barPercentage: 0.9,
        categoryPercentage: 0.8
      },
      {
        label: "Running Snaps",
        data: weeklySnaps.map((d) => d.run),
        backgroundColor: chartColors.blue,
        borderRadius: 0,
        barPercentage: 0.9,
        categoryPercentage: 0.8
      },
    ],
  };
  
  // Modern bar chart options with improved axis styling to match the screenshot
  const barOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: { 
        display: false,
      },
      tooltip: {
        backgroundColor: "rgba(30, 41, 59, 0.9)",
        padding: 10,
        titleFont: {
          size: 14,
          weight: 'bold',
        },
        bodyFont: {
          size: 13,
        },
        bodySpacing: 4,
        boxPadding: 5,
      }
    },
    scales: {
      x: {
        stacked: true,
        grid: { 
          display: false 
        },
        border: { 
          display: false 
        },
        ticks: { 
          font: { 
            size: 12,
            family: "Titillium Web, sans-serif",
            weight: 'normal' 
          },
          color: '#777777'
        },
      },
      y: {
        stacked: true,
        grid: { 
          color: "#f0f0f0",
          lineWidth: 1,
        },
        border: { 
          display: false 
        },
        ticks: { 
          font: { 
            size: 12,
            family: "Titillium Web, sans-serif",
          },
          stepSize: 10,
          padding: 5,
          color: '#777777'
        },
        max: 100,
        beginAtZero: true,
      },
    },
  };

  // Generate the status display
  const statusDisplay = player.status || "DFD"; // Example status
  
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
          borderRadius: "0",
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
          @import url('https://fonts.googleapis.com/css2?family=Titillium+Web:wght@300;400;600;700&display=swap');
          
          .modal-container {
            display: flex;
            flex-direction: column;
            background: #fff;
            font-family: 'Titillium Web', sans-serif;
          }
          
          /* -----------------------------------
           * Header: angled backgrounds, logos, & player info
           * -----------------------------------
           */
          .modal-header {
            position: relative;
            padding: 0;
            overflow: hidden;
            height: 220px;
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
            clip-path: polygon(0 0, 100% 0, 100% 100%, 0 0);
            background-color: ${teamColor};
          }
          
          .angled-block-overlay {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            clip-path: polygon(0 0, 35% 100%, 0 100%);
            background-color: ${effectiveAltColor};
            z-index: 1;
          }
          
          /* Big team logo on the left */
          .big-team-logo {
            position: absolute;
            left: 80px;
            top: 50%;
            transform: translateY(-50%);
            width: 140px;
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
            padding: 30px;
            margin-left: 30px;
            display: flex;
            flex-direction: column;
            color: white;
          }
          
          .player-name {
            font-size: 2.5rem;
            font-weight: 700;
            margin: 0;
            display: flex;
            flex-direction: column;
          }
          
          .player-position {
            font-size: 1.2rem;
            font-weight: 600;
            margin: 0 0 15px 0;
            opacity: 0.9;
          }
          
          .player-info-grid {
            display: grid;
            grid-template-columns: repeat(4, auto);
            gap: 40px;
            margin-top: 1.5rem;
          }
          
          .player-info-item {
            display: flex;
            flex-direction: column;
          }
          
          .player-info-label {
            font-size: 0.8rem;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            opacity: 0.8;
          }
          
          .player-info-value {
            font-size: 1.25rem;
            font-weight: 500;
            margin-top: 5px;
          }
          
          .team-name {
            position: absolute;
            top: 28px;
            right: 80px;
            font-size: 1.2rem;
            font-weight: 600;
            color: white;
            z-index: 2;
          }
          
          /* -----------------------------------
           * New Content Body
           * -----------------------------------
           */
          .player-content {
            display: flex;
            flex-direction: row;
            border-bottom: 1px solid #eee;
          }
          
          /* Season Grades Column */
          .season-grades-column {
            width: 320px;
            padding: 25px;
            border-right: 1px solid #eee;
          }
          
          .grades-heading {
            font-size: 1.1rem;
            font-weight: 600;
            margin: 0 0 25px 0;
            color: #333;
          }
          
          .grade-box {
            margin-bottom: 15px;
            padding-bottom: 15px;
            border-bottom: 1px solid #f0f0f0;
          }
          
          .grade-label {
            font-size: 0.8rem;
            font-weight: 600;
            color: #777;
            margin-bottom: 5px;
            text-transform: uppercase;
          }
          
          .grade-number {
            font-size: 2rem;
            font-weight: 700;
            color: #333;
            display: flex;
            align-items: center;
          }
          
          .grade-box-blue .grade-number {
            color: ${chartColors.blue};
          }
          
          .grade-box-green .grade-number {
            color: ${chartColors.green};
          }
          
          .grade-rank {
            font-size: 0.8rem;
            color: #777;
            margin-top: 3px;
          }
          
          /* Career Grades Column */
          .career-grades-column {
            width: 320px;
            padding: 25px;
            border-right: 1px solid #eee;
          }
          
          .career-grade-row {
            display: flex;
            align-items: center;
            margin-bottom: 20px;
          }
          
          .career-year {
            width: 50px;
            font-size: 0.9rem;
            font-weight: 600;
            color: #555;
          }
          
          .career-info {
            width: 70px;
            font-size: 0.75rem;
            color: #888;
            text-align: right;
          }
          
          .career-bar-container {
            flex: 1;
            height: 28px;
            background-color: #f0f0f0;
            margin: 0 10px;
            position: relative;
          }
          
          .career-bar-fill {
            position: absolute;
            top: 0;
            left: 0;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #333;
            font-weight: 600;
            font-size: 0.9rem;
          }
          
          /* Snaps Column */
          .snaps-column {
            flex: 1;
            display: flex;
          }
          
          .snaps-donut-container {
            width: 300px;
            padding: 25px;
            border-right: 1px solid #eee;
            text-align: center;
          }
          
          .snaps-donut-chart {
            margin: 15px auto;
            position: relative;
            width: 200px;
            height: 200px;
          }
          
          .snaps-total-overlay {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            text-align: center;
          }
          
          .snaps-total-label {
            font-size: 0.7rem;
            font-weight: 600;
            color: #777;
            text-transform: uppercase;
            margin-bottom: 5px;
          }
          
          .snaps-total-number {
            font-size: 1.3rem;
            font-weight: 700;
            color: #333;
          }
          
          .snaps-legend {
            display: flex;
            justify-content: center;
            gap: 15px;
            margin-top: 15px;
          }
          
          .legend-item {
            display: flex;
            align-items: center;
            font-size: 0.8rem;
            color: #555;
          }
          
          .legend-color {
            width: 12px;
            height: 12px;
            margin-right: 5px;
            border-radius: 2px;
          }
          
          .position-table {
            width: 100%;
            margin-top: 20px;
            border-collapse: collapse;
          }
          
          .position-table th {
            text-align: left;
            font-size: 0.7rem;
            font-weight: 600;
            color: #777;
            text-transform: uppercase;
            padding: 5px 0;
            border-bottom: 1px solid #eee;
          }
          
          .position-table th:last-child {
            text-align: right;
          }
          
          .position-table td {
            padding: 5px 0;
            font-size: 0.9rem;
            color: #333;
            border-bottom: 1px solid #f5f5f5;
          }
          
          .position-table td:last-child {
            text-align: right;
            font-weight: 600;
          }
          
          /* Weekly Column */
          .weekly-chart-container {
            flex: 1;
            padding: 25px;
          }
          
          .weekly-chart {
            margin-top: 10px;
            height: 260px;
          }
          
          .weekly-legend {
            display: flex;
            justify-content: center;
            gap: 15px;
            margin-top: 15px;
            padding-top: 10px;
            border-top: 1px solid #f0f0f0;
          }
          
          /* Player Status */
          .player-status {
            padding: 10px 25px;
            background-color: #f9f9f9;
            border-top: 1px solid #eee;
          }
          
          .status-label {
            font-size: 0.8rem;
            font-weight: 600;
            color: #777;
            text-transform: uppercase;
            margin-bottom: 5px;
          }
          
          .status-value {
            font-size: 1.2rem;
            font-weight: 600;
            color: #333;
          }
          
          /* -----------------------------------
           * Close Button
           * -----------------------------------
           */
          .close-button {
            position: absolute;
            top: 20px;
            right: 20px;
            background: white;
            border: none;
            color: #333;
            width: 30px;
            height: 30px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 20px;
            cursor: pointer;
            z-index: 10;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
            transition: all 0.2s;
          }
          
          .close-button:hover {
            background-color: #f5f5f5;
            transform: scale(1.1);
          }
          
          /* Responsive adjustments */
          @media (max-width: 1200px) {
            .player-content {
              flex-direction: column;
            }
            
            .season-grades-column,
            .career-grades-column {
              width: 100%;
              border-right: none;
              border-bottom: 1px solid #eee;
            }
            
            .snaps-column {
              flex-direction: column;
            }
            
            .snaps-donut-container {
              width: 100%;
              border-right: none;
              border-bottom: 1px solid #eee;
            }
          }
        `}
      </style>

      <div className="modal-container">
        {/* Close Button */}
        <button className="close-button" onClick={onClose}>×</button>
        
        {/* HEADER */}
        <div className="modal-header">
          <div className="angled-block-main"></div>
          <div className="angled-block-overlay"></div>
          
          {secondaryLogo ? (
            <img src={secondaryLogo} alt="Team Logo" className="big-team-logo" />
          ) : (
            <img src="https://via.placeholder.com/140" alt="Team Logo" className="big-team-logo" />
          )}
          
          {primaryLogo ? (
            <img src={primaryLogo} alt="Team Logo" className="top-right-team-logo" />
          ) : (
            <img src="https://via.placeholder.com/50" alt="Team Logo" className="top-right-team-logo" />
          )}
          
          <div className="team-name">{teamName} Hurricanes</div>
          
          <div className="player-header-content">
            <h2 className="player-name">{playerFullName}</h2>
            <div className="player-position">{playerPosition} #{playerJerseyNumber}</div>
            
            <div className="player-info-grid">
              <div className="player-info-item">
                <span className="player-info-label">HEIGHT</span>
                <span className="player-info-value">{displayHeight}</span>
              </div>
              <div className="player-info-item">
                <span className="player-info-label">WEIGHT</span>
                <span className="player-info-value">{player.weight ? `${player.weight} lbs` : "N/A"}</span>
              </div>
              <div className="player-info-item">
                <span className="player-info-label">CLASS</span>
                <span className="player-info-value">{playerClass}</span>
              </div>
              <div className="player-info-item">
                <span className="player-info-label">DRAFT ELIGIBLE YEAR</span>
                <span className="player-info-value">{draftEligibleYear}</span>
              </div>
            </div>
          </div>
        </div>

        {/* CONTENT BODY */}
        <div className="player-content">
          {/* Season Grades Column */}
          <div className="season-grades-column">
            <h3 className="grades-heading">2024 Season Grades</h3>
            
            {seasonGrades.map((grade, index) => (
              <div key={index} className={`grade-box ${grade.color === chartColors.blue ? 'grade-box-blue' : 'grade-box-green'}`}>
                <div className="grade-label">{grade.label}</div>
                <div className="grade-number">
                  {grade.value}
                </div>
                {grade.rankInfo && <div className="grade-rank">{grade.rankInfo}</div>}
              </div>
            ))}
            
            {/* Player Status */}
            <div className="player-status">
              <div className="status-label">STATUS</div>
              <div className="status-value">{statusDisplay}</div>
            </div>
          </div>
          
          {/* Career Grades Column */}
          <div className="career-grades-column">
            <h3 className="grades-heading">Career Grades</h3>
            
            {careerGrades.map((grade, index) => (
              <div key={index} className="career-grade-row">
                <div className="career-year">{grade.label}</div>
                <div className="career-bar-container">
                  <div 
                    className="career-bar-fill" 
                    style={{ 
                      width: `${grade.value}%`, 
                      backgroundColor: grade.color 
                    }}
                  >
                    {grade.value}
                  </div>
                </div>
                <div className="career-info">{grade.info}</div>
              </div>
            ))}
          </div>
          
          {/* Snaps Column */}
          <div className="snaps-column">
            <div className="snaps-donut-container">
              <h3 className="grades-heading">2024 Snaps</h3>
              
              <div className="snaps-donut-chart">
                <Doughnut data={doughnutData} options={doughnutOptions} />
                <div className="snaps-total-overlay">
                  <div className="snaps-total-label">TOTAL</div>
                  <div className="snaps-total-number">{totalSnaps}</div>
                </div>
              </div>
              
              <div className="snaps-legend">
                <div className="legend-item">
                  <div className="legend-color" style={{ backgroundColor: chartColors.darkBlue }}></div>
                  <span>Passing Snaps</span>
                </div>
                <div className="legend-item">
                  <div className="legend-color" style={{ backgroundColor: chartColors.blue }}></div>
                  <span>Running Snaps</span>
                </div>
              </div>
              
              <table className="position-table">
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
            
            <div className="weekly-chart-container">
              <h3 className="grades-heading">Weekly</h3>
              
              <div className="weekly-chart">
                <Bar data={barData} options={barOptions} />
              </div>
              
              <div className="weekly-legend">
                <div className="legend-item">
                  <div className="legend-color" style={{ backgroundColor: chartColors.darkBlue }}></div>
                  <span>Passing Snaps</span>
                </div>
                <div className="legend-item">
                  <div className="legend-color" style={{ backgroundColor: chartColors.blue }}></div>
                  <span>Running Snaps</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default TeamPlayerModal;