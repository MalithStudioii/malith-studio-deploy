// api/generate-ideas.js
// This code is now an exact copy of the simple, working proxy pattern.
import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  // 1. Check if the method is POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // 2. Get the API key securely
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("CRITICAL: GEMINI_API_KEY is not set in environment variables.");
    return res.status(500).json({ error: "A PI key is not configured on the server." });
  }

  try {
    // 3. Get the prompt from the request
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: "Missing required field: prompt." });
    }

    // 4. Initialize Gemini and call the API
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-pro" }); // Using the stable gemini-pro
    const result = await model.generateContent(prompt);
    
    // 5. IMPORTANT: Send the raw, unprocessed response directly to the frontend.
    // This is the method that works for your other tool.
    res.status(200).json(result.response);

  } catch (error) {
    // 6. If any error occurs, log it and send a generic error message
    console.error("CRITICAL ERROR in /api/generate-ideas:", error);
    res.status(500).json({ error: "Failed to generate ideas from the AI model." });
  }
}

