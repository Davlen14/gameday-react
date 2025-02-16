import React, { useState, useEffect, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import teamsService from "../services/teamsService";

const TeamDetail = () => {
  const { teamId } = useParams();
  const [allTeams, setAllTeams] = useState([]);
  const [team, setTeam] = useState(null);
  const [ratings, setRatings] = useState({});
  const [roster, setRoster] = useState([]);
  const [schedule, setSchedule] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("Rankings");
  const [sortOption, setSortOption] = useState("Name");
  const [isLoading, setIsLoading] = useState({
    team: false,
    ratings: false,
    roster: false,
    schedule: false,
  });
  const [error, setError] = useState(null);

  const categories = ["Rankings", "Roster", "Statistics", "Schedule", "News"];
  const sortOptions = ["Name", "Position", "Height", "Year"];

  const styles = {
    container: {
      maxWidth: "1200px",
      margin: "0 auto",
      padding: "2rem",
      fontFamily: "'Titillium Web', sans-serif",
      backgroundColor: "var(--background-color)",
      minHeight: "100vh",
    },
    backLink: {
      display: "block",
      marginBottom: "1rem",
      textDecoration: "none",
      color: "var(--accent-color)",
      fontWeight: "bold",
    },
    header: {
      textAlign: "center",
      marginBottom: "2rem",
    },
    logo: {
      width: "150px",
      height: "150px",
      borderRadius: "50%",
      objectFit: "cover",
      marginBottom: "1rem",
      boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
    },
    categoryButton: (selected) => ({
      marginRight: "0.5rem",
      padding: "0.5rem 1rem",
      border: `1px solid var(--border-color)`,
      background: selected ? "var(--accent-color)" : "var(--primary-color)",
      color: selected ? "var(--primary-color)" : "var(--text-color)",
      borderRadius: "20px",
      cursor: "pointer",
      transition: "background 0.3s, color 0.3s",
      outline: "none",
    }),
    card: {
      background: "var(--primary-color)",
      padding: "1.5rem",
      borderRadius: "8px",
      boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
      marginBottom: "1.5rem",
    },
    rosterItem: {
      display: "flex",
      alignItems: "center",
      padding: "0.75rem 0",
      borderBottom: `1px solid var(--border-color)`,
    },
    rosterItemDetails: {
      display: "flex",
      flexDirection: "column",
    },
    rosterItemName: {
      fontWeight: "bold",
      fontSize: "1rem",
    },
    select: {
      padding: "0.5rem",
      marginBottom: "1rem",
      border: `1px solid var(--border-color)`,
      borderRadius: "4px",
      outline: "none",
    },
    scheduleCard: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "1rem",
      borderRadius: "8px",
      background: "var(--primary-color)",
      boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
      marginBottom: "1rem",
    },
    teamInfo: {
      display: "flex",
      alignItems: "center",
    },
    teamLogoSmall: {
      width: "50px",
      height: "50px",
      borderRadius: "50%",
      objectFit: "cover",
      marginRight: "0.5rem",
    },
    scheduleTeamLogo: {
      width: "50px",
      height: "50px",
      borderRadius: "8px",
      objectFit: "cover",
      marginRight: "0.5rem",
    },
    teamLogoForRoster: {
      width: "40px",
      height: "40px",
      borderRadius: "50%",
      objectFit: "cover",
      marginRight: "1rem",
    },
    vsText: {
      margin: "0 1rem",
      fontWeight: "bold",
    },
    scoreText: (isWinner) => ({
      color: isWinner ? "green" : "red",
      fontWeight: "bold",
    }),
  };

  // Helper function to get a team's logo
  const getTeamLogo = (teamName) => {
    const found = allTeams.find(
      (t) => t.school.toLowerCase() === teamName?.toLowerCase()
    );
    return found?.logos?.[0] || "/photos/default_team.png";
  };

  // Fetch team and related data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading((prev) => ({ ...prev, team: true }));
        const teamsData = await teamsService.getTeams();
        setAllTeams(teamsData);
        const foundTeam = teamsData.find(
          (t) => t.id === parseInt(teamId, 10)
        );
        if (!foundTeam) throw new Error("Team not found");
        setTeam(foundTeam);

        // Fetch related data concurrently
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
        return [...roster].sort((a, b) =>
          a.fullName.localeCompare(b.fullName)
        );
      case "Position":
        return [...roster].sort((a, b) =>
          (a.position || "").localeCompare(b.position || "")
        );
      case "Height":
        return [...roster].sort((a, b) => (a.height || 0) - (b.height || 0));
      case "Year":
        return [...roster].sort((a, b) => (a.year || 0) - (b.year || 0));
      default:
        return roster;
    }
  }, [roster, sortOption]);

  // Format player height from inches to feet and inches
  const formatHeight = (inches) => {
    if (!inches) return "N/A";
    const feet = Math.floor(inches / 12);
    const remainderInches = inches % 12;
    return `${feet}'${remainderInches}"`;
  };

  // Render content based on the selected category
  const renderCategoryContent = () => {
    switch (selectedCategory) {
      case "Rankings":
        return (
          <div style={styles.card}>
            <h2 style={{ marginBottom: "1rem" }}>Ratings</h2>
            {isLoading.ratings ? (
              <p>Loading ratings...</p>
            ) : (
              <>
                <p style={{ fontSize: "1.2rem" }}>
                  Overall Rating: {ratings?.overall || "N/A"}
                </p>
                <p style={{ fontSize: "1.2rem", color: "green" }}>
                  Offense Rating: {ratings?.offense || "N/A"}
                </p>
                <p style={{ fontSize: "1.2rem", color: "red" }}>
                  Defense Rating: {ratings?.defense || "N/A"}
                </p>
              </>
            )}
          </div>
        );

      case "Roster":
        return (
          <div style={styles.card}>
            <h2 style={{ marginBottom: "1rem" }}>Roster</h2>
            {isLoading.roster ? (
              <p>Loading roster...</p>
            ) : (
              <>
                <select
                  onChange={(e) => setSortOption(e.target.value)}
                  value={sortOption}
                  style={styles.select}
                >
                  {sortOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                {sortedRoster.length > 0 ? (
                  sortedRoster.map((player, index) => (
                    <div key={index} style={styles.rosterItem}>
                      <img
                        src={getTeamLogo(team.school)}
                        alt={team.school}
                        style={styles.teamLogoForRoster}
                      />
                      <div style={styles.rosterItemDetails}>
                        <span style={styles.rosterItemName}>
                          {player.fullName}
                        </span>
                        <span>{player.position || "N/A"}</span>
                        <span>Height: {formatHeight(player.height)}</span>
                        <span>Year: {player.year || "N/A"}</span>
                      </div>
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
          <div style={styles.card}>
            <h2 style={{ marginBottom: "1rem" }}>Schedule</h2>
            {isLoading.schedule ? (
              <p>Loading schedule...</p>
            ) : (
              schedule.map((game, index) => (
                <div key={index} style={styles.scheduleCard}>
                  <div style={styles.teamInfo}>
                    <img
                      src={game.homeLogo || getTeamLogo(game.homeTeam)}
                      alt={game.homeTeam}
                      style={styles.scheduleTeamLogo}
                    />
                    <span>{game.homeTeam}</span>
                  </div>
                  <div style={{ flex: 1, textAlign: "center" }}>
                    <span
                      style={{
                        ...styles.scoreText(
                          game.homePoints > game.awayPoints
                        ),
                        marginRight: "0.5rem",
                      }}
                    >
                      {game.homePoints}
                    </span>
                    <span style={{ margin: "0 0.5rem", fontWeight: "bold" }}>
                      -
                    </span>
                    <span
                      style={styles.scoreText(
                        game.awayPoints > game.homePoints
                      )}
                    >
                      {game.awayPoints}
                    </span>
                    <div style={{ fontSize: "0.8rem", color: "#666" }}>
                      {game.venue || "TBD"}
                    </div>
                  </div>
                  <div style={styles.teamInfo}>
                    <img
                      src={game.awayLogo || getTeamLogo(game.awayTeam)}
                      alt={game.awayTeam}
                      style={styles.scheduleTeamLogo}
                    />
                    <span>{game.awayTeam}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        );

      case "News":
        return (
          <div style={styles.card}>
            <h2 style={{ marginBottom: "1rem" }}>News</h2>
            <p>Coming soon...</p>
          </div>
        );

      default:
        return null;
    }
  };

  if (isLoading.team)
    return <div style={styles.container}>Loading...</div>;
  if (error) return <div style={styles.container}>{error}</div>;
  if (!team) return <div style={styles.container}>Team not found</div>;

  return (
    <div style={styles.container}>
      <Link to="/teams" style={styles.backLink}>
        ← Back to All Teams
      </Link>
      <div style={styles.header}>
        <img
          src={team.logos?.[0] || "/photos/default_team.png"}
          alt={team.school}
          style={styles.logo}
          onError={(e) => (e.target.style.display = "none")}
        />
        <h1>{team.school}</h1>
        <p>{team.mascot}</p>
      </div>
      <div style={{ marginBottom: "2rem", textAlign: "center" }}>
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            style={styles.categoryButton(selectedCategory === category)}
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

