import React, { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
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

    const getTeamColor = (team) => {
        const teamData = teams.find(t => t.school.toLowerCase() === team.toLowerCase());
        return teamData?.color || "#999999"; // Default gray if not found
    };

    // Ensure all games have valid points
    const formattedData = schedule.map(game => ({
        week: `Week ${game.week}`,
        [game.homeTeam]: game.homePoints || 0,  // Dynamic team names as data keys
        [game.awayTeam]: game.awayPoints || 0,  
        homeColor: getTeamColor(game.homeTeam),
        awayColor: getTeamColor(game.awayTeam),
    }));

    if (isLoading) return <p>Loading schedule...</p>;
    if (error) return <p className="error">{error}</p>;

    return (
        <div className="chart-container">
            <h2 className="chart-title">{teamName} 2024 Schedule - Points Scored</h2>
            <ResponsiveContainer width="100%" height={400}>
                <BarChart data={formattedData} margin={{ top: 20, right: 30, left: 20, bottom: 30 }}>
                    <XAxis dataKey="week" tick={{ fill: "#333" }} />
                    <YAxis tick={{ fill: "#333" }} />
                    <Tooltip cursor={{ fill: "rgba(0, 0, 0, 0.1)" }} />
                    <Legend />
                    
                    {/* 🔥 Dynamically create bars for each team based on game data */}
                    {schedule.length > 0 && (
                        <>
                            <Bar dataKey={schedule[0].homeTeam} name={schedule[0].homeTeam} fill={formattedData[0].homeColor} />
                            <Bar dataKey={schedule[0].awayTeam} name={schedule[0].awayTeam} fill={formattedData[0].awayColor} />
                        </>
                    )}
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

export default TeamScheduleChart;