import React, { useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';

interface PayMongoCheckoutModalProps {
    isOpen: boolean;
    checkoutUrl: string;
    onClose: () => void;
    onSuccess: () => void;
}

export const PayMongoCheckoutModal: React.FC<PayMongoCheckoutModalProps> = ({
    isOpen,
    checkoutUrl,
    onClose,
    onSuccess
}) => {
    useEffect(() => {
        if (!isOpen) return;

        const handleMessage = (event: MessageEvent) => {
            // Listen for success messages from PayMongo
            if (event.data && event.data.type === 'payment.success') {
                onSuccess();
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [isOpen, onSuccess]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-xl p-4">
            <div className="relative w-full max-w-4xl h-[95vh] bg-[#0a0f1d] border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-white/10 bg-[#050810] flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-white">
                                <rect x="1" y="5" width="22" height="14" rx="2" />
                                <path d="M1 10h22" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-white leading-tight">Secure Payment</h3>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">PayMongo Gateway</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-slate-500 hover:text-white transition-colors rounded-xl hover:bg-white/5"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Iframe Container */}
                <div className="relative flex-grow w-full overflow-hidden bg-white">
                    {!checkoutUrl ? (
                        <div className="flex items-center justify-center h-full bg-[#0a0f1d]">
                            <div className="text-center space-y-4">
                                <Loader2 className="w-10 h-10 text-blue-500 animate-spin mx-auto" />
                                <p className="text-slate-400 font-medium text-sm">Initializing secure checkout...</p>
                            </div>
                        </div>
                    ) : (
                        <iframe
                            src={checkoutUrl}
                            className="w-full h-full border-0"
                            title="PayMongo Checkout"
                            allow="payment"
                        />
                    )}

                    {/* Floating Security Badge - Moved to top right or made subtle */}
                    <div className="absolute top-4 right-4 bg-white/90 backdrop-blur shadow-sm border border-green-500/20 rounded-lg px-3 py-1.5 flex items-center gap-2 pointer-events-none">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="text-green-600">
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                        </svg>
                        <span className="text-[9px] font-black text-green-700 uppercase tracking-widest">SSL Secure</span>
                    </div>
                </div>
            </div>
        </div>
    );
};
