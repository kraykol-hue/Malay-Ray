
import React, { useState, useEffect } from 'react';
import { analyzeVideoContent } from './services/geminiService';
import { FileUpload } from './components/FileUpload';
import { SmartPlayer } from './components/SmartPlayer';
import { AudioVideoGenerator } from './components/AudioVideoGenerator';
import { LiveConversation } from './components/LiveConversation';
import { ImageAnalyzer } from './components/ImageAnalyzer';
import { PresentationGenerator } from './components/PresentationGenerator';
import { BackgroundRemover } from './components/BackgroundRemover';
import { VoiceEditor } from './components/VoiceEditor';
import { Home } from './components/Home';
import { Login } from './components/Login';
import { About, FAQ } from './components/InfoPages';
import { AnalysisResult, VideoState, TabOption, TimeSegment, AppView } from './types';
import { Wand2, FileText, BarChart2, AlertCircle, Scissors, MonitorPlay, Film, AudioLines, ScanEye, Presentation, Home as HomeIcon, LogOut, Info, HelpCircle, Layers, Mic } from 'lucide-react';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.HOME);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  const [videoState, setVideoState] = useState<VideoState>({
    file: null,
    url: null,
    isProcessing: false,
    analysis: null,
    error: null,
  });

  const [activeTab, setActiveTab] = useState<TabOption>(TabOption.TRANSCRIPT);
  const [smartSkipEnabled, setSmartSkipEnabled] = useState(true);
  const [visualEnhancementEnabled, setVisualEnhancementEnabled] = useState(true);

  // Cleanup object URL
  useEffect(() => {
    return () => {
      if (videoState.url) {
        URL.revokeObjectURL(videoState.url);
      }
    };
  }, [videoState.url]);

  const handleLogin = () => {
      setIsLoggedIn(true);
      setCurrentView(AppView.HOME);
  };

  const handleLogout = () => {
      setIsLoggedIn(false);
      setCurrentView(AppView.LOGIN);
      // Reset state if needed
      setVideoState({
        file: null,
        url: null,
        isProcessing: false,
        analysis: null,
        error: null,
      });
  };

  const handleFileSelect = async (file: File) => {
    const url = URL.createObjectURL(file);
    setVideoState({
      file,
      url,
      isProcessing: true,
      analysis: null,
      error: null
    });

    try {
      const analysis = await analyzeVideoContent(file);
      setVideoState(prev => ({
        ...prev,
        isProcessing: false,
        analysis
      }));
    } catch (err: any) {
      setVideoState(prev => ({
        ...prev,
        isProcessing: false,
        error: err.message || "Failed to analyze video."
      }));
    }
  };

  const handleUpdateSegments = (newSegments: TimeSegment[]) => {
    setVideoState(prev => {
      if (!prev.analysis) return prev;
      return {
        ...prev,
        analysis: {
          ...prev.analysis,
          activeSegments: newSegments
        }
      };
    });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Guard for protected routes
  const renderContent = () => {
      if (!isLoggedIn && currentView !== AppView.LOGIN && currentView !== AppView.ABOUT && currentView !== AppView.FAQ && currentView !== AppView.HOME) {
          // If trying to access tools without login, show login
          return <Login onLogin={handleLogin} />;
      }

      switch (currentView) {
          case AppView.HOME: return <Home onNavigate={(view) => {
              if(!isLoggedIn && view !== AppView.ABOUT && view !== AppView.FAQ) {
                  setCurrentView(AppView.LOGIN);
              } else {
                  setCurrentView(view);
              }
          }} />;
          case AppView.LOGIN: return <Login onLogin={handleLogin} />;
          case AppView.ABOUT: return <About />;
          case AppView.FAQ: return <FAQ />;
          case AppView.PRESENTATION: return <PresentationGenerator />;
          case AppView.AUDIO_VIDEO: return <AudioVideoGenerator />;
          case AppView.LIVE: return <LiveConversation />;
          case AppView.IMAGE: return <ImageAnalyzer />;
          case AppView.BG_REMOVER: return <BackgroundRemover />;
          case AppView.VOICE_EDITOR: return <VoiceEditor />;
          case AppView.EDITOR:
              return (
                <>
                {/* Upload State */}
                {!videoState.file && (
                  <div className="max-w-xl mx-auto mt-20">
                     <div className="text-center mb-8 space-y-2">
                       <h2 className="text-3xl font-bold text-white drop-shadow-md">Enhance Your Content</h2>
                       <p className="text-slate-300">Remove silence and improve quality instantly using Gemini 2.5.</p>
                     </div>
                     <FileUpload 
                       onFileSelect={handleFileSelect} 
                       isProcessing={videoState.isProcessing} 
                     />
                  </div>
                )}

                {/* Processing State */}
                {videoState.isProcessing && (
                  <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center">
                     <div className="relative w-24 h-24 mb-6">
                        <div className="absolute inset-0 border-t-4 border-blue-500 rounded-full animate-spin"></div>
                        <div className="absolute inset-2 border-t-4 border-emerald-500 rounded-full animate-spin animation-delay-150"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                           <Wand2 className="w-8 h-8 text-white animate-pulse" />
                        </div>
                     </div>
                     <h3 className="text-xl font-semibold text-white">Analyzing Content</h3>
                     <p className="text-slate-400 mt-2">Detecting silence and enhancing audio script...</p>
                  </div>
                )}

                {/* Editor View */}
                {videoState.url && !videoState.isProcessing && (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-[calc(100vh-8rem)]">
                    
                    {/* Left Col: Player */}
                    <div className="lg:col-span-8 flex flex-col gap-4 h-full">
                      <div className="flex-grow min-h-0">
                        <SmartPlayer 
                          src={videoState.url}
                          activeSegments={videoState.analysis?.activeSegments || []}
                          smartSkipEnabled={smartSkipEnabled}
                          onToggleSmartSkip={setSmartSkipEnabled}
                          visualEnhancementEnabled={visualEnhancementEnabled}
                          onToggleVisualEnhancement={setVisualEnhancementEnabled}
                          onUpdateSegments={handleUpdateSegments}
                        />
                      </div>
                      
                      {/* Stats Bar */}
                      {videoState.analysis && (
                        <div className="grid grid-cols-3 gap-4">
                           <div className="bg-slate-900/60 backdrop-blur-sm p-4 rounded-xl border border-slate-700/50">
                              <div className="text-xs text-slate-500 uppercase font-semibold mb-1">Silence Removed</div>
                              <div className="text-xl font-bold text-emerald-400">
                                 {videoState.analysis.activeSegments.length > 0 
                                   ? "Active" 
                                   : "Calculating"}
                              </div>
                           </div>
                           <div className="bg-slate-900/60 backdrop-blur-sm p-4 rounded-xl border border-slate-700/50">
                              <div className="text-xs text-slate-500 uppercase font-semibold mb-1">Sentiment</div>
                              <div className="text-xl font-bold text-blue-400">
                                 {videoState.analysis.sentiment}
                              </div>
                           </div>
                           <div className="bg-slate-900/60 backdrop-blur-sm p-4 rounded-xl border border-slate-700/50">
                              <div className="text-xs text-slate-500 uppercase font-semibold mb-1">Quality</div>
                              <div className="text-xl font-bold text-purple-400">Enhanced</div>
                           </div>
                        </div>
                      )}
                    </div>

                    {/* Right Col: Transcript & Tools */}
                    <div className="lg:col-span-4 flex flex-col bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-xl overflow-hidden h-full">
                      <div className="flex border-b border-slate-800">
                        <button
                          onClick={() => setActiveTab(TabOption.TRANSCRIPT)}
                          className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
                            activeTab === TabOption.TRANSCRIPT 
                              ? 'bg-slate-800 text-white border-b-2 border-blue-500' 
                              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                          }`}
                        >
                          <FileText className="w-4 h-4" /> Transcript
                        </button>
                        <button
                          onClick={() => setActiveTab(TabOption.STATS)}
                          className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
                            activeTab === TabOption.STATS 
                              ? 'bg-slate-800 text-white border-b-2 border-blue-500' 
                              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                          }`}
                        >
                          <BarChart2 className="w-4 h-4" /> AI Summary
                        </button>
                      </div>

                      <div className="flex-1 overflow-y-auto p-6 scroll-smooth">
                        {videoState.error ? (
                           <div className="text-red-400 flex items-center gap-2 p-4 bg-red-900/20 rounded-lg">
                              <AlertCircle className="w-5 h-5" />
                              {videoState.error}
                           </div>
                        ) : !videoState.analysis ? (
                           <div className="text-slate-500 text-center mt-10">Analysis pending...</div>
                        ) : (
                          <>
                            {activeTab === TabOption.TRANSCRIPT && (
                              <div className="space-y-6">
                                <div className="space-y-2">
                                   <h3 className="text-sm font-semibold text-emerald-400 flex items-center gap-2">
                                     <Wand2 className="w-3 h-3" /> Enhanced Transcript
                                   </h3>
                                   <p className="text-slate-300 leading-relaxed text-sm whitespace-pre-wrap">
                                     {videoState.analysis.enhancedTranscript}
                                   </p>
                                </div>
                                
                                <div className="h-px bg-slate-800" />
                                
                                <div className="space-y-2 opacity-60 hover:opacity-100 transition-opacity">
                                   <h3 className="text-sm font-semibold text-slate-400">Original Audio</h3>
                                   <p className="text-slate-400 leading-relaxed text-sm italic">
                                     "{videoState.analysis.originalTranscript}"
                                   </p>
                                </div>
                              </div>
                            )}

                            {activeTab === TabOption.STATS && (
                              <div className="space-y-6">
                                 <div className="bg-slate-800/50 p-4 rounded-lg">
                                    <h4 className="text-sm font-semibold text-white mb-2">Summary</h4>
                                    <p className="text-sm text-slate-300 leading-relaxed">
                                       {videoState.analysis.summary}
                                    </p>
                                 </div>

                                 <div>
                                    <h4 className="text-sm font-semibold text-white mb-3">Detected Segments</h4>
                                    <div className="space-y-2">
                                       {videoState.analysis.activeSegments.map((seg, idx) => (
                                          <div key={idx} className="flex items-center justify-between p-2 bg-slate-800/30 rounded border border-slate-700/50 text-xs">
                                             <span className="text-slate-400">Segment {idx + 1}</span>
                                             <span className="font-mono text-blue-400">
                                                {formatTime(seg.start)} - {formatTime(seg.end)}
                                             </span>
                                          </div>
                                       ))}
                                    </div>
                                 </div>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </>
            );
          default: return <Home onNavigate={setCurrentView} />;
      }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 selection:bg-blue-500/30 font-sans relative">
      
      {/* Background Image */}
      <div 
        className="fixed inset-0 z-0 pointer-events-none opacity-30 bg-cover bg-center"
        style={{
            backgroundImage: 'url("https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop")',
            filter: 'contrast(1.1) brightness(0.8)'
        }}
      />
      {/* Gradient Overlay for readability */}
      <div className="fixed inset-0 z-0 pointer-events-none bg-gradient-to-b from-slate-900/50 via-slate-900/80 to-slate-900" />

      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/70 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer group" onClick={() => setCurrentView(AppView.HOME)}>
            <div className="w-8 h-8 bg-gradient-to-tr from-blue-500 to-emerald-400 rounded-lg flex items-center justify-center group-hover:rotate-12 transition-transform shadow-lg shadow-blue-500/20">
              <Wand2 className="text-white w-5 h-5" />
            </div>
            <h1 className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400 drop-shadow-sm">
              SmartCut AI
            </h1>
          </div>
          
          {/* Main Navigation - Only show tools if logged in */}
          {isLoggedIn && (
            <nav className="hidden md:flex items-center bg-slate-800/60 backdrop-blur-md p-1 rounded-lg border border-slate-700/50">
                <button onClick={() => setCurrentView(AppView.EDITOR)} className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${currentView === AppView.EDITOR ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}><Scissors className="w-3.5 h-3.5" /> Editor</button>
                <button onClick={() => setCurrentView(AppView.AUDIO_VIDEO)} className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${currentView === AppView.AUDIO_VIDEO ? 'bg-purple-500/20 text-purple-300 shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}><Film className="w-3.5 h-3.5" /> Video Maker</button>
                <button onClick={() => setCurrentView(AppView.VOICE_EDITOR)} className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${currentView === AppView.VOICE_EDITOR ? 'bg-teal-500/20 text-teal-300 shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}><Mic className="w-3.5 h-3.5" /> Voice Editor</button>
                <button onClick={() => setCurrentView(AppView.LIVE)} className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${currentView === AppView.LIVE ? 'bg-blue-500/20 text-blue-300 shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}><AudioLines className="w-3.5 h-3.5" /> Live</button>
                <button onClick={() => setCurrentView(AppView.IMAGE)} className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${currentView === AppView.IMAGE ? 'bg-cyan-500/20 text-cyan-300 shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}><ScanEye className="w-3.5 h-3.5" /> Vision</button>
                <button onClick={() => setCurrentView(AppView.PRESENTATION)} className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${currentView === AppView.PRESENTATION ? 'bg-orange-500/20 text-orange-300 shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}><Presentation className="w-3.5 h-3.5" /> Presentation</button>
                <button onClick={() => setCurrentView(AppView.BG_REMOVER)} className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${currentView === AppView.BG_REMOVER ? 'bg-pink-500/20 text-pink-300 shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}><Layers className="w-3.5 h-3.5" /> Remix</button>
            </nav>
          )}

          {/* Right Nav */}
          <div className="flex items-center gap-4">
              <button onClick={() => setCurrentView(AppView.ABOUT)} className="text-sm text-slate-400 hover:text-white transition-colors">About</button>
              <button onClick={() => setCurrentView(AppView.FAQ)} className="text-sm text-slate-400 hover:text-white transition-colors">FAQ</button>
              {isLoggedIn ? (
                  <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-sm font-medium transition-colors border border-red-500/20">
                      <LogOut className="w-4 h-4" /> Sign Out
                  </button>
              ) : (
                  <button onClick={() => setCurrentView(AppView.LOGIN)} className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors shadow-lg shadow-blue-500/20">
                      Sign In
                  </button>
              )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 relative z-10">
          {renderContent()}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/50 mt-20 py-8 text-center text-slate-500 text-sm relative z-10 bg-slate-900/80 backdrop-blur-md">
         <p>&copy; 2024 SmartCut AI Studio. Powered by Google Gemini.</p>
      </footer>
    </div>
  );
};

export default App;
