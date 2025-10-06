// api/create-presentation.js
import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  // Add logs to trace the function's execution path
  console.log("--- /api/create-presentation function started ---");

  try {
    if (req.method !== 'POST') {
      console.log("Method not allowed:", req.method);
      return res.status(405).json({ error: 'Method Not Allowed' });
    }

    console.log("Fetching API key...");
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("CRITICAL: GEMINI_API_KEY is not set.");
      // Ensure a JSON response is sent
      return res.status(500).json({ error: "API key is not configured." });
    }
    console.log("API key found.");

    const { prompt } = req.body;
    if (!prompt) {
      console.log("Prompt is missing.");
      return res.status(400).json({ error: "Missing prompt." });
    }
    console.log("Received prompt (first 50 chars):", prompt.substring(0, 50) + "...");

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    
    console.log("Calling Gemini API...");
    const result = await model.generateContent(prompt);
    const response = result.response;
    console.log("Received response from Gemini.");

    // Defensive check specifically for safety settings block
    if (!response || !response.candidates || response.candidates.length === 0) {
        console.warn("Gemini response was blocked or empty.", response?.promptFeedback);
        // Send a specific JSON error for blocked content
        return res.status(400).json({ 
            error: "Blocked by safety settings", 
            promptFeedback: response?.promptFeedback 
        });
    }

    console.log("Sending successful response to frontend.");
    // Send the valid, successful JSON response
    res.status(200).json(response);

  } catch (error) {
    // This block will catch any unexpected crash
    console.error("--- CATCH BLOCK EXECUTED ---");
    console.error("CRITICAL ERROR in /api/create-presentation:", error.message);
    // Ensure we ALWAYS send a JSON response, even in case of a crash
    res.status(500).json({ error: "A critical error occurred on the server." });
  }
}

