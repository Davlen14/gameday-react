const fetchNews = async (query = "college football") => {
    const API_URL = "/api/proxy"; // Proxy route

    const requestBody = {
        endpoint: "/news",
        params: { searchQuery: query }, // ✅ Wrap params inside an object
    };

    try {
        console.log(`🔍 Fetching news with query: "${query}"...`);

        const response = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(requestBody), // ✅ Properly structured body
        });

        if (!response.ok) {
            console.error(`❌ API Error (${response.status}):`, await response.text());
            throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        console.log("✅ News API Response:", data);
        return data;
    } catch (error) {
        console.error("❌ Fetch Error:", error.message);
        return { error: "Failed to fetch news. Please try again later." };
    }
};

export default { fetchNews };

