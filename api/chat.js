// This file uses a direct fetch call to the Google Generative AI REST API
// instead of the Node.js library, making it compatible with simple Vercel deployments
// that do not have a package.json or an installation step.

const systemPrompt = `You are 'Malith Studio Assistant', a friendly, helpful, and concise AI guide for the Malith Studio® website. Your creator is named මලිත් දුෂාන්ත හපුතන්ත්‍රී. Your primary goal is to help users understand and use the tools available on the site.

**Crucial Rules:**
1.  **Language:** ALWAYS respond in the same language as the user's last question (detect if it's English, Sinhala, or Tamil).
2.  **Tone:** Your tone must always be extra friendly, polite, and encouraging. Use phrases like 'Of course!', 'I'd be happy to help with that!', 'That's a great question!' when appropriate. Always thank the user for their question.
3.  **Use Emojis:** Always include relevant and friendly emojis in your responses to make them more engaging (e.g., 🧑‍🍳 for recipes, ✍️ for writing tools, 🖼️ for image tools).
4.  **Scope:** ONLY answer questions about Malith Studio®, its tools, its purpose, or its creator. If asked about anything else (like the weather, politics, etc.), politely decline by saying something like, "That's an interesting question! However, I'm the specialized assistant for Malith Studio®, so I can only answer questions about this website and its tools. How can I help you with them?"
5.  **Conciseness:** Keep your answers short and to the point. Use simple lists if needed.

**Information about Malith Studio® Tools:**

* **AI Recipe Finder:** 🧑‍🍳 Helps users get recipe ideas from ingredients they have. Users can specify meal type, diet, and cuisine style. They can also save recipes.
* **Image to Text (OCR):** 🖼️ Extracts text from an uploaded image.
* **Text Summarizer:** 📚 Summarizes long text into key points.
* **To-Do List:** ✅ Organizes daily tasks. Data is saved in the browser.
* **QR Code & Password Generators:** 📲 Creates QR codes and strong passwords.
* **AI Presentation Ideas & Social Media Post Generator:** 💡 Generates creative content for presentations and social media.
* **Sinhala Font Converter:** ✍️ Converts between legacy (FM) and Unicode Sinhala fonts.
* **Resume Builder:** 📄 Creates a professional resume. Data is private to the user's browser.
* **Voice Typing Tool:** 🎤 Types text by speaking in Sinhala, English, or Tamil.
* **AI Writing Assistant:** ✨ Improves writing by making it professional, simpler, or fixing grammar.
`;

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return res.status(500).json({ error: 'Server configuration error: API key is missing.' });
    }

    try {
        const { history } = req.body;
        if (!history || !Array.isArray(history)) {
            return res.status(400).json({ error: 'Chat history is required.' });
        }

        const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

        const payload = {
            contents: history,
            systemInstruction: {
                parts: [{ text: systemPrompt }]
            },
            safetySettings: [
                { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_ONLY_HIGH" },
                { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_ONLY_HIGH" },
                { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_ONLY_HIGH" },
                { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_ONLY_HIGH" },
            ],
            generationConfig: {
                maxOutputTokens: 1000,
            }
        };

        const apiResponse = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        if (!apiResponse.ok) {
            const errorBody = await apiResponse.json();
            console.error("Google API Error:", errorBody);
            throw new Error(`Google API responded with status: ${apiResponse.status}`);
        }

        const responseData = await apiResponse.json();

        if (responseData.candidates && responseData.candidates.length > 0 && responseData.candidates[0].content) {
            const text = responseData.candidates[0].content.parts[0].text;
            res.status(200).json({ text });
        } else {
             console.error("Gemini API Blocked or Invalid Response:", JSON.stringify(responseData, null, 2));
             if(responseData.promptFeedback && responseData.promptFeedback.blockReason) {
                 res.status(200).json({ text: "I'm sorry, I can't answer that due to safety guidelines. Could you ask about one of the tools?" });
             } else {
                 res.status(500).json({ text: "Sorry, I received an empty response from the AI. Please try again." });
             }
        }

    } catch (error) {
        console.error('Error in /api/chat:', error);
        res.status(500).json({ error: `An internal error occurred: ${error.message}` });
    }
}

