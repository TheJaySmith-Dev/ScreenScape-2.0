import React, { useEffect } from 'react';
import { AIStatus } from './AIAssistant';

interface AIGlowProps {
  status: AIStatus;
}

const AIGlow: React.FC<AIGlowProps> = ({ status }) => {
  const isActive = status !== 'idle';

  useEffect(() => {
    if (isActive) {
      document.body.classList.add('voice-mode-active');
    } else {
      document.body.classList.remove('voice-mode-active');
    }

    // Cleanup function to remove the class when the component unmounts
    return () => {
      document.body.classList.remove('voice-mode-active');
    };
  }, [isActive]);

  return null; // The visual glow is now handled entirely by CSS on the body element.
};

export default AIGlow;