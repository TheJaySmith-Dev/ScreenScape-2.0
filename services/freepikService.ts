const SUPABASE_URL = 'https://0ec90b57d6e95fcbda19832f.supabase.co';
const API_URL = `${SUPABASE_URL}/functions/v1/generate-image`;

/**
 * Generates an image by calling FreePik's Flux Dev model via Supabase Edge Function.
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

        if (!response.ok) {
            let errorMessage = `API error: ${response.statusText}`;
            try {
                const data = await response.json();
                errorMessage = data.error || data.message || errorMessage;
            } catch {
                // Response might not be JSON
            }
            throw new Error(errorMessage);
        }

        const data = await response.json();

        if (!data.imageUrl) {
            throw new Error("Invalid response format from server");
        }

        return data.imageUrl;

    } catch (error) {
        console.error("Error generating image:", error);
        // Fallback to a placeholder on error to avoid breaking the UI
        const encodedPrompt = encodeURIComponent(`Error: ${(error as Error).message}`);
        return `https://placehold.co/1024x1024/7f1d1d/ffffff/png?text=${encodedPrompt}&font=lato`;
    }
};
