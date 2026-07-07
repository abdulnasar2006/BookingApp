import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { ProductCard } from './components/ProductCard';
import { CartSidebar } from './components/CartSidebar';
import { AuthModal } from './components/AuthModal';
import { TrackingPanel } from './components/TrackingPanel';
import { AdminPanel } from './components/AdminPanel';
import { Product, CartItem, User } from './types';
import { Compass, CalendarDays, ClipboardList, Clock, Search, AlertCircle, ShoppingBag } from 'lucide-react';

export default function App() {
  const [currentTab, setCurrentTab] = useState<'shop' | 'tracking' | 'admin'>('shop');
  const [products, setProducts] = useState<Product[]>([]);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Quick booking popup state for services
  const [bookingProduct, setBookingProduct] = useState<Product | null>(null);
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('');
  const [bookingNotes, setBookingNotes] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingError, setBookingError] = useState('');

  const [loadingProducts, setLoadingProducts] = useState(true);

  // 1. Restore sessions & local cart states on mount
  useEffect(() => {
    // Restore Cart
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      try {
        setCartItems(JSON.parse(savedCart));
      } catch (e) {
        console.error('Failed to parse cart');
      }
    }

    // Authenticate user with token
    const token = localStorage.getItem('token');
    if (token) {
      fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then(userData => {
        setUser(userData);
      })
      .catch(() => {
        // Stale or invalid token, discard it
        localStorage.removeItem('token');
        setUser(null);
      });
    }

    // Load Catalog
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoadingProducts(true);
    try {
      const res = await fetch('/api/products');
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
      }
    } catch (err) {
      console.error('Error fetching catalog products:', err);
    } finally {
      setLoadingProducts(false);
    }
  };

  // Keep LocalStorage cart state synchronized
  const syncCart = (newCart: CartItem[]) => {
    setCartItems(newCart);
    localStorage.setItem('cart', JSON.stringify(newCart));
  };

  // 2. Cart Operations
  const handleAddToCart = (product: Product) => {
    const existingIndex = cartItems.findIndex(item => item.product.id === product.id);
    if (existingIndex !== -1) {
      const updated = [...cartItems];
      updated[existingIndex].quantity += 1;
      syncCart(updated);
    } else {
      syncCart([...cartItems, { product, quantity: 1 }]);
    }
    setIsCartOpen(true);
  };

  const handleRemoveFromCart = (productId: string, selectedDate?: string, selectedTime?: string) => {
    const filtered = cartItems.filter(item => {
      // Keep item if it belongs to a different product or different schedule details
      const isMatch = item.product.id === productId && 
                      item.selectedDate === selectedDate && 
                      item.selectedTime === selectedTime;
      return !isMatch;
    });
    syncCart(filtered);
  };

  const handleUpdateQuantity = (productId: string, newQty: number, selectedDate?: string, selectedTime?: string) => {
    if (newQty <= 0) {
      handleRemoveFromCart(productId, selectedDate, selectedTime);
      return;
    }

    const updated = cartItems.map(item => {
      const isMatch = item.product.id === productId && 
                      item.selectedDate === selectedDate && 
                      item.selectedTime === selectedTime;
      return isMatch ? { ...item, quantity: newQty } : item;
    });
    syncCart(updated);
  };

  const handleUpdateServiceBooking = (productId: string, date: string, time: string, index: number) => {
    const updated = [...cartItems];
    if (updated[index]) {
      updated[index].selectedDate = date;
      updated[index].selectedTime = time;
    }
    syncCart(updated);
  };

  // 3. User Authentication handlers
  const handleAuthSuccess = (token: string, userData: User) => {
    localStorage.setItem('token', token);
    setUser(userData);
    setIsAuthOpen(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setCurrentTab('shop');
  };

  // 4. Booking Scheduler handlers
  const startRapidBooking = (prod: Product) => {
    if (!user) {
      setIsAuthOpen(true);
      return;
    }
    setBookingProduct(prod);
    setBookingDate('');
    setBookingTime('');
    setBookingNotes('');
    setBookingSuccess(false);
    setBookingError('');
  };

  const handleRapidBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingProduct || !bookingDate || !bookingTime) {
      setBookingError('Please configure your preferred date and time slot.');
      return;
    }

    setBookingLoading(true);
    setBookingError('');

    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          productId: bookingProduct.id,
          date: bookingDate,
          time: bookingTime,
          notes: bookingNotes
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit appointment');
      }

      setBookingSuccess(true);
      setTimeout(() => {
        setBookingProduct(null);
        setBookingSuccess(false);
        // Switch tab to tracking to let them see their new appointment schedule!
        setCurrentTab('tracking');
      }, 1500);

    } catch (err: any) {
      setBookingError(err.message || 'Error processing scheduler.');
    } finally {
      setBookingLoading(false);
    }
  };

  // 5. Categorization and search filtering
  const categories = ['All', 'Wellness', 'Fitness', 'Consulting', 'Apparel', 'Electronics', 'Groceries'];

  const filteredProducts = products.filter(prod => {
    const matchesCategory = categoryFilter === 'All' || prod.category === categoryFilter;
    const matchesSearch = prod.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          prod.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div id="app-root-container" className="min-h-screen bg-neutral-50/50 flex flex-col font-sans text-neutral-800">
      {/* Navigation Header */}
      <Navbar
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        cartItems={cartItems}
        onOpenCart={() => setIsCartOpen(true)}
        user={user}
        onOpenLogin={() => setIsAuthOpen(true)}
        onLogout={handleLogout}
      />

      {/* Main Content Stage */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 py-8">
        
        {currentTab === 'shop' && (
          <div id="shop-catalog-view" className="space-y-8 animate-in fade-in duration-300">
            {/* Elegant Hero Banner */}
            <div id="hero-banner" className="relative p-8 md:p-12 bg-white border border-neutral-100 rounded-3xl overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xs">
              <div className="space-y-3 max-w-xl">
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block">
                  Fine Botanical apothecary & Wellness center
                </span>
                <h2 className="text-3xl md:text-4xl font-serif text-neutral-950 tracking-tight font-medium">
                  Aether & Soil
                </h2>
                <p className="text-sm md:text-base text-neutral-500 leading-relaxed">
                  Discover curated luxury apparel, handpicked ceremonial organic teas, high-fidelity acoustics, and schedule private premium wellness massage and fitness sessions.
                </p>
              </div>

              {/* Decorative mini highlights */}
              <div className="flex gap-4 self-start md:self-auto flex-wrap">
                <div className="flex items-center gap-2 p-3 bg-neutral-50 rounded-2xl border border-neutral-100 text-xs text-neutral-600">
                  <Clock className="w-4 h-4 text-neutral-400" />
                  <span>Instant Bookings</span>
                </div>
                <div className="flex items-center gap-2 p-3 bg-neutral-50 rounded-2xl border border-neutral-100 text-xs text-neutral-600">
                  <ShoppingBag className="w-4 h-4 text-neutral-400" />
                  <span>Curated Deliveries</span>
                </div>
              </div>
            </div>

            {/* Catalog Filter Controls */}
            <div id="catalog-controls" className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-200/60 pb-6">
              {/* Category selector pills */}
              <div className="flex flex-wrap gap-1.5 overflow-x-auto pb-1 md:pb-0">
                {categories.map(cat => (
                  <button
                    key={cat}
                    id={`filter-pill-${cat}`}
                    onClick={() => setCategoryFilter(cat)}
                    className={`px-4 py-1.5 rounded-xl text-xs font-semibold tracking-wide transition ${categoryFilter === cat ? 'bg-neutral-900 text-white shadow-xs' : 'bg-white text-neutral-500 border border-neutral-200/60 hover:border-neutral-300'}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Live search input */}
              <div className="relative w-full md:max-w-xs flex-shrink-0">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input
                  id="catalog-search"
                  type="text"
                  placeholder="Search catalog items..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-white border border-neutral-200 rounded-xl text-xs focus:outline-none focus:border-neutral-900 transition font-medium"
                />
              </div>
            </div>

            {/* Catalog Bento Grid */}
            {loadingProducts ? (
              <div className="py-24 text-center text-sm text-neutral-400">Loading fine collections...</div>
            ) : filteredProducts.length === 0 ? (
              <div className="py-24 text-center border border-dashed border-neutral-200 rounded-2xl bg-white max-w-md mx-auto p-8">
                <Compass className="w-8 h-8 text-neutral-300 mx-auto mb-3" />
                <p className="text-sm font-medium text-neutral-700">No matches found</p>
                <p className="text-xs text-neutral-400 mt-1">Try adjusting your category filter pills or search criteria.</p>
              </div>
            ) : (
              <div id="catalog-grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map(prod => (
                  <ProductCard
                    key={prod.id}
                    product={prod}
                    onAddToCart={handleAddToCart}
                    onBookService={startRapidBooking}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {currentTab === 'tracking' && (
          <div id="tracker-stage" className="animate-in fade-in duration-300">
            <TrackingPanel user={user} />
          </div>
        )}

        {currentTab === 'admin' && (
          <div id="admin-stage" className="animate-in fade-in duration-300">
            <AdminPanel user={user} />
          </div>
        )}

      </main>

      {/* Cart Drawer Sidebar Overlay */}
      <CartSidebar
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        onRemoveFromCart={handleRemoveFromCart}
        onUpdateQuantity={handleUpdateQuantity}
        onUpdateServiceBooking={handleUpdateServiceBooking}
        user={user}
        onOpenLogin={() => {
          setIsCartOpen(false);
          setIsAuthOpen(true);
        }}
        onCheckoutSuccess={() => {
          // Clear cart on successful checkout
          syncCart([]);
          setCurrentTab('tracking');
        }}
      />

      {/* User Login/Register Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={handleAuthSuccess}
      />

      {/* Quick service scheduling modal dialog */}
      {bookingProduct && (
        <div id="booking-dialog-overlay" className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white border border-neutral-200 rounded-2xl shadow-xl p-6 max-w-md w-full relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setBookingProduct(null)}
              className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-600 transition"
            >
              <XIcon className="w-5 h-5" />
            </button>

            {bookingSuccess ? (
              <div className="py-6 text-center space-y-3">
                <CalendarDays className="w-12 h-12 text-emerald-500 mx-auto animate-bounce" />
                <h3 className="text-lg font-serif font-medium text-neutral-900">Appointment Scheduled!</h3>
                <p className="text-xs text-neutral-400">Your wellness session has been successfully booked. Redirecting to your schedule manager...</p>
              </div>
            ) : (
              <form onSubmit={handleRapidBookingSubmit} className="space-y-4">
                <div>
                  <span className="text-[9px] font-bold text-indigo-700 uppercase tracking-widest block mb-1">
                    Direct Booking Scheduler
                  </span>
                  <h3 className="text-xl font-serif text-neutral-950 font-medium leading-snug">
                    Book "{bookingProduct.name}"
                  </h3>
                  <p className="text-xs text-neutral-500 mt-1">
                    {bookingProduct.description}
                  </p>
                </div>

                {bookingError && (
                  <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-xs rounded-xl flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{bookingError}</span>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-[10px] text-neutral-500 font-semibold uppercase mb-1">Choose Date</label>
                    <input
                      type="date"
                      required
                      min={new Date().toISOString().split('T')[0]}
                      value={bookingDate}
                      onChange={e => setBookingDate(e.target.value)}
                      className="w-full px-3 py-2 border border-neutral-200 rounded-xl focus:outline-none focus:border-neutral-900 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-neutral-500 font-semibold uppercase mb-1">Preferred Slot</label>
                    <select
                      required
                      value={bookingTime}
                      onChange={e => setBookingTime(e.target.value)}
                      className="w-full px-3 py-2 border border-neutral-200 rounded-xl focus:outline-none focus:border-neutral-900 bg-white"
                    >
                      <option value="">Select time slot</option>
                      <option value="09:00 AM">09:00 AM</option>
                      <option value="10:30 AM">10:30 AM</option>
                      <option value="01:00 PM">01:00 PM</option>
                      <option value="02:30 PM">02:30 PM</option>
                      <option value="04:00 PM">04:00 PM</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] text-neutral-500 font-semibold uppercase mb-1">Apothecary Instructions / Notes</label>
                  <textarea
                    rows={2}
                    placeholder="Provide any allergies, specialized preferences or goals..."
                    value={bookingNotes}
                    onChange={e => setBookingNotes(e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-200 rounded-xl text-xs focus:outline-none focus:border-neutral-900 bg-white"
                  />
                </div>

                <div className="pt-2 flex justify-between items-center text-xs">
                  <span className="font-mono text-neutral-900 font-bold text-base">
                    ${bookingProduct.price.toFixed(2)}
                  </span>
                  <button
                    type="submit"
                    disabled={bookingLoading}
                    className="py-2.5 px-6 bg-neutral-900 hover:bg-neutral-800 disabled:bg-neutral-300 text-white font-semibold rounded-xl text-xs transition"
                  >
                    {bookingLoading ? 'Scheduling...' : 'Confirm Appointment'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Simple local X icon wrapper for dialog close
function XIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}
