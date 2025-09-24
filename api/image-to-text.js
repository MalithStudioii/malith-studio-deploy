// This API endpoint is now an Advanced Document Analyzer.
// It receives a file (Image or PDF) and a language, then instructs the AI
// to provide a structured analysis of the content in that language.

const getLanguageName = (langCode) => {
    if (langCode === 'si') return 'Sinhala';
    if (langCode === 'ta') return 'Tamil';
    return 'English';
};

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return res.status(500).json({ error: 'Server configuration error: API key is missing.' });
    }

    try {
        const { language, fileData, mimeType } = req.body;

        if (!language || !fileData || !mimeType) {
            return res.status(400).json({ error: 'Missing required fields: language, fileData, or mimeType.' });
        }
        
        const languageName = getLanguageName(language);
        const prompt = `
            You are an expert document analyst. Analyze the provided file (image or PDF) and provide a structured breakdown of its content.
            Your entire response MUST be in the ${languageName} language.
            
            Format your response in Markdown with the following sections:

            ## 📄 Summary
            (Provide a concise, one-paragraph summary of the entire document's content.)

            ### 🔑 Key Points
            (List the most important takeaways or data points as a bulleted list.)

            ### 🖼️ Image Descriptions (if any)
            (If there are images, briefly describe what each one shows. If no images, state "No images found.")

            ### 📋 Full Text / Data
            (Extract the full text content. If you identify tables, recreate them using Markdown table format.)
        `;
        
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
                maxOutputTokens: 8192,
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

