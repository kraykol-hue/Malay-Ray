
import React, { useState } from 'react';
import { Upload, Image as ImageIcon, Layers, ArrowRight, Download, Loader2, Sparkles, AlertCircle } from 'lucide-react';
import { replaceBackground } from '../services/geminiService';

export const BackgroundRemover: React.FC = () => {
    const [foregroundFile, setForegroundFile] = useState<File | null>(null);
    const [backgroundFile, setBackgroundFile] = useState<File | null>(null);
    const [resultImage, setResultImage] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleUpload = (type: 'fg' | 'bg', e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            if (type === 'fg') setForegroundFile(e.target.files[0]);
            else setBackgroundFile(e.target.files[0]);
            
            // Reset result if inputs change
            setResultImage(null);
            setError(null);
        }
    };

    const handleProcess = async () => {
        if (!foregroundFile || !backgroundFile) return;
        
        setIsProcessing(true);
        setError(null);
        try {
            const resultUrl = await replaceBackground(foregroundFile, backgroundFile);
            setResultImage(resultUrl);
        } catch (e: any) {
            console.error(e);
            setError(e.message || "Failed to composite images.");
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-12">
            <div className="text-center space-y-4">
                <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-rose-400 inline-block">
                    Background Remix
                </h2>
                <p className="text-slate-400 max-w-lg mx-auto">
                    Seamlessly replace the background of your subject with a new scene using AI composition.
                </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 items-center">
                
                {/* Inputs Column */}
                <div className="space-y-6">
                    {/* Foreground Input */}
                    <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800 space-y-4">
                        <div className="flex items-center gap-2 font-semibold text-slate-200">
                             <span className="bg-pink-500/20 text-pink-300 w-6 h-6 rounded flex items-center justify-center text-xs">1</span>
                             Select Subject
                        </div>
                        <div 
                            className={`border-2 border-dashed rounded-xl p-4 transition-colors text-center cursor-pointer relative hover:bg-slate-800/50 ${
                                foregroundFile ? 'border-pink-500/50 bg-pink-500/10' : 'border-slate-700'
                            }`}
                        >
                            <input 
                                type="file" 
                                accept="image/*" 
                                onChange={(e) => handleUpload('fg', e)}
                                className="absolute inset-0 opacity-0 cursor-pointer"
                            />
                            {foregroundFile ? (
                                <div className="space-y-2">
                                    <img src={URL.createObjectURL(foregroundFile)} alt="Subject" className="h-32 mx-auto rounded object-contain" />
                                    <p className="text-xs text-pink-300 truncate px-2">{foregroundFile.name}</p>
                                </div>
                            ) : (
                                <div className="py-8 text-slate-500">
                                    <ImageIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                    <span className="text-sm">Click to Upload Subject</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Background Input */}
                    <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800 space-y-4">
                        <div className="flex items-center gap-2 font-semibold text-slate-200">
                             <span className="bg-rose-500/20 text-rose-300 w-6 h-6 rounded flex items-center justify-center text-xs">2</span>
                             New Background
                        </div>
                         <div 
                            className={`border-2 border-dashed rounded-xl p-4 transition-colors text-center cursor-pointer relative hover:bg-slate-800/50 ${
                                backgroundFile ? 'border-rose-500/50 bg-rose-500/10' : 'border-slate-700'
                            }`}
                        >
                            <input 
                                type="file" 
                                accept="image/*" 
                                onChange={(e) => handleUpload('bg', e)}
                                className="absolute inset-0 opacity-0 cursor-pointer"
                            />
                            {backgroundFile ? (
                                <div className="space-y-2">
                                    <img src={URL.createObjectURL(backgroundFile)} alt="BG" className="h-32 mx-auto rounded object-contain" />
                                    <p className="text-xs text-rose-300 truncate px-2">{backgroundFile.name}</p>
                                </div>
                            ) : (
                                <div className="py-8 text-slate-500">
                                    <Layers className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                    <span className="text-sm">Click to Upload BG</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Action Column */}
                <div className="flex flex-col items-center justify-center space-y-4">
                    <button
                        onClick={handleProcess}
                        disabled={!foregroundFile || !backgroundFile || isProcessing}
                        className="group relative w-16 h-16 rounded-full bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center shadow-lg shadow-rose-500/30 hover:scale-110 transition-transform disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed"
                    >
                        {isProcessing ? (
                            <Loader2 className="w-6 h-6 text-white animate-spin" />
                        ) : (
                            <ArrowRight className="w-8 h-8 text-white group-hover:translate-x-1 transition-transform" />
                        )}
                    </button>
                    <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold">Remix</p>
                </div>

                {/* Result Column */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden h-full min-h-[400px] flex flex-col">
                    <div className="p-4 border-b border-slate-800 bg-slate-800/30 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-pink-400" />
                        <span className="text-sm font-semibold text-slate-300">Composite Result</span>
                    </div>
                    
                    <div className="flex-1 flex items-center justify-center bg-black/50 relative p-4">
                        {error ? (
                             <div className="text-red-400 flex items-center gap-2 text-sm bg-red-900/10 px-4 py-2 rounded-lg">
                                <AlertCircle className="w-4 h-4" /> {error}
                             </div>
                        ) : resultImage ? (
                            <div className="w-full h-full flex flex-col items-center justify-center gap-4">
                                <img src={resultImage} alt="Composite" className="max-w-full max-h-[300px] rounded-lg shadow-2xl object-contain" />
                                <a 
                                    href={resultImage} 
                                    download="remixed-image.png"
                                    className="px-6 py-2 bg-white text-slate-900 rounded-full font-bold text-sm hover:bg-slate-200 transition-colors flex items-center gap-2"
                                >
                                    <Download className="w-4 h-4" /> Download Image
                                </a>
                            </div>
                        ) : (
                            <div className="text-center text-slate-600 space-y-2">
                                <ImageIcon className="w-12 h-12 mx-auto opacity-20" />
                                <p className="text-sm">Processed image will appear here</p>
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};
