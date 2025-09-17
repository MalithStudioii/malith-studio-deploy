import { GoogleGenerativeAI } from "@google/generative-ai";
import { marked } from "marked";

export default async function handler(req, res) {
    if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ error: 'Server configuration error: API key is missing.' });
    }
    
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const { language } = req.body;
        if (!language) {
            return res.status(400).json({ error: 'Language is required.' });
        }
        
        const langMap = {
            en: 'English',
            si: 'Sinhala',
            ta: 'Tamil'
        };
        const languageName = langMap[language] || 'English';

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        // Using the highly stable 'gemini-1.5-flash' model
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `Act as an expert AI news reporter. Generate a news report on the top 3 latest advancements in Artificial Intelligence. The entire response must be in the **${languageName}** language. For each advancement, provide a title as a level-3 markdown heading and a concise summary. Format the entire response in markdown.`;

        const result = await model.generateContent(prompt);
        
        const response = result.response;

        if (!response || !response.candidates || !response.candidates.length === 0 || !response.candidates[0].content) {
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

