
import React, { useState, useEffect } from 'react';
import { Package, Download, Search, ArrowLeft, Loader2, Clock } from 'lucide-react';
import { useSound } from '../../hooks/useSound';

interface UserOrdersViewProps {
    orders: any[];
    onBackToStore: () => void;
}

export const UserOrdersView: React.FC<UserOrdersViewProps> = ({ orders, onBackToStore }) => {
    const { play } = useSound();
    const handleDownload = async (url: string, fileName: string) => {
        if (!url || url === '#') return;
        play('click');
        try {
            const response = await fetch(url);
            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = fileName || 'download';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);
        } catch (error) {
            console.error("Download failed, falling back to direct link", error);
            window.open(url, '_blank');
        }
    };

    return (
        <div className="flex-grow p-6 md:p-12 overflow-y-auto custom-scrollbar bg-[#050810]">
            <div className="max-w-5xl mx-auto space-y-12">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                    <div>
                        <h2 className="text-4xl font-black text-white tracking-tighter">My Secure Library</h2>
                        <p className="text-slate-500 font-medium">Your permanent collection of digital assets</p>
                    </div>
                    <button
                        onClick={onBackToStore}
                        className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors font-bold text-sm"
                    >
                        <ArrowLeft size={18} />
                        <span>Return to Store</span>
                    </button>
                </div>

                {!Array.isArray(orders) || orders.length === 0 ? (
                    <div className="py-24 text-center space-y-6 bg-white/5 rounded-[3rem] border border-dashed border-white/10">
                        <div className="flex justify-center">
                            <div className="p-8 bg-white/5 rounded-full text-slate-700">
                                <Package size={48} />
                            </div>
                        </div>
                        <div className="max-w-xs mx-auto">
                            <p className="text-white font-bold text-lg">No assets acquired yet</p>
                            <p className="text-slate-500 text-sm mt-2">When you purchase digital products, they will appear here for instant download.</p>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-6">
                        {orders.map((order, i) => (
                            <div key={i} className="bg-[#0a0f1d] border border-white/5 rounded-[2.5rem] p-8 space-y-6 group hover:border-blue-500/20 transition-all shadow-2xl">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-white/5">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400">
                                            <Clock size={24} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Transaction Date</p>
                                            <p className="text-sm font-bold text-white">{new Date(order?.created_at || Date.now()).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Order ID</p>
                                        <p className="text-xs font-mono text-slate-400">#{Math.random().toString(36).substring(7).toUpperCase()}</p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    {Array.isArray(order?.items) && order.items.map((item: any, idx: number) => (
                                        <div key={idx} className="flex items-center justify-between group/item p-4 hover:bg-white/5 rounded-3xl transition-all border border-transparent hover:border-white/5">
                                            <div className="flex items-center gap-6">
                                                <div className="w-16 h-16 rounded-2xl overflow-hidden border border-white/5 bg-white/5 shadow-inner">
                                                    <img src={item?.imageUrl || ''} alt={item?.name || 'Product'} className="w-full h-full object-cover" />
                                                </div>
                                                <div>
                                                    <h4 className="text-white font-bold">{item?.name || 'Unknown Item'}</h4>
                                                    <p className="text-[10px] text-blue-500 font-black uppercase tracking-widest">{item?.category || 'Asset'}</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleDownload(
                                                    `${item?.fileUrl || "#"}?token=${Math.random().toString(36).substring(7)}&expires=${Date.now() + 86400000}`,
                                                    `${item?.name || 'asset'}.zip`
                                                )}
                                                className="bg-white/5 hover:bg-blue-600 p-4 rounded-2xl text-white transition-all active:scale-95 border border-white/10 hover:shadow-lg hover:shadow-blue-600/20"
                                                title="Secure Direct Download"
                                            >
                                                <Download size={20} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
