import React, { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import teamsService from "../services/teamsService";
import "../styles/TeamAnalytics.css";

const TeamScheduleChart = ({ teamName }) => {
    const [schedule, setSchedule] = useState([]);
    const [teams, setTeams] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchSchedule = async () => {
            try {
                const teamsData = await teamsService.getTeams();
                setTeams(teamsData);

                const scheduleData = await teamsService.getTeamSchedule(teamName, 2024);
                setSchedule(scheduleData);
            } catch (err) {
                setError("Failed to load schedule.");
            } finally {
                setIsLoading(false);
            }
        };

        if (teamName) {
            fetchSchedule();
        }
    }, [teamName]);

    const getTeamData = (team) => {
        return teams.find(t => t.school.toLowerCase() === team.toLowerCase()) || {};
    };

    const formattedData = schedule.map(game => ({
        week: `Week ${game.week}`,
        homeTeam: game.homeTeam,
        awayTeam: game.awayTeam,
        homePoints: game.homePoints || 0,
        awayPoints: game.awayPoints || 0,
        homeColor: getTeamData(game.homeTeam).color || "#999999",
        awayColor: getTeamData(game.awayTeam).color || "#888888",
        homeLogo: getTeamData(game.homeTeam).logos ? getTeamData(game.homeTeam).logos[0] : "/photos/default_team.png",
        awayLogo: getTeamData(game.awayTeam).logos ? getTeamData(game.awayTeam).logos[0] : "/photos/default_team.png",
    }));

    if (isLoading) return <p>Loading schedule...</p>;
    if (error) return <p className="error">{error}</p>;

    return (
        <div className="chart-container">
            <h2 className="chart-title">{teamName} 2024 Schedule - Points Scored</h2>
            <ResponsiveContainer width="100%" height={400}>
                <BarChart data={formattedData} margin={{ top: 20, right: 30, left: 20, bottom: 50 }}>
                    <XAxis dataKey="week" tick={{ fill: "#333" }} />
                    <YAxis tick={{ fill: "#333" }} />
                    <Tooltip cursor={{ fill: "rgba(0, 0, 0, 0.1)" }} />
                    
                    {/* Home Team Bar with logo above */}
                    <Bar dataKey="homePoints" name="Home" fill="#ffffff">
                        {formattedData.map((game, index) => (
                            <Cell key={`home-${index}`} fill={game.homeColor} />
                        ))}
                    </Bar>

                    {/* Away Team Bar with logo above */}
                    <Bar dataKey="awayPoints" name="Away" fill="#ffffff">
                        {formattedData.map((game, index) => (
                            <Cell key={`away-${index}`} fill={game.awayColor} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>

            {/* 🔥 Custom Team Logos Above Bars */}
            <div className="team-logos-container">
                {formattedData.map((game, index) => (
                    <div key={index} className="team-logos">
                        <img src={game.homeLogo} alt={game.homeTeam} className="team-logo-chart" />
                        <img src={game.awayLogo} alt={game.awayTeam} className="team-logo-chart" />
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TeamScheduleChart;