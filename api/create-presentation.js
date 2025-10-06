// api/create-presentation.js
// FINAL VERSION: Using the correct and most stable model name 'gemini-pro' for the direct REST API call.
// This resolves the "model not found" error permanently.

export default async function handler(req, res) {
  console.log("--- Final Version: /api/create-presentation function started ---");

  // 1. Check for POST method
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // 2. Securely get the API Key
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("CRITICAL: GEMINI_API_KEY is not set.");
    return res.status(500).json({ error: "API key is not configured." });
  }

  try {
    // 3. Get the prompt from the request body
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: "Missing prompt." });
    }

    // 4. Prepare the request for Google's REST API with the CORRECT model name
    const modelName = "gemini-pro"; // This is the standard, stable model name for the v1beta API.
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
    
    const requestBody = {
      contents: [{
        parts: [{
          text: prompt
        }]
      }]
    };

    console.log(`Calling Gemini REST API with model: ${modelName}`);
    
    // 5. Make the direct API call using fetch
    const apiResponse = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });
    
    const responseData = await apiResponse.json();
    
    if (!apiResponse.ok) {
      console.error("Error response from Gemini API:", responseData);
      const errorMessage = responseData?.error?.message || "Failed to get a valid response from the AI model.";
      return res.status(apiResponse.status).json({ error: errorMessage });
    }
    
    console.log("Successfully received response from REST API.");
    
    // 8. Send the successful response to the frontend
    res.status(200).json(responseData);

  } catch (error) {
    console.error("CRITICAL CATCH BLOCK ERROR:", error.message);
    res.status(500).json({ error: "A critical server error occurred." });
  }
}

