
import React, { useRef, useEffect, useState, useMemo } from 'react';
import { Play, Pause, SkipForward, Wand2, MonitorPlay, Edit, Plus, Trash2, Clock, Check, X, Download, Loader2, Volume2, VolumeX } from 'lucide-react';
import { TimeSegment } from '../types';
import { exportVideo } from '../services/videoExportService';

interface SmartPlayerProps {
  src: string;
  activeSegments: TimeSegment[];
  smartSkipEnabled: boolean;
  onToggleSmartSkip: (enabled: boolean) => void;
  visualEnhancementEnabled: boolean;
  onToggleVisualEnhancement: (enabled: boolean) => void;
  onUpdateSegments: (segments: TimeSegment[]) => void;
}

export const SmartPlayer: React.FC<SmartPlayerProps> = ({ 
  src, 
  activeSegments, 
  smartSkipEnabled, 
  onToggleSmartSkip,
  visualEnhancementEnabled,
  onToggleVisualEnhancement,
  onUpdateSegments
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);

  // Flatten segments for easier logic check
  const sortedSegments = useMemo(() => {
    return [...activeSegments].sort((a, b) => a.start - b.start);
  }, [activeSegments]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);

      if (smartSkipEnabled && sortedSegments.length > 0 && !isEditing && !isExporting) {
        // Find if current time is inside a valid segment
        const isInsideSegment = sortedSegments.some(
          seg => video.currentTime >= seg.start && video.currentTime <= seg.end
        );

        if (!isInsideSegment) {
          // We are in a "blank space" or silence
          // Find the NEXT valid segment start
          const nextSegment = sortedSegments.find(seg => seg.start > video.currentTime);
          
          if (nextSegment) {
            // Skip to next segment
            video.currentTime = nextSegment.start;
          } else if (video.currentTime > sortedSegments[sortedSegments.length - 1].end) {
             // End of all valid speech, pause or let it finish naturally if desired
          }
        }
      }
    };

    const handleLoadedMetadata = () => {
        setDuration(video.duration);
        // Ensure volume is synced on load
        video.volume = volume;
        video.muted = isMuted;
    };
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
    };
  }, [smartSkipEnabled, sortedSegments, isEditing, isExporting]); // Remove volume/isMuted from dependency array to avoid re-attaching listeners on volume change, handle those in handlers

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) videoRef.current.pause();
      else videoRef.current.play();
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVol = parseFloat(e.target.value);
    setVolume(newVol);
    if (videoRef.current) {
        videoRef.current.volume = newVol;
        if (newVol > 0 && isMuted) {
            setIsMuted(false);
            videoRef.current.muted = false;
        }
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
        const newMuted = !isMuted;
        setIsMuted(newMuted);
        videoRef.current.muted = newMuted;
    }
  };

  // Helper to visualize segments on timeline
  const getSegmentStyle = (seg: TimeSegment) => {
    if (duration === 0) return { left: '0%', width: '0%' };
    const left = (seg.start / duration) * 100;
    const width = ((seg.end - seg.start) / duration) * 100;
    return { left: `${left}%`, width: `${width}%` };
  };

  // Editing Handlers
  const handleUpdateSegment = (index: number, field: 'start' | 'end', value: string) => {
      const numValue = parseFloat(value);
      if (isNaN(numValue)) return;
      
      const newSegments = [...activeSegments];
      newSegments[index] = { ...newSegments[index], [field]: numValue };
      onUpdateSegments(newSegments);
  };

  const handleSetToCurrent = (index: number, field: 'start' | 'end') => {
      const newSegments = [...activeSegments];
      newSegments[index] = { ...newSegments[index], [field]: currentTime };
      onUpdateSegments(newSegments);
  };

  const handleAddSegment = () => {
      const start = currentTime;
      const end = Math.min(currentTime + 5, duration);
      onUpdateSegments([...activeSegments, { start, end }]);
  };

  const handleRemoveSegment = (index: number) => {
      const newSegments = activeSegments.filter((_, i) => i !== index);
      onUpdateSegments(newSegments);
  };

  const handleExport = async () => {
      setIsExporting(true);
      if(videoRef.current) videoRef.current.pause();
      
      try {
          const blob = await exportVideo(
              src, 
              activeSegments, 
              smartSkipEnabled, 
              visualEnhancementEnabled,
              (progress) => setExportProgress(progress)
          );
          
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `smartcut-export-${Date.now()}.webm`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          
      } catch (error) {
          console.error("Export failed", error);
          alert("Export failed. Please try again.");
      } finally {
          setIsExporting(false);
          setExportProgress(0);
      }
  };

  return (
    <div className="bg-slate-900 rounded-xl overflow-hidden shadow-2xl border border-slate-800 flex flex-col h-full relative">
      
      {/* Export Overlay */}
      {isExporting && (
          <div className="absolute inset-0 z-50 bg-slate-900/90 backdrop-blur-sm flex flex-col items-center justify-center">
              <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Exporting Video...</h3>
              <p className="text-slate-400 mb-6 text-sm">Applying cuts and filters</p>
              
              <div className="w-64 h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div 
                      className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 transition-all duration-300"
                      style={{ width: `${exportProgress}%` }}
                  />
              </div>
              <p className="text-xs text-slate-500 mt-2">{Math.round(exportProgress)}%</p>
          </div>
      )}

      {/* Video Area */}
      <div className="relative aspect-video bg-black flex items-center justify-center group overflow-hidden shrink-0">
        <video
          ref={videoRef}
          src={src}
          className={`w-full h-full object-contain transition-all duration-500 ${visualEnhancementEnabled ? 'contrast-110 brightness-110 saturate-110 sepia-[.10]' : ''}`}
          controls={false}
          onClick={togglePlay}
        />
        
        {/* Visual Enhancement Badge */}
        {visualEnhancementEnabled && (
           <div className="absolute top-4 right-4 bg-blue-500/20 backdrop-blur-md border border-blue-500/30 text-blue-300 text-xs px-2 py-1 rounded-md flex items-center gap-1 font-medium pointer-events-none animate-pulse">
             <Wand2 className="w-3 h-3" /> Enhanced
           </div>
        )}

        {/* Play Overlay */}
        {!isPlaying && !isExporting && (
          <div 
            className="absolute inset-0 flex items-center justify-center bg-black/40 hover:bg-black/30 transition-colors cursor-pointer"
            onClick={togglePlay}
          >
            <div className="p-4 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 hover:scale-110 transition-transform">
              <Play className="w-8 h-8 text-white fill-white" />
            </div>
          </div>
        )}
      </div>

      {/* Controls Container - Flex Grow to fill remaining space if needed, but usually just creates flow */}
      <div className="flex-1 flex flex-col min-h-0">
          <div className="p-4 bg-slate-900 space-y-4 border-b border-slate-800">
            {/* Progress Bar with Segments */}
            <div className="relative h-2 bg-slate-800 rounded-full cursor-pointer group"
                onClick={(e) => {
                    if(!videoRef.current || isExporting) return;
                    const rect = e.currentTarget.getBoundingClientRect();
                    const pos = (e.clientX - rect.left) / rect.width;
                    videoRef.current.currentTime = pos * duration;
                }}>
              
              {/* Active Speech Segments Highlights */}
              {sortedSegments.map((seg, idx) => (
                <div
                  key={idx}
                  className={`absolute h-full transition-colors ${isEditing ? 'bg-blue-500/40 border-x border-blue-400' : 'bg-emerald-900/40'}`}
                  style={getSegmentStyle(seg)}
                />
              ))}

              {/* Current Progress */}
              <div 
                className="absolute h-full bg-blue-500 rounded-full transition-all duration-100 relative"
                style={{ width: `${(currentTime / duration) * 100}%` }}
              >
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover:opacity-100 shadow-lg transform translate-x-1/2 transition-opacity" />
              </div>
            </div>

            {/* Buttons Row */}
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <button 
                    onClick={togglePlay}
                    disabled={isExporting}
                    className="p-2 hover:bg-slate-800 rounded-lg text-slate-300 hover:text-white transition-colors disabled:opacity-50"
                  >
                    {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
                  </button>

                  {/* Volume Control */}
                  <div className="flex items-center gap-1 group/volume">
                      <button 
                          onClick={toggleMute}
                          className="p-2 hover:bg-slate-800 rounded-lg text-slate-300 hover:text-white transition-colors"
                      >
                          {isMuted || volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                      </button>
                      <div className="w-0 overflow-hidden group-hover/volume:w-20 transition-all duration-300 ease-out">
                          <input
                              type="range"
                              min="0"
                              max="1"
                              step="0.05"
                              value={isMuted ? 0 : volume}
                              onChange={handleVolumeChange}
                              className="w-16 h-1 accent-blue-500 bg-slate-700 rounded-lg cursor-pointer align-middle"
                          />
                      </div>
                  </div>
                  
                  <div className="text-sm font-mono text-slate-400">
                    {new Date(currentTime * 1000).toISOString().substr(14, 5)} / 
                    {new Date(duration * 1000).toISOString().substr(14, 5)}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    disabled={isExporting}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                      isEditing
                        ? 'bg-purple-500/10 text-purple-400 border-purple-500/50' 
                        : 'bg-slate-800 text-slate-400 border-transparent hover:border-slate-600 disabled:opacity-50'
                    }`}
                  >
                    {isEditing ? <Check className="w-3.5 h-3.5" /> : <Edit className="w-3.5 h-3.5" />}
                    {isEditing ? 'Done Editing' : 'Edit Segments'}
                  </button>

                  {!isEditing && (
                    <>
                      <button
                        onClick={() => onToggleSmartSkip(!smartSkipEnabled)}
                        disabled={isExporting}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                          smartSkipEnabled 
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/50' 
                            : 'bg-slate-800 text-slate-400 border-transparent hover:border-slate-600 disabled:opacity-50'
                        }`}
                      >
                        <SkipForward className="w-3.5 h-3.5" />
                        Skip Silence
                      </button>

                      <button
                        onClick={() => onToggleVisualEnhancement(!visualEnhancementEnabled)}
                        disabled={isExporting}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                            visualEnhancementEnabled 
                            ? 'bg-blue-500/10 text-blue-400 border-blue-500/50' 
                            : 'bg-slate-800 text-slate-400 border-transparent hover:border-slate-600 disabled:opacity-50'
                        }`}
                      >
                        <MonitorPlay className="w-3.5 h-3.5" />
                        Enhance Visuals
                      </button>

                      <div className="w-px h-6 bg-slate-700 mx-1"></div>

                      <button
                        onClick={handleExport}
                        disabled={isExporting}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-900 hover:bg-white transition-colors disabled:opacity-50"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Export Video
                      </button>
                    </>
                  )}
                </div>
            </div>
          </div>

          {/* Segment Editor Panel */}
          {isEditing && (
             <div className="flex-1 overflow-y-auto bg-slate-900/50 p-4 border-t border-slate-800">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                       <Edit className="w-4 h-4 text-purple-400" /> Segment Editor
                    </h3>
                    <button 
                       onClick={handleAddSegment}
                       className="text-xs flex items-center gap-1 bg-purple-500/20 text-purple-300 px-2 py-1 rounded hover:bg-purple-500/30 transition-colors"
                    >
                       <Plus className="w-3 h-3" /> Add Segment
                    </button>
                </div>
                
                <div className="space-y-2">
                   {activeSegments.map((seg, idx) => (
                      <div key={idx} className="flex flex-wrap items-center gap-2 bg-slate-800/40 p-2 rounded-lg border border-slate-700/50 group hover:border-slate-600">
                         <span className="text-xs font-mono text-slate-500 w-6">#{idx + 1}</span>
                         
                         {/* Start Time */}
                         <div className="flex items-center gap-1">
                            <label className="text-[10px] text-slate-500 uppercase">Start</label>
                            <input 
                               type="number" 
                               step="0.1"
                               value={seg.start}
                               onChange={(e) => handleUpdateSegment(idx, 'start', e.target.value)}
                               className="w-20 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 focus:border-purple-500 outline-none font-mono"
                            />
                            <button 
                               onClick={() => handleSetToCurrent(idx, 'start')}
                               title="Set Start to Playhead"
                               className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-purple-400"
                            >
                               <Clock className="w-3 h-3" />
                            </button>
                         </div>

                         <div className="w-2 h-px bg-slate-700" />

                         {/* End Time */}
                         <div className="flex items-center gap-1">
                            <label className="text-[10px] text-slate-500 uppercase">End</label>
                            <input 
                               type="number" 
                               step="0.1"
                               value={seg.end}
                               onChange={(e) => handleUpdateSegment(idx, 'end', e.target.value)}
                               className="w-20 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 focus:border-purple-500 outline-none font-mono"
                            />
                            <button 
                               onClick={() => handleSetToCurrent(idx, 'end')}
                               title="Set End to Playhead"
                               className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-purple-400"
                            >
                               <Clock className="w-3 h-3" />
                            </button>
                         </div>

                         <div className="flex-grow" />

                         {/* Actions */}
                         <button
                            onClick={() => {
                               if (videoRef.current) {
                                   videoRef.current.currentTime = seg.start;
                                   videoRef.current.play();
                                   // Auto-pause after segment duration (simple preview)
                                   setTimeout(() => videoRef.current?.pause(), (seg.end - seg.start) * 1000);
                               }
                            }}
                            className="text-[10px] px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400"
                         >
                            Preview
                         </button>
                         <button 
                            onClick={() => handleRemoveSegment(idx)}
                            className="p-1.5 hover:bg-red-900/20 rounded text-slate-500 hover:text-red-400 transition-colors"
                         >
                            <Trash2 className="w-3.5 h-3.5" />
                         </button>
                      </div>
                   ))}
                   
                   {activeSegments.length === 0 && (
                      <div className="text-center p-4 text-sm text-slate-500 border border-dashed border-slate-800 rounded">
                         No active segments. Video will be skipped entirely if skip is on. Add a segment to keep parts of the video.
                      </div>
                   )}
                </div>
             </div>
          )}
      </div>
    </div>
  );
};
