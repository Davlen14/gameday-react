import React, { useState, useEffect } from "react";
import "../styles/VisualizeTrends.css";
import PollsBumpChart from "./PollsBumpChart"; // D3 chart component
import PlayerStatsChart from "./PlayerStatsChart"; // New D3 chart component
import teamsService from "../services/teamsService";
import playersService from "../services/playersService";

const VisualizeTrends = () => {
  // State to track which modal is open
  const [activeModal, setActiveModal] = useState(null);

  // State to store poll filters
  const [selectedWeekRange, setSelectedWeekRange] = useState("Week 1 - 5");
  const [selectedPollType, setSelectedPollType] = useState("AP Poll");

  // State to store player stats filters
  const [selectedPlayer, setSelectedPlayer] = useState("All Players");
  const [selectedStatType, setSelectedStatType] = useState("Passing Yards");
  const [players, setPlayers] = useState([]);
  const [teams, setTeams] = useState([]);

  // Fetch players and teams on mount
  useEffect(() => {
    const fetchPlayersAndTeams = async () => {
      try {
        const playersData = await playersService.getPlayerSearch("");
        setPlayers(playersData);
        const teamsData = await teamsService.getTeams();
        setTeams(teamsData);
      } catch (error) {
        console.error("Error fetching players or teams:", error);
      }
    };
    fetchPlayersAndTeams();
  }, []);

  // Handlers for opening/closing modals
  const openModal = (modalType) => {
    setActiveModal(modalType);
  };
  const closeModal = () => {
    setActiveModal(null);
  };

  // Handlers for updating filter selections
  const handleWeekRangeChange = (e) => {
    setSelectedWeekRange(e.target.value);
  };
  const handlePollTypeChange = (e) => {
    setSelectedPollType(e.target.value);
  };
  const handlePlayerChange = (e) => {
    setSelectedPlayer(e.target.value);
  };
  const handleStatTypeChange = (e) => {
    setSelectedStatType(e.target.value);
  };

  return (
    <div className="visualize-container">
      <header className="visualize-header">
        <h1>Visualize Trends</h1>
        <p>
          Explore animated trends, polls, player stats, team points, and more over
          the season.
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
                    <select
                      value={selectedWeekRange}
                      onChange={handleWeekRangeChange}
                    >
                      <option value="Week 1 - 5">Week 1 - 5</option>
                      <option value="Week 1 - 10">Week 1 - 10</option>
                      <option value="Week 1 - 15">Week 1 - 15</option>
                      <option value="Week 1 - Postseason">Week 1 - Postseason</option>
                    </select>
                  </div>
                  <div className="filter-group">
                    <select
                      value={selectedPollType}
                      onChange={handlePollTypeChange}
                    >
                      <option value="AP Poll">AP Poll</option>
                      <option value="Coaches Poll">Coaches Poll</option>
                      <option value="Playoff Rankings">Playoff Rankings</option>
                    </select>
                  </div>
                </div>

                {/* Pass the filter selections to PollsBumpChart */}
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
                    <label>Player</label>
                    <select value={selectedPlayer} onChange={handlePlayerChange}>
                      <option value="All Players">All Players</option>
                      {players.map((player) => (
                        <option key={player.id} value={player.name}>
                          {player.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="filter-group">
                    <label>Stat Type</label>
                    <select value={selectedStatType} onChange={handleStatTypeChange}>
                      <option value="Passing Yards">Passing Yards</option>
                      <option value="Rushing Yards">Rushing Yards</option>
                      <option value="Receiving Yards">Receiving Yards</option>
                      <option value="Touchdowns">Touchdowns</option>
                    </select>
                  </div>
                  <div className="filter-group">
                    <label>Week Range</label>
                    <select value={selectedWeekRange} onChange={handleWeekRangeChange}>
                      <option value="Week 1 - 5">Week 1 - 5</option>
                      <option value="Week 1 - 10">Week 1 - 10</option>
                      <option value="Week 1 - 15">Week 1 - 15</option>
                      <option value="Week 1 - Postseason">Week 1 - Postseason</option>
                    </select>
                  </div>
                </div>
                <div className="chart-wrapper">
                  <PlayerStatsChart
                    width={700}
                    height={450}
                    player={selectedPlayer}
                    statType={selectedStatType}
                    weekRange={selectedWeekRange}
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
                      {teams.map((team) => (
                        <option key={team.id} value={team.school}>
                          {team.school}
                        </option>
                      ))}
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