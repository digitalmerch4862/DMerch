
import React, { useState, useEffect } from 'react';
import { Plus, PackagePlus, Eye, EyeOff, LayoutGrid, Sparkles, Loader2, Database, Trash2, Pencil, Check, X } from 'lucide-react';
import { CategoryType, Product } from '../../../types';
import { useSound } from '../../hooks/useSound';
import { BatchInjection } from './BatchInjection';
import { GoogleGenAI } from "@google/genai";

interface AdminViewProps {
    products: Product[];
    onDeploySingle: (p: any) => Promise<void>;
    onDeployBatch: (products: any[]) => Promise<void>;
    onEdit: (p: Product) => Promise<void>;
    onDelete: (id: string) => Promise<void>;
    isProcessing: boolean;
}

export const AdminView: React.FC<AdminViewProps> = ({
    products,
    onDeploySingle,
    onDeployBatch,
    onEdit,
    onDelete,
    isProcessing
}) => {
    const [mode, setMode] = useState<'single' | 'batch'>('single');
    const [isGenerating, setIsGenerating] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<Partial<Product>>({});
    const [singleProduct, setSingleProduct] = useState({
        name: '', price: '', category: CategoryType.NATIVE, description: '', fileUrl: ''
    });
    const { play } = useSound();

    // AI Generation Logic
    useEffect(() => {
        const generateDescription = async () => {
            if (mode === 'single' && singleProduct.name.length > 5 && !singleProduct.description) {
                setIsGenerating(true);
                try {
                    const apiKey = (import.meta as any).env.VITE_GEMINI_API_KEY;
                    if (!apiKey || apiKey === 'PLACEHOLDER_API_KEY') {
                        setIsGenerating(false);
                        return;
                    }
                    const ai = new GoogleGenAI(apiKey);
                    const model = (ai as any).getGenerativeModel({ model: "gemini-1.5-flash" });
                    const result = await model.generateContent(`Write a short, professional marketplace description (max 15 words) for "${singleProduct.name}" in "${singleProduct.category}".`);
                    const response = await result.response;
                    const text = response.text();
                    if (text) setSingleProduct(prev => ({ ...prev, description: text.trim() }));
                } catch (error) { console.error(error); } finally { setIsGenerating(false); }
            }
        };
        const timeoutId = setTimeout(generateDescription, 1500);
        return () => clearTimeout(timeoutId);
    }, [singleProduct.name, singleProduct.category, mode]);

    const handleSingleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!singleProduct.name || !singleProduct.price) return;
        await onDeploySingle(singleProduct);
        setSingleProduct({ name: '', price: '', category: CategoryType.NATIVE, description: '', fileUrl: '' });
    };

    const startEdit = (p: Product) => {
        setEditingId(p.id);
        setEditForm(p);
        play('click');
    };

    const saveEdit = async () => {
        if (!editForm.id) return;
        await onEdit(editForm as Product);
        setEditingId(null);
        play('success');
    };

    return (
        <div className="flex-grow p-6 md:p-12 overflow-y-auto custom-scrollbar bg-[#050810]">
            <div className="max-w-6xl mx-auto space-y-12">
                <div className="flex flex-col md:flex-row justify-between items-center gap-8">
                    <div>
                        <h2 className="text-4xl font-black text-white tracking-tighter">Command Center</h2>
                        <p className="text-slate-500 font-medium">Injection and maintenance of digital inventory</p>
                    </div>

                    <div className="flex p-1.5 bg-white/5 rounded-2xl border border-white/10">
                        <button
                            onClick={() => { setMode('single'); play('click'); }}
                            className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${mode === 'single' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-500 hover:text-white'}`}
                        >
                            Single
                        </button>
                        <button
                            onClick={() => { setMode('batch'); play('click'); }}
                            className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${mode === 'batch' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-500 hover:text-white'}`}
                        >
                            Group
                        </button>
                    </div>
                </div>

                {mode === 'single' ? (
                    <div className="bg-[#0a0f1d] border border-white/5 rounded-[3rem] p-10 fade-slide-up">
                        <form onSubmit={handleSingleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Asset Identity</label>
                                    <input
                                        type="text"
                                        value={singleProduct.name}
                                        onChange={(e) => setSingleProduct(prev => ({ ...prev, name: e.target.value }))}
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:ring-2 focus:ring-blue-500/50 outline-none transition-all placeholder:text-slate-700 font-bold"
                                        placeholder="e.g. Quantum Engine V2"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Market Value (PHP)</label>
                                        <input
                                            type="number"
                                            value={singleProduct.price}
                                            onChange={(e) => setSingleProduct(prev => ({ ...prev, price: e.target.value }))}
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:ring-2 focus:ring-blue-500/50 outline-none transition-all placeholder:text-slate-700 font-mono"
                                            placeholder="0.00"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Category Class</label>
                                        <select
                                            value={singleProduct.category}
                                            onChange={(e) => setSingleProduct(prev => ({ ...prev, category: e.target.value as CategoryType }))}
                                            className="dm-select w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:ring-2 focus:ring-blue-500/50 outline-none transition-all cursor-pointer appearance-none"
                                        >
                                            {Object.values(CategoryType).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Access URL (Drive/S3)</label>
                                    <input
                                        type="text"
                                        value={singleProduct.fileUrl}
                                        onChange={(e) => setSingleProduct(prev => ({ ...prev, fileUrl: e.target.value }))}
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:ring-2 focus:ring-blue-500/50 outline-none transition-all placeholder:text-slate-700 font-mono text-xs"
                                        placeholder="https://drive.google.com/..."
                                    />
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="space-y-2 h-full flex flex-col">
                                    <div className="flex justify-between items-center ml-1">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Asset Documentation</label>
                                        {isGenerating && <div className="flex items-center gap-2 text-blue-500 text-[9px] font-bold animate-pulse"><Sparkles size={10} /> AI THINKING</div>}
                                    </div>
                                    <textarea
                                        value={singleProduct.description}
                                        onChange={(e) => setSingleProduct(prev => ({ ...prev, description: e.target.value }))}
                                        className="w-full flex-grow bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:ring-2 focus:ring-blue-500/50 outline-none transition-all placeholder:text-slate-700 text-sm italic"
                                        placeholder="Enter manual description or wait for AI generation..."
                                    />
                                    <button
                                        type="submit"
                                        disabled={isProcessing}
                                        className="mt-6 w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-5 rounded-2xl shadow-xl shadow-blue-600/20 active:scale-95 transition-all flex items-center justify-center gap-3"
                                    >
                                        {isProcessing ? <Loader2 className="animate-spin" /> : <PackagePlus size={20} />}
                                        <span>Deploy Single Asset</span>
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                ) : (
                    <div className="fade-slide-up">
                        <BatchInjection onDeploy={onDeployBatch} isProcessing={isProcessing} />
                    </div>
                )}

                {/* Existing Inventory */}
                <div className="bg-[#0a0f1d] border border-white/5 rounded-[3rem] overflow-hidden">
                    <div className="p-8 border-b border-white/5 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                            <Database size={24} />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-white">Live Inventory Ledger</h3>
                            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">{products.length} Active Records</p>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-white/[0.02]">
                                <tr>
                                    <th className="px-10 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Resource</th>
                                    <th className="px-10 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Configuration</th>
                                    <th className="px-10 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Valuation</th>
                                    <th className="px-10 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Operations</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {products.map((p) => (
                                    <tr key={p.id} className="group hover:bg-white/[0.02] transition-colors">
                                        <td className="px-10 py-6">
                                            <div className="flex items-center gap-4">
                                                <img src={p.imageUrl} alt="" className="w-12 h-12 rounded-xl object-cover" />
                                                <div>
                                                    {editingId === p.id ? (
                                                        <div className="space-y-2">
                                                            <input
                                                                type="text"
                                                                value={editForm.name}
                                                                onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                                                                className="w-full bg-white/10 border border-white/10 rounded-lg px-3 py-1 text-white text-sm font-bold"
                                                                placeholder="Name"
                                                            />
                                                            <input
                                                                type="text"
                                                                value={editForm.imageUrl}
                                                                onChange={(e) => setEditForm(prev => ({ ...prev, imageUrl: e.target.value }))}
                                                                className="w-full bg-white/10 border border-white/10 rounded-lg px-3 py-1 text-white text-[10px] font-mono"
                                                                placeholder="Image URL"
                                                            />
                                                        </div>
                                                    ) : (
                                                        <p className="text-sm font-bold text-white">{p.name}</p>
                                                    )}
                                                    <p className="text-[10px] text-slate-500 font-mono mt-0.5">ID: {p.id.slice(0, 8)}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-10 py-6">
                                            <span className="text-[10px] font-black text-blue-400 bg-blue-400/10 px-3 py-1.5 rounded-full uppercase tracking-widest">{p.category}</span>
                                        </td>
                                        <td className="px-10 py-6">
                                            {editingId === p.id ? (
                                                <input
                                                    type="number"
                                                    value={editForm.price}
                                                    onChange={(e) => setEditForm(prev => ({ ...prev, price: Number(e.target.value) }))}
                                                    className="w-24 bg-white/10 border border-white/10 rounded-lg px-3 py-1 text-white text-sm font-mono"
                                                />
                                            ) : (
                                                <span className="text-sm font-mono font-bold text-white">₱{p.price.toLocaleString()}</span>
                                            )}
                                        </td>
                                        <td className="px-10 py-6 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                {editingId === p.id ? (
                                                    <>
                                                        <button onClick={saveEdit} className="p-2 text-green-400 hover:bg-green-400/10 rounded-lg transition-all"><Check size={18} /></button>
                                                        <button onClick={() => setEditingId(null)} className="p-2 text-slate-400 hover:bg-white/10 rounded-lg transition-all"><X size={18} /></button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <button onClick={() => startEdit(p)} className="p-2 text-slate-500 hover:text-white hover:bg-white/5 rounded-lg transition-all opacity-0 group-hover:opacity-100"><Pencil size={18} /></button>
                                                        <button onClick={() => { if (confirm('Purge this resource?')) onDelete(p.id) }} className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-400/5 rounded-lg transition-all opacity-0 group-hover:opacity-100"><Trash2 size={18} /></button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};
