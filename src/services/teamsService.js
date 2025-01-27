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

// Existing core functions
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
    const endpoint = "/stats/team";
    const params = { year, team };
    return await fetchData(endpoint, params);
};

export const getPolls = async (year = 2024, pollType = 'ap', week = null) => {
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

// New FBS-specific additions
export const getTeamDetails = async (teamId) => {
    const endpoint = `/teams/${teamId}`;  // Team ID in path
    const response = await fetchData(endpoint);
    return response?.[0] || null;
};

export const getTeamSchedule = async (teamId, year = 2024) => {
    const endpoint = `/teams/${teamId}/schedule`;  // Team ID in path
    return await fetchData(endpoint, {
        year,
        seasonType: "regular",
        division: "fbs"
    });
};

export const getTeamRoster = async (teamId, year = 2024) => {
    const endpoint = `/teams/${teamId}/roster`;  // Team ID in path
    return await fetchData(endpoint, { year });
};

export const getTeamVenue = async (teamId) => {
    const endpoint = `/teams/${teamId}/venue`;  // Team ID in path
    const response = await fetchData(endpoint);
    return response?.[0] || null;
};

export const getAdvancedStats = async (teamId) => {
    const endpoint = "/stats/season/advanced";
    return await fetchData(endpoint, { team: teamId });
};

export const getTeamMatchup = async (team1, team2) => {
    const endpoint = "/teams/matchup";
    return await fetchData(endpoint, { team1, team2 });
};

// Export all functions
const teamsService = {
    // Original functions
    getGameById,
    getTeams,
    getGames,
    getGameMedia,
    getGameWeather,
    getAdvancedBoxScore,
    getGameLines,
    getTeamStats,
    getPolls,
    getPlayByPlay,
    
    // New FBS additions
    getTeamDetails,
    getTeamSchedule,
    getTeamRoster,
    getTeamVenue,
    getAdvancedStats,
    getTeamMatchup
};

export default teamsService;