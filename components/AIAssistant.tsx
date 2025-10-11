import React, { useState, useRef, useEffect, useCallback } from 'react';
import { SparklesIcon } from './Icons';
import * as assistantEngine from '../services/assistantEngine';
import { GoogleGenAI, LiveSession, LiveServerMessage, Modality, Blob, FunctionDeclaration, Type } from '@google/genai';
import { useVoicePreferences } from '../hooks/useVoicePreferences';

// --- Types ---
export type AIStatus = 'idle' | 'listening';

interface AIAssistantProps {
    tmdbApiKey: string;
    setAiStatus: (status: AIStatus) => void;
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
    
    const [isVoiceModeActive, setIsVoiceModeActive] = useState(false);
    const currentTranscriptionRef = useRef({ user: '' });

    const sessionPromiseRef = useRef<Promise<LiveSession> | null>(null);
    const inputAudioContextRef = useRef<AudioContext | null>(null);
    const outputAudioContextRef = useRef<AudioContext | null>(null);
    const microphoneStreamRef = useRef<MediaStream | null>(null);
    const audioSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
    const nextStartTimeRef = useRef(0);
    
    const stopVoiceMode = useCallback(() => {
        setIsVoiceModeActive(false);
        setAiStatus('idle');

        if (sessionPromiseRef.current) {
            sessionPromiseRef.current.then(session => session.close());
            sessionPromiseRef.current = null;
        }

        inputAudioContextRef.current?.close();
        outputAudioContextRef.current?.close();
        microphoneStreamRef.current?.getTracks().forEach(track => track.stop());
        
        inputAudioContextRef.current = null;
        outputAudioContextRef.current = null;
        microphoneStreamRef.current = null;

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

            const selectMediaItemDeclaration: FunctionDeclaration = {
                name: 'selectMediaItem',
                description: 'Finds a movie or TV show by its title and displays its detailed information page. Also used for navigation like "Take me to [movie]".',
                parameters: { type: Type.OBJECT, properties: { title: { type: Type.STRING, description: 'The title of the movie or TV show to find.' } }, required: ['title'] },
            };

            const getMediaOverviewDeclaration: FunctionDeclaration = {
                name: 'getMediaOverview',
                description: "Gets the plot summary or overview for a specific movie or TV show, often in response to 'Tell me what [movie] is about'.",
                parameters: { type: Type.OBJECT, properties: { title: { type: Type.STRING, description: 'The title of the movie or TV show.' } }, required: ['title'] },
            };
            
            const controlTrailerAudioDeclaration: FunctionDeclaration = {
                name: 'controlTrailerAudio',
                description: 'Mutes or unmutes the currently playing movie trailer.',
                parameters: {
                    type: Type.OBJECT, properties: { action: { type: Type.STRING, description: "The action to perform: 'mute' or 'unmute'." } }, required: ['action'],
                },
            };

            const getMediaFactDeclaration: FunctionDeclaration = {
                name: 'getMediaFact',
                description: "Gets a specific fact about a movie or TV show, such as its release date, director, cast, runtime, or box office revenue.",
                parameters: {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING, description: 'The title of the movie or TV show.' },
                        fact_type: { 
                            type: Type.STRING, 
                            description: "The type of fact to retrieve. Supported values: 'release_date', 'director', 'cast', 'runtime', 'box_office'." 
                        }
                    },
                    required: ['title', 'fact_type']
                },
            };

