import React, { useState } from 'react';
import { X, Trash2, Calendar, Clock, ChevronRight, CheckCircle, Package } from 'lucide-react';
import { CartItem, Product } from '../types';

interface CartSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onRemoveFromCart: (productId: string, selectedDate?: string, selectedTime?: string) => void;
  onUpdateQuantity: (productId: string, newQty: number, selectedDate?: string, selectedTime?: string) => void;
  onUpdateServiceBooking: (productId: string, date: string, time: string, index: number) => void;
  user: { id: string; email: string; name: string; role: 'user' | 'admin' } | null;
  onOpenLogin: () => void;
  onCheckoutSuccess: () => void;
}

export function CartSidebar({
  isOpen,
  onClose,
  cartItems,
  onRemoveFromCart,
  onUpdateQuantity,
  onUpdateServiceBooking,
  user,
  onOpenLogin,
  onCheckoutSuccess
}: CartSidebarProps) {
  const [shippingStreet, setShippingStreet] = useState('');
  const [shippingCity, setShippingCity] = useState('');
  const [shippingState, setShippingState] = useState('');
  const [shippingZip, setShippingZip] = useState('');
  const [shippingCountry, setShippingCountry] = useState('United States');
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  // Calculators
  const subtotal = cartItems.reduce((acc, item) => acc + (item.product.price * item.quantity), 0);
  const hasPhysicalProducts = cartItems.some(item => !item.product.isBooking);
  const shippingCost = hasPhysicalProducts ? (subtotal > 150 ? 0 : 15.00) : 0;
  const tax = subtotal * 0.0825; // 8.25% tax
  const total = subtotal + shippingCost + tax;

  const handleCheckout = async () => {
    setError('');
    
    // Check if user is logged in
    if (!user) {
      onOpenLogin();
      return;
    }

    // Validation
    if (cartItems.length === 0) {
      setError('Your cart is empty.');
      return;
    }

    // Verify all bookable services have chosen date & time
    for (let i = 0; i < cartItems.length; i++) {
      const item = cartItems[i];
      if (item.product.isBooking) {
        if (!item.selectedDate || !item.selectedTime) {
          setError(`Please select a preferred date and time slot for "${item.product.name}"`);
          return;
        }
      }
    }

    // Shipping info validation for physical products
    if (hasPhysicalProducts && (!shippingStreet || !shippingCity || !shippingState || !shippingZip)) {
      setError('Please fill in complete shipping address details for your physical products.');
      return;
    }

    setIsCheckingOut(true);

    try {
      const body = {
        items: cartItems.map(item => ({
          productId: item.product.id,
          name: item.product.name,
          quantity: item.quantity,
          selectedDate: item.selectedDate,
          selectedTime: item.selectedTime,
        })),
        totalAmount: total,
        shippingAddress: hasPhysicalProducts ? {
          street: shippingStreet,
          city: shippingCity,
          state: shippingState,
          zipCode: shippingZip,
          country: shippingCountry
        } : undefined,
        paymentMethod: 'credit_card'
      };

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(body)
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to place order');
      }

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setIsCheckingOut(false);
        onCheckoutSuccess();
        onClose();
      }, 2000);

    } catch (err: any) {
      setError(err.message || 'Error processing checkout.');
      setIsCheckingOut(false);
    }
  };

  const timeSlots = ['09:00 AM', '10:30 AM', '01:00 PM', '02:30 PM', '04:00 PM'];

  return (
    <div id="cart-drawer-overlay" className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs">
      <div 
        id="cart-drawer-container"
        className="w-full max-w-lg bg-[#09090b] border-l border-zinc-800 h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300 text-zinc-100"
      >
        {/* Header */}
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/40">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-indigo-400" />
            <h2 className="text-lg font-semibold text-zinc-100 tracking-tight">Your Cart ({cartItems.length})</h2>
          </div>
          <button 
            id="close-cart-btn"
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900 transition border border-transparent hover:border-zinc-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success Screen */}
        {success ? (
          <div className="flex-grow flex flex-col items-center justify-center p-6 text-center bg-zinc-900/20">
            <CheckCircle className="w-16 h-16 text-emerald-400 animate-bounce mb-4" />
            <h3 className="text-xl font-semibold text-zinc-100 tracking-tight">Checkout Successful!</h3>
            <p className="text-sm text-zinc-400 mt-2 max-w-sm">
              Your payment has been simulated and processed. Check your Tracker tab to monitor physical orders and active service schedules.
            </p>
          </div>
        ) : (
          <>
            {/* Body */}
            <div className="flex-grow overflow-y-auto p-5 space-y-6">
              {error && (
                <div id="cart-error" className="p-3 bg-red-950/20 border border-red-900/30 text-red-400 rounded-xl text-xs font-medium font-mono">
                  {error}
                </div>
              )}

              {cartItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-zinc-500">
                  <p className="text-sm">Your shopping cart is empty.</p>
                  <button 
                    onClick={onClose}
                    className="text-xs text-indigo-400 underline font-semibold mt-2 hover:text-indigo-300"
                  >
                    Continue shopping
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {cartItems.map((item, index) => (
                    <div 
                      key={`${item.product.id}-${index}`} 
                      className="p-4 bg-zinc-900/40 border border-zinc-800 rounded-xl flex gap-4 text-sm relative"
                    >
                      <img 
                        src={item.product.image} 
                        alt={item.product.name} 
                        className="w-16 h-16 object-cover rounded-lg bg-zinc-950 flex-shrink-0 border border-zinc-800"
                      />

                      <div className="flex-grow min-w-0">
                        <div className="flex justify-between items-start">
                          <h4 className="text-zinc-100 font-semibold tracking-tight truncate pr-6">
                            {item.product.name}
                          </h4>
                          <button
                            id={`remove-item-${item.product.id}-${index}`}
                            onClick={() => onRemoveFromCart(item.product.id, item.selectedDate, item.selectedTime)}
                            className="text-zinc-500 hover:text-red-400 transition absolute top-4 right-4"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <span className="text-xs font-mono font-bold text-indigo-400 block mt-0.5">
                          ${item.product.price.toFixed(2)}
                        </span>

                        {/* Booking appointment setup for bookable services */}
                        {item.product.isBooking ? (
                          <div className="mt-3 p-3 bg-zinc-950 border border-zinc-800 rounded-xl space-y-2">
                            <span className="text-[10px] font-bold text-indigo-400 font-mono uppercase tracking-wider block">
                              🗓️ Set Appointment Schedule
                            </span>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div>
                                <label className="block text-[10px] text-zinc-400 font-medium mb-1">Select Date</label>
                                <input
                                  type="date"
                                  min={new Date().toISOString().split('T')[0]}
                                  value={item.selectedDate || ''}
                                  onChange={e => onUpdateServiceBooking(item.product.id, e.target.value, item.selectedTime || '', index)}
                                  className="w-full px-2 py-1 bg-zinc-900 border border-zinc-800 rounded-md focus:outline-none focus:border-indigo-500 text-zinc-100"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] text-zinc-400 font-medium mb-1">Select Slot</label>
                                <select
                                  value={item.selectedTime || ''}
                                  onChange={e => onUpdateServiceBooking(item.product.id, item.selectedDate || '', e.target.value, index)}
                                  className="w-full px-2 py-1 bg-zinc-900 border border-zinc-800 rounded-md focus:outline-none focus:border-indigo-500 bg-zinc-900 text-zinc-100"
                                >
                                  <option value="">Choose slot</option>
                                  {timeSlots.map(t => (
                                    <option key={t} value={t}>{t}</option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          </div>
                        ) : (
                          /* Quantity modifier for physical products */
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-xs text-zinc-400">Qty:</span>
                            <div className="flex items-center border border-zinc-800 rounded-lg bg-zinc-950">
                              <button
                                onClick={() => onUpdateQuantity(item.product.id, item.quantity - 1, item.selectedDate, item.selectedTime)}
                                className="px-2.5 py-0.5 text-zinc-400 hover:bg-zinc-900 transition"
                              >
                                -
                              </button>
                              <span className="px-3 font-mono font-bold text-xs text-zinc-200">{item.quantity}</span>
                              <button
                                onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1, item.selectedDate, item.selectedTime)}
                                className="px-2.5 py-0.5 text-zinc-400 hover:bg-zinc-900 transition"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Shipping Address panel for Physical Products */}
              {cartItems.length > 0 && hasPhysicalProducts && (
                <div id="shipping-address-container" className="p-4 bg-zinc-900/40 rounded-xl border border-zinc-800 space-y-3">
                  <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                    <Package className="w-4 h-4 text-indigo-400" />
                    <span>Shipping Address (For Physical Items)</span>
                  </h3>
                  <div className="space-y-2 text-xs">
                    <div>
                      <label className="block text-[10px] text-zinc-400 font-medium mb-1">Street Address</label>
                      <input
                        id="shipping-street"
                        type="text"
                        required
                        placeholder="e.g. 123 Main Street"
                        value={shippingStreet}
                        onChange={e => setShippingStreet(e.target.value)}
                        className="w-full px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg focus:outline-none focus:border-indigo-500 text-zinc-100"
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="col-span-2">
                        <label className="block text-[10px] text-zinc-400 font-medium mb-1">City</label>
                        <input
                          id="shipping-city"
                          type="text"
                          required
                          placeholder="e.g. San Francisco"
                          value={shippingCity}
                          onChange={e => setShippingCity(e.target.value)}
                          className="w-full px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg focus:outline-none focus:border-indigo-500 text-zinc-100"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-zinc-400 font-medium mb-1">State</label>
                        <input
                          id="shipping-state"
                          type="text"
                          required
                          placeholder="e.g. CA"
                          value={shippingState}
                          onChange={e => setShippingState(e.target.value)}
                          className="w-full px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg focus:outline-none focus:border-indigo-500 text-zinc-100"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] text-zinc-400 font-medium mb-1">ZIP / Postal Code</label>
                        <input
                          id="shipping-zip"
                          type="text"
                          required
                          placeholder="94103"
                          value={shippingZip}
                          onChange={e => setShippingZip(e.target.value)}
                          className="w-full px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg focus:outline-none focus:border-indigo-500 text-zinc-100"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-zinc-400 font-medium mb-1">Country</label>
                        <select
                          id="shipping-country"
                          value={shippingCountry}
                          onChange={e => setShippingCountry(e.target.value)}
                          className="w-full px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg focus:outline-none focus:border-indigo-500 text-zinc-100"
                        >
                          <option value="United States">United States</option>
                          <option value="Canada">Canada</option>
                          <option value="United Kingdom">United Kingdom</option>
                          <option value="Japan">Japan</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Sticky Order Totals & Action Panel */}
            {cartItems.length > 0 && (
              <div className="p-5 border-t border-zinc-800 bg-zinc-950 space-y-4">
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between text-zinc-400">
                    <span>Subtotal</span>
                    <span className="font-mono text-zinc-200">${subtotal.toFixed(2)}</span>
                  </div>
                  {hasPhysicalProducts && (
                    <div className="flex justify-between text-zinc-400">
                      <span>Shipping</span>
                      <span className="font-mono text-zinc-200">{shippingCost === 0 ? 'FREE' : `$${shippingCost.toFixed(2)}`}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-zinc-400">
                    <span>Estimated Tax</span>
                    <span className="font-mono text-zinc-200">${tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-zinc-100 font-medium text-base pt-1.5 border-t border-zinc-800">
                    <span>Total Amount</span>
                    <span className="font-mono font-bold text-indigo-400">${total.toFixed(2)}</span>
                  </div>
                </div>

                {!user ? (
                  <button
                    id="cart-login-required-btn"
                    onClick={onOpenLogin}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-sm transition text-center"
                  >
                    Sign In to Checkout
                  </button>
                ) : (
                  <button
                    id="checkout-trigger-btn"
                    disabled={isCheckingOut}
                    onClick={handleCheckout}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-800 disabled:text-zinc-500 disabled:border-zinc-800 disabled:cursor-not-allowed text-white font-semibold rounded-xl text-sm transition flex items-center justify-center gap-1"
                  >
                    <span>{isCheckingOut ? 'Processing Checkout...' : 'Place Order & Book Slots'}</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
