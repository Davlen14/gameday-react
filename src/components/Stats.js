const Stats = () => {
    const [teamStats, setTeamStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                setLoading(true);

                // Replace "Ohio State" and 2024 with dynamic values if needed
                const stats = await teamsService.getTeamStats("Ohio State", 2024);

                console.log("Fetched Team Stats:", stats); // Debug team stats
                setTeamStats(stats);
            } catch (error) {
                console.error("Error fetching stats:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    if (loading) {
        return <p>Loading...</p>;
    }

    if (!teamStats) {
        return <p>No stats available.</p>;
    }

    return (
        <div className="stats-container">
            <h1 className="stats-header">Ohio State Statistics</h1>

            <div className="stats-grid">
                <div className="stat-card">
                    <h3 className="stat-title">Passing Yards</h3>
                    <p>{teamStats.netPassingYards || "N/A"}</p>
                </div>
                <div className="stat-card">
                    <h3 className="stat-title">Rushing Yards</h3>
                    <p>{teamStats.rushingYards || "N/A"}</p>
                </div>
                <div className="stat-card">
                    <h3 className="stat-title">Total Yards</h3>
                    <p>{teamStats.totalYards || "N/A"}</p>
                </div>
            </div>
        </div>
    );
};