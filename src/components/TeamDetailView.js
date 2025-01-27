import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import teamsService from "../services/teamsService";

const TeamDetail = () => {
    const { teamId } = useParams();
    const [team, setTeam] = useState(null);
    const [schedule, setSchedule] = useState([]);
    const [roster, setRoster] = useState([]);
    const [venue, setVenue] = useState(null);
    const [activeTab, setActiveTab] = useState("overview");
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchTeamData = async () => {
            try {
                setIsLoading(true);
                const teamData = await teamsService.getTeamDetails(teamId);
                const scheduleData = await teamsService.getTeamSchedule(teamId);
                const rosterData = await teamsService.getTeamRoster(teamId);
                const venueData = await teamsService.getTeamVenue(teamId);

                setTeam(teamData);
                setSchedule(scheduleData);
                setRoster(rosterData);
                setVenue(venueData);
            } catch (err) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchTeamData();
    }, [teamId]);

    const styles = {
        container: {
            maxWidth: "1200px",
            margin: "0 auto",
            padding: "2rem",
            fontFamily: "'Segoe UI', sans-serif"
        },
        header: {
            display: "grid",
            gridTemplateColumns: "auto 1fr",
            gap: "2rem",
            alignItems: "center",
            marginBottom: "2rem",
            background: "#f8f9fa",
            padding: "2rem",
            borderRadius: "1rem",
            boxShadow: "0 4px 6px rgba(0,0,0,0.1)"
        },
        logo: {
            width: "150px",
            height: "150px",
            objectFit: "contain",
            borderRadius: "0.5rem"
        },
        tabs: {
            display: "flex",
            gap: "1rem",
            marginBottom: "2rem",
            borderBottom: "2px solid #eee",
            paddingBottom: "1rem"
        },
        tabButton: {
            padding: "0.75rem 1.5rem",
            borderRadius: "0.5rem",
            border: "none",
            background: "none",
            cursor: "pointer",
            transition: "all 0.2s ease",
            fontWeight: "600"
        },
        activeTab: {
            background: "#007bff",
            color: "white"
        },
        card: {
            background: "white",
            borderRadius: "1rem",
            padding: "2rem",
            boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
            marginBottom: "2rem"
        },
        grid: {
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
            gap: "1.5rem"
        },
        scheduleItem: {
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "1rem",
            borderBottom: "1px solid #eee",
            "&:last-child": {
                borderBottom: "none"
            }
        },
        rosterItem: {
            display: "flex",
            alignItems: "center",
            gap: "1rem",
            padding: "1rem",
            background: "#f8f9fa",
            borderRadius: "0.5rem"
        }
    };

    if (isLoading) return <div style={styles.container}>Loading team details...</div>;
    if (error) return <div style={styles.container}>Error: {error}</div>;
    if (!team) return <div style={styles.container}>Team not found</div>;

    return (
        <div style={styles.container}>
            <Link to="/teams" style={{ marginBottom: "2rem", display: "block", color: "#007bff", textDecoration: "none" }}>
                ← Back to Teams
            </Link>

            <div style={styles.header}>
                <img
                    src={team.logos?.[0] || ""}
                    alt={team.school}
                    style={styles.logo}
                />
                <div>
                    <h1 style={{ margin: "0 0 0.5rem", fontSize: "2.5rem" }}>{team.school}</h1>
                    <p style={{ fontSize: "1.25rem", color: "#666", margin: "0 0 1rem" }}>
                        {team.mascot} | {team.conference}
                    </p>
                    <div style={{ display: "flex", gap: "1rem", color: "#444" }}>
                        <div>
                            <strong>Location</strong>
                            <p>{venue?.city}, {venue?.state}</p>
                        </div>
                        <div>
                            <strong>Stadium</strong>
                            <p>{venue?.name} ({venue?.capacity?.toLocaleString()} seats)</p>
                        </div>
                    </div>
                </div>
            </div>

            <div style={styles.tabs}>
                {["overview", "schedule", "roster", "stats"].map((tab) => (
                    <button
                        key={tab}
                        style={{
                            ...styles.tabButton,
                            ...(activeTab === tab ? styles.activeTab : {})
                        }}
                        onClick={() => setActiveTab(tab)}
                    >
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                ))}
            </div>

            {activeTab === "overview" && (
                <div style={styles.grid}>
                    <div style={styles.card}>
                        <h2 style={{ marginTop: 0 }}>Team Information</h2>
                        <p><strong>Colors:</strong> {team.colors?.join(", ")}</p>
                        <p><strong>Head Coach:</strong> {team.coaches?.[0]?.name}</p>
                        <p><strong>Conference Championships:</strong> {team.conferenceChampionships}</p>
                    </div>

                    <div style={styles.card}>
                        <h2>Stadium Details</h2>
                        <p><strong>Surface:</strong> {venue?.surface}</p>
                        <p><strong>Built:</strong> {venue?.built}</p>
                        <p><strong>Location:</strong> {venue?.address}</p>
                    </div>
                </div>
            )}

            {activeTab === "schedule" && (
                <div style={styles.card}>
                    <h2 style={{ marginTop: 0 }}>2024 Schedule</h2>
                    <div>
                        {schedule.map((game) => (
                            <div key={game.id} style={styles.scheduleItem}>
                                <div>
                                    <strong>{new Date(game.date).toLocaleDateString()}</strong>
                                    <div>{game.away_team} @ {game.home_team}</div>
                                </div>
                                <div>{game.home_score} - {game.away_score}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {activeTab === "roster" && (
                <div style={styles.card}>
                    <h2 style={{ marginTop: 0 }}>Team Roster</h2>
                    <div style={styles.grid}>
                        {roster.map((player) => (
                            <div key={player.id} style={styles.rosterItem}>
                                <div>
                                    <div><strong>{player.name}</strong></div>
                                    <div>{player.position} | #{player.jersey}</div>
                                    <div>{player.class} • {player.height}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {activeTab === "stats" && (
                <div style={styles.card}>
                    <h2 style={{ marginTop: 0 }}>Season Statistics</h2>
                    <div style={styles.grid}>
                        <div>
                            <h3>Offense</h3>
                            <p>Points/Game: {team.stats?.offense?.pointsPerGame}</p>
                            <p>Yards/Game: {team.stats?.offense?.yardsPerGame}</p>
                        </div>
                        <div>
                            <h3>Defense</h3>
                            <p>Points Allowed/Game: {team.stats?.defense?.pointsAllowedPerGame}</p>
                            <p>Yards Allowed/Game: {team.stats?.defense?.yardsAllowedPerGame}</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TeamDetail;