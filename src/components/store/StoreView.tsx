
import React, { useState } from 'react';
import { Search, ListFilter, Sparkles } from 'lucide-react';
import { Product, CategoryType } from '../../../types';
import { ProductCard } from './ProductCard';
import { useSound } from '../../hooks/useSound';

interface StoreViewProps {
    products: Product[];
    activeCategory: string | 'All' | 'Best Seller';
    onAddToCart: (p: Product) => void;
    currency: 'PHP' | 'USD';
    exchangeRate: number;
    purchasedProductIds: string[];
    cartProductIds: string[];
}

export const StoreView: React.FC<StoreViewProps> = ({
    products,
    activeCategory,
    onAddToCart,
    currency,
    exchangeRate,
    purchasedProductIds,
    cartProductIds
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const { play } = useSound();

    const filteredProducts = products.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.description.toLowerCase().includes(searchQuery.toLowerCase());

        if (activeCategory === 'All') return matchesSearch;
        if (activeCategory === 'Best Seller') return matchesSearch && products.slice(0, 3).some(bp => bp.id === p.id); // Mock first 3 as best sellers
        return matchesSearch && p.category === activeCategory;
    });

    return (
        <div className="flex-grow p-6 md:p-12 overflow-y-auto custom-scrollbar">
            <div className="max-w-7xl mx-auto space-y-12">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                    <div className="space-y-4">
                        <h2 className="text-4xl md:text-5xl font-black text-white tracking-tighter fade-slide-up">
                            {activeCategory === 'Best Seller' ? 'Trending Assets' :
                                activeCategory === 'All' ? 'Complete Library' : activeCategory}
                        </h2>
                        <div className="flex items-center gap-3 text-slate-500 font-medium fade-slide-up delay-100">
                            <span className="w-12 h-px bg-white/10"></span>
                            <span>Propelling digital innovation through premium assets</span>
                        </div>
                    </div>

                    <div className="relative group w-full md:w-96 fade-slide-up delay-200">
                        <div className="absolute inset-y-0 left-5 flex items-center text-slate-500 group-focus-within:text-blue-500 transition-colors">
                            <Search size={18} />
                        </div>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onMouseEnter={() => play('hover')}
                            placeholder="Search library..."
                            className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-6 py-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all placeholder:text-slate-700"
                        />
                    </div>
                </div>

                {/* Stats Grid - Subtle */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 fade-slide-up delay-300">
                    {[
                        { label: 'Total Assets', val: products.length, icon: <ListFilter size={14} /> },
                        { label: 'Cloud Ready', val: '100%', icon: <Sparkles size={14} className="text-blue-400" /> },
                        { label: 'Active Users', val: '2.4k+', icon: <Search size={14} /> },
                        { label: 'Global Server', val: 'Online', icon: <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /> }
                    ].map((stat, i) => (
                        <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center gap-4">
                            <div className="text-slate-500">{stat.icon}</div>
                            <div>
                                <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{stat.label}</p>
                                <p className="text-sm font-bold text-slate-300">{stat.val}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Products Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-8 pb-12">
                    {filteredProducts.length > 0 ? (
                        filteredProducts.map((p, i) => (
                            <div key={p.id} className="fade-slide-up" style={{ animationDelay: `${i * 50}ms` }}>
                                <ProductCard
                                    product={p}
                                    onAddToCart={onAddToCart}
                                    currency={currency}
                                    exchangeRate={exchangeRate}
                                    isPurchased={purchasedProductIds.includes(p.id)}
                                    isInCart={cartProductIds.includes(p.id)}
                                />
                            </div>
                        ))
                    ) : (
                        <div className="col-span-full py-24 text-center space-y-4 bg-white/5 rounded-[3rem] border border-dashed border-white/10">
                            <div className="flex justify-center">
                                <div className="p-6 bg-white/5 rounded-full text-slate-700">
                                    <Search size={48} />
                                </div>
                            </div>
                            <p className="text-slate-500 font-bold">No products found in this category.</p>
                            <button
                                onClick={() => setSearchQuery('')}
                                className="text-blue-500 hover:text-blue-400 font-bold text-sm"
                            >
                                Clear Search Results
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
