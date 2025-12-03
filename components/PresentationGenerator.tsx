
import React, { useState, useRef, useEffect } from 'react';
import { Upload, FileText, User, Mic, Play, Loader2, Wand2, Presentation, CheckCircle, Volume2 } from 'lucide-react';
import { analyzeSlides, generateSpeech, generateVeoVideo } from '../services/geminiService';

// Audio Decode Helper
async function decodeAudioData(base64: string, ctx: AudioContext) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  
  const int16 = new Int16Array(bytes.buffer);
  const frameCount = int16.length; // Mono
  const buffer = ctx.createBuffer(1, frameCount, 24000);
  const channelData = buffer.getChannelData(0);
  for (let i = 0; i < frameCount; i++) {
      channelData[i] = int16[i] / 32768.0;
  }
  return buffer;
}

export const PresentationGenerator: React.FC = () => {
  const [step, setStep] = useState<'UPLOAD' | 'SCRIPT' | 'RESULT'>('UPLOAD');
  const [speakerImage, setSpeakerImage] = useState<File | null>(null);
  const [slidesFile, setSlidesFile] = useState<File | null>(null);
  const [script, setScript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState('');
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [audioBase64, setAudioBase64] = useState<string | null>(null);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);

  const handleSpeakerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) setSpeakerImage(e.target.files[0]);
  };

  const handleSlidesUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) setSlidesFile(e.target.files[0]);
  };

  const generateScript = async () => {
    if (!slidesFile) return;
    setIsProcessing(true);
    setStatus('Analyzing slides and writing script...');
    try {
      const generatedScript = await analyzeSlides(slidesFile);
      setScript(generatedScript);
      setStep('SCRIPT');
    } catch (e) {
      console.error(e);
      alert("Failed to analyze slides.");
    } finally {
      setIsProcessing(false);
    }
  };

  const producePresentation = async () => {
    if (!speakerImage || !script) return;
    setIsProcessing(true);
    
    try {
      // 1. Generate Audio
      setStatus('Synthesizing speech from script...');
      const audioData = await generateSpeech(script);
      setAudioBase64(audioData);

      // 2. Generate Video
      setStatus('Generating AI avatar video (Veo)...');
      const videoUri = await generateVeoVideo({
        imageFile: speakerImage,
        aspectRatio: '16:9',
        prompt: "A professional speaker delivering a confident presentation, head and shoulders shot, studio lighting, high quality."
      });
      setVideoUrl(videoUri);
      
      setStep('RESULT');
    } catch (e) {
      console.error(e);
      alert("Failed to produce presentation.");
    } finally {
      setIsProcessing(false);
    }
  };

  const playPresentation = async () => {
    if (!audioBase64 || !videoUrl || !videoRef.current) return;

    // Reset
    if (sourceNodeRef.current) sourceNodeRef.current.stop();
    
    if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    }

    try {
        const buffer = await decodeAudioData(audioBase64, audioCtxRef.current);
        const source = audioCtxRef.current.createBufferSource();
        source.buffer = buffer;
        source.connect(audioCtxRef.current.destination);
        sourceNodeRef.current = source;

        videoRef.current.currentTime = 0;
        videoRef.current.play();
        source.start(0);
        
        // Loop video if audio is longer
        videoRef.current.loop = true; 
        
        source.onended = () => {
            videoRef.current?.pause();
        };

    } catch (e) {
        console.error("Playback error", e);
    }
  };

  return (
    <div className="max-w-5xl mx-auto min-h-[600px] bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden flex flex-col">
      {/* Header */}
      <div className="p-8 border-b border-slate-800 bg-slate-800/50">
        <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-400 mb-2">
          AI Presentation Generator
        </h2>
        <p className="text-slate-400">Turn slides and a photo into a video presentation.</p>
        
        {/* Stepper */}
        <div className="flex items-center gap-4 mt-8">
            {['Upload Assets', 'Edit Script', 'Production'].map((label, idx) => {
                const isActive = (step === 'UPLOAD' && idx === 0) || (step === 'SCRIPT' && idx === 1) || (step === 'RESULT' && idx === 2);
                const isCompleted = (step === 'SCRIPT' && idx === 0) || (step === 'RESULT' && idx < 2);
                
                return (
                    <div key={idx} className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                            isCompleted ? 'bg-green-500 text-white' : isActive ? 'bg-orange-500 text-white' : 'bg-slate-700 text-slate-400'
                        }`}>
                            {isCompleted ? <CheckCircle className="w-5 h-5" /> : idx + 1}
                        </div>
                        <span className={`text-sm ${isActive || isCompleted ? 'text-white' : 'text-slate-500'}`}>{label}</span>
                        {idx < 2 && <div className="w-12 h-px bg-slate-700 mx-2" />}
                    </div>
                );
            })}
        </div>
      </div>

      <div className="flex-1 p-8">
        {step === 'UPLOAD' && (
            <div className="grid md:grid-cols-2 gap-8 h-full">
                {/* Speaker Upload */}
                <div className="bg-slate-800/30 border-2 border-dashed border-slate-700 rounded-xl p-8 flex flex-col items-center justify-center text-center hover:border-orange-500/50 transition-colors">
                    <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mb-4">
                        {speakerImage ? (
                            <img src={URL.createObjectURL(speakerImage)} alt="Speaker" className="w-full h-full object-cover rounded-full" />
                        ) : (
                            <User className="w-10 h-10 text-slate-500" />
                        )}
                    </div>
                    <h3 className="text-xl font-semibold text-slate-200 mb-2">Speaker Photo</h3>
                    <p className="text-sm text-slate-400 mb-6">Upload a clear photo of the presenter.</p>
                    <label className="px-6 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white cursor-pointer transition-colors">
                        Choose Image
                        <input type="file" accept="image/*" onChange={handleSpeakerUpload} className="hidden" />
                    </label>
                    {speakerImage && <span className="text-xs text-green-400 mt-2">{speakerImage.name}</span>}
                </div>

                {/* Slides Upload */}
                <div className="bg-slate-800/30 border-2 border-dashed border-slate-700 rounded-xl p-8 flex flex-col items-center justify-center text-center hover:border-orange-500/50 transition-colors">
                    <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mb-4">
                        <FileText className="w-10 h-10 text-slate-500" />
                    </div>
                    <h3 className="text-xl font-semibold text-slate-200 mb-2">Presentation Slides</h3>
                    <p className="text-sm text-slate-400 mb-6">Upload your slides (PDF or Image).</p>
                    <label className="px-6 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white cursor-pointer transition-colors">
                        Choose File
                        <input type="file" accept=".pdf,image/*" onChange={handleSlidesUpload} className="hidden" />
                    </label>
                    {slidesFile && <span className="text-xs text-green-400 mt-2">{slidesFile.name}</span>}
                </div>

                <div className="md:col-span-2 flex justify-end">
                    <button 
                        onClick={generateScript}
                        disabled={!speakerImage || !slidesFile || isProcessing}
                        className="px-8 py-3 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-400 hover:to-red-400 text-white rounded-lg font-bold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isProcessing ? <Loader2 className="animate-spin" /> : <Wand2 className="w-5 h-5" />}
                        Analyze & Generate Script
                    </button>
                </div>
            </div>
        )}

        {step === 'SCRIPT' && (
            <div className="h-full flex flex-col">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-white">Review Presentation Script</h3>
                    <div className="text-sm text-slate-400">Edit the text below to refine the speech.</div>
                </div>
                
                <textarea 
                    value={script}
                    onChange={(e) => setScript(e.target.value)}
                    className="flex-1 bg-slate-800 border border-slate-700 rounded-xl p-6 text-slate-200 text-lg leading-relaxed focus:outline-none focus:border-orange-500 resize-none mb-6 min-h-[300px]"
                />

                <div className="flex justify-end gap-4">
                     <button 
                        onClick={() => setStep('UPLOAD')}
                        className="px-6 py-3 text-slate-400 hover:text-white"
                     >
                        Back
                     </button>
                     <button 
                        onClick={producePresentation}
                        disabled={isProcessing || !script.trim()}
                        className="px-8 py-3 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-400 hover:to-red-400 text-white rounded-lg font-bold flex items-center gap-2 disabled:opacity-50"
                     >
                        {isProcessing ? (
                             <>
                                <Loader2 className="animate-spin" /> {status}
                             </>
                        ) : (
                             <>
                                <Presentation className="w-5 h-5" /> Produce Video
                             </>
                        )}
                     </button>
                </div>
            </div>
        )}

        {step === 'RESULT' && videoUrl && (
            <div className="flex flex-col items-center justify-center h-full space-y-8">
                <div className="relative aspect-video w-full max-w-3xl bg-black rounded-xl overflow-hidden shadow-2xl border border-slate-800 group">
                    <video 
                        ref={videoRef}
                        src={videoUrl}
                        className="w-full h-full object-cover"
                        playsInline
                        loop
                        muted // Muted because we play audio separately
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 group-hover:bg-black/20 transition-colors pointer-events-none">
                        <button 
                            onClick={playPresentation}
                            className="w-20 h-20 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center border border-white/20 pointer-events-auto hover:scale-110 transition-transform"
                        >
                            <Play className="w-10 h-10 text-white ml-2" />
                        </button>
                    </div>
                </div>

                <div className="text-center space-y-4">
                    <h3 className="text-2xl font-bold text-white">Presentation Ready!</h3>
                    <p className="text-slate-400 max-w-lg">
                        The AI has generated a video of the speaker and synthesized the speech. 
                        Click play to watch the presentation.
                    </p>
                    <div className="flex gap-4 justify-center">
                        <button 
                            onClick={() => setStep('UPLOAD')}
                            className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors"
                        >
                            Create Another
                        </button>
                    </div>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};
