import React, { useState } from "react";
import "../styles/VisualizeTrends.css";
import PollsBumpChart from "./PollsBumpChart"; // D3 chart component

const VisualizeTrends = () => {
  // State to track which modal is open (null means no modal is open)
  const [activeModal, setActiveModal] = useState(null);

  // Handler to open a specific modal
  const openModal = (modalType) => {
    setActiveModal(modalType);
  };

  // Handler to close the modal
  const closeModal = () => {
    setActiveModal(null);
  };

  return (
    <div className="visualize-container">
      <header className="visualize-header">
        <h1>Visualize Trends</h1>
        <p>
          Explore animated trends, polls, player stats, team points, and more
          over the season.
        </p>
      </header>

      {/* Dashboard Cards: Click to Open Modals */}
      <section className="visualize-dashboard">
        <div className="chart-card" onClick={() => openModal("pollRankings")}>
          <div className="chart-header">
            <h2>Animated Poll Rankings</h2>
          </div>
          <div className="chart-placeholder">
            [Click to Open Modal]
          </div>
        </div>

        <div className="chart-card" onClick={() => openModal("playerStats")}>
          <div className="chart-header">
            <h2>Player Stats Over Weeks</h2>
          </div>
          <div className="chart-placeholder">
            [Click to Open Modal]
          </div>
        </div>

        <div className="chart-card" onClick={() => openModal("teamPoints")}>
          <div className="chart-header">
            <h2>Team Points Per Game</h2>
          </div>
          <div className="chart-placeholder">
            [Click to Open Modal]
          </div>
        </div>

        <div className="chart-card" onClick={() => openModal("offenseDefense")}>
          <div className="chart-header">
            <h2>Offense vs. Defense Trends</h2>
          </div>
          <div className="chart-placeholder">
            [Click to Open Modal]
          </div>
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
                    <label>Week Range</label>
                    <select>
                      <option>Week 1 - 5</option>
                      <option>Week 6 - 10</option>
                      <option>Week 11 - 15</option>
                    </select>
                  </div>
                  <div className="filter-group">
                    <label>Poll Type</label>
                    <select>
                      <option>AP Poll</option>
                      <option>Coaches Poll</option>
                      <option>Playoff Rankings</option>
                    </select>
                  </div>
                </div>

                {/* Chart Wrapper */}
                <div className="chart-wrapper">
                  <PollsBumpChart width={700} height={450} />
                </div>
              </>
            )}

            {/* 2. Player Stats Modal */}
            {activeModal === "playerStats" && (
              <>
                <h2>Player Stats Over Weeks</h2>
                <div className="modal-filters">
                  <div className="filter-group">
                    <label>Player</label>
                    <select>
                      <option>All Players</option>
                      <option>Player 1</option>
                      <option>Player 2</option>
                    </select>
                  </div>
                  <div className="filter-group">
                    <label>Stat Type</label>
                    <select>
                      <option>Passing Yards</option>
                      <option>Rushing Yards</option>
                      <option>Receiving Yards</option>
                      <option>Touchdowns</option>
                    </select>
                  </div>
                </div>
                <div className="chart-wrapper">
                  [Line Chart Placeholder]
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
                <div className="chart-wrapper">
                  [Bar Chart Placeholder]
                </div>
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
                <div className="chart-wrapper">
                  [Dual-Axis Chart Placeholder]
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default VisualizeTrends;