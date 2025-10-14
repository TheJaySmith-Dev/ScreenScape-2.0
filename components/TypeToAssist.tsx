import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as assistantEngine from '../services/assistantEngine';
// FIX: Import useGeolocation to get the user's selected country for API calls.
import { useGeolocation } from '../hooks/useGeolocation';
import { KeyboardIcon, PaperAirplaneIcon, XIcon, SparklesIcon } from './Icons';

interface TypeToAssistProps {
    tmdbApiKey: string;
}

const TypeToAssist: React.FC<TypeToAssistProps> = ({ tmdbApiKey }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const [response, setResponse] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    // FIX: Get the country code from the useGeolocation hook.
    const { country } = useGeolocation();

    const handleCommand = useCallback(async (command: string) => {
        if (!command.trim()) return;

        setIsLoading(true);
        setResponse(null);

        // FIX: Pass the country code as the region for the API call.
        const result = await assistantEngine.processAssistantCommand(command, tmdbApiKey, country.code);
        
        setResponse(result.message);
        if (result.action === 'close') {
            // Give user time to read confirmation message before closing
            setTimeout(() => setIsOpen(false), 1500);
        }
        setIsLoading(false);
    }, [tmdbApiKey, country.code]);

    const handleSubmit = (e?: React.FormEvent) => {
        e?.preventDefault();
        handleCommand(inputValue);
        setInputValue('');
    };
    
    useEffect(() => {
        if (isOpen) {
            inputRef.current?.focus();
        } else {
            setResponse(null);
            setInputValue('');
        }
    }, [isOpen]);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setIsOpen(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    return (
        <>
            <button
                title="Type to Assist"
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-24 md:bottom-8 md:right-28 text-white p-4 rounded-full shadow-lg transition-transform hover:scale-110 z-50 animate-fade-in bg-slate-600 hover:bg-slate-500"
            >
                <KeyboardIcon className="w-6 h-6" />
            </button>

            {isOpen && (
                <div 
                    className="fixed inset-0 bg-black/50 z-[90] flex items-end justify-center p-4"
                    onClick={() => setIsOpen(false)}
                >
                    <div
                        className="w-full max-w-2xl glass-panel p-4 rounded-2xl shadow-2xl animate-fade-in-up"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-center mb-4">
                            <div className="flex items-center gap-2 text-slate-200 font-semibold">
                                <SparklesIcon className="w-5 h-5" />
                                <span>Assistant</span>
                            </div>
                            <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white">
                                <XIcon className="w-5 h-5" />
                            </button>
                        </div>
                        
                        {response && (
                             <div className="mb-4 text-slate-300 bg-primary/30 p-3 rounded-lg text-sm">
                                {response}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="flex items-center gap-2">
                            <input
                                ref={inputRef}
                                type="text"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                placeholder="e.g., 'Who directed Oppenheimer?'"
                                disabled={isLoading}
                                className="w-full bg-glass border border-glass-edge rounded-full py-2.5 px-4 text-white placeholder-slate-400 focus:ring-2 focus:ring-accent-500 outline-none transition-all"
                            />
                            <button 
                                type="submit" 
                                disabled={isLoading || !inputValue.trim()}
                                className="p-3 bg-accent-500 rounded-full text-white transition-transform hover:scale-110 disabled:bg-slate-500 disabled:scale-100"
                            >
                                {isLoading ? (
                                    <div className="w-5 h-5 border-2 border-white/50 border-t-white rounded-full animate-spin"></div>
                                ) : (
                                    <PaperAirplaneIcon className="w-5 h-5" />
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
};

export default TypeToAssist;