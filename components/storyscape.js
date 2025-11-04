// /components/storyscape.js
import { queryOpenRouter } from "./openrouter.js";

const DEFAULT_TONE = "Reflective and character-driven";
const DEFAULT_STYLE = "Grounded cinematic storytelling";

function extractJsonCandidate(raw) {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;

  // Remove leading explanatory text that may precede the JSON block.
  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");
  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    return null;
  }

  return trimmed.slice(firstBrace, lastBrace + 1);
}

function sanitizeResponse(rawResponse) {
  if (typeof rawResponse !== "string") {
    return "";
  }

  return rawResponse
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();
}

function buildFallbackSummary(title, overview) {
  if (!overview || typeof overview !== "string") {
    return null;
  }

  const cleanedOverview = overview.replace(/\s+/g, " ").trim();
  if (!cleanedOverview) {
    return null;
  }

  const maxLength = 280;
  let summary = cleanedOverview;
  if (cleanedOverview.length > maxLength) {
    const truncated = cleanedOverview.slice(0, maxLength);
    const lastSpace = truncated.lastIndexOf(" ");
    summary = `${truncated.slice(0, lastSpace > 200 ? lastSpace : maxLength)}…`;
  }

  return {
    summary: `"${summary}"`,
    tone: DEFAULT_TONE,
    style: DEFAULT_STYLE,
    origin: "fallback",
    note: `StoryScape's live service is unavailable, so this synopsis was adapted from the official overview for "${title}".`,
  };
}

function parseStoryScapeResponse(rawResponse) {
  const cleanedResponse = sanitizeResponse(rawResponse);
  const candidate = extractJsonCandidate(cleanedResponse);
  if (!candidate) {
    return null;
  }

  try {
    const parsed = JSON.parse(candidate);
    if (parsed && typeof parsed === "object") {
      const summary = typeof parsed.summary === "string" ? parsed.summary.trim() : "";
      const tone = typeof parsed.tone === "string" ? parsed.tone.trim() : "";
      const style = typeof parsed.style === "string" ? parsed.style.trim() : "";

      if (summary) {
        return {
          summary,
          tone: tone || DEFAULT_TONE,
          style: style || DEFAULT_STYLE,
          origin: "ai",
        };
      }
    }
  } catch (err) {
    console.error("StoryScape JSON parse error:", err);
  }

  return null;
}

/**
 * Generates a cinematic, spoiler-free summary for a movie or TV show using the OpenRouter AI.
 * @param {string} title The title of the media.
 * @param {string} overview The original TMDb overview to use as context.
 * @returns {Promise<{summary: string, tone: string, style: string} | null>} A structured object with the AI-generated content, or null on failure.
 */
export async function generateStoryScapeSummary(title, overview) {
  const prompt = `
  You are StoryScape, the cinematic intelligence of ChoiceForReels.
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

    // Check for error messages indicating unavailability
    const normalizedResponse = typeof rawResponse === "string" ? rawResponse.toLowerCase() : "";
    if (normalizedResponse.includes("unavailable") || normalizedResponse.includes("rate limit") || normalizedResponse.includes("connection issue")) {
      console.warn("StoryScape API unavailable, using fallback");
      const fallback = buildFallbackSummary(title, overview);
      if (fallback) {
        return fallback;
      }
      throw new Error("StoryScape is temporarily unavailable. Please try again later.");
    }

    const parsed = parseStoryScapeResponse(rawResponse);
    if (parsed) {
      return parsed;
    }

    // If parsing failed but we got a response, try to use it as direct summary
    if (rawResponse && typeof rawResponse === "string" && rawResponse.length > 10) {
      // Extract potential summary from response
      const summaryMatch = rawResponse.match(/"([^"]{10,200})"/);
      if (summaryMatch) {
        return {
          summary: summaryMatch[1],
          tone: DEFAULT_TONE,
          style: DEFAULT_STYLE,
          origin: "ai-fallback",
        };
      }

      // Use response directly if it looks like a summary
      if (rawResponse.length > 20 && rawResponse.length < 100) {
        return {
          summary: rawResponse,
          tone: DEFAULT_TONE,
          style: DEFAULT_STYLE,
          origin: "ai-direct",
        };
      }
    }

    const fallback = buildFallbackSummary(title, overview);
    if (fallback) {
      return fallback;
    }

    throw new Error("StoryScape could not understand the response it received.");
  } catch (err) {
    console.error("StoryScape parsing error:", err);
    if (err instanceof Error) {
      throw err;
    }
    throw new Error("StoryScape is still processing this title. Try again in a moment.");
  }
}
