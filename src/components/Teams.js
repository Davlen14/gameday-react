import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import teamsService from "../services/teamsService";

const Teams = () => {
    const [teams, setTeams] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // New state for selected teams
    const [selectedTeams, setSelectedTeams] = useState([]);

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

    // Fetch teams
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

    // Handle adding/removing teams from comparison
    const handleTeamSelect = (team) => {
        setSelectedTeams((prevSelected) => {
            // If team is already selected, remove it
            if (prevSelected.find((t) => t.id === team.id)) {
                return prevSelected.filter((t) => t.id !== team.id);
            } else {
                // Limit how many teams can be compared at once (e.g., 4)
                if (prevSelected.length < 4) {
                    return [...prevSelected, team];
                } else {
                    // Could show an alert or something similar
                    alert("You can only compare up to 4 teams.");
                    return prevSelected;
                }
            }
        });
    };

    // Clear all selections
    const clearComparison = () => {
        setSelectedTeams([]);
    };

    return (
        <div className="teams-comparison-container">
            {/* Left Column: Teams */}
            <div className="teams-list-section">
                <div className="teams-container">
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

                                {/* Teams in a "table" layout */}
                                <div className="teams-table">
                                    {teams.map((team) => (
                                        <div key={team.id} className="team-card-container">
                                            <Link 
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
                                            {/* Compare Button */}
                                            <button
                                                className="compare-button"
                                                onClick={() => handleTeamSelect(team)}
                                            >
                                                {selectedTeams.find((t) => t.id === team.id)
                                                    ? "Remove"
                                                    : "Compare"}
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right Column: Comparison Panel */}
            <div className="comparison-section">
                <h2>Team Comparison</h2>
                {selectedTeams.length === 0 && (
                    <p>No teams selected. Click "Compare" on a team to add it.</p>
                )}

                {selectedTeams.length > 0 && (
                    <>
                        <button onClick={clearComparison} className="clear-button">
                            Clear All
                        </button>
                        <div className="comparison-table">
                            {selectedTeams.map((team) => (
                                <div key={team.id} className="comparison-card">
                                    <img
                                        src={team.logos?.[0] || "/photos/default-team.png"}
                                        alt={team.school}
                                        className="comparison-team-logo"
                                    />
                                    <div className="comparison-info">
                                        <h3>{team.school}</h3>
                                        <p>Conference: {team.conference}</p>
                                        {/* Add more details if desired, e.g., stats, records, etc. */}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>

            {/* Embedded CSS */}
            <style>{`
                /* Overall Container: Two Columns */
                .teams-comparison-container {
                    display: flex;
                    gap: 1rem;
                    max-width: 1400px;
                    margin: 0 auto;
                    padding: 2rem;
                }

                /* Left Column */
                .teams-list-section {
                    flex: 3;
                }

                /* Right Column */
                .comparison-section {
                    flex: 1;
                    background: #f5f5f5;
                    border-radius: 10px;
                    padding: 1.5rem;
                    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
                    height: fit-content;
                }

                .comparison-section h2 {
                    margin-top: 0;
                }

                .clear-button {
                    margin-bottom: 1rem;
                    background-color: #ff6961;
                    color: #fff;
                    border: none;
                    padding: 0.5rem 1rem;
                    border-radius: 5px;
                    cursor: pointer;
                }

                .comparison-table {
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                }

                .comparison-card {
                    background: #fff;
                    border-radius: 8px;
                    box-shadow: 0 2px 5px rgba(0,0,0,0.1);
                    padding: 1rem;
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                }

                .comparison-team-logo {
                    width: 50px;
                    height: 50px;
                    object-fit: contain;
                }

                .comparison-info h3 {
                    margin: 0;
                    font-size: 1.2rem;
                }

                /* Teams Container (left side) */
                .teams-container {
                    padding: 1rem 0;
                }

                .conferences-list {
                    display: flex;
                    flex-direction: column;
                    gap: 2rem;
                }

                .conference-section {
                    background: white;
                    border-radius: 10px;
                    padding: 1.5rem;
                    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
                    text-align: left;
                    width: 100%;
                }

                .conference-header {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    border-bottom: 2px solid #ddd;
                    padding-bottom: 0.75rem;
                    margin-bottom: 1rem;
                }

                .conference-logo {
                    height: 50px;
                    width: auto;
                }

                .conference-title {
                    font-size: 1.6rem;
                    color: #333;
                    margin: 0;
                    font-weight: bold;
                }

                .teams-table {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 20px;
                    justify-content: flex-start;
                    padding: 20px;
                }

                /* Wrap each team card + button */
                .team-card-container {
                    display: flex;
                    flex-direction: column;
                    align-items: stretch;
                    min-width: 220px;
                    max-width: 240px;
                }

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
                    flex: 1;
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

                .compare-button {
                    margin-top: 0.5rem;
                    background-color: #007bff;
                    color: #fff;
                    border: none;
                    padding: 0.5rem;
                    border-radius: 5px;
                    cursor: pointer;
                }

                .compare-button:hover {
                    background-color: #0056b3;
                }

                /* Responsive Styles */
                @media (max-width: 1024px) {
                    .teams-table {
                        justify-content: center;
                    }
                    .team-card {
                        flex: 1 1 calc(33% - 20px);
                    }
                }

                @media (max-width: 768px) {
                    .team-card {
                        flex: 1 1 calc(50% - 20px);
                    }
                    .conference-title {
                        font-size: 1.4rem;
                    }
                }

                @media (max-width: 480px) {
                    .team-card {
                        flex: 1 1 100%;
                    }
                    .teams-comparison-container {
                        flex-direction: column;
                    }
                    .comparison-section {
                        margin-top: 1rem;
                    }
                }
            `}</style>
        </div>
    );
};

export default Teams;