// api/generate-ideas.js

// Import the GoogleGenerativeAI library
import { GoogleGenerativeAI } from "@google/generative-ai";

// A helper function to wait for a specific time
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Define the handler function for the serverless endpoint
export default async function handler(req, res) {
  // We only want to handle POST requests to this endpoint
  if (req.method !== 'POST') {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  // Securely get the API key from Vercel Environment Variables.
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.error("GEMINI_API_KEY is not set in environment variables.");
    return res.status(500).json({ error: "API key is not configured on the server." });
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Get the 'prompt' from the incoming request body
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: "Missing required field: prompt." });
    }

    // --- RETRY LOGIC IMPLEMENTATION ---
    let result;
    const maxRetries = 3; // We will try a total of 3 times
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            console.log(`Attempt ${attempt} to call Gemini API...`);
            result = await model.generateContent(prompt);
            console.log(`Attempt ${attempt} was successful.`);
            // If the call is successful, we break out of the loop
            break; 
        } catch (error) {
            console.error(`Attempt ${attempt} failed with error:`, error.message);
            // If this was the last attempt, we let the error be thrown
            if (attempt === maxRetries) {
                throw new Error(`API call failed after ${maxRetries} attempts.`);
            }
            // Wait for 1 second before trying again
            await delay(1000); 
        }
    }
    // --- END OF RETRY LOGIC ---

    const response = result.response;
    const text = response.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
        console.error("Could not extract text from Gemini response:", response);
        return res.status(500).json({ error: "Failed to parse response from the AI model." });
    }

    // Send the final successful response back
    res.status(200).json({ text });

  } catch (error) {
    console.error("CRITICAL ERROR in generate-ideas function after all retries:", error.message);
    res.status(500).json({ error: "An internal server error occurred while contacting the AI service." });
  }
}

