// This API endpoint is designed to receive either an image or a PDF,
// convert it to text using the Gemini API, and return the result.

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return res.status(500).json({ error: 'Server configuration error: API key is missing.' });
    }

    try {
        const { prompt, fileData, mimeType } = req.body;

        if (!prompt || !fileData || !mimeType) {
            return res.status(400).json({ error: 'Missing required fields: prompt, fileData, or mimeType.' });
        }
        
        const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

        const payload = {
            contents: [
                {
                    parts: [
                        { text: prompt },
                        {
                            inline_data: {
                                mime_type: mimeType,
                                data: fileData
                            }
                        }
                    ]
                }
            ],
            safetySettings: [
                { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
                { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
                { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
                { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
            ],
            generationConfig: {
                maxOutputTokens: 8192, // Increased token limit for potentially long PDFs
            }
        };

        const apiResponse = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
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
            res.status(200).json({ text: text.trim() });
        } else {
             console.error("Gemini API Blocked or Invalid Response:", JSON.stringify(responseData, null, 2));
             if(responseData.promptFeedback && responseData.promptFeedback.blockReason) {
                 return res.status(500).json({ error: "Blocked", message: `Request was blocked by the API for safety reasons: ${responseData.promptFeedback.blockReason}` });
             }
             res.status(500).json({ error: "EmptyResponse", message: "The AI returned an empty or invalid response." });
        }

    } catch (error) {
        console.error('Error in /api/image-to-text:', error);
        res.status(500).json({ error: `An internal error occurred: ${error.message}` });
    }
}

