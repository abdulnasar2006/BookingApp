import mongoose, { Schema } from 'mongoose';

// User Schema
const UserSchema = new Schema({
  email: { type: String, required: true, unique: true, index: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' }
}, { timestamps: true });

// Product Schema
const ProductSchema = new Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  category: { type: String, required: true },
  image: { type: String, required: true },
  stock: { type: Number, required: true, default: 0 },
  isBooking: { type: Boolean, required: true, default: false },
  duration: { type: Number } // in minutes for bookings
}, { timestamps: true });

// Order Schema
const OrderItemSchema = new Schema({
  productId: { type: String, required: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  image: { type: String, required: true },
  quantity: { type: Number, required: true },
  isBooking: { type: Boolean, default: false },
  selectedDate: { type: String },
  selectedTime: { type: String }
});

const OrderSchema = new Schema({
  userId: { type: String, required: true, index: true },
  userEmail: { type: String, required: true },
  userName: { type: String, required: true },
  items: [OrderItemSchema],
  totalAmount: { type: Number, required: true },
  status: { type: String, enum: ['pending', 'processing', 'shipped', 'completed', 'cancelled'], default: 'pending' },
  shippingAddress: {
    street: { type: String },
    city: { type: String },
    state: { type: String },
    zipCode: { type: String },
    country: { type: String }
  },
  paymentMethod: { type: String, default: 'credit_card' },
  paymentStatus: { type: String, enum: ['pending', 'paid', 'failed'], default: 'pending' }
}, { timestamps: true });

// Booking Schema
const BookingSchema = new Schema({
  userId: { type: String, required: true, index: true },
  userEmail: { type: String, required: true },
  userName: { type: String, required: true },
  productId: { type: String, required: true },
  productName: { type: String, required: true },
  productImage: { type: String, required: true },
  date: { type: String, required: true }, // YYYY-MM-DD
  time: { type: String, required: true }, // HH:MM
  duration: { type: Number, required: true },
  status: { type: String, enum: ['pending', 'confirmed', 'completed', 'cancelled'], default: 'pending' },
  notes: { type: String }
}, { timestamps: true });

// Check if models exist before creating them to support hot-reloads
export const MongoUser = mongoose.models.User || mongoose.model('User', UserSchema);
export const MongoProduct = mongoose.models.Product || mongoose.model('Product', ProductSchema);
export const MongoOrder = mongoose.models.Order || mongoose.model('Order', OrderSchema);
export const MongoBooking = mongoose.models.Booking || mongoose.model('Booking', BookingSchema);
