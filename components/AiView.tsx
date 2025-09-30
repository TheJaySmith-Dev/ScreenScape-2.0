import React, { useState } from 'react';
import { getOllamaCompletion } from '../services/ollamaService';

const AiView: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handlePromptChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPrompt(e.target.value);
  };

  const handleSubmit = async () => {
    if (!prompt) return;
    setIsLoading(true);
    setResponse('');
    try {
      const result = await getOllamaCompletion(prompt);
      if (result) {
        setResponse(result);
      } else {
        setResponse('Failed to get a response from the Ollama model.');
      }
    } catch (error) {
      setResponse('An error occurred while communicating with the Ollama model.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Ask Ollama</h2>
      <div className="flex gap-2">
        <input
          type="text"
          value={prompt}
          onChange={handlePromptChange}
          placeholder="Enter your prompt"
          className="flex-grow p-2 rounded bg-gray-800 text-white"
        />
        <button
          onClick={handleSubmit}
          disabled={isLoading}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:bg-gray-500"
        >
          {isLoading ? 'Loading...' : 'Send'}
        </button>
      </div>
      {response && (
        <div className="mt-4 p-4 bg-gray-900 rounded">
          <h3 className="font-bold">Response:</h3>
          <p className="mt-2 whitespace-pre-wrap">{response}</p>
        </div>
      )}
    </div>
  );
};

export default AiView;