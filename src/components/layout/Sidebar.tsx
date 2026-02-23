
import React from 'react';
import { TrendingUp, LayoutGrid, Store, BarChart3, Users, Settings, LogOut, PackagePlus, ShoppingCart, MessageSquare, ExternalLink } from 'lucide-react';
import { CategoryType, User } from '../../../types';
import { useSound } from '../../hooks/useSound';

const LOGO_URL = "/android-chrome-192x192.png";

interface SidebarProps {
    view: string;
    setView: (view: any) => void;
    activeCategory: string;
    setActiveCategory: (cat: any) => void;
    user: User;
    onLogout: () => void;
    onLogin: () => void;
    onOpenContact?: () => void;
    currency: 'PHP' | 'USD';
    setCurrency: (curr: 'PHP' | 'USD') => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
    view,
    setView,
    activeCategory,
    setActiveCategory,
    user,
    onLogout,
    onLogin,
    onOpenContact,
    currency,
    setCurrency
}) => {
    const { play } = useSound();


    return (
        <nav className="w-full md:w-80 bg-[#0a0f1d] border-r border-white/5 flex flex-col p-8 z-50 h-full">
            <div className="flex items-center gap-4 mb-12 px-2">
                <div className="relative group cursor-pointer" onClick={() => setView('store')}>
                    <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full scale-75 group-hover:scale-110 transition-transform"></div>
                    <img
                        src={LOGO_URL}
                        alt="Store Logo"
                        className="w-14 h-14 object-contain relative z-10 animate-pulse-slow"
                    />
                </div>
                <div>
                    <h1 className="text-2xl font-black text-white tracking-tighter">DMerch</h1>
                    <p className="text-[10px] text-blue-500 font-black uppercase tracking-[0.3em]">Digital Store</p>
                </div>
            </div>

            <div className="space-y-8 flex-grow overflow-y-auto pr-2 custom-scrollbar">
                <div>
                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-[0.25em] ml-2 mb-4 block">Discover</span>
                    <div className="space-y-1">
                        <button
                            onClick={() => { setView('store'); setActiveCategory('Best Seller'); play('click'); }}
                            className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all ${activeCategory === 'Best Seller' && view === 'store' ? 'bg-blue-600 text-white shadow-2xl shadow-blue-600/30' : 'text-slate-500 hover:bg-white/5 hover:text-slate-200'}`}
                        >
                            <TrendingUp size={20} />
                            <span className="font-bold text-sm">Best Seller</span>
                        </button>
                        <button
                            onClick={() => { setView('store'); setActiveCategory('All'); play('click'); }}
                            className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all ${activeCategory === 'All' && view === 'store' ? 'bg-blue-600 text-white shadow-2xl shadow-blue-600/30' : 'text-slate-500 hover:bg-white/5 hover:text-slate-200'}`}
                        >
                            <LayoutGrid size={20} />
                            <span className="font-bold text-sm">All Products</span>
                        </button>
                        {user.isLoggedIn && (
                            <button
                                onClick={() => { setView('orders'); play('click'); }}
                                className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all ${view === 'orders' ? 'bg-blue-600 text-white shadow-2xl shadow-blue-600/30' : 'text-slate-500 hover:bg-white/5 hover:text-slate-200'}`}
                            >
                                <ShoppingCart size={20} />
                                <span className="font-bold text-sm">My Purchases</span>
                            </button>
                        )}
                        {user.isLoggedIn && (
                            <button
                                onClick={() => { setView('settings'); play('click'); }}
                                className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all ${view === 'settings' ? 'bg-blue-600 text-white shadow-2xl shadow-blue-600/30' : 'text-slate-500 hover:bg-white/5 hover:text-slate-200'}`}
                            >
                                <Settings size={20} />
                                <span className="font-bold text-sm">Profile Settings</span>
                            </button>
                        )}
                    </div>
                </div>

                <div>
                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-[0.25em] ml-2 mb-4 block">Software Types</span>
                    <div className="space-y-1">
                        {Object.values(CategoryType).map(cat => (
                            <button
                                key={cat}
                                onClick={() => { setView('store'); setActiveCategory(cat); play('click'); }}
                                className={`w-full flex items-center gap-4 px-5 py-3.5 rounded-2xl transition-all ${activeCategory === cat && view === 'store' ? 'bg-white/10 text-white border border-white/10' : 'text-slate-500 hover:bg-white/5 hover:text-slate-300'}`}
                            >
                                <div className={`w-1.5 h-1.5 rounded-full ${activeCategory === cat && view === 'store' ? 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]' : 'bg-slate-700'}`}></div>
                                <span className="font-bold text-xs">{cat}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {user.isAdmin && (
                    <div>
                        <span className="text-[10px] font-black text-slate-600 uppercase tracking-[0.25em] ml-2 mb-4 block">Management</span>
                        <div className="space-y-1">
                            <button
                                onClick={() => { setView('admin'); play('click'); }}
                                className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all ${view === 'admin' ? 'bg-indigo-600 text-white shadow-2xl shadow-indigo-600/30' : 'text-slate-500 hover:bg-white/5 hover:text-slate-200'}`}
                            >
                                <PackagePlus size={20} />
                                <span className="font-bold text-sm">Deployment</span>
                            </button>
                            <button
                                onClick={() => { setView('sales'); play('click'); }}
                                className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all ${view === 'sales' ? 'bg-indigo-600 text-white shadow-2xl shadow-indigo-600/30' : 'text-slate-500 hover:bg-white/5 hover:text-slate-200'}`}
                            >
                                <BarChart3 size={20} />
                                <span className="font-bold text-sm">Sales Analytics</span>
                            </button>
                            <button
                                onClick={() => { setView('crm'); play('click'); }}
                                className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all ${view === 'crm' ? 'bg-indigo-600 text-white shadow-2xl shadow-indigo-600/30' : 'text-slate-500 hover:bg-white/5 hover:text-slate-200'}`}
                            >
                                <Users size={20} />
                                <span className="font-bold text-sm">CRM</span>
                            </button>
                            <a
                                href="https://dashboard.paymongo.com/"
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={() => play('click')}
                                className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all text-slate-500 hover:bg-white/5 hover:text-slate-200"
                            >
                                <ExternalLink size={20} />
                                <span className="font-bold text-sm">PayMongo Portal</span>
                            </a>
                        </div>
                    </div>
                )}

                <div>
                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-[0.25em] ml-2 mb-4 block">Support</span>
                    <div className="space-y-1">
                        <button
                            onClick={() => { onOpenContact?.(); play('click'); }}
                            className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all text-slate-500 hover:bg-white/5 hover:text-slate-200"
                        >
                            <MessageSquare size={20} />
                            <span className="font-bold text-sm">Contact Admin</span>
                        </button>
                    </div>
                </div>

            </div>

            <div className="mt-auto pt-8">
                {user.isLoggedIn ? (
                    <div className="space-y-4">
                        <div className="flex items-center gap-4 px-4 py-3 bg-white/5 rounded-2xl border border-white/5">
                            {user.avatarUrl ? (
                                <img src={user.avatarUrl} alt="Profile" className="w-10 h-10 rounded-xl object-cover border border-white/10" />
                            ) : (
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center font-black text-white shadow-lg shadow-blue-500/20">
                                    {(user.fullName || user.username)[0]?.toUpperCase()}
                                </div>
                            )}
                            <div className="flex-grow min-w-0">
                                <p className="text-sm font-bold text-white truncate">{user.fullName || user.username}</p>
                                <p className="text-[10px] text-slate-500 font-medium truncate">@{user.username}</p>
                                {user.isAdmin && <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Administrator</p>}
                            </div>
                        </div>
                        <button
                            onClick={() => { play('click'); onLogout(); }}
                            className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-2xl text-slate-500 hover:bg-red-500/10 hover:text-red-400 border border-transparent hover:border-red-500/20 transition-all font-bold text-sm"
                        >
                            <LogOut size={18} />
                            <span>Sign Out</span>
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={() => { play('click'); onLogin(); }}
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-2xl transition-all shadow-xl shadow-blue-600/20 flex items-center justify-center gap-3"
                    >
                        <Store size={18} />
                        <span>Sign In / Sign Up</span>
                    </button>
                )}
            </div>
        </nav>
    );
};
