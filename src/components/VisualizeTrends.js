import React, { useState } from "react";
import "../styles/VisualizeTrends.css";
import PollsBumpChart from "./PollsBumpChart"; // D3 chart component
import PlayerStatsModal from "./PlayerStatsModal"; // Dedicated component for player stats

const VisualizeTrends = () => {
  // State to track which modal is open
  const [activeModal, setActiveModal] = useState(null);

  // State to store poll filters
  const [selectedWeekRange, setSelectedWeekRange] = useState("Week 1 - 5");
  const [selectedPollType, setSelectedPollType] = useState("AP Poll");

  // State for player stats modal filters
  const [playerSearchTerm, setPlayerSearchTerm] = useState("");
  const [selectedTeam, setSelectedTeam] = useState("All Teams");
  const [selectedPosition, setSelectedPosition] = useState("All Positions");

  // Handlers for opening/closing modals
  const openModal = (modalType) => {
    setActiveModal(modalType);
  };
  const closeModal = () => {
    setActiveModal(null);
  };

  // Handlers for updating poll filter selections
  const handleWeekRangeChange = (e) => {
    setSelectedWeekRange(e.target.value);
  };
  const handlePollTypeChange = (e) => {
    setSelectedPollType(e.target.value);
  };

  // Handlers for player stats modal filters
  const handlePlayerSearchChange = (e) => {
    setPlayerSearchTerm(e.target.value);
  };
  const handleTeamFilterChange = (e) => {
    setSelectedTeam(e.target.value);
  };
  const handlePositionFilterChange = (e) => {
    setSelectedPosition(e.target.value);
  };

  return (
    <div className="visualize-container">
      <header className="visualize-header">
        <h1>Visualize Trends</h1>
        <p>
          Explore animated trends, polls, player stats, team points, and more over the season.
        </p>
      </header>

      {/* Dashboard Cards: Click to Open Modals */}
      <section className="visualize-dashboard">
        <div className="chart-card" onClick={() => openModal("pollRankings")}>
          <div className="chart-header">
            <h2>Animated Poll Rankings</h2>
          </div>
          <div className="chart-placeholder">[Click to Open Modal]</div>
        </div>

        <div className="chart-card" onClick={() => openModal("playerStats")}>
          <div className="chart-header">
            <h2>Player Stats Over Weeks</h2>
          </div>
          <div className="chart-placeholder">[Click to Open Modal]</div>
        </div>

        <div className="chart-card" onClick={() => openModal("teamPoints")}>
          <div className="chart-header">
            <h2>Team Points Per Game</h2>
          </div>
          <div className="chart-placeholder">[Click to Open Modal]</div>
        </div>

        <div className="chart-card" onClick={() => openModal("offenseDefense")}>
          <div className="chart-header">
            <h2>Offense vs. Defense Trends</h2>
          </div>
          <div className="chart-placeholder">[Click to Open Modal]</div>
        </div>
      </section>

      {/* Modal Overlay (only visible if a modal is active) */}
      {activeModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-button" onClick={closeModal}>
              &times;
            </button>

            {/* 1. Poll Rankings Modal */}
            {activeModal === "pollRankings" && (
              <>
                <h2>Animated Poll Rankings</h2>
                <div className="modal-filters">
                  <div className="filter-group">
                    <select value={selectedWeekRange} onChange={handleWeekRangeChange}>
                      <option value="Week 1 - 5">Week 1 - 5</option>
                      <option value="Week 1 - 10">Week 1 - 10</option>
                      <option value="Week 1 - 15">Week 1 - 15</option>
                      <option value="Week 1 - Postseason">Week 1 - Postseason</option>
                    </select>
                  </div>
                  <div className="filter-group">
                    <select value={selectedPollType} onChange={handlePollTypeChange}>
                      <option value="AP Poll">AP Poll</option>
                      <option value="Coaches Poll">Coaches Poll</option>
                      <option value="Playoff Rankings">Playoff Rankings</option>
                    </select>
                  </div>
                </div>
                <div className="chart-wrapper">
                  <PollsBumpChart
                    width={700}
                    height={450}
                    pollType={selectedPollType}
                    weekRange={selectedWeekRange}
                  />
                </div>
              </>
            )}

            {/* 2. Player Stats Modal */}
            {activeModal === "playerStats" && (
              <>
                <h2>Player Stats Over Weeks</h2>
                <div className="modal-filters">
                  <div className="filter-group">
                    <label htmlFor="playerSearch">Search Player:</label>
                    <input
                      id="playerSearch"
                      type="text"
                      placeholder="Enter player name"
                      value={playerSearchTerm}
                      onChange={handlePlayerSearchChange}
                    />
                  </div>
                  <div className="filter-group">
                    <label htmlFor="teamFilter">Team:</label>
                    <select
                      id="teamFilter"
                      value={selectedTeam}
                      onChange={handleTeamFilterChange}
                    >
                      <option value="All Teams">All Teams</option>
                      <option value="Alabama">Alabama</option>
                      <option value="Ohio State">Ohio State</option>
                      <option value="Michigan">Michigan</option>
                      {/* Add more teams as needed */}
                    </select>
                  </div>
                  <div className="filter-group">
                    <label htmlFor="positionFilter">Position:</label>
                    <select
                      id="positionFilter"
                      value={selectedPosition}
                      onChange={handlePositionFilterChange}
                    >
                      <option value="All Positions">All Positions</option>
                      <option value="QB">QB</option>
                      <option value="RB">RB</option>
                      <option value="WR">WR</option>
                      <option value="TE">TE</option>
                      {/* Add additional positions as needed */}
                    </select>
                  </div>
                </div>
                <div className="chart-wrapper">
                  {/* Render the PlayerStatsModal component with filter props */}
                  <PlayerStatsModal
                    searchTerm={playerSearchTerm}
                    teamFilter={selectedTeam}
                    positionFilter={selectedPosition}
                  />
                </div>
              </>
            )}

            {/* 3. Team Points Modal */}
            {activeModal === "teamPoints" && (
              <>
                <h2>Team Points Per Game</h2>
                <div className="modal-filters">
                  <div className="filter-group">
                    <label>Team</label>
                    <select>
                      <option>All Teams</option>
                      <option>Team A</option>
                      <option>Team B</option>
                    </select>
                  </div>
                </div>
                <div className="chart-wrapper">[Bar Chart Placeholder]</div>
              </>
            )}

            {/* 4. Offense vs. Defense Modal */}
            {activeModal === "offenseDefense" && (
              <>
                <h2>Offense vs. Defense Trends</h2>
                <div className="modal-filters">
                  <div className="filter-group">
                    <label>Offensive Stat</label>
                    <select>
                      <option>Total Yards</option>
                      <option>Rushing Yards</option>
                      <option>Passing Yards</option>
                    </select>
                  </div>
                  <div className="filter-group">
                    <label>Defensive Stat</label>
                    <select>
                      <option>Yards Allowed</option>
                      <option>Points Allowed</option>
                      <option>Sacks</option>
                    </select>
                  </div>
                </div>
                <div className="chart-wrapper">[Dual-Axis Chart Placeholder]</div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default VisualizeTrends;