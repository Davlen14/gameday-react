import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; // 🔥 Import navigation
import teamsService from "../services/teamsService";
import TeamScheduleChart from "./TeamScheduleChart";
import "../styles/TeamAnalytics.css";

const TeamAnalytics = () => {
  const [teams, setTeams] = useState([]);
  const [selectedTeams, setSelectedTeams] = useState([]);
  const [schedules, setSchedules] = useState({}); // key: team.id, value: schedule array
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate(); // 🔥 Use React Router navigation

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const teamsData = await teamsService.getTeams();
        setTeams(teamsData);
      } catch (err) {
        setError("Failed to load teams.");
      }
    };
    fetchTeams();
  }, []);

  // Handle multiple team selection change
  const handleTeamChange = async (event) => {
    const selectedOptions = Array.from(event.target.selectedOptions).map(
      (option) => option.value
    );
    if (selectedOptions.length === 0) {
      setSelectedTeams([]);
      setSchedules({});
      return;
    }

    setIsLoading(true);
    setError(null);

    const teamsSelected = teams.filter((team) =>
      selectedOptions.includes(team.id.toString())
    );
    setSelectedTeams(teamsSelected);

    const newSchedules = {};
    try {
      await Promise.all(
        teamsSelected.map(async (teamData) => {
          const scheduleData = await teamsService.getTeamSchedule(
            teamData.school,
            2024
          );
          newSchedules[teamData.id] = scheduleData;
        })
      );
      setSchedules(newSchedules);
    } catch (err) {
      setError("Failed to load schedule.");
    } finally {
      setIsLoading(false);
    }
  };

  const getTeamLogo = (teamName) => {
    const team = teams.find(
      (t) => t.school.toLowerCase() === teamName.toLowerCase()
    );
    return team?.logos ? team.logos[0] : "/photos/default_team.png";
  };

  // Navigate to game details when clicking a game card
  const handleGameClick = (teamId, gameId) => {
    // Navigate to TeamAnalyticsDetail view, passing team & game info:
    navigate(`/team-metrics/${teamId}?gameId=${gameId}`);
  };

  return (
    <div className="team-analytics-container">
      <h1>Team Analytics</h1>
      <div className="team-selector modern-selector">
        <label htmlFor="team-select">Select Teams:</label>
        <select
          id="team-select"
          multiple
          onChange={handleTeamChange}
          className="team-dropdown"
        >
          {teams.map((team) => (
            <option key={team.id} value={team.id}>
              {team.school}
            </option>
          ))}
        </select>
      </div>

      {isLoading && <p>Loading schedule...</p>}
      {error && <p className="error">{error}</p>}

      {selectedTeams.length > 0 &&
        selectedTeams.map((team) => {
          const teamSchedule = schedules[team.id] || [];
          return (
            <div key={team.id} className="team-section">
              <div className="team-info modern-team-info">
                <img
                  src={getTeamLogo(team.school)}
                  alt={team.school}
                  className="team-logo modern-team-logo"
                />
                <h2>{team.school}</h2>
              </div>
              {teamSchedule.length > 0 && (
                <>
                  <div className="schedule modern-schedule">
                    <h3>{team.school} Schedule (2024)</h3>
                    <ul className="game-list modern-game-list">
                      {teamSchedule.map((game) => (
                        <li
                          key={game.id}
                          className="game-item modern-game-item"
                          onClick={() => handleGameClick(team.id, game.id)}
                          style={{ cursor: "pointer" }}
                        >
                          <div className="game-teams modern-game-teams">
                            <div className="team">
                              <img
                                src={getTeamLogo(game.awayTeam)}
                                alt={game.awayTeam}
                                className="team-logo modern-game-logo"
                              />
                              <span>{game.awayTeam}</span>
                            </div>
                            <span className="vs modern-vs"> @ </span>
                            <div className="team">
                              <img
                                src={getTeamLogo(game.homeTeam)}
                                alt={game.homeTeam}
                                className="team-logo modern-game-logo"
                              />
                              <span>{game.homeTeam}</span>
                            </div>
                          </div>
                          <div className="game-info modern-game-info">
                            <span>
                              {new Date(game.date).toLocaleDateString()}
                            </span>
                            <span className="venue modern-venue">
                              Venue: {game.venue}
                            </span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* The Bar Chart */}
                  <TeamScheduleChart teamName={team.school} />

                  {/* Logos Under the Chart */}
                  <div className="team-logos-container modern-logos">
                    {teamSchedule.map((game) => (
                      <img
                        key={game.id}
                        src={getTeamLogo(game.awayTeam)}
                        alt={game.awayTeam}
                        className="chart-axis-logo modern-chart-logo"
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          );
        })}
    </div>
  );
};

export default TeamAnalytics;