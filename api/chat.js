import { GoogleGenerativeAI } from "@google/generative-ai";

// System instruction to define the chatbot's persona and role
const systemInstruction = {
    role: "model",
    parts: [{
        text: "You are a friendly and helpful AI Assistant for Malith Studio®, a website that offers free digital tools for productivity. Your name is 'Studio Assistant'. Your primary purpose is to help users by answering their questions about the website and its tools. You can explain what each tool does (like the AI News, Text Summarizer, Image to Text, etc.), guide them on how to use the tools, and answer general questions about Malith Studio®. You cannot perform the functions of the tools themselves (e.g., you cannot summarize text for a user), but you must guide them to the correct tool's page. Keep your answers concise, friendly, and easy to understand. You can use emojis to make the conversation more engaging. If a user asks something completely unrelated to Malith Studio or its tools, politely steer the conversation back to your purpose. Start the first conversation by welcoming the user and asking how you can help."
    }],
};

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ error: 'Server configuration error: API key is missing.' });
    }

    try {
        const { history } = req.body;
        if (!history) {
            return res.status(400).json({ error: 'Chat history is required.' });
        }

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash",
            systemInstruction: systemInstruction, // Applying the persona here
        });

        const chat = model.startChat({
            history: history,
            generationConfig: {
                maxOutputTokens: 1000,
            },
        });

        // Get the last user message from the history
        const userMessage = history[history.length - 1].parts[0].text;
        
        const result = await chat.sendMessage(userMessage);
        const response = result.response;
        const text = response.text();

        res.status(200).json({ text });

    } catch (error) {
        console.error('CRITICAL ERROR in chat function:', error);
        res.status(500).json({ error: `An error occurred with the Google API: ${error.message}` });
    }
}
