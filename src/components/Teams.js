import React, { useState, useEffect } from "react";
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
        <div>
            <h1>FBS Teams</h1>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "20px" }}>
                {teams.map((team) => (
                    <div
                        key={team.id}
                        style={{
                            border: "1px solid #ccc",
                            padding: "10px",
                            borderRadius: "8px",
                            textAlign: "center",
                            width: "150px",
                        }}
                    >
                        <img
                            src={team.logos ? team.logos[0] : ""}
                            alt={team.school}
                            style={{ width: "100px", height: "100px", objectFit: "contain" }}
                        />
                        <h3>{team.school}</h3>
                        <p>{team.conference}</p>
                        <p>
                            <small>
                                Location: {team.location.city}, {team.location.state}
                            </small>
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Teams;