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

    // Conference logo mapping with proper file names
    const conferenceLogos = {
        "ACC": "ACC.png",
        "American Athletic": "American Athletic.png",
        "Big 12": "Big 12.png",
        "Big Ten": "Big Ten.png",
        "Conference USA": "Conference USA.png",
        "FBS Independents": "FBS Indep...dents.png",
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
            
            {Object.entries(groupedTeams).map(([conference, teams]) => (
                <section key={conference} className="conference-section">
                    <div className="conference-header">
                        <img 
                            src={`/photos/${conferenceLogos[conference]}`}
                            alt={conference}
                            className="conference-logo"
                            onError={(e) => {
                                e.target.style.display = 'none';
                            }}
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
    );
};

export default Teams;

// Add this CSS to your stylesheet
const styles = `
.teams-container {
    padding: 2rem;
    max-width: 1400px;
    margin: 0 auto;
}

.page-title {
    text-align: center;
    font-size: 2.5rem;
    margin-bottom: 3rem;
    color: #1a1a1a;
    letter-spacing: -0.05em;
}

.conference-section {
    margin-bottom: 4rem;
    background: linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%);
    border-radius: 20px;
    padding: 2rem;
    box-shadow: 0 10px 30px rgba(0,0,0,0.08);
}

.conference-header {
    text-align: center;
    margin-bottom: 2rem;
    padding-bottom: 1.5rem;
    border-bottom: 2px solid #e0e0e0;
}

.conference-logo {
    height: 80px;
    margin: 0 auto 1rem;
    filter: drop-shadow(0 2px 4px rgba(0,0,0,0.1));
}

.conference-title {
    font-size: 1.8rem;
    color: #2c3e50;
    margin: 0.5rem 0;
}

.teams-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 1.5rem;
    padding: 1rem;
}

.team-card {
    text-decoration: none;
    color: inherit;
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    background: white;
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 4px 12px rgba(0,0,0,0.08);
}

.team-card:hover {
    transform: translateY(-5px);
}

.card-content {
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    height: 100%;
}

.team-logo {
    width: 120px;
    height: 120px;
    object-fit: contain;
    margin-bottom: 1.2rem;
    filter: drop-shadow(0 2px 4px rgba(0,0,0,0.1));
}

.team-info {
    text-align: center;
}

.team-info h3 {
    margin: 0 0 0.5rem;
    font-size: 1.1rem;
    color: #1a1a1a;
}

.location {
    color: #6c757d;
    font-size: 0.9rem;
    margin: 0;
}

.loading, .error {
    text-align: center;
    padding: 2rem;
    font-size: 1.2rem;
}
`;

// Inject styles
document.head.insertAdjacentHTML('beforeend', `<style>${styles}</style>`);