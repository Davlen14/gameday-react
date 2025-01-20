export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    const { endpoint, params } = req.body;
    const API_URL = `https://apinext.collegefootballdata.com${endpoint}`;
    const API_KEY = process.env.API_KEY; // Use the environment variable for the API key

    try {
        const url = new URL(API_URL);
        Object.keys(params).forEach((key) => url.searchParams.append(key, params[key]));

        const response = await fetch(url, {
            headers: {
                Authorization: `Bearer ${API_KEY}`,
            },
        });

        if (!response.ok) {
            const errorText = await response.text();
            return res.status(response.status).json({ error: errorText });
        }

        const data = await response.json();
        return res.status(200).json(data);
    } catch (error) {
        console.error("Proxy Error:", error.message);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}