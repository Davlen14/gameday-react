export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    const { endpoint, params, prompt } = req.body;

    try {
        if (endpoint === "/news") {
            const GNEWS_API_KEY = process.env.GNEWS_API_KEY;
            if (!GNEWS_API_KEY) {
                console.error("❌ Missing GNEWS_API_KEY in environment");
                return res.status(500).json({ error: "Server misconfiguration: missing GNEWS_API_KEY" });
            }

            // ✅ Safe handling of `params`
            const searchQuery = params?.searchQuery || "college football";
            const newsAPIURL = `https://gnews.io/api/v4/search?q=${encodeURIComponent(searchQuery)}&token=${GNEWS_API_KEY}`;

            console.log(`🔍 Fetching news for query: ${searchQuery}`);

            const newsResponse = await fetch(newsAPIURL);
            if (!newsResponse.ok) {
                console.error(`❌ News API Error (${newsResponse.status}):`, await newsResponse.text());
                return res.status(newsResponse.status).json({ error: `News API error with status ${newsResponse.status}` });
            }

            const newsData = await newsResponse.json();
            console.log("✅ News API Response:", newsData);
            return res.status(200).json(newsData);
        }

        // ✅ Existing handling for Gemini & College Football Data APIs
        else if (endpoint === "/gemini") {
            const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent`;
            const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

            if (!GEMINI_API_KEY) {
                console.error("❌ Missing GEMINI_API_KEY in environment");
                return res.status(500).json({ error: "Server misconfiguration: missing GEMINI_API_KEY" });
            }

            console.log(`🔍 Sending prompt to Gemini: ${prompt}`);

            const geminiResponse = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [
                        {
                            parts: [{ text: prompt || "" }],
                        },
                    ],
                }),
            });

            if (!geminiResponse.ok) {
                const error = await geminiResponse.json();
                console.error(`❌ Gemini API Error (${geminiResponse.status}):`, error);
                return res.status(geminiResponse.status).json({ error });
            }

            const geminiData = await geminiResponse.json();
            console.log("✅ Gemini API Response:", geminiData);
            return res.status(200).json({
                message: geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "No response from Gemini API",
            });
        }

        // ✅ College Football Data API handling
        else {
            const API_URL = `https://apinext.collegefootballdata.com${endpoint}`;
            const API_KEY = process.env.API_KEY;

            if (!API_KEY) {
                console.error("❌ Missing API_KEY in environment");
                return res.status(500).json({ error: "Server misconfiguration: missing API_KEY" });
            }

            console.log(`🔍 Fetching CFB data from: ${API_URL}`);

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
                console.error(`❌ API Error (${response.status}):`, await response.text());
                return res.status(response.status).json({ error: `API error with status ${response.status}` });
            }

            const data = await response.json();
            console.log("✅ CFB API Response:", data);
            return res.status(200).json(data);
        }
    } catch (error) {
        console.error("❌ Proxy Error:", error.message);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}