            const tools = [{ functionDeclarations: [selectMediaItemDeclaration, getMediaOverviewDeclaration, controlTrailerAudioDeclaration, getMediaFactDeclaration] }];
            const systemInstruction = `You are ScreenScape AI, a friendly and enthusiastic movie and TV show recommendation assistant. You can find movies, get plot summaries, open detail pages, and control trailer audio. You can also answer specific questions like 'Who directed Inception?' or 'When did Barbie come out?'. Please respond in ${language}. Keep your spoken responses concise.`;

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
                           const pcmBlob = createBlob(inputData);
                           sessionPromise.then((session) => {
                               session.sendRealtimeInput({ media: pcmBlob });
                           });
                       };
                       source.connect(scriptProcessor);
                       scriptProcessor.connect(inputAudioContext.destination);
                    },
                    onmessage: async (message: LiveServerMessage) => {
                        if (message.toolCall) {
                            for (const fc of message.toolCall.functionCalls) {
                                let result: { success: boolean; message: string; };

                                if (fc.name === 'selectMediaItem' && fc.args.title) {
                                    result = await assistantEngine.findAndSelectMediaItem(fc.args.title, tmdbApiKey);
                                } else if (fc.name === 'getMediaOverview' && fc.args.title) {
                                    result = await assistantEngine.findAndGetOverview(fc.args.title, tmdbApiKey);
                                } else if (fc.name === 'controlTrailerAudio' && (fc.args.action === 'mute' || fc.args.action === 'unmute')) {
                                    result = assistantEngine.controlTrailerAudio(fc.args.action as 'mute' | 'unmute');
                                } else if (fc.name === 'getMediaFact' && fc.args.title && fc.args.fact_type) {
                                     result = await assistantEngine.getFactAboutMedia(fc.args.title, fc.args.fact_type, tmdbApiKey);
                                } else {
                                     result = { success: false, message: "An unknown function was called." };
                                }
                                
                                sessionPromise.then(session => session.sendToolResponse({ functionResponses: { id: fc.id, name: fc.name, response: { result: result.message } } }));
                            }
                        }

                        if (message.serverContent?.inputTranscription) {
                            currentTranscriptionRef.current.user += message.serverContent.inputTranscription.text;
                        }

                        if (message.serverContent?.turnComplete) {
                            const userInput = currentTranscriptionRef.current.user.toLowerCase();
                            if (['goodbye', 'thanks', "that's all", 'stop listening', 'exit voice mode'].some(phrase => userInput.includes(phrase))) {
                                setTimeout(() => stopVoiceMode(), 500);
                            }
                            currentTranscriptionRef.current.user = '';
                        }

                        const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData.data;
                        if (base64Audio) {
                            if (!outputAudioContextRef.current || outputAudioContextRef.current.state === 'closed') {
                                outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
                                outputAudioContextRef.current.resume();
                            }
                            const outputAudioContext = outputAudioContextRef.current;
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
                        
                        if (message.serverContent?.interrupted) {
                             for (const source of audioSourcesRef.current.values()) {
                                source.stop();
                             }
                             audioSourcesRef.current.clear();
                             nextStartTimeRef.current = 0;
                        }
                    },
                    onerror: (e: ErrorEvent) => {
                        console.error('Gemini Live API Error:', e);
                        stopVoiceMode();
                    },
                    onclose: (e: CloseEvent) => {
                       console.log('Gemini Live API connection closed.');
                       stopVoiceMode();
                    },
                },
                config: {
                    responseModalities: [Modality.AUDIO],
                    speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } } },
                    systemInstruction,
                    inputAudioTranscription: {},
                    outputAudioTranscription: {},
                    tools,
                },
            });
            sessionPromiseRef.current = sessionPromise;

        } catch (error) {
            console.error('Microphone access denied or audio setup failed:', error);
            alert("Voice Mode requires microphone access. Please enable it in your browser settings.");
            stopVoiceMode();
        }
    }, [tmdbApiKey, setAiStatus, stopVoiceMode, voice, language]);

    const toggleVoiceMode = () => {
        if (isVoiceModeActive) {
            stopVoiceMode();
        } else {
            startVoiceMode();
        }
    };
    
    useEffect(() => {
        return () => {
            stopVoiceMode();
        };
    }, [stopVoiceMode]);

    return (
        <button 
            onClick={toggleVoiceMode}
            title="Voice Mode"
            className={`fixed bottom-6 right-6 md:bottom-8 md:right-8 text-white p-4 rounded-full shadow-lg transition-transform hover:scale-110 z-50 animate-fade-in
                ${isVoiceModeActive ? 'bg-red-600 hover:bg-red-500 animate-pulse' : 'bg-cyan-600 hover:bg-cyan-500'}`}
        >
            <SparklesIcon className="w-6 h-6" />
        </button>
    );
};

export default AIAssistant;