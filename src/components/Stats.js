import React, { useState, useEffect } from "react";
import teamsService from "../services/teamsService";

const Stats = () => {
    const [allTeamStats, setAllTeamStats] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchAllStats = async () => {
            try {
                setLoading(true);
                console.log("Fetching list of teams...");
        
                const teams = await teamsService.getTeams(); // Fetch all teams
        
                console.log("Teams fetched:", teams);
        
                const allStats = [];
        
                for (const team of teams) {
                    try {
                        console.log(`Fetching stats for ${team.school} (ID: ${team.id})...`);
        
                        // Add a delay between each request (250ms)
                        const stats = await new Promise((resolve) =>
                            setTimeout(async () => {
                                const data = await teamsService.getTeamStats(team.id, 2024); // Use ID instead of name
                                resolve(data);
                            }, 250)
                        );
        
                        allStats.push({ team: team.school, stats });
                    } catch (err) {
                        console.error(`Error fetching stats for ${team.school}:`, err);
                        allStats.push({ team: team.school, stats: null });
                    }
                }
        
                console.log("All Team Stats:", allStats);
                setAllTeamStats(allStats);
            } catch (error) {
                console.error("Error fetching team stats:", error);
                setError("Failed to load team stats.");
            } finally {
                setLoading(false);
            }
        };

        fetchAllStats();
    }, []);

    if (loading) return <p>Loading...</p>;
    if (error) return <p>{error}</p>;

    return (
        <div>
            <h1>College Football Stats (2024)</h1>

            {allTeamStats.length > 0 ? (
                allTeamStats.map(({ team, stats }) => (
                    <div key={team}>
                        <h2>{team}</h2>
                        {stats ? (
                            <table border="1">
                                <thead>
                                    <tr>
                                        <th>Stat</th>
                                        <th>Value</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {Object.entries(stats).map(([statName, statValue]) => (
                                        <tr key={statName}>
                                            <td>{statName}</td>
                                            <td>{statValue ?? "N/A"}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <p>No stats available for {team}.</p>
                        )}
                    </div>
                ))
            ) : (
                <p>No team stats available.</p>
            )}
        </div>
    );
};

export default Stats;