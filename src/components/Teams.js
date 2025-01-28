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
            <h1 className="page-title">FBS Teams by Conference</h1>

            {/* Conference Grid - Ensures multiple columns */}
            <div className="conferences-grid">
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

                        <div className="teams-grid">
                            {teams.map((team) => (
                                <Link 
                                    key={team.id}
                                    to={`/teams/${team.id}`}
                                    className="team-card"
                                >
                                    <div className="card-content">
                                        <img
                                            src={team.logos?.[0] || "/photos/default-team.png"}
                                            alt={team.school}
                                            className="team-logo"
                                        />
                                        <div className="team-info">
                                            <h3>{team.school}</h3>
                                            <p className="location">
                                                {team.location.city}, {team.location.state}
                                            </p>
                                        </div>
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
                    text-align: center;
                }

                /* Title stays centered */
                .page-title {
                    font-size: 2.5rem;
                    margin-bottom: 3rem;
                    color: #1a1a1a;
                    letter-spacing: -0.05em;
                }

                /* Conferences grid - Each conference is in a multi-column layout */
                .conferences-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
                    gap: 2rem;
                    justify-content: center;
                }

                /* Each Conference Block */
                .conference-section {
                    background: linear-gradient(145deg, #ffffff, #f8f9fa);
                    border-radius: 16px;
                    padding: 2rem;
                    box-shadow: 0 5px 15px rgba(0,0,0,0.1);
                    text-align: center;
                }

                /* Conference Header */
                .conference-header {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 1rem;
                    border-bottom: 2px solid #ddd;
                    padding-bottom: 1rem;
                    margin-bottom: 1.5rem;
                }

                /* Conference Logo */
                .conference-logo {
                    height: 50px;
                    width: auto;
                }

                /* Conference Title */
                .conference-title {
                    font-size: 1.5rem;
                    color: #2c3e50;
                    margin: 0;
                }

                /* Grid for Teams Inside a Conference */
                .teams-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 1rem;
                }

                /* Team Cards */
                .team-card {
                    text-decoration: none;
                    color: inherit;
                    background: white;
                    border-radius: 12px;
                    overflow: hidden;
                    box-shadow: 0 4px 8px rgba(0,0,0,0.08);
                    transition: transform 0.3s ease-in-out;
                }

                .team-card:hover {
                    transform: scale(1.05);
                }

                .card-content {
                    padding: 1rem;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                }

                .team-logo {
                    width: 80px;
                    height: 80px;
                    object-fit: contain;
                    margin-bottom: 0.75rem;
                }

                .team-info {
                    text-align: center;
                }

                .team-info h3 {
                    font-size: 1.1rem;
                    margin: 0;
                }

                .location {
                    color: #6c757d;
                    font-size: 0.9rem;
                }
            `}</style>
        </div>
    );
};

export default Teams;