
import React, { useState } from 'react';
import { Wand2, ArrowRight, Github, Mail, Facebook, Twitter } from 'lucide-react';

interface LoginProps {
    onLogin: () => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name && email) {
            handleSocialLogin('email');
        }
    };

    const handleSocialLogin = (provider: string) => {
        setIsLoading(true);
        // Simulate auth delay
        setTimeout(() => {
            setIsLoading(false);
            onLogin();
        }, 800);
    };

    return (
        <div className="min-h-[80vh] flex items-center justify-center px-4 relative">
             <div className="w-full max-w-md bg-slate-900/80 backdrop-blur-xl border border-slate-800 p-8 rounded-2xl shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-emerald-500" />
                
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-slate-800 rounded-2xl mx-auto flex items-center justify-center mb-4 border border-slate-700 shadow-lg">
                        <Wand2 className="w-8 h-8 text-blue-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-white">Welcome Back</h2>
                    <p className="text-slate-400 text-sm mt-2">Sign in to access SmartCut Studio tools.</p>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-6">
                    <button 
                        onClick={() => handleSocialLogin('google')}
                        disabled={isLoading}
                        className="col-span-2 bg-white hover:bg-slate-100 text-slate-900 font-semibold py-3 rounded-lg transition-all flex items-center justify-center gap-3 relative group"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                        </svg>
                        <span>Google</span>
                    </button>

                    <button 
                        onClick={() => handleSocialLogin('facebook')}
                        disabled={isLoading}
                        className="bg-[#1877F2] hover:bg-[#1864cc] text-white font-semibold py-3 rounded-lg transition-all flex items-center justify-center gap-2"
                    >
                        <Facebook className="w-5 h-5 fill-current" />
                        <span>Facebook</span>
                    </button>

                     <button 
                        onClick={() => handleSocialLogin('twitter')}
                        disabled={isLoading}
                        className="bg-[#1da1f2] hover:bg-[#0c8bd9] text-white font-semibold py-3 rounded-lg transition-all flex items-center justify-center gap-2"
                    >
                        <Twitter className="w-5 h-5 fill-current" />
                        <span>Twitter</span>
                    </button>

                    <button 
                        onClick={() => handleSocialLogin('apple')}
                        disabled={isLoading}
                        className="bg-black hover:bg-slate-900 text-white font-semibold py-3 rounded-lg transition-all flex items-center justify-center gap-2 border border-slate-800"
                    >
                        <svg className="w-5 h-5 fill-current" viewBox="0 0 384 512">
                             <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 52.3-11.4 69.5-34.3z"/>
                        </svg>
                        <span>Apple</span>
                    </button>
                </div>

                <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-slate-700"></div>
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-slate-900 px-2 text-slate-500">Or with email</span>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-500 uppercase">Email Address</label>
                        <input 
                            type="email" 
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="john@example.com"
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:border-blue-500 outline-none transition-colors"
                        />
                    </div>
                     <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-500 uppercase">Full Name</label>
                        <input 
                            type="text" 
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="John Doe"
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:border-blue-500 outline-none transition-colors"
                        />
                    </div>
                    
                    <button 
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg transition-all flex items-center justify-center gap-2 hover:translate-y-[-1px] shadow-lg shadow-blue-500/20"
                    >
                        {isLoading ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <>
                                Sign In <ArrowRight className="w-4 h-4" />
                            </>
                        )}
                    </button>
                </form>

                <div className="mt-8 text-center text-xs text-slate-500">
                    By signing in, you agree to our Terms of Service and Privacy Policy.
                </div>
            </div>
        </div>
    );
};
