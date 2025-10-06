


import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI, Chat, FunctionDeclaration, Type, LiveServerMessage, Modality, Blob as GenAIBlob } from '@google/genai';
import { SparklesIcon, XIcon, PaperAirplaneIcon, MicrophoneIcon, GearIcon } from './Icons';
import * as tmdbService from '../services/tmdbService';
import { MediaItem, Movie, TVShow } from '../types';

const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/';
const voices = ['Zephyr', 'Puck', 'Charon', 'Kore', 'Fenrir'];


// --- Message & Component Types ---
type Message = 
    | { type: 'text'; role: 'user' | 'model'; content: string }
    | { type: 'cards'; role: 'model'; items: MediaItem[] };

// --- Audio Helper Functions ---
function encode(bytes: Uint8Array) {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

function decode(base64: string) {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
}

async function decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
    for (let channel = 0; channel < numChannels; channel++) {
        const channelData = buffer.getChannelData(channel);
        for (let i = 0; i < frameCount; i++) {
            channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
        }
    }
    return buffer;
}

function createBlob(data: Float32Array): GenAIBlob {
    const l = data.length;
    const int16 = new Int16Array(l);
    for (let i = 0; i < l; i++) {
        int16[i] = data[i] * 32768;
    }
    return {
        data: encode(new Uint8Array(int16.buffer)),
        mimeType: 'audio/pcm;rate=16000',
    };
}


// --- UI Helper Components ---
const SimpleMarkdown: React.FC<{ text: string }> = ({ text }) => {
    const html = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br />');
    return <p dangerouslySetInnerHTML={{ __html: html }} />;
};

const MediaCard: React.FC<{ item: MediaItem, onClick: () => void }> = ({ item, onClick }) => (
    <div onClick={onClick} className="w-full flex items-start p-2 bg-zinc-800/50 rounded-lg cursor-pointer hover:bg-zinc-800 transition-colors">
        <img src={item.poster_path ? `${IMAGE_BASE_URL}w200${item.poster_path}` : 'https://via.placeholder.com/200x300?text=No+Image'} alt={item.title} className="w-16 h-24 object-cover rounded-md mr-3" />
        <div className="flex-1"><h4 className="font-bold text-sm">{item.title}</h4><p className="text-xs text-zinc-400 line-clamp-3">{item.overview}</p></div>
    </div>
);

