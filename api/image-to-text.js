// Vercel Serverless Function to handle image-to-text requests securely.

export default async function handler(request, response) {
  // 1. Only allow POST requests for security.
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Only POST requests are allowed' });
  }

  // 2. Get the secret API Key from Vercel Environment Variables.
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('GEMINI_API_KEY environment variable not set.');
    return response.status(500).json({ error: 'API key not configured on the server.' });
  }

  try {
    // 3. Get the image data and mime type from the request body sent by the HTML file.
    const { imageData, mimeType, prompt } = request.body;
    if (!imageData || !mimeType || !prompt) {
      return response.status(400).json({ error: 'Missing image data, mime type, or prompt.' });
    }

    // 4. Prepare the payload for the Gemini API.
    // We use the gemini-1.5-flash model which is multimodal (can handle both text and images).
    const model = 'gemini-1.5-flash';
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    
    const payload = {
      contents: [
        {
          parts: [
            { text: prompt },
            {
              inline_data: {
                mime_type: mimeType,
                data: imageData,
              },
            },
          ],
        },
      ],
      safetySettings: [
        { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
      ]
    };

    // 5. Call the Google Gemini API.
    const apiResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!apiResponse.ok) {
        const errorBody = await apiResponse.json();
        console.error('Google API Error:', errorBody);
        throw new Error(errorBody.error?.message || `Google API request failed with status ${apiResponse.status}`);
    }

    const result = await apiResponse.json();
    
    // 6. Send the successful response back to the user's browser.
    return response.status(200).json(result);

  } catch (error) {
    console.error('Error in serverless function:', error);
    return response.status(500).json({ error: error.message || 'An internal server error occurred.' });
  }
}
