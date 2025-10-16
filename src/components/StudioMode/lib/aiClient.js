import axios from 'axios';

const openRouterKey = import.meta.env.VITE_OPENROUTER_KEY;
const openRouterBase = import.meta.env.VITE_OPENROUTER_BASE;

class AIClient {
    constructor() {
        this.client = axios.create({
            baseURL: openRouterBase,
            headers: {
                'Authorization': `Bearer ${openRouterKey}`,
                'Content-Type': 'application/json',
            },
        });
    }

    async callAI(prompt, systemMessage = "", model = "anthropic/claude-3-haiku", temperature = 0.7) {
        try {
            const response = await this.client.post('/chat/completions', {
                model: model,
                messages: [
                    { role: 'system', content: systemMessage },
                    { role: 'user', content: prompt }
                ],
                temperature: temperature,
                max_tokens: 1000,
            });
            return response.data.choices[0].message.content;
        } catch (error) {
            console.error('AI Client Error:', error);
            return null;
        }
    }

    async callAIJSON(prompt, systemMessage = "", model = "anthropic/claude-3-haiku", temperature = 0.7) {
        const jsonPrompt = `${prompt}\n\nRespond ONLY with valid JSON, no other text.`;
        const response = await this.callAI(jsonPrompt, systemMessage, model, temperature);
        if (response) {
            try {
                return JSON.parse(response);
            } catch (e) {
                console.error('Failed to parse JSON response:', response);
                return null;
            }
        }
        return null;
    }
}

export default new AIClient();
