import React, { useState, useRef, useEffect, useCallback } from 'react';
import { SparklesIcon } from './Icons';
import * as assistantEngine from '../services/assistantEngine';
import { GoogleGenAI, LiveServerMessage, Modality, Blob, FunctionDeclaration, Type } from '@google/genai';
import { useVoicePreferences } from '../hooks/useVoicePreferences';
import { useGeolocation } from '../hooks/useGeolocation';
import { queryOpenRouter } from './openrouter.js';
import VoiceModePanel from './VoiceModePanel';

// Dynamically inject the stylesheet for the voice panel
const styleId = 'voice-mode-styles';
if (!document.getElementById(styleId)) {
    const styleLink = document.createElement('link');
    styleLink.id = styleId;
    styleLink.rel = 'stylesheet';
    styleLink.href = '/styles/VoiceMode.css';
    document.head.appendChild(styleLink);
}


// --- Types ---
export type AIStatus = 'idle' | 'listening';

interface AIAssistantProps {
    tmdbApiKey: string;
    setAiStatus: (status: AIStatus) => void;
}

interface Message {
    speaker: 'user' | 'ai';
    text: string;
}

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

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
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

function createBlob(data: Float32Array): Blob {
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

const AIAssistant: React.FC<AIAssistantProps> = ({ tmdbApiKey, setAiStatus }) => {
    const { voice, language } = useVoicePreferences();
    const { country } = useGeolocation();
    
    const [isVoiceModeActive, setIsVoiceModeActive] = useState(false);
    const [isThinking, setIsThinking] = useState(false);
    const [conversationHistory, setConversationHistory] = useState<Message[]>([]);
    const conversationMemory = useRef<{role: 'user' | 'assistant', content: string}[]>([]);

    const sessionPromiseRef = useRef<Promise<any> | null>(null);
    const inputAudioContextRef = useRef<AudioContext | null>(null);
    const outputAudioContextRef = useRef<AudioContext | null>(null);
    const microphoneStreamRef = useRef<MediaStream | null>(null);
    const audioSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
    const nextStartTimeRef = useRef(0);
    
    const stopVoiceMode = useCallback(() => {
        setIsVoiceModeActive(false);
        setAiStatus('idle');
        setIsThinking(false);

        if (sessionPromiseRef.current) {
            sessionPromiseRef.current.then(session => session.close());
            sessionPromiseRef.current = null;
        }

        inputAudioContextRef.current?.close().catch(console.error);
        outputAudioContextRef.current?.close().catch(console.error);
        microphoneStreamRef.current?.getTracks().forEach(track => track.stop());
        
        inputAudioContextRef.current = null;
        outputAudioContextRef.current = null;
        microphoneStreamRef.current = null;
        conversationMemory.current = [];
        setConversationHistory([]);

        for (const source of audioSourcesRef.current.values()) {
          source.stop();
        }
        audioSourcesRef.current.clear();
        nextStartTimeRef.current = 0;
    }, [setAiStatus]);
    
    const startVoiceMode = useCallback(async () => {
        if (!process.env.API_KEY) {
            alert("Gemini API key is not configured. Voice Mode is unavailable.");
            return;
        }
        setIsVoiceModeActive(true);
        setAiStatus('listening');

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            microphoneStreamRef.current = stream;

            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

            const selectMediaItemDeclaration: FunctionDeclaration = { name: 'selectMediaItem', description: "Finds a movie or TV show by title and displays its details. Use this for commands like 'take me to' or 'show me'.", parameters: { type: Type.OBJECT, properties: { title: { type: Type.STRING } }, required: ['title'] }};
            const getMediaOverviewDeclaration: FunctionDeclaration = { name: 'getMediaOverview', description: "Gets a plot summary for a movie or TV show.", parameters: { type: Type.OBJECT, properties: { title: { type: Type.STRING } }, required: ['title'] }};
            const controlTrailerAudioDeclaration: FunctionDeclaration = { name: 'controlTrailerAudio', description: 'Mutes or unmutes the trailer.', parameters: { type: Type.OBJECT, properties: { action: { type: Type.STRING, description: "'mute' or 'unmute'." } }, required: ['action'] }};
            const getMediaFactDeclaration: FunctionDeclaration = { name: 'getMediaFact', description: "Gets a fact (release date, director, cast, runtime, box office) about a movie/show.", parameters: { type: Type.OBJECT, properties: { title: { type: Type.STRING }, fact_type: { type: Type.STRING, description: "'release_date', 'director', 'cast', 'runtime', 'box_office'." } }, required: ['title', 'fact_type'] }};
            const tools = [{ functionDeclarations: [selectMediaItemDeclaration, getMediaOverviewDeclaration, controlTrailerAudioDeclaration, getMediaFactDeclaration] }];
            const systemInstruction = `You are ScreenScape AI, a friendly movie assistant. You can find movies, get summaries, and answer questions like 'Who directed Inception?'. Respond in ${language}. Keep spoken responses concise. You only call functions when the user explicitly asks for information that the functions provide. For conversational queries, you do not call any function.`;

            let currentInputTranscription = '';
            let currentOutputTranscription = '';
            let toolCalledThisTurn = false;

            const sessionPromise = ai.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                callbacks: {
                    onopen: () => {
                       const inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
                       inputAudioContextRef.current = inputAudioContext;
                       inputAudioContext.resume();
                       const source = inputAudioContext.createMediaStreamSource(stream);
                       const scriptProcessor = inputAudioContext.createScriptProcessor(4096, 1, 1);
                       scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
                           const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                           sessionPromise.then((session) => session.sendRealtimeInput({ media: createBlob(inputData) }));
                       };
                       source.connect(scriptProcessor);
                       scriptProcessor.connect(inputAudioContext.destination);
                    },
                    onmessage: async (message: LiveServerMessage) => {
                        if (message.toolCall) {
                            toolCalledThisTurn = true;
                            for (const fc of message.toolCall.functionCalls) {
                                let result;
                                switch (fc.name) {
                                    case 'selectMediaItem':
                                        result = await assistantEngine.findAndSelectMediaItem(fc.args.title, tmdbApiKey);
                                        break;
                                    case 'getMediaOverview':
                                        result = await assistantEngine.findAndGetOverview(fc.args.title, tmdbApiKey);
                                        break;
                                    case 'controlTrailerAudio':
                                        result = assistantEngine.controlTrailerAudio(fc.args.action as 'mute' | 'unmute');
                                        break;
                                    case 'getMediaFact':
                                        result = await assistantEngine.getFactAboutMedia(fc.args.title, fc.args.fact_type, tmdbApiKey, country.code);
                                        break;
                                    default:
                                        result = { success: false, message: "I'm not sure how to do that." };
                                }
                                sessionPromise.then(session => session.sendToolResponse({ functionResponses: { id: fc.id, name: fc.name, response: { result: result.message } } }));
                            }
                        }

                        if (message.serverContent?.inputTranscription?.text) {
                            currentInputTranscription += message.serverContent.inputTranscription.text;
                        }
                        if (message.serverContent?.outputTranscription?.text) {
                            currentOutputTranscription += message.serverContent.outputTranscription.text;
                        }

                        if (message.serverContent?.turnComplete) {
                            const userInput = currentInputTranscription.trim();
                            const aiGeminiOutput = currentOutputTranscription.trim();

                            if (userInput) {
                                setConversationHistory(prev => [...prev, { speaker: 'user', text: userInput }]);
                                conversationMemory.current.push({ role: 'user', content: userInput });
                                
                                if (!toolCalledThisTurn) {
                                    setIsThinking(true);
                                    const prompt = `You are ScreenScape AI, a cinematic voice assistant who speaks with calm, elegant insight. Continue this conversation:\n${conversationMemory.current.map(m => `${m.role.toUpperCase()}: ${m.content}`).join("\n")}`;
                                    const openRouterResponse = await queryOpenRouter(prompt);
                                    setIsThinking(false);

                                    if (openRouterResponse) {
                                        setConversationHistory(prev => [...prev, { speaker: 'ai', text: openRouterResponse }]);
                                        conversationMemory.current.push({ role: 'assistant', content: openRouterResponse });

                                        // Use browser TTS to speak the response
                                        const utterance = new SpeechSynthesisUtterance(openRouterResponse);
                                        utterance.lang = language === 'Spanish' ? 'es-ES' : 'en-US';
                                        window.speechSynthesis.speak(utterance);
                                    }
                                }
                            }
                            if (aiGeminiOutput && toolCalledThisTurn) {
                                setConversationHistory(prev => [...prev, { speaker: 'ai', text: aiGeminiOutput }]);
                                conversationMemory.current.push({ role: 'assistant', content: aiGeminiOutput });
                            }

                            if (conversationMemory.current.length > 6) { // Keep last 3 exchanges
                                conversationMemory.current = conversationMemory.current.slice(-6);
                            }

                            // Reset for next turn
                            currentInputTranscription = '';
                            currentOutputTranscription = '';
                            toolCalledThisTurn = false;

                            const lowerUserInput = userInput.toLowerCase();
                            if (['goodbye', 'exit', 'stop'].some(phrase => lowerUserInput.includes(phrase))) {
                                setTimeout(() => stopVoiceMode(), 500);
                            }
                        }

                        const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData.data;
                        if (base64Audio) {
                            if (!outputAudioContextRef.current || outputAudioContextRef.current.state === 'closed') {
                                outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
                            }
                            const outputAudioContext = outputAudioContextRef.current;
                            outputAudioContext.resume();
                            nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputAudioContext.currentTime);
                            const audioBuffer = await decodeAudioData(decode(base64Audio), outputAudioContext, 24000, 1);
                            const source = outputAudioContext.createBufferSource();
                            source.buffer = audioBuffer;
                            source.connect(outputAudioContext.destination);
                            source.addEventListener('ended', () => { audioSourcesRef.current.delete(source); });
                            source.start(nextStartTimeRef.current);
                            nextStartTimeRef.current += audioBuffer.duration;
                            audioSourcesRef.current.add(source);
                        }
                    },
                    onerror: (e: ErrorEvent) => { console.error("AI Assistant Error:", e); stopVoiceMode(); },
                    onclose: () => console.debug("AI Assistant connection closed."),
                },
                config: { responseModalities: [Modality.AUDIO], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } } }, inputAudioTranscription: {}, outputAudioTranscription: {}, systemInstruction, tools },
            });
            sessionPromiseRef.current = sessionPromise;
        } catch (error) {
            console.error("Failed to start voice mode:", error);
            if (error instanceof Error && error.name === 'NotAllowedError') {
                alert("Voice Mode requires microphone permission to function.");
            }
            stopVoiceMode();
        }
    }, [tmdbApiKey, voice, language, setAiStatus, stopVoiceMode, country.code]);

    useEffect(() => {
        return () => stopVoiceMode();
    }, [stopVoiceMode]);

    let buttonClass = 'bg-accent-500 hover:bg-accent-400';
    let buttonAnimationClass = '';
    if (isVoiceModeActive) {
        buttonClass = 'bg-red-600 hover:bg-red-500';
        if (isThinking) {
            buttonAnimationClass = 'thinking-glow';
        } else {
            buttonAnimationClass = 'listening-pulse';
        }
    }

    return (
        <>
            {isVoiceModeActive && <VoiceModePanel messages={conversationHistory} isThinking={isThinking} onClose={stopVoiceMode} />}
            <button
                title="AI Voice Assistant"
                onClick={isVoiceModeActive ? stopVoiceMode : startVoiceMode}
                className={`fixed bottom-6 right-6 md:bottom-8 md:right-8 text-white p-4 rounded-full shadow-lg transition-all duration-300 hover:scale-110 z-50 animate-fade-in ${buttonClass} ${buttonAnimationClass}`}
            >
                <SparklesIcon className="w-7 h-7" />
            </button>
        </>
    );
};

export default AIAssistant;