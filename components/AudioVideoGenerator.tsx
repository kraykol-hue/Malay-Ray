
import React, { useState, useRef } from 'react';
import { Upload, Music, Image as ImageIcon, Film, Loader2, Download, Play, RefreshCw } from 'lucide-react';

export const AudioVideoGenerator: React.FC = () => {
    const [audioFile, setAudioFile] = useState<File | null>(null);
    const [imageFiles, setImageFiles] = useState<File[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [progress, setProgress] = useState(0);

    const canvasRef = useRef<HTMLCanvasElement>(null);

    const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setAudioFile(e.target.files[0]);
        }
    };

    const handleImagesUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setImageFiles(Array.from(e.target.files));
        }
    };

    const generateVideo = async () => {
        if (!audioFile || imageFiles.length === 0) return;
        setIsGenerating(true);
        setPreviewUrl(null);
        setProgress(0);

        try {
            // 1. Prepare Audio Element to get duration
            const audioUrl = URL.createObjectURL(audioFile);
            const audioEl = new Audio(audioUrl);
            await new Promise((resolve) => (audioEl.onloadedmetadata = resolve));
            const duration = audioEl.duration;

            // 2. Setup Canvas
            const canvas = document.createElement('canvas');
            const width = 1280;
            const height = 720;
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (!ctx) throw new Error("No canvas context");

            // 3. Load Images
            const images = await Promise.all(
                imageFiles.map(
                    (file) =>
                        new Promise<HTMLImageElement>((resolve) => {
                            const img = new Image();
                            img.onload = () => resolve(img);
                            img.src = URL.createObjectURL(file);
                        })
                )
            );

            // 4. Setup Audio Context & Recording
            const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const source = audioCtx.createMediaElementSource(audioEl);
            const dest = audioCtx.createMediaStreamDestination();
            source.connect(dest);
            // Connect to speakers if we want to hear it while generating (optional, muting for now)
            // source.connect(audioCtx.destination); 

            const stream = canvas.captureStream(30);
            const audioTrack = dest.stream.getAudioTracks()[0];
            if (audioTrack) stream.addTrack(audioTrack);

            const recorder = new MediaRecorder(stream, {
                mimeType: 'video/webm;codecs=vp9',
                videoBitsPerSecond: 2500000
            });

            const chunks: Blob[] = [];
            recorder.ondataavailable = (e) => chunks.push(e.data);
            recorder.onstop = () => {
                const blob = new Blob(chunks, { type: 'video/webm' });
                setPreviewUrl(URL.createObjectURL(blob));
                setIsGenerating(false);
                audioCtx.close();
            };

            // 5. Animation Loop
            const imageDuration = duration / images.length;
            
            recorder.start();
            audioEl.play();

            const startTime = performance.now();
            
            const draw = () => {
                const elapsed = (performance.now() - startTime) / 1000;
                
                // Update Progress
                setProgress(Math.min(100, (elapsed / duration) * 100));

                if (elapsed >= duration) {
                    recorder.stop();
                    audioEl.pause();
                    return;
                }

                // Determine which image to show
                const imgIndex = Math.floor(elapsed / imageDuration);
                const currentImg = images[Math.min(imgIndex, images.length - 1)];

                // Draw Background (Black)
                ctx.fillStyle = '#000';
                ctx.fillRect(0, 0, width, height);

                // Draw Image (Cover Fit)
                if (currentImg) {
                   // Calculate Aspect Ratio scale
                   const scale = Math.max(width / currentImg.width, height / currentImg.height);
                   const x = (width / 2) - (currentImg.width / 2) * scale;
                   const y = (height / 2) - (currentImg.height / 2) * scale;
                   ctx.drawImage(currentImg, x, y, currentImg.width * scale, currentImg.height * scale);
                }

                requestAnimationFrame(draw);
            };

            draw();

        } catch (error) {
            console.error(error);
            setIsGenerating(false);
            alert("Failed to generate video");
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="text-center space-y-4">
                <h2 className="text-3xl font-bold text-white">Audio Video Maker</h2>
                <p className="text-slate-400 max-w-lg mx-auto">
                    Turn your audio podcast or music into a video by stitching multiple images together.
                </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
                {/* Inputs */}
                <div className="bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-800 p-8 space-y-6">
                    {/* Audio Input */}
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                            <Music className="w-4 h-4 text-blue-400" /> Audio Track
                        </label>
                        <div className="border border-dashed border-slate-700 rounded-xl p-4 hover:bg-slate-800/50 transition-colors">
                            <input 
                                type="file" 
                                accept="audio/*" 
                                onChange={handleAudioUpload}
                                className="w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-500"
                            />
                        </div>
                        {audioFile && <p className="text-xs text-green-400">Selected: {audioFile.name}</p>}
                    </div>

                    {/* Images Input */}
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                            <ImageIcon className="w-4 h-4 text-purple-400" /> Visuals
                        </label>
                        <div className="border border-dashed border-slate-700 rounded-xl p-4 hover:bg-slate-800/50 transition-colors">
                            <input 
                                type="file" 
                                accept="image/*" 
                                multiple
                                onChange={handleImagesUpload}
                                className="w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-purple-600 file:text-white hover:file:bg-purple-500"
                            />
                        </div>
                        {imageFiles.length > 0 && <p className="text-xs text-green-400">{imageFiles.length} images selected</p>}
                    </div>

                    <button 
                        onClick={generateVideo}
                        disabled={isGenerating || !audioFile || imageFiles.length === 0}
                        className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg transition-all"
                    >
                        {isGenerating ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" /> Processing {Math.round(progress)}%
                            </>
                        ) : (
                            <>
                                <Film className="w-5 h-5" /> Generate Video
                            </>
                        )}
                    </button>
                </div>

                {/* Preview */}
                <div className="bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-800 overflow-hidden flex flex-col min-h-[400px]">
                    <div className="p-4 border-b border-slate-800 font-semibold text-white">Preview</div>
                    <div className="flex-1 flex items-center justify-center bg-black/50 relative">
                        {previewUrl ? (
                            <div className="w-full h-full flex flex-col">
                                <video src={previewUrl} controls className="w-full h-full object-contain" />
                                <a 
                                    href={previewUrl}
                                    download="audiovideo.webm"
                                    className="absolute bottom-4 right-4 bg-white text-black px-4 py-2 rounded-full font-bold flex items-center gap-2 hover:bg-slate-200 transition-colors"
                                >
                                    <Download className="w-4 h-4" /> Download
                                </a>
                            </div>
                        ) : (
                            <div className="text-center text-slate-500">
                                <Film className="w-16 h-16 mx-auto mb-4 opacity-20" />
                                <p>Generated video will appear here.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
