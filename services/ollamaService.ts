import ollama from 'ollama';

// This service will handle the Ollama AI integration.
// To use this service, you need to have the Ollama client running locally.
// 1. Download and install Ollama from https://ollama.com/download
// 2. Pull a cloud model, e.g.: ollama pull gpt-oss:120b-cloud

export const getOllamaCompletion = async (prompt: string): Promise<string | null> => {
  try {
    const response = await ollama.chat({
      model: "gpt-oss:120b-cloud", // Or any other cloud model
      messages: [{ role: "user", content: prompt }],
    });
    return response.message.content;
  } catch (error) {
    console.error("Error getting Ollama completion:", error);
    return "An error occurred while communicating with the Ollama model. Make sure the Ollama client is running and you have pulled a cloud model.";
  }
};