import React, { useState, useEffect, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import teamsService from "../services/teamsService";

const TeamDetail = () => {
    const { teamId } = useParams();
    const [team, setTeam] = useState(null);
    const [ratings, setRatings] = useState({});
    const [roster, setRoster] = useState([]);
    const [schedule, setSchedule] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState("Rankings");
    const [sortOption, setSortOption] = useState("Name");
    const [isLoading, setIsLoading] = useState({ team: false, ratings: false, roster: false, schedule: false });
    const [error, setError] = useState(null);

    const categories = ["Rankings", "Roster", "Statistics", "Schedule", "News"];
    const sortOptions = ["Name", "Position", "Height", "Year"];

    // Fetch team and related data
    useEffect(() => {
        const fetchData = async () => {
            try {
                setIsLoading((prev) => ({ ...prev, team: true }));

                // Fetch team data
                const teamsData = await teamsService.getTeams();
                const foundTeam = teamsData.find((t) => t.id === parseInt(teamId));
                if (!foundTeam) throw new Error("Team not found");
                setTeam(foundTeam);

                // Fetch related data
                await Promise.all([
                    fetchRatings(foundTeam.school),
                    fetchRoster(foundTeam.school),
                    fetchSchedule(foundTeam.school),
                ]);
            } catch (err) {
                setError(`Error: ${err.message}`);
            } finally {
                setIsLoading((prev) => ({ ...prev, team: false }));
            }
        };

        const fetchRatings = async (teamName) => {
            try {
                setIsLoading((prev) => ({ ...prev, ratings: true }));
                const data = await teamsService.getTeamRatings(teamName, 2024);
                setRatings(data);
            } catch (err) {
                console.error("Error fetching ratings:", err.message);
            } finally {
                setIsLoading((prev) => ({ ...prev, ratings: false }));
            }
        };

        const fetchRoster = async (teamName) => {
            try {
                setIsLoading((prev) => ({ ...prev, roster: true }));
                const data = await teamsService.getTeamRoster(teamName, 2024);
                setRoster(data);
            } catch (err) {
                console.error("Error fetching roster:", err.message);
            } finally {
                setIsLoading((prev) => ({ ...prev, roster: false }));
            }
        };

        const fetchSchedule = async (teamName) => {
            try {
                setIsLoading((prev) => ({ ...prev, schedule: true }));
                const data = await teamsService.getTeamSchedule(teamName, 2024);
                setSchedule(data);
            } catch (err) {
                console.error("Error fetching schedule:", err.message);
            } finally {
                setIsLoading((prev) => ({ ...prev, schedule: false }));
            }
        };

        fetchData();
    }, [teamId]);

    // Sort roster based on the selected option
    const sortedRoster = useMemo(() => {
        switch (sortOption) {
            case "Name":
                return [...roster].sort((a, b) => a.fullName.localeCompare(b.fullName));
            case "Position":
                return [...roster].sort((a, b) => (a.position || "").localeCompare(b.position || ""));
            case "Height":
                return [...roster].sort((a, b) => (a.height || 0) - (b.height || 0));
            case "Year":
                return [...roster].sort((a, b) => (a.year || 0) - (b.year || 0));
            default:
                return roster;
        }
    }, [roster, sortOption]);

    // Render category-specific content
    const renderCategoryContent = () => {
        switch (selectedCategory) {
            case "Rankings":
                return (
                    <div>
                        <h2>Ratings</h2>
                        {isLoading.ratings ? (
                            <p>Loading ratings...</p>
                        ) : (
                            <>
                                <p>Overall Rating: {ratings?.overall || "N/A"}</p>
                                <p style={{ color: "green" }}>Offense Rating: {ratings?.offense || "N/A"}</p>
                                <p style={{ color: "red" }}>Defense Rating: {ratings?.defense || "N/A"}</p>
                            </>
                        )}
                    </div>
                );
            
            case "Roster":
                return (
                    <div>
                        <h2>Roster</h2>
                        {isLoading.roster ? (
                            <p>Loading roster...</p>
                        ) : (
                            <>
                                <select
                                    onChange={(e) => setSortOption(e.target.value)}
                                    value={sortOption}
                                    style={{ marginBottom: "1rem", padding: "0.5rem" }}
                                >
                                    {sortOptions.map((option) => (
                                        <option key={option} value={option}>
                                            {option}
                                        </option>
                                    ))}
                                </select>
                                {sortedRoster.length > 0 ? (
                                    sortedRoster.map((player, index) => (
                                        <div key={index} style={{ padding: "0.5rem", borderBottom: "1px solid #ddd" }}>
                                            <span>
                                                <strong>{player.fullName}</strong> - {player.position || "N/A"}
                                            </span>
                                            <span>Height: {formatHeight(player.height)}</span>
                                            <span>Year: {player.year || "N/A"}</span>
                                        </div>
                                    ))
                                ) : (
                                    <p>No roster data available.</p>
                                )}
                            </>
                        )}
                    </div>
                );
            case "Schedule":
                return (
                    <div>
                        <h2>Schedule</h2>
                        {isLoading.schedule ? (
                            <p>Loading schedule...</p>
                        ) : (
                            schedule.map((game, index) => (
                                <div key={index} style={{ padding: "1rem", borderBottom: "1px solid #ddd" }}>
                                    <p>
                                        {game.homeTeam} vs {game.awayTeam} - {" "}
                                        <span style={{ color: game.homePoints > game.awayPoints ? "green" : "red" }}>
                                            {game.homePoints} - {game.awayPoints}
                                        </span>
                                    </p>
                                    <p>Venue: {game.venue || "TBD"}</p>
                                </div>
                            ))
                        )}
                    </div>
                );
            case "News":
                return (
                    <div>
                        <h2>News</h2>
                        <p>Coming soon...</p>
                    </div>
                );
            default:
                return null;
        }
    };

    const formatHeight = (inches) => {
        if (!inches) return "N/A";
        const feet = Math.floor(inches / 12);
        const remainderInches = inches % 12;
        return `${feet}'${remainderInches}"`;
    };

    if (isLoading.team) return <div>Loading...</div>;
    if (error) return <div>{error}</div>;
    if (!team) return <div>Team not found</div>;

    return (
        <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "2rem" }}>
            <Link to="/teams" style={{ display: "block", marginBottom: "1rem" }}>
                ← Back to All Teams
            </Link>
            <div style={{ textAlign: "center" }}>
                <img
                    src={team.logos?.[0] || ""}
                    alt={team.school}
                    style={{ width: "200px", height: "200px", borderRadius: "50%", marginBottom: "1rem" }}
                    onError={(e) => (e.target.style.display = "none")}
                />
                <h1>{team.school}</h1>
                <p>{team.mascot}</p>
            </div>
            <div style={{ marginBottom: "2rem" }}>
                {categories.map((category) => (
                    <button
                        key={category}
                        onClick={() => setSelectedCategory(category)}
                        style={{
                            marginRight: "0.5rem",
                            padding: "0.5rem 1rem",
                            border: "1px solid #ddd",
                            background: selectedCategory === category ? "#007bff" : "#fff",
                            color: selectedCategory === category ? "#fff" : "#000",
                            borderRadius: "4px",
                        }}
                    >
                        {category}
                    </button>
                ))}
            </div>
            {renderCategoryContent()}
        </div>
    );
};

export default TeamDetail;

