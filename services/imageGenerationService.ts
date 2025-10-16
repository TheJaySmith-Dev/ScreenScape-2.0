// Pollinations.ai API service for image generation
const POLLINATIONS_IMAGE_API_BASE = "https://image.pollinations.ai/prompt";
const POLLINATIONS_MODELS_API = "https://image.pollinations.ai/models";
const POLLINATIONS_API_TOKEN = "tDzPgGrPAJZL059l";

export interface ImageGenerationRequest {
  model: string;
  prompt: string;
  width?: number;
  height?: number;
  seed?: number;
}

export interface ImageGenerationResponse {
  success: boolean;
  imageUrl?: string;
  error?: string;
}

// Cache for available models
let cachedModels: string[] | null = null;
let modelsCacheTime: number | null = null;
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Fetches available models from Pollinations.ai API with caching
 */
export async function fetchAvailableModels(): Promise<string[]> {
  const now = Date.now();

  // Return cached models if still valid
  if (cachedModels && modelsCacheTime && (now - modelsCacheTime) < CACHE_DURATION) {
    return cachedModels;
  }

  try {
    const url = `${POLLINATIONS_MODELS_API}?token=${POLLINATIONS_API_TOKEN}&referrer=ScreenScape`;
    const response = await fetch(url);

    if (!response.ok) {
      console.warn(`Failed to fetch models: ${response.status} ${response.statusText}`);
      // Return fallback models if API fails
      return ["flux", "fluxpro", "flux-dev", "kontext", "sdxl"];
    }

    const models: string[] = await response.json();
    console.log("Fetched available models:", models);

    // Cache the results
    cachedModels = models;
    modelsCacheTime = now;

    return models;
  } catch (err) {
    console.error("Error fetching models:", err);
    // Return fallback models on error
    return ["flux", "fluxpro", "flux-dev", "kontext", "sdxl"];
  }
}

/**
 * Generates an image using Pollinations.ai API
 * @param request The image generation request with model and prompt
 * @returns Promise<ImageGenerationResponse> The API response
 */
export async function generateImage(request: ImageGenerationRequest): Promise<ImageGenerationResponse> {
  try {
    // URL-encode the prompt
    const encodedPrompt = encodeURIComponent(request.prompt);

    // Build the API URL with parameters
    const params = new URLSearchParams({
      model: request.model,
      token: POLLINATIONS_API_TOKEN,
      referrer: "ScreenScape",
      nologo: "true", // Remove watermark since we have a token
      width: String(request.width || 1024),
      height: String(request.height || 1024),
    });

    if (request.seed !== undefined) {
      params.set('seed', String(request.seed));
    }

    const apiUrl = `${POLLINATIONS_IMAGE_API_BASE}/${encodedPrompt}?${params}`;
    console.log("Making request to:", apiUrl);

    const response = await fetch(apiUrl);

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      console.error("Pollinations API Error:", { status: response.status, statusText: response.statusText, errorText });

      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      if (errorText) {
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch {
          errorMessage = errorText;
        }
      }

      return {
        success: false,
        error: errorMessage,
      };
    }

    // Since the API returns the image directly, we need to generate a data URL
    // However, actually serving images this way isn't practical. Let's use a regular URL approach
    // The response should be the image file, but we need to handle it as a Blob and create a URL
    const imageBlob = await response.blob();
    const imageUrl = URL.createObjectURL(imageBlob);

    console.log("Image generation successful, created blob URL");

    return {
      success: true,
      imageUrl,
    };

  } catch (err) {
    console.error("Pollinations Connection Error:", err);
    return {
      success: false,
      error: "Connection issue, please try again.",
    };
  }
}

// Dynamic models - we'll fetch these asynchronously
export type AvailableModel = string;

// Fallback models for initial state
export const FALLBACK_MODELS = ["flux", "fluxpro"];

export async function getAvailableModels(): Promise<AvailableModel[]> {
  return await fetchAvailableModels();
}
