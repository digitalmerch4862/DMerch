
import React from 'react';
import { ShoppingCart, Trash2, ShieldCheck, ArrowRight, Loader2 } from 'lucide-react';
import { CartItem } from '../../../types';
import { useSound } from '../../hooks/useSound';

interface CheckoutViewProps {
    cart: CartItem[];
    onRemove: (id: string) => void;
    onFinalize: () => void;
    isProcessing: boolean;
    currency: 'PHP' | 'USD';
    exchangeRate: number;
}

export const CheckoutView: React.FC<CheckoutViewProps> = ({ cart, onRemove, onFinalize, isProcessing, currency, exchangeRate }) => {
    const { play } = useSound();
    const totalAmount = cart.reduce((acc, curr) => acc + (curr.price * curr.quantity), 0);
    const convertedTotal = currency === 'USD' ? totalAmount / exchangeRate : totalAmount;
    const symbol = currency === 'USD' ? '$' : '₱';

    if (cart.length === 0) {
        return (
            <div className="flex-grow flex items-center justify-center p-6 bg-[#050810]">
                <div className="text-center space-y-6 max-w-sm">
                    <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mx-auto text-slate-800">
                        <ShoppingCart size={48} />
                    </div>
                    <h2 className="text-2xl font-bold text-white">Your cart is empty</h2>
                    <p className="text-slate-500 font-medium">Browse our library of premium digital assets to start building your collection.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-grow p-6 md:p-12 overflow-y-auto custom-scrollbar bg-[#050810]">
            <div className="max-w-4xl mx-auto space-y-12">
                <div className="flex items-center gap-4 mb-12">
                    <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-xl shadow-blue-600/30">
                        <ShoppingCart size={24} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-white tracking-tighter">Order Integrity</h2>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Verify your assets before final settlement</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    <div className="lg:col-span-2 space-y-6">
                        {cart.map((item) => (
                            <div key={item.id} className="bg-[#0a0f1d] border border-white/5 rounded-3xl p-6 flex flex-col sm:flex-row items-center gap-6 group">
                                <div className="w-full sm:w-24 h-24 rounded-2xl overflow-hidden flex-shrink-0">
                                    <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                                </div>
                                <div className="flex-grow text-center sm:text-left">
                                    <h3 className="text-md font-bold text-white mb-0.5">{item.name}</h3>
                                    <p className="text-[9px] text-slate-600 font-black uppercase tracking-[0.2em]">{item.category}</p>
                                </div>
                                <div className="text-center sm:text-right space-y-2">
                                    <p className="text-lg font-mono font-bold text-white">
                                        {symbol}{((currency === 'USD' ? item.price / exchangeRate : item.price) * item.quantity).toLocaleString(undefined, { minimumFractionDigits: currency === 'USD' ? 2 : 0, maximumFractionDigits: 2 })}
                                    </p>
                                    <button
                                        onClick={() => { onRemove(item.id); play('click'); }}
                                        className="text-slate-600 hover:text-red-400 p-2 transition-colors"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="space-y-6">
                        <div className="bg-[#0a0f1d] border border-white/10 rounded-[2.5rem] p-10 space-y-8 sticky top-12">
                            <div>
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">Settlement Summary</p>
                                <div className="space-y-4">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-400">Subtotal</span>
                                        <span className="text-white font-mono">{symbol}{convertedTotal.toLocaleString(undefined, { minimumFractionDigits: currency === 'USD' ? 2 : 0, maximumFractionDigits: 2 })}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-400">Processing Fee</span>
                                        <span className="text-green-500 font-bold uppercase text-[10px]">Zero Fee</span>
                                    </div>
                                    <div className="h-px bg-white/5" />
                                    <div className="flex justify-between items-end pt-1">
                                        <span className="text-white font-bold text-sm">Total Amount</span>
                                        <span className="text-xl font-mono font-black text-white">{symbol}{convertedTotal.toLocaleString(undefined, { minimumFractionDigits: currency === 'USD' ? 2 : 0, maximumFractionDigits: 2 })}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center gap-2 text-[10px] font-black text-blue-500 uppercase tracking-widest bg-blue-500/5 p-3 rounded-xl border border-blue-500/10">
                                    <ShieldCheck size={14} />
                                    <span>Secure PayMongo Gateway</span>
                                </div>

                                <button
                                    onClick={onFinalize}
                                    disabled={isProcessing}
                                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black py-5 rounded-2xl shadow-2xl shadow-blue-600/30 active:scale-[0.98] transition-all flex items-center justify-center gap-3 group disabled:opacity-50"
                                >
                                    {isProcessing ? (
                                        <Loader2 size={24} className="animate-spin" />
                                    ) : (
                                        <>
                                            <span>Initialize Payment</span>
                                            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                                        </>
                                    )}
                                </button>

                                <p className="text-[10px] text-slate-600 text-center font-bold px-4">
                                    By completing the settlement, you agree to our digital asset procurement terms and licensing agreement.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
