
import React from 'react';
import { Users, Globe, UserCheck, TrendingUp, Loader2, Database, ShieldAlert } from 'lucide-react';
import { Visit, Customer, Order } from '../../../types';

interface CRMViewProps {
    isLoading: boolean;
    stats: { totalVisits: number; uniqueVisitors: number; totalCustomers: number };
    recentVisits: Visit[];
    customers: Customer[];
}

export const CRMView: React.FC<CRMViewProps> = ({ isLoading, stats, recentVisits, customers }) => {
    if (isLoading) {
        return (
            <div className="flex-grow flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
                    <p className="text-slate-500 font-bold animate-pulse">Synchronizing Intelligence...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-grow p-6 md:p-12 overflow-y-auto custom-scrollbar bg-[#050810]">
            <div className="max-w-7xl mx-auto space-y-8">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h2 className="text-4xl font-black text-white tracking-tighter">CRM Dashboard</h2>
                        <p className="text-slate-500 font-medium">Customer behavioral insights and retention metrics</p>
                    </div>
                    <div className="flex gap-2">
                        <div className="px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-400 text-xs font-bold flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                            Live Analytics
                        </div>
                    </div>
                </div>

                {/* CRM Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[
                        { label: 'Total Interaction', val: stats.totalVisits, icon: <Globe />, color: 'blue' },
                        { label: 'Unique Footprint', val: stats.uniqueVisitors, icon: <TrendingUp />, color: 'indigo' },
                        { label: 'Verified Entities', val: stats.totalCustomers, icon: <UserCheck />, color: 'cyan' },
                    ].map((stat, i) => (
                        <div key={i} className="bg-[#0a0f1d] border border-white/5 rounded-[2rem] p-8 space-y-4">
                            <div className={`w-12 h-12 rounded-2xl bg-${stat.color}-500/10 flex items-center justify-center text-${stat.color}-500`}>
                                {stat.icon}
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">{stat.label}</p>
                                <p className="text-4xl font-black text-white">{stat.val.toLocaleString()}</p>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Top Customers */}
                    <div className="bg-[#0a0f1d] border border-white/5 rounded-[2.5rem] overflow-hidden">
                        <div className="p-8 border-b border-white/5 flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                                <TrendingUp size={20} />
                            </div>
                            <h3 className="text-lg font-bold text-white">Top Acquisitions</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-white/[0.02]">
                                    <tr>
                                        <th className="px-8 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Entity</th>
                                        <th className="px-8 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">LTV</th>
                                        <th className="px-8 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Activity</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {customers.slice(0, 10).map((c, i) => (
                                        <tr key={i} className="hover:bg-white/[0.01] transition-colors">
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-[10px] font-bold text-slate-400 uppercase">
                                                        {c.username[0]}
                                                    </div>
                                                    <span className="text-sm font-bold text-white">{c.username}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <span className="text-sm font-mono font-bold text-blue-400">₱{c.total_spent.toLocaleString()}</span>
                                                <p className="text-[10px] text-slate-600 font-bold">{c.order_count} transactions</p>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <span className="text-xs font-bold text-slate-500">{c.visit_count} sessions</span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Recent Activity */}
                    <div className="bg-[#0a0f1d] border border-white/5 rounded-[2.5rem] overflow-hidden">
                        <div className="p-8 border-b border-white/5 flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-400">
                                <Database size={20} />
                            </div>
                            <h3 className="text-lg font-bold text-white">Live Activity Stream</h3>
                        </div>
                        <div className="p-8 space-y-6 max-h-[600px] overflow-y-auto custom-scrollbar">
                            {recentVisits.map((v, i) => (
                                <div key={i} className="flex gap-4 group">
                                    <div className="relative">
                                        <div className="w-px h-full bg-white/5 absolute left-1/2 -translate-x-1/2 group-last:hidden" />
                                        <div className="w-3 h-3 rounded-full bg-blue-600 relative z-10 border-4 border-[#0a0f1d] shadow-[0_0_10px_rgba(37,99,235,0.5)]" />
                                    </div>
                                    <div className="pb-6 w-full">
                                        <div className="flex justify-between items-start mb-1">
                                            <span className="text-xs font-black text-slate-400 uppercase tracking-widest">{v.username || 'Anonymous Node'}</span>
                                            <span className="text-[10px] font-bold text-slate-600">{new Date(v.created_at).toLocaleTimeString()}</span>
                                        </div>
                                        <p className="text-sm text-slate-300 font-medium bg-white/5 p-3 rounded-xl border border-white/5">
                                            Accessed <span className="text-blue-400 font-bold">{v.page}</span>
                                            {v.ip_address && (
                                                <span className="block mt-1 text-[10px] text-slate-500 font-mono">
                                                    Node IP: {v.ip_address}
                                                </span>
                                            )}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
