import React, { useState, useRef, useEffect, useCallback } from 'react';
import { SparklesIcon } from './Icons';
import * as assistantEngine from '../services/assistantEngine';
import { GoogleGenAI, LiveServerMessage, Modality, Blob, FunctionDeclaration, Type } from '@google/genai';
import { useVoicePreferences } from '../hooks/useVoicePreferences';
// FIX: Import useGeolocation to get the user's selected country for API calls.
import { useGeolocation } from '../hooks/useGeolocation';
import { useSpotify } from '../contexts/SpotifyContext';

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
    const { country } = useGeolocation();
    const { isAuthenticated: isSpotifyAuthenticated } = useSpotify();
    
    const [isVoiceModeActive, setIsVoiceModeActive] = useState(false);
    const currentTranscriptionRef = useRef({ user: '' });

    const sessionPromiseRef = useRef<Promise<any> | null>(null);
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
            
            const playSoundtrackDeclaration: FunctionDeclaration = {
                name: 'playSoundtrack',
                description: 'Searches for and plays the soundtrack for a given movie or TV show on Spotify.',
                parameters: {
                    type: Type.OBJECT, properties: { title: { type: Type.STRING, description: 'The title of the movie or TV show for which to play the soundtrack.' } }, required: ['title'],
                },
            };

            const controlMusicDeclaration: FunctionDeclaration = {
                name: 'controlMusic',
                description: 'Controls Spotify music playback. Actions can be to play (resume) or pause the music.',
                parameters: {
                    type: Type.OBJECT, properties: { action: { type: Type.STRING, description: "The action to perform: 'play' or 'pause'." } }, required: ['action'],
                },
            };

            const openMusicPageDeclaration: FunctionDeclaration = {
                name: 'openMusicPage',
                description: 'Navigates the user to the dedicated music search page within the app.',
                parameters: { type: Type.OBJECT, properties: {} },
            };

            const baseTools = [selectMediaItemDeclaration, getMediaOverviewDeclaration, controlTrailerAudioDeclaration, getMediaFactDeclaration];
            const spotifyTools = [playSoundtrackDeclaration, controlMusicDeclaration, openMusicPageDeclaration];
            const tools = [{ functionDeclarations: isSpotifyAuthenticated ? [...baseTools, ...spotifyTools] : baseTools }];

            const systemInstruction = `You are ScreenScape AI, a friendly and enthusiastic movie and TV show recommendation assistant. You can find movies, get plot summaries, open detail pages, and control trailer audio. You can also answer specific questions like 'Who directed Inception?' or 'When did Barbie come out?'. ${isSpotifyAuthenticated ? 'You can also play movie soundtracks and control music on Spotify.' : ''} Please respond in ${language}. Keep your spoken responses concise.`;

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
                                    result = await assistantEngine.findAndSelectMediaItem(fc.args.title as string, tmdbApiKey);
                                } else if (fc.name === 'getMediaOverview' && fc.args.title) {
                                    result = await assistantEngine.findAndGetOverview(fc.args.title as string, tmdbApiKey);
                                } else if (fc.name === 'controlTrailerAudio' && (fc.args.action === 'mute' || fc.args.action === 'unmute')) {
                                    result = assistantEngine.controlTrailerAudio(fc.args.action as 'mute' | 'unmute');
                                } else if (fc.name === 'getMediaFact' && fc.args.title && fc.args.fact_type) {
                                     result = await assistantEngine.getFactAboutMedia(fc.args.title as string, fc.args.fact_type as string, tmdbApiKey, country.code);
                                } else if (fc.name === 'playSoundtrack' && fc.args.title) {
                                    result = assistantEngine.playSoundtrack(fc.args.title as string);
                                } else if (fc.name === 'controlMusic' && (fc.args.action === 'play' || fc.args.action === 'pause')) {
                                    result = assistantEngine.controlMusic(fc.args.action as 'play' | 'pause');
                                } else if (fc.name === 'openMusicPage') {
                                    result = assistantEngine.openMusicPage();
                                }
                                else {
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
                        console.error("AI Assistant Error:", e);
                        stopVoiceMode();
                    },
                    onclose: (e: CloseEvent) => {
                        console.debug("AI Assistant connection closed.");
                    },
                },
                config: {
                    responseModalities: [Modality.AUDIO],
                    speechConfig: {
                        voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } },
                    },
                    inputAudioTranscription: {},
                    systemInstruction,
                    tools,
                },
            });

            sessionPromiseRef.current = sessionPromise;
            
        } catch (error) {
            console.error("Failed to start voice mode:", error);
            stopVoiceMode();
        }
    }, [tmdbApiKey, voice, language, setAiStatus, stopVoiceMode, country.code, isSpotifyAuthenticated]);

    useEffect(() => {
        // Cleanup on component unmount
        return () => {
            stopVoiceMode();
        };
    }, [stopVoiceMode]);

    const handleToggleVoiceMode = () => {
        if (isVoiceModeActive) {
            stopVoiceMode();
        } else {
            startVoiceMode();
        }
    };
    
    return (
        <button
            title="AI Voice Assistant"
            onClick={handleToggleVoiceMode}
            className={`fixed bottom-6 right-6 md:bottom-8 md:right-8 text-white p-4 rounded-full shadow-lg transition-all duration-300 hover:scale-110 z-50 animate-fade-in ${
                isVoiceModeActive
                    ? 'bg-red-600 hover:bg-red-500'
                    : 'bg-accent-500 hover:bg-accent-400'
            }`}
        >
            <SparklesIcon className={`w-7 h-7 ${isVoiceModeActive ? 'animate-pulse' : ''}`} />
        </button>
    );
};

export default AIAssistant;
