// Proxy-based API interaction for handling CORS
const fetchData = async (endpoint, params = {}) => {
    const url = `/api/proxy`;

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ endpoint, params }),
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error("Fetch Error:", error.message);
        throw error;
    }
};

// Core API interaction functions
export const getGameById = async (gameId) => {
    const endpoint = "/games";
    const params = { id: gameId };
    const response = await fetchData(endpoint, params);
    return response?.[0] || null;
};

export const getTeams = async () => {
    const endpoint = "/teams/fbs";
    const params = { year: 2024 };
    return await fetchData(endpoint, params);
};

export const getGameMedia = async (year, week) => {
    const endpoint = "/games/media";
    const params = { year, week };
    return await fetchData(endpoint, params);
};

export const getGameWeather = async (year, week) => {
    const endpoint = "/games/weather";
    const params = { year, week };
    return await fetchData(endpoint, params);
};

export const getGames = async (week) => {
    const endpoint = "/games";
    const params = {
        year: 2024,
        seasonType: "regular",
        division: "fbs",
        week,
    };
    return await fetchData(endpoint, params);
};

export const getAdvancedBoxScore = async (gameId, week, team, seasonType = "regular") => {
    const endpoint = "/game/box/advanced";
    const params = { gameId, week, team, seasonType };
    return await fetchData(endpoint, params);
};

export const getGameLines = async (year, team = null, seasonType = "regular") => {
    const endpoint = "/lines";
    const params = { year, seasonType };
    if (team) params.team = team;
    return await fetchData(endpoint, params);
};

export const getTeamStats = async (team, year) => {
    const statsEndpoint = "/stats/season"; // API endpoint for team stats
    const params = { year, team }; // Pass the raw team name without extra encoding

    try {
        console.log(`Fetching stats for team: ${team}`);

        // Fetch team stats from the API
        const response = await fetchData(statsEndpoint, params);

        if (!Array.isArray(response) || response.length === 0) {
            console.error(`Unexpected or empty API response for ${team}:`, response);
            // Return default stats if no response or unexpected data
            return {
                netPassingYards: 0,
                rushingYards: 0,
                totalYards: 0,
            };
        }

        console.log(`Raw Team Stats for ${team}:`, response);

        // Filter relevant stats based on your requirements
        const relevantStats = response.filter((stat) =>
            ["netPassingYards", "rushingYards", "totalYards"].includes(stat.statName)
        );

        console.log(`Filtered Stats for ${team}:`, relevantStats);

        // Initialize with default values and populate with actual data
        return relevantStats.reduce((acc, stat) => {
            acc[stat.statName] = stat.statValue;
            return acc;
        }, {
            netPassingYards: 0,
            rushingYards: 0,
            totalYards: 0,
        });
    } catch (error) {
        console.error(`Error fetching stats for ${team}:`, error);

        // Return default values on error
        return {
            netPassingYards: 0,
            rushingYards: 0,
            totalYards: 0,
        };
    }
};

export const getPolls = async (year = 2024, pollType = "ap", week = null) => {
    const endpoint = "/rankings";
    const params = { 
        year, 
        pollType, 
        seasonType: "regular" 
    };

    if (week) params.week = week;

    const data = await fetchData(endpoint, params);

    return data.map(pollGroup => ({
        id: `${pollGroup.season}-${pollGroup.week}-${pollGroup.polls[0].poll.replace(/\s+/g, '-')}`,
        name: pollGroup.polls[0].poll,
        rankings: pollGroup.polls[0].ranks.map(team => ({
            school: team.school,
            conference: team.conference,
            rank: team.rank,
            points: team.points,
            firstPlaceVotes: team.firstPlaceVotes
        }))
    }));
};

export const getPlayByPlay = async (gameId) => {
    const endpoint = "/live/plays";
    const params = { gameId };
    return await fetchData(endpoint, params);
};

// Updated FBS-specific functions
export const getTeamById = async (teamId) => {
    const endpoint = "/teams/fbs";
    const allTeams = await fetchData(endpoint, { year: 2024 });

    const foundTeam = allTeams.find((team) => team.id === parseInt(teamId));
    if (!foundTeam) throw new Error(`Team with ID ${teamId} not found`);

    return foundTeam;
};

