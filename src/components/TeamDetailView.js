import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import teamsService from "../services/teamsService";

const TeamDetail = () => {
    const { teamId } = useParams();
    const [team, setTeam] = useState(null);
    const [roster, setRoster] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchTeamData = async () => {
            try {
                setIsLoading(true);
                const [teamData, rosterData] = await Promise.all([
                    teamsService.getTeamDetails(teamId),
                    teamsService.getTeamRoster(teamId)
                ]);
                
                setTeam(teamData);
                setRoster(rosterData);
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
            fontFamily: "'Segoe UI', sans-serif",
            minHeight: "100vh"
        },
        header: {
            textAlign: "center",
            marginBottom: "3rem"
        },
        logo: {
            width: "200px",
            height: "200px",
            objectFit: "contain",
            marginBottom: "1rem",
            borderRadius: "0.5rem",
            boxShadow: "0 4px 6px rgba(0,0,0,0.1)"
        },
        backButton: {
            marginBottom: "2rem", 
            display: "block", 
            color: "#007bff", 
            textDecoration: "none",
            fontWeight: "500"
        },
        section: {
            margin: "3rem 0",
            padding: "2rem",
            backgroundColor: "#fff",
            borderRadius: "1rem",
            boxShadow: "0 2px 4px rgba(0,0,0,0.05)"
        },
        rosterGrid: {
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
            gap: "1rem",
            marginTop: "1.5rem"
        },
        playerCard: {
            padding: "1rem",
            border: "1px solid #eee",
            borderRadius: "0.5rem",
            "&:hover": {
                backgroundColor: "#f8f9fa"
            }
        }
    };

    if (isLoading) return <div style={styles.container}>Loading...</div>;
    if (error) return <div style={styles.container}>Error: {error}</div>;
    if (!team) return <div style={styles.container}>Team not found</div>;

    return (
        <div style={styles.container}>
            <Link to="/teams" style={styles.backButton}>
                ← Back to All Teams
            </Link>

            <div style={styles.header}>
                <img
                    src={team.logos?.[0] || ""}
                    alt={team.school}
                    style={styles.logo}
                    onError={(e) => {
                        e.target.style.display = 'none';
                    }}
                />
                <h1>{team.school}</h1>
                <p style={{ color: "#666" }}>{team.mascot}</p>
            </div>

            {/* Roster Section */}
            <div style={styles.section}>
                <h2>Team Roster</h2>
                <div style={styles.rosterGrid}>
                    {roster.map(player => (
                        <div key={player.id} style={styles.playerCard}>
                            <div style={{ fontWeight: "600" }}>
                                #{player.jersey} {player.name}
                            </div>
                            <div style={{ color: "#666", marginTop: "0.5rem" }}>
                                <div>Position: {player.position || 'N/A'}</div>
                                <div>Class: {player.class || 'N/A'}</div>
                                <div>Height: {player.height || 'N/A'}</div>
                                <div>Weight: {player.weight || 'N/A'} lbs</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Mock Sections for Future Development */}
            <div style={styles.section}>
                <h2>Season Stats (Mock Data)</h2>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginTop: '1rem' }}>
                    <div>
                        <h3>Offense</h3>
                        <p>Points/Game: 32.4</p>
                        <p>Total Yards: 458.2</p>
                    </div>
                    <div>
                        <h3>Defense</h3>
                        <p>Points Allowed/Game: 18.7</p>
                        <p>Sacks: 32</p>
                    </div>
                </div>
            </div>

            <div style={styles.section}>
                <h2>Upcoming Schedule (Mock Data)</h2>
                <div style={{ marginTop: '1rem' }}>
                    {[1, 2, 3].map((_, i) => (
                        <div key={i} style={{ 
                            padding: '1rem', 
                            borderBottom: '1px solid #eee',
                            display: 'flex',
                            justifyContent: 'space-between'
                        }}>
                            <div>Week {i + 1}</div>
                            <div>vs. Opponent {i + 1}</div>
                            <div>9/{i + 10}/2024</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default TeamDetail;