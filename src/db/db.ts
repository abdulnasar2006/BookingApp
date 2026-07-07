import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import { MongoUser, MongoProduct, MongoOrder, MongoBooking } from './models.js';

// Setup file paths for JSON fallback
const DATA_DIR = path.join(process.cwd(), '.data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

// Interface for local database storage
interface LocalDB {
  users: any[];
  products: any[];
  orders: any[];
  bookings: any[];
}

// Initial Seed Products
const SEED_PRODUCTS = [
  {
    name: 'Therapeutic Spa Massage',
    description: 'A relaxing 60-minute full body aromatherapy massage designed to release tension and restore balance.',
    price: 85.00,
    category: 'Wellness',
    image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=600&auto=format&fit=crop&q=80',
    stock: 999,
    isBooking: true,
    duration: 60,
  },
  {
    name: '1-on-1 Fitness Coaching',
    description: 'A personalized 60-minute personal training session with a certified expert coach to achieve your fitness goals.',
    price: 65.00,
    category: 'Fitness',
    image: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=600&auto=format&fit=crop&q=80',
    stock: 999,
    isBooking: true,
    duration: 60,
  },
  {
    name: 'Business Growth Consultation',
    description: 'A 45-minute comprehensive business review and strategy session with a senior management consultant.',
    price: 150.00,
    category: 'Consulting',
    image: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=600&auto=format&fit=crop&q=80',
    stock: 999,
    isBooking: true,
    duration: 45,
  },
  {
    name: 'Premium Leather Jacket',
    description: 'An exquisite hand-crafted black leather jacket made from 100% full-grain sheepskin leather.',
    price: 249.00,
    category: 'Apparel',
    image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600&auto=format&fit=crop&q=80',
    stock: 12,
    isBooking: false,
  },
  {
    name: 'Wireless ANC Headphones',
    description: 'High-fidelity audio with smart active noise cancellation and up to 40 hours of battery life.',
    price: 189.00,
    category: 'Electronics',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80',
    stock: 25,
    isBooking: false,
  },
  {
    name: 'Ceremonial Japanese Matcha',
    description: 'Organic stone-ground green tea powder sourced directly from Kyoto, Japan. Vibrant color and rich taste.',
    price: 34.00,
    category: 'Groceries',
    image: 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=600&auto=format&fit=crop&q=80',
    stock: 48,
    isBooking: false,
  }
];

class DatabaseManager {
  private isConnectedToMongo = false;
  private localDB: LocalDB = { users: [], products: [], orders: [], bookings: [] };

  constructor() {
    this.init();
  }

  private async init() {
    const mongoUri = process.env.MONGODB_URI;

    if (mongoUri) {
      try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(mongoUri);
        this.isConnectedToMongo = true;
        console.log('Successfully connected to MongoDB via Mongoose!');
        
        // Seed database if products are empty
        const count = await (MongoProduct as any).countDocuments();
        if (count === 0) {
          console.log('Seeding MongoDB with initial products...');
          await (MongoProduct as any).insertMany(SEED_PRODUCTS);
        }
      } catch (err) {
        console.error('Failed to connect to MongoDB, falling back to JSON storage:', err);
        this.isConnectedToMongo = false;
        this.initLocalDB();
      }
    } else {
      console.log('No MONGODB_URI environment variable found. Initializing JSON-file database fallback...');
      this.isConnectedToMongo = false;
      this.initLocalDB();
    }
  }

  private initLocalDB() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (fs.existsSync(DB_FILE)) {
      try {
        const fileContent = fs.readFileSync(DB_FILE, 'utf-8');
        this.localDB = JSON.parse(fileContent);
      } catch (err) {
        console.error('Error reading local JSON database, resetting database:', err);
        this.resetLocalDB();
      }
    } else {
      this.resetLocalDB();
    }
  }

  private resetLocalDB() {
    // Generate UUID-like strings for seeded products
    const products = SEED_PRODUCTS.map((prod, index) => ({
      _id: `prod_${Date.now()}_${index}`,
      ...prod,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));

    this.localDB = {
      users: [],
      products,
      orders: [],
      bookings: []
    };
    this.saveLocalDB();
  }

  private saveLocalDB() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.localDB, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to save local JSON database:', err);
    }
  }

  // Helper to standardise documents to plain JS objects with string IDs
  private standardise(doc: any) {
    if (!doc) return null;
    const obj = typeof doc.toObject === 'function' ? doc.toObject() : doc;
    const id = obj._id ? obj._id.toString() : obj.id;
    return { ...obj, id };
  }

  public get isMongo() {
    return this.isConnectedToMongo;
  }

  // Unified Access APIs
  public get users() {
    return {
      find: async (query: any = {}) => {
        if (this.isConnectedToMongo) {
          const results = await (MongoUser as any).find(query);
          return results.map(this.standardise);
        } else {
          return this.localDB.users
            .filter(u => Object.keys(query).every(k => u[k] === query[k]))
            .map(this.standardise);
        }
      },
      findOne: async (query: any) => {
        if (this.isConnectedToMongo) {
          const res = await (MongoUser as any).findOne(query);
          return this.standardise(res);
        } else {
          const res = this.localDB.users.find(u => 
            Object.keys(query).every(k => u[k] === query[k])
          );
          return this.standardise(res);
        }
      },
      findById: async (id: string) => {
        if (this.isConnectedToMongo) {
          const res = await (MongoUser as any).findById(id);
          return this.standardise(res);
        } else {
          const res = this.localDB.users.find(u => u._id === id || u.id === id);
          return this.standardise(res);
        }
      },
      create: async (data: any) => {
        if (this.isConnectedToMongo) {
          const res = await (MongoUser as any).create(data);
          return this.standardise(res);
        } else {
          const newUser = {
            _id: `user_${Date.now()}`,
            ...data,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          this.localDB.users.push(newUser);
          this.saveLocalDB();
          return this.standardise(newUser);
        }
      }
    };
  }

  public get products() {
    return {
      find: async (query: any = {}) => {
        if (this.isConnectedToMongo) {
          const results = await (MongoProduct as any).find(query);
          return results.map(this.standardise);
        } else {
          return this.localDB.products
            .filter(p => Object.keys(query).every(k => p[k] === query[k]))
            .map(this.standardise);
        }
      },
      findOne: async (query: any) => {
        if (this.isConnectedToMongo) {
          const res = await (MongoProduct as any).findOne(query);
          return this.standardise(res);
        } else {
          const res = this.localDB.products.find(p => 
            Object.keys(query).every(k => p[k] === query[k])
          );
          return this.standardise(res);
        }
      },
      findById: async (id: string) => {
        if (this.isConnectedToMongo) {
          const res = await (MongoProduct as any).findById(id);
          return this.standardise(res);
        } else {
          const res = this.localDB.products.find(p => p._id === id || p.id === id);
          return this.standardise(res);
        }
      },
      create: async (data: any) => {
        if (this.isConnectedToMongo) {
          const res = await (MongoProduct as any).create(data);
          return this.standardise(res);
        } else {
          const newProduct = {
            _id: `prod_${Date.now()}`,
            ...data,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          this.localDB.products.push(newProduct);
          this.saveLocalDB();
          return this.standardise(newProduct);
        }
      },
      findByIdAndUpdate: async (id: string, update: any) => {
        if (this.isConnectedToMongo) {
          const res = await (MongoProduct as any).findByIdAndUpdate(id, update, { new: true });
          return this.standardise(res);
        } else {
          const index = this.localDB.products.findIndex(p => p._id === id || p.id === id);
          if (index !== -1) {
            this.localDB.products[index] = {
              ...this.localDB.products[index],
              ...update,
              updatedAt: new Date().toISOString()
            };
            this.saveLocalDB();
            return this.standardise(this.localDB.products[index]);
          }
          return null;
        }
      },
      findByIdAndDelete: async (id: string) => {
        if (this.isConnectedToMongo) {
          const res = await (MongoProduct as any).findByIdAndDelete(id);
          return this.standardise(res);
        } else {
          const index = this.localDB.products.findIndex(p => p._id === id || p.id === id);
          if (index !== -1) {
            const removed = this.localDB.products.splice(index, 1)[0];
            this.saveLocalDB();
            return this.standardise(removed);
          }
          return null;
        }
      }
    };
  }

  public get orders() {
    return {
      find: async (query: any = {}) => {
        if (this.isConnectedToMongo) {
          const results = await (MongoOrder as any).find(query).sort({ createdAt: -1 });
          return results.map(this.standardise);
        } else {
          return this.localDB.orders
            .filter(o => Object.keys(query).every(k => o[k] === query[k]))
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .map(this.standardise);
        }
      },
      findById: async (id: string) => {
        if (this.isConnectedToMongo) {
          const res = await (MongoOrder as any).findById(id);
          return this.standardise(res);
        } else {
          const res = this.localDB.orders.find(o => o._id === id || o.id === id);
          return this.standardise(res);
        }
      },
      create: async (data: any) => {
        if (this.isConnectedToMongo) {
          const res = await (MongoOrder as any).create(data);
          return this.standardise(res);
        } else {
          const newOrder = {
            _id: `order_${Date.now()}`,
            ...data,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          this.localDB.orders.push(newOrder);
          this.saveLocalDB();
          return this.standardise(newOrder);
        }
      },
      findByIdAndUpdate: async (id: string, update: any) => {
        if (this.isConnectedToMongo) {
          const res = await (MongoOrder as any).findByIdAndUpdate(id, update, { new: true });
          return this.standardise(res);
        } else {
          const index = this.localDB.orders.findIndex(o => o._id === id || o.id === id);
          if (index !== -1) {
            this.localDB.orders[index] = {
              ...this.localDB.orders[index],
              ...update,
              updatedAt: new Date().toISOString()
            };
            this.saveLocalDB();
            return this.standardise(this.localDB.orders[index]);
          }
          return null;
        }
      }
    };
  }

  public get bookings() {
    return {
      find: async (query: any = {}) => {
        if (this.isConnectedToMongo) {
          const results = await (MongoBooking as any).find(query).sort({ date: 1, time: 1 });
          return results.map(this.standardise);
        } else {
          return this.localDB.bookings
            .filter(b => Object.keys(query).every(k => b[k] === query[k]))
            .sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`))
            .map(this.standardise);
        }
      },
      findById: async (id: string) => {
        if (this.isConnectedToMongo) {
          const res = await (MongoBooking as any).findById(id);
          return this.standardise(res);
        } else {
          const res = this.localDB.bookings.find(b => b._id === id || b.id === id);
          return this.standardise(res);
        }
      },
      create: async (data: any) => {
        if (this.isConnectedToMongo) {
          const res = await (MongoBooking as any).create(data);
          return this.standardise(res);
        } else {
          const newBooking = {
            _id: `booking_${Date.now()}`,
            ...data,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          this.localDB.bookings.push(newBooking);
          this.saveLocalDB();
          return this.standardise(newBooking);
        }
      },
      findByIdAndUpdate: async (id: string, update: any) => {
        if (this.isConnectedToMongo) {
          const res = await (MongoBooking as any).findByIdAndUpdate(id, update, { new: true });
          return this.standardise(res);
        } else {
          const index = this.localDB.bookings.findIndex(b => b._id === id || b.id === id);
          if (index !== -1) {
            this.localDB.bookings[index] = {
              ...this.localDB.bookings[index],
              ...update,
              updatedAt: new Date().toISOString()
            };
            this.saveLocalDB();
            return this.standardise(this.localDB.bookings[index]);
          }
          return null;
        }
      }
    };
  }
}

export const db = new DatabaseManager();
export default db;
