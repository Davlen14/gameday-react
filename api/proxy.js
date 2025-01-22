export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    const { endpoint, params, prompt } = req.body;

    // Validate required parameters
    if (!endpoint) {
        return res.status(400).json({ error: "Endpoint is required" });
    }

    try {
        if (endpoint.startsWith("/gemini")) {
            // Handle requests to the Google Gemini API
            const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateText`;
            const GEMINI_API_KEY = process.env.GEMINI_API_KEY; // Ensure this is set in your environment

            if (!GEMINI_API_KEY) {
                console.error("Missing GEMINI_API_KEY in environment");
                return res.status(500).json({ error: "Server misconfiguration: missing GEMINI_API_KEY" });
            }

            const geminiResponse = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    prompt: { text: prompt || "" },
                }),
            });

            if (!geminiResponse.ok) {
                const error = await geminiResponse.json();
                console.error(`Gemini API Error (${geminiResponse.status}):`, error);
                return res.status(geminiResponse.status).json({ error });
            }

            const geminiData = await geminiResponse.json();
            return res.status(200).json({ message: geminiData.candidates[0]?.output || "No response from Gemini API" });
        } else {
            // Handle requests to the College Football Data API
            const API_URL = `https://apinext.collegefootballdata.com${endpoint}`;
            const API_KEY = process.env.API_KEY; // Ensure this is set in your environment

            if (!API_KEY) {
                console.error("Missing API_KEY in environment");
                return res.status(500).json({ error: "Server misconfiguration: missing API_KEY" });
            }

            // Construct the full URL with query parameters
            const url = new URL(API_URL);
            if (params) {
                Object.entries(params).forEach(([key, value]) =>
                    url.searchParams.append(key, value)
                );
            }

            const response = await fetch(url, {
                headers: {
                    Authorization: `Bearer ${API_KEY}`,
                },
            });

            if (!response.ok) {
                console.error(`API Error (${response.status}):`, await response.text());
                return res.status(response.status).json({ error: `API error with status ${response.status}` });
            }

            const data = await response.json();
            return res.status(200).json(data);
        }
    } catch (error) {
        console.error("Proxy Error:", error.message);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}