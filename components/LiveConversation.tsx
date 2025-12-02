import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { Mic, Square, Radio, Loader2, AlertCircle, AudioLines } from 'lucide-react';

// Audio Configuration
const INPUT_SAMPLE_RATE = 16000;
const OUTPUT_SAMPLE_RATE = 24000;

export const LiveConversation: React.FC = () => {
    const [isConnected, setIsConnected] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [volume, setVolume] = useState(0);

    // Refs for resources to ensure clean disconnects
    const sessionPromiseRef = useRef<Promise<any> | null>(null);
    const inputContextRef = useRef<AudioContext | null>(null);
    const outputContextRef = useRef<AudioContext | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const nextStartTimeRef = useRef<number>(0);
    const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
    const processorRef = useRef<ScriptProcessorNode | null>(null);

    const cleanup = useCallback(() => {
        // Close Input
        if (processorRef.current) {
            processorRef.current.disconnect();
            processorRef.current = null;
        }
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        if (inputContextRef.current) {
            inputContextRef.current.close();
            inputContextRef.current = null;
        }

        // Close Output
        sourcesRef.current.forEach(source => source.stop());
        sourcesRef.current.clear();
        if (outputContextRef.current) {
            outputContextRef.current.close();
            outputContextRef.current = null;
        }

        // Close Session
        if (sessionPromiseRef.current) {
            sessionPromiseRef.current.then(session => {
                try {
                    session.close();
                } catch (e) {
                    console.error("Error closing session", e);
                }
            });
            sessionPromiseRef.current = null;
        }

        setIsConnected(false);
        setIsConnecting(false);
        nextStartTimeRef.current = 0;
        setVolume(0);
    }, []);

    useEffect(() => {
        return () => cleanup();
    }, [cleanup]);

    const connect = async () => {
        setError(null);
        setIsConnecting(true);

        try {
            // 1. Initialize API Client
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

            // 2. Setup Audio Contexts
            const InputContext = window.AudioContext || (window as any).webkitAudioContext;
            const inputCtx = new InputContext({ sampleRate: INPUT_SAMPLE_RATE });
            inputContextRef.current = inputCtx;

            const OutputContext = window.AudioContext || (window as any).webkitAudioContext;
            const outputCtx = new OutputContext({ sampleRate: OUTPUT_SAMPLE_RATE });
            outputContextRef.current = outputCtx;
            const outputNode = outputCtx.createGain();
            outputNode.connect(outputCtx.destination);

            // 3. Get Microphone Stream
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;

            // 4. Connect to Live API
            const sessionPromise = ai.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                config: {
                    responseModalities: [Modality.AUDIO],
                    speechConfig: {
                        voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
                    },
                    systemInstruction: "You are a helpful, witty, and concise AI assistant. Keep responses short and conversational.",
                },
                callbacks: {
                    onopen: () => {
                        console.log('Session opened');
                        setIsConnected(true);
                        setIsConnecting(false);

                        // Start Audio Streaming
                        const source = inputCtx.createMediaStreamSource(stream);
                        const processor = inputCtx.createScriptProcessor(4096, 1, 1);
                        processorRef.current = processor;

                        processor.onaudioprocess = (e) => {
                            const inputData = e.inputBuffer.getChannelData(0);
                            
                            // Simple visualization logic
                            let sum = 0;
                            for(let i=0; i<inputData.length; i++) sum += inputData[i] * inputData[i];
                            setVolume(Math.min(1, Math.sqrt(sum / inputData.length) * 5));

                            const pcm16Blob = createBlob(inputData);
                            
                            // IMPORTANT: Rely solely on sessionPromise to send data
                            sessionPromise.then((session) => {
                                session.sendRealtimeInput({ media: pcm16Blob });
                            });
                        };

                        source.connect(processor);
                        processor.connect(inputCtx.destination);
                    },
                    onmessage: async (msg: LiveServerMessage) => {
                        const content = msg.serverContent;
                        if (!content) return;

                        // Handle Interruption
                        if (content.interrupted) {
                            console.log('Interrupted');
                            sourcesRef.current.forEach(source => {
                                try { source.stop(); } catch(e) {}
                            });
                            sourcesRef.current.clear();
                            nextStartTimeRef.current = 0;
                            return;
                        }

                        // Handle Audio Output
                        const audioData = content.modelTurn?.parts?.[0]?.inlineData?.data;
                        if (audioData) {
                            if (!outputContextRef.current) return;
                            const ctx = outputContextRef.current;
                            
                            // Ensure nextStartTime is valid
                            nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);

                            const audioBuffer = await decodeAudioData(
                                decode(audioData),
                                ctx,
                                OUTPUT_SAMPLE_RATE,
                                1
                            );

                            const source = ctx.createBufferSource();
                            source.buffer = audioBuffer;
                            source.connect(outputNode);
                            
                            source.addEventListener('ended', () => {
                                sourcesRef.current.delete(source);
                            });

                            source.start(nextStartTimeRef.current);
                            nextStartTimeRef.current += audioBuffer.duration;
                            sourcesRef.current.add(source);
                        }
                    },
                    onclose: () => {
                        console.log('Session closed');
                        cleanup();
                    },
                    onerror: (e) => {
                        console.error('Session error', e);
                        setError("Connection error.");
                        cleanup();
                    }
                }
            });

            sessionPromiseRef.current = sessionPromise;

        } catch (e: any) {
            console.error(e);
            setError(e.message || "Failed to start conversation.");
            cleanup();
        }
    };

    return (
        <div className="max-w-2xl mx-auto flex flex-col items-center justify-center min-h-[500px] space-y-12">
            
            <div className="text-center space-y-4">
                <h2 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
                    Live Conversation
                </h2>
                <p className="text-slate-400">
                    Talk naturally with Gemini 2.5 in real-time.
                </p>
            </div>

            {/* Visualizer / Status Ring */}
            <div className="relative">
                {/* Outer Ring Animation */}
                {isConnected && (
                    <div 
                        className="absolute inset-0 rounded-full bg-blue-500/30 blur-xl transition-all duration-75"
                        style={{ transform: `scale(${1 + volume})` }}
                    />
                )}
                
                <div className={`relative w-40 h-40 rounded-full flex items-center justify-center border-4 transition-all duration-500
                    ${isConnected 
                        ? 'border-blue-500 bg-slate-900 shadow-[0_0_50px_rgba(59,130,246,0.5)]' 
                        : 'border-slate-700 bg-slate-800'
                    }
                `}>
                    {isConnecting ? (
                        <Loader2 className="w-16 h-16 text-blue-400 animate-spin" />
                    ) : isConnected ? (
                        <AudioLines className={`w-16 h-16 text-blue-400 transition-transform duration-75`} style={{ transform: `scale(${1 + volume * 0.5})` }} />
                    ) : (
                        <Mic className="w-16 h-16 text-slate-500" />
                    )}
                </div>
                
                {isConnected && (
                     <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-2 text-emerald-400 text-sm font-medium animate-pulse">
                        <Radio className="w-4 h-4" /> Live
                     </div>
                )}
            </div>

            {/* Error Message */}
            {error && (
                <div className="flex items-center gap-2 text-red-400 bg-red-900/20 px-4 py-2 rounded-lg border border-red-500/30">
                    <AlertCircle className="w-4 h-4" />
                    {error}
                </div>
            )}

            {/* Controls */}
            <div className="flex gap-4">
                {!isConnected && !isConnecting ? (
                    <button
                        onClick={connect}
                        className="flex items-center gap-3 px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-full font-bold text-lg transition-all shadow-lg hover:shadow-blue-500/25 hover:scale-105"
                    >
                        <Mic className="w-6 h-6" /> Start Chat
                    </button>
                ) : (
                    <button
                        onClick={cleanup}
                        className="flex items-center gap-3 px-8 py-4 bg-red-600 hover:bg-red-500 text-white rounded-full font-bold text-lg transition-all shadow-lg hover:shadow-red-500/25 hover:scale-105"
                    >
                        <Square className="w-6 h-6 fill-current" /> End Chat
                    </button>
                )}
            </div>
            
            <div className="text-xs text-slate-500 max-w-xs text-center">
                Microphone permission is required. Audio is processed in real-time.
            </div>

        </div>
    );
};

// --- Helper Functions ---

function createBlob(data: Float32Array): { data: string; mimeType: string } {
    const l = data.length;
    const int16 = new Int16Array(l);
    for (let i = 0; i < l; i++) {
        // Clamp to [-1, 1] then scale to 16-bit integer range
        const s = Math.max(-1, Math.min(1, data[i]));
        int16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    return {
        data: encode(new Uint8Array(int16.buffer)),
        mimeType: 'audio/pcm;rate=16000',
    };
}

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
