import React, { useCallback } from 'react';
import { Upload, FileVideo, Music } from 'lucide-react';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  isProcessing: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect, isProcessing }) => {
  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      if (isProcessing) return;

      const files = e.dataTransfer.files;
      if (files && files.length > 0) {
        const file = files[0];
        if (file.type.startsWith('video/') || file.type.startsWith('audio/')) {
          onFileSelect(file);
        } else {
          alert('Please upload a video or audio file.');
        }
      }
    },
    [onFileSelect, isProcessing]
  );

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileSelect(e.target.files[0]);
    }
  };

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      className={`relative group border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300 ease-in-out
        ${isProcessing 
          ? 'border-slate-700 bg-slate-900/50 cursor-not-allowed opacity-50' 
          : 'border-slate-600 hover:border-blue-500 bg-slate-800/30 hover:bg-slate-800/50 cursor-pointer'
        }
      `}
    >
      <input
        type="file"
        accept="video/*,audio/*"
        onChange={handleFileInput}
        disabled={isProcessing}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
      />
      
      <div className="flex flex-col items-center justify-center space-y-4">
        <div className={`p-4 rounded-full bg-slate-800 transition-transform duration-300 ${!isProcessing && 'group-hover:scale-110 group-hover:bg-blue-500/20'}`}>
          <Upload className={`w-8 h-8 ${!isProcessing ? 'text-blue-400' : 'text-slate-500'}`} />
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-semibold text-slate-200">
            {isProcessing ? 'Processing Media...' : 'Upload Video or Audio'}
          </h3>
          <p className="text-sm text-slate-400 max-w-xs mx-auto">
            Drag & drop or click to select. Supports MP4, WEBM, MP3, WAV.
          </p>
        </div>
        <div className="flex gap-4 text-xs text-slate-500 mt-4">
            <span className="flex items-center gap-1"><FileVideo className="w-4 h-4" /> Video</span>
            <span className="flex items-center gap-1"><Music className="w-4 h-4" /> Audio</span>
        </div>
      </div>
    </div>
  );
};