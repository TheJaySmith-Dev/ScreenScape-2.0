// This service will handle the Ollama AI integration.
// To use this service, you need to have the Ollama client running locally.
// 1. Download and install Ollama from https://ollama.com/download
// 2. Pull a cloud model, e.g.: ollama pull gpt-oss:120b-cloud

const OLLAMA_API_BASE_URL = 'http://localhost:11434/api';

interface OllamaChatRequest {
  model: string;
  messages: { role: 'user' | 'system' | 'assistant'; content: string }[];
  stream?: boolean;
}

interface OllamaChatResponse {
  model: string;
  created_at: string;
  message: {
    role: 'assistant';
    content: string;
  };
  done: boolean;
  total_duration: number;
  load_duration: number;
  prompt_eval_count: number;
  prompt_eval_duration: number;
  eval_count: number;
  eval_duration: number;
}

export const getOllamaCompletion = async (prompt: string): Promise<string | null> => {
  try {
    const requestBody: OllamaChatRequest = {
      model: "gpt-oss:120b-cloud", // Or any other cloud model
      messages: [{ role: "user", content: prompt }],
      stream: false,
    };

    const response = await fetch(`${OLLAMA_API_BASE_URL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      console.error('Failed to fetch from Ollama server:', response.statusText);
      const errorText = await response.text();
      console.error('Server response:', errorText);
      return `Error: ${response.statusText}. Check the console for more details. Make sure the Ollama client is running.`;
    }

    const data: OllamaChatResponse = await response.json();
    return data.message.content;
  } catch (error) {
    console.error('Error getting Ollama completion:', error);
    return 'An error occurred while communicating with the Ollama model. Make sure the Ollama client is running and you have pulled a cloud model.';
  }
};