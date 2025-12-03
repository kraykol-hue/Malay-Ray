
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

export interface PresentationState {
  speakerImage: File | null;
  slidesFile: File | null;
  script: string;
  isGeneratingScript: boolean;
  isProducingVideo: boolean;
  videoUrl: string | null;
  audioUrl: string | null;
  step: 'UPLOAD' | 'SCRIPT' | 'RESULT';
}

export enum TabOption {
  TRANSCRIPT = 'TRANSCRIPT',
  STATS = 'STATS'
}

export enum AppView {
  HOME = 'HOME',
  LOGIN = 'LOGIN',
  ABOUT = 'ABOUT',
  FAQ = 'FAQ',
  EDITOR = 'EDITOR',
  AUDIO_VIDEO = 'AUDIO_VIDEO',
  LIVE = 'LIVE',
  IMAGE = 'IMAGE',
  PRESENTATION = 'PRESENTATION',
  BG_REMOVER = 'BG_REMOVER',
  VOICE_EDITOR = 'VOICE_EDITOR'
}
