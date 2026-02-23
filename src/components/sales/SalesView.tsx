
import React from 'react';
import { DollarSign, TrendingUp, BarChart3, CreditCard, ChevronRight } from 'lucide-react';

interface SalesViewProps {
    salesHistory: any[];
}

export const SalesView: React.FC<SalesViewProps> = ({ salesHistory }) => {
    const totalRevenue = salesHistory.reduce((acc, curr) => acc + (curr.amount || 0), 0);
    const averageOrder = salesHistory.length > 0 ? totalRevenue / salesHistory.length : 0;

    return (
        <div className="flex-grow p-6 md:p-12 overflow-y-auto custom-scrollbar bg-[#050810]">
            <div className="max-w-7xl mx-auto space-y-12">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                    <div>
                        <h2 className="text-4xl font-black text-white tracking-tighter">Sales Intelligence</h2>
                        <p className="text-slate-500 font-medium">Real-time revenue stream and performance metrics</p>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Fiscal Period</p>
                        <p className="text-white font-bold">{new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
                    </div>
                </div>

                {/* Revenue Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="relative group overflow-hidden bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[2.5rem] p-10 text-white shadow-2xl shadow-blue-600/20">
                        <div className="absolute top-0 right-0 p-8 opacity-20 group-hover:scale-110 transition-transform">
                            <DollarSign size={120} />
                        </div>
                        <div className="relative z-10">
                            <p className="text-[10px] font-black text-blue-100 uppercase tracking-[0.2em] mb-4">Total Net Revenue</p>
                            <h3 className="text-5xl font-black mb-8 tracking-tighter">₱{totalRevenue.toLocaleString()}</h3>
                            <div className="flex items-center gap-2 text-blue-100 text-xs font-bold">
                                <TrendingUp size={16} />
                                <span>+12.5% from previous cycle</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-[#0a0f1d] border border-white/5 rounded-[2.5rem] p-10 flex flex-col justify-between">
                        <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 mb-6">
                            <BarChart3 size={28} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2">Total Acquisitions</p>
                            <h3 className="text-3xl font-black text-white">{salesHistory.length}</h3>
                        </div>
                    </div>

                    <div className="bg-[#0a0f1d] border border-white/5 rounded-[2.5rem] p-10 flex flex-col justify-between">
                        <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 mb-6">
                            <TrendingUp size={28} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2">Average Order Value</p>
                            <h3 className="text-3xl font-black text-white">₱{averageOrder.toLocaleString(undefined, { maximumFractionDigits: 0 })}</h3>
                        </div>
                    </div>
                </div>

                {/* Sales Table */}
                <div className="bg-[#0a0f1d] border border-white/5 rounded-[3rem] overflow-hidden">
                    <div className="p-8 border-b border-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-slate-400">
                                <CreditCard size={24} />
                            </div>
                            <h3 className="text-xl font-bold text-white">Real-time Transactions</h3>
                        </div>
                        <button className="text-xs font-black text-slate-500 uppercase tracking-widest hover:text-white transition-colors">Export Ledger</button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-white/[0.02]">
                                <tr>
                                    <th className="px-10 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Transaction Ref</th>
                                    <th className="px-10 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Entity</th>
                                    <th className="px-10 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Product Config</th>
                                    <th className="px-10 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Settlement</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {salesHistory.length > 0 ? salesHistory.map((sale, i) => (
                                    <tr key={sale.id || i} className="group hover:bg-white/[0.02] transition-colors">
                                        <td className="px-10 py-8">
                                            <p className="text-sm font-bold text-white mb-1">TX-{sale.id?.slice(-8).toUpperCase() || 'MANUAL'}</p>
                                            <p className="text-[10px] text-slate-600 font-bold">{new Date(sale.date || Date.now()).toLocaleString()}</p>
                                        </td>
                                        <td className="px-10 py-8 text-sm text-slate-300 font-medium">{sale.customer_username || 'Internal Node'}</td>
                                        <td className="px-10 py-8">
                                            <div className="flex -space-x-2">
                                                {sale.items?.slice(0, 3).map((item: any, idx: number) => (
                                                    <div key={idx} className="w-8 h-8 rounded-lg bg-indigo-600 border-2 border-[#0a0f1d] flex items-center justify-center text-[10px] font-black text-white">
                                                        {item.name?.[0].toUpperCase() || 'P'}
                                                    </div>
                                                ))}
                                                {sale.items?.length > 3 && (
                                                    <div className="w-8 h-8 rounded-lg bg-slate-800 border-2 border-[#0a0f1d] flex items-center justify-center text-[10px] font-black text-slate-400">
                                                        +{sale.items.length - 3}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-10 py-8 text-right">
                                            <span className="text-lg font-mono font-bold text-white">₱{sale.amount?.toLocaleString()}</span>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={4} className="px-10 py-24 text-center">
                                            <p className="text-slate-600 font-bold">No verified settlements detected in this cycle.</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};
