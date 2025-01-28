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
                const teamData = await teamsService.getTeamDetails(teamId);
                setTeam(teamData);
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
            justifyContent: "center",
            alignItems: "center",
            height: "80vh"
        },
        logo: {
            width: "300px",
            height: "300px",
            objectFit: "contain",
            borderRadius: "0.5rem",
            boxShadow: "0 4px 6px rgba(0,0,0,0.1)"
        }
    };

    if (isLoading) return <div style={styles.container}>Loading...</div>;
    if (error) return <div style={styles.container}>Error: {error}</div>;
    if (!team) return <div style={styles.container}>Team not found</div>;

    return (
        <div style={styles.container}>
            <Link to="/teams" style={{ 
                marginBottom: "2rem", 
                display: "block", 
                color: "#007bff", 
                textDecoration: "none",
                fontWeight: "500"
            }}>
                ← Back to All Teams
            </Link>

            <div style={styles.logoContainer}>
                <img
                    src={team.logos?.[0] || ""}
                    alt={team.school}
                    style={styles.logo}
                />
            </div>
        </div>
    );
};

export default TeamDetail;