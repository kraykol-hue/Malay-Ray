
import React, { useState, useCallback } from 'react';
import { Upload, Image as ImageIcon, Loader2, AlertCircle, Info, Tag, Palette, Type, Sparkles } from 'lucide-react';
import { analyzeImage } from '../services/geminiService';
import { ImageAnalysisResult } from '../types';

export const ImageAnalyzer: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<ImageAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (isAnalyzing) return;

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileSelection(files[0]);
    }
  }, [isAnalyzing]);

  const handleFileSelection = (selectedFile: File) => {
    if (selectedFile.type.startsWith('image/')) {
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
      setResult(null);
      setError(null);
      analyze(selectedFile);
    } else {
      setError('Please upload an image file.');
    }
  };

  const analyze = async (imageFile: File) => {
    setIsAnalyzing(true);
    setError(null);
    try {
      const data = await analyzeImage(imageFile);
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'Failed to analyze image.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const reset = () => {
    setFile(null);
    setPreviewUrl(null);
    setResult(null);
    setError(null);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400 inline-block">
          AI Image Vision
        </h2>
        <p className="text-slate-400 max-w-lg mx-auto">
          Upload an image to detect objects, analyze colors, and get creative captions using Gemini 3 Pro.
        </p>
      </div>

      {!file ? (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          className="max-w-2xl mx-auto aspect-video border-2 border-dashed border-slate-700 hover:border-blue-500 hover:bg-slate-800/30 bg-slate-800/20 rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all group"
        >
          <div className="p-4 rounded-full bg-slate-800 group-hover:bg-blue-500/20 group-hover:scale-110 transition-all duration-300 mb-4">
            <Upload className="w-10 h-10 text-slate-500 group-hover:text-blue-400" />
          </div>
          <h3 className="text-xl font-semibold text-slate-300">Upload Image</h3>
          <p className="text-slate-500 text-sm mt-2">Drag & drop or click to browse</p>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => e.target.files?.[0] && handleFileSelection(e.target.files[0])}
            className="absolute inset-0 opacity-0 cursor-pointer"
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-[600px]">
          {/* Image Preview Column */}
          <div className="bg-black/50 rounded-2xl overflow-hidden border border-slate-800 relative flex items-center justify-center group">
            <img 
              src={previewUrl!} 
              alt="Analyzed" 
              className="max-w-full max-h-full object-contain"
            />
            <button 
               onClick={reset}
               className="absolute top-4 right-4 bg-slate-900/80 hover:bg-slate-900 text-white p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm border border-slate-700"
            >
              Upload New
            </button>
          </div>

          {/* Analysis Results Column */}
          <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-800 bg-slate-800/30 flex items-center justify-between">
               <h3 className="font-semibold text-slate-200 flex items-center gap-2">
                 <Sparkles className="w-4 h-4 text-blue-400" /> Analysis Results
               </h3>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {isAnalyzing ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-4">
                   <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                   <p>Analyzing image structure and content...</p>
                </div>
              ) : error ? (
                <div className="flex items-start gap-3 text-red-400 bg-red-900/10 p-4 rounded-xl border border-red-900/20">
                   <AlertCircle className="w-5 h-5 mt-0.5" />
                   <p>{error}</p>
                </div>
              ) : result ? (
                <>
                  {/* Caption */}
                  <div className="space-y-2">
                     <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                        <Type className="w-3 h-3" /> Creative Caption
                     </label>
                     <p className="text-lg font-medium text-white italic leading-relaxed">
                        "{result.creativeCaption}"
                     </p>
                  </div>

                  {/* Description */}
                  <div className="bg-slate-800/50 p-4 rounded-xl space-y-2">
                     <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                        <Info className="w-3 h-3" /> Description
                     </label>
                     <p className="text-slate-300 text-sm leading-relaxed">
                        {result.description}
                     </p>
                  </div>

                  {/* Colors */}
                  <div className="space-y-2">
                     <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                        <Palette className="w-3 h-3" /> Dominant Colors
                     </label>
                     <div className="flex flex-wrap gap-2">
                        {result.dominantColors.map((color, idx) => (
                           <span key={idx} className="px-3 py-1 rounded-full bg-slate-800 text-xs text-slate-300 border border-slate-700 flex items-center gap-2">
                              <span className="w-3 h-3 rounded-full border border-white/10" style={{ backgroundColor: color.toLowerCase() }}></span>
                              {color}
                           </span>
                        ))}
                     </div>
                  </div>

                  {/* Objects */}
                  <div className="space-y-2">
                     <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                        <ImageIcon className="w-3 h-3" /> Detected Objects
                     </label>
                     <div className="flex flex-wrap gap-2">
                        {result.detectedObjects.map((obj, idx) => (
                           <span key={idx} className="px-2 py-1 rounded bg-blue-500/10 text-blue-300 text-xs border border-blue-500/20">
                              {obj}
                           </span>
                        ))}
                     </div>
                  </div>

                  {/* Hashtags */}
                  <div className="pt-4 border-t border-slate-800">
                     <div className="flex flex-wrap gap-2">
                        {result.hashtags.map((tag, idx) => (
                           <span key={idx} className="text-sm text-blue-400 hover:text-blue-300 cursor-pointer">
                              #{tag.replace('#', '')}
                           </span>
                        ))}
                     </div>
                  </div>
                </>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
