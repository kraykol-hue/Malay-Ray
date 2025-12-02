
export interface TimeSegment {
  start: number;
  end: number;
}

export interface AnalysisResult {
  activeSegments: TimeSegment[];
  originalTranscript: string;
  enhancedTranscript: string;
  sentiment: string;
  summary: string;
}

export interface ImageAnalysisResult {
  description: string;
  detectedObjects: string[];
  dominantColors: string[];
  creativeCaption: string;
  hashtags: string[];
}

export interface VideoState {
  file: File | null;
  url: string | null;
  isProcessing: boolean;
  analysis: AnalysisResult | null;
  error: string | null;
}

export enum TabOption {
  TRANSCRIPT = 'TRANSCRIPT',
  STATS = 'STATS'
}
