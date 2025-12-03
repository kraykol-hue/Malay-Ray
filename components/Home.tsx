
import React from 'react';
import { Scissors, AudioLines, Presentation, ArrowRight, Zap, CheckCircle2, Wand2, Film, Layers, Mic } from 'lucide-react';
import { AppView } from '../types';

interface HomeProps {
    onNavigate: (view: AppView) => void;
}

export const Home: React.FC<HomeProps> = ({ onNavigate }) => {
    return (
        <div className="space-y-24 pb-20">
            {/* Hero Section */}
            <div className="relative mt-12 text-center space-y-8 max-w-4xl mx-auto px-6">
                <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl -z-10" />
                <div className="absolute top-20 left-20 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl -z-10" />
                
                <h1 className="text-6xl font-extrabold tracking-tight text-white leading-tight drop-shadow-2xl">
                    Create content like <br/>
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">Magic with AI</span>
                </h1>
                <p className="text-xl text-slate-300 leading-relaxed max-w-2xl mx-auto drop-shadow-md">
                    SmartCut Studio is the all-in-one AI creative suite. Edit videos, generate avatars, analyze images, and hold real-time conversations using the power of Gemini 2.5.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-4">
                    <button 
                        onClick={() => onNavigate(AppView.EDITOR)}
                        className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-full font-bold text-lg transition-all shadow-lg shadow-blue-500/25 flex items-center gap-2 hover:scale-105"
                    >
                        Get Started <ArrowRight className="w-5 h-5" />
                    </button>
                    <button 
                        onClick={() => onNavigate(AppView.ABOUT)}
                        className="px-8 py-4 bg-slate-800/80 hover:bg-slate-700/80 backdrop-blur-md text-white rounded-full font-bold text-lg transition-all border border-slate-600"
                    >
                        Learn More
                    </button>
                </div>
            </div>

            {/* Features Grid */}
            <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                    { 
                        icon: <Scissors className="w-8 h-8 text-emerald-400" />, 
                        title: "Smart Editor", 
                        desc: "Automatically remove silence and enhance video quality.",
                        view: AppView.EDITOR,
                        color: "emerald"
                    },
                    { 
                        icon: <Film className="w-8 h-8 text-purple-400" />, 
                        title: "Audio Video Maker", 
                        desc: "Combine audio tracks with images to create full videos.",
                        view: AppView.AUDIO_VIDEO,
                        color: "purple"
                    },
                    { 
                        icon: <Mic className="w-8 h-8 text-teal-400" />, 
                        title: "Voice Editor", 
                        desc: "Edit audio transcripts and regenerate speech.",
                        view: AppView.VOICE_EDITOR,
                        color: "teal"
                    },
                    { 
                        icon: <Presentation className="w-8 h-8 text-orange-400" />, 
                        title: "Presentation AI", 
                        desc: "Turn slides and photos into video presentations.",
                        view: AppView.PRESENTATION,
                        color: "orange"
                    },
                    { 
                        icon: <Layers className="w-8 h-8 text-pink-400" />, 
                        title: "Background Remix", 
                        desc: "Replace subject backgrounds with new images instantly.",
                        view: AppView.BG_REMOVER,
                        color: "pink"
                    },
                    { 
                        icon: <AudioLines className="w-8 h-8 text-blue-400" />, 
                        title: "Live Chat", 
                        desc: "Real-time voice conversations with Gemini.",
                        view: AppView.LIVE,
                        color: "blue"
                    },
                    {
                         icon: <Wand2 className="w-8 h-8 text-cyan-400" />,
                         title: "Image Vision",
                         desc: "Analyze images, detect objects, and get captions.",
                         view: AppView.IMAGE,
                         color: "cyan"
                    }
                ].map((feature, idx) => (
                    <div 
                        key={idx}
                        onClick={() => onNavigate(feature.view)}
                        className="group bg-slate-900/60 backdrop-blur-md hover:bg-slate-800/80 border border-slate-700/50 hover:border-slate-600 p-8 rounded-2xl cursor-pointer transition-all hover:-translate-y-1 shadow-lg"
                    >
                        <div className={`w-14 h-14 rounded-xl bg-${feature.color}-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                            {feature.icon}
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
                        <p className="text-slate-400 text-sm leading-relaxed">{feature.desc}</p>
                    </div>
                ))}
            </div>

            {/* Showcase Section */}
            <div className="max-w-7xl mx-auto px-6 bg-slate-900/60 backdrop-blur-xl rounded-3xl p-12 border border-slate-700/50 relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                
                <div className="grid md:grid-cols-2 gap-12 items-center relative z-10">
                    <div className="space-y-6">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold uppercase tracking-wider">
                            <Zap className="w-4 h-4" /> Powered by Gemini 2.5
                        </div>
                        <h2 className="text-4xl font-bold text-white">Unlock your creative potential</h2>
                        <div className="space-y-4">
                            {[
                                "Native Audio Streaming for real-time talk",
                                "Computer Vision for detailed image analysis",
                                "Fast audio stitching and video generation",
                                "Intelligent Silence Detection algorithm"
                            ].map((item, i) => (
                                <div key={i} className="flex items-center gap-3 text-slate-300">
                                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                                    <span>{item}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="relative aspect-video bg-black/50 rounded-xl overflow-hidden border border-slate-700 flex items-center justify-center group shadow-2xl">
                        <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/20 to-purple-500/20" />
                        <div className="flex flex-col items-center gap-4">
                            <Wand2 className="w-16 h-16 text-white/20 group-hover:text-white/40 transition-colors" />
                            <div className="text-sm text-slate-500 font-mono">AI Processing Engine</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
