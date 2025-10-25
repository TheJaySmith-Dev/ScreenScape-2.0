const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY || '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';
const OPENROUTER_ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";

/**
 * Sends a prompt to the OpenRouter API using a free model and returns a cinematic response.
 * @param {string} prompt The user's query for the AI assistant.
 * @returns {Promise<string>} A string containing the AI's response or an error message.
 */
export async function queryOpenRouter(prompt) {
  try {
    // Try multiple models in order of preference
    const models = [
      "microsoft/wizardlm-2-8x22b:free",
      "mistralai/mistral-7b-instruct:free",
      "huggingface/zephyr-7b-beta:free",
      "meta-llama/llama-3.1-8b-instruct:free"
    ];

    let lastError = null;

    for (const model of models) {
      try {
        console.log(`Attempting to use model: ${model}`);

        const response = await fetch(OPENROUTER_ENDPOINT, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
            "Content-Type": "application/json",
            "HTTP-Referer": "https://screenscape.space",
            "X-Title": "ScreenScape",
          },
          body: JSON.stringify({
            model: model,
            messages: [
              { role: "system", content: "You are ScreenScape AI, a cinematic assistant who speaks like a film curator with poetic energy and deep insight. Keep your answers concise, ideally two to three sentences." },
              { role: "user", content: prompt }
            ]
          })
        });

        if (response.ok) {
          const data = await response.json();
          const content = data?.choices?.[0]?.message?.content?.trim();
          if (content) {
            console.log(`Successfully used model: ${model}`);
            return content;
          }
        } else {
          const errorData = await response.json().catch(() => ({}));
          console.warn(`Model ${model} failed:`, response.status, errorData);
          lastError = `HTTP ${response.status}: ${errorData?.error || response.statusText}`;
        }
      } catch (modelError) {
        console.warn(`Model ${model} error:`, modelError);
        lastError = modelError.message;
      }
    }

    // If all models fail, return a fallback message
    console.error("All OpenRouter models failed. Last error:", lastError);
    return "AI services are currently experiencing technical difficulties. We're unable to generate content at this time, but you can still enjoy browsing our movie and TV database.";

  } catch (err) {
    console.error("OpenRouter Connection Error:", err);
    return "We're experiencing connectivity issues with our AI services. Please check your internet connection and try again.";
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

  // If AI failed to generate content and returned a fallback message, provide static facts
  if (facts.includes("AI services are currently experiencing") ||
      facts.includes("experiencing connectivity issues") ||
      facts.includes("currently unavailable")) {
    return `• ${title} is a ${title.includes("The") ? "film" : "production"} that explores themes of ${overview.toLowerCase().includes("love") ? "romance and relationships" : "adventure and discovery"}.
• The story unfolds through compelling character development and ${overview.length > 100 ? "intricate plot twists" : "heartwarming moments"}.
• This work showcases the artistic vision of its creators, blending ${overview.toLowerCase().includes("family") ? "emotional depth" : "entertainment value"} with creative storytelling.
• Many viewers appreciate how the narrative maintains engagement throughout its ${title.includes("TV") ? "episodes" : "runtime"}.`;
  }

  return facts;
}

/**
 * Generates AI-powered reviews about a movie or TV show using the OpenRouter API.
 * @param {string} title The title of the movie or TV show.
 * @param {string} overview A brief overview or synopsis of the title.
 * @param {number} rating The TMDB rating out of 10.
 * @param {string[]} genres Array of genre names.
 * @returns {Promise<string>} Generated reviews or an error message.
 */
export async function generateReviewsAI(title, overview, rating, genres = []) {
  const genreList = genres.length > 0 ? genres.join(', ') : 'various genres';
  const prompt = `Generate 2-3 detailed, realistic reviews for the movie or TV show "${title}" which has a rating of ${rating}/10 and belongs to these genres: ${genreList}.

Use the following synopsis as context: "${overview}"

Each review should:
- Be 2-4 sentences long
- Sound like a real critic or viewer
- Include both positive and critical points where appropriate
- Reference specific elements from the story or style when possible
- Vary in perspective (some enthusiastic, some mixed, some focused on different aspects)

Format as a series of separate reviews, clearly separated. Don't add any introduction or conclusion text.`;

  const reviews = await queryOpenRouter(prompt);

  // If AI failed to generate content and returned a fallback message, provide static reviews
  if (reviews.includes("AI services are currently experiencing") ||
      reviews.includes("experiencing connectivity issues") ||
      reviews.includes("currently unavailable")) {
    return `"${title}" offers a compelling ${genres.includes('Drama') ? 'dramatic' : 'entertaining'} experience that resonates with audiences seeking meaningful storytelling. The ${Math.round(rating)}/10 rating reflects its ability to blend ${overview.length > 150 ? 'complex themes with accessible pacing' : 'heart and substance effectively'}. While not groundbreaking, it delivers solid performances and a narrative that's both engaging and thought-provoking.

A thoroughly enjoyable ${genreList.toLowerCase()} piece that understands its audience well. The story moves at a comfortable pace without wasting time, delivering genuine emotional moments that feel earned rather than forced. Some plot decisions feel predictable, but the overall execution makes this a worthwhile watch that doesn't overstay its welcome.`;
  }

  return reviews;
}
