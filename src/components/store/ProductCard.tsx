
import React, { useState } from 'react';
import { ShoppingCart } from 'lucide-react';
import { Product } from '../../../types';
import { useSound } from '../../hooks/useSound';

interface ProductCardProps {
    product: Product;
    onAddToCart: (p: Product) => void;
    currency: 'PHP' | 'USD';
    exchangeRate: number;
    isPurchased?: boolean;
    isInCart?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({
    product,
    onAddToCart,
    currency,
    exchangeRate,
    isPurchased = false,
    isInCart = false
}) => {
    const [isHovered, setIsHovered] = useState(false);
    const { play } = useSound();

    const isDisabled = isPurchased || isInCart || product.stock === 0;

    return (
        <div
            className={`running-border-container ${isHovered ? 'running-border-active' : ''}`}
            onMouseEnter={() => { setIsHovered(true); play('hover'); }}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div className="running-border-inner flex flex-col group">
                <div className="relative h-48 md:h-56 overflow-hidden rounded-t-[0.8rem]">
                    <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                    />
                    <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md text-[9px] font-black px-3 py-1.5 rounded-full text-blue-300 border border-white/10 uppercase tracking-[0.15em]">
                        {product.category}
                    </div>
                </div>
                <div className="p-6 flex flex-col flex-grow">
                    <h3 className="text-lg font-bold text-white mb-2 leading-tight group-hover:text-blue-400 transition-colors">{product.name}</h3>
                    <p className="text-xs text-slate-400 mb-8 line-clamp-2 leading-relaxed font-medium">{product.description}</p>
                    <div className="mt-auto flex items-center justify-between">
                        <div className="flex flex-col">
                            <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Price</span>
                            <span className="text-xl font-mono font-bold text-white">
                                {currency === 'USD' ? '$' : '₱'}
                                {(currency === 'USD' ? product.price / exchangeRate : product.price).toLocaleString(undefined, { minimumFractionDigits: currency === 'USD' ? 2 : 0, maximumFractionDigits: 2 })}
                            </span>
                            {product.stock !== undefined && product.stock < 10 && product.stock > 0 && (
                                <span className="text-[10px] text-red-400 font-bold animate-pulse mt-1">
                                    Only {product.stock} left!
                                </span>
                            )}
                            {product.stock === 0 && (
                                <span className="text-[10px] text-slate-500 font-bold mt-1">
                                    Sold Out
                                </span>
                            )}
                        </div>
                        <button
                            onClick={() => {
                                if (!isDisabled) {
                                    onAddToCart(product);
                                    play('click');
                                }
                            }}
                            disabled={isDisabled}
                            className={`p-3.5 rounded-2xl transition-all active:scale-90 text-white shadow-xl flex items-center gap-2 ${isPurchased
                                ? 'bg-green-600/20 text-green-400 border border-green-500/30'
                                : isInCart
                                    ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                                    : product.stock === 0
                                        ? 'bg-slate-700 cursor-not-allowed shadow-none opacity-50'
                                        : 'bg-blue-600 hover:bg-blue-500 shadow-blue-600/20'
                                }`}
                        >
                            {isPurchased ? (
                                <>
                                    <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                    <span className="text-[10px] font-black uppercase">Owned</span>
                                </>
                            ) : isInCart ? (
                                <>
                                    <ShoppingCart size={20} className="text-blue-400" />
                                    <span className="text-[10px] font-black uppercase">Staged</span>
                                </>
                            ) : (
                                <ShoppingCart size={20} />
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
