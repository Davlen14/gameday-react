import React, { useState, useEffect } from "react";
import teamsService from "../services/teamsService";
import TeamScheduleChart from "./TeamScheduleChart";  // 🔥 Import the chart
import "../styles/TeamAnalytics.css";

const TeamAnalytics = () => {
    const [teams, setTeams] = useState([]);
    const [selectedTeam, setSelectedTeam] = useState(null);
    const [schedule, setSchedule] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

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

    const handleTeamChange = async (event) => {
        const teamId = event.target.value;
        if (!teamId) return;

        setIsLoading(true);
        setError(null);

        try {
            const teamData = teams.find((team) => team.id === parseInt(teamId));
            setSelectedTeam(teamData);

            const scheduleData = await teamsService.getTeamSchedule(teamData.school, 2024);
            setSchedule(scheduleData);
        } catch (err) {
            setError("Failed to load schedule.");
        } finally {
            setIsLoading(false);
        }
    };

    const getTeamLogo = (teamName) => {
        const team = teams.find((t) => t.school.toLowerCase() === teamName.toLowerCase());
        return team?.logos ? team.logos[0] : "/photos/default_team.png";
    };

    return (
        <div className="team-analytics-container">
            <h1>Team Analytics</h1>

            <div className="team-selector">
                <label>Select a Team:</label>
                <select onChange={handleTeamChange} className="team-dropdown">
                    <option value="">-- Choose a Team --</option>
                    {teams.map((team) => (
                        <option key={team.id} value={team.id}>
                            {team.school}
                        </option>
                    ))}
                </select>
            </div>

            {selectedTeam && (
                <div className="team-info">
                    <img src={getTeamLogo(selectedTeam.school)} alt={selectedTeam.school} className="team-logo" />
                    <h2>{selectedTeam.school}</h2>
                </div>
            )}

            {isLoading && <p>Loading schedule...</p>}
            {error && <p className="error">{error}</p>}

            {schedule.length > 0 && (
                <>
                    <div className="schedule">
                        <h3>{selectedTeam.school} Schedule (2024)</h3>
                        <ul className="game-list">
                            {schedule.map((game) => (
                                <li key={game.id} className="game-item">
                                    <div className="game-teams">
                                        <div className="team">
                                            <img src={getTeamLogo(game.awayTeam)} alt={game.awayTeam} className="team-logo" />
                                            <span>{game.awayTeam}</span>
                                        </div>
                                        <span className="vs"> @ </span>
                                        <div className="team">
                                            <img src={getTeamLogo(game.homeTeam)} alt={game.homeTeam} className="team-logo" />
                                            <span>{game.homeTeam}</span>
                                        </div>
                                    </div>
                                    <div className="game-info">
                                        <span>{new Date(game.date).toLocaleDateString()}</span>
                                        <span className="venue">Venue: {game.venue}</span>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* 🔥 ADD THE BAR CHART BELOW THE SCHEDULE */}
                    <TeamScheduleChart teamName={selectedTeam.school} />
                </>
            )}
        </div>
    );
};

export default TeamAnalytics;