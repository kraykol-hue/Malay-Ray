
import React, { useState, useEffect } from 'react';
import { Video, Loader2, Download, AlertCircle, Key, Film, Sparkles } from 'lucide-react';
import { generateVeoVideo } from '../services/geminiService';

export const VeoAnimator: React.FC = () => {
    const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');
    const [prompt, setPrompt] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
    const [hasKey, setHasKey] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        checkKey();
    }, []);

    const checkKey = async () => {
        if ((window as any).aistudio && (window as any).aistudio.hasSelectedApiKey) {
            const has = await (window as any).aistudio.hasSelectedApiKey();
            setHasKey(has);
        } else {
             // Fallback logic if running outside of specific environment, assume true or handle appropriately
             setHasKey(true); 
        }
    }

    const handleSelectKey = async () => {
        if ((window as any).aistudio && (window as any).aistudio.openSelectKey) {
            await (window as any).aistudio.openSelectKey();
            setHasKey(true);
            setError(null);
        }
    }

    const handleGenerate = async () => {
        if (!hasKey) {
            setError("Please select a paid API key to use Veo.");
            return;
        }

        if (!prompt.trim()) {
             setError("Please enter a prompt to generate video.");
             return;
        }

        setIsGenerating(true);
        setError(null);
        
        try {
            const url = await generateVeoVideo({
                imageFile: null,
                aspectRatio,
                prompt
            });
            setGeneratedVideoUrl(url);
        } catch (e: any) {
            console.error(e);
            if (e.message?.includes("Requested entity was not found") || e.message?.includes("404")) {
                setHasKey(false);
                setError("API Key invalid or expired. Please select a paid key again.");
            } else {
                setError(e.message || "Video generation failed.");
            }
        } finally {
            setIsGenerating(false);
        }
    };

    const isButtonDisabled = isGenerating || !hasKey || !prompt.trim();

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="text-center space-y-4">
                <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 inline-block">
                    Veo Video Generation
                </h2>
                <p className="text-slate-400 max-w-lg mx-auto">
                    Generate high-quality videos from text prompts using Gemini Veo 3.
                </p>
            </div>

            {/* API Key Warning */}
            {!hasKey && (
                <div className="bg-yellow-900/20 border border-yellow-500/50 p-4 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Key className="w-5 h-5 text-yellow-500" />
                        <div className="text-sm">
                            <p className="text-yellow-200 font-medium">Paid API Key Required</p>
                            <p className="text-yellow-500/80">Veo generation requires a billed project.</p>
                        </div>
                    </div>
                    <button 
                        onClick={handleSelectKey}
                        className="px-4 py-2 bg-yellow-600 hover:bg-yellow-500 text-white text-sm font-semibold rounded-lg transition-colors"
                    >
                        Select Key
                    </button>
                </div>
            )}

            <div className="grid md:grid-cols-2 gap-8">
                {/* Input Column */}
                <div className="space-y-6">
                    {/* Controls */}
                    <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700/50 space-y-6 h-full flex flex-col justify-center">
                         <div>
                            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block">
                                Aspect Ratio
                            </label>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setAspectRatio('16:9')}
                                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 border ${
                                        aspectRatio === '16:9'
                                            ? 'bg-purple-500/20 border-purple-500 text-purple-300'
                                            : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-600'
                                    }`}
                                >
                                    <div className="w-4 h-2.5 border border-current rounded-sm" /> 16:9
                                </button>
                                <button
                                    onClick={() => setAspectRatio('9:16')}
                                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 border ${
                                        aspectRatio === '9:16'
                                            ? 'bg-purple-500/20 border-purple-500 text-purple-300'
                                            : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-600'
                                    }`}
                                >
                                    <div className="w-2.5 h-4 border border-current rounded-sm" /> 9:16
                                </button>
                            </div>
                         </div>

                         <div>
                            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block">
                                Video Prompt
                            </label>
                            <textarea
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder="Describe the video you want to generate (e.g., 'A cyberpunk city with flying cars')..."
                                className={`w-full bg-slate-900 border rounded-lg p-3 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-purple-500 resize-none h-32 transition-colors ${
                                    error && !prompt ? 'border-red-500/50' : 'border-slate-700'
                                }`}
                            />
                         </div>

                         <button
                            onClick={handleGenerate}
                            disabled={isButtonDisabled}
                            className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-bold text-white shadow-lg shadow-purple-900/20 transition-all flex items-center justify-center gap-2"
                         >
                            {isGenerating ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" /> Generating...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="w-5 h-5" /> Generate Video
                                </>
                            )}
                         </button>

                         <p className="text-[10px] text-center text-slate-500">
                             Video generation may take 1-2 minutes. Please be patient.
                         </p>

                         {error && (
                             <div className="flex items-start gap-2 text-red-400 text-sm bg-red-900/10 p-3 rounded-lg border border-red-900/20">
                                 <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                                 <span>{error}</span>
                             </div>
                         )}
                    </div>
                </div>

                {/* Output Column */}
                <div className="flex flex-col h-full">
                    <div className="flex-1 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-center overflow-hidden relative min-h-[400px]">
                        {isGenerating ? (
                            <div className="text-center space-y-4">
                                <div className="relative w-20 h-20 mx-auto">
                                    <div className="absolute inset-0 border-t-2 border-purple-500 rounded-full animate-spin"></div>
                                    <div className="absolute inset-2 border-t-2 border-pink-500 rounded-full animate-spin animation-delay-150"></div>
                                </div>
                                <p className="text-slate-400 animate-pulse">Creating your masterpiece...</p>
                            </div>
                        ) : generatedVideoUrl ? (
                            <div className="relative w-full h-full flex flex-col">
                                <video 
                                    src={generatedVideoUrl} 
                                    controls 
                                    autoPlay 
                                    loop 
                                    className="w-full h-full object-contain bg-black"
                                />
                                <div className="absolute bottom-4 right-4">
                                    <a 
                                        href={generatedVideoUrl} 
                                        download="veo-animation.mp4"
                                        className="flex items-center gap-2 px-4 py-2 bg-white text-slate-900 rounded-full font-bold shadow-lg hover:bg-slate-200 transition-colors"
                                    >
                                        <Download className="w-4 h-4" /> Download
                                    </a>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center text-slate-600">
                                <Film className="w-16 h-16 mx-auto mb-4 opacity-20" />
                                <p>Generated video will appear here</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
