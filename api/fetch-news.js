import { GoogleGenerativeAI } from "@google/generative-ai";
import { marked } from "marked";

export default async function handler(req, res) {
    // Check if the API key is available in Vercel environment variables
    if (!process.env.GEMINI_API_KEY) {
        console.error('GEMINI_API_KEY is not set in environment variables.');
        return res.status(500).json({ error: 'Server configuration error: API key missing.' });
    }
    
    // Only allow GET requests for this endpoint
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = "You are an AI news reporter. Find the top 5 most significant and interesting AI news stories from the last 48 hours. For each story, provide a title as a level-3 markdown heading, a concise one-paragraph summary, and then the original source link. Format the entire response in markdown.";

        // Generate content with Google Search grounding enabled
        const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            tools: [{ "google_search": {} }],
        });
        
        const response = result.response;

        // Check if the response was blocked or is otherwise invalid
        if (!response || !response.candidates || response.candidates.length === 0 || !response.candidates[0].content) {
            console.error('API response was blocked or empty. Finish Reason:', response?.candidates?.[0]?.finishReason);
            return res.status(500).json({ error: 'Failed to get a valid response from the AI model.' });
        }

        const text = response.text();
        
        // Convert the Markdown response to HTML to be displayed on the page
        const htmlContent = marked(text);

        // Send the successful response back to the ainews.html page
        res.status(200).json({ htmlContent });

    } catch (error) {
        console.error('Error in fetch-news function:', error);
        const errorMessage = error.message || 'An unknown error occurred while fetching AI news.';
        res.status(500).json({ error: errorMessage });
    }
}

