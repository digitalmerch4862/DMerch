
import React, { useState } from 'react';
import { Upload, X, Check, Loader2, Sparkles, FileText, ListFilter } from 'lucide-react';
import { CategoryType, Product } from '../../../types';
import { useSound } from '../../hooks/useSound';

interface BatchInjectionProps {
    onDeploy: (products: any[]) => Promise<void>;
    isProcessing: boolean;
}

export const BatchInjection: React.FC<BatchInjectionProps> = ({ onDeploy, isProcessing }) => {
    const [text, setText] = useState('');
    const [previewItems, setPreviewItems] = useState<any[]>([]);
    const { play } = useSound();

    const normalizeCategory = (value: string): CategoryType => {
        const normalized = value.trim().toLowerCase();
        if (normalized.includes('subscription')) return CategoryType.SUBSCRIPTION;
        if (normalized.includes('course')) return CategoryType.COURSE;
        return CategoryType.NATIVE;
    };

    const parsePrice = (value: string): number => {
        const cleaned = value.replace(/[^\d.,-]/g, '').replace(/,/g, '');
        const amount = parseFloat(cleaned);
        return Number.isFinite(amount) ? amount : 0;
    };

    const isHeaderRow = (parts: string[]) => {
        const joined = parts.join(' ').toLowerCase();
        return (
            joined.includes('product name') ||
            joined.includes('product link') ||
            joined.includes('software type') ||
            joined.includes('amount')
        );
    };

    const parseLines = () => {
        if (!text.trim()) return;
        const lines = text.split('\n').filter(l => l.trim() !== '');
        const items = [];

        for (const line of lines) {
            let name = 'New Item';
            let fileUrl = '';
            let category: CategoryType = CategoryType.NATIVE;
            let price = 0;

            // Robust Parsing Logic
            const parts = line.split('\t').map(part => part.trim());

            if (parts.length >= 2 && isHeaderRow(parts)) {
                continue;
            }

            if (parts.length >= 3) {
                name = parts[0] || 'New Item';
                fileUrl = parts[1] || '';

                const thirdColumn = parts[2] || '';
                const potentialPrice = parsePrice(thirdColumn);

                if (potentialPrice > 0 && parts.length === 3) {
                    price = potentialPrice;
                } else {
                    category = normalizeCategory(thirdColumn || CategoryType.NATIVE);
                    price = parsePrice(parts[3] || '0');
                }
            } else {
                const urlMatch = line.match(/(https?:\/\/[^\s,]+)/);
                if (urlMatch) {
                    name = line.substring(0, urlMatch.index).trim();
                    const remainder = line.substring(urlMatch.index + urlMatch[0].length).trim();
                    fileUrl = urlMatch[0];
                    const priceMatch = remainder.match(/(\d+(\.\d+)?)$/);
                    if (priceMatch) {
                        price = parsePrice(priceMatch[0]);
                        const possibleCategory = remainder.substring(0, remainder.lastIndexOf(priceMatch[0])).trim();
                        if (possibleCategory) category = normalizeCategory(possibleCategory);
                    } else {
                        const firstNum = remainder.match(/(\d+(\.\d+)?)/);
                        price = firstNum ? parsePrice(firstNum[0]) : 0;
                    }
                } else {
                    const commaParts = line.split(',');
                    name = commaParts[0]?.trim();
                    price = parsePrice(commaParts[1] || '0');
                }
            }

            if (!name || !fileUrl) {
                continue;
            }

            const imageUrl = `https://pollinations.ai/p/${encodeURIComponent(name + " professional tech product product UI")}`;

            items.push({
                name,
                price,
                category_name: category,
                description: 'New digital item added via batch upload.',
                image_url: imageUrl,
                file_url: fileUrl,
                id: Math.random().toString(36).substr(2, 9) // temporary ID for preview
            });
        }
        setPreviewItems(items);
        play('success');
    };

    const handleDeploy = async () => {
        if (previewItems.length === 0) return;
        await onDeploy(previewItems);
        setPreviewItems([]);
        setText('');
        play('success');
    };

    const removeItem = (id: string) => {
        setPreviewItems(prev => prev.filter(item => item.id !== id));
        play('click');
    };

    return (
        <div className="space-y-6">
            <div className="relative group">
                <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Paste group rows from sheet (Product Name [TAB] Product Link [TAB] Software Type [TAB] Amount)..."
                    className="w-full h-48 bg-white/5 border border-white/10 rounded-3xl p-6 text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all custom-scrollbar placeholder:text-slate-700"
                />
                {text && previewItems.length === 0 && (
                    <button
                        onClick={parseLines}
                        className="absolute bottom-6 right-6 bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-2xl font-bold flex items-center gap-2 shadow-xl shadow-blue-600/20 active:scale-95 transition-all"
                    >
                        <Sparkles size={16} />
                        <span>Generate Preview</span>
                    </button>
                )}
            </div>

            {previewItems.length > 0 && (
                <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden fade-slide-up">
                    <div className="p-6 border-b border-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
                                <ListFilter size={20} />
                            </div>
                            <div>
                                <h4 className="text-white font-bold">Deployment Preview</h4>
                                <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">{previewItems.length} Items Ready</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setPreviewItems([])}
                                className="px-6 py-2.5 rounded-2xl text-slate-400 hover:text-white hover:bg-white/5 transition-all font-bold text-sm"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeploy}
                                disabled={isProcessing}
                                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-8 py-2.5 rounded-2xl font-bold flex items-center gap-2 shadow-xl shadow-blue-600/20 active:scale-95 transition-all disabled:opacity-50"
                            >
                                {isProcessing ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
                                <span>Deploy to Supabase</span>
                            </button>
                        </div>
                    </div>
                    <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                        <table className="w-full text-left border-collapse">
                            <thead className="sticky top-0 bg-[#0a0f1d] z-10">
                                <tr>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-white/5">Product Name</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-white/5">Category</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-white/5">Price</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-white/5"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {previewItems.map((item) => (
                                    <tr key={item.id} className="group hover:bg-white/[0.02] transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <img src={item.image_url} alt="" className="w-10 h-10 rounded-lg object-cover" />
                                                <div>
                                                    <p className="text-sm font-bold text-white leading-none mb-1">{item.name}</p>
                                                    <p className="text-[10px] text-slate-500 truncate max-w-[200px]">{item.file_url}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-[10px] font-black text-blue-400 bg-blue-400/10 px-2 py-1 rounded-full">{item.category_name}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="font-mono text-sm text-white font-bold">₱{item.price.toLocaleString()}</span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => removeItem(item.id)}
                                                className="text-slate-600 hover:text-red-400 p-2 transition-colors"
                                            >
                                                <X size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};
