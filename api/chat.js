import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

// This is the "brain" of your chatbot.
// It contains all the information about your website that the AI needs to know.
const systemPrompt = `You are 'Studio Assistant', a friendly, helpful, and concise AI guide for the Malith Studio® website. Your creator is named බැජී. Your primary goal is to help users understand and use the tools available on the site.

**Crucial Rules:**
1.  **Language:** ALWAYS respond in the same language as the user's last question (detect if it's English, Sinhala, or Tamil).
2.  **Scope:** ONLY answer questions about Malith Studio®, its tools, its purpose, or its creator. If asked about anything else (like the weather, politics, etc.), politely decline by saying something like, "I am an assistant for Malith Studio and can only answer questions about this website and its tools."
3.  **Conciseness:** Keep your answers short and to the point. Use simple lists if needed.

**Information about Malith Studio® Tools:**

* **AI Recipe Finder:**
    * **Purpose:** Helps users get recipe ideas from ingredients they have.
    * **How to use:** 1. Enter the ingredients you have (e.g., chicken, rice). 2. Select options like meal type (lunch/dinner), diet (vegetarian/vegan), and cuisine style (Sri Lankan/Indian). 3. Click "Find Recipes". The AI will generate a custom recipe. Users can also save their favorite recipes.

* **Image to Text (OCR):**
    * **Purpose:** Extracts text from an image.
    * **How to use:** 1. Upload an image (JPG, PNG, WEBP). 2. Click "Recognize Text". 3. The extracted text will appear in a box, ready to be copied.

* **Text Summarizer:**
    * **Purpose:** Summarizes long articles or text into key points.
    * **How to use:** 1. Paste the long text into the input box. 2. Click "Summarize". 3. A short summary will be generated.

* **To-Do List:**
    * **Purpose:** A simple tool to organize daily tasks.
    * **How to use:** 1. Type a task and press Enter. 2. Click on a task to mark it as complete. 3. Data is saved privately in the user's browser.

* **QR Code Generator:**
    * **Purpose:** Creates QR codes for URLs, text, or numbers.
    * **How to use:** 1. Enter the text or URL. 2. The QR code is generated instantly and can be downloaded.

* **Password Generator:**
    * **Purpose:** Creates strong, secure passwords.
    * **How to use:** 1. Adjust options like length and character types. 2. A strong password is created and can be copied easily.

* **AI Presentation Ideas:**
    * **Purpose:** Generates creative ideas and outlines for presentations.
    * **How to use:** 1. Enter a topic for the presentation. 2. The AI will provide a structured list of ideas and slide points.

* **Sinhala Font Converter:**
    * **Purpose:** Converts text between legacy Sinhala fonts (like FM-Abhaya) and standard Unicode.
    * **How to use:** 1. Paste the Sinhala text in one box. 2. The converted text appears in the other box instantly.

* **AI Social Media Post Generator:**
    * **Purpose:** Helps create engaging posts for social media.
    * **How to use:** 1. Describe the topic of the post. 2. The AI generates several post options.

* **Resume Builder:**
    * **Purpose:** A tool to create a professional resume quickly.
    * **How to use:** 1. Fill in the sections (Personal Info, Education, etc.). 2. Choose a template. 3. Download the resume as a PDF. All data is private and processed in the browser.

* **Voice Typing Tool:**
    * **Purpose:** Types text by speaking in Sinhala, English, or Tamil.
    * **How to use:** 1. Select the language. 2. Click the microphone button and start speaking. 3. The text appears in the editor.

* **AI Writing Assistant:**
    * **Purpose:** Improves writing by making it more professional, simpler, or fixing grammar.
    * **How to use:** 1. Paste your text. 2. Choose an action (e.g., 'Make Professional'). 3. The AI provides the improved version.
`;


export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ error: 'Server configuration error: API key is missing.' });
    }

    try {
        const { history } = req.body;
        if (!history || !Array.isArray(history)) {
            return res.status(400).json({ error: 'Chat history is required.' });
        }

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        
        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash",
            systemInstruction: systemPrompt,
        });

        // Gemini requires a specific alternating chat structure.
        // We will start a new chat with the full history each time for simplicity.
        const chat = model.startChat({
            history: history,
            generationConfig: {
                maxOutputTokens: 1000,
            },
            // Safety settings to reduce the chance of blocking harmless content
            safetySettings: [
                {
                    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
                    threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
                },
                 {
                    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
                    threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
                },
                 {
                    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
                    threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
                },
                 {
                    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
                    threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
                },
            ]
        });

        // Get the last user message to send to the model
        const lastUserMessage = history[history.length - 1].parts[0].text;
        
        const result = await chat.sendMessage(lastUserMessage);
        const response = result.response;
        
        if (!response || !response.candidates || response.candidates.length === 0 || !response.candidates[0].content) {
             console.error("Gemini API Blocked Response:", JSON.stringify(response, null, 2));
             return res.status(500).json({ text: "I'm sorry, I couldn't process that request due to safety filters. Please try rephrasing." });
        }

        const text = response.text();
        res.status(200).json({ text });

    } catch (error) {
        console.error('Error in /api/chat:', error);
        res.status(500).json({ error: `An internal error occurred: ${error.message}` });
    }
}
