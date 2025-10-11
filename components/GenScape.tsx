import React from 'react';
import { useGenScape } from '../hooks/useGenScape';
import { ImageIcon, PaperAirplaneIcon, DownloadIcon } from './Icons';

const GenScape: React.FC = () => {
    const { prompt, setPrompt, isLoading, error, generatedImage, generateImage } = useGenScape();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        generateImage();
    };

    const handleDownload = () => {
        if (!generatedImage) return;
        const link = document.createElement('a');
        link.href = generatedImage;
        link.download = `genscape-${prompt.slice(0, 20).replace(/\s/g, '_')}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="container mx-auto px-4 py-8 min-h-[calc(100vh-5rem)] flex flex-col items-center animate-fade-in-up">
            <div className="w-full max-w-4xl">
                <div className="text-center mb-8">
                    <h1 className="text-4xl sm:text-5xl font-bold animate-glow">GenScape</h1>
                    <p className="text-slate-400 mt-2">Your AI-powered image generation studio.</p>
                </div>

                {/* Tabs for Future Expansion */}
                <div className="flex justify-center mb-8">
                    <div className="bg-glass rounded-full p-1 flex items-center">
                        <button className="px-6 py-2 rounded-full bg-white text-primary font-semibold flex items-center gap-2">
                            <ImageIcon className="w-5 h-5" />
                            <span>Image</span>
                        </button>
                        <button className="px-6 py-2 rounded-full text-slate-400 font-semibold" disabled>
                            Video (Coming Soon)
                        </button>
                    </div>
                </div>

                {/* Generation Area */}
                <div className="w-full glass-panel p-4 rounded-2xl">
                    <div className="relative aspect-video w-full bg-primary/50 rounded-lg flex items-center justify-center overflow-hidden">
                        {isLoading ? (
                            <div className="text-center">
                                <div className="animate-pulse text-slate-300">
                                    <ImageIcon className="w-16 h-16 mx-auto mb-4" />
                                </div>
                                <p className="mt-2 text-slate-400 font-semibold">Generating your vision...</p>
                                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-3/4 h-1.5 bg-glass-edge rounded-full overflow-hidden">
                                     <div className="h-full bg-accent-500 animate-ripple-glow" style={{background: 'linear-gradient(90deg, transparent, var(--color-accent-500), transparent)', backgroundSize: '200% 100%'}}></div>
                                </div>
                            </div>
                        ) : generatedImage ? (
                            <>
                                <img src={generatedImage} alt={prompt} className="w-full h-full object-contain" />
                                <div className="absolute bottom-2 right-2 flex items-center gap-2">
                                     <span className="text-xs text-slate-400 bg-black/50 px-2 py-1 rounded">Powered by FreePik</span>
                                    <button onClick={handleDownload} className="p-2 glass-button rounded-full" title="Download Image">
                                        <DownloadIcon className="w-5 h-5"/>
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div className="text-center text-slate-500 p-8">
                                <ImageIcon className="w-16 h-16 mx-auto mb-4" />
                                <p>Your generated image will appear here.</p>
                            </div>
                        )}
                    </div>
                </div>
                
                {/* Prompt Input */}
                <form onSubmit={handleSubmit} className="mt-6 flex flex-col sm:flex-row items-center gap-3">
                    <input
                        type="text"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="A futuristic car on Mars, cinematic lighting..."
                        disabled={isLoading}
                        className="w-full bg-glass border border-glass-edge rounded-full py-3 px-5 text-white placeholder-slate-400 focus:ring-2 focus:ring-accent-500 outline-none transition-all"
                    />
                    <button
                        type="submit"
                        disabled={isLoading || !prompt.trim()}
                        className="w-full sm:w-auto flex-shrink-0 flex items-center justify-center gap-2 bg-accent-500 text-white font-bold px-6 py-3 rounded-full transition-all hover:scale-105 disabled:bg-slate-600 disabled:scale-100 disabled:cursor-not-allowed"
                    >
                        <PaperAirplaneIcon className="w-5 h-5" />
                        <span>Generate</span>
                    </button>
                </form>
                {error && <p className="text-red-400 mt-2 text-center">{error}</p>}
            </div>
        </div>
    );
};

export default GenScape;