
import React from 'react';
import { HelpCircle, Info, ChevronDown } from 'lucide-react';

export const About: React.FC = () => {
    return (
        <div className="max-w-4xl mx-auto py-12 px-6">
            <div className="text-center mb-16">
                <h2 className="text-4xl font-bold text-white mb-4">About SmartCut Studio</h2>
                <p className="text-xl text-slate-400">Revolutionizing content creation with Generative AI.</p>
            </div>

            <div className="space-y-12">
                <section className="bg-slate-900/50 p-8 rounded-2xl border border-slate-800">
                    <h3 className="text-2xl font-bold text-blue-400 mb-4">Our Mission</h3>
                    <p className="text-slate-300 leading-relaxed">
                        We believe that creativity shouldn't be bottlenecked by technical tedium. 
                        SmartCut Studio leverages the cutting-edge capabilities of Google's Gemini 2.5 models 
                        to automate the mundane parts of video editing, presentation creation, and content analysis, 
                        freeing creators to focus on their story.
                    </p>
                </section>

                <div className="grid md:grid-cols-2 gap-8">
                    <div className="p-6 bg-slate-800 rounded-xl">
                        <h4 className="font-bold text-white mb-2">Technologically Advanced</h4>
                        <p className="text-slate-400 text-sm">Built on the latest multimodal AI models including Gemini 2.5 Flash, Pro Vision, and Veo.</p>
                    </div>
                    <div className="p-6 bg-slate-800 rounded-xl">
                        <h4 className="font-bold text-white mb-2">Privacy First</h4>
                        <p className="text-slate-400 text-sm">Your data is processed securely. We utilize transient processing for real-time features like Live Chat.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export const FAQ: React.FC = () => {
    return (
        <div className="max-w-3xl mx-auto py-12 px-6">
            <h2 className="text-3xl font-bold text-white mb-8 text-center">Frequently Asked Questions</h2>
            
            <div className="space-y-4">
                {[
                    {
                        q: "Do I need an API key?",
                        a: "Yes, this application requires a Google Gemini API Key. Some features like Veo Video Generation require a paid billing project on Google Cloud."
                    },
                    {
                        q: "What file formats are supported?",
                        a: "For video editing, we support MP4, WEBM, and MP3/WAV for audio. The Image Analyzer supports standard image formats. The Presentation Generator accepts PDF slides."
                    },
                    {
                        q: "How does the Smart Cut feature work?",
                        a: "We analyze the audio track of your video to identify segments of active speech. The player then automatically skips over the silent parts during playback or export."
                    },
                    {
                        q: "Is my data saved?",
                        a: "No, this is a client-side demo application. Your files are processed in your browser memory and sent to the API for analysis, but not stored on our servers."
                    }
                ].map((item, idx) => (
                    <div key={idx} className="bg-slate-900 border border-slate-800 rounded-xl p-6 hover:border-slate-700 transition-colors">
                        <h3 className="font-bold text-lg text-white mb-2 flex items-center justify-between">
                            {item.q}
                            <ChevronDown className="w-5 h-5 text-slate-500" />
                        </h3>
                        <p className="text-slate-400">{item.a}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};
