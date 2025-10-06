// api/generate-ideas.js
import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("GEMINI_API_KEY is not set.");
    return res.status(500).json({ error: "API key is not configured." });
  }

  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: "Missing required field: prompt." });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const result = await model.generateContent(prompt);
    
    // THE FIX: Send the ENTIRE response object from Gemini directly to the frontend.
    // Do not process or change it here.
    res.status(200).json(result.response);

  } catch (error) {
    console.error("Error in API function:", error);
    res.status(500).json({ error: "Failed to generate ideas from the AI model." });
  }
}

