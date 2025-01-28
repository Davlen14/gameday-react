import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import teamsService from "../services/teamsService";

const TeamDetail = () => {
    const { teamId } = useParams();
    const [team, setTeam] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchTeamData = async () => {
            try {
                setIsLoading(true);
                const teamsData = await teamsService.getTeams();
                const foundTeam = teamsData.find(t => t.id === parseInt(teamId));
                setTeam(foundTeam);
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
        logoContainer: {
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            height: "80vh",
            textAlign: "center"
        },
        logo: {
            width: "300px",
            height: "300px",
            objectFit: "contain",
            marginBottom: "2rem",
            borderRadius: "0.5rem",
            boxShadow: "0 4px 6px rgba(0,0,0,0.1)"
        },
        backButton: {
            marginBottom: "2rem", 
            display: "block", 
            color: "#007bff", 
            textDecoration: "none",
            fontWeight: "500"
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

            <div style={styles.logoContainer}>
                <img
                    src={team.logos?.[0] || ""}
                    alt={team.school}
                    style={styles.logo}
                    onError={(e) => {
                        e.target.style.display = 'none'; // Hide broken images
                    }}
                />
                <h1>{team.school}</h1>
                <p>{team.mascot}</p>
            </div>
        </div>
    );
};

export default TeamDetail;