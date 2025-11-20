import React, { useState, useEffect } from 'react';
import { LiquidGlassWrapper } from './LiquidGlassWrapper';
import { generateImage } from '../services/imageGenerationService';
import { useImageGenerator } from '../contexts/ImageGeneratorContext';

const ImageGenerator: React.FC = () => {
  const { selectedModel, setSelectedModel, availableModels } = useImageGenerator();
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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
            <LiquidGlassWrapper
              componentType="button"
              intensity="prominent"
              effect="regular"
              shape="pill"
              refractionQuality="balanced"
              artifactReduction="mild"
              onClick={isGenerating || !prompt.trim() ? undefined : handleGenerate}
              className={isGenerating || !prompt.trim() ? '' : 'transition-transform duration-300 hover:scale-[1.03] active:scale-[0.98]'}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '12px 24px',
                border: '1px solid rgba(255,255,255,0.22)',
                boxShadow: '0 10px 24px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.35), inset 0 -1px 0 rgba(0,0,0,0.2)',
                color: '#fff',
                fontWeight: 600,
                borderRadius: 9999,
                cursor: isGenerating || !prompt.trim() ? 'not-allowed' : 'pointer',
                opacity: isGenerating || !prompt.trim() ? 0.5 : 1
              }}
            >
              {isGenerating ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Generating...
                </div>
              ) : (
                'Generate'
              )}
            </LiquidGlassWrapper>
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
