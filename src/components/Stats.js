import React, { useState, useEffect } from "react";
import teamsService from "../services/teamsService";

const Stats = () => {
    const [ohioStateStats, setOhioStateStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                setLoading(true);

                console.log("Fetching stats for Ohio State...");

                // Fetch stats for Ohio State (team name passed as-is)
                const stats = await teamsService.getTeamStats("Ohio State", 2024);

                console.log("API Response for Ohio State:", stats);

                setOhioStateStats(stats);
            } catch (error) {
                console.error("Error fetching stats for Ohio State:", error);
                setError("Failed to load Ohio State stats.");
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    if (loading) return <p>Loading...</p>;
    if (error) return <p>{error}</p>;

    return (
        <div>
            <h1>Ohio State Football Stats</h1>

            <h2>Team Offense</h2>
            <table border="1">
                <thead>
                    <tr>
                        <th>Stat</th>
                        <th>Value</th>
                    </tr>
                </thead>
                <tbody>
                    {ohioStateStats ? (
                        Object.entries(ohioStateStats).map(([statName, statValue]) => (
                            <tr key={statName}>
                                <td>{statName}</td>
                                <td>{statValue ?? "N/A"}</td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan="2">No data available for Ohio State.</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default Stats;