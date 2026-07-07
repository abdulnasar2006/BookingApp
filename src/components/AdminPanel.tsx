import React, { useState, useEffect } from 'react';
import { 
  DollarSign, ShoppingBag, CalendarCheck, Users, Plus, Edit3, Trash2, 
  FolderPlus, Clock, Database, Check, Layers, ArrowUpRight 
} from 'lucide-react';
import { Product, Order, Booking, DashboardStats } from '../types';

interface AdminPanelProps {
  user: { id: string; email: string; name: string; role: 'user' | 'admin' } | null;
}

export function AdminPanel({ user }: AdminPanelProps) {
  const [stats, setStats] = useState<DashboardStats>({
    totalSales: 0,
    totalOrders: 0,
    totalBookings: 0,
    totalUsers: 0,
    salesByDay: [],
    bookingsByDay: []
  });
  const [isMongo, setIsMongo] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [activeSubTab, setActiveSubTab] = useState<'metrics' | 'products' | 'orders' | 'bookings'>('metrics');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form states for Product Add/Edit
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [pName, setPName] = useState('');
  const [pDescription, setPDescription] = useState('');
  const [pPrice, setPPrice] = useState('');
  const [pCategory, setPCategory] = useState('');
  const [pImage, setPImage] = useState('');
  const [pStock, setPStock] = useState('');
  const [pIsBooking, setPIsBooking] = useState(false);
  const [pDuration, setPDuration] = useState('60');

  const fetchAdminData = async () => {
    if (!user || user.role !== 'admin') return;
    setLoading(true);
    setError('');

    const headers = { 'Authorization': `Bearer ${localStorage.getItem('token')}` };

    try {
      const [statsRes, productsRes, ordersRes, bookingsRes] = await Promise.all([
        fetch('/api/admin/stats', { headers }),
        fetch('/api/products'),
        fetch('/api/orders', { headers }),
        fetch('/api/bookings', { headers })
      ]);

      if (!statsRes.ok || !productsRes.ok || !ordersRes.ok || !bookingsRes.ok) {
        throw new Error('Failed to load server data. Make sure token is valid.');
      }

      const statsData = await statsRes.json();
      const productsData = await productsRes.json();
      const ordersData = await ordersRes.json();
      const bookingsData = await bookingsRes.json();

      setStats({
        totalSales: statsData.totalSales,
        totalOrders: statsData.totalOrders,
        totalBookings: statsData.totalBookings,
        totalUsers: statsData.totalUsers,
        salesByDay: statsData.salesByDay || [],
        bookingsByDay: statsData.bookingsByDay || []
      });
      setIsMongo(statsData.isMongo);
      setProducts(productsData);
      setOrders(ordersData);
      setBookings(bookingsData);
    } catch (err: any) {
      setError(err.message || 'Error occurred loading administration controls.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, [user]);

  if (!user || user.role !== 'admin') {
    return (
      <div className="py-12 text-center max-w-md mx-auto">
        <h3 className="text-lg font-serif font-medium text-red-600">Access Denied</h3>
        <p className="text-sm text-neutral-500 mt-1">Administrator privileges are required to view this panel.</p>
      </div>
    );
  }

  // Handle Product Create/Update
  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!pName || !pDescription || !pPrice || !pCategory || !pImage) {
      setError('Please fill in all core product information fields.');
      return;
    }

    const payload = {
      name: pName,
      description: pDescription,
      price: Number(pPrice),
      category: pCategory,
      image: pImage,
      stock: pIsBooking ? 999 : Number(pStock || 0),
      isBooking: pIsBooking,
      duration: pIsBooking ? Number(pDuration) : undefined
    };

    const method = editingProduct ? 'PUT' : 'POST';
    const url = editingProduct ? `/api/products/${editingProduct.id}` : '/api/products';

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to save product');
      }

      setSuccess(`Product "${pName}" successfully ${editingProduct ? 'updated' : 'created'}!`);
      resetProductForm();
      fetchAdminData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const startEditProduct = (prod: Product) => {
    setEditingProduct(prod);
    setPName(prod.name);
    setPDescription(prod.description);
    setPPrice(prod.price.toString());
    setPCategory(prod.category);
    setPImage(prod.image);
    setPIsBooking(prod.isBooking);
    setPStock(prod.stock.toString());
    setPDuration(prod.duration ? prod.duration.toString() : '60');
  };

  const resetProductForm = () => {
    setEditingProduct(null);
    setPName('');
    setPDescription('');
    setPPrice('');
    setPCategory('');
    setPImage('');
    setPIsBooking(false);
    setPStock('');
    setPDuration('60');
  };

  const handleDeleteProduct = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this product from database?')) return;
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`/api/products/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });

      if (!response.ok) {
        throw new Error('Deletion failed.');
      }

      setSuccess('Product deleted successfully.');
      fetchAdminData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Status updates
  const handleOrderStatusUpdate = async (id: string, newStatus: string) => {
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`/api/orders/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) throw new Error('Status update failed');
      setSuccess(`Order #${id.substring(0, 8)} updated to "${newStatus}"!`);
      fetchAdminData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleBookingStatusUpdate = async (id: string, newStatus: string) => {
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`/api/bookings/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) throw new Error('Status update failed');
      setSuccess(`Booking #${id.substring(0, 8)} updated to "${newStatus}"!`);
      fetchAdminData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Custom high-contrast SVG trend charts generators
  const renderLineChart = (data: { date: string; amount: number }[]) => {
    if (data.length === 0) return <div className="h-40 flex items-center justify-center text-neutral-400 text-xs">No chart data</div>;

    const maxAmt = Math.max(...data.map(d => d.amount), 1);
    const height = 140;
    const width = 500;
    const padding = 25;

    // Map coordinates
    const points = data.map((d, index) => {
      const x = padding + (index * (width - padding * 2)) / (data.length - 1);
      const y = height - padding - (d.amount / maxAmt) * (height - padding * 2);
      return { x, y, date: d.date, amt: d.amount };
    });

    const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    const areaD = `${pathD} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`;

    return (
      <svg className="w-full h-full" viewBox={`0 0 ${width} ${height}`}>
        <defs>
          <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#c7d2fe" stopOpacity="0.4"/>
            <stop offset="100%" stopColor="#e0e7ff" stopOpacity="0"/>
          </linearGradient>
        </defs>
        {/* Grid lines */}
        <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#f3f4f6" strokeWidth={1.5} />
        <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="#f9fafb" strokeWidth={1} />
        
        {/* Area */}
        <path d={areaD} fill="url(#chartGrad)" />
        {/* Line */}
        <path d={pathD} fill="none" stroke="#4f46e5" strokeWidth={2.5} strokeLinecap="round" />
        
        {/* Interactive Dots & Labeling */}
        {points.map((p, i) => (
          <g key={i} className="group/dot">
            <circle cx={p.x} cy={p.y} r={4} fill="#4f46e5" stroke="white" strokeWidth={1.5} />
            <text x={p.x} y={p.y - 10} textAnchor="middle" className="text-[9px] font-mono font-bold fill-neutral-700 opacity-0 group-hover/dot:opacity-100 transition duration-150">
              ${p.amt}
            </text>
            <text x={p.x} y={height - 8} textAnchor="middle" className="text-[9px] font-medium fill-neutral-400">
              {p.date}
            </text>
          </g>
        ))}
      </svg>
    );
  };

  const renderBarChart = (data: { date: string; count: number }[]) => {
    if (data.length === 0) return <div className="h-40 flex items-center justify-center text-neutral-400 text-xs">No chart data</div>;

    const maxCount = Math.max(...data.map(d => d.count), 1);
    const height = 140;
    const width = 500;
    const padding = 25;

    const barWidth = 22;
    const plotWidth = width - padding * 2;
    const step = plotWidth / (data.length - 1 || 1);

    return (
      <svg className="w-full h-full" viewBox={`0 0 ${width} ${height}`}>
        {/* Base line */}
        <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#f3f4f6" strokeWidth={1.5} />

        {data.map((d, index) => {
          const x = padding + index * step - barWidth / 2;
          const barHeight = (d.count / maxCount) * (height - padding * 2);
          const y = height - padding - barHeight;

          return (
            <g key={index} className="group/bar">
              <rect 
                x={x} 
                y={y} 
                width={barWidth} 
                height={Math.max(barHeight, 2)} 
                rx={3}
                fill="#18181b" 
                className="hover:fill-indigo-650 transition duration-150"
              />
              <text x={x + barWidth / 2} y={y - 8} textAnchor="middle" className="text-[9px] font-mono font-bold fill-neutral-800 opacity-0 group-hover/bar:opacity-100 transition duration-150">
                {d.count}
              </text>
              <text x={x + barWidth / 2} y={height - 8} textAnchor="middle" className="text-[9px] font-medium fill-neutral-400">
                {d.date}
              </text>
            </g>
          );
        })}
      </svg>
    );
  };

  return (
    <div id="admin-panel" className="space-y-6">
      {/* Admin header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-850 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl text-zinc-100 tracking-tight font-bold">Administration Control Room</h2>
            <span className="bg-red-950/30 text-red-400 text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border border-red-900/30">
              Staff Portal
            </span>
          </div>
          <p className="text-sm text-zinc-400 mt-1">Check metrics, perform inventory CRUD, monitor appointments, and ship orders.</p>
        </div>

        {/* Database Status Alert */}
        <div className="flex items-center gap-2.5 p-2 px-3.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-350">
          <Database className={`w-4 h-4 ${isMongo ? 'text-emerald-400' : 'text-amber-400 animate-pulse'}`} />
          <div>
            <span className="font-semibold text-zinc-100">Connection: </span>
            <span className="font-mono text-[11px] text-zinc-400">{isMongo ? 'Live MongoDB (Atlas/Local)' : 'JSON Mock DB Fallback (.data/db.json)'}</span>
          </div>
        </div>
      </div>

      {error && <div className="p-3.5 bg-red-950/20 border border-red-900/30 text-red-400 text-xs rounded-xl font-medium font-mono">{error}</div>}
      {success && <div className="p-3.5 bg-emerald-950/20 border border-emerald-900/30 text-emerald-400 text-xs rounded-xl font-medium flex items-center gap-1.5"><Check className="w-4 h-4" /> <span>{success}</span></div>}

      {/* Admin Tabs */}
      <div className="flex border-b border-zinc-850 gap-6 text-sm">
        <button
          onClick={() => setActiveSubTab('metrics')}
          className={`pb-3 font-semibold transition relative ${activeSubTab === 'metrics' ? 'text-indigo-400 font-bold' : 'text-zinc-400 hover:text-zinc-200'}`}
        >
          Metrics & Charts
          {activeSubTab === 'metrics' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500" />}
        </button>
        <button
          onClick={() => setActiveSubTab('products')}
          className={`pb-3 font-semibold transition relative ${activeSubTab === 'products' ? 'text-indigo-400 font-bold' : 'text-zinc-400 hover:text-zinc-200'}`}
        >
          Product Catalog ({products.length})
          {activeSubTab === 'products' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500" />}
        </button>
        <button
          onClick={() => setActiveSubTab('orders')}
          className={`pb-3 font-semibold transition relative ${activeSubTab === 'orders' ? 'text-indigo-400 font-bold' : 'text-zinc-400 hover:text-zinc-200'}`}
        >
          Orders Tracking ({orders.length})
          {activeSubTab === 'orders' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500" />}
        </button>
        <button
          onClick={() => setActiveSubTab('bookings')}
          className={`pb-3 font-semibold transition relative ${activeSubTab === 'bookings' ? 'text-indigo-400 font-bold' : 'text-zinc-400 hover:text-zinc-200'}`}
        >
          Bookings Scheduler ({bookings.length})
          {activeSubTab === 'bookings' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500" />}
        </button>
      </div>

      {loading ? (
        <div className="py-12 text-center text-sm text-zinc-500 font-mono">Loading admin operations...</div>
      ) : activeSubTab === 'metrics' ? (
        /* METRICS & CHARTS SUB-TAB */
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-zinc-900/30 border border-zinc-800 rounded-2xl shadow-xs">
              <div className="flex items-center justify-between text-zinc-500 mb-2 font-mono">
                <span className="text-xs font-semibold uppercase tracking-wider">Gross Income</span>
                <DollarSign className="w-4 h-4 text-indigo-400" />
              </div>
              <h4 className="text-2xl font-bold font-mono text-zinc-100">${stats.totalSales.toFixed(2)}</h4>
              <p className="text-[10px] text-emerald-400 font-medium flex items-center gap-0.5 mt-1 font-mono">
                <ArrowUpRight className="w-3 h-3" />
                <span>+8.4% since last week</span>
              </p>
            </div>

            <div className="p-4 bg-zinc-900/30 border border-zinc-800 rounded-2xl shadow-xs">
              <div className="flex items-center justify-between text-zinc-500 mb-2 font-mono">
                <span className="text-xs font-semibold uppercase tracking-wider">Total Orders</span>
                <ShoppingBag className="w-4 h-4 text-indigo-400" />
              </div>
              <h4 className="text-2xl font-bold font-mono text-zinc-100">{stats.totalOrders}</h4>
              <p className="text-[10px] text-zinc-400 mt-1">Processed transactions</p>
            </div>

            <div className="p-4 bg-zinc-900/30 border border-zinc-800 rounded-2xl shadow-xs">
              <div className="flex items-center justify-between text-zinc-500 mb-2 font-mono">
                <span className="text-xs font-semibold uppercase tracking-wider">Bookings Scheduled</span>
                <CalendarCheck className="w-4 h-4 text-indigo-400" />
              </div>
              <h4 className="text-2xl font-bold font-mono text-zinc-100">{stats.totalBookings}</h4>
              <p className="text-[10px] text-zinc-400 mt-1">Wellness & Consulting sessions</p>
            </div>

            <div className="p-4 bg-zinc-900/30 border border-zinc-800 rounded-2xl shadow-xs">
              <div className="flex items-center justify-between text-zinc-500 mb-2 font-mono">
                <span className="text-xs font-semibold uppercase tracking-wider">Registered Clients</span>
                <Users className="w-4 h-4 text-indigo-400" />
              </div>
              <h4 className="text-2xl font-bold font-mono text-zinc-100">{stats.totalUsers}</h4>
              <p className="text-[10px] text-zinc-400 mt-1">Active client base</p>
            </div>
          </div>

          {/* SVG Charts section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-5 bg-zinc-900/30 border border-zinc-800 rounded-2xl">
              <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-4 font-mono">Store Sales Trend ($)</h3>
              <div className="h-44 w-full flex items-center justify-center">
                {renderLineChart(stats.salesByDay)}
              </div>
            </div>

            <div className="p-5 bg-zinc-900/30 border border-zinc-800 rounded-2xl">
              <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-4 font-mono">Wellness Appointment Booking Distribution</h3>
              <div className="h-44 w-full flex items-center justify-center">
                {renderBarChart(stats.bookingsByDay)}
              </div>
            </div>
          </div>
        </div>
      ) : activeSubTab === 'products' ? (
        /* PRODUCTS MANAGER SUB-TAB */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Add/Edit Form */}
          <div className="p-5 bg-zinc-900/40 border border-zinc-800 rounded-2xl h-fit space-y-4">
            <div className="flex items-center gap-1.5 border-b border-zinc-800 pb-3">
              <FolderPlus className="w-5 h-5 text-indigo-400" />
              <h3 className="text-sm font-bold text-zinc-100 uppercase tracking-wider font-mono">
                {editingProduct ? 'Edit Catalog Item' : 'Add New Product/Service'}
              </h3>
            </div>

            <form onSubmit={handleProductSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-[10px] font-semibold text-zinc-400 uppercase mb-1 font-mono">Item Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Lavender Spa Massage"
                  value={pName}
                  onChange={e => setPName(e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-800 rounded-xl focus:outline-none focus:border-indigo-500 bg-zinc-900 text-zinc-200 placeholder-zinc-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-zinc-400 uppercase mb-1 font-mono">Description</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Brief pitch of product or booking rules..."
                  value={pDescription}
                  onChange={e => setPDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-800 rounded-xl focus:outline-none focus:border-indigo-500 bg-zinc-900 text-zinc-200 placeholder-zinc-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-semibold text-zinc-400 uppercase mb-1 font-mono">Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="85.00"
                    value={pPrice}
                    onChange={e => setPPrice(e.target.value)}
                    className="w-full px-3 py-2 border border-zinc-800 rounded-xl focus:outline-none focus:border-indigo-500 bg-zinc-900 text-zinc-200 placeholder-zinc-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-zinc-400 uppercase mb-1 font-mono">Category</label>
                  <input
                    type="text"
                    required
                    placeholder="Wellness, Apparel, etc."
                    value={pCategory}
                    onChange={e => setPCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-zinc-800 rounded-xl focus:outline-none focus:border-indigo-500 bg-zinc-900 text-zinc-200 placeholder-zinc-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-zinc-400 uppercase mb-1 font-mono">Image URL</label>
                <input
                  type="url"
                  required
                  placeholder="https://images.unsplash.com/photo-..."
                  value={pImage}
                  onChange={e => setPImage(e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-800 rounded-xl focus:outline-none focus:border-indigo-500 bg-zinc-900 text-zinc-200 placeholder-zinc-500 font-mono"
                />
              </div>

              {/* Booking checkbox */}
              <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center justify-between">
                <div>
                  <label className="font-bold text-zinc-200">Bookable Service?</label>
                  <span className="block text-[10px] text-zinc-400">Enable appointment calendars for this item</span>
                </div>
                <input
                  type="checkbox"
                  checked={pIsBooking}
                  onChange={e => setPIsBooking(e.target.checked)}
                  className="w-4.5 h-4.5 accent-indigo-500"
                />
              </div>

              {pIsBooking ? (
                <div>
                  <label className="block text-[10px] font-semibold text-zinc-400 uppercase mb-1 font-mono">Session Duration (minutes)</label>
                  <select
                    value={pDuration}
                    onChange={e => setPDuration(e.target.value)}
                    className="w-full px-3 py-2 border border-zinc-800 rounded-xl focus:outline-none focus:border-indigo-500 bg-zinc-900 text-zinc-200"
                  >
                    <option value="30" className="bg-zinc-900">30 minutes</option>
                    <option value="45" className="bg-zinc-900">45 minutes</option>
                    <option value="60" className="bg-zinc-900">60 minutes</option>
                    <option value="90" className="bg-zinc-900">90 minutes</option>
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-[10px] font-semibold text-zinc-400 uppercase mb-1 font-mono">Inventory Quantity in Stock</label>
                  <input
                    type="number"
                    placeholder="15"
                    value={pStock}
                    onChange={e => setPStock(e.target.value)}
                    className="w-full px-3 py-2 border border-zinc-800 rounded-xl focus:outline-none focus:border-indigo-500 bg-zinc-900 text-zinc-200 font-mono"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  type="submit"
                  className="py-2 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-xs transition"
                >
                  {editingProduct ? 'Save Changes' : 'Publish Item'}
                </button>
                <button
                  type="button"
                  onClick={resetProductForm}
                  className="py-2 px-4 bg-zinc-900 hover:bg-zinc-850 text-zinc-350 border border-zinc-800 rounded-xl text-xs transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>

          {/* Table of active products */}
          <div className="lg:col-span-2 space-y-3">
            <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider font-mono">Database Catalog Items</h3>
            <div className="border border-zinc-800 rounded-2xl overflow-hidden bg-zinc-900/30 shadow-xs">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-zinc-950/40 border-b border-zinc-800 text-zinc-400 font-bold font-mono">
                    <th className="p-3">Item Details</th>
                    <th className="p-3">Type</th>
                    <th className="p-3">Price</th>
                    <th className="p-3">Stock/Dur</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {products.map(prod => (
                    <tr key={prod.id} className="hover:bg-zinc-850/30 transition-colors">
                      <td className="p-3 flex items-center gap-2.5">
                        <img src={prod.image} referrerPolicy="no-referrer" className="w-8 h-8 rounded-lg object-cover" />
                        <div>
                          <span className="font-semibold text-zinc-100 block">{prod.name}</span>
                          <span className="text-zinc-400 block text-[10px] font-mono">{prod.category}</span>
                        </div>
                      </td>
                      <td className="p-3">
                        <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold font-mono uppercase tracking-wider ${prod.isBooking ? 'bg-indigo-950/40 text-indigo-400 border border-indigo-900/40' : 'bg-zinc-800/40 text-zinc-400 border border-zinc-750'}`}>
                          {prod.isBooking ? 'Service' : 'Product'}
                        </span>
                      </td>
                      <td className="p-3 font-mono font-bold text-zinc-200">${prod.price.toFixed(2)}</td>
                      <td className="p-3">
                        {prod.isBooking ? (
                          <span className="flex items-center gap-1 text-zinc-400 font-mono"><Clock className="w-3.5 h-3.5 text-zinc-500" /> {prod.duration} min</span>
                        ) : (
                          <span className={prod.stock <= 5 ? 'text-amber-400 font-bold font-mono' : 'text-zinc-400 font-mono'}>{prod.stock} left</span>
                        )}
                      </td>
                      <td className="p-3 text-right space-x-2">
                        <button 
                          onClick={() => startEditProduct(prod)}
                          className="p-1.5 text-zinc-400 hover:text-indigo-400 hover:bg-zinc-800 rounded-lg transition"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteProduct(prod.id)}
                          className="p-1.5 text-zinc-400 hover:text-red-400 hover:bg-red-950/30 rounded-lg transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : activeSubTab === 'orders' ? (
        /* ORDERS LISTING SUB-TAB */
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider font-mono">E-Commerce Customer Orders</h3>
          <div className="border border-zinc-800 rounded-2xl overflow-hidden bg-zinc-900/30 shadow-xs">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-zinc-950/40 border-b border-zinc-800 text-zinc-400 font-mono font-bold">
                  <th className="p-3">Order Details</th>
                  <th className="p-3">Customer</th>
                  <th className="p-3">Price Total</th>
                  <th className="p-3">Status Control</th>
                  <th className="p-3">Date Ordered</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {orders.map(ord => (
                  <tr key={ord.id} className="hover:bg-zinc-850/30 transition-colors">
                    <td className="p-3">
                      <span className="font-mono text-indigo-400 font-bold block">#{ord.id.substring(0, 8).toUpperCase()}</span>
                      <span className="text-zinc-400 block text-[10px] font-mono">{ord.items.length} items</span>
                    </td>
                    <td className="p-3">
                      <span className="font-semibold text-zinc-150 block">{ord.userName}</span>
                      <span className="text-zinc-450 block text-[10px] font-mono">{ord.userEmail}</span>
                    </td>
                    <td className="p-3 font-mono font-bold text-zinc-200">${ord.totalAmount.toFixed(2)}</td>
                    <td className="p-3">
                      <select
                        value={ord.status}
                        onChange={e => handleOrderStatusUpdate(ord.id, e.target.value)}
                        className="px-2.5 py-1 border border-zinc-800 rounded-xl bg-zinc-950 text-zinc-200 focus:outline-none focus:border-indigo-500 text-[11px] font-semibold"
                      >
                        <option value="pending" className="bg-zinc-900 text-zinc-250">Pending</option>
                        <option value="processing" className="bg-zinc-900 text-zinc-250">Processing</option>
                        <option value="shipped" className="bg-zinc-900 text-zinc-250">Shipped</option>
                        <option value="completed" className="bg-zinc-900 text-zinc-250">Completed</option>
                        <option value="cancelled" className="bg-zinc-900 text-zinc-250">Cancelled</option>
                      </select>
                    </td>
                    <td className="p-3 text-zinc-400 font-mono">{new Date(ord.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
                {orders.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-zinc-500 font-mono">No client orders placed yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* BOOKINGS LISTING SUB-TAB */
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider font-mono">Scheduled Client Sessions</h3>
          <div className="border border-zinc-800 rounded-2xl overflow-hidden bg-zinc-900/30 shadow-xs">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-zinc-950/40 border-b border-zinc-800 text-zinc-400 font-mono font-bold">
                  <th className="p-3">Scheduled Service</th>
                  <th className="p-3">Client</th>
                  <th className="p-3">Timing & Slot</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Date Placed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {bookings.map(book => (
                  <tr key={book.id} className="hover:bg-zinc-850/30 transition-colors">
                    <td className="p-3 flex items-center gap-2.5">
                      <img src={book.productImage} referrerPolicy="no-referrer" className="w-8 h-8 rounded-lg object-cover" />
                      <div>
                        <span className="font-semibold text-zinc-150 block">{book.productName}</span>
                        <span className="text-zinc-400 block text-[10px] font-mono">{book.duration} minutes</span>
                      </div>
                    </td>
                    <td className="p-3">
                      <span className="font-semibold text-zinc-150 block">{book.userName}</span>
                      <span className="text-zinc-450 block text-[10px] font-mono">{book.userEmail}</span>
                    </td>
                    <td className="p-3 text-zinc-300">
                      <span className="font-bold block font-mono text-zinc-100">{book.date}</span>
                      <span className="text-zinc-450 font-mono text-[10px]">{book.time}</span>
                    </td>
                    <td className="p-3">
                      <select
                        value={book.status}
                        onChange={e => handleBookingStatusUpdate(book.id, e.target.value)}
                        className="px-2.5 py-1 border border-zinc-800 rounded-xl bg-zinc-950 text-zinc-200 focus:outline-none focus:border-indigo-500 text-[11px] font-semibold"
                      >
                        <option value="pending" className="bg-zinc-900 text-zinc-250">Pending</option>
                        <option value="confirmed" className="bg-zinc-900 text-zinc-250">Confirmed</option>
                        <option value="completed" className="bg-zinc-900 text-zinc-250">Completed</option>
                        <option value="cancelled" className="bg-zinc-900 text-zinc-250">Cancelled</option>
                      </select>
                    </td>
                    <td className="p-3 text-zinc-400 font-mono">{new Date(book.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
                {bookings.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-zinc-500 font-mono">No scheduled appointments yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