export const getTeamRoster = async (team, year = 2024) => {
    const endpoint = "/roster";
    const params = { year, team }; // Ensure `team` is the team name (e.g., "Michigan")
    const response = await fetchData(endpoint, params);

    if (!response || response.length === 0) {
        throw new Error("No roster data found");
    }

    return response.map((player) => ({
        id: player.id || null,
        fullName: `${player.firstName || ""} ${player.lastName || ""}`.trim() || "Unknown Player",
        position: player.position || "N/A",
        height: player.height || "N/A",
        weight: player.weight || "N/A",
        year: player.year || "N/A",
        homeCity: player.homeCity || "N/A",
        homeState: player.homeState || "N/A",
    }));
};

export const getTeamSchedule = async (team, year = 2024) => {
    const endpoint = "/games";
    const params = { year, team, seasonType: "regular", division: "fbs" };
    const response = await fetchData(endpoint, params);

    if (!response || response.length === 0) {
        throw new Error("No schedule data found");
    }

    return response.map((game) => ({
        id: game.id,
        week: game.week,
        date: game.startDate,
        homeTeam: game.homeTeam,
        awayTeam: game.awayTeam,
        homePoints: game.homePoints || 0,
        awayPoints: game.awayPoints || 0,
        venue: game.venue || "TBD",
        conferenceGame: game.conferenceGame,
        neutralSite: game.neutralSite,
    }));
};

export const getTeamRatings = async (team, year = 2024) => {
    const endpoint = "/ratings/sp";
    const params = { year, team }; // Ensure `team` is the team name (e.g., "Michigan")
    const response = await fetchData(endpoint, params);

    if (!response || response.length === 0) {
        throw new Error("No ratings data found");
    }

    const teamData = response.find((item) => item.team === team);
    if (!teamData) {
        throw new Error(`Ratings data not found for team: ${team}`);
    }

    return {
        overall: teamData.rating,
        offense: teamData.offense?.rating || "N/A",
        defense: teamData.defense?.rating || "N/A",
        specialTeams: teamData.specialTeams?.rating || "N/A",
        offenseRank: teamData.offense?.ranking || "N/A",
        defenseRank: teamData.defense?.ranking || "N/A",
    };
};

const getTeamVenue = async (teamId) => {
    const endpoint = "/venues";
    const response = await fetchData(endpoint, { teamId });
    return response?.[0] || null;
};

const getAdvancedStats = async (teamId) => {
    const endpoint = "/stats/season/advanced";
    return await fetchData(endpoint, { team: teamId });
};

const getTeamMatchup = async (team1, team2) => {
    const endpoint = "/teams/matchup";
    return await fetchData(endpoint, { team1, team2 });
};

// NEW ENDPOINTS ADDED FROM SWIFT SERVICE

export const getTeamRecords = async (teamId, year) => {
    const endpoint = "/records";
    const params = { teamId, year };
    return await fetchData(endpoint, params);
};

export const getPlayerSeasonStats = async (year = 2024, category, seasonType = "regular", limit = 10000) => {
    const endpoint = "/stats/player/season";
    const params = { year, category, seasonType, limit };
    return await fetchData(endpoint, params);
};

export const getPlayerGameStats = async (gameId, year, week, seasonType, team, category = null) => {
    const endpoint = "/games/players";
    const params = { gameId, year, week, seasonType, team };
    if (category) params.category = category;
    return await fetchData(endpoint, params);
};

export const fetchScoreboard = async (year, week) => {
    const endpoint = "/games";
    const params = { year, week };
    return await fetchData(endpoint, params);
};

export const getAllRecruits = async (year = 2025) => {
    const endpoint = "/recruiting/players";
    const params = { year };
    return await fetchData(endpoint, params);
};

// Export all functions
const teamsService = {
    getGameById,
    getTeams,
    getGames,
    getGameMedia,
    getGameWeather,
    getAdvancedBoxScore,
    getGameLines,
    getTeamStats,
    getPolls,
    getTeamRatings,
    getPlayByPlay,
    getTeamById,
    getTeamSchedule,
    getTeamRoster,
    getTeamVenue,
    getAdvancedStats,
    getTeamMatchup,
    // New endpoints added
    getTeamRecords,
    getPlayerSeasonStats,
    getPlayerGameStats,
    fetchScoreboard,
};

export default teamsService;
