
import { useState, useCallback } from 'react';
import { genImageFromFluxDev } from '../services/freepikService';

export const useGenScape = () => {
    const [prompt, setPrompt] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);

    const generateImage = useCallback(async () => {
        if (!prompt.trim()) {
            setError("Please enter a prompt.");
            return;
        }
        setIsLoading(true);
        setError(null);
        setGeneratedImage(null);

        try {
            const imageUrl = await genImageFromFluxDev(prompt);
            setGeneratedImage(imageUrl);
        } catch (err) {
            console.error("Image generation failed:", err);
            setError("Sorry, something went wrong while creating your image.");
        } finally {
            setIsLoading(false);
        }
    }, [prompt]);

    return {
        prompt,
        setPrompt,
        isLoading,
        error,
        generatedImage,
        generateImage,
    };
};
