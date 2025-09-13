// This file must be created as 'refine-text.js' inside the 'api' folder.
// මෙම ගොනුව 'api' ෆෝල්ඩරය තුල 'refine-text.js' ලෙස සෑදිය යුතුය.

import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("GEMINI_API_KEY is not set in environment variables.");
    return res.status(500).json({ error: "API key is not configured." });
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  try {
    const { text, action, language } = req.body;
    if (!text || !action) {
      return res.status(400).json({ error: "Missing required fields: text or action." });
    }

    let prompt = '';
    // We build the prompt on the backend for better control and security
    switch (action) {
        case 'professional':
            prompt = `Rewrite the following text to make it sound more professional. The output language must be ${language}:\n\n"${text}"`;
            break;
        case 'simplify':
            prompt = `Simplify the following text to make it easier to understand. The output language must be ${language}:\n\n"${text}"`;
            break;
        case 'grammar':
            prompt = `Correct any grammatical errors in the following text. Only provide the corrected text, without any explanations. The output language must be ${language}:\n\n"${text}"`;
            break;
        default:
            return res.status(400).json({ error: "Invalid action provided." });
    }

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const refinedText = response.text();

    res.status(200).json({ text: refinedText });

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    if (error.response && error.response.promptFeedback) {
        return res.status(400).json({ error: "Blocked" });
    }
    res.status(500).json({ error: "Failed to process the request with the AI model." });
  }
}
