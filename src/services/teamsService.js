// Proxy-based API interaction for handling CORS
const fetchData = async (endpoint, params = {}) => {
    const url = `/api/proxy`; // Use the proxy route for all requests

    try {
        const response = await fetch(url, {
            method: "POST", // Use POST to send the request via proxy
            headers: {
                "Content-Type": "application/json", // Send JSON data
            },
            body: JSON.stringify({ endpoint, params }), // Forward endpoint and parameters
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }

        return await response.json(); // Parse the JSON response
    } catch (error) {
        console.error("Fetch Error:", error.message);
        throw error;
    }
};

// Fetch FBS teams for a specific year
export const getTeams = async () => {
    const endpoint = "/teams/fbs";
    const params = { year: 2024 };
    return await fetchData(endpoint, params);
};

// Fetch game media for a given year and week
export const getGameMedia = async (year, week) => {
    const endpoint = "/games/media";
    const params = { year, week };
    return await fetchData(endpoint, params);
};

// Fetch game weather for a given year and week
export const getGameWeather = async (year, week) => {
    const endpoint = "/games/weather";
    const params = { year, week };
    return await fetchData(endpoint, params);
};

// Fetch games for a specific year, week, and division
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

// Fetch advanced box score for a specific game
export const getAdvancedBoxScore = async (gameId, week, team, seasonType = "regular") => {
    const endpoint = "/game/box/advanced";
    const params = { gameId, week, team, seasonType };
    return await fetchData(endpoint, params);
};

// Fetch betting lines for a specific game or team
export const getGameLines = async (year, team = null, seasonType = "regular") => {
    const endpoint = "/lines";
    const params = { year, seasonType };
    if (team) params.team = team;
    return await fetchData(endpoint, params);
};

// Fetch team stats for a specific year and team
export const getTeamStats = async (team, year) => {
    const endpoint = "/stats/team";
    const params = { year, team };
    return await fetchData(endpoint, params);
};

// Fetch team polls for a specific year, season type, and optional week
export const getPolls = async (year, seasonType = "regular", week = null) => {
    const endpoint = "/rankings";
    const params = { year, seasonType };
    if (week) params.week = week;
    return await fetchData(endpoint, params);
};

// Fetch play-by-play data for a specific game
export const getPlayByPlay = async (gameId) => {
    const endpoint = "/live/plays";
    const params = { gameId };
    return await fetchData(endpoint, params);
};

// Export all functions as a service
const teamsService = {
    getTeams,
    getGames,
    getGameMedia,
    getGameWeather,
    getAdvancedBoxScore,
    getGameLines,
    getTeamStats,
    getPolls,
    getPlayByPlay,
};

export default teamsService;