import React, { useState } from 'react';
import { X, Send } from 'lucide-react';
import { LeadReason, User } from '../../../types';

interface ContactAdminModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: { reason: LeadReason; message: string; email?: string }) => Promise<void>;
    user: User;
}

export const ContactAdminModal: React.FC<ContactAdminModalProps> = ({ isOpen, onClose, onSubmit, user }) => {
    const [reason, setReason] = useState<LeadReason>('general');
    const [message, setMessage] = useState('');
    const [email, setEmail] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await onSubmit({ reason, message, email: email || undefined });
            onClose();
            setMessage('');
            setReason('general');
        } catch (error) {
            console.error('Failed to submit:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm">
            <div className="bg-[#0a0f1a] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-white">Contact Admin</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm text-gray-400 mb-2">Reason</label>
                        <select
                            value={reason}
                            onChange={(e) => setReason(e.target.value as LeadReason)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                        >
                            <option value="general">General Inquiry</option>
                            <option value="support">Technical Support</option>
                            <option value="billing">Billing Question</option>
                            <option value="partnership">Partnership Opportunity</option>
                            <option value="feedback">Feedback</option>
                        </select>
                    </div>

                    {!user.isLoggedIn && (
                        <div>
                            <label className="block text-sm text-gray-400 mb-2">Your Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="your@email.com"
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                                required
                            />
                        </div>
                    )}

                    <div>
                        <label className="block text-sm text-gray-400 mb-2">Message</label>
                        <textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="How can we help you?"
                            rows={4}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-none"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting || !message.trim()}
                        className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
                    >
                        {isSubmitting ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <>
                                <Send size={18} />
                                Send Message
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};
