import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { FALLBACK_MODELS, getAvailableModels } from '../services/imageGenerationService';

interface ImageGeneratorContextType {
  selectedModel: string;
  setSelectedModel: (model: string) => void;
  availableModels: string[];
}

const ImageGeneratorContext = createContext<ImageGeneratorContextType | undefined>(undefined);

export const useImageGenerator = () => {
  const context = useContext(ImageGeneratorContext);
  if (!context) {
    throw new Error('useImageGenerator must be used within an ImageGeneratorProvider');
  }
  return context;
};

interface ImageGeneratorProviderProps {
  children: ReactNode;
}

export const ImageGeneratorProvider: React.FC<ImageGeneratorProviderProps> = ({ children }) => {
  const [selectedModel, setSelectedModel] = useState<string>(FALLBACK_MODELS[0]);
  const [availableModels, setAvailableModels] = useState<string[]>(FALLBACK_MODELS);

  // Load available models on mount
  useEffect(() => {
    const loadModels = async () => {
      try {
        const models = await getAvailableModels();
        setAvailableModels(models);
        if (!selectedModel || !models.includes(selectedModel)) {
          setSelectedModel(models[0]);
        }
      } catch (err) {
        console.warn('Failed to load AI models, using fallbacks:', err);
        setAvailableModels(FALLBACK_MODELS);
      }
    };

    loadModels();
  }, []);

  return (
    <ImageGeneratorContext.Provider
      value={{
        selectedModel,
        setSelectedModel,
        availableModels,
      }}
    >
      {children}
    </ImageGeneratorContext.Provider>
  );
};
