const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY || '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';
const OPENROUTER_ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";

/**
 * Sends a prompt to the OpenRouter API using a free model and returns a cinematic response.
 * @param {string} prompt The user's query for the AI assistant.
 * @returns {Promise<string>} A string containing the AI's response or an error message.
 */
export async function queryOpenRouter(prompt) {
  try {
    const response = await fetch(OPENROUTER_ENDPOINT, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://screenscape.space", // Add referrer
        "X-Title": "ScreenScape", // Add app title
      },
      body: JSON.stringify({
        model: "openai/gpt-oss-20b:free",
        messages: [
          { role: "system", content: "You are ScreenScape AI, a cinematic assistant who speaks like a film curator with poetic energy and deep insight. Keep your answers concise, ideally two to three sentences." },
          { role: "user", content: prompt }
        ]
      })
    });

    if (!response.ok) {
        const errorData = await response.json();
        console.error("OpenRouter API Error:", errorData);
        // Provide a user-friendly message for API errors (e.g., rate limits)
        return "The AI assistant is currently unavailable. Please try again later.";
    }

    const data = await response.json();
    return data?.choices?.[0]?.message?.content?.trim() || "The AI assistant returned an empty response.";
  } catch (err) {
    console.error("OpenRouter Connection Error:", err);
    return "Connection issue, please try again.";
  }
}

/**
 * Generates fun facts about a movie or TV show using the OpenRouter API.
 * @param {string} title The title of the movie or TV show.
 * @param {string} overview A brief overview or synopsis of the title.
 * @returns {Promise<string>} Fun facts about the title or an error message.
 */
export async function generateFactsAI(title, overview) {
  const prompt = `Provide 3-5 interesting and fun facts about the movie or TV show "${title}". Use the following synopsis as context: "${overview}". Make the facts engaging, lesser-known, and accurate. Format as a bulleted list without extra commentary.`;
  
  const facts = await queryOpenRouter(prompt);
  
  // Since queryOpenRouter might fail, we let it handle errors and return messages
  return facts;
}
