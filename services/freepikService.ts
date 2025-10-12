const FREEPIK_API_URL = 'https://api.freepik.com/v1/ai/images/generate';
const FREEPIK_API_KEY = 'FPSX38b1f3f74cba72c920b4863726af0168';

/**
 * Generates an image by calling FreePik's Flux Dev model directly.
 *
 * @param prompt - The text prompt from the user.
 * @returns A promise that resolves to the URL of the generated image.
 */
export const genImageFromFluxDev = async (prompt: string): Promise<string> => {
    try {
        const response = await fetch(FREEPIK_API_URL, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'X-Freepik-API-Key': FREEPIK_API_KEY,
            },
            body: JSON.stringify({
                prompt: prompt,
                model: 'flux-v1',
                size: '1024x1024'
            }),
        });

        if (!response.ok) {
            let errorMessage = `API error: ${response.statusText}`;
            try {
                const data = await response.json();
                errorMessage = data.message || errorMessage;
            } catch {
                // Response might not be JSON
            }
            throw new Error(errorMessage);
        }

        const data = await response.json();

        const imageUrl = data.data?.url;
        if (!imageUrl) {
            throw new Error("Invalid response format from FreePik API");
        }

        return imageUrl;

    } catch (error) {
        console.error("Error generating image via FreePik API:", error);
        // Fallback to a placeholder on error to avoid breaking the UI
        const encodedPrompt = encodeURIComponent(`Error: ${(error as Error).message}`);
        return `https://placehold.co/1024x1024/7f1d1d/ffffff/png?text=${encodedPrompt}&font=lato`;
    }
};