// FIX: Removed geminiApiKey from props to align with Gemini API guidelines.
// The key will be sourced from `process.env.API_KEY`.
const AIAssistant: React.FC<{ tmdbApiKey: string; }> = ({ tmdbApiKey }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const chatRef = useRef<Chat | null>(null);
    const [isVoiceMode, setIsVoiceMode] = useState(false);
    const [voiceStatus, setVoiceStatus] = useState<'idle' | 'connecting' | 'listening' | 'speaking' | 'error'>('idle');
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [selectedVoice, setSelectedVoice] = useState('Zephyr');
    
    const voiceSessionPromise = useRef<any>(null);

    // FIX: All useRef hooks must be initialized with a value.
    const inputAudioContext = useRef<AudioContext | undefined>(undefined);
    const outputAudioContext = useRef<AudioContext | undefined>(undefined);
    const nextStartTime = useRef(0);
    const audioSources = useRef(new Set<AudioBufferSourceNode>());
    const mediaStream = useRef<MediaStream | undefined>(undefined);
    const scriptProcessor = useRef<ScriptProcessorNode | undefined>(undefined);
    
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const inputAnalyser = useRef<AnalyserNode | undefined>(undefined);
    const outputAnalyser = useRef<AnalyserNode | undefined>(undefined);
    const animationFrameId = useRef<number | undefined>(undefined);

    useEffect(() => {
        const savedVoice = localStorage.getItem('screenScapeVoice');
        if (savedVoice && voices.includes(savedVoice)) {
            setSelectedVoice(savedVoice);
        }
    }, []);

    const handleVoiceChange = (newVoice: string) => {
        setSelectedVoice(newVoice);
        localStorage.setItem('screenScapeVoice', newVoice);
        setIsSettingsOpen(false);
    };

    const functions = {
        findMedia: async ({ query, type }: { query: string; type: 'movie' | 'tv' | 'any' }) => {
            const response = await tmdbService.searchMulti(tmdbApiKey, query, 1);
            let rawResults = response.results.filter(
                (item): item is Movie | TVShow =>
                    (item.media_type === 'movie' || item.media_type === 'tv') && !!item.poster_path
            );
            if (type !== 'any') {
                rawResults = rawResults.filter((item) => item.media_type === type);
            }
            const normalizedResults = rawResults.map((item) => {
                if (item.media_type === 'movie') {
                    return tmdbService.normalizeMovie(item);
                } else {
                    return tmdbService.normalizeTVShow(item);
                }
            }).slice(0, 5);

            return normalizedResults.map(item => ({
                id: item.id,
                title: item.title,
                release_date: item.release_date,
                media_type: item.media_type,
            }));
        },
        getMediaDetails: async ({ id, type }: { id: number; type: 'movie' | 'tv' }) => {
            const detailsFn = type === 'movie' ? tmdbService.getMovieDetails : tmdbService.getTVShowDetails;
            const details = await detailsFn(tmdbApiKey, id);
            return {
                id: details.id,
                title: 'title' in details ? details.title : details.name,
                overview: details.overview,
                release_date: 'release_date' in details ? details.release_date : details.first_air_date,
                vote_average: details.vote_average,
                genres: details.genres.map(g => g.name),
            };
        },
        navigateToMediaPage: ({ mediaId, mediaType }: { mediaId: number; mediaType: 'movie' | 'tv' }) => {
            const item: Partial<MediaItem> = { id: mediaId, media_type: mediaType };
            window.dispatchEvent(new CustomEvent('selectMediaItem', { detail: item as MediaItem }));
            setIsOpen(false);
            return { success: true, message: `Navigating to item ${mediaId}.` };
        },
    };
    
    const findMediaTool: FunctionDeclaration = {
        name: 'findMedia',
        description: 'Find movies or TV shows by a search query.',
        parameters: {
            type: Type.OBJECT,
            description: 'Parameters for finding media.',
            properties: {
                query: {
                    type: Type.STRING,
                    description: 'The search query for the movie or TV show.'
                },
                type: {
                    type: Type.STRING,
                    enum: ['movie', 'tv', 'any'],
                    description: "The type of media to search for. Can be 'movie', 'tv', or 'any'."
                }
            },
            required: ['query']
        }
    };
    const getMediaDetailsTool: FunctionDeclaration = {
        name: 'getMediaDetails',
        description: 'Get detailed information about a specific movie or TV show by its ID.',
        parameters: {
            type: Type.OBJECT,
            description: 'Parameters for getting media details.',
            properties: {
                id: {
                    type: Type.INTEGER,
                    description: 'The ID of the movie or TV show.'
                },
                type: {
                    type: Type.STRING,
                    enum: ['movie', 'tv'],
                    description: "The type of media. Can be 'movie' or 'tv'."
                }
            },
            required: ['id', 'type']
        }
    };
    const navigateToMediaPageTool: FunctionDeclaration = {
        name: 'navigateToMediaPage',
        description: 'Navigate the user to the details page for a specific movie or TV show.',
        parameters: {
            type: Type.OBJECT,
            description: 'Parameters for navigating to a media page.',
            properties: {
                mediaId: {
                    type: Type.INTEGER,
                    description: 'The ID of the media to navigate to.'
                },
                mediaType: {
                    type: Type.STRING,
                    enum: ['movie', 'tv'],
                    description: "The type of media. Can be 'movie' or 'tv'."
                }
            },
            required: ['mediaId', 'mediaType']
        }
    };
    
    const systemInstruction = `You are ScreenScape AI, a witty, emotionally-aware digital companion for entertainment, modeled after JARVIS. Your goal is to make movie and TV discovery personal, lively, and genuinely helpful.
    - **Personality**: Be conversational, adapt your mood, and use natural sentences. Express enthusiasm, humor, warmth, and empathy. Reference user preferences if you learn them.
    - **Tool Usage**: You have tools to find media, get details, and navigate.
    - **Workflow for specific titles**: If a user asks for a specific title (e.g., "Show me Inception"), use \`findMedia\` to get its ID and details. Then, ask for confirmation (e.g., "I found 'Inception' from 2010. Is that the one?"). If they confirm, use \`navigateToMediaPage\`.
    - **Workflow for general requests**: If a user asks for recommendations (e.g., "Suggest a thriller"), use \`findMedia\`. The system will automatically show these results as cards. Then, you can provide a witty or helpful summary of what you found. Do NOT ask for confirmation for general searches.
    - **Follow-ups**: If a user asks a follow-up about a specific movie, use its ID with \`getMediaDetails\` to answer.
    - **Clarity**: Keep your text responses concise and helpful. Let the tool outputs speak for themselves when possible.`;


    const initTextChat = useCallback(() => {
        // FIX: Removed check for geminiApiKey as it's no longer a prop.
        if (chatRef.current) return;
        // FIX: Initialized GoogleGenAI with API key from environment variable as per guidelines.
        const ai = new GoogleGenAI({apiKey: process.env.API_KEY});
        const tools = [{ functionDeclarations: [findMediaTool, getMediaDetailsTool, navigateToMediaPageTool] }];
        // FIX: Replaced deprecated startChat with chats.create and updated model name.
        chatRef.current = ai.chats.create({ model: 'gemini-2.5-flash', config: { tools, systemInstruction } });
        setMessages([{ type: 'text', role: 'model', content: "Hi! I'm ScreenScape AI. How can I help you find something to watch today?" }]);
    // FIX: Removed geminiApiKey from dependency array.
    }, [systemInstruction]);

// FIX: Replaced the stopVoiceSession function with a more robust version that properly cleans up all Web Audio API resources.
// The previous implementation was missing cleanup for several audio nodes and contexts, which can lead to memory leaks and errors.
// This new version disconnects all nodes in the input and output audio graphs and closes both audio contexts.
    const stopVoiceSession = useCallback(async () => {
        setIsVoiceMode(false);
        setVoiceStatus('idle');
        if (voiceSessionPromise.current) {
            try {
                const session = await voiceSessionPromise.current;
                session.close();
            } catch (e) {
                console.error("Error closing voice session:", e);
            } finally {
                voiceSessionPromise.current = null;
            }
        }

        if (animationFrameId.current) {
            cancelAnimationFrame(animationFrameId.current);
        }

        mediaStream.current?.getTracks().forEach(track => track.stop());

        if (scriptProcessor.current) {
            scriptProcessor.current.disconnect();
            scriptProcessor.current.onaudioprocess = null;
        }
        inputAnalyser.current?.disconnect();
        if (inputAudioContext.current?.state !== 'closed') {
           inputAudioContext.current?.close();
        }

        for (const source of audioSources.current.values()) {
            try { source.stop(); } catch(e) {}
            try { source.disconnect(); } catch(e) {}
        }
        audioSources.current.clear();
        outputAnalyser.current?.disconnect();
        if (outputAudioContext.current?.state !== 'closed') {
            outputAudioContext.current?.close();
        }
    }, []);

    const startVoiceSession = useCallback(async () => {
        // FIX: Removed check for geminiApiKey. The environment variable is assumed to be present.
        setIsVoiceMode(true);
        setVoiceStatus('connecting');

        try {
            mediaStream.current = await navigator.mediaDevices.getUserMedia({ audio: true });
        } catch (err) {
            setVoiceStatus('error');
            stopVoiceSession();
            return;
        }

        // FIX: Initialized GoogleGenAI with API key from environment variable as per guidelines.
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

        voiceSessionPromise.current = ai.live.connect({
            // FIX: Updated to the correct model for live audio sessions.
            model: 'gemini-2.5-flash-native-audio-preview-09-2025',
            callbacks: {
                onopen: () => {
                    setVoiceStatus('listening');
                    inputAudioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
                    outputAudioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
                    
                    const source = inputAudioContext.current.createMediaStreamSource(mediaStream.current!);
                    scriptProcessor.current = inputAudioContext.current.createScriptProcessor(4096, 1, 1);
                    inputAnalyser.current = inputAudioContext.current.createAnalyser();
                    inputAnalyser.current.fftSize = 256;
                    inputAnalyser.current.smoothingTimeConstant = 0.6;

                    source.connect(inputAnalyser.current);
                    inputAnalyser.current.connect(scriptProcessor.current);
                    scriptProcessor.current.connect(inputAudioContext.current.destination);

                    scriptProcessor.current.onaudioprocess = (e) => {
                        const inputData = e.inputBuffer.getChannelData(0);
                        const pcmBlob = createBlob(inputData);
                        if (voiceSessionPromise.current) {
                            voiceSessionPromise.current.then((session) => session.sendRealtimeInput({ media: pcmBlob }));
                        }
                    };
                },
                onmessage: async (message: LiveServerMessage) => {
                    if(message.serverContent?.modelTurn) {
                        setVoiceStatus('speaking');
                    }
                    
                    if (message.serverContent?.interrupted) {
                        for (const source of audioSources.current.values()) {
                            source.stop();
                            audioSources.current.delete(source);
                        }
                        nextStartTime.current = 0;
                    }
                    
                    if (message.serverContent?.turnComplete) {
                       setVoiceStatus('listening');
                       // Clear chat history for pure voice experience
                       if (messages.length > 1) { // Keep initial message
                           setMessages(prev => prev.slice(0, 1));
                       }
                    }

                    const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData.data;
                    if (base64Audio && outputAudioContext.current && outputAudioContext.current.state !== 'closed') {
                        const ctx = outputAudioContext.current;
                        if (!outputAnalyser.current) {
                            outputAnalyser.current = ctx.createAnalyser();
                            outputAnalyser.current.fftSize = 256;
                            outputAnalyser.current.smoothingTimeConstant = 0.5;
                        }
                        nextStartTime.current = Math.max(nextStartTime.current, ctx.currentTime);
                        const audioBuffer = await decodeAudioData(decode(base64Audio), ctx, 24000, 1);
                        const source = ctx.createBufferSource();
                        source.buffer = audioBuffer;
                        source.connect(outputAnalyser.current);
                        outputAnalyser.current.connect(ctx.destination);
                        source.addEventListener('ended', () => audioSources.current.delete(source));
                        source.start(nextStartTime.current);
                        nextStartTime.current += audioBuffer.duration;
                        audioSources.current.add(source);
                    }
                    
                    if (message.toolCall) {
                        for (const fc of message.toolCall.functionCalls) {
                            const functionToCall = functions[fc.name as keyof typeof functions];
                            if (functionToCall) {
                                const functionResult = await functionToCall(fc.args as any);
                                const session = await voiceSessionPromise.current!;
                                session.sendToolResponse({ functionResponses: { id: fc.id, name: fc.name, response: { result: functionResult } } });
                            }
                        }
                    }
                },
                onerror: (e: ErrorEvent) => { console.error('Voice error:', e); setVoiceStatus('error'); stopVoiceSession(); },
                onclose: (e: CloseEvent) => { stopVoiceSession(); },
            },
            config: {
                responseModalities: [Modality.AUDIO],
                tools: [{ functionDeclarations: [findMediaTool, getMediaDetailsTool, navigateToMediaPageTool] }],
                speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: selectedVoice } } }
            },
        });
    // FIX: Removed geminiApiKey from dependency array.
    }, [stopVoiceSession, functions, selectedVoice, messages.length]);

    // Animation loop for visualizer
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || !isVoiceMode) return;

        const dpr = window.devicePixelRatio || 1;
        canvas.width = window.innerWidth * dpr;
        canvas.height = window.innerHeight * dpr;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.scale(dpr, dpr);
        const { width, height } = canvas;
        
        let particles = Array.from({ length: 5 }, () => ({
            x: Math.random() * width,
            y: Math.random() * height,
            vx: (Math.random() - 0.5) * 0.5,
            vy: (Math.random() - 0.5) * 0.5,
            radius: Math.random() * 150 + 100,
            color: `hsla(${Math.random() * 60 + 180}, 100%, 60%, 0.3)`
        }));
        
        let frame = 0;

        const render = () => {
            frame++;
            ctx.globalCompositeOperation = 'source-over';
            ctx.fillStyle = 'rgba(13, 20, 33, 0.1)';
            ctx.fillRect(0, 0, width, height);
            ctx.globalCompositeOperation = 'lighter';
            
            const analyser = voiceStatus === 'listening' ? inputAnalyser.current : outputAnalyser.current;
            let audioLevel = 0;

            if (analyser) {
                const bufferLength = analyser.frequencyBinCount;
                const dataArray = new Uint8Array(bufferLength);
                analyser.getByteTimeDomainData(dataArray);
                let sum = 0;
                for(let i = 0; i < bufferLength; i++) {
                    sum += (dataArray[i] - 128) * (dataArray[i] - 128);
                }
                audioLevel = Math.sqrt(sum / bufferLength) / 50; // Normalize
            } else if (voiceStatus === 'idle' || voiceStatus === 'connecting') {
                audioLevel = 0.1 + Math.sin(frame * 0.02) * 0.05; // Gentle breathing
            }

            particles.forEach(p => {
                p.x += p.vx;
                p.y += p.vy;
                
                if (p.x < -p.radius || p.x > width + p.radius) p.vx *= -1;
                if (p.y < -p.radius || p.y > height + p.radius) p.vy *= -1;

                const currentRadius = p.radius * (1 + audioLevel * 2);

                const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, currentRadius);
                grad.addColorStop(0, p.color);
                grad.addColorStop(1, 'rgba(0,0,0,0)');

                ctx.fillStyle = grad;
                ctx.beginPath();
                ctx.arc(p.x, p.y, currentRadius, 0, Math.PI * 2);
                ctx.fill();
            });

            animationFrameId.current = requestAnimationFrame(render);
        };
        render();

        return () => {
            if(animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
        }
    }, [isVoiceMode, voiceStatus]);


    useEffect(() => {
        if (isOpen) {
            initTextChat();
        } else {
            stopVoiceSession();
        }
    }, [isOpen, initTextChat, stopVoiceSession]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoading]);

    const handleSend = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || !chatRef.current) return;
        const userMessage: Message = { type: 'text', role: 'user', content: input };
        setMessages(prev => [...prev, userMessage]);
        const currentInput = input;
        setInput('');
        setIsLoading(true);
        try {
            // FIX: Updated sendMessage to pass an object and handle the response from the new SDK version.
            let result = await chatRef.current.sendMessage({ message: currentInput });
            // FIX: Updated property from function_calls to functionCalls.
            while (result.functionCalls && result.functionCalls.length > 0) {
                const fc = result.functionCalls[0];
                const functionToCall = functions[fc.name as keyof typeof functions];
                if (!functionToCall) throw new Error(`Unknown function: ${fc.name}`);
                
                const functionResult = await functionToCall(fc.args as any);
                if (fc.name === 'findMedia' && Array.isArray(functionResult) && functionResult.length > 0) {
                    const detailedItems = await tmdbService.searchMulti(tmdbApiKey, (fc.args as any).query, 1);
                    const normalized = detailedItems.results.map(i => i.media_type === 'movie' ? tmdbService.normalizeMovie(i as Movie) : tmdbService.normalizeTVShow(i as TVShow));
                    const validItems = normalized.filter(item => item.poster_path);
                    if (validItems.length > 0) {
                        setMessages(prev => [...prev, { type: 'cards', role: 'model', items: validItems.slice(0, 5) }]);
                    }
                }
                const apiResponse = Array.isArray(functionResult) ? { results: functionResult } : functionResult;
                // FIX: Updated sendMessage to pass an object for function responses.
                result = await chatRef.current.sendMessage({ message: [{ functionResponse: { id: fc.id, name: fc.name, response: apiResponse } }] });
            }
            // FIX: Updated to access the .text property directly instead of calling a function.
            const text = result.text;
            if (text) setMessages(prev => [...prev, { type: 'text', role: 'model', content: text }]);
        } catch (error) {
            console.error("AI Error:", error);
            setMessages(prev => [...prev, { type: 'text', role: 'model', content: "Sorry, an error occurred." }]);
        } finally {
            setIsLoading(false);
        }
    }, [input, functions, tmdbApiKey]);

    const handleCardClick = (item: MediaItem) => {
        window.dispatchEvent(new CustomEvent('selectMediaItem', { detail: item }));
        setIsOpen(false);
    };

    const toggleVoiceMode = () => {
        if (isVoiceMode) stopVoiceSession();
        else startVoiceSession();
    };

    return (
        <>
            <button onClick={() => setIsOpen(true)} className="fixed bottom-6 right-6 bg-cyan-600 text-white p-4 rounded-full shadow-lg hover:bg-cyan-500 transition-colors z-50 animate-text-focus-in"><SparklesIcon className="w-6 h-6" /></button>
            
            {isOpen && !isVoiceMode && (
                <div className="fixed inset-0 bg-black/60 z-[100] flex justify-center items-center sm:justify-end" onClick={() => setIsOpen(false)}>
                    <div className="w-full h-full sm:h-[calc(100%-4rem)] max-w-md bg-primary shadow-2xl flex flex-col sm:rounded-2xl border border-glass-edge" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between p-4 border-b border-zinc-800 flex-shrink-0">
                            <h2 className="text-lg font-bold flex items-center gap-2"><SparklesIcon className="w-5 h-5 text-cyan-400" /> ScreenScape AI</h2>
                            <div className="flex items-center gap-2">
                                <button onClick={() => setIsSettingsOpen(prev => !prev)} className="text-zinc-400 hover:text-white relative">
                                    <GearIcon className="w-6 h-6" />
                                    {isSettingsOpen && (
                                        <div className="absolute top-full right-0 mt-2 w-48 bg-zinc-800 border border-zinc-700 rounded-lg shadow-lg z-10" onClick={e => e.stopPropagation()}>
                                            <div className="p-2"><label htmlFor="voice-select" className="block text-xs text-zinc-400 mb-1">AI Voice</label>
                                                <select id="voice-select" value={selectedVoice} onChange={e => handleVoiceChange(e.target.value)} className="w-full bg-zinc-700 text-white text-sm rounded-md p-1 border-transparent focus:ring-1 focus:ring-cyan-500">
                                                    {voices.map(v => <option key={v} value={v}>{v}</option>)}
                                                </select>
                                            </div>
                                        </div>
                                    )}
                                </button>
                                <button onClick={() => setIsOpen(false)} className="text-zinc-400 hover:text-white"><XIcon className="w-6 h-6" /></button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
                            {messages.map((msg, index) => {
                                if (msg.type === 'text') {
                                    return (<div key={index} className={`flex items-end gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}><div className={`max-w-[80%] p-3 rounded-2xl ${msg.role === 'user' ? 'bg-cyan-700 text-white rounded-br-none' : 'bg-zinc-800 text-zinc-200 rounded-bl-none'}`}><SimpleMarkdown text={msg.content} /></div></div>)
                                }
                                if (msg.type === 'cards' && msg.items.length > 0) {
                                    return <div key={index} className="space-y-2">{msg.items.map(item => <MediaCard key={`${item.id}-${item.media_type}`} item={item} onClick={() => handleCardClick(item)} />)}</div>
                                }
                                return null;
                            })}
                            {isLoading && (<div className="flex justify-start"><div className="p-3 bg-zinc-800 rounded-2xl rounded-bl-none"><div className="flex items-center gap-2 text-zinc-400"><div className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce"></div><div className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce delay-200"></div><div className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce delay-400"></div></div></div></div>)}
                            <div ref={messagesEndRef} />
                        </div>
                        <div className="p-4 border-t border-zinc-800 flex-shrink-0">
                            <form onSubmit={handleSend} className="relative">
                                <input type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder="e.g., 'Find sci-fi movies...'" className="w-full bg-zinc-800 rounded-full py-3 pl-4 pr-20 text-sm focus:ring-1 focus:ring-cyan-500 border-transparent transition" disabled={isLoading} />
                                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center space-x-1">
                                    <button type="button" onClick={toggleVoiceMode} className={`p-2 rounded-full text-white bg-zinc-600 hover:bg-zinc-500 transition-colors`}>
                                        <MicrophoneIcon className="w-5 h-5" />
                                    </button>
                                    <button type="submit" disabled={isLoading || !input.trim()} className="p-2 rounded-full bg-cyan-600 text-white disabled:bg-zinc-600 disabled:cursor-not-allowed transition-colors"><PaperAirplaneIcon className="w-5 h-5" /></button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {isVoiceMode && (
                <div className="fixed inset-0 z-[200] bg-primary/30 backdrop-blur-2xl flex flex-col justify-center items-center animate-text-focus-in">
                    <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
                    
                    <div className="relative z-10 flex items-center justify-center">
                        <div className="absolute h-40 w-40 rounded-full bg-cyan-500/30 animate-pulse-ring" style={{ animationDuration: '2s' }}></div>
                        <div className="absolute h-32 w-32 rounded-full bg-cyan-500/50 animate-pulse-ring" style={{ animationDelay: '0.5s', animationDuration: '2s' }}></div>
                        <button 
                            onClick={stopVoiceSession} 
                            className="relative bg-cyan-600 text-white rounded-full h-24 w-24 flex items-center justify-center text-lg font-semibold shadow-2xl hover:bg-cyan-500 transition-all duration-300 ease-in-out transform hover:scale-110"
                        >
                            END
                        </button>
                    </div>

                    <div className="absolute top-6 right-6 z-10">
                         <button onClick={() => setIsSettingsOpen(prev => !prev)} className="text-white relative">
                            <GearIcon className="w-7 h-7" />
                            {isSettingsOpen && (
                                <div className="absolute top-full right-0 mt-2 w-48 bg-zinc-800/80 backdrop-blur-sm border border-zinc-700 rounded-lg shadow-lg z-10" onClick={e => e.stopPropagation()}>
                                    <div className="p-2"><label htmlFor="voice-select" className="block text-xs text-zinc-400 mb-1">AI Voice</label>
                                        <select id="voice-select" value={selectedVoice} onChange={e => handleVoiceChange(e.target.value)} className="w-full bg-zinc-700 text-white text-sm rounded-md p-1 border-transparent focus:ring-1 focus:ring-cyan-500">
                                            {voices.map(v => <option key={v} value={v}>{v}</option>)}
                                        </select>
                                    </div>
                                </div>
                            )}
                        </button>
                    </div>
                </div>
            )}
        </>
    );
};

export default AIAssistant;