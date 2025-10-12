// This is a Vercel-style serverless function, which doesn't require framework-specific imports for req/res.

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).end('Method Not Allowed');
    }

    try {
        // In this environment, the body is typically pre-parsed for JSON content types.
        const { prompt } = req.body;

        if (!prompt) {
            return res.status(400).json({ message: 'Prompt is required' });
        }

        const FREEPIK_API_KEY = process.env.FREEPIK_API_KEY;
        if (!FREEPIK_API_KEY) {
            console.error("FreePik API key is not configured on the server.");
            return res.status(500).json({ message: 'Server configuration error: Missing API key.' });
        }

        const API_URL = 'https://api.freepik.com/v1/ai/images/generate';

        const apiResponse = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'X-Freepik-API-Key': FREEPIK_API_KEY,
            },
            body: JSON.stringify({
                prompt: prompt,
                model: "flux-v1",
                size: "1024x1024"
            }),
        });

        const responseData = await apiResponse.json();

        if (!apiResponse.ok) {
            console.error("FreePik API Error:", responseData);
            return res.status(apiResponse.status).json({ message: `FreePik API error: ${responseData.message || apiResponse.statusText}` });
        }

        const imageUrl = responseData.data?.url;

        if (!imageUrl) {
            console.error("Invalid response format from FreePik API", responseData);
            return res.status(500).json({ message: 'Invalid response format from FreePik API' });
        }

        return res.status(200).json({ imageUrl });

    } catch (error) {
        console.error("Error in generateImage handler:", error);
        if (error instanceof SyntaxError) {
             return res.status(400).json({ message: 'Invalid JSON in request body.' });
        }
        return res.status(500).json({ message: 'An internal server error occurred.' });
    }
}
