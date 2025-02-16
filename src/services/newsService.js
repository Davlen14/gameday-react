const fetchNews = async (query = "college football") => {
    const API_URL = "/api/proxy"; // Proxy route
    const params = {
        endpoint: "/news",
        searchQuery: query,
    };

    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(params),
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

export default {
    fetchNews,
};
