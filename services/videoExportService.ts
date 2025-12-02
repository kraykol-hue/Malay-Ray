
import { TimeSegment } from '../types';

export const exportVideo = async (
  videoUrl: string,
  activeSegments: TimeSegment[],
  smartSkipEnabled: boolean,
  visualEnhancementEnabled: boolean,
  onProgress: (progress: number) => void
): Promise<Blob> => {
  return new Promise(async (resolve, reject) => {
    const video = document.createElement('video');
    video.style.display = 'none';
    document.body.appendChild(video); // Append to DOM to avoid throttling
    
    // Clean up helper
    const cleanup = () => {
       if (video.parentNode) document.body.removeChild(video);
       // Note: we don't revoke the videoUrl as it belongs to the app state
    };

    try {
      video.src = videoUrl;
      video.crossOrigin = 'anonymous'; 
      // Need to unmute to capture audio stream, but we don't want to hear it.
      // We will handle audio routing via Web Audio API.
      video.muted = false; 
      video.volume = 1.0;

      await new Promise((r) => video.onloadedmetadata = r);
      const duration = video.duration;

      // Determine segments to record
      let segmentsToRecord: TimeSegment[] = [];
      if (smartSkipEnabled && activeSegments.length > 0) {
        segmentsToRecord = [...activeSegments].sort((a, b) => a.start - b.start);
      } else {
        segmentsToRecord = [{ start: 0, end: duration }];
      }

      // Setup Canvas
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not get canvas context');

      if (visualEnhancementEnabled) {
        // Matches the CSS: contrast-110 brightness-110 saturate-110 sepia-[.10]
        ctx.filter = 'contrast(1.1) brightness(1.1) saturate(1.1) sepia(0.1)';
      }

      // Setup Audio
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const source = audioCtx.createMediaElementSource(video);
      const dest = audioCtx.createMediaStreamDestination();
      source.connect(dest);
      // Important: Do NOT connect to audioCtx.destination to avoid echoing sound during export

      // Setup Recorder
      const stream = canvas.captureStream(30); // 30 FPS
      const audioTrack = dest.stream.getAudioTracks()[0];
      if (audioTrack) {
        stream.addTrack(audioTrack);
      }

      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9') 
        ? 'video/webm;codecs=vp9' 
        : 'video/webm';

      const recorder = new MediaRecorder(stream, { 
        mimeType,
        videoBitsPerSecond: 2500000 // 2.5 Mbps
      });

      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: mimeType });
        cleanup();
        audioCtx.close();
        resolve(blob);
      };

      // Playback & Record Loop
      recorder.start();
      recorder.pause(); // Start paused

      let currentSegmentIndex = 0;

      const processNextFrame = () => {
        if (currentSegmentIndex >= segmentsToRecord.length) {
          recorder.stop();
          return;
        }

        const seg = segmentsToRecord[currentSegmentIndex];
        
        // Draw frame
        ctx.drawImage(video, 0, 0);

        // Calculate total duration for progress
        // This is a rough estimation based on segment counts for simplicity in this demo
        const progress = ((currentSegmentIndex) / segmentsToRecord.length) * 100 
                       + ((video.currentTime - seg.start) / (seg.end - seg.start)) * (100 / segmentsToRecord.length);
        
        onProgress(Math.min(99, Math.max(0, progress)));

        if (video.currentTime >= seg.end) {
           video.pause();
           recorder.pause();
           currentSegmentIndex++;
           startNextSegment();
        } else {
           requestAnimationFrame(processNextFrame);
        }
      };

      const startNextSegment = async () => {
        if (currentSegmentIndex >= segmentsToRecord.length) {
          recorder.stop();
          return;
        }
        
        const seg = segmentsToRecord[currentSegmentIndex];
        video.currentTime = seg.start;
        
        await new Promise<void>(r => {
           const h = () => { video.removeEventListener('seeked', h); r(); };
           video.addEventListener('seeked', h);
        });

        recorder.resume();
        try {
          await video.play();
          processNextFrame();
        } catch (e) {
          console.error("Auto-play failed during export", e);
          reject(e);
        }
      };

      // Ignite
      startNextSegment();

    } catch (error) {
      cleanup();
      reject(error);
    }
  });
};
