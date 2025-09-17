import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
    // 1. Check for the API key in environment variables
    if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ error: 'Server configuration error: API key is missing.' });
    }
    
    // 2. Ensure the request method is POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        // 3. Get the full prompt directly from the frontend request
        const { prompt } = req.body;
        if (!prompt) {
            return res.status(400).json({ error: 'Prompt is required.' });
        }
        
        // 4. Initialize the Google Generative AI model
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        // 5. Send the prompt received from the frontend to the model
        const result = await model.generateContent(prompt);
        const response = result.response;

        // 6. Validate the response from the AI
        if (!response || !response.candidates || response.candidates.length === 0 || !response.candidates[0].content) {
             // Check if there was a safety block
            const blockReason = response?.promptFeedback?.blockReason;
            if (blockReason) {
                console.warn(`Request blocked due to: ${blockReason}`);
                return res.status(400).json({ error: `Your request was blocked for safety reasons (${blockReason}). Please modify your input.` });
            }
            return res.status(500).json({ error: 'Failed to get a valid response from the AI.' });
        }

        // 7. Get the raw markdown text from the response
        const markdownText = response.text();

        // 8. Send the raw markdown text back to the frontend
        // The frontend will be responsible for converting it to HTML
        res.status(200).json({ markdownContent: markdownText });

    } catch (error) {
        console.error('CRITICAL ERROR in generate-recipe function:', error);
        res.status(500).json({ error: `An error occurred with the AI service: ${error.message}` });
    }
}
