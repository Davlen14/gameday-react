export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    const { endpoint, params } = req.body;

    // Validate required parameters
    if (!endpoint) {
        return res.status(400).json({ error: "Endpoint is required" });
    }

    const API_URL = `https://apinext.collegefootballdata.com${endpoint}`;
    const API_KEY = process.env.API_KEY; // Ensure this is set in your environment

    if (!API_KEY) {
        console.error("Missing API_KEY in environment");
        return res.status(500).json({ error: "Server misconfiguration: missing API_KEY" });
    }

    try {
        // Construct the full URL with query parameters
        const url = new URL(API_URL);
        if (params) {
            Object.entries(params).forEach(([key, value]) =>
                url.searchParams.append(key, value)
            );
        }

        // Fetch data from the external API
        const response = await fetch(url, {
            headers: {
                Authorization: `Bearer ${API_KEY}`,
            },
        });

        // Handle non-OK responses
        if (!response.ok) {
            console.error(`API Error (${response.status}):`, await response.text());
            return res.status(response.status).json({ error: `API error with status ${response.status}` });
        }

        const data = await response.json();
        return res.status(200).json(data);
    } catch (error) {
        console.error("Proxy Error:", error.message);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}