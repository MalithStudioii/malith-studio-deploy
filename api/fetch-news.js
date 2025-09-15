import { GoogleGenerativeAI } from "@google/generative-ai";
import { marked } from "marked";

export default async function handler(req, res) {
    if (!process.env.GEMINI_API_KEY) {
        console.error('FATAL: GEMINI_API_KEY is not set.');
        return res.status(500).json({ error: 'Server configuration error: API key missing.' });
    }
    
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        console.log("Attempting to initialize GoogleGenerativeAI...");
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        
        // ### FINAL FIX: Switching to the fast and reliable 'gemini-1.5-flash' model ###
        // This model is confirmed to work with the user's other tools.
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        console.log("Model initialized successfully. Using gemini-1.5-flash.");

        const prompt = `Act as an expert AI news reporter. Generate a news report on the top 3 latest advancements in Artificial Intelligence. For each advancement, provide a title as a level-3 markdown heading and a concise summary. Format the entire response in markdown.`;

        console.log("Generating content with the prompt...");
        const result = await model.generateContent(prompt);
        const response = result.response;

        if (!response || !response.candidates || response.candidates.length === 0 || !response.candidates[0].content) {
            console.error('API response was blocked or empty. Finish Reason:', response?.candidates?.[0]?.finishReason);
            return res.status(500).json({ error: 'Failed to get a valid response from the AI.' });
        }

        console.log("Successfully received response from API.");
        const text = response.text();
        const htmlContent = marked(text);

        res.status(200).json({ htmlContent });

    } catch (error) {
        console.error('CRITICAL ERROR in fetch-news function:', JSON.stringify(error, null, 2));
        res.status(500).json({ error: `An error occurred with the Google API: ${error.message}` });
    }
}

