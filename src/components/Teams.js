import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import teamsService from "../services/teamsService";

const Teams = () => {
    const [teams, setTeams] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // Group teams by conference
    const groupByConference = (teams) => {
        return teams.reduce((acc, team) => {
            const conference = team.conference;
            if (!acc[conference]) acc[conference] = [];
            acc[conference].push(team);
            return acc;
        }, {});
    };

    // Conference logo mapping
    const conferenceLogos = {
        "ACC": "ACC.png",
        "American Athletic": "American Athletic.png",
        "Big 12": "Big 12.png",
        "Big Ten": "Big Ten.png",
        "Conference USA": "Conference USA.png",
        "FBS Independents": "FBS Independents.png",
        "Mid-American": "Mid-American.png",
        "Mountain West": "Mountain West.png",
        "Pac-12": "Pac-12.png",
        "SEC": "SEC.png"
    };

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

    if (isLoading) return <div className="loading">Loading teams...</div>;
    if (error) return <div className="error">Error: {error}</div>;

    const groupedTeams = groupByConference(teams);

    return (
        <div className="teams-container">
            {/* Conference List (Vertical) */}
            <div className="conferences-list">
                {Object.entries(groupedTeams).map(([conference, teams]) => (
                    <section key={conference} className="conference-section">
                        <div className="conference-header">
                            <img 
                                src={`/photos/${conferenceLogos[conference]}`}
                                alt={conference}
                                className="conference-logo"
                                onError={(e) => { e.target.style.display = 'none'; }}
                            />
                            <h2 className="conference-title">{conference}</h2>
                        </div>

                        {/* Landscape Table Layout for Teams */}
                        <div className="teams-table">
                            {teams.map((team) => (
                                <Link 
                                    key={team.id}
                                    to={`/teams/${team.id}`}
                                    className="team-card"
                                >
                                    <div className="team-content">
                                        <img
                                            src={team.logos?.[0] || "/photos/default-team.png"}
                                            alt={team.school}
                                            className="team-logo"
                                        />
                                        <span className="team-name">{team.school}</span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </section>
                ))}
            </div>

            {/* Embedded CSS */}
            <style>{`
                .teams-container {
                    padding: 2rem;
                    max-width: 1400px;
                    margin: 0 auto;
                }

                /* Conferences are stacked vertically */
                .conferences-list {
                    display: flex;
                    flex-direction: column;
                    gap: 2rem;
                }

                /* Each Conference Block (Landscape Layout) */
                .conference-section {
                    background: white;
                    border-radius: 10px;
                    padding: 1.5rem;
                    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
                    text-align: left;
                }

                /* Conference Header */
                .conference-header {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    border-bottom: 2px solid #ddd;
                    padding-bottom: 0.75rem;
                    margin-bottom: 1rem;
                }

                /* Conference Logo */
                .conference-logo {
                    height: 50px;
                    width: auto;
                }

                /* Conference Title */
                .conference-title {
                    font-size: 1.6rem;
                    color: #333;
                    margin: 0;
                    font-weight: bold;
                }

                /* Landscape Table Layout for Teams */
                .teams-table {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 12px;
                    justify-content: flex-start;
                    padding: 10px;
                }

                /* Bigger Team Cards */
                .team-card {
                    text-decoration: none;
                    color: inherit;
                    background: white;
                    border-radius: 10px;
                    padding: 1rem;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    border: 1px solid #ddd;
                    transition: transform 0.2s ease-in-out;
                    min-width: 180px;
                }

                .team-card:hover {
                    transform: scale(1.05);
                    background: #f9f9f9;
                }

                .team-content {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }

                .team-logo {
                    width: 50px;
                    height: 50px;
                    object-fit: contain;
                }

                .team-name {
                    font-size: 1rem;
                    font-weight: bold;
                    color: #333;
                }

                /* Responsive Styles */
                @media (max-width: 768px) {
                    .teams-table {
                        flex-direction: column;
                        align-items: center;
                    }

                    .conference-title {
                        font-size: 1.4rem;
                    }
                }
            `}</style>
        </div>
    );
};

export default Teams;