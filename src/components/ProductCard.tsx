import React from 'react';
import { ShoppingCart, CalendarRange, Clock, AlertTriangle } from 'lucide-react';
import { Product } from '../types';

interface ProductCardProps {
  key?: any;
  product: Product;
  onAddToCart: (product: Product) => void;
  onBookService: (product: Product) => void;
}

export function ProductCard({ product, onAddToCart, onBookService }: ProductCardProps) {
  const isOutOfStock = !product.isBooking && product.stock === 0;
  const isLowStock = !product.isBooking && product.stock > 0 && product.stock <= 5;

  return (
    <div 
      id={`product-card-${product.id}`}
      className="group bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden shadow-xs hover:border-zinc-700 hover:bg-zinc-900 transition-all duration-300 flex flex-col h-full"
    >
      {/* Product Image Panel */}
      <div className="relative aspect-video w-full bg-zinc-950 overflow-hidden border-b border-zinc-800">
        <img 
          src={product.image} 
          alt={product.name} 
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-95 group-hover:opacity-100"
        />
        {/* Category Badge */}
        <span id={`prod-cat-${product.id}`} className="absolute top-3 left-3 bg-zinc-950/90 border border-zinc-800 backdrop-blur-xs text-[10px] font-mono font-bold text-zinc-300 px-2.5 py-1 rounded-full uppercase tracking-wider shadow-xs">
          {product.category}
        </span>
        
        {/* Type indicator */}
        <span id={`prod-type-${product.id}`} className={`absolute top-3 right-3 text-[10px] font-mono font-bold px-2.5 py-1 rounded-full uppercase tracking-wider shadow-xs ${product.isBooking ? 'bg-indigo-600 text-white' : 'bg-zinc-850/90 text-zinc-300 border border-zinc-700 bg-zinc-900/90'}`}>
          {product.isBooking ? 'Service' : 'Product'}
        </span>
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col flex-grow text-zinc-100">
        <div className="flex-grow">
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <h3 id={`prod-title-${product.id}`} className="text-base font-semibold tracking-tight line-clamp-1 group-hover:text-indigo-400 transition-colors">
              {product.name}
            </h3>
            <span id={`prod-price-${product.id}`} className="text-base font-bold text-indigo-400 font-mono flex-shrink-0">
              ${product.price.toFixed(2)}
            </span>
          </div>

          <p id={`prod-desc-${product.id}`} className="text-xs text-zinc-400 line-clamp-2 mb-4 leading-relaxed">
            {product.description}
          </p>
        </div>

        {/* Footer Area with Duration / Stock */}
        <div className="mt-auto space-y-3 pt-3 border-t border-zinc-800/80">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            {product.isBooking ? (
              <div id={`prod-dur-${product.id}`} className="flex items-center gap-1 text-indigo-400 font-mono font-semibold bg-indigo-950/30 border border-indigo-900/30 px-2.5 py-1 rounded-lg">
                <Clock className="w-3.5 h-3.5 text-indigo-400" />
                <span>{product.duration} mins</span>
              </div>
            ) : (
              <div id={`prod-stock-container-${product.id}`} className="w-full font-mono text-[11px]">
                {isOutOfStock ? (
                  <span id={`prod-stock-out-${product.id}`} className="text-red-400 font-medium bg-red-950/20 border border-red-900/20 px-2 py-1 rounded-md">Out of Stock</span>
                ) : isLowStock ? (
                  <span id={`prod-stock-low-${product.id}`} className="text-orange-400 font-medium bg-orange-950/20 border border-orange-900/20 px-2 py-1 rounded-md flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-orange-400" />
                    <span>{product.stock} Low Stock</span>
                  </span>
                ) : (
                  <span id={`prod-stock-ok-${product.id}`} className="text-emerald-400 font-medium bg-emerald-950/20 border border-emerald-900/20 px-2 py-1 rounded-md">
                    {product.stock} in Stock
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Call to action button */}
          {product.isBooking ? (
            <button
              id={`prod-book-btn-${product.id}`}
              onClick={() => onBookService(product)}
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl transition flex items-center justify-center gap-2"
            >
              <CalendarRange className="w-4 h-4" />
              <span>Book Appointment</span>
            </button>
          ) : (
            <button
              id={`prod-cart-btn-${product.id}`}
              disabled={isOutOfStock}
              onClick={() => onAddToCart(product)}
              className={`w-full py-2.5 px-4 font-semibold text-xs rounded-xl transition flex items-center justify-center gap-2 ${
                isOutOfStock 
                ? 'bg-zinc-800 text-zinc-500 border border-zinc-750 cursor-not-allowed'
                : 'bg-zinc-850 hover:bg-zinc-800 border border-zinc-850 text-zinc-100 hover:border-zinc-750'
              }`}
            >
              <ShoppingCart className="w-4 h-4" />
              <span>{isOutOfStock ? 'Sold Out' : 'Add to Cart'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
