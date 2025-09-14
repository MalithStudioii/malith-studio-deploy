import { GoogleGenerativeAI } from "@google/generative-ai";
import { marked } from "marked";

export default async function handler(req, res) {
    if (!process.env.GEMINI_API_KEY) {
        console.error('FATAL: GEMINI_API_KEY is not set in environment variables.');
        return res.status(500).json({ error: 'Server configuration error: API key is missing.' });
    }
    
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        // Using the reliable flash model
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        // A new prompt that doesn't rely on the Google Search tool
        const prompt = `You are an expert AI news reporter. Based on your extensive training data, generate a report on the 5 most significant and interesting developments in the world of Artificial Intelligence that have emerged recently. For each development, provide a compelling title as a level-3 markdown heading, and a concise one-paragraph summary. Do not mention that this is based on training data. Present it as a fresh news report. Format the entire response in markdown.`;

        // We are NOT using the 'tools' property here to ensure maximum compatibility
        const result = await model.generateContent(prompt);
        
        const response = result.response;

        if (!response || !response.candidates || response.candidates.length === 0 || !response.candidates[0].content) {
            console.error('API response was blocked or empty. Finish Reason:', response?.candidates?.[0]?.finishReason);
            return res.status(500).json({ error: 'Failed to get a valid response from the AI.' });
        }

        const text = response.text();
        const htmlContent = marked(text);

        res.status(200).json({ htmlContent });

    } catch (error) {
        console.error('CRITICAL ERROR in fetch-news function:', JSON.stringify(error, null, 2));
        res.status(500).json({ error: `An error occurred with the Google API: ${error.message}` });
    }
}

