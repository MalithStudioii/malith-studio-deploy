// This is a Vercel Serverless Function.
// It acts as a secure backend proxy to handle API requests to Google Gemini.

export default async function handler(request, response) {
  console.log('Function invoked. Method:', request.method);

  // We only allow POST requests to this function for security.
  if (request.method !== 'POST') {
    return response.status(405).json({ message: 'Only POST requests are allowed' });
  }

  try {
    console.log('Attempting to parse request body...');
    const { prompt } = request.body;

    if (!prompt) {
      console.error('Validation failed: Prompt is missing.');
      return response.status(400).json({ error: 'Prompt is required in the request body.' });
    }
    console.log('Prompt received successfully.');

    // Get the secret API Key from Vercel's Environment Variables.
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      console.error('CRITICAL: GEMINI_API_KEY environment variable not set.');
      return response.status(500).json({ error: 'API key not configured on the server.' });
    }
    console.log('API Key found.');

    const model = 'gemini-2.5-flash-preview-05-20';
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const payload = {
      contents: [{ parts: [{ text: prompt }] }],
       safetySettings: [
            { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
        ]
    };

    console.log('Sending request to Google Gemini API...');
    const geminiResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    console.log('Received response from Google. Status:', geminiResponse.status);

    const geminiData = await geminiResponse.json();

    if (!geminiResponse.ok) {
      console.error('Google API returned an error:', JSON.stringify(geminiData, null, 2));
      const errorMessage = geminiData?.error?.message || 'Failed to get a response from the AI model.';
      return response.status(geminiResponse.status).json({ error: errorMessage });
    }

    console.log('Successfully received data from Gemini. Sending to client.');
    // Send the successful response from Gemini back to the frontend.
    return response.status(200).json(geminiData);

  } catch (error) {
    console.error('FATAL Error in serverless function:', error);
    return response.status(500).json({ error: 'An internal server error occurred.' });
  }
}

