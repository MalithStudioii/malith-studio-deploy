// api/generate-ideas.js
// Enhanced with more detailed logging to help debug the issue.

import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // Securely get the API key from Vercel Environment Variables
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("FATAL: GEMINI_API_KEY is not set in environment variables.");
    return res.status(500).json({ error: "API key is not configured on the server." });
  }

  try {
    const { prompt } = req.body;

    // --- NEW LOGGING ---
    // Log the incoming request to see if we are receiving the prompt correctly.
    console.log("Received request with prompt:", prompt);

    if (!prompt) {
      console.warn("Request is missing the 'prompt' field.");
      return res.status(400).json({ error: "Missing required field: prompt." });
    }
    
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Call the Google Gemini API
    const result = await model.generateContent(prompt);
    const response = result.response;
    
    const text = response.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
        console.error("Could not extract text from Gemini response. Full response:", JSON.stringify(response, null, 2));
        return res.status(500).json({ error: "Failed to parse a valid response from the AI model." });
    }

    console.log("Successfully generated response. Sending back to client.");
    // Send the successful response back to the frontend
    res.status(200).json({ text });

  } catch (error) {
    // --- NEW DETAILED LOGGING ---
    // Log the entire error object to get maximum detail in Vercel logs.
    console.error("--- ERROR CAUGHT IN API ---");
    console.error("Error Message:", error.message);
    console.error("Full Error Object:", JSON.stringify(error, null, 2));
    console.error("--- END OF ERROR ---");

    // Check if the error is due to a safety block and send a specific error message
    if (error.response && error.response.promptFeedback) {
        return res.status(400).json({ error: "Blocked due to safety settings", reason: error.response.promptFeedback });
    }
    res.status(500).json({ error: "An internal server error occurred while contacting the AI model." });
  }
}

