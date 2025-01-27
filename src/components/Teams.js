import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import teamsService from "../services/teamsService";

const Teams = () => {
    const [teams, setTeams] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchTeams = async () => {
            try {
                setIsLoading(true);
                const teamsData = await teamsService.getTeams();
                setTeams(teamsData);
            } catch (err) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchTeams();
    }, []);

    if (isLoading) return <p>Loading teams...</p>;
    if (error) return <p>Error: {error}</p>;

    return (
        <div style={{ padding: "20px" }}>
            <h1 style={{ textAlign: "center", marginBottom: "30px" }}>FBS Teams</h1>
            <div style={{ 
                display: "grid", 
                gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                gap: "20px",
                maxWidth: "1200px",
                margin: "0 auto"
            }}>
                {teams.map((team) => (
                    <Link 
                        key={team.id}
                        to={`/teams/${team.id}`}
                        style={{ 
                            textDecoration: "none",
                            color: "inherit",
                            transition: "transform 0.2s ease",
                            ":hover": {
                                transform: "translateY(-5px)"
                            }
                        }}
                    >
                        <div
                            style={{
                                border: "1px solid #e0e0e0",
                                padding: "15px",
                                borderRadius: "12px",
                                textAlign: "center",
                                backgroundColor: "white",
                                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                                cursor: "pointer",
                                height: "100%",
                                display: "flex",
                                flexDirection: "column",
                                justifyContent: "space-between"
                            }}
                        >
                            <img
                                src={team.logos ? team.logos[0] : ""}
                                alt={team.school}
                                style={{ 
                                    width: "100px", 
                                    height: "100px", 
                                    objectFit: "contain",
                                    margin: "0 auto 15px"
                                }}
                            />
                            <h3 style={{ 
                                margin: "0 0 8px",
                                color: "#2c3e50",
                                fontSize: "1.1rem"
                            }}>
                                {team.school}
                            </h3>
                            <p style={{ 
                                margin: "0 0 8px",
                                color: "#7f8c8d",
                                fontSize: "0.9rem"
                            }}>
                                {team.conference}
                            </p>
                            <p style={{ 
                                margin: 0,
                                color: "#95a5a6",
                                fontSize: "0.8rem"
                            }}>
                                <small>
                                    {team.location.city}, {team.location.state}
                                </small>
                            </p>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
};

export default Teams;