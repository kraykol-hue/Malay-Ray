
import React, { useState, useRef } from 'react';
import { Upload, Mic, FileAudio, Play, Edit, Wand2, Loader2, Save, RotateCcw, Download } from 'lucide-react';
import { transcribeAudio, generateSpeech } from '../services/geminiService';

const AVAILABLE_VOICES = [
    { name: 'Kore', gender: 'Female', desc: 'Calm & Soothing' },
    { name: 'Puck', gender: 'Male', desc: 'Energetic' },
    { name: 'Charon', gender: 'Male', desc: 'Deep & Authoritative' },
    { name: 'Fenrir', gender: 'Male', desc: 'Intense' },
    { name: 'Zephyr', gender: 'Female', desc: 'Bright & Clear' },
];

export const VoiceEditor: React.FC = () => {
    const [file, setFile] = useState<File | null>(null);
    const [transcript, setTranscript] = useState('');
    const [originalTranscript, setOriginalTranscript] = useState('');
    const [isTranscribing, setIsTranscribing] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedAudioUrl, setGeneratedAudioUrl] = useState<string | null>(null);
    const [selectedVoice, setSelectedVoice] = useState('Kore');
    const [step, setStep] = useState<'UPLOAD' | 'EDIT'>('UPLOAD');

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleTranscribe = async () => {
        if (!file) return;
        setIsTranscribing(true);
        try {
            const text = await transcribeAudio(file);
            setTranscript(text);
            setOriginalTranscript(text);
            setStep('EDIT');
        } catch (e) {
            console.error(e);
            alert("Failed to transcribe audio.");
        } finally {
            setIsTranscribing(false);
        }
    };

    const handleGenerateAudio = async () => {
        if (!transcript.trim()) return;
        setIsGenerating(true);
        try {
            const base64Audio = await generateSpeech(transcript, selectedVoice);
            
            // Convert base64 to Blob URL for playback
            const byteCharacters = atob(base64Audio);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray], { type: 'audio/mp3' }); // Gemini TTS usually raw PCM but let's try standard blob wrapper or decoding
            // Actually Gemini 2.5 TTS returns raw PCM typically if not specified. 
            // The service returns base64 raw data. 
            // For simple playback, we need to decode properly or assume the browser can handle it if we wrap it in WAV container or similar. 
            // However, the cleanest way in browser without WAV headers is AudioContext decoding.
            // For simple "Download/Play" UI, we'll use AudioContext to play and maybe create a WAV for download if needed.
            // For this UI component, let's just create a quick Wav header wrapper or use AudioContext to play.
            
            // NOTE: For simplicity in this demo component, we will assume standard playback via AudioContext or raw blob if containerized.
            // Since the API returns Raw PCM usually, let's use a simple WAV header wrap function or just play it.
            
            // Let's stick to the previous pattern: use a Blob URL if valid, or just simple AudioContext player.
            // To make it downloadable, we need a WAV header.
            
            const wavBlob = createWavBlob(byteArray, 24000); // 24kHz is standard for Gemini TTS
            setGeneratedAudioUrl(URL.createObjectURL(wavBlob));
            
        } catch (e) {
            console.error(e);
            alert("Failed to generate audio.");
        } finally {
            setIsGenerating(false);
        }
    };

    // Helper to add WAV header to raw PCM
    const createWavBlob = (pcmData: Uint8Array, sampleRate: number) => {
        const numChannels = 1;
        const bitsPerSample = 16;
        const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
        const blockAlign = (numChannels * bitsPerSample) / 8;
        const dataSize = pcmData.length;
        const headerSize = 44;
        const totalSize = headerSize + dataSize;
        
        const buffer = new ArrayBuffer(totalSize);
        const view = new DataView(buffer);
        
        // RIFF chunk descriptor
        writeString(view, 0, 'RIFF');
        view.setUint32(4, 36 + dataSize, true);
        writeString(view, 8, 'WAVE');
        
        // fmt sub-chunk
        writeString(view, 12, 'fmt ');
        view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
        view.setUint16(20, 1, true); // AudioFormat (1 for PCM)
        view.setUint16(22, numChannels, true);
        view.setUint32(24, sampleRate, true);
        view.setUint32(28, byteRate, true);
        view.setUint16(32, blockAlign, true);
        view.setUint16(34, bitsPerSample, true);
        
        // data sub-chunk
        writeString(view, 36, 'data');
        view.setUint32(40, dataSize, true);
        
        // Write PCM data
        const dataView = new Uint8Array(buffer, headerSize);
        dataView.set(pcmData);
        
        return new Blob([buffer], { type: 'audio/wav' });
    };

    const writeString = (view: DataView, offset: number, string: string) => {
        for (let i = 0; i < string.length; i++) {
            view.setUint8(offset + i, string.charCodeAt(i));
        }
    };

    const reset = () => {
        setFile(null);
        setTranscript('');
        setGeneratedAudioUrl(null);
        setStep('UPLOAD');
    };

    return (
        <div className="max-w-5xl mx-auto space-y-8">
            <div className="text-center space-y-4">
                <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-400 inline-block">
                    Voice Text Editor
                </h2>
                <p className="text-slate-400 max-w-lg mx-auto">
                    Upload audio, edit the transcript, and regenerate the speech in a high-quality AI voice.
                </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden min-h-[500px] flex flex-col">
                {step === 'UPLOAD' ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-12 space-y-8">
                        <div className="bg-slate-800/50 p-8 rounded-full border border-slate-700">
                            <Mic className="w-12 h-12 text-teal-400" />
                        </div>
                        <div className="text-center space-y-2">
                            <h3 className="text-xl font-bold text-white">Upload Voice Recording</h3>
                            <p className="text-slate-500">Supports MP3, WAV, M4A</p>
                        </div>
                        
                        <div className="relative">
                            <input 
                                type="file" 
                                accept="audio/*"
                                onChange={handleFileUpload}
                                className="hidden"
                                id="audio-upload"
                            />
                            <label 
                                htmlFor="audio-upload"
                                className="px-8 py-3 bg-teal-600 hover:bg-teal-500 text-white rounded-lg font-bold cursor-pointer transition-colors flex items-center gap-2"
                            >
                                <Upload className="w-5 h-5" /> Select Audio File
                            </label>
                        </div>
                        
                        {file && (
                             <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col items-center gap-4">
                                <div className="flex items-center gap-2 text-slate-300 bg-slate-800 px-4 py-2 rounded-lg">
                                    <FileAudio className="w-4 h-4 text-teal-400" />
                                    {file.name}
                                </div>
                                <button 
                                    onClick={handleTranscribe}
                                    disabled={isTranscribing}
                                    className="px-8 py-3 bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-500 hover:to-teal-500 text-white rounded-lg font-bold shadow-lg transition-all flex items-center gap-2"
                                >
                                    {isTranscribing ? <Loader2 className="animate-spin" /> : <Wand2 className="w-5 h-5" />}
                                    Transcribe & Edit
                                </button>
                             </div>
                        )}
                    </div>
                ) : (
                    <div className="flex flex-col md:flex-row h-full">
                        {/* Editor Column */}
                        <div className="flex-1 p-8 border-b md:border-b-0 md:border-r border-slate-800 flex flex-col gap-6">
                            <div className="flex items-center justify-between">
                                <h3 className="font-bold text-white flex items-center gap-2">
                                    <Edit className="w-4 h-4 text-teal-400" /> Edit Transcript
                                </h3>
                                <button onClick={() => setTranscript(originalTranscript)} title="Reset Text" className="p-2 hover:bg-slate-800 rounded-lg text-slate-500 hover:text-white transition-colors">
                                    <RotateCcw className="w-4 h-4" />
                                </button>
                            </div>
                            
                            <textarea 
                                value={transcript}
                                onChange={(e) => setTranscript(e.target.value)}
                                className="flex-1 bg-slate-800/50 border border-slate-700 rounded-xl p-4 text-slate-200 focus:outline-none focus:border-teal-500 resize-none min-h-[300px] text-lg leading-relaxed"
                                placeholder="Transcript will appear here..."
                            />
                            
                            <div className="space-y-4">
                                <label className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Select AI Voice</label>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                    {AVAILABLE_VOICES.map((voice) => (
                                        <button
                                            key={voice.name}
                                            onClick={() => setSelectedVoice(voice.name)}
                                            className={`p-3 rounded-lg border text-left transition-all ${
                                                selectedVoice === voice.name 
                                                    ? 'bg-teal-500/20 border-teal-500/50 text-white' 
                                                    : 'bg-slate-800 border-transparent hover:border-slate-700 text-slate-400'
                                            }`}
                                        >
                                            <div className="font-bold text-sm">{voice.name}</div>
                                            <div className="text-[10px] opacity-70">{voice.gender} • {voice.desc}</div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                            
                            <button 
                                onClick={handleGenerateAudio}
                                disabled={isGenerating || !transcript}
                                className="w-full py-4 bg-teal-600 hover:bg-teal-500 text-white rounded-xl font-bold shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isGenerating ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" /> Generating Audio...
                                    </>
                                ) : (
                                    <>
                                        <Play className="w-5 h-5" /> Generate New Audio
                                    </>
                                )}
                            </button>
                        </div>
                        
                        {/* Result Column */}
                        <div className="w-full md:w-1/3 bg-slate-900/50 p-8 flex flex-col items-center justify-center border-l border-slate-800">
                             {generatedAudioUrl ? (
                                 <div className="text-center space-y-6 animate-in zoom-in duration-300">
                                     <div className="w-20 h-20 bg-teal-500/20 rounded-full flex items-center justify-center mx-auto border border-teal-500/30">
                                         <Play className="w-8 h-8 text-teal-400 ml-1" />
                                     </div>
                                     <h3 className="text-xl font-bold text-white">Audio Ready</h3>
                                     <audio controls src={generatedAudioUrl} className="w-full" />
                                     
                                     <div className="flex flex-col gap-3 w-full">
                                         <a 
                                             href={generatedAudioUrl}
                                             download="edited-voice.wav"
                                             className="w-full py-2 bg-white text-slate-900 rounded-lg font-bold hover:bg-slate-200 transition-colors flex items-center justify-center gap-2"
                                         >
                                             <Download className="w-4 h-4" /> Download WAV
                                         </a>
                                         <button 
                                            onClick={reset}
                                            className="w-full py-2 text-slate-500 hover:text-white transition-colors"
                                         >
                                             Start Over
                                         </button>
                                     </div>
                                 </div>
                             ) : (
                                 <div className="text-center text-slate-600 space-y-4">
                                     <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto">
                                         <Wand2 className="w-6 h-6 opacity-30" />
                                     </div>
                                     <p>Generated audio will appear here</p>
                                     <button onClick={() => setStep('UPLOAD')} className="text-sm text-teal-500 hover:underline">
                                         Back to Upload
                                     </button>
                                 </div>
                             )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
