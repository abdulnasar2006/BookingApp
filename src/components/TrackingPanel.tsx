import React, { useEffect, useState } from 'react';
import { ShoppingBag, CalendarClock, Truck, CheckCircle2, Circle, Clock, MapPin } from 'lucide-react';
import { Order, Booking } from '../types';

interface TrackingPanelProps {
  user: { id: string; email: string; name: string; role: 'user' | 'admin' } | null;
}

export function TrackingPanel({ user }: TrackingPanelProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [activeTab, setActiveTab] = useState<'orders' | 'bookings'>('orders');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchHistory = async () => {
    if (!user) return;
    setLoading(true);
    setError('');

    try {
      const headers = { 'Authorization': `Bearer ${localStorage.getItem('token')}` };
      const [ordersRes, bookingsRes] = await Promise.all([
        fetch('/api/orders/my', { headers }),
        fetch('/api/bookings/my', { headers })
      ]);

      if (!ordersRes.ok || !bookingsRes.ok) {
        throw new Error('Failed to retrieve history logs');
      }

      const ordersData = await ordersRes.json();
      const bookingsData = await bookingsRes.json();

      setOrders(ordersData);
      setBookings(bookingsData);
    } catch (err: any) {
      setError(err.message || 'Error pulling client tracking data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [user]);

  if (!user) {
    return (
      <div id="tracking-unauth-container" className="py-12 text-center max-w-md mx-auto">
        <ShoppingBag className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-zinc-100">Access Restricted</h3>
        <p className="text-sm text-zinc-400 mt-1">
          Please sign in to view and track your product orders, delivery timelines, and booked appointments.
        </p>
      </div>
    );
  }

  // Order status index mapping
  const getStatusStep = (status: string) => {
    switch (status) {
      case 'pending': return 1;
      case 'processing': return 2;
      case 'shipped': return 3;
      case 'completed': return 4;
      default: return 1;
    }
  };

  const steps = [
    { label: 'Placed', status: 'pending' },
    { label: 'Processing', status: 'processing' },
    { label: 'Shipped', status: 'shipped' },
    { label: 'Completed', status: 'completed' }
  ];

  return (
    <div id="tracking-panel-container" className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-850 pb-5">
        <div>
          <h2 className="text-2xl text-zinc-100 tracking-tight font-bold">My Orders & Appointments</h2>
          <p className="text-sm text-zinc-400 mt-1">View status timelines and schedules for your recent bookings and store orders.</p>
        </div>

        {/* Tab Selector */}
        <div className="flex border border-zinc-800 rounded-xl p-1 bg-zinc-950 self-start md:self-auto">
          <button
            id="tab-history-orders"
            onClick={() => setActiveTab('orders')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition ${activeTab === 'orders' ? 'bg-zinc-900 text-indigo-400 border border-zinc-800 shadow-xs' : 'text-zinc-400 hover:text-zinc-100'}`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Store Orders ({orders.length})</span>
          </button>
          <button
            id="tab-history-bookings"
            onClick={() => setActiveTab('bookings')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition ${activeTab === 'bookings' ? 'bg-zinc-900 text-indigo-400 border border-zinc-800 shadow-xs' : 'text-zinc-400 hover:text-zinc-100'}`}
          >
            <CalendarClock className="w-3.5 h-3.5" />
            <span>Booked Services ({bookings.length})</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-950/20 border border-red-900/30 text-red-400 rounded-xl text-sm font-mono">
          {error}
        </div>
      )}

      {loading ? (
        <div className="py-12 text-center text-sm text-zinc-500 font-mono">
          Loading tracking logs...
        </div>
      ) : activeTab === 'orders' ? (
        /* Orders list */
        orders.length === 0 ? (
          <div className="py-16 text-center border border-dashed border-zinc-800 rounded-2xl bg-zinc-900/10">
            <ShoppingBag className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
            <p className="text-sm text-zinc-500">You haven't placed any physical orders yet.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map(order => {
              const currentStep = getStatusStep(order.status);
              return (
                <div 
                  key={order.id} 
                  id={`tracking-order-${order.id}`}
                  className="bg-zinc-900/30 border border-zinc-800 rounded-2xl overflow-hidden shadow-xs hover:border-zinc-700 transition"
                >
                  {/* Order header */}
                  <div className="p-4 bg-zinc-900/60 border-b border-zinc-850 flex flex-wrap items-center justify-between gap-4 text-xs">
                    <div>
                      <span className="text-zinc-500 font-bold block tracking-wider uppercase">ORDER ID</span>
                      <span className="font-mono text-zinc-300 font-bold">{order.id}</span>
                    </div>
                    <div>
                      <span className="text-zinc-500 font-bold block tracking-wider uppercase">DATE PLACED</span>
                      <span className="text-zinc-300 font-medium">{new Date(order.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div>
                      <span className="text-zinc-500 font-bold block tracking-wider uppercase">TOTAL</span>
                      <span className="text-indigo-400 font-bold text-sm font-mono">${order.totalAmount.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-zinc-500 font-bold block tracking-wider uppercase">STATUS</span>
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider ${
                        order.status === 'completed' ? 'bg-emerald-950/30 text-emerald-400 border border-emerald-900/30' :
                        order.status === 'shipped' ? 'bg-indigo-950/30 text-indigo-400 border border-indigo-900/30' :
                        order.status === 'processing' ? 'bg-orange-950/30 text-orange-400 border border-orange-900/30' :
                        order.status === 'cancelled' ? 'bg-red-950/30 text-red-400 border border-red-900/30' :
                        'bg-zinc-800 text-zinc-300 border border-zinc-700'
                      }`}>
                        {order.status}
                      </span>
                    </div>
                  </div>

                  {/* Order content */}
                  <div className="p-5 grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Items List */}
                    <div className="lg:col-span-2 space-y-3 border-r border-zinc-850/80 pr-0 lg:pr-6">
                      <h4 className="text-xs font-mono font-bold text-zinc-500 uppercase tracking-wider mb-2">Ordered Items</h4>
                      {order.items.map((item, index) => (
                        <div key={index} className="flex gap-3 items-center text-sm">
                          <img 
                            src={item.image} 
                            alt={item.name} 
                            className="w-12 h-12 object-cover rounded-lg bg-zinc-950 flex-shrink-0 border border-zinc-800"
                          />
                          <div className="flex-grow min-w-0">
                            <h5 className="text-zinc-200 font-semibold tracking-tight truncate">{item.name}</h5>
                            <span className="text-xs text-zinc-400 font-mono mt-0.5 block">
                              ${item.price.toFixed(2)} × {item.quantity}
                            </span>
                            {item.isBooking && item.selectedDate && (
                              <span className="text-[10px] font-mono text-indigo-400 bg-indigo-950/30 border border-indigo-900/30 px-2 py-0.5 rounded-md inline-block mt-1 font-semibold">
                                Scheduled: {item.selectedDate} @ {item.selectedTime}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}

                      {order.shippingAddress && (
                        <div className="mt-4 pt-4 border-t border-zinc-850/80 text-xs">
                          <h5 className="font-bold text-zinc-400 flex items-center gap-1.5 mb-1.5 font-mono">
                            <MapPin className="w-3.5 h-3.5 text-zinc-500" />
                            <span>Delivery Address</span>
                          </h5>
                          <p className="text-zinc-400">
                            {order.shippingAddress.street}, {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}, {order.shippingAddress.country}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Visually stunning progress tracker */}
                    <div className="flex flex-col justify-center">
                      <h4 className="text-xs font-mono font-bold text-zinc-500 uppercase tracking-wider mb-4">Delivery Timeline</h4>
                      
                      {order.status === 'cancelled' ? (
                        <div className="p-4 bg-red-950/20 text-red-400 rounded-xl border border-red-900/30 text-xs text-center font-semibold font-mono">
                          🚫 This order has been cancelled.
                        </div>
                      ) : (
                        <div className="relative pl-6 space-y-5 border-l border-zinc-800">
                          {steps.map((st, i) => {
                            const stepNum = i + 1;
                            const isDone = currentStep >= stepNum;
                            const isCurrent = currentStep === stepNum;
                            
                            return (
                              <div key={st.label} className="relative">
                                {/* Dot */}
                                <div className={`absolute -left-[31px] top-0.5 w-4 h-4 rounded-full flex items-center justify-center transition-all ${
                                  isDone 
                                  ? 'bg-indigo-600 text-white shadow-xs' 
                                  : 'bg-zinc-950 border-2 border-zinc-800'
                                }`}>
                                  {isDone && <CheckCircle2 className="w-3 h-3 text-white" />}
                                </div>
                                
                                {/* Label */}
                                <div className="text-xs">
                                  <span className={`font-semibold tracking-wide ${isCurrent ? 'text-indigo-400' : isDone ? 'text-zinc-300' : 'text-zinc-500'}`}>
                                    {st.label}
                                  </span>
                                  {isCurrent && (
                                    <span className="text-[10px] text-zinc-400 font-medium block mt-0.5">
                                      {st.status === 'pending' && 'Order validated by system'}
                                      {st.status === 'processing' && 'Warehouse compiling assets'}
                                      {st.status === 'shipped' && 'In transit with logistics'}
                                      {st.status === 'completed' && 'Delivered to recipient'}
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        /* Bookings list */
        bookings.length === 0 ? (
          <div className="py-16 text-center border border-dashed border-zinc-800 rounded-2xl bg-zinc-900/10">
            <CalendarClock className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
            <p className="text-sm text-zinc-500">You do not have any appointments scheduled.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {bookings.map(booking => (
              <div 
                key={booking.id} 
                id={`tracking-booking-${booking.id}`}
                className="p-5 border border-zinc-800 bg-zinc-900/30 rounded-2xl shadow-xs flex gap-4 items-start hover:border-zinc-700 transition"
              >
                <img 
                  src={booking.productImage} 
                  alt={booking.productName} 
                  className="w-16 h-16 object-cover rounded-xl bg-zinc-950 flex-shrink-0 border border-zinc-800"
                />
                
                <div className="flex-grow min-w-0 space-y-1.5 text-zinc-100">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-semibold text-zinc-250 leading-snug truncate pr-4">
                      {booking.productName}
                    </h4>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase tracking-wider ${
                      booking.status === 'confirmed' ? 'bg-emerald-950/30 text-emerald-400 border border-emerald-900/30' :
                      booking.status === 'completed' ? 'bg-indigo-950/30 text-indigo-400 border border-indigo-900/30' :
                      booking.status === 'cancelled' ? 'bg-red-950/30 text-red-400 border border-red-900/30' :
                      'bg-orange-950/30 text-orange-400 border border-orange-900/30'
                    }`}>
                      {booking.status}
                    </span>
                  </div>

                  {/* Timing details */}
                  <div className="space-y-1 text-xs text-zinc-400">
                    <div className="flex items-center gap-1.5">
                      <CalendarClock className="w-3.5 h-3.5 text-zinc-500" />
                      <span className="font-semibold text-zinc-300 font-mono">{booking.date}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-zinc-500" />
                      <span className="font-mono">{booking.time} ({booking.duration} mins)</span>
                    </div>
                  </div>

                  {booking.notes && (
                    <p className="text-[11px] text-zinc-400 bg-zinc-950 border border-zinc-850 p-2 rounded-lg italic">
                      "{booking.notes}"
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}
