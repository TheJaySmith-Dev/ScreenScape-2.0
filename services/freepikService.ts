const API_URL = '/api/generateImage';

/**
 * Generates an image by calling our own backend, which then securely calls FreePik's Flux Dev model.
 *
 * @param prompt - The text prompt from the user.
 * @returns A promise that resolves to the URL of the generated image.
 */
export const genImageFromFluxDev = async (prompt: string): Promise<string> => {
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ prompt }),
        });

        const data = await response.json();

        if (!response.ok) {
            // The backend now provides a structured error message
            throw new Error(data.message || `API error: ${response.statusText}`);
        }

        if (!data.imageUrl) {
            throw new Error("Invalid response format from the server");
        }

        return data.imageUrl;

    } catch (error) {
        console.error("Error generating image via backend:", error);
        // Fallback to a placeholder on error to avoid breaking the UI
        const encodedPrompt = encodeURIComponent(`Error: ${(error as Error).message}`);
        return `https://placehold.co/1024x1024/7f1d1d/ffffff/png?text=${encodedPrompt}&font=lato`;
    }
};
