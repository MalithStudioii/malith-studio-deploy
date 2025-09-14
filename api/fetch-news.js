import { GoogleGenerativeAI } from "@google/generative-ai";
import { marked } from "marked";

export default async function handler(req, res) {
    // Check if the API key is available
    if (!process.env.GEMINI_API_KEY) {
        console.error('FATAL: GEMINI_API_KEY is not set in environment variables.');
        return res.status(500).json({ error: 'Server configuration error: API key is missing.' });
    }
    
    // Only allow GET requests
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = "You are an AI news reporter. Find the top 5 most significant and interesting AI news stories from the last 48 hours. For each story, provide a title as a level-3 markdown heading, a concise one-paragraph summary, and then the original source link. Format the entire response in markdown.";

        const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            tools: [{ "google_search": {} }],
        });
        
        const response = result.response;

        if (!response || !response.candidates || response.candidates.length === 0 || !response.candidates[0].content) {
            console.error('API response was blocked or empty. Finish Reason:', response?.candidates?.[0]?.finishReason);
            return res.status(500).json({ error: 'Failed to get a valid response from the AI. The request may have been blocked for safety reasons.' });
        }

        const text = response.text();
        const htmlContent = marked(text);

        res.status(200).json({ htmlContent });

    } catch (error) {
        // Log the entire error object for detailed debugging in Vercel Logs
        console.error('CRITICAL ERROR in fetch-news function:', JSON.stringify(error, null, 2));

        // Create a more informative error message for the user
        let errorMessage = 'An unknown error occurred while communicating with the AI model.';
        if (error.message) {
            errorMessage = `Google API Error: ${error.message}`;
        }
        
        res.status(500).json({ error: errorMessage });
    }
}

