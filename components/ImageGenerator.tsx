import React, { useState, useEffect } from 'react';
import { generateImage, getAvailableModels, type AvailableModel, FALLBACK_MODELS } from '../services/imageGenerationService';

const ImageGenerator: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [selectedModel, setSelectedModel] = useState<AvailableModel>(FALLBACK_MODELS[0]);
  const [availableModels, setAvailableModels] = useState<string[]>(FALLBACK_MODELS);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load available models on component mount
  useEffect(() => {
    const loadModels = async () => {
      try {
        const models = await getAvailableModels();
        setAvailableModels(models);
        if (!selectedModel || !models.includes(selectedModel)) {
          setSelectedModel(models[0]);
        }
      } catch (err) {
        console.warn('Failed to load models, using fallbacks:', err);
        setAvailableModels([...FALLBACK_MODELS]);
      }
    };

    loadModels();
  }, []);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setGeneratedImageUrl(null);

    try {
      const response = await generateImage({
        model: selectedModel,
        prompt: prompt.trim(),
      });

      if (response.success && response.imageUrl) {
        setGeneratedImageUrl(response.imageUrl);
      } else {
        setError(response.error || 'Failed to generate image');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isGenerating) {
      handleGenerate();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-secondary to-accent text-white">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">AI Image Generator</h1>
          <p className="text-slate-400">Generate stunning images with AI models powered by Pollinations.ai</p>
        </div>

        <div className="bg-slate-800 p-6 mb-8 rounded-3xl text-white">
          <div className="space-y-6">
            {/* Model Selection */}
          <div>
            <label className="block text-sm font-medium mb-3 text-white">AI Model</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {availableModels.map((model) => (
                <button
                  key={model}
                  onClick={() => setSelectedModel(model)}
                  className={`p-4 rounded-lg text-left transition-all duration-300 text-white ${
                    selectedModel === model
                      ? 'bg-slate-700 ring-2 ring-accent-500'
                      : 'bg-slate-700 hover:bg-slate-600'
                  }`}
                >
                  <div className="font-medium">{model}</div>
                  <div className="text-sm text-slate-300">FLUX Series</div>
                  <div className="text-xs text-slate-400">Powered by Pollinations.ai</div>
                </button>
              ))}
            </div>
          </div>

          {/* Prompt Input */}
          <div>
            <label htmlFor="prompt" className="block text-sm font-medium mb-2 text-white">
              Describe your image
            </label>
            <textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="A cyberpunk city at night with neon lights and flying cars..."
              className="w-full p-4 rounded-lg glass-element bg-transparent text-white placeholder-slate-500 resize-none focus:outline-none focus:ring-2 focus:ring-accent-400"
              rows={4}
              disabled={isGenerating}
            />
          </div>

          {/* Generate Button */}
          <div className="text-center">
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !prompt.trim()}
              className={`px-8 py-3 rounded-full font-semibold transition-all duration-300 ${
                isGenerating || !prompt.trim()
                  ? 'glass-button-secondary cursor-not-allowed opacity-50'
                  : 'glass-button-primary hover:scale-105'
              }`}
            >
              {isGenerating ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Generating...
                </div>
              ) : (
                'Generate Image'
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-8">
          <div className="glass-element p-4 rounded-lg border border-red-500/30 bg-red-500/10">
            <p className="text-red-400 text-center">{error}</p>
          </div>
        </div>
      )}

      {/* Generated Image Display */}
      {generatedImageUrl && (
        <div className="text-center">
          <div className="bg-slate-800 p-6 inline-block rounded-3xl text-white">
            <h3 className="text-xl font-semibold mb-4">Generated Image</h3>
            <div className="relative">
              <img
                src={generatedImageUrl}
                alt="Generated image"
                className="max-w-full h-auto rounded-lg shadow-lg max-h-96 object-contain"
                loading="lazy"
              />
            </div>
            <div className="mt-4 flex gap-3 justify-center">
              <button
                onClick={() => window.open(generatedImageUrl!, '_blank')}
                className="px-6 py-2 glass-button rounded-full text-sm hover:scale-105 transition-transform"
              >
                View Full Size
              </button>
              <button
                onClick={() => navigator.clipboard.writeText(generatedImageUrl!)}
                className="px-6 py-2 glass-button rounded-full text-sm hover:scale-105 transition-transform"
              >
                Copy Link
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </div>
  );
};

export default ImageGenerator;
