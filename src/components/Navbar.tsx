import React from 'react';
import { ShoppingCart, User as UserIcon, LogOut, Compass, ClipboardList, Shield, Layers } from 'lucide-react';
import { CartItem } from '../types';

interface NavbarProps {
  currentTab: 'shop' | 'tracking' | 'admin';
  onTabChange: (tab: 'shop' | 'tracking' | 'admin') => void;
  cartItems: CartItem[];
  onOpenCart: () => void;
  user: { id: string; email: string; name: string; role: 'user' | 'admin' } | null;
  onOpenLogin: () => void;
  onLogout: () => void;
}

export function Navbar({
  currentTab,
  onTabChange,
  cartItems,
  onOpenCart,
  user,
  onOpenLogin,
  onLogout
}: NavbarProps) {
  const totalCartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <header className="sticky top-0 z-40 bg-[#09090b]/80 backdrop-blur-md border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
      {/* Brand Logo & Name */}
      <div 
        onClick={() => onTabChange('shop')}
        className="flex items-center gap-3 cursor-pointer group"
      >
        <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold tracking-tight text-sm group-hover:scale-105 transition-transform">
          Æ
        </div>
        <div>
          <h1 className="text-base font-semibold text-zinc-100 tracking-tight leading-none italic">Aether & Soil <span className="text-zinc-500 font-normal text-xs font-mono">v2.4.0</span></h1>
          <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest block mt-0.5">Wellness & Apothecary</span>
        </div>
      </div>

      {/* Primary Navigation links */}
      <nav className="hidden md:flex items-center gap-2 text-sm font-medium">
        <button
          id="nav-tab-shop"
          onClick={() => onTabChange('shop')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl border transition ${currentTab === 'shop' ? 'bg-zinc-900 border-zinc-800 text-zinc-100 font-semibold' : 'bg-transparent border-transparent text-zinc-400 hover:text-zinc-100'}`}
        >
          <Compass className="w-4 h-4" />
          <span>Discover & Book</span>
        </button>

        {user && (
          <button
            id="nav-tab-tracking"
            onClick={() => onTabChange('tracking')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl border transition ${currentTab === 'tracking' ? 'bg-zinc-900 border-zinc-800 text-zinc-100 font-semibold' : 'bg-transparent border-transparent text-zinc-400 hover:text-zinc-100'}`}
          >
            <ClipboardList className="w-4 h-4" />
            <span>My Tracker</span>
          </button>
        )}

        {user && user.role === 'admin' && (
          <button
            id="nav-tab-admin"
            onClick={() => onTabChange('admin')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl border transition ${currentTab === 'admin' ? 'bg-indigo-600/20 border-indigo-500/30 text-indigo-400 font-bold' : 'bg-transparent border-transparent text-zinc-400 hover:text-indigo-400'}`}
          >
            <Shield className="w-4 h-4" />
            <span>Staff Room</span>
          </button>
        )}
      </nav>

      {/* Utility Actions (Cart, Login/User Profile) */}
      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-2 bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-full">
          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">System Operational</span>
        </div>

        {/* Cart Trigger */}
        <button
          id="nav-cart-trigger"
          onClick={onOpenCart}
          className="relative p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 hover:text-zinc-100 transition"
        >
          <ShoppingCart className="w-4 h-4" />
          {totalCartCount > 0 && (
            <span id="nav-cart-badge" className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-indigo-600 text-[10px] font-bold text-white rounded-full flex items-center justify-center border border-zinc-950">
              {totalCartCount}
            </span>
          )}
        </button>

        {/* Auth controllers */}
        {user ? (
          <div className="flex items-center gap-3 pl-2 border-l border-zinc-800">
            <div className="hidden lg:block text-right">
              <span className="block text-xs font-semibold text-zinc-200 leading-none">{user.name}</span>
              <span className="text-[9px] text-indigo-400 font-mono font-bold uppercase tracking-wider block mt-0.5">
                ROLE: {user.role === 'admin' ? 'ADMIN' : 'CLIENT'}
              </span>
            </div>
            
            <button
              id="nav-logout-btn"
              onClick={onLogout}
              className="p-2 rounded-xl bg-zinc-900/30 border border-zinc-800/50 hover:bg-red-950/20 hover:border-red-900/30 text-zinc-400 hover:text-red-400 transition flex items-center gap-1.5 text-xs font-semibold"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        ) : (
          <button
            id="nav-login-btn"
            onClick={onOpenLogin}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-xs transition"
          >
            <UserIcon className="w-4 h-4" />
            <span>Sign In</span>
          </button>
        )}
      </div>
    </header>
  );
}
