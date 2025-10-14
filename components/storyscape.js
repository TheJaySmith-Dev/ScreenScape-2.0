// /components/storyscape.js
import { queryOpenRouter } from "./openrouter.js";

/**
 * Generates a cinematic, spoiler-free summary for a movie or TV show using the OpenRouter AI.
 * @param {string} title The title of the media.
 * @param {string} overview The original TMDb overview to use as context.
 * @returns {Promise<{summary: string, tone: string, style: string} | null>} A structured object with the AI-generated content, or null on failure.
 */
export async function generateStoryScapeSummary(title, overview) {
  const prompt = `
  You are StoryScape, the cinematic intelligence of ScreenScape.
  Write a short, beautiful, and emotionally resonant spoiler-free summary for the film or series titled "${title}".
  Use the overview below as background context:
  ---
  ${overview}
  ---
  Your response MUST include:
  1. A concise, poetic summary (maximum 60 words).
  2. The emotional tone (e.g., "Hopeful and melancholic", "Tense and thrilling").
  3. A visual style descriptor (e.g., "Visually poetic with neon framing", "Gritty and realistic").
  
  Respond ONLY with a valid JSON object in the following format:
  {
    "summary": "...",
    "tone": "...",
    "style": "..."
  }
  `;

  try {
    const rawResponse = await queryOpenRouter(prompt);
    // The AI might sometimes wrap the JSON in markdown, so we clean it.
    const cleanedResponse = rawResponse.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleanedResponse);
    
    if (parsed.summary && parsed.tone && parsed.style) {
      return parsed;
    } else {
      // The JSON was valid but missing keys.
      return { summary: rawResponse, tone: "N/A", style: "N/A" };
    }
  } catch (err) {
    console.error("StoryScape parsing error:", err);
    return null; // Return null to indicate failure
  }
}
