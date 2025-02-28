import React, { useState } from "react";
import "../styles/VisualizeTrends.css";
import PollsBumpChart from "./PollsBumpChart"; // D3 chart component for polls
import PlayerStatsChart from "./PlayerStatsChart"; // D3 chart component for player stats

const VisualizeTrends = () => {
  // State to track which modal is open
  const [activeModal, setActiveModal] = useState(null);

  // State to store poll filters
  const [selectedWeekRange, setSelectedWeekRange] = useState("Week 1 - 5");
  const [selectedPollType, setSelectedPollType] = useState("AP Poll");

  // States for player stats modal filters (for D3 chart)
  const [playerSearchTerm, setPlayerSearchTerm] = useState("");
  const [selectedTeam, setSelectedTeam] = useState("All Teams");
  const [selectedPosition, setSelectedPosition] = useState("All Positions");

  // Handlers for opening/closing modals
  const openModal = (modalType) => setActiveModal(modalType);
  const closeModal = () => setActiveModal(null);

  // Handlers for updating poll filter selections
  const handleWeekRangeChange = (e) => setSelectedWeekRange(e.target.value);
  const handlePollTypeChange = (e) => setSelectedPollType(e.target.value);

  // Handlers for player stats modal filters
  const handlePlayerSearchChange = (e) => setPlayerSearchTerm(e.target.value);
  const handleTeamFilterChange = (e) => setSelectedTeam(e.target.value);
  const handlePositionFilterChange = (e) => setSelectedPosition(e.target.value);

  return (
    <div className="visualize-container">
      <header className="visualize-header">
        <h1>Visualize Trends</h1>
        <p>
          Explore animated trends, polls, player stats, team points, and more over the season.
        </p>
      </header>

      {/* Dashboard Cards */}
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

      {/* Modal Overlay */}
      {activeModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-button" onClick={closeModal}>
              &times;
            </button>

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

            {activeModal === "playerStats" && (
              <>
                <h2>Player Stats Over Weeks</h2>
                {/* Filters for player stats are handled here */}
                <div className="modal-filters">
                  <div className="filter-group">
                    <label htmlFor="playerSearch">Search Player:</label>
                    <input
                      id="playerSearch"
                      type="text"
                      placeholder="Enter player name..."
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
                      {/* You could populate this dynamically from a teams service */}
                      <option value="Alabama">Alabama</option>
                      <option value="Ohio State">Ohio State</option>
                      <option value="Michigan">Michigan</option>
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
                    </select>
                  </div>
                </div>
                <div className="chart-wrapper">
                  {/* Pass filters to the PlayerStatsChart component */}
                  <PlayerStatsChart
                    searchTerm={playerSearchTerm}
                    teamFilter={selectedTeam}
                    positionFilter={selectedPosition}
                  />
                </div>
              </>
            )}

            {activeModal === "teamPoints" && (
              <>
                <h2>Team Points Per Game</h2>
                <div className="chart-wrapper">[Bar Chart Placeholder]</div>
              </>
            )}

            {activeModal === "offenseDefense" && (
              <>
                <h2>Offense vs. Defense Trends</h2>
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