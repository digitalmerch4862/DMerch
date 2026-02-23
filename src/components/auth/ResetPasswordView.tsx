import React, { useState } from 'react';
import { Lock, Check } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface ResetPasswordViewProps {
    onSuccess: () => void;
}

export const ResetPasswordView: React.FC<ResetPasswordViewProps> = ({ onSuccess }) => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        setIsLoading(true);
        try {
            const { error } = await supabase.auth.updateUser({ password });
            if (error) throw error;
            setSuccess(true);
            setTimeout(onSuccess, 2000);
        } catch (err: any) {
            setError(err.message || 'Failed to update password');
        } finally {
            setIsLoading(false);
        }
    };

    if (success) {
        return (
            <div className="flex-1 flex items-center justify-center p-8">
                <div className="bg-[#0a0f1a] border border-green-500/30 rounded-2xl p-8 max-w-md w-full text-center">
                    <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Check className="text-green-400" size={32} />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">Password Updated!</h2>
                    <p className="text-gray-400">Redirecting you to login...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 flex items-center justify-center p-8">
            <div className="bg-[#0a0f1a] border border-white/10 rounded-2xl p-8 max-w-md w-full">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Lock className="text-blue-400" size={32} />
                    </div>
                    <h2 className="text-2xl font-bold text-white">Reset Password</h2>
                    <p className="text-gray-400 mt-2">Enter your new password below</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm text-gray-400 mb-2">New Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm text-gray-400 mb-2">Confirm Password</label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                            required
                        />
                    </div>

                    {error && (
                        <div className="text-red-400 text-sm text-center bg-red-500/10 p-3 rounded-xl">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 text-white font-semibold py-3 rounded-xl transition-colors"
                    >
                        {isLoading ? 'Updating...' : 'Update Password'}
                    </button>
                </form>
            </div>
        </div>
    );
};
