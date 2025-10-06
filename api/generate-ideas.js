// This file must be created as 'generate-ideas.js' inside the 'api' folder.
// මෙම ගොනුව 'api' ෆෝල්ඩරය තුල 'generate-ideas.js' ලෙස සෑදිය යුතුය.

import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // Securely get the API key from Vercel Environment Variables
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("GEMINI_API_KEY is not set in environment variables.");
    return res.status(500).json({ error: "API key is not configured on the server." });
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Get the prompt from the request body
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: "Missing required field: prompt." });
    }

    // Call the Google Gemini API
    const result = await model.generateContent(prompt);
    const response = result.response;

    // --- THIS IS THE CORRECTED LINE ---
    // --- මෙන්න නිවැරදි කරන ලද පේළිය ---
    // The generated text is nested deep inside the response object.
    // We use optional chaining (?.) to safely access it.
    const text = response.candidates?.[0]?.content?.parts?.[0]?.text;

    // If text could not be extracted, it means the response format was unexpected or empty.
    if (!text) {
        console.error("Could not extract text from Gemini response:", response);
        return res.status(500).json({ error: "Failed to parse a valid response from the AI model." });
    }

    // Send the successful response back to the frontend
    res.status(200).json({ text });

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    // Check if the error is due to a safety block and send a specific error message
    if (error.response && error.response.promptFeedback) {
        return res.status(400).json({ error: "Blocked", reason: error.response.promptFeedback });
    }
    res.status(500).json({ error: "Failed to generate ideas with the AI model." });
  }
}

