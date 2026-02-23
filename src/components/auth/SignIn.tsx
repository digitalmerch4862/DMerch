import React, { useState } from 'react';
import { X, Eye, EyeOff, ChevronRight } from 'lucide-react';
import { supabase } from '../../supabaseClient';
import { useSound } from '../../hooks/useSound';

const LOGO_URL = "/android-chrome-192x192.png";

interface SignInProps {
    isOpen: boolean;
    onClose: () => void;
    onToggleMode: () => void;
    onGoogleAuth?: () => void;
    initialEmail?: string;
    showSuccessMessage?: boolean;
}

export const SignIn: React.FC<SignInProps> = ({ isOpen, onClose, onToggleMode, onGoogleAuth, initialEmail = '', showSuccessMessage = false }) => {
    const [email, setEmail] = useState(initialEmail);
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const { play } = useSound();

    React.useEffect(() => {
        if (showSuccessMessage) {
            setSuccessMessage("Your account has been created. Please check your email and verify your address before logging in.");
        }
    }, [showSuccessMessage]);

    if (!isOpen) return null;

    const handleSignIn = async () => {
        setError(null);
        setSuccessMessage(null);
        setLoading(true);
        play('click');

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            setError(error.message);
            play('error');
        } else {
            play('success');
            window.location.href = '/';
        }
        setLoading(false);
    };

    const handleGoogleLogin = async () => {
        play('click');
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: window.location.origin
            }
        });
        if (error) {
            setError(error.message);
            play('error');
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#050810]/95 backdrop-blur-xl p-4 transition-all duration-500">
            <div className="relative z-10 w-full max-w-md p-10 bg-[#0a0f1d] border border-white/10 rounded-[2.5rem] shadow-[0_0_50px_rgba(0,0,0,0.5)] animate-in fade-in slide-in-from-bottom-8 duration-500">
                <button
                    onClick={onClose}
                    className="absolute top-8 right-8 text-slate-500 hover:text-white transition-colors p-2"
                >
                    <X size={24} />
                </button>

                <div className="text-center mb-10">
                    <div className="flex justify-center mb-6">
                        <img src={LOGO_URL} alt="Logo" className="w-20 h-20 object-contain relative z-10 drop-shadow-[0_0_15px_rgba(59,130,246,0.6)]" />
                    </div>
                    <h2 className="text-3xl font-extrabold text-white tracking-tight">Login</h2>
                    <p className="text-slate-400 mt-2 font-medium">Log in to access your digital assets</p>
                </div>

                <div className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase ml-1 tracking-widest">Email Address</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-white transition-all placeholder:text-slate-700"
                            placeholder="name@example.com"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Password</label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-white transition-all pr-14 placeholder:text-slate-700"
                                placeholder="••••••••"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                            >
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                    </div>

                    {error && <p className="text-red-500 text-xs font-medium ml-1 animate-pulse">{error}</p>}
                    {successMessage && <p className="text-green-500 text-xs font-medium ml-1 animate-pulse">{successMessage}</p>}

                    <button
                        onClick={handleSignIn}
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold py-5 rounded-2xl transition-all active:scale-[0.98] shadow-xl shadow-blue-600/20 flex items-center justify-center gap-3 disabled:opacity-50"
                    >
                        <span>{loading ? 'Logging in...' : 'Login'}</span>
                        <ChevronRight size={18} />
                    </button>

                    <div className="relative my-8">
                        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5"></div></div>
                        <div className="relative flex justify-center text-[10px] uppercase tracking-widest font-bold">
                            <span className="bg-[#0a0f1d] px-4 text-slate-500">Or continue with</span>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={handleGoogleLogin}
                        className="w-full bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-3"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        <span className="text-slate-200">Continue with Google</span>
                    </button>

                    <div className="text-center pt-2">
                        <button
                            type="button"
                            onClick={onToggleMode}
                            className="text-sm font-medium text-slate-400 hover:text-blue-400 transition-colors"
                        >
                            Don't have an account? Sign up
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
