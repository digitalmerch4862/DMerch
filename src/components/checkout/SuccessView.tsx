
import React from 'react';
import { CheckCircle, Download, ExternalLink, ArrowLeft } from 'lucide-react';
import { useSound } from '../../hooks/useSound';

interface SuccessViewProps {
    orderItems: any[];
    onBackToStore: () => void;
    onGoToDashboard: () => void;
}

export const SuccessView: React.FC<SuccessViewProps> = ({ orderItems, onBackToStore, onGoToDashboard }) => {
    const { play } = useSound();

    return (
        <div className="flex-grow p-6 md:p-12 overflow-y-auto custom-scrollbar bg-[#050810]">
            <div className="max-w-2xl mx-auto space-y-12 py-12">
                {/* Success Header */}
                <div className="text-center space-y-6">
                    <div className="flex justify-center">
                        <div className="w-24 h-24 bg-green-500/10 rounded-[2.5rem] flex items-center justify-center text-green-500 border border-green-500/20 shadow-2xl shadow-green-500/20 animate-bounce">
                            <CheckCircle size={48} />
                        </div>
                    </div>
                    <div>
                        <h2 className="text-4xl font-black text-white tracking-tighter">Order Successfully Executed</h2>
                        <p className="text-slate-500 font-medium mt-2">Digital assets have been allocated to your profile</p>
                    </div>
                </div>

                {/* Automation Notice */}
                <div className="bg-blue-600/10 border border-blue-500/20 rounded-[2rem] p-8 flex items-center gap-6">
                    <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white flex-shrink-0">
                        <ExternalLink size={20} />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-white uppercase tracking-widest text-[10px] mb-1">Instant Protocol</p>
                        <p className="text-sm text-slate-300 font-medium">Download links are now active. A duplicate record has been sent to your registered email.</p>
                    </div>
                </div>

                {/* Deliverables List */}
                <div className="space-y-4">
                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-[0.25em] ml-4 block uppercase font-black">Your Deliverables</span>
                    <div className="space-y-4">
                        {orderItems.map((item, i) => (
                            <div key={i} className="bg-[#0a0f1d] border border-white/5 rounded-3xl p-6 flex items-center justify-between group hover:border-blue-500/30 transition-all">
                                <div className="flex items-center gap-6">
                                    <div className="w-16 h-16 rounded-2xl overflow-hidden bg-white/5 border border-white/5">
                                        <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-white">{item.name}</h3>
                                        <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">{item.category}</p>
                                    </div>
                                </div>
                                <a
                                    href={item.fileUrl || "#"}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={() => play('click')}
                                    className="flex items-center gap-2 bg-white/5 hover:bg-blue-600 px-6 py-3 rounded-xl text-xs font-black text-white transition-all border border-white/10"
                                >
                                    <Download size={16} />
                                    <span>Download Asset</span>
                                </a>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer Action */}
                <div className="pt-6 space-y-4">
                    <button
                        onClick={onGoToDashboard}
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-2xl shadow-xl shadow-blue-600/20 active:scale-95 transition-all flex items-center justify-center gap-3"
                    >
                        <ExternalLink size={20} />
                        <span>Access My Secure Library</span>
                    </button>
                    <button
                        onClick={onBackToStore}
                        className="w-full flex items-center justify-center gap-3 text-slate-500 hover:text-white font-bold text-sm transition-colors py-2"
                    >
                        <ArrowLeft size={18} />
                        <span>Return to Central Command</span>
                    </button>
                </div>
            </div>
        </div>
    );
};
