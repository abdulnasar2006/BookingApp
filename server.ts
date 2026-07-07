import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { db } from './src/db/db.js';

dotenv.config();

const app = express();
const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'booking_ecommerce_secret_key_998877';

app.use(cors());
app.use(express.json());

// Extend Express Request type to include user information
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
    role: 'user' | 'admin';
  };
}

// Authentication Middlewares
const authenticateToken = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token is required' });
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

const requireAdmin = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// ==========================================
// 1. AUTHENTICATION API
// ==========================================

// Register
app.post('/api/auth/register', async (req: Request, res: Response) => {
  try {
    const { email, password, name, role } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'All fields (email, password, name) are required' });
    }

    const existingUser = await db.users.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'A user with this email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userRole = role === 'admin' ? 'admin' : 'user';

    const user = await db.users.create({
      email,
      password: hashedPassword,
      name,
      role: userRole
    });

    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Registration failed' });
  }
});

// Login
app.post('/api/auth/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await db.users.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Login failed' });
  }
});

// Current User profile
app.get('/api/auth/me', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    
    const user = await db.users.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});


// ==========================================
// 2. PRODUCT CATALOG API
// ==========================================

// Get all products
app.get('/api/products', async (req: Request, res: Response) => {
  try {
    const products = await db.products.find();
    res.json(products);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get single product
app.get('/api/products/:id', async (req: Request, res: Response) => {
  try {
    const product = await db.products.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(product);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Create product (Admin only)
app.post('/api/products', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, description, price, category, image, stock, isBooking, duration } = req.body;

    if (!name || !description || price === undefined || !category || !image) {
      return res.status(400).json({ error: 'Name, description, price, category and image are required' });
    }

    const product = await db.products.create({
      name,
      description,
      price: Number(price),
      category,
      image,
      stock: isBooking ? 999 : Number(stock || 0),
      isBooking: !!isBooking,
      duration: isBooking ? Number(duration || 60) : undefined
    });

    res.status(201).json(product);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update product (Admin only)
app.put('/api/products/:id', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, description, price, category, image, stock, isBooking, duration } = req.body;

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (price !== undefined) updateData.price = Number(price);
    if (category !== undefined) updateData.category = category;
    if (image !== undefined) updateData.image = image;
    if (stock !== undefined) updateData.stock = isBooking ? 999 : Number(stock);
    if (isBooking !== undefined) updateData.isBooking = !!isBooking;
    if (duration !== undefined) updateData.duration = isBooking ? Number(duration) : undefined;

    const product = await db.products.findByIdAndUpdate(req.params.id, updateData);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json(product);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Delete product (Admin only)
app.delete('/api/products/:id', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const product = await db.products.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json({ message: 'Product deleted successfully', product });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});


// ==========================================
// 3. BOOKING API
// ==========================================

// Create a booking
app.post('/api/bookings', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { productId, date, time, notes } = req.body;
    if (!productId || !date || !time) {
      return res.status(400).json({ error: 'productId, date, and time are required' });
    }

    const product = await db.products.findById(productId);
    if (!product) {
      return res.status(404).json({ error: 'Service/Product not found' });
    }

    if (!product.isBooking) {
      return res.status(400).json({ error: 'This product is not a bookable service' });
    }

    const booking = await db.bookings.create({
      userId: req.user!.id,
      userEmail: req.user!.email,
      userName: req.user!.name,
      productId: product.id,
      productName: product.name,
      productImage: product.image,
      date,
      time,
      duration: product.duration || 60,
      status: 'confirmed', // Auto-confirm bookings in demo
      notes
    });

    res.status(201).json(booking);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get current user's bookings
app.get('/api/bookings/my', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const bookings = await db.bookings.find({ userId: req.user!.id });
    res.json(bookings);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get all bookings (Admin only)
app.get('/api/bookings', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const bookings = await db.bookings.find({});
    res.json(bookings);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update booking status (Admin only)
app.put('/api/bookings/:id/status', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    const booking = await db.bookings.findByIdAndUpdate(req.params.id, { status });
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    res.json(booking);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});


// ==========================================
// 4. ORDER CATALOG & CHECKOUT API
// ==========================================

// Checkout / Create Order
app.post('/api/orders', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { items, shippingAddress, paymentMethod, totalAmount } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Order items are required' });
    }

    // Process order items, check stock, and compile list of structured item records
    const processedItems = [];
    
    for (const item of items) {
      const product = await db.products.findById(item.productId);
      if (!product) {
        return res.status(404).json({ error: `Product not found: ${item.name}` });
      }

      // If it is physical product, check and update stock
      if (!product.isBooking) {
        if (product.stock < item.quantity) {
          return res.status(400).json({ 
            error: `Insufficient stock for ${product.name}. Available: ${product.stock}, Requested: ${item.quantity}` 
          });
        }
        // Deduct stock
        await db.products.findByIdAndUpdate(product.id, { 
          stock: product.stock - item.quantity 
        });
      }

      processedItems.push({
        productId: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        quantity: item.quantity,
        isBooking: product.isBooking,
        selectedDate: item.selectedDate,
        selectedTime: item.selectedTime,
      });

      // Automatically create a Booking record for bookable products bought in order
      if (product.isBooking && item.selectedDate && item.selectedTime) {
        await db.bookings.create({
          userId: req.user!.id,
          userEmail: req.user!.email,
          userName: req.user!.name,
          productId: product.id,
          productName: product.name,
          productImage: product.image,
          date: item.selectedDate,
          time: item.selectedTime,
          duration: product.duration || 60,
          status: 'confirmed',
          notes: 'Booked via e-commerce check-out'
        });
      }
    }

    const order = await db.orders.create({
      userId: req.user!.id,
      userEmail: req.user!.email,
      userName: req.user!.name,
      items: processedItems,
      totalAmount,
      status: 'pending',
      shippingAddress,
      paymentMethod: paymentMethod || 'credit_card',
      paymentStatus: 'paid' // Simulated immediate payment completion
    });

    res.status(201).json(order);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get logged-in user's orders
app.get('/api/orders/my', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orders = await db.orders.find({ userId: req.user!.id });
    res.json(orders);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get all orders (Admin only)
app.get('/api/orders', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orders = await db.orders.find({});
    res.json(orders);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update order status (Admin only)
app.put('/api/orders/:id/status', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    const order = await db.orders.findByIdAndUpdate(req.params.id, { status });
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json(order);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});


// ==========================================
// 5. ADMIN DASHBOARD METRICS API
// ==========================================
app.get('/api/admin/stats', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orders = await db.orders.find({});
    const bookings = await db.bookings.find({});
    const users = await db.users.find({});

    let totalSales = 0;
    orders.forEach((o: any) => {
      if (o.status !== 'cancelled') {
        totalSales += o.totalAmount;
      }
    });

    // Group sales by day (last 7 days)
    const salesMap: { [key: string]: number } = {};
    const bookingsMap: { [key: string]: number } = {};

    // Initialize last 7 days
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      salesMap[dateStr] = 0;
      bookingsMap[dateStr] = 0;
    }

    orders.forEach((o: any) => {
      if (o.status !== 'cancelled' && o.createdAt) {
        const dateStr = new Date(o.createdAt).toISOString().split('T')[0];
        if (salesMap[dateStr] !== undefined) {
          salesMap[dateStr] += o.totalAmount;
        }
      }
    });

    bookings.forEach((b: any) => {
      if (b.createdAt) {
        const dateStr = new Date(b.createdAt).toISOString().split('T')[0];
        if (bookingsMap[dateStr] !== undefined) {
          bookingsMap[dateStr] += 1;
        }
      }
    });

    const salesByDay = Object.keys(salesMap).map(date => ({
      date: date.substring(5), // MM-DD format
      amount: Math.round(salesMap[date])
    }));

    const bookingsByDay = Object.keys(bookingsMap).map(date => ({
      date: date.substring(5), // MM-DD format
      count: bookingsMap[date]
    }));

    res.json({
      totalSales,
      totalOrders: orders.length,
      totalBookings: bookings.length,
      totalUsers: users.length,
      salesByDay,
      bookingsByDay,
      isMongo: db.isMongo
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});


// ==========================================
// VITE OR STATIC FRONTEND SERVING
// ==========================================

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Express server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
