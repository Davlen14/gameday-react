import React, { useState, useEffect } from "react";
import teamsService from "../services/teamsService";

const Stats = () => {
    const [teamStats, setTeamStats] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                setLoading(true);

                // 1️⃣ Fetch all FBS teams
                const allTeams = await teamsService.getTeams();
                const fbsTeams = allTeams.filter((team) => team.division === "fbs");

                console.log("Fetched FBS Teams:", fbsTeams.map((t) => t.school));

                // 2️⃣ Fetch stats for each team
                const statsPromises = fbsTeams.map(async (team) => {
                    try {
                        const encodedTeam = encodeURIComponent(team.school); // Encode team name
                        console.log(`Fetching stats for team: ${team.school} (Encoded: ${encodedTeam})`);

                        const stats = await teamsService.getTeamStats(encodedTeam, 2024);

                        console.log(`API Request Payload for ${team.school}:`, {
                            endpoint: "/stats/season",
                            params: { year: 2024, team: encodedTeam },
                        });

                        console.log(`API Response for ${team.school}:`, stats);

                        return {
                            name: team.school,
                            stats,
                        };
                    } catch (error) {
                        console.error(`Failed to fetch stats for ${team.school}:`, error);
                        return { name: team.school, stats: null };
                    }
                });

                const results = await Promise.allSettled(statsPromises);
                const stats = results
                    .filter((result) => result.status === "fulfilled")
                    .map((result) => result.value);

                console.log("Fetched Team Stats:", stats);
                setTeamStats(stats);
            } catch (error) {
                console.error("Error fetching team stats:", error);
                setError("Failed to load team stats.");
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
            <h1>College Football Stats</h1>

            <h2>Team Offense</h2>
            <table border="1">
                <thead>
                    <tr>
                        <th>Team</th>
                        <th>Passing Yards</th>
                        <th>Rushing Yards</th>
                        <th>Total Yards</th>
                    </tr>
                </thead>
                <tbody>
                    {teamStats.map((team) => (
                        <tr key={team.name}>
                            <td>{team.name}</td>
                            <td>
                                {team.stats?.netPassingYards ?? "N/A"}
                                {team.stats === null && <span> ❌ No Data</span>}
                            </td>
                            <td>
                                {team.stats?.rushingYards ?? "N/A"}
                                {team.stats === null && <span> ❌ No Data</span>}
                            </td>
                            <td>
                                {team.stats?.totalYards ?? "N/A"}
                                {team.stats === null && <span> ❌ No Data</span>}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default Stats;