const BASE_URL = "https://apinext.collegefootballdata.com";
const API_KEY = "XB5Eui0++wuuyh5uZ2c+UJY4jmLKQ2jxShzJXZaM9ET21a1OgubV4/mFlCxzsBIQ"; // Replace with your actual API key

// Generic function to fetch data from the API
const fetchData = async (endpoint, params = {}) => {
    const url = new URL(`${BASE_URL}${endpoint}`);
    Object.keys(params).forEach((key) => url.searchParams.append(key, params[key]));

    try {
        const response = await fetch(url, {
            headers: {
                Authorization: `Bearer ${API_KEY}`,
            },
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

// Fetch FBS teams for 2024
const getTeams = async () => {
    const endpoint = "/teams/fbs";
    const params = { year: 2024 };
    return await fetchData(endpoint, params);
};

// Fetch polls for 2024
const getPolls = async () => {
    return await fetchData("/polls", { year: 2024 });
};

// Fetch games for a specific week in 2024
const getGames = async (week) => {
    return await fetchData("/games", { year: 2024, week });
};

// Fetch betting lines for a specific game
const getGameLines = async (gameId) => {
    return await fetchData(`/lines/${gameId}`);
};

// Assign the object to a variable first
const teamsService = {
    getPolls,
    getGames,
    getGameLines,
    getTeams,
};

// Export the named object
export default teamsService;