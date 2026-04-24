require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

// Socket Helper
const socketHelper = require('./socket');

// Route imports
const authRoutes = require('./routes/auth');
const kycRoutes = require('./routes/kycRoutes');
const bookingRoutes = require('./routes/bookings');
const providerRoutes = require('./routes/providers');
const adminRoutes = require('./routes/admin');
const reviewRoutes = require('./routes/reviewRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const walletRoutes = require('./routes/walletRoutes');
const notificationRoutes = require('./routes/notifications');
const subscriptionRoutes = require('./routes/subscriptions');

const app = express();

// Connect to MongoDB
connectDB();

const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const rateLimit = require('express-rate-limit');

// ── Middleware ──────────────────────────────────────────────
const corsOptions = {
  origin: [process.env.CLIENT_URL || 'http://localhost:5173', 'http://localhost:5174'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

// Security middleware
app.use(helmet());
app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // Handle preflight for all routes

// Rate limiting (Global)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Limit each IP to 200 requests per window
  message: { success: false, message: 'Too many requests from this IP, please try again later.' }
});
app.use(limiter);

// Auth specific strictly limited rate-limiter
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 20, // Strict limit for auth routes to prevent brute force
  message: { success: false, message: 'Too many login attempts, please try again after 15 minutes.' }
});
app.use('/api/auth/', authLimiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(mongoSanitize()); // Prevent NoSQL injections globally

if (process.env.NODE_ENV !== 'test') app.use(morgan('dev'));

// ── Health check ───────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
  });
});

// ── Sitemap (Dynamic XML) ───────────────────────────────────
app.get('/sitemap.xml', require('./controllers/sitemapController').generateSitemap);

// ── Routes ─────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/kyc', kycRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/providers', providerRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/subscriptions', subscriptionRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// ── Central error handler ──────────────────────────────────
app.use(errorHandler);

// ── Start server ────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`🚀 RIVO API running on http://localhost:${PORT}`);
  console.log(`📋 Environment: ${process.env.NODE_ENV}`);
  // Environment initialized successfully
});

// ── Initialize Socket.io ────────────────────────────────────
socketHelper.init(server);

module.exports = app;
