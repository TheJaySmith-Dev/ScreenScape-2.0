// This is a placeholder for the Freepik API key.
// In a real production environment, this should be stored securely and not hardcoded.
const FREEPIK_API_KEY = 'FPSX38b1f3f74cba72c920b4863726af0168';
const API_URL = 'https://api.freepik.com/v1/ai/images/generate';

/**
 * Generates an image from FreePik's Flux Dev model using a real API call.
 *
 * @param prompt - The text prompt from the user.
 * @returns A promise that resolves to the URL of the generated image.
 */
export const genImageFromFluxDev = async (prompt: string): Promise<string> => {
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'X-Freepik-API-Key': FREEPIK_API_KEY,
            },
            body: JSON.stringify({
                prompt: prompt,
                model: "flux-v1", // Use the specified Flux model
                size: "1024x1024"
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`FreePik API error: ${errorData.message || response.statusText}`);
        }

        const { data } = await response.json();

        if (!data || !data.url) {
            throw new Error("Invalid response format from FreePik API");
        }

        return data.url;

    } catch (error) {
        console.error("Error generating image with FreePik:", error);
        // Fallback to a placeholder on error to avoid breaking the UI
        const encodedPrompt = encodeURIComponent(`Error: ${(error as Error).message}`);
        return `https://placehold.co/1024x1024/7f1d1d/ffffff/png?text=${encodedPrompt}&font=lato`;
    }
};
