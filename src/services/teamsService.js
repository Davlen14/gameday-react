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

// Fetch FBS teams for 2024
export const getTeams = async () => {
    const endpoint = "/teams/fbs"; // Relative endpoint for the API
    const params = { year: 2024 }; // Query parameters for the request
    return await fetchData(endpoint, params); // Call fetchData via the proxy
};

// Fetch polls for 2024
export const getPolls = async () => {
    const endpoint = "/polls";
    const params = { year: 2024 };
    return await fetchData(endpoint, params);
};

export const getGames = async (week) => {
    const endpoint = "/games";
    const params = { year: 2024, week };

    // Fetch all games and filter only FBS games
    const games = await fetchData(endpoint, params);
    return games.filter(
        (game) => game.homeConference && game.awayConference
    );
};

// Fetch betting lines for a specific game
export const getGameLines = async (gameId) => {
    const endpoint = `/lines/${gameId}`;
    return await fetchData(endpoint);
};

// Assign all functions to a single service object for easier usage
const teamsService = {
    getTeams,
    getPolls,
    getGames,
    getGameLines,
};

// Export the service object for use in your components
export default teamsService;